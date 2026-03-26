// ════════════════════════════════════════════════════════════════════
// src/sync.js — Server persistence, sync, backup & restore
// ════════════════════════════════════════════════════════════════════
import { DEFAULT_PACK_COSTS, PACK_LICENSES } from './data.js';
import {
  USAGE_DATA, PACK_COSTS, PRICES, PACK_CONFIG, clientVersion,
  setPACK_COSTS, setPRICES, setPACK_CONFIG, setClientVersion, setServerLastUpdated,
  serverLastUpdated, lastSaveActivity,
} from './state.js';
import { t, applyI18n } from './i18n.js';
import { renderUsage } from './render/usage.js';
import { renderFin1, renderFin2, renderCloud } from './render/finance.js';
import { renderAll, renderPricesPage } from './render/allpacks.js';

// Imported lazily via window to avoid circular dep with main.js
function loadCustomEntries() { if(typeof window.loadCustomEntries==='function') window.loadCustomEntries(); }
function syncPackCostInputs() { if(typeof window.syncPackCostInputs==='function') window.syncPackCostInputs(); }

function renderAll_safe() {
  const at = document.querySelector('.tabpanel.active');
  renderUsage();
  if (at) { const id = at.id; if(id==='t-all') renderAll(); if(id==='t-cloud') renderCloud(); if(id==='t-fin1') renderFin1(); if(id==='t-fin2') renderFin2(); if(id==='t-prices') renderPricesPage(); }
}

export function buildDefaultPrices() {
  const d = {};
  PACK_LICENSES.forEach(p => { d[p.id] = p.cpu; });
  return d;
}

export function updateSyncStatus(state) {
  const dot = document.getElementById('sync-dot');
  const txt = document.getElementById('sync-text');
  dot.className = 'sync-dot' + (state === 'err' ? ' err' : state === 'loading' ? ' loading' : '');
  if (state === 'ok') txt.textContent = serverLastUpdated ? t('last_sync') + ' ' + new Date(serverLastUpdated).toLocaleTimeString() : '✓';
  else if (state === 'loading') txt.textContent = t('saving');
  else txt.textContent = t('sync_error');
}

export function showToast(msg, type='ok') {
  const el=document.getElementById('toast');if(!el)return;
  el.textContent=msg;el.className='toast '+type+' show';
  clearTimeout(window._toastTimer);
  window._toastTimer=setTimeout(()=>el.classList.remove('show'),2500);
}

export function syncFromServer(data) {
  if (data.prices) setPRICES({...buildDefaultPrices(), ...data.prices});
  if (data.packCosts) setPACK_COSTS({...DEFAULT_PACK_COSTS, ...data.packCosts});
  if (data.usage) {
    Object.entries(data.usage).forEach(([id, val]) => {
      if (id === '_custom' || id === '_replacements') {
        if (val && (Array.isArray(val) ? val.length > 0 : Object.keys(val).length > 0)) {
          USAGE_DATA[id] = val;
        }
        return;
      }
      if (!USAGE_DATA[id]) USAGE_DATA[id] = {};
      Object.entries(val || {}).forEach(([k, v]) => {
        if (k === 'sources') {
          if (Array.isArray(v) && v.length > 0) USAGE_DATA[id][k] = v;
        } else {
          USAGE_DATA[id][k] = v;
        }
      });
    });
    loadCustomEntries();
  }
  if (data.packConfig) {
    setPACK_CONFIG(data.packConfig);
    ['l','c','e','i','mw','sec','avd'].forEach(k => {
      const tog = document.getElementById('tog-'+k);
      const mul = document.getElementById('mult-'+k);
      if(tog && data.packConfig[k]) tog.checked = data.packConfig[k].enabled !== false;
      if(mul && data.packConfig[k] && data.packConfig[k].multiplier) mul.value = data.packConfig[k].multiplier;
    });
  }
  setServerLastUpdated(data._meta?.lastUpdated);
  if (data._meta?.version !== undefined) setClientVersion(data._meta.version);
  if (data.packCosts) syncPackCostInputs();
  updateSyncStatus('ok');
}

