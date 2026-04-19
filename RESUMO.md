# Shegou Clone — Resumo Técnico Completo

> Sistema de gestão de encomendas para condomínios com notificação WhatsApp.
> Clone do https://chegou.deliwise.com.br/ com layout diferente e melhorias.
> **MVP 100% funcional rodando em localhost.**

---

## Como rodar

```bash
cd shegou
npm install              # deps (já instaladas)
npm run db:seed          # seed com dados de demo
npm run dev              # Next.js em http://localhost:3000
```

### Credenciais
| Portal | Login | Senha |
|--------|-------|-------|
| Admin | `admin@shegou.dev` | `admin123` |
| Morador | `ana@shegou.dev` ou `+5511988887777` | `morador123` |

### Scripts
```bash
npm run dev              # dev server (Turbopack)
npm run db:seed          # popular banco
npm run db:studio        # Prisma Studio
npm run db:migrate       # nova migration
npm run db:reset         # reset total
npm run worker:reminders # cron de lembretes (terminal separado)
```

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16.2.3 (App Router, Turbopack, proxy.ts) |
| UI | React 19.2 + shadcn/ui (base-ui) + Tailwind 4 |
| DB | Prisma 6 + SQLite (dev.db) |
| Auth | JWT (jose) + bcryptjs + cookies httpOnly |
| Validation | Zod 4 + react-hook-form |
| State | React Query 5 + zustand |
| Icons | Lucide React (SVG, sem emoji) |
| Charts | Recharts |
| PDF | jsPDF (protocolo + relatório) |
| WhatsApp | Evolution API (mock local ou real) + p-queue |
| PWA | manifest + install prompt |
| UX | cmdk (Cmd+K), skeleton loaders, dark mode (next-themes) |

---

## Arquitetura

