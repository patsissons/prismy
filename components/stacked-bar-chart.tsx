import { useState } from "react";

import { Card } from "@/components/ui/card";
import type { BucketSeriesDatum, MetricKey } from "@/lib/types";
import { formatDurationDays } from "@/lib/utils";

export function StackedBarChart({
  title,
  subtitle,
  data,
  users,
  metric
}: {
  title: string;
  subtitle: string;
  data: BucketSeriesDatum[];
  users: { login: string; name: string; color: string }[];
  metric: MetricKey;
}) {
  const maxValue = Math.max(...data.map((item) => item.totalValue), 1);
  const [hoveredSegment, setHoveredSegment] = useState<{
    x: number;
    y: number;
    bucketLabel: string;
    bucketDateLabel: string;
    bucketTotal: number;
    userName: string;
    userColor: string;
    metricValue: number;
    totalForRange: number;
  } | null>(null);
  const totalsByUser = Object.fromEntries(
    users.map((user) => [
      user.login,
      data.reduce((sum, bucket) => sum + (bucket.totals[user.login] ?? 0), 0)
    ])
  );

  return (
    <Card className="overflow-hidden p-5 md:p-7">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-display text-4xl font-extrabold tracking-[-0.04em]">{title}</h2>
          <p className="mt-2 max-w-2xl text-lg text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="relative mt-6 min-w-0 rounded bg-surface/80 p-4 md:p-6">
        <div
          className="grid min-h-[360px] min-w-0 items-end gap-3 bg-editorial-grid bg-[size:32px_32px] px-1 py-5"
          style={{ gridTemplateColumns: `repeat(${Math.max(data.length, 1)}, minmax(0, 1fr))` }}
        >
          {data.map((bucket) => (
            <div key={bucket.bucketKey} className="flex min-w-0 flex-col items-center gap-4">
              <div className="flex h-[280px] w-full items-end justify-center">
                <div
                  className="flex w-full max-w-[76px] min-w-0 flex-col overflow-hidden rounded-sm bg-surface-high/60"
                  style={{ height: `${Math.max(10, (bucket.totalValue / maxValue) * 100)}%` }}
                >
                  {users.map((user) => {
                    const value = bucket.totals[user.login] ?? 0;
                    const height = bucket.totalValue ? (value / bucket.totalValue) * 100 : 0;
                    const bucketDateLabel = formatBucketDateLabel(bucket.bucketKey);

                    if (height <= 0) {
                      return null;
                    }

                    return (
                      <button
                        key={user.login}
                        type="button"
                        className="w-full transition hover:brightness-110 focus:brightness-110"
                        style={{ height: `${height}%`, backgroundColor: user.color }}
                        aria-label={describeSegment(bucket.bucketLabel, user.name, value, bucket.totalValue, totalsByUser[user.login] ?? 0, metric)}
                        onMouseEnter={(event) =>
                          setHoveredSegment({
                            x: event.clientX,
                            y: event.clientY,
                            bucketLabel: bucket.bucketLabel,
                            bucketDateLabel,
                            bucketTotal: bucket.totalValue,
                            userName: user.name,
                            userColor: user.color,
                            metricValue: value,
                            totalForRange: totalsByUser[user.login] ?? 0
                          })
                        }
                        onMouseMove={(event) =>
                          setHoveredSegment((current) =>
                            current
                              ? {
                                  ...current,
                                  x: event.clientX,
                                  y: event.clientY
                                }
                              : current
                          )
                        }
                        onMouseLeave={() => setHoveredSegment(null)}
                        onFocus={(event) => {
                          const rect = event.currentTarget.getBoundingClientRect();
                          setHoveredSegment({
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                            bucketLabel: bucket.bucketLabel,
                            bucketDateLabel,
                            bucketTotal: bucket.totalValue,
                            userName: user.name,
                            userColor: user.color,
                            metricValue: value,
                            totalForRange: totalsByUser[user.login] ?? 0
                          });
                        }}
                        onBlur={() => setHoveredSegment(null)}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="text-center font-body text-xs uppercase tracking-[0.26em] text-muted-foreground">{bucket.bucketLabel}</div>
            </div>
          ))}
        </div>

        {hoveredSegment ? (
          <div
            className="pointer-events-none fixed z-50 w-[220px] rounded-sm border border-border/40 bg-surface-low/95 p-3 shadow-2xl backdrop-blur"
            style={{
              left: Math.min(hoveredSegment.x + 14, typeof window !== "undefined" ? window.innerWidth - 236 : hoveredSegment.x + 14),
              top: Math.max(16, hoveredSegment.y - 18)
            }}
          >
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-[2px]" style={{ backgroundColor: hoveredSegment.userColor }} />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-foreground">{hoveredSegment.userName}</div>
                {hoveredSegment.bucketLabel.length > 1 ? (
                  <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{hoveredSegment.bucketLabel}</div>
                ) : null}
                <div className="mt-1 text-xs text-muted-foreground">{hoveredSegment.bucketDateLabel}</div>
              </div>
            </div>

            <div className="mt-3 space-y-1.5 text-sm text-foreground/88">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{metricLabel(metric)}</span>
                <span>{formatMetricValue(hoveredSegment.metricValue, metric)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Bucket share</span>
                <span>{formatPercentage(hoveredSegment.metricValue, hoveredSegment.bucketTotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Visible range total</span>
                <span>{formatMetricValue(hoveredSegment.totalForRange, metric)}</span>
              </div>
            </div>
          </div>
        ) : null}

      </div>
    </Card>
  );
}

function describeSegment(
  bucketLabel: string,
  userName: string,
  metricValue: number,
  bucketTotal: number,
  totalForRange: number,
  metric: MetricKey
) {
  return `${userName} in ${bucketLabel}: ${formatMetricValue(metricValue, metric)}. ${formatPercentage(metricValue, bucketTotal)} of bucket. ${formatMetricValue(totalForRange, metric)} in visible range.`;
}

function metricLabel(metric: MetricKey) {
  return metric === "duration" ? "Duration" : metric === "merged" ? "Merged PRs" : "Created PRs";
}

function formatMetricValue(value: number, metric: MetricKey) {
  if (metric === "duration") {
    return formatDurationDays(value);
  }

  return `${Math.round(value)}`;
}

function formatPercentage(value: number, total: number) {
  if (!total) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}

function formatBucketDateLabel(bucketKey: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(bucketKey)) {
    const date = new Date(`${bucketKey}T00:00:00`);
    return `${new Intl.DateTimeFormat("en", { weekday: "long" }).format(date)}, ${bucketKey}`;
  }

  return bucketKey;
}
