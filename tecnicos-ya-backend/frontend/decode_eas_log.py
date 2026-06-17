from pathlib import Path
import gzip
import zlib
import lzma
import brotli
from zipfile import ZipFile

path = Path('eas-failed-log.txt')
assert path.exists(), 'log file missing'
raw = path.read_bytes()
print('size', len(raw))
print('head', raw[:16])
print('head hex', raw[:16].hex())
print('gzip', raw.startswith(b'\x1f\x8b'))
print('zip', raw.startswith(b'PK\x03\x04'))
print('utf8bom', raw.startswith(b'\xef\xbb\xbf'))
print('brotli', raw.startswith(b'\x8b\x00') or raw.startswith(b'\xce\xb2\xcf\x81'))

# try plain text
try:
    print('utf8 decode:', raw.decode('utf-8')[:500])
except Exception as e:
    print('utf8 error', e)

# zlib modes
for wbits in [15, 31, -15, -31, 0]:
    try:
        text = zlib.decompress(raw, wbits=wbits).decode('utf-8', errors='replace')
        print('zlib wbits', wbits, 'success text len', len(text))
        print(text[:1000])
        break
    except Exception as e:
        print('zlib wbits', wbits, 'fail', type(e).__name__, e)

# lzma
for fmt in [lzma.FORMAT_XZ, lzma.FORMAT_ALONE, lzma.FORMAT_RAW]:
    try:
        if fmt == lzma.FORMAT_RAW:
            text = lzma.decompress(raw, format=fmt, filters=[{'id': lzma.FILTER_LZMA1, 'preset': 9}]).decode('utf-8', errors='replace')
        else:
            text = lzma.decompress(raw, format=fmt).decode('utf-8', errors='replace')
        print('lzma', fmt, 'success len', len(text))
        print(text[:1000])
        break
    except Exception as e:
        print('lzma', fmt, 'fail', type(e).__name__, e)

# brotli
try:
    text = brotli.decompress(raw).decode('utf-8', errors='replace')
    print('brotli success len', len(text))
    print(text[:1000])
except Exception as e:
    print('brotli fail', type(e).__name__, e)

# zip check
try:
    with ZipFile(path, 'r') as z:
        print('zip contents', z.namelist())
except Exception as e:
    print('zip fail', type(e).__name__, e)
