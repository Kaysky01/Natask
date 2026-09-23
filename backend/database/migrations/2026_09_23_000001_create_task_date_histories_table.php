<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('task_date_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type', 50)->default('due_date_changed'); // start_date_changed, due_date_changed, deadline_extended, dates_set
            $table->date('old_start_date')->nullable();
            $table->date('new_start_date')->nullable();
            $table->date('old_due_date')->nullable();
            $table->date('new_due_date')->nullable();
            $table->integer('extension_days')->nullable();
            $table->string('reason', 500)->nullable();
            $table->timestamps();

            $table->index(['task_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_date_histories');
    }
};
