import { describe, expect, it, vi } from "vitest";
import type { PrNode } from "../github/normalize";
import { prNode } from "../testing/fixtures";
import type { PrRecord, SourceKey, SyncProgress, SyncState } from "../types";
import {
  SyncAbortError,
  SyncAuthError,
  syncSource,
  type GraphqlClient,
  type GraphqlResponse,
  type SyncStore,
} from "./engine";

const NOW = new Date("2026-10-01T12:00:00.000Z");
const RATE = { cost: 1, remaining: 4000, resetAt: "2026-10-01T13:00:00.000Z" };

/** `count` PRs spread evenly over the `days` days ending today. */
function nodesOver(
  days: number,
  count: number,
  extra: Partial<PrNode> = {},
): PrNode[] {
  return Array.from({ length: count }, (_, index) => {
    const createdAt = new Date(
      NOW.getTime() - ((index * days) / count) * 86_400_000,
    ).toISOString();
    return prNode({
      number: index + 1,
      createdAt,
      updatedAt: createdAt,
      mergedAt: createdAt,
      closedAt: createdAt,
      ...extra,
    });
  });
}

/** An in-memory GitHub that answers the engine's three queries. */
function fakeGitHub(nodes: PrNode[]) {
  const calls: { query: string; variables: Record<string, unknown> }[] = [];
  const ok = (data: Record<string, unknown>): GraphqlResponse => ({
    status: 200,
    retryAfterSeconds: null,
    resetAt: null,
    body: { data: { ...data, rateLimit: RATE } },
  });
  const matching = (q: string) => {
    const created = /created:(\S+)\.\.(\S+)/.exec(q)!;
    const updated = /updated:>=(\S+)/.exec(q);
    const author = /author:(\S+)/.exec(q)?.[1];
    const repo = /repo:(\S+)/.exec(q)?.[1];
    return nodes
      .filter((node) => node.createdAt.slice(0, 10) >= created[1]!)
      .filter((node) => node.createdAt.slice(0, 10) <= created[2]!)
      .filter((node) => !updated || node.updatedAt >= updated[1]!)
      .filter((node) => !author || node.author?.login === author)
      .filter((node) => !repo || node.repository.nameWithOwner === repo)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  };
  const client: GraphqlClient = async (query, variables) => {
    calls.push({ query, variables: { ...variables } });
    const q = variables.q as string;
    if (query.includes("query SearchCount")) {
      return ok({ search: { issueCount: matching(q).length } });
    }
    if (query.includes("query SearchPRs")) {
      const all = matching(q);
      const start = variables.after ? Number(variables.after) : 0;
      const first = variables.first as number;
      const page = all.slice(start, start + first);
      const end = start + page.length;
      return ok({
        search: {
          issueCount: all.length,
          pageInfo: { hasNextPage: end < all.length, endCursor: String(end) },
          nodes: page,
        },
      });
    }
    if (query.includes("query PRsByIds")) {
      const ids = variables.ids as string[];
      return ok({
        nodes: ids.map((id) => nodes.find((node) => node.id === id) ?? null),
      });
    }
    throw new Error(`unexpected query ${query}`);
  };
  return { client, calls };
}

function memoryStore(initial: PrRecord[] = []): SyncStore & {
  prs: Map<string, PrRecord>;
  states: Map<SourceKey, SyncState>;
} {
  const prs = new Map(initial.map((record) => [record.id, record]));
  const states = new Map<SourceKey, SyncState>();
  return {
    prs,
    states,
    getSyncState: async (source) => states.get(source),
    putSyncState: async (state) => {
      states.set(state.sourceKey, structuredClone(state));
    },
    putPrs: async (records) => {
      for (const record of records) {
        const existing = prs.get(record.id);
        prs.set(record.id, {
          ...record,
          sources: [
            ...new Set([...(existing?.sources ?? []), ...record.sources]),
          ],
        });
      }
    },
    countPrs: async (source) =>
      [...prs.values()].filter((record) => record.sources.includes(source))
        .length,
    staleOpenPrIds: async (source, olderThan) =>
      [...prs.values()]
        .filter(
          (record) =>
            record.sources.includes(source) &&
            record.state === "OPEN" &&
            record.fetchedAt < olderThan,
        )
        .map((record) => record.id),
  };
}

const sleep = vi.fn(async () => {});

function run(
  overrides: Partial<Parameters<typeof syncSource>[0]> & {
    client: GraphqlClient;
    store: SyncStore;
  },
) {
  return syncSource({
    source: "authored",
    login: "pat",
    from: new Date("2026-09-01T12:00:00.000Z"),
    now: NOW,
    sleep,
    ...overrides,
  });
}

