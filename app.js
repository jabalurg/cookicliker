const SAVE_KEY = "jump-runner-save-v1";

const elements = {
  score: document.querySelector("#score-count"),
  bestStreak: document.querySelector("#best-streak"),
  jumpReward: document.querySelector("#jump-reward"),
  floaters: document.querySelector("#floaters"),
  jumpButton: document.querySelector("#jump-button"),
  jumpStage: document.querySelector(".jump-stage"),
  jumpStreak: document.querySelector("#jump-streak"),
  jumper: document.querySelector("#jumper"),
  resetButton: document.querySelector("#reset-button")
};

const defaultState = {
  score: 0,
  jumpStreak: 0,
  bestStreak: 0
};

let state = loadState();
let isJumping = false;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved || typeof saved !== "object") {
      return structuredClone(defaultState);
    }

    return {
      score: Number(saved.score) || 0,
      jumpStreak: Number(saved.jumpStreak) || 0,
      bestStreak: Number(saved.bestStreak) || 0
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function formatNumber(value) {
  return value.toLocaleString("ru-RU");
}

function jumpReward() {
  return 10 + Math.min(state.jumpStreak, 50);
}

function render() {
  elements.score.textContent = formatNumber(state.score);
  elements.bestStreak.textContent = formatNumber(state.bestStreak);
  elements.jumpReward.textContent = `+${formatNumber(jumpReward())}`;
  elements.jumpStreak.textContent = `Серия: ${formatNumber(state.jumpStreak)}`;
}

function showStageFloater(amount) {
  const rect = elements.floaters.getBoundingClientRect();
  const stageRect = elements.jumpStage.getBoundingClientRect();
  const floater = document.createElement("span");
  floater.className = "floater";
  floater.textContent = `+${formatNumber(amount)}`;
  floater.style.setProperty("--x", `${stageRect.left + stageRect.width / 2 - rect.left - 18}px`);
  floater.style.setProperty("--y", `${stageRect.top + 44 - rect.top}px`);
  elements.floaters.append(floater);
  floater.addEventListener("animationend", () => floater.remove(), { once: true });
}

function jump() {
  if (isJumping) {
    return;
  }

  isJumping = true;
  state.jumpStreak += 1;
  state.bestStreak = Math.max(state.bestStreak, state.jumpStreak);

  const reward = jumpReward();
  state.score += reward;
  showStageFloater(reward);

  elements.jumpButton.disabled = true;
  elements.jumper.classList.add("jumping");
  elements.jumpStage.classList.add("active");
  saveState();
  render();

  window.setTimeout(() => {
    elements.jumper.classList.remove("jumping");
    elements.jumpStage.classList.remove("active");
    elements.jumpButton.disabled = false;
    isJumping = false;
  }, 540);
}

elements.jumpButton.addEventListener("click", jump);

window.addEventListener("keydown", (event) => {
  if (event.code !== "Space" && event.code !== "ArrowUp") {
    return;
  }

  if (event.target instanceof HTMLButtonElement) {
    return;
  }

  event.preventDefault();
  jump();
});

elements.resetButton.addEventListener("click", () => {
  const confirmed = window.confirm("Сбросить прогресс Jump Runner?");
  if (!confirmed) {
    return;
  }

  state = structuredClone(defaultState);
  isJumping = false;
  saveState();
  render();
});

setInterval(saveState, 5000);
render();
