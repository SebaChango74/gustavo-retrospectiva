#!/usr/bin/env python3
"""Arma campana-led/emergente-gesell.js a partir de las fuentes.

Mete adentro del JS las dos escenas (base64) y la hoja de estilos, así el
archivo final es uno solo y se instala pegando una línea. Uso:

    python3 -I campana-led/fuente/build.py
"""
import base64
import json
from pathlib import Path

AQUI = Path(__file__).resolve().parent
SALIDA = AQUI.parent / "emergente-gesell.js"


def data_uri(ruta: Path) -> str:
    return "data:image/webp;base64," + base64.b64encode(ruta.read_bytes()).decode("ascii")


def main() -> None:
    plantilla = (AQUI / "emergente.template.js").read_text(encoding="utf-8")
    css = (AQUI / "emergente.css").read_text(encoding="utf-8")
    # El CSS se minimiza apenas: sin saltos de línea sobrantes.
    css = " ".join(linea.strip() for linea in css.splitlines() if linea.strip())

    reemplazos = {
        '"__OSCURA__"': json.dumps(data_uri(AQUI / "escena-oscura.webp")),
        '"__LED__"': json.dumps(data_uri(AQUI / "escena-led.webp")),
        '"__CSS__"': json.dumps(css, ensure_ascii=False),
    }
    salida = plantilla
    for marca, valor in reemplazos.items():
        if marca not in salida:
            raise SystemExit(f"Falta el marcador {marca} en la plantilla")
        salida = salida.replace(marca, valor, 1)

    SALIDA.write_text(salida, encoding="utf-8")
    print(f"{SALIDA.relative_to(AQUI.parent.parent)}: {SALIDA.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
