#!/usr/bin/env bash
#
# Ongoing auto-deploy for Hostinger. Invoked by deploy/run.sh (which does the git
# pull and then exec's this file) — NOT by cron directly. See run.sh for why that
# indirection exists and why this file, unlike its predecessor, may be edited
# freely rather than only appended to.
#
# THE ORDER IS THE WHOLE POINT.
#
# The old script did `migrate` and four seeders BEFORE copying the new front-end
# build to the web root. Shared hosting kills the job partway through that DB
# work, so the copy never happened: the app had already advanced and was serving
# HTML that referenced main-<newhash>.js, while the web root still held the
# previous build. The bundle 404'd and the site went blank — measured at 3.5, 4.9
# and ~4 minutes across three consecutive deploys, ending only when the next cron
# cycle's self-heal noticed. The tail of that script has not run since 15 July.
#
# So: everything a VISITOR can see happens first, and nothing that can be killed
# runs before it. If the DB step dies now, the site is already correct and the
# step simply retries on the next cycle.
#
# Two independent markers, not one. Assets and database advance separately, so a
# killed migration retries without redoing the asset copy, and a completed asset
# copy is never repeated just because the DB work is still pending.

set -e
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

LARAVEL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# DEPLOY_DOCROOT exists so this script can be exercised against a scratch
# directory instead of a real web root.
DOCROOT="${DEPLOY_DOCROOT:-$(dirname "$LARAVEL_DIR")}"
cd "$LARAVEL_DIR"

mkdir -p storage/logs "storage/app/deploy-state"
STATE="$LARAVEL_DIR/storage/app/deploy-state"
ASSET_MARK="$STATE/assets.sha"
DB_MARK="$STATE/db.sha"

# Hostinger's cron field rejects shell redirects, so the script logs itself.
exec >> "$LARAVEL_DIR/storage/logs/deploy.log" 2>&1
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

HEAD="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
read_mark() { cat "$1" 2>/dev/null || echo none; }

# Cap every artisan call. One command hanging must not consume the whole budget
# and take the rest of the deploy down with it.
artisan() {
  local limit="$1"; shift
  if command -v timeout >/dev/null 2>&1; then
    timeout "$limit" php artisan "$@"
  else
    php artisan "$@"
  fi
}

# ---------------------------------------------------------------------------
# 1. ASSETS — the only part a visitor can see. Always first.
# ---------------------------------------------------------------------------

# The bundle the app's manifest names. If the web root does not have exactly
# this file, the site is blank right now, whatever the markers say.
MAIN_JS="$(grep -oE 'assets/main-[A-Za-z0-9_-]+\.js' "$LARAVEL_DIR/public/build/manifest.json" 2>/dev/null | head -1 || true)"

NEED_ASSETS=0
[ "$(read_mark "$ASSET_MARK")" != "$HEAD" ] && NEED_ASSETS=1
[ ! -d "$DOCROOT/build" ] && NEED_ASSETS=1
[ -n "$MAIN_JS" ] && [ ! -f "$DOCROOT/build/$MAIN_JS" ] && NEED_ASSETS=1

