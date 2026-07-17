<?php
use App\Http\Controllers\Api\AdminController;
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
use App\Http\Controllers\Api\KycController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PortfolioController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\TutorController;
use Illuminate\Support\Facades\Route;

Route::get('/categories',        [CategoryController::class, 'index']);
Route::get('/categories/tree',   [CategoryController::class, 'tree']);
Route::get('/categories/{slug}', [CategoryController::class, 'show']);

Route::get('/courses',           [CourseController::class, 'index']);
Route::get('/courses/{slug}',    [CourseController::class, 'show'])->name('api.courses.show');

Route::get('/tutors',            [TutorController::class, 'index']);
Route::get('/tutors/filters',    [TutorController::class, 'filters']);
Route::get('/tutors/{slug}',     [TutorController::class, 'show'])->name('api.tutors.show');

Route::get('/cities',            [CityController::class, 'index']);
Route::get('/cities/{slug}',     [CityController::class, 'show']);

Route::get('/posts',             [BlogController::class, 'index']);
Route::get('/posts/{slug}',      [BlogController::class, 'show'])->name('api.posts.show');

Route::get('/events',            [EventController::class, 'index']);
Route::get('/events/{slug}',     [EventController::class, 'show'])->name('api.events.show');

Route::post('/demo-requests',    [DemoRequestController::class, 'store']);
Route::post('/contact',          [ContactController::class, 'store']);
Route::post('/orders',           [OrderController::class, 'store'])->middleware('throttle:10,1');
Route::post('/orders/verify',    [OrderController::class, 'verify'])->middleware('throttle:20,1');

// --- Auth (bearer-token, Sanctum) ---
Route::post('/auth/register',    [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/auth/login',       [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me',       [AuthController::class, 'me']);
    Route::post('/auth/logout',  [AuthController::class, 'logout']);

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
        Route::get('/demo-requests',                     [AdminController::class, 'demoRequests']);
        Route::get('/demo-requests/{demoRequest}/tutors',[AdminController::class, 'suggestTutors']);
        Route::patch('/demo-requests/{demoRequest}',     [AdminController::class, 'assignDemo']);
        Route::post('/demo-requests/{demoRequest}/convert',[AdminController::class, 'convert']);
        Route::get('/enrollments',                       [AdminController::class, 'enrollments']);
        Route::get('/orders',                            [AdminController::class, 'orders']);
        Route::patch('/orders/{order}',                  [AdminController::class, 'updateOrder']);
        Route::get('/events',                            [EventController::class, 'adminIndex']);
        Route::post('/events',                           [EventController::class, 'store']);
        Route::patch('/events/{event}',                  [EventController::class, 'update']);
        Route::delete('/events/{event}',                 [EventController::class, 'destroy']);
        Route::get('/teachers',                          [AdminController::class, 'teachers']);
        Route::patch('/teachers/{teacherProfile}',       [AdminController::class, 'approveTeacher']);
        Route::get('/proposals',                         [AdminController::class, 'proposals']);
        Route::patch('/proposals/{proposal}',            [AdminController::class, 'decideProposal']);
        Route::get('/analytics',                         [AdminController::class, 'analytics']);
        Route::get('/exam-updates',                      [ExamUpdateController::class, 'adminIndex']);
        Route::post('/exam-updates',                     [ExamUpdateController::class, 'store']);
        Route::patch('/exam-updates/{examUpdate}',       [ExamUpdateController::class, 'update']);
        Route::delete('/exam-updates/{examUpdate}',      [ExamUpdateController::class, 'destroy']);
    });
});
