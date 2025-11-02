import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

const TacticalHUDFrame: React.FC = () => {
  const { currentMapArea, inCombat, engagementMode } = useSelector(
    (state: RootState) => state.world
  );
  const surveillanceHud = useSelector(
    (state: RootState) => state.surveillance.hud
  );
  const zoneId = useSelector(
    (state: RootState) => state.world.currentMapArea.zoneId
  );
  const zoneHeat = useSelector(
    (state: RootState) => state.suspicion.zones[zoneId]?.heat
  );
  const [time, setTime] = useState(() => new Date());

  const stealthActive = engagementMode === "stealth";
  const isDialog = engagementMode === "dialog";
  const detectionPercent = useMemo(() => {
    const camera = surveillanceHud?.detectionProgress ?? 0;
    const heat = zoneHeat?.totalHeat ?? 0;
    // Normalize heat to 0-100 for display (simple clamp)
    const heatPercent = Math.max(0, Math.min(100, Math.round(heat)));
    return Math.max(camera, heatPercent);
  }, [surveillanceHud?.detectionProgress, zoneHeat?.totalHeat]);

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 select-none font-mono uppercase tracking-[0.18em] text-[#38bdf8]">
      <div className="hud-corner" data-position="top-left" />
      <div className="hud-corner" data-position="top-right" />
      <div className="hud-corner" data-position="bottom-right" />
      <div className="hud-corner" data-position="bottom-left" />

      <div className="hud-frame-top">
        <div
          className="hud-frame-chip"
          data-state={inCombat ? "alert" : stealthActive ? "stealth" : "idle"}
        >
          <span className="text-[0.45rem]">●</span>
          <span>
            {inCombat
              ? "COMBAT"
              : stealthActive
              ? "STEALTH"
              : isDialog
              ? "DIALOG"
              : "TACTICAL"}
          </span>
        </div>
        <div className="hud-frame-chip">
          <span>LOC</span>
          <span className="text-slate-100">
            {currentMapArea?.id ?? "UNKNOWN"}
          </span>
        </div>
        <div className="hud-frame-chip">
          <span>
            {time.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>
      </div>

      <div className="hud-threat" data-alert={inCombat ? "true" : "false"}>
        {stealthActive ? (
          <span>DETECTION: {detectionPercent}%</span>
        ) : isDialog ? (
          <>DIALOG MODE ACTIVE</>
        ) : (
          <>THREAT LEVEL: {inCombat ? "HOSTILE" : "CLEAR"}</>
        )}
      </div>

      <div className="hud-frame-line" data-orientation="top" />
      <div className="hud-frame-line" data-orientation="bottom" />
    </div>
  );
};

export default TacticalHUDFrame;
