import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/v1/api/project";

function authHeaders() {
  const token = localStorage.getItem("token");

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

// Create Project
const createProject = async (projectData) => {
  const { data } = await axios.post(
    `${API_BASE}/`,
    projectData,
    {
      headers: authHeaders(),
    }
  );

  return data;
};

// Get All Projects
const getAllProjects = async (params = {}) => {
  const { data } = await axios.get(
    `${API_BASE}/`,
    {
      params,
      headers: authHeaders(),
    }
  );

  return data;
};

// Get Single Project
const getProject = async (id) => {
  const { data } = await axios.get(
    `${API_BASE}/${id}`,
    {
      headers: authHeaders(),
    }
  );

  return data;
};

// Update Project
const updateProject = async (id, projectData) => {
  const { data } = await axios.patch(
    `${API_BASE}/${id}`,
    projectData,
    {
      headers: authHeaders(),
    }
  );

  return data;
};

// Delete Project
const deleteProject = async (id) => {
  const { data } = await axios.delete(
    `${API_BASE}/${id}`,
    {
      headers: authHeaders(),
    }
  );

  return data;
};

export default {
  createProject,
  getAllProjects,
  getProject,
  updateProject,
  deleteProject,
};