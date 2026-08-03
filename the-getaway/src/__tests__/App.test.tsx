import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "../App";
import { PERSISTED_STATE_KEY, resetGame, store } from "../store";
import { setLocale } from "../store/settingsSlice";

jest.mock("../components/GameCanvas", () => {
  return function MockedGameCanvas() {
    return <div data-testid="game-canvas">Game Canvas Mock</div>;
  };
});

jest.mock("../components/ui/MiniMap", () => {
  return function MockedMiniMap() {
    return <div data-testid="mini-map">Mini Map Mock</div>;
  };
});

jest.mock("../components/debug/GameDebugInspector", () => () => null);

describe("App recovery boundary", () => {
  beforeEach(() => {
    store.dispatch(resetGame());
    store.dispatch(setLocale("en"));
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("opens on the menu without exposing a compatible legacy run", async () => {
    render(<App />);

    expect(await screen.findByTestId("game-menu")).toBeInTheDocument();
    expect(screen.getByTestId("continue-game")).toBeDisabled();
    expect(screen.queryByTestId("game-canvas")).not.toBeInTheDocument();
  });

  it("routes New Game to an honest recovery boundary without legacy initialization", async () => {
    render(<App />);

    fireEvent.click(await screen.findByTestId("start-new-game"));

    const recoveryBoundary = await screen.findByTestId("level0-recovery-boundary");
    expect(recoveryBoundary).toBeInTheDocument();
    expect(recoveryBoundary).toHaveStyle({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });
    recoveryBoundary.querySelectorAll("article").forEach((panel) => {
      expect(panel).toHaveStyle({ padding: "1.25rem" });
    });
    expect(screen.queryByTestId("game-menu")).not.toBeInTheDocument();
    expect(screen.queryByTestId("game-canvas")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/operative name/i)).not.toBeInTheDocument();
    expect(window.localStorage.getItem(PERSISTED_STATE_KEY)).toBeNull();
    expect(store.getState().player.data.name).toBe("Player");
    expect(store.getState().player.data.backgroundId).toBeUndefined();
    expect(store.getState().world.inCombat).toBe(false);
  });

  it("identifies a retired prototype save and clears it before the recovery boundary", async () => {
    window.localStorage.setItem(PERSISTED_STATE_KEY, JSON.stringify({ legacy: true }));

    render(<App />);

    expect(await screen.findByTestId("retired-save-notice")).toHaveStyle({
      padding: "0.75rem 1rem",
    });
    expect(screen.getByTestId("continue-game")).toBeDisabled();

    fireEvent.click(screen.getByTestId("start-new-game"));

    expect(await screen.findByTestId("level0-recovery-boundary")).toBeInTheDocument();
    expect(window.localStorage.getItem(PERSISTED_STATE_KEY)).toBeNull();
  });

  it("explains the retired save and recovery boundary in Ukrainian", async () => {
    store.dispatch(setLocale("uk"));
    window.localStorage.setItem(PERSISTED_STATE_KEY, JSON.stringify({ legacy: true }));

    render(<App />);

    expect(await screen.findByTestId("retired-save-notice")).toHaveTextContent(
      /попереднє збереження прототипу несумісне/i
    );
    fireEvent.click(screen.getByTestId("start-new-game"));

    expect(await screen.findByRole("heading", { name: /втечу з токіо перебудовують/i })).toBeInTheDocument();
    expect(screen.getByTestId("recovery-return-to-menu")).toHaveTextContent(/повернутися до меню/i);
  });

  it("routes the Level 0 agent shortcut to the same boundary", async () => {
    window.history.replaceState(
      {},
      "",
      "/?agent=1&agentStart=level0&agentName=Operative"
    );

    render(<App />);

    expect(await screen.findByTestId("level0-recovery-boundary")).toBeInTheDocument();
    expect(screen.queryByTestId("game-canvas")).not.toBeInTheDocument();
    expect(store.getState().player.data.backgroundId).toBeUndefined();
  });

  it("routes the agent shortcut after a same-tab remount", async () => {
    window.history.replaceState({}, "", "/?agent=1&agentStart=level0");

    const firstMount = render(<App />);
    expect(await screen.findByTestId("level0-recovery-boundary")).toBeInTheDocument();
    firstMount.unmount();

    render(<App />);
    expect(await screen.findByTestId("level0-recovery-boundary")).toBeInTheDocument();
  });

  it("allows the retired PoC shortcut to return to the menu", async () => {
    window.history.replaceState({}, "", "/?poc=esb");

    render(<App />);
    fireEvent.click(await screen.findByTestId("recovery-return-to-menu"));

    await waitFor(() => {
      expect(screen.getByTestId("game-menu")).toBeInTheDocument();
      expect(screen.queryByTestId("level0-recovery-boundary")).not.toBeInTheDocument();
    });
  });

  it("returns from the recovery boundary to the menu", async () => {
    render(<App />);

    fireEvent.click(await screen.findByTestId("start-new-game"));
    fireEvent.click(await screen.findByTestId("recovery-return-to-menu"));

    await waitFor(() => {
      expect(screen.getByTestId("game-menu")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("level0-recovery-boundary")).not.toBeInTheDocument();
  });
});
