/**
 * Lapisan lanskap parallax: bukit jauh → kota Gresik (pabrik semen, kampus, masjid) → tanah dekat.
 * Semua bentuk geometris vektor; tiap lapisan digerakkan GSAP dengan kecepatan berbeda.
 */

export function FarHills({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden>
      <path d="M0 210 C180 150 320 170 470 200 C640 232 760 140 940 150 C1110 160 1260 220 1440 180 L1440 320 L0 320 Z" fill="#a9c3b6" />
      <path d="M0 250 C160 220 300 240 460 250 C640 262 820 200 1000 214 C1180 228 1300 262 1440 240 L1440 320 L0 320 Z" fill="#8fae9b" />
    </svg>
  );
}

export function CityLayer({ className }: { className?: string }) {
  const windows = (x: number, y: number, cols: number, rows: number, w = 10, h = 12, gx = 8, gy = 10) =>
    Array.from({ length: cols * rows }, (_, i) => (
      <rect
        key={`${x}-${y}-${i}`}
        x={x + (i % cols) * (w + gx)}
        y={y + Math.floor(i / cols) * (h + gy)}
        width={w}
        height={h}
        rx="1.5"
        fill="#f7e9c8"
        opacity="0.85"
      />
    ));

  return (
    <svg viewBox="0 0 1440 360" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden>
      {/* Pabrik semen: silo, menara preheater, kiln, cerobong */}
      <g fill="#9b968f">
        <rect x="90" y="150" width="46" height="210" rx="6" />
        <rect x="142" y="130" width="46" height="230" rx="6" />
        <rect x="194" y="160" width="46" height="200" rx="6" />
        <ellipse cx="113" cy="150" rx="23" ry="7" fill="#aaa59e" />
        <ellipse cx="165" cy="130" rx="23" ry="7" fill="#aaa59e" />
        <ellipse cx="217" cy="160" rx="23" ry="7" fill="#aaa59e" />
      </g>
      <g fill="#86817a">
        <rect x="270" y="70" width="70" height="290" />
        <rect x="262" y="100" width="86" height="10" />
        <rect x="262" y="160" width="86" height="10" />
        <rect x="262" y="220" width="86" height="10" />
        <rect x="262" y="280" width="86" height="10" />
        <rect x="292" y="40" width="26" height="30" />
      </g>
      <rect x="340" y="250" width="230" height="30" rx="15" fill="#8f8a83" transform="rotate(-6 340 265)" />
      <rect x="600" y="60" width="26" height="300" fill="#7d786f" />
      <rect x="596" y="60" width="34" height="10" fill="#a3191f" />
      <rect x="596" y="100" width="34" height="8" fill="#f5eee2" />
      <g className="smoke" fill="#ffffff" opacity="0.7">
        <circle cx="613" cy="40" r="16" />
        <circle cx="636" cy="22" r="20" />
        <circle cx="666" cy="8" r="24" />
      </g>

      {/* Gedung kampus UISI (siluet modern) */}
      <g>
        <rect x="760" y="150" width="250" height="210" rx="4" fill="#c5b49a" />
        <rect x="760" y="140" width="250" height="16" fill="#a3191f" />
        <rect x="840" y="110" width="90" height="40" fill="#b5a387" />
        {windows(780, 176, 10, 6, 14, 14, 9, 12)}
        <rect x="868" y="310" width="34" height="50" fill="#7a1116" />
      </g>

      {/* Masjid & rumah — Gresik kota santri */}
      <g fill="#b9a58a">
        <rect x="1080" y="250" width="120" height="110" />
        <path d="M1100 250 Q1140 180 1180 250 Z" fill="#5f7d4f" />
        <rect x="1215" y="170" width="16" height="190" />
        <path d="M1215 170 L1223 146 L1231 170 Z" fill="#5f7d4f" />
        <rect x="1260" y="280" width="80" height="80" />
        <path d="M1252 282 L1300 246 L1348 282 Z" fill="#a3191f" />
        <rect x="1360" y="300" width="70" height="60" />
        <path d="M1354 302 L1395 272 L1436 302 Z" fill="#7a1116" />
      </g>
      <rect x="0" y="352" width="1440" height="8" fill="#8f8b85" />
    </svg>
  );
}

export function NearGround({ className }: { className?: string }) {
  const trees = [60, 210, 420, 980, 1180, 1370];
  return (
    <svg viewBox="0 0 1440 220" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden>
      <path d="M0 110 C240 70 480 90 720 100 C960 110 1200 70 1440 96 L1440 220 L0 220 Z" fill="#6f8f5a" />
      {trees.map((x, i) => (
        <g key={x}>
          <rect x={x - 5} y={60 + (i % 2) * 10} width="10" height="50" fill="#5b4632" />
          <circle cx={x} cy={52 + (i % 2) * 10} r={30 + (i % 3) * 6} fill="#4f7442" />
          <circle cx={x + 18} cy={64 + (i % 2) * 10} r="20" fill="#5f8a4f" />
        </g>
      ))}
      <path d="M0 170 C360 150 1080 150 1440 170 L1440 220 L0 220 Z" fill="#cdb994" />
      <path d="M0 192 C360 176 1080 176 1440 192" stroke="#f5eee2" strokeWidth="4" strokeDasharray="34 26" fill="none" />
    </svg>
  );
}

export function Cloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 80" className={className} aria-hidden>
      <g fill="#ffffff">
        <ellipse cx="60" cy="50" rx="50" ry="26" />
        <ellipse cx="110" cy="38" rx="44" ry="32" />
        <ellipse cx="150" cy="54" rx="40" ry="22" />
      </g>
    </svg>
  );
}
