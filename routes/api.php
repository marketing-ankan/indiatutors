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
use App\Http\Controllers\Api\KycController;
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

Route::post('/demo-requests',    [DemoRequestController::class, 'store']);
Route::post('/contact',          [ContactController::class, 'store']);

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

    // Teacher portal (own profile + classroom)
    Route::get('/teacher/profile',  [TeacherController::class, 'showMine']);
    Route::put('/teacher/profile',  [TeacherController::class, 'updateMine']);
    Route::get('/teacher/students', [TeacherController::class, 'students']);
    Route::get('/teacher/demos',    [TeacherController::class, 'demos']);
    Route::get('/teacher/enrollments/{enrollment}/logs',  [TeacherController::class, 'classLogs']);
    Route::post('/teacher/enrollments/{enrollment}/logs', [TeacherController::class, 'storeClassLog']);

    // --- Admin (staff): match tutors, schedule, convert demo -> enrollment ---
    Route::middleware(\App\Http\Middleware\EnsureAdmin::class)->prefix('admin')->group(function () {
        Route::get('/demo-requests',                     [AdminController::class, 'demoRequests']);
        Route::get('/demo-requests/{demoRequest}/tutors',[AdminController::class, 'suggestTutors']);
        Route::patch('/demo-requests/{demoRequest}',     [AdminController::class, 'assignDemo']);
        Route::post('/demo-requests/{demoRequest}/convert',[AdminController::class, 'convert']);
        Route::get('/enrollments',                       [AdminController::class, 'enrollments']);
        Route::get('/teachers',                          [AdminController::class, 'teachers']);
        Route::patch('/teachers/{teacherProfile}',       [AdminController::class, 'approveTeacher']);
    });
});