```
src/
├── app/
│   ├── (admin)/              # 18 telas admin (route group com sidebar)
│   │   ├── layout.tsx        # shell com auth check + sidebar + topbar
│   │   ├── dashboard/
│   │   ├── encomendas/
│   │   ├── unidades/
│   │   ├── moradores/
│   │   ├── veiculos/
│   │   ├── facilitis/
│   │   ├── ocorrencias/
│   │   ├── reincidencia/
│   │   ├── denuncias/
│   │   ├── anunciantes/
│   │   │   └── moderacao/
│   │   ├── pedidos/
│   │   ├── avisos/
│   │   ├── whatsapp/
│   │   ├── lembretes/
│   │   ├── usuarios/         # master only
│   │   ├── leads/            # master only
│   │   ├── mapa/             # master only
│   │   └── relatorios/       # master only
│   │
│   ├── morador/              # portal morador
│   │   ├── login/            # fora do layout authed
│   │   └── (authed)/         # 5 telas com bottom nav
│   │       ├── layout.tsx
│   │       ├── page.tsx      # home
│   │       ├── encomendas/
│   │       ├── avisos/
│   │       ├── marketplace/
│   │       └── denuncias/
│   │
│   ├── api/                  # ~80 endpoints REST
│   │   ├── auth/             # login/me/logout (admin)
│   │   ├── morador/auth/     # login/me/logout (morador)
│   │   ├── morador/packages/ # scoped por residenceId
│   │   ├── morador/notices/  # filtrado por bloco/torre
│   │   ├── morador/marketplace/
│   │   ├── morador/orders/
│   │   ├── morador/complaints/
│   │   ├── condominiums/
│   │   ├── residences/ + bulk/
│   │   ├── residents/
│   │   ├── packages/ + [id]/deliver + [id]/notify
│   │   ├── vehicles/
│   │   ├── occurrences/ + [id]/notify + reincidence
│   │   ├── complaints/
│   │   ├── notices/
│   │   ├── facilitis/services/ + collaborators/
│   │   ├── advertisers/ + ad-categories/ + advertiser-products/
│   │   ├── ads-audit/
│   │   ├── orders/
│   │   ├── settings/
│   │   ├── message-queue/
│   │   ├── admin-users/ + [id]/condominiums
│   │   ├── leads/ + export/
│   │   ├── map-pins/
│   │   ├── reports/deliveries/
│   │   ├── dashboard/counts/
│   │   ├── cron/reminders/
│   │   ├── upload/
│   │   └── public/packages/[id]/
│   │
│   ├── p/[id]/               # página pública de encomenda
│   ├── login/
│   └── page.tsx              # landing page
│
├── components/
│   ├── ui/                   # shadcn (14 components)
│   ├── features/             # 16 view components (um por tela)
│   ├── admin-shell.tsx       # layout admin (sidebar + topbar + cmd+k + install)
│   ├── admin-sidebar.tsx     # nav com seções + badges + counts
│   ├── morador-shell.tsx     # layout morador (tab nav + bottom nav mobile)
│   ├── command-palette.tsx   # cmdk Cmd+K
│   ├── camera-capture.tsx    # getUserMedia front/rear + fallback file
│   ├── install-prompt.tsx    # PWA beforeinstallprompt
│   ├── skeletons.tsx         # CardList/Grid/Table/Metrics skeleton
│   ├── page-header.tsx
│   ├── empty-state.tsx
│   ├── theme-toggle.tsx
│   ├── logout-button.tsx
│   └── providers.tsx         # QueryClient + ThemeProvider
│
├── lib/
│   ├── db.ts                 # Prisma singleton
│   ├── auth.ts               # JWT admin (sign/verify/cookies)
│   ├── morador-auth.ts       # JWT morador (sessão separada)
│   ├── tenant.ts             # cookie shegou_active_condo
│   ├── rbac.ts               # requireMaster()
│   ├── api-helpers.ts        # requireSession/Condo/notFound/badRequest
│   ├── upload.ts             # saveDataUrl/saveUploadedFile → public/uploads/
│   ├── whatsapp.ts           # enqueue → DB → dispatch (Evolution API ou mock)
│   ├── reminders.ts          # processStaleReminders (por condo)
│   ├── occurrences.ts        # getReincidenceGroups (365d)
│   ├── occurrence-pdf.ts     # jsPDF protocolo A4
│   ├── deliveries-pdf.ts     # jsPDF relatório entregas A4
│   └── utils.ts              # cn() merge classes
│
├── hooks/
│   └── use-upload.ts         # uploadDataUrl()
│
├── server/
│   └── workers/
│       └── reminders.ts      # cron 60s (standalone tsx)
│
├── proxy.ts                  # auth guard (Next 16 = proxy, não middleware)
└── types/
```

---

## Banco de dados (22 tabelas)

### Core
- **Condominium** — nome, CNPJ, email, whatsapp, endereço, sindico
- **AdminUser** — email, hash, role (ADMIN|SINDICO|RONDA|ADVOGADO), isMaster
- **AdminUserCondominium** — N:N admin ↔ condo
- **Residence** — condoId, block, tower, number
- **Resident** — residenceId, name, whatsapp, email, foto, CPF, RG, passwordHash, loginEnabled

### Encomendas
- **Package** — condoId, residenceId, status (PENDING|DELIVERED), deliveryType, courier, tracking, pickupCode, fotos (arrival+release), deliveredTo
- **PackageReminder** — packageId + hoursBucket (anti-duplicação)

### Comunicação
- **MessageQueue** — condoId, to, message, status (PENDING|SENT|FAILED), attempts, scheduledAt
- **Notice** — condoId, title, body, photo, targetType (condo|block|tower)
- **Setting** — condoId + key (JSON value) — armazena: evolution_config, block_hours, reminders_config, admin_contacts, banners

### Segurança
- **Occurrence** — condoId, title, description, status, complainant, offenderUnit, offenderResidenceId, foto, notifiedAt, adminResponse
- **Complaint** — condoId, status workflow (aberta→em_analise→resolvida→arquivada), reporter/target, adminNotes

### Veículos + Facilitis
- **Vehicle** — residenceId, model, year, plate, fotos (placa+veículo)
- **FacilitisService** — condoId, title, status (SCHEDULED|IN_PROGRESS|DONE|CANCELLED), scheduledStart, collaborator
- **FacilitisCollaborator** + **FacilitisCollaboratorCondo** — N:N

