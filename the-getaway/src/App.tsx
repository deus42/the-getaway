import { Provider } from 'react-redux';
import Level0RuntimeShell from './components/level0/Level0RuntimeShell';
import { store } from './store';

const App = () => (
  <Provider store={store}>
    <Level0RuntimeShell />
  </Provider>
);

export default App;
