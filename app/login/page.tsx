export const dynamic = "force-dynamic";
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Loader2, Building2, ArrowLeft, Eye, EyeOff } from "lucide-react";

function FiloLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 12C4 10.3 5.3 9 7 9H16L19 12H33C34.7 12 36 13.3 36 15V30C36 31.7 34.7 33 33 33H7C5.3 33 4 31.7 4 30V12Z" fill="#06D6A0" fillOpacity="0.2" stroke="#06D6A0" strokeWidth="2"/>
      <rect x="11" y="16" width="14" height="12" rx="1.5" fill="#06D6A0" fillOpacity="0.3" stroke="#06D6A0" strokeWidth="1.5"/>
      <path d="M13 20L14.5 21.5L17 19" stroke="#06D6A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 24H19" stroke="#06D6A0" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="28" cy="26" r="5" fill="#0A0E17" stroke="#06D6A0" strokeWidth="2"/>
      <path d="M31.5 29.5L34 32" stroke="#06D6A0" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}
import { createClient } from "@/lib/supabase-browser";

type Tab = "login" | "register-company";

function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [tab, setTab] = useState<Tab>("login");

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Cadastro empresa
  const [companyName, setCompanyName] = useState("");
  const [companyCnpj, setCompanyCnpj] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    const { error } = await signIn(email, password);
    if (error) {
      setLoginError(error);
      setLoginLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  const formatCnpj = (value: string) => {
    const nums = value.replace(/\D/g, "").slice(0, 14);
    return nums
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError("");

    const supabase = createClient();

    try {
      // 1. Criar empresa via função SECURITY DEFINER (bypass RLS)
      const { data: fnData, error: fnError } = await supabase.rpc("register_company", {
        p_company_name: companyName,
        p_company_cnpj: companyCnpj || null,
        p_company_email: companyEmail || null,
        p_admin_name: adminName,
        p_admin_email: adminEmail,
      });

      if (fnError) throw new Error("Erro ao criar empresa: " + fnError.message);

      const companyId = (fnData as any)?.company_id;

      // 2. Criar usuário admin vinculado à empresa
      const { error: authError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: {
            full_name: adminName,
            role: "admin",
            company_id: companyId,
          },
        },
      });

      if (authError) throw new Error("Erro ao criar administrador: " + authError.message);

      setRegisterSuccess(true);
    } catch (err: any) {
      setRegisterError(err.message);
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[30%] w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[30%] w-[400px] h-[400px] bg-brand-blue/4 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <FiloLogo size={44} />
            <span className="text-4xl font-extrabold text-brand-text tracking-tight">
              Filo
            </span>
          </div>
          <p className="text-sm text-brand-text-dim">
            Sistema de Pesquisas de Campo
          </p>
        </div>

        {/* Card */}
        <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
          {/* Tabs */}
          {tab === "login" && (
            <div className="flex border-b border-brand-border">
              <button
                onClick={() => setTab("login")}
                className="flex-1 py-3 text-sm font-semibold text-brand-primary border-b-2 border-brand-primary"
              >
                Entrar
              </button>
              <button
                onClick={() => setTab("register-company")}
                className="flex-1 py-3 text-sm font-medium text-brand-text-dim hover:text-brand-text transition-colors flex items-center justify-center gap-1.5"
              >
                <Building2 size={14} />
                Cadastrar Empresa
              </button>
            </div>
          )}

          {tab === "login" ? (
            /* ── LOGIN ── */
            <form onSubmit={handleLogin} className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-text-dim outline-none focus:border-brand-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-3.5 py-2.5 pr-10 text-sm text-brand-text placeholder:text-brand-text-dim outline-none focus:border-brand-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-dim hover:text-brand-text-muted transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="bg-brand-accent-soft border border-brand-accent/20 text-brand-accent text-xs rounded-lg px-3 py-2">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-brand-primary hover:bg-brand-primary-dark text-brand-bg font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loginLoading && <Loader2 size={16} className="animate-spin" />}
                {loginLoading ? "Entrando..." : "Entrar"}
              </button>

              <div className="pt-1 border-t border-brand-border text-center">
                <button
                  type="button"
                  onClick={() => setTab("register-company")}
                  className="text-xs text-brand-text-dim hover:text-brand-primary transition-colors mt-3 inline-flex items-center gap-1"
                >
                  <Building2 size={12} />
                  Não tem conta? Cadastre sua empresa
                </button>
              </div>
            </form>
          ) : (
            /* ── CADASTRO EMPRESA ── */
            <div>
              <div className="flex items-center gap-3 p-5 border-b border-brand-border">
                <button
                  onClick={() => { setTab("login"); setRegisterSuccess(false); setRegisterError(""); }}
                  className="text-brand-text-dim hover:text-brand-text transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h2 className="text-sm font-bold text-brand-text">Cadastrar Empresa</h2>
                  <p className="text-xs text-brand-text-dim">Crie sua conta e comece a usar</p>
                </div>
              </div>

              {registerSuccess ? (
                <div className="p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Building2 size={28} className="text-brand-primary" />
                  </div>
                  <h3 className="text-brand-text font-bold text-lg mb-2">Empresa cadastrada!</h3>
                  <p className="text-brand-text-dim text-sm mb-1">Verifique o e-mail do administrador para confirmar a conta.</p>
                  <p className="text-brand-text-dim text-xs mb-6">Após confirmar, faça login normalmente.</p>
                  <button
                    onClick={() => { setTab("login"); setRegisterSuccess(false); }}
                    className="w-full bg-brand-primary hover:bg-brand-primary-dark text-brand-bg font-semibold py-2.5 rounded-lg text-sm transition-colors"
                  >
                    Ir para o Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterCompany} className="p-6 space-y-4">
                  {/* Dados da empresa */}
                  <div>
                    <p className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-3">Dados da Empresa</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1">
                          Nome da Empresa *
                        </label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Ex: Minha Empresa Ltda"
                          required
                          className="w-full bg-brand-bg border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-text-dim outline-none focus:border-brand-primary transition-colors"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1">
                            CNPJ
                          </label>
                          <input
                            type="text"
                            value={companyCnpj}
                            onChange={(e) => setCompanyCnpj(formatCnpj(e.target.value))}
                            placeholder="00.000.000/0001-00"
                            className="w-full bg-brand-bg border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-text-dim outline-none focus:border-brand-primary transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1">
                            E-mail
                          </label>
                          <input
                            type="email"
                            value={companyEmail}
                            onChange={(e) => setCompanyEmail(e.target.value)}
                            placeholder="empresa@email.com"
                            className="w-full bg-brand-bg border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-text-dim outline-none focus:border-brand-primary transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dados do admin */}
                  <div>
                    <p className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-3">Administrador</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1">
                          Nome *
                        </label>
                        <input
                          type="text"
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          placeholder="Seu nome completo"
                          required
                          className="w-full bg-brand-bg border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-text-dim outline-none focus:border-brand-primary transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1">
                          E-mail *
                        </label>
                        <input
                          type="email"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          placeholder="admin@email.com"
                          required
                          className="w-full bg-brand-bg border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-text-dim outline-none focus:border-brand-primary transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1">
                          Senha *
                        </label>
                        <div className="relative">
                          <input
                            type={showAdminPassword ? "text" : "password"}
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            required
                            minLength={6}
                            className="w-full bg-brand-bg border border-brand-border rounded-lg px-3.5 py-2.5 pr-10 text-sm text-brand-text placeholder:text-brand-text-dim outline-none focus:border-brand-primary transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminPassword(!showAdminPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-dim hover:text-brand-text-muted transition-colors"
                          >
                            {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {registerError && (
                    <div className="bg-brand-accent-soft border border-brand-accent/20 text-brand-accent text-xs rounded-lg px-3 py-2">
                      {registerError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={registerLoading}
                    className="w-full bg-brand-primary hover:bg-brand-primary-dark text-brand-bg font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {registerLoading && <Loader2 size={16} className="animate-spin" />}
                    {registerLoading ? "Cadastrando..." : "Cadastrar Empresa"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPageWrapper() {
  return (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
}
