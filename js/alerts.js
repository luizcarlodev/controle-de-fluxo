import { state } from "./state.js";
import { render } from "./render.js";
import { saveData } from "./storage.js";

export var WARN_THRESHOLD_MS = 10 * 60 * 1000; // fica "amarelo" faltando 10min
export var CRIT_THRESHOLD_MS = 2 * 60 * 1000; // fica "crítico" faltando 2min

// ---------- Som de alerta ----------
function playBeep() {
    try {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        var ctx = new Ctx();
        var playTone = function (delay) {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = 880;
            gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(
                0.25,
                ctx.currentTime + delay + 0.02,
            );
            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                ctx.currentTime + delay + 0.28,
            );
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + 0.3);
        };
        playTone(0);
        playTone(0.35);
    } catch (e) {
        /* navegador sem suporte, ignora */
    }
}

// ---------- Tela sempre ligada ----------
var wakeLockRef = null;

export function requestWakeLock() {
    if ("wakeLock" in navigator) {
        navigator.wakeLock
            .request("screen")
            .then(function (lock) {
                wakeLockRef = lock;
            })
            .catch(function () {
                /* ignora se o navegador negar */
            });
    }
}

// ---------- Modal: aviso de tempo esgotado ----------
var overlayWarning = document.getElementById("overlay-warning");
var warningTitle = document.getElementById("warning-title");
var warningText = document.getElementById("warning-text");

export function pushWarning(client) {
    if (state.warningShownFor[client.id]) return;
    state.warningShownFor[client.id] = true;
    state.warningQueue.push(client.id);
    if (state.warningQueue.length === 1) showNextWarning();
}

function showNextWarning() {
    if (state.warningQueue.length === 0) {
        overlayWarning.classList.remove("show");
        return;
    }
    var id = state.warningQueue[0];
    var c = state.clients.find(function (x) {
        return x.id === id;
    });
    if (!c || c.status !== "awaiting") {
        state.warningQueue.shift();
        showNextWarning();
        return;
    }
    warningTitle.textContent = "Tempo esgotado!";
    warningText.textContent = "O tempo de " + c.name + " acabou.";
    overlayWarning.classList.add("show");
    playBeep();
}

export function initAlerts() {
    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") requestWakeLock();
    });

    document
        .getElementById("warning-ok")
        .addEventListener("click", function () {
            var id = state.warningQueue.shift();
            var c = state.clients.find(function (x) {
                return x.id === id;
            });
            if (c) {
                c.status = "finished";
                c.finishedTime = Date.now();
                saveData();
                render();
            }
            showNextWarning();
        });
}
