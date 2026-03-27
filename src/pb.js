// ════════════════════════════════════════════════════════════════════
// src/pb.js — PocketBase REST client
// Base URL: /pb  (nginx proxies /pb/ → pocketbase:8090/)
// ════════════════════════════════════════════════════════════════════

const BASE = '/pb/api';

async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const r = await fetch(`${BASE}${path}`, opts);
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${r.status}`);
  }
  return r.status === 204 ? null : r.json();
}

// ── Clients ──────────────────────────────────────────────────────────

export async function listClients() {
  const data = await req('GET', '/collections/clients/records?sort=name&perPage=200');
  return data.items || [];
}

export async function createClient(name) {
  return req('POST', '/collections/clients/records', { name });
}

export async function deleteClient(id) {
  return req('DELETE', `/collections/clients/records/${id}`);
}

// ── Client Licenses ──────────────────────────────────────────────────

export async function loadLicenses(clientId) {
  const data = await req('GET',
    `/collections/client_licenses/records?filter=(client="${clientId}")&perPage=500&sort=name`
  );
  return data.items || [];
}

export async function createLicense(clientId, lic) {
  return req('POST', '/collections/client_licenses/records', { client: clientId, ...lic });
}

export async function updateLicense(id, fields) {
  return req('PATCH', `/collections/client_licenses/records/${id}`, fields);
}

export async function deleteLicense(id) {
  return req('DELETE', `/collections/client_licenses/records/${id}`);
}

export async function bulkCreateLicenses(clientId, lics) {
  // PocketBase has no batch endpoint — fire sequentially to avoid races
  const results = [];
  for (const lic of lics) {
    results.push(await createLicense(clientId, lic));
  }
  return results;
}

// ── Client State ─────────────────────────────────────────────────────

export async function loadState(clientId) {
  try {
    const data = await req('GET',
      `/collections/client_state/records?filter=(client="${clientId}")&perPage=1`
    );
    return (data.items || [])[0] || null;
  } catch (_) {
    return null;
  }
}

export async function saveState(clientId, stateId, payload) {
  if (stateId) {
    return req('PATCH', `/collections/client_state/records/${stateId}`, payload);
  }
  return req('POST', '/collections/client_state/records', { client: clientId, ...payload });
}

// ── Health check ─────────────────────────────────────────────────────

export async function isOnline() {
  try {
    const r = await fetch('/pb/api/health', { signal: AbortSignal.timeout(3000) });
    return r.ok;
  } catch (_) {
    return false;
  }
}
