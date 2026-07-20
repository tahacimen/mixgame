const defaultGames = [
  { title: "Neon Drift", category: "Yarış", hue: "#ff4d7d", bg: "linear-gradient(135deg,#24164f,#bf1748)", url: "https://example.com/neon-drift" },
  { title: "Skybound", category: "Macera", hue: "#62d8ff", bg: "linear-gradient(135deg,#163856,#3157bc)", url: "https://example.com/skybound" },
  { title: "Rune Logic", category: "Bulmaca", hue: "#f9cc64", bg: "linear-gradient(135deg,#3d214a,#9f4c58)", url: "https://example.com/rune-logic" },
  { title: "Pixel Arena", category: "Aksiyon", hue: "#a3f27f", bg: "linear-gradient(135deg,#113b35,#26735d)", url: "https://example.com/pixel-arena" },
  { title: "Orbit Zero", category: "Zeka", hue: "#b39aff", bg: "linear-gradient(135deg,#161845,#463593)", url: "https://example.com/orbit-zero" },
  { title: "Wild Circuit", category: "Yarış", hue: "#f57f58", bg: "linear-gradient(135deg,#4b1e23,#a54632)", url: "https://example.com/wild-circuit" },
  { title: "Moss & Myth", category: "Macera", hue: "#99df84", bg: "linear-gradient(135deg,#17352e,#3f7451)", url: "https://example.com/moss-myth" },
  { title: "Gridlock", category: "Bulmaca", hue: "#f2afca", bg: "linear-gradient(135deg,#3d1e3d,#7c366d)", url: "https://example.com/gridlock" },
  { title: "Laser Leap", category: "Aksiyon", hue: "#ff66de", bg: "linear-gradient(135deg,#351344,#8e2476)", url: "https://example.com/laser-leap" },
  { title: "Codebreak", category: "Zeka", hue: "#62e8e0", bg: "linear-gradient(135deg,#123c4d,#247a85)", url: "https://example.com/codebreak" },
  { title: "Turbo Bloom", category: "Yarış", hue: "#f6ea5f", bg: "linear-gradient(135deg,#524015,#b28d26)", url: "https://example.com/turbo-bloom" },
  { title: "Moonlit Vale", category: "Macera", hue: "#d5b4ff", bg: "linear-gradient(135deg,#322049,#6c4b8b)", url: "https://example.com/moonlit-vale" },
  { title: "Tactix", category: "Zeka", hue: "#92b8ff", bg: "linear-gradient(135deg,#15294c,#3858a8)", url: "https://example.com/tactix" },
  { title: "Prism Path", category: "Bulmaca", hue: "#a5f1cf", bg: "linear-gradient(135deg,#17423d,#2f886e)", url: "https://example.com/prism-path" },
  { title: "Nova Strike", category: "Aksiyon", hue: "#ff9479", bg: "linear-gradient(135deg,#4a1e2c,#a23b41)", url: "https://example.com/nova-strike" },
];
let games = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem("mixgame-games"));
    return Array.isArray(saved) ? saved : defaultGames;
  } catch { return defaultGames; }
})();
const appConfig = window.MIXGAME_CONFIG || {};
const backendEnabled = Boolean(appConfig.supabaseUrl && appConfig.supabaseAnonKey);
const backendMode = document.querySelector("#backend-mode");
backendMode.textContent = backendEnabled ? "Ortak bulut aktif" : "Yerel demo modu";
backendMode.classList.toggle("is-cloud", backendEnabled);
let supabaseClient = null;
let remoteGamesChannel = null;
const toast = document.querySelector("#toast");
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 3200);
}

async function getSupabaseClient() {
  if (!backendEnabled) return null;
  if (supabaseClient) return supabaseClient;
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
  supabaseClient = createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey);
  return supabaseClient;
}

function mapRemoteGame(game) {
  return {
    id: game.id,
    title: game.title,
    category: game.category,
    url: game.url,
    image: game.image_url || "",
    description: game.description || "",
    hue: game.hue || "#9b8cff",
    bg: game.background || "linear-gradient(135deg,#201b54,#09090b)",
  };
}