describe("syncSource", () => {
  it("fetches a window in pages, newest first, and records coverage", async () => {
    const github = fakeGitHub(nodesOver(30, 250));
    const store = memoryStore();
    const progress: SyncProgress[] = [];
    const state = await run({
      client: github.client,
      store,
      onProgress: (p) => progress.push(p),
    });

    expect(store.prs.size).toBe(250);
    expect(state).toMatchObject({
      status: "done",
      coveredFrom: "2026-09-01",
      lastSyncAt: NOW.toISOString(),
      loaded: 250,
      expected: 250,
      truncated: false,
      pendingSlices: [],
    });
    expect(
      github.calls.filter((c) => c.query.includes("SearchPRs")),
    ).toHaveLength(3);
    expect(github.calls[1]!.variables.q).toBe(
      "is:pr author:pat created:2026-09-01..2026-10-01 sort:created-desc",
    );
    expect(progress.at(-1)).toMatchObject({
      phase: "done",
      loaded: 250,
      pointsUsed: 4,
    });
  });

  it("bisects a range that exceeds the search limit", async () => {
    const github = fakeGitHub(
      nodesOver(10, 1500, {
        repository: { nameWithOwner: "acme/app", isPrivate: false },
      }),
    );
    const store = memoryStore();
    const state = await run({
      source: "repo:acme/app",
      client: github.client,
      store,
      cap: 0,
    });

    expect(store.prs.size).toBe(1500);
    expect(state.truncated).toBe(false);
    const counts = github.calls.filter((c) => c.query.includes("SearchCount"));
    expect(counts.length).toBeGreaterThan(1);
    // Newest slice is fetched first.
    const pages = github.calls.filter((c) => c.query.includes("SearchPRs"));
    const firstRange = /created:(\S+)\.\./.exec(
      pages[0]!.variables.q as string,
    )![1]!;
    const lastRange = /created:(\S+)\.\./.exec(
      pages.at(-1)!.variables.q as string,
    )![1]!;
    expect(firstRange > lastRange).toBe(true);
  });

  it("flags a single day over the limit as truncated", async () => {
    const day = nodesOver(0.5, 1100);
    const github = fakeGitHub(day);
    const store = memoryStore();
    const state = await run({
      client: github.client,
      store,
      from: new Date("2026-09-30T12:00:00.000Z"),
    });
    expect(state.truncated).toBe(true);
    expect(state.status).toBe("partial");
    expect(state.expected).toBeLessThanOrEqual(2000);
  });

  it("stops at the cap newest-first and reports the effective coverage", async () => {
    const github = fakeGitHub(
      nodesOver(30, 500, {
        repository: { nameWithOwner: "acme/app", isPrivate: false },
      }),
    );
    const store = memoryStore();
    const state = await run({
      source: "repo:acme/app",
      client: github.client,
      store,
      cap: 200,
    });

    expect(store.prs.size).toBe(200);
    expect(state.truncated).toBe(true);
    expect(state.status).toBe("partial");
    const oldest = [...store.prs.values()].map((p) => p.createdAt).sort()[0]!;
    expect(state.coveredFrom).toBe(oldest.slice(0, 10));
  });

  it("resumes pending slices after a cancel", async () => {
    const github = fakeGitHub(nodesOver(30, 250));
    const store = memoryStore();
    const controller = new AbortController();
    let pages = 0;
    const client: GraphqlClient = async (query, variables, signal) => {
      const response = await github.client(query, variables, signal);
      if (query.includes("SearchPRs") && ++pages === 1) controller.abort();
      return response;
    };
    await expect(
      run({ client, store, signal: controller.signal }),
    ).rejects.toBeInstanceOf(SyncAbortError);
    const paused = store.states.get("authored")!;
    expect(paused.status).toBe("idle");
    expect(paused.pendingSlices).toHaveLength(1);
    expect(paused.pendingSlices[0]!.cursor).toBe("100");
    expect(store.prs.size).toBe(100);

    const state = await run({ client: github.client, store });
    expect(state.status).toBe("done");
    expect(store.prs.size).toBe(250);
    // The resumed run neither re-probed nor refetched the first page.
    const resumed = github.calls.slice(-2);
    expect(resumed.every((c) => c.query.includes("SearchPRs"))).toBe(true);
    expect(resumed[0]!.variables.after).toBe("100");
  });

  it("only fetches updates on a later run, and the older range when widened", async () => {
    const nodes = nodesOver(60, 120);
    const github = fakeGitHub(nodes);
    const store = memoryStore();
    await run({ client: github.client, store });
    // Every PR created on Sep 1 counts, not only those after noon.
    expect(store.prs.size).toBe(62);
    github.calls.length = 0;

    // A later run: only one PR changed since.
    const later = new Date("2026-10-02T12:00:00.000Z");
    nodes[3]!.updatedAt = "2026-10-02T00:00:00.000Z";
    nodes[3]!.title = "renamed";
    await run({ client: github.client, store, now: later });
    const q = github.calls.find((c) => c.query.includes("SearchPRs"))!.variables
      .q as string;
    expect(q).toContain("created:2026-09-01..2026-10-02");
    expect(q).toContain("updated:>=2026-10-01T11:00:00.000Z");
    expect(store.prs.get("PR_4")!.title).toBe("renamed");
    expect(store.prs.size).toBe(62);
    github.calls.length = 0;

    // Widening the window fetches only the uncovered older range.
    const state = await run({
      client: github.client,
      store,
      now: later,
      from: new Date("2026-08-03T12:00:00.000Z"),
    });
    const ranges = github.calls
      .filter((c) => c.query.includes("SearchPRs"))
      .map((c) =>
        /created:(\S+)\.\.(\S+)/.exec(c.variables.q as string)!.slice(1, 3),
      );
    expect(ranges).toContainEqual(["2026-08-03", "2026-08-31"]);
    expect(state.coveredFrom).toBe("2026-08-03");
    expect(store.prs.size).toBe(120);
  });

  it("refreshes open PRs not seen for a day", async () => {
    const nodes = nodesOver(10, 5, {
      state: "OPEN",
      mergedAt: null,
      closedAt: null,
    });
    const github = fakeGitHub(nodes);
    const store = memoryStore();
    await run({ client: github.client, store });
    nodes[0]!.state = "MERGED";
    github.calls.length = 0;

    await run({
      client: github.client,
      store,
      now: new Date("2026-10-03T12:00:00.000Z"),
    });
    // PR_1 was updated inside the incremental overlap, so the search already
    // refreshed it; the other four open PRs are refreshed by id.
    const refresh = github.calls.find((c) => c.query.includes("PRsByIds"))!;
    expect(refresh.variables.ids).toEqual(["PR_2", "PR_3", "PR_4", "PR_5"]);
    expect(store.prs.get("PR_1")!.state).toBe("MERGED");
  });

  it("waits out a secondary rate limit and retries server errors with smaller pages", async () => {
    const github = fakeGitHub(nodesOver(30, 50));
    const store = memoryStore();
    let searches = 0;
    const client: GraphqlClient = async (query, variables, signal) => {
      if (query.includes("SearchPRs")) {
        searches += 1;
        if (searches === 1) {
          return {
            status: 403,
            retryAfterSeconds: 30,
            resetAt: null,
            body: null,
          };
        }
        if (searches === 2) {
          return {
            status: 502,
            retryAfterSeconds: null,
            resetAt: null,
            body: null,
          };
        }
      }
      return github.client(query, variables, signal);
    };
    sleep.mockClear();
    const state = await run({ client, store });
    expect(state.status).toBe("done");
    expect(sleep).toHaveBeenCalledWith(30_000);
    expect(sleep).toHaveBeenCalledWith(2_000);
    const page = github.calls.find((c) => c.query.includes("SearchPRs"))!;
    expect(page.variables.first).toBe(50);
  });

  it("pauses when the budget runs low", async () => {
    const github = fakeGitHub(nodesOver(30, 10));
    const store = memoryStore();
    const client: GraphqlClient = async (query, variables, signal) => {
      const response = await github.client(query, variables, signal);
      const data = response.body!.data!;
      data.rateLimit = {
        cost: 1,
        remaining: 100,
        resetAt: "2026-10-01T12:10:00.000Z",
      };
      return response;
    };
    sleep.mockClear();
    const progress: SyncProgress[] = [];
    await run({ client, store, onProgress: (p) => progress.push(p) });
    expect(sleep).toHaveBeenCalledWith(600_000);
    expect(
      progress.some((p) => p.phase === "paused" && p.resumeAt !== null),
    ).toBe(true);
  });

  it("fails fast when the session is rejected", async () => {
    const store = memoryStore();
    const client: GraphqlClient = async () => ({
      status: 401,
      retryAfterSeconds: null,
      resetAt: null,
      body: null,
    });
    await expect(run({ client, store })).rejects.toBeInstanceOf(SyncAuthError);
    expect(store.states.get("authored")!.status).toBe("error");
  });
});
