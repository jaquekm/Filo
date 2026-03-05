export const dynamic = "force-dynamic";
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { BarChart3, Download, FileText, Loader2 } from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["#06D6A0", "#FF6B6B", "#60A5FA", "#FBBF24", "#A78BFA", "#FB923C", "#34D399", "#F472B6"];

interface QuestionResult {
  id: string;
  text: string;
  type: string;
  data: { name: string; value: number; pct: number }[];
  total: number;
}

export default function ResultsPage() {
  const params = useSearchParams();
  const formId = params.get("form");
  const supabase = createClient() as any;

  const [formTitle, setFormTitle] = useState("");
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [totalResponses, setTotalResponses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!formId) { setLoading(false); return; }

    async function load() {
      // Form title
      const { data: form } = await supabase
        .from("forms")
        .select("title")
        .eq("id", formId!)
        .single();
      if (form) setFormTitle(form.title);

      // Questions
      const { data: questions } = await supabase
        .from("questions")
        .select("*")
        .eq("form_id", formId!)
        .order("order_index");

      // Responses count
      const { count } = await supabase
        .from("responses")
        .select("id", { count: "exact", head: true })
        .eq("form_id", formId!);
      setTotalResponses(count ?? 0);

      if (!questions) { setLoading(false); return; }

      // Get all answers for this form's questions
      const qIds = questions.map((q) => q.id);
      const { data: answers } = await supabase
        .from("answers")
        .select("question_id, answer_value")
        .in("question_id", qIds);

      // Aggregate
      const res: QuestionResult[] = questions.map((q) => {
        const qAnswers = (answers ?? []).filter((a) => a.question_id === q.id);
        const countMap: Record<string, number> = {};

        if (q.question_type === "multipla_escolha" || q.question_type === "checkbox") {
          qAnswers.forEach((a) => {
            (a.answer_value ?? "").split(", ").forEach((v) => {
              if (v) countMap[v] = (countMap[v] || 0) + 1;
            });
          });
        } else {
          qAnswers.forEach((a) => {
            const v = a.answer_value ?? "(vazio)";
            countMap[v] = (countMap[v] || 0) + 1;
          });
        }

        const total = qAnswers.length;
        const data = Object.entries(countMap)
          .map(([name, value]) => ({
            name,
            value,
            pct: total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
          }))
          .sort((a, b) => b.value - a.value);

        return { id: q.id, text: q.question_text, type: q.question_type, data, total };
      });

      setResults(res);
      setLoading(false);
    }

    load();
  }, [formId]);

  const exportCSV = () => {
    let csv = "Pergunta,Opção,Quantidade,Porcentagem\n";
    results.forEach((r) => {
      r.data.forEach((d) => {
        csv += `"${r.text}","${d.name}",${d.value},${d.pct}%\n`;
      });
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resultados-${formTitle || "pesquisa"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!formId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="w-[72px] h-[72px] rounded-2xl bg-brand-primary-glow flex items-center justify-center mb-5">
          <BarChart3 size={32} className="text-brand-primary" />
        </div>
        <h3 className="text-lg font-bold text-brand-text mb-2">Selecione uma pesquisa</h3>
        <p className="text-sm text-brand-text-dim max-w-xs">
          Navegue até uma pesquisa e clique em &quot;Resultados&quot; para ver os gráficos.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-text mb-1">Resultados</h1>
          <p className="text-sm text-brand-text-dim">
            {formTitle} — {totalResponses} respostas
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border text-sm text-brand-text-muted hover:bg-brand-surface-hover transition-colors"
        >
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-20 text-sm text-brand-text-dim">
          Nenhuma resposta coletada ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {results.map((r) => {
            const isPie = r.type === "selecao_unica" && r.data.length <= 6;
            const isBar = r.type === "multipla_escolha" || r.type === "checkbox" || r.type === "numero";

            return (
              <div
                key={r.id}
                className="bg-brand-card border border-brand-border rounded-xl p-5"
              >
                <h3 className="text-sm font-bold text-brand-text mb-1">{r.text}</h3>
                <p className="text-[11px] text-brand-text-dim mb-4">
                  {r.total} respostas •{" "}
                  {r.type.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
                </p>

                {r.data.length === 0 ? (
                  <p className="text-xs text-brand-text-dim text-center py-8">Sem dados</p>
                ) : isPie ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={r.data}
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          innerRadius={40}
                          dataKey="value"
                          paddingAngle={2}
                        >
                          {r.data.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#111827",
                            border: "1px solid #1E293B",
                            borderRadius: 8,
                            fontSize: 12,
                            color: "#F1F5F9",
                          }}
                          formatter={(value: number, name: string) => [`${value} (${r.data.find(d => d.name === name)?.pct}%)`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-3">
                      {r.data.map((d, i) => (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                            <span className="text-brand-text-muted">{d.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="font-bold text-brand-text">{d.pct}%</span>
                            <span className="text-brand-text-dim">({d.value})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={r.data} layout={r.data.length > 4 ? "vertical" : "horizontal"}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      {r.data.length > 4 ? (
                        <>
                          <XAxis type="number" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={{ stroke: "#1E293B" }} />
                          <YAxis dataKey="name" type="category" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={{ stroke: "#1E293B" }} width={90} />
                        </>
                      ) : (
                        <>
                          <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={{ stroke: "#1E293B" }} />
                          <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={{ stroke: "#1E293B" }} />
                        </>
                      )}
                      <Tooltip
                        contentStyle={{ background: "#111827", border: "1px solid #1E293B", borderRadius: 8, fontSize: 12, color: "#F1F5F9" }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {r.data.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
