// ════════════════════════════════════════════════════════════════════
// src/render/finance.js — Usage Economics, Full Pack Value, Cloud tabs
// ════════════════════════════════════════════════════════════════════
import { PACK_LICENSES, DEFAULT_PACK_COSTS } from '../data.js';
import { PACK_COSTS, PRICES } from '../state.js';
import { t } from '../i18n.js';
import { ps, getAvail, getBestQty, getPrice, fm, co, getAssigned, getExpectedMonthly, allTenantRows } from '../main.js';
import { CAT_CLS } from './usage.js';

export function renderFin1_safe() { if(document.getElementById('t-fin1').classList.contains('active')) renderFin1(); }
export function renderFin2_safe() { if(document.getElementById('t-fin2').classList.contains('active')) renderFin2(); }

export function renderFin1() {
  const s=ps(),fb=document.getElementById('fb1');if(!fb)return;
  fb.innerHTML='';let inv=0,ret=0,unc=0;const rows=[];
  [{k:'l',lbl:'Partner Launch Benefits'},{k:'c',lbl:'Partner Success Core'},{k:'e',lbl:'Partner Success Expanded'}].forEach(pk=>{
    if(!s[pk.k].on)return;const m=s[pk.k].m,tot=PACK_COSTS[pk.k]*m;inv+=tot;
    rows.push({lbl:pk.lbl,qty:m+(m>1?' inst.':' inst.'),unit:fm(PACK_COSTS[pk.k]),ann:fm(tot),type:'fee',note:'Annual pack fee'});
  });
  // SPD fee is paid once regardless of which designations are active
  const spdActive = [];
  if(s.i.on)   spdActive.push('Infrastructure');
  if(s.mw&&s.mw.on)  spdActive.push('Modern Work');
  if(s.sec&&s.sec.on) spdActive.push('Security');
  if(s.avd&&s.avd.on) spdActive.push('AVD spec.');
  if(spdActive.length) {
    const spdFee = PACK_COSTS.i||4730; inv+=spdFee;
    rows.push({lbl:'Solutions Partner Designation(s): '+spdActive.join(', '),qty:'1 fee',unit:fm(spdFee),ann:fm(spdFee),type:'fee',note:'Single annual SPD fee covers all active designations'});
  }
  allTenantRows().filter(p=>(p.ct==='covered'||p.ct==='upgrade')&&getPrice(p)>0&&!p.isConsumption).forEach(p=>{
    const av=getAvail(p,s),cov=Math.min(getAssigned(p),av>0?av:getAssigned(p)),r=cov*getPrice(p);ret+=r;
    rows.push({lbl:p.name+(p.ct==='upgrade'?' (upgrade)':''),qty:cov+' '+t('col_assigned').toLowerCase(),unit:fm(getPrice(p)),ann:fm(r),type:'retail',note:p.ct==='upgrade'?'Pack provides higher edition':'Covered'});
  });
  // Azure consumption
  allTenantRows().filter(p=>p.isConsumption&&p.ct==='covered').forEach(p=>{
    const em=getExpectedMonthly(p);if(!em)return;
    const annual=em*12;ret+=annual;
    rows.push({lbl:p.name+' (expected usage)',qty:fm(em)+'/mo',unit:fm(em),ann:fm(annual),type:'retail',note:'Based on expected monthly consumption vs pack credits'});
  });
  allTenantRows().filter(p=>p.ct==='uncovered'&&getPrice(p)>0).forEach(p=>{
    const c=getAssigned(p)*getPrice(p);unc+=c;
    rows.push({lbl:p.name,qty:getAssigned(p)+' '+t('col_assigned').toLowerCase(),unit:fm(getPrice(p)),ann:fm(c),type:'extra',note:t('not_covered')});
  });
  allTenantRows().filter(p=>(p.ct==='covered'||p.ct==='upgrade')&&getPrice(p)>0&&!p.isConsumption).forEach(p=>{
    const av=getAvail(p,s);if(av>0&&getAssigned(p)>av){const ex=getAssigned(p)-av,c=ex*getPrice(p);unc+=c;rows.push({lbl:p.name+' (excess)',qty:ex,unit:fm(getPrice(p)),ann:fm(c),type:'extra',note:'Over pack limit'});}
  });
  const tc={'fee':'#eaf4f8','retail':'#eaf7f0','extra':'#fdf0f2'};
  rows.forEach(r=>{
    const tr=document.createElement('tr');tr.style.background=tc[r.type]||'';
    let av,tp;
    if(r.type==='fee'){av='<span class="fb-i">'+r.ann+'</span>';tp='<span class="cpill cp-c" style="font-size:10px">'+t('pack_fee')+'</span>';}
    else if(r.type==='retail'){av='<span class="fb-r">'+r.ann+'</span>';tp='<span class="cpill cp-c" style="font-size:10px">'+t('retail_val')+'</span>';}
    else{av='<span class="fb-n">'+r.ann+'</span>';tp='<span class="cpill cp-n" style="font-size:10px">'+t('extra_cost')+'</span>';}
    tr.innerHTML='<td style="font-weight:500">'+r.lbl+'</td><td class="tc" style="color:var(--text-muted)">'+r.qty+'</td><td class="tc" style="color:var(--text-muted)">'+r.unit+'</td><td class="tc">'+av+'</td><td class="tc">'+tp+'</td><td style="color:var(--text-muted);font-size:11px">'+r.note+'</td>';
    fb.appendChild(tr);
  });
  const net=ret-inv-unc;
  const ftr=document.createElement('tr');ftr.className='ftr';
  ftr.innerHTML='<td colspan="2"><strong>'+t('totals')+'</strong></td><td></td><td class="tc"><span class="fb-i">'+fm(inv)+'</span><br><small style="font-weight:400;font-size:10px;color:var(--text-muted)">'+t('pack_investment_lbl')+'</small></td><td class="tc"><span class="fb-r">'+fm(ret)+'</span><br><small style="font-weight:400;font-size:10px;color:var(--text-muted)">'+t('retail_of_used')+'</small></td><td class="tc"><span class="'+(net>=0?'fb-s':'fb-n')+'">'+(net>=0?'+':'')+fm(net)+'</span><br><small style="font-weight:400;font-size:10px;color:var(--text-muted)">'+t('net')+'</small></td>';
  fb.appendChild(ftr);
  document.getElementById('f1-inv').textContent=fm(inv);
  document.getElementById('f1-inv-sub').textContent=Object.entries(s).filter(([k,v])=>v.on).map(([k,v])=>({l:'Launch',c:'Core',e:'Expanded',i:'Infra'}[k])+(k!=='i'?' ×'+v.m:'')).join(' + ')||'—';
  document.getElementById('f1-ret').textContent=fm(ret);
  const se=document.getElementById('f1-sav');se.textContent=(net>=0?'+':'')+fm(net);se.className='fcval '+(net>=0?'fv-s':'fv-e');
  document.getElementById('f1-sav-sub').textContent='Retail ('+fm(ret)+') − Packs ('+fm(inv)+') − Extra ('+fm(unc)+')';
}

