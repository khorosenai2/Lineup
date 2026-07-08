const STORAGE_KEY = "cs2-lineups-v1";
const AUTH_SESSION_KEY = "cs2-lineups-auth-v1";
const GITHUB_SETTINGS_KEY = "cs2-lineups-github-settings-v1";
const GITHUB_TOKEN_SESSION_KEY = "cs2-lineups-github-token-session-v1";
const GITHUB_TOKEN_LOCAL_KEY = "cs2-lineups-github-token-local-v1";
const GITHUB_API_VERSION = "2022-11-28";

const DEFAULT_GITHUB_SETTINGS = Object.freeze({
  owner: "",
  repo: "",
  branch: "main",
  path: "data/lineups.json",
  rememberToken: false
});

const AUTH_USERS = Object.freeze({
  storm_este: {
    salt: "cs2-lineups-vault:storm_este:2026-07-08",
    passwordHash: "a46f1de7bc3ad1478312b9057c67e6368b82a4f32e9728ba1a38fd5787ddc308"
  },
  khorosenai: {
    salt: "cs2-lineups-vault:khorosenai:2026-07-08",
    passwordHash: "209eca5d0f464a5cfcea1e29fcd78c31086a72b0083fe6c71514c230e1bea38a"
  }
});

const fallbackLineups = [
  {
    id: "demo-mirage-smoke-jungle",
    name: "Exemple : Smoke Jungle depuis T spawn",
    description: "Exemple de fiche pour montrer le format. Remplace les infos par une vraie lineup verifiee avant de partager la base.",
    map: "Mirage",
    place: "T spawn",
    instructions: "1. Place-toi au T spawn.\n2. Aligne ton viseur avec le repere choisi.\n3. Lance la smoke en jumpthrow.",
    result: "La smoke doit bloquer Jungle pour faciliter une prise mid ou une exec A.",
    tags: ["smoke", "jungle", "mid", "demo"],
    images: { place: "", position: "", aim: "", result: "" },
    createdAt: "2026-07-08T00:00:00.000Z",
    updatedAt: "2026-07-08T00:00:00.000Z"
  },
  {
    id: "demo-inferno-molotov-dark",
    name: "Exemple : Molotov Dark depuis banana",
    description: "Exemple de fiche pour un nettoyage de position. Ajoute tes captures CS2 pour rendre la lineup exploitable.",
    map: "Inferno",
    place: "Banana",
    instructions: "1. Bloque-toi sur le coin indique.\n2. Vise le repere sur le mur.\n3. Lance en clic gauche.",
    result: "La molotov force le joueur cache a Dark a sortir ou a reculer.",
    tags: ["molotov", "banana", "dark", "demo"],
    images: { place: "", position: "", aim: "", result: "" },
    createdAt: "2026-07-08T00:00:00.000Z",
    updatedAt: "2026-07-08T00:00:00.000Z"
  },
  {
    id: "demo-dust2-smoke-xbox",
    name: "Exemple : Smoke Xbox depuis T spawn",
    description: "Exemple de structure pour Dust II. Le resultat depend du tick, de la position exacte et du lancer.",
    map: "Dust II",
    place: "T spawn",
    instructions: "1. Positionne-toi sur le repere.\n2. Vise le haut du batiment.\n3. Lance avec un jumpthrow.",
    result: "La smoke couvre Xbox pour passer catwalk plus facilement.",
    tags: ["smoke", "xbox", "catwalk", "demo"],
    images: { place: "", position: "", aim: "", result: "" },
    createdAt: "2026-07-08T00:00:00.000Z",
    updatedAt: "2026-07-08T00:00:00.000Z"
  }
];

const els = {};
const state = {
  baseLineups: [],
  lineups: [],
  selectedId: null,
  query: "",
  mapFilter: "Toutes",
  editingId: null,
  pendingImages: {},
  activeImageField: null,
  hasLocalChanges: false,
  toastTimer: null,
  authenticatedUser: null,
  isLoaded: false,
  imageViewer: {
    src: "",
    title: "",
    zoom: 1
  }
};

const imageFields = {
  place: {
    input: "placeImageInput",
    preview: "placePreview",
    label: "Photo du lieu"
  },
  position: {
    input: "positionImageInput",
    preview: "positionPreview",
    label: "Photo ou il faut etre"
  },
  aim: {
    input: "aimImageInput",
    preview: "aimPreview",
    label: "Photo ou il faut viser"
  },
  result: {
    input: "resultImageInput",
    preview: "resultPreview",
    label: "Photo du resultat"
  }
};

const synonymGroups = [
  ["smoke", "smok", "smokee", "fumee", "fumi", "fumigene"],
  ["molotov", "molo", "incendiaire", "feu"],
  ["flash", "flashbang", "aveuglante", "popflash"],
  ["he", "grenade", "nade", "explosive"],
  ["vise", "viser", "aim", "crosshair"],
  ["position", "spot", "place", "lieu"],
  ["resultat", "effet", "impact", "landing"],
  ["mirage", "mirrage", "miraage"],
  ["inferno", "infernoo"],
  ["dust", "dust2", "dustii", "d2"],
  ["anubis", "anoubis"],
  ["ancient", "ancien"],
  ["vertigo", "vertigoo"],
  ["overpass", "over"],
  ["nuke", "nouke"]
];

document.addEventListener("DOMContentLoaded", init);

