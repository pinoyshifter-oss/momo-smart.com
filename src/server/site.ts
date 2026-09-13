import { type Metadata } from "next";

import { env } from "~/env";

/** Identity used by page metadata, social previews and structured data. */
export const SITE_NAME = "Smart Momo";

export const SITE_TITLE = "Smart Momo · Learning Management System for Schools";

export const SITE_DESCRIPTION =
  "Smart Momo is a learning management system for schools: rosters, lessons, rubric grading, timed assessments, period attendance and early-intervention alerts — one command center for the whole school day.";

/**
 * Absolute origin for canonical URLs, the sitemap and social previews. Set
 * SITE_URL once the app has its own domain; until then Vercel's production
 * domain is used, and localhost in development.
 */
export const SITE_URL = new URL(
  env.SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
);

/**
 * Open Graph and Twitter tags for a public page. Next.js replaces these
 * objects per page rather than merging them, so every page that sets its own
 * title passes the full set through here.
 */
export function socialMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      title,
      description,
      url: path,
      // A page's own `openGraph` hides the image inherited from
      // app/opengraph-image.tsx, so point at it explicitly.
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SHARE_IMAGE],
    },
  };
}

/** The card rendered by app/opengraph-image.tsx. */
const SHARE_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Smart Momo — the command center for your whole school day",
};
