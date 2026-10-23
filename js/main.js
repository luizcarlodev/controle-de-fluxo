import { state } from "./state.js";
import { initAlerts, requestWakeLock } from "./alerts.js";
import {
    initBackup,
    triggerBackupExport,
    triggerBackupImport,
} from "./backup.js";
import { deleteClientNow, endClientNow, initClients } from "./clients.js";
import { applyCollapseState, initCollapse } from "./collapse.js";
import { initDay } from "./day.js";
import { initHistory } from "./history.js";
import { closeMenu, initMenu, openMenuFor } from "./menu.js";
import {
    initModals,
    openConfirmModal,
    openEditModal,
    openPinModal,
    openRenameModal,
} from "./modals.js";
import { initNav } from "./nav.js";
import { initPlans, renderPlanButtons } from "./plans.js";
import { getSetting, initSettings, renderPlansEditor } from "./settings.js";
import { initRender, render } from "./render.js";
import { loadData, saveData } from "./storage.js";
import { tick } from "./timer.js";

function initEvents() {
    // ---------- Delegação de eventos nas listas ----------
    document.addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-action]");
        if (!btn) return;
        var id = parseInt(btn.getAttribute("data-id"), 10);
        var action = btn.getAttribute("data-action");

        if (action === "toggle-menu") {
            if (state.openMenuId === id) {
                closeMenu();
            } else {
                openMenuFor(
                    btn,
                    id,
                    btn.getAttribute("data-type"),
                    btn.getAttribute("data-ptype"),
                );
            }
            return;
        }
        if (state.openMenuId !== null) closeMenu();

        if (action === "add") openEditModal(id, "add");
        else if (action === "reactivate") openEditModal(id, "reactivate");
        else if (action === "adjust-finished")
            openEditModal(id, "adjust-finished");
        else if (action === "end") endClientNow(id);
        else if (action === "delete") deleteClientNow(id);
        else if (action === "backup-export") triggerBackupExport();
        else if (action === "backup-import") triggerBackupImport();
        else if (action === "backup-restore") triggerBackupImport("restore");
        else if (action === "toggle-pago") {
            var cp = state.clients.find(function (x) {
                return x.id === id;
            });
            if (cp && cp.pago && getSetting("confirmarDesfazerPago", false)) {
                // se a preferência estiver ligada, desfazer um pagamento pede confirmação
                openConfirmModal(
                    "↩️",
                    "Desfazer pagamento?",
                    'Marcar "' + cp.name + '" como pendente de novo?',
                    function () {
                        cp.pago = false;
                        saveData();
                        render();
                    },
                );
            } else if (cp) {
                cp.pago = !cp.pago;
                saveData();
                render();
            }
        } else if (action === "del-history") {
            var dateVal = parseInt(btn.getAttribute("data-date"), 10);
            openPinModal(
                "apagarHistoricoItem",
                dateVal,
                "Confirmar com PIN",
                "Digite o PIN pra apagar esse dia do histórico. Essa ação não pode ser desfeita.",
            );
        } else if (action === "toggle-name") {
            state.expandedNames[id] = !state.expandedNames[id];
            render();
        } else if (action === "rename") {
            openRenameModal(id);
        }
    });
}

// Mesma ordem do código original: ligar os eventos...
initAlerts();
initPlans();
initClients();
initModals();
initMenu();
initEvents();
initNav();
initSettings();
initHistory();
initDay();
initRender();
initBackup();

// ...e então iniciar o app.
loadData();
renderPlanButtons();
renderPlansEditor();
tick();
setInterval(tick, 1000);
requestWakeLock();
initCollapse();
applyCollapseState();
