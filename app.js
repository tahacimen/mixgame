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
    return Array.isArray(saved) && saved.length ? saved : defaultGames;
  } catch { return defaultGames; }
})();

// Temporary front-end demo only. Move identity checks to a secure service before production.
const demoUsers = {
  oyuncu1: { password: "mixgame2026", displayName: "Oyuncu 1" },
  oyuncu2: { password: "mixgame2026", displayName: "Oyuncu 2" },
};
const loginForm = document.querySelector("#login-form");
const loginError = document.querySelector("#login-error");
const loginSubmit = document.querySelector("#login-submit");
const headerUser = document.querySelector("#header-user");
const currentUser = document.querySelector("#current-user");
const adminButton = document.querySelector("#admin-button");

function setAuthenticatedUser(username) {
  const user = demoUsers[username];
  if (!user) return;
  sessionStorage.setItem("mixgame-user", username);
  document.body.classList.add("is-authenticated");
  headerUser.hidden = false;
  currentUser.textContent = user.displayName;
  adminButton.hidden = username !== "oyuncu1";
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const username = loginForm.elements.username.value.trim().toLowerCase();
  const password = loginForm.elements.password.value;
  loginError.textContent = "";
  loginSubmit.disabled = true;
  loginSubmit.textContent = "Kontrol ediliyor…";
  window.setTimeout(() => {
    if (demoUsers[username]?.password === password) {
      setAuthenticatedUser(username);
      loginForm.reset();
    } else {
      loginError.textContent = "Kullanıcı adı veya şifre doğru değil. Test hesaplarını kontrol et.";
      loginForm.elements.username.focus();
    }
    loginSubmit.disabled = false;
    loginSubmit.innerHTML = 'Giriş yap <span aria-hidden="true">→</span>';
  }, 260);
});

document.querySelector("#password-toggle").addEventListener("click", (event) => {
  const passwordInput = loginForm.elements.password;
  const shown = passwordInput.type === "text";
  passwordInput.type = shown ? "password" : "text";
  event.currentTarget.textContent = shown ? "Göster" : "Gizle";
  event.currentTarget.setAttribute("aria-pressed", String(!shown));
});

document.querySelector("#logout-button").addEventListener("click", () => {
  sessionStorage.removeItem("mixgame-user");
  document.body.classList.remove("is-authenticated");
  headerUser.hidden = true;
  adminButton.hidden = true;
  loginForm.elements.username.focus();
});

const savedUser = sessionStorage.getItem("mixgame-user");
if (demoUsers[savedUser]) setAuthenticatedUser(savedUser);

const grid = document.querySelector("#games-grid");
const cardTemplate = document.querySelector("#game-card-template");
const categoryBar = document.querySelector("#category-bar");
const gameCount = document.querySelector("#game-count");
let activeCategory = "Tümü";

function setArt(el, game) {
  el.style.setProperty("--card-bg", game.bg);
  el.style.setProperty("--card-glow", game.hue);
  el.style.setProperty("--orb", game.hue);
}

function renderGrid() {
  const selected = activeCategory === "Tümü" ? games : games.filter(({ category }) => category === activeCategory);
  grid.replaceChildren();
  const fragment = document.createDocumentFragment();
  selected.forEach((game, index) => {
    const card = cardTemplate.content.cloneNode(true);
    const link = card.querySelector(".game-card");
    const art = card.querySelector(".game-art");
    link.href = game.url;
    link.setAttribute("aria-label", `${game.title} oyununa git (yeni sekmede açılır)`);
    link.style.animationDelay = `${index * 35}ms`;
    card.querySelector(".game-title").textContent = game.title;
    setArt(art, game);
    fragment.append(card);
  });
  grid.append(fragment);
  gameCount.textContent = selected.length;
}

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
  featuredIndex = (index + featuredGames.length) % featuredGames.length;
  const card = track.firstElementChild;
  const gap = parseFloat(getComputedStyle(track).gap) || 14;
  const distance = (card?.getBoundingClientRect().width || 0) + gap;
  track.style.transform = `translateX(${-featuredIndex * distance}px)`;
  [...dots.children].forEach((dot, i) => dot.classList.toggle("active", i === featuredIndex));
  featuredCount.textContent = String(featuredIndex + 1).padStart(2, "0");
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

function createAdminRow(game = { title: "Yeni oyun", category: "Aksiyon", url: "https://" }) {
  const row = document.createElement("div");
  row.className = "admin-row";
  const fields = [["title", "Oyun adı", game.title], ["category", "Kategori", game.category], ["url", "https:// bağlantısı", game.url]];
  fields.forEach(([name, placeholder, value]) => {
    const input = document.createElement("input"); input.name = name; input.placeholder = placeholder; input.value = value; input.setAttribute("aria-label", placeholder); row.append(input);
  });
  const remove = document.createElement("button"); remove.className = "remove-game"; remove.type = "button"; remove.textContent = "×"; remove.setAttribute("aria-label", `${game.title} oyununu kaldır`); remove.addEventListener("click", () => row.remove()); row.append(remove);
  return row;
}
function renderAdminRows() { adminRows.replaceChildren(...games.map((game) => createAdminRow(game))); }
function openAdminPanel() { adminError.textContent = ""; renderAdminRows(); adminModal.hidden = false; adminRows.querySelector("input")?.focus(); }
function closeAdminPanel() { adminModal.hidden = true; adminButton.focus(); }
adminButton.addEventListener("click", openAdminPanel);
document.querySelector("#close-admin").addEventListener("click", closeAdminPanel);
document.querySelector("#add-game").addEventListener("click", () => { const row = createAdminRow(); adminRows.append(row); row.querySelector("input").focus(); });
document.querySelector("#save-games").addEventListener("click", () => {
  const rows = [...adminRows.querySelectorAll(".admin-row")];
  const nextGames = rows.map((row, index) => {
    const values = Object.fromEntries([...row.querySelectorAll("input")].map((input) => [input.name, input.value.trim()]));
    return { ...values, hue: defaultGames[index % defaultGames.length].hue, bg: defaultGames[index % defaultGames.length].bg };
  });
  if (!nextGames.length || nextGames.some(({ title, category, url }) => !title || !category || !/^https?:\/\//i.test(url))) { adminError.textContent = "Her satırda oyun adı, kategori ve https:// ile başlayan geçerli bir bağlantı olmalı."; return; }
  games = nextGames; localStorage.setItem("mixgame-games", JSON.stringify(games)); activeCategory = "Tümü"; featuredIndex = 0; renderCategories(); renderGrid(); renderFeatured(); showFeatured(0); closeAdminPanel();
});
adminModal.addEventListener("click", (event) => { if (event.target === adminModal) closeAdminPanel(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !adminModal.hidden) closeAdminPanel(); });

renderCategories();
renderGrid();
renderFeatured();
showFeatured(0);
restartAutoplay();
