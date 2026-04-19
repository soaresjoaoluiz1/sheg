# Guia de Uso — Sistema Shegou Clone

> Sistema de gestão de encomendas para condomínios com notificação WhatsApp.
> MVP completo rodando em localhost.

---

## 1. Iniciar o sistema

```bash
cd shegou
npm run dev              # abre http://localhost:3000
npm run worker:reminders # (outro terminal) lembretes automáticos
```

---

## 2. Primeiro acesso (Master)

Acesse `http://localhost:3000/login` com `admin@shegou.dev` / `admin123`. Você é o **Master** — tem acesso a tudo.

---

## 3. Onboarding de um condomínio novo

### Passo 1 — Criar o condomínio
Via API (ou Prisma Studio com `npm run db:studio`):
```
POST /api/condominiums
{ "name": "Residencial Flores", "cnpj": "...", "whatsapp": "+55...", "address": "..." }
```

### Passo 2 — Criar admin do condomínio
Sidebar → **Master → Usuários** → **Novo usuário**
- E-mail: `sindico@flores.com`
- Senha: `123456`
- Role: **SINDICO** (ou ADMIN)
- Clicar no ícone 🏢 para vincular ao condomínio "Residencial Flores"

### Passo 3 — Gerar unidades em lote
Logar como o síndico (ou trocar o condo ativo). Sidebar → **Unidades** → **Gerar em lote**:
- Bloco: A
- Andar inicial: 1, final: 20
- Unidades por andar: 4
- Resultado: 80 unidades (101, 102... 2004)

Repetir para Blocos B, C etc.

### Passo 4 — Cadastrar moradores
Sidebar → **Moradores** → **Novo morador**:
- Selecionar unidade (ex: A · 101)
- Nome + WhatsApp (obrigatório para receber notificações)
- Foto e CPF/RG opcionais

Para ativar o **Portal do Morador**:
- Editar o morador e preencher `email` + `senha` + marcar `loginEnabled=true`
- (Hoje isso é feito via Prisma Studio ou seed — a tela de admin ainda não tem campo de senha do morador)

### Passo 5 — Configurar WhatsApp
Sidebar → **WhatsApp** → aba **Configuração**:
- Se tiver Evolution API: preencher URL base + API key + instância
- Se não tiver: deixar vazio → modo mock (mensagens vão pro console do servidor)

Aba **Bloqueio de horário**: configurar ex: 22:00 → 07:00 (mensagens fora desse horário são reagendadas)

### Passo 6 — Configurar lembretes
Sidebar → **Lembretes**:
- Ativar
- Selecionar intervalos: 12h, 24h, 36h
- Tipos: Encomenda, Delivery
- Template com variáveis: `{morador}`, `{origem}`, `{horas}`, `{unidade}`, `{condominio}`
- O worker (`npm run worker:reminders`) roda a cada 60s e enfileira lembretes automaticamente

---

## 4. Operação diária (Portaria)

### Registrar encomenda
Sidebar → **Encomendas** → **+ Registrar**:
1. Selecionar unidade (busca por bloco/número)
2. Tipo: Encomenda / Delivery rápido / Visitante
3. Portador (Correios, iFood...) + código tracking (opcional)
4. Tirar foto da chegada (câmera ou upload)
5. Salvar → código de retirada gerado automaticamente

### Notificar morador
Na lista de encomendas → botão **Notificar**:
- Envia WhatsApp para todos os moradores da unidade
- Mensagem com template + link público `/p/[id]`
- Registrado na fila (sidebar → WhatsApp → aba Fila)

### Finalizar retirada
Botão **Finalizar** na encomenda:
1. Nome de quem retirou (pré-preenchido com primeiro morador)
2. **Foto obrigatória** da retirada (câmera)
3. Confirmar → status muda para DELIVERED + timestamp + foto salva

---

## 5. Portal do Morador

O morador acessa `http://localhost:3000/morador/login`:
- Login com e-mail ou WhatsApp + senha

