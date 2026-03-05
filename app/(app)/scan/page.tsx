"use client";

import { useState, useRef, useCallback } from "react";
import { ScanLine, Camera, Upload, Check, Loader2, X, AlertCircle } from "lucide-react";

type Step = "ready" | "camera" | "processing" | "review" | "done";

interface DetectedAnswer {
  questionIdx: number;
  question: string;
  answer: string;
  confidence: number;
}

export default function ScanPage() {
  const [step, setStep] = useState<Step>("ready");
  const [progress, setProgress] = useState(0);
  const [detectedAnswers, setDetectedAnswers] = useState<DetectedAnswer[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      setStream(s);
      setStep("camera");
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      alert("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }, [stream]);

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    stopCamera();
    processOCR();
  };

  const processOCR = () => {
    setStep("processing");
    setProgress(0);

    // Simulate OCR processing
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.random() * 18;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setDetectedAnswers([
              { questionIdx: 1, question: "Em quem você votaria hoje?", answer: "Candidato A", confidence: 96 },
              { questionIdx: 2, question: "Principal preocupação?", answer: "Saúde, Segurança", confidence: 91 },
              { questionIdx: 3, question: "Avaliação do governo (1-10)", answer: "7", confidence: 98 },
              { questionIdx: 4, question: "Sugestão:", answer: "Mais investimento em saúde", confidence: 84 },
              { questionIdx: 5, question: "Votou na última eleição?", answer: "Sim", confidence: 97 },
            ]);
            setStep("review");
          }, 500);
          return 100;
        }
        return next;
      });
    }, 200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // In production: send to Tesseract.js or API
    processOCR();
  };

  const confirmAndSave = () => {
    // In production: save to Supabase via useResponses().submit()
    setStep("done");
  };

  const reset = () => {
    stopCamera();
    setStep("ready");
    setProgress(0);
    setDetectedAnswers([]);
  };

  // ─── DONE ───
  if (step === "done") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-brand-primary-glow flex items-center justify-center mb-6">
          <Check size={40} className="text-brand-primary" />
        </div>
        <h2 className="text-2xl font-extrabold text-brand-text mb-2">Scan Salvo!</h2>
        <p className="text-sm text-brand-text-dim mb-6">
          {detectedAnswers.length} respostas detectadas e salvas com sucesso.
        </p>
        <button
          onClick={reset}
          className="bg-brand-primary hover:bg-brand-primary-dark text-brand-bg font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          Escanear Outro
        </button>
      </div>
    );
  }

  // ─── REVIEW ───
  if (step === "review") {
    return (
      <div className="animate-fade-in max-w-2xl">
        <h1 className="text-2xl font-extrabold text-brand-text mb-1">Confirmar Respostas</h1>
        <p className="text-sm text-brand-text-dim mb-6">
          Verifique as respostas detectadas pelo OCR
        </p>

        <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-4 mb-4 flex items-center gap-3">
          <Check size={18} className="text-brand-primary shrink-0" />
          <span className="text-sm text-brand-primary font-semibold">
            OCR detectou {detectedAnswers.length} respostas com{" "}
            {Math.round(detectedAnswers.reduce((s, a) => s + a.confidence, 0) / detectedAnswers.length)}% de confiança média
          </span>
        </div>

        <div className="space-y-3 mb-6">
          {detectedAnswers.map((a) => (
            <div key={a.questionIdx} className="bg-brand-card border border-brand-border rounded-xl p-4">
              <div className="text-sm font-semibold text-brand-text mb-2">
                {a.questionIdx}. {a.question}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                    a.confidence >= 90
                      ? "bg-brand-primary/10 text-brand-primary"
                      : "bg-brand-warning/10 text-brand-warning"
                  }`}
                >
                  {a.confidence}%
                </span>
                <input
                  defaultValue={a.answer}
                  className="flex-1 bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-primary"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={confirmAndSave}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary-dark text-brand-bg font-semibold py-3 rounded-lg text-sm transition-colors"
          >
            <Check size={16} /> Confirmar e Salvar
          </button>
          <button
            onClick={reset}
            className="px-6 py-3 rounded-lg border border-brand-border text-sm text-brand-text-muted hover:bg-brand-surface-hover transition-colors"
          >
            Descartar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-extrabold text-brand-text mb-1">Scanner OCR</h1>
      <p className="text-sm text-brand-text-dim mb-7">
        Escaneie formulários impressos preenchidos
      </p>

      <div className="bg-brand-card border border-brand-border rounded-2xl flex flex-col items-center justify-center min-h-[400px] p-12">
        {/* READY */}
        {step === "ready" && (
          <>
            <div className="w-28 h-28 rounded-3xl bg-brand-primary-glow border-2 border-dashed border-brand-primary flex items-center justify-center mb-6">
              <ScanLine size={52} className="text-brand-primary" />
            </div>
            <h3 className="text-lg font-bold text-brand-text mb-2">Pronto para Escanear</h3>
            <p className="text-sm text-brand-text-dim text-center max-w-sm mb-6 leading-relaxed">
              Posicione o formulário preenchido de frente para a câmera.
              O OCR detectará automaticamente as respostas marcadas.
            </p>
            <div className="flex gap-3">
              <button
                onClick={startCamera}
                className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-dark text-brand-bg font-semibold px-6 py-3 rounded-lg text-sm transition-colors"
              >
                <Camera size={16} /> Abrir Câmera
              </button>
              <label className="flex items-center gap-2 px-6 py-3 rounded-lg border border-brand-border text-sm text-brand-text-muted hover:bg-brand-surface-hover transition-colors cursor-pointer">
                <Upload size={16} /> Upload
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </>
        )}

        {/* CAMERA */}
        {step === "camera" && (
          <div className="w-full max-w-lg">
            <div className="relative rounded-xl overflow-hidden bg-black mb-4">
              <video ref={videoRef} autoPlay playsInline className="w-full" />
              <div className="absolute inset-0 border-2 border-brand-primary/30 rounded-xl pointer-events-none">
                <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-brand-primary" />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-brand-primary" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-brand-primary" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-brand-primary" />
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={capture}
                className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-dark text-brand-bg font-semibold px-8 py-3 rounded-full text-sm transition-colors"
              >
                <Camera size={18} /> Capturar
              </button>
              <button
                onClick={() => { stopCamera(); setStep("ready"); }}
                className="px-6 py-3 rounded-full border border-brand-border text-sm text-brand-text-muted hover:bg-brand-surface-hover transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* PROCESSING */}
        {step === "processing" && (
          <>
            <h3 className="text-lg font-bold text-brand-text mb-4">Processando OCR...</h3>
            <div className="w-full max-w-xs h-2 rounded-full bg-brand-bg mb-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-blue transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-brand-text-dim">
              {Math.round(progress)}% — Detectando respostas
            </p>
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Info */}
      <div className="mt-6 bg-brand-card border border-brand-border rounded-xl p-5">
        <h4 className="text-sm font-bold text-brand-text mb-3 flex items-center gap-2">
          <AlertCircle size={16} className="text-brand-blue" /> Como funciona o Scanner
        </h4>
        <div className="space-y-2 text-sm text-brand-text-dim">
          <p>1. Abra a câmera ou faça upload de uma foto do formulário preenchido</p>
          <p>2. O OCR (Tesseract.js) detecta o texto e marcações</p>
          <p>3. Revise e corrija as respostas detectadas</p>
          <p>4. Confirme para salvar as respostas no sistema</p>
        </div>
      </div>
    </div>
  );
}
