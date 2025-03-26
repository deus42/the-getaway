import { render, screen } from "@testing-library/react";
import App from "../App";

// Mock the GameCanvas component to avoid Phaser initialization in tests
jest.mock("../components/GameCanvas", () => {
  return function MockedGameCanvas() {
    return <div data-testid="game-canvas">Game Canvas Mock</div>;
  };
});

describe("App component", () => {
  it("renders without crashing", () => {
    render(<App />);
    const gameCanvas = screen.getByTestId("game-canvas");
    expect(gameCanvas).toBeInTheDocument();
  });
});
