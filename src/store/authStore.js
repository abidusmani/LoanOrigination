import { create } from 'zustand';

// Mock admin credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@los.com',
  password: 'admin123',
};

// Auth store
export const useAuthStore = create((set, get) => ({
  // User state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Login
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      const user = {
        id: 'admin-001',
        email,
        name: 'Admin User',
        role: 'admin',
      };
      
      // Store token in localStorage (mock)
      localStorage.setItem('los_token', 'mock-jwt-token');
      localStorage.setItem('los_user', JSON.stringify(user));
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return true;
    }
    
    set({
      error: 'Invalid email or password',
      isLoading: false,
    });
    
    return false;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('los_token');
    localStorage.removeItem('los_user');
    
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  // Check auth status (on app load)
  checkAuth: () => {
    const token = localStorage.getItem('los_token');
    const userStr = localStorage.getItem('los_user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({
          user,
          isAuthenticated: true,
        });
        return true;
      } catch {
        // Invalid stored data
        localStorage.removeItem('los_token');
        localStorage.removeItem('los_user');
      }
    }
    
    return false;
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

export default useAuthStore;
