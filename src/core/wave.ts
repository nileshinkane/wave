import { createNoise3D, type NoiseFunction3D, type RandomFn } from "./simplex";

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

type WaveSize = {
  width: number;
  height: number;
  pixelRatio: number;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const toFiniteNumber = (value: number | undefined, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const cloneWaveColor = (color: WaveColor): WaveColor => ({ ...color });

const DEFAULT_WAVE_COLORS: WaveColor[] = [
  {
    r: 216,
    g: 168,
    b: 66,
    a: 0.2,
    span: 0.2,
  },
  {
    r: 229,
    g: 142,
    b: 154,
    a: 0.3,
    span: 0.5,
  },
  {
    r: 155,
    g: 106,
    b: 175,
    a: 0.7,
    span: 0.8,
  },
];

const REFERENCE_WAVE_WIDTH = 1000;

export const DEFAULT_WAVE_PARAMETERS: WaveParameters = {
  amplitude: 200,
  variation: 0.0015,
  phaseVelocity: 0.001,
  phaseShift: 0.03,
  lines: 20,
  jitter: 0,
  waveColors: DEFAULT_WAVE_COLORS.map(cloneWaveColor),
  direction: 0,
  lineStroke: 1,
};

const cloneParameters = (parameters: WaveParameters): WaveParameters => ({
  ...parameters,
  waveColors: parameters.waveColors.map(cloneWaveColor),
});

const normalizeWaveColor = (
  color: Partial<WaveColor> | undefined,
  fallback: WaveColor,
): WaveColor => ({
  r: clamp(toFiniteNumber(color?.r, fallback.r), 0, 255),
  g: clamp(toFiniteNumber(color?.g, fallback.g), 0, 255),
  b: clamp(toFiniteNumber(color?.b, fallback.b), 0, 255),
  a: clamp(toFiniteNumber(color?.a, fallback.a), 0, 1),
  span: clamp(toFiniteNumber(color?.span, fallback.span), 0, 1),
});

const normalizeWaveColors = (colors?: WaveColor[]): WaveColor[] => {
  if (!colors || colors.length === 0) {
    return DEFAULT_WAVE_COLORS.map(cloneWaveColor);
  }

  return colors.map((color, index) =>
    normalizeWaveColor(
      color,
      DEFAULT_WAVE_COLORS[Math.min(index, DEFAULT_WAVE_COLORS.length - 1)],
    ),
  );
};

const mergeParameters = (
  base: WaveParameters,
  overrides?: Partial<WaveParameters>,
): WaveParameters => {
  const nextParameters = overrides ?? {};
  const nextLines = clamp(
    Math.round(toFiniteNumber(nextParameters.lines, base.lines)),
    1,
    500,
  );

  return {
    amplitude: Math.max(
      0,
      toFiniteNumber(nextParameters.amplitude, base.amplitude),
    ),
    variation: Math.max(
      0,
      toFiniteNumber(nextParameters.variation, base.variation),
    ),
    phaseVelocity: Math.max(
      0,
      toFiniteNumber(nextParameters.phaseVelocity, base.phaseVelocity),
    ),
    phaseShift: toFiniteNumber(nextParameters.phaseShift, base.phaseShift),
    lines: nextLines,
    jitter: Math.max(0, toFiniteNumber(nextParameters.jitter, base.jitter)),
    waveColors: nextParameters.waveColors
      ? normalizeWaveColors(nextParameters.waveColors)
      : base.waveColors.map(cloneWaveColor),
    direction: nextParameters.direction === 0 ? 0 : 1,
    lineStroke: Math.max(
      0,
      toFiniteNumber(nextParameters.lineStroke, base.lineStroke),
    ),
  };
};

const measureCanvasBox = (
  canvas: HTMLCanvasElement,
): { width: number; height: number } => {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || canvas.clientWidth || canvas.offsetWidth || 300;
  const height =
    rect.height || canvas.clientHeight || canvas.offsetHeight || 150;

  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
};

export class Wave {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly noise3D: NoiseFunction3D;
  private readonly observeResize: boolean;
  private readonly random: RandomFn;
  private readonly useDevicePixelRatio: boolean;
  private readonly usedIntrinsicCanvasSize: boolean;

  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private readonly handleResize = (): void => {
    const resized = this.resize(true);
    if (resized || this.animationFrameId === null) {
      this.render();
    }
  };
  private size: WaveSize = {
    width: 0,
    height: 0,
    pixelRatio: 1,
  };
  private parameters: WaveParameters;
  private phaseList: number[] = [];

  constructor(options: WaveOptions) {
    const context = options.canvas.getContext("2d");
    if (!context) {
      throw new Error("Wave requires a 2D canvas context.");
    }

    const initialBox = options.canvas.getBoundingClientRect();

    this.canvas = options.canvas;
    this.context = context;
    this.random = options.random ?? Math.random;
    this.noise3D = createNoise3D(this.random);
    this.observeResize = options.observeResize ?? true;
    this.useDevicePixelRatio = options.useDevicePixelRatio ?? true;
    this.usedIntrinsicCanvasSize =
      !this.canvas.hasAttribute("width") &&
      !this.canvas.hasAttribute("height") &&
      !this.canvas.style.width &&
      !this.canvas.style.height &&
      Math.round(initialBox.width || 0) === this.canvas.width &&
      Math.round(initialBox.height || 0) === this.canvas.height;

    this.parameters = mergeParameters(
      DEFAULT_WAVE_PARAMETERS,
      options.parameters,
    );
    this.generatePhaseList();
    this.resize(true);
    this.render();

    if (this.observeResize) {
      window.addEventListener("resize", this.handleResize);
      window.visualViewport?.addEventListener("resize", this.handleResize);
    }

    if (this.observeResize && typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      this.resizeObserver.observe(this.canvas);
      if (this.canvas.parentElement) {
        this.resizeObserver.observe(this.canvas.parentElement);
      }
    }

    if (options.autoStart ?? true) {
      this.start();
    }
  }

  getParameters(): WaveParameters {
    return cloneParameters(this.parameters);
  }

  update(parameters: Partial<WaveParameters>): void {
    this.parameters = mergeParameters(this.parameters, parameters);

    if (parameters.lines !== undefined || parameters.phaseShift !== undefined) {
      this.generatePhaseList();
    }

    if (this.animationFrameId === null) {
      this.render();
    }
  }

  start(): void {
    if (this.animationFrameId !== null) {
      return;
    }

    const frame = () => {
      this.render();
      this.animationFrameId = window.requestAnimationFrame(frame);
    };

    this.animationFrameId = window.requestAnimationFrame(frame);
  }

  stop(): void {
    if (this.animationFrameId === null) {
      return;
    }

    window.cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }

  resize(force = false): boolean {
    const { width, height } = measureCanvasBox(this.canvas);
    const pixelRatio =
      this.useDevicePixelRatio && typeof window.devicePixelRatio === "number"
        ? Math.max(1, window.devicePixelRatio)
        : 1;

    if (
      !force &&
      width === this.size.width &&
      height === this.size.height &&
      pixelRatio === this.size.pixelRatio
    ) {
      return false;
    }

    this.size = {
      width,
      height,
      pixelRatio,
    };

    // Prevent backing-store changes from inflating canvases that still rely on their
    // intrinsic 300x150 sizing.
    if (this.usedIntrinsicCanvasSize) {
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
    }

    this.canvas.width = Math.round(width * pixelRatio);
    this.canvas.height = Math.round(height * pixelRatio);
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    return true;
  }

  render(): void {
    this.resize();
    this.context.clearRect(0, 0, this.size.width, this.size.height);
    this.drawWaves();
  }

  destroy(): void {
    this.stop();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    window.removeEventListener("resize", this.handleResize);
    window.visualViewport?.removeEventListener("resize", this.handleResize);
  }

  private generatePhaseList(): void {
    this.phaseList = new Array(this.parameters.lines);

    for (
      let lineIndex = 0, phase = 0;
      lineIndex < this.parameters.lines;
      lineIndex += 1, phase += this.parameters.phaseShift
    ) {
      this.phaseList[lineIndex] = phase;
    }
  }

  private drawWaves(): void {
    const centerY = this.size.height / 2;
    const gradient = this.context.createLinearGradient(
      0,
      centerY,
      this.size.width,
      centerY,
    );

    for (const color of this.parameters.waveColors) {
      gradient.addColorStop(
        color.span,
        `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
      );
    }

    this.context.lineWidth = this.parameters.lineStroke;
    this.context.strokeStyle = gradient;

    for (let lineIndex = 0; lineIndex < this.parameters.lines; lineIndex += 1) {
      this.context.beginPath();
      this.context.moveTo(0, centerY);

      for (let x = 0; x <= this.size.width; x += 1) {
        // Sample noise in a width-normalized domain so resizing rebuilds the
        // overall wave composition instead of showing a cropped subsection.
        const domainX =
          (x / Math.max(1, this.size.width)) * REFERENCE_WAVE_WIDTH;
        const noise = this.noise3D(
          domainX * this.parameters.variation + this.phaseList[lineIndex],
          domainX * this.parameters.variation,
          1,
        );
        const amplitude =
          this.parameters.amplitude + this.random() * this.parameters.jitter;
        const perlinY = amplitude * noise;

        this.context.lineTo(x + 0.5, centerY + perlinY);
      }

      this.context.stroke();
      this.context.closePath();

      if (this.parameters.direction === 1) {
        this.phaseList[lineIndex] -= this.parameters.phaseVelocity;
      } else {
        this.phaseList[lineIndex] += this.parameters.phaseVelocity;
      }
    }
  }
}

export const createWave = (
  canvas: HTMLCanvasElement,
  parameters?: Partial<WaveParameters>,
): Wave => new Wave({ canvas, parameters });