async function init() {
  cacheElements();
  bindEvents();

  const authenticatedUser = getAuthenticatedUser();
  if (authenticatedUser) {
    await unlockApp(authenticatedUser, { silent: true });
    return;
  }

  lockApp();
}

async function loadAppData() {
  if (state.isLoaded) {
    render();
    return;
  }

  state.baseLineups = normalizeLineups(await loadBaseLineups());
  const saved = loadLocalLineups();
  state.lineups = saved || state.baseLineups;
  state.hasLocalChanges = Boolean(saved);
  state.selectedId = state.lineups[0]?.id || null;
  state.isLoaded = true;

  render();
}

function cacheElements() {
  [
    "loginScreen",
    "loginForm",
    "loginUser",
    "loginPassword",
    "loginError",
    "appShell",
    "sessionUser",
    "logoutBtn",
    "addLineupBtn",
    "pushGitHubBtn",
    "reloadGitHubBtn",
    "githubSettingsBtn",
    "searchInput",
    "clearSearchBtn",
    "aiStatus",
    "storageStatus",
    "mapFilters",
    "resultCount",
    "lineupList",
    "detailPane",
    "lineupDialog",
    "lineupForm",
    "dialogTitle",
    "closeDialogBtn",
    "cancelBtn",
    "githubDialog",
    "githubForm",
    "closeGitHubDialogBtn",
    "cancelGitHubBtn",
    "githubOwnerInput",
    "githubRepoInput",
    "githubBranchInput",
    "githubPathInput",
    "githubTokenInput",
    "rememberGitHubTokenInput",
    "imageViewerDialog",
    "imageViewerTitle",
    "imageViewerStage",
    "imageViewerImg",
    "zoomOutBtn",
    "zoomResetBtn",
    "zoomInBtn",
    "closeImageViewerBtn",
    "nameInput",
    "mapInput",
    "placeInput",
    "tagsInput",
    "descriptionInput",
    "instructionsInput",
    "resultInput",
    "toast"
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });

  Object.values(imageFields).forEach((field) => {
    els[field.input] = document.getElementById(field.input);
    els[field.preview] = document.getElementById(field.preview);
  });
}

function bindEvents() {
  els.loginForm.addEventListener("submit", handleLogin);
  els.logoutBtn.addEventListener("click", logout);
  els.addLineupBtn.addEventListener("click", () => openLineupDialog());
  els.pushGitHubBtn.addEventListener("click", pushJsonToGitHub);
  els.reloadGitHubBtn.addEventListener("click", reloadFromGitHub);
  els.githubSettingsBtn.addEventListener("click", openGitHubDialog);
  els.searchInput.addEventListener("input", () => {
    state.query = els.searchInput.value;
    render();
  });
  els.clearSearchBtn.addEventListener("click", () => {
    els.searchInput.value = "";
    state.query = "";
    render();
    els.searchInput.focus();
  });

  els.mapFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-map-filter]");
    if (!button) return;
    state.mapFilter = button.dataset.mapFilter;
    render();
  });

  els.lineupList.addEventListener("click", (event) => {
    const card = event.target.closest("[data-lineup-id]");
    if (!card) return;
    state.selectedId = card.dataset.lineupId;
    render();
  });

  els.detailPane.addEventListener("click", (event) => {
    const imageButton = event.target.closest("[data-image-src]");
    if (imageButton) {
      openImageViewer(imageButton.dataset.imageSrc, imageButton.dataset.imageTitle);
      return;
    }

    const action = event.target.closest("[data-action]");
    if (!action) return;
    const lineup = getSelectedLineup();
    if (!lineup) return;

    if (action.dataset.action === "edit") {
      openLineupDialog(lineup);
    }

    if (action.dataset.action === "delete") {
      deleteLineup(lineup.id);
    }
  });

  els.closeDialogBtn.addEventListener("click", closeLineupDialog);
  els.cancelBtn.addEventListener("click", closeLineupDialog);
  els.lineupForm.addEventListener("submit", saveLineupFromForm);
  els.closeGitHubDialogBtn.addEventListener("click", closeGitHubDialog);
  els.cancelGitHubBtn.addEventListener("click", closeGitHubDialog);
  els.githubForm.addEventListener("submit", saveGitHubSettingsFromForm);
  els.closeImageViewerBtn.addEventListener("click", closeImageViewer);
  els.zoomOutBtn.addEventListener("click", () => changeImageZoom(-0.25));
  els.zoomInBtn.addEventListener("click", () => changeImageZoom(0.25));
  els.zoomResetBtn.addEventListener("click", () => setImageZoom(1));
  els.imageViewerDialog.addEventListener("click", (event) => {
    if (event.target === els.imageViewerDialog) {
      closeImageViewer();
    }
  });
  els.imageViewerStage.addEventListener("wheel", handleImageViewerWheel, { passive: false });
  document.addEventListener("keydown", handleGlobalKeydown);

  Object.entries(imageFields).forEach(([key, field]) => {
    const box = els[field.input].closest("[data-image-field]");

    box.addEventListener("click", (event) => {
      if (event.target !== els[field.input]) {
        box.focus();
      }
      setActiveImageField(key);
    });

    box.addEventListener("focusin", () => setActiveImageField(key));
    box.addEventListener("paste", (event) => handleImagePaste(event, key));

    els[field.input].addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      await applyImageFile(key, file);
    });
  });

  document.addEventListener("paste", (event) => {
    if (!els.lineupDialog.open || event.defaultPrevented || isTypingElement(event.target)) {
      return;
    }

    if (state.activeImageField) {
      handleImagePaste(event, state.activeImageField);
    }
  });
}

