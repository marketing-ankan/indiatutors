#!/usr/bin/env bash
#
# Stable launcher — the ONLY file cron invokes.
#
# WHY THIS EXISTS. hostinger-deploy.sh was called by cron directly, and it
# git-pulls the very repository it is part of. Bash reads a script incrementally
# by byte offset, so a pull that rewrites the file underneath a running shell can
# make it resume mid-statement — which is why every past edit to the deploy
# script had to be APPENDED, and why its tail had not run since 15 July. This
# breaks that: pull, then `exec` the deploy as a fresh process, opened after the
# pull completes.
#
# WHY THE BUILD COPY IS HERE AND NOT IN deploy.sh. It was in deploy.sh, first,
# exactly so it would happen before anything that can be killed. On 5 Aug a
# frontend deploy still blanked the site for 5½ minutes: the pull had plainly
# run (the app was serving HTML naming the new bundle) while the web root still
# held the old one — so deploy.sh was not reaching even its first step. Ordering
# the work correctly inside a file that does not run is worth nothing.
#
# So the one step that decides whether visitors see a page lives in the file that
# provably executes, inline, before the exec. Everything below it may fail; this
# must not. No `set -e`, no conditionals that can abort — worst case it does
# nothing and the next cycle retries.
#
# CRON:
#   /bin/bash /home/USER/websites/SITE/public_html/laravel/deploy/run.sh

cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 0
mkdir -p storage/logs 2>/dev/null

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] run.sh: $*" >> storage/logs/deploy.log 2>/dev/null; }

# DEPLOY_SKIP_PULL lets the chain be exercised locally without pulling main into
# whatever branch a developer is standing on.
if [ -z "${DEPLOY_SKIP_PULL:-}" ]; then
  git pull --ff-only origin main >> storage/logs/deploy.log 2>&1 || log "pull failed, continuing"
fi

# --- the critical path -------------------------------------------------------
DOCROOT="${DEPLOY_DOCROOT:-$(cd .. 2>/dev/null && pwd)}"
MAIN_JS="$(grep -oE 'assets/main-[A-Za-z0-9_-]+\.js' public/build/manifest.json 2>/dev/null | head -1)"

if [ -n "$DOCROOT" ] && [ -n "$MAIN_JS" ] && [ ! -f "$DOCROOT/build/$MAIN_JS" ]; then
  log "web root is missing $MAIN_JS — syncing"
  rm -rf "$DOCROOT/build.new" "$DOCROOT/build.old" 2>/dev/null
  if cp -r public/build "$DOCROOT/build.new" 2>/dev/null; then
    # Build beside the live directory and swap, so the web root is never without
    # a build for longer than a rename takes.
    if [ -d "$DOCROOT/build" ]; then mv "$DOCROOT/build" "$DOCROOT/build.old" 2>/dev/null; fi
    mv "$DOCROOT/build.new" "$DOCROOT/build" 2>/dev/null
    rm -rf "$DOCROOT/build.old" 2>/dev/null
    cp -f public/sw.js "$DOCROOT/sw.js" 2>/dev/null
    cp -f public/manifest.webmanifest "$DOCROOT/manifest.webmanifest" 2>/dev/null
    if [ -f "$DOCROOT/build/$MAIN_JS" ]; then log "synced $MAIN_JS"; else log "WARN sync did not land $MAIN_JS"; fi
  else
    log "WARN could not copy public/build"
    rm -rf "$DOCROOT/build.new" 2>/dev/null
  fi
fi

# A breadcrumb readable over HTTP at /deploy-status.txt. storage/logs is behind a
# Require-all-denied .htaccess and there is no SSH to this box, so without this
# there is no way to tell a deploy that failed from one that never ran — which is
# precisely what cost hours diagnosing the blank page. The repository is public,
# so the commit it names is not a secret.
if [ -n "$DOCROOT" ]; then
  {
    echo "head:      $(git rev-parse --short HEAD 2>/dev/null)"
    echo "bundle:    ${MAIN_JS:-unknown}"
    echo "served:    $([ -f "$DOCROOT/build/$MAIN_JS" ] && echo yes || echo NO)"
    echo "run.sh at: $(date '+%Y-%m-%d %H:%M:%S %Z')"
  } > "$DOCROOT/deploy-status.txt" 2>/dev/null
fi

exec /bin/bash deploy/deploy.sh
