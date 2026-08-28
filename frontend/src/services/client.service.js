import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/v1/api/client";

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Create Client
const createClient = async (clientData) => {
  const organizationId = clientData?.organizationId || clientData?.organisationId || localStorage.getItem('organizationId') || localStorage.getItem('organisationId');
  const payload = { ...clientData, ...(organizationId ? { organizationId, organisationId: organizationId } : {}) };

  const { data } = await axios.post(`${API_BASE}/createClient`, payload, { headers: authHeaders() });
  return data;
};

// Get All Clients
const getAllClients = async (organisationId) => {
  const orgId = organisationId || localStorage.getItem('organizationId') || localStorage.getItem('organisationId');

  const { data } = await axios.get(`${API_BASE}/getAllClient`, {
    params: {
      organisationId: orgId,
      organizationId: orgId,
    },
    headers: authHeaders(),
  });

  return data;
};

// Get Single Client
const getClient = async (id) => {
  const { data } = await axios.get(`${API_BASE}/${id}`, { headers: authHeaders() });
  return data;
};

// Update Client
const updateClient = async (id, clientData) => {
  const { data } = await axios.put(`${API_BASE}/${id}`, clientData, { headers: authHeaders() });
  return data;
};

// Delete Client
const deleteClient = async (id) => {
  const { data } = await axios.delete(`${API_BASE}/${id}`, { headers: authHeaders() });
  return data;
};

export default {
  createClient,
  getAllClients,
  getAllClient: getAllClients,
  getClient,
  updateClient,
  deleteClient,
};