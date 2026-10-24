
const API_BASE = "https://firefly-backend-36rk.onrender.com";

export async function getNetwork() {
  const response = await fetch(`${API_BASE}/api/network`);
  if (!response.ok) {
    throw new Error(`Network request failed: ${response.status}`);
  }
  return response.json();
}

export async function getAlerts() {
  const response = await fetch(`${API_BASE}/api/alerts`);
  if (!response.ok) {
    throw new Error(`Alerts request failed: ${response.status}`);
  }
  return response.json();
}

export async function sendSOS(sosData) {
  const response = await fetch(`${API_BASE}/api/sos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sosData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `SOS request failed: ${response.status}`);
  }

  return response.json();
}

export async function toggleNode(nodeId) {
  const response = await fetch(
    `${API_BASE}/api/nodes/${encodeURIComponent(nodeId)}/toggle`,
    { method: "PATCH" }
  );

  if (!response.ok) {
    throw new Error(`Node update failed: ${response.status}`);
  }
  return response.json();
}

export async function resetNetwork() {
  const response = await fetch(`${API_BASE}/api/network/reset`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Network reset failed: ${response.status}`);
  }
  return response.json();
}
  
export async function getEvents() {
  const response = await fetch(`${API_BASE}/api/events`);

  if (!response.ok) {
    throw new Error(`Events request failed: ${response.status}`);
  }

  return response.json();
}
