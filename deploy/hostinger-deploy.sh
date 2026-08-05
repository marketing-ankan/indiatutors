#!/usr/bin/env bash
# Superseded by deploy/run.sh (stable launcher) + deploy/deploy.sh (the deploy).
# Kept as a shim because the cron entry still points at this path.
#
# Safe to replace wholesale despite the old append-only rule: the previous
# version self-pulled at byte 721, and this file is far shorter than that, so a
# swap mid-run lands past EOF rather than part-way through a command.
set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.."
exec /bin/bash deploy/run.sh
