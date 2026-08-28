import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/v1/api/integration";

function authHeaders() {
  const token = localStorage.getItem("token");

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

// Get All Integrations
const getAllIntegrations = async () => {
  const { data } = await axios.get(API_BASE, {
    headers: authHeaders(),
  });

  return data;
};

// Save Email Integration
const saveEmailIntegration = async (integrationData) => {
  const { data } = await axios.post(
    `${API_BASE}/email`,
    integrationData,
    {
      headers: authHeaders(),
    }
  );

  return data;
};

// Save Twilio Integration
const saveTwilioIntegration = async (integrationData) => {
  const { data } = await axios.post(
    `${API_BASE}/twilio`,
    integrationData,
    {
      headers: authHeaders(),
    }
  );

  return data;
};

// Delete Integration
const deleteIntegration = async (id) => {
  const { data } = await axios.delete(API_BASE, {
    params: { id },
    headers: authHeaders(),
  });

  return data;
};

export default {
  getAllIntegrations,
  saveEmailIntegration,
  saveTwilioIntegration,
  deleteIntegration,
};