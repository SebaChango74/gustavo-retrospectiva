# Claude: empezar acá

Este paquete contiene el prototipo visual aprobado de **Peronismo Geselino**. No es un boceto: debe usarse como base de implementación y preservarse su dirección visual.

## Cómo verlo

Requisitos: Node.js `>=22.13.0`.

```bash
npm ci
npm run dev
```

Abrí la dirección local que informa Vite (normalmente `http://localhost:5173`). Usá un navegador o Playwright para recorrerlo y capturar desktop y móvil.

## Recorrido visual

El prototipo funciona como una aplicación de una sola página. Las pantallas se abren mediante los botones visibles:

1. `Ahora`: portada pública, noticias, causa, agenda, Peronómetro y comunidad.
2. `Causas vivas`: ficha con resumen, datos, estado y línea de tiempo.
3. `Agenda`: actividad Pensar 2027 con Google Maps y evento de Telefe.
4. `Juegos` / `Peronómetro`: portada moderna, mecánica, pregunta de muestra y placa de resultado.
5. `La Comunidad`: ingreso simulado con Google; luego foro, anuncios, territorio, mapa y agenda interna.

Para entrar al tablero comunitario en el prototipo, pulsá `Continuar con Google`. No es autenticación real.

## Dirección visual aprobada

- Personalidad: **cálida, tecnológica, enérgica y popular**.
- Base: crema, azul marino y cobalto.
- Acentos: celeste, rojo y dorado.
- Peronómetro suma verde eléctrico, naranja y negro.
- Tipografías: `Barlow Condensed` para impacto y `Manrope` para lectura.
- Fotografía real, cercana y territorial. Evitar estética institucional genérica.
- El sello del PJ Bonaerense es secundario; la marca principal es Peronismo Geselino.

## Decisiones que no deben perderse

- La portada usa `public/images/hero-gustavo-v2.png`, aprobada por el usuario.
- El logotipo y los títulos están en HTML/CSS, no incrustados en la foto, para responder correctamente en móvil.
- Peronómetro se inspira en el collage cultural argentino contemporáneo, sin copiar una pieza existente.
- El retrato del juego está en `public/images/peronometro-peron.png`.
- La ubicación actual del mapa es una muestra genérica de Villa Gesell. Reemplazarla cuando se reciba la dirección real.
- El juego todavía es una cáscara visual. Su especificación funcional está en `HANDOFF_CLAUDE.md`.

## Archivos principales

- `app/page.tsx`: pantallas, contenido e interacciones del prototipo.
- `app/globals.css`: sistema visual y responsive.
- `app/layout.tsx`: metadatos.
- `public/images/`: fotografías y marcas.
- `HANDOFF_CLAUDE.md`: arquitectura funcional, panel, agenda y reglas de Peronómetro.

## Próximo trabajo esperado

1. Convertir las vistas simuladas en rutas reales.
2. Implementar panel de administración.
3. Agregar autenticación Google y lista de invitaciones.
4. Construir foro, moderación, territorios y agenda privada.
5. Construir Peronómetro con 50 preguntas validadas, temporizador, puntaje y placa compartible.
6. Mantener el portal sin consumo de IA en producción.

Antes de sustituir fotografías, colores, tipografías o jerarquías, mostrar una comparación y pedir aprobación.
