import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import MainMenu from "./pages/MainMenu";
import CharacterCreation from "./pages/CharacterCreation";
import GameView from "./pages/GameView";
import ErrorBoundary from "./components/ErrorBoundary";
import PhaserWrapper from "./components/PhaserWrapper";
import "./styles/index.css";

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/character-creation" element={<CharacterCreation />} />
          <Route
            path="/game"
            element={
              <PhaserWrapper>
                <GameView />
              </PhaserWrapper>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
