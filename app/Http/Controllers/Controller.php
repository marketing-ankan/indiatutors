<?php
namespace App\Http\Controllers;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

abstract class Controller
{
    /**
     * Serialise a paginator as {data, meta} — the shape the admin console's
     * Pager component reads.
     *
     * Returning a raw paginator from a controller produces a FLAT payload
     * (`current_page`, `data`, `total`, … at the top level) with no `meta` key,
     * while returning a Resource collection produces {data, links, meta}. The
     * console has both, so on the raw ones its Pager found no `meta`, read
     * last_page as 1 and rendered nothing — paging simply did not exist on those
     * tabs, and nothing errored to say so.
     *
     * @param  array<int,mixed>|null  $items  replaces the page's own items when
     *                                        the caller has already transformed them
     */
    protected function paginated(LengthAwarePaginator $page, ?array $items = null, array $extra = []): array
    {
        return [
            'data' => $items ?? $page->items(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page'    => $page->lastPage(),
                'per_page'     => $page->perPage(),
                'total'        => $page->total(),
            ],
        ] + $extra;
    }
}
