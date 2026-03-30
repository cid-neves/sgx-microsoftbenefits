// ════════════════════════════════════════════════════════════════════
// src/main.js — App entry point, shared helpers & all app logic
// ════════════════════════════════════════════════════════════════════
import { PACK_LICENSES, DEFAULT_PACK_COSTS, SKU_LOOKUP } from './data.js';
import {
  USAGE_DATA, TENANT_CUSTOM, REPLACEMENTS, PACK_COSTS, PRICES,
  PACK_CONFIG, editTimers, lastSaveActivity, saveDebounce,
  setTENANT_CUSTOM, setREPLACEMENTS, setPACK_COSTS, setPRICES, setPACK_CONFIG,
  setLastSaveActivity, setSaveDebounce, setAddLicMode, addLicMode,
  currentClient, clientLicenses, setCurrentClient, setClientLicenses, rebuildTenantCustom, clientStateId,
} from './state.js';
import { detectLang, t, applyI18n, setLang } from './i18n.js';
import { saveToServer, loadFromServer, syncFromServer, updateSyncStatus, showToast, startAutoRefresh, loadSnapshots, previewSnap, doRestore, loadAudit, buildDefaultPrices, saveRowSources, scheduleSave } from './sync.js';
import { listClients, createClient, loadLicenses } from './pb.js';
import { renderLicenses, openAddLicenseModal, openEditLicense, closeAddLicenseModal, saveAddLicenseModal, deleteLicenseRow, onLicNameInput, startEditPrice, openCsvImport, closeCsvImport, doCsvImport, fetchPrices } from './render/licenses.js';
import { renderUsage, updateStats1, srt1, setVF, getRowSources, setRowSources, addRepSource, delRepSource, onRepSelectChange, onRepQtyChange } from './render/usage.js';
import { renderFin1, renderFin2, renderCloud, renderFin1_safe, renderFin2_safe } from './render/finance.js';
import { renderAll, renderAll_safe, renderPurchaseTab, renderPricesPage, setPackF, srtAll, markDirty } from './render/allpacks.js';

// ════════════════════════════════════════════════════════════════════
// SHARED HELPERS
// ════════════════════════════════════════════════════════════════════

export function ps() {
  const g = id => { const el=document.getElementById(id); return el?el.checked:false; };
  const n = id => { const el=document.getElementById(id); return el?(parseInt(el.value)||1):1; };
  return {
    l:  {on:g('tog-l'),  m:n('mult-l')},
    c:  {on:g('tog-c'),  m:n('mult-c')},
    e:  {on:g('tog-e'),  m:n('mult-e')},
    i:  {on:g('tog-i'),  m:1},
    mw: {on:g('tog-mw'), m:1},
    sec:{on:g('tog-sec'),m:1},
    avd:{on:g('tog-avd'),m:1},
  };
}

export function getAzcoreQty(p) {
  if (!p.azcore) return 0;
  const vals = ['i','mw','sec','avd'].map(k=>p[k]).filter(v=>v!=null&&v>0);
  return vals.length ? Math.min(...vals) : 0;
}

export function getAvail(p, s) {
  let t=0;
  const v = key => rpf(p, key);
  if(s.l.on  && v('l'))   t += v('l')  * s.l.m;
  if(s.c.on  && v('c'))   t += v('c')  * s.c.m;
  if(s.e.on  && v('e'))   t += v('e')  * s.e.m;
  const az = getAzcoreQty(p);
  const spd_keys = ['i','mw','sec','avd'];
  if (az && spd_keys.some(k=>s[k]&&s[k].on&&v(k))) t += az;
  spd_keys.forEach(k=>{if(s[k]&&s[k].on&&v(k)) t+=Math.max(0,v(k)-az);});
  return t;
}

export function getBestQty(p, s) {
  const v = key => rpf(p, key);
  const cands = [];
  if(s.i.on  && v('i'))   cands.push({qty:v('i'),   src:'Infra SPD'});
  if(s.mw  && s.mw.on  && v('mw'))  cands.push({qty:v('mw'),  src:'Modern Work'});
  if(s.sec && s.sec.on && v('sec')) cands.push({qty:v('sec'), src:'Security'});
  if(s.avd && s.avd.on && v('avd')) cands.push({qty:v('avd'), src:'AVD'});
  if(s.e.on  && v('e'))   cands.push({qty:v('e')*s.e.m, src:'Expanded'});
  if(s.c.on  && v('c'))   cands.push({qty:v('c')*s.c.m, src:'Core'});
  if(s.l.on  && v('l'))   cands.push({qty:v('l')*s.l.m, src:'Launch'});
  if(!cands.length) return null;
  return cands.reduce((best,c)=>c.qty>best.qty?c:best);
}

