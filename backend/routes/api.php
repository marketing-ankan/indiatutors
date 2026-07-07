<?php

use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\DemoRequestController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Catalog
    Route::get('/categories',        [CategoryController::class, 'index']);
    Route::get('/categories/tree',   [CategoryController::class, 'tree']);
    Route::get('/categories/{slug}', [CategoryController::class, 'show']);

    Route::get('/courses',           [CourseController::class, 'index']);
    Route::get('/courses/{slug}',    [CourseController::class, 'show'])->name('courses.show');

    // Lead capture
    Route::post('/demo-requests',    [DemoRequestController::class, 'store']);
    Route::post('/contact',          [ContactController::class, 'store']);
});
