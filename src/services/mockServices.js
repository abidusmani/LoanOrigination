/**
 * Mock API Service
 * This file contains mock implementations that simulate backend responses.
 * Replace with real API calls when backend is ready.
 */

import { WORKFLOW_STATES, LOAN_CONFIG } from '../constants/workflowStates';

// Simulate network delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Generate random ID
const generateId = (prefix = 'ID') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Mock KYC Service
 * Simulates KYC verification with RULE-BASED responses
 * 
 * Rules:
 * - nameMatchScore < 80 → KYC_FAILED
 * - PAN format validation determines base score
 * - Name characteristics affect the final score
 */
export const MockKYCService = {
  /**
   * Rule-based name matching algorithm
   * Simulates name matching against PAN database
   * @param {string} fullName - Applicant's full name
   * @param {string} pan - PAN number
   * @returns {number} Name match score (0-100)
   */
  _calculateNameMatchScore: (fullName, pan) => {
    let score = 100; // Start with perfect score and deduct based on rules

    // Rule 1: Name should have at least 2 parts (first & last name)
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length < 2) {
      score -= 15; // Single name penalty
    }

    // Rule 2: Name length check (very short names get penalty)
    if (fullName.length < 5) {
      score -= 20;
    }

    // Rule 3: PAN 4th character should match first letter of last name
    // PAN format: ABCDE1234F where 4th char relates to surname
    const panFourthChar = pan.charAt(3).toUpperCase();
    const lastName = nameParts[nameParts.length - 1];
    const lastNameFirstChar = lastName.charAt(0).toUpperCase();
    
    if (panFourthChar !== lastNameFirstChar) {
      score -= 25; // PAN-Name mismatch penalty
    }

    // Rule 4: Check for special characters in name (unusual, lower confidence)
    if (/[^a-zA-Z\s]/.test(fullName)) {
      score -= 10;
    }

    // Rule 5: Very long names (>50 chars) might indicate data entry issues
    if (fullName.length > 50) {
      score -= 5;
    }

    // Rule 6: All caps or all lowercase names (formatting issues)
    if (fullName === fullName.toUpperCase() || fullName === fullName.toLowerCase()) {
      score -= 5;
    }

    // Rule 7: Specific test cases for demonstration
    // Names starting with 'TEST' or 'FAIL' will fail KYC
    if (fullName.toUpperCase().startsWith('TEST') || fullName.toUpperCase().startsWith('FAIL')) {
      score = 50; // Force failure for testing
    }

    // Names starting with 'PASS' or 'SUCCESS' will pass KYC
    if (fullName.toUpperCase().startsWith('PASS') || fullName.toUpperCase().startsWith('SUCCESS')) {
      score = 95; // Force success for testing
    }

    // Ensure score stays within bounds
    return Math.max(0, Math.min(100, score));
  },

  /**
   * Rule-based PAN verification
   * @param {string} pan - PAN number to verify
   * @returns {Object} PAN verification result
   */
  _verifyPAN: (pan) => {
    // PAN format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const isValidFormat = panRegex.test(pan.toUpperCase());
    
    // 4th character indicates holder type: P=Person, C=Company, H=HUF, etc.
    // For this mock, we accept all letters as valid (real validation would be stricter)
    const holderTypeChar = pan.charAt(3).toUpperCase();
    
    // Map common holder types for display
    const holderTypeMap = {
      'P': 'Individual',
      'C': 'Company',
      'H': 'HUF',
      'F': 'Firm',
      'A': 'AOP',
      'T': 'Trust',
      'B': 'BOI',
      'L': 'Local Authority',
      'J': 'Artificial Juridical Person',
      'G': 'Government',
    };

    return {
      isValid: isValidFormat, // Only check format, not holder type restriction
      format: isValidFormat ? 'Valid' : 'Invalid',
      holderType: holderTypeMap[holderTypeChar] || 'Individual',
    };
  },

  /**
   * Verify KYC for an application using rule-based logic
   * @param {Object} applicationData - Application data with fullName, pan
   * @returns {Promise<Object>} KYC verification result
   */
  verify: async (applicationData) => {
    const { fullName, pan } = applicationData;
    
    // Simulate API call delay
    await delay(2000);

    // Validate required fields
    if (!fullName || !pan) {
      throw new Error('Missing required fields: fullName and pan are required');
    }

    // Rule-based PAN verification
    const panVerification = MockKYCService._verifyPAN(pan);
    if (!panVerification.isValid) {
      throw new Error('Invalid PAN format. Please check and try again.');
    }

    // Rule-based name match score calculation
    const nameMatchScore = MockKYCService._calculateNameMatchScore(fullName, pan);
    
    // KYC passes only if nameMatchScore >= 80
    const verified = nameMatchScore >= LOAN_CONFIG.MIN_KYC_NAME_MATCH_SCORE;

    // Generate Aadhaar linkage based on rules
    // Linked if name score is above 70 (showing some correlation)
    const aadhaarLinked = nameMatchScore >= 70;

    return {
      verified,
      nameMatchScore,
      verificationId: generateId('KYC'),
      verifiedAt: new Date().toISOString(),
      details: {
        nameMatch: verified ? 'Matched' : 'Partial Match',
        panVerified: panVerification.isValid,
        panHolderType: panVerification.holderType,
        aadhaarLinked,
        panName: fullName.toUpperCase(), // Simulated name from PAN database
        maskedAadhaar: aadhaarLinked ? 'XXXX-XXXX-' + pan.substring(5, 9) : 'Not Linked',
        verificationMethod: 'Rule-Based Mock Service',
        rules: {
          nameParts: fullName.trim().split(/\s+/).length,
          panNameMatch: pan.charAt(3).toUpperCase() === fullName.trim().split(/\s+/).pop().charAt(0).toUpperCase(),
          formatValid: !/[^a-zA-Z\s]/.test(fullName),
        },
      },
    };
  },

  /**
   * Get KYC verification status
   * @param {string} verificationId - Verification ID from previous verification
   * @returns {Promise<Object>} Current KYC status
   */
  getStatus: async (verificationId) => {
    await delay(500);
    return {
      verificationId,
      status: 'COMPLETED',
      checkedAt: new Date().toISOString(),
    };
  },
};

