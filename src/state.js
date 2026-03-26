// ════════════════════════════════════════════════════════════════════
// src/state.js — All mutable runtime state + mutation helpers
// ════════════════════════════════════════════════════════════════════
import { DEFAULT_PACK_COSTS } from './data.js';

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
