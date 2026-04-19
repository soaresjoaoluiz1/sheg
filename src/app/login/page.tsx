"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, LogIn, Lock, Mail, Package } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") ?? "/dashboard";
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falha no login");
      toast.success("Bem-vindo de volta");
      router.push(next);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2 relative overflow-hidden">
      <div className="glow-sphere w-[600px] h-[600px] -top-[200px] -left-[200px] opacity-30" aria-hidden />
      <div className="glow-sphere-cyan w-[400px] h-[400px] bottom-[10%] right-[20%] opacity-20" aria-hidden />
      <div className="grid-pattern fixed inset-0 pointer-events-none" aria-hidden />

      <section className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#0c0c0c] to-[#0a0a0b] border-r border-white/[0.06] p-12 relative">
        <div className="glow-sphere w-[500px] h-[500px] top-[30%] left-[20%] opacity-25" aria-hidden />
        <div className="flex items-center gap-3 relative z-10">
          <div className="grid size-10 place-items-center rounded-xl bg-neon text-black">
            <Package className="size-5" aria-hidden />
          </div>
          <span className="font-heading text-xl font-bold tracking-tight">Shegou</span>
        </div>
        <div className="space-y-6 max-w-md relative z-10">
          <h1 className="font-heading text-4xl font-bold leading-tight">
            Gestão inteligente de encomendas para condomínios modernos.
          </h1>
          <p className="text-base/relaxed text-muted-foreground">
            Cadeia de custódia 100% registrada. Morador avisado em segundos.
            Portaria sem papel, sem ruído.
          </p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <span className="size-1.5 rounded-full bg-neon" aria-hidden />
              Notificação automática via WhatsApp
            </li>
            <li className="flex items-center gap-3">
              <span className="size-1.5 rounded-full bg-neon" aria-hidden />
              Foto, data e responsável a cada movimentação
            </li>
            <li className="flex items-center gap-3">
              <span className="size-1.5 rounded-full bg-neon" aria-hidden />
              Portal do morador e app da portaria
            </li>
          </ul>
        </div>
        <p className="text-xs text-white/30 relative z-10">
          © {new Date().getFullYear()} Shegou — ambiente local de desenvolvimento
        </p>
      </section>

      <section className="flex flex-col justify-center p-6 sm:p-12 relative z-10">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="grid size-10 place-items-center rounded-xl bg-neon text-black">
              <Package className="size-5" aria-hidden />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight">Shegou</span>
          </div>

          <div className="space-y-2">
            <h2 className="font-heading text-3xl font-bold tracking-tight">Entrar</h2>
            <p className="text-muted-foreground">Acesse o painel do condomínio</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className="pl-10 h-12 bg-white/[0.04] border-white/10 rounded-xl focus:border-neon focus:ring-neon/30"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p id="email-error" role="alert" className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className="pl-10 h-12 bg-white/[0.04] border-white/10 rounded-xl focus:border-neon focus:ring-neon/30"
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button type="submit" disabled={submitting} className="btn-neon w-full h-12 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <LogIn className="size-4" aria-hidden />
              )}
              {submitting ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="bento-card !p-4 text-sm text-muted-foreground">
            <p className="font-heading font-semibold text-white mb-1">Conta de desenvolvimento</p>
            <p>
              E-mail: <code className="font-mono text-neon">admin@shegou.dev</code>
            </p>
            <p>
              Senha: <code className="font-mono text-neon">admin123</code>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
