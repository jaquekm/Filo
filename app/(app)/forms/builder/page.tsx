"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { useQuestions } from "@/hooks/use-data";
import type { QuestionType } from "@/types/database";
import {
  ArrowLeft, Plus, Trash2, GripVertical, Check, Loader2,
} from "lucide-react";

const QUESTION_TYPES: { value: QuestionType; label: string; icon: string }[] = [
  { value: "texto_curto", label: "Texto Curto", icon: "T" },
  { value: "numero", label: "Número", icon: "#" },
  { value: "selecao_unica", label: "Seleção Única", icon: "◉" },
  { value: "multipla_escolha", label: "Múltipla Escolha", icon: "☑" },
  { value: "checkbox", label: "Checkbox", icon: "✓" },
];

interface QuestionDraft {
  key: string;
  text: string;
  type: QuestionType;
  options: string[];
  required: boolean;
}

export default function FormBuilderPage() {
  const params = useSearchParams();
  const router = useRouter();
  const formId = params.get("form");
  const supabase = createClient() as any;

  const { questions: existing, saveAll } = useQuestions(formId);
  const [formTitle, setFormTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load form info
  useEffect(() => {
    if (!formId) return;
    supabase
      .from("forms")
      .select("title")
      .eq("id", formId)
      .single()
      .then(({ data }) => {
        if (data) setFormTitle(data.title);
      });
  }, [formId]);

  // Load existing questions
  useEffect(() => {
    if (existing.length > 0 && questions.length === 0) {
      setQuestions(
        existing.map((q) => ({
          key: q.id,
          text: q.question_text,
          type: q.question_type,
          options: q.options_json ?? [],
          required: q.is_required,
        }))
      );
    }
  }, [existing]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { key: `new-${Date.now()}`, text: "", type: "texto_curto", options: [], required: false },
    ]);
  };

  const update = (idx: number, field: keyof QuestionDraft, value: any) => {
    const q = [...questions];
    (q[idx] as any)[field] = value;
    setQuestions(q);
  };

  const addOption = (idx: number) => {
    const q = [...questions];
    q[idx].options = [...q[idx].options, `Opção ${q[idx].options.length + 1}`];
    setQuestions(q);
  };

  const updateOption = (qIdx: number, oIdx: number, val: string) => {
    const q = [...questions];
    q[qIdx].options[oIdx] = val;
    setQuestions(q);
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    const q = [...questions];
    q[qIdx].options = q[qIdx].options.filter((_, i) => i !== oIdx);
    setQuestions(q);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const needsOptions = (t: QuestionType) =>
    ["selecao_unica", "multipla_escolha", "checkbox"].includes(t);

  const handleSave = async () => {
    if (!formId) return;
    setSaving(true);
    const items = questions.map((q, i) => ({
      form_id: formId,
      question_text: q.text,
      question_type: q.type,
      options_json: q.options,
      is_required: q.required,
      order_index: i,
    }));
    await saveAll(items);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-brand-text-dim hover:text-brand-text-muted mb-2 transition-colors"
      >
        <ArrowLeft size={14} /> Voltar
      </button>

      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-text mb-1">
            {formTitle || "Criador de Perguntas"}
          </h1>
          <p className="text-sm text-brand-text-dim">{questions.length} perguntas</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || questions.length === 0}
          className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-dark text-brand-bg font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : saved ? (
            <Check size={16} />
          ) : (
            <Check size={16} />
          )}
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar"}
        </button>
      </div>

      {/* Questions */}
      <div className="space-y-3 mb-5">
        {questions.map((q, idx) => (
          <div
            key={q.key}
            className="bg-brand-card border border-brand-border rounded-xl p-5 border-l-[3px] border-l-brand-primary"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-brand-primary">
                PERGUNTA {idx + 1}
              </span>
              <button
                onClick={() => removeQuestion(idx)}
                className="text-brand-accent/60 hover:text-brand-accent transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-[1fr_200px] gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1">
                  Texto <span className="text-brand-accent">*</span>
                </label>
                <input
                  value={q.text}
                  onChange={(e) => update(idx, "text", e.target.value)}
                  placeholder="Digite a pergunta..."
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-brand-text outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1">
                  Tipo
                </label>
                <select
                  value={q.type}
                  onChange={(e) => update(idx, "type", e.target.value as QuestionType)}
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-brand-text outline-none focus:border-brand-primary"
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {needsOptions(q.type) && (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-2">
                  Opções
                </label>
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2 mb-2">
                    <span
                      className="w-[18px] h-[18px] rounded-full border-2 border-brand-text-dim shrink-0"
                      style={{ borderRadius: q.type === "checkbox" ? 4 : 9 }}
                    />
                    <input
                      value={opt}
                      onChange={(e) => updateOption(idx, oi, e.target.value)}
                      className="flex-1 bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-primary"
                    />
                    <button
                      onClick={() => removeOption(idx, oi)}
                      className="text-brand-text-dim hover:text-brand-accent transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addOption(idx)}
                  className="flex items-center gap-1.5 text-xs text-brand-text-muted hover:text-brand-primary transition-colors mt-1"
                >
                  <Plus size={14} /> Adicionar Opção
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-brand-border">
              <label className="flex items-center gap-2 text-xs text-brand-text-dim cursor-pointer">
                <input
                  type="checkbox"
                  checked={q.required}
                  onChange={(e) => update(idx, "required", e.target.checked)}
                  className="accent-brand-primary"
                />
                Obrigatória
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addQuestion}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-dashed border-brand-border text-sm text-brand-text-muted hover:border-brand-primary hover:text-brand-primary transition-colors"
      >
        <Plus size={16} /> Adicionar Pergunta
      </button>
    </div>
  );
}
