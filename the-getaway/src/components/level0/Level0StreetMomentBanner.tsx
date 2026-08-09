import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import type { Level0RunState } from '../../game/level0/runtime/types';
import { playLevel0FeedbackCue } from '../../game/feedback/audioCues';
import {
  getStreetMomentContent,
  LEVEL0_STREET_MOMENT_CONTENT,
  streetStageAt,
} from '../../game/level0/city/streetMoments';
import type { StreetMomentId } from '../../game/level0/runtime/worldClock';
import { localizeLevel0CityCopy } from '../../game/level0/city/routeNames';
import {
  computeAmbienceGain,
  LEVEL0_AMBIENCE_EMITTERS,
} from '../../game/level0/audio/thresholdAmbience';
import { LEVEL0_LAYOUT_CONTRACT } from '../../content/levels/level0/layoutContract';
import './Level0StreetMomentBanner.css';

const ANNOUNCEMENT_VISIBLE_MS = 4_500;
const CAPTION_GAIN_THRESHOLD = 0.06;
const NO_CLOCK_EVENTS: string[] = [];

const isStreetMomentId = (id: string): id is StreetMomentId =>
  id in LEVEL0_STREET_MOMENT_CONTENT;

const AMBIENCE_CAPTION_SOURCES = Object.values(LEVEL0_AMBIENCE_EMITTERS).flatMap(
  (definition) => {
    const anchor = LEVEL0_LAYOUT_CONTRACT.anchors.find(
      (candidate) => candidate.id === definition.anchorId
    );
    return anchor
      ? [{ definition, x: anchor.position.x, y: anchor.position.y, radius: anchor.radius }]
      : [];
  }
);

export interface Level0StreetMomentBannerProps {
  run: Level0RunState;
}

// Street moments must always READ even when the provisional audio cues cannot
// play, so PA text is the guaranteed channel. The queue consumes the ordered
// authoritative clock-event stream: an explicit jump that crosses several
// boundaries announces every crossing in order, one at a time.
const Level0StreetMomentBanner = ({ run }: Level0StreetMomentBannerProps) => {
  const locale = useSelector((state: RootState) => state.settings.locale);
  const clockEventIds = useSelector(
    (state: RootState) => state.level0Runtime?.clockEventIds ?? NO_CLOCK_EVENTS
  );
  const ukrainian = locale === 'uk';
  const [queue, setQueue] = useState<StreetMomentId[]>([]);
  const announcedCueRef = useRef<StreetMomentId | null>(null);
  const processedSignatureRef = useRef('');
  const previousRunRef = useRef({
    sessionId: run.sessionId,
    currentMinute: run.worldClock.currentMinute,
  });

  useEffect(() => {
    const previous = previousRunRef.current;
    const attemptReset =
      previous.sessionId !== run.sessionId ||
      run.worldClock.currentMinute < previous.currentMinute;
    previousRunRef.current = {
      sessionId: run.sessionId,
      currentMinute: run.worldClock.currentMinute,
    };
    if (!attemptReset) return;
    processedSignatureRef.current = '';
    announcedCueRef.current = null;
    setQueue([]);
  }, [run.sessionId, run.worldClock.currentMinute]);

  const clockEventSignature = clockEventIds.join('|');
  useEffect(() => {
    if (!clockEventSignature || processedSignatureRef.current === clockEventSignature) return;
    processedSignatureRef.current = clockEventSignature;
    const streetIds = clockEventSignature.split('|').filter(isStreetMomentId);
    if (streetIds.length === 0) return;
    setQueue((current) => [...current, ...streetIds]);
  }, [clockEventSignature]);

  const activeId = queue[0] ?? null;

  useEffect(() => {
    if (!activeId) return undefined;
    if (announcedCueRef.current !== activeId) {
      announcedCueRef.current = activeId;
      playLevel0FeedbackCue(activeId === 'clock.2330' ? 'last-train' : 'street-pa');
    }
    const timer = window.setTimeout(() => {
      setQueue((current) => current.slice(1));
    }, ANNOUNCEMENT_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [activeId]);

  const active = activeId ? getStreetMomentContent(activeId) : null;

  const stage = streetStageAt(run.worldClock.currentMinute);
  const playerPosition = run.player.position;
  const nearbyCaption = AMBIENCE_CAPTION_SOURCES.reduce<
    { text: string; gain: number } | null
  >((best, source) => {
    const gain = computeAmbienceGain(source.definition, {
      distance: Math.hypot(playerPosition.x - source.x, playerPosition.y - source.y),
      radius: source.radius,
      stage,
    });
    if (gain < CAPTION_GAIN_THRESHOLD || (best && best.gain >= gain)) return best;
    return { text: localizeLevel0CityCopy(source.definition.subtitle, ukrainian), gain };
  }, null);

  return (
    <div
      className="level0-street-moments"
      data-testid="level0-street-moment-banner"
      aria-live="polite"
    >
      {active ? (
        <div
          className="level0-street-moments__announcement"
          data-testid="level0-street-announcement"
          data-moment-id={active.id}
        >
          <div className="level0-street-moments__announcement-kicker">
            {localizeLevel0CityCopy(active.subtitle, ukrainian)}
          </div>
          <div>{localizeLevel0CityCopy(active.announcement, ukrainian)}</div>
        </div>
      ) : null}
      {nearbyCaption ? (
        <div
          className="level0-street-moments__caption"
          data-testid="level0-ambience-caption"
        >
          {`♪ ${nearbyCaption.text}`}
        </div>
      ) : null}
    </div>
  );
};

export default Level0StreetMomentBanner;
