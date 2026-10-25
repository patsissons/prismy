import { useCallback, useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { SyncAbortError, SyncAuthError, syncSource } from "@shared/sync/engine";
import type { SourceKey, SyncProgress, SyncState } from "@shared/types";
import type { PrismyDb } from "@/db/schema";
import { dexieStore } from "@/db/store";
import { graphqlClient } from "@/lib/graphql";

export interface SyncHandle {
  state: SyncState | undefined;
  progress: SyncProgress | null;
  running: boolean;
  error: string | null;
  authExpired: boolean;
  restart: () => void;
}

/** Runs are chained per database+source so an aborted run finishes writing
 *  its resume point before the next one reads it (StrictMode double-mounts). */
const chains = new Map<string, Promise<unknown>>();

export function useSync(options: {
  db: PrismyDb;
  login: string;
  source: SourceKey;
  from: Date;
  now: Date;
  cap?: number;
}): SyncHandle {
  const { db, login, source, from, now, cap } = options;
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authExpired, setAuthExpired] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const state = useLiveQuery(() => db.syncState.get(source), [db, source]);
  const fromIso = from.toISOString();
  const nowIso = now.toISOString();

  useEffect(() => {
    const controller = new AbortController();
    const key = `${db.name}:${source}`;
    const previous = chains.get(key) ?? Promise.resolve();
    const run = previous
      .catch(() => undefined)
      .then(() => {
        if (controller.signal.aborted) return;
        setRunning(true);
        setError(null);
        return syncSource({
          source,
          login,
          from: new Date(fromIso),
          now: new Date(nowIso),
          cap,
          client: graphqlClient,
          store: dexieStore(db),
          signal: controller.signal,
          onProgress: setProgress,
        });
      })
      .catch((caught: unknown) => {
        if (caught instanceof SyncAbortError || controller.signal.aborted)
          return;
        if (caught instanceof SyncAuthError) setAuthExpired(true);
        setError(caught instanceof Error ? caught.message : String(caught));
      })
      .finally(() => {
        if (!controller.signal.aborted) setRunning(false);
      });
    chains.set(key, run);
    return () => controller.abort();
  }, [db, login, source, fromIso, nowIso, cap, attempt]);

  const restart = useCallback(() => setAttempt((n) => n + 1), []);

  return { state, progress, running, error, authExpired, restart };
}