export function getPrice(p) {
  if (p.cpu_key) return PRICES[p.cpu_key] ?? PACK_LICENSES.find(pl=>pl.id===p.cpu_key)?.cpu ?? 0;
  return PRICES[p.id] ?? p.cpu ?? 0;
}

export function rpf(p, key) {
  if (p[key] !== undefined && p[key] !== null) return p[key];
  if (p.cpu_key) return PACK_LICENSES.find(pl => pl.id === p.cpu_key)?.[key] ?? null;
  return null;
}

export function getAssigned(p) {
  const stored = USAGE_DATA[p.id];
  if (stored && stored.assigned !== undefined) return stored.assigned;
  return p.assigned;
}

export function getExpectedMonthly(p) {
  const stored = USAGE_DATA[p.id];
  if (stored && stored.expected_monthly !== undefined) return stored.expected_monthly;
  return 0;
}

export function fm(n) { return '$'+Math.round(n).toLocaleString('en-US'); }
export function co(ct) { return {covered:0,upgrade:1,uncovered:2,free:3}[ct]??4; }

export function allTenantRows() {
  return [...TENANT_CUSTOM].filter(Boolean);
}
// ════════════════════════════════════════════════════════════════════
// CUSTOM ENTRIES
// ════════════════════════════════════════════════════════════════════
export function loadCustomEntries() {
  // TENANT_CUSTOM is built from PocketBase clientLicenses via rebuildTenantCustom()
  // REPLACEMENTS come from client_state loaded via loadFromServer()
  applyReplacements();
}

export function saveCustomEntries() {
  scheduleSave();
}

