import { PasswordForm } from "@/components/admin/PasswordForm";

export const metadata = { title: "Akun" };

export default function AccountPage() {
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-4xl font-extrabold text-ink">Akun</h1>
      <p className="mt-1 text-ink-soft">Ganti password admin. Gunakan minimal 10 karakter.</p>
      <PasswordForm />
    </div>
  );
}
