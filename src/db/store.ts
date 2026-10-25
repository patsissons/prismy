import type { SyncStore } from "@shared/sync/engine";
import type { PrRecord, SourceKey } from "@shared/types";
import type { PrismyDb } from "./schema";

/** The sync engine's store over Dexie. */
export function dexieStore(db: PrismyDb): SyncStore {
  return {
    getSyncState: (source) => db.syncState.get(source),
    putSyncState: async (state) => {
      await db.syncState.put(state);
    },
    putPrs: (records) =>
      db.transaction("rw", db.prs, async () => {
        const existing = await db.prs.bulkGet(
          records.map((record) => record.id),
        );
        const merged: PrRecord[] = records.map((record, index) => {
          const previous = existing[index];
          return previous
            ? { ...record, sources: union(previous.sources, record.sources) }
            : record;
        });
        await db.prs.bulkPut(merged);
      }),
    countPrs: (source) => db.prs.where("sources").equals(source).count(),
    staleOpenPrIds: (source, olderThan) =>
      db.prs
        .where("sources")
        .equals(source)
        .filter(
          (record) => record.state === "OPEN" && record.fetchedAt < olderThan,
        )
        .primaryKeys(),
  };
}

function union(a: SourceKey[], b: SourceKey[]): SourceKey[] {
  return [...new Set([...a, ...b])];
}
