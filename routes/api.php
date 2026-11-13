<?php

use App\Http\Controllers\Api\V1\IntegrationApiController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('api.key')->group(function () {
    Route::get('/schools', [IntegrationApiController::class, 'schools']);
    Route::get('/students', [IntegrationApiController::class, 'students']);
    Route::get('/students/{student}', [IntegrationApiController::class, 'student']);
    Route::get('/employees', [IntegrationApiController::class, 'employees']);
    Route::get('/assets', [IntegrationApiController::class, 'assets']);
    Route::get('/transport/routes', [IntegrationApiController::class, 'routes']);
    Route::get('/library/loans', [IntegrationApiController::class, 'loans']);
    Route::get('/clinic/visits', [IntegrationApiController::class, 'visits']);
    Route::get('/dashboard/summary', [IntegrationApiController::class, 'summary']);
});
