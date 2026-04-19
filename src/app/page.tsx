import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Clock,
  Package,
  Shield,
  Zap,
  Users,
  Building2,
  Phone,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { ForceLight } from "@/components/force-theme";

const WA_LINK = "https://wa.me/5511999999999?text=Ol%C3%A1%2C%20quero%20conhecer%20o%20Shegou!";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 relative overflow-hidden">
      <ForceLight />
      <div className="glow-sphere w-[800px] h-[800px] -top-[300px] left-[10%] opacity-30" aria-hidden />
      <div className="glow-sphere-cyan w-[600px] h-[600px] top-[60%] -right-[200px] opacity-20" aria-hidden />
      <div className="grid-pattern fixed inset-0 pointer-events-none" aria-hidden />

      {/* NAV */}
      <header className="glass sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Package className="size-4" aria-hidden />
            </div>
            <span className="font-heading font-bold tracking-tight text-lg">Shegou</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="#preco" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors">
              Preços
            </Link>
            <Link href="#como-funciona" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors">
              Como funciona
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Login
            </Link>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="btn-neon px-5 py-2 text-sm inline-flex items-center gap-2">
              Testar grátis
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1 relative z-10">

        {/* HERO */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-32">
          <div className="max-w-3xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] dark:border-white/10 dark:bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" aria-hidden />
              Gestão de encomendas para condomínios
            </div>
            <h1 className="font-heading text-5xl sm:text-7xl font-bold tracking-tight leading-[0.95]">
              Gestão inteligente de encomendas para condomínios{" "}
              <span className="text-primary">modernos.</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Registro com foto, notificação automática via WhatsApp e cadeia de
              custódia completa. Da chegada à retirada — documentado, sem papel, sem ruído.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="btn-cta-slide px-8 py-3.5 text-base inline-flex items-center gap-2 animate-pulse-neon">
                <span className="flex items-center gap-2">
                  Quero testar grátis por 14 dias
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </a>
              <Link
                href="#como-funciona"
                className="rounded-full px-8 py-3.5 text-base border border-border text-foreground hover:bg-muted transition-colors inline-flex items-center gap-2"
              >
                Ver como funciona
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-primary" aria-hidden /> Ativo em 24 horas</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-primary" aria-hidden /> Sem fidelidade</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-primary" aria-hidden /> Suporte humano</span>
            </div>
          </div>
        </section>

        {/* PROBLEMA */}
        <section className="border-t border-border relative">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 space-y-12">
            <div className="max-w-2xl space-y-4">
              <p className="text-sm font-medium text-primary uppercase tracking-wider">O problema</p>
              <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight">
                O caos das encomendas na portaria
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {problems.map((p) => (
                <div key={p.title} className="bento-card space-y-4">
                  <span className="text-3xl">{p.emoji}</span>
                  <h3 className="font-heading font-semibold text-lg">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SOLUÇÃO / FEATURES */}
        <section className="border-t border-border relative">
          <div className="glow-sphere-emerald w-[500px] h-[500px] top-0 left-[50%] -translate-x-1/2 opacity-20" aria-hidden />
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 space-y-12">
            <div className="max-w-2xl space-y-4">
              <p className="text-sm font-medium text-primary uppercase tracking-wider">A solução</p>
              <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight">
                Tudo que sua portaria precisa
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.title} className="bento-card space-y-4">
                  <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <f.icon className="size-6" aria-hidden />
                  </div>
                  <h3 className="font-heading font-semibold text-lg">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="border-t border-border relative">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 space-y-12">
            <div className="max-w-2xl space-y-4">
              <p className="text-sm font-medium text-primary uppercase tracking-wider">Fluxo</p>
              <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight">
                Da chegada à retirada: simples e documentado
              </h2>
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
              {steps.map((s, i) => (
                <div key={s.title} className="bento-card space-y-4 relative">
                  <div className="font-heading text-5xl font-bold text-primary/20">0{i + 1}</div>
                  <h3 className="font-heading font-semibold text-xl">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                  {i < 2 && (
                    <ChevronRight className="hidden lg:block absolute -right-5 top-1/2 size-6 text-primary/30" aria-hidden />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PREÇO */}
        <section id="preco" className="border-t border-border relative">
          <div className="glow-sphere w-[600px] h-[600px] top-[20%] left-[50%] -translate-x-1/2 opacity-15" aria-hidden />
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 space-y-12">
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <p className="text-sm font-medium text-primary uppercase tracking-wider">Planos</p>
              <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight">
                Planos que cabem no orçamento
              </h2>
              <p className="text-muted-foreground">
                WhatsApp incluído em todos. Sem fidelidade. 14 dias grátis.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {plans.map((p) => (
                <div key={p.name} className={`bento-card space-y-6 relative ${p.featured ? "ring-2 ring-primary" : ""}`}>
                  {p.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 btn-neon px-4 py-1 text-xs">
                      Mais popular
                    </div>
                  )}
                  <div className="space-y-2">
                    <h3 className="font-heading font-semibold text-lg">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">{p.subtitle}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="font-heading text-4xl font-bold">R${p.price}</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    <p className="text-xs text-muted-foreground">ou R${p.annual}/mês no plano anual</p>
                  </div>
                  <ul className="space-y-2.5 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" aria-hidden />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={WA_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-3 rounded-full text-sm font-semibold text-center inline-flex items-center justify-center gap-2 transition-all ${
                      p.featured
                        ? "btn-neon"
                        : "border border-border hover:bg-muted"
                    }`}
                  >
                    Começar teste grátis
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 py-20 space-y-12">
            <div className="text-center space-y-4">
              <p className="text-sm font-medium text-primary uppercase tracking-wider">FAQ</p>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
                Perguntas frequentes
              </h2>
            </div>
            <div className="space-y-4">
              {faqs.map((f) => (
                <details key={f.q} className="bento-card group">
                  <summary className="flex items-center justify-between cursor-pointer font-heading font-semibold list-none">
                    {f.q}
                    <ChevronRight className="size-4 text-muted-foreground group-open:rotate-90 transition-transform" aria-hidden />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="border-t border-border relative">
          <div className="glow-sphere w-[500px] h-[500px] top-0 left-[50%] -translate-x-1/2 opacity-20" aria-hidden />
          <div className="mx-auto max-w-3xl px-4 sm:px-6 py-20 text-center space-y-8 relative z-10">
            <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight">
              Pronto pra tirar a portaria do modo manual?
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Fale com nosso time e veja o Shegou funcionando em 15 minutos. Ativação em 24 horas, sem burocracia.
            </p>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cta-slide px-10 py-4 text-lg inline-flex items-center gap-3 animate-pulse-neon"
            >
              <span className="flex items-center gap-2">
                <Phone className="size-5" aria-hidden />
                Falar com nosso time no WhatsApp
              </span>
            </a>
            <p className="text-sm text-muted-foreground">
              Resposta em até 2 horas · Teste grátis por 14 dias
            </p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border py-10 relative z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Package className="size-3" aria-hidden />
            </div>
            <span className="font-heading font-semibold text-foreground">Shegou</span>
          </div>
          <span>© {new Date().getFullYear()} Shegou. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  );
}

const problems = [
  {
    emoji: "📦",
    title: "Encomendas empilhadas",
    description: "O volume de compras online triplicou. Sua portaria não foi feita pra isso. Pacotes se acumulam, espaço acaba, organização vai pro chão.",
  },
  {
    emoji: "📞",
    title: "Porteiro ligando pro morador",
    description: "Interrompe o trabalho, gasta tempo, nem sempre atende. E quem anota o recado? Caderno de papel não é rastreável.",
  },
  {
    emoji: "🤷",
    title: '"Cadê minha encomenda?"',
    description: "Morador reclama, ninguém sabe quem retirou, zero documentação. Quem assume o extravio? Sem prova, sem defesa.",
  },
];

const features = [
  {
    icon: Bell,
    title: "Notificação automática",
    description: "Morador avisado via WhatsApp em segundos — sem o porteiro precisar ligar.",
  },
  {
    icon: Shield,
    title: "Cadeia de custódia",
    description: "Foto, data, responsável e código de retirada. Prova jurídica em caso de contestação.",
  },
  {
    icon: Zap,
    title: "Registro em 8 segundos",
    description: "Porteiro registra pelo celular. Sem papel, sem sistema complicado, sem treinamento.",
  },
  {
    icon: Clock,
    title: "Lembretes inteligentes",
    description: "Encomenda parada há 24h? O sistema cobra o morador automaticamente via WhatsApp.",
  },
  {
    icon: Users,
    title: "Portal do morador",
    description: "Morador acompanha tudo pelo celular — encomendas, avisos, marketplace, denúncias.",
  },
  {
    icon: Building2,
    title: "Multi-condomínio",
    description: "Síndicos profissionais gerenciam múltiplos prédios numa única conta.",
  },
];

const steps = [
  {
    title: "Encomenda chega",
    description: "Porteiro registra pelo celular em 8 segundos — foto, unidade, portador. Código de retirada gerado automaticamente.",
  },
  {
    title: "Morador notificado",
    description: "WhatsApp automático com link de confirmação. Se não retirar, lembrete em 12h, 24h e 36h.",
  },
  {
    title: "Retirada documentada",
    description: "Foto do momento da retirada + nome de quem pegou. Cadeia de custódia completa e rastreável.",
  },
];

const plans = [
  {
    name: "Essencial",
    subtitle: "Condomínios com até 80 unidades",
    price: "79",
    annual: "67",
    featured: false,
    features: [
      "Até 80 unidades",
      "1 condomínio",
      "WhatsApp incluído",
      "Lembretes automáticos",
      "Portal do morador",
      "Suporte por e-mail",
    ],
  },
  {
    name: "Pro",
    subtitle: "Síndicos profissionais, até 200 unidades",
    price: "129",
    annual: "109",
    featured: true,
    features: [
      "Até 200 unidades",
      "Até 10 condomínios",
      "WhatsApp incluído",
      "Marketplace + Ocorrências",
      "Relatórios PDF",
      "Multi-condomínio",
      "Suporte WhatsApp",
    ],
  },
  {
    name: "Enterprise",
    subtitle: "Administradoras e grandes operações",
    price: "199",
    annual: "169",
    featured: false,
    features: [
      "Unidades ilimitadas",
      "Condomínios ilimitados",
      "WhatsApp incluído",
      "Todas as features",
      "Suporte dedicado",
      "Onboarding prioritário",
    ],
  },
];

const faqs = [
  {
    q: "Precisa instalar algo?",
    a: "Não. É 100% web. Roda no celular do porteiro, no computador do síndico e no WhatsApp do morador.",
  },
  {
    q: "Funciona pra porteiros que não são tech?",
    a: "Sim. A interface foi desenhada pra ser usada sem treinamento. Troca de porteiro? Zero dor de cabeça.",
  },
  {
    q: "O WhatsApp é cobrado à parte?",
    a: "Não. WhatsApp está incluído em todos os planos. Sem taxa extra, sem surpresa na fatura.",
  },
  {
    q: "Posso migrar de outro sistema?",
    a: "Sim. Importamos seus dados e a portaria opera no mesmo dia. Onboarding incluso em todos os planos.",
  },
  {
    q: "Tem contrato de fidelidade?",
    a: "Não. Cancele quando quiser. Sem multa, sem burocracia. Você fica porque funciona, não porque está preso.",
  },
];
