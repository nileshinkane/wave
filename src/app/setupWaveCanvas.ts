export const mountWaveCanvas = (app: HTMLDivElement): HTMLCanvasElement => {
  app.innerHTML = `
    <div class="wave-frame">
      <canvas class="wave-canvas" aria-label="Animated wave"></canvas>
    </div>
  `;

  const canvas = app.querySelector<HTMLCanvasElement>(".wave-canvas");
  if (!canvas) {
    throw new Error("Wave canvas not found.");
  }

  return canvas;
};
