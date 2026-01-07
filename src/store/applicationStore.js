import { create } from 'zustand';
import { WORKFLOW_STATES } from '../constants/workflowStates';
import API_ENDPOINTS from '../constants/apiEndpoints';

// Get auth token
const getAuthToken = () => localStorage.getItem('los_token');

// API fetch helper with auth
const fetchAPI = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || `Request failed: ${response.status}`);
  }

  return data;
};

// Map backend KYC result to frontend format
const mapKycResult = (kycResult) => {
  if (!kycResult) return null;
  return {
    verified: kycResult.verified,
    nameMatchScore: kycResult.name_match_score,
    verificationId: kycResult.verification_id,
    verifiedAt: kycResult.verified_at,
    details: kycResult.details ? {
      nameMatch: kycResult.details.name_match,
      panVerified: kycResult.details.pan_verified,
      panHolderType: kycResult.details.pan_holder_type,
      aadhaarLinked: kycResult.details.aadhaar_linked,
      panName: kycResult.details.pan_name,
      maskedAadhaar: kycResult.details.masked_aadhaar,
      verificationMethod: kycResult.details.verification_method,
    } : null,
  };
};

// Map backend credit result to frontend format
const mapCreditResult = (creditResult) => {
  if (!creditResult) return null;
  return {
    passed: creditResult.passed,
    creditScore: creditResult.credit_score,
    activeLoans: creditResult.active_loans,
    bureauId: creditResult.bureau_id,
    checkedAt: creditResult.checked_at,
    details: creditResult.details ? {
      creditHistory: creditResult.details.credit_history,
      paymentHistory: creditResult.details.payment_history,
      creditUtilization: creditResult.details.credit_utilization,
      oldestAccount: creditResult.details.oldest_account,
      recentEnquiries: creditResult.details.recent_enquiries,
      totalAccounts: creditResult.details.total_accounts,
      closedAccounts: creditResult.details.closed_accounts,
    } : null,
  };
};

// Map backend eligibility result to frontend format
const mapEligibilityResult = (eligibilityResult) => {
  if (!eligibilityResult) return null;
  return {
    eligible: eligibilityResult.eligible,
    requestedLoanAmount: eligibilityResult.requested_loan_amount,
    approvedLoanAmount: eligibilityResult.approved_loan_amount,
    maxEligibleAmount: eligibilityResult.max_eligible_amount,
    requestedEMI: eligibilityResult.requested_emi,
    maxAllowedEMI: eligibilityResult.max_allowed_emi,
    interestRate: eligibilityResult.interest_rate,
    tenure: eligibilityResult.tenure,
    totalPayable: eligibilityResult.total_payable,
    totalInterest: eligibilityResult.total_interest,
    reason: eligibilityResult.reason,
  };
};

// Map backend response to frontend format
const mapApplicationFromBackend = (app) => ({
  id: app.application_id,
  status: app.status,
  createdAt: app.created_at,
  updatedAt: app.updated_at,
  fullName: app.full_name,
  mobile: app.mobile,
  pan: app.pan,
  dob: app.dob,
  employmentType: app.employment_type,
  monthlyIncome: app.monthly_income,
  loanAmount: app.loan_amount,
  kycResult: mapKycResult(app.kyc_result),
  kycCompletedAt: app.kyc_completed_at,
  creditResult: mapCreditResult(app.credit_result),
  creditCompletedAt: app.credit_completed_at,
  eligibilityResult: mapEligibilityResult(app.eligibility_result),
  eligibilityCheckedAt: app.eligibility_checked_at,
  journeyLog: app.journey_log || [],
});

// Map frontend data to backend format
const mapApplicationToBackend = (data) => ({
  full_name: data.fullName,
  mobile: data.mobile,
  pan: data.pan,
  dob: data.dob,
  employment_type: data.employmentType,
  monthly_income: Number(data.monthlyIncome),
  loan_amount: Number(data.loanAmount),
});

