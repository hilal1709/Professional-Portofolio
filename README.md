# Portofolio M. Hilal — "Sehari di Gresik"

Portofolio scroll-storytelling untuk mahasiswa Sistem Informasi UISI. Maskot Hilal (kemeja merah SISFOR-9) memandu 8 babak; langit berganti pagi → siang → senja → malam sepanjang scroll.

| Babak | Scroll | Teknologi |
|---|---|---|
| Halo | pin + parallax lanskap (pabrik semen, kampus, masjid) | GSAP ScrollTrigger, Aceternity Text Generate, Lottie |
| Tentang aku | foto terbuka seperti tirai | GSAP clip-path, AOS |
| Perjalanan | **horizontal**, maskot berjalan | GSAP containerAnimation, anime.js |
| Skill | vertikal | AOS, Hugeicons |
| Proyek | **horizontal** (desktop) / Swiper (mobile) | Aceternity 3D Card, Swiper |
| Reel | motion graphic | Remotion Player |
| Pengalaman | timeline + galeri kartu | GSAP, Swiper EffectCards |
| Kontak | malam, form → database | Server Action, Lottie, Floating Dock |

## Panggung cerita ("dibawa masuk")

Beranda bukan halaman yang di-scroll biasa. Seluruh cerita adalah **satu panggung setinggi layar yang di-pin** (`src/components/story/stage/StoryStage.tsx`), dengan scroll halus GSAP ScrollSmoother. Satu master timeline menggerakkan kamera:
pintu kampus UISI → portal ke *Tentang* → jalan horizontal → zoom masuk ke ransel (*Skill*) → *Proyek* meluncur menimpa → kartu terakhir jadi bingkai video (*Reel*) → *Pengalaman* → kamera mendongak ke langit malam (*Kontak* + footer).
Bingkai dedaunan di depan kamera (`ForegroundFrame`) ikut "ditembus" di tiap transisi. Tiap babak ada di `stage/scenes/*.tsx` (markup + fungsi `build`). Babak yang disembunyikan di CMS otomatis dilewati.

## Menjalankan

```bash
npm install
npm run db:push     # buat tabel di Supabase
npm run db:seed     # isi data contoh + akun admin (aman diulang)
npm run dev
```

- Situs: http://localhost:3000
- CMS: http://localhost:3000/admin — login pakai `ADMIN_EMAIL` / `ADMIN_PASSWORD` dari `.env.local`, lalu ganti password di menu **Akun**.

## Environment (`.env.local`)

Lihat `.env.example`. Supaya upload gambar di CMS aktif, isi `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API). Bucket yang dipakai: `projek` (publik). Anon key saja tidak cukup untuk upload karena bucket belum punya policy tulis; CMS mengunggah dari server memakai service_role. Tanpa key itu, kolom gambar tetap bisa diisi URL.

## Upload & performa

- **Upload dari CMS** langsung ke Supabase Storage (bucket `projek`) lewat URL bertanda tangan: browser mengompres foto dulu (maks. 2000px, WebP), lalu mengunggah dengan progress bar. Kunci `service_role` tetap di server.
- **Beranda statis (ISR)**: data diambil sekali lalu di-cache; setiap simpan di CMS memperbarui halaman.
- **Muat ringan**: Remotion Player (±106 KB gzip) baru dimuat saat babak Reel mendekati layar; Lottie memakai build `lottie_light` (±46 KB, bukan ±190 KB); animasi maskot berhenti saat di luar layar; gambar disajikan AVIF/WebP; satu file font variabel.

## Toast, modal, banner

Komponen bertema di `src/components/feedback/`: `useToast()`, `useConfirm()` / `<Modal>`, dan `<Banner>`. Banner pengumuman situs diatur di **CMS → Profil** (teks, tombol, link); pengunjung bisa menutupnya.

## Remotion

```bash
npm run remotion          # Remotion Studio untuk mengedit komposisi Showreel
npm run remotion:render   # render ke out/showreel.mp4
```

Video sepenuhnya dibangun dari data CMS (`src/remotion/fromData.ts`): nama, tagline, prodi, kampus, milestone, skill, proyek, dan judul babak kontak. Durasi menyesuaikan jumlah data (milestone & proyek per 4, skill per 12 per adegan; bagian kosong dilewati).

- **Di situs**: Player membaca database setiap halaman diperbarui, jadi selalu sinkron tanpa render ulang.
- **Studio / MP4**: kedua perintah di atas lebih dulu menjalankan `npm run remotion:props` yang menarik data terbaru ke `out/showreel-props.json`. Setelah mengubah data di CMS, render ulang untuk mendapat MP4 yang baru.

## Struktur

- `src/components/story/*` — 8 babak cerita, langit, lanskap
- `src/components/mascot/*` — maskot SVG (dipakai juga oleh Remotion) + animasi anime.js
- `src/app/admin/*` — CMS (auth JWT cookie, CRUD generik dari `src/lib/cms/config.ts`, inbox pesan)
- `src/lib/db/*` — skema Drizzle + seed
- `graphify-out/` — knowledge graph kode (`graph.html`, `GRAPH_REPORT.md`)
- `.agents/skills/impeccable` — skill desain Impeccable
