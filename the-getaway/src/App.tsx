import { useState } from "react";
import { Provider } from "react-redux";
import GameCanvas from "./components/GameCanvas";
import GameController from "./components/GameController";
import { store } from "./store";
import "./App.css";

// Import test files to verify imports work
import { gameTest } from "./game/test";
import { combatTest } from "./game/combat/test";
import { worldTest } from "./game/world/test";
import { questsTest } from "./game/quests/test";
import { inventoryTest } from "./game/inventory/test";
import { interfacesTest } from "./game/interfaces/test";

function App() {
  const [testsVisible, setTestsVisible] = useState(false);

  return (
    <Provider store={store}>
      <div className="App relative">
        <GameCanvas />
        <GameController />
        <button
          className="fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => setTestsVisible(!testsVisible)}
          style={{ zIndex: 2 }}
        >
          {testsVisible ? "Hide Tests" : "Show Tests"}
        </button>

        {testsVisible && (
          <div
            className="fixed bottom-16 right-4 bg-gray-800 p-4 rounded text-white text-sm"
            style={{ zIndex: 2 }}
          >
            <h3 className="font-bold">Import Tests:</h3>
            <ul className="list-disc pl-4">
              <li>{gameTest}</li>
              <li>{combatTest}</li>
              <li>{worldTest}</li>
              <li>{questsTest}</li>
              <li>{inventoryTest}</li>
              <li>{interfacesTest}</li>
            </ul>
          </div>
        )}
      </div>
    </Provider>
  );
}

export default App;
