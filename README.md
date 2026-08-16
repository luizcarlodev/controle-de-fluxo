# Controle de Parquinho

Sistema simples (HTML, CSS e JavaScript puro, sem servidor) pra controlar o fluxo de clientes de um parquinho/espaço de recreação com cobrança por tempo: cadastro, contagem regressiva, edição, histórico e faturamento do dia.

Feito pra rodar em qualquer hospedagem estática gratuita (Netlify, GitHub Pages, Vercel, etc), sem precisar de banco de dados — os dados ficam salvos localmente no navegador do aparelho usado (localStorage).

---

## Arquivos do projeto

- `index.html` — a aplicação inteira (estrutura, estilo e funcionamento)
- `manifest.json` — permite adicionar a aplicação à tela inicial do celular como um app
- `icon.svg` — ícone usado nesse atalho
- `README.md` — este arquivo

Os três primeiros precisam ficar **juntos, na mesma pasta**, ao subir pra hospedagem.

---

## O que a aplicação faz

- Cadastro de clientes com dois tipos de entrada configuráveis:
    - **Avulsa** — cobrança por bloco de tempo (ex: R$5 = 10 minutos, podendo escolher quantos blocos de uma vez)
    - **Livre** — valor fixo por um período maior (ex: "noite toda", até um horário de fechamento configurável)
- Contagem automática do tempo restante de cada cliente
- Aviso sonoro + visual quando o tempo de alguém acaba, com confirmação antes de mover pra "Finalizados"
- Lista de ativos ordenada por quem termina primeiro; finalizados ordenados por ID de cadastro
- Botão de **ajustar tempo**, pra adicionar ou remover blocos sem precisar recadastrar
- Botão de **reativar** clientes finalizados que voltaram
- Edição do nome do cliente
- Controle de status de pagamento (pago / pendente) por cliente
- Busca de cliente na lista
- Resumo do dia: total de clientes, vendas por tipo de entrada e faturamento
- **Zerar dia** (protegido por PIN) — limpa a lista atual e guarda um resumo no histórico
- **Histórico de dias** — cada dia zerado fica registrado; dá pra apagar um dia específico ou o histórico inteiro, sempre exigindo o PIN
- **Backup**: exportar um arquivo `.json` com todos os dados, e importar esse arquivo depois pra restaurar
- Interface responsiva (celular, tablet e computador)
- Estado persistente — os dados não se perdem ao atualizar a página (F5)

---

## Configuração

Abra o `index.html` num editor de texto e procure pelas variáveis no topo do bloco `<script>`:

### PIN de proteção (zerar dia / apagar histórico)

```js
var ZERAR_DIA_PIN = "0000"; // <-- defina aqui o PIN desejado
```

Esse mesmo PIN protege tanto "Zerar dia" quanto a exclusão de itens do histórico.

### Texto de exemplo no campo de cadastro

```html
<input type="text" id="input-name" placeholder="Ex: Nome do cliente" />
```

### Valores e duração de cada tipo de entrada

```js
var UNIT_MINUTES = 10; // duração de cada bloco da entrada avulsa
var UNIT_PRICE = 5; // valor de cada bloco da entrada avulsa
var PLAN20_PRICE = 20; // valor da entrada "livre"
var CLOSING_HOUR = 23; // horário (hora) até quando a entrada "livre" vale
var CLOSING_MIN = 59; // horário (minuto) até quando a entrada "livre" vale
```

---

## Como hospedar gratuitamente

1. Crie uma conta num serviço de hospedagem estática gratuito, como [Netlify](https://app.netlify.com), GitHub Pages ou Vercel
2. Suba os arquivos (`index.html`, `manifest.json`, `icon.svg`) pra um repositório Git, todos soltos na raiz (sem subpasta)
3. Conecte esse repositório ao serviço escolhido — a maioria publica automaticamente a cada commit
4. Torne o site público (nos serviços que exigem essa etapa)
5. A partir daí, qualquer novo commit no repositório atualiza o site publicado automaticamente

---

## Sobre os dados (localStorage)

Os dados ficam salvos **apenas no navegador/aparelho** onde a aplicação é usada no dia a dia — não são sincronizados entre aparelhos diferentes nem ficam salvos em nuvem. Se os dados do navegador forem limpos, o aparelho for resetado ou trocado, os dados se perdem.

Por isso é recomendado usar o botão **"Baixar backup"** periodicamente (ex: ao fim do expediente), guardando o arquivo `.json` gerado em algum lugar seguro. Pra restaurar, basta usar "Importar backup" e selecionar esse arquivo.

---

## Como entender um arquivo de backup com auxílio de IA

O backup é um arquivo `.json` com todos os clientes do dia atual e o histórico de dias já encerrados, com campos legíveis em português: nome, tipo de entrada, valor pago, horário de entrada/término, status, e o resumo de cada dia zerado.

Se quiser uma explicação em linguagem simples de um backup específico — por exemplo, pra entender o movimento de um dia, comparar dois backups, ou conferir se os valores batem — é possível colar o conteúdo do arquivo numa IA de sua preferência, junto com este prompt:

```
Você vai analisar um arquivo de backup em JSON de um sistema de controle de
fluxo de clientes por tempo (parquinho / espaço com cobrança por período).
O arquivo tem uma lista de clientes do dia atual (campo "clientes") e um
histórico de dias já zerados (campo "historico"). Cada cliente tem: nome,
tipo de entrada (avulsa = cobrança por bloco de tempo, ou noite_toda =
valor fixo por período maior), valor pago, horário de entrada e término,
e status (ativo, aguardando confirmação, ou finalizado).

Quero que você:
1. Resuma em português simples quantos clientes estão ativos, quantos
   finalizados, e o faturamento total do dia atual.
2. Se houver histórico, resuma os dias anteriores (data, total de clientes,
   quantas vendas de cada tipo de entrada, faturamento).
3. Aponte qualquer coisa que pareça estranha ou inconsistente nos dados
   (ex: valores que não batem, horários fora do normal).

Aqui está o JSON:

[COLE AQUI O CONTEÚDO DO ARQUIVO DE BACKUP]
```

---

## Aviso sobre o PIN

O PIN fica gravado diretamente no código-fonte (`index.html`). Como é uma aplicação que roda inteiramente no navegador, sem servidor por trás, qualquer pessoa com acesso ao código-fonte da página — inclusive quem tiver acesso a este repositório, caso público — consegue visualizar esse valor. Ele funciona como uma trava contra toque acidental ou uso indevido casual, não como uma medida de segurança robusta. Para uso interno de equipe, geralmente é suficiente; para cenários que exigem mais segurança, recomenda-se uma solução com autenticação real no backend.

---

## Licença

Livre pra copiar, adaptar e usar como base para o seu próprio controle de fluxo por tempo.
