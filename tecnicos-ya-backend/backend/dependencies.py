# Dependency for future MongoDB integration (currently unused)
# from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
# from typing import AsyncGenerator
# import os
# from dotenv import load_dotenv
# from pathlib import Path
# 
# ROOT_DIR = Path(__file__).parent.parent
# load_dotenv(ROOT_DIR / '.env')
# 
# mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
# client = AsyncIOMotorClient(mongo_url)
# 
# async def get_mongo_db() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
#     """Dependency that returns the MongoDB database instance used by the app.
#     It mirrors the `db` object from `seed_data.py` but is provided as a FastAPI dependency.
#     """
#     db_name = os.getenv("DB_NAME", "tecnicos_ya")
#     yield client[db_name]
