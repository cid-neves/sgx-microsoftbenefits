// ════════════════════════════════════════════════════════════════════
// src/render/usage.js — Usage vs Pack table + row replacement UI
// ════════════════════════════════════════════════════════════════════
import { PACK_LICENSES } from '../data.js';
import { USAGE_DATA, lastSaveActivity, setLastSaveActivity, editTimers } from '../state.js';
import { t } from '../i18n.js';
import { ps, getAvail, rpf, getAssigned, getExpectedMonthly, fm, co, getPrice, allTenantRows } from '../main.js';
import { saveToServer, saveRowSources } from '../sync.js';
import { renderPurchaseTab } from './allpacks.js';

let vf1='all', sc1='coverage';

export function setVF(f, btn) {
  vf1 = f;
  btn.closest('[style*="gap"]').querySelectorAll('.fbtn').forEach(b=>b.className='fbtn');
  const m={all:'fba',covered:'fb-c',upgrade:'fb-u',uncovered:'fb-n',free:'fb-f'};
  btn.classList.add(m[f]||'fba');
  renderUsage();
}
export function srt1(c) { sc1 = c; renderUsage(); }

export const CAT_CLS = {'Microsoft 365':'cat-m365','Copilot':'cat-cop','Azure':'cat-az','Dynamics 365':'cat-dyn','Power Platform':'cat-pp','Security':'cat-sec','Windows':'cat-win','Windows Server':'cat-srv','Dev Tools':'cat-dev','Sandbox':'cat-sand'};

