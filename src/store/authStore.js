import { create } from 'zustand';
import API_ENDPOINTS from '../constants/apiEndpoints';

// Auth store
export const useAuthStore = create((set, get) => ({
  // User state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Register new user
  register: async (email, password, fullName) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      set({ isLoading: false });
      return true;
    } catch (error) {
      set({
        error: error.message || 'Registration failed',
        isLoading: false,
      });
      return false;
    }
  },

  // Login with real API
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Invalid email or password');
      }

      // Store token
      localStorage.setItem('los_token', data.access_token);

      // Fetch user details
      const userResponse = await fetch(API_ENDPOINTS.AUTH.ME, {
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        const user = {
          id: userData.id,
          email: userData.email,
          name: userData.full_name || userData.email,
          role: userData.role,
        };
        
        localStorage.setItem('los_user', JSON.stringify(user));
        
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        
        return true;
      }

      throw new Error('Failed to fetch user details');
    } catch (error) {
      set({
        error: error.message || 'Login failed',
        isLoading: false,
      });
      return false;
    }
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
  checkAuth: async () => {
    const token = localStorage.getItem('los_token');
    const userStr = localStorage.getItem('los_user');
    
    if (token && userStr) {
      try {
        // Verify token is still valid
        const response = await fetch(API_ENDPOINTS.AUTH.ME, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          const user = {
            id: userData.id,
            email: userData.email,
            name: userData.full_name || userData.email,
            role: userData.role,
          };
          
          localStorage.setItem('los_user', JSON.stringify(user));
          
          set({
            user,
            isAuthenticated: true,
          });
          return true;
        }
        
        // Token invalid, clear storage
        localStorage.removeItem('los_token');
        localStorage.removeItem('los_user');
      } catch {
        // Network error, use cached user
        const user = JSON.parse(userStr);
        set({
          user,
          isAuthenticated: true,
        });
        return true;
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
