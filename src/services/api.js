import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

const TOKEN_KEY = "hms-token";
const USER_KEY = "hms-user";

const api = axios.create({
  baseURL: API_BASE_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

export const setAuthSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user || {}));
};

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const isAdmin = () => getStoredUser()?.role === "ADMIN";
export const isDoctor = () => getStoredUser()?.role === "DOCTOR";
export const isPatient = () => getStoredUser()?.role === "PATIENT";

export const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  "Something went wrong. Please try again.";

export const authService = {
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },
  register: async (payload) => {
    const response = await api.post("/auth/register", payload);
    return response.data;
  }
};

export const patientService = {
  getAll: async () => {
    const response = await api.get("/patients");
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },
  create: async (payload) => {
    const response = await api.post("/patients", payload);
    return response.data;
  },
  update: async (id, payload) => {
    const response = await api.put(`/patients/${id}`, payload);
    return response.data;
  },
  remove: async (id) => {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
  }
};

export const doctorService = {
  getAll: async () => {
    const response = await api.get("/doctors");
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/doctors/${id}`);
    return response.data;
  },
  create: async (payload) => {
    const response = await api.post("/doctors", payload);
    return response.data;
  },
  update: async (id, payload) => {
    const response = await api.put(`/doctors/${id}`, payload);
    return response.data;
  },
  remove: async (id) => {
    const response = await api.delete(`/doctors/${id}`);
    return response.data;
  }
};

export const billingService = {
  getAll: async (params = {}) => {
    const response = await api.get("/billings", { params });
    return response.data;
  },
  updatePaymentStatus: async (id, paymentStatus) => {
    const response = await api.put(`/billings/${id}/payment-status`, { paymentStatus });
    return response.data;
  }
};

export const appointmentService = {
  getAll: async () => {
    const response = await api.get("/appointments");
    return response.data;
  },
  create: async (payload) => {
    const response = await api.post("/appointments", payload);
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await api.put(`/appointments/${id}/status`, { status });
    return response.data;
  },
  remove: async (id) => {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  }
};

export default api;
