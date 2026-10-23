import { state } from "./state.js";
import { executarZerarDia } from "./history.js";
import {
    clientType,
    clientUnitMinutes,
    clientUnitPrice,
    round2,
} from "./plans.js";
import { render } from "./render.js";
import { getPin } from "./settings.js";
import { saveData } from "./storage.js";
import { getClosingTime, money } from "./utils.js";

// Ícone customizado (lixeira) usado no modal de confirmação de "Encerrar"
export var ICON_END_SVG =
    '<svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;">' +
    '<circle cx="28" cy="28" r="28" fill="#4C1259"/>' +
    '<rect x="23" y="10" width="10" height="5" rx="2" fill="#F7C948"/>' +
    '<rect x="15" y="15" width="26" height="5" rx="2.5" fill="#F7C948"/>' +
    '<path d="M18 22 L38 22 L35.5 43 C35.3 44.5 34 45.5 32.5 45.5 L23.5 45.5 C22 45.5 20.7 44.5 20.5 43 Z" fill="#EE2A8C"/>' +
    '<line x1="24" y1="27" x2="24" y2="40" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>' +
    '<line x1="28" y1="27" x2="28" y2="40" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>' +
    '<line x1="32" y1="27" x2="32" y2="40" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>' +
    "</svg>";

// ---------- Modal: adicionar tempo / reativar ----------
var overlayEdit = document.getElementById("overlay-edit");
var editTitle = document.getElementById("edit-title");
var editCount = document.getElementById("edit-count");
var editInfo = document.getElementById("edit-info");

function editTargetClient() {
    return state.clients.find(function (x) {
        return x.id === state.editTargetId;
    });
}

function updateEditInfo() {
    var c = editTargetClient();
    var price = c ? clientUnitPrice(c) : 0;
    var mins = c ? clientUnitMinutes(c) : 0;
    editCount.textContent = state.editUnits + "×";
    editInfo.textContent =
        "= " +
        money(round2(state.editUnits * price)) +
        " · " +
        state.editUnits * mins +
        " min";
}

export function openEditModal(id, mode) {
    state.editTargetId = id;
    state.editMode = mode;
    state.editUnits = 1;
    updateEditInfo();
    var removeBtn = document.getElementById("edit-remove");
    var label = document.getElementById("edit-label");
    var tc = editTargetClient();
    var bloco = tc
        ? money(clientUnitPrice(tc)) + " (" + clientUnitMinutes(tc) + " min)"
        : "";
    if (mode === "reactivate") {
        editTitle.textContent = "Reativar cliente";
        label.textContent = "Quantos blocos de " + bloco + " adicionar?";
        removeBtn.style.display = "none";
    } else if (mode === "adjust-finished") {
        editTitle.textContent = "Ajustar blocos (sem reativar)";
        label.textContent = "Corrija a quantidade de blocos de " + bloco + ":";
        removeBtn.style.display = "inline-block";
    } else {
        editTitle.textContent = "Ajustar tempo";
        label.textContent = "Quantos blocos de " + bloco + "?";
        removeBtn.style.display = "inline-block";
    }
    overlayEdit.classList.add("show");
}

function applyEditDelta(sign) {
    var c = state.clients.find(function (x) {
        return x.id === state.editTargetId;
    });
    if (!c) return;

    var actualUnits =
        sign === 1 ? state.editUnits : -Math.min(state.editUnits, c.units || 0);
    var addValue = round2(actualUnits * clientUnitPrice(c));
    var addMs = actualUnits * clientUnitMinutes(c) * 60 * 1000;

    if (state.editMode === "adjust-finished") {
        // só corrige quantidade e valor, não mexe em tempo nem status
        c.value = Math.max(0, round2(c.value + addValue));
        c.units = Math.max(0, (c.units || 0) + actualUnits);
    } else {
        // cliente ativo: mexe em tempo, valor e blocos
        var now = Date.now();
        if (sign === 1) {
            var base = c.endTime > now ? c.endTime : now;
            c.endTime = base + addMs;
        } else {
            c.endTime = c.endTime + addMs;
        }
        c.value = Math.max(0, round2(c.value + addValue));
        c.units = Math.max(0, (c.units || 0) + actualUnits);
    }
    saveData();
    render();
}

// ---------- Modal de confirmação (genérico, mais bonito) ----------
var overlayConfirm = document.getElementById("overlay-confirm");
var confirmTitle = document.getElementById("confirm-title");
var confirmMessage = document.getElementById("confirm-message");
var confirmIcon = document.getElementById("confirm-icon");
var pendingConfirmCallback = null;

export function openConfirmModal(icon, title, message, onConfirm) {
    confirmIcon.innerHTML = icon;
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    pendingConfirmCallback = onConfirm;
    overlayConfirm.classList.add("show");
}

// ---------- PIN genérico (usado em zerar dia e apagar histórico) ----------
var overlayPin = document.getElementById("overlay-pin");
var pinInput = document.getElementById("pin-input");
var pinError = document.getElementById("pin-error");
var pinTitle = document.getElementById("pin-title");
var pinMessage = document.getElementById("pin-message");
var pendingPinAction = null;
var pendingPinTarget = null;

