import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SyncHandle } from "@/hooks/use-sync";
import { SyncChip } from "./sync-chip";

const NOW = new Date("2026-10-01T12:00:00.000Z");

function handle(overrides: Partial<SyncHandle>): SyncHandle {
  return {
    state: undefined,
    progress: null,
    running: false,
    error: null,
    authExpired: false,
    restart: vi.fn(),
    ...overrides,
  };
}

describe("SyncChip", () => {
  it("counts progress while syncing", () => {
    render(
      <SyncChip
        now={NOW}
        sync={handle({
          running: true,
          progress: {
            source: "authored",
            phase: "fetching",
            slicesDone: 0,
            slicesTotal: 1,
            loaded: 200,
            expected: 1200,
            pointsUsed: 5,
            remaining: 4000,
            resetAt: null,
            resumeAt: null,
          },
        })}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Syncing 200 of 1,200",
    );
  });

  it("says when it last synced", () => {
    render(
      <SyncChip
        now={NOW}
        sync={handle({
          state: {
            sourceKey: "authored",
            coveredFrom: "2026-07-01",
            lastSyncAt: "2026-10-01T11:00:00.000Z",
            status: "done",
            pendingSlices: [],
            expected: 10,
            loaded: 10,
            truncated: false,
            cap: 0,
            error: null,
          },
        })}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Synced 1 hour ago");
  });

  it("offers a retry after an error", () => {
    const restart = vi.fn();
    render(
      <SyncChip
        now={NOW}
        sync={handle({ error: "GitHub returned HTTP 500.", restart })}
      />,
    );
    screen.getByRole("button", { name: "Retry" }).click();
    expect(restart).toHaveBeenCalled();
  });
});