export function renderUsage() {
  const s = ps(), q = (document.getElementById('srch1')||{value:''}).value.toLowerCase().trim();
  let data = allTenantRows().filter(p => {
    if(q && !p.name.toLowerCase().includes(q) && !(p.pp||'').toLowerCase().includes(q)) return false;
    if(vf1!=='all' && p.ct!==vf1) return false;
    return true;
  });
  data.sort((a,b) => {
    const sm = sc1;
    if(sm==='coverage') return co(a.ct)-co(b.ct);
    if(sm==='name') return a.name.localeCompare(b.name);
    if(sm==='assigned') return getAssigned(b)-getAssigned(a);
    if(sm==='needed') { const av_a=getAvail(a,s),av_b=getAvail(b,s); return Math.max(0,getAssigned(b)-av_b)-Math.max(0,getAssigned(a)-av_a); }
    if(sm==='cost') return getPrice(b)*getAssigned(b)-getPrice(a)*getAssigned(a);
    return 0;
  });

  const tb = document.getElementById('tb1');
  if(!tb) return;
  tb.innerHTML = '';
  if(!data.length){tb.innerHTML='<tr class="erow"><td colspan="16">No results</td></tr>';updateStats1(s);return;}

  const sl={covered:t('sec_covered'),upgrade:t('sec_upgrade'),uncovered:t('sec_uncovered'),free:t('sec_free')};
  let lastS=null;
  data.forEach(p => {
    const assigned = getAssigned(p);
    const av = getAvail(p, s);
    const nd = Math.max(0, assigned - av);
    const pct = av>0 ? Math.min((assigned/av)*100,100) : (assigned>0?100:0);
    const over = av>0 && assigned>av, near = av>0 && !over && assigned/av>=0.8;
    const cpu = getPrice(p);

    if(sc1==='coverage'&&p.ct!==lastS){lastS=p.ct;const sr=document.createElement('tr');sr.className='tr-s';sr.innerHTML='<td colspan="16">'+sl[p.ct]+'</td>';tb.appendChild(sr);}

    function qc(val,k){
      const sk=s[k]; if(!sk) return '<td class="tc"><span class="qn">—</span></td>';
      const on=sk.on, hasM=(k==='l'||k==='c'||k==='e'), m=sk.m||1;
      const eff=val?(hasM?val*m:val):null;
      if(!on||!val) return '<td class="tc"><span class="qn">—</span></td>';
      return '<td class="tc"><span class="qv">'+eff+'</span>'+(hasM&&m>1?'<span class="qe">('+val+'×'+m+')</span>':'')+' </td>';
    }
    const avc = av>0?'<td class="tc"><span class="av-v">'+av+'</span></td>':'<td class="tc"><span class="av-z">—</span></td>';

    let ubc;
    if(p.ct==='free'){
      ubc='<td><div class="ubw"><div class="ubt"><div class="ubf uf-bl" style="width:'+Math.min((assigned/Math.max(assigned,1))*100,100)+'%"></div></div><span class="ubl">'+assigned+'</span></div></td>';
    } else if(p.isConsumption) {
      const em = getExpectedMonthly(p);
      const pack_monthly = av / 12;
      const pctC = pack_monthly>0 ? Math.min((em/pack_monthly)*100,100) : 0;
      const cl = em>pack_monthly?'uf-ov':em/Math.max(pack_monthly,1)>=0.8?'uf-w':'uf-ok';
      ubc='<td><div class="ubw"><div class="ubt"><div class="ubf '+cl+'" style="width:'+pctC+'%"></div></div><span class="ubl">'+fm(em)+'/mo vs '+fm(av)+'/yr</span></div></td>';
    } else if(!av) {
      ubc='<td><span style="font-size:10px;color:var(--text-light)">'+t('no_pack_limit')+'</span></td>';
    } else {
      const cl=over?'uf-ov':near?'uf-w':'uf-ok', lc=over?' ul-ov':near?' ul-w':'';
      ubc='<td><div class="ubw"><div class="ubt"><div class="ubf '+cl+'" style="width:'+pct+'%"></div></div><span class="ubl'+lc+'">'+assigned+' / '+av+'</span></div></td>';
    }

    let ndc;
    if(p.ct==='free') ndc='<td class="tc"><span class="av-z">—</span></td>';
    else if(p.isConsumption) { const em=getExpectedMonthly(p); ndc='<td class="tc"><span style="font-size:11px;color:var(--text-muted)">'+(em>0?fm(em)+'/mo':'—')+'</span></td>'; }
    else if(p.ct==='uncovered'){const n=assigned;ndc='<td class="tc"><span class="'+(n>0?'nd-p':'av-z')+'">'+(n>0?'+'+n:'—')+'</span></td>';}
    else if(nd>0) ndc='<td class="tc"><span class="nd-p">+'+nd+'</span></td>';
    else ndc='<td class="tc"><span class="nd-ok">✓</span></td>';

    const cstc = cpu>0?'<td class="tc"><span class="cv-v">'+fm(cpu)+'</span></td>':'<td class="tc"><span class="cv-n">free</span></td>';

    let pill;
    if(p.ct==='free') pill='<span class="cpill cp-f"><span class="cpd"></span>'+t('pill_free')+'</span>';
    else if(p.ct==='covered'&&over) pill='<span class="cpill cp-ov"><span class="cpd"></span>'+t('pill_over')+'</span>';
    else if(p.ct==='covered') pill='<span class="cpill cp-c"><span class="cpd"></span>'+t('pill_covered')+'</span>';
    else if(p.ct==='upgrade') pill='<span class="cpill cp-u"><span class="cpd"></span>'+t('pill_upgrade')+'</span>';
    else pill='<span class="cpill cp-n"><span class="cpd"></span>'+t('pill_needs')+'</span>';

    let bdg='';
    if(p.n26) bdg+='<span class="bdg b26">NEW 2026</span>';
    else if(p.n25) bdg+='<span class="bdg b25">NEW 2025</span>';
    if(p.ct==='upgrade') bdg+='<span class="bdg bup">UPG</span>';
    if(p.ct==='free') bdg+='<span class="bdg bfr">FREE</span>';
    if(p.isCustom) bdg+='<span class="bdg bmanual">'+t('add_lic_custom_badge')+'</span>';
    let sub='';
    if(p.pp&&p.ct!=='free') sub+='<div class="psb">→ '+p.pp+'</div>';
    if(p.note&&p.ct==='upgrade') sub+='<div class="pnt-u">'+p.note+'</div>';
    if(p.note&&p.ct==='uncovered') sub+='<div class="pnt-n">'+p.note+'</div>';
    if(p.note&&p.isCustom&&!p.pp) sub+='<div class="psb" style="color:var(--text-muted)">'+p.note+'</div>';

    // EDIT CELL
    let editCell;
    if(p.ct==='free') {
      editCell = '<td></td>';
    } else if(p.isConsumption) {
      const em = getExpectedMonthly(p);
      editCell = '<td><div class="ie-wrap"><input class="ie" type="number" value="'+em+'" min="0" placeholder="0" title="'+t('expected_monthly')+'" data-pid="'+p.id+'" data-field="expected_monthly" oninput="onUsageEditEvt(this)"><span class="ie-lbl">/mo</span></div></td>';
    } else {
      editCell = '<td><div class="ie-wrap"><input class="ie" type="number" value="'+assigned+'" min="0" title="'+t('assigned_lbl')+'" data-pid="'+p.id+'" data-field="assigned" oninput="onUsageEditEvt(this)"></div></td>';
    }

    const tr = document.createElement('tr');
    const removeBtn = p.isCustom ? ' <button class="btn-row-remove" data-cid="'+p.id+'" onclick="removeCustomLicense(this.dataset.cid)" title="'+t('add_lic_remove')+'">✕</button>' : '';
    const repUI = p.ct !== 'free' ? renderRowReplacementUI(p, s) : '';
    tr.innerHTML = '<td><div class="pnm">'+p.name+bdg+removeBtn+'</div>'+sub+repUI+'</td>'+
      '<td class="tc" style="font-size:11px;color:var(--text-muted)">'+(p.total||'∞')+'</td>'+
      '<td class="tc" style="font-weight:600">'+assigned+'</td>'+
      qc(rpf(p,'l'),'l')+qc(rpf(p,'c'),'c')+qc(rpf(p,'e'),'e')+qc(rpf(p,'i'),'i')+qc(rpf(p,'mw'),'mw')+qc(rpf(p,'sec'),'sec')+qc(rpf(p,'avd'),'avd')+avc+ubc+ndc+cstc+
      '<td class="tc">'+pill+'</td>'+editCell;
    tb.appendChild(tr);
  });
  updateStats1(s);
}

