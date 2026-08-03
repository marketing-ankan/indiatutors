<?php
use App\Http\Controllers\Api\AdminAuditController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AdminCourseController;
use App\Http\Controllers\Api\AdminSettingController;
use App\Http\Controllers\Api\AdminStudentController;
use App\Http\Controllers\Api\AdminTeacherController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BlogController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CityController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\DemoRequestController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\ExamUpdateController;
use App\Http\Controllers\Api\VideoCourseController;
use App\Http\Controllers\Api\KycController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PortfolioController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\TeacherApplicationController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\TutorController;
use Illuminate\Support\Facades\Route;

Route::get('/categories',        [CategoryController::class, 'index']);
Route::get('/categories/tree',   [CategoryController::class, 'tree']);
Route::get('/categories/{slug}', [CategoryController::class, 'show']);

Route::get('/courses',           [CourseController::class, 'index']);
Route::get('/courses/{slug}',    [CourseController::class, 'show'])->name('api.courses.show');
// Two segments, so these never shadow /courses/{slug} above.
Route::get('/courses/{course:slug}/reviews',  [ReviewController::class, 'index']);
Route::post('/courses/{course:slug}/reviews', [ReviewController::class, 'store'])->middleware('throttle:5,1');

Route::get('/tutors',            [TutorController::class, 'index']);
Route::get('/tutors/filters',    [TutorController::class, 'filters']);
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

Route::post('/demo-requests',    [DemoRequestController::class, 'store']);
Route::post('/contact',          [ContactController::class, 'store']);
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
    Route::post('/auth/logout',  [AuthController::class, 'logout']);
    Route::get('/my/video-courses', [VideoCourseController::class, 'myCourses']);
    Route::get('/my/orders',        [OrderController::class, 'myIndex']);

    Route::apiResource('students', StudentController::class)->except(['show']);

    Route::get('/kyc',           [KycController::class, 'index']);
    Route::post('/kyc',          [KycController::class, 'store']);
    Route::delete('/kyc/{document}', [KycController::class, 'destroy']);

    Route::get('/my/demo-requests', [DemoRequestController::class, 'myIndex']);
    Route::get('/my/enrollments',   [EnrollmentController::class, 'myIndex']);
    Route::get('/my/upcoming-classes', [EnrollmentController::class, 'upcomingClasses']);
    Route::get('/my/enrollments/{enrollment}', [EnrollmentController::class, 'myShow']);
    Route::post('/my/enrollments/{enrollment}/reschedules', [EnrollmentController::class, 'requestReschedule']);
    Route::get('/materials/{material}/download', [EnrollmentController::class, 'downloadMaterial']);

    // Student portfolio (Phase 6)
    Route::get('/students/{student}/portfolio',  [PortfolioController::class, 'index']);
    Route::post('/students/{student}/portfolio', [PortfolioController::class, 'store']);
    Route::delete('/portfolio/{item}',           [PortfolioController::class, 'destroy']);
    Route::get('/portfolio/{item}/download',     [PortfolioController::class, 'download']);

    // Exam updates feed (Phase 6)
    Route::get('/exam-updates',                  [ExamUpdateController::class, 'index']);

    // In-app notifications (Phase 8)
    Route::get('/notifications',                 [NotificationController::class, 'index']);
    Route::patch('/notifications/read-all',      [NotificationController::class, 'markAllRead']);
    Route::patch('/notifications/{id}/read',     [NotificationController::class, 'markRead']);

    // Teacher portal (own profile + classroom)
    Route::get('/teacher/profile',  [TeacherController::class, 'showMine']);
    Route::put('/teacher/profile',  [TeacherController::class, 'updateMine']);
    Route::get('/teacher/students', [TeacherController::class, 'students']);
    Route::get('/teacher/demos',    [TeacherController::class, 'demos']);
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
        Route::get('/demo-requests/{demoRequest}/tutors',[AdminController::class, 'suggestTutors']);
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
        Route::get('/reviews',                           [ReviewController::class, 'adminIndex']);
        Route::post('/reviews',                          [ReviewController::class, 'adminStore']);
        Route::patch('/reviews/{review}',                [ReviewController::class, 'update']);
        Route::delete('/reviews/{review}',               [ReviewController::class, 'destroy']);
        Route::get('/courses',                           [AdminCourseController::class, 'index']);
        Route::post('/courses',                          [AdminCourseController::class, 'store']);
        Route::patch('/courses/{course}',                [AdminCourseController::class, 'update']);
        Route::delete('/courses/{course}',               [AdminCourseController::class, 'destroy']);
        Route::get('/audit',                             [AdminAuditController::class, 'index']);
        Route::get('/settings',                          [AdminSettingController::class, 'index']);
        Route::put('/settings',                          [AdminSettingController::class, 'update']);
        Route::get('/proposals',                         [AdminController::class, 'proposals']);
        Route::patch('/proposals/{proposal}',            [AdminController::class, 'decideProposal']);
        Route::get('/analytics',                         [AdminController::class, 'analytics']);
        Route::get('/exam-updates',                      [ExamUpdateController::class, 'adminIndex']);
        Route::post('/exam-updates',                     [ExamUpdateController::class, 'store']);
        Route::patch('/exam-updates/{examUpdate}',       [ExamUpdateController::class, 'update']);
        Route::delete('/exam-updates/{examUpdate}',      [ExamUpdateController::class, 'destroy']);
    });
});
