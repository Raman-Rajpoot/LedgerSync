import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/v1/api";

function authHeaders() {
  const token = localStorage.getItem("token");

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

// Get Dashboard Statistics
const getDashboardStatistics = async () => {
  const { data } = await axios.get(
    `${API_BASE}/dashboard`,
    {
      headers: authHeaders(),
    }
  );

  return data;
};

export default {
  getDashboardStatistics,
};