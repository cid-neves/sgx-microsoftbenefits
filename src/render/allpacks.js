// ════════════════════════════════════════════════════════════════════
// src/render/allpacks.js — Tab 2 (All Pack Licenses), Tab 6 (Edit Prices), Purchase tab
// ════════════════════════════════════════════════════════════════════
import { PACK_LICENSES } from '../data.js';
import { PACK_COSTS, PRICES } from '../state.js';
import { ps, getBestQty, fm } from '../main.js';

const CAT_CLS = {
  'Microsoft 365':'cat-m365', 'Copilot':'cat-copilot', 'Azure':'cat-az',
  'Dynamics 365':'cat-dyn',   'Power Platform':'cat-pp', 'Security':'cat-sec',
  'Windows':'cat-win',        'Windows Server':'cat-srv', 'Dev Tools':'cat-dev',
  'Sandbox':'cat-sand',
};

let packF = 'all', sc2 = 'name', sd2 = 'asc';

export function setPackF(f, btn) {
  packF = f;
  btn.closest('[style*="gap"]').querySelectorAll('.fbtn').forEach(b => b.className = 'fbtn');
  btn.classList.add('fba');
  renderAll();
}

export function srtAll(c) {
  if (sc2 === c) sd2 = sd2 === 'asc' ? 'desc' : 'asc';
  else { sc2 = c; sd2 = 'desc'; }
  renderAll();
}

// ── Tab 2: All Pack Licenses ─────────────────────────────────────

export function renderAll() {
  const s    = ps();
  const q    = document.getElementById('srch2').value.toLowerCase().trim();
  const catF = document.getElementById('cat2').value;
  const newF = document.getElementById('new2').value;

  let data = PACK_LICENSES.filter(p => {
    if (q && !p.name.toLowerCase().includes(q) && !p.cat.toLowerCase().includes(q)) return false;
    if (catF !== 'all' && p.cat !== catF)       return false;
    if (newF === '2026' && !p.n26)              return false;
    if (newF === '2025' && !p.n25)              return false;
    if (packF === 'launch'   && !p.l)           return false;
    if (packF === 'core'     && !p.c)           return false;
    if (packF === 'expanded' && !p.e)           return false;
    if (packF === 'infra'    && !p.i)           return false;
    return true;
  });

  data.sort((a, b) => {
    const cpu_a = PRICES[a.id] ?? a.cpu, cpu_b = PRICES[b.id] ?? b.cpu;
    if (sc2 === 'name') return sd2 === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    if (sc2 === 'cat')  return sd2 === 'asc' ? a.cat.localeCompare(b.cat)  : b.cat.localeCompare(a.cat);
    if (sc2 === 'cpu')  return sd2 === 'asc' ? cpu_a - cpu_b : cpu_b - cpu_a;
    if (sc2 === 'rv') {
      const bq_a = getBestQty(a, s), bq_b = getBestQty(b, s);
      const rv_a = bq_a ? cpu_a * bq_a.qty : 0, rv_b = bq_b ? cpu_b * bq_b.qty : 0;
      return sd2 === 'asc' ? rv_a - rv_b : rv_b - rv_a;
    }
    return 0;
  });

  const tb = document.getElementById('tb2');
  tb.innerHTML = '';
  let totalRV = 0;

  data.forEach(p => {
    const cpu   = PRICES[p.id] ?? p.cpu;
    const bq    = getBestQty(p, s);
    const rv    = bq && cpu > 0 ? cpu * bq.qty : 0;
    totalRV    += rv;

    function qc2(val) {
      if (!val) return '<td class="tc"><span class="qn">—</span></td>';
      return '<td class="tc"><span class="qv">' + val + '</span></td>';
    }

    const rvDisp  = rv > 0 ? fm(rv) : '<span class="cv-n">—</span>';
    const cpuDisp = cpu > 0 ? fm(cpu) : '<span class="cv-n">free</span>';
    let bdg = '';
    if (p.n26) bdg = '<span class="bdg b26">NEW 2026</span>';
    else if (p.n25) bdg = '<span class="bdg b25">NEW 2025</span>';
    const catCls = CAT_CLS[p.cat] || 'cat-m365';
    const bqDisp = bq
      ? '<span class="qv">' + bq.qty + '</span><span class="qe">' + bq.src + '</span>'
      : '<span class="qn">—</span>';

    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td><div class="pnm">' + p.name + '</div><div class="psb">' + p.note + '</div></td>' +
      '<td class="tc"><span class="cat ' + catCls + '">' + p.cat + '</span></td>' +
      '<td class="tc" style="font-size:10px;color:var(--text-muted)">' + p.type + '</td>' +
      qc2(p.l) + qc2(p.c) + qc2(p.e) + qc2(p.i) +
      '<td class="tc">' + bqDisp + '</td>' +
      '<td class="tc">' + cpuDisp + '</td>' +
      '<td class="tc" style="font-weight:700;color:var(--sg-amber)">' + rvDisp + '</td>' +
      '<td class="tc">' + bdg + '</td>';
    tb.appendChild(tr);
  });

  // Stats
  document.getElementById('st-all-ct').textContent  = data.length;
  document.getElementById('st-all-rv').textContent  = totalRV > 0 ? fm(totalRV) : '$—';
  let inv = 0;
  ['l','c','e','i'].forEach(k => { if (s[k].on) inv += PACK_COSTS[k] * s[k].m; });
  document.getElementById('st-all-inv').textContent = fm(inv);
  document.getElementById('st-all-sv').textContent  = totalRV > 0 ? fm(totalRV - inv) : '$—';
}

