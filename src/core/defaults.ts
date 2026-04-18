import type { WaveColor, WaveParameters } from "./types";

const cloneWaveColor = (color: WaveColor): WaveColor => ({ ...color });

export const DEFAULT_WAVE_COLORS: WaveColor[] = [
  {
    r: 216,
    g: 168,
    b: 66,
    a: 0.5,
    span: 0.28,
  },
  {
    r: 229,
    g: 142,
    b: 154,
    a: 0.09,
    span: 0.3,
  },
  {
    r: 155,
    g: 106,
    b: 175,
    a: 0.7,
    span: 0.5,
  },
];

export const DEFAULT_WAVE_PARAMETERS: WaveParameters = {
  amplitude: 200,
  variation: 0.002,
  phaseVelocity: 0.001,
  phaseShift: 0.032,
  lines: 25,
  jitter: 0,
  waveColors: DEFAULT_WAVE_COLORS.map(cloneWaveColor),
  direction: 0,
  lineStroke: 1,
};