async function handleLogin(event) {
  event.preventDefault();
  setLoginError("");

  const username = normalizeLogin(els.loginUser.value);
  const password = els.loginPassword.value;
  const account = AUTH_USERS[username];
  const submitButton = els.loginForm.querySelector("button[type='submit']");

  submitButton.disabled = true;

  try {
    const hash = account ? await hashPassword(account.salt, password) : "";
    const isValid = account && timingSafeEqual(hash, account.passwordHash);

    if (!isValid) {
      els.loginPassword.value = "";
      setLoginError("Identifiant ou mot de passe incorrect.");
      els.loginPassword.focus();
      return;
    }

    sessionStorage.setItem(AUTH_SESSION_KEY, username);
    await unlockApp(username);
    showToast("Connecte.");
  } catch (error) {
    console.error(error);
    setLoginError("Connexion impossible sur ce navigateur.");
  } finally {
    submitButton.disabled = false;
  }
}

async function unlockApp(username, options = {}) {
  state.authenticatedUser = username;
  els.sessionUser.textContent = username;
  els.loginScreen.hidden = true;
  els.appShell.hidden = false;
  document.body.classList.add("authenticated");
  await loadAppData();

  if (!options.silent) {
    els.searchInput.focus();
  }
}

function lockApp() {
  state.authenticatedUser = null;
  els.sessionUser.textContent = "";
  els.appShell.hidden = true;
  els.loginScreen.hidden = false;
  document.body.classList.remove("authenticated");
  els.loginForm.reset();
  setLoginError("");
  setTimeout(() => els.loginUser.focus(), 40);
}

function logout() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  if (els.lineupDialog.open) {
    closeLineupDialog();
  }
  lockApp();
}

function getAuthenticatedUser() {
  try {
    const username = sessionStorage.getItem(AUTH_SESSION_KEY);
    return AUTH_USERS[username] ? username : null;
  } catch (error) {
    console.warn("Session indisponible.", error);
    return null;
  }
}

function setLoginError(message) {
  els.loginError.textContent = message;
}

function normalizeLogin(value) {
  return String(value || "").trim().toLowerCase();
}