export async function saveToServer(patch) {
  patch._clientVersion = clientVersion;
  try {
    updateSyncStatus('loading');
    const r = await fetch('/api/usage', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(patch)
    });
    if (r.status === 409) {
      const body = await r.json();
      if (body.current_state) {
        syncFromServer(body.current_state);
        setClientVersion(body.server_version);
        renderAll_safe();
      }
      showConflictModal();
      updateSyncStatus('err');
      return false;
    }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    if (data.data) {
      syncFromServer(data.data);
      if (data.data._meta?.version !== undefined) setClientVersion(data.data._meta.version);
    }
    updateSyncStatus('ok');
    showToast(t('saved_ok'), 'ok');
    return true;
  } catch(e) {
    updateSyncStatus('err');
    showToast(t('sync_error'), 'err');
    return false;
  }
}

export async function loadFromServer() {
  try {
    updateSyncStatus('loading');
    const r = await fetch('/api/usage');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    syncFromServer(data.data);
    if (data.data?._meta?.version !== undefined) setClientVersion(data.data._meta.version);
    renderAll_safe();
  } catch(e) {
    console.warn('Server load failed, using defaults:', e.message);
    setPRICES(buildDefaultPrices());
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('sg_usage_')) {
          const rowId = k.replace('sg_usage_', '');
          const val = JSON.parse(localStorage.getItem(k));
          if (val && typeof val === 'object') {
            if (!USAGE_DATA[rowId]) USAGE_DATA[rowId] = {};
            Object.assign(USAGE_DATA[rowId], val);
          }
        }
      });
      loadCustomEntries();
    } catch(le) {}
    updateSyncStatus('err');
  }
}

export function startAutoRefresh() {
  if (window._autoRefreshTimer) clearInterval(window._autoRefreshTimer);
  window._autoRefreshTimer = setInterval(async () => {
    if (Date.now() - lastSaveActivity < 30000) return;
    if (document.querySelectorAll('.ie.dirty').length > 0) return;
    if (document.querySelectorAll('.rep-sel:focus, .rep-qty-in:focus').length > 0) return;
    try {
      const r = await fetch('/api/usage');
      if (!r.ok) return;
      const data = await r.json();
      const serverVer = data.data?._meta?.version ?? 0;
      if (serverVer > clientVersion) {
        syncFromServer(data.data);
        setClientVersion(serverVer);
        renderAll_safe();
        showToast(t('refreshed'), 'ok');
      }
    } catch(e) { /* silent fail */ }
  }, 2 * 60 * 1000);
}

export function showConflictModal() {
  const m = document.getElementById('conflict-modal');
  if (m) { m.classList.add('open'); applyI18n(); }
}

let currentPreviewSlot = null;

export async function loadSnapshots() {
  const area = document.getElementById('bk-snaps-area');
  if (!area) return;
  area.innerHTML = '<div class="bk-loading">' + t('bk_loading') + '</div>';
  try {
    const r = await fetch('/api/usage?history=1');
    const data = await r.json();
    const snaps = data.data ?? [];
    if (!snaps.length) { area.innerHTML = '<div class="bk-empty">' + t('bk_no_snaps') + '</div>'; return; }
    const typeLabel = {daily:t('bk_daily'),weekly:t('bk_weekly'),monthly:t('bk_monthly'),yearly:t('bk_yearly')};
    const typePill  = {daily:'bkp-daily',weekly:'bkp-weekly',monthly:'bkp-monthly',yearly:'bkp-yearly'};
    let html = '<table class="bk-snaps-table"><thead><tr>' +
      '<th>' + t('bk_type') + '</th><th>' + t('bk_created') + '</th><th>' + t('bk_version') + '</th>' +
      '<th>' + t('bk_by') + '</th><th>' + t('bk_actions') + '</th></tr></thead><tbody>';
    snaps.forEach(s => {
      const d = s.created ? new Date(s.created).toLocaleString() : '—';
      html += '<tr><td><span class="bk-type-pill ' + (typePill[s.type]||'') + '">' + (typeLabel[s.type]||s.type) + ' ' + s.index + '</span></td>' +
        '<td style="font-size:11px">' + d + '</td><td style="font-weight:600;color:var(--sg-blue)">#' + s.version + '</td>' +
        '<td style="font-size:11px;color:var(--text-muted)">' + (s.savedBy||'—') + '</td>' +
        '<td><button class="bk-btn bk-btn-preview" data-slot="' + s.slot + '" onclick="previewSnap(this.dataset.slot)">' + t('bk_preview') + '</button>' +
        '<button class="bk-btn bk-btn-restore" data-slot="' + s.slot + '" onclick="doRestore(this.dataset.slot)">' + t('bk_restore') + '</button></td></tr>';
    });
    html += '</tbody></table>';
    area.innerHTML = html;
  } catch(e) { area.innerHTML = '<div class="bk-empty">' + t('sync_error') + '</div>'; }
}