// ══════════════════════════════════════════════════════════════════
// TAB 5: FULL PACK VALUE
// ══════════════════════════════════════════════════════════════════
let sc_f2='rv',sd_f2='desc';
export function srtF2(c){if(sc_f2===c)sd_f2=sd_f2==='asc'?'desc':'asc';else{sc_f2=c;sd_f2='desc';}renderFin2();}

export function renderFin2() {
  const s=ps(),fb=document.getElementById('fb2');if(!fb)return;
  fb.innerHTML='';let totalRV=0,totalInv=0;
  // totalInv built per pack-row below (SPD counted once after)
  [{k:'l',lbl:'Partner Launch'},{k:'c',lbl:'Partner Success Core'},{k:'e',lbl:'Partner Success Expanded'}].forEach(pk=>{
    if(!s[pk.k].on)return;const m=s[pk.k].m,tot=PACK_COSTS[pk.k]*m;
    totalInv+=tot;
    const tr=document.createElement('tr');tr.style.background='#eaf4f8';
    tr.innerHTML='<td style="font-weight:600;font-style:italic">'+pk.lbl+'</td><td class="tc">'+(pk.k!=='i'?m+' inst.':'1 designation')+'</td><td class="tc">'+fm(PACK_COSTS[pk.k])+'</td><td class="tc"><span class="fb-i">'+fm(tot)+'</span></td><td class="tc"><span class="cpill cp-c" style="font-size:10px">'+t('pack_fee')+'</span></td><td style="font-size:11px;color:var(--text-muted)">Annual pack fee</td>';
    fb.appendChild(tr);
  });
  // SPD single fee
  {const spdA=[];if(s.i.on)spdA.push('Infra');if(s.mw&&s.mw.on)spdA.push('Modern Work');if(s.sec&&s.sec.on)spdA.push('Security');if(s.avd&&s.avd.on)spdA.push('AVD');
   if(spdA.length){const spdFee=PACK_COSTS.i||4730;totalInv+=spdFee;const tr2=document.createElement('tr');tr2.style.background='#eaf4f8';
   tr2.innerHTML='<td style="font-weight:600;font-style:italic">Solutions Partner: '+spdA.join(' + ')+'</td><td class="tc">1 fee</td><td class="tc">'+fm(spdFee)+'</td><td class="tc"><span class="fb-i">'+fm(spdFee)+'</span></td><td class="tc"><span class="cpill cp-c" style="font-size:10px">SPD fee</span></td><td style="color:var(--text-muted);font-size:11px">Single annual fee covers all active designations</td>';
   fb.appendChild(tr2);}}
  let licRows=[];
  PACK_LICENSES.forEach(p=>{
    const bq=getBestQty(p,s);if(!bq)return;
    const cpu=PRICES[p.id]??p.cpu;if(cpu===0&&p.cat==='Sandbox')return;
    const rv=cpu>0?cpu*bq.qty:0;totalRV+=rv;
    licRows.push({p,bq,cpu,rv});
  });
  licRows.sort((a,b)=>{
    if(sc_f2==='cpu'){const d=a.cpu-b.cpu;return sd_f2==='asc'?d:-d;}
    const d=a.rv-b.rv;return sd_f2==='asc'?d:-d;
  });
  licRows.forEach(({p,bq,cpu,rv})=>{
    const tr=document.createElement('tr');
    const catCls=CAT_CLS[p.cat]||'cat-m365';
    let bdg='';if(p.n26)bdg='<span class="bdg b26">N26</span>';else if(p.n25)bdg='<span class="bdg b25">N25</span>';
    tr.innerHTML='<td><div class="pnm">'+p.name+bdg+'</div><div class="psb"><span class="cat '+catCls+'">'+p.cat+'</span></div></td>'+
      '<td class="tc"><span class="qv">'+bq.qty+'</span><span class="qe">'+bq.src+'</span></td>'+
      '<td class="tc">'+(cpu>0?fm(cpu):'<span class="cv-n">free</span>')+'</td>'+
      '<td class="tc">'+(rv>0?'<span style="font-weight:700;color:var(--sg-amber)">'+fm(rv)+'</span>':'<span class="cv-n">—</span>')+'</td>'+
      '<td class="tc" style="font-size:10px;color:var(--text-muted)">'+bq.src+'</td>'+
      '<td style="font-size:11px;color:var(--text-muted)">'+p.note+'</td>';
    fb.appendChild(tr);
  });
  const net=totalRV-totalInv;
  const ftr=document.createElement('tr');ftr.className='ftr';
  ftr.innerHTML='<td colspan="2"><strong>'+t('totals')+'</strong></td><td></td>'+
    '<td class="tc"><span class="fb-r">'+fm(totalRV)+'</span><br><small style="font-weight:400;font-size:10px;color:var(--text-muted)">'+t('retail_value')+'</small></td>'+
    '<td class="tc" colspan="2"><span class="'+(net>=0?'fb-s':'fb-n')+'">Packs: '+fm(totalInv)+' → '+(net>=0?'+':'')+fm(net)+'</span></td>';
  fb.appendChild(ftr);
  document.getElementById('f2-inv').textContent=fm(totalInv);
  document.getElementById('f2-inv-sub').textContent=Object.entries(s).filter(([k,v])=>v.on).map(([k,v])=>({l:'Launch',c:'Core',e:'Expanded',i:'Infra'}[k])+(k!=='i'?' ×'+v.m:'')).join(' + ')||'—';
  document.getElementById('f2-ret').textContent=fm(totalRV);
  document.getElementById('f2-sav').textContent=(net>=0?'+':'')+fm(net);
  const note=document.getElementById('f2-note');
  if(note) note.innerHTML='<strong>Pack cost:</strong> '+fm(totalInv)+' &nbsp;·&nbsp; <strong>Retail value of all included licenses:</strong> '+fm(totalRV)+' &nbsp;·&nbsp; <strong>Gross savings:</strong> '+(net>=0?'+':'')+fm(net)+' <em>('+( Math.round((totalRV/Math.max(totalInv,1))*10)/10)+'× ROI)</em>';
}

