import { state } from "./state.js";
import { openConfirmModal } from "./modals.js";
import { render } from "./render.js";
import { clientPlanName, clientType, renderPlanButtons } from "./plans.js";
import { mergeHistoryEntries, resumirDia } from "./history.js";
import { renderPlansEditor } from "./settings.js";
import { normalizarPlanos, saveData, savePlans } from "./storage.js";

// ---------- Backup: exportar ----------
function formatFullDateTime(ts) {
    if (!ts) return null;
    return new Date(ts).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function statusLegivel(s) {
    if (s === "finished") return "finalizado";
    if (s === "awaiting") return "aguardando confirmação";
    return "ativo";
}

export function triggerBackupExport() {
    var clientesExport = state.clients.map(function (c) {
        return {
            id: c.id,
            nome: c.name,
            tipoEntrada: clientType(c) === "night" ? "noite_toda" : "avulsa",
            planoId: c.plan,
            planoNome: clientPlanName(c),
            valorUnidade: c.unitPrice || null,
            minutosUnidade: c.unitMinutes || null,
            blocosPagos: c.units,
            valorPago: c.value,
            pago: !!c.pago,
            dataEntrada: formatFullDateTime(c.entryTime),
            horarioEntradaMs: c.entryTime,
            dataTermino: formatFullDateTime(c.endTime),
            horarioTerminoMs: c.endTime,
            status: statusLegivel(c.status),
            dataEncerramento: formatFullDateTime(c.finishedTime),
            horarioEncerramentoMs: c.finishedTime,
        };
    });
    var historicoExport = state.history.map(function (h) {
        return {
            data: formatFullDateTime(h.date),
            dataMs: h.date,
            totalClientes: h.total,
            vendasNoiteToda: h.count20,
            vendasAvulsas: h.count5,
            faturamento: h.revenue,
            porPlano: h.byPlan || null,
            pendente: typeof h.pending === "number" ? h.pending : null,
        };
    });
    var payload = {
        exportadoEm: formatFullDateTime(Date.now()),
        proximoId: state.nextId,
        planos: state.plans,
        clientes: clientesExport,
        historico: historicoExport,
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    var dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = "sabor-online-backup-" + dateStr + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ---------- Backup: importar ----------
var backupFileInput = document.getElementById("backup-file-input");
var importMode = "history"; // "history" = junta dias ao histórico | "restore" = substitui tudo

export function triggerBackupImport(mode) {
    importMode = mode === "restore" ? "restore" : "history";
    backupFileInput.click();
}

// Lê o conteúdo de um backup (formato novo, em português, ou o antigo) e
// devolve { clients, nextId, history, plans } — ou null se não for um backup.
function lerBackup(data) {
    if (!data || typeof data !== "object") return null;
    if (Array.isArray(data.clientes)) {
        var clients = data.clientes.map(function (item) {
            var noite = item.tipoEntrada === "noite_toda";
            var c = {
                id: item.id,
                name: item.nome,
                plan: item.planoId || (noite ? "20" : "5"),
                type: noite ? "night" : "time",
                units: item.blocosPagos,
                value: item.valorPago,
                pago: !!item.pago,
                entryTime: item.horarioEntradaMs,
                endTime: item.horarioTerminoMs,
                status:
                    item.status === "finalizado"
                        ? "finished"
                        : item.status === "aguardando confirmação"
                          ? "awaiting"
                          : "active",
                finishedTime: item.horarioEncerramentoMs || null,
            };
            if (item.planoNome) c.planName = item.planoNome;
            if (item.valorUnidade) c.unitPrice = item.valorUnidade;
            if (item.minutosUnidade) c.unitMinutes = item.minutosUnidade;
            return c;
        });
        var nextId =
            typeof data.proximoId === "number"
                ? data.proximoId
                : clients.length
                  ? Math.max.apply(
                        null,
                        clients.map(function (c) {
                            return c.id;
                        }),
                    ) + 1
                  : 1;
        var history = Array.isArray(data.historico)
            ? data.historico.map(function (h) {
                  var e = {
                      date: h.dataMs,
                      total: h.totalClientes,
                      count20: h.vendasNoiteToda,
                      count5: h.vendasAvulsas,
                      revenue: h.faturamento,
                  };
                  if (Array.isArray(h.porPlano)) e.byPlan = h.porPlano;
                  if (typeof h.pendente === "number") e.pending = h.pendente;
                  return e;
              })
            : [];
        return {
            clients: clients,
            nextId: nextId,
            history: history,
            plans: normalizarPlanos(data.planos),
        };
    }
    if (Array.isArray(data.clients)) {
        // formato antigo (backups feitos antes das atualizações)
        return {
            clients: data.clients,
            nextId: typeof data.nextId === "number" ? data.nextId : 1,
            history: Array.isArray(data.history) ? data.history : [],
            plans: null,
        };
    }
    return null;
}

// Modo "histórico": os dias do arquivo entram no histórico, sem mexer em mais nada
function importarParaHistorico(bk) {
    var novos = bk.history.slice();
    if (bk.clients.length) {
        // os clientes do arquivo viram mais um dia (a data é a da primeira entrada)
        var entradas = bk.clients
            .map(function (c) {
                return c.entryTime;
            })
            .filter(function (t) {
                return typeof t === "number";
            });
        if (entradas.length) {
            var dia = resumirDia(bk.clients);
            dia.date = Math.min.apply(null, entradas);
            novos.push(dia);
        }
    }
    var added = mergeHistoryEntries(novos);
    saveData();
    render();
    window.alert(
        added
            ? added +
                  (added === 1 ? " dia adicionado" : " dias adicionados") +
                  " ao histórico!"
            : "Nenhum dia novo: esses dias já estavam no histórico.",
    );
}

// Modo "restaurar": troca clientes, histórico e planos pelo que está no arquivo
function restaurarTudo(bk) {
    state.clients = bk.clients;
    state.nextId = bk.nextId;
    state.history = bk.history;
    if (bk.plans) {
        state.plans = bk.plans;
        savePlans();
    }
    saveData();
    renderPlanButtons();
    renderPlansEditor();
    render();
    window.alert("Backup restaurado com sucesso!");
}

export function initBackup() {
    backupFileInput.addEventListener("change", function (e) {
        var file = e.target.files[0];
        if (!file) return;
        var modo = importMode;
        var reader = new FileReader();
        reader.onload = function (ev) {
            var bk = null;
            try {
                bk = lerBackup(JSON.parse(ev.target.result));
            } catch (err) {}
            if (!bk) {
                window.alert(
                    "Não consegui ler esse arquivo. Confira se é um backup válido do Sabor Online.",
                );
                return;
            }
            var restaurar = modo === "restore";
            openConfirmModal(
                "📥",
                restaurar ? "Restaurar backup?" : "Importar para o histórico?",
                restaurar
                    ? "Isso vai substituir TUDO (clientes de hoje, histórico e planos) pelo conteúdo do backup. Continuar?"
                    : "Os dias desse backup entram no histórico, na ordem certa e marcados como importados. Seus clientes de hoje não mudam.",
                function () {
                    try {
                        if (restaurar) restaurarTudo(bk);
                        else importarParaHistorico(bk);
                    } catch (err) {
                        window.alert(
                            "Não consegui processar esse backup. Confira se é um arquivo válido.",
                        );
                    }
                },
            );
        };
        reader.readAsText(file);
        backupFileInput.value = "";
    });
}
