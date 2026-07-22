# PERÓN 365 — módulo diario compartible

**Anexo para Claude Code**  
**Proyecto:** Peronismo Geselino  
**Ruta base:** `/peronismogeselino/peron365`  
**Principio de V1:** sin IA de consumo y sin diseño manual diario.

> **Corrección visual posterior:** PERÓN 365 debe tener una identidad claramente diferente del Peronómetro. Queda descartada la primera muestra oscura basada en collage. La nueva dirección utiliza fotografía humana y sonriente, fondos claros, papel, calendario y lenguaje editorial. No implementar una continuidad visual directa con el juego.

> **Dirección de integración V3:** aplicar una relación 70/30. El 70% corresponde al sistema visual de la aplicación —fondo azul tinta, navegación, botones, bordes, verde, celeste y naranja— y el 30% al almanaque —papel crema, fecha protagonista, fotografía humana y serif editorial para la cita—. El almanaque vive dentro de la app; no reemplaza su interfaz.

## 1. Concepto

PERÓN 365 es una microexperiencia editorial diaria: una frase documentada de Juan Domingo Perón aparece una vez por día y se transforma automáticamente en una placa lista para compartir.

**Claim:** `UNA IDEA POR DÍA`  
**Acción principal:** `COMPARTIR LA FRASE DE HOY`

El emergente no es el producto final; es el disparador. El producto es la pieza compartible con una URL permanente.

## 2. Experiencia pública

Al ingresar por primera vez en el día:

1. Cargar normalmente la portada.
2. Esperar entre 1,5 y 3 segundos o la primera interacción.
3. Mostrar un `dialog` accesible con la frase del día.
4. Permitir cerrar inmediatamente.
5. No volver a mostrarlo durante ese día en ese dispositivo.
6. Mantener una tarjeta pequeña `PERÓN 365` en la portada para reabrirlo.

El emergente contiene:

- fecha;
- frase;
- Juan Domingo Perón;
- fuente y fecha histórica;
- botones `COMPARTIR`, `GUARDAR` y `VER CONTEXTO`;
- para miembros, `CONVERSAR SOBRE ESTA FRASE`.

No bloquear navegación, no abrir nuevamente en cada cambio de página y respetar `prefers-reduced-motion`.

Para público anónimo, guardar el último día visto en `localStorage`. Para miembros, sincronizarlo opcionalmente con su perfil sin volverlo un dato obligatorio.

## 3. URL permanente

Cada publicación diaria debe tener permalink:

```text
/peronismogeselino/peron365/2026-07-22
```

Rutas mínimas:

```text
/peronismogeselino/peron365
/peronismogeselino/peron365/:date
/peronismogeselino/peron365/archivo
```

La URL `/peron365` muestra la frase vigente. La URL fechada nunca cambia, incluso después de medianoche.

## 4. Contenido y verificación

No publicar frases tomadas de memes, recopilaciones sin referencias o sitios de citas.

Cada registro debe incluir:

```text
text
short_text
author
source_title
source_type
source_date
source_url
source_page_or_timestamp
historical_context
topic
verification_status
verified_by
verified_at
```

Estados:

```text
draft -> in_review -> verified -> published
                         `------> rejected
