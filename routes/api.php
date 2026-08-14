<?php
use App\Http\Controllers\Api\AdminAuditController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AdminCourseController;
use App\Http\Controllers\Api\AdminSettingController;
use App\Http\Controllers\Api\AdminStudentController;
use App\Http\Controllers\Api\AdminSupportController;
use App\Http\Controllers\Api\AdminMediaController;
use App\Http\Controllers\Api\AdminPostController;
use App\Http\Controllers\Api\AdminTeacherController;
use App\Http\Controllers\Api\SupportController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BlogController;
use App\Http\Controllers\Api\GroupClassController;
use App\Http\Controllers\Api\LegalController;
use App\Http\Controllers\Api\AdminLegalController;
use App\Http\Controllers\Api\SiteSettingController;
use App\Http\Controllers\Api\TestimonialController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CityController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\CourseMaterialController;
use App\Http\Controllers\Api\DemoRequestController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\ExamUpdateController;
use App\Http\Controllers\Api\VideoCourseController;
use App\Http\Controllers\Api\KycController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\AdminPhysicalController;
use App\Http\Controllers\Api\MatchingExportController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PhysicalProfileController;
use App\Http\Controllers\Api\PincodeController;
use App\Http\Controllers\Api\PortfolioController;
use App\Http\Controllers\Api\TuitionRequirementController;
use App\Http\Controllers\Api\QuestionController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\StudentAchievementController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\TeacherApplicationController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\TutorController;
use Illuminate\Support\Facades\Route;

Route::get('/categories',        [CategoryController::class, 'index']);
Route::get('/categories/tree',   [CategoryController::class, 'tree']);
Route::get('/categories/{slug}', [CategoryController::class, 'show']);

Route::get('/courses',           [CourseController::class, 'index']);
// /group-classes, from the database rather than a build-time JSON import.
Route::get('/group-classes',     [GroupClassController::class, 'index']);

// Policy pages and the site-wide contact details, both admin-editable. Public
// because the footer links the policies from every page, signed in or not.
Route::get('/legal',             [LegalController::class, 'index']);
Route::get('/legal/{slug}',      [LegalController::class, 'show']);
Route::get('/site-settings',     [SiteSettingController::class, 'index']);
// Home-page testimonials: reviews a human approved AND shortlisted.
Route::get('/testimonials',      [TestimonialController::class, 'index']);
Route::get('/courses/{slug}',    [CourseController::class, 'show'])->name('api.courses.show');
// Two segments, so these never shadow /courses/{slug} above.
Route::get('/courses/{course:slug}/reviews',  [ReviewController::class, 'index']);
Route::post('/courses/{course:slug}/reviews', [ReviewController::class, 'store'])->middleware('throttle:5,1');
// Teacher reviews. GET is public (it also tells a signed-in visitor whether
// they may write one); POST needs an account, because the gate is a demo that
// account actually had — see App\Support\TeacherPerformance.
// {slug}, not {tutor:slug}: tutorIndex resolves it with published() so a draft
// teacher 404s here exactly as their profile page does.
Route::get('/tutors/{slug}/reviews',  [ReviewController::class, 'tutorIndex']);
Route::post('/tutors/{tutor:slug}/reviews', [ReviewController::class, 'storeForTutor'])
    ->middleware(['auth:sanctum', 'throttle:5,1']);

Route::get('/tutors',            [TutorController::class, 'index']);
Route::get('/tutors/filters',    [TutorController::class, 'filters']);
// Ranked shortlist for the booking flow. Must precede /tutors/{slug} or the
// literal segment is swallowed as a slug.
Route::get('/tutors/suggestions',[TutorController::class, 'suggestions']);
Route::get('/tutors/{slug}',     [TutorController::class, 'show'])->name('api.tutors.show');

Route::get('/cities',            [CityController::class, 'index']);
Route::get('/cities/{slug}',     [CityController::class, 'show']);

Route::get('/posts',             [BlogController::class, 'index']);
Route::get('/posts/{slug}',      [BlogController::class, 'show'])->name('api.posts.show');

