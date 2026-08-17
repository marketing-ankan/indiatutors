<?php
namespace Database\Seeders;

use App\Models\ClassLog;
use App\Models\Enrollment;
use App\Models\Student;
use App\Models\TeacherProfile;
use App\Models\Tutor;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Local-only sign-in fixtures for the three post-login dashboards.
 *
 * /dashboard renders a different view per role, and until now the only account
 * this project could create was the admin — so the parent, student and teacher
 * dashboards could be read in the source but never actually looked at. Every
 * UI judgement about them was therefore guesswork, including "is this panel
 * empty because there is no data, or because it is broken".
 *
 * This seeder makes all three signable-in on a dev machine, in BOTH states that
 * matter: an account with nothing in it (what a real new user sees, and where
 * most of the empty-state bugs live) and an account with a class, a teacher and
 * a couple of logged lessons behind it.
 *
 * NEVER runs in production, and is deliberately absent from deploy.sh's seeder
 * list — it is invoked by hand:
 *
 *     php artisan db:seed --class=DevFixtureSeeder
 *
 * Addresses are @example.test, a reserved TLD that cannot resolve or receive
 * mail anywhere, so these can never collide with or impersonate a real person.
 */
class DevFixtureSeeder extends Seeder
{
    /** Local convenience only. Everything here is unreachable from the internet. */
    private const PASSWORD = 'devpassword';
    private const DOMAIN   = '@example.test';

    public function run(): void
    {
        if (app()->isProduction()) {
            $this->command?->error('DevFixtureSeeder refuses to run in production.');
            return;
        }

        $teacherUser = $this->user('teacher', 'Anita Rao (dev teacher)', 'teacher');
        $pendingUser = $this->user('teacher-pending', 'Raj Verma (dev, awaiting approval)', 'teacher');
        $parentUser  = $this->user('parent', 'Meera Nair (dev parent)', 'parent');
        $emptyParent = $this->user('parent-new', 'Brand New Parent (dev)', 'parent');
        $studentUser = $this->user('student', 'Aditi Nair (dev student)', 'student');

        // An approved teacher and one still waiting, because the pending view is
        // its own screen and the one a new teacher actually meets first.
        $profile = TeacherProfile::firstOrCreate(
            ['user_id' => $teacherUser->id],
            ['headline' => 'Mathematics & Science, Classes 6-10', 'qualification' => 'M.Sc. Mathematics',
             'experience_years' => 7, 'city' => 'Kolkata', 'teaching_mode' => 'online',
             'bio' => 'Dev fixture teacher.', 'status' => 'approved'],
        );
        if ($profile->status !== 'approved') $profile->update(['status' => 'approved']);

        TeacherProfile::firstOrCreate(
            ['user_id' => $pendingUser->id],
            ['headline' => 'Physics, Classes 11-12', 'qualification' => 'M.Sc. Physics',
             'experience_years' => 3, 'city' => 'Kolkata', 'teaching_mode' => 'online',
             'bio' => 'Dev fixture teacher awaiting approval.', 'status' => 'pending'],
        );

        // The listing row the classroom hangs off. Tutor and TeacherProfile are
        // separate tables here: the profile is the application, the tutor is the
        // published listing that enrolments point at.
        $tutor = Tutor::firstOrCreate(
            ['slug' => 'dev-anita-rao'],
            ['user_id' => $tutorUserId = $teacherUser->id, 'name' => 'Anita Rao',
             'city' => 'Kolkata', 'is_published' => false, 'verified' => false],
        );

        // The parent's two children. The second has no classes on purpose, so the
        // "child with nothing yet" row is visible next to an active one.
        $active = Student::firstOrCreate(
            ['user_id' => $parentUser->id, 'name' => 'Aditi Nair'],
            ['account_user_id' => $studentUser->id, 'grade' => '8', 'board' => 'CBSE',
             'subjects' => 'Mathematics, Science'],
        );
        // account_user_id is what links the STUDENT login to the child record —
        // without it the student dashboard shows its "not linked yet" screen.
        if (!$active->account_user_id) $active->update(['account_user_id' => $studentUser->id]);

        Student::firstOrCreate(
            ['user_id' => $parentUser->id, 'name' => 'Arjun Nair'],
            ['grade' => '5', 'board' => 'CBSE', 'subjects' => 'English'],
        );

        $enrollment = Enrollment::firstOrCreate(
            ['student_id' => $active->id, 'tutor_id' => $tutor->id],
            ['plan' => 'One-to-One', 'status' => 'active', 'notes' => 'Dev fixture enrolment.'],
        );

        foreach ([
            ['topic' => 'Linear equations in one variable', 'days' => 9,  'homework' => 'Exercise 2.3, Q1-Q8'],
            ['topic' => 'Word problems on linear equations', 'days' => 2, 'homework' => 'Worksheet 4'],
        ] as $log) {
            ClassLog::firstOrCreate(
                ['enrollment_id' => $enrollment->id, 'topic' => $log['topic']],
                // 'completed', not 'held' — StudentRecord counts attendance,
                // hours and the week strip off exactly this string.
                ['tutor_id' => $tutor->id, 'held_on' => now()->subDays($log['days'])->toDateString(),
                 'duration_min' => 60, 'homework' => $log['homework'], 'status' => 'completed'],
            );
        }

        $this->command?->info('Dev fixtures ready. Password for all: ' . self::PASSWORD);
        foreach (['teacher', 'teacher-pending', 'parent', 'parent-new', 'student'] as $who) {
            $this->command?->line('  ' . str_pad($who, 16) . $who . self::DOMAIN);
        }
    }

    /** firstOrCreate so re-running never resets a password someone changed while testing. */
    private function user(string $handle, string $name, string $role): User
    {
        $user = User::firstOrCreate(
            ['email' => $handle . self::DOMAIN],
            ['name' => $name, 'password' => self::PASSWORD, 'role' => $role],
        );
        if ($user->role !== $role) $user->update(['role' => $role]);
        return $user;
    }
}
