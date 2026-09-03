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

// Each fetchDefiLlamaProtocol test below uses its own unique slug. The
// module keeps an in-memory cache keyed by slug for CACHE_TTL_MS, so
// reusing a slug across tests would make a later test silently short-circuit
// on an earlier test's cached (possibly failed) result instead of exercising
// the mocked fetch it's actually meant to test.

test("fetchDefiLlamaProtocol: a 404 is reported as a handled failure, not a thrown error", async () => {
  const originalFetch = global.fetch;
  // @ts-expect-error - test stub
  global.fetch = async () => ({ ok: false, status: 404, json: async () => ({}) });
  try {
    const result = await fetchDefiLlamaProtocol("test-404-protocol");
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
    const result = await fetchDefiLlamaProtocol("test-malformed-protocol");
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
      const result = await fetchDefiLlamaProtocol("test-network-error-protocol");
      assert.equal(result.ok, false);
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchDefiLlamaProtocol: a failed fetch is never cached (retries on the next call)", async () => {
  const originalFetch = global.fetch;
  let calls = 0;
  // @ts-expect-error - test stub
  global.fetch = async () => {
    calls++;
    return { ok: false, status: 500, json: async () => ({}) };
  };
  try {
    await fetchDefiLlamaProtocol("test-uncached-failure-protocol");
    await fetchDefiLlamaProtocol("test-uncached-failure-protocol");
    assert.equal(calls, 2, "a failed lookup should not be cached, so both calls should hit fetch");
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchDefiLlamaProtocol: a successful, well-formed response is parsed, trimmed and returned uncached on first call", async () => {
  const originalFetch = global.fetch;
  const now = Math.floor(Date.now() / 1000);
  // @ts-expect-error - test stub
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ tvl: [{ date: now, totalLiquidityUSD: 999 }] }),
  });
  try {
    const result = await fetchDefiLlamaProtocol("test-success-protocol");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.tvl, 999);
      assert.equal(result.fromCache, false);
    }
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchDefiLlamaProtocol: passes cache: 'no-store' so Next.js never tries to persist the raw (possibly >2MB) payload", async () => {
  const originalFetch = global.fetch;
  let capturedInit: RequestInit | undefined;
  // @ts-expect-error - test stub
  global.fetch = async (_url: string, init: RequestInit) => {
    capturedInit = init;
    return { ok: true, status: 200, json: async () => ({ tvl: [] }) };
  };
  try {
    await fetchDefiLlamaProtocol("test-no-store-protocol");
    assert.equal(capturedInit?.cache, "no-store");
    // Must NOT use Next's `next: { revalidate }` Data Cache option — that's
    // exactly the mechanism that rejects payloads over 2MB. (No
    // @ts-expect-error here: Next.js's own type declarations augment
    // RequestInit with an optional `next` field, so this is a normal,
    // well-typed property access — it's just always undefined since we
    // never set it.)
    assert.equal((capturedInit as RequestInit & { next?: unknown })?.next, undefined);
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchDefiLlamaProtocol: a second call within the cache TTL is served from memory, not refetched", async () => {
  const originalFetch = global.fetch;
  const now = Math.floor(Date.now() / 1000);
  let calls = 0;
  // @ts-expect-error - test stub
  global.fetch = async () => {
    calls++;
    return { ok: true, status: 200, json: async () => ({ tvl: [{ date: now, totalLiquidityUSD: 777 }] }) };
  };
  try {
    const first = await fetchDefiLlamaProtocol("test-cache-hit-protocol");
    const second = await fetchDefiLlamaProtocol("test-cache-hit-protocol");

    assert.equal(calls, 1, "the second call should be served from the in-memory cache, not fetch again");
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    if (first.ok && second.ok) {
      assert.equal(first.fromCache, false);
      assert.equal(second.fromCache, true);
      assert.deepEqual(second.data, first.data);
    }
  } finally {
    global.fetch = originalFetch;
  }
});
