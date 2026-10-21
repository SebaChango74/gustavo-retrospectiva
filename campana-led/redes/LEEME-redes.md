# Campaña LED en Instagram y Facebook

Las redes no permiten "encender la luz" con un clic, así que la interacción se
traslada a lo que sí hacen las personas ahí: **deslizar** (carrusel),
**tocar para pasar** (historias) y **votar** (sticker de encuesta). Los textos
y las escenas son los aprobados; no hay cantidades, barrios ni fechas.

## 1. Carrusel para el feed (Instagram y Facebook) — 1080×1350

Subir las tres placas en este orden, como una sola publicación:

1. `carrusel-1-que-ves.jpg` — escena oscura, "¿QUÉ VES EN ESTA IMAGEN?" y la
   indicación "DESLIZÁ PARA ENCENDER LA LUZ →".
2. `carrusel-2-faltaba-luz.jpg` — escena iluminada, "NO ERA LO QUE PARECÍA.
   FALTABA LUZ." y "La Municipalidad de Villa Gesell compró nuevas luminarias LED."
3. `carrusel-3-una-gestion-que-se-ve.jpg` — "PARA QUE VEAS MEJOR. UNA GESTIÓN
   QUE SE VE." con los tres beneficios.

**Texto sugerido para la publicación:**

> ¿Qué ves en esta imagen? 👀
> Deslizá para encender la luz.
>
> Cuando la luz no alcanza, las cosas no siempre son lo que parecen.
> La Municipalidad de Villa Gesell compró nuevas luminarias LED.
> Más potencia. Más visibilidad. Más seguridad.
>
> Para que veas mejor. Una gestión que se ve.

Para sumar participación, cerrar con una pregunta en el texto:
"Contanos en los comentarios: ¿qué viste primero?"

## 2. Historias (Instagram y Facebook) — 1080×1920

Son los cuatro cuadros del reel, que ya tienen el formato exacto. Subirlos
seguidos, en orden; al tocar para pasar de la 1 a la 2 la luz "se enciende":

1. `historia-1-que-ves.jpg` — oscura, "TOCÁ PARA ENCENDER LA LUZ".
   **Acá va el sticker de encuesta** (ver `GUIA-encuesta-historia-1.jpg`,
   que es solo una guía, no se publica). Pregunta: *¿Qué ves en esta imagen?*
   Opciones: *Alguien sospechoso* / *No se ve bien*.
2. `historia-2-faltaba-luz.jpg` — iluminada, "NO ERA LO QUE PARECÍA. FALTABA LUZ."
3. `historia-3-mas-luz.jpg` — "MÁS LUZ. MEJOR VISIBILIDAD." y la compra de luminarias.
4. `historia-4-una-gestion-que-se-ve.jpg` — "PARA QUE VEAS MEJOR. UNA GESTIÓN QUE SE VE."

Opcional en la historia 4: sticker de enlace a la página donde está el
emergente (por ejemplo `gustavobarrera.com`) con el texto "Encendé la luz".

## 3. Reel

`REEL-9x16.mp4` (11 segundos, ya aprobado) va como Reel en Instagram y como
video en Facebook. Mismo texto de publicación que el carrusel.

## Orden de publicación sugerido

Día 1: historias 1–4 con la encuesta (la gente vota a ciegas).
Día 2: carrusel en el feed (la respuesta queda fija en el perfil).
Día 3: reel.

## Fuentes

Las placas del carrusel y la guía se generan con `fuente/placa.html` y
`fuente/render.mjs` a partir de las escenas aprobadas, ampliadas a 1080 px.
Si en algún momento aparecen las ilustraciones originales en mayor
resolución, basta reemplazar `fuente/src/*.png` y volver a renderizar.