```

Una frase sólo entra en el selector automático si está en estado `verified`.

Ejemplo utilizado en la primera placa:

```text
“Mejor que decir es hacer.”
Juan Domingo Perón
Discurso en la Confederación General del Trabajo
27 de diciembre de 1973
```

Fuente documental de referencia:  
https://cedinpe.unsam.edu.ar/content/per%C3%B3n-juan-d-per%C3%B3n-habla-los-trabajadores-diciembre-73

## 5. Selección diaria automática

Zona horaria canónica:

```text
America/Argentina/Buenos_Aires
```

Algoritmo:

1. Calcular `day_key` local en formato `YYYY-MM-DD`.
2. Buscar una asignación manual para esa fecha.
3. Si existe, usarla.
4. Si no existe, seleccionar desde el mazo anual de frases verificadas.
5. Persistir la asignación en `peron365_days`; nunca recalcular una fecha ya publicada.

Para evitar repeticiones:

- ordenar el mazo de forma determinística mediante una semilla anual;
- usar una frase una sola vez por ciclo mientras alcance el corpus;
- si hay menos de 365 frases, imponer una separación mínima configurable, inicialmente 120 días;
- permitir reservar frases para fechas especiales;
- mostrar en administración los próximos 30 días y alertar duplicados.

`365` significa presencia todos los días; no obliga a inventar 365 citas antes de lanzar. Es preferible comenzar con 100–200 citas documentadas y ampliar el corpus.

## 6. Sistema visual independiente

No producir 365 diseños manuales. Crear siete plantillas de fondo y componer texto dinámico encima.

PERÓN 365 no debe parecer otro juego. Debe sentirse como una pieza cotidiana coleccionable: cercana, optimista, histórica y compartible.

Evitar:

- fondos negros dominantes;
- collage pop similar al Peronómetro;
- verde o cian neón;
- retratos solemnes idénticos al héroe del juego;
- tipografía condensada gigante como recurso principal;
- etiquetas propias de ranking, preguntas o competencia.

Priorizar:

- fotografías espontáneas o sonrientes de Perón;
- fondos crema, celeste papel o blanco cálido;
- azul cobalto, rojo coral y amarillo mostaza;
- fecha protagonista;
- combinación de serif editorial para la cita y sans para datos;
- recursos de almanaque, postal, cuaderno o publicación impresa.

### 1. Almanaque

Papel crema, fecha grande desprendible, fotografía horizontal cálida, azul cobalto, coral y mostaza. Es la dirección principal propuesta.

### 2. Postal

Fondo celeste muy claro, fotografía vertical en marco de postal, líneas de correspondencia y composición asimétrica.

### 3. Cuaderno

Papel blanco cálido, líneas sutiles, anotaciones editoriales y fotografía pequeña tipo recorte documental.

### 4. Revista

Composición de tapa editorial: fotografía protagonista, titular serif y datos pequeños con gran aire.

### 5. Calendario tipográfico

Fecha y número de día del año como protagonistas; retrato secundario y frase con jerarquía limpia.

### 6. Sobremesa

Fotografías distendidas y humanas, paleta tostada, encuadres cercanos y sensación de conversación cotidiana.

### 7. Territorio

Mar, viento y líneas de Villa Gesell tratados como papel y gráfica editorial, sin collage de juego ni postal turística literal.

Asignación inicial: rotación por día de la semana. El panel puede cambiar la plantilla de una fecha particular.

Paleta compartida sugerida:

```text
cobalt     #234d82
ink        #22201d
cream      #f1e7d1
paper      #f9f3e7
light-blue #d9e7eb
coral      #df5537
mustard    #d2a52f
```

La tipografía, el logo, la fecha, la frase, la fuente y la URL deben ser capas dinámicas. No incorporarlos a los fondos JPG.

### Regla de integración 70/30

Mantener desde la aplicación:

- fondo general azul tinta;
- cabecera y navegación inferior;
- tarjetas redondeadas y ritmo de espaciado;
- botón principal verde;
- líneas celestes y acentos naranjas;
- tipografía sans para interfaz y metadatos.

Reservar para PERÓN 365:

- superficie crema dentro de la tarjeta;
- fotografía histórica cercana o sonriente;
- bloque de fecha inspirado en un almanaque;
- serif editorial solamente para la frase;
- fuente histórica claramente visible.

La placa exportada puede prescindir de la navegación, pero debe conservar el marco azul tinta, la paleta de la app, la superficie crema y la firma institucional.

## 7. Formatos compartibles

Generar como mínimo:

```text
1080 × 1350  feed y WhatsApp
1080 × 1920  historias
1200 × 630   Open Graph
```

Contenido de la placa:

- logotipo `PERÓN 365`;
- claim `UNA IDEA POR DÍA`;
- fecha;
- frase;
- autor;
- fuente histórica;
- firma `PERONISMO GESELINO`;
- URL de la aplicación.

No simular botones interactivos dentro de la imagen final.

## 8. Compartir desde el navegador

En móvil:

1. Renderizar la placa a tamaño real con Canvas o SVG.
2. Convertir a `Blob` PNG o JPG.
3. Construir un `File`.
4. Usar `navigator.canShare({ files })` y `navigator.share({ files, text, url })` cuando esté soportado.
5. Si no está soportado, ofrecer `DESCARGAR PLACA`, `COPIAR ENLACE` y un enlace de WhatsApp con texto preparado.

No compartir una captura de pantalla del modal. Generar siempre el archivo limpio.

Texto sugerido:

```text
La frase de hoy en Perón 365:
“{quote}”

{permalink}
```

## 9. Generador gráfico

Construir un único renderer reutilizable:

```ts
renderPeron365Card({
  format,
  theme,
  date,
  quote,
  author,
  source,
  sourceDate,
  permalink
})
```

Requisitos:

- precargar fuentes antes de dibujar;
- ajustar tamaño tipográfico según longitud;
- dividir líneas por palabras, nunca por caracteres;
- proteger el rostro y las zonas seguras de cada plantilla;
- soportar frases cortas, medias y largas;
- limitar la placa compartible a una longitud máxima editorial;
- usar `short_text` cuando el texto completo no entre;
- validar contraste WCAG en la interfaz;
- generar siempre la misma placa para la misma fecha y versión.

Para la V1, el render en el navegador evita contratar otro servicio. Más adelante puede generarse la imagen del día en servidor y cachearse en R2 para Open Graph.

## 10. Modelo de datos sugerido

```sql
CREATE TABLE peron365_quotes (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  short_text TEXT,
  author TEXT NOT NULL DEFAULT 'Juan Domingo Perón',
  source_title TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_date TEXT,
  source_url TEXT NOT NULL,
  source_locator TEXT,
  historical_context TEXT,
  topic TEXT,
  verification_status TEXT NOT NULL DEFAULT 'draft',
  verified_by TEXT,
  verified_at TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE peron365_days (
  day_key TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL,
  theme TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  published_at TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (quote_id) REFERENCES peron365_quotes(id)
);

CREATE TABLE peron365_saves (
  user_id TEXT NOT NULL,
  day_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, day_key)
);
```

Los datos de interacción agregados no deben guardar información personal innecesaria.

## 11. API

```text
GET  /api/v1/peron365/today
GET  /api/v1/peron365/days/:date
GET  /api/v1/peron365/archive
POST /api/v1/peron365/days/:date/save
POST /api/v1/peron365/days/:date/share-event

