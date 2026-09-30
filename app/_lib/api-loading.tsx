"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { onApiLoadingChange } from "./api";

const emptySubscribe = () => () => {};

function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function ApiLoadingOverlay() {
  const hydrated = useHydrated();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    return onApiLoadingChange(setActive);
  }, [hydrated]);

  if (!hydrated || !active) return null;

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed right-3 top-20 z-40 rounded-md border border-mc-muted bg-white px-4 py-2 text-sm font-medium text-mc-ink">
      Loading…
    </div>
  );
}