async function loadRemoteGames() {
  const client = await getSupabaseClient();
  const { data, error } = await client.from("games").select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  games = (data || []).map(mapRemoteGame);
  renderCategories();
  renderGrid();
  renderFeatured();
  showFeatured(0);
}

async function enableRemoteUpdates() {
  const client = await getSupabaseClient();
  if (remoteGamesChannel) await client.removeChannel(remoteGamesChannel);
  remoteGamesChannel = client
    .channel("mixgame-games")
    .on("postgres_changes", { event: "*", schema: "public", table: "games" }, () => loadRemoteGames().catch(() => {}))
    .subscribe();
}

// Temporary front-end demo only. Move identity checks to a secure service before production.
const demoUsers = {
  oyuncu1: { password: "mixgame2026", displayName: "Oyuncu 1", role: "admin", roleLabel: "Yönetici" },
  oyuncu2: { password: "mixgame2026", displayName: "Oyuncu 2", role: "player", roleLabel: "Oyuncu" },
  oyuncu3: { password: "mixgame2026", displayName: "Oyuncu 3", role: "editor", roleLabel: "İçerik Editörü" },
};
const loginForm = document.querySelector("#login-form");
const loginError = document.querySelector("#login-error");
const loginSubmit = document.querySelector("#login-submit");
const headerUser = document.querySelector("#header-user");
const currentUser = document.querySelector("#current-user");
const currentRole = document.querySelector("#current-role");
const adminButton = document.querySelector("#admin-button");
let activeUsername = "";
let activeUser = null;

function canEdit(user) {
  return user?.role === "admin" || user?.role === "editor";
}

function setAuthenticatedUser(username, userOverride = null) {
  const user = userOverride || demoUsers[username];
  if (!user) return;
  activeUsername = username;
  activeUser = user;
  document.body.classList.add("is-authenticated");
  headerUser.hidden = false;
  currentUser.textContent = user.displayName;
  currentRole.textContent = user.roleLabel;
  adminButton.hidden = !canEdit(user);
  renderGrid();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = loginForm.elements.username.value.trim().toLowerCase();
  const password = loginForm.elements.password.value;
  loginError.textContent = "";
  loginSubmit.disabled = true;
  loginSubmit.textContent = "Kontrol ediliyor…";
  try {
    if (backendEnabled) {
      const client = await getSupabaseClient();
      const email = username.includes("@") ? username : `${username}@mixgame.local`;
      const { data: authData, error: authError } = await client.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      const { data: profile, error: profileError } = await client.from("profiles").select("username, display_name, role").eq("id", authData.user.id).single();
      if (profileError) throw profileError;
      const roleLabels = { admin: "Yönetici", editor: "İçerik Editörü", player: "Oyuncu" };
      await loadRemoteGames();
      await enableRemoteUpdates();
      setAuthenticatedUser(profile.username, {
        displayName: profile.display_name,
        role: profile.role,
        roleLabel: roleLabels[profile.role] || "Oyuncu",
        id: authData.user.id,
      });
    } else if (demoUsers[username]?.password === password) {
      setAuthenticatedUser(username);
    } else {
      throw new Error("Kullanıcı adı veya şifre doğru değil. Test hesaplarını kontrol et.");
    }
    loginForm.reset();
  } catch (error) {
    loginError.textContent = error.message || "Giriş yapılamadı. Bilgilerini kontrol edip tekrar dene.";
    loginForm.elements.username.focus();
  } finally {
    loginSubmit.disabled = false;
    loginSubmit.innerHTML = 'Giriş yap <span aria-hidden="true">→</span>';
  }
});

document.querySelector("#password-toggle").addEventListener("click", (event) => {
  const passwordInput = loginForm.elements.password;
  const shown = passwordInput.type === "text";
  passwordInput.type = shown ? "password" : "text";
  event.currentTarget.textContent = shown ? "Göster" : "Gizle";
  event.currentTarget.setAttribute("aria-pressed", String(!shown));
});

document.querySelector("#logout-button").addEventListener("click", async () => {
  if (backendEnabled && supabaseClient) {
    await supabaseClient.auth.signOut();
    if (remoteGamesChannel) {
      await supabaseClient.removeChannel(remoteGamesChannel);
      remoteGamesChannel = null;
    }
  }
  activeUsername = "";
  activeUser = null;
  document.body.classList.remove("is-authenticated");
  headerUser.hidden = true;
  adminButton.hidden = true;
  currentRole.textContent = "";
  resetDiscovery();
  loginForm.elements.username.focus();
});

