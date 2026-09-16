const SAVE_KEY = "cookie-clicker-save-v1";

const upgrades = [
  {
    id: "cursor",
    name: "Курсор",
    icon: "+1",
    baseCost: 15,
    cps: 0.1,
    clickBonus: 0,
    description: "+0.1 печенья в секунду"
  },
  {
    id: "oven",
    name: "Духовка",
    icon: "x2",
    baseCost: 80,
    cps: 1,
    clickBonus: 0,
    description: "+1 печенье в секунду"
  },
  {
    id: "bakery",
    name: "Пекарня",
    icon: "B",
    baseCost: 420,
    cps: 8,
    clickBonus: 0,
    description: "+8 печений в секунду"
  },
  {
    id: "glove",
    name: "Сладкая рука",
    icon: "C",
    baseCost: 120,
    cps: 0,
    clickBonus: 1,
    description: "+1 печенье за клик"
  },
  {
    id: "factory",
    name: "Фабрика",
    icon: "F",
    baseCost: 2200,
    cps: 42,
    clickBonus: 0,
    description: "+42 печенья в секунду"
  }
];

const elements = {
  cookieCount: document.querySelector("#cookie-count"),
  cps: document.querySelector("#cookies-per-second"),
  cpc: document.querySelector("#cookies-per-click"),
  cookieButton: document.querySelector("#cookie-button"),
  floaters: document.querySelector("#floaters"),
  upgradeList: document.querySelector("#upgrade-list"),
  resetButton: document.querySelector("#reset-button")
};

const defaultState = {
  cookies: 0,
  totalBaked: 0,
  owned: Object.fromEntries(upgrades.map((upgrade) => [upgrade.id, 0]))
};

let state = loadState();
let lastTick = performance.now();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved || typeof saved !== "object") {
      return structuredClone(defaultState);
    }

    return {
      cookies: Number(saved.cookies) || 0,
      totalBaked: Number(saved.totalBaked) || 0,
      owned: { ...defaultState.owned, ...(saved.owned || {}) }
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function costFor(upgrade) {
  const owned = state.owned[upgrade.id] || 0;
  return Math.floor(upgrade.baseCost * Math.pow(1.18, owned));
}

function cookiesPerSecond() {
  return upgrades.reduce((total, upgrade) => total + upgrade.cps * (state.owned[upgrade.id] || 0), 0);
}

function cookiesPerClick() {
  return 1 + upgrades.reduce((total, upgrade) => total + upgrade.clickBonus * (state.owned[upgrade.id] || 0), 0);
}

function formatNumber(value) {
  if (value < 1000) {
    return value.toLocaleString("ru-RU", { maximumFractionDigits: value % 1 === 0 ? 0 : 1 });
  }

  return Intl.NumberFormat("ru-RU", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function renderUpgrades() {
  elements.upgradeList.innerHTML = "";

  for (const upgrade of upgrades) {
    const cost = costFor(upgrade);
    const owned = state.owned[upgrade.id] || 0;
    const button = document.createElement("button");
    button.className = "upgrade";
    button.type = "button";
    button.disabled = state.cookies < cost;
    button.innerHTML = `
      <span class="upgrade-icon">${upgrade.icon}</span>
      <span>
        <span class="upgrade-name">${upgrade.name} (${owned})</span>
        <span class="upgrade-effect">${upgrade.description}</span>
      </span>
      <span class="upgrade-price">${formatNumber(cost)}</span>
    `;
    button.addEventListener("click", () => buyUpgrade(upgrade));
    elements.upgradeList.append(button);
  }
}

function renderStats() {
  elements.cookieCount.textContent = formatNumber(Math.floor(state.cookies));
  elements.cps.textContent = formatNumber(cookiesPerSecond());
  elements.cpc.textContent = formatNumber(cookiesPerClick());
}

function render() {
  renderStats();
  renderUpgrades();
}

function bake(amount) {
  state.cookies += amount;
  state.totalBaked += amount;
}

function buyUpgrade(upgrade) {
  const cost = costFor(upgrade);
  if (state.cookies < cost) {
    return;
  }

  state.cookies -= cost;
  state.owned[upgrade.id] += 1;
  saveState();
  render();
}

function showFloater(amount, event) {
  const rect = elements.floaters.getBoundingClientRect();
  const floater = document.createElement("span");
  floater.className = "floater";
  floater.textContent = `+${formatNumber(amount)}`;
  floater.style.setProperty("--x", `${event.clientX - rect.left}px`);
  floater.style.setProperty("--y", `${event.clientY - rect.top}px`);
  elements.floaters.append(floater);
  floater.addEventListener("animationend", () => floater.remove(), { once: true });
}

elements.cookieButton.addEventListener("click", (event) => {
  const amount = cookiesPerClick();
  bake(amount);
  showFloater(amount, event);
  saveState();
  render();
});

elements.resetButton.addEventListener("click", () => {
  const confirmed = window.confirm("Сбросить прогресс Cookie Clicker?");
  if (!confirmed) {
    return;
  }

  state = structuredClone(defaultState);
  saveState();
  render();
});

function tick(now) {
  const elapsedSeconds = (now - lastTick) / 1000;
  lastTick = now;
  const passiveCookies = cookiesPerSecond() * elapsedSeconds;

  if (passiveCookies > 0) {
    bake(passiveCookies);
    renderStats();
    renderUpgrades();
  }

  requestAnimationFrame(tick);
}

setInterval(saveState, 5000);
render();
requestAnimationFrame(tick);
