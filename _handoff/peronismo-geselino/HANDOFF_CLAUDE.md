# Peronismo Geselino — brief de implementación

## Alcance de la primera versión

- Portal público de noticias, causas vivas, agenda y juegos.
- Comunidad privada por invitación, con Google Sign-In y lista de correos autorizados.
- Aplicación aislada de la web principal, preparada para publicarse bajo `/peronismogeselino`.
- Sin inteligencia artificial durante el uso. Todo el contenido se administra desde un panel.

## Agenda y Google Maps

Cada actividad debe guardar:

```ts
type Event = {
  id: string;
  title: string;
  summary: string;
  startsAt: string;
  endsAt?: string;
  placeName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  visibility: "public" | "members";
  status: "draft" | "published" | "cancelled";
};
```

- El mapa del prototipo usa un `iframe` de Google Maps sin clave ni costo.
- En producción, el panel debe generar la URL a partir de dirección o coordenadas.
- Una actividad `members` no debe enviar dirección ni coordenadas al cliente público.
- Acciones: agregar a calendario, abrir en Maps, confirmar asistencia y compartir.

## Juego: Peronómetro

### Promesa

50 preguntas sobre Juan Domingo Perón. Hay 10 segundos para contestar cada una. Al terminar se calcula el porcentaje de respuestas correctas y se genera una placa vertical para compartir por WhatsApp o Instagram.

### Categorías sugeridas

| Categoría | Cantidad |
|---|---:|
| Biografía | 10 |
| Gobiernos y políticas públicas | 10 |
| Derechos sociales y laborales | 10 |
| Fechas y acontecimientos | 10 |
| Cultura, símbolos y legado | 10 |

### Modelo de pregunta

```ts
type Question = {
  id: string;
  category: "biography" | "governments" | "rights" | "history" | "culture";
  prompt: string;
  options: [string, string, string, string];
  correctOption: 0 | 1 | 2 | 3;
  explanation: string;
  sourceTitle: string;
  sourceUrl: string;
  difficulty: 1 | 2 | 3;
  enabled: boolean;
};
```

### Reglas

1. Barajar preguntas y respuestas al comenzar.
2. Mostrar una pregunta por vez y un contador visible de 10 segundos.
3. Respuesta correcta: 1 punto. Incorrecta o sin responder: 0 puntos.
4. No permitir volver atrás ni cambiar una respuesta confirmada.
5. Porcentaje final: `Math.round((correctas / 50) * 100)`.
6. Guardar únicamente métricas anónimas salvo que el usuario elija iniciar sesión.
7. El banco de 50 preguntas debe pasar revisión histórica y editorial antes de publicarse.

### Resultado

Rangos de texto sugeridos, siempre acompañados por el porcentaje exacto:

- 0–20: `Una vuelta por la historia`
- 21–40: `Memoria en construcción`
- 41–60: `Militancia curiosa`
- 61–80: `Corazón justicialista`
- 81–100: `Memoria peronista`

La placa compartible debe ser de 1080 × 1350 px e incluir logotipo de Peronómetro, porcentaje, rango, llamada a desafiar a otra persona y URL del portal. El nombre o alias es opcional. No incluir correo, barrio ni ningún dato privado.

### Implementación recomendada

- Banco de preguntas inicial en JSON o base de datos; editable desde el panel.
- Máquina de estados: `intro → question → feedback → result`.
- Timer con una fuente de tiempo monotónica; limpiar intervalos al cambiar de pregunta.
- Generar la placa en el navegador mediante Canvas o `html-to-image`; no requiere IA ni costo por partida.
- Web Share API con descarga PNG como alternativa.
- Precargar la imagen de Perón y las fuentes antes de comenzar.
- Accesibilidad: navegación por teclado, foco visible, contraste AA, opción de reducir animaciones y anuncio accesible del tiempo restante.
- Pruebas mínimas: temporizador, cálculo, reanudación segura, preguntas duplicadas, compartir/descargar y viewport móvil.

## Panel de control

Módulos: noticias, causas, agenda, preguntas, resultados agregados, miembros, invitaciones, territorios, moderación y materiales. Roles sugeridos: administrador, editor, moderador y referente territorial.

## Nota sobre este prototipo

El ingreso con Google, el foro, la confirmación de asistencia, la pregunta y la placa de Peronómetro son demostraciones visuales. No deben considerarse autenticación, datos ni lógica de producción.
