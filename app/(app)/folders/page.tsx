export const dynamic = "force-dynamic";
"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFolders } from "@/hooks/use-data";
import { FolderOpen, Plus, ArrowLeft, X, Loader2 } from "lucide-react";

const FOLDER_COLORS = ["#06D6A0", "#60A5FA", "#FBBF24", "#A78BFA", "#FF6B6B", "#FB923C"];

export default function FoldersPage() {
  const params = useSearchParams();
  const cityId = params.get("city");
  const { folders, loading, create } = useFolders(cityId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(FOLDER_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await create(name.trim(), color);
    setName("");
    setOpen(false);
    setSaving(false);
  };

  return (
    <div className="animate-fade-in">
      <Link
        href="/cities"
        className="inline-flex items-center gap-1.5 text-sm text-brand-text-dim hover:text-brand-text-muted mb-2 transition-colors"
      >
        <ArrowLeft size={14} /> Voltar para Cidades
      </Link>

      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-text mb-1">Pastas</h1>
          <p className="text-sm text-brand-text-dim">Organize pesquisas em categorias</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-dark text-brand-bg font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Plus size={16} /> Nova Pasta
        </button>
      </div>

      {!cityId ? (
        <p className="text-sm text-brand-text-dim py-20 text-center">
          Selecione uma cidade primeiro.
        </p>
      ) : loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-brand-primary" />
        </div>
      ) : folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-[72px] h-[72px] rounded-2xl bg-brand-primary-glow flex items-center justify-center mb-5">
            <FolderOpen size={32} className="text-brand-primary" />
          </div>
          <h3 className="text-lg font-bold text-brand-text mb-2">Nenhuma pasta criada</h3>
          <p className="text-sm text-brand-text-dim max-w-xs mb-5">
            Crie pastas para organizar suas pesquisas nesta cidade.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-dark text-brand-bg font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Plus size={16} /> Criar Pasta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((folder) => (
            <Link
              key={folder.id}
              href={`/forms?folder=${folder.id}`}
              className="group bg-brand-card border border-brand-border rounded-xl p-5 hover:border-brand-primary hover:bg-brand-surface-hover transition-all"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${folder.color}18` }}
                >
                  <FolderOpen size={20} style={{ color: folder.color }} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-brand-text">{folder.name}</h3>
                  {folder.description && (
                    <p className="text-xs text-brand-text-dim mt-0.5">{folder.description}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-brand-surface border border-brand-border rounded-2xl p-7 w-[480px] max-w-[90vw]">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-brand-text">Nova Pasta</h3>
              <button onClick={() => setOpen(false)} className="text-brand-text-dim hover:text-brand-text">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">
                  Nome <span className="text-brand-accent">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Pesquisa Eleitoral"
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-brand-text outline-none focus:border-brand-primary"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">
                  Cor
                </label>
                <div className="flex gap-2">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className="w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110"
                      style={{
                        background: c,
                        borderColor: color === c ? "#fff" : "transparent",
                      }}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || saving}
                className="w-full bg-brand-primary hover:bg-brand-primary-dark text-brand-bg font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Criar Pasta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