// ════════════════════════════════════════════════════════════════════
// TABS
// ════════════════════════════════════════════════════════════════════
export function showTab(id) {
  document.querySelectorAll('.tabpanel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  const panel = document.getElementById(id);
  if (panel) panel.classList.add('active');
  const btn = document.querySelector('.tab[data-tab="'+id+'"]');
  if (btn) btn.classList.add('active');
  if(id==='t-all') renderAll();
  if(id==='t-cloud') renderCloud();
  if(id==='t-fin1') renderFin1();
  if(id==='t-fin2') renderFin2();
  if(id==='t-prices') renderPricesPage();
  if(id==='t-purchase') renderPurchaseTab();
  if(id==='t-licenses') renderLicenses();
}

// ════════════════════════════════════════════════════════════════════
// PACK TOGGLE & TOTALS
// ════════════════════════════════════════════════════════════════════
export function onPT() {
  const s = ps();
  const allKeys = ['l','c','e','i','mw','sec','avd'];
  const colNames = {l:t('launch_name'),c:t('core_name'),e:t('exp_name'),i:'Infra',mw:'MW SPD',sec:'Sec SPD',avd:'AVD'};
  allKeys.forEach(k => {
    const sk = s[k]; if(!sk) return;
    const card = document.getElementById('card-'+k);
    if(card) card.classList.toggle('active', sk.on);
    const hdr = document.getElementById('h-'+k);
    if(hdr) {
      hdr.style.opacity = sk.on ? '1' : '.35';
      const hasM = (k==='l'||k==='c'||k==='e');
      hdr.textContent = colNames[k] + (hasM?(sk.on?' ×'+sk.m:' '+t('off')):(sk.on?'':' '+t('off')));
    }
  });
  // Update total investment
  updatePackTotal();
  // Update PACK_CONFIG state and schedule save
  const s2 = ps();
  setPACK_CONFIG({
    l:{enabled:s2.l.on,multiplier:s2.l.m},
    c:{enabled:s2.c.on,multiplier:s2.c.m},
    e:{enabled:s2.e.on,multiplier:s2.e.m},
    i:{enabled:s2.i.on,multiplier:1},
    mw:{enabled:s2.mw.on,multiplier:1},
    sec:{enabled:s2.sec.on,multiplier:1},
    avd:{enabled:s2.avd.on,multiplier:1},
  });
  scheduleSave(800);
  renderUsage();
  const at = document.querySelector('.tabpanel.active');
  if(at){const id=at.id;if(id==='t-fin1')renderFin1();if(id==='t-fin2')renderFin2();if(id==='t-cloud')renderCloud();}
}

export function updatePackTotal() {
  const s = ps();
  let total = 0;
  if(s.l.on)  total += (PACK_COSTS.l||0) * s.l.m;
  if(s.c.on)  total += (PACK_COSTS.c||0) * s.c.m;
  if(s.e.on)  total += (PACK_COSTS.e||0) * s.e.m;
  // SPD fee is paid once regardless of how many designations are active
  const anySpd = s.i.on || s.mw.on || s.sec.on;
  if(anySpd) total += (PACK_COSTS.i||4730);
  // AVD specialization has no additional fee
  const el = document.getElementById('pack-total-val');
  if(el) el.textContent = '$' + total.toLocaleString('en-US');
}

export function syncPackCostInputs() {
  ['l','c','e','i','mw','sec'].forEach(k => {
    const inp = document.getElementById('pp-'+k);
    if(inp) inp.value = PACK_COSTS[k] ?? 0;
    const disp = document.getElementById('disp-p'+k);
    if(disp) disp.textContent = '$'+(PACK_COSTS[k]||0).toLocaleString();
  });
  updatePackTotal();
}

// ════════════════════════════════════════════════════════════════════
// INLINE EDIT
// ════════════════════════════════════════════════════════════════════
export function onUsageEditEvt(inp) { onUsageEdit(inp.dataset.pid, inp.dataset.field, inp); }
export function onUsageEdit(id, field, el) {
  setLastSaveActivity(Date.now());
  el.classList.add('dirty');
  clearTimeout(editTimers[id+'_'+field]);
  editTimers[id+'_'+field] = setTimeout(async () => {
    const val = parseFloat(el.value) || 0;
    if (!USAGE_DATA[id]) USAGE_DATA[id] = {};
    USAGE_DATA[id][field] = val;
    el.classList.remove('dirty');
    el.classList.add('saving');
    el.classList.remove('saving');
    scheduleSave(600);
    renderUsage(); renderFin1_safe(); renderFin2_safe(); renderPurchaseTab();
  }, 600);
}

// ════════════════════════════════════════════════════════════════════
// PRICES
// ════════════════════════════════════════════════════════════════════
export function onPriceChange(id) {
  const inp = document.getElementById(id);
  if(!inp) return;
  const val = parseFloat(inp.value)||0;
  if(['pp-l','pp-c','pp-e','pp-i','pp-mw','pp-sec'].includes(id)) {
    PACK_COSTS[id.replace('pp-','')]=val;
    syncPackCostInputs();
    updatePackTotal();
  }
}

export async function savePrices() {
  // Collect all dirty price inputs
  const newPrices = {};
  document.querySelectorAll('.pr-inp[data-id]').forEach(inp=>{
    const id=inp.dataset.id,val=parseFloat(inp.value)||0;
    PRICES[id]=val;newPrices[id]=val;
    inp.classList.remove('dirty');
  });
  // Pack costs
  ['l','c','e','i'].forEach(k=>{ const inp=document.getElementById('pp-'+k); if(inp) PACK_COSTS[k]=parseFloat(inp.value)||0; });
  const btn=document.getElementById('save-prices-btn');
  if(btn){btn.disabled=true;btn.textContent=t('saving');}
  const ok = await (saveToServer(), true);
  if(btn){btn.disabled=false;btn.querySelector('span').textContent=t('save_prices');}
  const sc=document.getElementById('save-confirm'),se=document.getElementById('save-error');
  if(ok){sc.textContent=t('save_confirm');sc.style.display='inline';se.style.display='none';setTimeout(()=>sc.style.display='none',3000);}
  else{se.textContent=t('sync_error');se.style.display='inline';sc.style.display='none';}
  renderAll_safe();
}

async function resetPrices() {
  if(!confirm(t('reset_confirm'))) return;
  setPRICES(buildDefaultPrices());
  setPACK_COSTS({...DEFAULT_PACK_COSTS});
  await saveToServer();
  renderPricesPage();
  syncPackCostInputs();
  renderAll_safe();
}

// ════════════════════════════════════════════════════════════════════
// ADD LICENSE MODAL
// ════════════════════════════════════════════════════════════════════
export function openAddLicense() {
  // Populate the pack catalog dropdown (exclude already-added items)
  const sel = document.getElementById('add-pack-select');
  const existingIds = new Set(allTenantRows().map(p => p.id));
  sel.innerHTML = '<option value="">— ' + t('add_lic_select') + ' —</option>';

  // Group by category
  const cats = {};
  PACK_LICENSES.forEach(pl => {
    if (!cats[pl.cat]) cats[pl.cat] = [];
    cats[pl.cat].push(pl);
  });
  Object.entries(cats).sort(([a],[b])=>a.localeCompare(b)).forEach(([cat, items]) => {
    const grp = document.createElement('optgroup');
    grp.label = cat;
    items.forEach(pl => {
      const opt = document.createElement('option');
      opt.value = pl.id;
      const alreadyAdded = existingIds.has('t-'+pl.id) || existingIds.has(pl.id);
      opt.textContent = pl.name + ' (' + pl.type + ')' + (alreadyAdded ? ' ✓' : '');
      opt.disabled = alreadyAdded;
      grp.appendChild(opt);
    });
    sel.appendChild(grp);
  });

  document.getElementById('add-pack-qty').value = '0';
  document.getElementById('add-custom-name').value = '';
  document.getElementById('add-custom-qty').value = '0';
  document.getElementById('add-custom-cpu').value = '0';
  document.getElementById('add-pack-preview').style.display = 'none';
  switchAddTab('pack', document.querySelector('.add-lic-tab'));
  document.getElementById('add-lic-overlay').classList.add('open');
  applyI18n();
}

export function closeAddLicense() {
  document.getElementById('add-lic-overlay').classList.remove('open');
}

export function switchAddTab(mode, btn) {
  addLicMode = mode;
  document.querySelectorAll('.add-lic-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('add-sec-pack').classList.toggle('active', mode === 'pack');
  document.getElementById('add-sec-custom').classList.toggle('active', mode === 'custom');
  document.getElementById('add-sec-azure').classList.toggle('active', mode === 'azure');
  document.getElementById('add-sec-replace').classList.toggle('active', mode === 'replace');
  // On azure tab: pre-fill current value and update confirm button label
  if (mode === 'azure') {
    const cur = getExpectedMonthly({id:'t-azure'});
    document.getElementById('add-azure-monthly').value = cur || 0;
    updateAzurePreview(cur || 0);
    document.getElementById('add-lic-confirm-btn').setAttribute('data-i18n', 'save_prices');
    document.getElementById('add-lic-confirm-btn').textContent = t('save_prices');
  } else if (mode === 'replace') {
    populateReplaceSelects();
    renderExistingReplacements();
    document.getElementById('add-lic-confirm-btn').setAttribute('data-i18n', 'add_lic_replace_btn');
    document.getElementById('add-lic-confirm-btn').textContent = t('add_lic_replace_btn');
    // Translate all data-i18n elements in the replace section (hidden when modal opened)
    document.querySelectorAll('#add-sec-replace [data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('#add-sec-replace [data-i18n-html]').forEach(el => {
      el.innerHTML = t(el.dataset.i18nHtml);
    });
  } else {
    document.getElementById('add-lic-confirm-btn').setAttribute('data-i18n', 'add_lic_add');
    document.getElementById('add-lic-confirm-btn').textContent = t('add_lic_add');
  }
}

function updateAzurePreview(monthly) {
  const s = ps();
  const av = getAvail({l:700,c:2400,e:5000,i:10000}, s);
  const annual = monthly * 12;
  const preview = document.getElementById('add-azure-preview');
  if (!preview) return;
  if (monthly > 0) {
    const pct = av > 0 ? Math.round((annual / av) * 100) : 0;
    const status = annual > av ? '⚠ Over pack limit' : pct >= 80 ? '⚡ Near pack limit' : '✓ Within pack limit';
    preview.innerHTML =
      'Annual spend: <strong>$' + Math.round(annual).toLocaleString() + '</strong> &nbsp;·&nbsp; ' +
      'Pack credits: <strong>$' + av.toLocaleString() + '/yr</strong> &nbsp;·&nbsp; ' +
      'Usage: <strong>' + pct + '%</strong> &nbsp;·&nbsp; ' + status;
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }
}

function onPackSelectChange() {
  const sel = document.getElementById('add-pack-select');
  const id = sel.value;
  const preview = document.getElementById('add-pack-preview');
  if (!id) { preview.style.display = 'none'; return; }
  const pl = PACK_LICENSES.find(p => p.id === id);
  if (!pl) { preview.style.display = 'none'; return; }
  const s = ps();
  const bq = getBestQty(pl, s);
  const cpu = PRICES[pl.id] ?? pl.cpu;
  preview.innerHTML =
    '<strong>' + pl.name + '</strong><br>' +
    pl.cat + ' · ' + pl.type + '<br>' +
    (bq ? 'Pack qty: <strong>' + bq.qty + '</strong> (' + bq.src + ')' : 'Not in active packs') +
    (cpu > 0 ? ' · Cost: <strong>$' + cpu.toLocaleString() + '/yr</strong>' : '');
  preview.style.display = 'block';
}

function confirmAddLicense() {
  const now = Date.now();

  if (addLicMode === 'azure') {
    const monthly = parseFloat(document.getElementById('add-azure-monthly').value) || 0;
    if (!USAGE_DATA['t-azure']) USAGE_DATA['t-azure'] = {};
    USAGE_DATA['t-azure'].expected_monthly = monthly;
    saveToServer({ usage: { 't-azure': USAGE_DATA['t-azure'] } });
    closeAddLicense();
    renderUsage();
    renderFin1_safe();
    return;
  }

  if (addLicMode === 'replace') {
    const fromId  = document.getElementById('rep-from-select').value;
    const toPackId = document.getElementById('rep-to-select').value;
    const qty     = parseInt(document.getElementById('rep-qty').value) || 0;
    if (!fromId) { document.getElementById('rep-from-select').focus(); return; }
    if (!toPackId) { document.getElementById('rep-to-select').focus(); return; }
    if (qty <= 0) { document.getElementById('rep-qty').focus(); return; }
    // Check for duplicate
    const existing = REPLACEMENTS.find(r => r.fromId === fromId);
    if (existing) {
      existing.toPackId = toPackId;
      existing.qty = qty;
    } else {
      REPLACEMENTS.push({ fromId, toPackId, qty });
    }
    applyReplacements();
    saveCustomEntries();
    closeAddLicense();
    renderUsage();
    renderFin1_safe();
    return;
  }

  if (addLicMode === 'pack') {
    const sel = document.getElementById('add-pack-select');
    const id = sel.value;
    if (!id) { alert(t('add_lic_select')); return; }
    const pl = PACK_LICENSES.find(p => p.id === id);
    if (!pl) return;
    const qty = parseInt(document.getElementById('add-pack-qty').value) || 0;
    const cpu = PRICES[pl.id] ?? pl.cpu;
    // Determine coverage: if pack has it → covered, else uncovered
    const s = ps();
    const bq = getBestQty(pl, s);
    const entry = {
      id: 'custom-' + id + '-' + now,
      name: pl.name,
      assigned: qty,
      ct: bq ? 'covered' : 'uncovered',
      pp: bq ? pl.name + ' (pack)' : null,
      note: t('add_lic_note'),
      // Copy pack columns from PACK_LICENSES
      l: pl.l, c: pl.c, e: pl.e, i: pl.i,
      n26: pl.n26, n25: pl.n25,
      cpu_key: pl.id,
      isCustom: true,
      total: qty,
    };
    TENANT_CUSTOM.push(entry);
    // Persist assigned count
    USAGE_DATA[entry.id] = { assigned: qty };

  } else {
    const name = document.getElementById('add-custom-name').value.trim();
    if (!name) { document.getElementById('add-custom-name').focus(); return; }
    const qty  = parseInt(document.getElementById('add-custom-qty').value) || 0;
    const ct   = document.getElementById('add-custom-ct').value;
    const cpu  = parseFloat(document.getElementById('add-custom-cpu').value) || 0;
    const type = document.getElementById('add-custom-type').value;
    const id   = 'custom-manual-' + now;
    const entry = {
      id,
      name,
      assigned: qty,
      ct,
      pp: null,
      note: t('add_lic_note'),
      l: null, c: null, e: null, i: null,
      n26: false, n25: false,
      cpu,
      isCustom: true,
      total: qty,
    };
    TENANT_CUSTOM.push(entry);
    USAGE_DATA[id] = { assigned: qty };
    // Also save custom price
    if (cpu > 0) PRICES[id] = cpu;
  }

  saveCustomEntries();
  closeAddLicense();
  renderUsage();
}

function removeCustomLicense(id) {
  if (!confirm(t('add_lic_remove_confirm'))) return;
  setTENANT_CUSTOM(TENANT_CUSTOM.filter(p => p.id !== id));
  delete USAGE_DATA[id];
  saveCustomEntries();
  renderUsage();
}


// ══════════════════════════════════════════════════════════════════
// LICENSE REPLACEMENT ENGINE
// ══════════════════════════════════════════════════════════════════

// Applies all replacements: mutates ct/pp/replacedBy on TENANT rows
// so the rest of the app automatically uses correct coverage status.
function applyReplacements() {
  // First reset any previously applied replacements on TENANT_DEFAULT rows
  TENANT_DEFAULT.forEach(p => {
    if (p._origCt !== undefined) {
      p.ct = p._origCt;
      p.pp = p._origPp;
      delete p._origCt;
      delete p._origPp;
      delete p.replacedBy;
    }
  });
  TENANT_CUSTOM.forEach(p => {
    if (p._origCt !== undefined) {
      p.ct = p._origCt;
      p.pp = p._origPp;
      delete p._origCt;
      delete p._origPp;
      delete p.replacedBy;
    }
  });

  // Now apply each replacement
  REPLACEMENTS.forEach(rep => {
    const row = allTenantRows().find(p => p.id === rep.fromId);
    if (!row) return;
    const pl = PACK_LICENSES.find(p => p.id === rep.toPackId);
    if (!pl) return;
    const s = ps();
    const bq = getBestQty(pl, s);
    // Save original values (only once)
    if (row._origCt === undefined) {
      row._origCt = row.ct;
      row._origPp = row.pp;
    }
    // Determine new coverage
    const newCt = bq ? 'upgrade' : 'uncovered';
    row.ct = newCt;
    row.pp = pl.name + ' (pack replacement)';
    row.replacedBy = rep.toPackId;
    row.replacedQty = rep.qty;
    // Copy pack fields so getAvail works
    row.cpu_key = pl.id;
    ['l','c','e','i','mw','sec','avd'].forEach(k => {
      if (row[k] === undefined || row._origCt !== undefined) row[k] = pl[k];
    });
  });
}

function populateReplaceSelects() {

  // FROM: all non-free tenant rows (including custom)
  const fromSel = document.getElementById('rep-from-select');
  fromSel.innerHTML = '<option value="">' + t('add_lic_replace_select_from') + '</option>';
  allTenantRows().filter(p => p && p.ct !== 'free' && p.name).forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    const ctLabel = {covered:'covered',upgrade:'upgrade avail.',uncovered:'needs purchase'}[p.ct]||p.ct;
    const hasRep = REPLACEMENTS.find(r => r.fromId === p.id);
    const srcCount = (USAGE_DATA[p.id] && USAGE_DATA[p.id].sources && USAGE_DATA[p.id].sources.length) || 0;
    opt.textContent = p.name + ' — ' + ctLabel + (srcCount?' ('+srcCount+' source'+(srcCount>1?'s':'')+')':'') + (hasRep ? ' ✓' : '');
    fromSel.appendChild(opt);
  });

  // TO: PACK_LICENSES grouped by category
  const toSel = document.getElementById('rep-to-select');
  toSel.innerHTML = '<option value="">' + t('add_lic_replace_select_to') + '</option>';
  const cats = {};
  PACK_LICENSES.forEach(pl => {
    if (!cats[pl.cat]) cats[pl.cat] = [];
    cats[pl.cat].push(pl);
  });
  Object.entries(cats).sort(([a],[b])=>a.localeCompare(b)).forEach(([cat, items]) => {
    const grp = document.createElement('optgroup');
    grp.label = cat;
    items.forEach(pl => {
      const opt = document.createElement('option');
      opt.value = pl.id;
      opt.textContent = pl.name + ' (' + pl.type + ')';
      grp.appendChild(opt);
    });
    toSel.appendChild(grp);
  });

  // Pre-fill if editing existing replacement
  const fromSel2 = document.getElementById('rep-from-select');
  if (fromSel2.value) onReplaceFromChange();
}

