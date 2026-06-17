from pathlib import Path
p = Path('app/technician/membership.tsx')
text = p.read_text(encoding='utf-8')
lines = text.splitlines()
if len(lines) < 220:
    raise SystemExit('file too short')
# remove duplicate block from lines 176..209 inclusive (1-indexed)
new_lines = lines[:175] + lines[209:]
p.write_text('\n'.join(new_lines) + '\n', encoding='utf-8')
print('removed duplicate block, new length', len(new_lines))
