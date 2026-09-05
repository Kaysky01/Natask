<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Keep one local login account; projects and tasks are created by users.
        User::firstOrCreate(
            ['email' => 'admin@natask.com'],
            [
                'name' => 'Project Owner',
                'password' => Hash::make('password'),
                'timezone' => 'UTC',
            ]
        );
    }
}
