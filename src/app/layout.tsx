import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { FeedbackProvider } from "@/components/feedback/FeedbackProvider";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const body = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "M. Hilal — Portofolio Sistem Informasi UISI",
    template: "%s · M. Hilal",
  },
  description:
    "Portofolio M. Hilal, mahasiswa Sistem Informasi Universitas Internasional Semen Indonesia (UISI). Proyek, skill, dan perjalanan dalam satu cerita.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable} antialiased`}>
      <body className="min-h-dvh">
        <FeedbackProvider>{children}</FeedbackProvider>
      </body>
    </html>
  );
}
