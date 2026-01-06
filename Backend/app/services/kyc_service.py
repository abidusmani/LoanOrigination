"""
KYC Service
Handles KYC verification with rule-based mock implementation
"""

from abc import ABC, abstractmethod
from typing import Dict, Any
from datetime import datetime
import uuid
import re

from app.core.constants import LoanConfig


class KYCServiceInterface(ABC):
    """Abstract KYC Service Interface"""
    
    @abstractmethod
    async def verify(self, full_name: str, pan: str) -> Dict[str, Any]:
        """
        Verify KYC for an applicant
        
        Args:
            full_name: Applicant's full name
            pan: PAN number
            
        Returns:
            KYC verification result
        """
        pass


class MockKYCService(KYCServiceInterface):
    """
    Mock KYC Service Implementation
    Uses rule-based logic for KYC verification
    
    Rules:
    - nameMatchScore < 80 → KYC_FAILED
    - PAN format validation
    - Name characteristics affect score
    """
    
    def _calculate_name_match_score(self, full_name: str, pan: str) -> int:
        """
        Calculate name match score based on rules
        
        Args:
            full_name: Applicant's full name
            pan: PAN number
            
        Returns:
            Name match score (0-100)
        """
        score = 100  # Start with perfect score
        
        # Rule 1: Name should have at least 2 parts (first & last name)
        name_parts = full_name.strip().split()
        if len(name_parts) < 2:
            score -= 15
        
        # Rule 2: Name length check (very short names get penalty)
        if len(full_name) < 5:
            score -= 20
        
        # Rule 3: PAN 4th character should match first letter of last name
        pan_fourth_char = pan[3].upper() if len(pan) > 3 else ''
        last_name = name_parts[-1] if name_parts else ''
        last_name_first_char = last_name[0].upper() if last_name else ''
        
        if pan_fourth_char and last_name_first_char and pan_fourth_char != last_name_first_char:
            score -= 25
        
        # Rule 4: Check for special characters in name
        if re.search(r'[^a-zA-Z\s]', full_name):
            score -= 10
        
        # Rule 5: Very long names (>50 chars) might indicate data entry issues
        if len(full_name) > 50:
            score -= 5
        
        # Rule 6: All caps or all lowercase names
        if full_name == full_name.upper() or full_name == full_name.lower():
            score -= 5
        
        # Rule 7: Test cases for demonstration
        if full_name.upper().startswith('TEST') or full_name.upper().startswith('FAIL'):
            score = 50  # Force failure
        
        if full_name.upper().startswith('PASS') or full_name.upper().startswith('SUCCESS'):
            score = 95  # Force success
        
        return max(0, min(100, score))
    
    async def verify(self, full_name: str, pan: str) -> Dict[str, Any]:
        """
        Verify KYC using rule-based logic
        
        Args:
            full_name: Applicant's full name
            pan: PAN number
            
        Returns:
            KYC verification result
        """
        # Validate inputs
        if not full_name or not pan:
            raise ValueError("Full name and PAN are required for KYC verification")
        
        # Calculate name match score
        name_match_score = self._calculate_name_match_score(full_name, pan)
        
        # Determine if KYC passed
        verified = name_match_score >= LoanConfig.MIN_KYC_NAME_MATCH_SCORE
        
        # Aadhaar linkage based on score
        aadhaar_linked = name_match_score >= 70
        
        # Generate result
        name_parts = full_name.strip().split()
        
        return {
            "verified": verified,
            "name_match_score": name_match_score,
            "verification_id": f"KYC-{uuid.uuid4().hex[:12].upper()}",
            "verified_at": datetime.utcnow().isoformat(),
            "details": {
                "name_match": "Matched" if verified else "Partial Match",
                "pan_verified": True,
                "pan_holder_type": "Individual",
                "aadhaar_linked": aadhaar_linked,
                "pan_name": full_name.upper(),
                "masked_aadhaar": f"XXXX-XXXX-{pan[5:9]}" if aadhaar_linked and len(pan) >= 9 else "Not Linked",
                "verification_method": "Rule-Based Mock Service",
                "rules": {
                    "name_parts": len(name_parts),
                    "pan_name_match": pan[3].upper() == name_parts[-1][0].upper() if len(pan) > 3 and name_parts else False,
                    "format_valid": not re.search(r'[^a-zA-Z\s]', full_name),
                }
            }
        }


# Default KYC service instance
kyc_service = MockKYCService()


async def get_kyc_service() -> KYCServiceInterface:
    """Dependency to get KYC service"""
    return kyc_service
