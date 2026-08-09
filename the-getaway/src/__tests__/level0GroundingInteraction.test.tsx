import { fireEvent, render, screen } from '@testing-library/react';
import App from '../App';
import { LEVEL0_LAYOUT_CONTRACT } from '../content/levels/level0/layoutContract';
import { applyLevel0ParanoiaEffect } from '../game/level0/rpg/paranoia';
import {
  decodeLevel0Autosave,
  LEVEL0_AUTOSAVE_KEY,
  writeLevel0Autosave,
} from '../game/level0/runtime/persistence';
import { createInitialLevel0RunState } from '../game/level0/runtime/safehouse';
import { resetGame, store } from '../store';
import { setLocale } from '../store/settingsSlice';

jest.mock('../components/level0/Level0GameCanvas', () => ({
  __esModule: true,
  default: ({ onInteraction }: { onInteraction(anchorId?: string): void }) => (
    <button
      type="button"
      data-testid="mock-grounding-interaction"
      onClick={() => onInteraction('interaction.grounding.vending_coffee')}
    >
      Interact with coffee
    </button>
  ),
}));

jest.mock('../game/feedback/audioCues', () => ({
  playLevel0FeedbackCue: jest.fn(),
  primeLevel0AudioCues: jest.fn(),
}));

describe('Level 0 grounding interaction', () => {
  beforeEach(() => {
    store.dispatch(resetGame());
    store.dispatch(setLocale('en'));
    window.localStorage.clear();
    const anchor = LEVEL0_LAYOUT_CONTRACT.anchors.find(
      (candidate) => candidate.id === 'interaction.grounding.vending_coffee'
    );
    if (!anchor) throw new Error('Missing vending grounding anchor');
    const initial = createInitialLevel0RunState('grounding-shell', 'cover.neighbor');
    const stressed = applyLevel0ParanoiaEffect(initial, {
      eventId: 'test.starting-paranoia',
      amount: 50,
      sourceId: 'test.setup',
      feedbackId: 'test.setup',
    }).run;
    writeLevel0Autosave(window.localStorage, {
      ...stressed,
      player: {
        position: { ...anchor.position },
        facing: { x: 0, y: 1 },
      },
      safehouse: { ...stressed.safehouse, insideBoundary: false },
    });
  });

  it('confirms, applies, persists, and truthfully blocks a repeated coffee use', async () => {
    render(<App />);
    fireEvent.click(await screen.findByTestId('level0-continue'));
    const interact = await screen.findByTestId('mock-grounding-interaction');
    const beforeMinute = store.getState().level0Runtime.run!.worldClock.currentMinute;

    fireEvent.click(interact);
    expect(await screen.findByRole('dialog', { name: /ten minutes: hot coffee/i }))
      .toBeInTheDocument();
    expect(store.getState().level0Runtime.run?.worldClock.pauseOwners)
      .toContain('safehouse_action');

    fireEvent.click(screen.getByTestId('safehouse-confirm'));
    expect(screen.queryByTestId('safehouse-confirmation')).not.toBeInTheDocument();
    expect(store.getState().level0Runtime.run).toMatchObject({
      paranoia: 40,
      recovery: {
        usedGroundingActionIds: ['grounding.transit-road-vending-coffee'],
      },
      worldClock: {
        currentMinute: beforeMinute + 10,
        pauseOwners: [],
      },
    });

    const persisted = decodeLevel0Autosave(window.localStorage.getItem(LEVEL0_AUTOSAVE_KEY));
    expect(persisted.status).toBe('compatible');
    if (persisted.status === 'compatible') {
      expect(persisted.envelope.payload.recovery.usedGroundingActionIds).toEqual([
        'grounding.transit-road-vending-coffee',
      ]);
    }

    fireEvent.click(interact);
    expect(screen.queryByTestId('safehouse-confirmation')).not.toBeInTheDocument();
    expect(screen.getByText('That moment has already been spent tonight.')).toBeInTheDocument();
  });
});
