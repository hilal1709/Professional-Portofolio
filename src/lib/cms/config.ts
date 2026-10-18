/** Konfigurasi CMS: entitas, label, dan field form. Murni data — aman dipakai di server & klien. */

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "image"
  | "audio"
  | "images"
  | "tags"
  | "select"
  | "color"
  | "url"
  | "email"
  | "socials"
  | "icon";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  readOnly?: boolean;
  wide?: boolean;
};

export type EntityConfig = {
  key: EntityKey;
  label: string;
  singular: string;
  description: string;
  fields: Field[];
  /** Kolom yang tampil di tabel daftar. */
  columns: string[];
  singleton?: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
};

export type EntityKey = "profile" | "chapters" | "milestones" | "skills" | "projects" | "experiences" | "gallery";

const sortOrder: Field = { name: "sortOrder", label: "Urutan", type: "number", help: "Angka kecil tampil lebih dulu." };

export const ENTITIES: Record<EntityKey, EntityConfig> = {
  profile: {
    key: "profile",
    label: "Profil",
    singular: "Profil",
    description: "Identitas yang muncul di hero, tentang aku, dan kontak.",
    singleton: true,
    columns: ["name"],
    fields: [
      { name: "name", label: "Nama lengkap", type: "text", required: true },
      { name: "nickname", label: "Nama panggilan", type: "text", required: true, help: "Dipakai di logo navigasi." },
      { name: "tagline", label: "Tagline", type: "text", required: true, wide: true },
      { name: "bio", label: "Bio", type: "textarea", required: true, wide: true },
      { name: "campus", label: "Kampus", type: "text", required: true },
      { name: "major", label: "Program studi", type: "text", required: true },
      { name: "batch", label: "Angkatan", type: "text" },
      { name: "location", label: "Domisili", type: "text" },
      { name: "email", label: "Email publik", type: "email" },
      { name: "cvUrl", label: "Link CV", type: "url" },
      { name: "photo", label: "Foto utama", type: "image", wide: true },
      { name: "socials", label: "Media sosial", type: "socials", wide: true, help: "Satu per baris: Label | https://link. Label GitHub, LinkedIn, Instagram mendapat ikon khusus." },
      { name: "bannerOn", label: "Tampilkan banner pengumuman di atas situs", type: "boolean" },
      { name: "bannerText", label: "Teks banner", type: "text", wide: true, placeholder: "Sedang mencari tempat magang 2026 — mari ngobrol!" },
      { name: "bannerCta", label: "Tombol banner", type: "text", placeholder: "Hubungi aku" },
      { name: "bannerUrl", label: "Link tombol banner", type: "text", placeholder: "#kontak atau https://…", help: "Boleh link luar atau anchor seperti #kontak / #proyek." },
      { name: "showreelMusicOn", label: "Putar musik di video showreel", type: "boolean" },
      {
        name: "showreelMusic",
        label: "Lagu showreel",
        type: "audio",
        wide: true,
        help: "Kosongkan untuk memakai lagu bawaan (orisinal, bebas royalti). Pastikan lagu yang kamu unggah boleh dipakai (milik sendiri / lisensi bebas royalti). Lagu diulang otomatis dan diberi fade in/out.",
      },
    ],
  },
  chapters: {
    key: "chapters",
    label: "Babak cerita",
    singular: "Babak",
    description: "Judul, narasi, dan ucapan maskot di setiap babak beranda.",
    columns: ["sortOrder", "key", "title", "visible"],
    canCreate: false,
    canDelete: false,
    fields: [
      { name: "key", label: "Kunci babak", type: "text", readOnly: true, help: "Dipakai kode, tidak bisa diubah." },
      { name: "eyebrow", label: "Label navigasi", type: "text" },
      { name: "title", label: "Judul", type: "text", required: true, wide: true },
      { name: "body", label: "Narasi", type: "textarea", wide: true },
      { name: "mascotLine", label: "Ucapan maskot", type: "text", wide: true, help: "Muncul di balon percakapan maskot." },
      sortOrder,
      { name: "visible", label: "Tampilkan babak ini", type: "boolean" },
    ],
  },
  milestones: {
    key: "milestones",
    label: "Perjalanan",
    singular: "Milestone",
    description: "Papan-papan di babak scroll horizontal.",
    columns: ["sortOrder", "year", "title"],
    canCreate: true,
    canDelete: true,
    fields: [
      { name: "year", label: "Tahun", type: "text", required: true },
      { name: "title", label: "Judul", type: "text", required: true },
      { name: "description", label: "Deskripsi", type: "textarea", wide: true },
      { name: "icon", label: "Ikon", type: "icon" },
      sortOrder,
    ],
  },
  skills: {
    key: "skills",
    label: "Skill",
    singular: "Skill",
    description: "Dikelompokkan otomatis berdasarkan kategori.",
    columns: ["sortOrder", "name", "category", "level"],
    canCreate: true,
    canDelete: true,
    fields: [
      { name: "name", label: "Nama skill", type: "text", required: true },
      { name: "category", label: "Kategori", type: "text", required: true, placeholder: "Analisis / Pengembangan / Data / Desain / Soft Skill" },
      { name: "level", label: "Level (0–100)", type: "number" },
      { name: "icon", label: "Ikon", type: "icon" },
      sortOrder,
    ],
  },
  projects: {
    key: "projects",
    label: "Proyek",
    singular: "Proyek",
    description: "Kartu di babak proyek dan halaman detailnya.",
    columns: ["sortOrder", "title", "year", "featured"],
    canCreate: true,
    canDelete: true,
    fields: [
      { name: "title", label: "Judul", type: "text", required: true },
      { name: "slug", label: "Slug URL", type: "text", help: "Kosongkan untuk dibuat otomatis dari judul." },
      { name: "summary", label: "Ringkasan", type: "textarea", required: true, wide: true },
      { name: "content", label: "Cerita proyek", type: "textarea", wide: true, help: "Pisahkan paragraf dengan baris kosong." },
      { name: "role", label: "Peran", type: "text" },
      { name: "year", label: "Tahun", type: "text" },
      { name: "tech", label: "Teknologi", type: "tags", wide: true, help: "Pisahkan dengan koma." },
      { name: "cover", label: "Sampul", type: "image", wide: true, help: "Kosongkan untuk sampul otomatis berwarna." },
      { name: "color", label: "Warna aksen", type: "color" },
      { name: "demoUrl", label: "Link demo", type: "url" },
      { name: "repoUrl", label: "Link repo", type: "url" },
      { name: "gallery", label: "Galeri tangkapan layar", type: "images", wide: true },
      { name: "featured", label: "Proyek unggulan", type: "boolean" },
      sortOrder,
    ],
  },
  experiences: {
    key: "experiences",
    label: "Pengalaman",
    singular: "Pengalaman",
    description: "Organisasi, kepanitiaan, lomba, dan magang.",
    columns: ["sortOrder", "title", "place", "start"],
    canCreate: true,
    canDelete: true,
    fields: [
      {
        name: "kind",
        label: "Jenis",
        type: "select",
        options: [
          { value: "organisasi", label: "Organisasi" },
          { value: "kepanitiaan", label: "Kepanitiaan" },
          { value: "lomba", label: "Lomba" },
          { value: "magang", label: "Magang" },
          { value: "kerja", label: "Kerja" },
        ],
      },
      { name: "title", label: "Posisi / judul", type: "text", required: true },
      { name: "place", label: "Tempat", type: "text", required: true },
      { name: "start", label: "Mulai", type: "text", required: true, placeholder: "2024" },
      { name: "end", label: "Selesai", type: "text", placeholder: "Sekarang" },
      { name: "description", label: "Deskripsi", type: "textarea", wide: true },
      sortOrder,
    ],
  },
  gallery: {
    key: "gallery",
    label: "Galeri",
    singular: "Foto",
    description: "Foto di tumpukan kartu babak pengalaman.",
    columns: ["sortOrder", "url", "caption"],
    canCreate: true,
    canDelete: true,
    fields: [
      { name: "url", label: "Foto", type: "image", required: true, wide: true },
      { name: "caption", label: "Keterangan", type: "text", wide: true },
      sortOrder,
    ],
  },
};

export const ENTITY_KEYS = Object.keys(ENTITIES) as EntityKey[];

export function isEntityKey(key: string): key is EntityKey {
  return key in ENTITIES;
}
