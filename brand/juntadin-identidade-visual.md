# Juntadin — identidade visual

Versão 2 · 13/09/2026 · derivada da *Especificação do MVP de finanças pelo WhatsApp*

> **O que mudou da v1:** os dois discos viraram **moedas de verdade**, com borda. Entraram duas marcas auxiliares — **a pilha** (juntar) e **a moeda** (marcador e favicon) — e o acento passou a se chamar **Ouro-dindin**. A estrutura de união, o balão e o verde continuam os mesmos.

---

## 1. O que a marca precisa resolver

| A especificação diz | A marca responde |
|---|---|
| “Confiabilidade antes de automação. Uma mensagem ambígua gera proposta, não lançamento.” | Marca sóbria, de instituição, não de bot divertido. |
| “Casal com privacidade. Cada participante possui espaço pessoal isolado.” | O símbolo desenha dois espaços separados e um encontro delimitado. |
| “Linguagem comum… Ajuda explica termos.” | Tipografia legível, voz sem jargão, sem alarme. |
| “Marketing não deve anunciar ‘saldo exato’ quando contas são manuais.” | Nada de superlativo, gráfico de foguete ou verde-dólar. |

O produto não vende enriquecimento. Vende **saber onde você está**. A identidade precisa parecer calma, não empolgada.

---

## 2. O nome

**juntadin** — sempre em caixa baixa, uma palavra, sem acento.

Três sentidos que já estavam lá:

1. **juntar** dinheiro — o objetivo.
2. **din** / dindin — dinheiro no jeito informal, do dia a dia. Combina com “Mercado 58,90 no Pix hoje”.
3. **juntadinho** — duas pessoas perto uma da outra, sem virarem uma só. É a definição exata do Modo Casal da página 22.

**Como escrever:** *juntadin* no logotipo e em peças de marca; *Juntadin* no meio de frase (“O Juntadin não acessa seu banco”); nunca *JuntaDin*, *JUNTADIN* ou *Junta Din*.

**Verificar antes de gastar dinheiro com isso:** INPI (classes 09 e 42), domínio `juntadin.com.br` no Registro.br, disponibilidade nas lojas e @ nas redes.

---

## 3. Posicionamento em uma frase

> **Mande o gasto. Confirme. Veja o mês inteiro.**

Três verbos, na ordem do produto, todos verificáveis. Selo de confiança sempre que houver espaço:

> *Não conectamos ao seu banco e não movimentamos seu dinheiro.*

---

## 4. O símbolo

**Duas moedas que se encontram e formam um balão de conversa.**

- Cada disco tem **borda de moeda** — o anel concêntrico é o que faz a forma ler como dinheiro e não como círculo genérico. É a mudança da v2.
- O **ouro no meio** é o que se junta. No Modo Casal, é o espaço compartilhado: existe, é visível, e termina onde termina. O que está fora dele é de cada um.
- O **rabinho** embaixo faz o conjunto virar um balão de mensagem — o canal de onde tudo nasce.

Nenhum cifrão, nenhum gráfico, nenhuma seta subindo, nenhum robô. Quatro clichês da categoria eliminados de uma vez; o dinheiro aparece pela **forma da moeda**.

### Construção

Grade de 128 × 112. Dois círculos de raio 32, centros em (42, 48) e (86, 48). Borda vazada entre raio 22,2 e 25. Lente resultante de 20 × 46. Rabinho ancorado a 225° do disco esquerdo. **Não redesenhe no olho** — use os SVGs entregues.

### Versões

| Arquivo | Uso |
|---|---|
| `juntadin-simbolo.svg` | Positiva. Padrão sobre Papel ou branco. |
| `juntadin-simbolo-negativo.svg` | Sobre Verde-cofre. Ouro permanece ouro. |
| `juntadin-simbolo-mono.svg` | Uma cor, lente vazada, sem borda. Gravação, carimbo, fax, e-mail em texto. |
| `juntadin-simbolo-pequeno.svg` | Abaixo de 40 px. A borda das moedas some antes de tudo; a silhueta fica. |
| `juntadin-logo-horizontal.svg` | Assinatura padrão. |
| `juntadin-app-icon.svg` | 1024 × 1024, squircle Verde-cofre. |