async function hashPassword(salt, password) {
  if (!window.crypto?.subtle) {
    throw new Error("Web Crypto unavailable");
  }

  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(first, second) {
  if (!first || !second || first.length !== second.length) return false;

  let difference = 0;
  for (let index = 0; index < first.length; index += 1) {
    difference |= first.charCodeAt(index) ^ second.charCodeAt(index);
  }

  return difference === 0;
}

async function loadBaseLineups() {
  try {
    const response = await fetch("./data/lineups.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    return Array.isArray(payload) ? payload : payload.lineups || [];
  } catch (error) {
    console.warn("JSON local indisponible, utilisation du fallback.", error);
    return fallbackLineups;
  }
}

function loadLocalLineups() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return normalizeLineups(Array.isArray(parsed) ? parsed : parsed.lineups || []);
  } catch (error) {
    console.warn("Sauvegarde locale invalide.", error);
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function normalizeLineups(lineups) {
  return lineups.map((lineup, index) => {
    const now = new Date().toISOString();
    return {
      id: lineup.id || createId(lineup.name || `lineup-${index}`),
      name: lineup.name || "Lineup sans nom",
      description: lineup.description || "",
      map: lineup.map || "Sans map",
      place: lineup.place || "",
      instructions: lineup.instructions || "",
      result: lineup.result || "",
      tags: Array.isArray(lineup.tags) ? lineup.tags : splitTags(lineup.tags || ""),
      images: {
        place: lineup.images?.place || "",
        position: lineup.images?.position || "",
        aim: lineup.images?.aim || "",
        result: lineup.images?.result || ""
      },
      createdAt: lineup.createdAt || now,
      updatedAt: lineup.updatedAt || lineup.createdAt || now
    };
  });
}

function render() {
  const results = getVisibleLineups();
  ensureSelectedLineup(results);
  renderFilters();
  renderList(results);
  renderDetail();
  renderStatus(results);
}

function getVisibleLineups() {
  const normalizedQuery = expandQuery(normalizeText(state.query));
  const hasQuery = normalizedQuery.trim().length > 0;

  let results = state.lineups
    .filter((lineup) => state.mapFilter === "Toutes" || lineup.map === state.mapFilter)
    .map((lineup) => ({
      lineup,
      score: hasQuery ? scoreLineup(normalizedQuery, lineup) : 1
    }));

  if (hasQuery) {
    results = results.filter((item) => item.score >= 0.34);
    results.sort((a, b) => b.score - a.score || sortByUpdatedAt(a.lineup, b.lineup));
  } else {
    results.sort((a, b) => sortByUpdatedAt(a.lineup, b.lineup));
  }

  return results;
}

function ensureSelectedLineup(results) {
  if (!state.lineups.length) {
    state.selectedId = null;
    return;
  }

  if (state.selectedId && state.lineups.some((lineup) => lineup.id === state.selectedId)) {
    return;
  }

  state.selectedId = results[0]?.lineup.id || state.lineups[0]?.id || null;
}

function renderFilters() {
  const maps = ["Toutes", ...Array.from(new Set(state.lineups.map((lineup) => lineup.map))).sort((a, b) => a.localeCompare(b, "fr"))];
  els.mapFilters.innerHTML = maps
    .map((map) => {
      const isActive = map === state.mapFilter;
      return `<button class="filter-button ${isActive ? "active" : ""}" type="button" data-map-filter="${escapeAttribute(map)}">${escapeHtml(map)}</button>`;
    })
    .join("");
}

function renderList(results) {
  els.resultCount.textContent = `${results.length}`;

  if (!results.length) {
    els.lineupList.innerHTML = `
      <div class="list-empty">
        <div>
          <h3>Aucun resultat</h3>
          <p>Essaie un autre mot ou ajoute une nouvelle lineup.</p>
        </div>
      </div>
    `;
    return;
  }

  els.lineupList.innerHTML = results
    .map(({ lineup, score }) => {
      const isActive = lineup.id === state.selectedId;
      const scoreLabel = state.query.trim() ? `<span class="score-chip">${Math.round(score * 100)}% match</span>` : "";
      return `
        <button class="lineup-card ${isActive ? "active" : ""}" type="button" data-lineup-id="${escapeAttribute(lineup.id)}">
          <span class="card-meta">
            <span class="chip">${escapeHtml(lineup.map)}</span>
            <span class="score-chip">${escapeHtml(lineup.place || "Sans lieu")}</span>
            ${scoreLabel}
          </span>
          <strong>${escapeHtml(lineup.name)}</strong>
          <p>${escapeHtml(lineup.description || lineup.result || "Aucune description pour le moment.")}</p>
        </button>
      `;
    })
    .join("");
}

function renderDetail() {
  const lineup = getSelectedLineup();

  if (!lineup) {
    els.detailPane.innerHTML = `
      <div class="empty-state">
        <div>
          <h2>Aucune lineup</h2>
          <p>La base est vide. Ajoute ta premiere lineup avec le bouton Ajouter.</p>
        </div>
      </div>
    `;
    return;
  }

  els.detailPane.innerHTML = `
    <div class="detail-header">
      <div class="detail-title">
        <div class="chip-row">
          <span class="chip">${escapeHtml(lineup.map)}</span>
          <span class="score-chip">${escapeHtml(lineup.place || "Sans lieu")}</span>
        </div>
        <h2>${escapeHtml(lineup.name)}</h2>
        <p>${escapeHtml(lineup.description || "Aucune description.")}</p>
      </div>
      <div class="detail-actions">
        <button class="button" type="button" data-action="edit">Modifier</button>
        <button class="button danger" type="button" data-action="delete">Supprimer</button>
      </div>
    </div>

    ${renderTags(lineup.tags)}

    <div class="detail-grid">
      ${renderMedia(lineup.images.place, "Photo du lieu")}
      ${renderMedia(lineup.images.position, "Ou il faut etre")}
      ${renderMedia(lineup.images.aim, "Ou il faut viser")}
      ${renderMedia(lineup.images.result, "Resultat")}
    </div>

    <section class="text-section">
      <h3>Instructions</h3>
      <p>${escapeHtml(lineup.instructions || "Aucune instruction.")}</p>
    </section>

    <section class="text-section">
      <h3>Resultat attendu</h3>
      <p>${escapeHtml(lineup.result || "Aucun resultat indique.")}</p>
    </section>
  `;
}

function renderTags(tags) {
  if (!tags.length) return "";

  return `
    <div class="chip-row" aria-label="Tags">
      ${tags.map((tag) => `<span class="score-chip">${escapeHtml(tag)}</span>`).join("")}
    </div>
  `;
}

function renderMedia(src, label) {
  const image = src
    ? `<button class="media-zoom-button" type="button" data-image-src="${escapeAttribute(src)}" data-image-title="${escapeAttribute(label)}" aria-label="Agrandir ${escapeAttribute(label)}"><img src="${escapeAttribute(src)}" alt="${escapeAttribute(label)}"></button>`
    : `<div class="media-empty">${escapeHtml(label)}<br>non ajoutee</div>`;

  return `
    <figure class="media-block">
      ${image}
      <figcaption>${escapeHtml(label)}</figcaption>
    </figure>
  `;
}

function openImageViewer(src, title) {
  if (!src) return;

  state.imageViewer.src = src;
  state.imageViewer.title = title || "Photo";
  state.imageViewer.zoom = 1;
  els.imageViewerTitle.textContent = state.imageViewer.title;
  els.imageViewerImg.src = src;
  els.imageViewerImg.alt = state.imageViewer.title;
  updateImageViewerZoom();
  els.imageViewerDialog.showModal();
}

function closeImageViewer() {
  if (!els.imageViewerDialog.open) return;

  els.imageViewerDialog.close();
  els.imageViewerImg.removeAttribute("src");
  state.imageViewer.src = "";
}

function changeImageZoom(delta) {
  setImageZoom(state.imageViewer.zoom + delta);
}

function setImageZoom(zoom) {
  state.imageViewer.zoom = Math.min(4, Math.max(0.5, zoom));
  updateImageViewerZoom();
}

function updateImageViewerZoom() {
  els.imageViewerImg.style.transform = `scale(${state.imageViewer.zoom})`;
  els.zoomResetBtn.textContent = `${Math.round(state.imageViewer.zoom * 100)}%`;
}

function handleImageViewerWheel(event) {
  if (!els.imageViewerDialog.open) return;

  event.preventDefault();
  changeImageZoom(event.deltaY > 0 ? -0.15 : 0.15);
}

function handleGlobalKeydown(event) {
  if (!els.imageViewerDialog.open) return;

  if (event.key === "Escape") {
    closeImageViewer();
    return;
  }

  if (event.key === "+" || event.key === "=") {
    changeImageZoom(0.25);
  }

  if (event.key === "-" || event.key === "_") {
    changeImageZoom(-0.25);
  }

  if (event.key === "0") {
    setImageZoom(1);
  }
}

function renderStatus(results) {
  const query = state.query.trim();
  const source = state.hasLocalChanges ? "Version locale modifiee" : "Base en ligne";
  els.storageStatus.textContent = `${source} - ${state.lineups.length} lineups en memoire`;

  if (!query) {
    els.aiStatus.textContent = "";
    return;
  }

  if (!results.length) {
    els.aiStatus.textContent = `Mini IA : aucun match solide pour "${query}".`;
    return;
  }

  const best = results[0];
  els.aiStatus.textContent = `Mini IA : meilleur match "${best.lineup.name}" (${Math.round(best.score * 100)}%).`;
}

function getSelectedLineup() {
  return state.lineups.find((lineup) => lineup.id === state.selectedId) || null;
}

function openLineupDialog(lineup = null) {
  state.editingId = lineup?.id || null;
  state.pendingImages = {};
  els.lineupForm.reset();
  els.dialogTitle.textContent = lineup ? "Modifier la lineup" : "Ajouter une lineup";

  els.nameInput.value = lineup?.name || "";
  els.mapInput.value = lineup?.map || "";
  els.placeInput.value = lineup?.place || "";
  els.tagsInput.value = lineup?.tags?.join(", ") || "";
  els.descriptionInput.value = lineup?.description || "";
  els.instructionsInput.value = lineup?.instructions || "";
  els.resultInput.value = lineup?.result || "";

  Object.keys(imageFields).forEach((key) => {
    renderPreview(key, lineup?.images?.[key] || "");
  });

  setActiveImageField("place");
  els.lineupDialog.showModal();
  setTimeout(() => els.nameInput.focus(), 40);
}

function closeLineupDialog() {
  clearActiveImageField();
  els.lineupDialog.close();
}

function saveLineupFromForm(event) {
  event.preventDefault();

  const existing = state.editingId ? state.lineups.find((lineup) => lineup.id === state.editingId) : null;
  const now = new Date().toISOString();
  const name = els.nameInput.value.trim();
  const map = els.mapInput.value.trim();
  const place = els.placeInput.value.trim();

  if (!name || !map || !place) {
    showToast("Nom, map et lieu sont obligatoires.");
    return;
  }

  const lineup = {
    id: existing?.id || createId(`${map}-${name}`),
    name,
    map,
    place,
    description: els.descriptionInput.value.trim(),
    instructions: els.instructionsInput.value.trim(),
    result: els.resultInput.value.trim(),
    tags: splitTags(els.tagsInput.value),
    images: {
      place: state.pendingImages.place ?? existing?.images?.place ?? "",
      position: state.pendingImages.position ?? existing?.images?.position ?? "",
      aim: state.pendingImages.aim ?? existing?.images?.aim ?? "",
      result: state.pendingImages.result ?? existing?.images?.result ?? ""
    },
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };

  if (existing) {
    state.lineups = state.lineups.map((item) => (item.id === existing.id ? lineup : item));
  } else {
    state.lineups = [lineup, ...state.lineups];
  }

  state.selectedId = lineup.id;
  saveLocalLineups();
  closeLineupDialog();
  render();
  showToast(existing ? "Lineup modifiee." : "Lineup ajoutee.");
}

function deleteLineup(id) {
  const lineup = state.lineups.find((item) => item.id === id);
  if (!lineup) return;

  const confirmed = window.confirm(`Supprimer "${lineup.name}" de ta version locale ?`);
  if (!confirmed) return;

  state.lineups = state.lineups.filter((item) => item.id !== id);
  state.selectedId = state.lineups[0]?.id || null;
  saveLocalLineups();
  render();
  showToast("Lineup supprimee de la version locale.");
}

function saveLocalLineups() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lineups: state.lineups }));
    state.hasLocalChanges = true;
  } catch (error) {
    console.error(error);
    showToast("Sauvegarde locale impossible. Reduis la taille des images ou sauvegarde sur GitHub.");
  }
}

