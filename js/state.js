// Estado compartilhado do app. Os outros arquivos importam `state`
// e leem/alteram as propriedades (ex: state.clients).
export const state = {
    clients: [],
    nextId: 1,
    history: [],
    selectedPlan: "5",
    stepUnits: 1,
    editUnits: 1,
    editTargetId: null,
    editMode: null,
    warningQueue: [],
    warningShownFor: {},
    searchTerm: "",
    payFilter: "all",
    openMenuId: null,
    plans: [], // planos de entrada (configuráveis na tela Configurações)
    expandedNames: {}, // ids dos cards com o nome expandido (só na sessão)
};
