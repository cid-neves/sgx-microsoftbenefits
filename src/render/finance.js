// ════════════════════════════════════════════════════════════════════
// src/render/finance.js — Tab 3 (Cloud Rights), Tab 4 (Usage Econ), Tab 5 (Full Pack Value)
// ════════════════════════════════════════════════════════════════════
import { PACK_LICENSES } from '../data.js';
import { PACK_COSTS, PRICES } from '../state.js';
import { ps, getAvail, getBestQty, getPrice, fm, allTenantRows } from '../main.js';

const CAT_CLS = {
  'Microsoft 365':'cat-m365', 'Copilot':'cat-copilot', 'Azure':'cat-az',
  'Dynamics 365':'cat-dyn',   'Power Platform':'cat-pp', 'Security':'cat-sec',
  'Windows':'cat-win',        'Windows Server':'cat-srv', 'Dev Tools':'cat-dev',
  'Sandbox':'cat-sand',
};

// ── renderFin1_safe / renderFin2_safe — guarded wrappers ─────────

export function renderFin1_safe() {
  try { renderFin1(); } catch (e) { console.warn('renderFin1 error', e); }
}

export function renderFin2_safe() {
  try { renderFin2(); } catch (e) { console.warn('renderFin2 error', e); }
}

// ── Tab 4: Usage Economics ───────────────────────────────────────

