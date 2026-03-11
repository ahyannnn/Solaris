export const getClientInfo = async () => {
  const token = sessionStorage.getItem('token');

  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/me`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch client");
  }

  return data.client;
};