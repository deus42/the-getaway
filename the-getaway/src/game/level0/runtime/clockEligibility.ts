export interface Level0ClockEligibilityContext {
  readonly hasRun: boolean;
  readonly menuOpen: boolean;
  readonly sceneReady: boolean;
  readonly documentHidden: boolean;
}

export const shouldAdvanceLevel0Clock = ({
  hasRun,
  menuOpen,
  sceneReady,
  documentHidden,
}: Level0ClockEligibilityContext): boolean =>
  hasRun && !menuOpen && sceneReady && !documentHidden;
