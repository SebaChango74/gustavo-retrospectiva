# Emergente «UNA GESTIÓN QUE SE VE» — alumbrado LED

Pieza interactiva de la Municipalidad de Villa Gesell, empaquetada como un
**emergente (pop-up) de un solo archivo** para instalar en cualquier sitio web.

## Instalación (una línea)

Copiar `emergente-gesell.js` al servidor del sitio y pegar esto antes de
`</body>` en la plantilla de la portada (o de todas las páginas, según se
prefiera):

```html
<script src="/emergente-gesell.js" data-hasta="2026-11-30"></script>
```

Listo. No hace falta nada más: las imágenes y los estilos van adentro del
archivo (252 KB) y no interfiere con el diseño del sitio anfitrión.

## Opciones

Se pasan como atributos `data-` en la misma etiqueta `<script>`. Todas son
opcionales.

| Atributo | Qué hace | Por defecto |
|---|---|---|
| `data-hasta="AAAA-MM-DD"` | Último día en que se muestra. Pasada esa fecha deja de aparecer solo; no hay que acordarse de sacarlo. | sin límite |
| `data-cada="7"` | Días entre una aparición y la siguiente para la misma persona. `0` = en cada visita. | `7` |
| `data-demora="1200"` | Milisegundos que espera después de cargar la página antes de abrirse. | `1200` |
| `data-siempre="1"` | Lo muestra siempre, ignorando fecha y frecuencia. **Solo para probar.** | apagado |
| `data-audio-suspenso="…"` | URL de una pista de audio para el estado oscuro. | sintetizado |
| `data-audio-abierto="…"` | URL de una pista para el estado encendido. | sintetizado |

También se puede abrir y cerrar a mano desde cualquier botón del sitio:

```html
<button onclick="EmergenteGesell.abrir()">Ver la campaña</button>
```

## Comportamiento

- Se abre solo tras la demora, la primera vez que la persona entra, y vuelve a
  aparecer recién pasados los días de `data-cada` (se recuerda en el
  navegador de cada persona, sin cookies ni servidor).
- Se cierra con la cruz, con la tecla **Escape** o tocando fuera del cuadro
  (en escritorio).
- Es un diálogo accesible: `role="dialog"`, atrapa el foco mientras está
  abierto, lo devuelve al cerrarse, respeta la preferencia de «menos
  animación» del sistema y todas las imágenes tienen texto alternativo.
- En teléfonos ocupa la pantalla completa y, al encender la luz, el texto
  queda **arriba** y la escena abajo: no tapa a la mujer ni al perro.

## Sonido

Nada suena solo: los navegadores no lo permiten y además sería molesto. El
parlante 🔊 (arriba a la derecha) activa el sonido a pedido. Mientras la
escena está oscura suena un clima de suspenso; al encender la luz hace un
fundido de 1,3 s hacia una música más abierta y luminosa, acompañando la
transición. «Volver a empezar» vuelve al suspenso.

Las dos músicas que vienen adentro **se generan en el navegador** (son
genéricas, para probar la idea). Para usar pistas reales, basta subir dos
archivos MP3/OGG y apuntarlos con `data-audio-suspenso` y
`data-audio-abierto`; el fundido cruzado funciona igual.

## Probar sin instalar

Abrir `demo.html` en un navegador: es una página anfitriona de mentira que
carga el emergente con `data-siempre="1"`.

## Fuentes

En `fuente/` están la plantilla del JS, la hoja de estilos y las dos
escenas. Si se cambia algo ahí, se vuelve a armar el archivo final con:

```
python3 -I campana-led/fuente/build.py
```

Las escenas, los textos y la acción (encender la luz) son los aprobados en
la pieza original; este empaquetado solo agrega cierre, frecuencia,
accesibilidad y sonido.
