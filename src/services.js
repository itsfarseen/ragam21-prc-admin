
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

export async function eventDetails({ jwt, id }) {
  const resp = await fetch(backendURL + `/user-event-details?event=${id}&_limit=99999`,
    {
      headers: { "Authorization": "Bearer " + jwt },
    }
  );
  return await resp.json();
}
