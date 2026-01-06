"""
Workflow Engine Service
Manages application state transitions
"""

from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.constants import WorkflowState, VALID_TRANSITIONS, TERMINAL_STATES
from app.models.application import Application


class WorkflowError(Exception):
    """Custom exception for workflow errors"""
    pass


class WorkflowEngine:
    """
    Workflow Engine
    Manages state transitions for loan applications
    
    States:
    DRAFT → KYC_PENDING → KYC_COMPLETED → CREDIT_CHECK_PENDING → 
    CREDIT_CHECK_COMPLETED → ELIGIBLE / NOT_ELIGIBLE
    
    Terminal States: KYC_FAILED, CREDIT_REJECTED, ELIGIBLE, NOT_ELIGIBLE
    """
    
    def can_transition(self, current_state: WorkflowState, target_state: WorkflowState) -> bool:
        """
        Check if transition from current to target state is valid
        
        Args:
            current_state: Current workflow state
            target_state: Target workflow state
            
        Returns:
            True if transition is valid, False otherwise
        """
        valid_targets = VALID_TRANSITIONS.get(current_state, [])
        return target_state in valid_targets
    
    def is_terminal(self, state: WorkflowState) -> bool:
        """
        Check if state is a terminal state
        
        Args:
            state: Workflow state to check
            
        Returns:
            True if terminal state, False otherwise
        """
        return state in TERMINAL_STATES
    
    def get_valid_transitions(self, current_state: WorkflowState) -> list:
        """
        Get list of valid target states from current state
        
        Args:
            current_state: Current workflow state
            
        Returns:
            List of valid target states
        """
        return VALID_TRANSITIONS.get(current_state, [])
    
    def transition(
        self,
        application: Application,
        target_state: WorkflowState,
        action: str,
        details: str,
        data: dict = None,
        db: Session = None
    ) -> Application:
        """
        Transition application to new state
        
        Args:
            application: Application instance
            target_state: Target workflow state
            action: Action name for journey log
            details: Details for journey log
            data: Additional data for journey log
            db: Database session
            
        Returns:
            Updated application instance
            
        Raises:
            WorkflowError: If transition is not valid
        """
        current_state = application.status
        
        # Check if transition is valid
        if not self.can_transition(current_state, target_state):
            raise WorkflowError(
                f"Invalid transition from {current_state.value} to {target_state.value}. "
                f"Valid transitions: {[s.value for s in self.get_valid_transitions(current_state)]}"
            )
        
        # Update application status
        application.status = target_state
        application.updated_at = datetime.utcnow()
        
        # Add journey log entry
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "action": action,
            "status": target_state.value,
            "details": details,
            "data": data or {}
        }
        
        if application.journey_log is None:
            application.journey_log = []
        application.journey_log = application.journey_log + [log_entry]
        
        # Commit if db session provided
        if db:
            db.commit()
            db.refresh(application)
        
        return application
    
    def get_current_step(self, state: WorkflowState) -> int:
        """
        Get current step number based on state
        
        Args:
            state: Workflow state
            
        Returns:
            Step number (0-3)
        """
        step_mapping = {
            WorkflowState.DRAFT: 0,
            WorkflowState.KYC_PENDING: 1,
            WorkflowState.KYC_COMPLETED: 1,
            WorkflowState.KYC_FAILED: 1,
            WorkflowState.CREDIT_CHECK_PENDING: 2,
            WorkflowState.CREDIT_CHECK_COMPLETED: 2,
            WorkflowState.CREDIT_REJECTED: 2,
            WorkflowState.ELIGIBLE: 3,
            WorkflowState.NOT_ELIGIBLE: 3,
        }
        return step_mapping.get(state, 0)
    
    def can_access_step(self, current_state: WorkflowState, target_step: int) -> bool:
        """
        Check if a step can be accessed based on current state
        
        Args:
            current_state: Current workflow state
            target_step: Step number to access (0-3)
            
        Returns:
            True if step can be accessed, False otherwise
        """
        current_step = self.get_current_step(current_state)
        return target_step <= current_step


# Default workflow engine instance
workflow_engine = WorkflowEngine()


def get_workflow_engine() -> WorkflowEngine:
    """Dependency to get workflow engine"""
    return workflow_engine
