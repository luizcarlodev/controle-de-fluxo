# Sabor Online — Controle de Parquinho

Site simples (HTML, CSS e JavaScript puro, sem servidor) pra controlar o fluxo de clientes do parquinho: cadastro, tempo de brinquedo, edição, histórico e faturamento do dia.

Feito pra rodar em hospedagem gratuita (Netlify, GitHub Pages, etc), sem precisar de banco de dados — os dados ficam salvos no navegador do próprio aparelho (localStorage).

---

## Arquivos do projeto

- `index.html` — o site inteiro (estrutura, estilo e funcionamento)
- `manifest.json` — permite adicionar o site à tela inicial do celular como um app
- `icon.svg` — ícone usado nesse atalho
- `README.md` — este arquivo

Os três primeiros precisam ficar **juntos, na mesma pasta**, ao subir pra hospedagem.

---

## O que o site faz

- Cadastro de clientes com dois tipos de entrada:
    - **R$ 5,00** = 10 minutos (pode escolher quantos blocos de 10 min de uma vez)
    - **R$ 20,00** = noite toda (até o horário de fechamento)
- Contagem automática do tempo restante de cada cliente
- Aviso sonoro + visual quando o tempo de alguém acaba, com confirmação antes de mover pra "Finalizados"
- Lista de ativos ordenada por quem termina primeiro; finalizados ordenados por ID
- Botão de **+ tempo** pra adicionar mais blocos de R$5 sem recadastrar
- Botão de **Reativar** pra clientes finalizados que voltaram
- Edição do nome do cliente
- Busca de cliente pela lista
- Resumo do dia: total de clientes, vendas de cada plano e faturamento
- **Zerar dia** (com PIN) — limpa a lista atual e guarda um resumo no histórico
- **Histórico de dias** — cada dia zerado fica registrado; dá pra apagar um dia específico ou o histórico inteiro, sempre pedindo o PIN
- **Backup**: baixar um arquivo `.json` com todos os dados, e importar esse arquivo depois pra restaurar
- Tudo funciona no celular, tablet e computador
- Continua funcionando ao atualizar a página (F5) — os dados não se perdem

---

## Configurações que você pode editar

Abra o `index.html` num editor de texto e procure por essas partes:

### PIN pra zerar o dia / apagar histórico

```js
var ZERAR_DIA_PIN = "0000"; // <-- TROQUE AQUI o PIN
```

Esse mesmo PIN é usado tanto pra "Zerar dia" quanto pra apagar itens do histórico.

### Nome de exemplo no campo de cadastro

```html
<input type="text" id="input-name" placeholder="Ex: Maria Eduarda" />
```

Troque o texto dentro de `placeholder="..."` pelo exemplo que preferir.

### Horário de fechamento (plano "noite toda")

```js
var CLOSING_HOUR = 23; // "noite toda" vale até esse horário
var CLOSING_MIN = 59;
```

---

## Como hospedar gratuitamente

1. Crie uma conta no [Netlify](https://app.netlify.com) (ou GitHub Pages / Vercel)
2. Suba os arquivos (`index.html`, `manifest.json`, `icon.svg`) pra um repositório no GitHub, todos soltos na raiz (sem pasta)
3. Conecte esse repositório ao Netlify — ele publica automaticamente
4. Torne o site público (existe um botão "Make public" / "Tornar público")
5. Depois disso, qualquer novo commit no GitHub atualiza o site sozinho, sem precisar mexer no Netlify de novo

---

## Sobre os dados (localStorage)

Os dados ficam salvos **só no navegador/aparelho** onde o site é usado no dia a dia — não é sincronizado entre celulares diferentes nem fica salvo "na nuvem". Se limpar os dados do navegador, resetar o celular ou trocar de aparelho, os dados somem.

Por isso é importante usar o botão **"Baixar backup"** de vez em quando (ex: no fim do dia), guardando o arquivo `.json` em algum lugar seguro (Google Drive, WhatsApp pra você mesmo, etc). Se precisar restaurar, é só usar "Importar backup" e selecionar esse arquivo.

---

## Como entender um arquivo de backup

O backup é um arquivo `.json` com todos os clientes do dia e o histórico de dias anteriores, tudo em português: nome, tipo de entrada, valor pago, horário de entrada/término, status, e o resumo de cada dia zerado.

Se quiser uma explicação em linguagem simples de um backup específico (por exemplo, pra entender o movimento de um dia, comparar dois backups, ou conferir se os valores batem), você pode colar o conteúdo do arquivo numa IA (como o Claude) junto com este prompt pronto:

```
Você vai analisar um arquivo de backup em JSON de um sistema de controle de
parquinho e sorveteria chamado "Sabor Online". O arquivo tem uma lista de
clientes do dia atual (campo "clientes") e um histórico de dias já zerados
(campo "historico"). Cada cliente tem: nome, tipo de entrada (avulsa = R$5
por bloco de 10min, ou noite_toda = R$20), valor pago, horário de entrada
e término, e status (ativo, aguardando confirmação, ou finalizado).

Quero que você:
1. Resuma em português simples quantos clientes estão ativos, quantos
   finalizados, e o faturamento total do dia atual.
2. Se houver histórico, resuma os dias anteriores (data, total de clientes,
   quantas vendas de cada plano, faturamento).
3. Aponte qualquer coisa que pareça estranha ou inconsistente nos dados
   (ex: valores que não batem, horários fora do normal).

Aqui está o JSON:

[COLE AQUI O CONTEÚDO DO ARQUIVO DE BACKUP]
```

---

## Aviso importante sobre o PIN

O PIN fica escrito diretamente no código do site (`index.html`). Como é um site que roda todo no navegador (sem servidor por trás), qualquer pessoa que souber abrir o código-fonte da página consegue ver esse PIN. Ele serve como uma trava contra toque acidental ou curiosidade, não como uma senha de segurança forte. Pra esse tipo de uso interno (parquinho, uso pela equipe) é geralmente suficiente.
