"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { useQuestions, useResponses } from "@/hooks/use-data";
import { ArrowLeft, Check, Loader2 } from "lucide-react";

export default function FormRespondPage() {
  const params = useSearchParams();
  const router = useRouter();
  const formId = params.get("form");
  const supabase = createClient() as any;

  const { questions, loading } = useQuestions(formId);
  const { submit } = useResponses(formId);
  const [formTitle, setFormTitle] = useState("");
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!formId) return;
    supabase.from("forms").select("title").eq("id", formId).single().then(({ data }) => {
      if (data) setFormTitle(data.title);
    });
  }, [formId]);

  const setAnswer = (qId: string, val: string) => setAnswers((p) => ({ ...p, [qId]: val }));

  const toggleCheckbox = (qId: string, opt: string) => {
    const current = (answers[qId] as string[]) || [];
    setAnswers((p) => ({
      ...p,
      [qId]: current.includes(opt) ? current.filter((o) => o !== opt) : [...current, opt],
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const rows = Object.entries(answers).map(([qId, val]) => ({
      question_id: qId,
      answer_value: Array.isArray(val) ? val.join(", ") : val,
    }));
    await submit(rows, "digital");
    setSubmitting(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-brand-primary-glow flex items-center justify-center mb-6">
          <Check size={40} className="text-brand-primary" />
        </div>
        <h2 className="text-2xl font-extrabold text-brand-text mb-2">Resposta Registrada!</h2>
        <p className="text-sm text-brand-text-dim mb-6">Sua resposta foi salva com sucesso.</p>
        <button
          onClick={() => router.back()}
          className="bg-brand-primary hover:bg-brand-primary-dark text-brand-bg font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-brand-text-dim hover:text-brand-text-muted mb-2 transition-colors"
      >
        <ArrowLeft size={14} /> Voltar
      </button>

      {/* Form header */}
      <div className="bg-brand-card border border-brand-border rounded-xl p-5 mb-5 border-t-[3px] border-t-brand-primary">
        <h1 className="text-xl font-extrabold text-brand-text mb-1">
          {formTitle || "Pesquisa"}
        </h1>
        <p className="text-xs text-brand-text-dim">Responda todas as perguntas obrigatórias</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-brand-primary" />
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-brand-card border border-brand-border rounded-xl p-5">
                <div className="mb-3">
                  <span className="text-sm font-semibold text-brand-text">
                    {idx + 1}. {q.question_text}
                  </span>
                  {q.is_required && (
                    <span className="text-brand-accent text-xs ml-1.5">*</span>
                  )}
                </div>

                {q.question_type === "texto_curto" && (
                  <input
                    value={(answers[q.id] as string) || ""}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    placeholder="Sua resposta..."
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-brand-text outline-none focus:border-brand-primary"
                  />
                )}

                {q.question_type === "numero" && (
                  <input
                    type="number"
                    value={(answers[q.id] as string) || ""}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    placeholder="0"
                    className="w-32 bg-brand-bg border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-brand-text outline-none focus:border-brand-primary"
                  />
                )}

                {q.question_type === "selecao_unica" && (
                  <div className="space-y-2">
                    {(q.options_json ?? []).map((opt: string) => {
                      const selected = answers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setAnswer(q.id, opt)}
                          className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-lg text-left text-sm transition-all border ${
                            selected
                              ? "bg-brand-primary-glow border-brand-primary text-brand-text"
                              : "bg-brand-bg border-brand-border text-brand-text hover:border-brand-border-light"
                          }`}
                        >
                          <span
                            className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 flex items-center justify-center ${
                              selected ? "border-brand-primary" : "border-brand-text-dim"
                            }`}
                          >
                            {selected && <span className="w-[10px] h-[10px] rounded-full bg-brand-primary" />}
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {(q.question_type === "multipla_escolha" || q.question_type === "checkbox") && (
                  <div className="space-y-2">
                    {(q.options_json ?? []).map((opt: string) => {
                      const checked = ((answers[q.id] as string[]) || []).includes(opt);
                      return (
                        <button
                          key={opt}
                          onClick={() => toggleCheckbox(q.id, opt)}
                          className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-lg text-left text-sm transition-all border ${
                            checked
                              ? "bg-brand-primary-glow border-brand-primary text-brand-text"
                              : "bg-brand-bg border-brand-border text-brand-text hover:border-brand-border-light"
                          }`}
                        >
                          <span
                            className={`w-[18px] h-[18px] rounded shrink-0 flex items-center justify-center border-2 ${
                              checked ? "border-brand-primary bg-brand-primary" : "border-brand-text-dim"
                            }`}
                          >
                            {checked && <Check size={12} className="text-brand-bg" />}
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-brand-primary hover:bg-brand-primary-dark text-brand-bg font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "Enviando..." : "Enviar Respostas"}
          </button>
        </>
      )}
    </div>
  );
}
