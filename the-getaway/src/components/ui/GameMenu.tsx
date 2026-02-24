import React, { useState } from "react";
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
import { AUTO_BATTLE_PROFILE_IDS, AutoBattleProfileId } from "../../game/combat/automation/autoBattleProfiles";
import AutoBattleProfileSelect, { AutoBattleMenuOptionId } from "./AutoBattleProfileSelect";
import { updateVisualSettings } from "../../game/settings/visualSettings";
import { setOverlayEnabled } from "../../store/surveillanceSlice";
import { HudLayoutPreset, setHudLayoutOverride } from "../../store/hudLayoutSlice";

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
  const [activeView, setActiveView] = useState<"landing" | "settings">("landing");
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
  const hudLayoutOverride = useSelector(
    (state: RootState) => state.hudLayout.override
  );
  const strings = getUIStrings(locale);
  const autoBattleStrings = strings.autoBattle;
  const hudLayoutSelectValue: 'auto' | HudLayoutPreset =
    hudLayoutOverride ?? 'auto';


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

  const handleLightingToggle = () => {
    const next = !lightsEnabled;
    dispatch(setLightsEnabled(next));
    updateVisualSettings({ lightsEnabled: next });
  };

  const handleSurveillanceToggle = () => {
    dispatch(setOverlayEnabled({ enabled: !surveillanceOverlayEnabled }));
  };

  const handleHudLayoutOverrideSelect = (nextValue: string) => {
    const resolvedValue = nextValue as HudLayoutPreset | 'auto';
    if (resolvedValue === hudLayoutSelectValue) {
      return;
    }
    if (resolvedValue === 'auto') {
      dispatch(setHudLayoutOverride(null));
      return;
    }
    dispatch(setHudLayoutOverride(resolvedValue));
  };

  const hudLayoutOptions: Array<{
    id: 'auto' | HudLayoutPreset;
    name: string;
    summary: string;
  }> = [
    {
      id: 'auto',
      name: strings.menu.hudLayoutOptions.auto,
      summary: strings.menu.hudLayoutDescription,
    },
    {
      id: 'exploration',
      name: strings.menu.hudLayoutOptions.exploration,
      summary: strings.menu.hudLayoutDescription,
    },
    {
      id: 'stealth',
      name: strings.menu.hudLayoutOptions.stealth,
      summary: strings.menu.hudLayoutDescription,
    },
    {
      id: 'combat',
      name: strings.menu.hudLayoutOptions.combat,
      summary: strings.menu.hudLayoutDescription,
    },
  ];

  const selectedHudLayoutCopy =
    hudLayoutOptions.find((option) => option.id === hudLayoutSelectValue)
    ?? hudLayoutOptions[0];

  const handleAutoBattleModeChange = (nextMode: string) => {
    const currentMode = autoBattleEnabled ? autoBattleProfile : "manual";
    if (nextMode === currentMode) {
      return;
    }

    if (nextMode === "manual") {
      if (autoBattleEnabled) {
        dispatch(setAutoBattleEnabled(false));
      }
      return;
    }

    if (!autoBattleEnabled) {
      dispatch(setAutoBattleEnabled(true));
    }
    if (nextMode !== autoBattleProfile) {
      dispatch(setAutoBattleProfile(nextMode as AutoBattleProfileId));
    }
  };

  const autoBattleModeOptions: Array<{
    id: AutoBattleMenuOptionId;
    name: string;
    summary: string;
  }> = [
    {
      id: "manual",
      name: autoBattleStrings.manualOption.name,
      summary: autoBattleStrings.manualOption.summary,
    },
    ...AUTO_BATTLE_PROFILE_IDS.map((profileId) => ({
      id: profileId,
      name: autoBattleStrings.profiles[profileId].name,
      summary: autoBattleStrings.profiles[profileId].summary,
    })),
  ];
  const activeModeId: AutoBattleMenuOptionId = autoBattleEnabled ? autoBattleProfile : "manual";
  const selectedModeCopy =
    autoBattleModeOptions.find((option) => option.id === activeModeId) ?? autoBattleModeOptions[0];

  const sectionLabelClass =
    "mb-[0.5rem] block text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]";
  const toggleContainerClass =
    "hud-menu-toggle flex cursor-pointer items-center gap-[0.65rem] rounded-[8px] border border-[rgba(148,163,184,0.25)] bg-[rgba(30,41,59,0.5)] px-[0.85rem] py-[0.5rem] transition-[background-color,border-color,box-shadow] duration-200 hover:border-[rgba(56,189,248,0.35)] hover:bg-[rgba(30,41,59,0.7)] hover:shadow-[0_0_12px_rgba(56,189,248,0.15)]";
  const languageButtonBaseClass =
    "hud-menu-language-button rounded-[8px] border border-[rgba(148,163,184,0.25)] bg-[rgba(30,41,59,0.5)] px-[0.9rem] py-[0.5rem] text-[0.86rem] font-normal tracking-[0.03em] text-[#94a3b8] transition-all duration-200 hover:border-[rgba(56,189,248,0.4)] hover:text-[#f8fafc] hover:shadow-[0_0_12px_rgba(56,189,248,0.15)]";
  const languageButtonActiveClass =
    "border-2 border-[rgba(56,189,248,0.6)] bg-[rgba(56,189,248,0.15)] font-semibold text-[#e2e8f0] shadow-[0_0_15px_rgba(56,189,248,0.2)]";

  const renderPrimaryActions = () => {
    return (
      <div className="flex flex-col gap-[1.25rem]">
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
    );
  };

  return (
    <div
      data-testid="game-menu"
      data-controller-focus-ignore="true"
      className="hud-menu-backdrop fixed inset-0 z-[80] flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.15),rgba(17,24,39,0.95))] font-body text-hud-text backdrop-blur-[4px]"
    >
      <div className="hud-menu-modal flex w-[min(520px,92%)] max-h-[90vh] flex-col overflow-y-auto rounded-[18px] border border-[rgba(148,163,184,0.25)] bg-[rgba(15,23,42,0.92)] px-[2.25rem] py-[1.85rem] text-[#f8fafc] shadow-[0_24px_50px_rgba(15,23,42,0.45)]">
        <div className="mb-[0.9rem] flex flex-col items-center text-center">
          <div className="mb-[1.1rem] flex justify-center">
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
            className="mb-[0.45rem] text-[2.48rem] font-bold"
            style={{
              ...gradientTextStyle("#bfdbfe", "#38bdf8"),
              filter: "drop-shadow(0 0 20px rgba(56, 189, 248, 0.5))",
              lineHeight: "1.08",
              paddingBottom: "0.1rem",
            }}
          >
            {strings.menu.title}
          </h1>
        </div>

        {activeView === "landing" ? (
          <>
            {renderPrimaryActions()}

            <div className="mt-[1.1rem]">
              <EnhancedButton
                data-testid="menu-open-settings"
                onClick={() => setActiveView("settings")}
                variant="primary"
                size="large"
                fullWidth
              >
                {strings.menu.settingsCTA}
              </EnhancedButton>
            </div>
          </>
        ) : (
          <div
            data-testid="menu-settings-panel"
            className="hud-menu-section mt-[0.35rem] flex flex-col gap-[0.9rem] rounded-[14px] border border-[rgba(148,163,184,0.25)] bg-[rgba(15,23,42,0.6)] p-[0.82rem]"
          >
            <div className="hud-menu-section__header border-b border-[rgba(148,163,184,0.15)] pb-[0.5rem]">
              <h2 className="m-0 text-[0.95rem] font-semibold uppercase tracking-[0.05em] text-[#e2e8f0]">
                {strings.menu.settingsHeading}
              </h2>
            </div>

            <div className="flex flex-col gap-[0.75rem]">
              <div>
                <label className={sectionLabelClass}>
                  {strings.menu.languageLabel}
                </label>
                <div className="hud-menu-language-list flex flex-wrap gap-[0.45rem]">
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
                <label className={sectionLabelClass} htmlFor="auto-battle-mode-select">
                  {autoBattleStrings.heading}
                </label>
                <div className="flex flex-col gap-[0.4rem]">
                  <AutoBattleProfileSelect
                    triggerId="auto-battle-mode-select"
                    value={activeModeId}
                    onChange={handleAutoBattleModeChange}
                    options={autoBattleModeOptions}
                    variant="menu"
                    fullWidth
                    dataFocusIgnore
                    triggerTestId="menu-autobattle-dropdown"
                  />
                  <div className="text-[0.64rem] text-[#a5b4d5] leading-[1.35]">
                    {selectedModeCopy.summary}
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
                    <div className="mt-[0.1rem] text-[0.66rem] text-[#94a3b8]">
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
                    <div className="mt-[0.1rem] text-[0.66rem] text-[#94a3b8]">
                      {strings.menu.lightingToggleDescription}
                    </div>
                  </div>
                </label>
              </div>

              <div>
                <label className={sectionLabelClass} htmlFor="hud-layout-select">
                  {strings.menu.hudLayoutLabel}
                </label>
                <div className="flex flex-col gap-[0.35rem]">
                  <AutoBattleProfileSelect
                    triggerId="hud-layout-select"
                    value={hudLayoutSelectValue}
                    onChange={handleHudLayoutOverrideSelect}
                    options={hudLayoutOptions}
                    variant="menu"
                    fullWidth
                    dataFocusIgnore
                    triggerTestId="menu-hud-layout-dropdown"
                  />
                  <div className="text-[0.64rem] leading-[1.35] text-[#a5b4d5]">
                    {selectedHudLayoutCopy.summary}
                  </div>
                </div>
              </div>

              {process.env.NODE_ENV === "development" && (
                <div>
                  <label className={sectionLabelClass}>Developer Options</label>
                  <div className="flex flex-col gap-[0.4rem]">
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
                        <div className="mt-[0.1rem] text-[0.66rem] text-[#94a3b8]">
                          Enable testing tools and shortcuts
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === "settings" && (
          <div className="mt-[0.75rem]">
            <EnhancedButton
              data-testid="menu-close-settings"
              onClick={() => setActiveView("landing")}
              variant="secondary"
              size="medium"
              fullWidth
            >
              {strings.menu.settingsBack}
            </EnhancedButton>
          </div>
        )}

        <div className="mt-[1.1rem] flex flex-wrap items-center justify-center gap-[0.65rem] text-center text-[0.75rem] uppercase tracking-[0.22em] text-[#64748b]">
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
