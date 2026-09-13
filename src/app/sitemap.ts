import { type MetadataRoute } from "next";

import { SITE_URL } from "~/server/site";

/** The public, indexable pages. Everything else sits behind sign-in. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: new URL("/", SITE_URL).href,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/demo", SITE_URL).href,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: new URL("/register", SITE_URL).href,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
