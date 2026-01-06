import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { WORKFLOW_STATES, LOAN_CONFIG } from '../../constants/workflowStates';

export default function CreditCheckStep({ application, onInitiateCreditCheck, isLoading }) {
  const { status, creditResult, fullName, pan } = application || {};

  const renderPendingState = () => (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Credit Bureau Check</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        We will now check your credit score and history from CIBIL to assess your creditworthiness.
      </p>
      
      <div className="bg-blue-50 rounded-lg p-4 mb-6 max-w-md mx-auto text-left">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Credit Check Criteria:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Minimum CIBIL Score: {LOAN_CONFIG.MIN_CREDIT_SCORE}</li>
          <li>• Maximum Active Loans: {LOAN_CONFIG.MAX_ACTIVE_LOANS}</li>
          <li>• Clean payment history preferred</li>
        </ul>
        <p className="text-xs text-blue-600 mt-3 italic">
          Tip: PAN starting with "PASS" or "GOOD" gives high credit score. PAN starting with "FAIL" gives low score.
        </p>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={onInitiateCreditCheck}
        loading={isLoading}
        disabled={isLoading}
      >
        Run Credit Check
      </Button>
    </div>
  );

  const renderLoadingState = () => (
    <div className="text-center py-12">
      <LoadingSpinner size="lg" text="Fetching your credit report from CIBIL..." />
      <p className="text-gray-500 mt-4 text-sm">This may take a few moments</p>
    </div>
  );

  const renderCompletedState = () => {
    const getCreditScoreColor = (score) => {
      if (score >= 750) return 'text-green-600';
      if (score >= 650) return 'text-yellow-600';
      return 'text-red-600';
    };

    const getCreditScoreLabel = (score) => {
      if (score >= 750) return 'Excellent';
      if (score >= 700) return 'Good';
      if (score >= 650) return 'Fair';
      return 'Poor';
    };

    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-green-800 mb-2">Credit Check Passed</h3>
        <p className="text-gray-600 mb-6">Your credit profile meets our requirements.</p>
        
        {/* Credit Score Display */}
        <div className="max-w-md mx-auto mb-6">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border">
            <div className="text-sm text-gray-500 mb-1">Your CIBIL Score</div>
            <div className={`text-5xl font-bold ${getCreditScoreColor(creditResult?.creditScore)}`}>
              {creditResult?.creditScore}
            </div>
            <div className={`text-sm font-medium ${getCreditScoreColor(creditResult?.creditScore)}`}>
              {getCreditScoreLabel(creditResult?.creditScore)}
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
          <h4 className="text-sm font-medium text-green-800 mb-3">Credit Report Summary:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Active Loans:</span>
              <span className="font-semibold text-green-800">{creditResult?.activeLoans}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Credit History:</span>
              <span className="font-semibold text-green-800">{creditResult?.details?.creditHistory}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Payment History:</span>
              <span className="font-semibold text-green-800">{creditResult?.details?.paymentHistory}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Credit Utilization:</span>
              <span className="font-semibold text-green-800">{creditResult?.details?.creditUtilization}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Bureau ID:</span>
              <span className="font-mono text-xs text-green-800">{creditResult?.bureauId}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRejectedState = () => (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-red-800 mb-2">Credit Check Failed</h3>
      <p className="text-gray-600 mb-6">
        Unfortunately, your credit profile does not meet our minimum requirements.
      </p>
      
      {/* Credit Score Display */}
      <div className="max-w-md mx-auto mb-6">
        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
          <div className="text-sm text-red-500 mb-1">Your CIBIL Score</div>
          <div className="text-5xl font-bold text-red-600">
            {creditResult?.creditScore}
          </div>
          <div className="text-sm font-medium text-red-600">
            Below minimum required ({LOAN_CONFIG.MIN_CREDIT_SCORE})
          </div>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
        <h4 className="text-sm font-medium text-red-800 mb-3">Rejection Reasons:</h4>
        <div className="space-y-2 text-sm text-left">
          {creditResult?.creditScore < LOAN_CONFIG.MIN_CREDIT_SCORE && (
            <div className="flex items-center text-red-700">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Credit score {creditResult?.creditScore} is below minimum {LOAN_CONFIG.MIN_CREDIT_SCORE}
            </div>
          )}
          {creditResult?.activeLoans > LOAN_CONFIG.MAX_ACTIVE_LOANS && (
            <div className="flex items-center text-red-700">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Active loans ({creditResult?.activeLoans}) exceed maximum ({LOAN_CONFIG.MAX_ACTIVE_LOANS})
            </div>
          )}
        </div>
        <p className="text-xs text-red-600 mt-4">
          Your loan application cannot proceed further. Please improve your credit score and try again later.
        </p>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return renderLoadingState();
    }

    switch (status) {
      case WORKFLOW_STATES.KYC_COMPLETED:
      case WORKFLOW_STATES.CREDIT_CHECK_PENDING:
        return renderPendingState();
      case WORKFLOW_STATES.CREDIT_CHECK_COMPLETED:
      case WORKFLOW_STATES.ELIGIBLE:
      case WORKFLOW_STATES.NOT_ELIGIBLE:
        return renderCompletedState();
      case WORKFLOW_STATES.CREDIT_REJECTED:
        return renderRejectedState();
      default:
        return renderPendingState();
    }
  };

  return (
    <Card 
      title="Credit Bureau Check" 
      subtitle="CIBIL score and credit history verification"
    >
      {renderContent()}
    </Card>
  );
}