// Social feeds (cached server-side; see SocialFeedController)
Route::get('/social/youtube',   [\App\Http\Controllers\Api\SocialFeedController::class, 'youtube']);
Route::get('/social/instagram', [\App\Http\Controllers\Api\SocialFeedController::class, 'instagram']);

Route::get('/events',            [EventController::class, 'index']);
Route::get('/events/{slug}',     [EventController::class, 'show'])->name('api.events.show');


// Video courses — public list/detail (ownership resolved from a bearer token if
// present); lesson playback is gated in the controller.
Route::get('/video-courses',         [VideoCourseController::class, 'index']);
Route::get('/video-courses/{slug}',  [VideoCourseController::class, 'show'])->name('api.video.show');
Route::post('/video-courses/{videoCourse}/lessons/{lesson}/playback', [VideoCourseController::class, 'playback'])->middleware('throttle:60,1');
// Study assistant. Tighter throttle than playback — each ask costs an API call,
// so this is the cost ceiling as much as it is abuse protection.
Route::post('/video-courses/{videoCourse}/lessons/{lesson}/ask',     [VideoCourseController::class, 'ask'])->middleware('throttle:10,1');
Route::get('/video-courses/{videoCourse}/lessons/{lesson}/summary',  [VideoCourseController::class, 'summary'])->middleware('throttle:20,1');
// F3/F4/F5 — a structured board. Same cost per call as ask(), same throttle.
Route::post('/video-courses/{videoCourse}/lessons/{lesson}/explain', [VideoCourseController::class, 'explain'])->middleware('throttle:10,1');

// Public physical-tuition endpoints. EnsurePhysicalSchema guards every route
// that touches these tables: this host has a documented habit of killing the
// deploy's `migrate` step, and without the guard those deploys leave the whole
// module 500ing against tables that were never created.
Route::middleware(\App\Http\Middleware\EnsurePhysicalSchema::class)->group(function () {
    // Address autofill. Public: both forms run before anyone has an account,
    // and a pincode is not private data.
    Route::get('/pincodes/search',   [PincodeController::class, 'search'])->middleware('throttle:60,1');
    Route::get('/pincodes/{pincode}',[PincodeController::class, 'show'])->middleware('throttle:60,1');

    // "Find me a home tutor" — guests may post; a signed-in parent gets the
    // richer version from the dashboard (see the auth group below).
    Route::post('/tuition-requirements', [TuitionRequirementController::class, 'store'])->middleware('throttle:10,1');
});

Route::post('/demo-requests',    [DemoRequestController::class, 'store']);
// Guarded too: this is the lead-capture path for seven public forms, and it now
// writes a support ticket. A missing table here loses an enquiry.
Route::post('/contact',          [ContactController::class, 'store'])
    ->middleware(\App\Http\Middleware\EnsureSupportSchema::class);
Route::post('/teacher-applications', [TeacherApplicationController::class, 'store'])->middleware('throttle:6,1');
Route::post('/orders',           [OrderController::class, 'store'])->middleware('throttle:10,1');
Route::post('/orders/verify',    [OrderController::class, 'verify'])->middleware('throttle:20,1');