const grid = document.querySelector("#games-grid");
const cardTemplate = document.querySelector("#game-card-template");
const categoryBar = document.querySelector("#category-bar");
const gameCount = document.querySelector("#game-count");
const searchInput = document.querySelector("#game-search");
const viewButtons = [...document.querySelectorAll("[data-view]")];
let activeCategory = "Tümü";
let activeView = "all";
let searchQuery = "";

function getUserList(type) {
  if (!activeUsername) return [];
  try {
    const saved = JSON.parse(localStorage.getItem(`mixgame-${type}-${activeUsername}`));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveUserList(type, items) {
  if (!activeUsername) return;
  try {
    localStorage.setItem(`mixgame-${type}-${activeUsername}`, JSON.stringify(items));
  } catch {
    // The portal remains usable if personal shortcuts cannot be stored.
  }
}

function markRecentlyOpened(game) {
  const recent = getUserList("recent").filter((url) => url !== game.url);
  saveUserList("recent", [game.url, ...recent].slice(0, 12));
  if (activeView === "recent") renderGrid();
}

function toggleFavorite(game) {
  const favorites = getUserList("favorites");
  const next = favorites.includes(game.url)
    ? favorites.filter((url) => url !== game.url)
    : [game.url, ...favorites];
  saveUserList("favorites", next);
  renderGrid();
}

function resetDiscovery() {
  activeCategory = "Tümü";
  activeView = "all";
  searchQuery = "";
  searchInput.value = "";
  viewButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.view === "all")));
  renderCategories();
  renderGrid();
}

function getGameImage(game) {
  if (/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(game.image || "")) {
    return { source: game.image, automatic: false };
  }
  try {
    const savedImage = new URL(game.image || "");
    if (["http:", "https:"].includes(savedImage.protocol)) {
      return { source: savedImage.href, automatic: false };
    }
  } catch {
    // Continue with an automatically discovered site logo.
  }
  try {
    const gameUrl = new URL(game.url);
    if (!["http:", "https:"].includes(gameUrl.protocol)) return null;
    if (gameUrl.hostname === "example.com") return null;
    return {
      source: `https://www.google.com/s2/favicons?sz=256&domain_url=${encodeURIComponent(gameUrl.origin)}`,
      automatic: true,
    };
  } catch {
    return null;
  }
}

function setArt(el, game) {
  el.style.setProperty("--card-bg", game.bg);
  el.style.setProperty("--card-glow", game.hue);
  el.style.setProperty("--orb", game.hue);
  el.style.backgroundImage = "";
  el.style.backgroundSize = "";
  el.style.backgroundPosition = "";
  el.style.backgroundRepeat = "";
  el.classList.remove("has-image", "has-auto-logo");

  const image = getGameImage(game);
  if (!image) return;
  const safeUrl = image.source.replaceAll('"', "%22");
  el.classList.add("has-image");
  el.classList.toggle("has-auto-logo", image.automatic);
  el.style.backgroundImage = `linear-gradient(135deg, rgba(15,15,35,.12), rgba(15,15,35,.42)), url("${safeUrl}")`;
  el.style.backgroundSize = image.automatic ? "cover, 52%" : "cover";
  el.style.backgroundPosition = "center";
  el.style.backgroundRepeat = "no-repeat";
}

