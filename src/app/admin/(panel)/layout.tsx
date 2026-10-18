import { count, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { Sidebar } from "@/components/admin/Sidebar";
import { requireAdmin } from "@/lib/auth";
import { db, messages } from "@/lib/db";

export const metadata: Metadata = { title: { default: "CMS", template: "%s · CMS" }, robots: { index: false } };

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireAdmin();
  const [{ value: unread }] = await db.select({ value: count() }).from(messages).where(eq(messages.read, false));

  return (
    <div className="min-h-dvh bg-paper lg:flex">
      <Sidebar email={session.email} unread={unread} />
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">{children}</main>
    </div>
  );
}