// --- Auth (bearer-token, Sanctum) ---
Route::post('/auth/register',    [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/auth/login',       [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me',       [AuthController::class, 'me']);
    Route::put('/auth/me',       [AuthController::class, 'updateMe']);
    Route::post('/auth/password',[AuthController::class, 'changePassword'])->middleware('throttle:10,1');
    // Sign-in addresses: add a new one, then remove the old. Throttled like the
    // password route — each one takes the current password, so they are as
    // guessable a target as a login.
    Route::get   ('/auth/emails',                    [AuthController::class, 'emails']);
    Route::post  ('/auth/emails',                    [AuthController::class, 'addEmail'])->middleware('throttle:10,1');
    Route::post  ('/auth/emails/{userEmail}/primary', [AuthController::class, 'makeEmailPrimary'])->middleware('throttle:10,1');
    Route::post  ('/auth/emails/{userEmail}/remove',  [AuthController::class, 'removeEmail'])->middleware('throttle:10,1');
    Route::post('/auth/logout',  [AuthController::class, 'logout']);
    Route::get('/my/video-courses', [VideoCourseController::class, 'myCourses']);
    Route::get('/my/orders',        [OrderController::class, 'myIndex']);

    Route::apiResource('students', StudentController::class)->except(['show']);

    Route::get('/kyc',           [KycController::class, 'index']);
    Route::post('/kyc',          [KycController::class, 'store']);
    Route::delete('/kyc/{document}', [KycController::class, 'destroy']);

    // E7 — achievements a family records and credits. Private by default;
    // publication needs BOTH staff approval and the family's consent.
    // F7 + F8 — the question ladder and the weakness it reveals. No AI provider
    // involved, which is why these ship ahead of F2-F6.
    Route::get('/lessons/{lesson}/questions',  [QuestionController::class, 'forLesson']);
    Route::post('/lessons/{lesson}/questions', [QuestionController::class, 'submit'])->middleware('throttle:30,1');
    Route::get('/my/weak-areas',               [QuestionController::class, 'weakAreas']);

    // E6 — the student's own record: classes attended, materials held.
    Route::get('/my/record',                       [StudentAchievementController::class, 'record']);
    Route::get('/my/achievements',                 [StudentAchievementController::class, 'index']);
    Route::post('/my/achievements',                [StudentAchievementController::class, 'store'])->middleware('throttle:10,1');
    Route::patch('/my/achievements/{achievement}', [StudentAchievementController::class, 'update']);
    Route::delete('/my/achievements/{achievement}',[StudentAchievementController::class, 'destroy']);

    Route::get('/my/demo-requests', [DemoRequestController::class, 'myIndex']);
    // The family answers a proposed time. Ownership is checked in the
    // controller — these ids are guessable and this writes to a teacher's diary.
    Route::post('/my/demo-requests/{demoRequest}/slots/{slot}/accept',  [DemoRequestController::class, 'acceptSlot']);
    Route::post('/my/demo-requests/{demoRequest}/slots/{slot}/decline', [DemoRequestController::class, 'declineSlot']);
    Route::get('/my/enrollments',   [EnrollmentController::class, 'myIndex']);
    Route::get('/my/upcoming-classes', [EnrollmentController::class, 'upcomingClasses']);
    Route::get('/my/enrollments/{enrollment}', [EnrollmentController::class, 'myShow']);
    Route::post('/my/enrollments/{enrollment}/reschedules', [EnrollmentController::class, 'requestReschedule']);
    Route::get('/materials/{material}/download', [EnrollmentController::class, 'downloadMaterial']);
    // E3 + E4 — company-supplied course material. One list for the teacher who
    // teaches it and the students enrolled on it; entitlement derived from live
    // enrolments, re-checked on download.
    Route::get('/my/course-materials',                    [CourseMaterialController::class, 'mine']);
    Route::get('/course-materials/{material}/download',   [CourseMaterialController::class, 'download']);

    // Student portfolio (Phase 6)
    Route::get('/students/{student}/portfolio',  [PortfolioController::class, 'index']);
    Route::post('/students/{student}/portfolio', [PortfolioController::class, 'store']);
    Route::delete('/portfolio/{item}',           [PortfolioController::class, 'destroy']);
    Route::get('/portfolio/{item}/download',     [PortfolioController::class, 'download']);

    // Exam updates feed (Phase 6)
    Route::get('/exam-updates',                  [ExamUpdateController::class, 'index']);

    // In-app notifications (Phase 8)
    // Support threads — the customer's half of the inbox.
    Route::middleware(\App\Http\Middleware\EnsureSupportSchema::class)->group(function () {
        Route::get('/support/tickets',                    [SupportController::class, 'index']);
        Route::post('/support/tickets',                   [SupportController::class, 'store'])->middleware('throttle:20,1');
        Route::post('/support/tickets/{ticket}/messages', [SupportController::class, 'reply'])->middleware('throttle:30,1');
        Route::patch('/support/tickets/{ticket}/close',   [SupportController::class, 'close']);
    });

    Route::get('/notifications',                 [NotificationController::class, 'index']);
    Route::patch('/notifications/read-all',      [NotificationController::class, 'markAllRead']);
    Route::patch('/notifications/{id}/read',     [NotificationController::class, 'markRead']);

    // Physical / home tuition — the teacher's operating record and the family's
    // open requirements. Both feed the external leads software (see /matching/v1).
    Route::middleware(\App\Http\Middleware\EnsurePhysicalSchema::class)->group(function () {
        Route::get('/teacher/physical-profile',        [PhysicalProfileController::class, 'show']);
        Route::put('/teacher/physical-profile',        [PhysicalProfileController::class, 'update']);
        Route::patch('/teacher/physical-profile/status',[PhysicalProfileController::class, 'setStatus']);

        Route::get('/tuition-requirements',              [TuitionRequirementController::class, 'index']);
        Route::put('/tuition-requirements/{requirement}',[TuitionRequirementController::class, 'update']);
        Route::patch('/tuition-requirements/{requirement}/close', [TuitionRequirementController::class, 'close']);
        Route::delete('/tuition-requirements/{requirement}',      [TuitionRequirementController::class, 'destroy']);
    });

    // Teacher portal (own profile + classroom)
    Route::get('/teacher/profile',  [TeacherController::class, 'showMine']);
    Route::put('/teacher/profile',  [TeacherController::class, 'updateMine']);
    Route::get('/teacher/students', [TeacherController::class, 'students']);
    Route::get('/teacher/demos',    [TeacherController::class, 'demos']);
    // E2 + E9 — "I cannot take this class on this date", resolved as a
    // substitute or as an online class against the teacher's monthly allowance.
    Route::get('/teacher/online-allowance',                          [TeacherController::class, 'onlineAllowance']);
    Route::post('/teacher/enrollments/{enrollment}/absence',         [TeacherController::class, 'reportAbsence']);
    Route::post('/teacher/demos/{demoRequest}/slots',                [TeacherController::class, 'proposeDemoSlot']);
    Route::patch('/teacher/demos/{demoRequest}/slots/{slot}/withdraw',[TeacherController::class, 'withdrawDemoSlot']);
    Route::get('/teacher/enrollments/{enrollment}/logs',  [TeacherController::class, 'classLogs']);
    Route::post('/teacher/enrollments/{enrollment}/logs', [TeacherController::class, 'storeClassLog']);
    Route::get('/teacher/enrollments/{enrollment}/curriculum',    [TeacherController::class, 'curriculum']);
    Route::post('/teacher/enrollments/{enrollment}/curriculum',   [TeacherController::class, 'storeCurriculumItem']);
    Route::patch('/teacher/enrollments/{enrollment}/curriculum/{item}',  [TeacherController::class, 'updateCurriculumItem']);
    Route::delete('/teacher/enrollments/{enrollment}/curriculum/{item}', [TeacherController::class, 'destroyCurriculumItem']);
    Route::get('/teacher/enrollments/{enrollment}/materials',    [TeacherController::class, 'materials']);
    Route::post('/teacher/enrollments/{enrollment}/materials',   [TeacherController::class, 'storeMaterial']);
    Route::delete('/teacher/enrollments/{enrollment}/materials/{material}', [TeacherController::class, 'destroyMaterial']);
    Route::get('/teacher/proposals',  [TeacherController::class, 'proposals']);
    Route::post('/teacher/proposals', [TeacherController::class, 'storeProposal']);
    Route::get('/teacher/reschedules',              [TeacherController::class, 'reschedules']);
    Route::patch('/teacher/reschedules/{reschedule}', [TeacherController::class, 'decideReschedule']);
    Route::get('/teacher/calendar',                 [TeacherController::class, 'calendar']);

    // --- Admin (staff): match tutors, schedule, convert demo -> enrollment ---
    Route::middleware(\App\Http\Middleware\EnsureAdmin::class)->prefix('admin')->group(function () {
        Route::get('/overview',                          [AdminController::class, 'overview']);
        Route::get('/demo-requests',                     [AdminController::class, 'demoRequests']);
        Route::get('/demo-requests/{demoRequest}/suggestions', [AdminController::class, 'demoSuggestions']);
        // Coordinator controls: who may see the family's details, and logging a
        // time settled on a phone call.
        Route::patch('/demo-requests/{demoRequest}/contact',   [AdminController::class, 'releaseDemoContact']);
        Route::post('/demo-requests/{demoRequest}/slots',      [AdminController::class, 'logDemoSlot']);
        Route::patch('/demo-requests/{demoRequest}',     [AdminController::class, 'assignDemo']);
        Route::delete('/demo-requests/{demoRequest}',    [AdminController::class, 'destroyDemoRequest']);
        Route::post('/demo-requests/{demoRequest}/convert',[AdminController::class, 'convert']);
        Route::get('/teacher-applications',                        [TeacherApplicationController::class, 'adminIndex']);
        Route::patch('/teacher-applications/{teacherApplication}', [TeacherApplicationController::class, 'updateStatus']);
        Route::get('/teacher-applications/{teacherApplication}/cv',[TeacherApplicationController::class, 'downloadCv']);
        Route::get('/users',                             [AdminController::class, 'users']);
        Route::post('/users',                            [AdminController::class, 'storeUser'])->middleware('throttle:20,1');
        Route::post('/users/student',                    [AdminController::class, 'storeStudentAccount'])->middleware('throttle:20,1');
        Route::patch('/users/{user}',                    [AdminController::class, 'updateUser']);
        Route::delete('/users/{user}',                   [AdminController::class, 'destroyUser']);
        Route::get('/users/{user}/dashboard',            [AdminController::class, 'userDashboard']);
        Route::patch('/users/{user}/role',               [AdminController::class, 'updateUserRole']);
        Route::post('/users/{user}/password',            [AdminController::class, 'resetUserPassword'])->middleware('throttle:10,1');
        Route::get('/students',                          [AdminStudentController::class, 'index']);
        Route::patch('/students/{student}',              [AdminStudentController::class, 'update']);
        Route::get('/enrollments',                       [AdminController::class, 'enrollments']);
        // E2 — cover that the system could not arrange, plus the override.
        Route::get('/class-absences',                    [AdminController::class, 'classAbsences']);
        Route::patch('/class-absences/{absence}',        [AdminController::class, 'updateClassAbsence']);
        // C4 — the weekly timetable that follows a converted demo.
        Route::post('/enrollments/{enrollment}/schedule',            [AdminController::class, 'addEnrollmentSchedule']);
        Route::delete('/enrollments/{enrollment}/schedule/{schedule}',[AdminController::class, 'removeEnrollmentSchedule']);
        Route::get('/orders',                            [AdminController::class, 'orders']);
        Route::patch('/orders/{order}',                  [AdminController::class, 'updateOrder']);
        Route::delete('/orders/{order}',                 [AdminController::class, 'destroyOrder']);
        Route::get('/events',                            [EventController::class, 'adminIndex']);
        Route::post('/events',                           [EventController::class, 'store']);
        Route::patch('/events/{event}',                  [EventController::class, 'update']);
        Route::delete('/events/{event}',                 [EventController::class, 'destroy']);
        Route::get('/video-courses',                     [VideoCourseController::class, 'adminIndex']);
        Route::post('/video-courses',                    [VideoCourseController::class, 'store']);
        Route::patch('/video-courses/{videoCourse}',     [VideoCourseController::class, 'update']);
        Route::delete('/video-courses/{videoCourse}',    [VideoCourseController::class, 'destroy']);
        // Mints a presigned PUT; the browser uploads straight to R2 from there.
        Route::post('/video-courses/{videoCourse}/upload-url',              [VideoCourseController::class, 'uploadUrl']);
        Route::get('/video-courses/{videoCourse}/lessons',                 [VideoCourseController::class, 'lessons']);
        Route::post('/video-courses/{videoCourse}/lessons',                [VideoCourseController::class, 'storeLesson']);
        Route::patch('/video-courses/{videoCourse}/lessons/{lesson}',      [VideoCourseController::class, 'updateLesson']);
        Route::delete('/video-courses/{videoCourse}/lessons/{lesson}',     [VideoCourseController::class, 'destroyLesson']);
        Route::get('/teachers',                          [AdminController::class, 'teachers']);
        Route::patch('/teachers/{teacherProfile}',       [AdminController::class, 'approveTeacher']);
        // One merged queue over teacher_profiles + unclaimed teacher_applications.
        Route::get('/teachers-console',                  [AdminTeacherController::class, 'index']);
        Route::patch('/teachers/{teacherProfile}/listing',[AdminTeacherController::class, 'toggleListing']);
        // The "Verified" badge was granted by a schema default and nothing could
        // withdraw it — see AdminTeacherController::toggleVerified.
        Route::patch('/teachers/{teacherProfile}/verified',[AdminTeacherController::class, 'toggleVerified']);
        // A4 — a teacher's own edits reach the public listing only through here.
        Route::post('/teachers/{teacherProfile}/publish', [AdminTeacherController::class, 'publishChanges']);
        Route::post('/teachers/{teacherProfile}/discard', [AdminTeacherController::class, 'discardChanges']);
        // Logins for the teachers listed before accounts existed. Throttled: it
        // creates accounts and returns their passwords once.
        // Images already shipped with the site, for the admin picker.
        Route::get ('/media/images', [AdminMediaController::class, 'images']);
        // Blog. The public /posts endpoints and /blog pages already existed;
        // there was simply no way to write a post without a database client.
        Route::get   ('/posts',         [AdminPostController::class, 'index']);
        Route::post  ('/posts',         [AdminPostController::class, 'store']);
        Route::patch ('/posts/{post}',  [AdminPostController::class, 'update']);
        Route::delete('/posts/{post}',  [AdminPostController::class, 'destroy']);
        Route::get ('/teachers/provision-status', [AdminTeacherController::class, 'provisionStatus']);
        Route::post('/teachers/provision',        [AdminTeacherController::class, 'provisionAccounts'])->middleware('throttle:6,1');
        // F7 — question authoring. Answers travel only on these staff routes.
        Route::get('/lessons/{lesson}/questions',        [QuestionController::class, 'adminForLesson']);
        Route::post('/lessons/{lesson}/questions',       [QuestionController::class, 'adminStore']);
        Route::patch('/questions/{question}',            [QuestionController::class, 'adminUpdate']);
        Route::delete('/questions/{question}',           [QuestionController::class, 'adminDestroy']);
        Route::get('/course-materials',                  [CourseMaterialController::class, 'adminIndex']);
        Route::post('/course-materials',                 [CourseMaterialController::class, 'store']);
        Route::patch('/course-materials/{material}',     [CourseMaterialController::class, 'update']);
        Route::delete('/course-materials/{material}',    [CourseMaterialController::class, 'destroy']);
        Route::get('/achievements',                      [StudentAchievementController::class, 'adminIndex']);
        Route::patch('/achievements/{achievement}',      [StudentAchievementController::class, 'adminUpdate']);
        Route::get('/reviews',                           [ReviewController::class, 'adminIndex']);
        Route::post('/reviews',                          [ReviewController::class, 'adminStore']);
        Route::patch('/reviews/{review}',                [ReviewController::class, 'update']);
        Route::delete('/reviews/{review}',               [ReviewController::class, 'destroy']);
        Route::get('/courses',                           [AdminCourseController::class, 'index']);
        Route::post('/courses',                          [AdminCourseController::class, 'store']);
        Route::patch('/courses/{course}',                [AdminCourseController::class, 'update']);
        Route::delete('/courses/{course}',               [AdminCourseController::class, 'destroy']);
        // Group-class batches (the levels shown on a /group-classes card).
        Route::post  ('/courses/{course}/batches',          [GroupClassController::class, 'storeBatch']);
        Route::patch ('/courses/{course}/batches/{batch}',  [GroupClassController::class, 'updateBatch']);
        Route::delete('/courses/{course}/batches/{batch}',  [GroupClassController::class, 'destroyBatch']);
        // Physical / home tuition queues
        Route::middleware(\App\Http\Middleware\EnsurePhysicalSchema::class)->group(function () {
            Route::get('/physical/profiles',                     [AdminPhysicalController::class, 'profiles']);
            Route::get('/physical/profiles/{profile}',           [AdminPhysicalController::class, 'profile']);
            Route::patch('/physical/profiles/{profile}',         [AdminPhysicalController::class, 'updateProfile']);
            Route::get('/physical/requirements',                 [AdminPhysicalController::class, 'requirements']);
            Route::get('/physical/requirements/{requirement}',   [AdminPhysicalController::class, 'requirement']);
            Route::get('/physical/requirements/{requirement}/suggestions', [AdminPhysicalController::class, 'suggestions']);
            Route::patch('/physical/requirements/{requirement}', [AdminPhysicalController::class, 'updateRequirement']);
        });

        // The inbox: public enquiries and in-account support, one queue.
        Route::middleware(\App\Http\Middleware\EnsureSupportSchema::class)->group(function () {
            Route::get('/support',                    [AdminSupportController::class, 'index']);
            Route::get('/support/{ticket}',           [AdminSupportController::class, 'show']);
            Route::post('/support/{ticket}/messages', [AdminSupportController::class, 'reply']);
            Route::patch('/support/{ticket}',         [AdminSupportController::class, 'update']);
        });

        Route::get('/audit',                             [AdminAuditController::class, 'index']);
        Route::get('/settings',                          [AdminSettingController::class, 'index']);
        Route::put('/settings',                          [AdminSettingController::class, 'update']);
        Route::get('/legal',                             [AdminLegalController::class, 'index']);
        Route::get('/legal/{document}',                  [AdminLegalController::class, 'show']);
        Route::patch('/legal/{document}',                [AdminLegalController::class, 'update']);
        Route::get('/proposals',                         [AdminController::class, 'proposals']);
        Route::patch('/proposals/{proposal}',            [AdminController::class, 'decideProposal']);
        Route::get('/analytics',                         [AdminController::class, 'analytics']);
        Route::get('/exam-updates',                      [ExamUpdateController::class, 'adminIndex']);
        Route::post('/exam-updates',                     [ExamUpdateController::class, 'store']);
        Route::patch('/exam-updates/{examUpdate}',       [ExamUpdateController::class, 'update']);
        Route::delete('/exam-updates/{examUpdate}',      [ExamUpdateController::class, 'destroy']);
    });
});

