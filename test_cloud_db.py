import os
from sqlalchemy import text
from database import SessionLocal, init_database
from dotenv import load_dotenv

load_dotenv()

def test_connection():
    print("--- Iniciando prueba de conexión a la nube ---")
    db_url = os.getenv("DATABASE_URL")
    print(f"Intentando conectar a: {db_url}")
    
    if not db_url:
        print("❌ ERROR: No se encontró DATABASE_URL en el archivo .env")
        return

    db = SessionLocal()
    try:
        # 1. Probar conexión básica
        db.execute(text("SELECT 1"))
        print("✅ Conexión exitosa a la base de datos en la nube.")
        
        # 2. Intentar inicializar tablas
        print("Iniciando creación de tablas en Supabase...")
        init_database()
        print("✅ Tablas creadas/verificadas correctamente en la nube.")
        
        print("\n🎉 ¡TODO LISTO! Tu backend ya tiene cerebro en la nube.")
        
    except Exception as e:
        print(f"\n❌ ERROR CRÍTICO: No se pudo conectar a la nube.")
        print(f"Detalles del error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_connection()