function buildJsonPayload(lineups = state.lineups) {
  return {
    schema: "cs2-lineups-v1",
    exportedAt: new Date().toISOString(),
    lineups
  };
}

function applyLineupsFromRemote(lineups) {
  state.lineups = normalizeLineups(lineups);
  state.baseLineups = state.lineups;
  state.selectedId = state.lineups[0]?.id || null;
  state.hasLocalChanges = false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ lineups: state.lineups }));
  render();
}

function openGitHubDialog() {
  const settings = loadGitHubSettings();
  els.githubOwnerInput.value = settings.owner;
  els.githubRepoInput.value = settings.repo;
  els.githubBranchInput.value = settings.branch;
  els.githubPathInput.value = settings.path;
  els.rememberGitHubTokenInput.checked = settings.rememberToken;
  els.githubTokenInput.value = "";
  els.githubTokenInput.placeholder = getGitHubToken() ? "Token deja enregistre" : "Token GitHub";
  els.githubDialog.showModal();
  setTimeout(() => els.githubOwnerInput.focus(), 40);
}

function closeGitHubDialog() {
  els.githubDialog.close();
}

function saveGitHubSettingsFromForm(event) {
  event.preventDefault();
  const repoInfo = parseGitHubRepoInputs(els.githubOwnerInput.value, els.githubRepoInput.value);

  const settings = {
    owner: repoInfo.owner,
    repo: repoInfo.repo,
    branch: els.githubBranchInput.value.trim() || "main",
    path: normalizeGitHubPath(els.githubPathInput.value),
    rememberToken: els.rememberGitHubTokenInput.checked
  };
  const token = els.githubTokenInput.value.trim();

  if (!settings.owner || !settings.repo || !settings.path) {
    showToast("Owner, repo et chemin de base sont obligatoires.");
    return;
  }

  localStorage.setItem(GITHUB_SETTINGS_KEY, JSON.stringify(settings));
  saveGitHubToken(token, settings.rememberToken);
  closeGitHubDialog();
  showToast("Config GitHub enregistree.");
}