export function renderFin1() {
  const s  = ps();
  const fb = document.getElementById('fb1');
  fb.innerHTML = '';
  let inv = 0, ret = 0, unc = 0;
  const rows = [];

  // Pack fees
  [
    {k:'l', lbl:'Partner Launch Benefits'},
    {k:'c', lbl:'Partner Success Core'},
    {k:'e', lbl:'Partner Success Expanded'},
    {k:'i', lbl:'Solutions Partner: Infrastructure'},
  ].forEach(pk => {
    if (!s[pk.k].on) return;
    const m   = s[pk.k].m;
    const tot = PACK_COSTS[pk.k] * m;
    inv += tot;
    rows.push({ lbl: pk.lbl, qty: m + (m > 1 ? ' instances' : ' instance'), unit: fm(PACK_COSTS[pk.k]), ann: fm(tot), type: 'fee', note: 'Annual partner pack fee' });
  });

  const tenantRows = allTenantRows();

  // Covered / upgrade rows
  tenantRows.filter(p => (p.ct === 'covered' || p.ct === 'upgrade') && getPrice(p) > 0).forEach(p => {
    const av  = getAvail(p, s);
    const cov = Math.min(p.assigned, av > 0 ? av : p.assigned);
    const r   = cov * getPrice(p);
    ret += r;
    rows.push({
      lbl:  p.name + (p.ct === 'upgrade' ? ' (via pack upgrade)' : ''),
      qty:  cov + ' users',
      unit: fm(getPrice(p)),
      ann:  fm(r),
      type: 'retail',
      note: p.ct === 'upgrade' ? 'Pack provides higher edition' : 'Covered by pack',
    });
  });

  // Uncovered rows
  tenantRows.filter(p => p.ct === 'uncovered' && getPrice(p) > 0).forEach(p => {
    const c = p.assigned * getPrice(p); unc += c;
    rows.push({ lbl: p.name, qty: p.assigned + ' users', unit: fm(getPrice(p)), ann: fm(c), type: 'extra', note: 'Not in any active pack' });
  });

  // Excess usage
  tenantRows.filter(p => (p.ct === 'covered' || p.ct === 'upgrade') && getPrice(p) > 0).forEach(p => {
    const av = getAvail(p, s);
    if (av > 0 && p.assigned > av) {
      const ex = p.assigned - av, c = ex * getPrice(p); unc += c;
      rows.push({ lbl: p.name + ' (excess)', qty: ex + ' users', unit: fm(getPrice(p)), ann: fm(c), type: 'extra', note: 'Assigned (' + p.assigned + ') exceeds pack qty (' + av + ')' });
    }
  });

  const tc = { fee: '#eaf4f8', retail: '#eaf7f0', extra: '#fdf0f2' };
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.style.background = tc[r.type] || '';
    let av, tp;
    if (r.type === 'fee')    { av = '<span class="fb-i">' + r.ann + '</span>'; tp = '<span class="cpill cp-c" style="font-size:10px">Pack Fee</span>'; }
    else if (r.type === 'retail') { av = '<span class="fb-r">' + r.ann + '</span>'; tp = '<span class="cpill cp-c" style="font-size:10px">Retail Value</span>'; }
    else                     { av = '<span class="fb-n">' + r.ann + '</span>'; tp = '<span class="cpill cp-n" style="font-size:10px">Extra Cost</span>'; }
    tr.innerHTML = '<td style="font-weight:500">' + r.lbl + '</td><td class="tc" style="color:var(--text-mid)">' + r.qty + '</td>' +
      '<td class="tc" style="color:var(--text-mid)">' + r.unit + '</td><td class="tc">' + av + '</td><td class="tc">' + tp + '</td>' +
      '<td style="color:var(--text-muted);font-size:11px">' + r.note + '</td>';
    fb.appendChild(tr);
  });

  const net = ret - inv - unc;
  const ftr = document.createElement('tr');
  ftr.className = 'ftr';
  ftr.innerHTML = '<td colspan="2"><strong>TOTALS (Annual)</strong></td><td></td>' +
    '<td class="tc"><span class="fb-i">' + fm(inv) + '</span><br><small style="font-weight:400;font-size:10px;color:var(--text-muted)">pack investment</small></td>' +
    '<td class="tc"><span class="fb-r">' + fm(ret) + '</span><br><small style="font-weight:400;font-size:10px;color:var(--text-muted)">retail of used</small></td>' +
    '<td class="tc"><span class="' + (net >= 0 ? 'fb-s' : 'fb-n') + '">' + (net >= 0 ? '+' : '') + fm(net) + '</span><br>' +
    '<small style="font-weight:400;font-size:10px;color:var(--text-muted)">net</small></td>';
  fb.appendChild(ftr);

  document.getElementById('f1-inv').textContent = fm(inv);
  document.getElementById('f1-inv-sub').textContent = Object.entries(s)
    .filter(([, v]) => v.on)
    .map(([k, v]) => ({l:'Launch', c:'Core', e:'Expanded', i:'Infra'}[k] + (k !== 'i' ? ' ×' + v.m : ''))
    ).join(' + ') || 'No active packs';
  document.getElementById('f1-ret').textContent = fm(ret);
  const se = document.getElementById('f1-sav');
  se.textContent = (net >= 0 ? '+' : '') + fm(net);
  se.className = 'fcval ' + (net >= 0 ? 'fv-s' : 'fv-e');
  document.getElementById('f1-sav-sub').textContent = 'Retail (' + fm(ret) + ') − Packs (' + fm(inv) + ') − Extra (' + fm(unc) + ')';
}

// ── Tab 5: Full Pack Value ───────────────────────────────────────

