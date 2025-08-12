import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Nite Roulette",
  description: "Prototype",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-dvh overflow-hidden">
      <body className="h-dvh overflow-hidden bg-secondary text-zinc-100 antialiased">
        {/* App viewport (no scroll) */}
        <div className="relative mx-auto flex h-dvh w-full max-w-[520px] flex-col px-4 pt-6 pb-24">
          {/* content area fills available space */}
          <main className="flex-1">{children}</main>
        </div>
        <NavBar />
      </body>
    </html>
  );
}
