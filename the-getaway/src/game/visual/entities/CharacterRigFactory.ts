import type { IsoObjectFactory, CharacterToken, CharacterTokenOptions } from '../../utils/IsoObjectFactory';
import type { EntityVisualRole, VisualTheme } from '../contracts';

const resolveOptions = (theme: VisualTheme, role: EntityVisualRole): CharacterTokenOptions => {
  const profile = theme.entityProfiles[role];
  return {
    baseColor: profile.baseColor,
    outlineColor: profile.outlineColor,
    primaryColor: profile.primaryColor,
    accentColor: profile.accentColor,
    glowColor: profile.glowColor,
    columnHeight: profile.columnHeight,
    widthScale: profile.widthScale,
    heightScale: profile.heightScale,
    depthOffset: profile.depthOffset,
  };
};

export class CharacterRigFactory {
  constructor(
    private readonly isoFactory: IsoObjectFactory,
    private readonly theme: VisualTheme
  ) {}

  public createToken(role: EntityVisualRole, gridX: number, gridY: number): CharacterToken {
    return this.isoFactory.createCharacterToken(gridX, gridY, resolveOptions(this.theme, role));
  }

  public positionToken(token: CharacterToken, gridX: number, gridY: number): void {
    this.isoFactory.positionCharacterToken(token, gridX, gridY);
  }
}
