"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { api } from "@convex/_generated/api";
import { ChatIcon } from "~/app/_components/icons";
import { Dossier } from "./dossier";
import { Inbox } from "./inbox";
import { NewMessageDialog } from "./new-message";
import type { Contact, Viewer } from "./shared";
import { ThreadView } from "./thread";

/**
 * Three-pane messaging: inbox, live thread and recipient details. On narrow
 * screens the inbox and thread swap places and details open as a drawer.
 */
export function MessagesHub({
  viewer,
  contacts,
  basePath,
}: {
  viewer: Viewer;
  contacts: Contact[];
  basePath: string;
}) {
  const selectedId = useSearchParams().get("c");
  const { isAuthenticated, isLoading } = useConvexAuth();
  const threads = useQuery(api.messaging.inbox, isAuthenticated ? {} : "skip");
  const [composing, setComposing] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const active = threads?.find((thread) => thread.id === selectedId) ?? null;
  const disconnected = !isLoading && !isAuthenticated;

  // Switching threads is a shallow URL change: Next keeps useSearchParams in
  // step with the History API, so the server page is not rendered again.
  // Opening a thread pushes an entry, so Back returns to the inbox on phones.
  const select = useCallback(
    (id: string | null, mode: "push" | "replace" = "push") => {
      setDetailsOpen(false);
      setComposing(false);
      const url = id ? `${basePath}?c=${encodeURIComponent(id)}` : basePath;
      if (mode === "push") window.history.pushState(null, "", url);
      else window.history.replaceState(null, "", url);
    },
    [basePath],
  );

  // On wide screens open the latest conversation rather than an empty pane.
  useEffect(() => {
    if (selectedId || !threads?.[0]) return;
    if (window.matchMedia("(min-width: 1024px)").matches) {
      select(threads[0].id, "replace");
    }
  }, [selectedId, threads, select]);

  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="border-line bg-surface shadow-card grid h-[calc(100dvh-8rem)] min-h-[560px] overflow-hidden rounded-2xl border lg:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)_320px]">
        <Inbox
          threads={threads}
          viewer={viewer}
          activeId={active?.id ?? null}
          onSelect={select}
          onCompose={() => setComposing(true)}
          className={active ? "hidden lg:flex" : "flex"}
        />

        <section
          className={`min-h-0 min-w-0 flex-col ${active ? "flex" : "hidden lg:flex"}`}
        >
          {active && !disconnected ? (
            <ThreadView
              key={active.id}
              summary={active}
              viewer={viewer}
              onBack={() => select(null)}
              onShowDetails={() => setDetailsOpen(true)}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="bg-brand-soft text-brand flex size-12 items-center justify-center rounded-full">
                <ChatIcon className="size-6" />
              </span>
              <p className="text-ink text-sm font-bold">
                {disconnected
                  ? "Messaging couldn't connect"
                  : "Select a conversation"}
              </p>
              <p className="text-muted max-w-xs text-xs">
                {disconnected
                  ? "Refresh the page to try again. If it keeps happening, messaging may not be set up on this server."
                  : "Pick a thread on the left, or start a new one with New Message."}
              </p>
            </div>
          )}
        </section>

        {active ? (
          <aside
            className={`border-line bg-surface min-h-0 flex-col border-l ${
              detailsOpen
                ? "fixed inset-y-0 right-0 z-40 flex w-full max-w-sm shadow-2xl"
                : "hidden"
            } 2xl:static 2xl:z-auto 2xl:flex 2xl:w-auto 2xl:max-w-none 2xl:shadow-none`}
          >
            <Dossier
              members={active.others}
              viewer={viewer}
              onClose={() => setDetailsOpen(false)}
            />
          </aside>
        ) : (
          <aside className="border-line text-muted hidden items-center justify-center border-l p-8 text-center text-xs 2xl:flex">
            Details about the person you&apos;re messaging appear here.
          </aside>
        )}
      </div>

      {detailsOpen && (
        <button
          type="button"
          aria-label="Close details"
          onClick={() => setDetailsOpen(false)}
          className="bg-ink/30 fixed inset-0 z-30 cursor-default 2xl:hidden"
        />
      )}

      {composing && (
        <NewMessageDialog
          contacts={contacts}
          threads={threads ?? []}
          onClose={() => setComposing(false)}
          onOpen={select}
        />
      )}
    </div>
  );
}
