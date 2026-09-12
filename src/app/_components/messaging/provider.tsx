"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useCallback, useMemo, useRef } from "react";

let client: ConvexReactClient | null = null;
function clientFor(url: string) {
  client ??= new ConvexReactClient(url);
  return client;
}

/** Fetch a fresh token a few minutes before the one-hour token expires. */
const REFRESH_MARGIN_MS = 5 * 60_000;

/**
 * Bridges the NextAuth session to Convex: the page is only rendered for a
 * signed-in user, and the app's token route vouches for who that is.
 */
function useMessagingAuth() {
  const cached = useRef<{ token: string; expiresAt: number } | null>(null);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      const current = cached.current;
      if (
        !forceRefreshToken &&
        current &&
        current.expiresAt - REFRESH_MARGIN_MS > Date.now()
      ) {
        return current.token;
      }
      const response = await fetch("/api/messaging/token", {
        cache: "no-store",
      });
      if (!response.ok) return null;
      cached.current = (await response.json()) as {
        token: string;
        expiresAt: number;
      };
      return cached.current.token;
    },
    [],
  );

  return useMemo(
    () => ({ isLoading: false, isAuthenticated: true, fetchAccessToken }),
    [fetchAccessToken],
  );
}

/** Convex is mounted only around the messaging screens. */
export function MessagingProvider({
  url,
  children,
}: {
  url: string;
  children: React.ReactNode;
}) {
  return (
    <ConvexProviderWithAuth client={clientFor(url)} useAuth={useMessagingAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}
