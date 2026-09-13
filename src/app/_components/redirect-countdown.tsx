"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Counts down, then replaces the current page with `to`. Replacing rather
 * than pushing keeps the dead URL out of the back-button history.
 */
export function RedirectCountdown({
  to,
  seconds,
  destination,
}: {
  to: string;
  seconds: number;
  /** Where `to` leads, in words, e.g. "the home page". */
  destination: string;
}) {
  const router = useRouter();
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (left <= 0) {
      router.replace(to);
      return;
    }
    const timer = setTimeout(() => setLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [left, router, to]);

  return (
    <p className="text-muted mt-4 text-sm" aria-live="polite">
      {left > 0
        ? `Taking you to ${destination} in ${left} second${left === 1 ? "" : "s"}…`
        : `Taking you to ${destination}…`}
    </p>
  );
}