function renderGrid() {
  const favorites = getUserList("favorites");
  const recent = getUserList("recent");
  let selected = [...games];
  if (activeView === "favorites") {
    selected = selected.filter(({ url }) => favorites.includes(url));
  } else if (activeView === "recent") {
    selected = recent.map((url) => games.find((game) => game.url === url)).filter(Boolean);
  }
  if (activeCategory !== "Tümü") {
    selected = selected.filter(({ category }) => category === activeCategory);
  }
  if (searchQuery) {
    selected = selected.filter(({ title, category }) => `${title} ${category}`.toLocaleLowerCase("tr").includes(searchQuery));
  }
  grid.replaceChildren();
  if (!selected.length) {
    const empty = document.createElement("div");
    empty.className = "empty-games";
    const message = document.createElement("p");
    if (searchQuery) message.textContent = `"${searchInput.value.trim()}" için eşleşen oyun bulunamadı.`;
    else if (activeView === "favorites") message.textContent = "Henüz favori oyunun yok. Kartlardaki yıldızla hızlı listeni oluştur.";
    else if (activeView === "recent") message.textContent = "Henüz oyun açmadın. Oynadığın oyunlar burada görünecek.";
    else message.textContent = "Bu kategoride henüz oyun yok.";
    empty.append(message);
    if (searchQuery || activeView !== "all" || activeCategory !== "Tümü") {
      const reset = document.createElement("button");
      reset.className = "secondary-button empty-reset";
      reset.type = "button";
      reset.textContent = "Filtreleri temizle";
      reset.addEventListener("click", resetDiscovery);
      empty.append(reset);
    }
    grid.append(empty);
    gameCount.textContent = "0";
    return;
  }
  const fragment = document.createDocumentFragment();
  selected.forEach((game, index) => {
    const card = cardTemplate.content.cloneNode(true);
    const wrapper = card.querySelector(".game-card-wrap");
    const link = card.querySelector(".game-card");
    const art = card.querySelector(".game-art");
    const favoriteButton = card.querySelector(".favorite-button");
    const isFavorite = favorites.includes(game.url);
    link.href = game.url;
    link.setAttribute("aria-label", `${game.title} oyununa git (yeni sekmede açılır)`);
    link.addEventListener("click", () => markRecentlyOpened(game));
    wrapper.style.animationDelay = `${index * 35}ms`;
    favoriteButton.setAttribute("aria-label", isFavorite ? `${game.title} oyununu favorilerden çıkar` : `${game.title} oyununu favorilere ekle`);
    favoriteButton.setAttribute("aria-pressed", String(isFavorite));
    favoriteButton.addEventListener("click", () => toggleFavorite(game));
    card.querySelector(".game-category").textContent = game.category;
    card.querySelector(".game-title").textContent = game.title;
    setArt(art, game);
    fragment.append(card);
  });
  grid.append(fragment);
  gameCount.textContent = selected.length;
}

searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value.trim().toLocaleLowerCase("tr");
  renderGrid();
});

document.addEventListener("keydown", (event) => {
  if (!document.body.classList.contains("is-authenticated")) return;
  const target = event.target;
  const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
  if ((event.key.toLocaleLowerCase("tr") === "k" && (event.ctrlKey || event.metaKey)) || (event.key === "/" && !isTyping)) {
    event.preventDefault();
    searchInput.focus();
    searchInput.select();
    document.querySelector("#games").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  if (event.key === "Escape" && document.activeElement === searchInput) {
    searchInput.value = "";
    searchQuery = "";
    renderGrid();
    searchInput.blur();
  }
  if (event.key.toLocaleLowerCase("tr") === "f" && !isTyping && adminModal.hidden) {
    event.preventDefault();
    activeView = "favorites";
    viewButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.view === "favorites")));
    renderGrid();
    document.querySelector("#games").scrollIntoView({ behavior: "smooth", block: "start" });
    showToast("Favorilerin açıldı.");
  }
  if (event.key.toLocaleLowerCase("tr") === "n" && !isTyping && canEdit(activeUser)) {
    event.preventDefault();
    openAdminPanel();
    const row = createAdminRow();
    adminRows.prepend(row);
    row.querySelector("input").focus();
  }
  if (event.altKey && /^[1-9]$/.test(event.key) && !isTyping) {
    const game = games[Number(event.key) - 1];
    if (game) {
      event.preventDefault();
      markRecentlyOpened(game);
      window.open(game.url, "_blank", "noopener,noreferrer");
      showToast(`${game.title} açılıyor.`);
    }
  }
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeView = button.dataset.view;
    viewButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    renderGrid();
  });
});