/*
 * --- Matching export (machine-to-machine) ------------------------------------
 *
 * The read model the separate teacher-assignment app consumes: every published
 * physical-tuition teacher and every open student requirement, flattened and
 * pre-resolved (coordinates, grade ordinals, availability ranges).
 *
 * Outside the Sanctum group on purpose — the caller is a server, not a user
 * session — and gated by a static key in X-Matching-Key. With MATCHING_API_KEY
 * unset the whole prefix 503s: this data is home addresses on both sides, and
 * it must never be reachable by default.
 *
 * Versioned in the path so the schema can change without breaking a deployed
 * consumer. Contract: docs/MATCHING-DATA-CONTRACT.md
 */
Route::prefix('matching/v1')
    ->middleware([
        \App\Http\Middleware\EnsureMatchingClient::class,
        \App\Http\Middleware\EnsurePhysicalSchema::class,
        'throttle:120,1',
    ])
    ->group(function () {
        Route::get('/reference',                  [MatchingExportController::class, 'reference']);
        Route::get('/teachers',                   [MatchingExportController::class, 'teachers']);
        Route::get('/teachers/{profile}',         [MatchingExportController::class, 'teacher']);
        Route::get('/requirements',               [MatchingExportController::class, 'requirements']);
        Route::get('/requirements/{requirement}', [MatchingExportController::class, 'requirement']);
        Route::patch('/requirements/{requirement}',[MatchingExportController::class, 'updateRequirement']);
    });
