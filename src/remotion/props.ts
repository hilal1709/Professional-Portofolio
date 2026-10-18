/** Tipe & default props Showreel. Sengaja tanpa import Remotion supaya ringan dipakai di mana saja. */
export type ShowreelProps = {
  name: string;
  tagline: string;
  campus: string;
  major: string;
  batch: string;
  outro: string;
  milestones: { year: string; title: string }[];
  skills: string[];
  projects: { title: string; color: string }[];
  /** URL lagu latar. Kosong = lagu bawaan; null = tanpa musik. */
  music: string | null;
};

/** Placeholder netral — data asli dikirim dari database (situs) atau `npm run remotion:props` (Studio/render). */
export const showreelDefaults: ShowreelProps = {
  name: "Nama Kamu",
  tagline: "Isi tagline di CMS → Profil.",
  campus: "Universitas Internasional Semen Indonesia",
  major: "Sistem Informasi",
  batch: "",
  outro: "Mari berkolaborasi",
  milestones: [],
  skills: [],
  projects: [],
  music: "",
};