### Marcas auxiliares

**A pilha** (`juntadin-pilha.svg`) — três moedas empilhadas, a de cima em ouro. É o gesto de **juntar**: metas, reservas, orçamento guardado, tela de saldo positivo, ilustração de onboarding. Cresce de baixo para cima quando quiser mostrar progresso.

**A moeda** (`juntadin-moeda.svg`) — um disco com borda e miolo ouro. Favicon 16 px, avatar mínimo, marcador de lista, anel de progresso, indicador de carregamento. É o átomo do sistema: quando precisar de um elemento gráfico qualquer, comece por um círculo com borda.

### Regras duras

- **Respiro**: o raio de uma moeda livre em todos os lados.
- **Tamanho mínimo**: 24 px para o símbolo, 96 px para a assinatura horizontal. Abaixo de 40 px, troque pela versão simplificada.
- Nunca girar, inclinar, espelhar, esticar, contornar, sombrear ou aplicar degradê. Moeda deformada deixa de ser moeda.
- A lente só pode ser Ouro-dindin, branca (vazada) ou o próprio fundo.
- Sobre foto, só com chapa sólida atrás.

---

## 5. Cores

| Nome | Hex | Papel |
|---|---|---|
| Verde-noite | `#06372C` | Fundos escuros, splash |
| **Verde-cofre** | `#0B5F4C` | **Cor da marca.** Logotipo, títulos, ícone de app |
| Verde-juntado | `#0E7A63` | Botão primário, receita confirmada, links |
| Menta | `#DCEFE7` | Superfície de “confirmado”, chips, bolha do usuário |
| **Ouro-dindin** | `#FFB020` | **Acento único.** Lente do símbolo, pilha, metas, 80% do orçamento |
| Papel | `#F4F7F5` | Fundo de tela |
| Tinta | `#14211D` | Texto principal e **despesas** |
| Tinta 70 | `#5A6B64` | Texto secundário, “previsto” |
| Ouro-texto | `#8F5A00` | Quando o ouro precisa ser letra |
| Déficit | `#B33A2B` | Só saldo projetado negativo |

### Por que esse verde e não outro

O verde do WhatsApp é `#25D366`. O Verde-cofre é muito mais escuro e dessaturado de propósito: **imitar sugere vínculo com a Meta**, o que as regras de marca deles não permitem e que criaria risco justamente no canal de que você depende. O verde aqui vem de cofre e de nota, não do app de mensagem. O ouro é que carrega o dinheiro.

### Como usar

- **Uma tela, um ouro.** Se dois elementos disputam o ouro, nenhum é importante.
- **Despesa é Tinta, não vermelho.** A especificação pede alerta “sem julgamento” (p. 21). Cor de erro em comportamento normal ensina culpa e faz a pessoa evitar o app.
- **Confirmado vs. previsto nunca depende só de cor.** Confirmado: chip Menta preenchido. Previsto: contorno tracejado + a palavra “previsto”. Atende o RNF-05 e a p. 24.
- **Contraste conferido:** branco sobre Verde-cofre 7,6:1 · branco sobre Verde-juntado 5,3:1 · Tinta sobre Ouro-dindin 9,0:1 · Ouro-texto no branco 5,8:1 · Déficit no branco 5,9:1 · Tinta 70 no branco 5,7:1. Todos AA.

---

## 6. Tipografia

| Família | Papel | Licença |
|---|---|---|
| **Outfit** SemiBold 600 | Logotipo, títulos, o número principal do painel | OFL, Google Fonts |
| **IBM Plex Sans** 400/500/600 | Toda a interface, listas, valores em coluna | OFL |
| **IBM Plex Mono** 500 | Identificadores curtos (`A7K2`), chaves, CSV | OFL |

