import Link from "next/link";

const concepts = [
  {
    id: "concept-1-arrow-top",
    name: "Arrow-Top",
    description:
      "S curvado (traço arredondado, inequívoco como letra S) com seta dardo no topo-direita. Seta levemente mais larga que o traço — impacto sem exagero.",
    inspiration: "FedEx (seta) + S curvado clássico",
  },
  {
    id: "concept-2-narrow",
    name: "Narrow-Arrow",
    description:
      "Mesma base do V1 mas com a seta estreita, alinhada com a espessura do traço. Mais limpo, minimalista, discreto.",
    inspiration: "Pictograma, delivery apps clean",
  },
  {
    id: "concept-3-arrow-bottom",
    name: "Arrow-Bottom",
    description:
      "Seta apontando pra esquerda na cauda inferior do S (onde a linha naturalmente termina). Sugere 'chegou no destino'.",
    inspiration: "Apps de delivery — seta de 'entregue'",
  },
  {
    id: "concept-4-flow",
    name: "Flow",
    description:
      "Duas setas opostas: topo pra direita + cauda pra esquerda. Ciclo completo de entrega — chega, entrega, volta.",
    inspiration: "Amazon smile + loop de entrega",
  },
  {
    id: "concept-5-swoosh",
    name: "Swoosh",
    description:
      "S curvado com linha de velocidade arqueada embaixo terminando em seta. Dois elementos complementares — letra + movimento.",
    inspiration: "Nike swoosh + Amazon smile",
  },
];

export default function LogosPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0b] text-white p-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="space-y-2">
          <Link href="/" className="text-sm text-[#ccff00] hover:underline">
            ← Voltar pra home
          </Link>
          <h1 className="text-4xl font-bold font-heading">Conceitos de Logo — Shegou</h1>
          <p className="text-white/60">
            5 variações com referências de FedEx, DHL, Amazon e outras. Me diz qual gostou
            (ou nenhum) pra eu aplicar ou fazer novas iterações.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {concepts.map((c) => (
            <article
              key={c.id}
              className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-6 space-y-4 hover:border-[#ccff00]/40 transition-colors"
            >
              <div className="flex items-center justify-center aspect-square bg-black rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/logos/${c.id}.svg`}
                  alt={c.name}
                  className="w-3/4 h-3/4 object-contain"
                />
              </div>
              <div className="space-y-2">
                <h2 className="font-heading font-bold text-xl">{c.name}</h2>
                <p className="text-sm text-white/70 leading-relaxed">{c.description}</p>
                <p className="text-xs text-white/40 italic">Inspiração: {c.inspiration}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-6 space-y-3">
          <h2 className="font-heading font-bold text-xl">Como funciona</h2>
          <ul className="text-sm text-white/70 space-y-1 list-disc list-inside">
            <li>A logo atual (hexágono genérico) continua no sistema até você escolher uma.</li>
            <li>Me diz o nome do conceito favorito (ex: &quot;vai com Arrow-Tail&quot;) que eu aplico em todos os lugares — landing, admin, morador, PWA icon, manifest.</li>
            <li>Se nenhum colar, me diz o que ajustar (cor, peso, forma) que eu gero novas variações.</li>
            <li>Posso também fazer versões com wordmark &quot;Shegou&quot; do lado.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
