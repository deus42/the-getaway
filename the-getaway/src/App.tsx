import { Provider } from "react-redux";
import GameCanvas from "./components/GameCanvas";
import GameController from "./components/GameController";
import { store } from "./store";
import "./App.css";

function App() {
  return (
    <Provider store={store}>
      <div className="App relative">
        <GameCanvas />
        <GameController />
      </div>
    </Provider>
  );
}

export default App;