**Por que Outfit:** é geométrica, construída em círculos — as mesmas curvas das moedas. A palavra “juntadin” em caixa baixa é quase toda bojo redondo, e o logotipo passa a rimar com o símbolo em vez de só conviver com ele.

**Por que IBM Plex Sans no corpo:** tem algarismos tabulares de verdade. Numa lista de lançamentos, valor desalinhado destrói a sensação de livro contábil — e a especificação inteira depende dessa sensação. Ative sempre `font-variant-numeric: tabular-nums`.

**Por que Plex Mono:** o produto expõe identificadores ao usuário (“desfazer A7K2”). Em fonte proporcional, `0`/`O` e `1`/`l` confundem e viram ticket de suporte.

### Escala

| Papel | Tamanho | Entrelinha |
|---|---|---|
| Número principal | 40–56 px, Outfit 600, `-0.02em` | 1.15 |
| Título de tela | 28 px, Outfit 600 | 1.2 |
| Seção | 20 px, Outfit 600 | 1.3 |
| Corpo | 16 px, Plex Sans 400 | 1.55 |
| Apoio | 14 px | 1.5 |
| Legenda | 12 px | 1.4 |

**Não faça:** rótulo em CAIXA ALTA espaçada, uma palavra colorida dentro do título, texto financeiro abaixo de 14 px. Linha de leitura com no máximo 62 caracteres.

---

## 7. Forma, ícones e movimento

- **Raios:** botão = pílula (999 px); cartão = 20 px; campo = 12 px; ícone de app = squircle 22,7%. A hierarquia de raio informa o que é ação e o que é conteúdo — não use o mesmo raio em tudo.
- **Ícones:** traço de 1,75 px, pontas arredondadas, grade de 24 px. Lucide ou Phosphor servem. Ícone nunca carrega significado sozinho: sempre com rótulo.
- **Círculo como assinatura:** avatar, marcador de lista, anel de progresso e badge saem todos da moeda. É o que faz o sistema parecer uma coisa só.
- **Toque:** mínimo 44 × 44 pt (RNF-05).
- **Movimento:** só o que responde a uma ação. A confirmação de um lançamento é o único momento que merece animação — a moeda entra na lista e o painel recalcula à vista, porque isso *mostra o que mudou*. Nada de entrada em cascata nas seções. Respeitar `prefers-reduced-motion`.
- **Ilustração:** geométrica, feita de moedas, pilhas e lentes, duas cores no máximo. Cofrinho e pote são permitidos; porquinho sorridente, não.
- **Fotografia:** evitar. Se usar, pessoas reais em contexto doméstico brasileiro, nunca sorrindo para uma nota de dinheiro nem apontando para gráfico.

---

## 8. Voz

Plana, específica, sem alarme, sem elogio. A voz é a de alguém que anota direito, não a de um coach.

| Situação | Diz | Não diz |
|---|---|---|
| Orçamento em 80% | Você usou R$ 320 dos R$ 400 em Alimentação neste ciclo. | Cuidado! Você está gastando demais 😱 |
| Projeção negativa | Faltam R$ 180 até dia 25. Veja o que mais pesa. | Suas finanças estão no vermelho! |
| Não entendeu a frase | Não consegui ler o valor. Me manda só o número? | Desculpe, não entendi sua solicitação. |
| Tela vazia | Ainda não tem nada aqui. Manda o primeiro gasto no WhatsApp. | Nenhum registro encontrado. |
| Fim do teste | Seu teste termina em 7 dias. Seu histórico continua seu. | Última chance! Assine agora. |

Frase curta, verbo ativo, sem “nós”, sem emoji em conteúdo financeiro. O botão e o resultado usam a mesma palavra (“Confirmar” → “Confirmado”). Erro nunca pede desculpa nem culpa o usuário: diz o que houve e o que fazer.

---

## 9. Aplicações

**Ícone de app** — Verde-cofre cheio, moedas em Papel, lente ouro. Sem palavra dentro. Testar em 48 px na gaveta do Android; se a borda das moedas sumir, exportar o ícone a partir da versão simplificada.

