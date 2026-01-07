 

from abc import ABC, abstractmethod
from typing import Dict, Any
from datetime import datetime

from app.core.constants import LoanConfig, EmploymentType


class EligibilityEngineInterface(ABC):
    
    @abstractmethod
    async def calculate(
        self,
        monthly_income: float,
        loan_amount: float,
        employment_type: str,
        credit_score: int,
        tenure: int = LoanConfig.TENURE_MONTHS,
        interest_rate: float = LoanConfig.INTEREST_RATE,
    ) -> Dict[str, Any]:
        """
        Calculate loan eligibility
        
        Args:
            monthly_income: Monthly income
            loan_amount: Requested loan amount
            employment_type: Employment type (SALARIED/SELF_EMPLOYED)
            credit_score: CIBIL score
            tenure: Loan tenure in months
            interest_rate: Annual interest rate
            
        Returns:
            Eligibility calculation result
        """
        pass


class EligibilityEngine(EligibilityEngineInterface):
    
    def _calculate_emi(self, principal: float, annual_rate: float, tenure_months: int) -> float:
        """
        Calculate EMI using standard formula
        
        EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
        
        Args:
            principal: Loan principal amount
            annual_rate: Annual interest rate (percentage)
            tenure_months: Loan tenure in months
            
        Returns:
            Monthly EMI amount
        """
        if principal <= 0 or tenure_months <= 0:
            return 0
        
        monthly_rate = annual_rate / 12 / 100
        
        if monthly_rate == 0:
            return principal / tenure_months
        
        emi = (principal * monthly_rate * pow(1 + monthly_rate, tenure_months)) / \
              (pow(1 + monthly_rate, tenure_months) - 1)
        
        return round(emi)
    
    def _calculate_max_loan_amount(
        self,
        max_emi: float,
        annual_rate: float,
        tenure_months: int
    ) -> float:
        """
        Calculate maximum loan amount based on max EMI capacity
        
        Args:
            max_emi: Maximum affordable EMI
            annual_rate: Annual interest rate (percentage)
            tenure_months: Loan tenure in months
            
        Returns:
            Maximum eligible loan amount
        """
        if max_emi <= 0 or tenure_months <= 0:
            return 0
        
        monthly_rate = annual_rate / 12 / 100
        
        if monthly_rate == 0:
            return max_emi * tenure_months
        
        max_loan = (max_emi * (pow(1 + monthly_rate, tenure_months) - 1)) / \
                   (monthly_rate * pow(1 + monthly_rate, tenure_months))
        
        return round(max_loan)
    
    async def calculate(
        self,
        monthly_income: float,
        loan_amount: float,
        employment_type: str,
        credit_score: int,
        tenure: int = LoanConfig.TENURE_MONTHS,
        interest_rate: float = LoanConfig.INTEREST_RATE,
    ) -> Dict[str, Any]:
        """
        Calculate loan eligibility
        
        Args:
            monthly_income: Monthly income
            loan_amount: Requested loan amount
            employment_type: Employment type
            credit_score: CIBIL score
            tenure: Loan tenure in months
            interest_rate: Annual interest rate
            
        Returns:
            Eligibility calculation result
        """
        # Determine max EMI percentage based on employment type
        if employment_type == EmploymentType.SALARIED or employment_type == "SALARIED":
            max_emi_percent = LoanConfig.SALARIED_MAX_EMI_PERCENT
        else:
            max_emi_percent = LoanConfig.SELF_EMPLOYED_MAX_EMI_PERCENT
        
        # Calculate max allowed EMI
        max_allowed_emi = round((monthly_income * max_emi_percent) / 100)
        
        # Calculate EMI for requested loan amount
        requested_emi = self._calculate_emi(loan_amount, interest_rate, tenure)
        
        # Calculate max eligible loan amount based on max EMI
        max_eligible_amount = self._calculate_max_loan_amount(max_allowed_emi, interest_rate, tenure)
        
        # Determine eligibility
        eligible = requested_emi <= max_allowed_emi
        
        # Calculate approved loan amount
        approved_loan_amount = loan_amount if eligible else max_eligible_amount
        
        # Calculate total payable and interest
        approved_emi = requested_emi if eligible else max_allowed_emi
        total_payable = approved_emi * tenure
        total_interest = total_payable - approved_loan_amount
        
        # Generate reason
        if eligible:
            reason = "Congratulations! You are eligible for the requested loan amount."
        else:
            reason = f"Your maximum eligible loan amount is ₹{max_eligible_amount:,.0f} based on your income and EMI capacity."
        
        return {
            "eligible": eligible,
            "requested_loan_amount": loan_amount,
            "approved_loan_amount": approved_loan_amount,
            "max_eligible_amount": max_eligible_amount,
            "requested_emi": requested_emi,
            "max_allowed_emi": max_allowed_emi,
            "interest_rate": interest_rate,
            "tenure": tenure,
            "credit_score": credit_score,
            "monthly_income": monthly_income,
            "employment_type": employment_type,
            "total_payable": total_payable,
            "total_interest": total_interest,
            "calculated_at": datetime.utcnow().isoformat(),
            "reason": reason,
        }


# Default eligibility engine instance
eligibility_engine = EligibilityEngine()


async def get_eligibility_engine() -> EligibilityEngineInterface:
    """Dependency to get eligibility engine"""
    return eligibility_engine
