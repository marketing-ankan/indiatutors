# Local setup

Written for an assistant setting this project up on a fresh Windows machine. It
is deliberately literal: every step below is one someone has actually got wrong
here, and the notes explain *why* rather than just what, because the traps are
not guessable from the code.

If you are the assistant reading this: follow it top to bottom, and do not
substitute the "normal Laravel" version of a step. Several of them are normal
Laravel steps that are **wrong for this repository**.

---

## 0. What is unusual about this project

Read this first. Four things differ from a standard Laravel + Vite app, and
each one breaks a habit:

| | Here | Why |
|---|---|---|
| `vendor/` | **committed to git** | The production host has no Composer. Never run `composer install` — it can pull versions the server will never have. |
| `public/build/` | **committed to git** | The host has no Node either, so built assets ship in the repo. |
| `node_modules/` | ignored | You still `npm install` locally to be able to *build*. |
| `.env` | ignored | You must create it. There is a `.env.example` to copy. |

Consequence: **you never need Composer**, you **do** need Node, and a fresh
clone already has a working `vendor/` and a working `public/build/`.

---

## 1. Prerequisites

- **PHP 8.2** — this machine uses XAMPP at `C:\xampp2\php\php.exe`.
  Do not assume `php` is on PATH; on the reference machine it is not.
  Call it by full path, or check with `where php`.
- **Node 20+** (reference machine: v22.18.0, npm 11.17.0)
- **Git**

Verify:

```bash
C:\xampp2\php\php.exe -v
node -v && npm -v
```

---

## 2. Clone and install

```bash
git clone https://github.com/marketing-ankan/indiatutors.git
cd indiatutors
npm install
```

`npm install` is the only install step. **Do not run `composer install`.**

---

## 3. Create `.env`

Copy the template, then generate a key:

```bash
cp .env.example .env
C:\xampp2\php\php.exe artisan key:generate
```

Then set these by hand in `.env`:

```dotenv
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8032
APP_TIMEZONE=Asia/Kolkata

# SQLite is the fastest way in — see step 4 for why this is a full absolute path
DB_CONNECTION=sqlite
DB_DATABASE=C:\xampp2\htdocs\indiatutors\storage\app\preview.sqlite

# Lets you sign in to the Staff Console locally. Any value you like.
ADMIN_EMAIL=admin@example.test
ADMIN_PASSWORD=LocalAdmin@2026

MAIL_MAILER=log
```

> **Trap:** `ADMIN_PASSWORD` is taken **literally**. On production someone wrote
> `ADMIN_PASSWORD=<Winquest@2026>` meaning it as a placeholder, and the angle
> brackets became part of the password. Do not wrap the value in brackets or
> quotes you do not want in the password.

---

## 4. Create the database

SQLite needs the file to exist before migrating:

```bash
# Git Bash
touch storage/app/preview.sqlite
```

```powershell
# PowerShell
New-Item -ItemType File storage\app\preview.sqlite
```

Then:

```bash
C:\xampp2\php\php.exe artisan migrate --force
C:\xampp2\php\php.exe artisan db:seed --force
```

The seeders populate 110 courses, 13 tutors, categories, pincodes and the
admin account. They are fingerprint-gated, so re-running is cheap and safe.

> **Why an absolute path in `DB_DATABASE`:** the dev server is launched with the
> connection set as an environment variable (step 6). A relative path resolves
> differently depending on the working directory of whatever launched it, and
> you end up silently migrating one file and serving another. Absolute removes
> the whole class of confusion.

---

## 5. Build the front end

```bash
npm run build
```

That runs three things: an asset-version stamp, `vite build`, then a copy of
`public/images` into `public/build/images`.

> **Trap — never edit anything under `public/build/`.** It is the *output*
> directory and `vite build` empties it. `public/images/` is the source; the
> build copies it across. Editing the copy has cost a redo here before.

There is a `npm run dev` (plain Vite) but the workflow used in this repo is
**build, then serve** — the Laravel dev server serves the built assets, so
what you test is what production runs.

---

## 6. Run it

The repo ships `.claude/launch.json`. Use the entry named **`india-verify-2`**:

- runs `php artisan serve` on **port 8032**
- forces `DB_CONNECTION=sqlite` and the preview database path

An assistant with preview tooling should start it by name rather than running a
server from the shell. Equivalent by hand:

```bash
DB_CONNECTION=sqlite \
DB_DATABASE=C:/xampp2/htdocs/indiatutors/storage/app/preview.sqlite \
C:/xampp2/php/php.exe artisan serve --host=127.0.0.1 --port=8032
```

