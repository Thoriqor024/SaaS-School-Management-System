<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transport_vehicles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('school_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('plate_number', 24)->unique();
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->string('type', 24)->default('bus'); // bus | minibus | van | car
            $table->unsignedSmallInteger('capacity')->default(30);
            $table->unsignedSmallInteger('year')->nullable();
            $table->string('condition', 24)->default('good');
            $table->string('status', 24)->default('active'); // active | maintenance | inactive
            $table->uuid('driver_employee_id')->nullable()->index();
            $table->string('attendant_name')->nullable();
            $table->date('tax_expiry')->nullable();
            $table->date('insurance_expiry')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('transport_routes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('school_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('transport_vehicle_id')->nullable()->constrained()->nullOnDelete();
            $table->uuid('driver_employee_id')->nullable()->index();
            $table->string('code', 32);
            $table->string('name');
            $table->string('start_point')->nullable();
            $table->string('end_point')->nullable();
            $table->string('departure_time', 8)->nullable();
            $table->string('return_time', 8)->nullable();
            $table->decimal('distance_km', 8, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['school_id', 'code']);
        });

        Schema::create('route_stops', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('transport_route_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('address')->nullable();
            $table->unsignedSmallInteger('sequence')->default(1);
            $table->string('pickup_time', 8)->nullable();
            $table->string('dropoff_time', 8)->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->timestamps();
        });

        Schema::create('transport_passengers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('student_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('transport_route_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('route_stop_id')->nullable()->constrained()->nullOnDelete();
            $table->string('direction', 16)->default('both'); // both | pickup | dropoff
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['student_id', 'transport_route_id']);
        });

        Schema::create('passenger_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('school_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('transport_route_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained()->cascadeOnDelete();
            $table->date('log_date');
            $table->string('direction', 16)->default('pickup');
            $table->string('status', 24)->default('picked_up'); // picked_up | dropped_off | absent | late
            $table->uuid('recorded_by')->nullable()->index();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['log_date', 'transport_route_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('passenger_logs');
        Schema::dropIfExists('transport_passengers');
        Schema::dropIfExists('route_stops');
        Schema::dropIfExists('transport_routes');
        Schema::dropIfExists('transport_vehicles');
    }
};
