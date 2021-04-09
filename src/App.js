import './App.css';
import { Login } from './Login';
import { BrowserRouter, Link, Route, Switch, useHistory } from 'react-router-dom';
import { Events } from './Events';
import { CAs } from './CAs';

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
    history.replace("/events");
  };

  const setLogout = () => {
    window.localStorage.removeItem("jwt");
    history.replace("/login");
  }

  return <div className="App">
    <Switch>
      <Route path="/login"><Login setJWT={setJWT} /></Route>
      <Route>
        <LoggedInPage setLogout={setLogout}>
          <Switch>
            <Route exact path="/"><Dashboard /></Route>
            <Route path="/events"><Events jwt={jwt} /></Route>
            <Route path="/cas"><CAs jwt={jwt} /></Route>
            <Route><div className="pad1">Page not found</div></Route>
          </Switch>
        </LoggedInPage>
      </Route>
    </Switch>
  </div>;
}

function LoggedInPage({ setLogout, children }) {
  return <main>
    <header>
      <h1>PRC Admin Panel</h1>
      <button onClick={setLogout}>Logout</button>
    </header>
    {children}
  </main>
}

function Dashboard() {
  return <div className="dashboard">
    <Link to="/events">Events</Link>
    <Link to="/cas">CAs</Link>
  </div>
}

export default App;
