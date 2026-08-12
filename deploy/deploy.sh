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

  # Build beside the live directory and swap, so the web root is never left
  # without a build for longer than a rename takes. The old script did
  # `rm -rf build && cp -r …`, which leaves it missing for the whole copy.
  rm -rf "$DOCROOT/build.new" "$DOCROOT/build.old"
  if cp -r "$LARAVEL_DIR/public/build" "$DOCROOT/build.new"; then
    [ -d "$DOCROOT/build" ] && mv "$DOCROOT/build" "$DOCROOT/build.old"
    mv "$DOCROOT/build.new" "$DOCROOT/build"
    rm -rf "$DOCROOT/build.old"
    log "assets: build swapped"
  else
    log "assets: WARN build copy failed, leaving the previous build in place"
    rm -rf "$DOCROOT/build.new"
  fi

  # PWA + icons + self-hosted images. These lived at the very end of the old
  # script, which is why manifest.webmanifest was three weeks stale.
  cp -f "$LARAVEL_DIR/public/sw.js" "$DOCROOT/sw.js" 2>/dev/null || true
  cp -f "$LARAVEL_DIR/public/manifest.webmanifest" "$DOCROOT/manifest.webmanifest" 2>/dev/null || true
  rm -rf "$DOCROOT/icons"  && cp -r "$LARAVEL_DIR/public/icons"  "$DOCROOT/icons"  2>/dev/null || true
  rm -rf "$DOCROOT/images" && cp -r "$LARAVEL_DIR/public/images" "$DOCROOT/images" 2>/dev/null || true

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
