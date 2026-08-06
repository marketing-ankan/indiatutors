<?php
namespace Database\Seeders;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder {
    public function run(): void {
        // Security: never create a default-password admin. Require an explicit
        // ADMIN_PASSWORD in .env; otherwise skip (no admin login until set).
        //
        // config(), NOT env(). The production deploy runs config:cache, and
        // under a cached config .env is never loaded — env() here returned
        // null on every server run, so this seeder silently skipped forever
        // and the live site had no admin while the identical code worked on
        // every dev machine. The values ride in via config/app.php, which the
        // cache bakes at deploy time.
        $password = config('app.admin_password');
        if (!$password) {
            $this->command->warn('AdminSeeder skipped — set ADMIN_EMAIL + ADMIN_PASSWORD in .env to create the admin user.');
            return;
        }
        // firstOrCreate (not updateOrCreate) so a changed password is never reset on deploy.
        $admin = User::firstOrCreate(
            ['email' => config('app.admin_email')],
            ['name' => 'IndiaTutors Admin', 'password' => $password, 'role' => 'admin']
        );
        if ($admin->role !== 'admin') $admin->update(['role' => 'admin']);

        $this->command->info('Admin user ensured: ' . $admin->email);
    }
}
