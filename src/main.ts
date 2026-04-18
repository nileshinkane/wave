import { DEFAULT_WAVE_PARAMETERS } from "./core/defaults";
import { createWave } from "./core/wave";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("App root not found.");
}

const style = document.createElement("style");
style.textContent = `
  :root {
    color-scheme: dark;
    background: #030205;
  }

  html,
  body,
  #app {
    margin: 0;
    width: 100%;
    height: 100%;
  }

  body {
    overflow: hidden;
    min-width: 100vw;
    min-height: 100dvh;
   
  }

  #app {
    position: fixed;
    inset: 0;
  }

  .wave-frame {
    position: absolute;
    inset: 0;
  }

  .wave-canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }
`;
document.head.appendChild(style);

app.innerHTML = `
  <div class="wave-frame">
    <canvas class="wave-canvas" aria-label="Animated wave"></canvas>
  </div>
`;

const canvas = app.querySelector<HTMLCanvasElement>(".wave-canvas");
if (!canvas) {
  throw new Error("Wave canvas not found.");
}

const wave = createWave(canvas, {
  ...DEFAULT_WAVE_PARAMETERS,
});

window.addEventListener(
  "beforeunload",
  () => {
    wave.destroy();
  },
  { once: true },
);
