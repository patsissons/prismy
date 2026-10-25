import { useLiveQuery } from "dexie-react-hooks";
import type { PrRecord } from "@shared/types";
import type { PrismyDb } from "@/db/schema";

/** Every stored PR authored by the login; undefined while loading. */
export function useAuthoredPrs(
  db: PrismyDb,
  login: string,
): PrRecord[] | undefined {
  return useLiveQuery(
    () => db.prs.where("authorLogin").equals(login).toArray(),
    [db, login],
  );
}

/** Every stored PR of one repo; undefined while loading. */
export function useRepoPrs(db: PrismyDb, repo: string): PrRecord[] | undefined {
  return useLiveQuery(
    () => db.prs.where("repo").equals(repo).toArray(),
    [db, repo],
  );
}
