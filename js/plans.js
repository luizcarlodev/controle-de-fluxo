import { state } from "./state.js";
import { money } from "./utils.js";

export var CLOSING_HOUR = 23; // "noite toda" vale até esse horário
export var CLOSING_MIN = 59;

// Valores usados por clientes antigos (de antes dos planos configuráveis)
export var LEGACY_UNIT_MINUTES = 10;
export var LEGACY_UNIT_PRICE = 5;

// Planos que existem na primeira vez que o app abre.
// Os ids "5" e "20" são os mesmos que os clientes antigos já usam.
// type: "time" = cobra por bloco de minutos | "night" = noite toda (até o fechamento)
export var DEFAULT_PLANS = [
    {
        id: "5",
        name: "10 min",
        type: "time",
        price: 5,
        minutes: 10,
        active: true,
    },
    {
        id: "20",
        name: "noite toda",
        type: "night",
        price: 20,
        minutes: 0,
        active: true,
    },
];

export function clonePlans(list) {
    return JSON.parse(JSON.stringify(list));
}

export function round2(n) {
    return Math.round(n * 100) / 100;
}

export function planById(id) {
    return state.plans.find(function (p) {
        return p.id === id;
    });
}

export function activePlans() {
    return state.plans.filter(function (p) {
        return p.active;
    });
}

// ---------- Dados de um cliente (aceita clientes antigos, sem os campos novos) ----------
export function clientType(c) {
    return c.type || (c.plan === "20" ? "night" : "time");
}

export function clientUnitPrice(c) {
    return c.unitPrice || LEGACY_UNIT_PRICE;
}

export function clientUnitMinutes(c) {
    return c.unitMinutes || LEGACY_UNIT_MINUTES;
}

export function clientPlanName(c) {
    if (c.planName) return c.planName;
    return clientType(c) === "night" ? "noite toda" : "10 min";
}

// Agrupa clientes por plano (usado no resumo do dia e no histórico).
// time = soma de blocos | night = nº de clientes
export function groupByPlan(clients, includeEmptyActive) {
    var order = [];
    var map = {};
    var used = {};
    clients.forEach(function (c) {
        used[c.plan] = true;
    });

    function ensure(id, info) {
        if (!map[id]) {
            map[id] = {
                id: id,
                name: info.name,
                price: info.price,
                type: info.type,
                count: 0,
                revenue: 0,
            };
            order.push(id);
        }
        return map[id];
    }

    state.plans.forEach(function (p) {
        if ((includeEmptyActive && p.active) || used[p.id]) ensure(p.id, p);
    });
    clients.forEach(function (c) {
        var g = map[c.plan];
        if (!g) {
            var type = clientType(c);
            g = ensure(c.plan, {
                name: clientPlanName(c),
                price: type === "night" ? c.value : clientUnitPrice(c),
                type: type,
            });
        }
        g.count += clientType(c) === "time" ? c.units || 0 : 1;
        g.revenue += c.value;
    });
    return order.map(function (id) {
        return map[id];
    });
}

// ---------- Cadastro: botões de plano e stepper ----------
var planToggle = document.getElementById("plan-toggle");
var stepperBox = document.getElementById("stepper-box");
var stepCount = document.getElementById("step-count");
var stepInfo = document.getElementById("step-info");

function priceLabel(v) {
    return "R$ " + v.toFixed(2).replace(".", ",");
}

export function updateStepInfo() {
    var p = planById(state.selectedPlan);
    stepCount.textContent = state.stepUnits + "×";
    if (!p || p.type !== "time") {
        stepInfo.textContent = "";
        return;
    }
    stepInfo.textContent =
        "= " +
        money(round2(state.stepUnits * p.price)) +
        " · " +
        state.stepUnits * p.minutes +
        " minutos";
}

export function selectPlan(id) {
    state.selectedPlan = id;
    var p = planById(id);
    planToggle.querySelectorAll(".plan-btn").forEach(function (b) {
        b.classList.toggle("selected", b.getAttribute("data-plan") === id);
    });
    stepperBox.style.display = p && p.type === "time" ? "flex" : "none";
    updateStepInfo();
}

// Seleciona o primeiro plano ativo (como o antigo "R$ 5" que vinha marcado)
export function selectDefaultPlan() {
    var list = activePlans();
    selectPlan(list.length ? list[0].id : null);
}

// Desenha os botões a partir dos planos ativos
export function renderPlanButtons() {
    planToggle.innerHTML = "";
    var list = activePlans();
    if (!list.length) {
        planToggle.innerHTML =
            '<div class="no-plans">Nenhum plano ativo. Ative um em Configurações.</div>';
    }
    list.forEach(function (p) {
        var b = document.createElement("div");
        b.className = "plan-btn " + (p.type === "night" ? "plan20" : "plan5");
        b.setAttribute("data-plan", p.id);
        b.appendChild(document.createTextNode(priceLabel(p.price)));
        var small = document.createElement("small");
        small.textContent = p.name;
        b.appendChild(small);
        planToggle.appendChild(b);
    });
    var atual = planById(state.selectedPlan);
    if (atual && atual.active) selectPlan(atual.id);
    else selectDefaultPlan();
}

export function initPlans() {
    planToggle.addEventListener("click", function (e) {
        var btn = e.target.closest(".plan-btn");
        if (btn) selectPlan(btn.getAttribute("data-plan"));
    });

    document
        .getElementById("step-minus")
        .addEventListener("click", function () {
            if (state.stepUnits > 1) {
                state.stepUnits--;
                updateStepInfo();
            }
        });

    document.getElementById("step-plus").addEventListener("click", function () {
        if (state.stepUnits < 48) {
            state.stepUnits++;
            updateStepInfo();
        } // limite alto de segurança
    });
}
