#!/usr/bin/env bash
#
# Stable launcher — the ONLY file cron invokes, and the only one that must never
# meaningfully change.
#
# WHY THIS EXISTS. hostinger-deploy.sh was called by cron directly, and it
# git-pulls the very repository it is part of. Bash reads a script incrementally
# by byte offset, so a pull that rewrites the file underneath a running shell can
# make it resume mid-statement. That is why every past edit to the deploy script
# had to be APPENDED — and why the appended tail has not successfully run since
# 15 July, with no safe way to reorder the parts that were failing.
#
# This breaks the trap: pull first, then `exec` deploy.sh as a fresh process.
# deploy.sh is opened AFTER the pull completes and is read from its final bytes,
# so it can never be rewritten underneath itself. deploy.sh is therefore free to
# be edited, reordered and shortened like ordinary code.
#
# The pull and the exec are deliberately ONE line. Bash reads a full line before
# executing it, so even in the case where this file is itself rewritten by that
# pull, the statement already in memory completes correctly.
#
# CRON (one line, replaces the old hostinger-deploy.sh entry):
#   /bin/bash /home/USER/websites/SITE/public_html/laravel/deploy/run.sh
set -e

cd "$(dirname "${BASH_SOURCE[0]}")/.."
mkdir -p storage/logs

# Keep going even if the pull fails (offline, lock file, conflict): deploy.sh is
# idempotent and its first job is making sure the web root is serving, which is
# worth doing whether or not there was anything new to fetch.
# DEPLOY_SKIP_PULL exists so the chain can be exercised locally without this
# actually pulling main into whatever branch a developer is standing on.
if [ -n "${DEPLOY_SKIP_PULL:-}" ]; then exec /bin/bash deploy/deploy.sh; fi
git pull --ff-only origin main >> storage/logs/deploy.log 2>&1 || true; exec /bin/bash deploy/deploy.sh
