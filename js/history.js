import { state } from "./state.js";
import { clientType, groupByPlan, round2 } from "./plans.js";
import { openDayModal } from "./day.js";
import { openPinModal } from "./modals.js";
import { render } from "./render.js";
import { saveData } from "./storage.js";
import { escapeHtml, money } from "./utils.js";

var MAX_DIAS = 365; // quantos dias o histórico guarda

// Resumo de uma lista de clientes (usado ao zerar o dia e ao importar um backup)
export function resumirDia(clients) {
    var count20 = clients.filter(function (c) {
        return clientType(c) === "night";
    }).length;
    var count5 = clients.reduce(function (sum, c) {
        return sum + (clientType(c) === "time" ? c.units || 0 : 0);
    }, 0);
    var byPlan = groupByPlan(clients, false).map(function (g) {
        return {
            id: g.id,
            name: g.name,
            price: g.price,
            type: g.type,
            count: g.count,
            revenue: round2(g.revenue),
        };
    });
    var revenue = clients.reduce(function (sum, c) {
        return sum + c.value;
    }, 0);
    var pending = clients.reduce(function (sum, c) {
        return sum + (c.pago ? 0 : c.value);
    }, 0);
    return {
        total: clients.length,
        count20: count20,
        count5: count5,
        byPlan: byPlan,
        revenue: round2(revenue),
        pending: round2(pending),
    };
}

function sortHistory() {
    state.history.sort(function (a, b) {
        return b.date - a.date;
    });
    if (state.history.length > MAX_DIAS)
        state.history = state.history.slice(0, MAX_DIAS);
}

function mesmoDia(a, b) {
    return new Date(a).toDateString() === new Date(b).toDateString();
}

// Junta dias importados ao histórico, na ordem certa, sem repetir dias que já existem.
// Devolve quantos dias entraram.
export function mergeHistoryEntries(entries) {
    var added = 0;
    entries.forEach(function (e) {
        if (typeof e.date !== "number" || !isFinite(e.date)) return;
        var repetido = state.history.some(function (x) {
            return (
                x.date === e.date ||
                (mesmoDia(x.date, e.date) &&
                    x.total === e.total &&
                    x.revenue === e.revenue)
            );
        });
        if (repetido) return;
        e.imported = true;
        state.history.push(e);
        added++;
    });
    sortHistory();
    return added;
}

export function executarZerarDia() {
    // salva o resumo do dia no histórico antes de limpar
    var entry = resumirDia(state.clients);
    entry.date = Date.now();
    state.history.unshift(entry);
    sortHistory();

    state.clients = [];
    state.nextId = 1;
    state.warningQueue = [];
    state.warningShownFor = {};
    state.expandedNames = {};
    saveData();
    render();
}

// Texto dos planos de um dia. Dias antigos (sem byPlan) usam os contadores de antes.
function historyDetail(h) {
    if (Array.isArray(h.byPlan)) {
        if (!h.byPlan.length) return "sem vendas";
        return h.byPlan
            .map(function (g) {
                return escapeHtml(g.name) + ": " + g.count;
            })
            .join(" · ");
    }
    return h.count20 + " noite toda · " + h.count5 + " avulsas";
}

export function renderHistory() {
    var list = document.getElementById("history-list");
    var empty = document.getElementById("history-empty");
    list.innerHTML = "";
    empty.style.display = state.history.length ? "none" : "block";
    state.history.forEach(function (h) {
        var div = document.createElement("div");
        div.className = "history-item" + (h.imported ? " imported" : "");
        div.setAttribute("data-date", h.date);
        div.setAttribute("role", "button");
        div.setAttribute("tabindex", "0");
        div.setAttribute("title", "Ver o resumo deste dia");
        var dateLabel = new Date(h.date).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
        div.innerHTML =
            '<div><div class="h-date">' +
            dateLabel +
            (h.imported ? ' <span class="h-tag">📥 Importado</span>' : "") +
            "</div>" +
            '<div class="h-stats">' +
            h.total +
            " clientes · " +
            historyDetail(h) +
            "</div></div>" +
            '<div style="display:flex;align-items:center;">' +
            '<div class="h-value">' +
            money(h.revenue) +
            "</div>" +
            '<button class="history-del-btn" data-action="del-history" data-date="' +
            h.date +
            '" title="Apagar este dia">🗑️</button>' +
            "</div>";
        list.appendChild(div);
    });
}

export function initHistory() {
    var list = document.getElementById("history-list");

    function abrirDia(e) {
        if (e.target.closest(".history-del-btn")) return; // a lixeira tem o próprio comportamento
        var item = e.target.closest(".history-item");
        if (item) openDayModal(parseInt(item.getAttribute("data-date"), 10));
    }
    list.addEventListener("click", abrirDia);
    list.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
            if (e.target.closest(".history-item")) e.preventDefault();
            abrirDia(e);
        }
    });

    document
        .getElementById("btn-apagar-historico")
        .addEventListener("click", function () {
            if (state.history.length === 0) return;
            openPinModal(
                "apagarHistoricoTudo",
                null,
                "Confirmar com PIN",
                "Digite o PIN pra apagar TODO o histórico de dias. Essa ação não pode ser desfeita.",
            );
        });
}
