<?php
namespace Database\Seeders;
use App\Models\Post;
use Illuminate\Database\Seeder;

class PostSeeder extends Seeder {
    public function run(): void {
        $posts = [
            [
                'title'   => 'How to Choose the Right Online Tutor for Your Child',
                'slug'    => 'how-to-choose-the-right-online-tutor',
                'excerpt' => 'The right tutor can transform how your child feels about a subject. Here is a practical checklist to find one that truly fits.',
                'image_url' => 'https://indiatutorsonline.com/wp-content/uploads/2026/04/AboutUsImage1.webp',
                'published_at' => '2026-05-02 10:00:00',
                'body' => <<<'HTML'
<p>Choosing an online tutor is one of the most important decisions you will make for your child's learning. The right match builds confidence; the wrong one can make a subject feel harder than it is. Here is how experienced parents approach it.</p>
<h2>1. Start with the goal, not the subject</h2>
<p>Is your child aiming to recover lost ground, keep up with class, or get ahead for a competitive exam? A tutor who is brilliant at Olympiad prep may not be the best fit for a child who needs patient, confidence-building support. Be specific about the outcome you want before you shortlist anyone.</p>
<h2>2. Insist on verified credentials</h2>
<p>Qualifications and a clean background check are non-negotiable. On IndiaTutors Online every tutor is verified and qualification-checked before they teach a single class, so you can focus on fit rather than vetting.</p>
<h2>3. Always take a free trial</h2>
<p>A 30-minute demo tells you more than any profile. Watch how the tutor explains a concept, whether your child asks questions freely, and how the tutor responds to a wrong answer. Chemistry between tutor and student matters as much as subject expertise.</p>
<h2>4. Ask about the plan after the demo</h2>
<p>A good tutor will propose a personalised curriculum after the trial — what they will cover, in what order, and how they will track progress. If a tutor cannot describe how your child will improve over the next month, keep looking.</p>
<h2>5. Check the feedback loop</h2>
<p>Regular progress updates keep everyone aligned. Look for tutors who share what was covered after each class and flag where your child is standing. That transparency is what turns tutoring into real, measurable progress.</p>
<p>Take your time, use the free trial, and trust how your child responds. The right tutor is the one your child looks forward to learning with.</p>
HTML,
            ],
            [
                'title'   => '5 Study Techniques That Actually Help Kids Learn Faster',
                'slug'    => '5-study-techniques-that-help-kids-learn-faster',
                'excerpt' => 'Not all studying is equal. These five evidence-based techniques help children remember more in less time.',
                'image_url' => 'https://indiatutorsonline.com/wp-content/uploads/2026/04/PythonCarouselCover.webp',
                'published_at' => '2026-05-18 10:00:00',
                'body' => <<<'HTML'
<p>Re-reading notes and highlighting feel productive, but research consistently shows they are among the weakest ways to learn. Here are five techniques that genuinely help children remember more — and that good tutors build into every class.</p>
<h2>1. Active recall</h2>
<p>Instead of re-reading, close the book and try to retrieve the answer from memory. The effort of recalling strengthens the memory far more than passive review. Flashcards and short self-quizzes are simple, powerful tools.</p>
<h2>2. Spaced repetition</h2>
<p>Reviewing a topic once is not enough. Revisiting it after a day, then a few days, then a week locks it into long-term memory. Spacing practice out beats cramming every single time.</p>
<h2>3. Interleaving</h2>
<p>Mixing different types of problems in one session — rather than doing twenty of the same kind — trains the brain to choose the right approach, which is exactly what exams demand.</p>
<h2>4. Explaining it out loud</h2>
<p>If a child can teach a concept back in their own words, they understand it. Encourage your child to explain what they learned to you after each class. Gaps in understanding surface immediately.</p>
<h2>5. Short, focused sessions</h2>
<p>Attention fades after 25–30 minutes. Shorter, focused blocks with small breaks beat long, unfocused marathons. Quality of attention matters more than hours logged.</p>
<p>The best part: a good tutor weaves these techniques into live classes automatically, so your child builds better study habits without even noticing.</p>
HTML,
            ],
            [
                'title'   => 'Online vs Home Tuition: Which Is Right for Your Family?',
                'slug'    => 'online-vs-home-tuition-which-is-right',
                'excerpt' => 'Both work — the right choice depends on your child, your schedule, and the subject. Here is an honest comparison.',
                'image_url' => 'https://indiatutorsonline.com/wp-content/uploads/2026/04/CarouselImage1.webp',
                'published_at' => '2026-06-05 10:00:00',
                'body' => <<<'HTML'
<p>Live online classes and in-person home tuition each have real strengths. The right choice is not about which is "better" overall, but which fits your child and your circumstances. Here is a clear-eyed comparison.</p>
<h2>The case for online tuition</h2>
<p>Online opens up the whole country's best tutors, not just those near you. It removes travel time for everyone, makes rescheduling easier, and lets sessions be recorded for revision. For focused subjects — coding, spoken English, music theory, exam prep — it is often the stronger option, and usually more affordable.</p>
<h2>The case for home tuition</h2>
<p>Some children, especially younger ones, concentrate better with a tutor physically present. Hands-on subjects and students who need close, structured supervision can benefit from in-person classes. The trade-off is a smaller pool of local tutors and less scheduling flexibility.</p>
<h2>How to decide</h2>
<ul>
<li><strong>Your child's age and focus:</strong> older, self-directed students thrive online; some younger children do better in person.</li>
<li><strong>The subject:</strong> screen-friendly subjects lean online; very hands-on ones may lean in-person.</li>
<li><strong>Your schedule:</strong> if evenings are tight, online removes travel for the whole family.</li>
<li><strong>Budget:</strong> online is typically more affordable for the same quality of tutor.</li>
</ul>
<h2>You do not have to choose blindly</h2>
<p>On IndiaTutors Online you can try either mode with a free demo before committing. Many families start online for flexibility and switch modes as they learn what works. Whatever you choose, the tutor's quality matters far more than the medium.</p>
HTML,
            ],
        ];

        foreach ($posts as $data) {
            Post::updateOrCreate(['slug' => $data['slug']], $data + ['is_published' => true]);
        }
        $this->command->info('Seeded '.count($posts).' blog posts.');
    }
}
