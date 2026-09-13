import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const alt = "Smart Momo — the command center for your whole school day";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The social preview card shared by every public page. Rendered once at build
 * time; the logo is the same drawing as the favicon.
 */
export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public/icon.svg"));
  const logoSrc = `data:image/svg+xml;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        color: "white",
        background:
          "linear-gradient(135deg, #0a1633 0%, #12275e 55%, #2563eb 130%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <img src={logoSrc} width={88} height={88} alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 44, fontWeight: 800 }}>Smart Momo</span>
          <span
            style={{
              fontSize: 20,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            Learning Management
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <span
          style={{
            fontSize: 68,
            fontWeight: 800,
            lineHeight: 1.08,
            maxWidth: 960,
          }}
        >
          The command center for your whole school day.
        </span>
        <span
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.75)",
            maxWidth: 940,
          }}
        >
          Rosters, lessons, rubric grading, timed assessments and attendance —
          in one place for teachers and students.
        </span>
      </div>
    </div>,
    size,
  );
}