if [ "$NEED_ASSETS" = "1" ]; then
  log "assets: syncing web root to ${HEAD:0:8} (${MAIN_JS:-no manifest})"

  # ADDITIVE, never a swap. Asset filenames carry a content hash, so a new build
  # can only ever ADD files beside the old ones — nothing collides, and the
  # previous bundle keeps working for anyone still holding the previous HTML.
  #
  # The swap this replaces looked atomic and was not, in two ways that both cost
  # real page views:
  #
  #   1. Between `mv build build.old` and `mv build.new build` the web root has
  #      no build directory at all. Milliseconds, but a request landing in it
  #      404s — and the hws front layer CACHES 404s, so one unlucky request
  #      poisons that URL for everyone behind that edge.
  #   2. The instant the swap completes, every file of the previous build is
  #      deleted. Any visitor, CDN edge or service worker still holding the
  #      previous HTML then asks for a bundle that no longer exists. That is
  #      not a millisecond window; it lasts as long as the old HTML is cached.
  #
  # Copying in place removes both: old files stay, new files appear, and the
  # manifest is written LAST so it can never name a file that has not landed
  # yet. WebRootVite reads the manifest from THIS directory for the same
  # reason, so the HTML can never outrun the copy either.
  mkdir -p "$DOCROOT/build"
  ASSETS_OK=1
  if [ -d "$LARAVEL_DIR/public/build/assets" ]; then
    mkdir -p "$DOCROOT/build/assets"
    cp -r "$LARAVEL_DIR/public/build/assets/." "$DOCROOT/build/assets/" || ASSETS_OK=0
  fi
  if [ -d "$LARAVEL_DIR/public/build/images" ]; then
    mkdir -p "$DOCROOT/build/images"
    cp -r "$LARAVEL_DIR/public/build/images/." "$DOCROOT/build/images/" || ASSETS_OK=0
  fi
  if [ "$ASSETS_OK" = "1" ]; then
    cp -f "$LARAVEL_DIR/public/build/manifest.json" "$DOCROOT/build/manifest.json" 2>/dev/null || true
    log "assets: build synced (additive)"
  else
    # The manifest is deliberately NOT written: leaving the previous one in
    # place keeps the site on the previous build, which works, instead of
    # pointing it at a half-copied new one.
    log "assets: WARN asset copy incomplete — manifest left on the previous build"
  fi
  # Old hashed assets are retired on a delay, not on the deploy that replaces
  # them, so a cached page from last week still resolves. 14 days is comfortably
  # longer than any HTML or service-worker cache this site sets.
  if [ -d "$DOCROOT/build/assets" ]; then
    PRUNED="$(find "$DOCROOT/build/assets" -type f -mtime +14 -print -delete 2>/dev/null | wc -l | tr -d ' ')"
    [ "${PRUNED:-0}" != "0" ] && log "assets: pruned $PRUNED asset(s) older than 14 days"
  fi

  # PWA + icons + self-hosted images. These lived at the very end of the old
  # script, which is why manifest.webmanifest was three weeks stale.
  cp -f "$LARAVEL_DIR/public/sw.js" "$DOCROOT/sw.js" 2>/dev/null || true
  cp -f "$LARAVEL_DIR/public/manifest.webmanifest" "$DOCROOT/manifest.webmanifest" 2>/dev/null || true
  # Also additive, and for a worse version of the same reason. `rm -rf images`
  # followed by a recursive copy leaves EVERY image on the site 404ing for the
  # whole duration of that copy — seconds, not milliseconds, across hundreds of
  # files — and the front layer caches those 404s. Copying over the top means an
  # image is only ever replaced by its new self. Deletions are rare and can be
  # done by hand; a broken page for every visitor mid-deploy cannot.
  mkdir -p "$DOCROOT/icons" "$DOCROOT/images"
  cp -r "$LARAVEL_DIR/public/icons/."  "$DOCROOT/icons/"  2>/dev/null || true
  cp -r "$LARAVEL_DIR/public/images/." "$DOCROOT/images/" 2>/dev/null || true

  # robots.txt MUST be a static file at the web root. The original assumption —
  # a Laravel route serves it, a static file would shadow it — turned out to be
  # backwards on this host: the hws front layer answers /robots.txt from disk
  # (or 404s) without ever consulting the app, so the route at web.php:10 never
  # receives the request and the deploy's rm -f here guaranteed the 404.
  # Discovered 2026-08-07 when the live site had no robots.txt at all.
  # public/robots.txt names the sitemap on the real domain, statically —
  # acceptable now the domain is final.
  cp -f "$LARAVEL_DIR/public/robots.txt" "$DOCROOT/robots.txt" 2>/dev/null || true

  # Caches, against the new code. route:cache fails on closure routes, and this
  # app has them — clearing is the correct fallback, not an error.
  #
  # Skipped when DEPLOY_DOCROOT is set, i.e. a local test run. config:cache bakes
  # the CURRENT env into bootstrap/cache/config.php, and a cached config beats
  # every later env var — so exercising this script locally against a scratch
  # database silently redirected every subsequent artisan command, and the dev
  # server, to that scratch database. It cost two separate debugging detours
  # before the cause was spotted. A test harness must not rewrite the developer's
  # cached config.
  if [ -z "${DEPLOY_DOCROOT:-}" ]; then
    artisan 60 config:cache || true
    artisan 60 view:clear   || true
    artisan 60 route:clear  || true
    artisan 60 route:cache  || artisan 60 route:clear || true
  else
    log "assets: skipping cache rebuild (local test run)"
  fi

  # Verify before claiming success, so a partial copy retries next cycle rather
  # than being marked done.
  if [ -z "$MAIN_JS" ] || [ -f "$DOCROOT/build/$MAIN_JS" ]; then
    echo "$HEAD" > "$ASSET_MARK"
    log "assets: done"
  else
    log "assets: WARN $MAIN_JS still missing from the web root — will retry"
  fi
fi

# ---------------------------------------------------------------------------
# 2. DATABASE — expensive, and the part that keeps being killed. Deliberately
#    last: by now the site is already correct, so losing this costs nothing
#    visible and it simply retries on the next 5-minute cycle.
# ---------------------------------------------------------------------------

