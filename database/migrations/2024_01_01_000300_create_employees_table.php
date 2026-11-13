<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('school_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('employee_number', 48)->unique();
            $table->string('full_name');
            $table->string('nickname')->nullable();
            $table->string('gender', 16)->default('male');
            $table->string('birth_place')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('religion', 32)->nullable();
            $table->string('marital_status', 24)->nullable();
            $table->string('blood_type', 8)->nullable();
            $table->string('type', 24)->default('staff'); // teacher | staff | general
            $table->string('position')->nullable();
            $table->string('department')->nullable();
            $table->string('employment_status', 24)->default('permanent'); // permanent | contract | part_time | intern
            $table->date('join_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('education_level', 32)->nullable();
            $table->string('major')->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 32)->nullable();
            $table->text('address')->nullable();
            $table->string('photo_path')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['school_id', 'type']);
            $table->index('full_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
