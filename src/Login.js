import { useState } from "react";
import { login } from "./services";

function Field({ id, label, value, setValue, ...rest }) {

  return <div style={{ display: "flex", flexDirection: "column" }}>
    <label htmlFor={id}>{label}</label>
    <input {...rest} id={id} value={value} onChange={(ev) => setValue(ev.target.value)} />
  </div>;
}


export function Login({ setJWT }) {
  const style = {
    display: "flex",
    flexDirection: "column",
    gap: "1em",
    maxWidth: "25em",
    margin: "auto",
    marginTop: "5rem"
  };

  const [username, setUsername] = useState();
  const [password, setPassword] = useState();
  const onSubmit = async (event) => {
    event.preventDefault();
    const { jwt } = await login({ username, password });
    console.log(jwt);
    setJWT(jwt);
  };

  return <form style={style} onSubmit={onSubmit}>
    <h1 style={{ marginBottom: "0rem" }}>Login</h1>
    <Field id="username" label="Username" value={username} setValue={setUsername} />
    <Field id="password" label="Password" value={password} setValue={setPassword} type="password" />
    <button>Login</button>
  </form>
}