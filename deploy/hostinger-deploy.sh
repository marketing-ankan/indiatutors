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

if [ "$BEFORE" = "$AFTER" ]; then
  exit 0   # nothing new — stay quiet
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] deploying $BEFORE -> $AFTER"

# Apply any new migrations (safe: only runs pending ones — never fresh/refresh)
php artisan migrate --force

# Sync catalog + tutor reference data. Seeders are idempotent (updateOrCreate
# by stable slug, prune stale) so this updates in place and never deletes
# user data (demo requests, contacts, users).
php artisan db:seed --class=CourseSeeder --force
php artisan db:seed --class=TutorSeeder --force
php artisan db:seed --class=PostSeeder --force
php artisan db:seed --class=AdminSeeder --force

# Refresh built front-end assets exposed at the web root
rm -rf "$DOCROOT/build"
cp -r "$LARAVEL_DIR/public/build" "$DOCROOT/build"

# robots.txt is served by a Laravel route (dynamic sitemap URL); make sure no
# static file at the web root shadows it.
rm -f "$DOCROOT/robots.txt"

# Rebuild caches against the new code
php artisan config:cache
php artisan route:cache
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
