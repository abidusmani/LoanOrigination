import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { WORKFLOW_STATES, EMPLOYMENT_LABELS } from '../../constants/workflowStates';
import { formatCurrency } from '../../utils/validators';

export default function EligibilityResult({ application, onCalculateEligibility, isLoading, onStartNew }) {
  const { status, eligibilityResult, creditResult } = application || {};

  const renderPendingState = () => (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto mb-6 bg-purple-100 rounded-full flex items-center justify-center">
        <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Calculate Loan Eligibility</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Based on your credit score, income, and employment type, we will calculate your eligible loan amount and EMI.
      </p>
      
      <div className="bg-purple-50 rounded-lg p-4 mb-6 max-w-md mx-auto text-left">
        <h4 className="text-sm font-medium text-purple-900 mb-2">Eligibility Factors:</h4>
        <ul className="text-sm text-purple-700 space-y-1">
          <li>• Credit Score: {creditResult?.creditScore}</li>
          <li>• Income & Employment Type</li>
          <li>• Maximum EMI capacity</li>
          <li>• Interest Rate: 12% p.a.</li>
          <li>• Tenure: 36 months</li>
        </ul>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={onCalculateEligibility}
        loading={isLoading}
        disabled={isLoading}
      >
        Calculate Eligibility
      </Button>
    </div>
  );

  const renderLoadingState = () => (
    <div className="text-center py-12">
      <LoadingSpinner size="lg" text="Calculating your loan eligibility..." />
      <p className="text-gray-500 mt-4 text-sm">Analyzing your profile</p>
    </div>
  );

  const renderEligibleState = () => (
    <div className="text-center py-8">
      <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <div className="inline-block px-4 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-4">
        🎉 Congratulations!
      </div>
      
      <h3 className="text-2xl font-bold text-green-800 mb-2">You Are Eligible!</h3>
      <p className="text-gray-600 mb-8">{eligibilityResult?.reason}</p>
      
      {/* Loan Details Card */}
      <div className="max-w-lg mx-auto">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg mb-6">
          <div className="text-sm opacity-90 mb-1">Approved Loan Amount</div>
          <div className="text-4xl font-bold mb-4">
            {formatCurrency(eligibilityResult?.approvedLoanAmount)}
          </div>
          <div className="grid grid-cols-3 gap-4 text-center border-t border-white/20 pt-4">
            <div>
              <div className="text-sm opacity-75">EMI</div>
              <div className="text-lg font-semibold">{formatCurrency(eligibilityResult?.requestedEMI)}</div>
            </div>
            <div>
              <div className="text-sm opacity-75">Interest</div>
              <div className="text-lg font-semibold">{eligibilityResult?.interestRate}%</div>
            </div>
            <div>
              <div className="text-sm opacity-75">Tenure</div>
              <div className="text-lg font-semibold">{eligibilityResult?.tenure} mo</div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-gray-50 rounded-lg p-4 text-left">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Eligibility Breakdown</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Monthly Income:</span>
              <span className="font-medium">{formatCurrency(eligibilityResult?.monthlyIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Employment Type:</span>
              <span className="font-medium">{EMPLOYMENT_LABELS[eligibilityResult?.employmentType]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Credit Score:</span>
              <span className="font-medium">{eligibilityResult?.creditScore}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Max Allowed EMI:</span>
              <span className="font-medium">{formatCurrency(eligibilityResult?.maxAllowedEMI)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Your EMI:</span>
              <span className="font-medium text-green-600">{formatCurrency(eligibilityResult?.requestedEMI)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-600">Max Eligible Amount:</span>
              <span className="font-medium">{formatCurrency(eligibilityResult?.maxEligibleAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Button variant="primary" size="lg" onClick={onStartNew}>
          Apply for Another Loan
        </Button>
      </div>
    </div>
  );

  const renderNotEligibleState = () => (
    <div className="text-center py-8">
      <div className="w-24 h-24 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
        <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      
      <h3 className="text-2xl font-bold text-orange-800 mb-2">Partial Eligibility</h3>
      <p className="text-gray-600 mb-2">
        You are not eligible for the requested loan amount.
      </p>
      <p className="text-gray-500 text-sm mb-8">{eligibilityResult?.reason}</p>
      
      {/* Comparison Card */}
      <div className="max-w-lg mx-auto">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Requested Amount */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="text-sm text-red-600 mb-1">Requested Amount</div>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(eligibilityResult?.requestedLoanAmount)}
            </div>
            <div className="text-sm text-red-500 mt-2">
              EMI: {formatCurrency(eligibilityResult?.requestedEMI)}
            </div>
          </div>
          
          {/* Eligible Amount */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="text-sm text-green-600 mb-1">Max Eligible</div>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(eligibilityResult?.maxEligibleAmount)}
            </div>
            <div className="text-sm text-green-500 mt-2">
              Max EMI: {formatCurrency(eligibilityResult?.maxAllowedEMI)}
            </div>
          </div>
        </div>

        {/* Reason Breakdown */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left mb-6">
          <h4 className="text-sm font-semibold text-orange-900 mb-3">Why Not Eligible?</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start text-orange-700">
              <svg className="w-4 h-4 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>
                Your requested EMI ({formatCurrency(eligibilityResult?.requestedEMI)}) exceeds your 
                maximum allowed EMI ({formatCurrency(eligibilityResult?.maxAllowedEMI)})
              </span>
            </div>
            <div className="text-orange-600 text-xs mt-2">
              EMI limit is {eligibilityResult?.employmentType === 'SALARIED' ? '50%' : '40%'} of monthly income for {EMPLOYMENT_LABELS[eligibilityResult?.employmentType]} individuals.
            </div>
          </div>
        </div>

        {/* Eligibility Details */}
        <div className="bg-gray-50 rounded-lg p-4 text-left">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Your Profile</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Monthly Income:</span>
              <span className="font-medium">{formatCurrency(eligibilityResult?.monthlyIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Employment Type:</span>
              <span className="font-medium">{EMPLOYMENT_LABELS[eligibilityResult?.employmentType]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Credit Score:</span>
              <span className="font-medium">{eligibilityResult?.creditScore}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Interest Rate:</span>
              <span className="font-medium">{eligibilityResult?.interestRate}% p.a.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tenure:</span>
              <span className="font-medium">{eligibilityResult?.tenure} months</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Button variant="primary" size="lg" onClick={onStartNew}>
          Apply with Lower Amount
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return renderLoadingState();
    }

    switch (status) {
      case WORKFLOW_STATES.CREDIT_CHECK_COMPLETED:
        return renderPendingState();
      case WORKFLOW_STATES.ELIGIBLE:
        return renderEligibleState();
      case WORKFLOW_STATES.NOT_ELIGIBLE:
        return renderNotEligibleState();
      default:
        return renderPendingState();
    }
  };

  return (
    <Card 
      title="Loan Eligibility Result" 
      subtitle="Final decision based on your profile"
    >
      {renderContent()}
    </Card>
  );
}
