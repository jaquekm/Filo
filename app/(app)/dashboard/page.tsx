"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import {
  Building2, FileText, BarChart3, ScanLine, ChevronRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#06D6A0", "#60A5FA", "#FBBF24", "#A78BFA", "#FF6B6B"];

interface Stats {
  cities: number;
  forms: number;
  responses: number;
  scans: number;
}

export default function DashboardPage() {
  const supabase = createClient() as any;
  const [stats, setStats] = useState<Stats>({ cities: 0, forms: 0, responses: 0, scans: 0 });
  const [cityData, setCityData] = useState<{ name: string; respostas: number }[]>([]);
  const [methodData] = useState([
    { name: "Digital", value: 65 },
    { name: "Scanner OCR", value: 28 },
    { name: "Manual", value: 7 },
  ]);
  const [recentForms, setRecentForms] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const [c, f, r, s] = await Promise.all([
        supabase.from("cities").select("id", { count: "exact", head: true }),
        supabase.from("forms").select("id", { count: "exact", head: true }),
        supabase.from("responses").select("id", { count: "exact", head: true }),
        supabase.from("scan_logs").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        cities: c.count ?? 0,
        forms: f.count ?? 0,
        responses: r.count ?? 0,
        scans: s.count ?? 0,
      });

      // City response counts
      const { data: cities } = await supabase.from("cities").select("id, name");
      if (cities) {
        const mapped = await Promise.all(
          cities.slice(0, 6).map(async (city) => {
            const { data: folders } = await supabase
              .from("folders")
              .select("id")
              .eq("city_id", city.id);
            const folderIds = folders?.map((f) => f.id) ?? [];
            let count = 0;
            if (folderIds.length > 0) {
              const { data: forms } = await supabase
                .from("forms")
                .select("id")
                .in("folder_id", folderIds);
              const formIds = forms?.map((f) => f.id) ?? [];
              if (formIds.length > 0) {
                const { count: rc } = await supabase
                  .from("responses")
                  .select("id", { count: "exact", head: true })
                  .in("form_id", formIds);
                count = rc ?? 0;
              }
            }
            return { name: city.name, respostas: count };
          })
        );
        setCityData(mapped);
      }

      // Recent forms
      const { data: rf } = await supabase
        .from("forms")
        .select("id, title, is_active, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentForms(rf ?? []);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statCards = [
    { label: "Cidades", value: stats.cities, icon: Building2, color: "text-brand-primary", bg: "bg-brand-primary/10" },
    { label: "Pesquisas", value: stats.forms, icon: FileText, color: "text-brand-blue", bg: "bg-brand-blue/10" },
    { label: "Respostas", value: stats.responses, icon: BarChart3, color: "text-brand-purple", bg: "bg-brand-purple/10" },
    { label: "Scans OCR", value: stats.scans, icon: ScanLine, color: "text-brand-warning", bg: "bg-brand-warning/10" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold text-brand-text mb-1">Dashboard</h1>
        <p className="text-sm text-brand-text-dim">Visão geral do sistema de pesquisas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-brand-card border border-brand-border rounded-xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={22} className={color} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-brand-text leading-none">
                {value.toLocaleString("pt-BR")}
              </div>
              <div className="text-xs text-brand-text-dim mt-1 uppercase tracking-wider">
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-7">
        <div className="bg-brand-card border border-brand-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-brand-text mb-4">Respostas por Cidade</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cityData.length > 0 ? cityData : [{ name: "Sem dados", respostas: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={{ stroke: "#1E293B" }} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={{ stroke: "#1E293B" }} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1E293B", borderRadius: 8, fontSize: 12, color: "#F1F5F9" }} />
              <Bar dataKey="respostas" fill="#06D6A0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-brand-text mb-4">Coleta por Método</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={methodData} cx="50%" cy="50%" outerRadius={80} innerRadius={45} dataKey="value" paddingAngle={3}>
                {methodData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1E293B", borderRadius: 8, fontSize: 12, color: "#F1F5F9" }} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#94A3B8" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Forms */}
      <div className="bg-brand-card border border-brand-border rounded-xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-brand-text">Pesquisas Recentes</h3>
          <Link href="/forms" className="text-xs text-brand-text-muted hover:text-brand-primary transition-colors">
            Ver todas →
          </Link>
        </div>
        <div className="space-y-2">
          {recentForms.length === 0 && (
            <p className="text-sm text-brand-text-dim py-8 text-center">
              Nenhuma pesquisa criada ainda.
            </p>
          )}
          {recentForms.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between px-4 py-3 rounded-lg bg-brand-bg border border-brand-border"
            >
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-brand-primary" />
                <span className="text-sm font-medium text-brand-text">{f.title}</span>
              </div>
              <span
                className={`text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                  f.is_active
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "bg-brand-text-dim/10 text-brand-text-dim"
                }`}
              >
                {f.is_active ? "Ativa" : "Encerrada"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