**Foto de perfil do WhatsApp Business** — símbolo em Papel sobre círculo Verde-cofre. O WhatsApp recorta em círculo, então a assinatura horizontal some; use só o símbolo. **Não** coloque o logo do WhatsApp junto e **não** use “WhatsApp” no nome do negócio — ambos violam as regras de marca da Meta e podem travar sua aprovação.

**Splash** — Verde-noite, símbolo centralizado em Papel, sem texto.

**Loja (App Store / Play)** — nome “Juntadin”; subtítulo “Controle financeiro pelo WhatsApp”; primeira captura com a conversa e o painel lado a lado, porque é essa a promessa. Nunca prometer “saldo exato”.

**Site** — herói: a conversa real acontecendo, não uma ilustração de dashboard. O selo “não conectamos ao seu banco” acima da dobra.

**E-mail transacional** — texto claro, logotipo em uma cor, Papel de fundo. Nada de banner.

---

## 10. Referência de mercado, e o que fazer diferente

O que já está ocupado no Brasil:

- **Roxo** é do Nubank de forma quase inegociável. Qualquer roxo em fintech brasileira lê como imitação.
- **Laranja** está com o Inter; **verde-claro vibrante** com PicPay e Sicredi; **amarelo puro** com Will Bank e Banco Pan; **preto** com C6 e Itaú Personnalité.
- Entre os apps de finanças pessoais, **Mobills** e **Organizze** ficam em azul e verde institucionais, com estética de painel e gráfico. Os concorrentes de WhatsApp (Controlei, FinWapp, Gastinho, Bllue) tendem ao verde saturado próximo ao do WhatsApp e à comunicação de “IA”, com robôs, brilhos e balões.
- Confira cada um antes de fechar: identidades mudam e você deve olhar as páginas oficiais atuais.

**A entrada que sobra:** verde escuro e ouro, com gesto doméstico em vez de gesto de robô. Enquanto a categoria grita automação, o Juntadin comunica **confirmação**. Referências úteis fora da categoria: Monzo e Wise na disciplina de um acento só; Duolingo no uso de forma simples em ícone pequeno; Notion na voz plana.

---

## 11. Acessibilidade (fecha o RNF-05)

- Contraste AA em todo par de texto, listado na seção 5.
- Nenhuma informação só por cor: confirmado, previsto, receita e despesa sempre têm forma ou palavra.
- Fonte dinâmica até 200% sem cortar valor nem ação — testar o número principal em 200%.
- Foco visível no web: contorno de 2 px em Verde-juntado, com 2 px de folga.
- Rótulo de leitor de tela inclui tipo, valor, data, conta, estado e espaço, nessa ordem (p. 24).
- Todo gráfico acompanha resumo em texto e tabela.
- `prefers-reduced-motion` respeitado.

---

## 12. O que já está entregue e o que falta

**Entregue**
- `juntadin-brandboard.html` — a identidade renderizada, para abrir no navegador
- `juntadin-simbolo.svg` · `-negativo` · `-mono` · `-pequeno`
- `juntadin-logo-horizontal.svg`, `juntadin-app-icon.svg`
- `juntadin-pilha.svg`, `juntadin-moeda.svg`
- `juntadin-tokens.css` — pronto para `packages/ui/`
- este guia

**Falta, em ordem**
1. Busca de marca no INPI e registro do domínio. Antes de qualquer outra coisa.
2. **Vetorizar o logotipo** (converter o texto em curvas) e ajustar o espacejamento à mão — o SVG horizontal ainda depende da fonte instalada.
3. Exportar PNG do ícone nos tamanhos de loja e a foto de perfil do WhatsApp em 640 × 640.
4. Espelhar os tokens em `tokens.ts` para o React Native, já que o Expo não lê variáveis CSS.
5. Testar o ícone a 48 px e o símbolo a 24 px em celular de entrada, que é o aparelho do seu público.
6. Levar duas ou três telas com essa identidade para as 12 entrevistas do M0. A marca passa pelo mesmo portão de decisão que o resto do produto.
