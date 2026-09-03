import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeDefiLlamaData, fetchDefiLlamaProtocol } from "../lib/data-sources/defillama";

const DAY = 24 * 60 * 60;

function buildHistory(nowDate: number, points: { daysAgo: number; tvl: number }[]) {
  return points
    .map((p) => ({ date: nowDate - p.daysAgo * DAY, totalLiquidityUSD: p.tvl }))
    .sort((a, b) => a.date - b.date);
}

test("normalizeDefiLlamaData: computes current TVL and 7d/30d change from history", () => {
  const now = Math.floor(Date.now() / 1000);
  const history = buildHistory(now, [
    { daysAgo: 35, tvl: 100 },
    { daysAgo: 30, tvl: 110 },
    { daysAgo: 8, tvl: 150 },
    { daysAgo: 7, tvl: 150 },
    { daysAgo: 0, tvl: 165 },
  ]);

  const result = normalizeDefiLlamaData({ tvl: history });

  assert.equal(result.tvl, 165);
  // 7d change vs the point at/just-before 7 days ago (150 -> 165 = +10%)
  assert.ok(result.tvl7dChange !== undefined);
  assert.ok(Math.abs((result.tvl7dChange as number) - 10) < 0.01);
  // 30d change vs the point at/just-before 30 days ago (110 -> 165 = +50%)
  assert.ok(result.tvl30dChange !== undefined);
  assert.ok(Math.abs((result.tvl30dChange as number) - 50) < 0.01);
});

test("normalizeDefiLlamaData: missing tvl history returns an empty object, not a crash", () => {
  const result = normalizeDefiLlamaData({});
  assert.deepEqual(result, {});
});

test("normalizeDefiLlamaData: empty tvl array returns an empty object", () => {
  const result = normalizeDefiLlamaData({ tvl: [] });
  assert.deepEqual(result, {});
});

test("normalizeDefiLlamaData: single data point has no 7d/30d comparison but still reports current TVL", () => {
  const now = Math.floor(Date.now() / 1000);
  const result = normalizeDefiLlamaData({ tvl: [{ date: now, totalLiquidityUSD: 42 }] });
  assert.equal(result.tvl, 42);
  assert.equal(result.tvl7dChange, undefined);
  assert.equal(result.tvl30dChange, undefined);
});

test("fetchDefiLlamaProtocol: a 404 is reported as a handled failure, not a thrown error", async () => {
  const originalFetch = global.fetch;
  // @ts-expect-error - test stub
  global.fetch = async () => ({ ok: false, status: 404, json: async () => ({}) });
  try {
    const result = await fetchDefiLlamaProtocol("definitely-not-a-real-protocol");
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /404/);
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchDefiLlamaProtocol: a malformed (non-object) response is reported as a handled failure", async () => {
  const originalFetch = global.fetch;
  // @ts-expect-error - test stub
  global.fetch = async () => ({ ok: true, status: 200, json: async () => null });
  try {
    const result = await fetchDefiLlamaProtocol("some-slug");
    assert.equal(result.ok, false);
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchDefiLlamaProtocol: a network error is caught and returned, never thrown", async () => {
  const originalFetch = global.fetch;
  // @ts-expect-error - test stub
  global.fetch = async () => {
    throw new Error("network down");
  };
  try {
    await assert.doesNotReject(async () => {
      const result = await fetchDefiLlamaProtocol("some-slug");
      assert.equal(result.ok, false);
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchDefiLlamaProtocol: a successful, well-formed response is parsed", async () => {
  const originalFetch = global.fetch;
  const now = Math.floor(Date.now() / 1000);
  // @ts-expect-error - test stub
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ tvl: [{ date: now, totalLiquidityUSD: 999 }] }),
  });
  try {
    const result = await fetchDefiLlamaProtocol("some-slug");
    assert.equal(result.ok, true);
    if (result.ok) {
      const normalized = normalizeDefiLlamaData(result.raw);
      assert.equal(normalized.tvl, 999);
    }
  } finally {
    global.fetch = originalFetch;
  }
});
