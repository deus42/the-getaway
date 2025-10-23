import paranoiaReducer, {
  applyParanoiaRelief,
  applyParanoiaStimuli,
  resetParanoiaState,
  setParanoiaRespite,
  tickParanoia,
} from '../paranoiaSlice';
import { PARANOIA_STATE_VERSION } from '../paranoiaSlice';
import { PARANOIA_CONFIG } from '../../content/paranoia/paranoiaConfig';

describe('paranoiaSlice', () => {
  const initial = paranoiaReducer(undefined, resetParanoiaState());

  it('initializes with baseline state', () => {
    expect(initial.version).toBe(PARANOIA_STATE_VERSION);
    expect(initial.tier).toBe('calm');
    expect(initial.value).toBeGreaterThanOrEqual(0);
  });

  it('applies passive decay over time', () => {
    const timestamp = 1_000;
    const state = paranoiaReducer(initial, tickParanoia({ deltaMs: 1_000, timestamp }));
    expect(state.value).toBeLessThan(initial.value);
    expect(state.lastUpdatedAt).toBe(timestamp);
  });

  it('applies stimuli with respite cap', () => {
    const timestamp = 2_000;
    const withRespite = paranoiaReducer(initial, setParanoiaRespite({ durationMs: 10_000, timestamp }));
    const afterStimuli = paranoiaReducer(
      withRespite,
      applyParanoiaStimuli({
        timestamp: timestamp + 100,
        delta: 5,
        deltaMs: 100,
        breakdown: { gains: { cameras: 5 }, losses: {}, spikes: {} },
      })
    );

    expect(afterStimuli.value - withRespite.value).toBeLessThanOrEqual(PARANOIA_CONFIG.respite.maxGainPerTick);
  });

  it('honors relief cooldowns', () => {
    const timestamp = 5_000;
    const relieved = paranoiaReducer(
      initial,
      applyParanoiaRelief({
        amount: 20,
        timestamp,
        cooldownKey: 'test',
        cooldownMs: 1_000,
      })
    );

    const attemptDuringCooldown = paranoiaReducer(
      relieved,
      applyParanoiaRelief({
        amount: 20,
        timestamp: timestamp + 500,
        cooldownKey: 'test',
        cooldownMs: 1_000,
      })
    );

    expect(attemptDuringCooldown.value).toBe(relieved.value);
  });
});
