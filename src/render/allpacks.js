// ════════════════════════════════════════════════════════════════════
// src/render/allpacks.js — All Pack Licenses, Purchase, Prices tabs
// ════════════════════════════════════════════════════════════════════
import { PACK_LICENSES } from '../../data.js';
import { PACK_COSTS, PRICES, USAGE_DATA } from '../../state.js';
import { t, applyI18n } from '../../i18n.js';
import { ps, getAvail, getBestQty, getPrice, fm, co, getAssigned, getPrice as gp, rpf, allTenantRows } from '../../main.js';
import { getRowCoverage, CAT_CLS } from './usage.js';
import { renderUsage } from './usage.js';
import { renderFin1, renderFin2, renderCloud } from './finance.js';
import { syncPackCostInputs } from '../../main.js';

let packF='all', sc2='name', sd2='asc';

export function setPackF(f,btn){packF=f;btn.closest('[style*="gap"]').querySelectorAll('.fbtn').forEach(b=>b.className='fbtn');btn.classList.add('fba');renderAll();}
export function srtAll(c){if(sc2===c)sd2=sd2==='asc'?'desc':'asc';else{sc2=c;sd2='desc';}renderAll();}

export function renderAll_safe() {
  const at = document.querySelector('.tabpanel.active');
  renderUsage();
  if (at) { const id = at.id; if(id==='t-all') renderAll(); if(id==='t-cloud') renderCloud(); if(id==='t-fin1') renderFin1(); if(id==='t-fin2') renderFin2(); if(id==='t-prices') renderPricesPage(); }
}

export function renderAll() {
  const s=ps(),q=(document.getElementById('srch2')||{value:''}).value.toLowerCase().trim();
  const catF=(document.getElementById('cat2')||{value:'all'}).value,newF=(document.getElementById('new2')||{value:'all'}).value;
  let data=PACK_LICENSES.filter(p=>{
    if(q&&!p.name.toLowerCase().includes(q)&&!p.cat.toLowerCase().includes(q)) return false;
    if(catF!=='all'&&p.cat!==catF) return false;
    if(newF==='2026'&&!p.n26) return false;
    if(newF==='2025'&&!p.n25) return false;
    if(packF==='launch'&&!p.l) return false;
    if(packF==='core'&&!p.c) return false;
    if(packF==='expanded'&&!p.e) return false;
    if(packF==='infra'&&!p.i) return false;
    if(packF==='mw'&&!p.mw) return false;
    if(packF==='sec'&&!p.sec) return false;
    if(packF==='avd'&&!p.avd) return false;
    if(packF==='azcore'&&!p.azcore) return false;
    return true;
  });
  const cpu_of = p => PRICES[p.id]??p.cpu;
  data.sort((a,b)=>{
    if(sc2==='name') return sd2==='asc'?a.name.localeCompare(b.name):b.name.localeCompare(a.name);
    if(sc2==='cpu'){const d=cpu_of(a)-cpu_of(b);return sd2==='asc'?d:-d;}
    if(sc2==='av'){const d=getAvail(a,s)-getAvail(b,s);return sd2==='asc'?d:-d;}
    if(sc2==='rv'){const rv_a=getAvail(a,s)*cpu_of(a),rv_b=getAvail(b,s)*cpu_of(b);const d=rv_a-rv_b;return sd2==='asc'?d:-d;}
    return 0;
  });
  const tb=document.getElementById('tb2');if(!tb)return;tb.innerHTML='';
  let totalRV=0;
  data.forEach(p=>{
    const cpu=cpu_of(p),av=getAvail(p,s),rv=av>0&&cpu>0?cpu*av:0;
    totalRV+=rv;
    function qc2(val){if(!val)return '<td class="tc"><span class="qn">—</span></td>';return '<td class="tc"><span class="qv">'+val+'</span></td>';}
    let bdg='';if(p.n26)bdg='<span class="bdg b26">N26</span>';else if(p.n25)bdg='<span class="bdg b25">N25</span>';
    if(p.azcore) bdg+='<span class="bdg" style="background:#fff4e8;color:#b86214;border:1px solid #f0c890">AZURE CORE</span>';
    const catCls=CAT_CLS[p.cat]||'cat-m365';
    const tr=document.createElement('tr');
    tr.innerHTML='<td><div class="pnm">'+p.name+'</div><div class="psb">'+p.note+'</div></td>'+
      '<td class="tc"><span class="cat '+catCls+'">'+p.cat+'</span></td>'+
      qc2(p.l)+qc2(p.c)+qc2(p.e)+qc2(p.i)+qc2(p.mw)+qc2(p.sec)+qc2(p.avd)+
      '<td class="tc" style="font-weight:700;color:var(--sg-blue)">'+(av>0?av:'<span class="qn">—</span>')+'</td>'+
      '<td class="tc">'+(cpu>0?fm(cpu):'<span class="cv-n">free</span>')+'</td>'+
      '<td class="tc" style="font-weight:700;color:var(--sg-amber)">'+(rv>0?fm(rv):'<span class="cv-n">—</span>')+'</td>'+
      '<td class="tc">'+bdg+'</td>';
    tb.appendChild(tr);
  });
  document.getElementById('st-al-ct').textContent=data.length;
  document.getElementById('st-al-rv').textContent=totalRV>0?fm(totalRV):'$—';
  const s2=ps();let inv=0;
  const spd_on = s2.i.on || (s2.mw&&s2.mw.on) || (s2.sec&&s2.sec.on);
  ['l','c','e'].forEach(k=>{if(s2[k].on)inv+=PACK_COSTS[k]*s2[k].m;});
  if(spd_on) inv+=PACK_COSTS.i||4730; // SPD is one fee regardless of designations held
  document.getElementById('st-al-inv').textContent=fm(inv);
  document.getElementById('st-al-sv').textContent=totalRV>0?fm(totalRV-inv):'$—';
}