export function renderFin2() {
  const s  = ps();
  const fb = document.getElementById('fb2');
  fb.innerHTML = '';
  let totalRV = 0, totalInv = 0;

  ['l','c','e','i'].forEach(k => { if (s[k].on) totalInv += PACK_COSTS[k] * s[k].m; });

  // Pack fee rows
  [
    {k:'l', lbl:'Partner Launch Benefits'},
    {k:'c', lbl:'Partner Success Core'},
    {k:'e', lbl:'Partner Success Expanded'},
    {k:'i', lbl:'Solutions Partner: Infrastructure'},
  ].forEach(pk => {
    if (!s[pk.k].on) return;
    const m = s[pk.k].m, tot = PACK_COSTS[pk.k] * m;
    const tr = document.createElement('tr');
    tr.style.background = '#eaf4f8';
    tr.innerHTML = '<td style="font-weight:600"><em>' + pk.lbl + '</em></td>' +
      '<td class="tc">' + (pk.k !== 'i' ? m + ' instances' : '1 designation') + '</td>' +
      '<td class="tc">' + fm(PACK_COSTS[pk.k]) + '</td>' +
      '<td class="tc"><span class="fb-i">' + fm(tot) + '</span></td>' +
      '<td class="tc"><span class="cpill cp-c" style="font-size:10px">Pack Fee</span></td>' +
      '<td style="color:var(--text-muted);font-size:11px">Annual pack / designation fee</td>';
    fb.appendChild(tr);
  });

  // License value rows
  const licRows = [];
  PACK_LICENSES.forEach(p => {
    const bq = getBestQty(p, s);
    if (!bq) return;
    const cpu = PRICES[p.id] ?? p.cpu;
    if (cpu === 0 && p.cat === 'Sandbox') return;
    const rv = cpu > 0 ? cpu * bq.qty : 0;
    totalRV += rv;
    licRows.push({ p, bq, cpu, rv });
  });
  licRows.sort((a, b) => b.rv - a.rv);

  licRows.forEach(({ p, bq, cpu, rv }) => {
    const tr      = document.createElement('tr');
    const catCls  = CAT_CLS[p.cat] || 'cat-m365';
    const cpuDisp = cpu > 0 ? fm(cpu) : '<span class="cv-n">free/included</span>';
    const rvDisp  = rv > 0 ? '<span style="font-weight:700;color:var(--sg-amber)">' + fm(rv) + '</span>' : '<span class="cv-n">—</span>';
    let bdg = '';
    if (p.n26) bdg = '<span class="bdg b26">N26</span>';
    else if (p.n25) bdg = '<span class="bdg b25">N25</span>';
    tr.innerHTML =
      '<td><div class="pnm">' + p.name + bdg + '</div>' +
      '<div class="psb"><span class="cat ' + catCls + '">' + p.cat + '</span> · ' + p.note + '</div></td>' +
      '<td class="tc"><span class="qv">' + bq.qty + '</span><span class="qe">' + bq.src + '</span></td>' +
      '<td class="tc">' + cpuDisp + '</td>' +
      '<td class="tc">' + rvDisp + '</td>' +
      '<td class="tc"><span style="font-size:10px;color:var(--text-muted)">' + bq.src + '</span></td>' +
      '<td style="font-size:11px;color:var(--text-muted)">' + p.type + '</td>';
    fb.appendChild(tr);
  });

  const net = totalRV - totalInv;
  const ftr = document.createElement('tr');
  ftr.className = 'ftr';
  ftr.innerHTML = '<td colspan="2"><strong>TOTALS (Annual)</strong></td><td></td>' +
    '<td class="tc"><span class="fb-r">' + fm(totalRV) + '</span><br><small style="font-weight:400;font-size:10px;color:var(--text-muted)">total retail value</small></td>' +
    '<td class="tc" colspan="2"><span class="' + (net >= 0 ? 'fb-s' : 'fb-n') + '">Pack cost: ' + fm(totalInv) + ' → Gross savings: ' + (net >= 0 ? '+' : '') + fm(net) + '</span></td>';
  fb.appendChild(ftr);

  document.getElementById('f2-inv').textContent = fm(totalInv);
  document.getElementById('f2-inv-sub').textContent = Object.entries(s)
    .filter(([, v]) => v.on)
    .map(([k, v]) => ({l:'Launch', c:'Core', e:'Expanded', i:'Infra'}[k] + (k !== 'i' ? ' ×' + v.m : ''))
    ).join(' + ') || 'No active packs';
  document.getElementById('f2-ret').textContent = fm(totalRV);
  document.getElementById('f2-sav').textContent = (net >= 0 ? '+' : '') + fm(net);
  document.getElementById('f2-savings-note').innerHTML =
    '<strong>Gross savings</strong> represent the retail value of all licenses delivered by your active packs minus the pack investment. ' +
    'This does not mean you need all these licenses — cross-reference with the <em>Usage Economics</em> tab to see ROI based on what you actually use. ' +
    '<br><br>Pack cost: <strong>' + fm(totalInv) + '</strong> · Retail value of all included licenses: <strong>' + fm(totalRV) + '</strong> · Gross savings: <strong>' +
    (net >= 0 ? '+' : '') + fm(net) + '</strong> (' + (Math.round((totalRV / totalInv) * 10) / 10) + '× return on investment)';
}

