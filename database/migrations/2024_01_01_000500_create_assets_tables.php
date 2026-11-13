<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('code', 32)->unique();
            $table->string('kind', 24)->default('fixed'); // fixed | consumable
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('assets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('school_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('asset_category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('asset_code', 48)->unique();
            $table->string('name');
            $table->string('type', 24)->default('fixed'); // fixed | consumable
            $table->unsignedInteger('quantity')->default(1);
            $table->string('unit', 24)->default('unit');
            $table->string('condition', 24)->default('good'); // good | minor_damage | major_damage | broken
            $table->string('status', 24)->default('in_use'); // in_use | in_storage | maintenance | retired
            $table->string('location')->nullable();
            $table->uuid('assigned_to_employee_id')->nullable()->index();
            $table->date('purchase_date')->nullable();
            $table->decimal('purchase_price', 15, 2)->nullable();
            $table->date('warranty_until')->nullable();
            $table->date('last_checked_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['school_id', 'status']);
            $table->index(['branch_id', 'condition']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assets');
        Schema::dropIfExists('asset_categories');
    }
};
