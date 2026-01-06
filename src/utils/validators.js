import { LOAN_CONFIG } from '../constants/workflowStates';
import { differenceInYears, parse, isValid } from 'date-fns';

/**
 * Validate PAN card number format
 * Format: AAAAA0000A (5 letters, 4 digits, 1 letter)
 */
export const validatePAN = (pan) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan?.toUpperCase());
};

/**
 * Validate mobile number (Indian format - 10 digits starting with 6-9)
 */
export const validateMobile = (mobile) => {
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile);
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dob) => {
  if (!dob) return 0;
  const birthDate = typeof dob === 'string' ? new Date(dob) : dob;
  if (!isValid(birthDate)) return 0;
  return differenceInYears(new Date(), birthDate);
};

/**
 * Validate age is at least minimum required
 */
export const validateAge = (dob) => {
  const age = calculateAge(dob);
  return age >= LOAN_CONFIG.MIN_AGE;
};

/**
 * Validate loan amount against monthly income
 * Loan amount should not exceed 20x monthly income
 */
export const validateLoanAmount = (loanAmount, monthlyIncome) => {
  const maxLoan = monthlyIncome * LOAN_CONFIG.MAX_LOAN_MULTIPLIER;
  return loanAmount <= maxLoan;
};

/**
 * Calculate maximum eligible loan amount
 */
export const calculateMaxLoanAmount = (monthlyIncome) => {
  return monthlyIncome * LOAN_CONFIG.MAX_LOAN_MULTIPLIER;
};

/**
 * Validate full name (at least 2 characters, letters and spaces only)
 */
export const validateFullName = (name) => {
  const nameRegex = /^[a-zA-Z\s]{2,}$/;
  return nameRegex.test(name?.trim());
};

/**
 * Validate monthly income (positive number)
 */
export const validateMonthlyIncome = (income) => {
  return income > 0;
};

/**
 * Validate entire onboarding form
 */
export const validateOnboardingForm = (formData) => {
  const errors = {};

  // Full Name validation
  if (!formData.fullName?.trim()) {
    errors.fullName = 'Full name is required';
  } else if (!validateFullName(formData.fullName)) {
    errors.fullName = 'Please enter a valid full name (letters and spaces only)';
  }

  // Mobile validation
  if (!formData.mobile?.trim()) {
    errors.mobile = 'Mobile number is required';
  } else if (!validateMobile(formData.mobile)) {
    errors.mobile = 'Please enter a valid 10-digit mobile number';
  }

  // PAN validation
  if (!formData.pan?.trim()) {
    errors.pan = 'PAN number is required';
  } else if (!validatePAN(formData.pan)) {
    errors.pan = 'Please enter a valid PAN number (e.g., ABCDE1234F)';
  }

  // DOB validation
  if (!formData.dob) {
    errors.dob = 'Date of birth is required';
  } else if (!validateAge(formData.dob)) {
    errors.dob = `You must be at least ${LOAN_CONFIG.MIN_AGE} years old`;
  }

  // Employment type validation
  if (!formData.employmentType) {
    errors.employmentType = 'Please select employment type';
  }

  // Monthly income validation
  if (!formData.monthlyIncome) {
    errors.monthlyIncome = 'Monthly income is required';
  } else if (!validateMonthlyIncome(Number(formData.monthlyIncome))) {
    errors.monthlyIncome = 'Please enter a valid monthly income';
  }

  // Loan amount validation
  if (!formData.loanAmount) {
    errors.loanAmount = 'Loan amount is required';
  } else if (Number(formData.loanAmount) <= 0) {
    errors.loanAmount = 'Please enter a valid loan amount';
  } else if (!validateLoanAmount(Number(formData.loanAmount), Number(formData.monthlyIncome))) {
    const maxLoan = calculateMaxLoanAmount(Number(formData.monthlyIncome));
    errors.loanAmount = `Loan amount cannot exceed ₹${maxLoan.toLocaleString()} (20x monthly income)`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Format currency in Indian format
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Calculate EMI
 */
export const calculateEMI = (principal, rate, tenureMonths) => {
  const monthlyRate = rate / 12 / 100;
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
};

/**
 * Calculate max eligible EMI based on employment type
 */
export const calculateMaxEMI = (monthlyIncome, employmentType) => {
  const percentAllowed =
    employmentType === 'SALARIED'
      ? LOAN_CONFIG.SALARIED_MAX_EMI_PERCENT
      : LOAN_CONFIG.SELF_EMPLOYED_MAX_EMI_PERCENT;
  return Math.round((monthlyIncome * percentAllowed) / 100);
};
