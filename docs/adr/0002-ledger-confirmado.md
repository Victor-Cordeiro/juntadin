# ADR 0002 - Propostas separadas do ledger confirmado

- Status: aceito
- Data: 2026-09-13

## Contexto

Texto e áudio podem ser ambíguos. Alterar saldo diretamente a partir de interpretação automática comprometeria confiança e integridade.

## Decisão

Parser e IA produzem propostas sem efeito financeiro. Somente uma confirmação explícita executa um caso de uso idempotente que grava o lançamento no ledger. Correções alteram a proposta antes da confirmação; desfazer cria um evento compensatório auditável.

## Consequências

O modelo exige uma etapa adicional, mas mantém cálculo reproduzível e permite medir precisão sem contaminar o histórico. Handlers de WhatsApp e telas nunca calculam ou gravam saldos diretamente.

