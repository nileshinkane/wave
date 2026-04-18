import GUI from "lil-gui";
import { DEFAULT_WAVE_PARAMETERS } from "../core/defaults";
import type { WaveColor, WaveParameters } from "../core/types";
import type { Wave } from "../core/wave";

const DEFAULT_BACKGROUND_COLOR = "#030205";

const cloneWaveColor = (color: WaveColor): WaveColor => ({ ...color });

const cloneWaveParameters = (parameters: WaveParameters): WaveParameters => ({
  ...parameters,
  waveColors: parameters.waveColors.map(cloneWaveColor),
});

const assignWaveParameters = (
  target: WaveParameters,
  source: WaveParameters,
): void => {
  target.amplitude = source.amplitude;
  target.variation = source.variation;
  target.phaseVelocity = source.phaseVelocity;
  target.phaseShift = source.phaseShift;
  target.lines = source.lines;
  target.jitter = source.jitter;
  target.direction = source.direction;
  target.lineStroke = source.lineStroke;

  target.waveColors.length = 0;
  for (const color of source.waveColors) {
    target.waveColors.push(cloneWaveColor(color));
  }
};

const setBackgroundColor = (backgroundColor: string): void => {
  document.documentElement.style.setProperty("--page-bg", backgroundColor);
};

export const setupWaveGui = (wave: Wave): GUI => {
  const defaultAnatomy = cloneWaveParameters(DEFAULT_WAVE_PARAMETERS);
  const anatomy = cloneWaveParameters(DEFAULT_WAVE_PARAMETERS);
  const uiState = {
    backgroundColor: DEFAULT_BACKGROUND_COLOR,
  };

  setBackgroundColor(uiState.backgroundColor);
  wave.update(anatomy);

  const gui = new GUI({
    title: "Controls",
  });
  gui.domElement.style.zIndex = "10";

  const controllers: Array<{ updateDisplay: () => void }> = [];
  const registerController = <T extends { updateDisplay: () => void }>(
    controller: T,
  ): T => {
    controllers.push(controller);
    return controller;
  };

  const syncWave = (): void => {
    wave.update(anatomy);
  };

  const copyAnatomy = async (): Promise<void> => {
    const anatomyJSON = JSON.stringify(anatomy, null, 2);
    await navigator.clipboard.writeText(anatomyJSON);
  };

  const resetControls = (): void => {
    assignWaveParameters(anatomy, defaultAnatomy);
    uiState.backgroundColor = DEFAULT_BACKGROUND_COLOR;
    setBackgroundColor(uiState.backgroundColor);

    for (const controller of controllers) {
      controller.updateDisplay();
    }

    syncWave();
  };

  const actions = {
    async getAnatomy(): Promise<void> {
      try {
        await copyAnatomy();
      } catch (error) {
        console.error("Failed to copy anatomy JSON.", error);
      }
    },
    reset(): void {
      resetControls();
    },
  };

  registerController(gui.add(actions, "getAnatomy").name("Get Anatomy"));
  registerController(gui.add(actions, "reset").name("Reset"));
  registerController(
    gui
      .addColor(uiState, "backgroundColor")
      .name("background")
      .onChange((value: string) => {
        setBackgroundColor(value);
      }),
  );
  registerController(
    gui.add(anatomy, "direction", { Forward: 1, Backward: 0 }),
  );
  registerController(gui.add(anatomy, "amplitude", 0, 500).step(1));
  registerController(gui.add(anatomy, "variation", 0, 0.005).step(0.000025));
  registerController(gui.add(anatomy, "phaseVelocity", 0, 0.005).step(0.0001));
  registerController(gui.add(anatomy, "phaseShift", 0, 0.05).step(0.0001));
  registerController(gui.add(anatomy, "lines", 1, 50).step(1));
  registerController(gui.add(anatomy, "lineStroke", 0, 10).step(0.5));
  registerController(gui.add(anatomy, "jitter", 0, 50).step(1));

  const colorsFolder = gui.addFolder("WaveColors");
  anatomy.waveColors.forEach((color, index) => {
    const colorFolder = colorsFolder.addFolder(`Color${index + 1}`);

    registerController(colorFolder.add(color, "r", 0, 255).step(1));
    registerController(colorFolder.add(color, "g", 0, 255).step(1));
    registerController(colorFolder.add(color, "b", 0, 255).step(1));
    registerController(colorFolder.add(color, "a", 0, 1).step(0.01));
    registerController(colorFolder.add(color, "span", 0, 1).step(0.01));
  });

  gui.onChange(() => {
    syncWave();
  });

  return gui;
};
