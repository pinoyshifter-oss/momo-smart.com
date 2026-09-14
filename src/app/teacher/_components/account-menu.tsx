"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { logout } from "~/app/login/actions";
import {
  ChevronDownIcon,
  LockIcon,
  LogoutIcon,
  UserIcon,
} from "~/app/_components/icons";
import { Avatar } from "~/app/_components/ui";

/** The avatar in the top bar: account links and sign-out. */
export function AccountMenu({
  name,
  email,
  photoUrl,
}: {
  name: string;
  email: string;
  photoUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Close on a click outside the menu or on Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "text-ink hover:bg-canvas flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition";

  return (
    <div ref={root} className="relative ml-1">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="hover:bg-canvas flex items-center gap-1 rounded-full p-0.5 pr-1.5 transition"
      >
        <span className="border-line rounded-full border-2">
          <Avatar name={name} src={photoUrl} size="md" />
        </span>
        <ChevronDownIcon
          className={`text-muted size-4 transition ${open ? "rotate-180" : ""}`}
        />
        <span className="sr-only">Account menu</span>
      </button>

      {open && (
        <div
          role="menu"
          className="border-line bg-surface shadow-card absolute top-full right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border"
        >
          <div className="border-line flex items-center gap-3 border-b px-4 py-3">
            <Avatar name={name} src={photoUrl} />
            <div className="min-w-0">
              <p className="text-ink truncate text-sm font-bold">{name}</p>
              <p className="text-muted truncate text-xs">{email}</p>
            </div>
          </div>

          <div className="p-1.5">
            <Link
              href="/teacher/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={item}
            >
              <UserIcon className="text-muted size-4" />
              Profile settings
            </Link>
            <Link
              href="/account/password"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={item}
            >
              <LockIcon className="text-muted size-4" />
              Change password
            </Link>
          </div>

          <form action={logout} className="border-line border-t p-1.5">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              <LogoutIcon className="size-4" />
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
