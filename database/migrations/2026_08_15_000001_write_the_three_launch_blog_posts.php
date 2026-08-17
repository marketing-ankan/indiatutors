<?php
use App\Models\Post;
use App\Support\ConsoleOwned;
use Illuminate\Database\Migrations\Migration;

/**
 * The three articles the homepage was already advertising.
 *
 * "Latest News and Resources" rendered three cards — title, cover photo and a
 * teaser — straight out of the front-end bundle, with no article behind any of
 * them. Every card clicked through to a blog index that said "No posts yet",
 * and the Staff Console's Content tab agreed: nothing to edit, nothing to
 * delete, nothing to view. The site was showing content its owner could not
 * reach, which is the opposite of what that console exists for.
 *
 * So the three articles were actually written, on the same subjects and with
 * the same cover art, and they are inserted here as ordinary posts. From this
 * point they are indistinguishable from anything typed into the console: the
 * owner can edit them, retitle them, unpublish them, duplicate them or delete
 * them for good, and the homepage simply reflects whatever survives. The
 * hardcoded cards are gone rather than kept as a fallback — a fallback is
 * precisely what would recreate the phantom-content problem.
 *
 * A MIGRATION rather than a seeder, deliberately. A seeder re-asserts its
 * source on every deploy, so a post the owner deleted would come back and an
 * edit could be overwritten; this runs exactly once and then never has an
 * opinion again. Each post is also marked console-owned so PostSeeder's prune
 * cannot claim it.
 *
 * Retry-safe for a host that kills deploys mid-run: each post is guarded on
 * its own slug, so a second pass inserts only what is missing, and a post the
 * owner has since deleted is NOT resurrected — the guard is the migrations
 * table, and within a single run, the slug.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach ($this->posts() as $data) {
            if (Post::where('slug', $data['slug'])->exists()) continue;

            $post = Post::create($data + ['author' => 'IndiaTutors Online', 'is_published' => true]);

            // Without this, PostSeeder's prune — which deletes every post whose
            // slug is not in its own (empty) source list — removes all three on
            // the next deploy that changes the seeder.
            ConsoleOwned::mark($post);
        }
    }

    /**
     * Left in place on rollback.
     *
     * These are published articles with public URLs, not schema. Deleting them
     * because a migration was rolled back would silently destroy content the
     * owner may have since edited — and a rollback is not a request to unpublish
     * the blog.
     */
    public function down(): void
    {
        //
    }

    private function posts(): array
    {
        // Fixed timestamps, minutes apart, so the feed order is identical on
        // every environment. Stored naive, exactly as the console writes them.
        return [
            [
                'slug'         => 'best-age-to-start-coding',
                'title'        => "What's the Best Age for a Child to Start Coding? An Honest Guide for Parents",
                'excerpt'      => 'There is no single right age to start coding, and starting later is completely fine. A practical guide to what a child actually needs to be ready, what suits each stage, the signs they are being pushed too early, and how a non-coding parent can tell if classes are working.',
                'image_url'    => '/build/images/news/coding.png',
                'published_at' => '2026-08-15 09:00:00',
                'body'         => $this->codingBody(),
            ],
            [
                'slug'         => 'raising-a-bilingual-child',
                'title'        => 'How to Raise a Bilingual Child: What Actually Works',
                'excerpt'      => 'Your child understands every word of the mother tongue and still answers in English. Here is why that happens, why it is not your failure, and the small, sustainable habits that actually bring the language back into a child\'s mouth.',
                'image_url'    => '/build/images/news/bilingual.png',
                'published_at' => '2026-08-15 09:30:00',
                'body'         => $this->bilingualBody(),
            ],
            [
                'slug'         => 'teaching-a-regional-language-to-kids',
                'title'        => 'Teaching Telugu (or Any Regional Language) to Kids: A Practical Playbook',
                'excerpt'      => 'Speaking first or script first, how to build listening hours that never feel like study, honest milestones for the first few months, and the three reasons families quietly give up. A practical playbook for teaching your child an Indian regional language.',
                'image_url'    => '/build/images/news/regional-language.png',
                'published_at' => '2026-08-15 10:00:00',
                'body'         => $this->regionalLanguageBody(),
            ],
        ];
    }

    private function codingBody(): string
    {
        return <<<'TXT'
If you work in IT yourself, you have probably had this moment. A colleague mentions in passing that his eight-year-old is building games. A certificate turns up in the school parents' group. And you look at your own child, who is entirely content with cricket and comics, and something tightens in your chest: have we already left it too late?

Let us settle that part first, because everything else gets easier once it is out of the way. There is no age at which a child becomes late to coding. Plenty of people begin in Class 11, or in college, or well into a working life, and go on to build genuinely good things. Coding is not like classical dance or the violin, where young hands and young ears carry a real advantage. It is a way of thinking, and thinking can be picked up at any point. The pressure you are feeling comes from the market around you and from the parents' group, not from anything true about how children learn.

The better question is not what age, but whether this particular child is ready right now.

Readiness usually rests on three quiet things, and not one of them is a birthday.

The first is reading fluency. Even the friendliest coding tool asks a child to read instructions, labels and error messages, and a child still working hard just to decode words will spend all their energy there and have none left for the actual idea. The second is patience with trial and error. Programming is mostly being wrong, calmly, several times in a row. A child who can try something, watch it fail, shrug and try again is ready; a child who crumples at the first mistake needs a little more time, and that is a maturity thing, not an intelligence thing. The third is basic logical sequencing: can they explain, step by step and in the right order, how to make a cup of tea or reach the neighbourhood park? That ordinary skill is the whole foundation.

If those three are in place, the age hardly matters. If they are not, no early start will compensate.

Roughly speaking, different stages suit different things.

In the primary years, block-based visual coding like Scratch is the right home. The child drags coloured blocks together instead of typing syntax, so there are no spelling mistakes to derail them, and the result appears on screen immediately: a cat that dances, a small game a cousin can play. What they are absorbing is sequence, repetition, conditions, cause and effect. It looks like play because it is play, and that is exactly why it works.

Somewhere around middle school, once typing is comfortable and abstract thinking has firmed up, text-based languages like Python start to make sense. This transition often feels like a step backwards for a few weeks, because the child who was flying with blocks is suddenly stuck on a missing colon. That dip is normal. Push gently through it, and do not let anyone tell you the child has lost their touch.

By the higher classes, serious work looks less like lessons and more like projects. A student builds something with a purpose: a small web app, a program that organises their music, a bot, a beginner data or AI experiment. They hit real bugs, learn to read documentation, and finish something they can show and explain. Around board exam years, the sensible thing is usually to slow coding down rather than stop it, so it stays a pleasure and not one more subject.

Now the honest warning signs, because early is not automatically better.

Watch for a child who reproduces steps perfectly but cannot say why any of it works. Watch for the small dread before class, the stomach ache that appears only on Tuesday evenings. Watch, most of all, for silence between sessions. A child who is genuinely engaged will fiddle, change a colour, break something, ask a strange question at dinner. If a child completes everything asked and never once opens the thing on their own, they are performing, not learning. Pausing for six months costs nothing. Building a quiet dislike of the subject costs a great deal.

This is also why it matters how coding is taught. Taught as logic and creativity, it gives a child a way of breaking down problems that shows up in mathematics, in science, even in arguments at the dinner table. Taught as syllabus, it becomes another list of things to memorise before an assessment, and children can feel the difference even when they cannot name it. The child who is asked what shall we build today learns more than the child who is told today we finish chapter four.

You do not need to code yourself to judge whether it is working. Two simple checks are enough.

Ask your child to explain their project to you as though you know nothing about it, which happens to be true. If they can tell you what it does, why they made a particular choice, and what went wrong along the way, the understanding is real. If they can only show you the output, or say sir told us to do it this way, something is missing. The second check is simpler still: do they ever build anything nobody asked them to build? That is the sign no report card will give you.

And if you are still uneasy, take some of the pressure off yourself too. Your child is not behind. A child who begins at thirteen, curious and willing, will comfortably overtake one who was drilled into boredom at seven. The goal was never to produce a programmer by Class 5. It is to leave a child believing that difficult problems are interesting rather than frightening.

If you would like to see how your own child actually responds before committing to anything, a free demo class is a low-risk way to find out. Sit nearby, watch their face rather than the screen, and let that tell you what to do next.
TXT;
    }

    private function bilingualBody(): string
    {
        return <<<'TXT'
You speak to your son in Marathi. He answers in English. You ask again, a little slower, still in Marathi. He answers in English again and goes back to his book.

If that is your house, you are in a great deal of company. Bengali, Tamil, Telugu, Kannada, Marathi, Odia, Gujarati, Hindi, the pattern barely changes. The parents speak the language. The child follows every word of it. And the child replies in English.

It helps to understand why this happens before deciding what to do about it. Your child spends seven or eight hours a day in an English-medium school, where every subject, every instruction and every worksheet is in English. Their friends default to English the moment two children from different homes end up in the same group. Almost everything on a screen is in English. By the time they come home, English is simply the language their mouth is already warmed up in.

There is a second reason, and it is the harder one to hear. Children read a room with unnerving accuracy. They work out very early which language the interesting people are using, which one gets attention, which one makes them sound older, which one carries weight outside the house. That is not disrespect and it is not a rejection of you. It is instinct, and it is the same instinct that makes them switch accents when they change schools.

So please set down the guilt, because it is not doing any work for you. You did not skip a step. Entire neighbourhoods have watched a language thin out over one generation while every single parent in them was doing their level best.

Now, the distinction that matters more than anything else in this article.

There is a big difference between a child who cannot speak the language and a child who understands it perfectly but will not speak it. The second child is enormously more recoverable, and that is very often the child parents are actually describing. The words are in there. Years of overheard kitchen conversation, phone calls, scolding, gossip and television have already installed the vocabulary, the sound of the language and its rhythm. Nothing is missing except the habit of producing it.

That is good news, because the slow part of language learning is the listening, and your child has already done it without anyone noticing. What is left is confidence and use.

You can check which situation you are in without turning it into a test. Ask your child to pass a message on to their grandmother, or to tell her what happened at school. If a stumbling, half-mixed version comes out, you have a speaker who is out of practice, not a child without the language.

What follows are the approaches that survive contact with a real, busy Indian household.

One parent speaking the mother tongue consistently works better than both parents trying heroically and giving up in a month. If you are the Telugu parent, be the Telugu parent, every day, including when you are tired and it would be faster in English. Children sort people into channels. Once you are firmly the Telugu channel, they stop negotiating.

Protect slots, not hours. Dinner at the table. The bedtime story. The car ride to class. Sunday morning. Twenty consistent minutes beat an ambitious rule that collapses by Wednesday.

Grandparents are the single most powerful resource most families already have and rarely use on purpose. A grandmother who genuinely does not follow fast English forces real production, because the child actually wants something from the conversation. That is not an exercise, it is a relationship, and children work much harder for relationships than for exercises. A standing weekly video call, with something real to talk about, does more than any drill.

Then there is painless exposure, which costs nothing. Songs in the car. One film the child actually enjoys rather than one you think is good for them. Cricket commentary in the language. Festivals do this beautifully on their own, because the vocabulary of the kitchen, the rituals, the sweets and the relatives arrives without a single lesson being taught.

One habit undoes most of the above, and it is worth naming plainly.

When your child attempts a sentence and gets the gender wrong, or the verb ending, and you correct it mid-sentence, the correction is perfectly reasonable and the effect is terrible. What the child learns is that speaking this language means being marked and stopped. Their English is never corrected at home. So English quietly becomes the safe language, and your mother tongue becomes the one where they get things wrong.

Do this instead. Reply naturally, folding the correct form into your own answer, and respond to what they actually said. If they said something funny, laugh at the joke, not at the grammar. They hear the right version without ever being interrupted, and the sentence stays theirs.

Also, stop worrying about mixing. A child who puts an English word in the middle of a Kannada sentence is not losing the language, they are doing what most bilingual adults in this country do all day. Reacting to it with alarm teaches the child that speaking is a graded exam. Let the sentence land.

Be realistic about the destination as well. The two languages may never be equally strong, and that is fine. A child who can talk to their grandmother, follow the family jokes and feel that the language belongs to them has gained something real.

Reading and writing in the script is a different skill and does not arrive on its own. That, and the case of a child who has gone quiet out of embarrassment and needs a patient adult who is not a parent, are the two situations where structured lessons genuinely help. We teach Hindi, Tamil, Telugu, Kannada, Malayalam and Sanskrit, and the first demo class costs nothing, so you can see how your child responds before committing to anything.

The rest is slow. No single week will show you progress. The change shows up months later, when your child answers you in the language without noticing they did it.
TXT;
    }

    private function regionalLanguageBody(): string
    {
        return <<<'TXT'
Almost every family that decides to teach a child the mother tongue, be it Telugu, Tamil, Bengali, Kannada, Malayalam, Marathi, Gujarati, Odia or Punjabi, begins the same way. Someone buys an alphabet book, sets aside Sunday mornings, and by the fourth week the book is under a stack of school notebooks and nobody mentions it again.

The child is rarely the reason. The project was never really defined, so it could not be steered, so it quietly stopped. Here is a way to run it that survives a school year.

Begin by deciding what you actually want.

I want my daughter to learn Telugu is a wish, not a goal. Two different projects hide inside that sentence. One is that she should talk comfortably with her grandparents and follow what is being said at a family wedding. The other is that she should read and write the script.

The first depends almost entirely on hours of listening. The second is literacy, and it needs pen, paper and a different kind of patience. Most parents want both eventually; what matters is choosing the order, because that decides what you do on a Tuesday evening.

For most children, speaking should come first.

A child who already has a few hundred words in her ear is doing something easy when she meets the script: attaching a shape to a sound she already owns. A child who meets the script first is memorising shapes for sounds that mean nothing to her, which is dull work with no reward. Dullness is what kills these projects.

There is one clear exception. If the child's school teaches the language as a subject, the pace is already set and the script is arriving with marks attached. Your job at home then flips: supply the speaking the timetable has no room for, so the subject stops being pure rote.

Build listening hours without it feeling like a class.

Children pick up a language they hear constantly and need occasionally. Most Indian languages now have dubbed cartoons and rhymes easily available, and half an hour of a familiar cartoon in Telugu or Marathi instead of English starts no argument. Songs work even better with younger children: the tune carries the words along.

The kitchen and the market are the best classrooms you have. Name the vegetables, the quantities, hot and cold, more and less, in the language, every day. That is a working vocabulary lesson that never looks like one.

The strongest tool is the phone call. A regular call with a grandparent or an aunt who does not switch to English gives the child a reason to produce words, not only receive them. Ten minutes twice a week with someone who waits patiently for a sentence beats an hour of drilling.

Introduce the script slowly, in small daily doses.

When you do start letters, take a few at a time and tie them to words the child already says aloud: her own name, the names of family members, the food she likes. Recognition should come before writing: pointing at a letter in a book is a real skill and an easier early win than forming it neatly.

Keep writing practice short and daily rather than long and weekly. Ten focused minutes on most days will take a child further in three months than an ambitious hour every Saturday that gets skipped the moment there is a unit test. It also protects your patience, a limited resource.

What the first several months look like, honestly.

This varies enormously, and any timeline offered as a promise deserves suspicion. A child who already hears the language at home daily and one starting from nothing are not on the same road.

Broadly, comprehension moves first. Long before she speaks a sentence, a child will start following instructions, laughing at the right moment, answering in English a question asked in Telugu. That last one feels like failure and is actually progress: the input is landing.

Speaking follows, usually single words and stock phrases well before real sentences. Reading a familiar word in the script is often a few months of short, consistent sessions away. Writing fluently is slowest of all, and that is normal.

Design around the three things that end these projects.

The first is irregular practice. Fix it by attaching the language to something that already happens daily, not to a free slot that does not exist. Dinner, the drive to school, bath time.

The second is treating it as homework. The moment it competes with school work, school work wins, and the language becomes one more thing to nag about. Keep it in the family half of the day, not the study half.

The third is the adult running out of patience, the most common and least discussed. Teaching your own child is genuinely hard, and a bad ten minutes can put a child off a language for a year. If the lessons are becoming a place where you get irritated, change the arrangement rather than trying harder.

That is where a weekly structured class earns its place.

It is most useful for what is hardest to manage at home: the script, which needs sequence and correction; consistency, because a fixed slot with someone else in it does not get postponed; and the relationship, because it moves the correcting out of the parent-child equation and leaves you free to be the person your child happily speaks the language with.

For this week, then: write your goal down in one sentence, pick one daily anchor for listening, and set up a regular phone call with a relative who will not switch to English. Leave the script alone unless school has already started it.

If you go looking for a teacher, insist on a trial before you commit. One session tells you more about whether your child will warm to that person than any description. Our first demo class costs nothing, which makes it easy to try.
TXT;
    }
};
