<?php
namespace Database\Seeders;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder {
    public function run(): void {
        // Security: never create a default-password admin. Require an explicit
        // ADMIN_PASSWORD in .env; otherwise skip (no admin login until set).
        $password = env('ADMIN_PASSWORD');
        if (!$password) {
            $this->command->warn('AdminSeeder skipped — set ADMIN_EMAIL + ADMIN_PASSWORD in .env to create the admin user.');
            return;
        }
        // firstOrCreate (not updateOrCreate) so a changed password is never reset on deploy.
        $admin = User::firstOrCreate(
            ['email' => env('ADMIN_EMAIL', 'admin@indiatutorsonline.com')],
            ['name' => 'IndiaTutors Admin', 'password' => $password, 'role' => 'admin']
        );
        if ($admin->role !== 'admin') $admin->update(['role' => 'admin']);

        $this->command->info('Admin user ensured: ' . $admin->email);
    }
}
