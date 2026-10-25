import { WINDOW_KEYS, type WindowKey } from "@shared/types";
import { cn } from "@/lib/utils";

const LABELS: Record<WindowKey, string> = {
  "30d": "30d",
  "90d": "90d",
  "180d": "180d",
  "365d": "1y",
};

/** The one date-range control; it scopes every number on the page. */
export function WindowSelect({
  value,
  onChange,
}: {
  value: WindowKey;
  onChange: (key: WindowKey) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Time window"
      className="inline-flex h-9 items-center rounded-full border bg-card p-0.5 text-sm"
    >
      {WINDOW_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={cn(
            "h-full cursor-pointer rounded-full px-3 font-medium text-muted-foreground transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            value === key &&
              "bg-primary text-primary-foreground hover:text-primary-foreground",
          )}
        >
          {LABELS[key]}
        </button>
      ))}
    </div>
  );
}
