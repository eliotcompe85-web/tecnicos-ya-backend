#!/usr/bin/env python3
"""Test endpoints de autenticación y servicios"""

import time
import requests
import json

base_url = 'http://127.0.0.1:8000'

def register_or_login(payload):
    r = requests.post(f'{base_url}/api/auth/register', json=payload)
    if r.status_code in (200, 201):
        return r.json()
    if r.status_code == 400 and 'registrado' in r.text:
        login_r = requests.post(
            f'{base_url}/api/auth/login',
            json={'email': payload['email'], 'password': payload['password']}
        )
        if login_r.status_code == 200:
            return login_r.json()
    return None

# Test 1: Registro de nuevo usuario (cliente)
print('=== TEST 1: REGISTRO DE CLIENTE ===')
unique_suffix = int(time.time() * 1000)
register_payload = {
    'email': f'cliente_{unique_suffix}@test.com',
    'password': 'password123',
    'full_name': 'Juan Cliente',
    'phone': '+56912345678',
    'role': 'client'
}
register_result = register_or_login(register_payload)
if register_result:
    data = register_result
    token = data['access_token']
    print(f'Status: 200')
    print(f'Token: {token[:20]}...')
    print(f'User: {data["user"]["email"]} ({data["user"]["role"]})')
else:
    print('Status: ERROR')
    print('Error: no se pudo registrar ni iniciar sesión')
    token = None

# Test 2: Registro de técnico
print('\n=== TEST 2: REGISTRO DE TÉCNICO ===')
tech_payload = {
    'email': f'tecnico_{unique_suffix}@test.com',
    'password': 'password123',
    'full_name': 'Carlos Técnico',
    'phone': '+56987654321',
    'role': 'technician'
}
tech_result = register_or_login(tech_payload)
if tech_result:
    tech_data = tech_result
    tech_token = tech_data['access_token']
    print('Status: 200')
    print(f'Token: {tech_token[:20]}...')
else:
    print('Status: ERROR')
    print('Error: no se pudo registrar ni iniciar sesión técnico')
    tech_token = None

# Test 3: Login
print('\n=== TEST 3: LOGIN ===')
login_payload = {
    'email': 'cliente@test.com',
    'password': 'password123'
}
r = requests.post(f'{base_url}/api/auth/login', json=login_payload)
print(f'Status: {r.status_code}')
if r.status_code == 200:
    token = r.json()['access_token']
    print(f'Token: {token[:20]}...')
else:
    print(f'Error: {r.text}')

# Test 4: Get current user
print('\n=== TEST 4: GET CURRENT USER ===')
headers = {'Authorization': f'Bearer {token}'}
r = requests.get(f'{base_url}/api/auth/me', headers=headers)
print(f'Status: {r.status_code}')
if r.status_code == 200:
    user = r.json()
    print(f'User: {user["email"]} | Role: {user["role"]} | Name: {user["full_name"]}')
else:
    print(f'Error: {r.text}')

# Test 5: Crear solicitud de servicio
print('\n=== TEST 5: CREAR SOLICITUD DE SERVICIO ===')
request_payload = {
    'category_id': 'electricos',
    'title': 'Reparación eléctrica',
    'description': 'Necesito reparar un enchufe dañado',
    'location': {
        'type': 'Point',
        'coordinates': [-70.9821, -33.8569]
    },
    'address': 'Av. Siempre Viva 123'
}
headers = {'Authorization': f'Bearer {token}'}
r = requests.post(f'{base_url}/api/service-requests', json=request_payload, headers=headers)
print(f'Status: {r.status_code}')
if r.status_code in (200, 201):
    req_data = r.json()
    request_id = req_data.get('_id') or req_data.get('id')
    print(f'Request ID: {request_id}')
    print(f'Category: {req_data["category_id"]}')
    print(f'Status: {req_data["status"]}')
else:
    print(f'Error: {r.text}')
    request_id = None

# Test 6: Crear aplicación (postulación)
print('\n=== TEST 6: CREAR APLICACIÓN (POSTULACIÓN) ===')
app_payload = {
    'service_request_id': request_id or 1,
    'proposed_price': 15990.0
}
headers = {'Authorization': f'Bearer {tech_token}'}
r = requests.post(f'{base_url}/api/applications', json=app_payload, headers=headers)
print(f'Status: {r.status_code}')
if r.status_code in (200, 201):
    app_data = r.json()
    print(f'Application ID: {app_data.get("_id") or app_data.get("id")}')
    print(f'Proposed Price: ${app_data.get("proposed_price")}')
    print(f'Status: {app_data.get("status")}')
else:
    print(f'Error: {r.text}')

print('\n=== TODOS LOS TESTS COMPLETADOS ===')
