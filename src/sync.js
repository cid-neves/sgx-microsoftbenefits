// ════════════════════════════════════════════════════════════════════
// src/sync.js — PocketBase sync (replaces PHP/data.json)
// ════════════════════════════════════════════════════════════════════
import { DEFAULT_PACK_COSTS, PACK_LICENSES } from './data.js';
import {
  currentClient, clientStateId,
  USAGE_DATA, REPLACEMENTS, PACK_CONFIG, PACK_COSTS, PRICES,
  setUSAGE_DATA, setREPLACEMENTS, setPACK_CONFIG, setPACK_COSTS, setPRICES,
  setClientStateId, setLastSaveActivity, setSaveDebounce, saveDebounce,
  setServerLastUpdated, serverLastUpdated
} from './state.js';
import { loadState, saveState } from './pb.js';

// ── Toast notification ────────────────────────────────────────────────
let _toastTimer = null;
export function showToast(msg, type = 'ok') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast ' + type + ' show';
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

// ── Sync status indicator ─────────────────────────────────────────────
export function updateSyncStatus(state) {
  const dot = document.getElementById('sync-dot');
  const txt = document.getElementById('sync-text');
  if (!dot || !txt) return;
  dot.className = 'sync-dot' + (state === 'err' ? ' err' : state === 'loading' ? ' loading' : '');
  if (state === 'ok')      txt.textContent = serverLastUpdated ? '✓ ' + new Date(serverLastUpdated).toLocaleTimeString() : '✓';
  else if (state === 'loading') txt.textContent = 'Saving…';
  else                     txt.textContent = 'Sync error';
}

// ── Default prices helper ─────────────────────────────────────────────
export function buildDefaultPrices() {
  const d = {};
  PACK_LICENSES.forEach(p => { d[p.id] = p.cpu; });
  return d;
}

// ── Save state to PocketBase ──────────────────────────────────────────
export async function saveToServer() {
  if (!currentClient) return;
  try {
    updateSyncStatus('loading');
    const payload = {
      usage_json:        USAGE_DATA,
      replacements_json: REPLACEMENTS,
      pack_config_json:  PACK_CONFIG,
      pack_costs_json:   PACK_COSTS,
      prices_json:       PRICES,
    };
    const rec = await saveState(currentClient.id, clientStateId, payload);
    if (rec && rec.id && !clientStateId) setClientStateId(rec.id);
    setLastSaveActivity(Date.now());
    setServerLastUpdated(new Date().toISOString());
    updateSyncStatus('ok');
    showToast('Saved', 'ok');
  } catch (e) {
    console.error('saveToServer:', e);
    updateSyncStatus('err');
    showToast('Save failed — ' + e.message, 'err');
  }
}

// ── Load state from PocketBase ────────────────────────────────────────
export async function loadFromServer() {
  if (!currentClient) return false;
  try {
    updateSyncStatus('loading');
    const rec = await loadState(currentClient.id);
    if (!rec) {
      setPRICES(buildDefaultPrices());
      updateSyncStatus('ok');
      return false;
    }
    setClientStateId(rec.id);
    if (rec.pack_config_json && Object.keys(rec.pack_config_json).length)
      setPACK_CONFIG(rec.pack_config_json);
    if (rec.pack_costs_json && Object.keys(rec.pack_costs_json).length)
      setPACK_COSTS(rec.pack_costs_json);
    if (rec.prices_json && Object.keys(rec.prices_json).length)
      setPRICES(rec.prices_json);
    else
      setPRICES(buildDefaultPrices());
    if (rec.usage_json)        setUSAGE_DATA(rec.usage_json);
    if (rec.replacements_json) setREPLACEMENTS(rec.replacements_json);
    setServerLastUpdated(rec.updated || null);
    updateSyncStatus('ok');
    return true;
  } catch (e) {
    console.error('loadFromServer:', e);
    setPRICES(buildDefaultPrices());
    updateSyncStatus('err');
    return false;
  }
}

// ── Debounced auto-save ───────────────────────────────────────────────
export function scheduleSave(delayMs = 1500) {
  if (saveDebounce) clearTimeout(saveDebounce);
  setSaveDebounce(setTimeout(saveToServer, delayMs));
}

// ── Save per-row usage change ─────────────────────────────────────────
export function saveRowSources(rowId) {
  scheduleSave(800);
}

// ── Sync merge helper ─────────────────────────────────────────────────
export function syncFromServer(data) {
  if (!data) return;
  if (data.pack_config_json) setPACK_CONFIG(data.pack_config_json);
  if (data.pack_costs_json)  setPACK_COSTS(data.pack_costs_json);
  if (data.prices_json)      setPRICES(data.prices_json);
  if (data.usage_json) {
    const merged = { ...USAGE_DATA };
    for (const [k, v] of Object.entries(data.usage_json)) merged[k] = v;
    setUSAGE_DATA(merged);
  }
  if (data.replacements_json) setREPLACEMENTS(data.replacements_json);
}

// ── Stub functions kept for compatibility ─────────────────────────────
export function loadSnapshots() {}
export function previewSnap() {}
export function doRestore() {}
export function loadAudit() {}
export function showConflictModal() {}
export function startAutoRefresh() {}
