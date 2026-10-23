import { render } from "./render.js";

// ---------- Relógio do header ----------
function tickClock() {
    document.getElementById("clock-text").textContent =
        new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
        }) +
        " — " +
        new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
        });
}

// ---------- Loop principal ----------
export function tick() {
    tickClock();
    render();
}
