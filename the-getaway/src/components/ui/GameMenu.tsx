import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { SUPPORTED_LOCALES, Locale } from "../../content/locales";
import { getUIStrings } from "../../content/ui";
import {
  setLocale,
  setTestMode,
  setAutoBattleEnabled,
  setAutoBattleProfile,
  setLightsEnabled,
} from "../../store/settingsSlice";
import { applyLocaleToQuests } from "../../store/questsSlice";
import { applyLocaleToWorld } from "../../store/worldSlice";
import { applyLocaleToMissions } from "../../store/missionSlice";
import { RootState, AppDispatch } from "../../store";
import { GAME_VERSION, GAME_YEAR } from "../../version";
import EnhancedButton from "./EnhancedButton";
import { gradientTextStyle } from "./theme";
import { AUTO_BATTLE_PROFILE_IDS } from "../../game/combat/automation/autoBattleProfiles";
import type { AutoBattleProfileId } from "../../game/combat/automation/autoBattleProfiles";
import AutoBattleProfileSelect from "./AutoBattleProfileSelect";
import { updateVisualSettings } from "../../game/settings/visualSettings";
import { setOverlayEnabled } from "../../store/surveillanceSlice";

const classNames = (
  ...classes: Array<string | false | null | undefined>
) => classes.filter(Boolean).join(" ");

interface GameMenuProps {
  onStartNewGame: () => void;
  onContinue: () => void;
  hasActiveGame: boolean;
}

