import { isPrNode, normalizePr, type PrNode } from "../github/normalize";
import {
  PRS_BY_IDS_QUERY,
  SEARCH_COUNT_QUERY,
  SEARCH_PRS_QUERY,
  searchString,
} from "../github/queries";
import type {
  PrRecord,
  RateLimit,
  Slice,
  SourceKey,
  SyncProgress,
  SyncState,
} from "../types";
import { addDaysToDay, bisectDays, dateOnly } from "./dates";

/** One GraphQL round trip as the Worker proxy reports it. */
export interface GraphqlResponse {
  status: number;
  /** From `retry-after`, seconds. */
  retryAfterSeconds: number | null;
  /** From `x-ratelimit-reset` (epoch seconds), as an ISO instant. */
  resetAt: string | null;
  body: {
    data?: Record<string, unknown> | null;
    errors?: { type?: string; message: string }[];
  } | null;
}

export type GraphqlClient = (
  query: string,
  variables: Record<string, unknown>,
  signal?: AbortSignal,
) => Promise<GraphqlResponse>;

export interface SyncStore {
  getSyncState(source: SourceKey): Promise<SyncState | undefined>;
  putSyncState(state: SyncState): Promise<void>;
  /** Insert or replace by id, keeping the union of `sources`. */
  putPrs(records: PrRecord[]): Promise<void>;
  /** How many PRs the store holds for the source. */
  countPrs(source: SourceKey): Promise<number>;
  /** Ids of OPEN PRs of the source fetched before `olderThan`. */
  staleOpenPrIds(source: SourceKey, olderThan: string): Promise<string[]>;
}

export interface SyncOptions {
  source: SourceKey;
  /** The signed-in login; the `authored` source searches their PRs. */
  login: string;
  /** Oldest creation instant the window needs. */
  from: Date;
  now: Date;
  client: GraphqlClient;
  store: SyncStore;
  onProgress?: (progress: SyncProgress) => void;
  signal?: AbortSignal;
  /** Newest-first cap on PRs stored for the source; 0 = none. */
  cap?: number;
  sleep?: (ms: number) => Promise<void>;
  pageSize?: number;
  /** Pause when fewer points than this remain. */
  reserve?: number;
}

export const REPO_CAP = 3_000;
export const REPO_CAP_STEP = 1_000;
export const REPO_CAP_MAX = 10_000;
/** GitHub search never returns more than this many results per query. */
const SEARCH_LIMIT = 1_000;
const STALE_OPEN_HOURS = 24;
const INCREMENTAL_OVERLAP_MS = 3_600_000;
const MAX_ATTEMPTS = 5;
const MAX_RATE_LIMIT_WAITS = 3;

export class SyncAuthError extends Error {
  constructor() {
    super("GitHub rejected the session; sign in again.");
    this.name = "SyncAuthError";
  }
}

export class SyncAbortError extends Error {
  constructor() {
    super("Sync cancelled.");
    this.name = "SyncAbortError";
  }
}

export function defaultCap(source: SourceKey): number {
  return source === "authored" ? 0 : REPO_CAP;
}

export function initialSyncState(source: SourceKey, cap: number): SyncState {
  return {
    sourceKey: source,
    coveredFrom: null,
    lastSyncAt: null,
    status: "idle",
    pendingSlices: [],
    expected: 0,
    loaded: 0,
    truncated: false,
    cap,
    error: null,
  };
}

interface Probed extends Slice {
  count: number;
}

/**
 * Brings the store up to date for one source over [from, now]: probes and
 * slices the range so every search stays under GitHub's 1,000-result limit,
 * pages newest-first writing every page through, resumes interrupted runs,
 * refreshes only what changed on later runs, and respects the rate limit.
 */
