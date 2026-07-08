#!/usr/bin/env bash
#
# One-time (and re-runnable) deploy setup for Hostinger shared hosting.
#
# Hostinger disables the proc_* PHP functions, so Composer is run with
# --no-scripts + COMPOSER_ROOT_VERSION to avoid shelling out; package
# discovery is then done in pure PHP via `artisan package:discover`.
#
# The Laravel app lives at  <docroot>/laravel  (this script sits in
# <docroot>/laravel/deploy/). The web root is wired to serve Laravel's
# public/ folder, and <docroot>/laravel is blocked from the web.
#
# Usage:
#   bash deploy/hostinger-setup.sh <db_password> <db_name> <db_user> <app_url>
#
set -e

DB_PASS="${1:?Usage: bash deploy/hostinger-setup.sh <db_password> <db_name> <db_user> <app_url>}"
DB_NAME="${2:?db_name required}"
DB_USER="${3:?db_user required}"
APP_URL="${4:?app_url required (e.g. https://example.hostingersite.com)}"
DOMAIN="$(echo "$APP_URL" | sed -E 's#^https?://##; s#/.*##')"

export COMPOSER_ROOT_VERSION=1.0.0
export COMPOSER_MEMORY_LIMIT=-1

# Resolve paths from this script's location
LARAVEL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCROOT="$(dirname "$LARAVEL_DIR")"
cd "$LARAVEL_DIR"

echo ">> [1/6] dependencies"
if [ -f vendor/autoload.php ]; then
  echo "   vendor/ shipped via git — skipping composer (Hostinger disables proc_*)"
else
  composer install --optimize-autoloader --no-interaction --no-scripts
fi
php artisan package:discover --ansi || true

echo ">> [2/6] writing .env"
cat > .env <<ENV
APP_NAME="IndiaTutors Online"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=${APP_URL}
APP_TIMEZONE=Asia/Kolkata
APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_IN
LOG_CHANNEL=stack
LOG_LEVEL=error
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=${DB_NAME}
DB_USERNAME=${DB_USER}
DB_PASSWORD=${DB_PASS}
SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database
SANCTUM_STATEFUL_DOMAINS=${DOMAIN}
MAIL_MAILER=log
MAIL_FROM_ADDRESS="connect@indiatutorsonline.com"
MAIL_FROM_NAME="IndiaTutors Online"
ENV

echo ">> [3/6] app key + database (fresh migrate + seed)"
php artisan key:generate --force
php artisan migrate:fresh --force --seed

echo ">> [4/6] permissions + caches"
chmod -R ug+rwX storage bootstrap/cache
php artisan config:cache
php artisan route:cache

echo ">> [5/6] lock the app folder from the web"
printf 'Require all denied\n' > .htaccess

echo ">> [6/6] wiring web root -> laravel/public"
cd "$DOCROOT"
rm -f default.php
cp laravel/public/index.php index.php
cp laravel/public/.htaccess .htaccess
[ -f laravel/public/favicon.ico ] && cp laravel/public/favicon.ico . || true
[ -f laravel/public/robots.txt ] && cp laravel/public/robots.txt . || true
# Laravel's public/index.php uses __DIR__.'/../ ; app is one level deeper here
sed -i "s#__DIR__\.'/\.\./#__DIR__.'/laravel/#g" index.php
rm -rf build && cp -r laravel/public/build build

echo "===================================================="
echo " DONE — open: ${APP_URL}"
echo "===================================================="
