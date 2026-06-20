from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, ForeignKey, Boolean, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

from config import DATABASE_URL, logger

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    role = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    verification_sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Technician(Base):
    __tablename__ = "technicians"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    especialidad = Column(String, nullable=False)
    latitud = Column(Float, nullable=False)
    longitud = Column(Float, nullable=False)


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    icon = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)


class TechnicianProfile(Base):
    __tablename__ = "technician_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    category_ids = Column(String, nullable=True)
    description = Column(String, nullable=True)
    experience_years = Column(Integer, default=0)
    certifications = Column(String, nullable=True)
    portfolio_images = Column(String, nullable=True)
    background_check_cert = Column(String, nullable=True)
    id_card_front = Column(String, nullable=True)
    id_card_back = Column(String, nullable=True)
    verification_status = Column(String, default="pending") # pending, approved, rejected
    location = Column(String, nullable=True)
    availability_status = Column(String, default="available")
    membership_type = Column(String, default="none")
    membership_start_date = Column(DateTime, nullable=True)
    membership_end_date = Column(DateTime, nullable=True)
    is_first_month_free = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ServiceRequest(Base):
    __tablename__ = "service_requests"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String, nullable=False)
    budget_min = Column(Float, nullable=True)
    budget_max = Column(Float, nullable=True)
    status = Column(String, default="open")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class Application(Base):
    __tablename__ = "applications"
    id = Column(Integer, primary_key=True, index=True)
    service_request_id = Column(Integer, ForeignKey("service_requests.id"), nullable=False)
    technician_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=True)
    proposed_price = Column(Float, nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)


class Visit(Base):
    __tablename__ = "visits"
    id = Column(Integer, primary_key=True, index=True)
    technician_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    service_request_id = Column(Integer, ForeignKey("service_requests.id"), nullable=True)
    latitud_cliente = Column(Float, nullable=False)
    longitud_cliente = Column(Float, nullable=False)
    latitud_tecnico = Column(Float, nullable=False)
    longitud_tecnico = Column(Float, nullable=False)
    distancia_km = Column(Float, nullable=False)
    precio_final = Column(Float, nullable=False)
    status = Column(String, default="scheduled") # scheduled, completed, paid, cancelled, disputed
    fecha = Column(DateTime, default=datetime.utcnow)
    scheduled_at = Column(DateTime, nullable=True)

class Dispute(Base):
    __tablename__ = "disputes"
    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    technician_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reason = Column(String, nullable=False)
    status = Column(String, default="open") # open, resolved, rejected
    resolution = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reviewee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    link = Column(String, nullable=True)

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)

class StripeEvent(Base):
    __tablename__ = "stripe_events"
    id = Column(String, primary_key=True) # Stripe event ID
    event_type = Column(String, nullable=False)
    processed_at = Column(DateTime, default=datetime.utcnow)

def get_db():

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_database():
    Base.metadata.create_all(bind=engine)
    sync_database_schema()

def create_notification(user_id: int, message: str, link: str = None):
    db = SessionLocal()
    try:
        notification = Notification(user_id=user_id, message=message, link=link)
        db.add(notification)
        db.commit()
    finally:
        db.close()

def sync_database_schema():

    with engine.connect() as conn:
        result = conn.execute(text("PRAGMA table_info(visits)"))
        columns = [row[1] for row in result.fetchall()]
        if 'technician_id' not in columns:
            conn.execute(text("ALTER TABLE visits RENAME TO visits_old"))
            conn.execute(text('''
                CREATE TABLE visits (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    technician_id INTEGER NOT NULL,
                    latitud_cliente FLOAT NOT NULL,
                    longitud_cliente FLOAT NOT NULL,
                    latitud_tecnico FLOAT NOT NULL,
                    longitud_tecnico FLOAT NOT NULL,
                    distancia_km FLOAT NOT NULL,
                    precio_final FLOAT NOT NULL,
                    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            '''))
            conn.execute(text('''
                INSERT INTO visits (id, technician_id, latitud_cliente, longitud_cliente, latitud_tecnico, longitud_tecnico, distancia_km, precio_final, fecha)
                SELECT id, 0, latitud_cliente, longitud_cliente, latitud_tecnico, longitud_tecnico, distancia_km, precio_final, fecha FROM visits_old
            '''))
            conn.execute(text('DROP TABLE visits_old'))

        result = conn.execute(text("PRAGMA table_info(service_requests)"))
        sr_columns = [row[1] for row in result.fetchall()]
        if 'title' not in sr_columns:
            conn.execute(text("ALTER TABLE service_requests ADD COLUMN title TEXT NOT NULL DEFAULT ''"))
        if 'address' not in sr_columns:
            conn.execute(text("ALTER TABLE service_requests ADD COLUMN address TEXT NOT NULL DEFAULT ''"))
        if 'budget_min' not in sr_columns:
            conn.execute(text("ALTER TABLE service_requests ADD COLUMN budget_min FLOAT"))
        if 'budget_max' not in sr_columns:
            conn.execute(text("ALTER TABLE service_requests ADD COLUMN budget_max FLOAT"))
        if 'created_at' not in sr_columns:
            conn.execute(text("ALTER TABLE service_requests ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"))
        if 'updated_at' not in sr_columns:
            conn.execute(text("ALTER TABLE service_requests ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP"))

        result = conn.execute(text("PRAGMA table_info(applications)"))
        app_columns = [row[1] for row in result.fetchall()]
        if 'message' not in app_columns:
            conn.execute(text("ALTER TABLE applications ADD COLUMN message TEXT"))

        result = conn.execute(text("PRAGMA table_info(users)"))
        user_columns = [row[1] for row in result.fetchall()]
        if 'is_verified' not in user_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0"))
        if 'verification_token' not in user_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN verification_token TEXT"))
        if 'verification_sent_at' not in user_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN verification_sent_at DATETIME"))
        
        # Create notifications table if it doesn't exist
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                link TEXT
            )
        '''))
        
        # Create disputes table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS disputes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                visit_id INTEGER NOT NULL,
                client_id INTEGER NOT NULL,
                technician_id INTEGER NOT NULL,
                reason TEXT NOT NULL,
                status TEXT DEFAULT 'open',
                resolution TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(visit_id) REFERENCES visits(id),
                FOREIGN KEY(client_id) REFERENCES users(id),
                FOREIGN KEY(technician_id) REFERENCES users(id)
            )
        '''))

        # Create messages table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                visit_id INTEGER NOT NULL,
                sender_id INTEGER NOT NULL,
                receiver_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_read BOOLEAN DEFAULT 0,
                FOREIGN KEY(visit_id) REFERENCES visits(id),
                FOREIGN KEY(sender_id) REFERENCES users(id),
                FOREIGN KEY(receiver_id) REFERENCES users(id)
            )
        '''))
        
        # Create stripe_events table for idempotency
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS stripe_events (
                id TEXT PRIMARY KEY,
                event_type TEXT NOT NULL,
                processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        '''))
        
        # Add scheduled_at to visits

        result_visits = conn.execute(text("PRAGMA table_info(visits)"))
        columns_visits = [row[1] for row in result_visits.fetchall()]
        if 'scheduled_at' not in columns_visits:
            conn.execute(text("ALTER TABLE visits ADD COLUMN scheduled_at DATETIME"))
        if 'service_request_id' not in columns_visits:
            conn.execute(text("ALTER TABLE visits ADD COLUMN service_request_id INTEGER"))

        conn.commit()
