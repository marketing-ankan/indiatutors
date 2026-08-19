<?php
namespace App\Support;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Gemini, in the Content tab: draft a post, and generate a cover for it.
 *
 * The house rules this site has had to learn the hard way are compiled INTO
 * the system prompt rather than left to the writer to remember. Twice now
 * invented figures have had to be scrubbed off this site, and a language model
 * asked for a blog post will cheerfully produce "studies show 73% of parents"
 * unless told not to in as many words. So the prompt forbids invented
 * statistics, named students, testimonials, awards, prices and any overseas
 * framing, and demands the plain-text paragraph format the public article
 * renderer actually understands — no markdown, because a "##" reaches the
 * reader as two literal hash marks.
 *
 * A draft is a draft. Nothing here publishes: the caller lands the result in
 * the editor as unpublished text for a human to read, correct and approve.
 *
 * Two different quotas, worth knowing before wondering why one half works:
 * text drafting runs on the free tier, image generation does not — the image
 * models answer 429 "limit: 0" until billing is enabled on the Google account.
 */
class BlogAi
{
    private const DIR = 'uploads/blog';

    /** House rules, shared by every generation path. */
    private const RULES = <<<'TXT'
You write for IndiaTutors Online, an Indian online tutoring company based in Kolkata. It teaches school academics (CBSE, ICSE, IGCSE, IB, state boards), competitive exams (JEE, NEET, CUET), coding, music, dance, art, chess and Indian languages, through live 1-on-1 and small-group classes and self-paced video courses. The first demo class is free.

HARD RULES. Breaking any of these makes the draft unusable:
1. INDIA ONLY. Indian families, Indian boards, Indian exams, Indian cities. Never mention NRI families, the US, UK, Canada, SAT, AP exams, overseas time zones or foreign currency.
2. INVENT NOTHING CHECKABLE. No statistics, percentages, study citations, research findings, named students, testimonials, success rates, rankings or awards. If you cannot say it without a number you do not have, say it without the number. Well-known uncontroversial facts (for example that CBSE board exams fall in February and March) are fine; anything that reads like a cited figure is not.
3. NO PRICES. Never state a fee, rate, discount or offer. Pricing lives on the pricing page and would go stale here.
4. HONEST AND USEFUL. Write for a real parent making a real decision. It must be worth reading by someone who never buys anything. At most ONE short, soft mention of the free demo class, near the end, and only if it fits.

FORMAT. The site renders posts as PLAIN TEXT where a blank line starts a new paragraph:
- NO markdown at all. No hash marks, asterisks, dashes as bullets, numbered lists, angle-bracket quotes, backticks or bracket-parenthesis links. They reach the reader as literal characters.
- Short paragraphs, two to five sentences, separated by one blank line.
- A short standalone sentence may act as a section lead-in. Do not write it as a heading with symbols.
- Indian English spelling and idiom.
TXT;

    public static function enabled(): bool
    {
        return (bool) config('services.ai.key');
    }

    /**
     * Draft a post from a topic.
     *
     * Returns ['title','excerpt','body'] or null on any failure — the caller
     * shows a message rather than an error, exactly like the study assistant.
     */
    public static function draft(string $topic, ?string $angle = null, int $words = 800): ?array
    {
        if (! self::enabled() || trim($topic) === '') return null;

        $words = max(300, min($words, 1200));

        $system = self::RULES . "\n\nReturn ONLY a JSON object with exactly these keys: "
            . '"title" (under 90 characters), "excerpt" (one or two sentences, under 300 characters) '
            . 'and "body" (the article itself, plain text as described above, about ' . $words . ' words).';

        $prompt = 'TOPIC: ' . self::clip($topic, 500);
        if (trim((string) $angle) !== '') {
            $prompt .= "\n\nANGLE THE OWNER WANTS: " . self::clip($angle, 500);
        }
        $prompt .= "\n\nWrite the post.";

        $raw = self::text($system, $prompt, 4000, true);
        if (! $raw) return null;

        $data = json_decode($raw, true);
        if (! is_array($data)) return null;

        $title = trim((string) ($data['title'] ?? ''));
        $body  = trim((string) ($data['body'] ?? ''));
        if ($title === '' || $body === '') return null;

        return [
            'title'   => Str::limit($title, 185, ''),
            'excerpt' => Str::limit(trim((string) ($data['excerpt'] ?? '')), 380, ''),
            // Belt and braces: strip the markdown the prompt already forbade,
            // because one leaked heading renders as literal hashes on the page
            // and the person pressing the button may not read every line.
            'body'    => self::stripMarkdown($body),
        ];
    }

    /**
     * Generate a cover image and store it.
     *
     * Returns the servable URL, or null. Images live in storage/ like the
     * WhatsApp screenshots and for the same reason: the deploy rm -rf's the
     * docroot image directories on every cron pull, so anything written under
     * public/ at runtime is destroyed within minutes.
     */
    public static function coverImage(string $subject): ?string
    {
        if (! self::enabled() || trim($subject) === '') return null;

        $prompt = 'A warm, natural editorial photograph for the cover of a blog post for Indian parents about: '
            . self::clip($subject, 400) . '. '
            . 'Indian people and an Indian home or classroom setting. Soft natural light, candid and real, '
            . 'not a stock-photo pose. Wide 16:9 composition suitable for a website banner. '
            . 'Absolutely no text, no words, no letters, no logos and no watermarks anywhere in the image.';

        try {
            $model = config('services.ai.image_model');
            $res = Http::timeout(120)
                ->withHeaders(['x-goog-api-key' => config('services.ai.key')])
                ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent", [
                    'contents' => [['role' => 'user', 'parts' => [['text' => $prompt]]]],
                ]);

