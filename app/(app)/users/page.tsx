"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase-browser";
import type { Profile, UserRole } from "@/types/database";
import {
  Search, Plus, Pencil, Trash2, X, Loader2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Check, Shield, User, Eye, EyeOff,
} from "lucide-react";

const ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: "admin", label: "Admin", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  { value: "pesquisador", label: "Pesquisador", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  { value: "parceiro", label: "Parceiro", color: "text-brand-primary bg-brand-primary/10 border-brand-primary/20" },
];

const PAGE_SIZES = [10, 20, 50];

interface UserWithEmail extends Profile {
  email?: string;
}

export default function UsersPage() {
  const { profile, role } = useAuth();
  const supabase = createClient() as any;

  const [users, setUsers] = useState<UserWithEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Modal novo/editar
  const [modal, setModal] = useState<"new" | "edit" | null>(null);
  const [editing, setEditing] = useState<UserWithEmail | null>(null);

  // Form novo usuário
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formRole, setFormRole] = useState<UserRole>("parceiro");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!profile?.company_id && role !== "admin") return;
    setLoading(true);

    let query = supabase
      .from("profiles")
      .select("*", { count: "exact" });

    if (profile?.company_id) {
      query = query.eq("company_id", profile.company_id);
    }

    if (!showInactive) {
      query = query.eq("is_active", true);
    }

    if (search) {
      query = query.ilike("full_name", `%${search}%`);
    }

    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1).order("created_at", { ascending: false });

    const { data, count, error } = await query;
    if (!error) {
      setUsers(data || []);
      setTotal(count || 0);
    }
    setLoading(false);
  }, [profile, role, search, showInactive, page, pageSize]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openNew = () => {
    setFormName(""); setFormEmail(""); setFormPassword("");
    setFormRole("parceiro"); setFormError(""); setFormSuccess(false);
    setEditing(null);
    setModal("new");
  };

  const openEdit = (user: UserWithEmail) => {
    setEditing(user);
    setFormName(user.full_name);
    setFormRole(user.role);
    setFormError("");
    setModal("edit");
  };

  const handleNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    try {
      const { error } = await supabase.auth.signUp({
        email: formEmail,
        password: formPassword,
        options: {
          data: {
            full_name: formName,
            role: formRole,
            company_id: profile?.company_id,
          },
        },
      });
      if (error) throw new Error(error.message);
      setFormSuccess(true);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setFormLoading(true);
    setFormError("");

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: formName, role: formRole })
      .eq("id", editing.id);

    if (error) {
      setFormError(error.message);
    } else {
      setModal(null);
      fetchUsers();
    }
    setFormLoading(false);
  };

  const toggleActive = async (user: UserWithEmail) => {
    await supabase
      .from("profiles")
      .update({ is_active: !user.is_active })
      .eq("id", user.id);
    fetchUsers();
  };

  const totalPages = Math.ceil(total / pageSize);
  const canEdit = role === "admin";

  const getRoleInfo = (r: UserRole) => ROLES.find(x => x.value === r) || ROLES[2];

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Usuários</h1>
          <p className="text-sm text-brand-text-dim mt-0.5">
            Gerencie os usuários da sua empresa
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-dark text-brand-bg font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Plus size={16} />
            Novo usuário
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-brand-card border border-brand-border rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-dim" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Digite algo para pesquisar..."
            className="w-full bg-brand-bg border border-brand-border rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-text-dim outline-none focus:border-brand-primary transition-colors"
          />
        </div>
        <button
          onClick={() => setShowInactive(!showInactive)}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
            showInactive
              ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary"
              : "bg-brand-bg border-brand-border text-brand-text-muted hover:border-brand-text-dim"
          }`}
        >
          <div className={`w-4 h-4 rounded border flex items-center justify-center ${showInactive ? "bg-brand-primary border-brand-primary" : "border-brand-text-dim"}`}>
            {showInactive && <Check size={10} className="text-brand-bg" />}
          </div>
          Exibir usuários bloqueados
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-border">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-brand-text-muted uppercase tracking-wider">Nome</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-brand-text-muted uppercase tracking-wider">E-mail</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-brand-text-muted uppercase tracking-wider">Perfil</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-brand-text-muted uppercase tracking-wider">Confirmação</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-brand-text-muted uppercase tracking-wider">Situação</th>
                {canEdit && (
                  <th className="text-right px-5 py-3.5 text-xs font-bold text-brand-text-muted uppercase tracking-wider">Ações</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Loader2 size={24} className="animate-spin text-brand-primary mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-brand-text-dim text-sm">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                users.map((user, i) => {
                  const roleInfo = getRoleInfo(user.role);
                  return (
                    <tr key={user.id} className={`border-b border-brand-border/50 hover:bg-brand-bg/40 transition-colors ${i % 2 === 0 ? "" : "bg-brand-bg/20"}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                            <User size={14} className="text-brand-primary" />
                          </div>
                          <span className="text-sm font-medium text-brand-text">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-brand-text-muted">{user.email || "—"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${roleInfo.color}`}>
                          <Shield size={10} />
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                          <Check size={10} />
                          Efetuada
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          user.is_active
                            ? "bg-green-500/10 border-green-500/20 text-green-400"
                            : "bg-red-500/10 border-red-500/20 text-red-400"
                        }`}>
                          {user.is_active ? "Desbloqueada" : "Bloqueada"}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(user)}
                              className="w-8 h-8 rounded-lg bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary flex items-center justify-center transition-colors"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => toggleActive(user)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                user.is_active
                                  ? "bg-red-500/10 hover:bg-red-500/20 text-red-400"
                                  : "bg-green-500/10 hover:bg-green-500/20 text-green-400"
                              }`}
                              title={user.is_active ? "Bloquear" : "Desbloquear"}
                            >
                              {user.is_active ? <Trash2 size={14} /> : <Check size={14} />}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-brand-border">
          <div className="flex items-center gap-2 text-sm text-brand-text-dim">
            <span>{total} registro(s) encontrado(s)</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="bg-brand-bg border border-brand-border rounded px-2 py-1 text-xs text-brand-text outline-none ml-2"
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1} className="w-8 h-8 rounded flex items-center justify-center text-brand-text-dim hover:text-brand-text disabled:opacity-30 transition-colors">
              <ChevronsLeft size={15} />
            </button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded flex items-center justify-center text-brand-text-dim hover:text-brand-text disabled:opacity-30 transition-colors">
              <ChevronLeft size={15} />
            </button>
            <span className="w-8 h-8 rounded bg-brand-primary text-brand-bg text-xs font-bold flex items-center justify-center">
              {page}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="w-8 h-8 rounded flex items-center justify-center text-brand-text-dim hover:text-brand-text disabled:opacity-30 transition-colors">
              <ChevronRight size={15} />
            </button>
            <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="w-8 h-8 rounded flex items-center justify-center text-brand-text-dim hover:text-brand-text disabled:opacity-30 transition-colors">
              <ChevronsRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-brand-border rounded-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-brand-border">
              <h2 className="text-lg font-bold text-brand-text">
                {modal === "new" ? "Novo Usuário" : "Editar Usuário"}
              </h2>
              <button onClick={() => setModal(null)} className="text-brand-text-dim hover:text-brand-text transition-colors">
                <X size={20} />
              </button>
            </div>

            {modal === "new" && formSuccess ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Check size={24} className="text-brand-primary" />
                </div>
                <p className="text-brand-text font-semibold mb-1">Usuário criado!</p>
                <p className="text-brand-text-dim text-sm mb-6">Um e-mail de confirmação foi enviado.</p>
                <div className="flex gap-3">
                  <button onClick={() => { setFormSuccess(false); setFormEmail(""); setFormPassword(""); setFormName(""); }} className="flex-1 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary font-semibold py-2.5 rounded-lg text-sm transition-colors">
                    Adicionar outro
                  </button>
                  <button onClick={() => setModal(null)} className="flex-1 bg-brand-primary hover:bg-brand-primary-dark text-brand-bg font-semibold py-2.5 rounded-lg text-sm transition-colors">
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={modal === "new" ? handleNewUser : handleEditUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">Nome *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Nome completo"
                    required
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-text-dim outline-none focus:border-brand-primary transition-colors"
                  />
                </div>

                {modal === "new" && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">E-mail *</label>
                      <input
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="usuario@email.com"
                        required
                        className="w-full bg-brand-bg border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-text-dim outline-none focus:border-brand-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">Senha *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formPassword}
                          onChange={(e) => setFormPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          required
                          minLength={6}
                          className="w-full bg-brand-bg border border-brand-border rounded-lg px-3.5 py-2.5 pr-10 text-sm text-brand-text placeholder:text-brand-text-dim outline-none focus:border-brand-primary transition-colors"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-dim hover:text-brand-text-muted transition-colors">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">Perfil *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ROLES.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setFormRole(r.value)}
                        className={`py-2 rounded-lg border text-xs font-semibold transition-colors ${
                          formRole === r.value ? r.color : "bg-brand-bg border-brand-border text-brand-text-dim hover:border-brand-text-dim"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {formError && (
                  <div className="bg-brand-accent-soft border border-brand-accent/20 text-brand-accent text-xs rounded-lg px-3 py-2">
                    {formError}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setModal(null)} className="flex-1 bg-brand-bg border border-brand-border hover:border-brand-text-dim text-brand-text-muted font-semibold py-2.5 rounded-lg text-sm transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={formLoading} className="flex-1 bg-brand-primary hover:bg-brand-primary-dark text-brand-bg font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {formLoading && <Loader2 size={15} className="animate-spin" />}
                    {modal === "new" ? "Criar Usuário" : "Salvar"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
