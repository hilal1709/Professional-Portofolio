/**
 * Komposisi motion graphic "Showreel" — dipakai Remotion Studio/CLI (remotion/index.ts)
 * dan diputar di situs lewat @remotion/player. Hanya import relatif agar bisa dibundel Remotion.
 *
 * Semua teks & jumlah adegan berasal dari props (data CMS). Panjang video dihitung
 * dari data lewat `getShowreelDuration`, jadi menambah milestone/proyek otomatis
 * menambah halaman adegan, dan bagian yang datanya kosong dilewati.
 */
import {
  AbsoluteFill,
  Easing,
  Html5Audio,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { CSSProperties, ReactNode } from "react";
import { MascotSvg } from "../components/mascot/MascotSvg";

import { showreelDefaults, type ShowreelProps } from "./props";

export { showreelDefaults, type ShowreelProps };

/** Lagu orisinal bebas royalti yang dibuat khusus untuk showreel ini (loop 19 detik). */
export const DEFAULT_MUSIC = "audio/showreel-default.mp3";

function musicSrc(music: string) {
  if (!music) return staticFile(DEFAULT_MUSIC);
  return /^https?:\/\//.test(music) ? music : staticFile(music.replace(/^\//, ""));
}

function Music({ music }: { music: string }) {
  const { durationInFrames, fps } = useVideoConfig();
  return (
    <Html5Audio
      src={musicSrc(music)}
      loop
      loopVolumeCurveBehavior="extend"
      // Fade in 0,7 detik dan fade out 1,5 detik di akhir video.
      volume={(f) =>
        interpolate(f, [0, fps * 0.7, durationInFrames - fps * 1.5, durationInFrames - 1], [0, 0.75, 0.75, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      }
    />
  );
}

export const SHOWREEL = { width: 1280, height: 720, fps: 30 };

const PER_PAGE = { milestones: 4, projects: 4, skills: 12 };
const LEN = { intro: 100, campus: 80, timeline: 100, skills: 85, projects: 85, outro: 80 };

const INK = "#221c18";
const PAPER = "#f5eee2";
const RED = "#a3191f";
const display = "'Bricolage Grotesque', 'Plus Jakarta Sans', system-ui, sans-serif";

const ease = Easing.bezier(0.16, 1, 0.3, 1);

function chunk<T>(items: T[], size: number) {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages;
}

/** Ukuran font mengecil untuk teks panjang supaya tidak meluber. */
function fit(text: string, base: number, maxChars: number, min = base * 0.45) {
  return Math.max(min, Math.min(base, (base * maxChars) / Math.max(text.length, 1)));
}

function Rise({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const t = interpolate(frame - delay, [0, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  return (
    <div style={{ ...style, opacity: t, transform: `translateY(${(1 - t) * 50}px)`, filter: `blur(${(1 - t) * 10}px)` }}>
      {children}
    </div>
  );
}

function Intro({ name, tagline }: ShowreelProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12 } });
  const wave = Math.sin(frame / 4) * 16;
  const blink = frame % 70 > 66 ? 0.1 : 1;
  return (
    <AbsoluteFill style={{ background: PAPER, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 60 }}>
      <div style={{ width: 280, height: 420, flexShrink: 0, transform: `scale(${pop})` }}>
        <MascotSvg armR={-135 + wave} armL={6} blink={blink} style={{ width: "100%", height: "100%" }} />
      </div>
      <div style={{ maxWidth: 680 }}>
        <Rise delay={8}>
          <div style={{ fontFamily: display, fontSize: 40, fontWeight: 700, color: RED }}>Halo, aku</div>
        </Rise>
        <Rise delay={14}>
          <div style={{ fontFamily: display, fontSize: fit(name, 120, 10), fontWeight: 800, color: INK, lineHeight: 0.92, letterSpacing: "-0.03em" }}>
            {name}
          </div>
        </Rise>
        {tagline ? (
          <Rise delay={24}>
            <div style={{ fontFamily: display, fontSize: fit(tagline, 30, 90, 22), color: "#5a4e45", marginTop: 24, lineHeight: 1.3 }}>{tagline}</div>
          </Rise>
        ) : null}
      </div>
    </AbsoluteFill>
  );
}

function Campus({ campus, major, batch }: ShowreelProps) {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp", easing: ease });
  const sub = [major, batch].filter(Boolean).join(" · ");
  return (
    <AbsoluteFill style={{ background: RED, justifyContent: "center", padding: 100 }}>
      <div style={{ position: "absolute", inset: 0, background: INK, transform: `translateX(${sweep * 100}%)` }} />
      {sub ? (
        <Rise delay={10}>
          <div style={{ fontFamily: display, fontSize: 44, color: "#ffd9c9", fontWeight: 600 }}>{sub}</div>
        </Rise>
      ) : null}
      <Rise delay={18}>
        <div style={{ fontFamily: display, fontSize: fit(campus, 92, 40), color: PAPER, fontWeight: 800, lineHeight: 0.95, letterSpacing: "-0.03em", maxWidth: 1080 }}>
          {campus}
        </div>
      </Rise>
    </AbsoluteFill>
  );
}

function Timeline({ items, page, pages }: { items: ShowreelProps["milestones"]; page: number; pages: number }) {
  const frame = useCurrentFrame();
  // Garis progres melanjutkan dari halaman sebelumnya.
  const local = interpolate(frame, [0, 80], [0, 1], { extrapolateRight: "clamp", easing: ease });
  const progress = (page + local) / pages;
  return (
    <AbsoluteFill style={{ background: "#9fd0ef" }}>
      <div style={{ position: "absolute", left: 100, right: 100, top: 430, height: 8, background: "#ffffff80", borderRadius: 4 }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", background: RED, borderRadius: 4 }} />
      </div>
      <div style={{ display: "flex", gap: 40, position: "absolute", left: 100, right: 100, top: 210 }}>
        {items.map((m, i) => (
          <Rise key={`${m.year}-${m.title}`} delay={8 + i * 12} style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: display, fontSize: 64, fontWeight: 800, color: INK }}>{m.year}</div>
            <div style={{ fontFamily: display, fontSize: fit(m.title, 28, 22, 20), color: INK, opacity: 0.85, lineHeight: 1.2 }}>{m.title}</div>
          </Rise>
        ))}
      </div>
    </AbsoluteFill>
  );
}

function Skills({ items }: { items: string[] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: PAPER, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center", maxWidth: 1080 }}>
        {items.map((s, i) => {
          const sc = spring({ frame: frame - i * 4, fps, config: { damping: 11, mass: 0.7 } });
          return (
            <div
              key={s}
              style={{
                transform: `scale(${sc}) rotate(${(1 - sc) * (i % 2 ? 12 : -12)}deg)`,
                background: i % 3 === 0 ? RED : INK,
                color: PAPER,
                fontFamily: display,
                fontWeight: 700,
                fontSize: items.length > 8 ? 32 : 40,
                padding: "14px 30px",
                borderRadius: 999,
              }}
            >
              {s}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function Projects({ items }: { items: ShowreelProps["projects"] }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#f39a68" }}>
      {items.map((p, i) => {
        const x = interpolate(frame - i * 10, [0, 26], [1400, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
        return (
          <div
            key={p.title}
            style={{
              position: "absolute",
              left: 100 + i * 40,
              top: 90 + i * 130,
              maxWidth: 1000,
              transform: `translateX(${x}px)`,
              background: p.color,
              color: "#fff",
              fontFamily: display,
              fontSize: fit(p.title, 54, 28, 34),
              fontWeight: 800,
              padding: "26px 40px",
              borderRadius: 24,
              boxShadow: "0 30px 60px -30px rgba(0,0,0,0.5)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {p.title}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

function Outro({ name, outro }: ShowreelProps) {
  const frame = useCurrentFrame();
  const wave = Math.sin(frame / 4) * 16;
  return (
    <AbsoluteFill style={{ background: "#0b1130", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 80 }}>
      <div style={{ width: 200, height: 300 }}>
        <MascotSvg armR={-135 + wave} armL={-6} mouth="open" style={{ width: "100%", height: "100%" }} />
      </div>
      <Rise delay={6}>
        <div style={{ fontFamily: display, fontSize: fit(outro, 84, 22), fontWeight: 800, color: PAPER, letterSpacing: "-0.03em", textAlign: "center" }}>
          {outro}.
        </div>
      </Rise>
      <Rise delay={14}>
        <div style={{ fontFamily: display, fontSize: 32, color: "#f3ead2", opacity: 0.8, textAlign: "center" }}>— {name}</div>
      </Rise>
    </AbsoluteFill>
  );
}

type Scene = { key: string; length: number; node: ReactNode };

function buildScenes(props: ShowreelProps): Scene[] {
  const p = { ...showreelDefaults, ...props };
  const scenes: Scene[] = [
    { key: "intro", length: LEN.intro, node: <Intro {...p} /> },
    { key: "campus", length: LEN.campus, node: <Campus {...p} /> },
  ];
  const ms = chunk(p.milestones, PER_PAGE.milestones);
  ms.forEach((items, i) => scenes.push({ key: `timeline-${i}`, length: LEN.timeline, node: <Timeline items={items} page={i} pages={ms.length} /> }));
  chunk(p.skills, PER_PAGE.skills).forEach((items, i) => scenes.push({ key: `skills-${i}`, length: LEN.skills, node: <Skills items={items} /> }));
  chunk(p.projects, PER_PAGE.projects).forEach((items, i) => scenes.push({ key: `projects-${i}`, length: LEN.projects, node: <Projects items={items} /> }));
  scenes.push({ key: "outro", length: LEN.outro, node: <Outro {...p} /> });
  return scenes;
}

/** Durasi total (frame) mengikuti jumlah data. Dipakai Player dan calculateMetadata Remotion. */
export function getShowreelDuration(props: ShowreelProps) {
  return buildScenes(props).reduce((sum, s) => sum + s.length, 0);
}

export function Showreel(props: ShowreelProps) {
  const scenes = buildScenes(props);
  const starts = scenes.map((_, i) => scenes.slice(0, i).reduce((sum, s) => sum + s.length, 0));
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      {props.music !== null ? <Music music={props.music ?? ""} /> : null}
      {scenes.map((s, i) => (
        <Sequence key={s.key} from={starts[i]} durationInFrames={s.length} premountFor={10}>
          {s.node}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