### Marketplace
- **AdCategory** — name, icon, sortOrder
- **Advertiser** — name, category, contato, delivery mode/fee/min, logo, capa
- **AdvertiserCondo** — N:N
- **AdvertiserProduct** — name, description, price
- **AdsAudit** — moderação (visible toggle)
- **Order** — condoId, advertiserId, orderNumber, status, items JSON, total

### Comercial
- **Lead** — name, city, stage (kanban 5 estágios), contato, receita projetada
- **MapPin** — city, state, lat, lng (geocoding Nominatim)

---

## Auth e sessões

| Sessão | Cookie | Lib | Rotas protegidas |
|--------|--------|-----|-----------------|
| Admin | `shegou_session` | `lib/auth.ts` | `/dashboard`, `/encomendas`, `/api/*` (exceto public) |
| Morador | `shegou_morador_session` | `lib/morador-auth.ts` | `/morador/*`, `/api/morador/*` |
| Multi-tenant | `shegou_active_condo` | `lib/tenant.ts` | Injetado em todas as queries via `getActiveCondoId()` |

O proxy (`src/proxy.ts`) separa rotas admin e morador. Rotas públicas: `/`, `/login`, `/morador/login`, `/p/*`, `/api/auth/*`, `/api/morador/auth/*`, `/api/public/*`.

---

## Roles

| Role | Escopo |
|------|--------|
| MASTER (`isMaster=true`) | Tudo. Cria condos, admins, leads, map pins. Sidebar "Master" |
| ADMIN | Gestão do condo (encomendas, moradores, veículos, etc.) |
| SINDICO | Foco em ocorrências e comunicação |
| RONDA | Somente leitura de ocorrências |
| ADVOGADO | Análise de reincidência (readonly) |

---

## Fases de desenvolvimento

| Fase | Escopo | Telas | Endpoints |
|------|--------|-------|-----------|
| 0 | Setup projeto + auth | Login | 3 |
| 1 | MVP encomendas | Dashboard, Encomendas, Unidades, Moradores, /p/[id] | +15 |
| 2 | Comunicação | WhatsApp, Lembretes, Avisos + worker | +8 |
| 3 | Segurança | Ocorrências, Reincidência, Denúncias + PDF | +8 |
| 4 | Veículos + Facilitis | Veículos, Facilitis (3 abas) | +8 |
| 5 | Marketplace | Anunciantes (2 abas), Moderação, Pedidos | +12 |
| 6 | Master | Usuários, Leads, Mapa, Relatórios | +12 |
| 7 | Portal morador | Login, Home, Encomendas, Avisos, Marketplace, Denúncias | +8 |
| UX | Polish | Cmd+K, Skeletons, Badges, PWA, PageHeader | +1 |
| **Total** | | **24 telas** | **~80 endpoints** |

---

## Análise de engenharia reversa

A análise completa do sistema original está em:
- `_research/chegou/PLANO-CLONE-SISTEMA.md` — 33 telas mapeadas, 70+ endpoints, 25 tabelas, integrations
- `_research/chegou/PLANO-LOCALHOST.md` — plano de implementação localhost com stack decisions
- `_research/chegou/*.js` — 33 chunks do SPA original baixados e analisados

---

## Próximos passos possíveis

1. **OCR de etiqueta** — Tesseract.js no browser para autopreencher tracking
2. **Realtime** — SSE ou WebSocket pro dashboard atualizar sem refresh
3. **Migrar pra Postgres + Docker + MinIO** — ambiente production-like
4. **Deploy** — Vercel (frontend+API) + Neon (Postgres) + R2 (storage)
5. **Testes e2e** — Playwright dos fluxos críticos
6. **Stripe/Asaas** — cobrança recorrente
7. **Service Worker** — offline real (hoje só manifest)
8. **White-label** — permitir administradoras colocarem sua marca

---

*Documento gerado em 2026-04-16. Código em `shegou/`.*
