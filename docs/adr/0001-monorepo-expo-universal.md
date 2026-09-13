# ADR 0001 - Monorepo pnpm com Expo universal

- Status: aceito
- Data: 2026-09-13

## Contexto

O MVP precisa atender Android, iOS e web com uma equipe pequena, compartilhando regras financeiras e contratos sem obrigar todos os componentes visuais a serem idênticos.

## Decisão

Usar um monorepo pnpm. O cliente inicial fica em `apps/mobile` e usa React Native, Expo Router e TypeScript estrito para Android, iOS e web. Regras e tipos reutilizáveis ficam em `packages/`. Implementações específicas usam extensões de plataforma quando a experiência exigir.

## Consequências

A equipe mantém uma cadeia principal de produto e pode publicar nas três superfícies. O custo é disciplina com dependências, acessibilidade e comportamento responsivo. Se a web operacional divergir substancialmente, um cliente web separado poderá ser criado sem mover o domínio.

## Gatilho de revisão

Revisar quando limitações concretas do Expo Web bloquearem uma jornada P0 ou quando a web exigir ciclo de entrega independente.

