import { type MetadataRoute } from "next";

import { SITE_DESCRIPTION, SITE_NAME } from "~/server/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} · Learning Management`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#f5f6fb",
    theme_color: "#12275e",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
  };
}
