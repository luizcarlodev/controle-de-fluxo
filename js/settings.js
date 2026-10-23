// Tela "Configurações": planos de entrada e PIN de segurança.
import { state } from "./state.js";
import { renderPlanButtons, round2 } from "./plans.js";
import { render } from "./render.js";
import { savePlans } from "./storage.js";

// =====================================================
// PIN
// =====================================================
var PIN_KEY = "saborOnline_pin_v1";
export var PIN_PADRAO = "0000"; // vale enquanto ninguém trocar pela tela de Configurações

// PIN atual: o que foi salvo neste aparelho, ou o padrão
export function getPin() {
    try {
        var salvo = localStorage.getItem(PIN_KEY);
        if (salvo) return salvo;
    } catch (e) {}
    return PIN_PADRAO;
}

function setPin(novo) {
    try {
        localStorage.setItem(PIN_KEY, novo);
        return true;
    } catch (e) {
        return false;
    }
}

// =====================================================
// PREFERÊNCIAS (ligar/desligar coisas do app)
// =====================================================
var SETTINGS_KEY = "saborOnline_settings_v1";

function lerPreferencias() {
    try {
        var obj = JSON.parse(localStorage.getItem(SETTINGS_KEY));
        if (obj && typeof obj === "object") return obj;
    } catch (e) {}
    return {};
}

export function getSetting(nome, padrao) {
    var v = lerPreferencias()[nome];
    return typeof v === "boolean" ? v : padrao;
}

function setSetting(nome, valor) {
    var obj = lerPreferencias();
    obj[nome] = valor;
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(obj));
    } catch (e) {}
}

// =====================================================
// PLANOS
// =====================================================
var plansEditor = document.getElementById("plans-editor");
var plansMsg = document.getElementById("plans-msg");

function novoIdDePlano() {
    return (
        "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
    );
}

function mostrar(el, texto, ok) {
    el.textContent = texto;
    el.className = "config-msg " + (ok ? "ok" : "error");
}

// Mostra/esconde o campo "minutos por bloco" conforme o tipo
function ajustarMinutos(row) {
    var tipo = row.querySelector(".pl-type").value;
    row.querySelector(".pl-minutes-field").style.display =
        tipo === "time" ? "" : "none";
}

function numerarLinhas() {
    plansEditor.querySelectorAll(".plan-row").forEach(function (row, i) {
        row.querySelector(".plan-row-title").textContent = "Plano " + (i + 1);
    });
}

function addPlanRow(p) {
    var row = document.createElement("div");
    row.className = "plan-row";
    row.setAttribute("data-plan-id", p.id);
    row.innerHTML =
        '<div class="plan-row-head">' +
        '<span class="plan-row-title">Plano</span>' +
        '<label class="switch"><input type="checkbox" class="pl-active" />' +
        '<span class="switch-text">Ativo</span></label>' +
        "</div>" +
        '<div class="plan-row-grid">' +
        '<div class="field"><label>Nome</label>' +
        '<input type="text" class="pl-name" maxlength="24" placeholder="Ex: promoção" /></div>' +
        '<div class="field"><label>Tipo</label>' +
        '<select class="pl-type"><option value="time">Por tempo</option>' +
        '<option value="night">Noite toda</option></select></div>' +
        '<div class="field"><label>Preço (R$)</label>' +
        '<input type="text" inputmode="decimal" class="pl-price" placeholder="0,00" /></div>' +
        '<div class="field pl-minutes-field"><label>Minutos por bloco</label>' +
        '<input type="text" inputmode="numeric" class="pl-minutes" placeholder="10" /></div>' +
        "</div>" +
        '<button type="button" class="plan-remove">🗑️ Remover plano</button>';

    row.querySelector(".pl-active").checked = p.active !== false;
    row.querySelector(".pl-name").value = p.name || "";
    row.querySelector(".pl-type").value = p.type;
    row.querySelector(".pl-price").value =
        p.price === "" || p.price == null
            ? ""
            : String(p.price).replace(".", ",");
    row.querySelector(".pl-minutes").value = p.minutes ? String(p.minutes) : "";

    row.querySelector(".pl-type").addEventListener("change", function () {
        ajustarMinutos(row);
    });
    row.querySelector(".plan-remove").addEventListener("click", function () {
        if (plansEditor.querySelectorAll(".plan-row").length <= 1) {
            mostrar(plansMsg, "Precisa ter pelo menos um plano.", false);
            return;
        }
        row.remove();
        numerarLinhas();
    });

    plansEditor.appendChild(row);
    ajustarMinutos(row);
    numerarLinhas();
    return row;
}