if [ "$(read_mark "$DB_MARK")" != "$HEAD" ]; then
  log "db: applying migrations and seeders for ${HEAD:0:8}"
  set +e
  DB_OK=1

  # --- BACKUP FIRST -------------------------------------------------------
  #
  # Nothing protected this database. `migrate` and five seeders ran against
  # live data with no copy taken, so a bad migration had no undo — and the
  # seeders delete rows (CourseSeeder and PostSeeder both prune), which is
  # exactly the kind of mistake you only notice afterwards.
  #
  # Deliberately OUTSIDE the web root: a SQL dump under public/ would be every
  # customer's name, email and phone number available to anyone who guessed the
  # filename. storage/ is not served.
  #
  # A failed dump WARNS but does not stop the deploy. Blocking every future
  # release on, say, a missing mysqldump binary would be a worse failure than
  # the one this guards against, and it would be silent — the site would simply
  # stop updating. The warning goes in the same log as everything else.
  backup_database() {
    local dir="$LARAVEL_DIR/storage/app/backups"
    mkdir -p "$dir" || return 1
    # Belt and braces in case storage is ever exposed by a misconfiguration.
    [ -f "$dir/.gitignore" ] || printf '*\n!.gitignore\n' > "$dir/.gitignore"

    # One backup per commit. The DB step retries every 5 minutes until it
    # succeeds, so without this a persistent failure would dump again on each
    # cycle and, at seven kept, roll the pre-change backup out of the window
    # within the hour — destroying the very copy worth keeping.
    if ls "$dir"/db-*-"${HEAD:0:8}".sql* >/dev/null 2>&1; then
      log "db: backup for ${HEAD:0:8} already taken"
      return 0
    fi

    # Read the connection out of Laravel rather than parsing .env: the deploy
    # runs config:cache, so .env is not the source of truth here.
    #
    # `local` is declared on its own line: `local x="$(cmd)"` would report
    # local's own exit status, not the command's, and this relies on the code.
    local cfg rc host port db user pass
    cfg="$(php -r '
      require "vendor/autoload.php";
      $app = require "bootstrap/app.php";
      $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
      $c = config("database.default");
      if ($c !== "mysql") { exit(3); }
      $d = config("database.connections.$c");
      echo implode("\n", [$d["host"] ?? "", $d["port"] ?? 3306, $d["database"] ?? "", $d["username"] ?? "", $d["password"] ?? ""]);
    ' 2>/dev/null)"
    rc=$?
    # 3 is "not MySQL", which is a normal state, not a failure. `|| return 2`
    # collapsed the two and reported a healthy sqlite install as a failed backup.
    [ "$rc" -eq 3 ] && return 3
    [ "$rc" -ne 0 ] && return 2

    host="$(echo "$cfg" | sed -n 1p)"; port="$(echo "$cfg" | sed -n 2p)"
    db="$(echo "$cfg" | sed -n 3p)";   user="$(echo "$cfg" | sed -n 4p)"
    pass="$(echo "$cfg" | sed -n 5p)"
    [ -n "$db" ] || return 2

    command -v mysqldump >/dev/null 2>&1 || return 4

    local out="$dir/db-$(date '+%Y%m%d-%H%M%S')-${HEAD:0:8}.sql"
    # MYSQL_PWD, not --password=: command lines are visible to other users on a
    # shared host.
    if MYSQL_PWD="$pass" mysqldump --host="$host" --port="$port" --user="$user" \
         --single-transaction --quick --no-tablespaces "$db" > "$out" 2>/dev/null; then
      gzip -f "$out" 2>/dev/null || true
      # Keep the last 7. Shared hosting has a disk quota, and an unbounded
      # backup directory would eventually take the site down by filling it.
      ls -1t "$dir"/db-*.sql.gz "$dir"/db-*.sql 2>/dev/null | tail -n +8 | while read -r old; do rm -f "$old"; done
      log "db: backup written ($(basename "$out")$( [ -f "$out.gz" ] && echo .gz ))"
      return 0
    fi
    rm -f "$out"
    return 5
  }

  backup_database
  case $? in
    0) ;;
    3) log "db: backup skipped — not a mysql connection" ;;
    4) log "db: WARNING — mysqldump not found; migrating WITHOUT a backup" ;;
    *) log "db: WARNING — backup failed; migrating WITHOUT a backup" ;;
  esac

  artisan 300 migrate --force            || DB_OK=0
  # Each seeder now skips itself when its source data is unchanged
  # (App\Support\SeedFingerprint), so in the steady state these are near-free.
  artisan 300 db:seed --class=CourseSeeder  --force || DB_OK=0
  # After CourseSeeder: it flags group classes on courses matched by slug.
  artisan 120 db:seed --class=GroupClassSeeder --force || DB_OK=0
  artisan 120 db:seed --class=TutorSeeder   --force || DB_OK=0
  artisan 120 db:seed --class=PostSeeder    --force || DB_OK=0
  artisan 120 db:seed --class=AdminSeeder   --force || DB_OK=0
  artisan 120 db:seed --class=PincodeSeeder --force || DB_OK=0

  set -e

  if [ "$DB_OK" = "1" ]; then
    echo "$HEAD" > "$DB_MARK"
    log "db: done"
  else
    # No marker written, so this retries in 5 minutes. Migrations only ever
    # apply what is pending and the seeders are idempotent, so retrying is safe.
    log "db: WARN a step failed or timed out — not marking done, will retry"
  fi
fi

log "deploy: cycle complete (assets=$(read_mark "$ASSET_MARK" | cut -c1-8) db=$(read_mark "$DB_MARK" | cut -c1-8))"
