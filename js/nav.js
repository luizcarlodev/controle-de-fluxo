// Menu lateral (☰) e troca de telas: Fluxo, Resumo e Configurações.
// A tela atual fica em <main data-current="...">; o CSS esconde as outras.
import { closeMenu } from "./menu.js";

var appMain = document.getElementById("app-main");
var drawer = document.getElementById("drawer");
var backdrop = document.getElementById("drawer-backdrop");
var btnNav = document.getElementById("btn-nav");

function openDrawer() {
    drawer.classList.add("open");
    backdrop.classList.add("show");
    btnNav.setAttribute("aria-expanded", "true");
}

function closeDrawer() {
    drawer.classList.remove("open");
    backdrop.classList.remove("show");
    btnNav.setAttribute("aria-expanded", "false");
}

// Os avisos de "salvo!" / erro da tela de Configurações somem quando você troca de tela
function limparMensagensDaConfig() {
    document.querySelectorAll(".config-msg").forEach(function (msg) {
        msg.textContent = "";
        msg.className = "config-msg";
    });
    ["pin-atual", "pin-novo", "pin-novo2"].forEach(function (id) {
        document.getElementById(id).value = "";
    });
}

function showView(name) {
    appMain.setAttribute("data-current", name);
    drawer.querySelectorAll("[data-nav]").forEach(function (item) {
        item.classList.toggle("active", item.getAttribute("data-nav") === name);
    });
    closeMenu(); // fecha o menu ⋮ se estiver aberto
    limparMensagensDaConfig();
    window.scrollTo(0, 0);
}

export function initNav() {
    btnNav.addEventListener("click", openDrawer);
    backdrop.addEventListener("click", closeDrawer);
    document
        .getElementById("drawer-close")
        .addEventListener("click", closeDrawer);

    drawer.querySelectorAll("[data-nav]").forEach(function (item) {
        item.addEventListener("click", function () {
            showView(item.getAttribute("data-nav"));
            closeDrawer();
        });
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeDrawer();
    });
}
