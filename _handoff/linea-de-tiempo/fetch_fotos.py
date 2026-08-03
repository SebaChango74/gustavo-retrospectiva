#!/usr/bin/env python3
"""
Bajador de fotos originales para los hitos de la línea de tiempo.

Uso:
    python3 fetch_fotos.py 2018 18079 28549 28190 ...   # AÑO seguido de los IDs
    python3 fetch_fotos.py 2018 --from ids_2018.txt      # un id por línea

Qué hace:
    Para cada id de nota (gesell.gob.ar) baja la foto principal del artículo a
    ./fotos_<AÑO>/<AÑO>-NN.jpg (NN = 01, 02, ... en el orden que le pases).
    Después revisás y las copiás a la carpeta pública fotos/timeline/.

Notas de la fuente (gesell.gob.ar):
    - La nota se sirve por ID, ignora el slug:  /novedad/{ID}/x.html
    - Las fotos del artículo están en:  thumb/{pid}-c/340-280-92/{archivo}
      (hay que filtrar banners de la barra lateral: boton|banner|wifi|logo|...)
    - Para bajarlas grandes: thumb/{pid}-c/1200-null-92/{archivo}
      * Encodear espacios del nombre (%20).
      * Si el archivo original es PNG, 1200-null puede dar dimensiones locas;
        usá un recorte acotado como 1000-700 y/o transcodificá a JPG luego.
    - Verificá que el título de la nota (curl .../novedad/{ID}/x.html | grep title)
      sea el que esperabas: el ID correcto sale del SLUG de la URL en el TSV,
      no de la columna "titulo" del listado (ver harvest.py).
"""
import re, sys, subprocess, os, urllib.parse

D = os.path.dirname(os.path.abspath(__file__))
BAN = re.compile(r"boton|banner|wifi|logo|separador|flecha|publicid|icon", re.I)

def fetch(url, mt=30):
    return subprocess.run(["curl", "-sS", "--max-time", str(mt), url],
                          capture_output=True, timeout=mt + 5).stdout

def foto_de(idn):
    html = fetch(f"https://www.gesell.gob.ar/novedad/{idn}/x.html").decode("latin-1", "replace")
    titulo = re.search(r"<title>([^<]+)", html)
    cands = re.findall(r'thumb/(\d+)-c/\d+-\d+-\d+/([^"\']+)', html)
    good, seen = [], set()
    for pid, fn in cands:
        if BAN.search(fn) or pid in seen:
            continue
        seen.add(pid); good.append((pid, fn))
    return (titulo.group(1).strip() if titulo else "?"), good

def main():
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(1)
    year = sys.argv[1]
    if sys.argv[2] == "--from":
        ids = [l.strip() for l in open(sys.argv[3]) if l.strip()]
    else:
        ids = sys.argv[2:]
    outdir = os.path.join(D, f"fotos_{year}")
    os.makedirs(outdir, exist_ok=True)
    for i, idn in enumerate(ids, 1):
        titulo, good = foto_de(idn)
        if not good:
            print(f"{year}-{i:02d}  id={idn}  ⚠ SIN FOTO  ({titulo})"); continue
        pid, fn = good[0]
        es_png = fn.lower().endswith(".png")
        size = "1000-700" if es_png else "1200-null"
        url = f"https://www.gesell.gob.ar/thumb/{pid}-c/{size}-92/{urllib.parse.quote(fn)}"
        data = fetch(url)
        if len(data) < 6000:  # respaldo: versión chica
            url = f"https://www.gesell.gob.ar/thumb/{pid}-c/340-280-92/{urllib.parse.quote(fn)}"
            data = fetch(url)
        dest = os.path.join(outdir, f"{year}-{i:02d}.jpg")
        open(dest, "wb").write(data)
        magic = "PNG(convertir a jpg)" if data[:2] == b"\x89P" else "jpg"
        print(f"{year}-{i:02d}  id={idn}  {len(data)//1024}KB  {magic}  [{fn}]  «{titulo[:50]}»")
    print(f"\nListo → {outdir}/  (revisá y copiá a fotos/timeline/)")

if __name__ == "__main__":
    main()
