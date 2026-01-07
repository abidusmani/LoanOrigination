 

from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseService(ABC):
    
    @abstractmethod
    async def execute(self, data: Dict[str, Any]) -> Dict[str, Any]:
        pass
