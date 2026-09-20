# Checklist de publicação do JuntaDin

## Código — antes do teste fechado

- [x] Remover telefone do cadastro e do perfil remoto.
- [x] Registrar aceite de Termos, Privacidade e idade no login por e-mail e Google.
- [x] Implementar exclusão de conta e dados no app.
- [x] Preservar dados exclusivos do parceiro quando o proprietário exclui a conta.
- [x] Criar páginas públicas de Privacidade, Termos, Exclusão e Suporte.
- [x] Revisar avisos de câmera, foto, áudio e IA.
- [x] Migrar sessão para armazenamento seguro.
- [x] Desabilitar backup Android e permissões legadas de armazenamento/overlay.
- [ ] Aplicar a nova migration no Supabase de produção.
- [ ] Validar exclusão com conta individual e com duas contas em espaço de casal.
- [ ] Validar primeiro login Google com usuário totalmente novo.
- [ ] Definir planos e implementar Google Play Billing antes de cobrar assinatura.

## Play Console

- [ ] Conta pessoal validada.
- [ ] Verificação de aparelho Android concluída, se solicitada.
- [ ] Categoria Finanças e público 18+.
- [ ] Política de Privacidade cadastrada.
- [ ] URL externa de exclusão cadastrada.
- [ ] Segurança dos Dados preenchida conforme a matriz.
- [ ] Recursos financeiros declarados como “Outros”.
- [ ] Declaração de anúncios como “Não”.
- [ ] Classificação de conteúdo concluída.
- [ ] Conta de demonstração e instruções em inglês informadas em “Acesso ao app”.
- [ ] Página da loja, ícone, feature graphic e screenshots concluídos.
- [ ] Play App Signing ativado.
- [ ] SHA-1 e SHA-256 da assinatura da Play cadastrados no OAuth/Supabase.
- [ ] AAB de produção enviado ao teste fechado.
- [ ] Pelo menos 12 testadores mantidos por 14 dias contínuos, se a Console exigir.
- [ ] Relatório de pré-lançamento sem bloqueadores.
- [ ] Feedback dos testadores documentado antes de solicitar produção.
