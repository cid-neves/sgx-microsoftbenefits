// ════════════════════════════════════════════════════════════════════
// src/render/usage.js — Tab 1: Usage vs Pack table
// ════════════════════════════════════════════════════════════════════
import { PACK_LICENSES } from '../data.js';
import { USAGE_DATA, setUSAGE_DATA } from '../state.js';
// ps, getAvail, getPrice, fm, co, rpf, allTenantRows imported from main.js
// (circular import — safe because all are function declarations resolved at call time)
import { ps, getAvail, getPrice, fm, co, rpf, allTenantRows } from '../main.js';

let vf1 = 'all', sc1 = 'coverage', sd1 = 'asc';

export function srt1(c) {
  if (sc1 === c) sd1 = sd1 === 'asc' ? 'desc' : 'asc';
  else { sc1 = c; sd1 = 'desc'; }
  renderUsage();
}

export function setVF(f, btn, tab) {
  if (tab === '1') vf1 = f;
  btn.closest('[style*="gap"]').querySelectorAll('.fbtn').forEach(b => b.className = 'fbtn');
  const m = { all:'fba', covered:'fb-c', upgrade:'fb-u', uncovered:'fb-n', free:'fb-f' };
  btn.classList.add(m[f] || 'fba');
  if (tab === '1') renderUsage();
}

/**
 * Format a pack-quantity cell (handles multiplier display).
 * @param {number|null} val   Raw pack quantity
 * @param {'l'|'c'|'e'|'i'} k  Pack key
 * @param {object} s          Pack state from ps()
 */
export function qc(val, k, s) {
  const on = s[k].on, m = s[k].m, eff = val ? (val * (k === 'i' ? 1 : m)) : null;
  if (!on || !val) return '<td class="tc"><span class="qn">—</span></td>';
  return '<td class="tc"><span class="qv">' + eff + '</span>' +
    (k !== 'i' && m > 1 ? '<span class="qe">(' + val + '×' + m + ')</span>' : '') + ' </td>';
}

// ── Row source / coverage helpers ────────────────────────────────

/**
 * Get replacement sources for a row from USAGE_DATA.
 * @param {string|number} rowId
 * @returns {Array<{packId:string, qty:number}>}
 */
export function getRowSources(rowId) {
  return (USAGE_DATA[rowId] && USAGE_DATA[rowId].sources) || [];
}

/**
 * Persist replacement sources for a row.
 * @param {string|number} rowId
 * @param {Array} sources
 */
export function setRowSources(rowId, sources) {
  setUSAGE_DATA({ ...USAGE_DATA, [rowId]: { ...(USAGE_DATA[rowId] || {}), sources } });
}

/**
 * Compute per-pack coverage breakdown for a row.
 * @param {object} p   Row (TENANT_DEFAULT entry or TENANT_CUSTOM entry)
 * @param {object} s   Pack state from ps()
 * @returns {{ covered: number, available: number, needed: number }}
 */
export function getRowCoverage(p, s) {
  const av = getAvail(p, s);
  const assigned = p.assigned;
  const covered  = Math.min(assigned, av);
  return { covered, available: av, needed: Math.max(0, assigned - av) };
}

/** Add a replacement source entry for a row. */
export function addRepSource(rowId, packId, qty) {
  const sources = [...getRowSources(rowId), { packId, qty }];
  setRowSources(rowId, sources);
  renderUsage();
}

/** Remove a replacement source entry by index for a row. */
export function delRepSource(rowId, idx) {
  const sources = getRowSources(rowId).filter((_, i) => i !== idx);
  setRowSources(rowId, sources);
  renderUsage();
}

/** Handle pack-select change in the replacement UI. */
export function onRepSelectChange(rowId, idx, newPackId) {
  const sources = [...getRowSources(rowId)];
  if (sources[idx]) sources[idx] = { ...sources[idx], packId: newPackId };
  setRowSources(rowId, sources);
}

/** Handle qty change in the replacement UI. */
export function onRepQtyChange(rowId, idx, newQty) {
  const sources = [...getRowSources(rowId)];
  if (sources[idx]) sources[idx] = { ...sources[idx], qty: parseInt(newQty) || 0 };
  setRowSources(rowId, sources);
  renderUsage();
}

