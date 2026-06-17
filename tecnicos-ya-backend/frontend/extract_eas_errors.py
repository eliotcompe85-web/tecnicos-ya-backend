from pathlib import Path
import brotli
path = Path('eas-failed-log.txt')
raw = path.read_bytes()
text = brotli.decompress(raw).decode('utf-8', errors='replace')
lines = text.splitlines()
for i, line in enumerate(lines):
    if any(k in line for k in ['ERROR', 'Exception', 'FAILURE', 'failed', 'FAIL']):
        print(i + 1, line)
print('--- tail ---')
for line in lines[-80:]:
    print(line)
