"""Bundle one fast browser script and a self-contained HTML copy. No JS build tools."""
from pathlib import Path
import base64
import re
from urllib.parse import quote

root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
parts=[]
for name in ('people','projects','atlas','portraits','engine','project-art','renderer','audio','main'):
    code=(root/'game'/f'{name}.mjs').read_text()
    code=re.sub(r'^import .*?;\n','',code,flags=re.M)
    code=re.sub(r'^export ','',code,flags=re.M)
    parts.append(code)
script='\n'.join(parts)
script=script.replace("new URL('../assets/chetas-atlas.webp',import.meta.url).href", "new URL('assets/chetas-atlas.webp',document.baseURI).href")
script="(() => {\n'use strict';\n"+script+'\n})();\n'
assert 'import.meta' not in script and not re.search(r'^import ',script,re.M)
(root/'game/app.js').write_text(script)

def embedded(path,mime):
    return f'data:{mime};base64,'+base64.b64encode((root/path).read_bytes()).decode()

standalone=script.replace("new URL('assets/chetas-atlas.webp',document.baseURI).href",repr(embedded('assets/chetas-atlas.webp','image/webp')))
html=re.sub(r'  <link rel="preload"[^>]+>\n','',html)
html=html.replace('<link rel="stylesheet" href="style.css?v=4">','<style>\n'+(root/'style.css').read_text()+'\n</style>')
html=html.replace('src="assets/avatar.png"','src="'+embedded('assets/avatar.png','image/png')+'"')
html=html.replace('href="assets/favicon.svg"','href="data:image/svg+xml,'+quote((root/'assets/favicon.svg').read_text())+'"')
html=html.replace('<script defer src="game/app.js?v=4"></script>','<script>\n'+standalone+'\n</script>')
assert 'game/app.js' not in html and 'import.meta' not in html
assert html.count('data:image/webp;base64,')==1 and html.count('data:image/png;base64,')==1
output=root/'claude-vs-codex.html';output.write_text(html)
print(f'Browser bundle: {(root/"game/app.js").stat().st_size:,} bytes')
print(f'Standalone: {output.stat().st_size:,} bytes')