/**
 * Mock Credit Bureau Service (CIBIL)
 * Simulates credit bureau check with RULE-BASED responses
 * 
 * Rules:
 * - Credit score < 650 → CREDIT_REJECTED
 * - Active loans > 5 → CREDIT_REJECTED
 */
export const MockCibilService = {
  /**
   * Rule-based credit score calculation
   * Based on PAN pattern and application data
   * @param {string} pan - PAN number
   * @param {number} monthlyIncome - Monthly income
   * @returns {number} Calculated credit score
   */
  _calculateCreditScore: (pan, monthlyIncome = 0) => {
    let baseScore = 700; // Start with a decent score

    // Rule 1: PAN first letter affects base score
    const firstChar = pan.charAt(0).toUpperCase();
    if ('ABCD'.includes(firstChar)) {
      baseScore += 50; // Good score boost
    } else if ('WXYZ'.includes(firstChar)) {
      baseScore -= 100; // Lower score
    }

    // Rule 2: Income-based adjustment
    if (monthlyIncome >= 100000) {
      baseScore += 30; // High income bonus
    } else if (monthlyIncome >= 50000) {
      baseScore += 15;
    } else if (monthlyIncome < 25000) {
      baseScore -= 50; // Low income penalty
    }

    // Rule 3: PAN checksum digit (last char before final letter)
    const checkDigit = parseInt(pan.charAt(8));
    if (!isNaN(checkDigit)) {
      if (checkDigit >= 5) {
        baseScore += 20;
      } else if (checkDigit <= 2) {
        baseScore -= 30;
      }
    }

    // Rule 4: Specific test PANs
    // PANs starting with 'FAIL' or containing '0000' will have low score
    if (pan.toUpperCase().startsWith('FAIL') || pan.includes('0000')) {
      baseScore = 550; // Force low score for testing
    }
    
    // PANs starting with 'PASS' or 'GOOD' will have high score
    if (pan.toUpperCase().startsWith('PASS') || pan.toUpperCase().startsWith('GOOD')) {
      baseScore = 780; // Force high score for testing
    }

    // Ensure score stays within realistic CIBIL range (300-900)
    return Math.max(300, Math.min(900, baseScore));
  },

  /**
   * Rule-based active loans calculation
   * @param {string} pan - PAN number
   * @returns {number} Number of active loans
   */
  _calculateActiveLoans: (pan) => {
    // Rule: Use PAN digits to determine active loans
    const digits = pan.match(/\d+/)?.[0] || '0000';
    const sumDigits = digits.split('').reduce((sum, d) => sum + parseInt(d), 0);
    
    // Normalize to 0-8 range
    let activeLoans = sumDigits % 9;
    
    // Test cases
    if (pan.includes('9999')) {
      activeLoans = 7; // Force many loans for testing
    }
    if (pan.includes('1111')) {
      activeLoans = 1; // Force few loans for testing
    }
    
    return activeLoans;
  },

  /**
   * Get credit report for an applicant using rule-based logic
   * @param {Object} applicationData - Application data with pan, fullName
   * @returns {Promise<Object>} Credit report result
   */
  getCreditReport: async (applicationData) => {
    const { pan, fullName, monthlyIncome = 0 } = applicationData;
    
    // Simulate API call delay
    await delay(2500);

    // Validate required fields
    if (!pan) {
      throw new Error('PAN number is required for credit check');
    }

    // Rule-based calculations
    const creditScore = MockCibilService._calculateCreditScore(pan, monthlyIncome);
    const activeLoans = MockCibilService._calculateActiveLoans(pan);

    const passed = creditScore >= LOAN_CONFIG.MIN_CREDIT_SCORE && 
                   activeLoans <= LOAN_CONFIG.MAX_ACTIVE_LOANS;

    // Generate credit history rating based on score
    const getCreditHistory = (score) => {
      if (score >= 750) return 'Excellent';
      if (score >= 700) return 'Good';
      if (score >= 650) return 'Fair';
      if (score >= 550) return 'Poor';
      return 'Very Poor';
    };

    return {
      passed,
      creditScore,
      activeLoans,
      bureauId: generateId('CIBIL'),
      checkedAt: new Date().toISOString(),
      details: {
        creditHistory: getCreditHistory(creditScore),
        paymentHistory: activeLoans > 3 ? 'Minor Delays' : 'No defaults',
        creditUtilization: `${Math.min(90, 20 + activeLoans * 10)}%`,
        oldestAccount: `${Math.max(1, 10 - activeLoans)} years`,
        recentEnquiries: Math.min(activeLoans, 4),
        totalAccounts: activeLoans + 3,
        closedAccounts: Math.max(0, activeLoans - 2),
        verificationMethod: 'Rule-Based Mock Service',
        rules: {
          panPattern: pan.substring(0, 5),
          incomeConsidered: monthlyIncome > 0,
          scoreFactors: {
            panFirstChar: pan.charAt(0).toUpperCase(),
            panCheckDigit: pan.charAt(8),
          },
        },
      },
    };
  },

  /**
   * Get credit report status
   * @param {string} bureauId - Bureau reference ID
   * @returns {Promise<Object>} Current status
   */
  getStatus: async (bureauId) => {
    await delay(500);
    return {
      bureauId,
      status: 'COMPLETED',
      checkedAt: new Date().toISOString(),
    };
  },
};