GET    /api/v1/admin/peron365/quotes
POST   /api/v1/admin/peron365/quotes
PATCH  /api/v1/admin/peron365/quotes/:id
POST   /api/v1/admin/peron365/quotes/:id/verify
GET    /api/v1/admin/peron365/calendar
PUT    /api/v1/admin/peron365/calendar/:date
```

La respuesta pública puede cachearse hasta la medianoche argentina. Las rutas administrativas requieren rol y auditoría.

## 12. Panel de control

Agregar una sección `PERÓN 365` con:

- biblioteca de frases;
- filtros por tema, estado y fuente;
- formulario de alta y edición;
- enlace directo a la fuente;
- flujo de verificación;
- calendario mensual;
- vista de los próximos 30 días;
- selección de tema visual;
- vista previa 4:5 y 9:16;
- reemplazo de emergencia de la frase del día;
- activación o desactivación del emergente;
- estadísticas básicas de apertura, guardado y compartir.

## 13. Integración con comunidad

Para usuarios autenticados, permitir `CONVERSAR SOBRE ESTA FRASE`.

Crear como máximo un tema de foro por fecha. Si ya existe, abrirlo; si no existe, crearlo con:

```text
Título: Perón 365 — {date}
Pregunta: ¿Qué significa esta idea hoy en Villa Gesell?
```

La interpretación actual debe estar claramente separada de la cita histórica y nunca presentarse como palabras de Perón.

## 14. Costos

La V1 no utiliza IA, WhatsApp API ni generación externa de imágenes.

- selección diaria: D1 + Worker existente;
- fondos: R2 o assets estáticos;
- render de placa: navegador del usuario;
- compartir: Web Share API;
- modal y archivo: aplicación existente.

Costo adicional esperado en la escala inicial: aproximadamente USD 0 dentro de la arquitectura ya presupuestada.

## 15. Activos de referencia

La primera placa oscura `sample-peron365-2026-07-22.jpg` queda **deprecada visualmente** y no debe implementarse.

Nuevas pruebas de dirección:

```text
peron365-v2/peron365-almanaque.jpg
peron365-v2/peron365-postal.jpg
```

Ambas miden 1080 × 1350 y tienen SVG editable. La dirección definitiva debe elegirse entre estas pruebas antes de producir las siete variantes.

La compatibilidad con el portal se conserva mediante calidad, jerarquía y firma institucional; no mediante la estética del Peronómetro.

Propuesta integrada posterior:

```text
peron365-v3/peron365-pantalla-app.jpg      1080 × 1920
peron365-v3/peron365-card-integrada.jpg    1080 × 1350
```

Esta V3 reemplaza como referencia de implementación a las pruebas V1 y V2. Sus archivos SVG demuestran la separación entre fotografía, fecha, cita, fuente, interfaz y acciones.

## 16. Criterios de aceptación

- cambia automáticamente a medianoche de Buenos Aires;
- una fecha publicada no cambia al recalcular;
- no repite frases antes del intervalo definido;
- ninguna frase no verificada se publica;
- el emergente aparece como máximo una vez por día;
- la pieza puede compartirse como archivo desde Android;
- existen alternativas si Web Share no está disponible;
- la imagen exportada mide exactamente 1080×1350 o 1080×1920;
- la fuente histórica es legible;
- el permalink mantiene la frase correcta;
- el administrador puede reemplazar y programar contenido;
- el módulo no consume IA ni servicios pagos opcionales.

## 17. Instrucción directa para Claude Code

> Lee `HANDOFF_CLAUDE.md`, `CLOUDFLARE_ARQUITECTURA_COSTOS_CLAUDE.md` y este archivo. Integra PERÓN 365 como módulo aislado dentro de `/peronismogeselino`, sin alterar el resto de la web. Antes de implementar, inspecciona el stack real y presenta archivos a modificar, migraciones, librerías, riesgos y plan de pruebas. Usa D1 para frases y calendario; renderer dinámico Canvas/SVG para placas; Web Share API con fallback; almacenamiento local para controlar el modal público; roles y auditoría en administración. No agregues IA, WhatsApp API, correo automático ni servicios pagos. No publiques producción sin aprobación.
