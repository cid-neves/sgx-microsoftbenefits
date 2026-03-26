// ════════════════════════════════════════════════════════════════════
// src/main.js — App entry point, shared helpers, INIT block
// ════════════════════════════════════════════════════════════════════
import { PACK_LICENSES, TENANT_DEFAULT, DEFAULT_PACK_COSTS } from './data.js';
import {
  USAGE_DATA, TENANT_CUSTOM, REPLACEMENTS, PACK_COSTS, PRICES,
  setPACK_COSTS, setPRICES, setUSAGE_DATA, setTENANT_CUSTOM, setREPLACEMENTS,
  setAddLicMode, addLicMode, bumpClientVersion,
} from './state.js';
import { detectLang, setLang, applyI18n, t } from './i18n.js';
import { loadFromServer, syncFromServer, saveToServer, showToast, updateSyncStatus } from './sync.js';
import { renderUsage, updateStats1, srt1, setVF } from './render/usage.js';
import { renderFin1, renderFin2, renderCloud, renderFin1_safe, renderFin2_safe } from './render/finance.js';
import { renderAll, renderAll_safe, renderPurchaseTab, renderPricesPage, setPackF, srtAll } from './render/allpacks.js';

// ════════════════════════════════════════════════════════════════════
// SHARED HELPERS (exported so render modules can import them)
// ════════════════════════════════════════════════════════════════════

/** Format a number as USD. */
export function fm(n) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/** Coverage sort order. */
export function co(ct) {
  return { covered: 0, upgrade: 1, uncovered: 2, free: 3 }[ct] ?? 4;
}

/**
 * Resolve a pack field (l/c/e/i) for any row type.
 * TENANT_DEFAULT rows have direct fields; TENANT_CUSTOM rows may use cpu_key fallback.
 * @param {object} p   Row
 * @param {'l'|'c'|'e'|'i'} key
 * @returns {number|null}
 */
export function rpf(p, key) {
  // Direct field wins
  if (p[key] !== undefined) return p[key];
  // cpu_key fallback: look up the pack license entry
  if (p.cpu_key) {
    const ref = PACK_LICENSES.find(pl => pl.id === p.cpu_key);
    if (ref) return ref[key] ?? null;
  }
  return null;
}

/**
 * Read pack-toggle state from DOM inputs.
 * @returns {{ l:{on:boolean,m:number}, c:{on:boolean,m:number}, e:{on:boolean,m:number}, i:{on:boolean,m:number} }}
 */
export function ps() {
  return {
    l: { on: document.getElementById('tog-l').checked, m: parseInt(document.getElementById('mult-l').value) || 1 },
    c: { on: document.getElementById('tog-c').checked, m: parseInt(document.getElementById('mult-c').value) || 1 },
    e: { on: document.getElementById('tog-e').checked, m: parseInt(document.getElementById('mult-e').value) || 1 },
    i: { on: document.getElementById('tog-i').checked, m: 1 },
  };
}

/**
 * Sum all active pack quantities for a row.
 * @param {object} p   Row
 * @param {object} s   Pack state from ps()
 * @returns {number}
 */
export function getAvail(p, s) {
  let t = 0;
  if (s.l.on && rpf(p, 'l')) t += rpf(p, 'l') * s.l.m;
  if (s.c.on && rpf(p, 'c')) t += rpf(p, 'c') * s.c.m;
  if (s.e.on && rpf(p, 'e')) t += rpf(p, 'e') * s.e.m;
  if (s.i.on && rpf(p, 'i')) t += rpf(p, 'i');
  return t;
}

/**
 * Best single-pack quantity for full-pack-value analysis.
 * @param {object} p   Row
 * @param {object} s   Pack state from ps()
 * @returns {{ qty: number, src: string }|null}
 */
export function getBestQty(p, s) {
  if (s.i.on && rpf(p, 'i')) return { qty: rpf(p, 'i'), src: 'Infra SPD' };
  if (s.e.on && rpf(p, 'e')) return { qty: rpf(p, 'e'), src: 'Expanded' };
  if (s.c.on && rpf(p, 'c')) return { qty: rpf(p, 'c'), src: 'Core' };
  if (s.l.on && rpf(p, 'l')) return { qty: rpf(p, 'l'), src: 'Launch' };
  return null;
}

