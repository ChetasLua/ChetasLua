"""Bundle the playable Overview into one HTML file. No external dependencies."""
from pathlib import Path
import base64
import re
from urllib.parse import quote

root = Path(__file__).resolve().parents[1]
html = (root / 'index.html').read_text()
parts = []
for name in ('engine', 'renderer', 'audio', 'main'):
    code = (root / 'game' / f'{name}.mjs').read_text()
    code = re.sub(r'^import .*?;\n', '', code, flags=re.M)
    code = re.sub(r'^export ', '', code, flags=re.M)
    parts.append(code)
script = '\n'.join(parts)
def embedded(path):
    return 'data:image/png;base64,' + base64.b64encode((root / path).read_bytes()).decode()
script = re.sub(r"new URL\('\.\./(assets/[^']+)', import\.meta\.url\)\.href", lambda m: repr(embedded(m[1])), script)
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + (root / 'style.css').read_text() + '\n</style>')
html = html.replace('src="assets/avatar.png"', 'src="' + embedded('assets/avatar.png') + '"')
html = html.replace('href="assets/favicon.svg"', 'href="data:image/svg+xml,' + quote((root / 'assets/favicon.svg').read_text()) + '"')
html = html.replace('href="GAME.md"', 'href="https://github.com/ChetasLua/ChetasLua/blob/main/GAME.md"')
html = html.replace('<script type="module" src="game/main.mjs"></script>', '<script>\n\'use strict\';\n' + script + '\n</script>')
assert 'import.meta' not in html and 'type="module"' not in html
assert html.count('data:image/png;base64,') == 5
output = root / 'claude-vs-codex.html'
output.write_text(html)
print(f'Built {output.name}: {output.stat().st_size:,} bytes')
