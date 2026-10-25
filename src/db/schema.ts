import Dexie, { type EntityTable } from "dexie";
import type { PrRecord, SyncState } from "@shared/types";

/** One IndexedDB database per GitHub login so accounts never mix. */
export class PrismyDb extends Dexie {
  prs!: EntityTable<PrRecord, "id">;
  syncState!: EntityTable<SyncState, "sourceKey">;

  constructor(login: string) {
    super(`prismy:${login}`);
    this.version(1).stores({
      prs: "id, repo, authorLogin, createdAt, updatedAt, state, [repo+createdAt], [authorLogin+createdAt], *sources",
      syncState: "sourceKey",
    });
  }
}

const open = new Map<string, PrismyDb>();

export function openDb(login: string): PrismyDb {
  let db = open.get(login);
  if (!db) {
    db = new PrismyDb(login);
    open.set(login, db);
  }
  return db;
}
