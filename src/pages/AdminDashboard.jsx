import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplicationStore } from '../store/applicationStore';
import { useAuthStore } from '../store/authStore';
import StatusBadge from '../components/common/StatusBadge';
import Card from '../components/common/Card';
import { STATE_LABELS, WORKFLOW_STATES, EMPLOYMENT_LABELS } from '../constants/workflowStates';
import { formatCurrency } from '../utils/validators';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { applications, loadApplication } = useApplicationStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [eligibilityFilter, setEligibilityFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Filter applications
  const filteredApplications = applications.filter((app) => {
    // Status filter
    if (statusFilter !== 'all' && app.status !== statusFilter) {
      return false;
    }
    
    // Eligibility filter
    if (eligibilityFilter === 'eligible' && app.status !== WORKFLOW_STATES.ELIGIBLE) {
      return false;
    }
    if (eligibilityFilter === 'not_eligible' && app.status !== WORKFLOW_STATES.NOT_ELIGIBLE) {
      return false;
    }
    if (eligibilityFilter === 'pending' && 
        (app.status === WORKFLOW_STATES.ELIGIBLE || app.status === WORKFLOW_STATES.NOT_ELIGIBLE)) {
      return false;
    }
    
    return true;
  });

  // Statistics
  const stats = {
    total: applications.length,
    eligible: applications.filter(a => a.status === WORKFLOW_STATES.ELIGIBLE).length,
    notEligible: applications.filter(a => a.status === WORKFLOW_STATES.NOT_ELIGIBLE).length,
    pending: applications.filter(a => 
      ![WORKFLOW_STATES.ELIGIBLE, WORKFLOW_STATES.NOT_ELIGIBLE, 
        WORKFLOW_STATES.KYC_FAILED, WORKFLOW_STATES.CREDIT_REJECTED].includes(a.status)
    ).length,
    failed: applications.filter(a => 
      [WORKFLOW_STATES.KYC_FAILED, WORKFLOW_STATES.CREDIT_REJECTED].includes(a.status)
    ).length,
  };

  const handleViewApplication = (app) => {
    setSelectedApplication(app);
  };

  const handleCloseDetail = () => {
    setSelectedApplication(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd MMM yyyy, HH:mm');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">LoanOS Admin</h1>
              <p className="text-xs text-gray-500">Application Management Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Application</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-sm text-gray-500">Total Applications</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-sm text-gray-500">Eligible</div>
            <div className="text-3xl font-bold text-green-600">{stats.eligible}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-sm text-gray-500">Not Eligible</div>
            <div className="text-3xl font-bold text-orange-600">{stats.notEligible}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-sm text-gray-500">Pending</div>
            <div className="text-3xl font-bold text-blue-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-sm text-gray-500">Failed</div>
            <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-48 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Statuses</option>
                {Object.entries(STATE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility Filter</label>
              <select
                value={eligibilityFilter}
                onChange={(e) => setEligibilityFilter(e.target.value)}
                className="block w-48 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="all">All</option>
                <option value="eligible">Eligible</option>
                <option value="not_eligible">Not Eligible</option>
                <option value="pending">Pending Decision</option>
              </select>
            </div>
            <div className="ml-auto text-sm text-gray-500">
              Showing {filteredApplications.length} of {applications.length} applications
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Application ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loan Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      No applications found
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-gray-900">{app.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{app.fullName || '-'}</div>
                          <div className="text-sm text-gray-500">{app.mobile || '-'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {app.loanAmount ? formatCurrency(Number(app.loanAmount)) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={app.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(app.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewApplication(app)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Application Details</h2>
                <p className="text-sm text-gray-500 font-mono">{selectedApplication.id}</p>
              </div>
              <button
                onClick={handleCloseDetail}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Status */}
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-700 mb-2">Current Status</div>
                <StatusBadge status={selectedApplication.status} size="lg" />
              </div>

              {/* Personal Details */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                  Personal Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Full Name</div>
                    <div className="font-medium">{selectedApplication.fullName || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Mobile</div>
                    <div className="font-medium">{selectedApplication.mobile || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">PAN</div>
                    <div className="font-medium font-mono">{selectedApplication.pan || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Date of Birth</div>
                    <div className="font-medium">{selectedApplication.dob || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Employment Type</div>
                    <div className="font-medium">
                      {selectedApplication.employmentType 
                        ? EMPLOYMENT_LABELS[selectedApplication.employmentType] 
                        : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Monthly Income</div>
                    <div className="font-medium">
                      {selectedApplication.monthlyIncome 
                        ? formatCurrency(Number(selectedApplication.monthlyIncome)) 
                        : '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Loan Details */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                  Loan Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Requested Amount</div>
                    <div className="font-medium">
                      {selectedApplication.loanAmount 
                        ? formatCurrency(Number(selectedApplication.loanAmount)) 
                        : '-'}
                    </div>
                  </div>
                  {selectedApplication.eligibilityResult && (
                    <>
                      <div>
                        <div className="text-gray-500">Approved Amount</div>
                        <div className="font-medium">
                          {formatCurrency(selectedApplication.eligibilityResult.approvedLoanAmount)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">EMI</div>
                        <div className="font-medium">
                          {formatCurrency(selectedApplication.eligibilityResult.requestedEMI)}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* KYC Result */}
              {selectedApplication.kycResult && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                    KYC Verification Result
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Name Match Score</div>
                        <div className="font-medium">{selectedApplication.kycResult.nameMatchScore}%</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Verified</div>
                        <div className="font-medium">
                          {selectedApplication.kycResult.verified ? '✓ Yes' : '✗ No'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Verification ID</div>
                        <div className="font-medium font-mono text-xs">
                          {selectedApplication.kycResult.verificationId}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Credit Result */}
              {selectedApplication.creditResult && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                    Credit Bureau Result
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Credit Score</div>
                        <div className="font-medium">{selectedApplication.creditResult.creditScore}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Active Loans</div>
                        <div className="font-medium">{selectedApplication.creditResult.activeLoans}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Passed</div>
                        <div className="font-medium">
                          {selectedApplication.creditResult.passed ? '✓ Yes' : '✗ No'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Bureau ID</div>
                        <div className="font-medium font-mono text-xs">
                          {selectedApplication.creditResult.bureauId}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Journey Log */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                  Application Journey
                </h3>
                <div className="space-y-3">
                  {selectedApplication.journeyLog.map((log, index) => (
                    <div 
                      key={index} 
                      className="flex items-start space-x-3 text-sm border-l-2 border-blue-200 pl-4 pb-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{log.action}</span>
                          <StatusBadge status={log.status} size="sm" />
                        </div>
                        <p className="text-gray-600 mt-1">{log.details}</p>
                        <p className="text-gray-400 text-xs mt-1">{formatDate(log.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