function onReplaceFromChange() {
  const fromId = document.getElementById('rep-from-select').value;
  const existing = REPLACEMENTS.find(r => r.fromId === fromId);
  if (existing) {
    document.getElementById('rep-to-select').value = existing.toPackId;
    document.getElementById('rep-qty').value = existing.qty;
    onReplaceToChange();
  } else {
    // Auto-fill qty from tenant assigned count
    const row = allTenantRows().find(p => p.id === fromId);
    if (row) document.getElementById('rep-qty').value = getAssigned(row);
    onReplaceToChange();
  }
}

function onReplaceToChange() {
  const fromId   = document.getElementById('rep-from-select').value;
  const toPackId = document.getElementById('rep-to-select').value;
  const preview  = document.getElementById('rep-preview');
  const wrap     = document.getElementById('rep-preview-wrap');
  if (!fromId || !toPackId) { wrap.style.display='none'; return; }
  const from = allTenantRows().find(p => p.id === fromId);
  const pl   = PACK_LICENSES.find(p => p.id === toPackId);
  if (!from || !pl) { wrap.style.display='none'; return; }
  const s = ps();
  const bq = getBestQty(pl, s);
  const avail = bq ? bq.qty : 0;
  const qty   = parseInt(document.getElementById('rep-qty').value) || 0;
  const ok    = avail >= qty;
  preview.innerHTML =
    '<strong>' + from.name + '</strong> → <strong>' + pl.name + '</strong><br>' +
    'Pack provides: <strong>' + (avail||'—') + '</strong>' + (bq?' ('+bq.src+')':'') +
    ' &nbsp;·&nbsp; You use: <strong>' + qty + '</strong>' +
    ' &nbsp;·&nbsp; <span style="color:' + (ok?'var(--cov)':'var(--unc)') + '">' +
    (ok ? '✓ Pack covers this' : '⚠ Pack qty insufficient') + '</span>';
  wrap.style.display = 'block';
}

