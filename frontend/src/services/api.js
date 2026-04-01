const BASE_URL = "http://localhost:3000";

export const signupUser = async (userData) => {
  const response = await fetch(`${BASE_URL}/api/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  return { ok: response.ok, data };
};

export const loginUser = async (userData) => {
  const response = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  return { ok: response.ok, data };
};