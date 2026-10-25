import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { resolveWindow } from "@shared/metrics/window";
import {
  DEFAULT_WINDOW,
  isWindowKey,
  type TimeWindow,
  type WindowKey,
} from "@shared/types";

export interface WindowSelection {
  key: WindowKey;
  window: TimeWindow;
  /** The instant the window was resolved against; stable per key. */
  now: Date;
  setKey: (key: WindowKey) => void;
}

/** The `?window=` query parameter, resolved once per change. */
export function useWindow(): WindowSelection {
  const [params, setParams] = useSearchParams();
  const raw = params.get("window");
  const key = isWindowKey(raw) ? raw : DEFAULT_WINDOW;
  // A fresh "now" per key keeps every metric on the page on the same clock
  // without re-resolving on each render.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- key is the reset trigger
  const now = useMemo(() => new Date(), [key]);
  const window = useMemo(() => resolveWindow(key, now), [key, now]);
  const setKey = useCallback(
    (next: WindowKey) => {
      setParams(
        (current) => {
          const copy = new URLSearchParams(current);
          if (next === DEFAULT_WINDOW) copy.delete("window");
          else copy.set("window", next);
          return copy;
        },
        { replace: true },
      );
    },
    [setParams],
  );
  return { key, window, now, setKey };
}