// Application store
export const useApplicationStore = create((set, get) => ({
  // Current application being processed
  currentApplication: null,
  
  // All applications (for admin view)
  applications: [],
  
  // Loading state
  isLoading: false,
  
  // Error state
  error: null,

  // Admin stats
  stats: null,

  // Pagination
  pagination: null,

  // Initialize a new application (just creates local state, not saved to backend yet)
  initializeApplication: () => {
    const newApp = {
      id: null, // Will be set by backend
      status: WORKFLOW_STATES.DRAFT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fullName: '',
      mobile: '',
      pan: '',
      dob: '',
      employmentType: '',
      monthlyIncome: '',
      loanAmount: '',
      kycResult: null,
      kycCompletedAt: null,
      creditResult: null,
      creditCompletedAt: null,
      eligibilityResult: null,
      eligibilityCheckedAt: null,
      journeyLog: [{
        timestamp: new Date().toISOString(),
        action: 'APPLICATION_STARTED',
        status: WORKFLOW_STATES.DRAFT,
        details: 'New loan application initiated',
      }],
    };
    
    set({
      currentApplication: newApp,
      error: null,
    });
    
    return newApp;
  },

  // Update application details (local only)
  updateApplicationDetails: (details) => {
    set((state) => {
      if (!state.currentApplication) return state;
      
      return {
        currentApplication: {
          ...state.currentApplication,
          ...details,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  },

  // Submit onboarding form - creates application in backend
  submitOnboarding: async (formData) => {
    set({ isLoading: true, error: null });
    
    try {
      const backendData = mapApplicationToBackend(formData);
      
      const response = await fetchAPI(API_ENDPOINTS.APPLICATIONS.CREATE, {
        method: 'POST',
        body: JSON.stringify(backendData),
      });
      
      const application = mapApplicationFromBackend(response);
      
      set((state) => ({
        currentApplication: application,
        applications: [...state.applications, application],
        isLoading: false,
      }));
      
      return application;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to create application' 
      });
      throw error;
    }
  },

  // Process KYC using backend API
  processKYC: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const state = get();
      if (!state.currentApplication?.id) {
        throw new Error('No application found');
      }

      const response = await fetchAPI(
        API_ENDPOINTS.KYC.INITIATE(state.currentApplication.id),
        { method: 'POST' }
      );
      
      const application = mapApplicationFromBackend(response);
      
      set((state) => ({
        currentApplication: application,
        applications: state.applications.map((app) =>
          app.id === application.id ? application : app
        ),
        isLoading: false,
      }));
      
      return application;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message || 'KYC verification failed' 
      });
      throw error;
    }
  },

  // Process credit check using backend API
  processCreditCheck: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const state = get();
      if (!state.currentApplication?.id) {
        throw new Error('No application found');
      }

      const response = await fetchAPI(
        API_ENDPOINTS.CREDIT.INITIATE(state.currentApplication.id),
        { method: 'POST' }
      );
      
      const application = mapApplicationFromBackend(response);
      
      set((state) => ({
        currentApplication: application,
        applications: state.applications.map((app) =>
          app.id === application.id ? application : app
        ),
        isLoading: false,
      }));
      
      return application;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message || 'Credit check failed' 
      });
      throw error;
    }
  },

  // Calculate eligibility using backend API
  calculateEligibility: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const state = get();
      if (!state.currentApplication?.id) {
        throw new Error('No application found');
      }

      const response = await fetchAPI(
        API_ENDPOINTS.ELIGIBILITY.CHECK(state.currentApplication.id),
        { method: 'POST' }
      );
      
      const application = mapApplicationFromBackend(response);
      
      set((state) => ({
        currentApplication: application,
        applications: state.applications.map((app) =>
          app.id === application.id ? application : app
        ),
        isLoading: false,
      }));
      
      return application;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message || 'Eligibility calculation failed' 
      });
      throw error;
    }
  },

  // Load application by ID from backend
  loadApplication: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetchAPI(API_ENDPOINTS.APPLICATIONS.GET_BY_ID(id));
      const application = mapApplicationFromBackend(response);
      
      set({ currentApplication: application, isLoading: false });
      return application;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message || 'Application not found' 
      });
      throw error;
    }
  },

  // Fetch all applications from backend (for admin)
  fetchApplications: async (filters = {}) => {
    set({ isLoading: true, error: null });
    
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.eligibility) queryParams.append('eligibility', filters.eligibility);
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.pageSize) queryParams.append('page_size', filters.pageSize);
      if (filters.search) queryParams.append('search', filters.search);
      
      const url = `${API_ENDPOINTS.ADMIN.APPLICATIONS}?${queryParams.toString()}`;
      const response = await fetchAPI(url);
      
      const applications = response.items.map(mapApplicationFromBackend);
      
      set({ 
        applications, 
        isLoading: false,
        pagination: {
          total: response.total,
          page: response.page,
          pageSize: response.page_size,
          totalPages: response.total_pages,
        }
      });
      
      return applications;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to fetch applications' 
      });
      throw error;
    }
  },

  // Fetch admin stats
  fetchStats: async () => {
    try {
      const stats = await fetchAPI(API_ENDPOINTS.ADMIN.STATS);
      set({ stats });
      return stats;
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      return null;
    }
  },

  // Fetch journey log for an application
  fetchJourneyLog: async (applicationId) => {
    try {
      const journey = await fetchAPI(API_ENDPOINTS.ADMIN.JOURNEY(applicationId));
      return journey;
    } catch (error) {
      console.error('Failed to fetch journey:', error);
      return null;
    }
  },

  // Clear current application
  clearCurrentApplication: () => {
    set({ currentApplication: null, error: null });
  },

  // Set error
  setError: (error) => {
    set({ error });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Reset store
  reset: () => {
    set({
      currentApplication: null,
      applications: [],
      isLoading: false,
      error: null,
      stats: null,
      pagination: null,
    });
  },
}));

export default useApplicationStore;
