import "fake-indexeddb/auto";
import { pr } from "@shared/testing/fixtures";
import { afterEach, describe, expect, it } from "vitest";
import { PrismyDb } from "./schema";
import { dexieStore } from "./store";

let db: PrismyDb;

afterEach(async () => {
  await db?.delete();
});

describe("dexieStore", () => {
  it("merges sources on re-put and counts per source", async () => {
    db = new PrismyDb("test-merge");
    const store = dexieStore(db);
    await store.putPrs([
      pr({ number: 1, sources: ["authored"] }),
      pr({ number: 2, sources: ["authored"] }),
    ]);
    await store.putPrs([
      pr({ number: 1, title: "renamed", sources: ["repo:acme/app"] }),
    ]);

    const first = await db.prs.get("PR_1");
    expect(first?.title).toBe("renamed");
    expect(first?.sources).toEqual(["authored", "repo:acme/app"]);
    expect(await store.countPrs("authored")).toBe(2);
    expect(await store.countPrs("repo:acme/app")).toBe(1);
  });

  it("finds stale open PRs and round-trips sync state", async () => {
    db = new PrismyDb("test-stale");
    const store = dexieStore(db);
    await store.putPrs([
      pr({
        number: 1,
        state: "OPEN",
        mergedAt: null,
        fetchedAt: "2026-09-01T00:00:00.000Z",
      }),
      pr({
        number: 2,
        state: "OPEN",
        mergedAt: null,
        fetchedAt: "2026-10-01T00:00:00.000Z",
      }),
      pr({ number: 3, state: "MERGED", fetchedAt: "2026-09-01T00:00:00.000Z" }),
    ]);
    expect(
      await store.staleOpenPrIds("authored", "2026-09-30T00:00:00.000Z"),
    ).toEqual(["PR_1"]);

    await store.putSyncState({
      sourceKey: "authored",
      coveredFrom: "2026-07-01",
      lastSyncAt: "2026-10-01T00:00:00.000Z",
      status: "done",
      pendingSlices: [],
      expected: 3,
      loaded: 3,
      truncated: false,
      cap: 0,
      error: null,
    });
    expect((await store.getSyncState("authored"))?.coveredFrom).toBe(
      "2026-07-01",
    );
  });
});
