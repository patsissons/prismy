import type { Granularity } from "@shared/metrics/window";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Granularity; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
];

/** Per-week or per-day buckets for a time-series chart; a view choice, not a filter. */
export function GranularityToggle({
  value,
  onChange,
}: {
  value: Granularity;
  onChange: (value: Granularity) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Granularity"
      className="inline-flex rounded-md border p-0.5"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-7 cursor-pointer rounded px-2 text-xs font-medium text-muted-foreground transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            value === option.value && "bg-muted text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
