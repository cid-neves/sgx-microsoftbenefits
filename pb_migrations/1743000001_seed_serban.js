/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // Skip if Serban Group already exists
  try {
    app.findFirstRecordByFilter("clients", 'name = "Serban Group"');
    return; // already seeded
  } catch (_) {}

  // ── Create client ────────────────────────────────────────────────────
  const clientsCol = app.findCollectionByNameOrId("clients");
  const client = new Record(clientsCol);
  client.set("name", "Serban Group");
  client.set("currency", "USD");
  app.save(client);

  // ── Seed licenses (from tenant CSV + TENANT_DEFAULT data) ────────────
  const licCol = app.findCollectionByNameOrId("client_licenses");

  const licenses = [
    { sku: "SPB", name: "Microsoft 365 Business Premium", total: 162, expired: 0, assigned: 161, price_usd: 22.00, category: "upgrade", note: "Pack excludes Teams — Teams Enterprise is separate" },
    { sku: "TEAMS_EEA", name: "Microsoft Teams EEA", total: 105, expired: 0, assigned: 75, price_usd: 5.25, category: "covered", note: null },
    { sku: "MCOPSTNC", name: "Microsoft 365 Copilot", total: 3, expired: 0, assigned: 3, price_usd: 30.00, category: "covered", note: null },
    { sku: "TEAMSPREM", name: "Teams Premium", total: 2, expired: 0, assigned: 2, price_usd: 7.00, category: "covered", note: null },
    { sku: "MCOMEETROOM", name: "Microsoft Teams Rooms Pro", total: 1, expired: 0, assigned: 1, price_usd: 40.00, category: "covered", note: null },
    { sku: "FLOW_PER_USER", name: "Power Automate Premium", total: 1, expired: 0, assigned: 1, price_usd: 15.00, category: "covered", note: null },
    { sku: "PROJECT_P5", name: "Planner and Project Plan 5", total: 5, expired: 0, assigned: 5, price_usd: 55.00, category: "covered", note: null },
    { sku: "VISIOCLIENT", name: "Visio Plan 2", total: 5, expired: 0, assigned: 5, price_usd: 15.00, category: "covered", note: null },
    { sku: "DYN365_SALES_PROFESSIONAL", name: "Dynamics 365 Sales Professional", total: 46, expired: 0, assigned: 45, price_usd: 65.00, category: "upgrade", note: "Pack has Enterprise edition — consider switching" },
    { sku: "POWER_BI_PRO", name: "Power BI Pro", total: 87, expired: 0, assigned: 87, price_usd: 10.00, category: "upgrade", note: "Pack has Premium — higher capacity than Pro" },
    { sku: "FLOW_PER_USER_2", name: "Power Automate per user plan", total: 1, expired: 0, assigned: 1, price_usd: 15.00, category: "upgrade", note: "Pack includes Premium — replaces per user plan" },
    { sku: "O365_BUSINESS_ESSENTIALS", name: "Microsoft 365 Business Basic", total: 25, expired: 0, assigned: 25, price_usd: 6.00, category: "uncovered", note: null },
    { sku: "O365_BUSINESS_ESSENTIALS_EEA", name: "Microsoft 365 Business Basic EEA", total: 35, expired: 0, assigned: 35, price_usd: 6.00, category: "uncovered", note: null },
    { sku: "SPE_E3_NOPSTNCONF_EEA", name: "Microsoft 365 E3 EEA (no Teams)", total: 61, expired: 0, assigned: 61, price_usd: 36.00, category: "uncovered", note: "E3 only in Solutions Partner — Infra SPD covers 100 users" },
    { sku: "SPE_E5", name: "Microsoft 365 E5", total: 1, expired: 0, assigned: 1, price_usd: 57.00, category: "uncovered", note: "E5 only in Modern Work / Security designations" },
    { sku: "EXCHANGESTANDARD", name: "Exchange Online (Plan 1)", total: 1, expired: 0, assigned: 1, price_usd: 4.00, category: "uncovered", note: "Standalone EXO not in pack — included in M365 Business Premium" },
    { sku: "AZURE_CREDITS", name: "Azure (Production)", total: 0, expired: 0, assigned: 0, price_usd: 0, category: "covered", note: "Consumption-based — enter expected monthly usage", is_free: false },
    { sku: "FLOW_FREE", name: "FLOW_FREE (Power Automate Free)", total: 182, expired: 0, assigned: 182, price_usd: 0, category: "free", note: "Free tier — unlimited", is_free: true },
    { sku: "MICROSOFT_FABRIC_FREE", name: "Microsoft Fabric (Free)", total: 52, expired: 0, assigned: 52, price_usd: 0, category: "free", note: "Free tier", is_free: true },
    { sku: "POWERAPPS_DEV", name: "POWERAPPS_DEV", total: 16, expired: 0, assigned: 16, price_usd: 0, category: "free", note: "Developer plan — free", is_free: true },
    { sku: "POWERAPPS_VIRAL", name: "POWERAPPS_VIRAL", total: 3, expired: 0, assigned: 3, price_usd: 0, category: "free", note: "Viral trial", is_free: true },
    { sku: "COPILOTSTUDIO_VIRAL", name: "Copilot Studio Viral Trial", total: 3, expired: 0, assigned: 3, price_usd: 0, category: "free", note: "Expanded includes 25k credits/month", is_free: true },
    { sku: "POWER_PAGES_VIRAL", name: "Power Pages vTrial", total: 4, expired: 0, assigned: 4, price_usd: 0, category: "free", note: "Viral trial", is_free: true }
  ];

  for (const lic of licenses) {
    const rec = new Record(licCol);
    rec.set("client",    client.id);
    rec.set("sku",       lic.sku);
    rec.set("name",      lic.name);
    rec.set("total",     lic.total);
    rec.set("expired",   lic.expired);
    rec.set("assigned",  lic.assigned);
    rec.set("price_usd", lic.price_usd);
    rec.set("category",  lic.category);
    rec.set("note",      lic.note || "");
    rec.set("is_free",   !!lic.is_free);
    app.save(rec);
  }

  // ── Seed default pack config for Serban Group ─────────────────────────
  const stateCol = app.findCollectionByNameOrId("client_state");
  const stateRec = new Record(stateCol);
  stateRec.set("client", client.id);
  stateRec.set("pack_config_json", {
    l:   { enabled: true,  multiplier: 2 },
    c:   { enabled: true,  multiplier: 2 },
    e:   { enabled: true,  multiplier: 2 },
    i:   { enabled: true,  multiplier: 1 },
    mw:  { enabled: false, multiplier: 1 },
    sec: { enabled: false, multiplier: 1 },
    avd: { enabled: false, multiplier: 1 }
  });
  stateRec.set("pack_costs_json", { l: 350, c: 925, e: 4125, i: 4730, mw: 4730, sec: 4730, avd: 0 });
  stateRec.set("usage_json",        {});
  stateRec.set("replacements_json", []);
  stateRec.set("prices_json",       {});
  app.save(stateRec);

}, (app) => {
  try {
    const client = app.findFirstRecordByFilter("clients", 'name = "Serban Group"');
    app.delete(client);
  } catch (_) {}
});
