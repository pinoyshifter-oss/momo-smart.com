import { type MetadataRoute } from "next";

import { SITE_URL } from "~/server/site";

/**
 * Crawlers get the marketing pages only. The signed-in areas redirect to
 * /login anyway; /login itself stays crawlable so its noindex tag is seen.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/teacher", "/student", "/superadmin", "/api/"],
    },
    sitemap: new URL("/sitemap.xml", SITE_URL).href,
    host: SITE_URL.origin,
  };
}
