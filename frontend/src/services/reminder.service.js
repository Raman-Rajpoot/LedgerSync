import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/v1/api/reminders";

// ==========================================
// AUTH HEADERS
// ==========================================

const authHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};


// ==========================================
// GET ALL REMINDERS
// GET /api/reminders
// ==========================================

const getAllReminders = async (params = {}) => {
  const { data } = await axios.get(API_BASE, {
    params,
    headers: authHeaders(),
  });

  return data;
};


// ==========================================
// GET SINGLE REMINDER
// GET /api/reminders/:id
// ==========================================

const getReminder = async (id) => {
  const { data } = await axios.get(
    `${API_BASE}/${id}`,
    {
      headers: authHeaders(),
    }
  );

  return data;
};
// GET /api/reminders/invoice/:invoiceId
// ==========================================

const getReminderByInvoice = async (
  invoiceId
) => {
  const { data } = await axios.get(
    `${API_BASE}/invoice/${invoiceId}`,
    {
      headers: authHeaders(),
    }
  );

  return data;
};


// ==========================================
// CREATE REMINDER CONFIG
// POST /api/reminders
// ==========================================

const createReminder = async (data) => {
  const response = await axios.post(
    API_BASE,
    data,
    {
      headers: authHeaders(),
    }
  );

  return response.data;
};


// ==========================================
// UPDATE REMINDER CONFIG
// PATCH /api/reminders/:id
// ==========================================

const updateReminder = async (
  id,
  data
) => {
  const response = await axios.patch(
    `${API_BASE}/${id}`,
    data,
    {
      headers: authHeaders(),
    }
  );

  return response.data;
};


// ==========================================
// ENABLE / DISABLE REMINDERS
// ==========================================

const toggleReminder = async (
  id,
  enabled
) => {
  const response = await axios.patch(
    `${API_BASE}/${id}`,
    {
      enabled,
    },
    {
      headers: authHeaders(),
    }
  );

  return response.data;
};


// ==========================================
// PAUSE REMINDER
// ==========================================

const pauseReminder = async (
  id,
  pauseUntil
) => {
  const response = await axios.patch(
    `${API_BASE}/${id}`,
    {
      pauseUntil,
    },
    {
      headers: authHeaders(),
    }
  );

  return response.data;
};


// ==========================================
// RESUME REMINDER
// ==========================================

const resumeReminder = async (id) => {
  const response = await axios.patch(
    `${API_BASE}/${id}`,
    {
      pauseUntil: null,
    },
    {
      headers: authHeaders(),
    }
  );

  return response.data;
};


// ==========================================
// DELETE REMINDER CONFIG
// ==========================================

const deleteReminder = async (id) => {
  const { data } = await axios.delete(
    `${API_BASE}/${id}`,
    {
      headers: authHeaders(),
    }
  );

  return data;
};


// ==========================================
// EXPORT
// ==========================================

const reminderService = {
  getAllReminders,
  getReminder,
  getReminderByInvoice,
  createReminder,
  updateReminder,
  toggleReminder,
  pauseReminder,
  resumeReminder,
  deleteReminder,
};

export default reminderService;