export async function syncSource(options: SyncOptions): Promise<SyncState> {
  const {
    source,
    login,
    from,
    now,
    client,
    store,
    signal,
    onProgress = () => {},
    sleep = defaultSleep,
    pageSize = 100,
    reserve = 300,
  } = options;
  const cap = options.cap ?? defaultCap(source);
  const fromDay = dateOnly(from.toISOString());
  const today = dateOnly(now.toISOString());
  const stored = await store.countPrs(source);
  const state = {
    ...((await store.getSyncState(source)) ?? initialSyncState(source, cap)),
    cap,
  };
  const resuming = state.pendingSlices.length > 0;
  const incremental = state.coveredFrom !== null;
  let oldestLoaded: string | null = null;
  let pointsUsed = 0;
  let rateLimit: RateLimit | null = null;
  let slicesTotal = 0;
  let slicesDone = 0;
  let phase: SyncProgress["phase"] = "probing";
  let resumeAt: string | null = null;

  const report = () =>
    onProgress({
      source,
      phase,
      slicesDone,
      slicesTotal,
      loaded: state.loaded,
      expected: state.expected,
      pointsUsed,
      remaining: rateLimit?.remaining ?? null,
      resetAt: rateLimit?.resetAt ?? null,
      resumeAt,
    });

  const checkAborted = () => {
    if (signal?.aborted) throw new SyncAbortError();
  };

  /** One GraphQL call with retries, backoff and rate-limit pauses. */
  async function request<T>(
    query: string,
    variables: Record<string, unknown>,
  ): Promise<T> {
    let attempts = 0;
    let waits = 0;
    for (;;) {
      checkAborted();
      const response = await client(query, variables, signal);
      const data = response.body?.data ?? null;
      const errors = response.body?.errors ?? [];
      const limit = data?.rateLimit as RateLimit | undefined;
      if (limit) {
        rateLimit = limit;
        pointsUsed += limit.cost;
      }
      const limited =
        response.status === 403 ||
        response.status === 429 ||
        errors.some((error) => error.type === "RATE_LIMITED");
      if (response.status === 401) throw new SyncAuthError();
      if (limited) {
        if (waits++ >= MAX_RATE_LIMIT_WAITS) {
          throw new Error("GitHub rate limit exceeded; try again later.");
        }
        await pause(
          (response.retryAfterSeconds ??
            secondsUntil(response.resetAt ?? limit?.resetAt, now)) * 1000,
        );
        continue;
      }
      if (response.status === 200 && data && errors.length === 0) {
        if (limit && limit.remaining < reserve) {
          await pause(secondsUntil(limit.resetAt, now) * 1000);
        }
        return data as T;
      }
      if (++attempts >= MAX_ATTEMPTS) {
        throw new Error(
          errors[0]?.message ?? `GitHub returned HTTP ${response.status}.`,
        );
      }
      if (
        (response.status === 502 || response.status === 504) &&
        typeof variables.first === "number" &&
        variables.first > 25
      ) {
        variables.first = Math.floor(variables.first / 2);
      }
      await sleep(2 ** attempts * 1000);
    }
  }

  async function pause(ms: number) {
    const wait = Math.max(1000, Math.min(ms, 3_600_000));
    const previous = phase;
    phase = "paused";
    resumeAt = new Date(now.getTime() + wait).toISOString();
    report();
    await sleep(wait);
    resumeAt = null;
    phase = previous;
    report();
  }

  const terms = (slice: Slice) => ({
    author: source === "authored" ? login : undefined,
    repo: source === "authored" ? undefined : source.slice("repo:".length),
    createdFrom: slice.from,
    createdTo: slice.to,
    updatedSince: slice.updatedSince,
  });

  async function probe(slice: Slice): Promise<number> {
    const data = await request<{ search: { issueCount: number } }>(
      SEARCH_COUNT_QUERY,
      { q: searchString(terms(slice)) },
    );
    report();
    return data.search.issueCount;
  }

  // 1. Which creation-date ranges need fetching.
  let work: Slice[];
  if (resuming) {
    work = state.pendingSlices;
  } else if (!incremental) {
    work = [{ from: fromDay, to: today, cursor: null }];
  } else {
    work = [
      {
        from: state.coveredFrom!,
        to: today,
        cursor: null,
        updatedSince: new Date(
          Date.parse(state.lastSyncAt ?? now.toISOString()) -
            INCREMENTAL_OVERLAP_MS,
        ).toISOString(),
      },
    ];
    if (fromDay < state.coveredFrom!) {
      work.push({
        from: fromDay,
        to: addDaysToDay(state.coveredFrom!, -1),
        cursor: null,
      });
    }
  }
  if (!resuming) {
    state.loaded = 0;
    state.expected = 0;
    state.truncated = false;
    state.error = null;
  }
  state.status = "syncing";
  state.pendingSlices = work;
  await store.putSyncState(state);
  report();

  try {
    // 2. Probe and split until every slice fits one search.
    const ready: Probed[] = [];
    const stack = [...work];
    while (stack.length) {
      const slice = stack.pop()!;
      const count = slice.count ?? (await probe(slice));
      if (count > SEARCH_LIMIT && slice.from !== slice.to) {
        const [older, newer] = bisectDays(slice.from, slice.to);
        stack.push(
          {
            ...slice,
            from: older[0],
            to: older[1],
            cursor: null,
            count: undefined,
          },
          {
            ...slice,
            from: newer[0],
            to: newer[1],
            cursor: null,
            count: undefined,
          },
        );
        continue;
      }
      if (count > SEARCH_LIMIT) state.truncated = true;
      ready.push({ ...slice, count: Math.min(count, SEARCH_LIMIT) });
    }
    ready.sort((a, b) => b.to.localeCompare(a.to));
    slicesTotal = ready.length;
    state.expected = ready.reduce((total, slice) => total + slice.count, 0);
    state.pendingSlices = ready;
    await store.putSyncState(state);
    phase = "fetching";
    report();

    // 3. Page through each slice, newest first, writing every page through.
    for (const slice of ready) {
      const capped = () =>
        cap > 0 && !slice.updatedSince && stored + state.loaded >= cap;
      let hasNextPage = true;
      while (hasNextPage && !capped()) {
        const data = await request<{
          search: {
            pageInfo: { hasNextPage: boolean; endCursor: string | null };
            nodes: unknown[];
          };
        }>(SEARCH_PRS_QUERY, {
          q: searchString(terms(slice)),
          first: pageSize,
          after: slice.cursor,
        });
        const fetchedAt = now.toISOString();
        const records = data.search.nodes
          .filter(isPrNode)
          .map((node) => normalizePr(node, source, fetchedAt));
        await store.putPrs(records);
        state.loaded += records.length;
        for (const record of records) {
          if (oldestLoaded === null || record.createdAt < oldestLoaded) {
            oldestLoaded = record.createdAt;
          }
        }
        hasNextPage = data.search.pageInfo.hasNextPage;
        slice.cursor = data.search.pageInfo.endCursor;
        state.pendingSlices = hasNextPage
          ? state.pendingSlices
          : state.pendingSlices.filter((pending) => pending !== slice);
        await store.putSyncState(state);
        report();
      }
      if (capped()) {
        state.truncated = true;
        break;
      }
      slicesDone += 1;
    }

    // 4. Open PRs change without matching the incremental search; refresh
    //    any not seen for a day.
    if (incremental && !resuming) {
      phase = "refreshing";
      const staleBefore = new Date(
        now.getTime() - STALE_OPEN_HOURS * 3_600_000,
      ).toISOString();
      const ids = await store.staleOpenPrIds(source, staleBefore);
      for (let index = 0; index < ids.length; index += 100) {
        const data = await request<{ nodes: (PrNode | null)[] }>(
          PRS_BY_IDS_QUERY,
          {
            ids: ids.slice(index, index + 100),
          },
        );
        const fetchedAt = now.toISOString();
        await store.putPrs(
          data.nodes
            .filter(isPrNode)
            .map((node) => normalizePr(node, source, fetchedAt)),
        );
        report();
      }
    }

    // 5. Done: record coverage.
    const capHit = state.truncated && oldestLoaded !== null && cap > 0;
    state.coveredFrom = capHit
      ? dateOnly(oldestLoaded!)
      : state.coveredFrom && state.coveredFrom < fromDay
        ? state.coveredFrom
        : fromDay;
    state.lastSyncAt = now.toISOString();
    state.pendingSlices = [];
    state.status = state.truncated ? "partial" : "done";
  } catch (error) {
    if (error instanceof SyncAbortError) {
      // Pending slices stay in the store so the next run resumes.
      state.status = "idle";
      await store.putSyncState(state);
      throw error;
    }
    state.status = "error";
    state.error = error instanceof Error ? error.message : String(error);
    await store.putSyncState(state);
    throw error;
  }

  await store.putSyncState(state);
  phase = "done";
  report();
  return state;
}

function secondsUntil(iso: string | null | undefined, now: Date): number {
  if (!iso) return 60;
  return Math.max(1, Math.ceil((Date.parse(iso) - now.getTime()) / 1000));
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
