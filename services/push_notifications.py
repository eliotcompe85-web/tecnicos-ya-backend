import logging
from exponent_server_sdk import PushClient, PushMessage
from sqlalchemy.orm import Session
from database import PushToken

logger = logging.getLogger(__name__)

def send_push_notification(user_id: int, title: str, body: str, db: Session):
    """
    Sends a push notification to all devices registered to the user.
    """
    tokens = db.query(PushToken).filter(PushToken.user_id == user_id).all()
    
    if not tokens:
        logger.warning(f"No push tokens found for user {user_id}")
        return

    client = PushClient()
    for token in tokens:
        try:
            logger.info(f"Sending notification to token {token.token}")
            client.publish(
                PushMessage(
                    to=token.token,
                    title=title,
                    body=body,
                    data={"user_id": user_id}
                )
            )
        except Exception as e:
            logger.error(f"Error sending push notification to {token.token}: {e}")
