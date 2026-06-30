import pytest
from services.pricing import calcular_distancia_km, calcular_precio, TARIFA_BASE, COSTO_POR_KM_EXTRA, DISTANCIA_BASE_KM

def test_calculo_distancia_cero():
    assert calcular_distancia_km(0, 0, 0, 0) == 0.0

def test_calculo_distancia_conocida():
    # Santiago centro aprox a Las Condes aprox (distancia en km)
    #lat1, lon1, lat2, lon2
    dist = calcular_distancia_km(-33.4489, -70.6483, -33.4172, -70.5670)
    assert dist > 7.0 and dist < 9.0 

def test_precio_dentro_rango_base():
    # 3 km debe ser tarifa base
    assert calcular_precio(3.0) == TARIFA_BASE

def test_precio_en_limite_base():
    # 5 km debe ser tarifa base
    assert calcular_precio(DISTANCIA_BASE_KM) == TARIFA_BASE

def test_precio_km_extra():
    # 7 km (5 base + 2 extra)
    # TARIFA_BASE + (2 * COSTO_POR_KM_EXTRA)
    distancia = 7.0
    expected = TARIFA_BASE + (2.0 * COSTO_POR_KM_EXTRA)
    assert calcular_precio(distancia) == expected