function renderCategories() {
  const categories = ["Tümü", ...new Set(games.map(({ category }) => category))];
  if (!categories.includes(activeCategory)) activeCategory = "Tümü";
  categoryBar.replaceChildren();
  categories.forEach((category) => {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.type = "button";
    chip.role = "tab";
    chip.textContent = category;
    chip.setAttribute("aria-selected", String(category === activeCategory));
    chip.addEventListener("click", () => {
      activeCategory = category;
      [...categoryBar.children].forEach((item) => item.setAttribute("aria-selected", String(item.textContent === category)));
      renderGrid();
    });
    categoryBar.append(chip);
  });
}

let featuredGames = [];
const track = document.querySelector("#carousel-track");
const dots = document.querySelector("#carousel-dots");
const featuredCount = document.querySelector("#featured-count");
let featuredIndex = 0;
let autoPlay;

function renderFeatured() {
  featuredGames = games.slice(0, 4);
  track.replaceChildren();
  dots.replaceChildren();
  featuredGames.forEach((game, index) => {
    const card = document.createElement("a");
    card.className = "feature-card";
    card.href = game.url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.setAttribute("aria-label", `${game.title} oyununa git (yeni sekmede açılır)`);
    card.addEventListener("click", () => markRecentlyOpened(game));
    card.innerHTML = `<div class="game-art"><span class="art-orb"></span><span class="art-shape"></span><b></b></div><span class="tag">${game.category}</span><h3>${game.title}</h3>`;
    setArt(card.querySelector(".game-art"), game);
    track.append(card);
    const dot = document.createElement("button");
    dot.className = "dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `${index + 1}. öne çıkan oyunu göster`);
    dot.addEventListener("click", () => showFeatured(index));
    dots.append(dot);
  });
}

function showFeatured(index) {
  if (!featuredGames.length) {
    track.style.transform = "translateX(0)";
    featuredCount.textContent = "00";
    return;
  }
  featuredIndex = (index + featuredGames.length) % featuredGames.length;
  const card = track.firstElementChild;
  const gap = parseFloat(getComputedStyle(track).gap) || 14;
  const distance = (card?.getBoundingClientRect().width || 0) + gap;
  track.style.transform = `translateX(${-featuredIndex * distance}px)`;
  [...dots.children].forEach((dot, i) => dot.classList.toggle("active", i === featuredIndex));
  featuredCount.textContent = String(featuredIndex + 1).padStart(2, "0");
  updateHeroBackdrop(featuredGames[featuredIndex]);
}

const heroBackdrop = document.querySelector("#hero-backdrop");
let backdropTimer;
function updateHeroBackdrop(game) {
  if (!game) {
    heroBackdrop.style.opacity = "0";
    return;
  }
  const image = getGameImage(game);
  heroBackdrop.style.opacity = "0";
  clearTimeout(backdropTimer);
  backdropTimer = window.setTimeout(() => {
    const layer = image && !image.automatic
      ? `linear-gradient(180deg, rgba(9,9,11,.42), #09090b 82%), url("${image.source.replaceAll('"', "%22")}")`
      : `${game.bg || "linear-gradient(135deg,#201b54,#09090b)"}`;
    heroBackdrop.style.backgroundImage = layer;
    heroBackdrop.style.opacity = "";
  }, 150);
}

function restartAutoplay() {
  clearInterval(autoPlay);
  autoPlay = setInterval(() => showFeatured(featuredIndex + 1), 4500);
}

document.querySelector("#prev-featured").addEventListener("click", () => { showFeatured(featuredIndex - 1); restartAutoplay(); });
document.querySelector("#next-featured").addEventListener("click", () => { showFeatured(featuredIndex + 1); restartAutoplay(); });
track.parentElement.addEventListener("mouseenter", () => clearInterval(autoPlay));
track.parentElement.addEventListener("mouseleave", restartAutoplay);
window.addEventListener("resize", () => showFeatured(featuredIndex));
document.querySelector("[data-scroll-to]").addEventListener("click", () => document.querySelector("#games").scrollIntoView({ behavior: "smooth" }));

const adminModal = document.querySelector("#admin-modal");
const adminRows = document.querySelector("#admin-rows");
const adminError = document.querySelector("#admin-error");

