<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('book_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('code', 24)->unique();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('books', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('school_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('book_category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('author')->nullable();
            $table->string('publisher')->nullable();
            $table->unsignedSmallInteger('published_year')->nullable();
            $table->string('isbn', 32)->nullable();
            $table->string('barcode', 64)->unique();
            $table->string('shelf_location')->nullable();
            $table->string('language', 24)->default('Indonesian');
            $table->unsignedInteger('total_copies')->default(1);
            $table->unsignedInteger('available_copies')->default(1);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['school_id', 'title']);
        });

        Schema::create('library_members', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('school_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('member_code', 48)->unique();
            $table->string('member_type', 16)->default('student'); // student | employee
            $table->uuid('student_id')->nullable()->index();
            $table->uuid('employee_id')->nullable()->index();
            $table->date('joined_at')->nullable();
            $table->date('expires_at')->nullable();
            $table->unsignedSmallInteger('max_loans')->default(3);
            $table->string('status', 24)->default('active'); // active | suspended | expired
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('book_loans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('school_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('book_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('library_member_id')->constrained()->cascadeOnDelete();
            $table->date('borrowed_at');
            $table->date('due_at');
            $table->date('returned_at')->nullable();
            $table->string('status', 24)->default('borrowed'); // borrowed | returned | overdue | lost
            $table->uuid('recorded_by')->nullable()->index();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'due_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('book_loans');
        Schema::dropIfExists('library_members');
        Schema::dropIfExists('books');
        Schema::dropIfExists('book_categories');
    }
};
