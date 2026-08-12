<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * An alternate sign-in address. The primary lives on users.email; this holds
 * only the extras, so the two can never disagree about which is primary.
 */
class UserEmail extends Model
{
    protected $fillable = ['user_id', 'email'];

    public function user() { return $this->belongsTo(User::class); }
}
