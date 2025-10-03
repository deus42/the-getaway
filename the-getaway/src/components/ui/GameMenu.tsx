import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { SUPPORTED_LOCALES, Locale } from "../../content/locales";
import { getUIStrings } from "../../content/ui";
import { setLocale } from "../../store/settingsSlice";
import { applyLocaleToQuests } from "../../store/questsSlice";
import { applyLocaleToWorld } from "../../store/worldSlice";
import { RootState, AppDispatch } from "../../store";
import EnhancedButton from "./EnhancedButton";
import { gradientTextStyle } from "./theme";

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
  const strings = getUIStrings(locale);

  const handleLocaleSelect = (nextLocale: Locale) => {
    if (nextLocale === locale) {
      return;
    }

    dispatch(setLocale(nextLocale));
    dispatch(applyLocaleToQuests(nextLocale));
    dispatch(applyLocaleToWorld(nextLocale));
  };

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
          width: "min(420px, 90%)",
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
          <div data-testid="start-new-game">
            <EnhancedButton
              onClick={onStartNewGame}
              variant="success"
              size="large"
              fullWidth
              icon="▶"
            >
              {strings.menu.start}
            </EnhancedButton>
          </div>

          <div data-testid="continue-game">
            <EnhancedButton
              onClick={onContinue}
              variant="secondary"
              size="large"
              fullWidth
              disabled={!hasActiveGame}
            >
              {strings.menu.resume}
            </EnhancedButton>
          </div>
        </div>

        <div
          style={{
            marginTop: "2rem",
            padding: "1.25rem",
            borderRadius: "14px",
            border: "1px solid rgba(148,163,184,0.25)",
            backgroundColor: "rgba(15,23,42,0.6)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.15rem",
                fontWeight: 600,
                margin: 0,
                marginBottom: "0.35rem",
              }}
            >
              {strings.menu.settingsHeading}
            </h2>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#cbd5f5",
                margin: 0,
              }}
            >
              {strings.menu.languageLabel}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {SUPPORTED_LOCALES.map((localeOption) => {
              const isActive = localeOption === locale;
              return (
                <button
                  type="button"
                  key={localeOption}
                  onClick={() => handleLocaleSelect(localeOption)}
                  style={{
                    padding: "0.5rem 0.9rem",
                    borderRadius: "999px",
                    border: isActive
                      ? "1px solid rgba(96,165,250,0.75)"
                      : "1px solid rgba(148,163,184,0.3)",
                    backgroundColor: isActive
                      ? "rgba(37,99,235,0.35)"
                      : "rgba(15,23,42,0.6)",
                    color: isActive ? "#e2e8f0" : "#94a3b8",
                    fontSize: "0.85rem",
                    letterSpacing: "0.05em",
                    cursor: "pointer",
                  }}
                >
                  {strings.menu.languageNames[localeOption]}
                </button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            marginTop: "2.5rem",
            fontSize: "0.75rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#64748b",
            textAlign: "center",
          }}
        >
          {strings.menu.alphaLabel(new Date().getFullYear())}
        </div>
      </div>
    </div>
  );
};

export default GameMenu;
