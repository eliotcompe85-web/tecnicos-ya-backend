import pathlib

def convert_utf16_to_utf8(input_path, output_path):
    p = pathlib.Path(input_path)
    if not p.exists():
        print(f"{input_path} does not exist")
        return
    try:
        content = p.read_bytes().decode('utf-16le')
        pathlib.Path(output_path).write_text(content, encoding='utf-8')
        print(f"Successfully converted {input_path} to {output_path}")
    except Exception as e:
        print(f"Error converting {input_path}: {e}")

convert_utf16_to_utf8('c:/Users/jimmy/Desktop/ULTIMO PROYECTO/tecnicos-ya-backend/build-android-fix.log', 'c:/Users/jimmy/Desktop/ULTIMO PROYECTO/tecnicos-ya-backend/build-android-fix-utf8.txt')
convert_utf16_to_utf8('c:/Users/jimmy/Desktop/ULTIMO PROYECTO/tecnicos-ya-backend/frontend/build-android4.log', 'c:/Users/jimmy/Desktop/ULTIMO PROYECTO/tecnicos-ya-backend/frontend/build-android4-utf8.txt')
