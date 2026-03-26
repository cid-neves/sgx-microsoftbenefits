// ════════════════════════════════════════════════════════════════════
// src/data.js — Static master data (immutable)
// MASTER DATA: All pack licenses from Benefits Guide Feb 18, 2026
// cpu = cost per user per YEAR (USD, annual billing, retail list)
// ════════════════════════════════════════════════════════════════════

export const DEFAULT_PACK_COSTS = { l:350, c:925, e:4125, i:4730 };

// Master license catalog — ALL licenses delivered by packs
// l/c/e/i = qty per pack (null = not included)
// cpu = retail cost per user/license/year USD
// type = 'Users'|'Licenses'|'Tenant'|'Bots'|'Credits'|'USD'
export const PACK_LICENSES = [
  // ── MICROSOFT 365 ──────────────────────────────────────────
  {id:'m365bp', name:'Microsoft 365 Business Premium (no Teams)', cat:'Microsoft 365', type:'Users', l:5, c:15, e:35, i:null, n26:false, n25:false, cpu:264, note:'EEA/RoW edition — Teams separate'},
  {id:'teams',  name:'Teams Enterprise', cat:'Microsoft 365', type:'Users', l:5, c:15, e:35, i:100, n26:false, n25:false, cpu:63, note:'EEA/RoW; $5.25/mo × 12'},
  {id:'teamsprem',name:'Teams Premium', cat:'Microsoft 365', type:'Users', l:null, c:null, e:10, i:null, n26:true, n25:false, cpu:84, note:'$7/mo × 12'},
  {id:'roomspro', name:'Teams Rooms Pro', cat:'Microsoft 365', type:'Users', l:null, c:null, e:2, i:null, n26:false, n25:true, cpu:600, note:'$50/mo × 12'},
  {id:'viva',   name:'Viva Suite', cat:'Microsoft 365', type:'Users', l:null, c:null, e:15, i:null, n26:false, n25:true, cpu:144, note:'$12/mo × 12'},
  {id:'proj',   name:'Project Online – Project Plan 5', cat:'Microsoft 365', type:'Users', l:1, c:5, e:5, i:20, n26:false, n25:false, cpu:552, note:'$46/mo × 12'},
  {id:'visio',  name:'Visio Online – Visio Plan 2', cat:'Microsoft 365', type:'Users', l:1, c:5, e:5, i:5, n26:false, n25:false, cpu:180, note:'$15/mo × 12'},
  {id:'win365', name:'Windows 365 Enterprise 8vCPU/32GB/512GB', cat:'Windows', type:'Users', l:null, c:1, e:2, i:null, n26:false, n25:true, cpu:480, note:'$40/mo × 12 approx.'},
  // ── COPILOT / AI ────────────────────────────────────────────
  {id:'m365cop',name:'Microsoft 365 Copilot', cat:'Copilot', type:'Users', l:null, c:null, e:10, i:null, n26:true, n25:false, cpu:360, note:'$30/mo × 12'},
  {id:'copstudio',name:'Microsoft Copilot Studio (25k credits/mo pack)', cat:'Copilot', type:'Pack/mo', l:null, c:null, e:1, i:null, n26:true, n25:false, cpu:200, note:'25,000 Copilot credits/mo; ~$200/yr for 1 pack'},
  {id:'dragon', name:'Microsoft Dragon Copilot', cat:'Copilot', type:'Users', l:null, c:5, e:15, i:20, n26:true, n25:false, cpu:480, note:'Healthcare AI; $40/mo approx.'},
  // ── AZURE ───────────────────────────────────────────────────
  {id:'azurecr',name:'Azure Bulk Credits (Production)', cat:'Azure', type:'USD/yr', l:700, c:2400, e:5000, i:10000, n26:false, n25:false, cpu:1, note:'Production Azure credits; $1/credit'},
  {id:'ghcop',  name:'GitHub Copilot Enterprise (via Azure credits)', cat:'Copilot', type:'USD/yr', l:null, c:null, e:null, i:5000, n26:true, n25:false, cpu:1, note:'$5k Azure credits allocated to GH Copilot Enterprise'},
  // ── SECURITY & IDENTITY ─────────────────────────────────────
  {id:'entraid',name:'Entra ID P2', cat:'Security', type:'Users', l:5, c:15, e:35, i:100, n26:false, n25:true, cpu:144, note:'$12/mo × 12'},
  {id:'defsuit',name:'Defender Suite', cat:'Security', type:'Users', l:5, c:15, e:35, i:100, n26:true, n25:false, cpu:360, note:'Full Defender suite; NEW 2026'},
  {id:'defp2',  name:'Defender for Endpoint P2', cat:'Security', type:'Users', l:5, c:15, e:35, i:100, n26:false, n25:true, cpu:84, note:'$7/mo × 12'},
  {id:'entrasuite',name:'Entra Suite', cat:'Security', type:'Users', l:null, c:null, e:35, i:null, n26:true, n25:false, cpu:144, note:'$12/mo × 12; NEW 2026'},
  {id:'intune', name:'Intune Suite', cat:'Security', type:'Users', l:null, c:null, e:35, i:null, n26:true, n25:false, cpu:144, note:'$12/mo × 12; NEW 2026'},
  // ── DEV TOOLS ───────────────────────────────────────────────
  {id:'vsent',  name:'Visual Studio Enterprise IDE', cat:'Dev Tools', type:'Users', l:1, c:8, e:15, i:25, n26:true, n25:false, cpu:2999, note:'~$249.92/mo × 12 annual sub'},
  // ── POWER PLATFORM ──────────────────────────────────────────
  {id:'pbiprem',name:'Power BI Premium (per user)', cat:'Power Platform', type:'Users', l:4, c:15, e:35, i:100, n26:false, n25:false, cpu:240, note:'$20/mo × 12 (updated 2025)'},
  {id:'powerapps',name:'Power Apps Premium', cat:'Power Platform', type:'Users', l:1, c:8, e:15, i:25, n26:false, n25:false, cpu:240, note:'$20/mo × 12'},
  {id:'paauto', name:'Power Automate Premium', cat:'Power Platform', type:'Users', l:1, c:8, e:15, i:25, n26:false, n25:false, cpu:180, note:'$15/mo × 12'},
  {id:'paaproc',name:'Power Automate Process', cat:'Power Platform', type:'Bots', l:null, c:null, e:2, i:5, n26:false, n25:false, cpu:1800, note:'$150/mo × 12 per bot'},
  // ── DYNAMICS 365 ────────────────────────────────────────────
  {id:'d365bc', name:'Dynamics 365 Business Central Premium', cat:'Dynamics 365', type:'Users', l:4, c:15, e:35, i:null, n26:false, n25:false, cpu:1140, note:'$95/mo × 12'},
  {id:'d365se', name:'Dynamics 365 Sales Enterprise', cat:'Dynamics 365', type:'Users', l:4, c:15, e:35, i:null, n26:false, n25:false, cpu:1140, note:'$95/mo × 12'},
  {id:'d365ci', name:'Dynamics 365 Customer Insights', cat:'Dynamics 365', type:'Tenant', l:null, c:null, e:1, i:null, n26:false, n25:false, cpu:17400, note:'$1,450/mo × 12 per tenant'},
  {id:'d365cse',name:'Dynamics 365 Customer Service Enterprise', cat:'Dynamics 365', type:'Users', l:null, c:null, e:35, i:null, n26:false, n25:true, cpu:1140, note:'$95/mo × 12'},
  {id:'d365fp', name:'Dynamics 365 Finance Premium', cat:'Dynamics 365', type:'Users', l:null, c:null, e:35, i:null, n26:false, n25:true, cpu:2280, note:'$190/mo × 12'},
  {id:'d365hr', name:'Dynamics 365 Human Resources', cat:'Dynamics 365', type:'Users', l:null, c:null, e:35, i:null, n26:false, n25:true, cpu:1140, note:'$95/mo × 12'},
  {id:'d365mk', name:'Dynamics 365 Marketing (Base Pack)', cat:'Dynamics 365', type:'Tenant', l:null, c:null, e:1, i:null, n26:false, n25:true, cpu:18000, note:'$1,500/mo × 12 per tenant'},
  {id:'d365po', name:'Dynamics 365 Project Operations', cat:'Dynamics 365', type:'Users', l:null, c:null, e:35, i:null, n26:false, n25:true, cpu:1380, note:'$115/mo × 12'},
  {id:'d365tm', name:'Dynamics 365 Team Members', cat:'Dynamics 365', type:'Users', l:null, c:null, e:35, i:null, n26:false, n25:true, cpu:120, note:'$10/mo × 12'},
  {id:'d365cc', name:'Dynamics 365 Contact Center', cat:'Dynamics 365', type:'Users', l:null, c:null, e:35, i:null, n26:false, n25:true, cpu:1140, note:'$95/mo × 12'},
  // ── WINDOWS SERVER ──────────────────────────────────────────
  {id:'wsrvstd',name:'Windows Server Standard – Per core (2025)', cat:'Windows Server', type:'Licenses', l:null, c:16, e:32, i:100, n26:false, n25:true, cpu:97, note:'~$97/core/yr (2-core pack $194)'},
  {id:'wsrvdc', name:'Windows Server Datacenter – Per core (2025)', cat:'Windows Server', type:'Licenses', l:null, c:16, e:32, i:32, n26:false, n25:true, cpu:433, note:'~$433/core/yr'},
  {id:'wsrvcal',name:'Windows Server CALs (2025)', cat:'Windows Server', type:'Licenses', l:null, c:16, e:35, i:100, n26:false, n25:true, cpu:38, note:'~$38/CAL/yr'},
  {id:'wsrvrdp',name:'Windows Server RDS CALs (2025)', cat:'Windows Server', type:'Licenses', l:null, c:20, e:35, i:100, n26:false, n25:true, cpu:130, note:'~$130/RDS CAL/yr'},
  {id:'sccms',  name:'System Center Client Management Suite (2022)', cat:'Windows Server', type:'Licenses', l:null, c:10, e:35, i:100, n26:false, n25:false, cpu:125, note:'per device/yr'},
  {id:'sccep',  name:'System Center Endpoint Protection (2019)', cat:'Windows Server', type:'Licenses', l:null, c:10, e:35, i:100, n26:false, n25:false, cpu:22, note:'per device/yr'},
  {id:'sccstd', name:'System Center Standard (2022)', cat:'Windows Server', type:'Licenses', l:null, c:8, e:16, i:32, n26:false, n25:false, cpu:1069, note:'per 2-processor/yr'},
  {id:'epcm',   name:'Endpoint Configuration Manager (2019)', cat:'Windows Server', type:'Licenses', l:null, c:null, e:35, i:100, n26:false, n25:false, cpu:125, note:'per device/yr'},
  {id:'sqlent', name:'SQL Server Enterprise – Per core (2019)', cat:'Windows Server', type:'Licenses', l:null, c:null, e:8, i:16, n26:false, n25:false, cpu:3750, note:'~$3,750/core/yr'},
  {id:'wsrvstorage',name:'Windows Storage Server Workgroup (2016)', cat:'Windows Server', type:'Licenses', l:null, c:null, e:null, i:2, n26:false, n25:false, cpu:285, note:'~$285/yr'},
  {id:'m365e3', name:'Microsoft 365 E3 (no Teams)', cat:'Microsoft 365', type:'Users', l:null, c:null, e:null, i:100, n26:false, n25:false, cpu:432, note:'$36/mo × 12; Infra SPD only'},
  {id:'win11iot',name:'Windows 11 IoT Enterprise LTSC', cat:'Windows', type:'Licenses', l:null, c:null, e:null, i:20, n26:false, n25:false, cpu:75, note:'IoT LTSC'},
  // ── DYNAMICS SANDBOXES ──────────────────────────────────────
  {id:'sb-bc',  name:'Sandbox – Business Central', cat:'Sandbox', type:'Users', l:5, c:5, e:5, i:null, n26:false, n25:false, cpu:0, note:'Internal sandbox'},
  {id:'sb-ops', name:'Sandbox – Operations Application', cat:'Sandbox', type:'Users', l:null, c:25, e:25, i:25, n26:false, n25:false, cpu:0, note:'Internal sandbox'},
  {id:'sb-t2',  name:'Sandbox – Operations Tier 2 Add on', cat:'Sandbox', type:'Tenant', l:null, c:1, e:1, i:null, n26:false, n25:false, cpu:0, note:'Internal sandbox'},
  {id:'sb-sfs', name:'Sandbox – Sales, Field Service &amp; CS', cat:'Sandbox', type:'Users', l:null, c:25, e:25, i:25, n26:false, n25:false, cpu:0, note:'Internal sandbox'},
  {id:'sb-cc',  name:'Sandbox – Contact Center', cat:'Sandbox', type:'Users', l:null, c:null, e:25, i:null, n26:false, n25:false, cpu:0, note:'Internal sandbox'},
  {id:'sb-msg', name:'Sandbox – CS Digital Messaging', cat:'Sandbox', type:'Tenant', l:null, c:null, e:1, i:null, n26:false, n25:false, cpu:0, note:'Internal sandbox'},
  {id:'sb-eco', name:'Sandbox – eCommerce &amp; Cloud Scale Unit', cat:'Sandbox', type:'Tenant', l:null, c:null, e:1, i:null, n26:false, n25:false, cpu:0, note:'Internal sandbox'},
  {id:'sb-hr',  name:'Sandbox – Human Resources', cat:'Sandbox', type:'Users', l:null, c:null, e:5, i:null, n26:false, n25:false, cpu:0, note:'Internal sandbox'},
  {id:'sb-iom', name:'Sandbox – Intelligent Order Management', cat:'Sandbox', type:'Tenant', l:null, c:null, e:1, i:null, n26:false, n25:false, cpu:0, note:'Internal sandbox'},
  {id:'sb-mkt', name:'Sandbox – Marketing', cat:'Sandbox', type:'Tenant', l:null, c:null, e:1, i:null, n26:false, n25:false, cpu:0, note:'Internal sandbox'},
  {id:'sb-si',  name:'Sandbox – Sales Insights', cat:'Sandbox', type:'Users', l:null, c:null, e:5, i:null, n26:false, n25:false, cpu:0, note:'Internal sandbox'},
  {id:'sb-guides',name:'Sandbox – Guides', cat:'Sandbox', type:'User', l:null, c:null, e:1, i:null, n26:false, n25:false, cpu:0, note:'Internal sandbox'},
];

