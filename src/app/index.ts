import "../styles/global.css";

import { GameBootstrap } from "./GameBootstrap";
import { loadAssets } from "../game/utils/AssetLoader";
import { sound } from "@pixi/sound";

(async () => {
  const loadingBar = document.getElementById("loading-bar") as HTMLDivElement;
  const loadingText = document.getElementById(
    "loading-text",
  ) as HTMLParagraphElement;
  const loadingScreen = document.getElementById(
    "loading-screen",
  ) as HTMLDivElement;
  const startOverlay = document.getElementById(
    "start-overlay",
  ) as HTMLDivElement;

  // ✅ LOAD ASSETS WITH PROGRESS
  await loadAssets((p) => {
    const percent = Math.round(p * 100);

    if (loadingBar) loadingBar.style.width = percent + "%";
    if (loadingText) loadingText.innerText = percent + "%";
  });

  // ✅ SHOW "CLICK TO START"
  if (startOverlay) {
    startOverlay.classList.remove("hidden");
  }

  if (loadingText) {
    loadingText.innerText = "Click to Start";
  }

  // ✅ WAIT FOR USER CLICK (CLEAN WAY)
  await new Promise<void>((resolve) => {
    if (!loadingScreen) return resolve();

    loadingScreen.onclick = () => {
      // 🔓 unlock Pixi audio
      sound.context.audioContext.resume();

      // prevent multiple clicks
      loadingScreen.onclick = null;

      resolve();
    };
  });

  // ✅ FADE OUT LOADER
  if (loadingScreen) {
    loadingScreen.style.transition = "opacity 0.5s ease, transform 0.5s ease";
    loadingScreen.style.opacity = "0";
    loadingScreen.style.transform = "scale(1.05)";

    await new Promise((res) => setTimeout(res, 500));
    loadingScreen.remove();
  }

  // ✅ START GAME
  await new GameBootstrap().start();
})();
