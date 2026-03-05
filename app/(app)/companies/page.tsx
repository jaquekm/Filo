"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase-browser";
import type { Company } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createClient() as any;
import {
  Search, Plus, Pencil, X, Loader2, Building2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Check, Mail, Phone,
} from "lucide-react";

export default function CompaniesPage() {
  const { role } = useAuth();
  const supabase = db();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [modal, setModal] = useState<"new" | "edit" | null>(null);
  const [editing, setEditing] = useState<Company | null>(null);

  const [formName, setFormName] = useState("");
  const [formCnpj, setFormCnpj] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("companies").select("*", { count: "exact" });
    if (!showInactive) query = query.eq("is_active", true);
    if (search) query = query.ilike("name", `%${search}%`);
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1).order("created_at", { ascending: false });
    const { data, count, error } = await query;
    if (!error) { setCompanies(data || []); setTotal(count || 0); }
    setLoading(false);
  }, [search, showInactive, page, pageSize]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const formatCnpj = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 14);
    return n.replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
  };

  const openNew = () => {
    setFormName(""); setFormCnpj(""); setFormEmail("");
    setFormPhone(""); setFormAddress(""); setFormError("");
    setEditing(null); setModal("new");
  };

  const openEdit = (c: Company) => {
    setEditing(c);
    setFormName(c.name); setFormCnpj(c.cnpj || "");
    setFormEmail(c.email || ""); setFormPhone(c.phone || "");
    setFormAddress(c.address || ""); setFormError("");
    setModal("edit");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true); setFormError("");
    const payload = {
      name: formName, cnpj: formCnpj || null,
      email: formEmail || null, phone: formPhone || null,
      address: formAddress || null,
    };
    let error;
    if (modal === "new") {
      ({ error } = await supabase.from("companies").insert(payload));
    } else if (editing) {
      ({ error } = await supabase.from("companies").update(payload).eq("id", editing.id));
    }
    if (error) setFormError(error.message);
    else { setModal(null); fetchCompanies(); }
    setFormLoading(false);
  };

  const toggleActive = async (c: Company) => {
    await supabase.from("companies").update({ is_active: !c.is_active }).eq("id", c.id);
    fetchCompanies();
  };

  const totalPages = Math.ceil(total / pageSize);

  if (role !== "admin") {
    return (
      <div className="p-6 text-center text-brand-text-dim">
        Acesso restrito a administradores globais.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Empresas</h1>
          <p className="text-sm text-brand-text-dim mt-0.5">Gerencie as empresas cadastradas</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-dark text-brand-bg font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors">
          <Plus size={16} />
          Nova empresa
        </button>
      </div>

      <div className="bg-brand-card border border-brand-border rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-dim" />
          <input
            type="text" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Pesquisar empresa..."
            className="w-full bg-brand-bg border border-brand-border rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-text-dim outline-none focus:border-brand-primary transition-colors"
          />
        </div>
        <button
          onClick={() => setShowInactive(!showInactive)}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-sm font-medium transition-colors ${showInactive ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary" : "bg-brand-bg border-brand-border text-brand-text-muted hover:border-brand-text-dim"}`}
        >
          <div className={`w-4 h-4 rounded border flex items-center justify-center ${showInactive ? "bg-brand-primary border-brand-primary" : "border-brand-text-dim"}`}>
            {showInactive && <Check size={10} className="text-brand-bg" />}
          </div>
          Exibir inativas
        </button>
      </div>

      <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-border">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-brand-text-muted uppercase tracking-wider">Nome</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-brand-text-muted uppercase tracking-wider">CNPJ</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-brand-text-muted uppercase tracking-wider">Contato</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-brand-text-muted uppercase tracking-wider">Situação</th>
                <th className="text-right px-5 py-3.5 text-xs font-bold text-brand-text-muted uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-16 text-center"><Loader2 size={24} className="animate-spin text-brand-primary mx-auto" /></td></tr>
              ) : companies.length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center text-brand-text-dim text-sm">Nenhuma empresa encontrada</td></tr>
              ) : companies.map((c, i) => (
                <tr key={c.id} className={`border-b border-brand-border/50 hover:bg-brand-bg/40 transition-colors ${i % 2 === 0 ? "" : "bg-brand-bg/20"}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 size={14} className="text-brand-primary" />
                      </div>
                      <span className="text-sm font-medium text-brand-text">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-brand-text-muted">{c.cnpj || "—"}</td>
                  <td className="px-5 py-3.5">
                    <div className="text-xs text-brand-text-muted space-y-0.5">
                      {c.email && <div className="flex items-center gap-1"><Mail size={10} />{c.email}</div>}
                      {c.phone && <div className="flex items-center gap-1"><Phone size={10} />{c.phone}</div>}
                      {!c.email && !c.phone && "—"}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${c.is_active ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                      {c.is_active ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="w-8 h-8 rounded-lg bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary flex items-center justify-center transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => toggleActive(c)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${c.is_active ? "bg-red-500/10 hover:bg-red-500/20 text-red-400" : "bg-green-500/10 hover:bg-green-500/20 text-green-400"}`}>
                        {c.is_active ? <X size={14} /> : <Check size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-t border-brand-border">
          <span className="text-sm text-brand-text-dim">{total} registro(s) encontrado(s)</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1} className="w-8 h-8 rounded flex items-center justify-center text-brand-text-dim hover:text-brand-text disabled:opacity-30"><ChevronsLeft size={15} /></button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded flex items-center justify-center text-brand-text-dim hover:text-brand-text disabled:opacity-30"><ChevronLeft size={15} /></button>
            <span className="w-8 h-8 rounded bg-brand-primary text-brand-bg text-xs font-bold flex items-center justify-center">{page}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="w-8 h-8 rounded flex items-center justify-center text-brand-text-dim hover:text-brand-text disabled:opacity-30"><ChevronRight size={15} /></button>
            <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="w-8 h-8 rounded flex items-center justify-center text-brand-text-dim hover:text-brand-text disabled:opacity-30"><ChevronsRight size={15} /></button>
          </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-brand-border rounded-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-brand-border">
              <h2 className="text-lg font-bold text-brand-text">{modal === "new" ? "Nova Empresa" : "Editar Empresa"}</h2>
              <button onClick={() => setModal(null)} className="text-brand-text-dim hover:text-brand-text transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {[
                { label: "Nome *", value: formName, setter: setFormName, placeholder: "Nome da empresa", required: true, type: "text" },
                { label: "CNPJ", value: formCnpj, setter: (v: string) => setFormCnpj(formatCnpj(v)), placeholder: "00.000.000/0001-00", type: "text" },
                { label: "E-mail", value: formEmail, setter: setFormEmail, placeholder: "empresa@email.com", type: "email" },
                { label: "Telefone", value: formPhone, setter: setFormPhone, placeholder: "(00) 00000-0000", type: "text" },
                { label: "Endereço", value: formAddress, setter: setFormAddress, placeholder: "Rua, número, cidade", type: "text" },
              ].map(({ label, value, setter, placeholder, required, type }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">{label}</label>
                  <input
                    type={type} value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={placeholder}
                    required={required}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-text-dim outline-none focus:border-brand-primary transition-colors"
                  />
                </div>
              ))}
              {formError && (
                <div className="bg-brand-accent-soft border border-brand-accent/20 text-brand-accent text-xs rounded-lg px-3 py-2">{formError}</div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(null)} className="flex-1 bg-brand-bg border border-brand-border hover:border-brand-text-dim text-brand-text-muted font-semibold py-2.5 rounded-lg text-sm transition-colors">Cancelar</button>
                <button type="submit" disabled={formLoading} className="flex-1 bg-brand-primary hover:bg-brand-primary-dark text-brand-bg font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {formLoading && <Loader2 size={15} className="animate-spin" />}
                  {modal === "new" ? "Criar" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