const GameMenu: React.FC<GameMenuProps> = ({
  onStartNewGame,
  onContinue,
  hasActiveGame,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const locale = useSelector((state: RootState) => state.settings.locale);
  const testMode = useSelector((state: RootState) => state.settings.testMode);
  const autoBattleEnabled = useSelector(
    (state: RootState) => state.settings.autoBattleEnabled
  );
  const autoBattleProfile = useSelector(
    (state: RootState) => state.settings.autoBattleProfile
  );
  const lightsEnabled = useSelector(
    (state: RootState) => state.settings.lightsEnabled
  );
  const surveillanceOverlayEnabled = useSelector(
    (state: RootState) => state.surveillance.hud.overlayEnabled
  );
  const strings = getUIStrings(locale);
  const autoBattleStrings = strings.autoBattle;

  const sectionLabelClass =
    "mb-[0.65rem] block text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]";
  const toggleContainerClass =
    "hud-menu-toggle flex cursor-pointer items-center gap-[0.75rem] rounded-[8px] border border-[rgba(148,163,184,0.25)] bg-[rgba(30,41,59,0.5)] px-[1rem] py-[0.75rem] transition-[background-color,border-color,box-shadow] duration-200 hover:border-[rgba(56,189,248,0.35)] hover:bg-[rgba(30,41,59,0.7)] hover:shadow-[0_0_12px_rgba(56,189,248,0.15)]";
  const languageButtonBaseClass =
    "hud-menu-language-button rounded-[8px] border border-[rgba(148,163,184,0.25)] bg-[rgba(30,41,59,0.5)] px-[1.1rem] py-[0.6rem] text-[0.9rem] font-normal tracking-[0.03em] text-[#94a3b8] transition-all duration-200 hover:border-[rgba(56,189,248,0.4)] hover:text-[#f8fafc] hover:shadow-[0_0_12px_rgba(56,189,248,0.15)]";
  const languageButtonActiveClass =
    "border-2 border-[rgba(56,189,248,0.6)] bg-[rgba(56,189,248,0.15)] font-semibold text-[#e2e8f0] shadow-[0_0_15px_rgba(56,189,248,0.2)]";

  const handleLocaleSelect = (nextLocale: Locale) => {
    if (nextLocale === locale) {
      return;
    }

    dispatch(setLocale(nextLocale));
    dispatch(applyLocaleToQuests(nextLocale));
    dispatch(applyLocaleToWorld(nextLocale));
    dispatch(applyLocaleToMissions(nextLocale));
  };

  const handleTestModeToggle = () => {
    dispatch(setTestMode(!testMode));
  };

  const handleAutoBattleToggle = () => {
    dispatch(setAutoBattleEnabled(!autoBattleEnabled));
  };

  const handleAutoBattleProfileChange = (nextProfile: AutoBattleProfileId) => {
    if (nextProfile === autoBattleProfile) {
      return;
    }
    dispatch(setAutoBattleProfile(nextProfile));
  };

  const handleLightingToggle = () => {
    const next = !lightsEnabled;
    dispatch(setLightsEnabled(next));
    updateVisualSettings({ lightsEnabled: next });
  };

  const handleSurveillanceToggle = () => {
    dispatch(setOverlayEnabled({ enabled: !surveillanceOverlayEnabled }));
  };

  const profileOptions = AUTO_BATTLE_PROFILE_IDS.map((profileId) => ({
    id: profileId,
    name: autoBattleStrings.profiles[profileId].name,
    summary: autoBattleStrings.profiles[profileId].summary,
  }));
  const selectedProfileCopy = autoBattleStrings.profiles[autoBattleProfile];

  return (
    <div
      data-testid="game-menu"
      className="hud-menu-backdrop fixed inset-0 z-[80] flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.15),rgba(17,24,39,0.95))] font-body text-hud-text backdrop-blur-[4px]"
    >
      <div className="hud-menu-modal flex w-[min(520px,92%)] max-h-[90vh] flex-col overflow-y-auto rounded-[18px] border border-[rgba(148,163,184,0.25)] bg-[rgba(15,23,42,0.92)] px-[2.25rem] py-[2rem] text-[#f8fafc] shadow-[0_24px_50px_rgba(15,23,42,0.45)]">
        <div className="mb-[2rem] flex flex-col items-center text-center">
          <div className="mb-[1.25rem] flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="h-[68px] w-[68px]">
              <defs>
                <linearGradient id="menuBgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" stopOpacity={1} />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="menuGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={1} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={1} />
                </linearGradient>
              </defs>
              <circle cx="32" cy="32" r="32" fill="url(#menuBgGradient)" />
              <path d="M32 16 L46 24 L32 32 L18 24 Z" fill="#475569" opacity="0.6" />
              <circle cx="32" cy="32" r="10" fill="none" stroke="url(#menuGlowGradient)" strokeWidth="2.5" />
              <circle cx="32" cy="32" r="6" fill="none" stroke="url(#menuGlowGradient)" strokeWidth="1.5" />
              <line x1="32" y1="22" x2="32" y2="26" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
              <line x1="32" y1="38" x2="32" y2="42" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
              <line x1="22" y1="32" x2="26" y2="32" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
              <line x1="38" y1="32" x2="42" y2="32" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
              <circle cx="32" cy="32" r="2" fill="#38bdf8" />
              <path d="M8 8 L12 8 L12 12" fill="none" stroke="#0ea5e9" strokeWidth="1.5" opacity={0.4} />
              <path d="M56 8 L52 8 L52 12" fill="none" stroke="#0ea5e9" strokeWidth="1.5" opacity={0.4} />
              <path d="M8 56 L12 56 L12 52" fill="none" stroke="#0ea5e9" strokeWidth="1.5" opacity={0.4} />
              <path d="M56 56 L52 56 L52 52" fill="none" stroke="#0ea5e9" strokeWidth="1.5" opacity={0.4} />
            </svg>
          </div>
          <p className="mb-[0.75rem] text-[0.875rem] uppercase tracking-[0.35em] text-[#60a5fa]">
            {strings.menu.tag}
          </p>
          <h1
            className="mb-[0.75rem] text-[2.5rem] font-bold leading-[1.05]"
            style={{
              ...gradientTextStyle("#bfdbfe", "#38bdf8"),
              filter: "drop-shadow(0 0 20px rgba(56, 189, 248, 0.5))",
            }}
          >
            {strings.menu.title}
          </h1>
          <p className="mx-auto text-[1rem] leading-[1.6] text-[#94a3b8]">{strings.menu.tagline}</p>
        </div>

        <div className="flex flex-col gap-[1.15rem]">
          <EnhancedButton
            data-testid="start-new-game"
            onClick={onStartNewGame}
            variant="success"
            size="large"
            fullWidth
            icon="▶"
          >
            {strings.menu.start}
          </EnhancedButton>

          <EnhancedButton
            data-testid="continue-game"
            onClick={onContinue}
            variant="secondary"
            size="large"
            fullWidth
            disabled={!hasActiveGame}
          >
            {strings.menu.resume}
          </EnhancedButton>
        </div>

        <div className="hud-menu-section mt-[2rem] flex flex-col gap-[1.5rem] rounded-[14px] border border-[rgba(148,163,184,0.25)] bg-[rgba(15,23,42,0.6)] p-[1.5rem]">
          <div className="hud-menu-section__header border-b border-[rgba(148,163,184,0.15)] pb-[1rem]">
            <h2 className="m-0 text-[1.1rem] font-semibold uppercase tracking-[0.05em] text-[#e2e8f0]">
              {strings.menu.settingsHeading}
            </h2>
          </div>

          <div>
            <label className={sectionLabelClass}>
              {strings.menu.languageLabel}
            </label>
            <div className="hud-menu-language-list flex flex-wrap gap-[0.6rem]">
              {SUPPORTED_LOCALES.map((localeOption) => {
                const isActive = localeOption === locale;
                return (
                  <button
                    type="button"
                    key={localeOption}
                    onClick={() => handleLocaleSelect(localeOption)}
                    className={classNames(
                      languageButtonBaseClass,
                      isActive && languageButtonActiveClass
                    )}
                  >
                    {strings.menu.languageNames[localeOption]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={sectionLabelClass}>
              {autoBattleStrings.heading}
            </label>
            <div className="flex flex-col gap-[1.15rem]">
              <label className={toggleContainerClass}>
                <input
                  type="checkbox"
                  checked={autoBattleEnabled}
                  onChange={handleAutoBattleToggle}
                  className="h-5 w-5 cursor-pointer accent-[#38bdf8]"
                />
                <div className="flex-1">
                  <div className="text-[0.95rem] font-medium text-[#e2e8f0]">
                    {autoBattleStrings.toggleLabel}
                  </div>
                  <div className="mt-[0.15rem] text-[0.75rem] text-[#94a3b8]">
                    {autoBattleStrings.toggleDescription}
                  </div>
                </div>
              </label>

              <div className="flex flex-col gap-[0.75rem]">
                <label
                  htmlFor="auto-battle-profile-select"
                  className="mb-[0.5rem] block text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]"
                >
                  {autoBattleStrings.profileLabel}
                </label>
                <div className="text-[0.75rem] text-[#64748b]">
                  {autoBattleStrings.profileDescription}
                </div>
                <AutoBattleProfileSelect
                  triggerId="auto-battle-profile-select"
                  value={autoBattleProfile}
                  onChange={handleAutoBattleProfileChange}
                  options={profileOptions}
                  variant="menu"
                  fullWidth
                />
                <div className="text-[0.82rem] text-[#a5b4d5]">
                  {selectedProfileCopy.summary}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className={sectionLabelClass}>
              {strings.menu.surveillanceLabel}
            </label>
            <label className={toggleContainerClass}>
              <input
                type="checkbox"
                checked={surveillanceOverlayEnabled}
                onChange={handleSurveillanceToggle}
                className="h-5 w-5 cursor-pointer accent-[#38bdf8]"
              />
              <div className="flex-1">
                <div className="text-[0.95rem] font-medium text-[#e2e8f0]">
                  {strings.menu.surveillanceToggleLabel}
                </div>
                <div className="mt-[0.15rem] text-[0.75rem] text-[#94a3b8]">
                  {strings.menu.surveillanceToggleDescription}
                </div>
              </div>
            </label>
          </div>

          <div>
            <label className={sectionLabelClass}>
              {strings.menu.lightingLabel}
            </label>
            <label className={toggleContainerClass}>
              <input
                type="checkbox"
                checked={lightsEnabled}
                onChange={handleLightingToggle}
                className="h-5 w-5 cursor-pointer accent-[#38bdf8]"
              />
              <div className="flex-1">
                <div className="text-[0.95rem] font-medium text-[#e2e8f0]">
                  {strings.menu.lightingToggleLabel}
                </div>
                <div className="mt-[0.15rem] text-[0.75rem] text-[#94a3b8]">
                  {strings.menu.lightingToggleDescription}
                </div>
              </div>
            </label>
          </div>

          {process.env.NODE_ENV === "development" && (
            <div className="flex flex-col gap-[1.15rem]">
              <label className={sectionLabelClass}>
                Developer Options
              </label>
              <label className={toggleContainerClass}>
                <input
                  type="checkbox"
                  checked={testMode}
                  onChange={handleTestModeToggle}
                  className="h-5 w-5 cursor-pointer accent-[#38bdf8]"
                />
                <div className="flex-1">
                  <div className="text-[0.95rem] font-medium text-[#e2e8f0]">
                    Test Mode
                  </div>
                  <div className="mt-[0.15rem] text-[0.75rem] text-[#94a3b8]">
                    Enable testing tools and shortcuts
                  </div>
                </div>
              </label>
            </div>
          )}
        </div>

        <div className="mt-[1.75rem] flex flex-wrap items-center justify-center gap-[0.65rem] text-center text-[0.75rem] uppercase tracking-[0.22em] text-[#64748b]">
          <span>{strings.menu.alphaLabel(GAME_YEAR)}</span>
          <span className="inline-flex items-center gap-[0.35rem] text-[#94a3b8]">
            <span aria-hidden="true">•</span>
            <span>{`v${GAME_VERSION}`}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default GameMenu;
