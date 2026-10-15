import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL_AUTH || 'http://localhost:5000/v1/api/auth';

const saveToken = (token) => {
  localStorage.setItem('token', token);
};

const saveUser = (user) => {
  if (user) localStorage.setItem('user', JSON.stringify(user));
};

const persistOrganizationId = (organizationId) => {
  if (!organizationId) return;
  localStorage.setItem('organizationId', organizationId);
  localStorage.setItem('organisationId', organizationId);
};

const login = async (email, password) => {
  const { data } = await axios.post(`${API_BASE}/login`, { email, password });
  if (data.token) saveToken(data.token);
  saveUser(data.user);
  if (data.user?.organizationId) persistOrganizationId(data.user.organizationId);
  return data;
};

const register = async (organizationName, email, password, fullName) => {
  const { data } = await axios.post(`${API_BASE}/register`, { organizationName, email, password, fullName });
  if (data.token) saveToken(data.token);
  saveUser(data.user);
  if (data.user?.organizationId) persistOrganizationId(data.user.organizationId);
  return data;
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('organizationId');
  localStorage.removeItem('organisationId');
};

export default { login, register, logout };
