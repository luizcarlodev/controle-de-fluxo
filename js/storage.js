import { state } from "./state.js";
import { DEFAULT_PLANS, clonePlans } from "./plans.js";

var STORAGE_KEY = "saborOnline_clients_v1";
var COUNTER_KEY = "saborOnline_nextId_v1";
var HISTORY_KEY = "saborOnline_history_v1";
var PLANS_KEY = "saborOnline_plans_v1";

// ---------- Persistência ----------
export function loadData() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);
        state.clients = raw ? JSON.parse(raw) : [];
    } catch (e) {
        state.clients = [];
    }
    try {
        var rawId = localStorage.getItem(COUNTER_KEY);
        state.nextId = rawId ? parseInt(rawId, 10) : 1;
    } catch (e) {
        state.nextId = 1;
    }
    try {
        var rawHist = localStorage.getItem(HISTORY_KEY);
        state.history = rawHist ? JSON.parse(rawHist) : [];
    } catch (e) {
        state.history = [];
    }
    loadPlans();
}

// Confere se um plano tem os campos certos (protege contra dado quebrado)
export function planValido(p) {
    return (
        p &&
        typeof p.id === "string" &&
        p.id &&
        typeof p.name === "string" &&
        (p.type === "time" || p.type === "night") &&
        typeof p.price === "number" &&
        p.price > 0 &&
        (p.type === "night" || (p.minutes > 0 && isFinite(p.minutes)))
    );
}

// Devolve a lista de planos limpa, ou null se algum plano estiver quebrado
export function normalizarPlanos(lista) {
    if (!Array.isArray(lista) || !lista.length || !lista.every(planValido))
        return null;
    return lista.map(function (p) {
        return {
            id: p.id,
            name: p.name,
            type: p.type,
            price: p.price,
            minutes: p.type === "time" ? p.minutes : 0,
            active: p.active !== false,
        };
    });
}

function loadPlans() {
    var lista = null;
    try {
        var raw = localStorage.getItem(PLANS_KEY);
        lista = normalizarPlanos(raw ? JSON.parse(raw) : null);
    } catch (e) {}
    state.plans = lista || clonePlans(DEFAULT_PLANS);
}

export function savePlans() {
    localStorage.setItem(PLANS_KEY, JSON.stringify(state.plans));
}

export function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.clients));
    localStorage.setItem(COUNTER_KEY, String(state.nextId));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history));
}
