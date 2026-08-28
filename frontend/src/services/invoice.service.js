import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/v1/api/invoice";


// ==========================================
// Authentication Headers
// ==========================================

function authHeaders() {
  const token = localStorage.getItem("token");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}


// ==========================================
// Get All Invoices
// ==========================================

const getAllInvoices = async ({ status, clientId, search, page }) => {
  const data = await axios.get(
    `${API_BASE}`,
    {
      headers: authHeaders(),
      params: {
        status,
        clientId,
        search,
        page,
      }
    }
  );

  return data;
};


// ==========================================
// Get Single Invoice
// ==========================================

const getInvoice = async (id) => {
  if (!id) {
    throw new Error("Invoice ID is required");
  }

  const { data } = await axios.get(
    `${API_BASE}/${id}`,
    {
      headers: authHeaders(),
    }
  );

  return data;
};


// ==========================================
// Create Invoice
// ==========================================

const createInvoice = async (invoiceData) => {
  const { data } = await axios.post(
    `${API_BASE}`,
    invoiceData,
    {
      headers: authHeaders(),
    }
  );

  return data;
};


// ==========================================
// Update Invoice
// ==========================================

const updateInvoice = async (id, invoiceData) => {
  if (!id) {
    throw new Error("Invoice ID is required");
  }

  const { data } = await axios.patch(
    `${API_BASE}/${id}`,
    invoiceData,
    {
      headers: authHeaders(),
    }
  );

  return data;
};


// ==========================================
// Delete Invoice
// ==========================================

const deleteInvoice = async (id) => {
  if (!id) {
    throw new Error("Invoice ID is required");
  }

  const { data } = await axios.delete(
    `${API_BASE}/${id}`,
    {
      headers: authHeaders(),
    }
  );

  return data;
};


// ==========================================
// Update Invoice Status
// ==========================================

const updateStatus = async (id, status) => {
  if (!id) {
    throw new Error("Invoice ID is required");
  }

  const { data } = await axios.patch(
    `${API_BASE}/updateStatus/${id}`,
    {
      status,
    },
    {
      headers: authHeaders(),
    }
  );

  return data;
};


// ==========================================
// Mark Invoice Paid
// ==========================================

const markPaid = async (id) => {
  if (!id) {
    throw new Error("Invoice ID is required");
  }

  const { data } = await axios.patch(
    `${API_BASE}/${id}/paid`,
    {},
    {
      headers: authHeaders(),
    }
  );

  return data;
};


// ==========================================
// Mark Invoice Partial
// ==========================================

const markPartial = async (id, amount) => {
  if (!id) {
    throw new Error("Invoice ID is required");
  }

  const { data } = await axios.patch(
    `${API_BASE}/markPartial/${id}`,
    {
      amount,
    },
    {
      headers: authHeaders(),
    }
  );

  return data;
};


// ==========================================
// Invoice Statistics
// ==========================================

const getInvoiceStatistics = async () => {
  const { data } = await axios.get(
    `${API_BASE}/statistics`,
    {
      headers: authHeaders(),
    }
  );

  return data;
};


// ==========================================
// Export
// ==========================================

export default {
  getAllInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateStatus,
  markPaid,
  markPartial,
  getInvoiceStatistics,
};