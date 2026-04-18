import type { RandomFn } from "./simplex";

export type WaveColor = {
  r: number;
  g: number;
  b: number;
  a: number;
  span: number;
};

export type WaveParameters = {
  amplitude: number;
  variation: number;
  phaseVelocity: number;
  phaseShift: number;
  lines: number;
  jitter: number;
  waveColors: WaveColor[];
  direction: 1 | 0;
  lineStroke: number;
};

export interface WaveOptions {
  canvas: HTMLCanvasElement;
  parameters?: Partial<WaveParameters>;
  autoStart?: boolean;
  observeResize?: boolean;
  useDevicePixelRatio?: boolean;
  random?: RandomFn;
}
