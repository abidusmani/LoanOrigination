import React from 'react';
import { STATE_LABELS, STATE_COLORS, WORKFLOW_STATES } from '../../constants/workflowStates';

const steps = [
  { key: 'onboarding', label: 'Onboarding', states: [WORKFLOW_STATES.DRAFT] },
  { key: 'kyc', label: 'KYC Verification', states: [WORKFLOW_STATES.KYC_PENDING, WORKFLOW_STATES.KYC_COMPLETED, WORKFLOW_STATES.KYC_FAILED] },
  { key: 'credit', label: 'Credit Check', states: [WORKFLOW_STATES.CREDIT_CHECK_PENDING, WORKFLOW_STATES.CREDIT_CHECK_COMPLETED, WORKFLOW_STATES.CREDIT_REJECTED] },
  { key: 'eligibility', label: 'Eligibility', states: [WORKFLOW_STATES.ELIGIBLE, WORKFLOW_STATES.NOT_ELIGIBLE] },
];

const getStepStatus = (stepIndex, currentStatus) => {
  const step = steps[stepIndex];
  
  // Check if this step contains the current status
  if (step.states.includes(currentStatus)) {
    // Check for failed states
    if (currentStatus === WORKFLOW_STATES.KYC_FAILED || 
        currentStatus === WORKFLOW_STATES.CREDIT_REJECTED ||
        currentStatus === WORKFLOW_STATES.NOT_ELIGIBLE) {
      return 'failed';
    }
    return 'current';
  }
  
  // Check if step is completed
  const stepOrder = ['onboarding', 'kyc', 'credit', 'eligibility'];
  const currentStepIndex = steps.findIndex(s => s.states.includes(currentStatus));
  
  if (stepIndex < currentStepIndex) {
    return 'completed';
  }
  
  return 'pending';
};

export default function Stepper({ currentStatus, onStepClick }) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(index, currentStatus);
          const isClickable = status === 'completed' || status === 'current';
          
          return (
            <React.Fragment key={step.key}>
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isClickable && onStepClick?.(step.key, index)}
                  disabled={!isClickable}
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold
                    transition-all duration-300 
                    ${status === 'completed' 
                      ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600' 
                      : status === 'current' 
                        ? 'bg-blue-500 text-white ring-4 ring-blue-200' 
                        : status === 'failed'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  {status === 'completed' ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : status === 'failed' ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </button>
                <span className={`
                  mt-2 text-sm font-medium text-center
                  ${status === 'completed' || status === 'current' 
                    ? 'text-gray-900' 
                    : status === 'failed'
                      ? 'text-red-600'
                      : 'text-gray-400'
                  }
                `}>
                  {step.label}
                </span>
                {step.states.includes(currentStatus) && (
                  <span className={`
                    mt-1 px-2 py-0.5 text-xs rounded-full
                    ${STATE_COLORS[currentStatus]}
                  `}>
                    {STATE_LABELS[currentStatus]}
                  </span>
                )}
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={`
                  flex-1 h-1 mx-4
                  ${getStepStatus(index, currentStatus) === 'completed' 
                    ? 'bg-green-500' 
                    : 'bg-gray-200'
                  }
                `} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
