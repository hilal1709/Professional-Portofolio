import type { CSSProperties } from "react";

/**
 * Maskot Hilal: rambut hitam berponi, kemeja merah SISFOR-9, celana cargo khaki.
 * Komponen murni (tanpa hook) supaya bisa dipakai di situs maupun di komposisi Remotion.
 * Sudut lengan/kaki bisa dikendalikan lewat props (Remotion) atau dianimasikan lewat
 * class `.arm-l/.arm-r/.leg-l/.leg-r/.eyes/.body-bob` (anime.js di situs).
 */
export type MascotSvgProps = {
  armL?: number;
  armR?: number;
  legL?: number;
  legR?: number;
  blink?: number; // 1 = mata terbuka, 0 = tertutup
  bob?: number; // geser vertikal badan (px viewBox)
  mouth?: "smile" | "open";
  /** Ransel di punggung (babak Perjalanan → zoom masuk ke ransel). */
  backpack?: boolean;
  className?: string;
  style?: CSSProperties;
  title?: string;
};

const C = {
  skin: "#f1c7a0",
  skinShade: "#e2ad84",
  hair: "#1d1a1a",
  shirt: "#a3191f",
  shirtDeep: "#7a1116",
  tee: "#1e1b1b",
  pants: "#cdb994",
  pantsDeep: "#a8936c",
  shoe: "#2a2422",
  blush: "#e88f7f",
  ink: "#221c18",
};

export function MascotSvg({
  armL = 0,
  armR = 0,
  legL = 0,
  legR = 0,
  blink = 1,
  bob = 0,
  mouth = "smile",
  backpack = false,
  className,
  style,
  title = "Maskot Hilal",
}: MascotSvgProps) {
  return (
    <svg
      viewBox="0 0 200 300"
      className={`mascot ${className ?? ""}`}
      style={style}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
    >
      <ellipse cx="100" cy="294" rx="52" ry="6" fill="#000" opacity="0.14" />

      {/* Kaki */}
      <g className="leg leg-l" style={{ transform: `rotate(${legL}deg)` }}>
        <rect x="68" y="218" width="30" height="66" rx="9" fill={C.pants} />
        <rect x="70" y="244" width="13" height="17" rx="3" fill={C.pantsDeep} />
        <ellipse cx="80" cy="286" rx="19" ry="8" fill={C.shoe} />
      </g>
      <g className="leg leg-r" style={{ transform: `rotate(${legR}deg)` }}>
        <rect x="102" y="218" width="30" height="66" rx="9" fill={C.pants} />
        <ellipse cx="121" cy="286" rx="19" ry="8" fill={C.shoe} />
      </g>

      <g className="body-bob" style={{ transform: `translateY(${bob}px)` }}>
        {backpack ? (
          <g className="backpack">
            <rect x="34" y="146" width="40" height="70" rx="14" fill="#5a3d2b" />
            <rect x="38" y="178" width="32" height="26" rx="8" fill="#6f4c36" />
            <rect x="46" y="184" width="16" height="4" rx="2" fill="#cdb994" />
          </g>
        ) : null}
        {/* Lengan belakang (kanan karakter, kiri layar) */}
        <g className="arm arm-l" style={{ transform: `rotate(${armL}deg)` }}>
          <rect x="44" y="140" width="22" height="72" rx="11" fill={C.shirt} />
          <rect x="44" y="198" width="22" height="9" rx="3" fill={C.shirtDeep} />
          <circle cx="55" cy="216" r="10" fill={C.skin} />
        </g>
        <g className="arm arm-r" style={{ transform: `rotate(${armR}deg)` }}>
          <rect x="134" y="140" width="22" height="72" rx="11" fill={C.shirt} />
          <rect x="134" y="198" width="22" height="9" rx="3" fill={C.shirtDeep} />
          <circle cx="145" cy="216" r="10" fill={C.skin} />
        </g>

        {/* Badan / kemeja */}
        <path d="M58 152 Q60 136 80 133 L120 133 Q140 136 142 152 L147 228 Q100 237 53 228 Z" fill={C.shirt} />
        {backpack ? (
          <>
            <path d="M70 138 Q66 170 72 200" stroke="#4a3123" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M130 138 Q134 170 128 200" stroke="#4a3123" strokeWidth="6" fill="none" strokeLinecap="round" />
          </>
        ) : null}
        <path d="M91 133 L100 146 L109 133 Z" fill={C.tee} />
        <path d="M79 133 L100 149 L92 158 L76 140 Z" fill={C.shirtDeep} />
        <path d="M121 133 L100 149 L108 158 L124 140 Z" fill={C.shirtDeep} />
        <line x1="100" y1="150" x2="100" y2="229" stroke={C.shirtDeep} strokeWidth="2" />
        {[166, 186, 206].map((y) => (
          <circle key={y} cx="100" cy={y} r="2.2" fill={C.shirtDeep} />
        ))}
        <rect x="66" y="166" width="22" height="17" rx="2" fill="none" stroke={C.shirtDeep} strokeWidth="2" />
        <rect x="112" y="166" width="22" height="17" rx="2" fill="none" stroke={C.shirtDeep} strokeWidth="2" />
        <text x="77" y="162" fontSize="6.5" fontWeight="700" fill="#f6e9e2" textAnchor="middle" fontFamily="sans-serif">
          M. Hilal
        </text>
        <text x="123" y="162" fontSize="6.5" fontWeight="700" fill="#f6e9e2" textAnchor="middle" fontFamily="sans-serif">
          SISFOR-9
        </text>

        {/* Leher + kepala */}
        <rect x="90" y="120" width="20" height="16" rx="4" fill={C.skinShade} />
        <circle cx="54" cy="90" r="9" fill={C.skinShade} />
        <circle cx="146" cy="90" r="9" fill={C.skinShade} />
        <ellipse cx="100" cy="82" rx="46" ry="48" fill={C.skin} />

        {/* Rambut berponi */}
        <path
          d="M52 92 C44 46 70 22 101 22 C134 22 158 46 149 94 L145 74 Q138 60 129 73 Q120 57 110 72 Q100 56 90 72 Q80 58 71 73 Q61 63 56 80 Z"
          fill={C.hair}
        />

        {/* Mata (kedip lewat scaleY) */}
        <g className="eyes" style={{ transform: `scaleY(${blink})` }}>
          <ellipse cx="82" cy="95" rx="5" ry="6.5" fill={C.ink} />
          <ellipse cx="118" cy="95" rx="5" ry="6.5" fill={C.ink} />
          <circle cx="84" cy="92.5" r="1.7" fill="#fff" />
          <circle cx="120" cy="92.5" r="1.7" fill="#fff" />
        </g>
        <path d="M74 82 L88 80" stroke={C.hair} strokeWidth="3" strokeLinecap="round" />
        <path d="M112 80 L126 82" stroke={C.hair} strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="71" cy="110" rx="7" ry="4" fill={C.blush} opacity="0.55" />
        <ellipse cx="129" cy="110" rx="7" ry="4" fill={C.blush} opacity="0.55" />
        {mouth === "smile" ? (
          <path d="M89 112 Q100 121 111 112" stroke={C.ink} strokeWidth="3" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M90 111 Q100 126 110 111 Z" fill={C.ink} />
        )}
      </g>
    </svg>
  );
}
