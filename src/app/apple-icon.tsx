import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Ikon layar utama iOS: kepala maskot yang sama dengan favicon. */
export default async function AppleIcon() {
  const svg = await readFile(join(process.cwd(), "src/app/icon.svg"), "utf8");
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f5eee2" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse butuh <img> biasa */}
        <img src={src} width={180} height={180} alt="" />
      </div>
    ),
    size,
  );
}
