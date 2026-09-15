import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Jed Gabriel Seno — COBOL Developer · AI Engineer · People Manager";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Satori has no built-in monospace, so the terminal font ships with the route. */
async function plexMono(weight: "Regular" | "Bold") {
  return readFile(join(process.cwd(), "assets", `IBMPlexMono-${weight}.ttf`));
}

export default async function OpengraphImage() {
  const [regular, bold] = await Promise.all([plexMono("Regular"), plexMono("Bold")]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#050705",
          color: "#3BF07A",
          fontFamily: "IBM Plex Mono",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        <div style={{ color: "#1F8F45", fontSize: 28 }}>{"=".repeat(40)}</div>
        <div
          style={{
            color: "#C8FFD9",
            fontSize: 72,
            fontWeight: 700,
            margin: "20px 0",
            letterSpacing: "0.02em",
          }}
        >
          JED GABRIEL SENO
        </div>
        <div style={{ fontSize: 30 }}>COBOL DEVELOPER · AI ENGINEER · MANAGER</div>
        <div style={{ color: "#1F8F45", fontSize: 26, marginTop: 16 }}>
          9 years · DXC Technology · Philippines
        </div>
        <div style={{ color: "#FFB84D", fontSize: 26, marginTop: 40 }}>
          jed@profile ~ % ask anything
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "IBM Plex Mono", data: regular, style: "normal", weight: 400 },
        { name: "IBM Plex Mono", data: bold, style: "normal", weight: 700 },
      ],
    },
  );
}