/**
 * Mock Eligibility Engine
 * Calculates loan eligibility based on defined rules
 */
export const MockEligibilityEngine = {
  /**
   * Calculate loan eligibility
   * @param {Object} params - Eligibility parameters
   * @returns {Promise<Object>} Eligibility result
   */
  calculate: async ({ 
    monthlyIncome, 
    loanAmount, 
    employmentType, 
    creditScore,
    tenure = LOAN_CONFIG.TENURE_MONTHS,
    interestRate = LOAN_CONFIG.INTEREST_RATE,
  }) => {
    await delay(1500);

    // Calculate max EMI based on employment type
    const maxEMIPercent = employmentType === 'SALARIED' 
      ? LOAN_CONFIG.SALARIED_MAX_EMI_PERCENT 
      : LOAN_CONFIG.SELF_EMPLOYED_MAX_EMI_PERCENT;
    
    const maxAllowedEMI = Math.round((monthlyIncome * maxEMIPercent) / 100);

    // Calculate EMI for requested loan amount
    const monthlyRate = interestRate / 12 / 100;
    const requestedEMI = Math.round(
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
      (Math.pow(1 + monthlyRate, tenure) - 1)
    );

    // Calculate max eligible loan amount based on max EMI
    const maxEligibleAmount = Math.round(
      (maxAllowedEMI * (Math.pow(1 + monthlyRate, tenure) - 1)) /
      (monthlyRate * Math.pow(1 + monthlyRate, tenure))
    );

    const eligible = requestedEMI <= maxAllowedEMI;

    // Calculate total payable and interest
    const totalPayable = requestedEMI * tenure;
    const totalInterest = totalPayable - loanAmount;

    return {
      eligible,
      requestedLoanAmount: loanAmount,
      approvedLoanAmount: eligible ? loanAmount : maxEligibleAmount,
      maxEligibleAmount,
      requestedEMI,
      maxAllowedEMI,
      interestRate,
      tenure,
      creditScore,
      monthlyIncome,
      employmentType,
      totalPayable: eligible ? totalPayable : maxAllowedEMI * tenure,
      totalInterest: eligible ? totalInterest : (maxAllowedEMI * tenure) - maxEligibleAmount,
      calculatedAt: new Date().toISOString(),
      reason: eligible
        ? 'Congratulations! You are eligible for the requested loan amount.'
        : `Your maximum eligible loan amount is ₹${maxEligibleAmount.toLocaleString()} based on your income and EMI capacity.`,
    };
  },
};

export default {
  MockKYCService,
  MockCibilService,
  MockEligibilityEngine,
};
