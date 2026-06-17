import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os

# ✅ Fuerza la salida en UTF-8 para que los emojis funcionen en Windows
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.getenv("DB_NAME", "tecnicos_ya")]


async def seed_categories():
    categories = [
        {
            "name": "Electricos",
            "description": "Instalaciones electricas, reparaciones, mantencion",
            "icon": "flash",
            "is_active": True
        },
        {
            "name": "Mecanicos",
            "description": "Reparaciones mecanicas y mantencion",
            "icon": "build",
            "is_active": True
        },
        {
            "name": "Gasfiter",
            "description": "Instalaciones sanitarias, canerias, fugas de agua",
            "icon": "water",
            "is_active": True
        }
    ]

    # Clear existing categories
    await db.service_categories.delete_many({})

    # Insert new categories
    result = await db.service_categories.insert_many(categories)
    print(f"[OK] Insertadas {len(result.inserted_ids)} categorias")
    return result.inserted_ids


async def main():
    print("[*] Iniciando seed de datos...")

    try:
        category_ids = await seed_categories()
        print(f"[OK] Seed completado exitosamente!")
        print(f"   - {len(category_ids)} categorias creadas")
    except Exception as e:
        print(f"[ERROR] Error en seed: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())
