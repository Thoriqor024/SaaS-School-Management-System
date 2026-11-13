<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cafeteria_menus', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('school_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->date('menu_date');
            $table->string('meal_type', 16)->default('lunch'); // breakfast | lunch | snack | dinner
            $table->text('description')->nullable();
            $table->boolean('is_published')->default(false);
            $table->uuid('created_by')->nullable()->index();
            $table->timestamps();

            $table->index(['menu_date', 'school_id']);
        });

        Schema::create('menu_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('cafeteria_menu_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('category', 24)->default('main'); // main | side | fruit | drink | dessert
            $table->unsignedSmallInteger('calories')->nullable();
            $table->string('allergens')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('cafeteria_inventory_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('school_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('category', 32)->default('dry_goods'); // dry_goods | fresh | beverage | utensil | other
            $table->string('unit', 24)->default('kg');
            $table->decimal('quantity', 10, 2)->default(0);
            $table->decimal('min_quantity', 10, 2)->default(0);
            $table->string('supplier')->nullable();
            $table->date('expiry_date')->nullable();
            $table->date('last_restocked_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['school_id', 'category']);
        });

        Schema::create('meal_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('school_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->uuid('cafeteria_menu_id')->nullable()->index();
            $table->date('meal_date');
            $table->string('meal_type', 16)->default('lunch');
            $table->unsignedInteger('students_served')->default(0);
            $table->unsignedInteger('staff_served')->default(0);
            $table->unsignedInteger('guests_served')->default(0);
            $table->text('notes')->nullable();
            $table->uuid('recorded_by')->nullable()->index();
            $table->timestamps();

            $table->index(['meal_date', 'school_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meal_logs');
        Schema::dropIfExists('cafeteria_inventory_items');
        Schema::dropIfExists('menu_items');
        Schema::dropIfExists('cafeteria_menus');
    }
};
