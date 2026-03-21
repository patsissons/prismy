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

  return (
    <Card className="overflow-hidden p-5 md:p-7">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-display text-4xl font-extrabold tracking-[-0.04em]">{title}</h2>
          <p className="mt-2 max-w-2xl text-lg text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="mt-6 rounded bg-surface/80 p-4 md:p-6">
        <div className="grid min-h-[360px] grid-cols-[repeat(auto-fit,minmax(56px,1fr))] items-end gap-4 bg-editorial-grid bg-[size:32px_32px] px-1 py-5">
          {data.map((bucket) => (
            <div key={bucket.bucketKey} className="flex flex-col items-center gap-4">
              <div className="flex h-[280px] w-full items-end justify-center">
                <div
                  className="flex w-full max-w-[90px] flex-col overflow-hidden rounded-sm bg-surface-high/60"
                  style={{ height: `${Math.max(10, (bucket.totalValue / maxValue) * 100)}%` }}
                  title={describeBucket(bucket, users, metric)}
                >
                  {users.map((user) => {
                    const value = bucket.totals[user.login] ?? 0;
                    const height = bucket.totalValue ? (value / bucket.totalValue) * 100 : 0;

                    if (height <= 0) {
                      return null;
                    }

                    return <div key={user.login} style={{ height: `${height}%`, backgroundColor: user.color }} />;
                  })}
                </div>
              </div>
              <div className="text-center font-body text-xs uppercase tracking-[0.26em] text-muted-foreground">{bucket.bucketLabel}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-4 border-t border-border/10 pt-6">
          {users.map((user) => (
            <div key={user.login} className="flex items-center gap-3 text-sm uppercase tracking-[0.18em] text-foreground/86">
              <span className="inline-block h-3.5 w-3.5 rounded-[2px]" style={{ backgroundColor: user.color }} />
              {user.name}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function describeBucket(
  bucket: BucketSeriesDatum,
  users: { login: string; name: string }[],
  metric: MetricKey
) {
  const parts = users
    .map((user) => {
      const value = bucket.totals[user.login] ?? 0;
      if (!value) {
        return null;
      }

      return `${user.name}: ${metric === "duration" ? formatDurationDays(value) : Math.round(value)}`;
    })
    .filter(Boolean);

  return `${bucket.bucketLabel} • ${parts.join(" • ")}`;
}
