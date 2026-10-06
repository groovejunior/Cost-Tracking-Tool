"use strict";

/**
 * SpendData.fetchAll pagination (B5) against a fake PostgREST builder that
 * caps responses at 1000 rows and, like Postgres, returns rows that tie on
 * the sort key in arbitrary order on each request.
 *
 *   node test/data-fetch-all.js
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const MAX_ROWS = 1000;

function fakeClient(rows) {
  let requests = 0;
  return {
    get requests() {
      return requests;
    },
    from() {
      const q = { orders: [], filters: [], range: null };
      const b = {
        select() { return b; },
        eq(col, val) { q.filters.push([col, val]); return b; },
        order(col, opts) { q.orders.push([col, !opts || opts.ascending !== false]); return b; },
        range(from, to) { q.range = [from, to]; return b; },
        then(resolve, reject) {
          requests++;
          let out = rows.filter((r) => q.filters.every(([c, v]) => r[c] === v));
          out = out
            .map((r) => [Math.random(), r])
            .sort((a, b) => a[0] - b[0])
            .map((x) => x[1]);
          out.sort((a, b) => {
            for (const [col, asc] of q.orders) {
              if (a[col] < b[col]) return asc ? -1 : 1;
              if (a[col] > b[col]) return asc ? 1 : -1;
            }
            return 0;
          });
          const [from, to] = q.range || [0, Infinity];
          out = out.slice(from, Math.min(to + 1, from + MAX_ROWS));
          return Promise.resolve({ data: out, error: null }).then(resolve, reject);
        },
      };
      return b;
    },
  };
}

function loadSpendData(client) {
  const ctx = { window: {}, console };
  ctx.window.spendSupabase = client;
  ctx.window.SpendAuth = { isEnabled: () => true };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "supabase", "data.js"), "utf8"), ctx);
  return ctx.window.SpendData;
}

(async () => {
  const user = "11111111-2222-4333-8444-555555555555";
  const rows = [];
  for (let i = 0; i < 2500; i++) {
    const day = String(1 + (i % 7)).padStart(2, "0");
    rows.push({
      id: "00000000-0000-4000-8000-" + String(i).padStart(12, "0"),
      user_id: user,
      category_id: "food",
      amount: 5,
      note: "",
      expense_date: "2026-09-" + day + "T02:00:00.000Z",
      fx_rate: null,
    });
  }
  rows.push(Object.assign({}, rows[0], { id: "99999999-0000-4000-8000-000000000000", user_id: "other" }));

  for (let run = 0; run < 5; run++) {
    const client = fakeClient(rows);
    const data = loadSpendData(client);
    const got = await data.fetchAll(user);
    assert.strictEqual(got.length, 2500, "row count");
    assert.strictEqual(new Set(got.map((e) => e.id)).size, 2500, "rows skipped or repeated across pages");
    assert.strictEqual(client.requests, 3);
  }
  console.log("\n  ok  fetchAll returns all 2500 rows once each across 1000-row pages with tied dates\n");
})().catch((e) => {
  console.error("  FAIL", e.message);
  process.exit(1);
});
