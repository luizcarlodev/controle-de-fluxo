import { state } from "./state.js";

// ---------- Menu "⋮" de ações (único, flutuante) ----------
var globalMenu = document.getElementById("global-menu");

export function closeMenu() {
    state.openMenuId = null;
    globalMenu.classList.remove("show");
}

function buildMenuItems(type, ptype, id) {
    var html =
        '<button data-action="rename" data-id="' +
        id +
        '">✏️ Editar nome</button>';
    if (type === "active" && ptype === "time") {
        html +=
            '<button data-action="add" data-id="' +
            id +
            '">✎ Ajustar tempo</button>';
    }
    if (type === "finished" && ptype === "time") {
        html +=
            '<button data-action="adjust-finished" data-id="' +
            id +
            '">✎ Ajustar</button>';
    }
    if (type === "active") {
        html +=
            '<button data-action="end" data-id="' +
            id +
            '">⏹️ Encerrar</button>';
    }
    html +=
        '<button data-action="delete" data-id="' +
        id +
        '" class="danger">🗑️ Apagar</button>';
    return html;
}

export function openMenuFor(btn, id, type, ptype) {
    state.openMenuId = id;
    globalMenu.innerHTML = buildMenuItems(type, ptype, id);
    globalMenu.classList.add("show");

    var rect = btn.getBoundingClientRect();
    var top = rect.bottom + 6;
    if (top + globalMenu.offsetHeight > window.innerHeight) {
        top = rect.top - 6 - globalMenu.offsetHeight;
    }
    globalMenu.style.top = top + "px";
    globalMenu.style.right = window.innerWidth - rect.right + "px";
    globalMenu.style.left = "auto";
}

export function repositionOrCloseMenu() {
    if (state.openMenuId === null) return;
    var btn = document.querySelector(
        '.btn-menu[data-id="' + state.openMenuId + '"]',
    );
    if (!btn) {
        closeMenu();
        return;
    }
    var rect = btn.getBoundingClientRect();
    var top = rect.bottom + 6;
    if (top + globalMenu.offsetHeight > window.innerHeight) {
        top = rect.top - 6 - globalMenu.offsetHeight;
    }
    globalMenu.style.top = top + "px";
    globalMenu.style.right = window.innerWidth - rect.right + "px";
    globalMenu.style.left = "auto";
}

export function initMenu() {
    document.addEventListener("click", function (e) {
        if (
            state.openMenuId !== null &&
            !e.target.closest("#global-menu") &&
            !e.target.closest(".btn-menu")
        ) {
            closeMenu();
        }
    });

    window.addEventListener(
        "scroll",
        function () {
            if (state.openMenuId !== null) closeMenu();
        },
        true,
    );

    window.addEventListener("resize", function () {
        if (state.openMenuId !== null) closeMenu();
    });
}
