import { state } from "./state.js";
import { clientPlanName, clientType } from "./plans.js";
import { CRIT_THRESHOLD_MS, WARN_THRESHOLD_MS } from "./alerts.js";
import { escapeHtml, formatClock, formatCountdown, money } from "./utils.js";

export function buildActiveCard(c, now) {
    var remaining = c.endTime - now;
    var totalDuration = c.endTime - c.entryTime;
    var pct =
        totalDuration > 0
            ? Math.max(0, Math.min(100, (remaining / totalDuration) * 100))
            : 0;

    var statusClass = "";
    if (c.status === "awaiting") statusClass = "critical";
    else if (remaining <= CRIT_THRESHOLD_MS) statusClass = "critical";
    else if (remaining <= WARN_THRESHOLD_MS) statusClass = "warning";

    var planLabel =
        clientType(c) === "night" ? clientPlanName(c) : money(c.value);
    var metaLine =
        planLabel +
        " · " +
        formatClock(c.entryTime) +
        " → " +
        formatClock(c.endTime);

    var div = document.createElement("div");
    div.className = "client-card " + statusClass;
    div.innerHTML =
        '<div class="id-badge">#' +
        String(c.id).padStart(2, "0") +
        "</div>" +
        '<div class="client-info">' +
        '<div class="name">' +
        '<button class="name-text' +
        (state.expandedNames[c.id] ? " expanded" : "") +
        '" data-action="toggle-name" data-id="' +
        c.id +
        '" title="Toque para ver o nome completo">' +
        escapeHtml(c.name) +
        "</button></div>" +
        '<div class="sub">' +
        '<span class="meta">' +
        metaLine +
        "</span></div>" +
        "</div>" +
        '<div class="timer-wrap">' +
        '<div class="timer">' +
        (c.status === "awaiting" ? "acabou" : formatCountdown(remaining)) +
        "</div>" +
        '<div class="melt-bar"><div class="melt-fill" style="width:' +
        pct +
        '%"></div></div>' +
        "</div>" +
        '<div class="card-actions">' +
        '<button class="btn-small btn-pay ' +
        (c.pago ? "pago" : "pendente") +
        '" data-action="toggle-pago" data-id="' +
        c.id +
        '">' +
        (c.pago ? "✅ Pago" : "⏳ Pendente") +
        "</button>" +
        '<button class="btn-small btn-menu" data-action="toggle-menu" data-id="' +
        c.id +
        '" data-type="active" data-ptype="' +
        clientType(c) +
        '" title="Mais ações">⋮</button>' +
        "</div>";
    return div;
}

export function buildFinishedCard(c) {
    var div = document.createElement("div");
    div.className = "client-card finished";
    var planLabel =
        clientType(c) === "night" ? clientPlanName(c) : money(c.value);
    var metaLine =
        planLabel +
        " · " +
        formatClock(c.entryTime) +
        " → " +
        formatClock(c.finishedTime);
    div.innerHTML =
        '<div class="id-badge">#' +
        String(c.id).padStart(2, "0") +
        "</div>" +
        '<div class="client-info">' +
        '<div class="name">' +
        '<button class="name-text' +
        (state.expandedNames[c.id] ? " expanded" : "") +
        '" data-action="toggle-name" data-id="' +
        c.id +
        '" title="Toque para ver o nome completo">' +
        escapeHtml(c.name) +
        "</button></div>" +
        '<div class="sub">' +
        '<span class="meta">' +
        metaLine +
        "</span>" +
        '<button class="pay-badge ' +
        (c.pago ? "pago" : "pendente") +
        '" data-action="toggle-pago" data-id="' +
        c.id +
        '">' +
        (c.pago ? "✅ Pago" : "⏳ Pendente") +
        "</button></div>" +
        "</div>" +
        '<div class="timer-wrap"><span class="finished-time">encerrado</span></div>' +
        '<div class="card-actions">' +
        '<button class="btn-small btn-reactivate" data-action="reactivate" data-id="' +
        c.id +
        '">Reativar</button>' +
        '<button class="btn-small btn-menu" data-action="toggle-menu" data-id="' +
        c.id +
        '" data-type="finished" data-ptype="' +
        clientType(c) +
        '" title="Mais ações">⋮</button>' +
        "</div>";
    return div;
}
