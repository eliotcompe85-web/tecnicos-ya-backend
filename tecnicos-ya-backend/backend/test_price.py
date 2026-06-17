import requests

# URL base apuntando a tu puerto 8000
BASE_URL = "http://127.0.0.1:8000"

def ejecutar_pruebas():
    print("====== INICIANDO TEST DE INTEGRACIÓN PLANO (V4) ======\n")

    # Estructuramos los datos EXACTAMENTE como tu servidor los pide en la terminal
    # Usamos el ID 1 (o cualquier ID válido de técnico que tengas en tu base de datos)
    payload = {
        "technician_id": 1,
        "latitud_cliente": -36.8201,
        "longitud_cliente": -72.4624
    }

    print("[1/1] Enviando solicitud a /api/visits/calculate-price...")
    try:
        response = requests.post(f"{BASE_URL}/api/visits/calculate-price", json=payload)
        
        if response.status_code == 200:
            resultado = response.json()
            print("\n✅ ¡CÁLCULO EXITOSO!")
            print(f"   Distancia calculada: {resultado.get('distancia_km')} km")
            print(f"   Precio Final: ${resultado.get('precio_final')}")
            print("\n====== ¡SISTEMA VALIDADO CON ÉXITO! ======")
        else:
            print(f"\n❌ El servidor respondió con código {response.status_code}")
            print(f"   Detalle: {response.text}")
            
    except Exception as e:
        print(f"\n❌ Error de conexión: {e}")

if __name__ == "__main__":
    ejecutar_pruebas()