function optimizeGameImage(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type.startsWith("image/")) {
      reject(new Error("Lütfen PNG, JPG veya WebP türünde bir görsel seç."));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error("Görsel en fazla 8 MB olabilir."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Görsel okunamadı. Başka bir dosya dene."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Bu görsel işlenemedi. PNG veya JPG dene."));
      image.onload = () => {
        const maxEdge = 640;
        const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/webp", .82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function updateImagePicker(row, statusText) {
  const preview = row.querySelector(".image-preview");
  const status = row.querySelector(".image-status");
  const clearButton = row.querySelector(".clear-image");
  const uploadedImage = row.dataset.image;
  if (uploadedImage) {
    preview.style.backgroundImage = `url("${uploadedImage.replaceAll('"', "%22")}")`;
    preview.classList.add("has-preview");
    clearButton.hidden = false;
    status.textContent = statusText || "Görsel hazır";
  } else {
    preview.style.backgroundImage = "";
    preview.classList.remove("has-preview");
    clearButton.hidden = true;
    status.textContent = "Görsel seçilmezse site logosu otomatik kullanılır";
  }
}

function createAdminRow(game = { title: "Yeni oyun", category: "", url: "https://", image: "", description: "" }) {
  const row = document.createElement("div");
  row.className = "admin-row";
  row.dataset.id = game.id || "";
  row.dataset.image = game.image || "";
  row.dataset.description = game.description || "";
  const fields = [
    ["title", "Oyun adı", game.title],
    ["category", "Kategori", game.category],
    ["url", "Oyun bağlantısı (https://)", game.url],
  ];
  fields.forEach(([name, placeholder, value]) => {
    const input = document.createElement("input"); input.type = "text"; input.name = name; input.placeholder = placeholder; input.value = value; input.setAttribute("aria-label", placeholder); row.append(input);
  });
  const picker = document.createElement("div");
  picker.className = "image-picker";
  picker.innerHTML = '<span class="image-preview" aria-hidden="true"></span><span class="image-picker-copy"><b>Oyun görseli</b><small class="image-status"></small></span><button class="image-select" type="button">Görsel seç</button><input class="image-input" type="file" accept="image/*" hidden /><button class="clear-image" type="button" aria-label="Yüklenen oyun görselini sil" hidden>Sil</button>';
  const fileInput = picker.querySelector(".image-input");
  picker.querySelector(".image-select").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const [file] = fileInput.files;
    if (!file) return;
    row.dataset.processing = "true";
    adminError.textContent = "";
    picker.querySelector(".image-status").textContent = "Görsel hazırlanıyor…";
    try {
      row.dataset.image = await optimizeGameImage(file);
      updateImagePicker(row, file.name);
    } catch (error) {
      adminError.textContent = error.message;
      fileInput.value = "";
      updateImagePicker(row);
    } finally {
      delete row.dataset.processing;
    }
  });
  picker.querySelector(".clear-image").addEventListener("click", () => {
    row.dataset.image = "";
    fileInput.value = "";
    updateImagePicker(row);
  });
  row.append(picker);
  updateImagePicker(row);
  const reorder = document.createElement("div");
  reorder.className = "reorder-buttons";
  reorder.innerHTML = '<button type="button" aria-label="Oyunu yukarı taşı">↑</button><button type="button" aria-label="Oyunu aşağı taşı">↓</button>';
  reorder.children[0].addEventListener("click", () => {
    const previous = row.previousElementSibling;
    if (previous) adminRows.insertBefore(row, previous);
  });
  reorder.children[1].addEventListener("click", () => {
    const next = row.nextElementSibling;
    if (next) adminRows.insertBefore(next, row);
  });
  row.append(reorder);
  const remove = document.createElement("button"); remove.className = "remove-game"; remove.type = "button"; remove.textContent = "×"; remove.setAttribute("aria-label", `${game.title} oyununu kaldır`); remove.addEventListener("click", () => row.remove()); row.append(remove);
  return row;
}
function renderAdminRows() { adminRows.replaceChildren(...games.map((game) => createAdminRow(game))); }
function openAdminPanel() { adminError.textContent = ""; renderAdminRows(); adminModal.hidden = false; adminRows.querySelector("input")?.focus(); }
function closeAdminPanel() { adminModal.hidden = true; adminButton.focus(); }
adminButton.addEventListener("click", openAdminPanel);
document.querySelector("#close-admin").addEventListener("click", closeAdminPanel);
document.querySelector("#add-game").addEventListener("click", () => { const row = createAdminRow(); adminRows.append(row); row.querySelector("input").focus(); });