Open <http://localhost:8032>.

> `launch.json` has accumulated entries from other projects and older sessions
> (`clavira`, `lms`, `frontend`, `backend`). Ignore them. Only
> **`india-verify-2`** is current for this repo.

---

## 7. Create test logins

The only account the seeders create is the admin. For parent, student and
teacher dashboards there is a dev-only fixture seeder:

```bash
C:\xampp2\php\php.exe artisan db:seed --class=DevFixtureSeeder --force
```

Gives you, all with the password `devpassword`:

| Email | What it exercises |
|---|---|
| `parent@example.test` | a parent with two children, an enrolment, class history |
| `parent-new@example.test` | a brand-new parent — the onboarding path |
| `student@example.test` | a student linked to a child record |
| `teacher@example.test` | an **approved** teacher with a timetable and a demo |
| `teacher-pending@example.test` | a teacher **awaiting approval** — its own screen |

Admin is whatever you set as `ADMIN_EMAIL` / `ADMIN_PASSWORD` in step 3.

`DevFixtureSeeder` refuses to run when `APP_ENV=production` and is deliberately
absent from the deploy's seeder list, so it can never reach the live site.

---

## 8. Run the tests

```bash
C:\xampp2\php\php.exe vendor/bin/phpunit
```

Expect **134 passing**. PHPUnit is inside the committed `vendor/`, so this works
without Composer. Tests use their own SQLite database and will not touch the
one you are serving.

---

## The traps, collected

These are the ones that have actually cost time here. An assistant that reads
only this section will still avoid most of the pain.

**1. Two databases exist, and a migration only lands in one.**
If the app is served from `preview.sqlite` but you ran `artisan migrate`
with the default `.env` pointed at MySQL, the server keeps 500ing on a table
you just created. Whenever you add a migration, run it against **whichever
database the running server is using** — set `DB_CONNECTION`/`DB_DATABASE`
in the environment for that command, or keep `.env` pointed at SQLite so
there is only one.

**2. The service worker serves a stale bundle.**
"My change did not apply" is usually this, not your change. The PWA service
worker caches `/build/*` aggressively. To confirm, compare the script the page
loaded with the built one:

```javascript
[...document.querySelectorAll('script[src]')].map(s => s.src.split('/').pop())
// versus the `file` entries in /build/manifest.json
```

If they differ, clear it:

```javascript
(async () => {
  for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
  for (const k of await caches.keys()) await caches.delete(k);
  location.reload();
})()
```

A hard reload (Ctrl+Shift+R) usually does it too.

**3. `php artisan tinker` hangs when given a file argument.**
`artisan tinker script.php` never returns here. Use `--execute` for one-liners,
or for anything longer write a standalone script that boots the framework:

```php
<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
// ... your code
```

**4. Bash heredocs mangle PHP containing backticks.**
Writing a PHP file via `cat > file <<'PHP'` strips backticks in this
environment, which silently corrupts regexes like `` /`{1,3}/ ``. Use the
editor/Write tool for PHP files, or build the string with `chr(96)`.

**5. Timezone is `Asia/Kolkata`, and datetimes are stored naive.**
The API sends `"2026-08-19 11:50:18"` already in IST. Handing that to JavaScript
`new Date()` lets the browser read it as UTC and shifts it by a day. Format by
slicing the string, or pin explicitly:

```javascript
new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
```

This exact bug has been fixed three separate times in this codebase.

**6. A field the form sends must be returned by the API resource.**
If a form writes `grades` but the resource does not return it, it reads back as
`undefined` and the next save wipes it. When you add a field, add it in **both**
places, then prove the round-trip: save, reload, save again, check the value
survived.

**7. Config cache hides `.env` edits.**
Locally, run `artisan config:clear` after editing `.env`. On production the
cache is only rebuilt by a deploy, which is why "I changed the server .env and
nothing happened" is a recurring report.

---

## Working rules for this repo

- **Displayed pricing is owner-owned.** Report inconsistencies; never change a
  price, rate or range. See `resources/js/data/homeLive.js`.
- **Placeholder ratings and testimonials are deliberate.** They are replaced one
  by one as real ones arrive. Do not delete them to "fix" an audit finding.
- **Never invent a number.** If the backend cannot count it, it does not go on
  screen. Two rounds of fabricated figures have already been scrubbed from this
  site.
- **India-only.** No NRI, US, UK or overseas framing anywhere.
- **Responsive 360–2560px**, with 768 and 1024 checked explicitly.
- **Push to `ankan-dev`.** `main` is the deploy branch — a push there goes live
  within five minutes via cron. Only merge to `main` when the owner says so.