**Funcionalidades:**
- **Encomendas**: vê suas encomendas pendentes, pode clicar "Já retirei" (auto-confirma sem foto)
- **Avisos**: feed de comunicados do condomínio (filtrado por bloco/torre)
- **Marketplace**: navega por anunciantes, adiciona produtos ao carrinho, faz pedido
- **Denúncias**: cria nova denúncia (com foto), acompanha status e resposta do admin

---

## 6. Gestão de segurança

### Ocorrências (sidebar → Ocorrências)
1. **Criar**: título + descrição + unidade infratora + foto de evidência
2. **Notificar infrator**: envia WhatsApp com número de protocolo
3. **Marcar andamento** → **Resolver** (com resposta admin)
4. **Exportar PDF**: protocolo formal com todos os dados

### Reincidência (sidebar → Reincidência)
- Agrupa ocorrências por unidade nos últimos 30/90/180/365 dias
- Destaca reincidentes (≥2 ocorrências) vs primeira ocorrência
- Útil para advogado do condomínio

### Denúncias (sidebar → Denúncias)
- Workflow: **aberta → em análise → resolvida → arquivada**
- Admin adiciona notas e muda status
- Morador vê a resposta no portal

---

## 7. Marketplace (sidebar → Anunciantes)

1. **Criar categorias** (aba Categorias): ex: Restaurantes, Farmácia
2. **Cadastrar anunciante**: nome, categoria, telefone, modo de entrega, taxa, pedido mínimo, logo, capa
3. **Adicionar produtos**: dentro do anunciante → botão Produtos → nome + preço
4. Morador vê no portal e faz pedidos
5. **Moderação** (sidebar → Moderação): aprovar/bloquear anúncios

---

## 8. Facilitis (sidebar → Facilitis)

- **Dashboard**: cards de status (agendado/andamento/concluído/cancelado)
- **Agenda**: criar manutenção com data/hora + responsável → avançar status (Iniciar → Concluir)
- **Colaboradores**: cadastrar prestadores (eletricista, hidráulico...)

---

## 9. Comercial/Master

Visível só para `isMaster=true`:

- **Usuários**: criar admins com roles + vincular a condomínios
- **Leads**: kanban com 5 estágios (prospecção → fechado/perdido) + export CSV
- **Mapa**: adicionar cidades (geocoding automático via Nominatim) → exibir na landing
- **Relatórios**: selecionar condo + período → tabela + PDF detalhado de entregas

---

## 10. Dicas rápidas

| Atalho | O que faz |
|--------|-----------|
| `Ctrl+K` | Abre busca rápida (Command Palette) — navega, troca tema, cria encomenda |
| Lua/Sol no topbar | Dark/light mode |
| Badges na sidebar | Contadores live (encomendas pendentes, ocorrências, pedidos) — atualizam a cada 30s |
| `/p/[id]` | Link público que vai no WhatsApp do morador |

---

## Fluxo principal resumido

```
Portaria registra encomenda
    → Foto + unidade + portador
    → Sistema gera código de retirada
    → WhatsApp automático pro morador (com link)
    → Morador vê no portal ou recebe no WhatsApp
    → Morador vai na portaria retirar
    → Portaria finaliza com nome + foto
    → Cadeia de custódia completa documentada
    → Se não retirar: lembrete automático em 12h/24h/36h
```

---

## Credenciais de desenvolvimento

| Portal | Login | Senha |
|--------|-------|-------|
| Admin | `admin@shegou.dev` | `admin123` |
| Morador | `ana@shegou.dev` ou `+5511988887777` | `morador123` |

## Scripts úteis

```bash
npm run dev              # dev server (Turbopack, http://localhost:3000)
npm run db:seed          # popular banco com dados de demo
npm run db:studio        # Prisma Studio (interface visual do banco)
npm run db:migrate       # criar nova migration
npm run db:reset         # reset total do banco
npm run worker:reminders # cron de lembretes (rodar em terminal separado)
```

---

*Documento gerado em 2026-04-16. Código em `shegou/`.*