async function uploadRemoteCover(dataUrl) {
  if (!dataUrl.startsWith("data:image/")) return dataUrl;
  const client = await getSupabaseClient();
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const path = `${activeUser.id}/${crypto.randomUUID()}.webp`;
  const { error } = await client.storage.from("game-covers").upload(path, blob, { contentType: "image/webp", upsert: false });
  if (error) throw error;
  return client.storage.from("game-covers").getPublicUrl(path).data.publicUrl;
}

async function persistRemoteGames(nextGames) {
  const client = await getSupabaseClient();
  const prepared = [];
  for (let index = 0; index < nextGames.length; index += 1) {
    const game = nextGames[index];
    prepared.push({
      ...(game.id ? { id: game.id } : {}),
      title: game.title,
      category: game.category,
      url: game.url,
      image_url: await uploadRemoteCover(game.image || ""),
      description: game.description || "",
      hue: game.hue,
      background: game.bg,
      sort_order: index,
      created_by: activeUser.id,
    });
  }
  const { data: existing, error: existingError } = await client.from("games").select("id,url");
  if (existingError) throw existingError;
  const { error: saveError } = await client.from("games").upsert(prepared, { onConflict: "url" });
  if (saveError) throw saveError;
  const keepUrls = new Set(prepared.map(({ url }) => url));
  const removedIds = (existing || []).filter(({ url }) => !keepUrls.has(url)).map(({ id }) => id);
  if (removedIds.length) {
    const { error: deleteError } = await client.from("games").delete().in("id", removedIds);
    if (deleteError) throw deleteError;
  }
  await loadRemoteGames();
}

document.querySelector("#save-games").addEventListener("click", async () => {
  const rows = [...adminRows.querySelectorAll(".admin-row")];
  if (rows.some((row) => row.dataset.processing)) {
    adminError.textContent = "Görsel hazırlanıyor; birkaç saniye sonra tekrar kaydet.";
    return;
  }
  const nextGames = rows.map((row, index) => {
    const values = Object.fromEntries([...row.querySelectorAll('input[type="text"]')].map((input) => [input.name, input.value.trim()]));
    const normalizeUrl = (value) => value && !/^[a-z][a-z\d+.-]*:\/\//i.test(value) ? `https://${value}` : value;
    const url = normalizeUrl(values.url);
    const image = row.dataset.image || "";
    return { ...values, id: row.dataset.id || "", url, image, description: row.dataset.description || "", hue: defaultGames[index % defaultGames.length].hue, bg: defaultGames[index % defaultGames.length].bg };
  });
  if (nextGames.some(({ title, category, url }) => !title || !category || !url)) { adminError.textContent = "Her satırda oyun adı, kategori ve bağlantı alanı dolu olmalı."; return; }
  const saveButton = document.querySelector("#save-games");
  saveButton.disabled = true;
  saveButton.textContent = "Kaydediliyor…";
  try {
    if (backendEnabled) {
      await persistRemoteGames(nextGames);
    } else {
      games = nextGames;
      localStorage.setItem("mixgame-games", JSON.stringify(games));
    }
  } catch (error) {
    adminError.textContent = error.message || "Değişiklikler kaydedilemedi. Bağlantıyı kontrol edip tekrar dene.";
    saveButton.disabled = false;
    saveButton.textContent = "Değişiklikleri kaydet";
    return;
  }
  resetDiscovery(); featuredIndex = 0; renderFeatured(); showFeatured(0);
  adminError.style.color = "#9ee6b2";
  adminError.textContent = backendEnabled ? "Kaydedildi. Oyun listesi bütün kullanıcılarda güncellendi." : "Bu cihazda kaydedildi. Supabase bağlanınca bütün kullanıcılarda güncellenecek.";
  saveButton.disabled = false;
  saveButton.textContent = "Değişiklikleri kaydet";
  window.setTimeout(() => { adminError.style.color = ""; closeAdminPanel(); }, 700);
});
adminModal.addEventListener("click", (event) => { if (event.target === adminModal) closeAdminPanel(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !adminModal.hidden) closeAdminPanel(); });