function renderExistingReplacements() {
  const el = document.getElementById('rep-existing');
  if (!el) return;
  if (!REPLACEMENTS.length) { el.innerHTML = ''; return; }
  let html = '<div style="font-size:10px;font-weight:700;color:var(--text-muted);letter-spacing:.7px;text-transform:uppercase;margin-bottom:7px">Existing replacements</div>';
  REPLACEMENTS.forEach(rep => {
    const from = allTenantRows().find(p => p.id === rep.fromId);
    const pl   = PACK_LICENSES.find(p => p.id === rep.toPackId);
    if (!from || !pl) return;
    html += '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--border-soft);font-size:11px">' +
      '<span style="flex:1;color:var(--text-dark)">' + from.name + ' → <strong>' + pl.name + '</strong> (×' + rep.qty + ')</span>' +
      '<button class="btn-row-remove" data-repid="' + rep.fromId + '" onclick="removeReplacement(this.dataset.repid)">✕</button>' +
      '</div>';
  });
  el.innerHTML = html;
}

function removeReplacement(fromId) {
  if (!confirm(t('add_lic_replace_confirm_msg'))) return;
  setREPLACEMENTS(REPLACEMENTS.filter(r => r.fromId !== fromId));
  applyReplacements();
  saveCustomEntries();
  renderExistingReplacements();
  renderUsage();
  renderFin1_safe();
}


