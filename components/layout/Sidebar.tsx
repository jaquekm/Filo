"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard, Building2, FileText,
  ScanLine, BarChart3, Users, LogOut, Briefcase,
} from "lucide-react";

const NAV_MAIN = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cities", label: "Cidades", icon: Building2 },
  { href: "/forms", label: "Pesquisas", icon: FileText },
  { href: "/scan", label: "Scanner", icon: ScanLine },
  { href: "/results", label: "Resultados", icon: BarChart3 },
];

function FiloLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Pasta */}
      <path d="M4 12C4 10.3 5.3 9 7 9H16L19 12H33C34.7 12 36 13.3 36 15V30C36 31.7 34.7 33 33 33H7C5.3 33 4 31.7 4 30V12Z" fill="#06D6A0" fillOpacity="0.2" stroke="#06D6A0" strokeWidth="2"/>
      {/* Documento */}
      <rect x="11" y="16" width="14" height="12" rx="1.5" fill="#06D6A0" fillOpacity="0.3" stroke="#06D6A0" strokeWidth="1.5"/>
      {/* Linhas check */}
      <path d="M13 20L14.5 21.5L17 19" stroke="#06D6A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 24H19" stroke="#06D6A0" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Lupa */}
      <circle cx="28" cy="26" r="5" fill="#0A0E17" stroke="#06D6A0" strokeWidth="2"/>
      <path d="M31.5 29.5L34 32" stroke="#06D6A0" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, role, signOut } = useAuth();

  const isAdmin = role === "admin";
  const isSuperAdmin = isAdmin && !profile?.company_id;

  return (
    <aside className="w-60 min-h-screen bg-brand-surface border-r border-brand-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-brand-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <FiloLogo size={36} />
          <span className="text-2xl font-extrabold text-brand-text tracking-tight">
            Filo
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {NAV_MAIN.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-brand-primary-glow text-brand-primary font-semibold"
                  : "text-brand-text-muted hover:bg-brand-surface-hover"
              }`}
            >
              <Icon size={18} className={active ? "text-brand-primary" : "text-brand-text-dim"} />
              {label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3.5">
              <span className="text-[10px] font-bold text-brand-text-dim uppercase tracking-widest">
                Administração
              </span>
            </div>
            <Link
              href="/users"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                pathname.startsWith("/users")
                  ? "bg-brand-primary-glow text-brand-primary font-semibold"
                  : "text-brand-text-muted hover:bg-brand-surface-hover"
              }`}
            >
              <Users size={18} className={pathname.startsWith("/users") ? "text-brand-primary" : "text-brand-text-dim"} />
              Usuários
            </Link>
            {isSuperAdmin && (
              <Link
                href="/companies"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                  pathname.startsWith("/companies")
                    ? "bg-brand-primary-glow text-brand-primary font-semibold"
                    : "text-brand-text-muted hover:bg-brand-surface-hover"
                }`}
              >
                <Briefcase size={18} className={pathname.startsWith("/companies") ? "text-brand-primary" : "text-brand-text-dim"} />
                Empresas
              </Link>
            )}
          </>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-brand-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-brand-primary-glow flex items-center justify-center text-xs font-bold text-brand-primary">
            {profile?.full_name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-brand-text truncate">
              {profile?.full_name ?? "Usuário"}
            </div>
            <div className="text-[11px] text-brand-text-dim capitalize">
              {profile?.role ?? "parceiro"}
            </div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-brand-text-muted hover:bg-brand-surface-hover transition-colors"
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </aside>
  );
}