// ── Tab 3: Cloud Rights & Credits ────────────────────────────────

export function renderCloud() {
  const s = ps();

  const CLOUD_GROUPS = [
    {
      icon: '☁️', cls: 'cci-az', title: 'Azure Credits', sub: 'Production cloud budget',
      items: [
        { name: 'Azure Bulk Credits', packs: ['Partner Launch','Partner Success Core','Partner Success Expanded','Infra SPD'],
          amounts: [s.l.on?700*s.l.m:0, s.c.on?2400*s.c.m:0, s.e.on?5000*s.e.m:0, s.i.on?10000:0],
          unit: 'USD credits/yr', note: 'For production workloads — Azure Portal' },
      ]
    },
    {
      icon: '🤖', cls: 'cci-copilot', title: 'Copilot & AI Services', sub: 'AI credits and licenses',
      items: [
        { name: 'Microsoft 365 Copilot', packs: ['Partner Success Expanded'],
          amounts: [s.e.on?10*s.e.m:0], unit: 'user licenses', note: 'Full M365 Copilot in Word, Excel, Teams, etc.' },
        { name: 'Microsoft Copilot Studio Credits', packs: ['Partner Success Expanded'],
          amounts: [s.e.on?25000*s.e.m:0], unit: 'credits/month', note: '25k credits/mo per pack — build custom copilots & agents' },
        { name: 'Microsoft Dragon Copilot', packs: ['Success Core','Success Expanded','Infra SPD'],
          amounts: [s.c.on?5*s.c.m:0, s.e.on?15*s.e.m:0, s.i.on?20:0], unit: 'user licenses', note: 'Healthcare AI assistant — region-limited launch' },
        { name: 'GitHub Copilot Enterprise (Azure credits)', packs: ['Infra SPD'],
          amounts: [s.i.on?5000:0], unit: 'USD credits/yr', note: '$5k Azure credits exclusively for GitHub Copilot Enterprise' },
      ]
    },
    {
      icon: '🔧', cls: 'cci-vs', title: 'Visual Studio', sub: 'Developer IDE subscriptions',
      items: [
        { name: 'Visual Studio Enterprise IDE', packs: ['Partner Launch','Partner Success Core','Partner Success Expanded','Infra SPD'],
          amounts: [s.l.on?1*s.l.m:0, s.c.on?8*s.c.m:0, s.e.on?15*s.e.m:0, s.i.on?25:0],
          unit: 'user subscriptions', note: 'Full VS Enterprise IDE without monthly Azure credit' },
      ]
    },
    {
      icon: '🏗️', cls: 'cci-dyn', title: 'Dynamics 365 Sandboxes', sub: 'Non-production / partner use environments',
      items: [
        { name: 'Sandbox – Operations Application', packs: ['Success Core','Success Expanded','Infra SPD'],
          amounts: [s.c.on?25*s.c.m:0, s.e.on?25*s.e.m:0, s.i.on?25:0], unit: 'users', note: 'Full D365 F&O partner sandbox' },
        { name: 'Sandbox – Sales, FS & CS', packs: ['Success Core','Success Expanded','Infra SPD'],
          amounts: [s.c.on?25*s.c.m:0, s.e.on?25*s.e.m:0, s.i.on?25:0], unit: 'users', note: 'Partner demo/development sandbox' },
        { name: 'Sandbox – Business Central', packs: ['Launch','Core','Expanded'],
          amounts: [s.l.on?5*s.l.m:0, s.c.on?5*s.c.m:0, s.e.on?5*s.e.m:0], unit: 'users', note: 'BC partner sandbox' },
        { name: 'Sandbox – Contact Center', packs: ['Expanded'],
          amounts: [s.e.on?25*s.e.m:0], unit: 'users', note: 'Expanded only' },
        { name: 'Sandbox – Ops Tier 2 Add-on', packs: ['Core','Expanded'],
          amounts: [s.c.on?1*s.c.m:0, s.e.on?1*s.e.m:0], unit: 'tenants', note: 'Tier 2 add-on for Ops sandbox' },
      ]
    },
    {
      icon: '🤖', cls: 'cci-ai', title: 'Microsoft Fabric', sub: 'Analytics & data platform rights',
      items: [
        { name: 'Microsoft Fabric (Free tier)', packs: ['All tenants'],
          amounts: [9999999], unit: 'users (unlimited)', note: 'Free Fabric capacity for exploration — already active in your tenant' },
        { name: 'Power BI Premium (via packs)', packs: ['Launch','Core','Expanded','Infra SPD'],
          amounts: [s.l.on?4*s.l.m:0, s.c.on?15*s.c.m:0, s.e.on?35*s.e.m:0, s.i.on?100:0],
          unit: 'user licenses', note: 'Power BI Premium includes Fabric analytics workloads' },
      ]
    },
  ];

  // Summary totals
  let totalAzure = 0, totalCopilotCredits = 0, totalVS = 0;
  if (s.l.on) { totalAzure += 700 * s.l.m;  totalVS += 1 * s.l.m; }
  if (s.c.on) { totalAzure += 2400 * s.c.m; totalVS += 8 * s.c.m; }
  if (s.e.on) { totalAzure += 5000 * s.e.m; totalVS += 15 * s.e.m; totalCopilotCredits += 25000 * 12 * s.e.m; }
  if (s.i.on) { totalAzure += 10000;         totalVS += 25; }

  const sumArea = document.getElementById('cloud-sum-area');
  sumArea.innerHTML = '<div class="cloud-sum-card"><div class="cloud-sum-title">Combined Cloud Entitlements Across All Active Packs</div><div class="cst-grid">' +
    '<div class="cst-item"><div class="cst-lbl">Azure Production Credits</div><div class="cst-val">' + fm(totalAzure) + '</div><div class="cst-sub">Per year across active packs</div></div>' +
    '<div class="cst-item"><div class="cst-lbl">Copilot Studio Credits</div><div class="cst-val">' + (totalCopilotCredits / 1000).toFixed(0) + 'k</div><div class="cst-sub">Per year (25k/mo × instances)</div></div>' +
    '<div class="cst-item"><div class="cst-lbl">Visual Studio Subscriptions</div><div class="cst-val">' + totalVS + '</div><div class="cst-sub">Enterprise IDE licenses</div></div>' +
    '<div class="cst-item"><div class="cst-lbl">GitHub Copilot Enterprise</div><div class="cst-val">' + (s.i.on ? fm(5000) : '—') + '</div><div class="cst-sub">Azure credits (Infra SPD only)</div></div>' +
    '</div></div>';

  const cardsArea = document.getElementById('cloud-cards-area');
  cardsArea.innerHTML = '';
  CLOUD_GROUPS.forEach(g => {
    let entriesHtml = '';
    g.items.forEach(item => {
      const totalQty = item.amounts.reduce((a, b) => a + b, 0);
      if (totalQty === 0) return;
      const packNames = item.packs.filter((_, i) => item.amounts[i] > 0).join(', ');
      const qtyDisp   = totalQty >= 9999999 ? '∞' : totalQty.toLocaleString();
      entriesHtml += '<div class="ce-row"><div class="ce-info"><div class="ce-name">' + item.name + '</div>' +
        '<div class="ce-pack">' + packNames + '</div>' +
        '<div class="ce-note">' + item.note + '</div></div>' +
        '<div class="ce-val"><div class="ce-qty">' + qtyDisp + '</div><div class="ce-unit">' + item.unit + '</div></div></div>';
    });
    if (!entriesHtml) return;
    cardsArea.innerHTML += '<div class="cloud-card">' +
      '<div class="cloud-card-hdr"><div class="cc-icon ' + g.cls + '">' + g.icon + '</div>' +
      '<div><div class="cc-title">' + g.title + '</div><div class="cc-sub">' + g.sub + '</div></div></div>' +
      '<div class="cloud-entries">' + entriesHtml + '</div></div>';
  });
}
