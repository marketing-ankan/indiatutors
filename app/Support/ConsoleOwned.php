<?php
namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

/**
 * "A human edited this in the Staff Console, so the seeder must not touch it."
 *
 * The content seeders import a source file AND prune anything not in it. That is
 * correct for catalogue rows nobody has touched, and destructive for anything a
 * human has authored or corrected — which is every row the console can write.
 *
 * Marking is deliberately explicit rather than a model event: the seeders write
 * through updateOrCreate on the same models, so a saved() hook would mark every
 * row the seeder itself touched and the protection would mean nothing.
 */
class ConsoleOwned
{
    public const COLUMN = 'console_edited_at';

    /** Call after any successful console write. Safe before the migration runs. */
    public static function mark(?Model $model): void
    {
        if (!$model || !self::supported($model->getTable())) return;

        // Not in $fillable on purpose — ownership is set by the controller that
        // performed the write, never by a field in the request payload.
        $model->forceFill([self::COLUMN => now()])->saveQuietly();
    }

    /** Rows the seeder still owns: never edited in the console. */
    public static function scopeSeederOwned(Builder $query): Builder
    {
        return self::supported($query->getModel()->getTable())
            ? $query->whereNull(self::COLUMN)
            : $query;
    }

    public static function isOwned(?Model $model): bool
    {
        return $model
            && self::supported($model->getTable())
            && $model->getAttribute(self::COLUMN) !== null;
    }

    /** The column is added by a migration, so every caller must tolerate its absence. */
    public static function supported(string $table): bool
    {
        static $cache = [];
        return $cache[$table] ??= Schema::hasColumn($table, self::COLUMN);
    }
}