// ══════════════════════════════════════════════════════════════════
// TAB 3: CLOUD RIGHTS
// ══════════════════════════════════════════════════════════════════

const PRICE_SECTIONS=[
  {cls:'psh-m',title:'Microsoft 365',sub:'/user/yr',ids:['m365bp','teams','teamsprem','roomspro','viva','proj','visio','win365','m365e3']},
  {cls:'psh-cop',title:'Copilot & AI',sub:'/unit/yr',ids:['m365cop','copstudio','dragon','ghcop']},
  {cls:'psh-az',title:'Azure & Dev',sub:'/credit or sub/yr',ids:['azurecr','vsent']},
  {cls:'psh-dyn',title:'Dynamics 365',sub:'/user/yr',ids:['d365bc','d365se','d365ci','d365cse','d365fp','d365hr','d365mk','d365po','d365tm','d365cc']},
  {cls:'psh-pp',title:'Power Platform',sub:'/user or bot/yr',ids:['pbiprem','powerapps','paauto','paaproc']},
  {cls:'psh-sec',title:'Security & Identity',sub:'/user/yr',ids:['entraid','defsuit','defp2','entrasuite','intune']},
  {cls:'psh-srv',title:'Windows Server & System Center',sub:'/license/yr',ids:['wsrvstd','wsrvdc','wsrvcal','wsrvrdp','sccms','sccep','sccstd','epcm','sqlent']},
  {cls:'psh-dev',title:'Dev Tools',sub:'/sub/yr',ids:['vsent']},
];

export function renderPricesPage() {
  const area=document.getElementById('price-grid-area');if(!area)return;area.innerHTML='';
  const seen=new Set();
  PRICE_SECTIONS.forEach(sec=>{
    const items=sec.ids.map(id=>PACK_LICENSES.find(p=>p.id===id)).filter(p=>p&&!seen.has(p.id));
    items.forEach(p=>seen.add(p.id));
    if(!items.length)return;
    let rows='';
    items.forEach(p=>{
      const cur=PRICES[p.id]??p.cpu;
      rows+='<div class="pr-row"><div><div class="pr-nm">'+p.name+'</div>'+
        '<div class="pr-un">'+p.type+' · <span class="pr-def">default: $'+p.cpu.toLocaleString()+'</span></div>'+
        '<div class="pr-def">'+p.note+'</div></div>'+
        '<div class="pri-wrap"><span class="pr-cur">$</span>'+
        '<input class="pr-inp" type="number" data-id="'+p.id+'" value="'+cur+'" min="0" oninput="markDirty(this)">'+
        '</div></div>';
    });
    area.innerHTML+='<div class="psec"><div class="ps-hdr '+sec.cls+'"><span>'+sec.title+'</span><span>'+sec.sub+'</span></div>'+rows+'</div>';
  });
  syncPackCostInputs();
}

export function markDirty(el) { el.classList.add('dirty'); }

