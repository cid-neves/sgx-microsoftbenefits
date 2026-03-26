// ════════════════════════════════════════════════════════════════════
// src/state.js — All mutable runtime state
// ════════════════════════════════════════════════════════════════════
import { DEFAULT_PACK_COSTS } from './data.js';

// Per-row assigned overrides and replacement sources.
// Keys are row identifiers (TENANT_DEFAULT index or custom row name).
// { [rowId]: { assigned: number|null, sources: [{packId, qty}] } }
export let USAGE_DATA = {};

// Custom license rows added by the user via "Add License" modal.
// Each entry mirrors the TENANT_DEFAULT row shape plus an `id` field.
export let TENANT_CUSTOM = [];

// Replacement rules created via the Replacement modal.
// [{ fromId: string, toPackId: string, qty: number }]
export let REPLACEMENTS = [];

// Pack annual fees — editable via Prices tab, persisted to localStorage.
export let PACK_COSTS = { ...DEFAULT_PACK_COSTS };

// Per-license price overrides — editable via Prices tab.
// Keyed by PACK_LICENSES[i].id → annual USD price per unit.
export let PRICES = {};

// Pack toggle + multiplier config — driven by DOM inputs.
// Populated live by ps() in main.js; used as a cache for inter-module reads.
export let PACK_CONFIG = {
  l: { on: true,  m: 2 },
  c: { on: true,  m: 2 },
  e: { on: true,  m: 2 },
  i: { on: true,  m: 1 },
};

// UI state for the Add License modal.
export let addLicMode = 'tenant'; // 'tenant' | 'pack'

// Debounce timers for inline usage editing (rowId → timer id).
export let editTimers = {};

// Server-save debounce timer id.
export let saveDebounce = null;

// Client data version counter — incremented on every local mutation.
export let clientVersion = 0;

// Last time user interacted with data (ms since epoch).
export let lastSaveActivity = 0;

// Active UI language code.
export let LANG = 'en';

// ── Mutation helpers ─────────────────────────────────────────────
// These let other modules update exported primitives while keeping
// the single-source-of-truth in this module.

export function setPACK_COSTS(val) { PACK_COSTS = val; }
export function setPRICES(val)      { PRICES = val; }
export function setUSAGE_DATA(val)  { USAGE_DATA = val; }
export function setTENANT_CUSTOM(val) { TENANT_CUSTOM = val; }
export function setREPLACEMENTS(val) { REPLACEMENTS = val; }
export function setPACK_CONFIG(val) { PACK_CONFIG = val; }
export function setAddLicMode(val)  { addLicMode = val; }
export function setSaveDebounce(val){ saveDebounce = val; }
export function setClientVersion(v) { clientVersion = v; }
export function setLastSaveActivity(v) { lastSaveActivity = v; }
export function setLANG(v)          { LANG = v; }
export function bumpClientVersion() { clientVersion++; }
