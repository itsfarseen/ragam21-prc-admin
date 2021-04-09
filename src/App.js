import './App.css';
import { Login } from './Login';
import { BrowserRouter, Route, Switch, useHistory } from 'react-router-dom';
import { Dashboard } from './Dashboard';

function App() {
  return <BrowserRouter basename={process.env.BASE}><Main /></BrowserRouter>;
}

function Main() {
  const history = useHistory();

  const jwt = window.localStorage.getItem("jwt");
  const isLoggedIn = jwt && jwt !== "";
  if (!isLoggedIn) {
    history.replace("/login")
  }

  const setJWT = (jwt) => {
    window.localStorage.setItem("jwt", jwt);
    history.replace("/");
  };

  const setLogout = () => {
    window.localStorage.removeItem("jwt");
    history.replace("/login");
  }

  return <div className="App">
    <Switch>
      <Route path="/login"><Login setJWT={setJWT} /></Route>
      <Route path="/"><Dashboard setLogout={setLogout}></Dashboard></Route>
    </Switch>
  </div>;
}

export default App;
