/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // ── clients ──────────────────────────────────────────────────────────
  const clients = new Collection({
    type: "base",
    name: "clients",
    // Empty string = public access (no auth required)
    listRule:   "",
    viewRule:   "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      { type: "text",   name: "name",     required: true },
      { type: "text",   name: "tenant_id"                },
      { type: "text",   name: "currency"                 }
    ],
    indexes: ["CREATE UNIQUE INDEX idx_clients_name ON clients (name)"]
  });
  app.save(clients);

  // ── client_licenses ──────────────────────────────────────────────────
  const licenses = new Collection({
    type: "base",
    name: "client_licenses",
    listRule:   "",
    viewRule:   "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      {
        type: "relation", name: "client", required: true,
        collectionId: clients.id, maxSelect: 1, cascadeDelete: true
      },
      { type: "text",   name: "sku"         },
      { type: "text",   name: "name",       required: true },
      { type: "number", name: "total",      min: 0 },
      { type: "number", name: "expired",    min: 0 },
      { type: "number", name: "assigned",   min: 0 },
      { type: "number", name: "price_usd"              },
      { type: "text",   name: "category"   },
      { type: "text",   name: "note"        },
      { type: "bool",   name: "is_free"     }
    ]
  });
  app.save(licenses);

  // ── client_state ─────────────────────────────────────────────────────
  const state = new Collection({
    type: "base",
    name: "client_state",
    listRule:   "",
    viewRule:   "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      {
        type: "relation", name: "client", required: true,
        collectionId: clients.id, maxSelect: 1, cascadeDelete: true
      },
      { type: "json", name: "usage_json"        },
      { type: "json", name: "replacements_json" },
      { type: "json", name: "pack_config_json"  },
      { type: "json", name: "pack_costs_json"   },
      { type: "json", name: "prices_json"       }
    ],
    indexes: ["CREATE UNIQUE INDEX idx_client_state_client ON client_state (client)"]
  });
  app.save(state);

}, (app) => {
  for (const name of ["client_state", "client_licenses", "clients"]) {
    try { app.delete(app.findCollectionByNameOrId(name)); } catch (_) {}
  }
});
