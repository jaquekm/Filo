export const dynamic = "force-dynamic";
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { useForms } from "@/hooks/use-data";
import {
  FileText, Plus, ArrowLeft, Eye, BarChart3,
  Loader2, X, Search, Printer, FolderOpen, MapPin,
  PowerOff, Power,
} from "lucide-react";

interface FormWithContext {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  folder_id: string;
  folder_name?: string;
  city_name?: string;
  created_at: string;
}

async function printFormPDF(form: FormWithContext, supabase: any) {
  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("form_id", form.id)
    .order("order_index");

  const questionsHtml = questions && questions.length > 0
    ? questions.map((q: any, i: number) => {
        const opts = Array.isArray(q.options_json) ? q.options_json : [];
        let answerHtml = "";
        if (["multipla_escolha", "checkbox", "selecao_unica"].includes(q.question_type) && opts.length > 0) {
          const isRound = q.question_type === "selecao_unica";
          answerHtml = `<div style="display:flex;flex-wrap:wrap;gap:8px 20px;margin-top:8px">${
            opts.map((opt: string) => `
              <label style="display:flex;align-items:center;gap:7px;font-size:13px;cursor:pointer">
                <div style="width:17px;height:17px;border:1.5px solid #555;border-radius:${isRound ? "50%" : "3px"};flex-shrink:0;background:#fff"></div>
                <span>${opt}</span>
              </label>
            `).join("")
          }</div>`;
        } else if (q.question_type === "numero") {
          answerHtml = `<div style="margin-top:8px;border-bottom:1px solid #bbb;height:30px;width:140px"></div>`;
        } else {
          answerHtml = `<div style="margin-top:8px">
            <div style="border-bottom:1px solid #bbb;height:28px;margin-bottom:6px"></div>
            <div style="border-bottom:1px solid #bbb;height:28px"></div>
          </div>`;
        }
        return `
          <div style="margin-bottom:20px;padding:14px 16px;border:1px solid #ddd;border-radius:8px;break-inside:avoid">
            <p style="font-size:14px;font-weight:700;color:#111;margin-bottom:2px">
              ${i + 1}. ${q.question_text}${q.is_required ? ' <span style="color:#e33">*</span>' : ""}
            </p>
            <p style="font-size:11px;color:#888;margin-bottom:4px">${
              q.question_type === "multipla_escolha" ? "Múltipla escolha" :
              q.question_type === "selecao_unica" ? "Seleção única" :
              q.question_type === "checkbox" ? "Checkbox" :
              q.question_type === "numero" ? "Número" : "Texto"
            }</p>
            ${answerHtml}
          </div>
        `;
      }).join("")
    : `<p style="color:#888;font-style:italic;padding:16px;border:1px dashed #ddd;border-radius:8px">Nenhuma pergunta cadastrada. Adicione perguntas no editor antes de imprimir.</p>`;

  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <title>${form.title} — Filo</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:Arial,sans-serif; color:#111; padding:28px 32px; max-width:760px; margin:0 auto; font-size:14px; }
    .header { border-bottom:2px solid #06D6A0; padding-bottom:14px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:flex-start; }
    .header-left h1 { font-size:20px; font-weight:800; color:#111; }
    .header-left p { font-size:12px; color:#666; margin-top:3px; }
    .brand { font-size:18px; font-weight:800; color:#06D6A0; }
    .fields-row { display:grid; grid-template-columns:1fr 1fr; gap:10px 20px; margin-bottom:20px; }
    .field-box { }
    .field-label { font-size:10px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:.06em; margin-bottom:4px; }
    .field-line { border-bottom:1px solid #bbb; height:26px; }
    .footer { margin-top:32px; padding-top:10px; border-top:1px solid #ddd; font-size:10px; color:#aaa; display:flex; justify-content:space-between; }
    @media print {
      body { padding:16px 20px; }
      @page { margin:1.5cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${form.title}</h1>
      <p>
        ${form.city_name ? `📍 ${form.city_name}` : ""}
        ${form.folder_name ? ` &nbsp;|&nbsp; 📁 ${form.folder_name}` : ""}
        &nbsp;|&nbsp; Data: ___/___/______
      </p>
    </div>
    <div class="brand">Filo</div>
  </div>

  <div class="fields-row">
    <div class="field-box"><div class="field-label">Pesquisador</div><div class="field-line"></div></div>
    <div class="field-box"><div class="field-label">Entrevistado</div><div class="field-line"></div></div>
    <div class="field-box"><div class="field-label">Bairro / Endereço</div><div class="field-line"></div></div>
    <div class="field-box"><div class="field-label">Telefone</div><div class="field-line"></div></div>
  </div>

  ${questionsHtml}

  <div class="footer">
    <span>Filo — Sistema de Pesquisas de Campo</span>
    <span>Formulário para coleta presencial · Digitalizar após preenchimento</span>
  </div>
  <script>window.onload = function(){ window.print(); }</script>
</body>
</html>`;

  const win = window.open("about:blank", "_blank");
  if (!win) {
    alert("Permita pop-ups neste site para imprimir. Clique no ícone de bloqueio na barra de endereço.");
    return;
  }
  win.document.open();
  win.document.write(htmlContent);
  win.document.close();
}

export default function FormsPage() {
  const params = useSearchParams();
  const folderId = params.get("folder");
  const { forms, loading, create, refetch } = useForms(folderId);

  const [allForms, setAllForms] = useState<FormWithContext[]>([]);
  const [allLoading, setAllLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const supabase = createClient() as any;

  const fetchAllForms = useCallback(async () => {
    setAllLoading(true);
    const { data } = await supabase
      .from("forms")
      .select(`id, title, description, is_active, folder_id, created_at, folders ( name, cities ( name ) )`)
      .order("created_at", { ascending: false });

    if (data) {
      setAllForms(data.map((f: any) => ({
        id: f.id, title: f.title, description: f.description,
        is_active: f.is_active, folder_id: f.folder_id, created_at: f.created_at,
        folder_name: f.folders?.name,
        city_name: f.folders?.cities?.name,
      })));
    }
    setAllLoading(false);
  }, []);

  useEffect(() => { fetchAllForms(); }, [fetchAllForms]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await create(title.trim(), desc || undefined);
    setTitle(""); setDesc(""); setOpen(false); setSaving(false);
    fetchAllForms();
    refetch?.();
  };

  const toggleActive = async (form: FormWithContext) => {
    await supabase.from("forms").update({ is_active: !form.is_active }).eq("id", form.id);
    fetchAllForms();
  };

  const filtered = allForms.filter(f => {
    const matchSearch = !search ||
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      (f.city_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (f.folder_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchActive =
      filterActive === "all" ||
      (filterActive === "active" && f.is_active) ||
      (filterActive === "inactive" && !f.is_active);
    return matchSearch && matchActive;
  });

  return (
    <div className="animate-fade-in p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-text mb-1">Pesquisas</h1>
          <p className="text-sm text-brand-text-dim">Todas as pesquisas cadastradas</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-dark text-brand-bg font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Plus size={16} /> Nova Pesquisa
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-brand-card border border-brand-border rounded-xl p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-dim" />
          <input
            type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, cidade ou pasta..."
            className="w-full bg-brand-bg border border-brand-border rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-text-dim outline-none focus:border-brand-primary transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map(f => (
            <button key={f} onClick={() => setFilterActive(f)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                filterActive === f
                  ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary"
                  : "bg-brand-bg border-brand-border text-brand-text-dim hover:border-brand-text-dim"
              }`}
            >
              {f === "all" ? "Todas" : f === "active" ? "Ativas" : "Encerradas"}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {allLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-brand-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-[72px] h-[72px] rounded-2xl bg-brand-primary-glow flex items-center justify-center mb-5">
            <FileText size={32} className="text-brand-primary" />
          </div>
          <h3 className="text-lg font-bold text-brand-text mb-2">Nenhuma pesquisa encontrada</h3>
          <p className="text-sm text-brand-text-dim max-w-xs">
            {search ? "Tente outro termo de busca." : "Crie uma cidade e pasta primeiro, depois adicione pesquisas."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(form => (
            <div key={form.id}
              className="bg-brand-card border border-brand-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-border-light transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${form.is_active ? "bg-brand-primary-glow" : "bg-brand-text-dim/10"}`}>
                  <FileText size={20} className={form.is_active ? "text-brand-primary" : "text-brand-text-dim"} />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-brand-text">{form.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                      form.is_active ? "bg-brand-primary/10 text-brand-primary" : "bg-red-500/10 text-red-400"
                    }`}>
                      {form.is_active ? "Ativa" : "Encerrada"}
                    </span>
                    {form.city_name && (
                      <span className="flex items-center gap-1 text-xs text-brand-text-dim">
                        <MapPin size={10} />{form.city_name}
                      </span>
                    )}
                    {form.folder_name && (
                      <span className="flex items-center gap-1 text-xs text-brand-text-dim">
                        <FolderOpen size={10} />{form.folder_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => printFormPDF(form, supabase)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-text-muted border border-brand-border hover:bg-brand-surface-hover hover:text-brand-primary hover:border-brand-primary/40 transition-colors"
                >
                  <Printer size={13} /> Imprimir PDF
                </button>
                <Link href={`/forms/builder?form=${form.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-text-muted border border-brand-border hover:bg-brand-surface-hover transition-colors"
                >
                  <FileText size={13} /> Editar
                </Link>
                <Link href={`/forms/respond?form=${form.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-text-muted border border-brand-border hover:bg-brand-surface-hover transition-colors"
                >
                  <Eye size={13} /> Responder
                </Link>
                <Link href={`/results?form=${form.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-text-muted border border-brand-border hover:bg-brand-surface-hover transition-colors"
                >
                  <BarChart3 size={13} /> Resultados
                </Link>
                <button
                  onClick={() => toggleActive(form)}
                  title={form.is_active ? "Encerrar pesquisa" : "Reativar pesquisa"}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    form.is_active
                      ? "text-red-400 border-red-400/20 hover:bg-red-400/10"
                      : "text-green-400 border-green-400/20 hover:bg-green-400/10"
                  }`}
                >
                  {form.is_active ? <PowerOff size={13} /> : <Power size={13} />}
                  {form.is_active ? "Encerrar" : "Reativar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nova pesquisa */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-brand-surface border border-brand-border rounded-2xl p-7 w-[520px] max-w-[90vw]">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-brand-text">Nova Pesquisa</h3>
              <button onClick={() => setOpen(false)} className="text-brand-text-dim hover:text-brand-text"><X size={20} /></button>
            </div>
            <p className="text-xs text-brand-text-dim mb-4">
              ⚠️ Para criar uma pesquisa, acesse <strong>Cidades → Pastas</strong> e clique em "Ver Pesquisas" para associá-la a uma pasta.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">Título *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Intenção de Voto - Março 2025"
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-brand-text outline-none focus:border-brand-primary" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">Descrição</label>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
                  placeholder="Descrição opcional..." rows={3}
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-brand-text outline-none focus:border-brand-primary resize-y" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setOpen(false)}
                  className="flex-1 bg-brand-bg border border-brand-border text-brand-text-muted font-semibold py-2.5 rounded-lg text-sm transition-colors hover:border-brand-text-dim">
                  Cancelar
                </button>
                <Link href="/cities"
                  className="flex-1 bg-brand-primary hover:bg-brand-primary-dark text-brand-bg font-semibold py-2.5 rounded-lg text-sm transition-colors text-center">
                  Ir para Cidades
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
