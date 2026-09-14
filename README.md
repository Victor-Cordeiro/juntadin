# juntadin

Planejamento financeiro pessoal e para casais, com registro assistido pelo WhatsApp e confirmação humana antes de qualquer alteração no livro financeiro.

## Estado atual

O projeto está na transição da Fase 0 para a Fase 1. A aplicação usa Expo + React Native + Expo Router para Android, iOS e web, com Supabase Auth, Postgres e Row Level Security no backend. Nesta fase, o cadastro já libera o acesso imediatamente; a confirmação de e-mail será adicionada quando o fluxo comercial estiver pronto.

## Começar localmente

Pré-requisitos: Node.js 24+, pnpm 11+, Git e Docker Desktop.

```bash
pnpm install
pnpm supabase:start
Copy-Item apps/mobile/.env.example apps/mobile/.env.local
pnpm dev:web
```

Depois de iniciar o Supabase, copie a `Publishable key` exibida pelo comando para `EXPO_PUBLIC_SUPABASE_ANON_KEY` em `apps/mobile/.env.local`. O endereço local padrão da API já está no exemplo.

Nunca coloque `service_role`, `secret key` ou a senha do banco em variáveis `EXPO_PUBLIC_*`: tudo o que usa esse prefixo é incorporado ao cliente.

## Validação

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm dlx expo-doctor@latest apps/mobile
pnpm --filter @juntadin/mobile exec expo export --platform web --output-dir dist
pnpm supabase:test
```

O workflow `.github/workflows/ci.yml` executa esses controles em cada pull request e push para `main`.

Leia [docs/ROADMAP.md](docs/ROADMAP.md) antes de implementar funcionalidades e registre decisões estruturais em `docs/adr/`.
