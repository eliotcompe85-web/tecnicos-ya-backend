from sqlalchemy.orm import Session
from database import AuditLog

def log_action(db: Session, user_id: int, action: str, target_table: str, target_id: int = None, changes: str = None):
    """
    Registra una acción administrativa en la tabla audit_logs.
    """
    log = AuditLog(
        user_id=user_id,
        action=action,
        target_table=target_table,
        target_id=target_id,
        changes=changes
    )
    db.add(log)
    db.commit()
    db.refresh(log)
