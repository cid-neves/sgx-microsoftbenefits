// ════════════════════════════════════════════════════════════════════
// src/render/licenses.js — Licenses tab: view, add, edit, CSV import
// ════════════════════════════════════════════════════════════════════
import { t } from '../i18n.js';
import { SKU_LOOKUP, PACK_LICENSES } from '../data.js';
import { clientLicenses, setClientLicenses, rebuildTenantCustom, currentClient } from '../state.js';
import {
  loadLicenses, createLicense, updateLicense, deleteLicense, bulkCreateLicenses
} from '../pb.js';
import { scheduleSave, showToast } from '../sync.js';

// ── Render ────────────────────────────────────────────────────────────

export function renderLicenses() {
  const panel = document.getElementById('licenses-panel');
  if (!panel) return;

  if (!currentClient) {
    panel.innerHTML = '<p style="padding:20px;color:var(--text-muted)">No client selected.</p>';
    return;
  }

  const lics = clientLicenses;
  const cats = ['covered', 'upgrade', 'uncovered', 'free'];
  const catLabel = { covered: 'Covered', upgrade: 'Upgrade Available', uncovered: 'Not Covered', free: 'Free / Trial' };
  const catCls   = { covered: 'cov', upgrade: 'upg', uncovered: 'unc', free: 'free' };

  let html = `
    <div class="lic-toolbar">
      <h3 class="lic-title">${t('lic_title') || 'Tenant Licenses'}</h3>
      <div class="lic-toolbar-actions">
        <button class="btn-lic-add" onclick="openAddLicenseModal()">${t('lic_add') || 'Add License'}</button>
        <button class="btn-lic-csv" onclick="openCsvImport()">${t('lic_import_csv') || 'Import CSV'}</button>
      </div>
    </div>

    <!-- CSV import panel -->
    <div id="csv-import-panel" class="csv-import-panel" style="display:none">
      <p class="csv-hint">${t('lic_csv_hint') || 'Paste CSV with columns: Product Name, Total, Expired, Assigned'}</p>
      <textarea id="csv-textarea" class="csv-textarea" rows="8" placeholder="Paste CSV here…"></textarea>
      <div class="csv-actions">
        <button class="btn-csv-import" onclick="doCsvImport()">${t('lic_csv_import_btn') || 'Import'}</button>
        <button class="btn-csv-cancel" onclick="closeCsvImport()">${t('lic_csv_cancel') || 'Cancel'}</button>
      </div>
    </div>

    <!-- Add/Edit license modal -->
    <div id="add-license-modal" class="add-license-modal" style="display:none">
      <div class="add-license-modal-inner">
        <h4 class="add-license-modal-title" id="add-license-modal-title">Add License</h4>
        <input type="hidden" id="edit-lic-id">
        <div class="lic-form-row">
          <div class="lic-form-field">
            <label>Product Name</label>
            <input type="text" id="new-lic-name" list="sku-suggestions" placeholder="e.g. Microsoft 365 Business Premium" oninput="onLicNameInput()">
            <datalist id="sku-suggestions"></datalist>
          </div>
        </div>
        <div class="lic-form-row">
          <div class="lic-form-field">
            <label>SKU Code</label>
            <input type="text" id="new-lic-sku" placeholder="e.g. SPB">
          </div>
          <div class="lic-form-field">
            <label>Category</label>
            <select id="new-lic-cat">
              <option value="covered">Covered</option>
              <option value="upgrade">Upgrade Available</option>
              <option value="uncovered" selected>Not Covered</option>
              <option value="free">Free / Trial</option>
            </select>
          </div>
        </div>
        <div class="lic-form-row">
          <div class="lic-form-field">
            <label>Total Licenses</label>
            <input type="number" id="new-lic-total" min="0" value="0">
          </div>
          <div class="lic-form-field">
            <label>Expired</label>
            <input type="number" id="new-lic-expired" min="0" value="0">
          </div>
          <div class="lic-form-field">
            <label>Assigned</label>
            <input type="number" id="new-lic-assigned" min="0" value="0">
          </div>
          <div class="lic-form-field">
            <label>Price (USD/mo)</label>
            <input type="number" id="new-lic-price" min="0" step="0.01" value="0">
          </div>
        </div>
        <div class="lic-form-row">
          <div class="lic-form-field" style="flex:1">
            <label>Note</label>
            <input type="text" id="new-lic-note" placeholder="Optional note">
          </div>
        </div>
        <div class="lic-form-actions">
          <button class="btn-cancel" onclick="closeAddLicenseModal()">Cancel</button>
          <button class="btn-save-lic" onclick="saveAddLicenseModal()">Save</button>
        </div>
      </div>
    </div>

    <table class="lic-table">
      <thead>
        <tr>
          <th>${t('lic_col_name') || 'Product'}</th>
          <th>${t('lic_col_sku') || 'SKU'}</th>
          <th>${t('lic_col_total') || 'Total'}</th>
          <th>${t('lic_col_assigned') || 'Assigned'}</th>
          <th>${t('lic_col_price') || 'Price (USD/mo)'}</th>
          <th>Annual Cost</th>
          <th>Category</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
  `;

  if (!lics.length) {
    html += `<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-muted)">
      No licenses yet. Add one or import from CSV.
    </td></tr>`;
  } else {
    // Group by category
    const bycat = {};
    for (const c of cats) bycat[c] = lics.filter(l => (l.category || 'uncovered') === c);

    for (const c of cats) {
      if (!bycat[c].length) continue;
      html += `<tr class="lic-cat-header"><td colspan="8"><span class="cat-pill ${catCls[c]}">${catLabel[c]}</span></td></tr>`;
      for (const lic of bycat[c]) {
        const annual = ((lic.price_usd || 0) * (lic.assigned || 0) * 12).toLocaleString('en-US', { style:'currency', currency:'USD', maximumFractionDigits: 0 });
        html += `<tr class="lic-row">
          <td class="lic-name">${esc(lic.name)}</td>
          <td class="lic-sku" style="font-size:10px;color:var(--text-muted)">${esc(lic.sku || '—')}</td>
          <td class="lic-num">${lic.total ?? '—'}</td>
          <td class="lic-num">${lic.assigned ?? '—'}</td>
          <td class="lic-num">
            <span class="lic-price-val" data-id="${lic.id}"
                  onclick="startEditPrice('${lic.id}', this)"
                  title="Click to edit">$${(lic.price_usd || 0).toFixed(2)}</span>
          </td>
          <td class="lic-num" style="color:var(--text-muted)">${lic.is_free ? '—' : annual}</td>
          <td><span class="cat-pill ${catCls[c]}">${catLabel[c]}</span></td>
          <td class="lic-actions">
            <button class="btn-lic-edit" onclick="openEditLicense('${lic.id}')">✎</button>
            <button class="btn-lic-del" onclick="deleteLicenseRow('${lic.id}')">✕</button>
          </td>
        </tr>`;
      }
    }
  }

  html += '</tbody></table>';

  // Summary row
  const totalAssigned = lics.reduce((s, l) => s + (l.assigned || 0), 0);
  const totalAnnual   = lics.reduce((s, l) => s + (l.price_usd || 0) * (l.assigned || 0) * 12, 0);
  html += `<div class="lic-summary">
    <span>${lics.length} products &nbsp;·&nbsp; ${totalAssigned.toLocaleString()} total assigned &nbsp;·&nbsp;
    Annual spend: <strong>$${totalAnnual.toLocaleString('en-US', {maximumFractionDigits:0})}</strong></span>
  </div>`;

  panel.innerHTML = html;

  // Populate datalist for SKU autocomplete
  const dl = document.getElementById('sku-suggestions');
  if (dl) {
    const seen = new Set();
    const opts = [];
    for (const s of SKU_LOOKUP) { if (!seen.has(s.name)) { seen.add(s.name); opts.push(`<option value="${esc(s.name)}">`); } }
    for (const p of PACK_LICENSES) { if (!seen.has(p.name)) { seen.add(p.name); opts.push(`<option value="${esc(p.name)}">`); } }
    dl.innerHTML = opts.join('');
  }
}

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Add / Edit modal ─────────────────────────────────────────────────