// Desenha a lista de planos (a partir do que está salvo)
export function renderPlansEditor() {
    plansEditor.innerHTML = "";
    state.plans.forEach(addPlanRow);
}

// Lê as linhas da tela, valida e devolve { plans } ou { erro }
function lerPlanosDaTela() {
    var rows = plansEditor.querySelectorAll(".plan-row");
    var lista = [];
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var n = i + 1;
        var name = row.querySelector(".pl-name").value.trim();
        var type = row.querySelector(".pl-type").value;
        var price = parseFloat(
            row.querySelector(".pl-price").value.trim().replace(",", "."),
        );
        var minutes = parseInt(row.querySelector(".pl-minutes").value, 10);

        if (!name) return { erro: "Plano " + n + ": digite um nome." };
        if (!isFinite(price) || price <= 0 || price > 10000)
            return {
                erro: "Plano " + n + ": o preço precisa ser maior que zero.",
            };
        if (type === "time" && (!(minutes >= 1) || minutes > 720))
            return {
                erro:
                    "Plano " +
                    n +
                    ": os minutos por bloco precisam ficar entre 1 e 720.",
            };
        lista.push({
            id: row.getAttribute("data-plan-id"),
            name: name,
            type: type,
            price: round2(price),
            minutes: type === "time" ? minutes : 0,
            active: row.querySelector(".pl-active").checked,
        });
    }
    if (
        !lista.some(function (p) {
            return p.active;
        })
    )
        return { erro: "Deixe pelo menos um plano ativo." };
    return { plans: lista };
}

// Se mudou preço/tipo/minutos de um plano que já teve venda hoje, ele ganha um
// id novo: as vendas de hoje continuam no plano antigo e não se misturam.
function protegerVendasDeHoje(lista) {
    return lista.map(function (p) {
        var antigo = state.plans.find(function (x) {
            return x.id === p.id;
        });
        var mudou =
            antigo &&
            (antigo.price !== p.price ||
                antigo.type !== p.type ||
                antigo.minutes !== p.minutes);
        var temVenda = state.clients.some(function (c) {
            return c.plan === p.id;
        });
        if (mudou && temVenda) p.id = novoIdDePlano();
        return p;
    });
}

function salvarPlanos() {
    var r = lerPlanosDaTela();
    if (r.erro) {
        mostrar(plansMsg, r.erro, false);
        return;
    }
    state.plans = protegerVendasDeHoje(r.plans);
    savePlans();
    renderPlansEditor();
    renderPlanButtons();
    render();
    mostrar(plansMsg, "Planos salvos! ✅", true);
}

// =====================================================
// Ligações dos botões
// =====================================================
export function initSettings() {
    var prefUndo = document.getElementById("pref-confirm-undo");
    prefUndo.checked = getSetting("confirmarDesfazerPago", false);
    prefUndo.addEventListener("change", function () {
        setSetting("confirmarDesfazerPago", prefUndo.checked);
    });

    document.getElementById("plan-add").addEventListener("click", function () {
        var row = addPlanRow({
            id: novoIdDePlano(),
            name: "",
            type: "time",
            price: "",
            minutes: 10,
            active: true,
        });
        plansMsg.textContent = "";
        row.querySelector(".pl-name").focus();
    });

    document
        .getElementById("plans-save")
        .addEventListener("click", salvarPlanos);

    var inAtual = document.getElementById("pin-atual");
    var inNovo = document.getElementById("pin-novo");
    var inNovo2 = document.getElementById("pin-novo2");
    var msg = document.getElementById("pin-config-msg");

    document
        .getElementById("pin-config-save")
        .addEventListener("click", function () {
            if (inAtual.value !== getPin()) {
                mostrar(msg, "O PIN atual está incorreto.", false);
                return;
            }
            if (!/^\d{4,8}$/.test(inNovo.value)) {
                mostrar(msg, "O novo PIN precisa ter de 4 a 8 números.", false);
                return;
            }
            if (inNovo.value !== inNovo2.value) {
                mostrar(msg, "Os dois PINs novos não são iguais.", false);
                return;
            }
            if (!setPin(inNovo.value)) {
                mostrar(
                    msg,
                    "Não consegui salvar o PIN neste aparelho.",
                    false,
                );
                return;
            }
            inAtual.value = "";
            inNovo.value = "";
            inNovo2.value = "";
            mostrar(msg, "PIN alterado com sucesso! ✅", true);
        });
}
