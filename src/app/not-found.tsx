import { type Metadata } from "next";
import Link from "next/link";

import { Wordmark } from "~/app/_components/brand";
import { ArrowRightIcon } from "~/app/_components/icons";
import { PeekingDog } from "~/app/_components/peeking-dog";
import { RedirectCountdown } from "~/app/_components/redirect-countdown";

export const metadata: Metadata = {
  title: "Page not found",
  // Overrides the root layout's "index, follow", which would otherwise sit
  // beside the "noindex" Next.js adds to every 404 response.
  robots: { index: false, follow: true },
};

const REDIRECT_SECONDS = 5;

/**
 * Every unknown URL lands here. The response keeps its 404 status — so search
 * engines drop dead links — and the visitor is sent home after a short pause.
 */
export default function NotFound() {
  return (
    <div className="bg-canvas flex min-h-screen flex-col">
      <header className="border-line/80 bg-surface/85 border-b">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
          <Wordmark label="Learning Management" />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-20">
        {/* The dog pops up over the card's top edge, near its right corner. */}
        <div className="relative isolate w-full max-w-lg">
          <PeekingDog side="top" />
          <div className="border-line bg-surface shadow-card relative z-10 rounded-3xl border p-8 text-center sm:p-10">
            <p className="text-brand text-xs font-bold tracking-[0.14em] uppercase">
              Error 404
            </p>
            <h1 className="text-ink mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Page not found
            </h1>
            <p className="text-muted mt-3 text-[15px]">
              The page you&apos;re looking for doesn&apos;t exist or has moved.
            </p>
            <Link
              href="/"
              className="group bg-navy hover:bg-navy-deep mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold text-white transition"
            >
              Back to home
              <ArrowRightIcon className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
            <RedirectCountdown
              to="/"
              seconds={REDIRECT_SECONDS}
              destination="the home page"
            />
          </div>
        </div>
      </main>

      <footer className="border-line bg-surface border-t">
        <div className="text-muted mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm sm:flex-row">
          <Wordmark href="/" />
          <p>© 2026 Smart Momo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
