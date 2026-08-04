<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Reference geography — see the create_pincodes_table migration for why. */
class Pincode extends Model
{
    protected $primaryKey = 'pincode';
    public $incrementing  = false;
    protected $keyType    = 'string';

    protected $fillable = ['pincode', 'district', 'state', 'localities', 'latitude', 'longitude', 'source'];

    protected $casts = [
        'localities' => 'array',
        'latitude'   => 'float',
        'longitude'  => 'float',
    ];

    public function hasCoordinates(): bool
    {
        return $this->latitude !== null && $this->longitude !== null;
    }
}