// Tenant data from CSV (ProductList_24_03_2026)
// This is the default/baseline tenant snapshot. Runtime overrides live in USAGE_DATA (state.js).
export const TENANT_DEFAULT = [
  {name:'Microsoft 365 Business Premium',total:162,assigned:161,ct:'upgrade',pp:'M365 Business Premium (no Teams) + Teams Enterprise',note:'Pack edition excludes Teams — Teams Enterprise is a separate benefit',l:5,c:15,e:35,i:null,n26:false,n25:false,cpu_key:'m365bp'},
  {name:'Microsoft Teams EEA',total:105,assigned:75,ct:'covered',pp:'Teams Enterprise',note:null,l:5,c:15,e:35,i:100,n26:false,n25:false,cpu_key:'teams'},
  {name:'Microsoft 365 Copilot',total:3,assigned:3,ct:'covered',pp:'Microsoft 365 Copilot',note:null,l:null,c:null,e:10,i:null,n26:true,n25:false,cpu_key:'m365cop'},
  {name:'Teams Premium (for Departments)',total:2,assigned:2,ct:'covered',pp:'Teams Premium',note:null,l:null,c:null,e:10,i:null,n26:true,n25:false,cpu_key:'teamsprem'},
  {name:'Microsoft Teams Rooms Pro',total:1,assigned:1,ct:'covered',pp:'Teams Rooms Pro',note:null,l:null,c:null,e:2,i:null,n26:false,n25:true,cpu_key:'roomspro'},
  {name:'Power Automate Premium',total:1,assigned:1,ct:'covered',pp:'Power Automate Premium',note:null,l:1,c:8,e:15,i:25,n26:false,n25:false,cpu_key:'paauto'},
  {name:'Planner and Project Plan 5',total:5,assigned:5,ct:'covered',pp:'Project Online – Project Plan 5',note:null,l:1,c:5,e:5,i:20,n26:false,n25:false,cpu_key:'proj'},
  {name:'Visio Plan 2',total:5,assigned:5,ct:'covered',pp:'Visio Online – Visio Plan 2',note:null,l:1,c:5,e:5,i:5,n26:false,n25:false,cpu_key:'visio'},
  {name:'Dynamics 365 Sales Professional',total:46,assigned:45,ct:'upgrade',pp:'Dynamics 365 Sales Enterprise',note:'Pack includes Enterprise — consider switching to save costs',l:4,c:15,e:35,i:null,n26:false,n25:false,cpu_key:'d365se'},
  {name:'Power BI Pro',total:100,assigned:87,ct:'upgrade',pp:'Power BI Premium (per user)',note:'Pack includes Premium — higher capacity than Pro',l:4,c:15,e:35,i:100,n26:false,n25:false,cpu_key:'pbiprem'},
  {name:'Power Automate per user plan',total:1,assigned:1,ct:'upgrade',pp:'Power Automate Premium',note:'Pack includes Premium — replaces per user plan',l:1,c:8,e:15,i:25,n26:false,n25:false,cpu_key:'paauto'},
  {name:'Microsoft 365 Business Basic',total:25,assigned:25,ct:'uncovered',pp:null,note:null,l:null,c:null,e:null,i:null,n26:false,n25:false,cpu:72},
  {name:'Microsoft 365 Business Basic EEA (no Teams)',total:45,assigned:35,ct:'uncovered',pp:null,note:null,l:null,c:null,e:null,i:null,n26:false,n25:false,cpu:72},
  {name:'Microsoft 365 E3 EEA (no Teams)',total:61,assigned:61,ct:'uncovered',pp:null,note:'E3 only in Solutions Partner designations — Infra SPD covers 100 users',l:null,c:null,e:null,i:100,n26:false,n25:false,cpu_key:'m365e3'},
  {name:'Microsoft 365 E5',total:1,assigned:1,ct:'uncovered',pp:null,note:'E5 only in Modern Work / Security designations',l:null,c:null,e:null,i:null,n26:false,n25:false,cpu:684},
  {name:'Exchange Online (Plan 1)',total:1,assigned:1,ct:'uncovered',pp:null,note:'Standalone Exchange not in pack — bundled inside M365 Business Premium',l:null,c:null,e:null,i:null,n26:false,n25:false,cpu:48},
  {name:'FLOW_FREE (Power Automate Free)',total:10000,assigned:182,ct:'free',pp:null,note:'Free tier — unlimited',l:null,c:null,e:null,i:null,n26:false,n25:false,cpu:0},
  {name:'Microsoft Fabric (Free)',total:1000000,assigned:52,ct:'free',pp:null,note:'Free tier',l:null,c:null,e:null,i:null,n26:false,n25:false,cpu:0},
  {name:'POWERAPPS_DEV (Developer Plan)',total:10000,assigned:16,ct:'free',pp:null,note:'Developer plan — free',l:null,c:null,e:null,i:null,n26:false,n25:false,cpu:0},
  {name:'POWERAPPS_VIRAL',total:10000,assigned:3,ct:'free',pp:null,note:'Viral trial',l:null,c:null,e:null,i:null,n26:false,n25:false,cpu:0},
  {name:'Microsoft Copilot Studio Viral Trial',total:10000,assigned:3,ct:'free',pp:'Pack Expanded: 25k credits/mo',note:'Expanded includes 25k Copilot Studio credits/month',l:null,c:null,e:1,i:null,n26:true,n25:false,cpu:0},
  {name:'Power Pages vTrial for Makers',total:10000,assigned:4,ct:'free',pp:null,note:'Viral trial',l:null,c:null,e:null,i:null,n26:false,n25:false,cpu:0},
  {name:'Avaliação — D365 Sales Premium',total:10000,assigned:1,ct:'free',pp:null,note:'Viral trial',l:null,c:null,e:null,i:null,n26:false,n25:false,cpu:0},
  {name:'D365 Customer Voice Trial',total:1000000,assigned:0,ct:'free',pp:null,note:'Trial — 0 assigned',l:null,c:null,e:null,i:null,n26:false,n25:false,cpu:0},
  {name:'Microsoft Stream Trial',total:1000000,assigned:0,ct:'free',pp:null,note:'Trial — 0 assigned',l:null,c:null,e:null,i:null,n26:false,n25:false,cpu:0},
  {name:'Project Madeira Preview (BC Preview)',total:10000,assigned:0,ct:'free',pp:null,note:'BC preview — 0 assigned',l:null,c:null,e:null,i:null,n26:false,n25:false,cpu:0},
];

