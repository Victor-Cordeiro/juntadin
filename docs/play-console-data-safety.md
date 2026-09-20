# Matriz de Segurança dos Dados — JuntaDin

Base para preencher **Play Console → Conteúdo do app → Segurança dos dados**. Deve ser revisada sempre que SDKs, logs ou recursos mudarem.

## Respostas gerais propostas

- O app coleta ou compartilha dados obrigatórios: **Sim**.
- Dados criptografados em trânsito: **Sim**, via HTTPS/TLS.
- Usuários podem solicitar exclusão: **Sim**, dentro do app e em `https://victor-cordeiro.github.io/juntadin/excluir-conta/`.
- O app segue a Política para famílias: **não se aplica**; público declarado de 18 anos ou mais.
- Venda de dados: **Não**.
- Publicidade comportamental: **Não**.

## Dados transmitidos para fora do aparelho

| Categoria do Play | Dado | Coletado | Compartilhado | Obrigatório | Finalidades | Observação |
|---|---|---:|---:|---:|---|---|
| Informações pessoais | Nome | Sim | Não* | Sim | Funcionalidade, gerenciamento da conta | Perfil no Supabase |
| Informações pessoais | E-mail | Sim | Não* | Sim | Autenticação, segurança, suporte | Supabase Auth e Google OAuth quando escolhido |
| Informações pessoais | IDs do usuário | Sim | Não* | Sim | Autenticação, sincronização, prevenção de fraude | UUID da conta |
| Informações financeiras | Histórico de compras | Sim | Não* | Opcional | Funcionalidade, análises do próprio usuário | Despesas e compras registradas pelo usuário |
| Informações financeiras | Outras informações financeiras | Sim | Não* | Opcional | Funcionalidade, personalização | Receitas, limites, dívidas, contas e saldos informados |
| Fotos e vídeos | Fotos | Sim | Não* | Opcional | Funcionalidade | Comprovante escolhido para extração; não é salvo como item da conta |
| Áudio | Gravações de voz ou som | Sim | Não* | Opcional | Funcionalidade | Ditado escolhido para extração; arquivo local temporário é apagado |
| Atividade no app | Outro conteúdo gerado pelo usuário | Sim | Não* | Opcional | Funcionalidade | Texto e notas enviados para lançamento/IA |
| Atividade no app | Interações no app | Sim | Não* | Opcional | Segurança, prevenção de fraude | Contagem diária de solicitações à IA |
| Informações e desempenho do app | Registros de falhas/diagnóstico | Sim | Não* | Sim | Segurança, diagnóstico | Metadados técnicos de Supabase/Google Cloud; não registrar conteúdo financeiro |

`*` Supabase e Google Cloud são tratados como prestadores que processam dados em nome do JuntaDin. Confirmar a exceção de “prestador de serviço” no formulário e manter DPA/termos aplicáveis; se algum fornecedor usar os dados para finalidade própria fora dessa exceção, mudar para “Compartilhado: Sim”.

## Dados processados somente no aparelho

- Foto de perfil: armazenada localmente e não enviada pelo fluxo atual.
- Preferências locais e cópia offline dos movimentos: armazenadas no sandbox do app; o backup Android está desabilitado.
- Sessão: armazenada no Android Keystore/iOS Keychain através do Expo SecureStore.

Dados processados exclusivamente no aparelho não entram como “coletados” no formulário, mas continuam descritos na Política de Privacidade.

## Declaração de recursos financeiros

- Selecionar **Outros** em recursos financeiros.
- Não selecionar empréstimo, banco, pagamento, carteira, transferência, investimento, criptomoeda, seguro ou monitoramento de crédito.
- Não selecionar aconselhamento financeiro enquanto a JuntaAI apenas registrar e consultar os dados do usuário.

## Declarações adicionais

- Anúncios: **Não**, enquanto nenhum SDK de anúncios estiver integrado.
- Público-alvo: **18 anos ou mais**.
- Acesso ao app: fornecer conta de demonstração por e-mail/senha, já confirmada e sem 2FA.
- Categoria: **Finanças**.
- IA generativa: a JuntaAI tem escopo limitado de extração e consulta financeira; manter revisão humana antes de confirmar e canal de suporte para relatos.
