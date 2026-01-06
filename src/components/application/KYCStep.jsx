import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { WORKFLOW_STATES, LOAN_CONFIG } from '../../constants/workflowStates';

export default function KYCStep({ application, onInitiateKYC, isLoading }) {
  const { status, kycResult, fullName, pan } = application || {};

  const renderPendingState = () => (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto mb-6 bg-yellow-100 rounded-full flex items-center justify-center">
        <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">KYC Verification Required</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        We need to verify your identity before proceeding. This process will verify your PAN and other details.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-6 max-w-md mx-auto">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Details to be verified:</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Full Name:</span>
            <span className="font-medium">{fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">PAN Number:</span>
            <span className="font-medium">{pan}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 mb-6 max-w-md mx-auto text-left">
        <h4 className="text-sm font-medium text-blue-900 mb-2">KYC Verification Rules:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Name match score must be ≥ {LOAN_CONFIG.MIN_KYC_NAME_MATCH_SCORE}%</li>
          <li>• PAN format must be valid (ABCDE1234F)</li>
          <li>• PAN 4th letter should match surname initial</li>
          <li>• Full name should include first & last name</li>
        </ul>
        <p className="text-xs text-blue-600 mt-3 italic">
          Tip: Use names starting with "PASS" to test success, or "FAIL" to test failure.
        </p>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={onInitiateKYC}
        loading={isLoading}
        disabled={isLoading}
      >
        Start KYC Verification
      </Button>
    </div>
  );

  const renderLoadingState = () => (
    <div className="text-center py-12">
      <LoadingSpinner size="lg" text="Verifying your KYC details..." />
      <p className="text-gray-500 mt-4 text-sm">This may take a few moments</p>
    </div>
  );

  const renderCompletedState = () => (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-green-800 mb-2">KYC Verification Successful</h3>
      <p className="text-gray-600 mb-6">Your identity has been verified successfully.</p>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
        <h4 className="text-sm font-medium text-green-800 mb-3">Verification Results:</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-green-700">Name Match Score:</span>
            <span className="font-semibold text-green-800">{kycResult?.nameMatchScore}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700">PAN Verified:</span>
            <span className="font-semibold text-green-800">
              {kycResult?.details?.panVerified ? '✓ Yes' : '✗ No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700">PAN Holder Type:</span>
            <span className="font-semibold text-green-800">
              {kycResult?.details?.panHolderType || 'Individual'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700">Aadhaar Linked:</span>
            <span className="font-semibold text-green-800">
              {kycResult?.details?.aadhaarLinked ? '✓ Yes' : '✗ No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700">Verification ID:</span>
            <span className="font-mono text-xs text-green-800">{kycResult?.verificationId}</span>
          </div>
        </div>
        
        {kycResult?.details?.rules && (
          <div className="mt-4 pt-3 border-t border-green-200">
            <h5 className="text-xs font-medium text-green-700 mb-2">Rule Checks:</h5>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-green-600">Name Parts:</span>
                <span className="text-green-800">{kycResult.details.rules.nameParts} parts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">PAN-Name Match:</span>
                <span className="text-green-800">
                  {kycResult.details.rules.panNameMatch ? '✓ Matched' : '✗ Mismatch'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Format Valid:</span>
                <span className="text-green-800">
                  {kycResult.details.rules.formatValid ? '✓ Valid' : '✗ Invalid'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderFailedState = () => (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-red-800 mb-2">KYC Verification Failed</h3>
      <p className="text-gray-600 mb-6">
        Unfortunately, we could not verify your identity. Please contact support for assistance.
      </p>
      
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
        <h4 className="text-sm font-medium text-red-800 mb-3">Verification Results:</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-red-700">Name Match Score:</span>
            <span className="font-semibold text-red-800">{kycResult?.nameMatchScore}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-700">Minimum Required:</span>
            <span className="font-semibold text-red-800">{LOAN_CONFIG.MIN_KYC_NAME_MATCH_SCORE}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-700">Status:</span>
            <span className="font-semibold text-red-800">{kycResult?.details?.nameMatch}</span>
          </div>
        </div>
        
        {kycResult?.details?.rules && (
          <div className="mt-4 pt-3 border-t border-red-200">
            <h5 className="text-xs font-medium text-red-700 mb-2">Rule Check Details:</h5>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-red-600">Name Parts:</span>
                <span className={kycResult.details.rules.nameParts >= 2 ? 'text-green-700' : 'text-red-800'}>
                  {kycResult.details.rules.nameParts} parts {kycResult.details.rules.nameParts < 2 && '(needs 2+)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">PAN-Name Match:</span>
                <span className={kycResult.details.rules.panNameMatch ? 'text-green-700' : 'text-red-800'}>
                  {kycResult.details.rules.panNameMatch ? '✓ Matched' : '✗ Mismatch (-25%)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">Format Valid:</span>
                <span className={kycResult.details.rules.formatValid ? 'text-green-700' : 'text-red-800'}>
                  {kycResult.details.rules.formatValid ? '✓ Valid' : '✗ Special chars found'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <p className="text-xs text-red-600 mt-4">
          Your loan application cannot proceed further. Please verify your details and try again with a new application.
        </p>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return renderLoadingState();
    }

    switch (status) {
      case WORKFLOW_STATES.KYC_PENDING:
        return renderPendingState();
      case WORKFLOW_STATES.KYC_COMPLETED:
      case WORKFLOW_STATES.CREDIT_CHECK_PENDING:
      case WORKFLOW_STATES.CREDIT_CHECK_COMPLETED:
      case WORKFLOW_STATES.CREDIT_REJECTED:
      case WORKFLOW_STATES.ELIGIBLE:
      case WORKFLOW_STATES.NOT_ELIGIBLE:
        return renderCompletedState();
      case WORKFLOW_STATES.KYC_FAILED:
        return renderFailedState();
      default:
        return renderPendingState();
    }
  };

  return (
    <Card 
      title="KYC Verification" 
      subtitle="Identity verification through PAN and Aadhaar"
    >
      {renderContent()}
    </Card>
  );
}
