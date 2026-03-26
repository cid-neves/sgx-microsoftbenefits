// ════════════════════════════════════════════════════════════════════
// src/sync.js — Server persistence & sync
// REST API: GET /api/usage  POST /api/usage
// Falls back to localStorage when server is unavailable.
// ════════════════════════════════════════════════════════════════════
import {
  USAGE_DATA, TENANT_CUSTOM, REPLACEMENTS, PACK_COSTS, PRICES,
  setUSAGE_DATA, setTENANT_CUSTOM, setREPLACEMENTS, setPACK_COSTS, setPRICES,
  setSaveDebounce, saveDebounce, bumpClientVersion
} from './state.js';

const API_URL = '/api/usage';
const LS_KEY  = 'sg_usage_v1';

// ── Toast notification ───────────────────────────────────────────

/**
 * Show a brief status toast message.
 * @param {string} msg
 * @param {'ok'|'warn'|'err'} type
 */
export function showToast(msg, type = 'ok') {
  let el = document.getElementById('sg-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sg-toast';
    el.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:9px 16px;border-radius:6px;font-size:12px;font-weight:600;z-index:9999;transition:opacity .3s;pointer-events:none';
    document.body.appendChild(el);
  }
  const colors = { ok:'#1e8a57', warn:'#b86214', err:'#a0253b' };
  el.style.background = colors[type] || colors.ok;
  el.style.color = '#fff';
  el.style.opacity = '1';
  el.textContent = msg;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = '0'; }, 3000);
}

// ── Sync status indicator ────────────────────────────────────────

/**
 * Update the sync status indicator element if present.
 * @param {'idle'|'saving'|'saved'|'error'} status
 */
export function updateSyncStatus(status) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  const map = {
    idle:   { text: '',          cls: '' },
    saving: { text: '⟳ Saving…', cls: 'sync-saving' },
    saved:  { text: '✓ Saved',   cls: 'sync-saved' },
    error:  { text: '✕ Offline', cls: 'sync-error' },
  };
  const s = map[status] || map.idle;
  el.textContent = s.text;
  el.className   = s.cls;
}

// ── Payload helpers ──────────────────────────────────────────────

function buildPayload() {
  return {
    usageData:     USAGE_DATA,
    tenantCustom:  TENANT_CUSTOM,
    replacements:  REPLACEMENTS,
    packCosts:     PACK_COSTS,
    prices:        PRICES,
    ts:            Date.now(),
  };
}

function applyPayload(data) {
  if (!data || typeof data !== 'object') return;
  if (data.usageData)    setUSAGE_DATA({ ...USAGE_DATA, ...data.usageData });
  if (data.tenantCustom) setTENANT_CUSTOM(data.tenantCustom);
  if (data.replacements) setREPLACEMENTS(data.replacements);
  if (data.packCosts)    setPACK_COSTS({ ...PACK_COSTS, ...data.packCosts });
  if (data.prices)       setPRICES({ ...PRICES, ...data.prices });
}

// ── Row-level source persistence ─────────────────────────────────

/**
 * Persist row replacement sources for a given row.
 * @param {string} rowId
 * @param {Array}  sources  [{packId, qty}]
 */
export function saveRowSources(rowId, sources) {
  setUSAGE_DATA({
    ...USAGE_DATA,
    [rowId]: { ...(USAGE_DATA[rowId] || {}), sources },
  });
  bumpClientVersion();
  scheduleSave();
}

/**
 * Return replacement sources for a row, or empty array.
 * @param {string} rowId
 * @returns {Array}
 */
export function getRowSourcesFromState(rowId) {
  return (USAGE_DATA[rowId] && USAGE_DATA[rowId].sources) || [];
}

// ── Custom entry persistence ─────────────────────────────────────

/**
 * Persist the TENANT_CUSTOM array to state + schedule server save.
 */
export function saveCustomEntries() {
  bumpClientVersion();
  scheduleSave();
}

/**
 * Load custom entries from localStorage fallback.
 */
export function loadCustomEntries() {
  try {
    const raw = localStorage.getItem('sg_custom_v1');
    if (raw) setTENANT_CUSTOM(JSON.parse(raw));
  } catch (e) { /* ignore */ }
}

// ── Server save ──────────────────────────────────────────────────

function scheduleSave() {
  if (saveDebounce) clearTimeout(saveDebounce);
  setSaveDebounce(setTimeout(saveToServer, 800));
}

/**
 * POST current state to the server API.
 */
export async function saveToServer() {
  updateSyncStatus('saving');
  const payload = buildPayload();
  try {
    const res = await fetch(API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
    updateSyncStatus('saved');
    setTimeout(() => updateSyncStatus('idle'), 2000);
  } catch (e) {
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
    updateSyncStatus('error');
    showToast('Saved locally (server offline)', 'warn');
  }
}

/**
 * GET state from the server API.
 * @returns {Promise<object|null>}
 */
export async function loadFromServer() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    // Fall back to localStorage
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }
}

/**
 * Merge server state into local state (does NOT replace USAGE_DATA wholesale).
 * Called on startup after fetching from the server.
 * @param {object} data
 */
export function syncFromServer(data) {
  applyPayload(data);
}
