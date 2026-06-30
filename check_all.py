import os
import sys
import importlib
import traceback

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def check_imports():
    errors = []
    
    # Check server.py
    try:
        import server
    except Exception as e:
        errors.append(f"server.py: {type(e).__name__}: {e}\n{traceback.format_exc()}")
        
    # Check routes
    for file in os.listdir("routes"):
        if file.endswith(".py") and file != "__init__.py":
            mod_name = f"routes.{file[:-3]}"
            try:
                importlib.import_module(mod_name)
            except Exception as e:
                errors.append(f"{mod_name}: {type(e).__name__}: {e}\n{traceback.format_exc()}")

    # Check services
    for file in os.listdir("services"):
        if file.endswith(".py") and file != "__init__.py":
            mod_name = f"services.{file[:-3]}"
            try:
                importlib.import_module(mod_name)
            except Exception as e:
                errors.append(f"{mod_name}: {type(e).__name__}: {e}\n{traceback.format_exc()}")

    if errors:
        print("ERRORS FOUND:")
        for err in set(errors):
            print("====================================")
            print(err)
    else:
        print("NO IMPORT ERRORS FOUND.")

if __name__ == "__main__":
    check_imports()
