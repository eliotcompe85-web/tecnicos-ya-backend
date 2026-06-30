from functools import wraps
from flask import request, jsonify
from firebase_admin import auth

def role_required(required_role):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            id_token = request.headers.get('Authorization')
            if not id_token or not id_token.startswith('Bearer '):
                return jsonify({"message": "Token faltante o inválido"}), 401
            
            try:
                token = id_token.split(' ')[1]
                decoded_token = auth.verify_id_token(token)
                
                # Verificamos si el usuario tiene el rol necesario en sus 'claims'
                user_role = decoded_token.get('role')
                
                if user_role != required_role:
                    return jsonify({"message": "No autorizado: Rol insuficiente"}), 403
                
                request.user = decoded_token
            except Exception as e:
                return jsonify({"message": "Error de autenticación", "error": str(e)}), 403
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator