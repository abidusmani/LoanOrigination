"""
Base Service Interface
Abstract base class for all services
"""

from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseService(ABC):
    """Abstract base service class"""
    
    @abstractmethod
    async def execute(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the service operation"""
        pass
