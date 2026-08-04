<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLES = ['parent', 'student', 'teacher', 'admin'];

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'phone_country_code',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // Relationships
    public function students() { return $this->hasMany(Student::class); }
    public function videoEntitlements() { return $this->hasMany(VideoEntitlement::class); }
    public function teacherProfile() { return $this->hasOne(TeacherProfile::class); }
    public function tutor() { return $this->hasOne(Tutor::class); }
    public function courseProposals() { return $this->hasMany(CourseProposal::class); }
    public function appNotifications() { return $this->hasMany(AppNotification::class); }
    public function kycDocuments() { return $this->hasMany(KycDocument::class); }
    public function demoRequests() { return $this->hasMany(DemoRequest::class); }
    public function enrollments() { return $this->hasManyThrough(Enrollment::class, Student::class); }
    public function orders() { return $this->hasMany(Order::class); }
    /** The student profile this account IS, as opposed to the ones it owns. */
    public function studentProfile() { return $this->hasOne(Student::class, 'account_user_id'); }
    /** Home-tuition operating record — address, radius, offerings, availability. */
    public function physicalProfile() { return $this->hasOne(PhysicalTeachingProfile::class); }
    public function tuitionRequirements() { return $this->hasMany(TuitionRequirement::class); }

    // Role helpers
    public function hasRole(string $role): bool { return $this->role === $role; }
    public function isParent(): bool { return $this->role === 'parent'; }
    public function isStudent(): bool { return $this->role === 'student'; }
    public function isTeacher(): bool { return $this->role === 'teacher'; }
    public function isAdmin(): bool { return $this->role === 'admin'; }
}
