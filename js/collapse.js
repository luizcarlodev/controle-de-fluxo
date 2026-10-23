// ---------- Minimizar seções ----------
var COLLAPSE_KEY = "saborOnline_collapse_v1";
var collapseState = {};

export function applyCollapseState() {
    document.querySelectorAll(".collapse-btn").forEach(function (btn) {
        var targetId = btn.getAttribute("data-target");
        var target = document.getElementById(targetId);
        var isCollapsed = !!collapseState[targetId];
        target.classList.toggle("hidden", isCollapsed);
        btn.classList.toggle("collapsed", isCollapsed);
    });
}

export function initCollapse() {
    try {
        var rawCollapse = localStorage.getItem(COLLAPSE_KEY);
        collapseState = rawCollapse ? JSON.parse(rawCollapse) : {};
    } catch (e) {
        collapseState = {};
    }

    document.querySelectorAll(".collapse-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            var targetId = btn.getAttribute("data-target");
            collapseState[targetId] = !collapseState[targetId];
            localStorage.setItem(COLLAPSE_KEY, JSON.stringify(collapseState));
            applyCollapseState();
        });
    });
}
