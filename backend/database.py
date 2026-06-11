from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'tecnicos_ya')]

# Collections
users_collection = db.users
categories_collection = db.service_categories
technician_profiles_collection = db.technician_profiles
service_requests_collection = db.service_requests
applications_collection = db.applications
reviews_collection = db.reviews
visits_collection = db.visits
payments_collection = db.payments

async def init_db():
    """Initialize database with indexes"""
    # Create indexes
    await users_collection.create_index("email", unique=True)
    await technician_profiles_collection.create_index("user_id")
    await technician_profiles_collection.create_index([("location", "2dsphere")])
    await service_requests_collection.create_index([("location", "2dsphere")])
    await service_requests_collection.create_index("client_id")
    await applications_collection.create_index("service_request_id")
    await applications_collection.create_index("technician_id")
    await visits_collection.create_index("client_id")
    await visits_collection.create_index("technician_id")
    await reviews_collection.create_index("from_user_id")
    await reviews_collection.create_index("to_user_id")

async def close_db():
    client.close()