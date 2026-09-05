<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_fonnte_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->unique()->constrained()->onDelete('cascade');
            $table->text('api_token')->nullable();
            $table->string('api_endpoint')->default('https://api.fonnte.com/send');
            $table->boolean('is_enabled')->default(false);
            $table->string('target_type')->default('group'); // 'group', 'personal', 'both'
            $table->string('group_target')->nullable();
            $table->boolean('notify_task_created')->default(true);
            $table->boolean('notify_task_status_changed')->default(true);
            $table->boolean('notify_task_commented')->default(true);
            $table->boolean('notify_member_joined')->default(true);
            $table->string('sender_number')->nullable();
            $table->string('device_status')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_fonnte_settings');
    }
};