export function openPinModal(action, target, title, message) {
    pendingPinAction = action;
    pendingPinTarget = target;
    pinTitle.textContent = title;
    pinMessage.textContent = message;
    pinInput.value = "";
    pinError.style.display = "none";
    overlayPin.classList.add("show");
    setTimeout(function () {
        pinInput.focus();
    }, 50);
}

// ---------- Modal: editar nome do cliente ----------
var overlayRename = document.getElementById("overlay-rename");
var renameInput = document.getElementById("rename-input");
var renameError = document.getElementById("rename-error");
var renameMessage = document.getElementById("rename-message");
var renameTargetId = null;

export function openRenameModal(id) {
    var c = state.clients.find(function (x) {
        return x.id === id;
    });
    if (!c) return;
    renameTargetId = id;
    renameMessage.textContent = "Cliente #" + String(id).padStart(2, "0");
    renameInput.value = c.name;
    renameError.style.display = "none";
    overlayRename.classList.add("show");
    setTimeout(function () {
        renameInput.focus();
        renameInput.select();
    }, 50);
}

function closeRenameModal() {
    overlayRename.classList.remove("show");
    renameTargetId = null;
}

function confirmRename() {
    var novo = renameInput.value.trim();
    if (novo === "") {
        renameError.style.display = "block";
        renameInput.focus();
        return;
    }
    var c = state.clients.find(function (x) {
        return x.id === renameTargetId;
    });
    if (c) {
        c.name = novo;
        saveData();
        render();
    }
    closeRenameModal();
}

function confirmPinAction() {
    if (pinInput.value !== getPin()) {
        pinError.style.display = "block";
        pinInput.value = "";
        pinInput.focus();
        return;
    }
    if (pendingPinAction === "zerarDia") {
        executarZerarDia();
    } else if (pendingPinAction === "apagarHistoricoItem") {
        state.history = state.history.filter(function (h) {
            return h.date !== pendingPinTarget;
        });
        saveData();
        render();
    } else if (pendingPinAction === "apagarHistoricoTudo") {
        state.history = [];
        saveData();
        render();
    } else if (pendingPinAction === "apagarCliente") {
        state.clients = state.clients.filter(function (c) {
            return c.id !== pendingPinTarget;
        });
        saveData();
        render();
    }
    overlayPin.classList.remove("show");
    pendingPinAction = null;
    pendingPinTarget = null;
}

export function initModals() {
    document
        .getElementById("edit-minus")
        .addEventListener("click", function () {
            if (state.editUnits > 1) {
                state.editUnits--;
                updateEditInfo();
            }
        });

    document.getElementById("edit-plus").addEventListener("click", function () {
        if (state.editUnits < 48) {
            state.editUnits++;
            updateEditInfo();
        }
    });

    document
        .getElementById("edit-cancel")
        .addEventListener("click", function () {
            overlayEdit.classList.remove("show");
            state.editTargetId = null;
        });

    document
        .getElementById("edit-confirm")
        .addEventListener("click", function () {
            if (state.editMode === "reactivate") {
                var c = state.clients.find(function (x) {
                    return x.id === state.editTargetId;
                });
                if (c) {
                    var addMs =
                        state.editUnits * clientUnitMinutes(c) * 60 * 1000;
                    var addValue = round2(state.editUnits * clientUnitPrice(c));
                    var now = Date.now();
                    c.status = "active";
                    c.finishedTime = null;
                    c.endTime =
                        clientType(c) === "night"
                            ? getClosingTime(now)
                            : now + addMs;
                    c.value = round2(c.value + addValue);
                    c.units = (c.units || 0) + state.editUnits;
                    delete state.warningShownFor[c.id];
                    saveData();
                    render();
                }
            } else {
                applyEditDelta(1);
            }
            overlayEdit.classList.remove("show");
            state.editTargetId = null;
        });

    document
        .getElementById("edit-remove")
        .addEventListener("click", function () {
            applyEditDelta(-1);
            overlayEdit.classList.remove("show");
            state.editTargetId = null;
        });

    document
        .getElementById("confirm-cancel")
        .addEventListener("click", function () {
            overlayConfirm.classList.remove("show");
            pendingConfirmCallback = null;
        });

    document
        .getElementById("confirm-ok")
        .addEventListener("click", function () {
            var cb = pendingConfirmCallback;
            overlayConfirm.classList.remove("show");
            pendingConfirmCallback = null;
            if (cb) cb();
        });

    document.getElementById("btn-zerar").addEventListener("click", function () {
        if (state.clients.length === 0) return;
        openPinModal(
            "zerarDia",
            null,
            "Confirmar com PIN",
            "Digite o PIN pra zerar o dia. Essa ação apaga todos os clientes cadastrados hoje (o resumo fica salvo no histórico).",
        );
    });

    document
        .getElementById("pin-cancel")
        .addEventListener("click", function () {
            overlayPin.classList.remove("show");
            pendingPinAction = null;
        });

    document
        .getElementById("pin-confirm")
        .addEventListener("click", confirmPinAction);

    pinInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") confirmPinAction();
    });

    document
        .getElementById("rename-cancel")
        .addEventListener("click", closeRenameModal);

    document
        .getElementById("rename-confirm")
        .addEventListener("click", confirmRename);

    renameInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") confirmRename();
        else if (e.key === "Escape") closeRenameModal();
    });
}
