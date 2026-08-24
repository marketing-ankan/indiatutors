# IndiaTutors — Handover & Current State

_Written 2026-08-24, at the point where the project changes hands._

**The plan:** the boss takes over IndiaTutors. **Ankan keeps push/deploy control** —
`main` deploys itself to the live site, so merging to `main` is the deploy button and
it stays Ankan's call, every time. Daily work happens on `ankan-dev`.

A sister project, **Clavira**, lives on the *same Hostinger account* as a different
website and is handed to a different developer. In hPanel, always check the "Website
name" dropdown: IndiaTutors is **indiatutorsonline.com** (site id `YFZg32xAC`);
clavira.in (site id `fLlafAQ5m`) is NOT this project. Keys, crons and databases added
under the wrong site silently do nothing here.

**How to use this file:** read Part A and Part B (Part B is real, unresolved state —
read it before your first task). Part C is setup, Part D is the standing rules.

---

## Part A — How the system works

Three copies, changes flow one way:

```
Your PC (XAMPP, localhost)  →  GitHub: marketing-ankan/indiatutors  →  Hostinger (LIVE)
      you edit here            ankan-dev = daily work                  a cron pulls `main`
                               main      = LIVE                        every ~5 min and
                               (Ankan controls main)                   deploys automatically
```

Four facts that explain most of the rest:

1. **Pushing to `main` IS deploying.** A cron runs `deploy/hostinger-deploy.sh` (a shim
   that execs `deploy/run.sh`, which execs `deploy/deploy.sh`). It pulls `origin main`
   `--ff-only`, syncs the built assets into the web root, runs
   `php artisan migrate --force` (`deploy/deploy.sh:267`) **against the live database**,
   and rebuilds caches. There is no deploy button and no staging environment.

2. **`vendor/` and `public/build` are committed on purpose.** The shared host has no
   Composer and no Node. The PHP dependencies and the compiled front end ship inside the
   repo. So: **change any JS/CSS ⇒ `npm run build` ⇒ commit `public/build` too**, or the
   backend ships and the interface does not.

3. **Migrations run unattended on live data.** They must be additive and safe to re-run.
   See Part D — this bit an actual deploy and the reason is worth understanding.

4. **The stack:** Laravel 12 (PHP 8.2), MySQL on the server, React 18 + Vite 5 SPA,
   Tailwind 3. Locally it usually runs on SQLite — see Part C.

### Things that are NOT in the repo (hand over separately)

- The server `.env` — database password, mail credentials, and the API keys when they go
  live. It exists only on the Hostinger server.
- **hPanel access**, via a collaborator login on the `connect@winquestonline.com`
  account. Without hPanel + SSH you cannot administer the server.
- SSH uses **port 65002**, and at least one local ISP blocks it — if `ssh` hangs forever,
  retry on a **phone hotspot**.

### Where the other documents are

| File | What it is |
|---|---|
| `docs/LOCAL-SETUP.md` | Step-by-step local install. **Start here to get running.** |
| `docs/ECOSYSTEM-PLAN.md` | The owner's feature plan (A1–F8) with per-item status. The closest thing to a spec. |
| `PHASES.md` / `PROGRESS.md` | Build phases and what is done. |
| `WEBSITE-IMPROVEMENTS.md` | The 2026-08-07 site audit — 58 defects, with what shipped and what is left for the owner. |
| `docs/ADMIN-CRM-GAP-MAP.md` | What the admin console does and does not do. |
| `docs/CHANGELOG-2026-08.md` | Recent change log. |

---

## Part B — Current state (2026-08-24). Read before your first task.

### What just shipped

A **material distribution chain**, end to end. Before this, the `course_materials` table
and its admin endpoints existed but **nothing in the interface ever called them** — an
admin had no way to upload or hand out a single file.

There was a second, deeper problem. A teacher could only see material for a course they
already had an active enrolment on. A newly approved teacher — or one whose enrolment
came from a free-text demo with no `course_id`, which is most of them — opened an empty
shelf. That is backwards, because the material is what they *prepare from*.

What now exists:

- **`teacher_course_grants`** — the explicit staff act of handing a teacher a course, so
  access no longer waits on a student being assigned.
- **`material_handovers`** — the teacher → student hop: one file, one learner, with
  `first_viewed_at` / `downloaded_at` / `download_count`, so "does this child have this
  deck, and did they open it?" is answerable.
- **Admin → Materials tab** — teachers filtered by subject and by the ten root
  categories, showing upcoming classes and classes already taken, with material handout
  per teacher.
- **Admin → Materials → Handover trail** — both hops on one clock, with delivery state.
- **Teacher / student / parent views** — a send flow, a "sent by your teacher" shelf, and
  a per-child view of what landed and whether it was opened.

Student access is only ever *added to*: a learner reads a file via their course **or**
via a handover addressed to them. Granting a teacher a course hands no student anything,
and unpublished material still reaches nobody.

All four role interfaces were driven by hand end to end (send → receive → open → trail)
and swept at 360 / 768 / 1024 px.

### Two decisions still open — these are owner calls, not bugs

1. **Siblings who share one login.** `material_handovers` is unique on
   `(course_material_id, to_user_id)`. Two children with no logins of their own resolve
   to the same guardian account, so the second child's send is reported as *skipped*
   rather than silently overwriting the first. Adding `student_id` to that index records
   both — but then one login opening one file cannot say *which* child read it, and a
   read receipt naming a child who never looked is exactly the sort of invented figure
   this project has twice had to delete. Decide which trade you want.