export function openAddLicenseModal() {
  document.getElementById('add-license-modal-title').textContent = 'Add License';
  document.getElementById('edit-lic-id').value = '';
  document.getElementById('new-lic-name').value = '';
  document.getElementById('new-lic-sku').value = '';
  document.getElementById('new-lic-cat').value = 'uncovered';
  document.getElementById('new-lic-total').value = '0';
  document.getElementById('new-lic-expired').value = '0';
  document.getElementById('new-lic-assigned').value = '0';
  document.getElementById('new-lic-price').value = '0';
  document.getElementById('new-lic-note').value = '';
  document.getElementById('add-license-modal').style.display = 'flex';
}

export function openEditLicense(id) {
  const lic = clientLicenses.find(l => l.id === id);
  if (!lic) return;
  document.getElementById('add-license-modal-title').textContent = 'Edit License';
  document.getElementById('edit-lic-id').value = lic.id;
  document.getElementById('new-lic-name').value = lic.name || '';
  document.getElementById('new-lic-sku').value = lic.sku || '';
  document.getElementById('new-lic-cat').value = lic.category || 'uncovered';
  document.getElementById('new-lic-total').value = lic.total ?? 0;
  document.getElementById('new-lic-expired').value = lic.expired ?? 0;
  document.getElementById('new-lic-assigned').value = lic.assigned ?? 0;
  document.getElementById('new-lic-price').value = lic.price_usd ?? 0;
  document.getElementById('new-lic-note').value = lic.note || '';
  document.getElementById('add-license-modal').style.display = 'flex';
}

