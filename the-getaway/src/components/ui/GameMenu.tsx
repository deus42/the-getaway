import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { SUPPORTED_LOCALES, Locale } from "../../content/locales";
import { getUIStrings } from "../../content/ui";
import { setLocale } from "../../store/settingsSlice";
import { applyLocaleToQuests } from "../../store/questsSlice";
import { applyLocaleToWorld } from "../../store/worldSlice";
import { RootState, AppDispatch } from "../../store";

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
          <p
            style={{
              fontSize: "0.875rem",
              textTransform: "uppercase",
              letterSpacing: "0.35em",
              color: "#60a5fa",
              marginBottom: "0.75rem",
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
            }}
          >
            {strings.menu.title}
          </h1>
          <p
            style={{
              fontSize: "1rem",
              lineHeight: 1.6,
              color: "#94a3b8",
              maxWidth: "28ch",
            }}
          >
            {strings.menu.tagline}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <button
            type="button"
            data-testid="start-new-game"
            onClick={onStartNewGame}
            style={{
              width: "100%",
              padding: "1rem",
              borderRadius: "12px",
              border: "1px solid #4ade80",
              background:
                "linear-gradient(135deg, rgba(74,222,128,0.75), rgba(34,197,94,0.65))",
              color: "#0f172a",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "transform 120ms ease, box-shadow 120ms ease",
            }}
          >
            {strings.menu.start}
          </button>

          <button
            type="button"
            data-testid="continue-game"
            onClick={onContinue}
            disabled={!hasActiveGame}
            style={{
              width: "100%",
              padding: "1rem",
              borderRadius: "12px",
              border: "1px solid rgba(148,163,184,0.25)",
              backgroundColor: hasActiveGame
                ? "rgba(15,23,42,0.75)"
                : "rgba(15,23,42,0.45)",
              color: hasActiveGame ? "#e2e8f0" : "#64748b",
              fontSize: "1rem",
              fontWeight: 500,
              cursor: hasActiveGame ? "pointer" : "not-allowed",
              transition: "transform 120ms ease, box-shadow 120ms ease",
            }}
          >
            {strings.menu.resume}
          </button>
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
