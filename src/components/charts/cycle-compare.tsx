import type { Quartiles } from "@shared/metrics/repo";
import { ChartCard } from "@/components/chart-card";
import { formatHours } from "@/lib/utils";

/**
 * Open-to-merge time, you vs everyone else: the p25..p75 range as a bar with
 * the median marked, both rows on one scale.
 */
export function CycleCompare({
  you,
  others,
  stale,
}: {
  you: Quartiles | null;
  others: Quartiles | null;
  stale?: boolean;
}) {
  const rows = [
    { label: "You", q: you, color: "var(--chart-accent)" },
    { label: "Everyone else", q: others, color: "var(--chart-muted)" },
  ];
  const max = Math.max(1, ...rows.map((row) => row.q?.p75 ?? 0)) * 1.15;
  const x = (hours: number) => `${Math.min(100, (hours / max) * 100)}%`;

  return (
    <ChartCard
      title="Cycle time"
      description="Hours from opening to merging; the bar spans the middle half, the tick is the median"
      stale={stale}
      table={{
        head: ["Who", "p25", "Median", "p75", "Merged PRs"],
        rows: rows.map((row) => [
          row.label,
          formatHours(row.q?.p25 ?? null),
          formatHours(row.q?.median ?? null),
          formatHours(row.q?.p75 ?? null),
          row.q?.count ?? 0,
        ]),
      }}
    >
      <ul className="flex flex-col gap-5 py-2" aria-label="Cycle time by group">
        {rows.map((row) => (
          <li
            key={row.label}
            className="grid grid-cols-[7rem_1fr_4rem] items-center gap-3 text-sm"
          >
            <span className="flex items-center gap-2 font-medium">
              <span
                aria-hidden
                className="size-2.5 rounded-[2px]"
                style={{ background: row.color }}
              />
              {row.label}
            </span>
            <div className="relative h-6 rounded-md bg-muted/60">
              {row.q ? (
                <>
                  <div
                    className="absolute inset-y-1 rounded-sm"
                    style={{
                      left: x(row.q.p25),
                      width: `max(4px, calc(${x(row.q.p75)} - ${x(row.q.p25)}))`,
                      background: row.color,
                      opacity: 0.45,
                    }}
                    title={`${formatHours(row.q.p25)} to ${formatHours(row.q.p75)}`}
                  />
                  <div
                    className="absolute inset-y-0 w-0.5 -translate-x-1/2 rounded-full"
                    style={{ left: x(row.q.median), background: row.color }}
                    title={`median ${formatHours(row.q.median)}`}
                  />
                </>
              ) : (
                <span className="absolute inset-0 flex items-center px-2 text-xs text-muted-foreground">
                  No merged pull requests
                </span>
              )}
            </div>
            <span className="tabular text-right text-muted-foreground">
              {formatHours(row.q?.median ?? null)}
            </span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
