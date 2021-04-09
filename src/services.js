
const backendURL = "https://api.ragam.live"

export async function login({ username, password }) {
  const resp = await fetch(backendURL + "/auth/local",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ "identifier": username, "password": password })
    }
  );
  return await resp.json();
}

export async function eventsByCategory() {
  const resp = await fetch(backendURL + "/categories");
  return resp.json();
}

