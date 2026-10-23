import { groupByPlan } from "./plans.js";
import { state } from "./state.js";
import { pushWarning } from "./alerts.js";
import { buildActiveCard, buildFinishedCard } from "./cards.js";
import { renderHistory } from "./history.js";
import { repositionOrCloseMenu } from "./menu.js";
import { saveData } from "./storage.js";
import { money } from "./utils.js";

// ---------- Render ----------
var activeList = document.getElementById("active-list");
var finishedList = document.getElementById("finished-list");
var activeEmpty = document.getElementById("active-empty");
var finishedEmpty = document.getElementById("finished-empty");

// Um quadradinho por plano (planos ativos + planos que tiveram venda hoje)
function renderPlanSummary() {
    var box = document.getElementById("sum-plans");
    box.innerHTML = "";
    groupByPlan(state.clients, true).forEach(function (g) {
        var item = document.createElement("div");
        item.className = "summary-item";
        var num = document.createElement("div");
        num.className = "num";
        num.textContent = g.count;
        var lbl = document.createElement("div");
        lbl.className = "lbl";
        lbl.textContent =
            g.name +
            " (" +
            money(g.price) +
            (g.type === "time" ? " cada" : "") +
            ")";
        item.appendChild(num);
        item.appendChild(lbl);
        box.appendChild(item);
    });
}

export function render() {
    var now = Date.now();

    // detectar expirados -> awaiting
    state.clients.forEach(function (c) {
        if (c.status === "active" && c.endTime <= now) {
            c.status = "awaiting";
            pushWarning(c);
        }
    });

    var actives = state.clients.filter(function (c) {
        return c.status === "active" || c.status === "awaiting";
    });
    var finished = state.clients.filter(function (c) {
        return c.status === "finished";
    });

    if (state.searchTerm) {
        actives = actives.filter(function (c) {
            return c.name.toLowerCase().indexOf(state.searchTerm) !== -1;
        });
        finished = finished.filter(function (c) {
            return c.name.toLowerCase().indexOf(state.searchTerm) !== -1;
        });
    }

    if (state.payFilter !== "all") {
        actives = actives.filter(function (c) {
            return state.payFilter === "pago" ? c.pago : !c.pago;
        });
        finished = finished.filter(function (c) {
            return state.payFilter === "pago" ? c.pago : !c.pago;
        });
    }

    actives.sort(function (a, b) {
        return a.endTime - b.endTime;
    });
    finished.sort(function (a, b) {
        return a.id - b.id;
    });

    activeList.innerHTML = "";
    finishedList.innerHTML = "";

    activeEmpty.style.display = actives.length ? "none" : "block";
    finishedEmpty.style.display = finished.length ? "none" : "block";

    actives.forEach(function (c) {
        activeList.appendChild(buildActiveCard(c, now));
    });
    finished.forEach(function (c) {
        finishedList.appendChild(buildFinishedCard(c));
    });

    document.getElementById("active-count").textContent = actives.length;
    document.getElementById("finished-count").textContent = finished.length;

    // resumo do dia
    var total = state.clients.length;
    var revenue = state.clients.reduce(function (sum, c) {
        return sum + c.value;
    }, 0);
    var pendingValue = state.clients.reduce(function (sum, c) {
        return sum + (c.pago ? 0 : c.value);
    }, 0);

    document.getElementById("sum-total").textContent = total;
    renderPlanSummary();
    document.getElementById("sum-total-value").textContent = money(revenue);
    document.getElementById("sum-pendente").textContent = money(pendingValue);
    document
        .getElementById("sum-pendente-box")
        .classList.toggle("has-pending", pendingValue > 0);

    renderHistory();
    saveData();
    repositionOrCloseMenu();
}

// ---------- Filtro de status de pagamento (quadrado fixo, alterna ícone) ----------
var payFilterOrder = ["all", "pago", "pendente"];
var payFilterIcons = {
    all: "👥",
    pago: "✅",
    pendente: "⏳",
};
var payFilterLabels = {
    all: "Todos",
    pago: "Pagos",
    pendente: "Pendentes",
};
var filterToggleBtn = document.getElementById("pay-filter-toggle");

function updateFilterToggleUI() {
    filterToggleBtn.textContent = payFilterIcons[state.payFilter];
    filterToggleBtn.title =
        "Filtrar por pagamento: " + payFilterLabels[state.payFilter];
    filterToggleBtn.className =
        "filter-toggle" +
        (state.payFilter === "pago"
            ? " state-pago"
            : state.payFilter === "pendente"
              ? " state-pendente"
              : "");
}

export function initRender() {
    // ---------- Busca ----------
    document
        .getElementById("input-search")
        .addEventListener("input", function (e) {
            state.searchTerm = e.target.value.trim().toLowerCase();
            render();
        });

    filterToggleBtn.addEventListener("click", function () {
        var idx = payFilterOrder.indexOf(state.payFilter);
        state.payFilter = payFilterOrder[(idx + 1) % payFilterOrder.length];
        updateFilterToggleUI();
        render();
    });

    updateFilterToggleUI();
}
