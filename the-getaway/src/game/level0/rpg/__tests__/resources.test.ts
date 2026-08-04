import { createLevel0SampleCharacter, validateLevel0CreationDraft } from '../creation';
import {
  LEVEL0_PROVISIONAL_RESOURCE_PRESETS,
  applyLevel0ResourceEffect,
  createLevel0ResourceEffect,
  createLevel0ResourceEffectFromPreset,
} from '../resources';
import { createInitialLevel0RunState } from '../../runtime/safehouse';

const makeRun = () => {
  const confirmed = validateLevel0CreationDraft(
    createLevel0SampleCharacter('social_mental', 'Mara')
  );
  if (!confirmed.identity || !confirmed.build) throw new Error('sample must validate');
  return createInitialLevel0RunState('resource-run', confirmed.identity, confirmed.build);
};

describe('Level 0 Health and Paranoia effects', () => {
  it('registers the provisional Health costs and one-shot Paranoia recoveries as typed presets', () => {
    expect(LEVEL0_PROVISIONAL_RESOURCE_PRESETS).toEqual({
      'health.cost.minor': expect.objectContaining({ resource: 'health', amount: -10 }),
      'health.cost.dangerous': expect.objectContaining({ resource: 'health', amount: -25 }),
      'health.cost.severe': expect.objectContaining({ resource: 'health', amount: -40 }),
      'paranoia.recovery.trusted-conversation': expect.objectContaining({
        resource: 'paranoia',
        amount: -10,
      }),
      'paranoia.recovery.difficult-hide': expect.objectContaining({
        resource: 'paranoia',
        amount: -5,
      }),
    });

    const effect = createLevel0ResourceEffectFromPreset(
      'paranoia.recovery.trusted-conversation',
      makeRun(),
      {
        eventId: 'resource.contact.lira.trusted-conversation',
        sourceId: 'dialogue.lira.trusted-conversation',
        worldMinute: 18 * 60 + 45,
      }
    );
    expect(effect).toEqual({
      eventId: 'resource.contact.lira.trusted-conversation',
      resource: 'paranoia',
      amount: -10,
      sourceId: 'dialogue.lira.trusted-conversation',
      feedbackId: 'resource.paranoia.trusted_conversation',
      worldMinute: 18 * 60 + 45,
      retryTreatment: 'captured-at-departure',
    });

    const departedRun = makeRun();
    departedRun.safehouse.departureSnapshotCreated = true;
    expect(createLevel0ResourceEffectFromPreset(
      'paranoia.recovery.trusted-conversation',
      departedRun,
      {
        eventId: 'resource.contact.lira.after-departure',
        sourceId: 'dialogue.lira.trusted-conversation',
        worldMinute: 19 * 60,
      }
    ).retryTreatment).toBe('discard-on-retry');

    const stressedRun = { ...makeRun(), paranoia: 30 };
    const first = applyLevel0ResourceEffect(stressedRun, effect);
    const repeated = applyLevel0ResourceEffect(first.run, effect);
    expect(first.run.paranoia).toBe(20);
    expect(repeated.applied).toBe(false);
    expect(repeated.run.paranoia).toBe(20);
    expect(repeated.run.rpg.resourceEvents).toHaveLength(1);
  });

  it('records exact source, amount, time, before/after, feedback, and Retry treatment', () => {
    const run = { ...makeRun(), health: 80 };
    const result = applyLevel0ResourceEffect(run, createLevel0ResourceEffect({
      eventId: 'resource.escape.minor.1',
      resource: 'health',
      amount: -10,
      sourceId: 'escape.service_gate',
      feedbackId: 'resource.health.escape_minor',
      worldMinute: run.worldClock.currentMinute,
      retryTreatment: 'discard-on-retry',
    }));

    expect(result.applied).toBe(true);
    expect(result.run.health).toBe(70);
    expect(result.run.rpg.resourceEvents).toEqual([
      expect.objectContaining({
        eventId: 'resource.escape.minor.1',
        sourceId: 'escape.service_gate',
        amount: -10,
        before: 80,
        after: 70,
        worldMinute: 18 * 60 + 30,
        feedbackId: 'resource.health.escape_minor',
        retryTreatment: 'discard-on-retry',
      }),
    ]);
  });

  it('is idempotent and announces each newly crossed Paranoia penalty once', () => {
    let run = makeRun();
    const effect = createLevel0ResourceEffect({
      eventId: 'resource.camera.exposure.1',
      resource: 'paranoia',
      amount: 75,
      sourceId: 'camera.public.01',
      feedbackId: 'resource.paranoia.camera',
      worldMinute: run.worldClock.currentMinute,
      retryTreatment: 'discard-on-retry',
    });
    run = applyLevel0ResourceEffect(run, effect).run;
    const repeated = applyLevel0ResourceEffect(run, effect);

    expect(run.paranoia).toBe(75);
    expect(run.rpg.announcedParanoiaPenalties).toEqual([1, 2]);
    expect(run.rpg.resourceEvents[0]?.crossedParanoiaPenalties).toEqual([1, 2]);
    expect(repeated.applied).toBe(false);
    expect(repeated.run.rpg.resourceEvents).toHaveLength(1);
  });

  it('re-arms threshold feedback after recovery and announces a later crossing again', () => {
    let run = makeRun();
    run = applyLevel0ResourceEffect(run, createLevel0ResourceEffect({
      eventId: 'resource.threshold.first-rise',
      resource: 'paranoia',
      amount: 75,
      sourceId: 'camera.public.01',
      feedbackId: 'resource.paranoia.camera',
      worldMinute: run.worldClock.currentMinute,
      retryTreatment: 'discard-on-retry',
    })).run;
    run = applyLevel0ResourceEffect(run, createLevel0ResourceEffect({
      eventId: 'resource.threshold.recovery',
      resource: 'paranoia',
      amount: -40,
      sourceId: 'safehouse.rest',
      feedbackId: 'resource.paranoia.safehouse_rest',
      worldMinute: run.worldClock.currentMinute,
      retryTreatment: 'discard-on-retry',
    })).run;
    expect(run.rpg.announcedParanoiaPenalties).toEqual([]);

    run = applyLevel0ResourceEffect(run, createLevel0ResourceEffect({
      eventId: 'resource.threshold.second-rise',
      resource: 'paranoia',
      amount: 40,
      sourceId: 'drone.verification',
      feedbackId: 'resource.paranoia.drone',
      worldMinute: run.worldClock.currentMinute,
      retryTreatment: 'discard-on-retry',
    })).run;
    expect(run.rpg.announcedParanoiaPenalties).toEqual([1, 2]);
    expect(
      run.rpg.resourceEvents[run.rpg.resourceEvents.length - 1]?.crossedParanoiaPenalties
    ).toEqual([1, 2]);
  });

  it('creates truthful sourced fatal failures at Health 0 and Paranoia 100', () => {
    const healthRun = { ...makeRun(), health: 10 };
    const healthFailure = applyLevel0ResourceEffect(healthRun, createLevel0ResourceEffect({
      eventId: 'resource.intercept.health-fatal',
      resource: 'health',
      amount: -40,
      sourceId: 'interception.identity_gate',
      feedbackId: 'resource.health.interception',
      worldMinute: healthRun.worldClock.currentMinute,
      retryTreatment: 'discard-on-retry',
    })).run;
    expect(healthFailure).toMatchObject({
      health: 0,
      mission: 'L0_FAILED',
      failureCause: 'failure.health',
      failureSourceId: 'interception.identity_gate',
    });

    const paranoiaRun = { ...makeRun(), paranoia: 95 };
    const paranoiaFailure = applyLevel0ResourceEffect(paranoiaRun, createLevel0ResourceEffect({
      eventId: 'resource.drone.paranoia-fatal',
      resource: 'paranoia',
      amount: 10,
      sourceId: 'drone.verification',
      feedbackId: 'resource.paranoia.drone',
      worldMinute: paranoiaRun.worldClock.currentMinute,
      retryTreatment: 'discard-on-retry',
    })).run;
    expect(paranoiaFailure).toMatchObject({
      paranoia: 100,
      mission: 'L0_FAILED',
      failureCause: 'failure.paranoia',
      failureSourceId: 'drone.verification',
    });
    expect(paranoiaFailure.worldClock.pauseOwners).toContain('failure');
  });
});
