import math

TARIFA_BASE = 9990.0
DISTANCIA_BASE_KM = 6.0
COSTO_POR_KM_EXTRA = 1000.0


def calcular_distancia_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


def calcular_precio(distancia_km):
    if distancia_km > DISTANCIA_BASE_KM:
        extra_km = distancia_km - DISTANCIA_BASE_KM
        return round(TARIFA_BASE + (extra_km * COSTO_POR_KM_EXTRA), 1)
    return round(TARIFA_BASE, 1)
