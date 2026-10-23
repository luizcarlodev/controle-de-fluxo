# Sabor Online — Controle de Parquinho

Sistema de controle do **parquinho da sorveteria Sabor Online** (sorveteria e açaiteria em São José do Seridó). Feito com **HTML, CSS e JavaScript puro**, sem servidor e sem banco de dados: os dados ficam salvos no próprio aparelho (`localStorage`).

Pensado pra rodar em hospedagem estática gratuita, como o **Netlify**, e pra ser usado no celular, no balcão.

---

## O que o app faz

**🍦 Fluxo** (tela inicial)

- **Nova entrada** com os planos que você criar (por tempo ou noite toda)
- Lista de **clientes ativos** com contagem regressiva, aviso sonoro e visual quando o tempo acaba
- Botão de **pagamento** direto no card (amarelo = pendente, verde = pago)
- Toque no nome pra ver o nome completo; **⋮** com Editar nome, Ajustar tempo, Encerrar e Apagar
- Lista de **finalizados**, com opção de reativar
- Busca e filtro por pagamento

- No **fim da tela**, o **Resumo do dia**: clientes, vendas **por plano**, pendente de pagamento e faturamento, com o botão **Zerar dia** (pede PIN), que guarda o resumo do dia no histórico

**🗓️ Histórico e backup**

- **Histórico de dias**: toque em um dia pra ver um resumo visual (faturamento, clientes, ticket médio, pendente e vendas por plano)
- **Backup**: baixar um `.json` e **importar dia(s)** pro histórico. Os dias importados entram na ordem certa e ficam marcados em roxo com a etiqueta "Importado"

**⚙️ Configurações**

- **Planos de entrada**: nome, tipo (por tempo ou noite toda), preço, minutos por bloco e ativo/inativo
- **Preferências**: pedir ou não confirmação ao desfazer um pagamento
- **PIN de segurança**: troca do PIN (pedido pra zerar o dia, apagar cliente e apagar histórico)
- **Restaurar backup completo**: troca clientes, histórico e planos pelo conteúdo de um backup

O menu **☰** (canto esquerdo do cabeçalho) troca entre as três telas: Fluxo, Histórico e backup, e Configurações.

---

## Estrutura do projeto

```
/
├── index.html        estrutura da página (telas, formulários e janelas/modais)
├── manifest.json     permite adicionar o app à tela inicial do celular
├── icon.svg          ícone do app
├── README.md         este arquivo
├── css/
│   ├── variables.css   cores do app (:root)
│   ├── base.css        reset, body, fontes
│   ├── layout.css      cabeçalho, menu lateral, telas, rodapé
│   ├── components.css  cards, botões, formulário, resumo, histórico
│   ├── modals.css      janelas (modais), menu ⋮, resumo de um dia
│   ├── config.css      tela de Configurações
│   └── responsive.css  ajustes para telas pequenas
└── js/
    ├── main.js       ponto de entrada: liga tudo e inicia o app
    ├── state.js      estado compartilhado (objeto `state`)
    ├── storage.js    ler/gravar no localStorage
    ├── utils.js      funções de ajuda (hora, dinheiro, escapar texto)
    ├── plans.js      planos, botões de plano do cadastro, agrupamento por plano
    ├── clients.js    cadastrar, encerrar e apagar cliente
    ├── cards.js      monta o card de cliente ativo e finalizado
    ├── render.js     desenha as listas, o resumo do dia, busca e filtros
    ├── timer.js      relógio e contagem regressiva (a cada segundo)
    ├── alerts.js     beep, tela ligada (wake lock) e fila de avisos
    ├── modals.js     janelas: confirmar, PIN, ajustar tempo, editar nome
    ├── menu.js       menu ⋮ flutuante
    ├── history.js    zerar dia, histórico e importação de dias
    ├── day.js        janela com o resumo visual de um dia
    ├── backup.js     exportar e importar backup
    ├── nav.js        menu lateral e troca de telas
    ├── settings.js   planos, PIN e preferências
    └── collapse.js   minimizar/expandir as listas
```

Os arquivos de `js/` são **módulos** (`import` / `export`). O estado que muda e é usado em vários arquivos fica no objeto `state` (`state.clients`, `state.history`...), porque um arquivo não consegue reatribuir uma variável importada.

---

## Como rodar no computador

Como o JavaScript usa módulos, **não abre com duplo clique** no `index.html`. Use um servidor local, por exemplo a extensão **Live Server** do VS Code (botão direito no `index.html` → *Open with Live Server*). Depois de mexer nos arquivos, atualize com **Ctrl + F5**.

## Como publicar (Netlify)

É um site estático: não tem build. Basta publicar a pasta do projeto (`index.html`, `manifest.json`, `icon.svg`, `css/` e `js/` juntos). Ligando o repositório do GitHub ao Netlify, cada commit na branch publicada atualiza o site.

---

## Onde os dados ficam salvos

Tudo no `localStorage` do navegador, **separado por endereço do site**. Isso significa que o computador, o celular e uma prévia do Netlify cada um tem os seus próprios dados.

| Chave | Conteúdo |
| --- | --- |
| `saborOnline_clients_v1` | clientes de hoje |
| `saborOnline_nextId_v1` | próximo número de cliente |
| `saborOnline_history_v1` | histórico de dias |
| `saborOnline_plans_v1` | planos de entrada |
| `saborOnline_pin_v1` | PIN (se foi trocado) |
| `saborOnline_settings_v1` | preferências |
| `saborOnline_collapse_v1` | listas minimizadas |

⚠️ **Não mude essas chaves**, senão os dados já salvos deixam de aparecer. Se limpar os dados do site, o PIN volta pro padrão `0000`.

## Planos

Cada plano tem **nome, tipo, preço, minutos por bloco (só "por tempo") e ativo/inativo**. Os planos padrão são **10 min (R$ 5)** e **noite toda (R$ 20)**.

- **Por tempo**: cobra por bloco de minutos. Dá pra escolher vários blocos na entrada.
- **Noite toda**: valor único, vale até **23:59**.
- **Promoção**: crie um plano novo (ex: "noite toda promo", R$ 15) e desative o normal no dia.
- Cada cliente guarda uma "foto" do plano (nome, preço e minutos). Mudar um plano depois não altera quem já entrou. Se você mudar preço, tipo ou minutos de um plano que já teve venda hoje, ele ganha um id novo e as vendas de hoje ficam no plano antigo.

## Backup

- **Baixar backup**: gera um `.json` com clientes de hoje, histórico e planos.
- **Importar dia(s)** (tela de Histórico): os dias do arquivo entram no histórico, na ordem certa e marcados como importados. Dias que já existem não são repetidos, e os clientes do arquivo viram mais um dia. **Não mexe nos clientes de hoje.**
- **Restaurar backup completo** (Configurações): substitui tudo. Aceita também backups feitos nas versões antigas.

---

## Para continuar o projeto

- Ícones e imagens: hoje o app usa **emojis**. A ideia é trocar por imagens/ícones temáticos (arquivos em uma pasta `img/`).
- Dados só ficam no aparelho; se um dia precisar de vários aparelhos sincronizados, será preciso um servidor.
