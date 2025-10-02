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
    const nameInput = screen.getByPlaceholderText("Enter your operative name...");
    fireEvent.change(nameInput, { target: { value: "Test Operative" } });

    const presetButtons = screen.getAllByRole("button", { name: /Operative/i });
    fireEvent.click(presetButtons[0]);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    });

    const incrementButtons = screen.getAllByTitle("Increase attribute");
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

    expect(screen.getByTestId("game-menu")).toBeInTheDocument();
    expect(screen.getByTestId("continue-game")).toBeDisabled();

    fireEvent.click(screen.getByTestId("start-new-game"));

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

    fireEvent.click(screen.getByTestId("start-new-game"));
    await completeCharacterCreation();
    fireEvent.click(screen.getByTestId("open-menu"));

    unmount();

    const savedState = window.localStorage.getItem(PERSISTED_STATE_KEY);
    expect(savedState).not.toBeNull();

    render(<App />);

    const continueButton = screen.getByTestId("continue-game");
    expect(continueButton).toBeEnabled();

    fireEvent.click(continueButton);
    expect(screen.queryByTestId("game-menu")).not.toBeInTheDocument();
    expect(screen.getByTestId("game-canvas")).toBeInTheDocument();
  });

  it('opens and closes the character screen', async () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('start-new-game'));
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
