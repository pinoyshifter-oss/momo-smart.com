"use client";

import { DownloadIcon } from "~/app/_components/icons";

/** Opens the print dialog, where the report can be saved as a PDF. */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="border-line bg-surface text-navy hover:bg-canvas inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition print:hidden"
    >
      <DownloadIcon className="size-4" />
      Download Term Report Card
    </button>
  );
}
