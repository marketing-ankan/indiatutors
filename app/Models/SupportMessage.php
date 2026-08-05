<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupportMessage extends Model
{
    protected $fillable = ['ticket_id', 'user_id', 'is_staff', 'author_label', 'body'];
    protected $casts    = ['is_staff' => 'boolean'];

    public function ticket() { return $this->belongsTo(SupportTicket::class, 'ticket_id'); }
    public function author() { return $this->belongsTo(User::class, 'user_id'); }
}
