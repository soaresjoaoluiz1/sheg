"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, LogIn, Lock, AtSign, User } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  identifier: z.string().min(3, "Informe seu e-mail ou WhatsApp"),
  password: z.string().min(4, "Mínimo 4 caracteres"),
});
type FormData = z.infer<typeof schema>;

export default function MoradorLoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") ?? "/morador";
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/morador/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falha");
      toast.success(`Olá, ${json.morador.name}!`);
      router.push(next);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="glow-sphere w-[600px] h-[600px] -top-[200px] left-[50%] -translate-x-1/2 opacity-25" aria-hidden />
      <div className="grid-pattern fixed inset-0 pointer-events-none" aria-hidden />

      <div className="w-full max-w-sm space-y-8 relative z-10">
        <div className="text-center space-y-3">
          <div className="grid size-16 mx-auto place-items-center rounded-2xl bg-neon text-black">
            <User className="size-7" aria-hidden />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Portal do morador</h1>
          <p className="text-sm text-muted-foreground">Acompanhe encomendas, avisos e marketplace.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="identifier">E-mail ou WhatsApp</Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden />
              <Input
                id="identifier"
                autoComplete="username"
                placeholder="seu@email.com ou +5511..."
                aria-invalid={!!errors.identifier}
                className="pl-10 h-12 bg-white/[0.04] border-white/10 rounded-xl focus:border-neon focus:ring-neon/30"
                {...register("identifier")}
              />
            </div>
            {errors.identifier && <p className="text-sm text-destructive">{errors.identifier.message}</p>}
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
                className="pl-10 h-12 bg-white/[0.04] border-white/10 rounded-xl focus:border-neon focus:ring-neon/30"
                {...register("password")}
              />
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={submitting} className="btn-neon w-full h-12 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50">
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <LogIn className="size-4" aria-hidden />}
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="bento-card !p-4 text-sm text-muted-foreground">
          <p className="font-heading font-semibold text-white mb-1">Conta de desenvolvimento</p>
          <p>WhatsApp: <code className="font-mono text-neon">+5511988887777</code></p>
          <p>Senha: <code className="font-mono text-neon">morador123</code></p>
        </div>

        <Link href="/" className="block text-center text-xs text-muted-foreground hover:text-neon transition-colors">
          ← Voltar para a página inicial
        </Link>
      </div>
    </main>
  );
}
