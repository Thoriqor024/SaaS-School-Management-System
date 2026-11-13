<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('school_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('nisn', 32)->nullable()->unique();
            $table->string('nis', 32)->nullable();
            $table->string('full_name');
            $table->string('nickname')->nullable();
            $table->string('gender', 16)->default('male');
            $table->string('birth_place')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('religion', 32)->nullable();
            $table->string('blood_type', 8)->nullable();
            $table->string('grade_level', 16)->nullable();
            $table->string('classroom', 32)->nullable();
            $table->string('enrollment_year', 8)->nullable();
            $table->date('admission_date')->nullable();
            $table->string('status', 24)->default('active'); // active | inactive | graduated | transferred
            $table->string('email')->nullable();
            $table->string('phone', 32)->nullable();
            $table->text('address')->nullable();
            $table->string('guardian_name')->nullable();
            $table->string('guardian_relation', 24)->nullable();
            $table->string('guardian_phone', 32)->nullable();
            $table->string('guardian_email')->nullable();
            $table->string('guardian_occupation')->nullable();
            $table->string('photo_path')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['school_id', 'status']);
            $table->index(['branch_id', 'grade_level']);
            $table->index('full_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
