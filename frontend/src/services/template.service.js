import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/v1/api/template";


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
// GET ALL TEMPLATES
// GET /v1/api/template
//
// Supports:
// channel
// stage
// isActive
// search
// page
// limit
// ==========================================

const getAllTemplates = async (filters = {}) => {
  const firstPage = await axios.get(API_BASE, {
    params: { ...filters, page: 1, limit: 100 },
    headers: authHeaders(),
  });
  const result = firstPage.data;

  if (!result.success || !Array.isArray(result.data)) {
    return result;
  }

  const totalPages = Number(result.totalPages) || 1;
  const pages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      axios.get(API_BASE, {
        params: { ...filters, page: index + 2, limit: 100 },
        headers: authHeaders(),
      })
    )
  );
  const remainingTemplates = pages.flatMap(({ data }) => {
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error("Failed to load all template pages.");
    }
    return data.data;
  });

  return {
    ...result,
    data: [...result.data, ...remainingTemplates],
  };
};


// ==========================================
// GET SINGLE TEMPLATE
// GET /v1/api/template/getTemplate/:id
// ==========================================

const getTemplate = async (id) => {
  const { data } = await axios.get(
    `${API_BASE}/getTemplate/${id}`,
    {
      headers: authHeaders(),
    }
  );

  return data;
};


// ==========================================
// CREATE TEMPLATE
// POST /v1/api/templates
// ==========================================

const createTemplate = async (templateData) => {
  const { data } = await axios.post(
    API_BASE,
    templateData,
    {
      headers: authHeaders(),
    }
  );

  return data;
};


// ==========================================
// UPDATE TEMPLATE
// PATCH /v1/api/templates/:id
// ==========================================

const updateTemplate = async (
  id,
  templateData
) => {
  const { data } = await axios.patch(
    `${API_BASE}/${id}`,
    templateData,
    {
      headers: authHeaders(),
    }
  );

  return data;
};


// ==========================================
// DELETE TEMPLATE
// DELETE /v1/api/templates/:id
// ==========================================

const deleteTemplate = async (id) => {
  const { data } = await axios.delete(
    `${API_BASE}/${id}`,
    {
      headers: authHeaders(),
    }
  );

  return data;
};


const templateService = {
  getAllTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};

export default templateService;