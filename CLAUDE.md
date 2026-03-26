# Benefits26 — Microsoft Partner Benefits 2026 Tracker

## What this is
Single-page app tracking Microsoft AI Cloud Partner Program license 
entitlements vs actual tenant usage for Serban Group.
Deployed at sgx-labs.com/partners/microsoft/

## Stack
- Vanilla JS (ES modules), no framework, no build step
- PHP 8 backend (api/usage.php) for shared multi-user persistence
- localStorage fallback when server unavailable

## Project structure
- index.html          — app shell, nav, modals
- src/data.js         — PACK_LICENSES (58), TENANT_DEFAULT (23), I18N (228 keys)
- src/state.js        — USAGE_DATA, REPLACEMENTS, PACK_COSTS, PRICES, PACK_CONFIG
- src/main.js         — INIT block, showTab, onPT, updatePackTotal
- src/render/usage.js — renderUsage, renderRowReplacementUI, qc()
- src/render/finance.js — renderFin1, renderFin2, renderCloud
- src/render/allpacks.js — renderAll, renderPurchaseTab
- src/sync.js         — saveToServer, loadFromServer, syncFromServer
- src/i18n.js         — t(), applyI18n(), setLang(), detectLang()
- styles/main.css     — all styles extracted from original HTML
- api/usage.php       — REST: GET /api/usage, POST /api/usage
- api/data.json       — runtime data (gitignored, lives on server only)
- docker/nginx.conf   — nginx config for the container
- Dockerfile          — nginx + PHP-FPM alpine image
- .github/workflows/deploy.yml — auto-deploy on push to main

## Key data structures
- PACK_LICENSES[i].{l,c,e,i,mw,sec,avd} — qty per pack key
- USAGE_DATA[rowId].sources = [{packId, qty}] — replacement sources
- USAGE_DATA[rowId].assigned — override for tenant assigned count
- REPLACEMENTS = [{fromId, toPackId, qty}] — modal-based replacements

## Critical functions
- rpf(p, key) — resolves pack field for any row type via cpu_key fallback
- getAvail(p, s) — sums all active pack quantities using rpf()
- getRowCoverage(p, s) — per-row coverage breakdown using sources
- syncFromServer(data) — merges server state (does NOT replace USAGE_DATA)
- applyReplacements() — mutates TENANT rows based on REPLACEMENTS array

## Deploy rules
- Never overwrite api/data.json on deploy
- Never overwrite api/snapshots/ on deploy
- PHP-FPM socket path varies by server — check before deploying
EOF