async function pushJsonToGitHub() {
  const settings = loadGitHubSettings();
  const token = getGitHubToken();

  if (!settings.owner || !settings.repo || !settings.path || !settings.branch || !token) {
    openGitHubDialog();
    showToast("Configure GitHub et ajoute un token avant de push.");
    return;
  }

  const originalLabel = els.pushGitHubBtn.textContent;
  els.pushGitHubBtn.disabled = true;
  els.pushGitHubBtn.textContent = "Push...";
  els.storageStatus.textContent = "Push GitHub en cours...";

  try {
    let remote = await getGitHubFileInfo(settings, token);
    let mergedLineups = mergeLineups(remote.lineups, state.lineups);
    let response = await commitLineupsToGitHub(settings, token, remote.sha, mergedLineups);

    if (!response.ok) {
      const firstError = await readGitHubError(response);

      if (!isGitHubShaConflict(firstError, response.status)) {
        throw new Error(firstError);
      }

      remote = await getGitHubFileInfo(settings, token);
      mergedLineups = mergeLineups(remote.lineups, mergedLineups);
      response = await commitLineupsToGitHub(settings, token, remote.sha, mergedLineups);

      if (!response.ok) {
        throw new Error(await readGitHubError(response));
      }
    }

    applyLineupsFromRemote(mergedLineups);
    showToast("Sauvegarde envoyee sur GitHub.");
    els.storageStatus.textContent = "Sauvegarde envoyee sur GitHub - deploiement Pages en cours";
  } catch (error) {
    console.error(error);
    showToast(error.message || "Push GitHub impossible.");
    renderStatus(getVisibleLineups());
  } finally {
    els.pushGitHubBtn.disabled = false;
    els.pushGitHubBtn.textContent = originalLabel;
  }
}

async function reloadFromGitHub() {
  const settings = loadGitHubSettings();
  const token = getGitHubToken();

  if (!settings.owner || !settings.repo || !settings.path || !settings.branch) {
    openGitHubDialog();
    showToast("Configure GitHub avant de recharger.");
    return;
  }

  const originalLabel = els.reloadGitHubBtn.textContent;
  els.reloadGitHubBtn.disabled = true;
  els.reloadGitHubBtn.textContent = "Reload...";
  els.storageStatus.textContent = "Recuperation GitHub en cours...";

  try {
    const remote = await getGitHubFileInfo(settings, token);
    const mergedLineups = mergeLineups(remote.lineups, state.lineups);
    applyLineupsFromRemote(mergedLineups);
    showToast("Derniere base GitHub recuperee.");
  } catch (error) {
    console.error(error);
    showToast(error.message || "Reload GitHub impossible.");
    renderStatus(getVisibleLineups());
  } finally {
    els.reloadGitHubBtn.disabled = false;
    els.reloadGitHubBtn.textContent = originalLabel;
  }
}

async function commitLineupsToGitHub(settings, token, sha, lineups) {
  const payload = buildJsonPayload(lineups);
  const body = {
    message: `Update CS2 lineups - ${new Date().toLocaleString("fr-FR")}`,
    content: encodeBase64Utf8(JSON.stringify(payload, null, 2)),
    branch: settings.branch
  };

  if (sha) {
    body.sha = sha;
  }

  return fetchGitHub(githubContentUrl(settings), {
    method: "PUT",
    headers: githubHeaders(token, { json: true, version: true }),
    body: JSON.stringify(body)
  }, "l'envoi de la sauvegarde");
}

async function getGitHubFileSha(settings, token) {
  const info = await getGitHubFileInfo(settings, token);
  return info.sha;
}

async function getGitHubFileInfo(settings, token) {
  const response = await fetchGitHub(`${githubContentUrl(settings)}?ref=${encodeURIComponent(settings.branch)}`, {
    headers: githubHeaders(token)
  }, "la recuperation de la base");

  if (response.status === 404) {
    return {
      sha: null,
      lineups: [],
      payload: { lineups: [] }
    };
  }

  if (!response.ok) {
    throw new Error(await readGitHubError(response));
  }

  const payload = await response.json();
  const filePayload = await readGitHubFilePayload(payload, token);
  const lineups = Array.isArray(filePayload) ? filePayload : filePayload.lineups;

  if (!Array.isArray(lineups)) {
    throw new Error("GitHub: format de base invalide.");
  }

  return {
    sha: payload.sha || null,
    lineups,
    payload: filePayload
  };
}