const smartUrlInput = document.querySelector("#smart-game-url");
const smartFetchButton = document.querySelector("#smart-fetch");
const smartStatus = document.querySelector("#smart-status");

function normalizeGameUrl(value) {
  const normalized = value && !/^[a-z][a-z\d+.-]*:\/\//i.test(value) ? `https://${value}` : value;
  const url = new URL(normalized);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Yalnızca http veya https bağlantısı kullan.");
  return url.href;
}

async function fetchGameMetadata(url) {
  const endpoint = appConfig.metadataEndpoint || (appConfig.supabaseUrl ? `${appConfig.supabaseUrl.replace(/\/$/, "")}/functions/v1/metadata` : "");
  if (endpoint) {
    const headers = { "Content-Type": "application/json" };
    if (appConfig.supabaseAnonKey) {
      headers.apikey = appConfig.supabaseAnonKey;
      headers.Authorization = `Bearer ${appConfig.supabaseAnonKey}`;
    }
    const response = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify({ url }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Bağlantı bilgileri getirilemedi.");
    return data;
  }
  const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true`);
  const payload = await response.json();
  if (!response.ok || payload.status !== "success") throw new Error(payload.message || "Bağlantı bilgileri getirilemedi.");
  const previewImage = payload.data.image;
  const hasCoverSizedImage = previewImage?.url && Number(previewImage.width || 0) >= 300;
  return {
    title: payload.data.title,
    description: payload.data.description,
    image: hasCoverSizedImage ? previewImage.url : payload.data.screenshot?.url || previewImage?.url || payload.data.logo?.url || "",
    favicon: payload.data.logo?.url || "",
    url: payload.data.url || url,
  };
}

smartFetchButton.addEventListener("click", async () => {
  smartStatus.className = "smart-status";
  smartFetchButton.disabled = true;
  smartFetchButton.textContent = "İnceleniyor…";
  try {
    const url = normalizeGameUrl(smartUrlInput.value.trim());
    smartStatus.textContent = "Sayfa adı ve kapak görseli aranıyor…";
    const metadata = await fetchGameMetadata(url);
    const newGame = {
      title: metadata.title?.trim() || new URL(url).hostname,
      category: "",
      url: metadata.url || url,
      image: metadata.image || metadata.favicon || "",
      description: metadata.description || "",
    };
    const row = createAdminRow(newGame);
    adminRows.prepend(row);
    row.querySelector('[name="category"]').focus();
    row.scrollIntoView({ behavior: "smooth", block: "center" });
    smartUrlInput.value = "";
    smartStatus.classList.add("is-success");
    smartStatus.textContent = "Kart hazır. Şimdi kategoriyi yazıp değişiklikleri kaydet.";
  } catch (error) {
    smartStatus.classList.add("is-error");
    smartStatus.textContent = error.message || "Bilgiler getirilemedi. Alanları elle ekleyebilirsin.";
  } finally {
    smartFetchButton.disabled = false;
    smartFetchButton.textContent = "Bilgileri getir";
  }
});

smartUrlInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    smartFetchButton.click();
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

renderCategories();
renderGrid();
renderFeatured();
showFeatured(0);
restartAutoplay();

async function restoreBackendSession() {
  if (!backendEnabled) return;
  try {
    const client = await getSupabaseClient();
    const { data: sessionData } = await client.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return;
    const { data: profile, error } = await client.from("profiles").select("username, display_name, role").eq("id", userId).single();
    if (error) throw error;
    const roleLabels = { admin: "Yönetici", editor: "İçerik Editörü", player: "Oyuncu" };
    await loadRemoteGames();
    await enableRemoteUpdates();
    setAuthenticatedUser(profile.username, {
      displayName: profile.display_name,
      role: profile.role,
      roleLabel: roleLabels[profile.role] || "Oyuncu",
      id: userId,
    });
  } catch {
    showToast("Ortak kütüphaneye bağlanılamadı. Tekrar giriş yapmayı dene.");
  }
}

restoreBackendSession();
