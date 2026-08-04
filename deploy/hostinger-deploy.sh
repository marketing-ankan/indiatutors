#!/usr/bin/env bash
#
# Ongoing auto-deploy for Hostinger, run by cron.
# Pulls main; if anything changed, applies migrations, refreshes the
# built assets at the web root, and rebuilds caches. No Composer needed
# (vendor/ ships in the repo).
#
# Cron command:
#   /bin/bash /home/USER/websites/SITE/public_html/laravel/deploy/hostinger-deploy.sh >> .../laravel/storage/logs/deploy.log 2>&1
#
set -e
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

LARAVEL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCROOT="$(dirname "$LARAVEL_DIR")"
cd "$LARAVEL_DIR"

# Log to file here (Hostinger's cron field rejects shell redirects)
exec >> "$LARAVEL_DIR/storage/logs/deploy.log" 2>&1

BEFORE="$(git rev-parse HEAD)"
git pull --ff-only origin main
AFTER="$(git rev-parse HEAD)"

# Keep the web-root build in lock-step with the app build on EVERY run — even when
# there's nothing new to pull. A previously-failed/partial copy self-heals HERE,
# BEFORE the no-change early-exit, so the web root can't stay frozen on an old
# build while the app (and the served Vite manifest) has already advanced — the
# exact cause of the recurring blank page. Atomic temp-swap: copy fully into
# build.new first, then swap, so a mid-copy failure never leaves the web root
# without a build. Nothing here can abort the deploy (set -e safe).
WROOT_JS="$(grep -oE 'assets/main-[A-Za-z0-9_-]+\.js' "$LARAVEL_DIR/public/build/manifest.json" 2>/dev/null | head -1)"
if [ -n "$WROOT_JS" ] && [ ! -f "$DOCROOT/build/$WROOT_JS" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] web-root build stale ($WROOT_JS missing) — syncing"
  rm -rf "$DOCROOT/build.new" 2>/dev/null || true
  if cp -r "$LARAVEL_DIR/public/build" "$DOCROOT/build.new"; then
    if rm -rf "$DOCROOT/build" && mv "$DOCROOT/build.new" "$DOCROOT/build"; then
      cp -f "$LARAVEL_DIR/public/sw.js" "$DOCROOT/sw.js" 2>/dev/null || true
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] web-root build synced to $WROOT_JS"
    else
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN: build swap failed"
    fi
  else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN: build copy failed"
    rm -rf "$DOCROOT/build.new" 2>/dev/null || true
  fi
fi

if [ "$BEFORE" = "$AFTER" ]; then
  exit 0   # nothing new — stay quiet
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] deploying $BEFORE -> $AFTER"

# DB steps run BEST-EFFORT (set +e): a migration/seeder failure must NEVER abort
# the deploy. It used to — under set -e a single failing seeder killed the script
# BEFORE the asset copy + route-cache refresh below, freezing the copied build at
# the web root (blank white SPA, because the served HTML references newer Vite
# hashes that were never copied) and leaving new /api routes 404'ing on a stale
# route cache. Migrations only apply pending ones (never fresh/refresh) and are
# idempotency-guarded; seeders are idempotent (updateOrCreate by stable slug,
# prune stale) so they update in place and never delete user data. Any failure
# here is logged by artisan and retried next deploy — the front-end still ships.
set +e
php artisan migrate --force
php artisan db:seed --class=CourseSeeder --force
php artisan db:seed --class=TutorSeeder --force
php artisan db:seed --class=PostSeeder --force
php artisan db:seed --class=AdminSeeder --force
set -e

# Refresh built front-end assets exposed at the web root
rm -rf "$DOCROOT/build"
cp -r "$LARAVEL_DIR/public/build" "$DOCROOT/build"

# robots.txt is served by a Laravel route (dynamic sitemap URL); make sure no
# static file at the web root shadows it.
rm -f "$DOCROOT/robots.txt"

# Rebuild caches against the new code
php artisan config:cache
php artisan route:clear
php artisan view:clear

echo "[$(date '+%Y-%m-%d %H:%M:%S')] deploy complete"

# --- PWA files served from the web root ---------------------------------
# NOTE: this script git-pulls itself mid-run, so edits must be APPENDED
# (keep all earlier bytes identical) or bash may misread the running file.
cp -f "$LARAVEL_DIR/public/sw.js" "$DOCROOT/sw.js"
cp -f "$LARAVEL_DIR/public/manifest.webmanifest" "$DOCROOT/manifest.webmanifest"
rm -rf "$DOCROOT/icons"
cp -r "$LARAVEL_DIR/public/icons" "$DOCROOT/icons"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] pwa assets synced"

# --- route-cache resilience -------------------------------------------
# A stale route cache 404s new endpoints (SPA catch-all swallows them).
# Rebuild the cache; if that ever fails, clear it — uncached routes work.
php artisan route:clear || true
php artisan route:cache || php artisan route:clear || true
echo "[$(date '+%Y-%m-%d %H:%M:%S')] route cache refreshed"

# --- build-integrity self-heal ----------------------------------------
# A partial cp can leave DOCROOT/build with a manifest.json that references
# hashed assets which aren't present → the SPA loads a blank white page.
# If the manifest's main JS isn't in the web root, re-copy the whole build.
MAIN_JS="$(grep -oE 'assets/main-[A-Za-z0-9_-]+\.js' "$LARAVEL_DIR/public/build/manifest.json" 2>/dev/null | head -1)"
if [ -n "$MAIN_JS" ] && [ ! -f "$DOCROOT/build/$MAIN_JS" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] build mismatch ($MAIN_JS missing) — re-copying build"
  rm -rf "$DOCROOT/build"
  cp -r "$LARAVEL_DIR/public/build" "$DOCROOT/build"
fi
echo "[$(date '+%Y-%m-%d %H:%M:%S')] build integrity checked"

# --- course/hero images served from the web root ------------------------
# Self-hosted course photos (public/images) copied alongside build/ & icons/.
rm -rf "$DOCROOT/images" 2>/dev/null || true
cp -r "$LARAVEL_DIR/public/images" "$DOCROOT/images" 2>/dev/null || true
echo "[$(date '+%Y-%m-%d %H:%M:%S')] course images synced"

# --- pincode reference data (physical / home tuition) -------------------
# APPENDED, never inserted: see the note above — this script git-pulls itself
# mid-run, so every earlier byte has to stay identical.
#
# Without this the `pincodes` table is empty on the server, and the home-tuition
# address forms have no coordinates to place a teacher's service radius against.
# Idempotent (upsert keyed on pincode) and it skips any row an official
# `pincodes:import` has already loaded, so re-running never downgrades real data
# to the bundled anchors. Best-effort like the seeders above: a failure here must
# never take the front-end down with it.
php artisan db:seed --class=PincodeSeeder --force || true
echo "[$(date '+%Y-%m-%d %H:%M:%S')] pincode anchors seeded"
