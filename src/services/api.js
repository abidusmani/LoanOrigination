/**
 * API Service Layer
 * This file contains all API calls that will be used when backend is ready.
 * Currently returns mock responses for frontend development.
 */

import API_ENDPOINTS from '../constants/apiEndpoints';

// Default request configuration
const defaultConfig = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// Get auth token from localStorage
const getAuthToken = () => localStorage.getItem('los_token');

// Add auth header to request
const withAuth = (config = {}) => {
  const token = getAuthToken();
  if (token) {
    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      },
    };
  }
  return config;
};

// Generic fetch wrapper with error handling
const fetchAPI = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...defaultConfig,
      ...options,
      headers: {
        ...defaultConfig.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
};

// Application Service
export const ApplicationService = {
  // Create new application
  create: async (data) => {
    return fetchAPI(API_ENDPOINTS.APPLICATIONS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
      ...withAuth(),
    });
  },

  // Get application by ID
  getById: async (id) => {
    return fetchAPI(API_ENDPOINTS.APPLICATIONS.GET_BY_ID(id), withAuth());
  },

  // Get all applications
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams 
      ? `${API_ENDPOINTS.APPLICATIONS.GET_ALL}?${queryParams}` 
      : API_ENDPOINTS.APPLICATIONS.GET_ALL;
    return fetchAPI(url, withAuth());
  },

  // Update application
  update: async (id, data) => {
    return fetchAPI(API_ENDPOINTS.APPLICATIONS.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(data),
      ...withAuth(),
    });
  },
};

// KYC Service
export const KYCService = {
  // Initiate KYC verification
  initiate: async (applicationId) => {
    return fetchAPI(API_ENDPOINTS.KYC.INITIATE(applicationId), {
      method: 'POST',
      ...withAuth(),
    });
  },

  // Get KYC status
  getStatus: async (applicationId) => {
    return fetchAPI(API_ENDPOINTS.KYC.STATUS(applicationId), withAuth());
  },
};

// Credit Bureau Service
export const CreditService = {
  // Initiate credit check
  initiate: async (applicationId) => {
    return fetchAPI(API_ENDPOINTS.CREDIT.INITIATE(applicationId), {
      method: 'POST',
      ...withAuth(),
    });
  },

  // Get credit check status
  getStatus: async (applicationId) => {
    return fetchAPI(API_ENDPOINTS.CREDIT.STATUS(applicationId), withAuth());
  },
};

// Eligibility Service
export const EligibilityService = {
  // Check eligibility
  check: async (applicationId) => {
    return fetchAPI(API_ENDPOINTS.ELIGIBILITY.CHECK(applicationId), {
      method: 'POST',
      ...withAuth(),
    });
  },
};

// Auth Service
export const AuthService = {
  // Login
  login: async (email, password) => {
    return fetchAPI(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Logout
  logout: async () => {
    return fetchAPI(API_ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
      ...withAuth(),
    });
  },

  // Refresh token
  refresh: async () => {
    return fetchAPI(API_ENDPOINTS.AUTH.REFRESH, {
      method: 'POST',
      ...withAuth(),
    });
  },
};

// Admin Service
export const AdminService = {
  // Get all applications (admin view)
  getApplications: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams 
      ? `${API_ENDPOINTS.ADMIN.APPLICATIONS}?${queryParams}` 
      : API_ENDPOINTS.ADMIN.APPLICATIONS;
    return fetchAPI(url, withAuth());
  },

  // Get dashboard stats
  getStats: async () => {
    return fetchAPI(API_ENDPOINTS.ADMIN.STATS, withAuth());
  },
};

export default {
  ApplicationService,
  KYCService,
  CreditService,
  EligibilityService,
  AuthService,
  AdminService,
};
