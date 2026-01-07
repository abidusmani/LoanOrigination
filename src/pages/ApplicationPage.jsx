import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Stepper from '../components/common/Stepper';
import OnboardingForm from '../components/application/OnboardingForm';
import KYCStep from '../components/application/KYCStep';
import CreditCheckStep from '../components/application/CreditCheckStep';
import EligibilityResult from '../components/application/EligibilityResult';
import ErrorMessage from '../components/common/ErrorMessage';
import { useApplicationStore } from '../store/applicationStore';
import { WORKFLOW_STATES, TERMINAL_STATES } from '../constants/workflowStates';

export default function ApplicationPage() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  
  const {
    currentApplication,
    isLoading,
    error,
    initializeApplication,
    submitOnboarding,
    processKYC,
    processCreditCheck,
    calculateEligibility,
    clearError,
  } = useApplicationStore();

  // Initialize application on mount if none exists
  useEffect(() => {
    if (!currentApplication) {
      initializeApplication();
    }
  }, []);

  // Update active step based on application status
  useEffect(() => {
    if (!currentApplication) return;
    
    const { status } = currentApplication;
    
    switch (status) {
      case WORKFLOW_STATES.DRAFT:
        setActiveStep(0);
        break;
      case WORKFLOW_STATES.KYC_PENDING:
      case WORKFLOW_STATES.KYC_COMPLETED:
      case WORKFLOW_STATES.KYC_FAILED:
        setActiveStep(1);
        break;
      case WORKFLOW_STATES.CREDIT_CHECK_PENDING:
      case WORKFLOW_STATES.CREDIT_CHECK_COMPLETED:
      case WORKFLOW_STATES.CREDIT_REJECTED:
        setActiveStep(2);
        break;
      case WORKFLOW_STATES.ELIGIBLE:
      case WORKFLOW_STATES.NOT_ELIGIBLE:
        setActiveStep(3);
        break;
      default:
        setActiveStep(0);
    }
  }, [currentApplication?.status]);

  const handleOnboardingSubmit = async (formData) => {
    submitOnboarding(formData);
  };

  const handleKYCInitiate = async () => {
    await processKYC();
  };

  const handleCreditCheckInitiate = async () => {
    await processCreditCheck();
  };

  const handleEligibilityCheck = async () => {
    await calculateEligibility();
  };

  const handleStartNewApplication = () => {
    initializeApplication();
    setActiveStep(0);
  };

  const handleStepClick = (stepKey, index) => {
    // Only allow going back to previous completed steps
    if (currentApplication) {
      const currentStatus = currentApplication.status;
      
      // Check if step is accessible
      const stepStates = {
        0: [WORKFLOW_STATES.DRAFT],
        1: [WORKFLOW_STATES.KYC_PENDING, WORKFLOW_STATES.KYC_COMPLETED, WORKFLOW_STATES.KYC_FAILED],
        2: [WORKFLOW_STATES.CREDIT_CHECK_PENDING, WORKFLOW_STATES.CREDIT_CHECK_COMPLETED, WORKFLOW_STATES.CREDIT_REJECTED],
        3: [WORKFLOW_STATES.ELIGIBLE, WORKFLOW_STATES.NOT_ELIGIBLE],
      };
      
      // Can view completed steps
      const currentStepIndex = Object.entries(stepStates).find(([key, states]) => 
        states.includes(currentStatus)
      )?.[0];
      
      if (index <= parseInt(currentStepIndex)) {
        setActiveStep(index);
      }
    }
  };

  const renderStepContent = () => {
    if (!currentApplication) return null;
    
    const { status } = currentApplication;

    switch (activeStep) {
      case 0:
        return (
          <OnboardingForm
            initialData={currentApplication}
            onSubmit={handleOnboardingSubmit}
            isLoading={isLoading}
          />
        );
      
      case 1:
        return (
          <KYCStep
            application={currentApplication}
            onInitiateKYC={handleKYCInitiate}
            isLoading={isLoading}
          />
        );
      
      case 2:
        return (
          <CreditCheckStep
            application={currentApplication}
            onInitiateCreditCheck={handleCreditCheckInitiate}
            isLoading={isLoading}
          />
        );
      
      case 3:
        return (
          <EligibilityResult
            application={currentApplication}
            onCalculateEligibility={handleEligibilityCheck}
            isLoading={isLoading}
            onStartNew={handleStartNewApplication}
          />
        );
      
      default:
        return null;
    }
  };

  // Show next step button for completed steps
  const renderNextButton = () => {
    if (!currentApplication) return null;
    
    const { status } = currentApplication;
    
    // Don't show for terminal states
    if (TERMINAL_STATES.includes(status)) return null;

    // Show proceed button after certain steps
    if (status === WORKFLOW_STATES.KYC_COMPLETED && activeStep === 1) {
      return (
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setActiveStep(2)}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Proceed to Credit Check
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      );
    }

    if (status === WORKFLOW_STATES.CREDIT_CHECK_COMPLETED && activeStep === 2) {
      return (
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setActiveStep(3)}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Check Eligibility
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">LoanOS</h1>
              <p className="text-xs text-gray-500">Loan Origination System</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Admin</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Application ID Display */}
        {currentApplication && (
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Application ID</p>
              <p className="font-mono text-sm font-medium text-gray-700">{currentApplication.id}</p>
            </div>
            <button
              onClick={handleStartNewApplication}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Application</span>
            </button>
          </div>
        )}

        {/* Stepper */}
        {currentApplication && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <Stepper
              currentStatus={currentApplication.status}
              onStepClick={handleStepClick}
            />
          </div>
        )}

        {/* Error Message */}
        <ErrorMessage 
          message={error} 
          onDismiss={clearError}
        />

        {/* Step Content */}
        {renderStepContent()}

        {/* Next Step Button */}
        {renderNextButton()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          © 2026 LoanOS - Mini Loan Origination System
        </div>
      </footer>
    </div>
  );
}
