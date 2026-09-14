import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/v1/api/integration";

function authHeaders() {
  const token = localStorage.getItem("token");

  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getOrganizationId() {
  return (
    localStorage.getItem("organizationId") ||
    localStorage.getItem("organisationId") ||
    ""
  );
}

const getAllIntegrations = async () => {
  const organizationId = getOrganizationId();

  const { data } = await axios.get(API_BASE, {
    params: { organizationId },
    headers: authHeaders(),
  });

  return data;
};

const saveEmailIntegration = async (integrationData) => {
  const { data } = await axios.post(
    `${API_BASE}/email`,
    {
      ...integrationData,
      organizationId: getOrganizationId(),
    },
    { headers: authHeaders() }
  );

  return data;
};

const saveTwilioIntegration = async (integrationData) => {
  const { data } = await axios.post(
    `${API_BASE}/twilio`,
    {
      ...integrationData,
      organizationId: getOrganizationId(),
    },
    { headers: authHeaders() }
  );

  return data;
};

const testIntegration = async ({ type, ...payload }) => {
  const endpoint =
    type === "email" ? `${API_BASE}/email/test` : `${API_BASE}/twilio/test`;

  const { data } = await axios.post(
    endpoint,
    {
      ...payload,
      organizationId: payload.organizationId || getOrganizationId(),
    },
    { headers: authHeaders() }
  );

  return data;
};

const deleteIntegration = async (type) => {
  const { data } = await axios.delete(`${API_BASE}/${type}`, {
    params: { organizationId: getOrganizationId() },
    headers: authHeaders(),
  });

  return data;
};

export default {
  getAllIntegrations,
  saveEmailIntegration,
  saveTwilioIntegration,
  testIntegration,
  deleteIntegration,
};