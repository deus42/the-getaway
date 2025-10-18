import Phaser from 'phaser';

export interface BloomSettings {
  enabled: boolean;
  color: number;
  offsetX: number;
  offsetY: number;
  blurStrength: number;
  strength: number;
  steps: number;
}

export interface VignetteSettings {
  enabled: boolean;
  x: number;
  y: number;
  radius: number;
  strength: number;
}

export interface ColorMatrixSettings {
  enabled: boolean;
  saturation: number;
  brightness: number;
  contrast: number;
  hue: number;
}

export interface VisualFxSettings {
  bloom: BloomSettings;
  vignette: VignetteSettings;
  colorMatrix: ColorMatrixSettings;
}

const defaultVisualSettings: VisualFxSettings = Object.freeze({
  bloom: {
    enabled: false,
    color: 0xffffff,
    offsetX: 0,
    offsetY: 0,
    blurStrength: 0,
    strength: 0,
    steps: 0,
  },
  vignette: {
    enabled: false,
    x: 0.5,
    y: 0.5,
    radius: 1,
    strength: 0,
  },
  colorMatrix: {
    enabled: false,
    saturation: 0,
    brightness: 1,
    contrast: 0,
    hue: 0,
  },
});

let currentSettings: VisualFxSettings = {
  bloom: { ...defaultVisualSettings.bloom },
  vignette: { ...defaultVisualSettings.vignette },
  colorMatrix: { ...defaultVisualSettings.colorMatrix },
};

type VisualSettingsListener = (settings: VisualFxSettings) => void;

const listeners = new Set<VisualSettingsListener>();

const notify = (): void => {
  listeners.forEach((listener) => listener(currentSettings));
};

export const getVisualSettings = (): VisualFxSettings => ({
  bloom: { ...currentSettings.bloom },
  vignette: { ...currentSettings.vignette },
  colorMatrix: { ...currentSettings.colorMatrix },
});

export const resetVisualSettings = (): void => {
  currentSettings = {
    bloom: { ...defaultVisualSettings.bloom },
    vignette: { ...defaultVisualSettings.vignette },
    colorMatrix: { ...defaultVisualSettings.colorMatrix },
  };
  notify();
};

export const updateVisualSettings = (partial: Partial<VisualFxSettings>): void => {
  currentSettings = {
    bloom: { ...currentSettings.bloom, ...(partial.bloom ?? {}) },
    vignette: { ...currentSettings.vignette, ...(partial.vignette ?? {}) },
    colorMatrix: { ...currentSettings.colorMatrix, ...(partial.colorMatrix ?? {}) },
  };
  notify();
};

export const subscribeToVisualSettings = (listener: VisualSettingsListener): (() => void) => {
  listeners.add(listener);
  listener(currentSettings);
  return () => {
    listeners.delete(listener);
  };
};

const applyBloom = (camera: Phaser.Cameras.Scene2D.Camera, bloom: BloomSettings): void => {
  if (!bloom.enabled) {
    return;
  }

  camera.postFX.addBloom(
    bloom.color,
    bloom.offsetX,
    bloom.offsetY,
    bloom.blurStrength,
    bloom.strength,
    bloom.steps
  );
};

const applyVignette = (camera: Phaser.Cameras.Scene2D.Camera, vignette: VignetteSettings): void => {
  if (!vignette.enabled) {
    return;
  }

  camera.postFX.addVignette(vignette.x, vignette.y, vignette.radius, vignette.strength);
};

const applyColorMatrix = (camera: Phaser.Cameras.Scene2D.Camera, matrixSettings: ColorMatrixSettings): void => {
  if (!matrixSettings.enabled) {
    return;
  }

  const matrix = camera.postFX.addColorMatrix();

  let hasApplied = false;
  const apply = (callback: (multiply: boolean) => void) => {
    callback(hasApplied);
    hasApplied = true;
  };

  if (matrixSettings.saturation !== 0) {
    apply((multiply) => matrix.saturate(matrixSettings.saturation, multiply));
  }

  if (matrixSettings.hue !== 0) {
    apply((multiply) => matrix.hue(matrixSettings.hue, multiply));
  }

  if (matrixSettings.contrast !== 0) {
    apply((multiply) => matrix.contrast(matrixSettings.contrast, multiply));
  }

  if (matrixSettings.brightness !== 1) {
    apply((multiply) => matrix.brightness(matrixSettings.brightness, multiply));
  }
};

export const applyCameraVisualSettings = (camera: Phaser.Cameras.Scene2D.Camera): void => {
  camera.clearFX();

  applyBloom(camera, currentSettings.bloom);
  applyVignette(camera, currentSettings.vignette);
  applyColorMatrix(camera, currentSettings.colorMatrix);
};

export const bindCameraToVisualSettings = (camera: Phaser.Cameras.Scene2D.Camera): (() => void) => {
  const listener = () => applyCameraVisualSettings(camera);
  const unsubscribe = subscribeToVisualSettings(listener);
  return () => {
    unsubscribe();
    camera.clearFX();
  };
};
