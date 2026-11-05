"use strict";

/**
 * Shared-group balances and the minimum-transfer settlement.
 *
 *   node test/shared-ledger.js
 */

const assert = require("assert");
const SpendLedger = require("../shared-ledger.js");

const mia = { id: "mia", displayName: "Mia" };
const luca = { id: "luca", displayName: "Luca" };
const sam = { id: "sam", displayName: "Sam" };
const members = [mia, luca, sam];

function expense({ title, amount, currency, fxRate, paidBy, shares, kind }) {
  return {
    title,
    amount,
    currency: currency || "AUD",
    fxRate: fxRate == null ? 1.6 : fxRate,
    paidBy,
    kind: kind || "expense",
    shares,
  };
}

assert.deepStrictEqual(SpendLedger.splitCents(100, [1, 1, 1]), [34, 33, 33]);
assert.strictEqual(
  SpendLedger.splitCents(100, [1, 1, 1]).reduce((a, n) => a + n, 0),
  100
);
assert.deepStrictEqual(SpendLedger.splitCents(10000, [1, 1, 2]), [2500, 2500, 5000]);
assert.deepStrictEqual(SpendLedger.splitCents(10, [1, 1, 1]), [4, 3, 3]);

const dinner = expense({
  title: "Dinner",
  amount: 90,
  paidBy: "mia",
  shares: [
    { memberId: "mia", shares: 1 },
    { memberId: "luca", shares: 1 },
    { memberId: "sam", shares: 1 },
  ],
});

let rows = SpendLedger.balances(members, [dinner], "AUD");
const net = Object.fromEntries(rows.map((r) => [r.memberId, r.cents]));
assert.strictEqual(net.mia, 6000, "Mia is owed her 90 minus a 30 share");
assert.strictEqual(net.luca, -3000);
assert.strictEqual(net.sam, -3000);
assert.strictEqual(net.mia + net.luca + net.sam, 0);

let transfers = SpendLedger.settle(rows);
assert.strictEqual(transfers.length, 2);
assert.deepStrictEqual(
  transfers.map((t) => [t.fromName, t.toName, t.cents]).sort(),
  [
    ["Luca", "Mia", 3000],
    ["Sam", "Mia", 3000],
  ].sort()
);

const paidBack = expense({
  title: "Transfer to Mia",
  amount: 30,
  paidBy: "luca",
  kind: "transfer",
  shares: [{ memberId: "mia", shares: 1 }],
});
rows = SpendLedger.balances(members, [dinner, paidBack], "AUD");
const after = Object.fromEntries(rows.map((r) => [r.memberId, r.cents]));
assert.strictEqual(after.luca, 0);
assert.strictEqual(after.mia, 3000);
assert.strictEqual(after.sam, -3000);
transfers = SpendLedger.settle(rows);
assert.strictEqual(transfers.length, 1, "one transfer settles what is left");
assert.strictEqual(transfers[0].fromName, "Sam");
assert.strictEqual(transfers[0].toName, "Mia");
assert.strictEqual(transfers[0].cents, 3000);

const hotel = expense({
  title: "Hotel",
  amount: 90,
  currency: "EUR",
  fxRate: 1.6,
  paidBy: "luca",
  shares: [
    { memberId: "mia", shares: 1 },
    { memberId: "luca", shares: 1 },
    { memberId: "sam", shares: 2 },
  ],
});
const hotelParts = SpendLedger.expenseParts(hotel, "AUD");
assert.strictEqual(hotelParts.totalCents, 14400, "90 EUR at 1.6 is 144 AUD");
assert.deepStrictEqual(
  hotelParts.parts.map((p) => p.cents),
  [3600, 3600, 7200]
);

rows = SpendLedger.balances(members, [hotel], "AUD");
const hotelNet = Object.fromEntries(rows.map((r) => [r.memberId, r.cents]));
assert.strictEqual(hotelNet.luca, 14400 - 3600);
assert.strictEqual(hotelNet.mia, -3600);
assert.strictEqual(hotelNet.sam, -7200);
transfers = SpendLedger.settle(rows);
assert.strictEqual(transfers.length, 2);
assert.strictEqual(
  transfers.reduce((sum, t) => sum + t.cents, 0),
  3600 + 7200
);

const uneven = SpendLedger.balances(
  members,
  [],
  "AUD"
);
assert.deepStrictEqual(SpendLedger.settle(uneven), []);

const oneHop = SpendLedger.settle([
  { memberId: "a", name: "Ada", cents: 4200 },
  { memberId: "b", name: "Ben", cents: -4200 },
  { memberId: "c", name: "Cleo", cents: 0 },
]);
assert.strictEqual(oneHop.length, 1);
assert.strictEqual(oneHop[0].fromName, "Ben");
assert.strictEqual(oneHop[0].toName, "Ada");
assert.strictEqual(oneHop[0].cents, 4200);

const mustPayTwo = SpendLedger.settle([
  { memberId: "a", name: "Ada", cents: 5000 },
  { memberId: "b", name: "Ben", cents: 2000 },
  { memberId: "c", name: "Cleo", cents: -7000 },
]);
assert.strictEqual(mustPayTwo.length, 2, "one debtor can need two transfers when two people are owed");
assert.strictEqual(
  mustPayTwo.reduce((sum, t) => sum + t.cents, 0),
  7000
);
assert.ok(mustPayTwo.every((t) => t.fromName === "Cleo"));

const mixed = SpendLedger.balances(
  members,
  [
    dinner,
    expense({
      title: "Gelato",
      amount: 12,
      currency: "EUR",
      fxRate: 1.5,
      paidBy: "sam",
      shares: [
        { memberId: "mia", shares: 1 },
        { memberId: "sam", shares: 1 },
      ],
    }),
  ],
  "AUD"
);
assert.strictEqual(
  mixed.reduce((sum, r) => sum + r.cents, 0),
  0,
  "every group still sums to zero across currencies"
);
const mixedTransfers = SpendLedger.settle(mixed);
assert.ok(mixedTransfers.length >= 1);
assert.strictEqual(
  mixedTransfers.reduce((sum, t) => sum + t.cents, 0),
  mixed.filter((r) => r.cents < 0).reduce((sum, r) => sum - r.cents, 0)
);

assert.throws(() => SpendLedger.splitCents(10, []), /who shares/i);
assert.throws(() => SpendLedger.splitCents(-1, [1]), /cents/i);

console.log("shared-ledger.js: all tests passed");