export function updateStats1(s) {
  const real = allTenantRows().filter(p=>p.ct!=='free');
  document.getElementById('st-t1').textContent = real.length;
  document.getElementById('st-a1').textContent = real.reduce((a,p)=>a+getAssigned(p),0).toLocaleString();
  const allR = allTenantRows();
  document.getElementById('st-c1').textContent = allR.filter(p=>p.ct==='covered').length;
  document.getElementById('st-u1').textContent = allR.filter(p=>p.ct==='upgrade').length;
  document.getElementById('st-n1').textContent = allR.filter(p=>p.ct==='uncovered').length;
  document.getElementById('st-o1').textContent = allR.filter(p=>{ const av=getAvail(p,s); return av>0&&getAssigned(p)>av; }).length;
}

// ── Per-row replacement sources ───────────────────────────────────
export function getRowSources(id) {
  return (USAGE_DATA[id] && USAGE_DATA[id].sources) ? USAGE_DATA[id].sources : [];
}
export function setRowSources(id, sources) {
  if (!USAGE_DATA[id]) USAGE_DATA[id] = {};
  USAGE_DATA[id].sources = sources;
}

// Compute coverage breakdown for a row:
// returns {covered, uncovered, sources: [{packId, qty, avail, used, status}]}
export function getRowCoverage(p, s) {
  if (!p || !s) return { covered: 0, uncovered: 0, sources: [], autoAvail: 0 };
  const assigned = getAssigned(p);
  const sources  = getRowSources(p.id);
  if (!sources.length) {
    const avail = getAvail(p, s);
    const covered = Math.min(assigned, avail);
    return { covered, uncovered: assigned - covered, sources: [], autoAvail: avail };
  }
  let remaining = assigned;
  const detail  = [];
  for (const src of sources) {
    if (remaining <= 0) break;
    const pl    = PACK_LICENSES.filter(Boolean).find(pl => pl.id === src.packId);
    if (!pl) continue;
    const avail = getAvail(pl, s);   // total pack qty for this license
    const used  = Math.min(remaining, src.qty > 0 ? src.qty : avail);
    remaining  -= used;
    detail.push({ packId: src.packId, name: pl.name, avail, used,
                  status: used >= (src.qty||avail) ? 'ok' : 'partial' });
  }
  return { covered: assigned - remaining, uncovered: remaining, sources: detail };
}

// Build pack-select HTML for a replacement row dropdown
export function buildPackSelectHTML(selectedId, rowId, srcIdx) {
  let html = '<select class="rep-sel" data-rid="'+rowId+'" data-sidx="'+srcIdx+'" onchange="onRepSelectChange(this)">';
  html += '<option value="">— pack license —</option>';
  const cats = {};
  PACK_LICENSES.forEach(pl => { if (!cats[pl.cat]) cats[pl.cat]=[]; cats[pl.cat].push(pl); });
  Object.entries(cats).sort(([a],[b])=>a.localeCompare(b)).forEach(([cat,items]) => {
    html += '<optgroup label="'+cat+'">';
    items.forEach(pl => {
      const sel = pl.id === selectedId ? ' selected' : '';
      html += '<option value="'+pl.id+'"'+sel+'>'+pl.name+'</option>';
    });
    html += '</optgroup>';
  });
  html += '</select>';
  return html;
}