/**
 * Effective price for a row (checks PRICES override, then cpu_key, then cpu).
 * @param {object} p   Row
 * @returns {number}
 */
export function getPrice(p) {
  if (p.cpu_key && PRICES[p.cpu_key] !== undefined) return PRICES[p.cpu_key];
  if (p.id      && PRICES[p.id]      !== undefined) return PRICES[p.id];
  if (p.cpu !== undefined) return p.cpu;
  return 0;
}

/**
 * Effective assigned count for a row (respects USAGE_DATA override).
 * @param {object} p   Row (must have a stable identity — use index or name as key)
 * @param {string|number} rowId
 * @returns {number}
 */
export function getAssigned(p, rowId) {
  const override = USAGE_DATA[rowId];
  if (override && override.assigned !== null && override.assigned !== undefined) return override.assigned;
  return p.assigned;
}

/**
 * Expected monthly cost for a row given its price and assigned count.
 * @param {object} p
 * @returns {number}  Annual USD
 */
export function getExpectedMonthly(p) {
  return getPrice(p) * p.assigned;
}

/**
 * Return the full combined tenant row list (TENANT_DEFAULT + TENANT_CUSTOM),
 * with USAGE_DATA assigned overrides applied.
 * @returns {Array}
 */
export function allTenantRows() {
  const base = TENANT_DEFAULT.map((p, i) => {
    const rowId = 'tenant-' + i;
    const override = USAGE_DATA[rowId];
    if (!override) return p;
    return {
      ...p,
      assigned: override.assigned !== null && override.assigned !== undefined ? override.assigned : p.assigned,
    };
  });
  return [...base, ...TENANT_CUSTOM];
}

// ════════════════════════════════════════════════════════════════════
// PRICE STATE INIT
// ════════════════════════════════════════════════════════════════════

export function updatePackDisplays() {
  ['l','c','e','i'].forEach(k => {
    const el = document.getElementById('disp-p' + k);
    if (el) el.textContent = '$' + PACK_COSTS[k].toLocaleString();
  });
}

/** Alias used by some render modules. */
export function updatePackTotal() {
  updatePackDisplays();
}

export function initPrices() {
  const saved     = localStorage.getItem('sg_prices_v2');
  const savedPacks = localStorage.getItem('sg_pack_costs_v2');
  const defaults  = {};
  PACK_LICENSES.forEach(p => { defaults[p.id] = p.cpu; });
  setPRICES(saved ? { ...defaults, ...JSON.parse(saved) } : { ...defaults });
  if (savedPacks) setPACK_COSTS(JSON.parse(savedPacks));
  // Sync pack cost inputs
  ['l','c','e','i'].forEach(k => {
    const inp = document.getElementById('pp-' + k);
    if (inp) inp.value = PACK_COSTS[k];
  });
  updatePackDisplays();
}

// ════════════════════════════════════════════════════════════════════
// TAB SWITCHING
// ════════════════════════════════════════════════════════════════════

