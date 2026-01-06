import { create } from 'zustand';
import { WORKFLOW_STATES } from '../constants/workflowStates';
import { MockKYCService, MockCibilService, MockEligibilityEngine } from '../services/mockServices';

// Generate unique ID
const generateId = () => `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// API timeout wrapper - handles timeout for mock API calls
const withTimeout = (promise, timeoutMs = 10000, errorMessage = 'Request timed out') => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
};

// Initial application state
const createNewApplication = () => ({
  id: generateId(),
  status: WORKFLOW_STATES.DRAFT,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  
  // Personal details
  fullName: '',
  mobile: '',
  pan: '',
  dob: '',
  employmentType: '',
  monthlyIncome: '',
  loanAmount: '',
  
  // KYC details
  kycResult: null,
  kycCompletedAt: null,
  
  // Credit check details
  creditResult: null,
  creditCompletedAt: null,
  
  // Eligibility details
  eligibilityResult: null,
  eligibilityCheckedAt: null,
  
  // Journey log for admin view
  journeyLog: [],
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

  // Initialize a new application
  initializeApplication: () => {
    const newApp = createNewApplication();
    newApp.journeyLog.push({
      timestamp: new Date().toISOString(),
      action: 'APPLICATION_CREATED',
      status: WORKFLOW_STATES.DRAFT,
      details: 'New loan application initiated',
    });
    
    set((state) => ({
      currentApplication: newApp,
      applications: [...state.applications, newApp],
      error: null,
    }));
    
    return newApp;
  },

  // Update application details
  updateApplicationDetails: (details) => {
    set((state) => {
      if (!state.currentApplication) return state;
      
      const updated = {
        ...state.currentApplication,
        ...details,
        updatedAt: new Date().toISOString(),
      };
      
      return {
        currentApplication: updated,
        applications: state.applications.map((app) =>
          app.id === updated.id ? updated : app
        ),
      };
    });
  },

  // Submit onboarding form
  submitOnboarding: (formData) => {
    set((state) => {
      if (!state.currentApplication) return state;
      
      const updated = {
        ...state.currentApplication,
        ...formData,
        status: WORKFLOW_STATES.KYC_PENDING,
        updatedAt: new Date().toISOString(),
        journeyLog: [
          ...state.currentApplication.journeyLog,
          {
            timestamp: new Date().toISOString(),
            action: 'ONBOARDING_COMPLETED',
            status: WORKFLOW_STATES.KYC_PENDING,
            details: 'Customer onboarding completed, KYC verification pending',
            data: formData,
          },
        ],
      };
      
      return {
        currentApplication: updated,
        applications: state.applications.map((app) =>
          app.id === updated.id ? updated : app
        ),
      };
    });
  },

  // Process KYC using MockKYCService (rule-based)
  processKYC: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const state = get();
      if (!state.currentApplication) {
        throw new Error('No application found');
      }

      const { fullName, pan } = state.currentApplication;
      
      // Validate required data
      if (!fullName || !pan) {
        throw new Error('Invalid data: Full name and PAN are required for KYC verification');
      }

      // Call MockKYCService with timeout handling
      const kycResult = await withTimeout(
        MockKYCService.verify({ fullName, pan }),
        10000,
        'KYC service timed out. Please try again.'
      );
      
      const kycPassed = kycResult.verified;
      const newStatus = kycPassed
        ? WORKFLOW_STATES.KYC_COMPLETED
        : WORKFLOW_STATES.KYC_FAILED;
      
      set((state) => {
        const updated = {
          ...state.currentApplication,
          status: newStatus,
          kycResult,
          kycCompletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          journeyLog: [
            ...state.currentApplication.journeyLog,
            {
              timestamp: new Date().toISOString(),
              action: kycPassed ? 'KYC_VERIFIED' : 'KYC_FAILED',
              status: newStatus,
              details: kycPassed
                ? `KYC verification successful (Score: ${kycResult.nameMatchScore}%)`
                : `KYC verification failed (Score: ${kycResult.nameMatchScore}%, minimum required: 80%)`,
              data: kycResult,
            },
          ],
        };
        
        return {
          currentApplication: updated,
          applications: state.applications.map((app) =>
            app.id === updated.id ? updated : app
          ),
          isLoading: false,
        };
      });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message || 'KYC verification failed. Please try again.' 
      });
    }
  },

  // Initiate credit check
  initiateCreditCheck: () => {
    set((state) => {
      if (!state.currentApplication) return state;
      
      const updated = {
        ...state.currentApplication,
        status: WORKFLOW_STATES.CREDIT_CHECK_PENDING,
        updatedAt: new Date().toISOString(),
        journeyLog: [
          ...state.currentApplication.journeyLog,
          {
            timestamp: new Date().toISOString(),
            action: 'CREDIT_CHECK_INITIATED',
            status: WORKFLOW_STATES.CREDIT_CHECK_PENDING,
            details: 'Credit bureau check initiated',
          },
        ],
      };
      
      return {
        currentApplication: updated,
        applications: state.applications.map((app) =>
          app.id === updated.id ? updated : app
        ),
      };
    });
  },

  // Process credit check using MockCibilService
  processCreditCheck: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const state = get();
      if (!state.currentApplication) {
        throw new Error('No application found');
      }

      const { fullName, pan } = state.currentApplication;
      
      // Validate required data
      if (!fullName || !pan) {
        throw new Error('Invalid data: Full name and PAN are required for credit check');
      }

      // Call MockCibilService with timeout handling
      const creditResult = await withTimeout(
        MockCibilService.getCreditReport({ fullName, pan }),
        15000,
        'Credit bureau service timed out. Please try again.'
      );
      
      const creditPassed = creditResult.passed;
      const newStatus = creditPassed
        ? WORKFLOW_STATES.CREDIT_CHECK_COMPLETED
        : WORKFLOW_STATES.CREDIT_REJECTED;
      
      let rejectionReason = '';
      if (!creditPassed) {
        if (creditResult.creditScore < 650) {
          rejectionReason = `Credit score ${creditResult.creditScore} is below minimum required (650)`;
        } else if (creditResult.activeLoans > 5) {
          rejectionReason = `Active loans (${creditResult.activeLoans}) exceed maximum allowed (5)`;
        }
      }
      
      set((state) => {
        const updated = {
          ...state.currentApplication,
          status: newStatus,
          creditResult,
          creditCompletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          journeyLog: [
            ...state.currentApplication.journeyLog,
            {
              timestamp: new Date().toISOString(),
              action: creditPassed ? 'CREDIT_CHECK_PASSED' : 'CREDIT_CHECK_REJECTED',
              status: newStatus,
              details: creditPassed
                ? `Credit check passed (Score: ${creditResult.creditScore}, Active Loans: ${creditResult.activeLoans})`
                : `Credit check failed: ${rejectionReason}`,
              data: creditResult,
            },
          ],
        };
        
        return {
          currentApplication: updated,
          applications: state.applications.map((app) =>
            app.id === updated.id ? updated : app
          ),
          isLoading: false,
        };
      });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message || 'Credit check failed. Please try again.' 
      });
    }
  },

  // Calculate eligibility using MockEligibilityEngine
  calculateEligibility: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const state = get();
      if (!state.currentApplication) {
        throw new Error('No application found');
      }

      const app = state.currentApplication;
      const monthlyIncome = Number(app.monthlyIncome);
      const loanAmount = Number(app.loanAmount);
      const creditScore = app.creditResult?.creditScore || 0;
      
      // Validate required data
      if (!monthlyIncome || !loanAmount || !app.employmentType) {
        throw new Error('Invalid data: Income, loan amount, and employment type are required');
      }

      // Call MockEligibilityEngine with timeout handling
      const eligibilityResult = await withTimeout(
        MockEligibilityEngine.calculate({
          monthlyIncome,
          loanAmount,
          employmentType: app.employmentType,
          creditScore,
        }),
        10000,
        'Eligibility calculation timed out. Please try again.'
      );
      
      const isEligible = eligibilityResult.eligible;
      const newStatus = isEligible ? WORKFLOW_STATES.ELIGIBLE : WORKFLOW_STATES.NOT_ELIGIBLE;
      
      set((state) => {
        const updated = {
          ...state.currentApplication,
          status: newStatus,
          eligibilityResult,
          eligibilityCheckedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          journeyLog: [
            ...state.currentApplication.journeyLog,
            {
              timestamp: new Date().toISOString(),
              action: isEligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
              status: newStatus,
              details: isEligible
                ? `Eligible for loan amount ₹${loanAmount.toLocaleString()} with EMI ₹${eligibilityResult.requestedEMI.toLocaleString()}`
                : `Not eligible for requested amount. Max eligible: ₹${eligibilityResult.maxEligibleAmount.toLocaleString()}`,
              data: eligibilityResult,
            },
          ],
        };
        
        return {
          currentApplication: updated,
          applications: state.applications.map((app) =>
            app.id === updated.id ? updated : app
          ),
          isLoading: false,
        };
      });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message || 'Eligibility calculation failed. Please try again.' 
      });
    }
  },

  // Load application by ID
  loadApplication: (id) => {
    const app = get().applications.find((a) => a.id === id);
    if (app) {
      set({ currentApplication: app, error: null });
    } else {
      set({ error: 'Application not found' });
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

  // Reset store (for testing)
  reset: () => {
    set({
      currentApplication: null,
      applications: [],
      isLoading: false,
      error: null,
    });
  },
}));

export default useApplicationStore;
