<?php
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\DemoRequestController;
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

Route::post('/demo-requests',    [DemoRequestController::class, 'store']);
Route::post('/contact',          [ContactController::class, 'store']);