// ══════════════════════════════════════════════════════════════════
// TAB 6: PRICES PAGE
// ══════════════════════════════════════════════════════════════════

export function renderCloud() {
  const s=ps();
  let az=0,cop=0,vs=0,ghcop=0,seccop=0;
  if(s.l.on){az+=700*s.l.m;vs+=1*s.l.m;}
  if(s.c.on){az+=2400*s.c.m;vs+=8*s.c.m;}
  if(s.e.on){az+=5000*s.e.m;vs+=15*s.e.m;cop+=25000*12*s.e.m;}
  if(s.i.on){az+=10000;vs+=25;ghcop+=5000;}
  if(s.mw&&s.mw.on){az+=4000;vs+=25;}
  if(s.sec&&s.sec.on){az+=10000;vs+=25;seccop+=5000;}
  if(s.avd&&s.avd.on){az+=14000;vs+=25;ghcop+=10000;}

  const sa=document.getElementById('cloud-sum-area');if(!sa)return;
  sa.innerHTML='<div class="cs-card"><div class="cs-ti">'+t('combined_cloud')+'</div><div class="csg">'+
    '<div class="cs-it"><div class="cs-lb">'+t('azure_credits')+'</div><div class="cs-vl">'+fm(az)+'</div><div class="cs-sb">'+t('per_year')+'</div></div>'+
    '<div class="cs-it"><div class="cs-lb">'+t('copilot_credits')+'</div><div class="cs-vl">'+(cop/1000).toFixed(0)+'k</div><div class="cs-sb">'+t('per_year_cop')+'</div></div>'+
    '<div class="cs-it"><div class="cs-lb">'+t('vs_subs')+'</div><div class="cs-vl">'+vs+'</div><div class="cs-sb">'+t('ent_ide')+'</div></div>'+
    '<div class="cs-it"><div class="cs-lb">'+t('gh_copilot')+'</div><div class="cs-vl">'+(ghcop>0?fm(ghcop):'—')+'</div><div class="cs-sb">'+(ghcop>0?'Infra SPD / AVD':t('infra_only'))+'</div></div>'+
  '<div class="cs-it"><div class="cs-lb">Security Copilot</div><div class="cs-vl">'+(seccop>0?fm(seccop):'—')+'</div><div class="cs-sb">Security SPD only</div></div>'+
  '</div></div>';

  const GROUPS=[
    {ico:'☁️',cls:'cci-az',title:'Azure Credits',sub:'Production cloud budget',items:[
      {nm:'Azure Bulk Credits',pks:['Launch','Core','Expanded','Infra SPD','Modern Work','Security','AVD'],amounts:[s.l.on?700*s.l.m:0,s.c.on?2400*s.c.m:0,s.e.on?5000*s.e.m:0,s.i.on?10000:0,(s.mw&&s.mw.on)?4000:0,(s.sec&&s.sec.on)?10000:0,(s.avd&&s.avd.on)?14000:0],unit:'USD/yr',note:'Production workloads — Azure Portal',id:'t-azure'},
    ]},
    {ico:'🤖',cls:'cci-cop',title:'Copilot & AI Services',sub:'AI credits and licenses',items:[
      {nm:'Microsoft 365 Copilot',pks:['Expanded'],amounts:[s.e.on?10*s.e.m:0],unit:'licenses',note:'Full M365 Copilot — Word, Excel, Teams, etc.'},
      {nm:'Copilot Studio Credits',pks:['Expanded'],amounts:[s.e.on?25000*s.e.m:0],unit:'credits/mo',note:'Build custom copilots & agents'},
      {nm:'Microsoft Dragon Copilot',pks:['Core','Expanded','Infra SPD'],amounts:[s.c.on?5*s.c.m:0,s.e.on?15*s.e.m:0,s.i.on?20:0],unit:'licenses',note:'Healthcare AI — region-limited'},
      {nm:'GitHub Copilot Enterprise',pks:['Infra SPD'],amounts:[s.i.on?5000:0],unit:'USD Azure credits/yr',note:'$5k Azure credits for GitHub Copilot Enterprise'},
    ]},
    {ico:'🔧',cls:'cci-vs',title:'Visual Studio',sub:'Developer IDE subscriptions',items:[
      {nm:'Visual Studio Enterprise IDE',pks:['Launch','Core','Expanded','Infra SPD'],amounts:[s.l.on?1*s.l.m:0,s.c.on?8*s.c.m:0,s.e.on?15*s.e.m:0,s.i.on?25:0],unit:'subscriptions',note:'Enterprise IDE without monthly Azure credit'},
    ]},
    {ico:'🏗️',cls:'cci-dyn',title:'Dynamics 365 Sandboxes',sub:'Partner dev/demo environments',items:[
      {nm:'Sandbox – Operations App',pks:['Core','Expanded','Infra SPD'],amounts:[s.c.on?25*s.c.m:0,s.e.on?25*s.e.m:0,s.i.on?25:0],unit:'users'},
      {nm:'Sandbox – Sales, FS & CS',pks:['Core','Expanded','Infra SPD'],amounts:[s.c.on?25*s.c.m:0,s.e.on?25*s.e.m:0,s.i.on?25:0],unit:'users'},
      {nm:'Sandbox – Business Central',pks:['Launch','Core','Expanded'],amounts:[s.l.on?5*s.l.m:0,s.c.on?5*s.c.m:0,s.e.on?5*s.e.m:0],unit:'users'},
      {nm:'Sandbox – Contact Center',pks:['Expanded'],amounts:[s.e.on?25*s.e.m:0],unit:'users'},
    ]},
    {ico:'📊',cls:'cci-ai',title:'Fabric & Analytics',sub:'Data platform rights',items:[
      {nm:'Microsoft Fabric (Free)',pks:['All tenants'],amounts:[9999999],unit:'users (unlimited)',note:'Already active in your tenant'},
      {nm:'Power BI Premium (via packs)',pks:['Launch','Core','Expanded','Infra SPD'],amounts:[s.l.on?4*s.l.m:0,s.c.on?15*s.c.m:0,s.e.on?35*s.e.m:0,s.i.on?100:0],unit:'licenses',note:'Includes Fabric analytics workloads'},
    ]},
  ];

  const ca=document.getElementById('cloud-cards-area');if(!ca)return;ca.innerHTML='';
  GROUPS.forEach(g=>{
    let eh='';
    g.items.forEach(item=>{
      const tq=item.amounts.reduce((a,b)=>a+b,0);if(!tq)return;
      const pn=(item.pks||[]).filter((_,i)=>item.amounts[i]>0).join(', ');
      const qd=tq>=9999999?'∞':tq.toLocaleString();
      // Editable expected monthly for Azure
      const editPart = item.id==='t-azure' ? '<div class="ie-wrap" style="margin-top:4px"><input class="ie" type="number" value="'+getExpectedMonthly({id:item.id})+'" min="0" placeholder="0" title="'+t('expected_monthly')+'" data-pid="t-azure" data-field="expected_monthly" oninput="onUsageEditEvt(this)" style="width:80px"><span class="ie-lbl">'+t('expected_monthly')+'</span></div>' : '';
      eh+='<div class="ce-row"><div style="flex:1"><div class="ce-nm">'+item.nm+'</div><div class="ce-pk">'+pn+'</div>'+(item.note?'<div class="ce-nt">'+item.note+'</div>':'')+editPart+'</div><div class="ce-val"><div class="ce-q">'+qd+'</div><div class="ce-u">'+item.unit+'</div></div></div>';
    });
    if(!eh)return;
    ca.innerHTML+='<div class="cloud-card"><div class="cch"><div class="cc-ico '+g.cls+'">'+g.ico+'</div><div><div class="cc-ti">'+g.title+'</div><div class="cc-su">'+g.sub+'</div></div></div><div class="cloud-entries">'+eh+'</div></div>';
  });
}

// ══════════════════════════════════════════════════════════════════
// TAB 4: USAGE ECONOMICS
// ══════════════════════════════════════════════════════════════════
