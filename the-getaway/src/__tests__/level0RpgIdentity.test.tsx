import { act, fireEvent, render, screen } from '@testing-library/react';
import App from '../App';
import { readLevel0Autosave, writeLevel0Autosave } from '../game/level0/runtime/persistence';
import { createInitialLevel0RunState } from '../game/level0/runtime/safehouse';
import { createConfirmedLevel0Sample } from '../game/level0/rpg/creation';
import { LEVEL0_CHECK_CATALOG, resolveLevel0Check } from '../game/level0/rpg/checks';
import { LEVEL0_ACTOR_INTERACTION_PRESENTATION_EVENT } from '../game/level0/scene/level0ActorPresentation';
import Level0CheckBreakdown from '../components/level0/Level0CheckBreakdown';
import Level0CharacterPanel from '../components/level0/Level0CharacterPanel';
import { resetGame, store } from '../store';
import {
  applyLevel0Resource,
  awardLevel0Milestone,
} from '../store/level0RuntimeSlice';
import { setLocale } from '../store/settingsSlice';

jest.mock('../components/level0/Level0GameCanvas', () => {
  return function MockedLevel0GameCanvas() {
    return <div data-testid="level0-game-canvas">Level 0 Canvas</div>;
  };
});

const completeSocialCreation = async (
  callsign = 'Mara',
  appearancePresetId = 'player_civilian_04'
) => {
  fireEvent.click(await screen.findByTestId('level0-new-game'));
  expect(await screen.findByTestId('level0-character-creation')).toBeInTheDocument();
  expect(store.getState().level0Runtime.run).toBeNull();

  fireEvent.change(screen.getByTestId('level0-callsign'), { target: { value: callsign } });
  fireEvent.click(screen.getByTestId(`level0-appearance-${appearancePresetId}`));
  fireEvent.click(screen.getByTestId('level0-create-attribute-mental-increase'));
  fireEvent.click(screen.getByTestId('level0-create-attribute-mental-increase'));
  fireEvent.click(screen.getByTestId('level0-create-attribute-social-increase'));
  fireEvent.click(screen.getByTestId('level0-create-attribute-social-increase'));
  for (let index = 0; index < 2; index += 1) {
    fireEvent.click(screen.getByTestId('level0-create-skill-composure-increase'));
    fireEvent.click(screen.getByTestId('level0-create-skill-insight-increase'));
    fireEvent.click(screen.getByTestId('level0-create-skill-influence-increase'));
  }
  fireEvent.click(screen.getByTestId('level0-creation-confirm'));
};

const completeTechnicalCreation = async (callsign = 'Sora') => {
  fireEvent.click(await screen.findByTestId('level0-new-game'));
  fireEvent.change(screen.getByTestId('level0-callsign'), { target: { value: callsign } });
  for (let index = 0; index < 2; index += 1) {
    fireEvent.click(screen.getByTestId('level0-create-attribute-physical-increase'));
    fireEvent.click(screen.getByTestId('level0-create-attribute-technical-increase'));
    fireEvent.click(screen.getByTestId('level0-create-skill-evasion-increase'));
    fireEvent.click(screen.getByTestId('level0-create-skill-systems-increase'));
    fireEvent.click(screen.getByTestId('level0-create-skill-opsec-increase'));
  }
  fireEvent.click(screen.getByTestId('level0-creation-confirm'));
};

