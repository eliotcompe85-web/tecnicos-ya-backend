import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'tecnicos_ya')]

async def seed_categories():
    categories = [
        {
            "name": "Electricidad",
            "description": "Instalaciones eléctricas, reparaciones, mantención",
            "icon": "flash",
            "is_active": True
        },
        {
            "name": "Gasfitería",
            "description": "Instalaciones sanitarias, cañerías, fugas de agua",
            "icon": "water",
            "is_active": True
        },
        {
            "name": "Construcción",
            "description": "Albañilería, remodelaciones, ampliaciones",
            "icon": "hammer",
            "is_active": True
        },
        {
            "name": "Mecánica",
            "description": "Reparación de vehículos, mantención",
            "icon": "build",
            "is_active": True
        },
        {
            "name": "Carpintería",
            "description": "Muebles, reparaciones en madera",
            "icon": "construct",
            "is_active": True
        },
        {
            "name": "Pintura",
            "description": "Pintura de interiores y exteriores",
            "icon": "color-palette",
            "is_active": True
        },
        {
            "name": "Climatización",
            "description": "Instalación y mantención de aire acondicionado",
            "icon": "thermometer",
            "is_active": True
        },
        {
            "name": "Cerrajería",
            "description": "Instalación y reparación de cerraduras",
            "icon": "key",
            "is_active": True
        },
        {
            "name": "Jardinería",
            "description": "Mantención de jardines y áreas verdes",
            "icon": "leaf",
            "is_active": True
        },
        {
            "name": "Limpieza",
            "description": "Limpieza de casas, oficinas y empresas",
            "icon": "sparkles",
            "is_active": True
        },
        {
            "name": "Maquinaria Pesada",
            "description": "Operación de excavadoras, grúas, etc.",
            "icon": "car",
            "is_active": True
        },
        {
            "name": "Informática",
            "description": "Reparación de computadores, redes",
            "icon": "desktop",
            "is_active": True
        }
    ]
    
    # Clear existing categories
    await db.service_categories.delete_many({})
    
    # Insert new categories
    result = await db.service_categories.insert_many(categories)
    print(f"✅ Insertadas {len(result.inserted_ids)} categorías")
    return result.inserted_ids

async def main():
    print("🌱 Iniciando seed de datos...")
    
    try:
        category_ids = await seed_categories()
        print(f"✅ Seed completado exitosamente!")
        print(f"   - {len(category_ids)} categorías creadas")
    except Exception as e:
        print(f"❌ Error en seed: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())
