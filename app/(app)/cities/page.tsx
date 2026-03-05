"use client";

import { useState } from "react";
import Link from "next/link";
import { useCities } from "@/hooks/use-data";
import { Building2, Plus, ChevronRight, X, Loader2 } from "lucide-react";

const STATES = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

export default function CitiesPage() {
  const { cities, loading, create } = useCities();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [state, setState] = useState("PR");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await create(name.trim(), state);
    setName("");
    setState("PR");
    setOpen(false);
    setSaving(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-text mb-1">Cidades</h1>
          <p className="text-sm text-brand-text-dim">Gerencie os ambientes de pesquisa</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-dark text-brand-bg font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Plus size={16} /> Nova Cidade
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-brand-primary" />
        </div>
      ) : cities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-[72px] h-[72px] rounded-2xl bg-brand-primary-glow flex items-center justify-center mb-5">
            <Building2 size={32} className="text-brand-primary" />
          </div>
          <h3 className="text-lg font-bold text-brand-text mb-2">Nenhuma cidade cadastrada</h3>
          <p className="text-sm text-brand-text-dim max-w-xs mb-5">
            Crie sua primeira cidade para começar a organizar pesquisas.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-dark text-brand-bg font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Plus size={16} /> Criar Cidade
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cities.map((city) => (
            <Link
              key={city.id}
              href={`/folders?city=${city.id}`}
              className="group bg-brand-card border border-brand-border rounded-xl p-5 hover:border-brand-primary hover:bg-brand-surface-hover transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-[17px] font-bold text-brand-text">{city.name}</h3>
                  <span className="inline-block mt-1 text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
                    {city.state}
                  </span>
                </div>
                <ChevronRight size={18} className="text-brand-text-dim group-hover:text-brand-primary transition-colors" />
              </div>
              <div className="text-xs text-brand-text-dim mt-4">
                Criada em {new Date(city.created_at).toLocaleDateString("pt-BR")}
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
              <h3 className="text-lg font-bold text-brand-text">Nova Cidade</h3>
              <button onClick={() => setOpen(false)} className="text-brand-text-dim hover:text-brand-text">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">
                  Nome da Cidade <span className="text-brand-accent">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Curitiba"
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-brand-text outline-none focus:border-brand-primary"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">
                  Estado <span className="text-brand-accent">*</span>
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-brand-text outline-none focus:border-brand-primary"
                >
                  {STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || saving}
                className="w-full bg-brand-primary hover:bg-brand-primary-dark text-brand-bg font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Criar Cidade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
