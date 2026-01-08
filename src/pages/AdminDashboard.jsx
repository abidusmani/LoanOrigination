import React, { useState, useEffect } from 'react';
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
  const { applications, fetchApplications, fetchStats, stats, isLoading } = useApplicationStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [eligibilityFilter, setEligibilityFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Fetch applications on component mount
  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, []);

  // Filter applications (client-side for now)
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

  // Statistics from backend or calculate from local data
  const displayStats = stats || {
    total: applications.length,
    eligible: applications.filter(a => a.status === WORKFLOW_STATES.ELIGIBLE).length,
    not_eligible: applications.filter(a => a.status === WORKFLOW_STATES.NOT_ELIGIBLE).length,
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">LoanOS Admin</h1>
              <p className="text-xs text-gray-500">Application Management Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Back to Application */}
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
            >
              {/* <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Applications</span> */}
            </button>
            
            {/* Admin User Info */}
            <div className="flex items-center space-x-2 text-sm border-l pl-4">
              {/* <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div> */}
              <div>
                {/* <span className="text-gray-700 font-medium">{user?.name || user?.email}</span> */}
                <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">Admin</span>
              </div>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
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
            <div className="text-3xl font-bold text-gray-900">{displayStats.total}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-sm text-gray-500">Eligible</div>
            <div className="text-3xl font-bold text-green-600">{displayStats.eligible}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-sm text-gray-500">Not Eligible</div>
            <div className="text-3xl font-bold text-orange-600">{displayStats.not_eligible || displayStats.notEligible || 0}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-sm text-gray-500">Pending</div>
            <div className="text-3xl font-bold text-blue-600">{displayStats.pending}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-sm text-gray-500">Failed</div>
            <div className="text-3xl font-bold text-red-600">{displayStats.failed}</div>
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
