import { level0EnglishContent } from '../content/levels/level0/locales/en';
import { level0UkrainianContent } from '../content/levels/level0/locales/uk';

type SkillCheckOptionRef = {
  dialogueId: string;
  nodeId: string;
  nextNodeId: string | null;
  outcomePreview?: {
    summary: string;
    unlocks?: string;
    rewardClaimKey?: string;
  };
};

const collectSkillCheckOptions = (
  dialogues: typeof level0EnglishContent.dialogues
): SkillCheckOptionRef[] => {
  return dialogues.flatMap((dialogue) =>
    dialogue.nodes.flatMap((node) =>
      node.options
        .filter((option) => Boolean(option.skillCheck))
        .map((option) => ({
          dialogueId: dialogue.id,
          nodeId: node.id,
          nextNodeId: option.nextNodeId,
          outcomePreview: option.outcomePreview,
        }))
    )
  );
};

const toIndexKey = (option: SkillCheckOptionRef): string => {
  return `${option.dialogueId}::${option.nodeId}::${option.nextNodeId ?? 'null'}`;
};

describe('dialogue presentation metadata parity', () => {
  it('ensures each EN skill-check option has a localized outcome preview and reward claim key in UK', () => {
    const enOptions = collectSkillCheckOptions(level0EnglishContent.dialogues);
    const ukOptions = collectSkillCheckOptions(level0UkrainianContent.dialogues);
    const ukByKey = new Map(ukOptions.map((option) => [toIndexKey(option), option]));

    expect(enOptions.length).toBeGreaterThan(0);

    enOptions.forEach((enOption) => {
      const key = toIndexKey(enOption);
      const ukOption = ukByKey.get(key);

      expect(ukOption).toBeDefined();
      expect(enOption.outcomePreview?.summary).toBeTruthy();
      expect(enOption.outcomePreview?.rewardClaimKey).toBeTruthy();
      expect(ukOption?.outcomePreview?.summary).toBeTruthy();
      expect(ukOption?.outcomePreview?.rewardClaimKey).toBeTruthy();
      expect(ukOption?.outcomePreview?.rewardClaimKey).toBe(enOption.outcomePreview?.rewardClaimKey);
    });
  });
});
