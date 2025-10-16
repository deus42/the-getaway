import Phaser from 'phaser';

const fragmentShader = `
precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;
uniform float uScanIntensity;
uniform float uScanDensity;
uniform float uNoiseAmount;

varying vec2 outTexCoord;

float random(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec4 color = texture2D(uMainSampler, outTexCoord);
  float scan = sin(outTexCoord.y * 3.14159 * uScanDensity) * uScanIntensity;
  float noise = (random(outTexCoord + uTime) - 0.5) * uNoiseAmount;
  color.rgb -= scan;
  color.rgb += noise;
  gl_FragColor = color;
}
`;

export class CrtScanlinePipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  public static readonly KEY = 'crtScanline';
  private time = 0;

  constructor(game: Phaser.Game) {
    super({
      name: CrtScanlinePipeline.KEY,
      game,
      renderTarget: true,
      fragShader: fragmentShader,
    });
  }

  public onBoot(): void {
    this.set1f('uScanIntensity', 0.035);
    this.set1f('uScanDensity', 720.0);
    this.set1f('uNoiseAmount', 0.02);
    this.set1f('uTime', this.time);
  }

  public onPreRender(): void {
    this.time += this.game.loop.delta / 1000;
    this.set1f('uTime', this.time);
  }
}
