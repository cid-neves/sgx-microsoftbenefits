// ════════════════════════════════════════════════════════════════════
// src/state.js — All mutable runtime state + mutation helpers
// ════════════════════════════════════════════════════════════════════
import { DEFAULT_PACK_COSTS, PACK_LICENSES } from './data.js';

// ── Client context ────────────────────────────────────────────────────
export let currentClient   = null;  // { id, name, ... } PocketBase record
export let clientStateId   = null;  // PocketBase record id for client_state
export let clientLicenses  = [];    // array of PocketBase client_license records

// ── Pack / usage state ────────────────────────────────────────────────
export let USAGE_DATA      = {};
export let TENANT_CUSTOM   = [];
export let REPLACEMENTS    = [];
export let PACK_COSTS      = { ...DEFAULT_PACK_COSTS };
export let PRICES          = {};
export let PACK_CONFIG     = {
  l:   { enabled: true,  multiplier: 2 },
  c:   { enabled: true,  multiplier: 2 },
  e:   { enabled: true,  multiplier: 2 },
  i:   { enabled: true,  multiplier: 1 },
  mw:  { enabled: false, multiplier: 1 },
  sec: { enabled: false, multiplier: 1 },
  avd: { enabled: false, multiplier: 1 },
};
export let addLicMode        = 'pack';
export let editTimers        = {};
export let saveDebounce      = null;
export let clientVersion     = 0;
export let lastSaveActivity  = 0;
export let serverLastUpdated = null;
export let LANG              = 'es';

// ── Setters ───────────────────────────────────────────────────────────
export function setCurrentClient(v)     { currentClient = v; }
export function setClientStateId(v)     { clientStateId = v; }
export function setClientLicenses(v)    { clientLicenses = v; }
export function setUSAGE_DATA(v)        { USAGE_DATA = v; }
export function setTENANT_CUSTOM(v)     { TENANT_CUSTOM = v; }
export function setREPLACEMENTS(v)      { REPLACEMENTS = v; }
export function setPACK_COSTS(v)        { PACK_COSTS = v; }
export function setPRICES(v)            { PRICES = v; }
export function setPACK_CONFIG(v)       { PACK_CONFIG = v; }
export function setAddLicMode(v)        { addLicMode = v; }
export function setClientVersion(v)     { clientVersion = v; }
export function setLastSaveActivity(v)  { lastSaveActivity = v; }
export function setSaveDebounce(v)      { saveDebounce = v; }
export function setServerLastUpdated(v) { serverLastUpdated = v; }
export function setLANG(v)              { LANG = v; }

// ── Derived: build TENANT_CUSTOM from clientLicenses (PocketBase records)
// Call this after loading/updating clientLicenses to refresh the usage rows.
export function rebuildTenantCustom() {
  TENANT_CUSTOM = clientLicenses.map(lic => {
    const nm = (lic.name || '').toLowerCase();
    const skuId = (lic.sku || '').toLowerCase();
    const packMatch = PACK_LICENSES.find(p =>
      p.name.toLowerCase() === nm || p.id === skuId
    );
    return {
      id:   'cl-' + lic.id,
      _pbId: lic.id,
      name: lic.name,
      assigned: lic.assigned || 0,
      ct:   lic.category || 'uncovered',
      note: lic.note || null,
      cpu:  Math.round((lic.price_usd || 0) * 12),
      is_free: !!lic.is_free,
      isConsumption: lic.category === 'covered' && lic.sku === 'AZURE_CREDITS',
      ...(packMatch ? { cpu_key: packMatch.id } : {}),
    };
  });
}