// ══════════════════════════════════════════════════════════════════
// PER-ROW REPLACEMENT SOURCES
// Each row can have an ordered list of pack sources that cover its
// assigned users. Stored in USAGE_DATA[id].sources = [{packId,qty}]
// ══════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
// GLOBAL WINDOW ASSIGNMENTS (for HTML onclick attributes)
// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════
// CLIENT SELECTOR
// ════════════════════════════════════════════════════════════════════

async function showClientOverlay() {
  const overlay = document.getElementById('client-overlay');
  if (overlay) overlay.style.display = 'flex';
  document.getElementById('main-tabnav').style.display = 'none';
  document.querySelectorAll('.tabpanel').forEach(p => p.classList.remove('active'));

  const listEl = document.getElementById('client-list');
  listEl.innerHTML = '<div class="client-loading">Loading…</div>';

  try {
    const clients = await listClients();
    if (!clients.length) {
      listEl.innerHTML = '<div class="client-empty">No clients yet. Create one below.</div>';
    } else {
      listEl.innerHTML = clients.map(c =>
        `<button class="client-item" onclick="loadClientById('${c.id}','${esc_js(c.name)}')">${esc_html(c.name)}</button>`
      ).join('');
    }
  } catch (e) {
    listEl.innerHTML = `<div class="client-error">Could not connect to PocketBase: ${e.message}<br><small>Is the stack running?</small></div>`;
  }
}

