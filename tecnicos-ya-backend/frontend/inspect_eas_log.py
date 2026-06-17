from pathlib import Path
import gzip
from zipfile import ZipFile
path = Path('eas-failed-log.txt')
print('exists', path.exists())
print('size', path.stat().st_size if path.exists() else 'n/a')
raw = path.read_bytes()
print('head hex', raw[:16].hex())
print('startswith gzip', raw.startswith(b'\x1f\x8b'))
print('startswith zip', raw.startswith(b'PK\x03\x04'))
print('startswith utf8bom', raw.startswith(b'\xef\xbb\xbf'))
print('first 64 bytes', raw[:64])
try:
    text = raw.decode('utf-8')
    print('utf8 decode success, first 500 chars:')
    print(text[:500])
except Exception as e:
    print('utf8 decode fail', type(e).__name__, e)
try:
    with gzip.open(path, 'rt', encoding='utf-8', errors='replace') as f:
        print('gzip decode success, first 500 chars:')
        print(f.read(500))
except Exception as e:
    print('gzip decode fail', type(e).__name__, e)
try:
    with ZipFile(path, 'r') as z:
        print('zip file, contents', z.namelist())
except Exception as e:
    print('zip fail', type(e).__name__, e)