export function closeAddLicenseModal() {
  document.getElementById('add-license-modal').style.display = 'none';
}

export async function saveAddLicenseModal() {
  const id       = document.getElementById('edit-lic-id').value;
  const name     = document.getElementById('new-lic-name').value.trim();
  if (!name) { showToast('Product name is required', 'err'); return; }

  const payload = {
    name,
    sku:       document.getElementById('new-lic-sku').value.trim() || null,
    category:  document.getElementById('new-lic-cat').value,
    total:     parseInt(document.getElementById('new-lic-total').value) || 0,
    expired:   parseInt(document.getElementById('new-lic-expired').value) || 0,
    assigned:  parseInt(document.getElementById('new-lic-assigned').value) || 0,
    price_usd: parseFloat(document.getElementById('new-lic-price').value) || 0,
    note:      document.getElementById('new-lic-note').value.trim() || null,
    is_free:   document.getElementById('new-lic-cat').value === 'free',
  };

  try {
    if (id) {
      const updated = await updateLicense(id, payload);
      const idx = clientLicenses.findIndex(l => l.id === id);
      if (idx >= 0) { const arr = [...clientLicenses]; arr[idx] = updated; setClientLicenses(arr); }
    } else {
      const created = await createLicense(currentClient.id, payload);
      setClientLicenses([...clientLicenses, created]);
    }
    rebuildTenantCustom();
    closeAddLicenseModal();
    renderLicenses();
    showToast(id ? 'License updated' : 'License added', 'ok');
  } catch (e) {
    showToast('Error: ' + e.message, 'err');
  }
}

// ── Inline price edit ────────────────────────────────────────────────

export function startEditPrice(id, spanEl) {
  const lic = clientLicenses.find(l => l.id === id);
  if (!lic) return;
  const inp = document.createElement('input');
  inp.type = 'number'; inp.min = '0'; inp.step = '0.01';
  inp.value = lic.price_usd || 0;
  inp.className = 'lic-price-input';
  inp.style.width = '70px';
  inp.onblur = () => commitPrice(id, inp);
  inp.onkeydown = e => { if (e.key === 'Enter') inp.blur(); if (e.key === 'Escape') renderLicenses(); };
  spanEl.replaceWith(inp);
  inp.focus(); inp.select();
}

async function commitPrice(id, inp) {
  const val = parseFloat(inp.value) || 0;
  try {
    const updated = await updateLicense(id, { price_usd: val });
    const idx = clientLicenses.findIndex(l => l.id === id);
    if (idx >= 0) { const arr = [...clientLicenses]; arr[idx] = updated; setClientLicenses(arr); }
    rebuildTenantCustom();
    renderLicenses();
  } catch (e) {
    showToast('Error saving price: ' + e.message, 'err');
    renderLicenses();
  }
}

// ── Delete ────────────────────────────────────────────────────────────

export async function deleteLicenseRow(id) {
  if (!confirm(t('lic_delete_confirm') || 'Delete this license?')) return;
  try {
    await deleteLicense(id);
    setClientLicenses(clientLicenses.filter(l => l.id !== id));
    rebuildTenantCustom();
    renderLicenses();
    showToast('License deleted', 'ok');
  } catch (e) {
    showToast('Error: ' + e.message, 'err');
  }
}

// ── SKU name autocomplete ─────────────────────────────────────────────

