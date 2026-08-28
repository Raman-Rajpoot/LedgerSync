import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/v1/api/report";

function authHeaders() {
  const token = localStorage.getItem("token");

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

// Get Report
const getReport = async () => {
  const { data } = await axios.get(API_BASE, {
    
    headers: authHeaders(),
  });

  return data;
};

export default {
  getReport,
};