export async function previewSnap(slot) {
  currentPreviewSlot = slot;
  window.currentPreviewSlot = slot;
  const drawer = document.getElementById('preview-drawer');
  const meta   = document.getElementById('preview-meta');
  const jsonEl = document.getElementById('preview-json');
  if (!drawer) return;
  meta.innerHTML = '<span>' + t('bk_loading') + '</span>';
  jsonEl.textContent = '';
  drawer.classList.add('open');
  try {
    const r = await fetch('/api/usage?restore=' + encodeURIComponent(slot));
    const data = await r.json();
    const d = data.data ?? {};
    meta.innerHTML =
      '<span><strong>' + t('bk_slot') + ':</strong> ' + slot + '</span>' +
      '<span><strong>' + t('bk_version') + ':</strong> #' + (d._meta?.version ?? '—') + '</span>' +
      '<span><strong>' + t('bk_created') + ':</strong> ' + (d._meta?.lastUpdated ? new Date(d._meta.lastUpdated).toLocaleString() : '—') + '</span>';
    const summary = {
      prices: Object.keys(d.prices || {}).length + ' price entries',
      packCosts: JSON.stringify(d.packCosts || {}),
      usageItems: Object.keys(d.usage || {}).length + ' usage entries',
      packConfig: JSON.stringify(d.packConfig || {}),
    };
    jsonEl.textContent = JSON.stringify(summary, null, 2);
  } catch(e) { meta.innerHTML = '<span style="color:var(--unc)">' + t('sync_error') + '</span>'; }
}

export async function doRestore(slot) {
  if (!confirm(t('bk_restore_confirm'))) return;
  document.getElementById('preview-drawer')?.classList.remove('open');
  try {
    updateSyncStatus('loading');
    const r = await fetch('/api/usage?restore=' + encodeURIComponent(slot), {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: '{}'
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    syncFromServer(data.data);
    if (data.data?._meta?.version !== undefined) setClientVersion(data.data._meta.version);
    renderAll_safe();
    updateSyncStatus('ok');
    showToast(t('bk_restored_ok'), 'ok');
    setTimeout(loadSnapshots, 500);
  } catch(e) { updateSyncStatus('err'); showToast(t('sync_error'), 'err'); }
}

export async function loadAudit() {
  const area = document.getElementById('bk-audit-area');
  if (!area) return;
  try {
    const r = await fetch('/api/usage?audit=1');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    const log = data.data ?? [];
    if (!log.length) { area.innerHTML = '<div class="bk-empty">—</div>'; return; }
    const amap = {save:'aa-save',restore:'aa-restore'};
    let html = '<table class="audit-table"><thead><tr>' +
      '<th>' + t('bk_audit_ts') + '</th><th>' + t('bk_audit_action') + '</th>' +
      '<th>' + t('bk_audit_ip') + '</th><th>' + t('bk_audit_keys') + '</th>' +
      '<th>' + t('bk_audit_ver') + '</th></tr></thead><tbody>';
    log.forEach(e => {
      const d = e.ts ? new Date(e.ts).toLocaleString() : '—';
      const act = e.action || 'save';
      html += '<tr><td style="font-size:11px">' + d + '</td>' +
        '<td><span class="audit-action ' + (amap[act]||'aa-save') + '">' + act + '</span></td>' +
        '<td style="font-size:10px;color:var(--text-muted)">' + (e.ip||'—') + '</td>' +
        '<td style="font-size:11px">' + (Array.isArray(e.keys)?e.keys.join(', '):JSON.stringify(e.keys||'')) + '</td>' +
        '<td style="font-weight:600;color:var(--sg-blue)">#' + (e.ver||0) + '</td></tr>';
    });
    html += '</tbody></table>';
    area.innerHTML = html;
  } catch(e) {
    area.innerHTML = '<div class="bk-empty" style="color:var(--text-light);font-size:11px">Audit log unavailable (requires server)</div>';
  }
}

export function saveRowSources(rowId) {
  try { localStorage.setItem('sg_usage_'+rowId, JSON.stringify(USAGE_DATA[rowId])); } catch(e){}
  saveToServer({ usage: { [rowId]: USAGE_DATA[rowId] } });
}