export function showTab(id) {
  document.querySelectorAll('.tabpanel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const idx = ['tab-usage','tab-all','tab-cloud','tab-fin1','tab-fin2','tab-prices'].indexOf(id);
  document.querySelectorAll('.tab')[idx].classList.add('active');
  if (id === 'tab-all')    renderAll();
  if (id === 'tab-cloud')  renderCloud();
  if (id === 'tab-fin1')   renderFin1();
  if (id === 'tab-fin2')   renderFin2();
  if (id === 'tab-prices') renderPricesPage();
}

// ════════════════════════════════════════════════════════════════════
// PACK TOGGLE
// ════════════════════════════════════════════════════════════════════

export function onPT() {
  const s = ps();
  ['l','c','e','i'].forEach(k => {
    const card = document.getElementById('card-' + k);
    if (card) card.classList.toggle('active', s[k].on);
    const hdr = document.getElementById('h-' + k);
    if (hdr) {
      hdr.style.opacity = s[k].on ? '1' : '.35';
      const nm = { l: 'Launch', c: 'Core', e: 'Expanded', i: 'Infra SPD' };
      hdr.textContent = nm[k] + (k !== 'i' ? (s[k].on ? ' ×' + s[k].m : ' (off)') : (s[k].on ? '' : ' (off)'));
    }
  });
  renderUsage();
  const active = document.querySelector('.tabpanel.active');
  if (active) {
    const id = active.id;
    if (id === 'tab-fin1')  renderFin1();
    if (id === 'tab-fin2')  renderFin2();
    if (id === 'tab-cloud') renderCloud();
  }
}

// ════════════════════════════════════════════════════════════════════
// PRICE PAGE ACTIONS
// ════════════════════════════════════════════════════════════════════

export function onPriceChange() {
  const newPrices = { ...PRICES };
  document.querySelectorAll('.pr-input[data-id]').forEach(inp => {
    newPrices[inp.dataset.id] = parseFloat(inp.value) || 0;
  });
  setPRICES(newPrices);
  const newCosts = { ...PACK_COSTS };
  ['l','c','e','i'].forEach(k => {
    const inp = document.getElementById('pp-' + k);
    if (inp) newCosts[k] = parseFloat(inp.value) || 0;
  });
  setPACK_COSTS(newCosts);
  updatePackDisplays();
  const active = document.querySelector('.tabpanel.active');
  if (active) {
    const id = active.id;
    if (id === 'tab-fin1')  renderFin1();
    if (id === 'tab-fin2')  renderFin2();
    if (id === 'tab-all')   renderAll();
    if (id === 'tab-usage') renderUsage();
  }
}

export function savePrices() {
  localStorage.setItem('sg_prices_v2', JSON.stringify(PRICES));
  localStorage.setItem('sg_pack_costs_v2', JSON.stringify(PACK_COSTS));
  const el = document.getElementById('save-confirm');
  el.style.display = 'inline';
  setTimeout(() => el.style.display = 'none', 3000);
}

export function resetPrices() {
  if (!confirm('Reset all prices to Microsoft retail defaults?')) return;
  localStorage.removeItem('sg_prices_v2');
  localStorage.removeItem('sg_pack_costs_v2');
  setPACK_COSTS({ ...DEFAULT_PACK_COSTS });
  const defaults = {};
  PACK_LICENSES.forEach(p => { defaults[p.id] = p.cpu; });
  setPRICES({ ...defaults });
  renderPricesPage();
  onPriceChange();
}

// ════════════════════════════════════════════════════════════════════
// USAGE INLINE EDIT
// ════════════════════════════════════════════════════════════════════

export function onUsageEdit(rowId, field, value) {
  const existing = USAGE_DATA[rowId] || {};
  setUSAGE_DATA({ ...USAGE_DATA, [rowId]: { ...existing, [field]: parseInt(value) || 0 } });
  bumpClientVersion();
  renderUsage();
}

export function onUsageEditEvt(evt, rowId, field) {
  onUsageEdit(rowId, field, evt.target.value);
}

// ════════════════════════════════════════════════════════════════════
// ADD LICENSE MODAL
// ════════════════════════════════════════════════════════════════════

export function openAddLicense() {
  const modal = document.getElementById('modal-add-lic');
  if (modal) modal.style.display = 'flex';
}

export function closeAddLicense() {
  const modal = document.getElementById('modal-add-lic');
  if (modal) modal.style.display = 'none';
}

export function switchAddTab(mode) {
  setAddLicMode(mode);
  document.querySelectorAll('.add-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  document.querySelectorAll('.add-tab-panel').forEach(p => p.classList.toggle('active', p.dataset.mode === mode));
}

export function confirmAddLicense() {
  const nameEl = document.getElementById('add-lic-name');
  const name   = (nameEl && nameEl.value.trim()) || '';
  if (!name) { showToast('Please enter a license name', 'warn'); return; }
  const assignedEl = document.getElementById('add-lic-assigned');
  const totalEl    = document.getElementById('add-lic-total');
  const cpuEl      = document.getElementById('add-lic-cpu');
  const newRow = {
    id:       'custom-' + Date.now(),
    name,
    total:    parseInt(totalEl && totalEl.value)    || 0,
    assigned: parseInt(assignedEl && assignedEl.value) || 0,
    ct:       'uncovered',
    pp:       null,
    note:     null,
    l: null, c: null, e: null, i: null,
    n26: false, n25: false,
    cpu: parseFloat(cpuEl && cpuEl.value) || 0,
  };
  setTENANT_CUSTOM([...TENANT_CUSTOM, newRow]);
  bumpClientVersion();
  closeAddLicense();
  renderUsage();
  showToast('License added', 'ok');
}

export function removeCustomLicense(id) {
  setTENANT_CUSTOM(TENANT_CUSTOM.filter(r => r.id !== id));
  bumpClientVersion();
  renderUsage();
}

// ════════════════════════════════════════════════════════════════════
// REPLACEMENT MODAL
// ════════════════════════════════════════════════════════════════════

export function populateReplaceSelects() {
  const fromSel = document.getElementById('rep-from');
  const toSel   = document.getElementById('rep-to-pack');
  if (!fromSel || !toSel) return;
  const tenantRows = allTenantRows();
  fromSel.innerHTML = tenantRows.map((p, i) =>
    '<option value="' + i + '">' + p.name + '</option>'
  ).join('');
  const s = ps();
  const activePacks = PACK_LICENSES.filter(p =>
    (s.l.on && p.l) || (s.c.on && p.c) || (s.e.on && p.e) || (s.i.on && p.i)
  );
  toSel.innerHTML = activePacks.map(p =>
    '<option value="' + p.id + '">' + p.name + '</option>'
  ).join('');
  renderExistingReplacements();
}

export function onReplaceFromChange() { /* placeholder for future per-from validation */ }
export function onReplaceToChange()   { /* placeholder for future per-to validation */ }

export function renderExistingReplacements() {
  const container = document.getElementById('rep-list');
  if (!container) return;
  if (!REPLACEMENTS.length) { container.innerHTML = '<p style="font-size:11px;color:var(--text-muted)">No replacements configured.</p>'; return; }
  const tenantRows = allTenantRows();
  container.innerHTML = REPLACEMENTS.map((r, i) => {
    const fromRow = tenantRows[r.fromId];
    const toPack  = PACK_LICENSES.find(p => p.id === r.toPackId);
    return '<div class="rep-item">' +
      '<span>' + (fromRow ? fromRow.name : r.fromId) + ' → ' + (toPack ? toPack.name : r.toPackId) + ' (' + r.qty + ')</span>' +
      '<button onclick="removeReplacement(' + i + ')">✕</button>' +
      '</div>';
  }).join('');
}

export function removeReplacement(idx) {
  const newReps = REPLACEMENTS.filter((_, i) => i !== idx);
  setREPLACEMENTS(newReps);
  bumpClientVersion();
  renderExistingReplacements();
  applyReplacements();
}

export function applyReplacements() {
  // Replacements mutate assigned overrides in USAGE_DATA.
  // Reset any replacement-derived overrides, then re-apply.
  const tenantRows = allTenantRows();
  REPLACEMENTS.forEach(r => {
    const row = tenantRows[r.fromId];
    if (!row) return;
    const rowId = 'tenant-' + r.fromId;
    const existing = USAGE_DATA[rowId] || {};
    setUSAGE_DATA({ ...USAGE_DATA, [rowId]: { ...existing, _hasReplacement: true } });
  });
  bumpClientVersion();
  renderUsage();
}

// ════════════════════════════════════════════════════════════════════
// EXPOSE GLOBALS (needed for inline onclick attributes in HTML)
// ════════════════════════════════════════════════════════════════════
Object.assign(window, {
  // Tab / pack
  showTab, onPT,
  // Render helpers
  renderUsage, renderAll, renderCloud, renderFin1, renderFin2, renderPricesPage,
  // Sort / filter
  srt1, srtAll, setVF, setPackF,
  // Prices
  onPriceChange, savePrices, resetPrices,
  // Usage edit
  onUsageEdit, onUsageEditEvt,
  // Add license modal
  openAddLicense, closeAddLicense, confirmAddLicense, switchAddTab, removeCustomLicense,
  // Replacement modal
  populateReplaceSelects, onReplaceFromChange, onReplaceToChange,
  renderExistingReplacements, removeReplacement, applyReplacements,
});

// ════════════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════════════
(async function init() {
  // Language
  const lang = detectLang();
  setLang(lang);

  // Prices from localStorage
  initPrices();

  // Server sync
  try {
    const serverData = await loadFromServer();
    if (serverData) syncFromServer(serverData);
  } catch (e) {
    console.warn('Server sync failed, using local state', e);
  }

  // Initial render
  onPT();
  renderUsage();
})();
