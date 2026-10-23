// Janela com o resumo visual de um dia do histórico.
import { state } from "./state.js";
import { round2 } from "./plans.js";
import { money } from "./utils.js";

var overlayDay = document.getElementById("overlay-day");

function setText(id, texto) {
    document.getElementById(id).textContent = texto;
}

// Linhas "por plano" do dia. Dias antigos (sem byPlan) só têm os 2 contadores de antes.
function linhasDoDia(h) {
    if (Array.isArray(h.byPlan)) {
        return h.byPlan.map(function (g) {
            return {
                name: g.name,
                count: g.count,
                type: g.type,
                revenue: typeof g.revenue === "number" ? g.revenue : null,
            };
        });
    }
    var linhas = [];
    if (h.count20)
        linhas.push({
            name: "noite toda",
            count: h.count20,
            type: "night",
            revenue: null,
        });
    if (h.count5)
        linhas.push({
            name: "avulsas",
            count: h.count5,
            type: "time",
            revenue: null,
        });
    return linhas;
}

function textoQuantidade(l) {
    if (l.type === "time")
        return l.count + (l.count === 1 ? " bloco" : " blocos");
    return l.count + (l.count === 1 ? " cliente" : " clientes");
}

export function openDayModal(date) {
    var h = state.history.find(function (x) {
        return x.date === date;
    });
    if (!h) return;
    var d = new Date(h.date);
    setText("day-weekday", d.toLocaleDateString("pt-BR", { weekday: "long" }));
    setText(
        "day-date",
        d.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        }),
    );
    document.getElementById("day-tag").style.display = h.imported
        ? "inline-block"
        : "none";
    setText("day-revenue", money(h.revenue));
    setText("day-clients", String(h.total));
    setText(
        "day-ticket",
        h.total ? money(round2(h.revenue / h.total)) : "R$ 0",
    );
    var pendBox = document.getElementById("day-pending-box");
    if (typeof h.pending === "number") {
        pendBox.style.display = "";
        setText("day-pending", money(h.pending));
    } else {
        pendBox.style.display = "none"; // dias antigos não guardaram o pendente
    }

    var box = document.getElementById("day-plans");
    box.innerHTML = "";
    var linhas = linhasDoDia(h);
    if (!linhas.length) {
        box.innerHTML = '<div class="day-empty">Nenhuma venda neste dia.</div>';
    }
    var usaValor =
        linhas.length &&
        linhas.every(function (l) {
            return l.revenue !== null;
        });
    var maior = Math.max.apply(
        null,
        linhas
            .map(function (l) {
                return usaValor ? l.revenue : l.count;
            })
            .concat([1]),
    );
    linhas.forEach(function (l) {
        var pct = Math.max(
            4,
            Math.round(((usaValor ? l.revenue : l.count) / maior) * 100),
        );
        var row = document.createElement("div");
        row.className = "day-plan";
        var top = document.createElement("div");
        top.className = "day-plan-top";
        var nome = document.createElement("span");
        nome.textContent = l.name;
        var qtd = document.createElement("span");
        qtd.className = "c";
        qtd.textContent = textoQuantidade(l);
        top.appendChild(nome);
        top.appendChild(qtd);
        var bar = document.createElement("div");
        bar.className = "day-bar";
        var fill = document.createElement("span");
        fill.style.width = pct + "%";
        bar.appendChild(fill);
        row.appendChild(top);
        row.appendChild(bar);
        if (l.revenue !== null) {
            var rev = document.createElement("div");
            rev.className = "day-plan-rev";
            rev.textContent = money(l.revenue);
            row.appendChild(rev);
        }
        box.appendChild(row);
    });
    overlayDay.classList.add("show");
}

function closeDayModal() {
    overlayDay.classList.remove("show");
}

export function initDay() {
    document
        .getElementById("day-close")
        .addEventListener("click", closeDayModal);
    overlayDay.addEventListener("click", function (e) {
        if (e.target === overlayDay) closeDayModal(); // clicar fora fecha
    });
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeDayModal();
    });
}