async function readGitHubFilePayload(payload, token) {
  if (payload.content) {
    return JSON.parse(decodeBase64Utf8(payload.content));
  }

  if (payload.download_url) {
    const response = await fetchGitHub(payload.download_url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }, "la lecture de la base");

    if (!response.ok) {
      throw new Error(`GitHub: lecture de la base impossible (${response.status}).`);
    }

    return response.json();
  }

  throw new Error("GitHub: contenu de base introuvable.");
}

function mergeLineups(remoteLineups, localLineups) {
  const merged = new Map();

  normalizeLineups(remoteLineups).forEach((lineup) => {
    merged.set(lineup.id, lineup);
  });

  normalizeLineups(localLineups).forEach((lineup) => {
    const current = merged.get(lineup.id);
    if (!current || getLineupTime(lineup) >= getLineupTime(current)) {
      merged.set(lineup.id, lineup);
    }
  });

  return Array.from(merged.values()).sort((a, b) => sortByUpdatedAt(a, b));
}

function getLineupTime(lineup) {
  return new Date(lineup.updatedAt || lineup.createdAt || 0).getTime() || 0;
}

function isGitHubShaConflict(message, status) {
  return status === 409 || /does not match|sha/i.test(message);
}

function loadGitHubSettings() {
  try {
    const raw = localStorage.getItem(GITHUB_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_GITHUB_SETTINGS };
    return { ...DEFAULT_GITHUB_SETTINGS, ...JSON.parse(raw) };
  } catch (error) {
    console.warn("Config GitHub invalide.", error);
    localStorage.removeItem(GITHUB_SETTINGS_KEY);
    return { ...DEFAULT_GITHUB_SETTINGS };
  }
}

function saveGitHubToken(token, rememberToken) {
  if (!token) {
    if (!rememberToken) {
      localStorage.removeItem(GITHUB_TOKEN_LOCAL_KEY);
    }
    return;
  }

  if (rememberToken) {
    localStorage.setItem(GITHUB_TOKEN_LOCAL_KEY, token);
    sessionStorage.removeItem(GITHUB_TOKEN_SESSION_KEY);
    return;
  }

  sessionStorage.setItem(GITHUB_TOKEN_SESSION_KEY, token);
  localStorage.removeItem(GITHUB_TOKEN_LOCAL_KEY);
}

function getGitHubToken() {
  return sessionStorage.getItem(GITHUB_TOKEN_SESSION_KEY) || localStorage.getItem(GITHUB_TOKEN_LOCAL_KEY) || "";
}

function githubContentUrl(settings) {
  return `https://api.github.com/repos/${encodeURIComponent(settings.owner)}/${encodeURIComponent(settings.repo)}/contents/${encodeGitHubPath(settings.path)}`;
}

