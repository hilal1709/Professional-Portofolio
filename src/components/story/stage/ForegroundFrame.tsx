import type gsap from "gsap";

/**
 * Bingkai depan kamera (padanan "mountain-gate" di referensi): dedaunan & semak di tepi layar.
 * Saat pindah babak, bingkai ini membesar + blur melewati kamera sehingga terasa "masuk" ke dunia berikutnya.
 */
function LeafCluster({ className, flip = false }: { className?: string; flip?: boolean }) {
  const leaves: [number, number, number, number, number, string][] = [
    // cx, cy, rx, ry, rotate, color
    [40, 40, 70, 26, 28, "#4f7442"],
    [95, 18, 60, 22, 8, "#5f8a4f"],
    [20, 105, 62, 22, 62, "#3f6236"],
    [140, 55, 52, 18, 22, "#6f9a5c"],
    [70, 120, 48, 17, 48, "#5f8a4f"],
    [175, 20, 44, 15, -6, "#4f7442"],
    [25, 175, 46, 16, 78, "#4f7442"],
  ];
  return (
    <svg viewBox="0 0 240 240" className={className} style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden>
      <path d="M-10 -10 Q90 60 230 30" stroke="#5b4632" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M-10 -10 Q40 100 20 230" stroke="#5b4632" strokeWidth="6" fill="none" strokeLinecap="round" />
      {leaves.map(([cx, cy, rx, ry, r, c], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill={c} transform={`rotate(${r} ${cx} ${cy})`} />
      ))}
      <circle cx="118" cy="92" r="7" fill="#a3191f" />
      <circle cx="58" cy="150" r="5" fill="#f3ead2" />
    </svg>
  );
}

function Bushes({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className={className} aria-hidden>
      <path
        d="M0 160 L0 90 Q60 30 130 80 Q170 20 240 70 Q290 40 330 95 L330 160 Z M1110 160 L1110 95 Q1150 40 1210 75 Q1270 15 1330 70 Q1390 35 1440 85 L1440 160 Z"
        fill="#3f6236"
      />
      <path d="M0 160 L0 120 Q80 80 160 115 Q220 90 280 130 L280 160 Z M1160 160 L1160 130 Q1230 90 1300 120 Q1370 85 1440 115 L1440 160 Z" fill="#2f4a28" />
    </svg>
  );
}

export function ForegroundFrame() {
  return (
    <div aria-hidden className="fg-frame pointer-events-none fixed inset-0 z-30 origin-center will-change-transform">
      <div className="fg-tone absolute inset-0">
        <LeafCluster className="absolute -left-6 -top-6 w-[clamp(120px,22vw,300px)]" />
        <LeafCluster flip className="absolute -right-6 -top-6 w-[clamp(110px,20vw,280px)]" />
        <Bushes className="absolute inset-x-0 -bottom-2 h-[clamp(60px,12vh,140px)] w-full" />
      </div>
    </div>
  );
}

/** Kamera menembus bingkai depan pada posisi `at` (satuan timeline). */
export function addPassThrough(tl: gsap.core.Timeline, at: number, dur = 1) {
  const half = dur * 0.5;
  tl.to(".fg-frame", { scale: 2.6, opacity: 0, filter: "blur(14px)", duration: half, ease: "power2.in" }, at)
    .set(".fg-frame", { scale: 0.82, filter: "blur(8px)" }, at + half)
    .to(".fg-frame", { scale: 1, opacity: 1, filter: "blur(0px)", duration: half, ease: "power2.out" }, at + half);
}