describe('Level 0 RPG identity flow', () => {
  beforeEach(() => {
    store.dispatch(resetGame());
    store.dispatch(setLocale('en'));
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('keeps New Game in creation until callsign and exact budgets are confirmed', async () => {
    render(<App />);
    fireEvent.click(await screen.findByTestId('level0-new-game'));

    expect(await screen.findByTestId('level0-character-creation')).toBeInTheDocument();
    expect(screen.getByRole('dialog', {
      name: 'Who were you before you were exposed?',
    })).toBeInTheDocument();
    expect(screen.getByTestId('level0-callsign')).toHaveFocus();
    expect(screen.getByTestId('level0-creation-confirm')).toBeDisabled();
    expect(screen.getByTestId('level0-creation-attribute-budget')).toHaveTextContent('4');
    expect(screen.getByTestId('level0-creation-skill-budget')).toHaveTextContent('6');
    expect(screen.getByTestId('level0-creation-validation')).toHaveTextContent(
      'Enter a callsign'
    );
    expect(screen.getByText('Read people, institutions, and social pressure.')).toBeInTheDocument();
    expect(store.getState().level0Runtime.run).toBeNull();

    fireEvent.click(screen.getByTestId('level0-creation-cancel'));
    expect(await screen.findByTestId('level0-start-menu')).toBeInTheDocument();
    expect(screen.getByTestId('level0-new-game')).toHaveFocus();
    expect(store.getState().level0Runtime.run).toBeNull();
  });

  it('persists the exact player-created callsign, appearance, attributes, and skills', async () => {
    render(<App />);
    await completeSocialCreation('  Київ   Runner  ');

    expect(await screen.findByTestId('level0-game-canvas')).toBeInTheDocument();
    const run = store.getState().level0Runtime.run;
    expect(run).toMatchObject({
      identity: {
        callsign: 'Київ Runner',
        appearancePresetId: 'player_civilian_04',
      },
      build: {
        attributes: { physical: 1, mental: 3, social: 3, technical: 1 },
        skills: { composure: 2, insight: 2, influence: 2 },
        level: 1,
        xp: 0,
      },
      mission: 'L0_SAFEHOUSE_INTRO',
      health: 100,
      paranoia: 0,
    });

    const autosave = readLevel0Autosave(window.localStorage);
    expect(autosave.status).toBe('compatible');
    if (autosave.status === 'compatible') {
      expect(autosave.envelope.payload.identity).toEqual(run?.identity);
      expect(autosave.envelope.payload.build).toEqual(run?.build);
    }
  });

  it('continues a compatible RPG autosave without reopening creation', async () => {
    const sample = createConfirmedLevel0Sample(
      'technical_evasion',
      'Sora',
      'player_civilian_03'
    );
    writeLevel0Autosave(
      window.localStorage,
      createInitialLevel0RunState('saved-rpg', sample.identity, sample.build),
      4321
    );

    render(<App />);
    fireEvent.click(await screen.findByTestId('level0-continue'));

    expect(await screen.findByTestId('level0-game-canvas')).toBeInTheDocument();
    expect(store.getState().level0Runtime.run?.identity).toEqual(sample.identity);
    expect(screen.queryByTestId('level0-character-creation')).not.toBeInTheDocument();
  });

  it('reloads a normal player-created run from the exact autosave', async () => {
    const firstView = render(<App />);
    await completeSocialCreation('Mara Reloaded', 'player_civilian_02');
    const created = store.getState().level0Runtime.run;
    expect(created).not.toBeNull();

    firstView.unmount();
    store.dispatch(resetGame());
    render(<App />);
    fireEvent.click(await screen.findByTestId('level0-continue'));

    expect(await screen.findByTestId('level0-game-canvas')).toBeInTheDocument();
    expect(store.getState().level0Runtime.run).toEqual(created);
  });

  it('opens a paused Character surface without leaking undiscovered check content', async () => {
    render(<App />);
    await completeSocialCreation();

    fireEvent.click(await screen.findByTestId('level0-character-open'));
    expect(await screen.findByTestId('level0-character-panel')).toHaveTextContent('Mara');
    expect(screen.getByTestId('level0-character-close')).toHaveFocus();
    fireEvent.keyDown(screen.getByTestId('level0-character-close'), { key: 'Tab' });
    expect(screen.getByTestId('level0-character-close')).toHaveFocus();
    expect(screen.getByTestId('level0-character-panel')).toHaveTextContent('Social');
    expect(screen.queryByText('Loop a connected camera')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(store.getState().level0Runtime.run?.worldClock.pauseOwners).toContain('character');

    fireEvent.click(screen.getByTestId('level0-character-close'));
    expect(screen.queryByTestId('level0-character-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('level0-character-open')).toHaveFocus();
    expect(store.getState().level0Runtime.run?.worldClock.pauseOwners).not.toContain('character');
  });

  it('renders different reusable check math for two builds captured from normal creation', async () => {
    const socialView = render(<App />);
    await completeSocialCreation('Mara Checks');
    const socialBuild = store.getState().level0Runtime.run?.build;
    expect(socialBuild).toBeDefined();
    socialView.unmount();
    store.dispatch(resetGame());
    window.localStorage.clear();

    const technicalView = render(<App />);
    await completeTechnicalCreation('Sora Checks');
    const technicalBuild = store.getState().level0Runtime.run?.build;
    expect(technicalBuild).toBeDefined();
    technicalView.unmount();

    const requirement = LEVEL0_CHECK_CATALOG['check.camera_loop'];
    const socialResolution = resolveLevel0Check({
      requirement,
      build: socialBuild!,
      paranoia: 0,
      knownFactIds: [],
      activeContextIds: [],
    });
    const technicalResolution = resolveLevel0Check({
      requirement,
      build: technicalBuild!,
      paranoia: 0,
      knownFactIds: [],
      activeContextIds: [],
    });
    const view = render(
      <Level0CheckBreakdown
        requirement={requirement}
        resolution={socialResolution}
        ukrainian={false}
      />
    );
    expect(screen.getByTestId('level0-check-breakdown-math')).toHaveTextContent(
      '1 + 0 − 0 = 1 / 4'
    );

    view.rerender(
      <Level0CheckBreakdown
        requirement={requirement}
        resolution={technicalResolution}
        ukrainian={false}
      />
    );
    expect(screen.getByTestId('level0-check-breakdown-math')).toHaveTextContent(
      '3 + 2 − 0 = 5 / 4'
    );

    view.rerender(
      <Level0CheckBreakdown
        requirement={requirement}
        resolution={{
          ...technicalResolution,
          appliedModifiers: [{
            id: 'modifier.camera_scrutiny',
            amount: -1,
            requiredContextId: 'context.camera_scrutiny',
            localizedReasonKey: 'modifier.camera_scrutiny',
          }],
          finalTotal: 4,
        }}
        ukrainian={false}
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('Camera scrutiny: −1');
    expect(screen.getByTestId('level0-check-breakdown-math')).toHaveTextContent(
      '3 + 2 − 0 − 1 = 4 / 4'
    );
    expect(screen.getByTestId('level0-check-breakdown-math')).not.toHaveTextContent('+ -1');

    view.rerender(
      <Level0CheckBreakdown
        requirement={requirement}
        resolution={{
          ...technicalResolution,
          appliedModifiers: [{
            id: 'modifier.camera_scrutiny',
            amount: -1,
            requiredContextId: 'context.camera_scrutiny',
            localizedReasonKey: 'modifier.camera_scrutiny',
          }],
          finalTotal: 4,
        }}
        ukrainian
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('Увага камери: −1');
  });

  it('disables level allocation outside a safehouse or debrief and explains why', () => {
    const sample = createConfirmedLevel0Sample('social_mental', 'Mara');
    const run = createInitialLevel0RunState('allocation-context', sample.identity, sample.build);
    run.mission = 'L0_OPERATION_DEPARTED';
    run.safehouse.insideBoundary = false;
    run.rpg.pendingLevelUps = 1;
    run.build.unspentSkillPoints = 1;
    run.build.unspentAttributePoints = 1;

    render(
      <Level0CharacterPanel
        run={run}
        ukrainian={false}
        onClose={jest.fn()}
        onActivateLevel={jest.fn()}
        onAllocateAttribute={jest.fn()}
        onAllocateSkill={jest.fn()}
      />
    );

    expect(screen.getByTestId('level0-activate-level')).toBeDisabled();
    expect(screen.getByTestId('level0-allocate-attribute-physical')).toBeDisabled();
    expect(screen.getByTestId('level0-allocate-skill-stealth')).toBeDisabled();
    expect(screen.getByTestId('level0-allocation-blocked')).toHaveTextContent(
      'Level-up allocation is available only at the safehouse or during debrief.'
    );
  });

  it('disables capped allocations and does not present recovery logs as lasting consequences', () => {
    const sample = createConfirmedLevel0Sample('social_mental', 'Mara');
    const run = createInitialLevel0RunState('allocation-cap', sample.identity, sample.build);
    run.build.attributes.physical = 5;
    run.build.skills.stealth = 5;
    run.build.unspentAttributePoints = 1;
    run.build.unspentSkillPoints = 1;
    run.rpg.resourceEvents.push({
      eventId: 'resource.safehouse.rest.health.1',
      resource: 'health',
      sourceId: 'safehouse.rest',
      amount: 20,
      before: 80,
      after: 100,
      worldMinute: run.worldClock.currentMinute,
      feedbackId: 'resource.health.safehouse_rest',
      retryTreatment: 'captured-at-departure',
      crossedParanoiaPenalties: [],
    });

    render(
      <Level0CharacterPanel
        run={run}
        ukrainian={false}
        onClose={jest.fn()}
        onActivateLevel={jest.fn()}
        onAllocateAttribute={jest.fn()}
        onAllocateSkill={jest.fn()}
      />
    );

    expect(screen.getByTestId('level0-allocate-attribute-physical')).toBeDisabled();
    expect(screen.getByTestId('level0-allocate-attribute-physical')).toHaveAttribute(
      'title',
      'Physical is already at the long-term cap of 5.'
    );
    expect(screen.getByTestId('level0-allocate-skill-stealth')).toBeDisabled();
    expect(screen.getByTestId('level0-attribute-cap-physical')).toHaveTextContent(
      'Long-term cap: 5'
    );
    expect(screen.getByTestId('level0-skill-cap-stealth')).toHaveTextContent(
      'Long-term cap: 5'
    );
    expect(screen.getByTestId('level0-character-consequences')).toHaveTextContent(
      'No lasting consequences recorded.'
    );
    expect(screen.getByTestId('level0-character-consequences')).not.toHaveTextContent(
      'Safehouse recovery'
    );
  });

  it('activates and allocates an authored level-up through the Character UI', async () => {
    render(<App />);
    await completeSocialCreation('Mara Levels');
    act(() => {
      store.dispatch(awardLevel0Milestone('milestone.medkits_returned'));
      store.dispatch(awardLevel0Milestone('milestone.transit_validated'));
    });

    fireEvent.click(await screen.findByTestId('level0-character-open'));
    fireEvent.click(screen.getByTestId('level0-activate-level'));
    expect(store.getState().level0Runtime.run?.build).toMatchObject({
      level: 2,
      xp: 100,
      unspentSkillPoints: 2,
      unspentAttributePoints: 0,
    });

    fireEvent.click(screen.getByTestId('level0-allocate-skill-stealth'));
    fireEvent.click(screen.getByTestId('level0-allocate-skill-awareness'));
    fireEvent.click(screen.getByTestId('level0-character-close'));

    expect(store.getState().level0Runtime.run?.build).toMatchObject({
      level: 2,
      xp: 100,
      unspentSkillPoints: 0,
      skills: { stealth: 1, awareness: 1 },
    });
    const autosave = readLevel0Autosave(window.localStorage);
    expect(autosave.status).toBe('compatible');
    if (autosave.status === 'compatible') {
      expect(autosave.envelope.payload.build).toEqual(
        store.getState().level0Runtime.run?.build
      );
    }
  });

  it('creates a Technical/Evasion build through the normal New Game flow', async () => {
    render(<App />);
    await completeTechnicalCreation();

    expect(await screen.findByTestId('level0-game-canvas')).toBeInTheDocument();
    expect(store.getState().level0Runtime.run?.build).toMatchObject({
      attributes: { physical: 3, mental: 1, social: 1, technical: 3 },
      skills: { evasion: 2, systems: 2, opsec: 2 },
    });
  });

  it('localizes creation validation and practical capability copy in Ukrainian', async () => {
    store.dispatch(setLocale('uk'));
    render(<App />);
    fireEvent.click(await screen.findByTestId('level0-new-game'));

    expect(await screen.findByTestId('level0-character-creation')).toHaveTextContent(
      'Створення не завершено'
    );
    expect(screen.getByText('Читайте людей, установи й соціальний тиск.')).toBeInTheDocument();
  });

  it('publishes the resolved world anchor after normal character creation', async () => {
    const listener = jest.fn();
    window.addEventListener(LEVEL0_ACTOR_INTERACTION_PRESENTATION_EVENT, listener);
    render(<App />);
    await completeSocialCreation();
    fireEvent.click(await screen.findByTestId('level0-interact'));

    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls[0]![0] as CustomEvent).detail).toEqual({
      anchorId: 'interaction.safehouse.wait',
    });
    window.removeEventListener(LEVEL0_ACTOR_INTERACTION_PRESENTATION_EVENT, listener);
  });

  it('keeps the agent-start bypass explicit and separate from normal New Game', async () => {
    window.history.replaceState(
      {},
      '',
      '/?agent=1&agentStart=level0&agentName=Scout&fresh=1'
    );
    render(<App />);

    expect(await screen.findByTestId('level0-game-canvas')).toBeInTheDocument();
    expect(store.getState().level0Runtime.run?.identity.callsign).toBe('Scout');
    expect(screen.queryByTestId('level0-character-creation')).not.toBeInTheDocument();
  });

  it('names a fatal Paranoia cause and its contributing source', async () => {
    window.history.replaceState({}, '', '/?agent=1&agentStart=level0&fresh=1');
    render(<App />);
    expect(await screen.findByTestId('level0-game-canvas')).toBeInTheDocument();

    act(() => {
      store.dispatch(applyLevel0Resource({
        eventId: 'resource.test.failure-copy',
        resource: 'paranoia',
        amount: 100,
        sourceId: 'camera.identity_gate',
        feedbackId: 'resource.paranoia.identity_gate',
        retryTreatment: 'discard-on-retry',
      }));
    });

    expect(await screen.findByTestId('level0-failure')).toHaveTextContent(
      'Paranoia reached 100'
    );
    expect(screen.getByTestId('level0-failure')).toHaveTextContent('Camera Identity Gate');
    expect(screen.getByTestId('level0-failure')).not.toHaveTextContent('camera.identity_gate');
  });

  it('localizes fatal failure controls and source copy in Ukrainian', async () => {
    store.dispatch(setLocale('uk'));
    window.history.replaceState({}, '', '/?agent=1&agentStart=level0&fresh=1');
    render(<App />);
    expect(await screen.findByTestId('level0-game-canvas')).toBeInTheDocument();

    act(() => {
      store.dispatch(applyLevel0Resource({
        eventId: 'resource.test.failure-copy-uk',
        resource: 'paranoia',
        amount: 100,
        sourceId: 'drone.verification',
        feedbackId: 'resource.paranoia.drone',
        retryTreatment: 'discard-on-retry',
      }));
    });

    const failure = await screen.findByTestId('level0-failure');
    expect(failure).toHaveTextContent('ОПЕРАЦІЮ ПРОВАЛЕНО');
    expect(failure).toHaveTextContent('Джерело: Перевірка дроном');
    expect(screen.getByRole('button', { name: 'Повторити від виходу' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Повернутися до меню' })).toBeInTheDocument();
  });

  it('shows exact localized source and amount for nonfatal resource feedback', async () => {
    store.dispatch(setLocale('uk'));
    window.history.replaceState({}, '', '/?agent=1&agentStart=level0&fresh=1');
    render(<App />);
    expect(await screen.findByTestId('level0-game-canvas')).toBeInTheDocument();

    act(() => {
      store.dispatch(applyLevel0Resource({
        eventId: 'resource.test.visible-feedback',
        resource: 'paranoia',
        amount: 45,
        sourceId: 'drone.verification',
        feedbackId: 'resource.paranoia.drone',
        retryTreatment: 'discard-on-retry',
      }));
    });

    expect(screen.getByText('Параноя +45 · Перевірка дроном')).toBeInTheDocument();
  });

  it('uses neutral localized copy when a resource source has no registered label', async () => {
    store.dispatch(setLocale('uk'));
    window.history.replaceState({}, '', '/?agent=1&agentStart=level0&fresh=1');
    render(<App />);
    expect(await screen.findByTestId('level0-game-canvas')).toBeInTheDocument();

    act(() => {
      store.dispatch(applyLevel0Resource({
        eventId: 'resource.test.unregistered-source',
        resource: 'health',
        amount: -10,
        sourceId: 'unregistered.machine_id',
        feedbackId: 'resource.health.unregistered',
        retryTreatment: 'discard-on-retry',
      }));
    });

    expect(screen.getByText('Здоров’я −10 · Зафіксована подія')).toBeInTheDocument();
    expect(screen.queryByText(/unregistered|machine id/i)).not.toBeInTheDocument();
  });
});
