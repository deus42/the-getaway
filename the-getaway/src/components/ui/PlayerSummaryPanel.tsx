import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import { BACKGROUND_MAP } from "../../content/backgrounds";
import { getUIStrings } from "../../content/ui";
import {
  formatXPDisplay,
  calculateXPForLevel,
} from "../../game/systems/progression";
import { addExperience } from "../../store/playerSlice";
import AnimatedStatBar from "./AnimatedStatBar";
import { WarningIcon } from "./icons";
import { selectParanoiaValue } from "../../store/selectors/paranoiaSelectors";

interface PlayerSummaryPanelProps {
  onOpenCharacter?: () => void;
  characterOpen?: boolean;
  showActionButton?: boolean;
}

const PlayerSummaryPanel: React.FC<PlayerSummaryPanelProps> = ({
  onOpenCharacter,
  characterOpen = false,
  showActionButton = true,
}) => {
  const dispatch = useDispatch();
  const player = useSelector((state: RootState) => state.player.data);
  const paranoiaValue = useSelector(selectParanoiaValue);
  const locale = useSelector((state: RootState) => state.settings.locale);
  const testMode = useSelector((state: RootState) => state.settings.testMode);
  const uiStrings = getUIStrings(locale);
  const background = player.backgroundId
    ? BACKGROUND_MAP[player.backgroundId]
    : undefined;
  const backgroundName =
    background?.name ?? uiStrings.playerStatus.backgroundFallback;
  const roundedParanoia = Math.round(paranoiaValue);
  const movementLabel =
    uiStrings.playerStatus.movementBadge[player.movementProfile] ??
    player.movementProfile.toUpperCase();

  const handleLevelUp = () => {
    const currentLevel = player.level;
    const xpForNextLevel = calculateXPForLevel(currentLevel + 1);
    const currentXP = player.experience;
    const xpNeeded = xpForNextLevel - currentXP;
    dispatch(
      addExperience({
        amount: Math.max(1, xpNeeded),
        reason: "Test mode XP boost",
      })
    );
  };

  return (
    <div
      className="flex flex-col gap-[0.6rem] rounded-[18px] border border-[rgba(59,130,246,0.22)] bg-[linear-gradient(145deg,rgba(8,15,30,0.92),rgba(12,22,42,0.82),rgba(6,12,28,0.92))] px-[0.9rem] py-[0.8rem] text-[#f8fafc] shadow-[0_28px_40px_-24px_rgba(14,116,144,0.45)] backdrop-blur-[14px] font-body"
      data-testid="player-summary-panel"
    >
      <div className="flex items-start justify-between gap-[0.75rem]">
        <div className="flex min-w-0 flex-1 flex-col gap-[0.2rem]">
          <div className="flex items-center gap-[0.5rem] text-[0.9rem] uppercase tracking-[0.26em] text-[#bfdbfe] drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]">
            <span className="truncate">{player.name}</span>
            <span className="inline-flex items-center gap-[0.25rem] rounded-[999px] border border-[rgba(56,189,248,0.45)] bg-[rgba(56,189,248,0.18)] px-[0.55rem] py-[0.22rem] text-[0.6rem] font-semibold tracking-[0.14em] text-[#f8fafc] shadow-[0_10px_20px_-10px_rgba(56,189,248,0.55)]">
              {uiStrings.playerStatus.levelLabel} {player.level}
            </span>
            {player.movementProfile !== "normal" && (
              <span className="inline-flex items-center gap-[0.25rem] rounded-[999px] border border-[rgba(148,163,184,0.65)] bg-[rgba(148,163,184,0.12)] px-[0.55rem] py-[0.22rem] text-[0.55rem] font-semibold tracking-[0.14em] text-[#e2e8f0] shadow-[0_8px_18px_-12px_rgba(148,163,184,0.55)]">
                {movementLabel}
              </span>
            )}
          </div>
          <div className="text-[0.6rem] uppercase tracking-[0.12em] text-[rgba(226,232,240,0.72)]">
            {uiStrings.playerStatus.backgroundLabel}: {backgroundName}
          </div>
        </div>
      </div>

      <AnimatedStatBar
        label={uiStrings.playerStatus.healthLabel}
        current={player.health}
        max={player.maxHealth}
        variant="health"
        lowThreshold={50}
        criticalThreshold={25}
      />

      <AnimatedStatBar
        label={uiStrings.playerStatus.paranoiaLabel}
        current={roundedParanoia}
        max={100}
        variant="paranoia"
        lowThreshold={50}
        criticalThreshold={75}
        dangerDirection="ascending"
      />

      {player.isExhausted && (
        <span
          className="mt-[0.35rem] inline-flex items-center gap-[0.3rem] rounded-[999px] border border-[rgba(250,204,21,0.65)] bg-[rgba(250,204,21,0.08)] px-[0.55rem] py-[0.22rem] text-[0.55rem] font-semibold uppercase tracking-[0.14em] text-[#facc15] shadow-[0_8px_18px_-12px_rgba(250,204,21,0.6)]"
          title={uiStrings.playerStatus.fatigueHint}
        >
          <WarningIcon className="text-[#facc15]" aria-hidden />
          <span>{uiStrings.playerStatus.fatigueStatus}</span>
        </span>
      )}

      <div className="grid grid-cols-2 gap-[0.28rem]">
        <div className="flex min-w-0 flex-col gap-[0.12rem] rounded-[12px] border border-[rgba(248,250,252,0.08)] bg-[linear-gradient(160deg,rgba(14,26,52,0.88),rgba(10,18,34,0.88))] px-[0.5rem] py-[0.45rem] shadow-[0_16px_30px_-20px_rgba(13,148,136,0.6)]">
          <span className="text-[0.5rem] uppercase tracking-[0.12em] text-[rgba(148,163,184,0.7)]">
            {uiStrings.playerStatus.creditsLabel}
          </span>
          <span className="text-[0.85rem] font-semibold text-[#fbbf24] drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">
            ₿{player.credits}
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-[0.12rem] rounded-[12px] border border-[rgba(248,250,252,0.08)] bg-[linear-gradient(160deg,rgba(14,26,52,0.88),rgba(10,18,34,0.88))] px-[0.5rem] py-[0.45rem] shadow-[0_16px_30px_-20px_rgba(13,148,136,0.6)]">
          <span className="text-[0.5rem] uppercase tracking-[0.12em] text-[rgba(148,163,184,0.7)]">
            {uiStrings.playerStatus.experienceLabel}
          </span>
          <span className="text-[0.85rem] font-semibold text-[#38bdf8] drop-shadow-[0_0_12px_rgba(56,189,248,0.45)]">
            {formatXPDisplay(player.experience, player.level)}
          </span>
        </div>
      </div>

      {onOpenCharacter && showActionButton && (
        <div className="mt-[0.2rem] flex gap-[0.5rem]">
          <button
            type="button"
            onClick={onOpenCharacter}
            className={[
              "flex-1 rounded-[999px] border px-[0.75rem] py-[0.42rem] text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-[#e0f2fe] shadow-[0_12px_20px_-18px_rgba(56,189,248,0.45)] transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gunmetal-900",
              characterOpen
                ? "border-[rgba(251,191,36,0.9)] bg-[linear-gradient(130deg,rgba(251,191,36,0.6),rgba(249,115,22,0.55))] text-[#fff7e1]"
                : "border-[rgba(56,189,248,0.55)] bg-[linear-gradient(130deg,rgba(56,189,248,0.48),rgba(14,165,233,0.45))]",
            ].join(" ")}
            data-testid="summary-open-character"
            aria-pressed={characterOpen}
          >
            {uiStrings.shell.characterButton}
          </button>
          {testMode && (
            <button
              type="button"
              onClick={handleLevelUp}
              className="flex-1 rounded-[999px] border border-[rgba(251,191,36,0.9)] bg-[linear-gradient(130deg,rgba(251,191,36,0.48),rgba(249,115,22,0.45))] px-[0.75rem] py-[0.38rem] text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-[#fff8dc] shadow-[0_12px_20px_-16px_rgba(251,191,36,0.48)] transition-transform duration-200 hover:-translate-y-[2px] hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gunmetal-900"
              title="Test Mode: Gain XP to level up"
            >
              ⬆ Level Up
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(PlayerSummaryPanel);