export function renderPurchaseTab() {
  const area = document.getElementById('pur-table-area');
  if (!area) return;
  const s = ps();
  const rows = allTenantRows().filter(p => p.ct !== 'free');
  let totalCost = 0;
  const purchaseLines = [];

  rows.forEach(p => {
    const assigned = getAssigned(p);
    if (!assigned) return;
    const cov = getRowCoverage(p, s);

    if (cov.uncovered > 0) {
      const cpu = getPrice(p);
      const cost = cov.uncovered * cpu;
      totalCost += cost;
      const covSrc = cov.sources.map(s => s.name).join(', ') || (cov.autoAvail > 0 ? 'Pack (auto)' : '—');
      purchaseLines.push({
        name:     p.name,
        assigned,
        covered:  assigned - cov.uncovered,
        missing:  cov.uncovered,
        cpu,
        cost,
        source:   covSrc,
        isCustom: p.isCustom,
      });
    }
  });

  if (!purchaseLines.length) {
    area.innerHTML = '<div style="padding:28px;text-align:center;color:var(--text-light);font-size:12px;font-style:italic" data-i18n="pur_nothing">' + t('pur_nothing') + '</div>';
    document.getElementById('pur-total-bar').style.display = 'none';
    return;
  }

  let html = '<div class="tscroll" style="border-radius:var(--r);box-shadow:var(--sh)"><table style="width:100%;border-collapse:separate;border-spacing:0;background:white;border:1px solid var(--border);border-radius:var(--r);overflow:hidden;font-size:12px">';
  html += '<thead><tr style="background:var(--sg-light)">';
  html += '<th style="padding:9px 10px;text-align:left;font-size:9px;font-weight:700;color:var(--text-muted);letter-spacing:.8px;text-transform:uppercase;border-bottom:1px solid var(--border);min-width:200px" data-i18n="pur_col_lic">License</th>';
  html += '<th style="padding:9px 10px;text-align:center;font-size:9px;font-weight:700;color:var(--text-muted);letter-spacing:.8px;text-transform:uppercase;border-bottom:1px solid var(--border);min-width:70px" data-i18n="pur_col_assigned">Assigned</th>';
  html += '<th style="padding:9px 10px;text-align:center;font-size:9px;font-weight:700;color:var(--cov);letter-spacing:.8px;text-transform:uppercase;border-bottom:1px solid var(--border);min-width:80px" data-i18n="pur_col_covered">Pack Covered</th>';
  html += '<th style="padding:9px 10px;text-align:center;font-size:9px;font-weight:700;color:var(--unc);letter-spacing:.8px;text-transform:uppercase;border-bottom:1px solid var(--border);min-width:80px" data-i18n="pur_col_missing">To Purchase</th>';
  html += '<th style="padding:9px 10px;text-align:center;font-size:9px;font-weight:700;color:var(--text-muted);letter-spacing:.8px;text-transform:uppercase;border-bottom:1px solid var(--border);min-width:80px" data-i18n="pur_col_cpu">Unit Cost/yr</th>';
  html += '<th style="padding:9px 10px;text-align:center;font-size:9px;font-weight:700;color:var(--sg-amber);letter-spacing:.8px;text-transform:uppercase;border-bottom:1px solid var(--border);min-width:90px" data-i18n="pur_col_total">Annual Cost</th>';
  html += '<th style="padding:9px 10px;text-align:left;font-size:9px;font-weight:700;color:var(--text-muted);letter-spacing:.8px;text-transform:uppercase;border-bottom:1px solid var(--border);min-width:120px" data-i18n="pur_col_source">Pack Covers</th>';
  html += '</tr></thead><tbody>';

  purchaseLines.forEach(line => {
    const pctCov = line.assigned > 0 ? Math.round((line.covered / line.assigned)*100) : 0;
    html += '<tr style="border-bottom:1px solid var(--border-soft)">';
    html += '<td style="padding:9px 10px"><div style="font-weight:600;color:var(--text-dark)">'+line.name+'</div>' +
            (pctCov > 0 ? '<div style="font-size:10px;color:var(--cov);margin-top:2px">'+pctCov+'% covered by pack</div>' : '') + '</td>';
    html += '<td style="padding:9px 10px;text-align:center;font-weight:600">'+line.assigned+'</td>';
    html += '<td style="padding:9px 10px;text-align:center;color:var(--cov);font-weight:600">'+(line.covered||'—')+'</td>';
    html += '<td style="padding:9px 10px;text-align:center"><span style="font-weight:800;color:var(--unc);font-size:14px">'+line.missing+'</span></td>';
    html += '<td style="padding:9px 10px;text-align:center;color:var(--text-muted)">'+(line.cpu>0?'$'+line.cpu.toLocaleString():'—')+'</td>';
    html += '<td style="padding:9px 10px;text-align:center"><span style="font-weight:700;color:var(--sg-amber)">'+(line.cost>0?'$'+Math.round(line.cost).toLocaleString():'—')+'</span></td>';
    html += '<td style="padding:9px 10px;font-size:11px;color:var(--text-muted)">'+line.source+'</td>';
    html += '</tr>';
  });

  // Total row
  html += '<tr style="background:var(--sg-light);border-top:2px solid var(--border)">';
  html += '<td colspan="3" style="padding:9px 10px;font-weight:700;font-size:12px">TOTAL</td>';
  html += '<td style="padding:9px 10px;text-align:center;font-weight:800;color:var(--unc);font-size:14px">'+purchaseLines.reduce((a,l)=>a+l.missing,0)+'</td>';
  html += '<td></td>';
  html += '<td style="padding:9px 10px;text-align:center;font-weight:800;color:var(--sg-amber);font-size:16px">$'+Math.round(totalCost).toLocaleString()+'</td>';
  html += '<td></td></tr>';
  html += '</tbody></table></div>';

  area.innerHTML = html;
  applyI18n();

  const tb = document.getElementById('pur-total-bar');
  if (tb) {
    tb.style.display = 'flex';
    const tv = document.getElementById('pur-total-val');
    if (tv) tv.textContent = '$'+Math.round(totalCost).toLocaleString();
  }
}

// ══════════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════════
