<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medical_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('school_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('patient_type', 16)->default('student'); // student | employee
            $table->uuid('student_id')->nullable()->index();
            $table->uuid('employee_id')->nullable()->index();
            $table->string('blood_type', 8)->nullable();
            $table->text('allergies')->nullable();
            $table->text('chronic_conditions')->nullable();
            $table->text('current_medications')->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone', 32)->nullable();
            $table->string('insurance_provider')->nullable();
            $table->string('insurance_number', 48)->nullable();
            $table->date('last_checkup_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('clinic_visits', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('school_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('patient_type', 16)->default('student');
            $table->uuid('student_id')->nullable()->index();
            $table->uuid('employee_id')->nullable()->index();
            $table->dateTime('visit_date');
            $table->string('complaint');
            $table->decimal('temperature', 4, 1)->nullable();
            $table->string('blood_pressure', 16)->nullable();
            $table->unsignedSmallInteger('pulse')->nullable();
            $table->decimal('weight', 5, 2)->nullable();
            $table->decimal('height', 5, 2)->nullable();
            $table->text('diagnosis')->nullable();
            $table->text('treatment')->nullable();
            $table->string('disposition', 32)->default('returned_to_class'); // returned_to_class | sent_home | referred_to_hospital | observation
            $table->uuid('attended_by_employee_id')->nullable()->index();
            $table->date('follow_up_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['visit_date', 'school_id']);
        });

        Schema::create('medicines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('school_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('category', 32)->default('other');
            $table->string('unit', 24)->default('tablet');
            $table->integer('stock')->default(0);
            $table->integer('min_stock')->default(10);
            $table->date('expiry_date')->nullable();
            $table->string('batch_number', 48)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['school_id', 'name']);
        });

        Schema::create('medicine_dispenses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('clinic_visit_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('medicine_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('quantity')->default(1);
            $table->string('dosage_instructions')->nullable();
            $table->dateTime('dispensed_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medicine_dispenses');
        Schema::dropIfExists('medicines');
        Schema::dropIfExists('clinic_visits');
        Schema::dropIfExists('medical_records');
    }
};
