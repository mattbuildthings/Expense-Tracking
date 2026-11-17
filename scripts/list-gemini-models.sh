#!/usr/bin/env bash
# List the Gemini models YOUR key can actually call, with the modalities and
# methods each supports.
#
# WHY THIS EXISTS
# ---------------
# Google announced Gemini 4 Hydrogen on 12 Nov 2026 and says it is available
# across "all tiers of Google AI Studio, the Gemini API" -- so it should be
# reachable on the free tier. But the exact API model id string is not stated
# in the announcement, and guessing one is precisely how three Siteop routes
# went down for days when `gemini-1.5-flash` was retired and started 404ing
# (Siteop AGENTS.md #1).
#
# So do not guess, and do not trust a blog post's phrasing as an API id. Ask
# the API what your own key can see, then set GEMINI_MODEL to a string from
# this output.
#
# USAGE
#   export GEMINI_API_KEY=...        # your key, never committed
#   ./scripts/list-gemini-models.sh
#
# Then pick a model and set it in Vercel:
#   npx vercel env add GEMINI_MODEL
#
# Leaving GEMINI_MODEL unset is a valid choice: api/ocr.ts falls back to the
# `gemini-flash-latest` alias, which Google repoints to its current stable
# Flash model so your code does not break when a snapshot is retired. Pin a
# specific id only when you want a model the alias does not yet resolve to,
# and accept that you now own watching its retirement date.

set -euo pipefail

: "${GEMINI_API_KEY:?Set GEMINI_API_KEY first (export GEMINI_API_KEY=...)}"

API="https://generativelanguage.googleapis.com/v1beta/models"

echo "Models available to this key:"
echo

if command -v jq >/dev/null 2>&1; then
  curl -sS --fail-with-body "${API}?key=${GEMINI_API_KEY}&pageSize=200" \
    | jq -r '
        .models[]
        | select(.supportedGenerationMethods // [] | index("generateContent"))
        | "\(.name | sub("^models/";""))\n    input:  \(.inputTokenLimit // "?") tokens\n    output: \(.outputTokenLimit // "?") tokens\n    \(.description // "")\n"
      '
else
  echo "(jq not found -- raw JSON follows; install jq for readable output)"
  curl -sS --fail-with-body "${API}?key=${GEMINI_API_KEY}&pageSize=200"
fi

echo
echo "Looking for Gemini 4 / Hydrogen specifically:"
curl -sS --fail-with-body "${API}?key=${GEMINI_API_KEY}&pageSize=200" \
  | grep -oE '"models/[^"]+"' \
  | tr -d '"' \
  | sed 's|^models/||' \
  | grep -iE 'hydrogen|gemini-4|flash-latest' \
  || echo "  (no match -- Hydrogen may not be exposed to this key yet; keep gemini-flash-latest)"

echo
echo "Confirm the chosen id answers a real request before deploying it:"
echo "  curl -sS \"${API}/<MODEL_ID>:generateContent?key=\$GEMINI_API_KEY\" \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"contents\":[{\"parts\":[{\"text\":\"ping\"}]}]}' | head -40"
echo
echo "A 404 here is the failure mode that broke production before. Check it on a"
echo "Vercel PREVIEW deployment, not just locally."
