<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder {
    public function run(): void {
        $this->call([
            CourseSeeder::class,
            GroupClassSeeder::class,   // must follow CourseSeeder — it matches cards to courses by slug
            TutorSeeder::class,
            PostSeeder::class,
            AdminSeeder::class,
            PincodeSeeder::class,
        ]);
    }
}
