import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/v1/api/payment";

function authHeaders() {
  const token = localStorage.getItem("token");

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}


// ==========================================
// GET ALL PAYMENTS
// ==========================================

const getAllPayments = async ({page}) => {
  const { data } = await axios.get(API_BASE, {
    params: { page },
    headers: authHeaders(),
  });

  return data;
};


// ==========================================
// GET SINGLE PAYMENT
// ==========================================

const getPayment = async (id) => {
  const { data } = await axios.get(
    `${API_BASE}/${id}`,
    {
      headers: authHeaders(),
    }
  );

  return data;
};


// ==========================================
// GET PAYMENTS BY INVOICE
// ==========================================

const getPaymentsByInvoice = async (invoiceId) => {
  const { data } = await axios.get(
    `${API_BASE}/invoice/${invoiceId}`,
    {
      headers: authHeaders(),
    }
  );

  return data;
};


// ==========================================
// CREATE PAYMENT
// ==========================================

const createPayment = async (paymentData) => {
  const { data } = await axios.post(
    API_BASE,
    paymentData,
    {
      headers: authHeaders(),
    }
  );

  return data;
};


// ==========================================
// UPDATE PAYMENT
// ==========================================

const updatePayment = async (id, paymentData) => {
  const { data } = await axios.put(
    `${API_BASE}/${id}`,
    paymentData,
    {
      headers: authHeaders(),
    }
  );

  return data;
};


// ==========================================
// DELETE PAYMENT
// ==========================================

const deletePayment = async (id) => {
  const { data } = await axios.delete(
    `${API_BASE}/${id}`,
    {
      headers: authHeaders(),
    }
  );

  return data;
};


export default {
  getAllPayments,
  getPayment,
  getPaymentsByInvoice,
  createPayment,
  updatePayment,
  deletePayment,
};