// Render the replacement sources UI below a row's name cell
// Returns an HTML string to embed in the name <td>
export function renderRowReplacementUI(p, s) {
  try {
  if (!p || p.ct === 'free') return '';
  const assigned = getAssigned(p);
  if (typeof p.id !== 'string') { console.error('repUI: bad p.id', typeof p.id, p); return ''; }
  const sources  = getRowSources(p.id);
  if (!Array.isArray(sources)) { console.error('repUI: sources not array for', p.id, typeof sources, sources); return ''; }
  const cov      = getRowCoverage(p, s);

  let html = '<div class="rep-sources">';

  // Existing source rows
  sources.forEach((src, sidx) => {
    if (!src) return;
    try {
    const pl = PACK_LICENSES.filter(Boolean).find(pl => pl.id === src.packId);
    const avail = pl ? getAvail(pl, s) : 0;
    let statusCls = 'rep-ok', statusTxt = '';
    if (!pl || avail === 0) { statusCls='rep-bad'; statusTxt='no pack qty'; }
    else if (src.qty > avail) { statusCls='rep-warn'; statusTxt='only '+avail+' avail.'; }
    else { statusTxt=src.qty+' covered'; }

    html += '<div class="rep-row">';
    html += buildPackSelectHTML(src.packId, p.id, sidx);
    html += '<input class="rep-qty-in" type="number" min="0" value="'+src.qty+'" data-rid="'+p.id+'" data-sidx="'+sidx+'" oninput="onRepQtyChange(this)" title="Users covered by this source">';
    html += '<span class="rep-status '+statusCls+'">'+statusTxt+'</span>';
    html += '<button class="rep-del-btn" data-rid="'+p.id+'" data-sidx="'+sidx+'" onclick="delRepSource(this.dataset.rid,parseInt(this.dataset.sidx))" title="Remove">✕</button>';
    html += '</div>';
    } catch(srcErr) { console.error('rep src error at sidx', sidx, src, srcErr.message); }
  });

  // Show uncovered count
  if (cov.uncovered > 0) {
    html += '<div class="rep-uncov">'+cov.uncovered+' '+t('rep_uncovered')+'</div>';
  }

  // Add source button (always show if not fully covered OR if no sources yet)
  if (cov.uncovered > 0 || sources.length === 0) {
    html += '<button class="rep-add-btn" data-rid="'+p.id+'" onclick="addRepSource(this.dataset.rid)">'+t('rep_add_source')+'</button>';
  }

  html += '</div>';
  return html;
  } catch(e) {
    console.error('repUI error', e.message, e.stack ? e.stack.split('\n')[1] : '');
    return '';
  }
}
export function addRepSource(rowId) {
  try {
  setLastSaveActivity(Date.now());
    if (!rowId) { console.error('addRepSource: empty rowId'); return; }
    const rawSources = getRowSources(rowId);
    const sources = Array.isArray(rawSources) ? rawSources.slice() : [];
    const rows = allTenantRows();
    const p = rows.find(r => r.id === rowId);
    if (!p) { console.error('addRepSource: row not found. rowId='+rowId+' ids='+rows.slice(0,5).map(r=>r&&r.id).join(',')); return; }
    const s = ps();
    const cov = getRowCoverage(p, s);
    const uncov = Math.max(0, cov.uncovered);
    sources.push({ packId: '', qty: uncov });
    setRowSources(rowId, sources);  // update in-memory immediately
    renderUsage();                   // render first (instant feedback)
    renderPurchaseTab();
    saveRowSources(rowId);           // save async (fire and forget)
  } catch(e) {
    console.error('addRepSource error:', e.message, '| rowId:', rowId, '| stack:', e.stack ? e.stack.split('\n')[1] : '');
  }
}
export function delRepSource(rowId, idx) {
  setLastSaveActivity(Date.now());
  const sources = getRowSources(rowId).slice();
  sources.splice(idx, 1);
  setRowSources(rowId, sources);
  renderUsage();
  renderPurchaseTab();
  saveRowSources(rowId);
}
export function onRepSelectChange(sel) {
  setLastSaveActivity(Date.now());
  const rowId = sel.dataset.rid;
  const idx   = parseInt(sel.dataset.sidx);
  const sources = getRowSources(rowId).slice();
  if (!sources[idx]) return;
  sources[idx].packId = sel.value;
  setRowSources(rowId, sources);
  renderUsage();
  renderPurchaseTab();
  saveRowSources(rowId);
}
export function onRepQtyChange(inp) {
  const rowId = inp.dataset.rid;
  const idx   = parseInt(inp.dataset.sidx);
  const sources = getRowSources(rowId);
  if (!sources[idx]) return;
  sources[idx].qty = parseInt(inp.value) || 0;
  setRowSources(rowId, sources);
  // Debounced save
  clearTimeout(editTimers['rep_'+rowId]);
  editTimers['rep_'+rowId] = setTimeout(() => {
    saveRowSources(rowId);
    renderPurchaseTab();
  }, 600);
}
