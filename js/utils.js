import { CLOSING_HOUR, CLOSING_MIN } from "./plans.js";

// ---------- Helpers ----------
export function formatClock(ts) {
    return new Date(ts).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatCountdown(ms) {
    if (ms < 0) ms = 0;
    var totalSec = Math.floor(ms / 1000);
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    if (h > 0) return h + "h " + String(m).padStart(2, "0") + "m";
    return String(m).padStart(2, "0") + "m " + String(s).padStart(2, "0") + "s";
}

export function getClosingTime(baseTs) {
    var d = new Date(baseTs);
    d.setHours(CLOSING_HOUR, CLOSING_MIN, 0, 0);
    if (d.getTime() < baseTs) d.setDate(d.getDate() + 1); // segurança se já passou
    return d.getTime();
}

export function money(v) {
    return (
        "R$ " +
        v.toLocaleString("pt-BR", {
            minimumFractionDigits: v % 1 === 0 ? 0 : 2,
        })
    );
}

export function escapeHtml(str) {
    var d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
}
