# ADR 0003 - Supabase/Postgres com RLS

- Status: aceito para o MVP
- Data: 2026-09-13

## Contexto

O produto precisa de autenticação, banco relacional, armazenamento temporário, funções de borda e isolamento rigoroso entre espaços pessoais e compartilhados.

## Decisão

Usar Supabase com Postgres como fonte da verdade. Toda tabela pertencente a um espaço terá `space_id NOT NULL`; autorização será aplicada no servidor e por Row Level Security. Migrações e testes negativos de acesso serão versionados.

## Consequências

Há menos infraestrutura para operar no MVP, mas RLS incorreta continua sendo responsabilidade do projeto. Qualquer vazamento em teste bloqueia a entrega. Regras de domínio permanecem TypeScript puro para permitir migração futura.

