import { fireEvent, render, screen } from "@testing-library/react";
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

  it("shows the menu first and enters the game when starting a new session", () => {
    render(<App />);

    expect(screen.getByTestId("game-menu")).toBeInTheDocument();
    expect(screen.getByTestId("continue-game")).toBeDisabled();

    fireEvent.click(screen.getByTestId("start-new-game"));

    expect(screen.queryByTestId("game-menu")).not.toBeInTheDocument();
    expect(screen.getByTestId("game-canvas")).toBeInTheDocument();

    const openMenuButton = screen.getByTestId("open-menu");
    fireEvent.click(openMenuButton);

    const continueButton = screen.getByTestId("continue-game");
    expect(continueButton).toBeEnabled();

    fireEvent.click(continueButton);
    expect(screen.queryByTestId("game-menu")).not.toBeInTheDocument();
  });

  it("enables continue when a saved game is found", () => {
    const { unmount } = render(<App />);

    fireEvent.click(screen.getByTestId("start-new-game"));
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
});
