/* Seed data awal. Jalankan: npm run db:seed (aman diulang — hanya mengisi tabel yang kosong). */
import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PgTable } from "drizzle-orm/pg-core";
import postgres from "postgres";
import * as s from "./schema";

config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL!, { ssl: "require", max: 1 });
const db = drizzle(sql, { schema: s });

async function isEmpty(table: PgTable) {
  const rows = await db.select().from(table).limit(1);
  return rows.length === 0;
}

async function main() {
  const email = process.env.ADMIN_EMAIL!;
  const password = process.env.ADMIN_PASSWORD!;
  if (await isEmpty(s.adminUsers)) {
    await db.insert(s.adminUsers).values({ email, passwordHash: await bcrypt.hash(password, 12) });
    console.log("admin dibuat:", email);
  }

  if (await isEmpty(s.profile)) {
    await db.insert(s.profile).values({
      name: "M. Hilal",
      nickname: "Hilal",
      tagline: "Mahasiswa Sistem Informasi yang suka mengubah proses rumit jadi sistem yang rapi.",
      bio: "Halo! Aku Hilal, mahasiswa Sistem Informasi di Universitas Internasional Semen Indonesia (UISI), Gresik. Aku senang menjembatani kebutuhan bisnis dan teknologi: dari menganalisis proses, merancang database, sampai membangun web app yang enak dipakai.",
      campus: "Universitas Internasional Semen Indonesia",
      major: "Sistem Informasi",
      batch: "SISFOR-9",
      location: "Gresik, Jawa Timur",
      email,
      photo: "/images/me-1.jpg",
      socials: [
        { label: "GitHub", url: "https://github.com/" },
        { label: "LinkedIn", url: "https://linkedin.com/" },
        { label: "Instagram", url: "https://instagram.com/" },
      ],
    });
  }

  if (await isEmpty(s.chapters)) {
    await db.insert(s.chapters).values([
      { key: "hero", sortOrder: 1, eyebrow: "Halo, selamat datang!", title: "Aku Hilal", body: "Mahasiswa Sistem Informasi UISI yang sedang menulis cerita lewat kode, data, dan desain.", mascotLine: "Ayo jalan-jalan bareng aku! Terus gulir ke bawah ya." },
      { key: "about", sortOrder: 2, eyebrow: "Babak 1", title: "Kenalan dulu, yuk", body: "Aku tumbuh dengan rasa penasaran: kenapa sebuah proses bisa lambat, dan bagaimana teknologi bisa membuatnya lebih cepat.", mascotLine: "Itu aku versi asli. Lumayan kan?" },
      { key: "journey", sortOrder: 3, eyebrow: "Babak 2", title: "Perjalanan di UISI", body: "Dari mahasiswa baru yang bingung sampai bisa merancang sistem sendiri.", mascotLine: "Ikuti langkahku ke kanan!" },
      { key: "skills", sortOrder: 4, eyebrow: "Babak 3", title: "Isi ranselku", body: "Alat dan ilmu yang kukumpulkan sepanjang jalan.", mascotLine: "Ini bekal andalanku!" },
      { key: "projects", sortOrder: 5, eyebrow: "Babak 4", title: "Hal-hal yang sudah kubangun", body: "Beberapa proyek kuliah, lomba, dan eksperimen pribadi.", mascotLine: "Geser terus, masih ada lagi!" },
      { key: "reel", sortOrder: 6, eyebrow: "Babak 5", title: "Cerita dalam gerak", body: "Rangkuman perjalananku dalam motion graphic singkat.", mascotLine: "Tekan play, ya!" },
      { key: "experience", sortOrder: 7, eyebrow: "Babak 6", title: "Di luar kelas", body: "Organisasi, kepanitiaan, dan lomba yang membentukku.", mascotLine: "Kuliah bukan cuma di kelas." },
      { key: "contact", sortOrder: 8, eyebrow: "Babak terakhir", title: "Mari berkolaborasi", body: "Punya ide, tawaran magang, atau sekadar mau ngobrol? Kirim pesan, aku balas secepatnya.", mascotLine: "Sampai jumpa lagi! Jangan lupa sapa aku." },
    ]);
  }

  if (await isEmpty(s.milestones)) {
    await db.insert(s.milestones).values([
      { sortOrder: 1, year: "2022", icon: "school", title: "Lulus SMA", description: "Memutuskan serius belajar teknologi dan bisnis." },
      { sortOrder: 2, year: "2023", icon: "university", title: "Masuk SI UISI", description: "Resmi menjadi bagian dari SISFOR-9 di Gresik." },
      { sortOrder: 3, year: "2023", icon: "code", title: "Kode pertama", description: "Belajar algoritma, basis data, dan membuat web pertama." },
      { sortOrder: 4, year: "2024", icon: "users", title: "Aktif organisasi", description: "Bergabung di himpunan dan berbagai kepanitiaan kampus." },
      { sortOrder: 5, year: "2025", icon: "chart", title: "Proyek nyata", description: "Membangun sistem informasi untuk UMKM dan lomba." },
      { sortOrder: 6, year: "2026", icon: "briefcase", title: "Siap magang", description: "Mencari tempat untuk berkontribusi dan terus belajar." },
    ]);
  }

  if (await isEmpty(s.skills)) {
    const rows: [string, string, number, string][] = [
      ["Analisis Proses Bisnis (BPMN)", "Analisis", 85, "flow"],
      ["UML & ERD", "Analisis", 85, "diagram"],
      ["Requirement Gathering", "Analisis", 80, "notes"],
      ["Next.js / React", "Pengembangan", 78, "code"],
      ["Laravel / PHP", "Pengembangan", 72, "code"],
      ["PostgreSQL & MySQL", "Data", 80, "database"],
      ["Python & Pandas", "Data", 70, "chart"],
      ["Power BI / Tableau", "Data", 75, "chart"],
      ["Figma (UI/UX)", "Desain", 80, "design"],
      ["Motion Graphic (Remotion)", "Desain", 65, "video"],
      ["Scrum & Manajemen Proyek", "Soft Skill", 78, "users"],
      ["Public Speaking", "Soft Skill", 75, "mic"],
    ];
    await db.insert(s.skills).values(rows.map(([name, category, level, icon], i) => ({ name, category, level, icon, sortOrder: i })));
  }

  if (await isEmpty(s.projects)) {
    await db.insert(s.projects).values([
      { slug: "sistem-inventaris-umkm", sortOrder: 1, featured: true, year: "2025", role: "System Analyst & Fullstack", color: "#a4161a", title: "Sistem Inventaris UMKM", summary: "Aplikasi web pencatatan stok & penjualan untuk UMKM di Gresik, lengkap dengan dashboard.", content: "Masalah: pencatatan stok manual di buku membuat selisih barang sering terjadi.\n\nSolusi: aku memetakan proses bisnis (BPMN), merancang ERD, lalu membangun web app dengan Next.js + PostgreSQL. Dashboard menampilkan barang terlaris dan stok menipis.\n\nHasil: waktu rekap bulanan turun dari 2 hari menjadi beberapa menit.", tech: ["Next.js", "PostgreSQL", "Tailwind", "BPMN"] },
      { slug: "dashboard-akademik", sortOrder: 2, featured: true, year: "2025", role: "Data Analyst", color: "#1d4e89", title: "Dashboard Kinerja Akademik", summary: "Visualisasi IPK, kehadiran, dan tren nilai mahasiswa untuk membantu dosen wali.", content: "Mengolah data akademik dengan Python, membersihkan data, lalu membuat dashboard interaktif di Power BI untuk memantau mahasiswa berisiko.", tech: ["Python", "Pandas", "Power BI"] },
      { slug: "ui-aplikasi-bank-sampah", sortOrder: 3, year: "2024", role: "UI/UX Designer", color: "#2d6a4f", title: "Aplikasi Bank Sampah", summary: "Desain UI/UX aplikasi mobile bank sampah dengan riset pengguna dan prototipe Figma.", content: "Melakukan wawancara pengguna, menyusun persona, user flow, dan prototipe high-fidelity yang diuji lewat usability testing.", tech: ["Figma", "User Research", "Prototyping"] },
      { slug: "simulasi-erp-mini", sortOrder: 4, year: "2024", role: "Project Manager", color: "#b5651d", title: "Simulasi ERP Mini", summary: "Proyek mata kuliah ERP: modul pembelian, gudang, dan penjualan yang terintegrasi.", content: "Memimpin tim 5 orang dengan Scrum, membagi sprint, dan memastikan integrasi antarmodul berjalan.", tech: ["Laravel", "MySQL", "Scrum"] },
      { slug: "website-himpunan", sortOrder: 5, year: "2023", role: "Frontend Developer", color: "#6a4c93", title: "Website Himpunan Mahasiswa", summary: "Website profil dan informasi kegiatan himpunan Sistem Informasi.", content: "Membangun halaman profil, agenda, dan galeri kegiatan yang mudah diperbarui pengurus.", tech: ["React", "Tailwind"] },
    ]);
  }

  if (await isEmpty(s.experiences)) {
    await db.insert(s.experiences).values([
      { sortOrder: 1, kind: "organisasi", title: "Staf Divisi Riset & Teknologi", place: "Himpunan Mahasiswa Sistem Informasi UISI", start: "2024", end: "Sekarang", description: "Mengelola website himpunan dan mengadakan kelas belajar coding untuk mahasiswa baru." },
      { sortOrder: 2, kind: "kepanitiaan", title: "Koordinator Acara", place: "Seminar Nasional Transformasi Digital", start: "2025", end: "2025", description: "Mengatur rundown, koordinasi pembicara, dan 30+ panitia." },
      { sortOrder: 3, kind: "lomba", title: "Finalis Business IT Case", place: "Kompetisi Sistem Informasi Tingkat Nasional", start: "2025", end: "2025", description: "Merancang solusi digitalisasi rantai pasok untuk industri semen." },
      { sortOrder: 4, kind: "kepanitiaan", title: "Mentor PKKMB", place: "UISI", start: "2024", end: "2024", description: "Membimbing mahasiswa baru mengenal kehidupan kampus." },
    ]);
  }

  if (await isEmpty(s.gallery)) {
    await db.insert(s.gallery).values([
      { sortOrder: 1, url: "/images/me-2.jpg", caption: "Salam kenal dari SISFOR-9" },
      { sortOrder: 2, url: "/images/me-1.jpg", caption: "Siap menerima tantangan" },
      { sortOrder: 3, url: "/images/me-4.jpg", caption: "Sedikit cinta untuk setiap proyek" },
      { sortOrder: 4, url: "/images/me-3.jpg", caption: "Kamu, iya kamu. Ayo kolaborasi!" },
    ]);
  }

  console.log("seed selesai");
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
  process.exit(1);
});
