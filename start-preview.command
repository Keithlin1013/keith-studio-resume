#!/bin/bash
# Starts THIS project (~/Project/resume web) — the canonical one.
# It used to cd into the Codex copy under ~/Documents/Codex/…/Studio_Interactive,
# so every fix made here stayed invisible. --strict-port makes a port clash fail
# loudly instead of silently landing on a different port.
cd "$(dirname "$0")" || exit 1
nohup npm run dev > /tmp/studio-dev.log 2>&1 &
disown
sleep 3
open "http://127.0.0.1:4174/"
echo "Studio dev server started on http://127.0.0.1:4174/  (from $(pwd))"
echo "(This window can be closed - the server keeps running in the background.)"
