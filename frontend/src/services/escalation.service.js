import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/v1/api/escalation";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getRules = async () => {
  const { data } = await axios.get(API_BASE, {
    headers: authHeaders(),
  });
  return data;
};

const getRule = async (id) => {
  const { data } = await axios.get(`${API_BASE}/${id}`, {
    headers: authHeaders(),
  });
  return data;
};

const createRule = async (rule) => {
  const { data } = await axios.post(API_BASE, rule, {
    headers: authHeaders(),
  });
  return data;
};

const updateRule = async (id, rule) => {
  const { data } = await axios.patch(`${API_BASE}/${id}`, rule, {
    headers: authHeaders(),
  });
  return data;
};

const toggleRule = async (id) => {
  const { data } = await axios.patch(
    `${API_BASE}/toggle/${id}`,
    {},
    { headers: authHeaders() }
  );
  return data;
};

const deleteRule = async (id) => {
  const { data } = await axios.delete(`${API_BASE}/${id}`, {
    headers: authHeaders(),
  });
  return data;
};

const getRuleStatistics = async () => {
  const { data } = await axios.get(`${API_BASE}/statistics`, {
    headers: authHeaders(),
  });
  return data;
};

const getHistory = async (params = {}) => {
  const { data } = await axios.get(`${API_BASE}/history`, {
    params,
    headers: authHeaders(),
  });
  return data;
};

const getHistoryEntry = async (id) => {
  const { data } = await axios.get(`${API_BASE}/history/${id}`, {
    headers: authHeaders(),
  });
  return data;
};

const getInvoiceHistory = async (invoiceId, params = {}) => {
  const { data } = await axios.get(
    `${API_BASE}/invoices/${invoiceId}/history`,
    { params, headers: authHeaders() }
  );
  return data;
};

export default {
  getRules,
  getRule,
  createRule,
  updateRule,
  toggleRule,
  deleteRule,
  getRuleStatistics,
  getHistory,
  getHistoryEntry,
  getInvoiceHistory,
};
