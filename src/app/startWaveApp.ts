import { createWave } from "../core/wave";
import { mountWaveCanvas } from "./setupWaveCanvas";
import { setupWaveGui } from "./setupWaveGui";

export const startWaveApp = (app: HTMLDivElement): void => {
  const canvas = mountWaveCanvas(app);
  const wave = createWave(canvas);
  const gui = setupWaveGui(wave);

  window.addEventListener(
    "beforeunload",
    () => {
      gui.destroy();
      wave.destroy();
    },
    { once: true },
  );
};
