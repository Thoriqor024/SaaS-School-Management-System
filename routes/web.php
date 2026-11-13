<?php

use App\Http\Controllers\AccessController;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\BookController;
use App\Http\Controllers\CafeteriaController;
use App\Http\Controllers\ClinicController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\IntegrationController;
use App\Http\Controllers\LabelController;
use App\Http\Controllers\LibraryController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ReportExportController;
use App\Http\Controllers\SchoolController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\TransportPassengerController;
use App\Http\Controllers\TransportRouteController;
use App\Http\Controllers\TransportVehicleController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->name('login.store');
});

Route::middleware('auth')->group(function () {
    Route::get('/', DashboardController::class)->name('dashboard');
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

    // Global identity - students
    Route::get('/students', [StudentController::class, 'index'])->name('students.index')->middleware('permission:students.view');
    Route::get('/students/create', [StudentController::class, 'create'])->name('students.create')->middleware('permission:students.manage');
    Route::post('/students', [StudentController::class, 'store'])->name('students.store')->middleware('permission:students.manage');
    Route::get('/students/{student}/edit', [StudentController::class, 'edit'])->name('students.edit')->middleware('permission:students.manage');
    Route::put('/students/{student}', [StudentController::class, 'update'])->name('students.update')->middleware('permission:students.manage');
    Route::delete('/students/{student}', [StudentController::class, 'destroy'])->name('students.destroy')->middleware('permission:students.manage');
    Route::get('/students/{student}', [StudentController::class, 'show'])->name('students.show')->middleware('permission:students.view');

    // Global identity - employees
    Route::get('/employees', [EmployeeController::class, 'index'])->name('employees.index')->middleware('permission:employees.view');
    Route::get('/employees/create', [EmployeeController::class, 'create'])->name('employees.create')->middleware('permission:employees.manage');
    Route::post('/employees', [EmployeeController::class, 'store'])->name('employees.store')->middleware('permission:employees.manage');
    Route::get('/employees/{employee}/edit', [EmployeeController::class, 'edit'])->name('employees.edit')->middleware('permission:employees.manage');
    Route::put('/employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update')->middleware('permission:employees.manage');
    Route::delete('/employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy')->middleware('permission:employees.manage');
    Route::get('/employees/{employee}', [EmployeeController::class, 'show'])->name('employees.show')->middleware('permission:employees.view');

    // RBAC
    Route::get('/access/users', [AccessController::class, 'users'])->name('access.users')->middleware('permission:users.manage');
    Route::post('/access/users', [AccessController::class, 'storeUser'])->name('access.users.store')->middleware('permission:users.manage');
    Route::put('/access/users/{user}', [AccessController::class, 'updateUser'])->name('access.users.update')->middleware('permission:users.manage');
    Route::delete('/access/users/{user}', [AccessController::class, 'destroyUser'])->name('access.users.destroy')->middleware('permission:users.manage');
    Route::get('/access/roles', [AccessController::class, 'roles'])->name('access.roles')->middleware('permission:users.manage');
    Route::put('/access/roles/{role}/permissions', [AccessController::class, 'updateRolePermissions'])->name('access.roles.permissions')->middleware('permission:users.manage');

    // Schools & branches
    Route::get('/schools', [SchoolController::class, 'index'])->name('schools.index')->middleware('permission:schools.manage');
    Route::post('/schools', [SchoolController::class, 'store'])->name('schools.store')->middleware('permission:schools.manage');
    Route::put('/schools/{school}', [SchoolController::class, 'update'])->name('schools.update')->middleware('permission:schools.manage');
    Route::delete('/schools/{school}', [SchoolController::class, 'destroy'])->name('schools.destroy')->middleware('permission:schools.manage');
    Route::post('/schools/{school}/branches', [SchoolController::class, 'storeBranch'])->name('schools.branches.store')->middleware('permission:schools.manage');
    Route::put('/branches/{branch}', [SchoolController::class, 'updateBranch'])->name('schools.branches.update')->middleware('permission:schools.manage');
    Route::delete('/branches/{branch}', [SchoolController::class, 'destroyBranch'])->name('schools.branches.destroy')->middleware('permission:schools.manage');

    // Assets
    Route::get('/assets', [AssetController::class, 'index'])->name('assets.index')->middleware('permission:assets.view');
    Route::get('/assets/{asset}/label', [LabelController::class, 'asset'])->name('assets.label')->middleware('permission:assets.view')->whereUuid('asset');
    Route::get('/assets/categories', [AssetController::class, 'categories'])->name('assets.categories')->middleware('permission:assets.view');
    Route::post('/assets/categories', [AssetController::class, 'storeCategory'])->name('assets.categories.store')->middleware('permission:assets.manage');
    Route::put('/assets/categories/{category}', [AssetController::class, 'updateCategory'])->name('assets.categories.update')->middleware('permission:assets.manage');
    Route::delete('/assets/categories/{category}', [AssetController::class, 'destroyCategory'])->name('assets.categories.destroy')->middleware('permission:assets.manage');
    Route::get('/assets/create', [AssetController::class, 'create'])->name('assets.create')->middleware('permission:assets.manage');
    Route::post('/assets', [AssetController::class, 'store'])->name('assets.store')->middleware('permission:assets.manage');
    Route::get('/assets/{asset}/edit', [AssetController::class, 'edit'])->name('assets.edit')->middleware('permission:assets.manage');
    Route::put('/assets/{asset}', [AssetController::class, 'update'])->name('assets.update')->middleware('permission:assets.manage');
    Route::delete('/assets/{asset}', [AssetController::class, 'destroy'])->name('assets.destroy')->middleware('permission:assets.manage');

    // Transport
    Route::get('/transport/vehicles', [TransportVehicleController::class, 'index'])->name('transport.vehicles.index')->middleware('permission:transport.view');
    Route::post('/transport/vehicles', [TransportVehicleController::class, 'store'])->name('transport.vehicles.store')->middleware('permission:transport.manage');
    Route::put('/transport/vehicles/{vehicle}', [TransportVehicleController::class, 'update'])->name('transport.vehicles.update')->middleware('permission:transport.manage');
    Route::delete('/transport/vehicles/{vehicle}', [TransportVehicleController::class, 'destroy'])->name('transport.vehicles.destroy')->middleware('permission:transport.manage');

    Route::get('/transport/routes', [TransportRouteController::class, 'index'])->name('transport.routes.index')->middleware('permission:transport.view');
    Route::get('/transport/routes/create', [TransportRouteController::class, 'create'])->name('transport.routes.create')->middleware('permission:transport.manage');
    Route::post('/transport/routes', [TransportRouteController::class, 'store'])->name('transport.routes.store')->middleware('permission:transport.manage');
    Route::get('/transport/routes/{route}/edit', [TransportRouteController::class, 'edit'])->name('transport.routes.edit')->middleware('permission:transport.manage');
    Route::put('/transport/routes/{route}', [TransportRouteController::class, 'update'])->name('transport.routes.update')->middleware('permission:transport.manage');
    Route::delete('/transport/routes/{route}', [TransportRouteController::class, 'destroy'])->name('transport.routes.destroy')->middleware('permission:transport.manage');

    Route::get('/transport/passengers', [TransportPassengerController::class, 'index'])->name('transport.passengers.index')->middleware('permission:transport.view');
    Route::post('/transport/passengers', [TransportPassengerController::class, 'store'])->name('transport.passengers.store')->middleware('permission:transport.manage');
    Route::put('/transport/passengers/{passenger}', [TransportPassengerController::class, 'update'])->name('transport.passengers.update')->middleware('permission:transport.manage');
    Route::delete('/transport/passengers/{passenger}', [TransportPassengerController::class, 'destroy'])->name('transport.passengers.destroy')->middleware('permission:transport.manage');

    Route::get('/transport/logs', [TransportPassengerController::class, 'logs'])->name('transport.logs')->middleware('permission:transport.view');
    Route::post('/transport/logs', [TransportPassengerController::class, 'storeLog'])->name('transport.logs.store')->middleware('permission:transport.manage');
    Route::delete('/transport/logs/{log}', [TransportPassengerController::class, 'destroyLog'])->name('transport.logs.destroy')->middleware('permission:transport.manage');

    // Library
    Route::get('/library/scan', [LabelController::class, 'scan'])->name('library.scan')->middleware('permission:library.view');
    Route::get('/library/books', [BookController::class, 'index'])->name('library.books.index')->middleware('permission:library.view');
    Route::get('/library/books/{book}/label', [LabelController::class, 'book'])->name('library.books.label')->middleware('permission:library.view');
    Route::get('/library/books/create', [BookController::class, 'create'])->name('library.books.create')->middleware('permission:library.manage');
    Route::post('/library/books', [BookController::class, 'store'])->name('library.books.store')->middleware('permission:library.manage');
    Route::get('/library/books/{book}/edit', [BookController::class, 'edit'])->name('library.books.edit')->middleware('permission:library.manage');
    Route::put('/library/books/{book}', [BookController::class, 'update'])->name('library.books.update')->middleware('permission:library.manage');
    Route::delete('/library/books/{book}', [BookController::class, 'destroy'])->name('library.books.destroy')->middleware('permission:library.manage');

    Route::get('/library/categories', [BookController::class, 'categories'])->name('library.categories')->middleware('permission:library.view');
    Route::post('/library/categories', [BookController::class, 'storeCategory'])->name('library.categories.store')->middleware('permission:library.manage');
    Route::put('/library/categories/{category}', [BookController::class, 'updateCategory'])->name('library.categories.update')->middleware('permission:library.manage');
    Route::delete('/library/categories/{category}', [BookController::class, 'destroyCategory'])->name('library.categories.destroy')->middleware('permission:library.manage');

    Route::get('/library/members', [LibraryController::class, 'members'])->name('library.members')->middleware('permission:library.view');
    Route::post('/library/members', [LibraryController::class, 'storeMember'])->name('library.members.store')->middleware('permission:library.manage');
    Route::put('/library/members/{member}', [LibraryController::class, 'updateMember'])->name('library.members.update')->middleware('permission:library.manage');
    Route::delete('/library/members/{member}', [LibraryController::class, 'destroyMember'])->name('library.members.destroy')->middleware('permission:library.manage');

    Route::get('/library/loans', [LibraryController::class, 'loans'])->name('library.loans')->middleware('permission:library.view');
    Route::post('/library/loans', [LibraryController::class, 'storeLoan'])->name('library.loans.store')->middleware('permission:library.manage');
    Route::post('/library/loans/{loan}/return', [LibraryController::class, 'returnLoan'])->name('library.loans.return')->middleware('permission:library.manage');
    Route::delete('/library/loans/{loan}', [LibraryController::class, 'destroyLoan'])->name('library.loans.destroy')->middleware('permission:library.manage');

    // Clinic
    Route::get('/clinic/visits', [ClinicController::class, 'visits'])->name('clinic.visits.index')->middleware('permission:clinic.view');
    Route::get('/clinic/visits/create', [ClinicController::class, 'createVisit'])->name('clinic.visits.create')->middleware('permission:clinic.manage');
    Route::post('/clinic/visits', [ClinicController::class, 'storeVisit'])->name('clinic.visits.store')->middleware('permission:clinic.manage');
    Route::get('/clinic/visits/{visit}/edit', [ClinicController::class, 'editVisit'])->name('clinic.visits.edit')->middleware('permission:clinic.manage');
    Route::put('/clinic/visits/{visit}', [ClinicController::class, 'updateVisit'])->name('clinic.visits.update')->middleware('permission:clinic.manage');
    Route::delete('/clinic/visits/{visit}', [ClinicController::class, 'destroyVisit'])->name('clinic.visits.destroy')->middleware('permission:clinic.manage');
    Route::post('/clinic/visits/{visit}/dispense', [ClinicController::class, 'dispense'])->name('clinic.visits.dispense')->middleware('permission:clinic.manage');

    Route::get('/clinic/medicines', [ClinicController::class, 'medicines'])->name('clinic.medicines')->middleware('permission:clinic.view');
    Route::post('/clinic/medicines', [ClinicController::class, 'storeMedicine'])->name('clinic.medicines.store')->middleware('permission:clinic.manage');
    Route::put('/clinic/medicines/{medicine}', [ClinicController::class, 'updateMedicine'])->name('clinic.medicines.update')->middleware('permission:clinic.manage');
    Route::delete('/clinic/medicines/{medicine}', [ClinicController::class, 'destroyMedicine'])->name('clinic.medicines.destroy')->middleware('permission:clinic.manage');

    Route::get('/clinic/records', [ClinicController::class, 'records'])->name('clinic.records')->middleware('permission:clinic.view');
    Route::post('/clinic/records', [ClinicController::class, 'storeRecord'])->name('clinic.records.store')->middleware('permission:clinic.manage');
    Route::put('/clinic/records/{record}', [ClinicController::class, 'updateRecord'])->name('clinic.records.update')->middleware('permission:clinic.manage');
    Route::delete('/clinic/records/{record}', [ClinicController::class, 'destroyRecord'])->name('clinic.records.destroy')->middleware('permission:clinic.manage');

    // Cafeteria / mess
    Route::get('/cafeteria/menus', [CafeteriaController::class, 'menus'])->name('cafeteria.menus')->middleware('permission:cafeteria.view');
    Route::post('/cafeteria/menus', [CafeteriaController::class, 'storeMenu'])->name('cafeteria.menus.store')->middleware('permission:cafeteria.manage');
    Route::put('/cafeteria/menus/{menu}', [CafeteriaController::class, 'updateMenu'])->name('cafeteria.menus.update')->middleware('permission:cafeteria.manage');
    Route::delete('/cafeteria/menus/{menu}', [CafeteriaController::class, 'destroyMenu'])->name('cafeteria.menus.destroy')->middleware('permission:cafeteria.manage');

    Route::get('/cafeteria/inventory', [CafeteriaController::class, 'inventory'])->name('cafeteria.inventory')->middleware('permission:cafeteria.view');
    Route::post('/cafeteria/inventory', [CafeteriaController::class, 'storeInventory'])->name('cafeteria.inventory.store')->middleware('permission:cafeteria.manage');
    Route::put('/cafeteria/inventory/{item}', [CafeteriaController::class, 'updateInventory'])->name('cafeteria.inventory.update')->middleware('permission:cafeteria.manage');
    Route::post('/cafeteria/inventory/{item}/restock', [CafeteriaController::class, 'restockInventory'])->name('cafeteria.inventory.restock')->middleware('permission:cafeteria.manage');
    Route::delete('/cafeteria/inventory/{item}', [CafeteriaController::class, 'destroyInventory'])->name('cafeteria.inventory.destroy')->middleware('permission:cafeteria.manage');

    Route::get('/cafeteria/meal-logs', [CafeteriaController::class, 'mealLogs'])->name('cafeteria.meal-logs')->middleware('permission:cafeteria.view');
    Route::post('/cafeteria/meal-logs', [CafeteriaController::class, 'storeMealLog'])->name('cafeteria.meal-logs.store')->middleware('permission:cafeteria.manage');
    Route::put('/cafeteria/meal-logs/{log}', [CafeteriaController::class, 'updateMealLog'])->name('cafeteria.meal-logs.update')->middleware('permission:cafeteria.manage');
    Route::delete('/cafeteria/meal-logs/{log}', [CafeteriaController::class, 'destroyMealLog'])->name('cafeteria.meal-logs.destroy')->middleware('permission:cafeteria.manage');

    // Reports & integration
    Route::get('/reports', ReportController::class)->name('reports.index')->middleware('permission:reports.view');
    Route::get('/reports/export', ReportExportController::class)->name('reports.export')->middleware('permission:reports.view');
    Route::get('/settings/integration', IntegrationController::class)->name('settings.integration')->middleware('permission:integrations.view');
});
