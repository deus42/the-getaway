import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { SUPPORTED_LOCALES, Locale } from "../../content/locales";
import { getUIStrings } from "../../content/ui";
import {
  setLocale,
  setTestMode,
  setAutoBattleEnabled,
  setAutoBattleProfile,
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
  const strings = getUIStrings(locale);
  const autoBattleStrings = strings.autoBattle;

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

  const profileOptions = AUTO_BATTLE_PROFILE_IDS.map((profileId) => ({
    id: profileId,
    name: autoBattleStrings.profiles[profileId].name,
    summary: autoBattleStrings.profiles[profileId].summary,
  }));
  const selectedProfileCopy = autoBattleStrings.profiles[autoBattleProfile];

  return (
    <div
      data-testid="game-menu"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top, rgba(96,165,250,0.15), rgba(17,24,39,0.95))",
        backdropFilter: "blur(4px)",
        color: "#f8fafc",
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: "min(580px, 90%)",
          padding: "2.5rem",
          borderRadius: "18px",
          backgroundColor: "rgba(15,23,42,0.92)",
          border: "1px solid rgba(148,163,184,0.25)",
          boxShadow: "0 24px 50px rgba(15, 23, 42, 0.45)",
        }}
      >
        <div style={{ marginBottom: "2.5rem" }}>
          {/* Logo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" style={{ width: "80px", height: "80px" }}>
              <defs>
                <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#1e293b", stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: "#0f172a", stopOpacity: 1 }} />
                </linearGradient>
                <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#38bdf8", stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: "#0ea5e9", stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <circle cx="32" cy="32" r="32" fill="url(#bgGradient)"/>
              <path d="M32 16 L46 24 L32 32 L18 24 Z" fill="#475569" opacity="0.6"/>
              <circle cx="32" cy="32" r="10" fill="none" stroke="url(#glowGradient)" strokeWidth="2.5"/>
              <circle cx="32" cy="32" r="6" fill="none" stroke="url(#glowGradient)" strokeWidth="1.5"/>
              <line x1="32" y1="22" x2="32" y2="26" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"/>
              <line x1="32" y1="38" x2="32" y2="42" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"/>
              <line x1="22" y1="32" x2="26" y2="32" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"/>
              <line x1="38" y1="32" x2="42" y2="32" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="32" cy="32" r="2" fill="#38bdf8"/>
              <path d="M8 8 L12 8 L12 12" fill="none" stroke="#0ea5e9" strokeWidth="1.5" opacity="0.4"/>
              <path d="M56 8 L52 8 L52 12" fill="none" stroke="#0ea5e9" strokeWidth="1.5" opacity="0.4"/>
              <path d="M8 56 L12 56 L12 52" fill="none" stroke="#0ea5e9" strokeWidth="1.5" opacity="0.4"/>
              <path d="M56 56 L52 56 L52 52" fill="none" stroke="#0ea5e9" strokeWidth="1.5" opacity="0.4"/>
            </svg>
          </div>

          <p
            style={{
              fontSize: "0.875rem",
              textTransform: "uppercase",
              letterSpacing: "0.35em",
              color: "#60a5fa",
              marginBottom: "0.75rem",
              textAlign: "center",
            }}
          >
            {strings.menu.tag}
          </p>
          <h1
            style={{
              fontSize: "2.5rem",
              lineHeight: 1.05,
              fontWeight: 700,
              marginBottom: "0.75rem",
              textAlign: "center",
              ...gradientTextStyle("#bfdbfe", "#38bdf8"),
              filter: "drop-shadow(0 0 20px rgba(56, 189, 248, 0.5))",
            }}
          >
            {strings.menu.title}
          </h1>
          <p
            style={{
              fontSize: "1rem",
              lineHeight: 1.6,
              color: "#94a3b8",
              textAlign: "center",
              margin: "0 auto",
            }}
          >
            {strings.menu.tagline}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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

        <div
          style={{
            marginTop: "2rem",
            padding: "1.5rem",
            borderRadius: "14px",
            border: "1px solid rgba(148,163,184,0.25)",
            backgroundColor: "rgba(15,23,42,0.6)",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          {/* Settings Header */}
          <div style={{ borderBottom: "1px solid rgba(148,163,184,0.15)", paddingBottom: "0.75rem" }}>
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                margin: 0,
                color: "#e2e8f0",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {strings.menu.settingsHeading}
            </h2>
          </div>

          {/* Language Section */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                color: "#94a3b8",
                marginBottom: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              {strings.menu.languageLabel}
            </label>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              {SUPPORTED_LOCALES.map((localeOption) => {
                const isActive = localeOption === locale;
                return (
                  <button
                    type="button"
                    key={localeOption}
                    onClick={() => handleLocaleSelect(localeOption)}
                    style={{
                      padding: "0.6rem 1.1rem",
                      borderRadius: "8px",
                      border: isActive
                        ? "2px solid rgba(56,189,248,0.6)"
                        : "1px solid rgba(148,163,184,0.25)",
                      backgroundColor: isActive
                        ? "rgba(56,189,248,0.15)"
                        : "rgba(30,41,59,0.5)",
                      color: isActive ? "#e2e8f0" : "#94a3b8",
                      fontSize: "0.9rem",
                      fontWeight: isActive ? 600 : 400,
                      letterSpacing: "0.03em",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: isActive ? "0 0 15px rgba(56,189,248,0.2)" : "none",
                    }}
                  >
                    {strings.menu.languageNames[localeOption]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AutoBattle Section */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                color: "#94a3b8",
                marginBottom: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              {autoBattleStrings.heading}
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  backgroundColor: "rgba(30,41,59,0.5)",
                  border: "1px solid rgba(148,163,184,0.25)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(30,41,59,0.7)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(30,41,59,0.5)";
                }}
              >
                <input
                  type="checkbox"
                  checked={autoBattleEnabled}
                  onChange={handleAutoBattleToggle}
                  style={{
                    width: "20px",
                    height: "20px",
                    cursor: "pointer",
                    accentColor: "#38bdf8",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.95rem", color: "#e2e8f0", fontWeight: 500 }}>
                    {autoBattleStrings.toggleLabel}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.15rem" }}>
                    {autoBattleStrings.toggleDescription}
                  </div>
                </div>
              </label>

              <div>
                <label
                  htmlFor="auto-battle-profile-select"
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#94a3b8",
                    marginBottom: "0.5rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                  }}
                >
                  {autoBattleStrings.profileLabel}
                </label>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.6rem" }}>
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
                <div
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.82rem",
                    color: "#a5b4d5",
                  }}
                >
                  {selectedProfileCopy.summary}
                </div>
              </div>
            </div>
          </div>

          {/* Test Mode Section (Dev Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  color: "#94a3b8",
                  marginBottom: "0.65rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                Developer Options
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  backgroundColor: "rgba(30,41,59,0.5)",
                  border: "1px solid rgba(148,163,184,0.25)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(30,41,59,0.7)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(30,41,59,0.5)";
                }}
              >
                <input
                  type="checkbox"
                  checked={testMode}
                  onChange={handleTestModeToggle}
                  style={{
                    width: "20px",
                    height: "20px",
                    cursor: "pointer",
                    accentColor: "#38bdf8",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.95rem", color: "#e2e8f0", fontWeight: 500 }}>
                    Test Mode
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.15rem" }}>
                    Enable testing tools and shortcuts
                  </div>
                </div>
              </label>
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: "2.5rem",
            fontSize: "0.75rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#64748b",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.65rem",
            flexWrap: "wrap",
          }}
        >
          <span>{strings.menu.alphaLabel(GAME_YEAR)}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "#94a3b8" }}>
            <span aria-hidden="true">•</span>
            <span>{`v${GAME_VERSION}`}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default GameMenu;
