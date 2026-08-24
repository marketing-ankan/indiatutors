# IndiaTutors Online

The tutoring marketplace behind **https://indiatutorsonline.com** — a Laravel 12 API with
a React 18 single-page front end, rebuilt from the original WordPress site.

Families book demos and classes, staff run the whole pipeline from a Staff Console, and
teachers, students and parents each get their own dashboard.

---

## 👉 New here? Read [`docs/HANDOVER-NEW-TEAM.md`](docs/HANDOVER-NEW-TEAM.md) first.

It covers how the system fits together, **what has just been built**, what is still open,
and the standing rules — including the ones that have bitten real deploys. Read it before
your first task.

To get the project running on your machine, follow
[`docs/LOCAL-SETUP.md`](docs/LOCAL-SETUP.md).

---

## The two things most likely to catch you out

**Pushing to `main` is deploying.** A cron on the server pulls `main` every ~5 minutes and
runs migrations against the live database. There is no deploy button and no staging site.
Day-to-day work belongs on `ankan-dev`; `main` is promoted deliberately, by its owner.

**`vendor/` and `public/build` are committed on purpose.** The shared host has no Composer
and no Node, so the dependencies and the compiled front end ship inside the repo. Change
any JS or CSS and you must run `npm run build` and commit `public/build` as well —
otherwise the backend deploys and the interface silently does not.

---

## Documentation map

| File | What it is |
|---|---|
| [`docs/HANDOVER-NEW-TEAM.md`](docs/HANDOVER-NEW-TEAM.md) | **Start here.** Current state, open decisions, standing rules. |
| [`docs/LOCAL-SETUP.md`](docs/LOCAL-SETUP.md) | Step-by-step local install, and the traps in it. |
| [`docs/ECOSYSTEM-PLAN.md`](docs/ECOSYSTEM-PLAN.md) | The owner's feature plan (A1–F8) with per-item status — the closest thing to a spec. |
| [`PHASES.md`](PHASES.md) / [`PROGRESS.md`](PROGRESS.md) | Build phases and what is done. |
| [`WEBSITE-IMPROVEMENTS.md`](WEBSITE-IMPROVEMENTS.md) | The 2026-08-07 site audit: 58 defects, what shipped, what is left for the owner. |
| [`docs/ADMIN-CRM-GAP-MAP.md`](docs/ADMIN-CRM-GAP-MAP.md) | What the Staff Console does and deliberately does not do. |
| [`docs/MATCHING-DATA-CONTRACT.md`](docs/MATCHING-DATA-CONTRACT.md) | The export contract for the external matching software. |
| [`PARITY-AUDIT.md`](PARITY-AUDIT.md) | The 297-URL audit against the original WordPress site. |
| [`docs/CHANGELOG-2026-08.md`](docs/CHANGELOG-2026-08.md) | Recent change log. |

## Stack

Laravel 12 (PHP 8.2) · MySQL in production, SQLite for local work · React 18 + Vite 5 ·
Tailwind CSS 3 · Sanctum token auth · Razorpay · Cloudflare R2 for video.

## Tests

```bash
php vendor/bin/phpunit
```

Runs against an in-memory database and does not touch your local data.

---

## A note on how this codebase is written

Comments here explain **why**, not what — usually what breaks if the code is written the
obvious way instead. When you change something, keep that habit; the reasoning is the part
that is expensive to rediscover.

The project also holds a hard line on data honesty: **never fabricate a count, rating,
testimonial or status.** If a figure cannot be counted, show nothing and say why. Two sets
of invented numbers have already had to be deleted from this site.