export function onLicNameInput() {
  const val = document.getElementById('new-lic-name').value.trim();
  const skuMatch = SKU_LOOKUP.find(s => s.name.toLowerCase() === val.toLowerCase());
  if (skuMatch) {
    if (!document.getElementById('new-lic-sku').value)
      document.getElementById('new-lic-sku').value = skuMatch.sku;
    if (!parseFloat(document.getElementById('new-lic-price').value))
      document.getElementById('new-lic-price').value = skuMatch.price_usd;
    return;
  }
  const packMatch = PACK_LICENSES.find(p => p.name.toLowerCase() === val.toLowerCase());
  if (packMatch) {
    if (!document.getElementById('new-lic-sku').value)
      document.getElementById('new-lic-sku').value = packMatch.id.toUpperCase();
    if (!parseFloat(document.getElementById('new-lic-price').value) && packMatch.cpu > 0)
      document.getElementById('new-lic-price').value = (packMatch.cpu / 12).toFixed(2);
  }
}

// ── CSV Import ────────────────────────────────────────────────────────

export function openCsvImport() {
  document.getElementById('csv-import-panel').style.display = 'block';
  document.getElementById('csv-textarea').value = '';
  document.getElementById('csv-textarea').focus();
}

export function closeCsvImport() {
  document.getElementById('csv-import-panel').style.display = 'none';
}

export async function doCsvImport() {
  const raw = document.getElementById('csv-textarea').value.trim();
  if (!raw) return;

  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  // Detect header row: if first row contains non-numeric second column, it's a header
  const firstCols = lines[0].split(',');
  const hasHeader = isNaN(firstCols[1]?.replace(/"/g,'').trim());
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const toCreate = [];
  const nameColIdx   = 0;
  const totalColIdx  = 1;
  const expiredColIdx = 2;
  const assignedColIdx = 3;

  for (const line of dataLines) {
    // Handle quoted fields
    const cols = parseCsvLine(line);
    if (cols.length < 2) continue;

    const rawName    = cols[nameColIdx]?.trim()   || '';
    const rawTotal   = cols[totalColIdx]?.trim()   || '0';
    const rawExpired = cols[expiredColIdx]?.trim() || '0';
    const rawAssigned = cols[assignedColIdx]?.trim() || '0';

    if (!rawName) continue;

    // Map name to SKU lookup
    const match = SKU_LOOKUP.find(s =>
      s.name.toLowerCase() === rawName.toLowerCase() ||
      s.name.toLowerCase().includes(rawName.toLowerCase()) ||
      rawName.toLowerCase().includes(s.name.toLowerCase().split(' ').slice(0,3).join(' '))
    );

    const total    = parseInt(rawTotal)    || 0;
    const expired  = parseInt(rawExpired)  || 0;
    const assigned = parseInt(rawAssigned) || 0;

    // Skip if already exists in clientLicenses
    const exists = clientLicenses.some(l =>
      l.name.toLowerCase() === rawName.toLowerCase() ||
      (match && l.sku === match.sku)
    );
    if (exists) continue;

    toCreate.push({
      name:      match ? match.name : rawName,
      sku:       match ? match.sku  : null,
      total, expired, assigned,
      price_usd: match ? match.price_usd : 0,
      category:  'uncovered',
      is_free:   false,
    });
  }

  if (!toCreate.length) {
    showToast('No new licenses to import (all may already exist)', 'ok');
    closeCsvImport();
    return;
  }

  try {
    const created = await bulkCreateLicenses(currentClient.id, toCreate);
    setClientLicenses([...clientLicenses, ...created]);
    rebuildTenantCustom();
    closeCsvImport();
    renderLicenses();
    showToast(`Imported ${created.length} license(s)`, 'ok');
  } catch (e) {
    showToast('Import error: ' + e.message, 'err');
  }
}

function parseCsvLine(line) {
  const result = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === ',' && !inQ) { result.push(cur); cur = ''; continue; }
    cur += ch;
  }
  result.push(cur);
  return result;
}

// ── Fetch prices from SKU_LOOKUP ──────────────────────────────────────

export async function fetchPrices() {
  let updated = 0;
  const promises = clientLicenses.map(async lic => {
    const match = SKU_LOOKUP.find(s => s.sku === lic.sku);
    if (match && match.price_usd > 0 && lic.price_usd !== match.price_usd) {
      try {
        const upd = await updateLicense(lic.id, { price_usd: match.price_usd });
        const idx = clientLicenses.findIndex(l => l.id === lic.id);
        if (idx >= 0) { const arr = [...clientLicenses]; arr[idx] = upd; setClientLicenses(arr); }
        updated++;
      } catch (_) {}
    }
  });
  await Promise.all(promises);
  rebuildTenantCustom();
  renderLicenses();
  showToast(updated ? `Updated prices for ${updated} license(s)` : 'Prices already up to date', 'ok');
}
