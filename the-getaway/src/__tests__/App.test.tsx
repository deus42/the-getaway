import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "../App";
import { PERSISTED_STATE_KEY, resetGame, store } from "../store";

// Mock the GameCanvas component to avoid Phaser initialization in tests
jest.mock("../components/GameCanvas", () => {
  return function MockedGameCanvas() {
    return <div data-testid="game-canvas">Game Canvas Mock</div>;
  };
});

describe("App component", () => {
  beforeEach(() => {
    store.dispatch(resetGame());
    window.localStorage.removeItem(PERSISTED_STATE_KEY);
  });

  const completeCharacterCreation = async () => {
    const nameInput = await screen.findByPlaceholderText("Enter your operative name...");
    fireEvent.change(nameInput, { target: { value: "Test Operative" } });

    const presetButtons = await screen.findAllByRole("button", { name: /Operative/i });
    fireEvent.click(presetButtons[0]);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    });

    const incrementButtons = await screen.findAllByTitle("Increase attribute");
    for (let i = 0; i < 5; i += 1) {
      await act(async () => {
        fireEvent.click(incrementButtons[0]);
      });
    }

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    });

    const backgroundCard = await screen.findByTestId('background-card-corpsec_defector');
    fireEvent.click(backgroundCard);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Confirm & Start/i }));
    });
  };

  it("shows the menu first and enters the game when starting a new session", async () => {
    render(<App />);

    expect(await screen.findByTestId("game-menu")).toBeInTheDocument();
    const continueButtonInitial = await screen.findByTestId("continue-game");
    expect(continueButtonInitial).toBeDisabled();

    fireEvent.click(await screen.findByTestId("start-new-game"));

    await completeCharacterCreation();

    expect(screen.queryByTestId("game-menu")).not.toBeInTheDocument();
    expect(screen.getByTestId("game-canvas")).toBeInTheDocument();

    const openMenuButton = screen.getByTestId("open-menu");
    fireEvent.click(openMenuButton);

    const continueButton = screen.getByTestId("continue-game");
    expect(continueButton).toBeEnabled();

    fireEvent.click(continueButton);
    expect(screen.queryByTestId("game-menu")).not.toBeInTheDocument();
  });

  it("enables continue when a saved game is found", async () => {
    const { unmount } = render(<App />);

    fireEvent.click(await screen.findByTestId("start-new-game"));
    await completeCharacterCreation();
    fireEvent.click(await screen.findByTestId("open-menu"));

    unmount();

    const savedState = window.localStorage.getItem(PERSISTED_STATE_KEY);
    expect(savedState).not.toBeNull();

    render(<App />);

    const continueButton = await screen.findByTestId("continue-game");
    expect(continueButton).toBeEnabled();

    fireEvent.click(continueButton);
    expect(screen.queryByTestId("game-menu")).not.toBeInTheDocument();
    expect(screen.getByTestId("game-canvas")).toBeInTheDocument();
  });

  it('opens and closes the character screen', async () => {
    render(<App />);

    fireEvent.click(await screen.findByTestId('start-new-game'));
    await completeCharacterCreation();

    const characterButton = screen.getByTestId('summary-open-character');
    fireEvent.click(characterButton);

    const characterScreen = await screen.findByTestId('character-screen');
    expect(characterScreen).toBeInTheDocument();

    const closeButton = screen.getByTestId('close-character');
    fireEvent.click(closeButton);
    expect(screen.queryByTestId('character-screen')).not.toBeInTheDocument();

    fireEvent.click(characterButton);
    expect(await screen.findByTestId('character-screen')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByTestId('character-screen')).not.toBeInTheDocument());

    fireEvent.click(characterButton);
    expect(await screen.findByTestId('character-screen')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'c' });
    await waitFor(() => expect(screen.queryByTestId('character-screen')).not.toBeInTheDocument());
  });
});
