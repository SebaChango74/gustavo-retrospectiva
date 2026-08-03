#!/usr/bin/env python3
"""
Cosechador de actos de gobierno de gesell.gob.ar para la línea de tiempo.

Uso:
    python3 harvest.py 2018                 # rango de páginas automático (amplio)
    python3 harvest.py 2018 1600 1900       # rango de páginas explícito

Qué hace:
    Recorre el listado paginado de novedades (más nuevas primero) y junta cada
    nota del AÑO pedido: fecha, id real y título real. Escribe un TSV en
    ./actos_<AÑO>.tsv (columnas: año, fecha, id, titulo, url).

BUG CLAVE (y por eso este script itera sobre LINKS, no sobre <h2>):
    En el listado, el <h2> de una tarjeta queda pegado al <a href="/novedad/..">
    de la tarjeta vecina. Si emparejás por cercanía, el id termina apuntando a
    OTRA nota (ej.: pedir "cloacas" te devolvía una maratón). La fuente de verdad
    es el SLUG de la URL: /novedad/{id}/{slug}.html — el slug ES el título real de
    esa nota. Por eso acá tomamos id + slug directo del link, y la fecha de la
    ventana de texto que rodea al link.

Cómo encontrar el rango de páginas de un año (si no lo pasás):
    El listado es "más nuevas primero". Probá una página suelta y mirá las fechas:
        curl -s "https://www.gesell.gob.ar/index.php?dkp_novedades=1700&dkp_ogs_secciones=1&dkp_bloque_destacado=1" | grep -oE "[0-3][0-9]-[01][0-9]-20[12][0-9]" | head
    Ajustá hasta ubicar el año. Referencia histórica: 2016-2017 vivían por las
    páginas 1840-2160 (a mediados de 2026). Para 2018 probá más abajo (~1550-1850).
"""
import re, sys, subprocess, time, os

BASE = "https://www.gesell.gob.ar/index.php?dkp_novedades={}&dkp_ogs_secciones=1&dkp_bloque_destacado=1"
D = os.path.dirname(os.path.abspath(__file__))

def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    year = sys.argv[1]
    ini = int(sys.argv[2]) if len(sys.argv) > 2 else 1400
    fin = int(sys.argv[3]) if len(sys.argv) > 3 else 2100
    out_path = os.path.join(D, f"actos_{year}.tsv")

    vistos = set()
    total = 0
    with open(out_path, "w", encoding="utf-8") as out:
        for pag in range(ini, fin + 1):
            try:
                html = subprocess.run(
                    ["curl", "-sS", "--max-time", "20", BASE.format(pag)],
                    capture_output=True, timeout=30,
                ).stdout.decode("latin-1", "replace")
            except Exception:
                continue
            for m in re.finditer(r'/novedad/(\d+)/([^"\']+?)\.html', html):
                idn, slug = m.group(1), m.group(2)
                if idn in vistos:
                    continue
                ventana = html[max(0, m.start() - 900): m.end() + 300]
                fecha = re.search(r"([0-3][0-9])-([01][0-9])-(20[12][0-9])", ventana)
                if not fecha or fecha.group(3) != year:
                    continue
                vistos.add(idn)
                # el slug es el título real; se limpia para lectura
                titulo = re.sub(r"[-]+", " ", slug).strip()
                url = f"https://www.gesell.gob.ar/novedad/{idn}/{slug}.html"
                out.write("\t".join([year, fecha.group(0), idn, titulo, url]) + "\n")
                out.flush()
                total += 1
            if pag % 20 == 0:
                print(f"…página {pag} · {total} actos de {year}", flush=True)
            time.sleep(0.15)
    print(f"LISTO · {total} actos de {year} → {out_path}", flush=True)

if __name__ == "__main__":
    main()