/**
 * Build the HTML for the replacement sources UI panel for a row.
 * @param {string|number} rowId
 * @param {object} s   Pack state from ps()
 * @returns {string}  HTML string
 */
export function renderRowReplacementUI(rowId, s) {
  const sources = getRowSources(rowId);
  if (!sources.length) return '';
  let html = '<div class="rep-ui">';
  sources.forEach((src, idx) => {
    const pack = PACK_LICENSES.find(p => p.id === src.packId);
    html += '<div class="rep-row">' +
      '<span class="rep-pack">' + (pack ? pack.name : src.packId) + '</span>' +
      ' qty: <strong>' + src.qty + '</strong>' +
      '</div>';
  });
  html += '</div>';
  return html;
}

/**
 * Build an HTML <select> for choosing a pack replacement source.
 * @param {object} s   Pack state from ps()
 * @param {string} selectedId
 * @returns {string}  HTML string
 */
export function buildPackSelectHTML(s, selectedId = '') {
  const activePacks = PACK_LICENSES.filter(p =>
    (s.l.on && p.l) || (s.c.on && p.c) || (s.e.on && p.e) || (s.i.on && p.i)
  );
  return '<select class="fsel">' +
    activePacks.map(p =>
      '<option value="' + p.id + '"' + (p.id === selectedId ? ' selected' : '') + '>' + p.name + '</option>'
    ).join('') +
    '</select>';
}

// ── Stats strip ──────────────────────────────────────────────────

export function updateStats1(s) {
  const rows = allTenantRows();
  const real = rows.filter(p => p.ct !== 'free');
  document.getElementById('st-t1').textContent = real.length;
  document.getElementById('st-a1').textContent = real.reduce((a, p) => a + p.assigned, 0).toLocaleString();
  document.getElementById('st-c1').textContent = rows.filter(p => p.ct === 'covered').length;
  document.getElementById('st-u1').textContent = rows.filter(p => p.ct === 'upgrade').length;
  document.getElementById('st-n1').textContent = rows.filter(p => p.ct === 'uncovered').length;
  document.getElementById('st-o1').textContent = rows.filter(p => {
    const av = getAvail(p, s); return av > 0 && p.assigned > av;
  }).length;
}

// ── Main render ──────────────────────────────────────────────────