export function renderAll_safe() {
  try { renderAll(); } catch (e) { console.warn('renderAll error', e); }
}

// ── Purchase tab (stub — future feature) ─────────────────────────

export function renderPurchaseTab() {
  const el = document.getElementById('tab-purchase');
  if (!el) return;
  el.innerHTML = '<div class="finsec"><p style="color:var(--text-muted);font-size:12px">Purchase recommendations coming soon.</p></div>';
}

// ── Tab 6: Edit Prices ───────────────────────────────────────────

const PRICE_SECTIONS = [
  {cls:'psh-m365',    title:'Microsoft 365',               sub:'per user/year',              ids:['m365bp','teams','teamsprem','roomspro','viva','proj','visio','win365','m365e3']},
  {cls:'psh-copilot', title:'Copilot & AI',                sub:'per unit/year',              ids:['m365cop','copstudio','dragon','ghcop']},
  {cls:'psh-az',      title:'Azure & Dev',                 sub:'credits or per sub/year',    ids:['azurecr','vsent']},
  {cls:'psh-dyn',     title:'Dynamics 365',                sub:'per user/year',              ids:['d365bc','d365se','d365ci','d365cse','d365fp','d365hr','d365mk','d365po','d365tm','d365cc']},
  {cls:'psh-pp',      title:'Power Platform',              sub:'per user or bot/year',       ids:['pbiprem','powerapps','paauto','paaproc']},
  {cls:'psh-sec',     title:'Security & Identity',         sub:'per user/year',              ids:['entraid','defsuit','defp2','entrasuite','intune']},
  {cls:'psh-srv',     title:'Windows Server & System Center', sub:'per license/year',        ids:['wsrvstd','wsrvdc','wsrvcal','wsrvrdp','sccms','sccep','sccstd','epcm','sqlent','wsrvstorage']},
  {cls:'psh-win',     title:'Windows',                     sub:'per license',                ids:['win365','win11iot']},
];

export function renderPricesPage() {
  const area = document.getElementById('price-grid-area');
  if (!area) return;
  area.innerHTML = '';
  PRICE_SECTIONS.forEach(sec => {
    const items = PACK_LICENSES.filter(p => sec.ids.includes(p.id));
    let rows = '';
    items.forEach(p => {
      const price = PRICES[p.id] ?? p.cpu;
      rows +=
        '<div class="price-row">' +
        '<div><div class="pr-name">' + p.name + '</div><div class="pr-unit">' + p.type + ' · ' + p.note + '</div></div>' +
        '<div class="pr-input-wrap">' +
        '<span class="pr-cur">$</span>' +
        '<input class="pr-input" type="number" min="0" data-id="' + p.id + '" value="' + price + '" onchange="onPriceChange()">' +
        '<span class="pr-yr">/yr</span>' +
        '</div>' +
        '</div>';
    });
    area.innerHTML += '<div class="price-section"><div class="price-section-hdr ' + sec.cls + '"><span>' + sec.title + '</span><span>' + sec.sub + '</span></div>' + rows + '</div>';
  });
}
