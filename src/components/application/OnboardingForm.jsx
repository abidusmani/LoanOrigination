import React, { useState } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import Card from '../common/Card';
import { validateOnboardingForm, calculateMaxLoanAmount, formatCurrency } from '../../utils/validators';
import { EMPLOYMENT_TYPES, EMPLOYMENT_LABELS, LOAN_CONFIG } from '../../constants/workflowStates';

const employmentOptions = [
  { value: EMPLOYMENT_TYPES.SALARIED, label: EMPLOYMENT_LABELS[EMPLOYMENT_TYPES.SALARIED] },
  { value: EMPLOYMENT_TYPES.SELF_EMPLOYED, label: EMPLOYMENT_LABELS[EMPLOYMENT_TYPES.SELF_EMPLOYED] },
];

export default function OnboardingForm({ initialData, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || '',
    mobile: initialData?.mobile || '',
    pan: initialData?.pan || '',
    dob: initialData?.dob || '',
    employmentType: initialData?.employmentType || '',
    monthlyIncome: initialData?.monthlyIncome || '',
    loanAmount: initialData?.loanAmount || '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Format PAN to uppercase
    if (name === 'pan') {
      processedValue = value.toUpperCase();
    }

    // Only allow numbers for mobile
    if (name === 'mobile') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }

    // Only allow numbers for income and loan amount
    if (name === 'monthlyIncome' || name === 'loanAmount') {
      processedValue = value.replace(/\D/g, '');
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate on blur
    const validation = validateOnboardingForm(formData);
    if (validation.errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validation.errors[name],
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validation = validateOnboardingForm(formData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      return;
    }

    onSubmit(formData);
  };

  const maxLoanAmount = formData.monthlyIncome 
    ? calculateMaxLoanAmount(Number(formData.monthlyIncome))
    : 0;

  return (
    <Card 
      title="Customer Onboarding" 
      subtitle="Please fill in your details to apply for a loan"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information Section */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
            Personal Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your full name"
              error={touched.fullName && errors.fullName}
              required
            />
            <Input
              label="Mobile Number"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="10-digit mobile number"
              error={touched.mobile && errors.mobile}
              maxLength={10}
              required
            />
            <Input
              label="PAN Number"
              name="pan"
              value={formData.pan}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="ABCDE1234F"
              error={touched.pan && errors.pan}
              maxLength={10}
              required
              helperText="Format: 5 letters, 4 digits, 1 letter"
            />
            <Input
              label="Date of Birth"
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.dob && errors.dob}
              required
              helperText={`Minimum age: ${LOAN_CONFIG.MIN_AGE} years`}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - LOAN_CONFIG.MIN_AGE)).toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Employment & Income Section */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
            Employment & Income Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Employment Type"
              name="employmentType"
              value={formData.employmentType}
              onChange={handleChange}
              onBlur={handleBlur}
              options={employmentOptions}
              placeholder="Select employment type"
              error={touched.employmentType && errors.employmentType}
              required
            />
            <Input
              label="Monthly Income"
              name="monthlyIncome"
              value={formData.monthlyIncome}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter monthly income"
              prefix="₹"
              error={touched.monthlyIncome && errors.monthlyIncome}
              required
            />
          </div>
        </div>

        {/* Loan Details Section */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
            Loan Requirements
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Loan Amount Required"
                name="loanAmount"
                value={formData.loanAmount}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter loan amount"
                prefix="₹"
                error={touched.loanAmount && errors.loanAmount}
                required
              />
              {maxLoanAmount > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Maximum eligible: {formatCurrency(maxLoanAmount)}
                </p>
              )}
            </div>
            <div className="flex items-center">
              <div className="bg-blue-50 rounded-lg p-4 w-full">
                <h5 className="text-sm font-medium text-blue-900">Loan Terms</h5>
                <ul className="mt-2 text-sm text-blue-700 space-y-1">
                  <li>• Interest Rate: {LOAN_CONFIG.INTEREST_RATE}% p.a.</li>
                  <li>• Tenure: {LOAN_CONFIG.TENURE_MONTHS} months</li>
                  <li>• Max Loan: {LOAN_CONFIG.MAX_LOAN_MULTIPLIER}x monthly income</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        {formData.monthlyIncome && formData.loanAmount && formData.employmentType && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Application Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Monthly Income</p>
                <p className="font-semibold">{formatCurrency(Number(formData.monthlyIncome))}</p>
              </div>
              <div>
                <p className="text-gray-500">Loan Amount</p>
                <p className="font-semibold">{formatCurrency(Number(formData.loanAmount))}</p>
              </div>
              <div>
                <p className="text-gray-500">Max EMI Allowed</p>
                <p className="font-semibold">
                  {formatCurrency(
                    (Number(formData.monthlyIncome) * 
                    (formData.employmentType === 'SALARIED' 
                      ? LOAN_CONFIG.SALARIED_MAX_EMI_PERCENT 
                      : LOAN_CONFIG.SELF_EMPLOYED_MAX_EMI_PERCENT
                    )) / 100
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-500">EMI %</p>
                <p className="font-semibold">
                  {formData.employmentType === 'SALARIED' 
                    ? LOAN_CONFIG.SALARIED_MAX_EMI_PERCENT 
                    : LOAN_CONFIG.SELF_EMPLOYED_MAX_EMI_PERCENT}% of income
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            disabled={isLoading}
          >
            Submit & Proceed to KYC
          </Button>
        </div>
      </form>
    </Card>
  );
}