export function renderUsage() {
  const s = ps();
  const q = document.getElementById('srch1').value.toLowerCase().trim();
  const rows = allTenantRows();

  let data = rows.filter(p => {
    if (q && !p.name.toLowerCase().includes(q) && !(p.pp || '').toLowerCase().includes(q)) return false;
    if (vf1 !== 'all' && p.ct !== vf1) return false;
    return true;
  });

  data.sort((a, b) => {
    if (sc1 === 'coverage') return co(a.ct) - co(b.ct);
    if (sc1 === 'name')     return sd1 === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    if (sc1 === 'assigned') return b.assigned - a.assigned;
    if (sc1 === 'needed')   return (Math.max(0, b.assigned - getAvail(b, s))) - (Math.max(0, a.assigned - getAvail(a, s)));
    if (sc1 === 'cost')     return getPrice(b) * b.assigned - getPrice(a) * a.assigned;
    return 0;
  });

  const tb = document.getElementById('tb1');
  tb.innerHTML = '';
  if (!data.length) {
    tb.innerHTML = '<tr class="erow"><td colspan="12">No products match filters</td></tr>';
    updateStats1(s);
    return;
  }

  const sl = {
    covered:   '✓  Covered by active partner packs',
    upgrade:   '↑  Pack includes a higher/upgraded edition',
    uncovered: '✕  Not covered — requires separate purchase',
    free:      '◦  Free / Trial licenses',
  };
  let lastS = null;

  data.forEach(p => {
    if (sc1 === 'coverage' && p.ct !== lastS) {
      lastS = p.ct;
      const sr = document.createElement('tr');
      sr.className = 'tr-s';
      sr.innerHTML = '<td colspan="12">' + sl[p.ct] + '</td>';
      tb.appendChild(sr);
    }

    const av  = getAvail(p, s);
    const nd  = Math.max(0, p.assigned - av);
    const pct = av > 0 ? Math.min((p.assigned / av) * 100, 100) : (p.assigned > 0 ? 100 : 0);
    const over = av > 0 && p.assigned > av;
    const near = av > 0 && !over && p.assigned / av >= 0.8;
    const cpu  = getPrice(p);

    // Availability cell
    const avc = av > 0
      ? '<td class="tc"><span class="av-v">' + av + '</span></td>'
      : '<td class="tc"><span class="av-z">—</span></td>';

    // Usage bar cell
    let ubc;
    if (p.ct === 'free') {
      const dt = p.total >= 100000 ? '∞' : p.total;
      ubc = '<td><div class="ubw"><div class="ubt"><div class="ubf uf-bl" style="width:' +
        Math.min((p.assigned / Math.max(p.total, 1)) * 100, 100) + '%"></div></div>' +
        '<span class="ubl">' + p.assigned + ' / ' + dt + '</span></div></td>';
    } else if (!av) {
      ubc = '<td><span style="font-size:10px;color:var(--text-light)">no pack limit</span></td>';
    } else {
      const cl = over ? 'uf-ov' : near ? 'uf-w' : 'uf-ok';
      const lc = over ? ' ul-ov' : near ? ' ul-w' : '';
      ubc = '<td><div class="ubw"><div class="ubt"><div class="ubf ' + cl + '" style="width:' + pct + '%"></div></div>' +
        '<span class="ubl' + lc + '">' + p.assigned + ' / ' + av + '</span></div></td>';
    }

    // Needed cell
    let ndc;
    if (p.ct === 'free' || p.ct === 'uncovered') {
      const n = p.assigned;
      ndc = '<td class="tc"><span class="' + (n > 0 ? 'nd-p' : 'av-z') + '">' + (n > 0 ? '+' + n : '—') + '</span></td>';
    } else if (nd > 0) {
      ndc = '<td class="tc"><span class="nd-p">+' + nd + '</span></td>';
    } else {
      ndc = '<td class="tc"><span class="nd-ok">✓</span></td>';
    }

    // Cost cell
    const cstc = cpu > 0
      ? '<td class="tc"><span class="cv-v">' + fm(cpu) + '</span></td>'
      : '<td class="tc"><span class="cv-n">free</span></td>';

    // Coverage pill
    let pill;
    if (p.ct === 'free')                 pill = '<span class="cpill cp-f"><span class="cpd"></span>Free/Trial</span>';
    else if (p.ct === 'covered' && over) pill = '<span class="cpill cp-ov"><span class="cpd"></span>Over Limit</span>';
    else if (p.ct === 'covered')         pill = '<span class="cpill cp-c"><span class="cpd"></span>Covered</span>';
    else if (p.ct === 'upgrade')         pill = '<span class="cpill cp-u"><span class="cpd"></span>Upgrade Avail.</span>';
    else                                 pill = '<span class="cpill cp-n"><span class="cpd"></span>Needs Purchase</span>';

    // Badges
    let bdg = '';
    if (p.n26) bdg += '<span class="bdg b26">NEW 2026</span>';
    else if (p.n25) bdg += '<span class="bdg b25">NEW 2025</span>';
    if (p.ct === 'upgrade') bdg += '<span class="bdg bup">UPGRADE</span>';
    if (p.ct === 'free')    bdg += '<span class="bdg bfr">FREE</span>';

    // Sub-line
    let sub = '';
    if (p.pp && p.ct !== 'free')          sub += '<div class="psb">→ pack: ' + p.pp + '</div>';
    if (p.note && p.ct === 'upgrade')     sub += '<div class="pnt-u">' + p.note + '</div>';
    if (p.note && p.ct === 'uncovered')   sub += '<div class="pnt-n">' + p.note + '</div>';

    const td = p.total >= 100000 ? '∞' : p.total.toLocaleString();
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td><div class="pnm">' + p.name + bdg + '</div>' + sub + '</td>' +
      '<td class="tc" style="font-weight:500;color:var(--text-mid)">' + td + '</td>' +
      '<td class="tc" style="font-weight:600">' + p.assigned.toLocaleString() + '</td>' +
      qc(rpf(p, 'l'), 'l', s) + qc(rpf(p, 'c'), 'c', s) + qc(rpf(p, 'e'), 'e', s) + qc(rpf(p, 'i'), 'i', s) +
      avc + ubc + ndc + cstc +
      '<td class="tc">' + pill + '</td>';
    tb.appendChild(tr);
  });

  updateStats1(s);
}
