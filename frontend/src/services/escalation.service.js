import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/v1/api/escalation";

function authHeaders() {
  const token = localStorage.getItem("token");

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}


// ==========================================
// GET ALL ESCALATIONS
// ==========================================

const getAllEscalations = async () => {
  const { data } = await axios.get(API_BASE, {
    headers: authHeaders(),
  });

  return data;
};


// ==========================================
// GET SINGLE ESCALATION
// ==========================================

const getEscalation = async (id) => {
  const { data } = await axios.get(
    `${API_BASE}/${id}`,
    {
      headers: authHeaders(),
    }
  );

  return data;
};


// ==========================================
// CREATE ESCALATION
// ==========================================

const createEscalation = async (escalationData) => {
  const { data } = await axios.post(
    API_BASE,
    escalationData,
    {
      headers: authHeaders(),
    }
  );

  return data;
};


// ==========================================
// UPDATE ESCALATION
// ==========================================

const updateEscalation = async (id, escalationData) => {
  const { data } = await axios.put(
    `${API_BASE}/${id}`,
    escalationData,
    {
      headers: authHeaders(),
    }
  );

  return data;
};


// ==========================================
// DELETE ESCALATION
// ==========================================

const deleteEscalation = async (id) => {
  const { data } = await axios.delete(
    `${API_BASE}/${id}`,
    {
      headers: authHeaders(),
    }
  );

  return data;
};


export default {
  getAllEscalations,
  getEscalation,
  createEscalation,
  updateEscalation,
  deleteEscalation,
};