function esc_html(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function esc_js(s)   { return String(s||'').replace(/'/g,"\'"); }

async function loadClientById(id, name) {
  setCurrentClient({ id, name });
  await loadClientData();
}

async function createClientAndLoad() {
  const inp = document.getElementById('client-name-input');
  const name = inp?.value?.trim();
  if (!name) { showToast('Enter a client name', 'err'); return; }
  try {
    const client = await createClient(name);
    setCurrentClient(client);
    inp.value = '';
    await loadClientData();
  } catch (e) {
    showToast('Error creating client: ' + e.message, 'err');
  }
}

async function loadClientData() {
  const client = currentClient;
  if (!client) return;

  // Load licenses
  try {
    const lics = await loadLicenses(client.id);
    setClientLicenses(lics);
    rebuildTenantCustom();
  } catch (e) {
    console.warn('Could not load licenses:', e.message);
    setClientLicenses([]);
    rebuildTenantCustom();
  }

  // Load state (pack config, usage, prices, etc.)
  await loadFromServer();

  // Show UI
  const overlay = document.getElementById('client-overlay');
  if (overlay) overlay.style.display = 'none';
  const nav = document.getElementById('main-tabnav');
  if (nav) nav.style.display = '';
  const badge = document.getElementById('client-badge');
  if (badge) badge.textContent = client.name;

  applyI18n();
  showTab('t-fin1');
  onPT();
  updatePackTotal();
}

Object.assign(window, {
  // Client selector
  showClientOverlay, createClientAndLoad, loadClientById,
  // Helpers
  ps, getAvail, getBestQty, getPrice, fm, co, rpf, getAssigned, getExpectedMonthly, allTenantRows, buildDefaultPrices,
  // Tabs & UI
  showTab, onPT, updatePackTotal, syncPackCostInputs, onUsageEditEvt, onUsageEdit,
  // Prices
  markDirty, onPriceChange, savePrices, resetPrices,
  // Render
  renderUsage, renderAll, renderCloud, renderFin1, renderFin2, renderPricesPage, renderPurchaseTab,
  renderFin1_safe, renderFin2_safe, renderAll_safe, setPackF, srtAll, srt1, setVF,
  // Sync/Backup
  saveToServer, loadSnapshots, previewSnap, doRestore, loadAudit,
  // Row sources
  addRepSource, delRepSource, onRepSelectChange, onRepQtyChange, getRowSources, setRowSources, saveRowSources,
  // Old modal (kept for compatibility)
  openAddLicense, closeAddLicense, switchAddTab, confirmAddLicense, removeCustomLicense,
  updateAzurePreview, onPackSelectChange, onReplaceFromChange, onReplaceToChange,
  applyReplacements, populateReplaceSelects, renderExistingReplacements, removeReplacement,
  // License management (new)
  openAddLicenseModal, openEditLicense, closeAddLicenseModal, saveAddLicenseModal,
  deleteLicenseRow, onLicNameInput, startEditPrice, openCsvImport, closeCsvImport, doCsvImport, fetchPrices,
  // i18n
  t, setLang, applyI18n,
  // Custom entries
  loadCustomEntries, saveCustomEntries,
});

// ════════════════════════════════════════════════════════════════════
// VERSION BADGE
// ════════════════════════════════════════════════════════════════════
fetch('/version.json?_=' + Date.now())
  .then(r => r.ok ? r.json() : null)
  .then(v => {
    const el = document.getElementById('build-badge');
    if (el && v) el.textContent = 'build #' + v.build + ' · ' + v.built;
  })
  .catch(() => {});

// INIT
// ════════════════════════════════════════════════════════════════════
(async () => {
  const lang = detectLang();
  document.getElementById('btn-'+lang)?.classList.add('active');
  document.getElementById('btn-'+(lang==='en'?'es':'en'))?.classList.remove('active');
  document.documentElement.lang = lang;
  import('./state.js').then(m => m.setLANG(lang));
  applyI18n();
  await showClientOverlay();
})();
