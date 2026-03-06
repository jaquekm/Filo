"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/Sidebar";
import { Menu } from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      {/* ── Topbar mobile ── */}
      <header className="lg:hidden flex items-center gap-3 px-4 h-14 bg-brand-surface border-b border-brand-border flex-shrink-0 z-20">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-brand-text hover:bg-brand-surface-hover"
        >
          <Menu size={22} />
        </button>
        <span className="font-extrabold text-brand-text text-lg">Filo</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Overlay ── */}
        {open && (
          <div
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <div className={`
          fixed top-0 left-0 h-full z-40 transition-transform duration-200
          lg:static lg:translate-x-0 lg:flex lg:flex-shrink-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}>
          <Sidebar onClose={() => setOpen(false)} />
        </div>

        {/* ── Conteúdo ── */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