            if (! $res->successful()) {
                Log::warning('BlogAi image HTTP ' . $res->status() . ': ' . Str::limit($res->body(), 400));
                return null;
            }

            foreach (data_get($res->json(), 'candidates.0.content.parts', []) as $part) {
                $b64  = data_get($part, 'inlineData.data');
                $mime = (string) data_get($part, 'inlineData.mimeType', 'image/png');
                if (! is_string($b64) || $b64 === '') continue;

                $bytes = base64_decode($b64, true);
                if ($bytes === false || strlen($bytes) < 1024) continue;

                $ext  = match ($mime) { 'image/jpeg' => 'jpg', 'image/webp' => 'webp', default => 'png' };
                $name = self::DIR . '/' . Str::random(40) . '.' . $ext;
                Storage::disk('local')->put($name, $bytes);

                return '/api/media/blog/' . basename($name);
            }

            Log::warning('BlogAi image: response carried no image part.');
            return null;
        } catch (\Throwable $e) {
            Log::warning('BlogAi image failed: ' . $e->getMessage());
            return null;
        }
    }

    /** Why the last attempt could not run, in words a person can act on. */
    public static function unavailableReason(): string
    {
        return self::enabled()
            ? 'The AI service did not answer. It may be busy or out of quota — try again in a minute.'
            : 'AI is not configured on this server yet (AI_API_KEY is unset).';
    }

    /**
     * Retry on the provider being busy.
     *
     * A shared free-tier model answers 503 "experiencing high demand" often
     * enough that a single attempt makes the button look broken — it failed on
     * the very first live test here. 429 is included because the rate limiter
     * asks for a short wait rather than refusing outright. Anything else (a bad
     * key, a bad request) is not retried: repeating it would just be slower.
     */
    private static function shouldRetry(int $status): bool
    {
        return in_array($status, [429, 500, 502, 503, 504], true);
    }

    private static function text(string $system, string $prompt, int $maxTokens, bool $json = false): ?string
    {
        try {
            $model = config("services.ai.model");
            $res   = null;

            for ($attempt = 1; $attempt <= 3; $attempt++) {
                if ($attempt > 1) usleep(1_500_000);
                $res = self::postText($model, $system, $prompt, $maxTokens, $json);
                if ($res->successful() || ! self::shouldRetry($res->status())) break;
                Log::info("BlogAi text {$res->status()} on attempt {$attempt}; retrying.");
            }

            if (! $res->successful()) {
                Log::warning("BlogAi text HTTP " . $res->status() . ": " . Str::limit($res->body(), 400));
                return null;
            }

            $body = $res->json();
            $text = data_get($body, "candidates.0.content.parts.0.text");
            if (! is_string($text) || trim($text) === "") {
                Log::warning("BlogAi text: no text, finishReason="
                    . data_get($body, "candidates.0.finishReason", "?"));
                return null;
            }

            return trim($text);
        } catch (\Throwable $e) {
            Log::warning("BlogAi text failed: " . $e->getMessage());
            return null;
        }
    }

    private static function postText(string $model, string $system, string $prompt, int $maxTokens, bool $json)
    {
        return Http::timeout(60)
            ->withHeaders(["x-goog-api-key" => config("services.ai.key")])
            ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent", [
                "systemInstruction" => ["parts" => [["text" => $system]]],
                "contents"          => [["role" => "user", "parts" => [["text" => $prompt]]]],
                "generationConfig"  => [
                    // Higher than the study assistant's 0.2: this is writing,
                    // not recall from a transcript.
                    "temperature"     => 0.8,
                    "maxOutputTokens" => $maxTokens,
                ] + ($json ? ["responseMimeType" => "application/json"] : []),
            ]);
    }
    /**
     * The article renderer shows plain text, so markdown must not survive.
     * Deliberately conservative: it removes the markers, never the words.
     */
    public static function stripMarkdown(string $text): string
    {
        $tick = chr(96);

        $text = preg_replace('/^\s{0,3}#{1,6}\s+/m', '', $text);                      // headings
        $text = preg_replace('/^\s{0,3}>\s?/m', '', $text);                           // block quotes
        $text = preg_replace('/^\s{0,3}[-*+]\s+/m', '', $text);                       // bullets
        $text = preg_replace('/\*\*(.+?)\*\*/s', '$1', $text);                        // bold
        $text = preg_replace('/(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)/s', '$1', $text);  // italics
        $text = preg_replace('/' . $tick . '{1,3}([^' . $tick . ']*)' . $tick . '{1,3}/s', '$1', $text); // code
        $text = preg_replace('/\[([^\]]+)\]\([^)]*\)/', '$1', $text);                 // links
        $text = preg_replace('/\n{3,}/', "\n\n", $text);

        return trim($text);
    }

    private static function clip(string $text, int $max): string
    {
        $text = trim($text);
        return mb_strlen($text) > $max ? mb_substr($text, 0, $max) : $text;
    }
}
