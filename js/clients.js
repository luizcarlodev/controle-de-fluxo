import { state } from "./state.js";
import { ICON_END_SVG, openConfirmModal, openPinModal } from "./modals.js";
import {
    planById,
    round2,
    selectDefaultPlan,
    updateStepInfo,
} from "./plans.js";
import { render } from "./render.js";
import { saveData } from "./storage.js";
import { getClosingTime } from "./utils.js";

// ---------- Cadastro: submit ----------
var inputName = document.getElementById("input-name");
var nameError = document.getElementById("name-error");

// ---------- Encerrar manualmente (confirmação simples) ----------
export function endClientNow(id) {
    var c = state.clients.find(function (x) {
        return x.id === id;
    });
    if (!c) return;
    openConfirmModal(
        ICON_END_SVG,
        "Encerrar cliente?",
        'Encerrar "' + c.name + '" agora? O tempo dele ainda não acabou.',
        function () {
            c.status = "finished";
            c.finishedTime = Date.now();
            saveData();
            render();
        },
    );
}

// ---------- Apagar cliente (com PIN, ação irreversível) ----------
export function deleteClientNow(id) {
    var c = state.clients.find(function (x) {
        return x.id === id;
    });
    if (!c) return;
    openPinModal(
        "apagarCliente",
        id,
        "Confirmar com PIN",
        'Digite o PIN pra apagar "' +
            c.name +
            '" definitivamente. Essa ação não pode ser desfeita.',
    );
}

export function initClients() {
    document
        .getElementById("btn-submit")
        .addEventListener("click", function () {
            var name = inputName.value.trim();
            if (!name) {
                nameError.style.display = "block";
                inputName.focus();
                return;
            }
            nameError.style.display = "none";

            var plan = planById(state.selectedPlan);
            if (!plan || !plan.active) {
                window.alert(
                    "Nenhum plano ativo. Ative um plano em Configurações.",
                );
                return;
            }

            var now = Date.now();
            var entry;
            if (plan.type === "time") {
                entry = {
                    id: state.nextId++,
                    name: name,
                    plan: plan.id,
                    planName: plan.name,
                    type: "time",
                    unitPrice: plan.price,
                    unitMinutes: plan.minutes,
                    units: state.stepUnits,
                    value: round2(state.stepUnits * plan.price),
                    entryTime: now,
                    endTime: now + state.stepUnits * plan.minutes * 60 * 1000,
                    status: "active",
                    finishedTime: null,
                    pago: false,
                };
            } else {
                entry = {
                    id: state.nextId++,
                    name: name,
                    plan: plan.id,
                    planName: plan.name,
                    type: "night",
                    units: 1,
                    value: plan.price,
                    entryTime: now,
                    endTime: getClosingTime(now),
                    status: "active",
                    finishedTime: null,
                    pago: false,
                };
            }
            state.clients.push(entry);
            saveData();

            inputName.value = "";
            state.stepUnits = 1;
            updateStepInfo();
            selectDefaultPlan();
            render();
        });
}