function githubHeaders(token, options = {}) {
  const headers = {
    Accept: "application/vnd.github+json"
  };

  if (options.json) {
    headers["Content-Type"] = "application/json";
  }

  if (options.version) {
    headers["X-GitHub-Api-Version"] = GITHUB_API_VERSION;
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function fetchGitHub(url, options, actionLabel) {
  try {
    return await fetch(url, options);
  } catch (error) {
    throw new Error(buildGitHubNetworkMessage(actionLabel));
  }
}

function buildGitHubNetworkMessage(actionLabel) {
  const hints = [`GitHub inaccessible pendant ${actionLabel}.`];

  if (location.protocol === "file:") {
    hints.push("Ouvre le site via GitHub Pages, pas en double-cliquant index.html.");
  }

  if (navigator.onLine === false) {
    hints.push("Ton navigateur semble hors ligne.");
  }

  hints.push("Verifie internet, le token, le repo, ou un bloqueur/VPN qui peut bloquer api.github.com.");
  return hints.join(" ");
}

async function readGitHubError(response) {
  try {
    const payload = await response.json();
    return payload.message ? `GitHub: ${payload.message}` : `GitHub HTTP ${response.status}`;
  } catch (error) {
    return `GitHub HTTP ${response.status}`;
  }
}

function parseGitHubRepoInputs(ownerValue, repoValue) {
  const owner = String(ownerValue || "").trim();
  const repo = String(repoValue || "").trim();
  const combined = repo ? `${owner}/${repo}` : owner;
  const fullUrlMatch = combined.match(/github\.com[/:]([^/\s]+)\/([^/\s#?]+?)(?:\.git)?(?:[/?#].*)?$/i);

  if (fullUrlMatch) {
    return {
      owner: fullUrlMatch[1],
      repo: fullUrlMatch[2].replace(/\.git$/i, "")
    };
  }

  const shorthandMatch = combined.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (shorthandMatch) {
    return {
      owner: shorthandMatch[1],
      repo: shorthandMatch[2].replace(/\.git$/i, "")
    };
  }

  return {
    owner,
    repo: repo.replace(/\.git$/i, "")
  };
}

function normalizeGitHubPath(path) {
  return String(path || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\\/g, "/");
}

function encodeGitHubPath(path) {
  return normalizeGitHubPath(path)
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
}

function encodeBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  }

  return btoa(binary);
}

function decodeBase64Utf8(value) {
  const cleanValue = String(value || "").replace(/\s/g, "");
  const binary = atob(cleanValue);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function handleImagePaste(event, key) {
  const file = getPastedImageFile(event.clipboardData);
  if (!file) {
    showToast("Colle une vraie image dans cet encadre.");
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  await applyImageFile(key, file);
}

async function applyImageFile(key, file) {
  try {
    const dataUrl = await fileToImageDataUrl(file);
    state.pendingImages[key] = dataUrl;
    renderPreview(key, dataUrl);
    setActiveImageField(key);
    showToast("Image ajoutee.");
  } catch (error) {
    console.error(error);
    showToast("Impossible de lire cette image.");
  }
}

function getPastedImageFile(clipboardData) {
  const items = Array.from(clipboardData?.items || []);
  const imageItem = items.find((item) => item.kind === "file" && item.type.startsWith("image/"));
  return imageItem?.getAsFile() || null;
}

function setActiveImageField(key) {
  state.activeImageField = key;

  document.querySelectorAll("[data-image-field]").forEach((box) => {
    box.classList.toggle("is-active", box.dataset.imageField === key);
  });
}

function clearActiveImageField() {
  state.activeImageField = null;
  document.querySelectorAll("[data-image-field]").forEach((box) => {
    box.classList.remove("is-active");
  });
}

function isTypingElement(target) {
  return Boolean(target?.closest?.("input, textarea, [contenteditable='true']"));
}

function renderPreview(key, src) {
  const preview = els[imageFields[key].preview];
  if (!preview) return;
  preview.innerHTML = src ? `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(imageFields[key].label)}">` : "Aucune image";
}

function fileToImageDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Le fichier n'est pas une image."));
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const maxSize = 1200;
      const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * ratio));
      const height = Math.max(1, Math.round(image.height * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible."));
    };

    image.src = url;
  });
}

function scoreLineup(query, lineup) {
  const searchable = buildSearchText(lineup);
  const queryTokens = tokenize(query);
  const words = Array.from(new Set(tokenize(searchable)));

  if (!queryTokens.length || !words.length) return 0;

  const tokenScore = queryTokens.reduce((total, token) => {
    if (searchable.includes(token)) return total + 1;

    const bestWordScore = words.reduce((best, word) => {
      const distanceScore = levenshteinSimilarity(token, word);
      const diceScore = diceSimilarity(token, word);
      const prefixScore = word.startsWith(token.slice(0, Math.min(4, token.length))) ? 0.72 : 0;
      return Math.max(best, distanceScore, diceScore, prefixScore);
    }, 0);

    return total + bestWordScore;
  }, 0) / queryTokens.length;

  const importantFields = normalizeText(`${lineup.name} ${lineup.map} ${lineup.place} ${lineup.tags.join(" ")}`);
  const phraseScore = Math.max(diceSimilarity(query, searchable), diceSimilarity(query, importantFields));

  return Math.min(1, tokenScore * 0.78 + phraseScore * 0.22);
}

function buildSearchText(lineup) {
  const text = [
    lineup.name,
    lineup.description,
    lineup.map,
    lineup.place,
    lineup.instructions,
    lineup.result,
    lineup.tags.join(" ")
  ].join(" ");
  return expandQuery(normalizeText(text));
}

function expandQuery(text) {
  const tokens = new Set(tokenize(text));

  synonymGroups.forEach((group) => {
    const normalizedGroup = group.map(normalizeText);
    if (normalizedGroup.some((word) => tokens.has(word))) {
      normalizedGroup.forEach((word) => tokens.add(word));
    }
  });

  return [...tokens].join(" ");
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(/\s+/)
    .filter(Boolean);
}

function levenshteinSimilarity(a, b) {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;

  const matrix = Array.from({ length: a.length + 1 }, (_, index) => [index]);
  for (let j = 1; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[a.length][b.length];
  return 1 - distance / Math.max(a.length, b.length);
}

function diceSimilarity(a, b) {
  const first = normalizeText(a);
  const second = normalizeText(b);
  if (first === second) return 1;
  if (first.length < 2 || second.length < 2) return first === second ? 1 : 0;

  const firstPairs = bigrams(first);
  const secondPairs = bigrams(second);
  const counts = new Map();
  firstPairs.forEach((pair) => counts.set(pair, (counts.get(pair) || 0) + 1));

  let intersection = 0;
  secondPairs.forEach((pair) => {
    const count = counts.get(pair) || 0;
    if (count > 0) {
      counts.set(pair, count - 1);
      intersection += 1;
    }
  });

  return (2 * intersection) / (firstPairs.length + secondPairs.length);
}

function bigrams(value) {
  const compact = value.replace(/\s+/g, " ");
  const pairs = [];
  for (let i = 0; i < compact.length - 1; i += 1) {
    pairs.push(compact.slice(i, i + 2));
  }
  return pairs;
}

function splitTags(value) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function sortByUpdatedAt(a, b) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function createId(value) {
  const slug = normalizeText(value).replace(/\s+/g, "-").slice(0, 70) || "lineup";
  return `${slug}-${Math.random().toString(36).slice(2, 8)}`;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("visible");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => {
    els.toast.classList.remove("visible");
  }, 2400);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
