# Roteiro de desenvolvimento do Juntadin

Este roteiro traduz a especificação do MVP em entregas pequenas e verificáveis. A ordem privilegia confiança no livro financeiro, privacidade e aprendizado com usuários. WhatsApp, IA, cobrança e publicação entram apenas depois de a base estar comprovada.

## Princípios de execução

- Uma confirmação humana é obrigatória antes de uma proposta virar lançamento.
- Postgres é a fonte da verdade; clientes não contêm segredos nem autorização final.
- Espaços pessoais e compartilhados são isolados no banco e cobertos por testes negativos de RLS.
- Dinheiro é representado em centavos, sem ponto flutuante.
- Android, iOS e web compartilham domínio e contratos; componentes podem divergir por plataforma quando necessário.
- Cada etapa termina com evidência executável, não apenas com telas prontas.

## Fase 0 - Fundação e validação

Objetivo: preparar um projeto reproduzível e reduzir risco antes do ledger.

- [x] Consolidar especificação e identidade visual.
- [x] Definir monorepo pnpm e cliente universal Expo.
- [x] Registrar ADRs iniciais.
- [x] Configurar lint, TypeScript e testes locais.
- [x] Criar o primeiro fluxo navegável para entrevistas.
- [x] Configurar CI no GitHub.
- [ ] Realizar 12 entrevistas e testar o protótipo com 8 pessoas.
- [ ] Fechar decisões abertas: Meta/número, margem da projeção, conta Pix, e-mail, região Supabase, suporte e política preliminar de privacidade.

Saída: projeto instalável, CI verde, protótipo testado e backlog P0 priorizado.

## Fase 1 - Identidade, autenticação e isolamento

- [x] Design tokens compartilhados, fontes e componentes base acessíveis.
- [x] Cadastro, login por senha, recuperação, sessão persistente e logout.
- [x] Perfil, espaço pessoal automático e políticas RLS.
- [x] Testes provando que um usuário não lê dados de outro.
- [ ] Espaço de casal e fluxo de convite.

Saída: conta criada, onboarding concluído e isolamento demonstrado.

## Fase 2 - Núcleo financeiro local

- Contas, categorias, lançamentos e transferências atômicas.
- Proposta, confirmação, correção, cancelamento e desfazer.
- Reconstrução de saldo e invariantes do ledger.
- Painel inicial com cálculo explicável de quanto ainda pode gastar.

Saída: dois ciclos sintéticos fecham sem divergência.

## Fase 3 - Planejamento do mês

- Ciclos flexíveis, recorrências e orçamento por categoria.
- Cartões, faturas e compras parceladas sem dupla contagem.
- Projeção de consumo e fluxo de caixa com versão de fórmula.

Saída: cenários críticos de datas, cartões e projeção aprovados.

## Fase 4 - WhatsApp por regras

- Vínculo seguro do número, webhook assinado e idempotente.
- Persistência em fila, deduplicação e respostas dentro da janela operacional.
- Parser determinístico de texto em pt-BR e confirmação explícita.

Saída: mensagens suportadas geram propostas reproduzíveis; duplicatas não duplicam lançamentos.

## Fase 5 - IA, áudio e operação

- IA apenas como fallback estruturado, com contrato Zod fechado.
- Transcrição de áudio com limite e descarte do arquivo conforme TTL.
- Logs sanitizados, métricas, fila de falhas e reprocessamento auditado.

Saída: corpus avaliado com pelo menos 90% sem edição e sem dados financeiros nos logs.

## Fase 6 - Casal, direitos e privacidade

- Convite, entrada, saída e remoção imediata do espaço compartilhado.
- Preferência pessoal/compartilhada explícita em cada lançamento.
- Trial, downgrade sem apagar histórico, exportação e exclusão.

Saída: matriz de acesso e jornadas LGPD completas.

## Fase 7 - Beta e publicação

- Cobrança multiplataforma, restauração e grace period.
- E2E web/mobile, acessibilidade, carga, backup e restauração.
- Staging, builds EAS, domínio, páginas legais, lojas e rollout gradual.

Saída: beta fechada com 25 usuários; depois beta pública limitada a 100 ativações.

## Portões do produto

1. Antes do núcleo: entrevistas e protótipo.
2. Antes do beta: ledger, cartões, parcelas e transferências reconciliam.
3. Antes de tráfego: ativação, precisão e tempos dentro das metas.
4. Antes de cobrar: retenção D30 e intenção de pagamento justificam preço e escopo.
