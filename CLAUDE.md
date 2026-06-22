# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**RotaScan** — PWA de gestão logística last-mile para galpão de Jataí/GO. Recebe encomendas de Amazon/Magalu via bipagem (scanner USB), distribui para motoristas terceirizados por rotas de bairros. Volume: 500–2.000 bipagens/dia. Todo o contexto de produto está em `PRD.md`.

Idioma do produto: **pt-BR** (código em inglês, UI em português).

## Next.js 16 — convenções importantes

- **Proxy** (antes chamado de Middleware): arquivo `src/proxy.ts`, função exportada `proxy` (não `middleware`). Documentação em `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`.
- Antes de usar qualquer API do Next.js, verificar em `node_modules/next/dist/docs/` — várias convenções mudaram na v16.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Estilo | Tailwind CSS + shadcn/ui |
| Forms | React Hook Form + Zod |
| State servidor | TanStack Query |
| Tabelas | TanStack Table |
| Gráficos | Recharts |
| Offline | Dexie (IndexedDB) + Workbox (Service Worker) |
| Banco | Supabase Postgres (Auth + RLS inclusos) |
| Deploy | Vercel |
| QR Code | `qrcode` (client-side) |
| PDF | `pdf-lib` (client-side, geração em mm) |
| Excel | `xlsx` / SheetJS (import de manifesto + export) |
| Som | HTML5 Audio API (`/public/sounds/*.mp3`) |

## Comandos

```bash
npm run dev          # servidor local (Next.js)
npm run build        # build de produção
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
```

## Arquitetura

### Papéis e autenticação

- **Admin** → acesso a todos os galpões e cadastros globais
- **Gerente** → somente o próprio galpão
- **Colaborador** → somente rotas atribuídas a ele
- **Motorista** → **sem login**, é apenas cadastro de referência (FK em `bipagens`)

Autenticação via Supabase Auth. RLS isola dados por papel em `rotas`, `bipagens`, `manifestos`, `colaboradores`, `motoristas`.

### Modelo central de dados

```
operacoes (transportadora + tipo_evento + data + colaborador)
    └──< bipagens (operacao_id + rota_id + motorista_id)
              UNIQUE(transportadora_id, codigo, tipo_evento)  ← regra cross-operação

rotas (template estável de bairros, sem motorista/data)
    └──< rota_bairros (rota_id, bairro_id, ordem)
```

- `rotas` é um **template reutilizável** — não tem transportadora, motorista nem data.
- O motorista é vinculado **por bipagem**, não por rota (um colaborador seleciona rota + motorista ativos na tela de bipagem).
- `transportadora_id` é **denormalizado em `bipagens`** para suportar o `UNIQUE` cross-operação (trigger garante consistência com `operacoes.transportadora_id`).

### Operação (unidade de trabalho)

Uma Operação agrupa bipagens de **uma transportadora + um tipo de evento**. Ciclo: `EM_ANDAMENTO` → `FINALIZADA` (imutável). Múltiplos colaboradores podem ter operações simultâneas. Múltiplas rotas por operação são permitidas — o colaborador troca de rota a qualquer momento sem interromper o fluxo.

### Tela de bipagem (crítica de performance)

- Foco permanente no campo de código; aceita scanner USB (input + Enter)
- Troca de rota deve ser **< 100ms** — não pode interromper bipagem
- Feedback: flash de tela + som (`confirmado` / `duplicado` / `erro`)
- Validação Amazon: `^TBR\d{9}$`; Magazine Luiza: qualquer string não vazia
- Duplicidade: `UNIQUE(transportadora_id, codigo, tipo_evento)` bloqueia globalmente (cross-operação)
- Override com senha (bcrypt) quando `bipagem_entrega_sem_recebimento = BLOQUEAR`

### Offline-first

- Bipagem deve funcionar **100% offline**
- Fila em **Dexie** (IndexedDB); sync via **Workbox** (background sync)
- Conflito detectado no servidor → bipagem marcada `CONFLITO` → tela de revisão manual
- UI exibe badge: "X pendentes de sincronização"

### Geração de documentos (client-side)

- **QR Code / etiquetas:** `pdf-lib` gerando PDF A4, ~70 etiquetas (21×38,2mm) por folha
- **PDF de rota para motorista:** 1 folha A4 com lista de bairros em ordem (`rota_bairros.ordem`); fonte reduz automaticamente para caber em 1 página
- **Export Excel:** `xlsx` (SheetJS), disponível em listagens e dashboard

## Regras de negócio críticas

1. **Duplicidade cross-operação:** `UNIQUE(transportadora_id, codigo, tipo_evento)` na tabela `bipagens`. Código bipado em ENTREGA por um colaborador bloqueia o mesmo código em ENTREGA em qualquer outra operação.
2. **Motorista obrigatório em não-Recebimento:** `CHECK` na tabela valida: `motorista_id IS NULL` só em `RECEBIMENTO`.
3. **Operação finalizada é imutável:** edições exigem Admin + log em `auditoria`.
4. **Configurações dinâmicas:** regex de transportadoras e `bipagem_entrega_sem_recebimento` são editáveis pelo Admin sem deploy.
5. **Senha de override:** hash bcrypt; default `8038`; registra em `auditoria` tentativas bem-sucedidas e falhas.
6. **Trocar motorista mid-rota é permitido:** registra o motorista atual em cada bipagem individualmente.
