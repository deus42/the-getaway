import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const TacticalHUDFrame: React.FC = () => {
  const { currentMapArea, inCombat } = useSelector((state: RootState) => state.world);
  const [time, setTime] = useState(() => new Date());

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
        <div className="hud-frame-chip" data-state={inCombat ? 'alert' : 'idle'}>
          <span className="text-[0.45rem]">●</span>
          <span>{inCombat ? 'COMBAT' : 'TACTICAL'}</span>
        </div>
        <div className="hud-frame-chip">
          <span>LOC</span>
          <span className="text-slate-100">{currentMapArea?.id ?? 'UNKNOWN'}</span>
        </div>
        <div className="hud-frame-chip">
          <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </div>

      <div className="hud-threat" data-alert={inCombat ? 'true' : 'false'}>
        THREAT LEVEL: {inCombat ? 'HOSTILE' : 'CLEAR'}
      </div>

      <div className="hud-frame-line" data-orientation="top" />
      <div className="hud-frame-line" data-orientation="bottom" />
    </div>
  );
};

export default TacticalHUDFrame;
