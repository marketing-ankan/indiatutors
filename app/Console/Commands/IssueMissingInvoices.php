<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;

/**
 * Issue invoices for sales that were recorded as paid but never got one.
 *
 * The status change and the invoice are two separate writes — Eloquent commits
 * the first, then fires the hook that does the second — so anything that fails
 * in between (a deadlock, a lock-wait timeout, a dropped connection, a PHP
 * timeout) leaves a completed sale with no document and nothing on screen to
 * say so. Re-saving does not help: issuance keys off the TRANSITION into paid,
 * and a row that is already paid never transitions again.
 *
 * A command rather than a scheduled job, because this host runs a five-minute
 * cron that pulls and deploys and nothing else — a job registered here would
 * simply never run. Worth adding to the deploy script once somebody has
 * confirmed it behaves on real data.
 */
class IssueMissingInvoices extends Command
{
    protected $signature   = 'invoices:issue-missing {--dry-run : List them without issuing}';
    protected $description = 'Issue invoice numbers for paid orders that never got one';

    public function handle(): int
    {
        $pending = Order::where('status', 'paid')->whereNull('invoice_number')->orderBy('id')->get();

        if ($pending->isEmpty()) {
            $this->info('Every paid order has an invoice. Nothing to do.');
            return self::SUCCESS;
        }

        $this->warn("{$pending->count()} paid order(s) have no invoice number:");
        foreach ($pending as $o) {
            $this->line(sprintf('  %-16s %-28s %s', $o->order_number ?: "#{$o->id}", $o->email,
                $o->created_at?->format('Y-m-d H:i')));
        }

        if ($this->option('dry-run')) {
            $this->comment('Dry run — nothing issued.');
            return self::SUCCESS;
        }

        $issued = Order::issueMissingInvoices();
        $this->info("Issued {$issued} invoice number(s).");

        return self::SUCCESS;
    }
}
