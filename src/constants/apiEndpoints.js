// API endpoints configuration
// These will be used when connecting to the backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
  },

  // Application endpoints
  APPLICATIONS: {
    BASE: `${API_BASE_URL}/applications`,
    GET_ALL: `${API_BASE_URL}/applications`,
    GET_BY_ID: (id) => `${API_BASE_URL}/applications/${id}`,
    CREATE: `${API_BASE_URL}/applications`,
    UPDATE: (id) => `${API_BASE_URL}/applications/${id}`,
    DELETE: (id) => `${API_BASE_URL}/applications/${id}`,
  },

  // KYC endpoints
  KYC: {
    INITIATE: (applicationId) => `${API_BASE_URL}/applications/${applicationId}/kyc/initiate`,
    STATUS: (applicationId) => `${API_BASE_URL}/applications/${applicationId}/kyc/status`,
  },

  // Credit check endpoints
  CREDIT: {
    INITIATE: (applicationId) => `${API_BASE_URL}/applications/${applicationId}/credit/initiate`,
    STATUS: (applicationId) => `${API_BASE_URL}/applications/${applicationId}/credit/status`,
  },

  // Eligibility endpoints
  ELIGIBILITY: {
    CHECK: (applicationId) => `${API_BASE_URL}/applications/${applicationId}/eligibility`,
  },

  // Admin endpoints
  ADMIN: {
    APPLICATIONS: `${API_BASE_URL}/admin/applications`,
    STATS: `${API_BASE_URL}/admin/stats`,
  },
};

export default API_ENDPOINTS;
