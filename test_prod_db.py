import os
import urllib.parse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, selectinload
import database

# Override DB URL with prod pooler URL
password = urllib.parse.quote_plus("92BcPvnj3Lf,Lz?")
db_url = f"postgresql://postgres.ikdxazoylvuudeflbkyw:{password}@db.ikdxazoylvuudeflbkyw.supabase.co:6543/postgres"
engine = create_engine(db_url)
SessionLocal = sessionmaker(bind=engine)

def test_query():
    db = SessionLocal()
    try:
        query = db.query(database.ServiceRequest).options(
            selectinload(database.ServiceRequest.client),
            selectinload(database.ServiceRequest.applications).selectinload(database.Application.technician),
            selectinload(database.ServiceRequest.visit)
        ).filter(database.ServiceRequest.client_id == 1)
        requests_list = query.order_by(database.ServiceRequest.created_at.desc()).all()
        print(f"Loaded {len(requests_list)} service requests successfully!")
        
        # Test serialization
        from services.serialization import serialize_service_request
        for r in requests_list:
            serialize_service_request(r, db)
        print("Serialized successfully!")
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_query()
