"use client";

import { useEffect, useState } from "react";

export function useLocalStorageState<T>(loadValue: () => T, saveValue: (value: T) => void) {
  const [value, setValue] = useState<T>(loadValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setValue(loadValue());
    setReady(true);
  }, [loadValue]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    saveValue(value);
  }, [ready, saveValue, value]);

  return [value, setValue, ready] as const;
}