// I18N: UI string keys → English text. Add other locales as needed.
export const I18N = {
  en: {
    'tab.usage':       '📊 Usage vs Pack',
    'tab.all':         '📋 All Pack Licenses',
    'tab.cloud':       '☁️ Cloud Rights & Credits',
    'tab.fin1':        '💰 Usage Economics',
    'tab.fin2':        '📈 Full Pack Value',
    'tab.prices':      '✏️ Edit Prices',
    'legend.covered':  'Covered',
    'legend.upgrade':  'Pack upgrade avail.',
    'legend.uncovered':'Needs purchase',
    'legend.free':     'Free / Trial',
    'stat.skus':       'Tenant SKUs',
    'stat.assigned':   'Total Assigned',
    'stat.covered':    'Covered',
    'stat.upgrades':   'Upgrades',
    'stat.needed':     'Needs Purchase',
    'stat.over':       'Over Pack Limit',
    'filter.all':      'All',
    'filter.covered':  'Covered',
    'filter.upgrades': 'Upgrades',
    'filter.uncovered':'Not Covered',
    'filter.free':     'Free/Trial',
    'sort.coverage':   'By Coverage',
    'sort.name':       'By Name',
    'sort.assigned':   'Most Assigned',
    'sort.needed':     'Most Needed',
    'prices.save':     '💾 Save Prices to Browser',
    'prices.reset':    '↺ Reset to Defaults',
    'prices.saved':    '✓ Prices saved and applied to all analyses',
  }
};
