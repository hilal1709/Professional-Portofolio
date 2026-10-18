import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";
import { MascotSvg } from "@/components/mascot/MascotSvg";

export const metadata: Metadata = { title: "Masuk CMS", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-end gap-3">
          <MascotSvg armR={-140} className="h-28 w-auto" title="Maskot menyambut" />
          <div className="pb-4">
            <h1 className="font-display text-3xl font-extrabold text-ink">Ruang kendali</h1>
            <p className="text-ink-soft">Masuk untuk mengelola portofolio.</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