2. **Subject matching is deliberately strict.** `app/Support/SubjectCourseMap.php`
   requires a subject to *head* the course name, because `\bScience\b` otherwise matches
   "Social Science". Real misses follow — `Violin` does not reach "Carnatic Violin". A
   miss is therefore never presented as a catalogue gap; the interface says "search the
   catalogue" and offers a give-any-course-by-hand picker. Loosening it re-opens the
   false-match problem.

### Known traps that are still live

- **The PWA service worker serves a stale shell.** If a change "didn't apply", this is
  usually why — the browser is serving a cached bundle. Unregistering the worker is often
  not enough; a cache-busting query (`?cb=1`) breaks through. Expect some users to keep
  seeing the old interface for a while after a deploy.
- **Tutor coverage is thin.** Measured on production: 45 of 110 courses have a tutor; 65
  subjects have none, including all of Maths. Measure against production, not the local
  database, which contains a fixture tutor that hides it.
- Older open items — testimonials, per-course ratings, the legal entity name, the stale
  PayPal FAQ copy — are listed in `WEBSITE-IMPROVEMENTS.md` and are owner decisions.

---

## Part C — Getting it running locally

Follow **`docs/LOCAL-SETUP.md`**; it is current and covers the whole install. The short
version of what is unusual:

- The fastest path is **SQLite**, not MySQL. There is a ready preview database at
  `storage/app/preview.sqlite` carrying real-shaped data (14 tutors, 110 courses).
- Run it with a launch config from `.claude/launch.json` — e.g. `india-verify-2` serves
  on `http://localhost:8032` against that preview database.
- The local MySQL database named `indiatutors` is a **stale dump**. Do not treat it as
  truth, and do not migrate it — verify on a throwaway database instead.
- `php vendor/bin/phpunit` runs the suite (218 tests at the time of writing). Tests use
  an in-memory database and do not touch your data.

---

## Part D — Standing rules

Learned the hard way on this project. Follow them on every task.

### Branch & deploy discipline

- **Work on `ankan-dev`. Push to `ankan-dev` by default.** Never push or merge to `main`
  unless the person asking IS Ankan and says so explicitly. Merging to `main` deploys to
  a live site with real families on it.
- The merge procedure, when explicitly requested:

  ```bash
  git checkout main
  git pull --ff-only origin main
  git merge ankan-dev
  git push origin main
  git checkout ankan-dev
  ```

  Then **verify** — a push that pulls but does not finish deploying fails *silently on
  the website itself*. Compare the bundle the live site serves against
  `public/build/manifest.json`:

  ```bash
  curl -s https://indiatutorsonline.com/ | grep -oE '/build/assets/main-[A-Za-z0-9_-]+\.js'
  ```

  If it does not match the manifest after ~10 minutes, the deploy did not land.
- **Never force-push and never rebase published branches** — the server pull is
  `--ff-only`, and rewritten history breaks deploys until fixed by hand.
- Check the push scope before merging. `git diff --name-only origin/main HEAD -- database/migrations/`
  tells you which migrations will run on live. It is frequently more than you think.

### Migrations must survive being interrupted

This is the one that actually broke a deploy, so it is worth the paragraph.

**SQLite has transactional DDL; MySQL does not.** Every `CREATE`/`ALTER` on MySQL
auto-commits, so a `migrate` killed part-way leaves the objects it already made with no
row in the `migrations` table to record them. The retry dies on "table already exists" —
and dies the same way every five minutes, forever. Everything had been verified on
SQLite, which hid this completely.

So: **guard every object individually** (`hasTable` / `getColumnListing` / `hasIndex`),
not just the table. A migration is often many statements — one `ALTER` per column, then
the unique indexes as their own statements — and a kill between them leaves a column
present but unconstrained, which a table-level guard then skips past permanently and
silently. Any backfill must be **resumable**, not merely idempotent, and must read in
chunks rather than loading a whole table into memory.

### Build & assets

- **Front-end change ⇒ `npm run build` ⇒ commit `public/build`.** The server serves what
  git carries.
- **Never hand-edit anything inside `public/build`** — `vite build` deletes and
  regenerates that folder. The sources of truth are `resources/` and `public/images`.
- **`vendor/` is committed.** Run `composer install` (honors the lock file), never
  `composer update` unless explicitly asked — a casual update ships a huge vendor diff
  straight to production.
- `deploy/hostinger-deploy.sh` is a shim that the running deploy may pull mid-flight.
  If the deploy scripts ever need editing, understand `deploy/run.sh`'s comments first.

### Data honesty

This project has twice had to delete invented figures, so it holds a hard line:

- **Never fabricate a count, rating, testimonial or status.** If a number cannot be
  counted, show nothing and say why. An empty state is a real answer.
- **Displayed pricing is owner-owned.** Report inconsistencies; never change them.
  Fixing billing so it matches what is displayed is fine.
- Anything involving a child's data — achievements, photos, read receipts — needs
  explicit consent and defaults to private.

### Secrets

`.env` and any credentials file never go into git. If a task seems to need a secret
committed, stop and ask.

---

## Part E — Handover checklist

- [ ] Server `.env` and credentials handed over privately (they are NOT in the repo)
- [ ] hPanel collaborator access granted, and the **indiatutorsonline.com** site
      (`YFZg32xAC`) opens — not clavira.in
- [ ] SSH access confirmed on port 65002 (phone hotspot if the ISP blocks it)
- [ ] GitHub access to `marketing-ankan/indiatutors` (push `ankan-dev`; `main` stays
      Ankan's)
- [ ] Local setup completed per `docs/LOCAL-SETUP.md`, site loads, tests pass
- [ ] The two open material-distribution decisions in Part B decided
- [ ] Tutor coverage gap understood (45/110 courses covered) and a recruiting plan owned
- [ ] Owner-pending items known: legal entity name, testimonials, per-course ratings,
      the PayPal FAQ copy, and the API keys still outstanding
