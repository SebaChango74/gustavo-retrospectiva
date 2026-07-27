# Peronismo Geselino — Manual de uso

> Guía profunda de cada área de la plataforma: qué es, **por qué existe** y
> cómo se usa en pleno. No es una presentación; es el manual de referencia
> para quien administra y para quien conduce el proyecto.

---

## Índice

1. [Cómo está pensada la plataforma](#1-cómo-está-pensada-la-plataforma)
2. [El portal público](#2-el-portal-público)
   - 2.1 Portada
   - 2.2 Noticias y archivo
   - 2.3 Causas vivas
   - 2.4 Agenda + Google Maps
   - 2.5 Peronómetro
   - 2.6 Perón 365
3. [La Comunidad (espacio privado)](#3-la-comunidad-espacio-privado)
4. [El panel de control](#4-el-panel-de-control)
5. [Roles y permisos](#5-roles-y-permisos)
6. [Seguridad y privacidad](#6-seguridad-y-privacidad)
7. [PWA: la app en el teléfono](#7-pwa-la-app-en-el-teléfono)
8. [Preguntas frecuentes](#8-preguntas-frecuentes)

---

## 1. Cómo está pensada la plataforma

**El problema que resuelve.** En las redes sociales todo dura horas: una
noticia se publica, se pierde en el feed y nadie vuelve a ella. La política
territorial necesita lo contrario: **memoria, seguimiento y organización**.
Peronismo Geselino está construido sobre esa idea — *"una noticia dura un día,
una causa sigue viva"*.

**Dos mundos en una sola plataforma:**

- **El portal público** — abierto a cualquiera, sin registro. Es la cara
  visible: noticias, causas, agenda, juego y frase del día. Sirve para
  informar, para que la gente conozca y comparta, y para sumar a los que
  todavía no militan.
- **La comunidad privada** — cerrada, por invitación. Es la cocina: foro,
  organización por barrio, materiales y agenda interna. Sirve para trabajar.

**Por qué separadas.** El que entra a leer una noticia no tiene por qué ver
las conversaciones internas, y el que organiza el territorio necesita un
espacio cuidado. La plataforma mantiene los dos mundos comunicados pero
separados: la información pública nunca expone datos privados (ni siquiera la
dirección de un encuentro interno).

**Todo se administra desde un panel**, sin programadores. Cargar contenido es
llenar un formulario. Y funciona **sin inteligencia artificial** durante el
uso: es todo lógica propia, sin costos por uso ni dependencia de terceros.

---

## 2. El portal público

### 2.1 Portada

**Qué es.** La página de entrada. Reúne, en una sola vista, todo lo que está
pasando: la noticia del momento, la causa activa, las próximas actividades, el
juego y la frase del día.

**Por qué está así diseñada.** Es una vidriera, no un archivo. Muestra lo más
fresco y relevante para que cualquiera, en 10 segundos, entienda qué está
pasando y encuentre por dónde entrar. Las secciones están ordenadas por
importancia: primero el mensaje de identidad (el hero con Gustavo), después la
información caliente (pulso del día), luego el contenido (noticias, causa) y
por último las puertas de entrada participativas (juego, comunidad).

**Qué contiene, de arriba a abajo:**

- **Hero** — la imagen de Gustavo con el lema y los datos del portal
  (territorios, causas activas, municipios). Es la identidad visual.
- **El pulso de hoy** — la franja que muestra la noticia más caliente del
  momento, con la hora. Un toque lleva a la nota.
- **Perón 365** — la tarjeta de la frase del día (ver 2.6).
- **Lo que está pasando** — las 6 noticias más recientes. Si hay más de 6,
  aparece "Ver todas las noticias" que lleva al archivo.
- **Causa viva** — el bloque grande que invita a seguir la causa activa.
- **Agenda + Nuevo desafío** — las próximas actividades y la entrada al
  Peronómetro, lado a lado.
- **La Comunidad** — el bloque que invita al espacio privado.

**Todo lo de la portada se administra desde el panel.** Las estadísticas
(territorios, municipios) se editan en Ajustes; las noticias, causas y
actividades en sus módulos.

### 2.2 Noticias y archivo

**Qué es.** El sistema de noticias del portal. Cada noticia tiene su propia
página con foto, etiqueta, fecha, texto completo y botón para compartir.

**Por qué así.** Una noticia no es un cartel que se ve y se olvida: es una
página con URL propia que se puede compartir por WhatsApp, guardar y volver a
leer. La etiqueta (Villa Gesell / Provincia / Comunidad) ayuda a ordenar por
tema.

**Cómo funciona:**

- **En la portada** se muestran las **6 más recientes** (la destacada, más
  grande; las otras en tarjetas). La "destacada" se marca desde el panel y
  ocupa el lugar principal.
- Cuando hay **más de 6**, aparece **"Ver todas las noticias"**.
- **El archivo** (`/noticias`) lista todas las publicadas, de la más nueva a
  la más vieja, en grilla pareja, **de a 6 por página**, con paginación
  numerada (← Anterior · 1 · 2 · Siguiente →).
- Las noticias **no se borran solas**. Quedan siempre accesibles en el
  archivo. "Archivar" es una acción manual del panel para sacar algo de
  circulación sin eliminarlo.

**Estados de una noticia** (se define en el panel): *borrador* (se prepara sin
mostrarla), *publicado* (visible en el portal), *archivado* (fuera de
circulación pero conservado).

### 2.3 Causas vivas

**Qué es.** El corazón del portal. Una causa es un tema importante que se
sigue en el tiempo: qué se pidió, qué se logró, qué falta. No es una noticia
suelta, es un expediente vivo.

**Por qué es la marca del portal.** Acá está la diferencia con cualquier red
social. Una causa muestra:

- **Estado y barra de avance** — en qué punto está (ej: "EN GESTIÓN", 72%).
- **Resumen en 30 segundos** — qué está pasando, en criollo.
- **Puntos clave** — lo esencial en viñetas.
- **Dato clave** — un número que impacta (ej: "11.000+ hogares").
- **Qué sigue** — los próximos pasos.
- **Línea de tiempo** — la historia completa hito por hito, con marcas de
  "hecho", "ahora" y "próximo". Esto es la memoria: se puede seguir, documentar
  y defender.

**Para qué sirve políticamente.** Convierte un reclamo en un relato que la
gente puede acompañar. En vez de "salió una noticia", es "seguí esta causa": la
persona vuelve a ver cómo avanza, y desde la causa puede pasar a debatirla en
la comunidad.

**Todo editable desde el panel**, incluida la línea de tiempo (se agregan y
ordenan los hitos uno por uno).

### 2.4 Agenda + Google Maps

**Qué es.** El calendario de actividades, públicas y de la comunidad, con
mapa, opción de agregar al calendario del teléfono, confirmar asistencia y
compartir.

**Por qué el detalle del mapa y la visibilidad.** Una actividad necesita
responder tres preguntas: cuándo, dónde y quién puede ir. Por eso cada
actividad guarda:

- Fecha y horario, tipo (charla, entrevista, encuentro…).
- Lugar, dirección y, si se cargan, coordenadas.
- Enlace de Google Maps (se genera solo desde la dirección, sin costo).
- **Visibilidad**: *pública* o *solo miembros*.

**La regla de oro de privacidad.** Una actividad marcada como **"solo
miembros" nunca muestra su ubicación en el portal público**. Si un vecino no
logueado abre la agenda, ve que hay un encuentro interno pero no dónde es —
solo lo ven los miembros de la comunidad. Esto protege las reuniones internas.

**Acciones disponibles:** abrir en Google Maps, agregar al calendario
(descarga un `.ics` que entra a Google Calendar / iPhone), confirmar
asistencia (para miembros) y compartir.

**Hoy el mapa usa Villa Gesell como ubicación de muestra.** Cuando se cargue
la dirección real de cada actividad desde el panel, el mapa se actualiza solo.

### 2.5 Peronómetro

**Qué es.** Un juego: 50 preguntas sobre Juan Domingo Perón, 10 segundos por
respuesta. Al terminar da un porcentaje, un rango ("Corazón justicialista",
etc.) y genera una **placa vertical lista para compartir** por WhatsApp o
Instagram.

**Por qué existe.** Es la **puerta de entrada para los que todavía no
militan**. La política no siempre entra por un discurso; a veces entra
jugando. Alguien juega, comparte su resultado, desafía a un amigo, y de paso
conoce el portal. Es difusión que se propaga sola, sin pauta.

**Cómo funciona:**

- Las preguntas se barajan al empezar; se muestra una por vez con un contador
  visible de 10 segundos.
- Correcta = 1 punto; incorrecta o sin responder = 0. No se puede volver
  atrás.
- Al final: porcentaje exacto, rango y placa 1080×1350 (también hay versión
  para historias). La placa se genera **en el teléfono**, sin IA ni costo.
- **No pide ningún dato personal.** Solo se guardan métricas anónimas
  (cuántas partidas, promedio) para ver en el panel.

**Las 50 preguntas son editables desde el panel**, con su fuente histórica.
Hoy son de muestra y necesitan revisión editorial antes del lanzamiento
oficial.

### 2.6 Perón 365

**Qué es.** Una microexperiencia diaria: **una frase documentada de Perón por
día**, con su fuente histórica, que aparece cada mañana y se convierte en una
placa para compartir. Cada día tiene su enlace permanente y su archivo.

**Por qué "una idea por día".** Genera el hábito de volver todos los días.
Es contenido de bajo esfuerzo y alto impacto: no hay que producir una noticia,
alcanza con una frase bien elegida y verificada. Y cada frase compartida lleva
gente al portal.

**Cómo funciona:**

- Al entrar por primera vez en el día, aparece un **emergente** con la frase
  (se puede cerrar enseguida y no vuelve a salir ese día en ese teléfono). En
  la portada queda una tarjeta para reabrirlo.
- La página `/peron365` muestra la frase vigente; cada fecha tiene su
  **permalink** (`/peron365/2026-07-23`) que no cambia nunca, y hay un
  **archivo** con las frases anteriores.
- La frase del día **cambia automáticamente a la medianoche de Buenos Aires**,
  de forma determinística (una fecha ya publicada nunca cambia), sin repetir
  frases dentro de un intervalo configurable.
- **Solo entran frases verificadas.** Cada frase tiene un flujo: borrador → en
  revisión → verificada. Únicamente las verificadas salen al aire.
- La placa respeta la regla visual 70/30: el 70% es el sistema de la app
  (azul, verde, tarjetas) y el 30% es la identidad de almanaque (papel crema,
  fecha protagonista, foto humana, tipografía serif para la cita).

**Miembros:** pueden guardar frases y abrir un debate sobre la frase del día
en el foro (se crea como máximo un tema por fecha).

---

## 3. La Comunidad (espacio privado)

**Qué es.** El área cerrada, con aprobación. Es donde se organiza el trabajo
real: debate, propuestas, territorio y agenda interna. Pensada para hasta 500
miembros.

**Cómo se entra: nombre y WhatsApp.** Nada de contraseñas, correos ni cuentas
de Google. La militancia ya usa WhatsApp todos los días; pedirle otra cosa es
poner una puerta que nadie quiere cruzar.

- **Nombre y apellido, y el WhatsApp.** El número de afiliado al PJ es
  opcional: sirve para el trabajo interno, no para entrar.
- **El número es la identidad.** Da igual cómo lo escriba cada uno
  (`2255 456789`, `02255 15 456789`, `+54 9 2255 456789`): el sistema lo
  guarda siempre igual, así que nadie termina con dos cuentas.
- **Nadie se auto-invita.** Si ese WhatsApp no está en la comunidad, no entra:
  queda un **pedido de ingreso** que la mesa aprueba o rechaza. Un pedido
  rechazado no puede volver a intentarlo.

**Por qué es cerrada.** El trabajo político territorial necesita un espacio
cuidado, sin trolls ni intrusos. La aprobación manual es justamente eso: alguien
de la mesa mira quién es antes de abrirle la puerta, y tiene el WhatsApp a un
clic para preguntarle si no lo ubica.

**Quiénes llevan clave además del WhatsApp.** Solo los administradores. Son los
únicos que aprueban, publican y borran; si alcanzara con saber su número,
cualquiera podría tomar el control del portal. Los miembros comunes y los
editores no usan clave.

**Qué hay adentro:**

- **La Plaza** — el foro. Conversaciones por causa o por barrio, con una nota
  de moderación que fija las reglas de cada hilo.
- **Anuncios de conducción** — avisos importantes fijados arriba (ej: la
  próxima reunión).
- **Territorio** — cada miembro pertenece a una zona (Zona Centro, Mar Azul,
  etc.); puede ver las conversaciones de su barrio y quién es su referente.
- **Agenda interna** — las actividades de miembros, **con la ubicación
  visible** (que en el portal público está oculta), y confirmación de
  asistencia.
- **Materiales** — placas, documentos y enlaces para la militancia.

**Por qué importa el rol de referente territorial.** Permite descentralizar:
cada barrio tiene su referente que organiza su zona, sin depender de que todo
pase por la conducción central.

**Moderación cuidada.** Todo hilo tiene su nota ("no publiques facturas ni
datos personales"), y la moderación puede ocultar mensajes, cerrar
conversaciones o fijarlas. La idea es un espacio de respeto, no un descontrol.

---

## 4. El panel de control

**Qué es.** El centro de administración. Desde acá se carga y gestiona
**todo** el contenido del portal y de la comunidad, sin tocar código.

**Por qué un panel propio.** Para que la plataforma la maneje el equipo
político, no un programador. Cada tipo de contenido tiene su formulario
simple. Cada persona ve solo los módulos que su rol permite.

**Cómo se carga cualquier cosa (siempre igual):** entrás al módulo → botón
**+ Nuevo** → completás el formulario → **Guardar**. Cada contenido tiene
estado *borrador / publicado / archivado*, así se puede preparar con tiempo y
mostrar recién cuando se decide.

**Los módulos:**

- **Noticias** — alta, edición y baja de noticias; marcar destacada; elegir
  foto (de las aprobadas); estado.
- **Causas vivas** — la ficha completa: resumen, puntos clave, dato clave, qué
  sigue y la **línea de tiempo** editable hito por hito.
- **Agenda** — actividades con fecha, lugar, dirección, coordenadas, enlace de
  Maps y **visibilidad** (pública o solo miembros).
- **Perón 365** — biblioteca de frases con su flujo de verificación, y el
  **calendario** de los próximos 30 días (asignación manual de frase y
  plantilla, más estadísticas de aperturas y compartidas).
- **Peronómetro · preguntas** — el banco de 50 preguntas, con opciones, la
  correcta, explicación y fuente.
- **Peronómetro · resultados** — métricas anónimas: cuántas partidas,
  promedio, distribución por rango.
- **Anuncios** — los avisos internos de la comunidad (fijar arriba).
- **Materiales** — documentos y enlaces para la militancia.
- **Moderación** — conversaciones del foro: abrir, fijar, cerrar, ocultar
  mensajes.
- **Pedidos de ingreso** — quienes completaron el formulario de la comunidad y
  esperan respuesta. Cada uno con su WhatsApp enlazado para escribirle antes de
  decidir. Aprobar lo convierte en miembro; rechazar le cierra la puerta.
- **Miembros** — la lista de WhatsApp autorizados, con su rol, nivel,
  territorio y estado. Acá se suma gente directo y se define quién puede
  entrar. En los administradores aparece además «Poner clave» / «Cambiar
  clave»: cambiarla cierra sus sesiones abiertas al instante.

  La columna **«Figura»** distingue dos cosas distintas: quien es parte de la
  comunidad y quien solo la sostiene. Una **cuenta técnica** entra al panel
  para construir y mantener el portal, pero no suma al recuento de miembros ni
  aparece en las listas que ve la militancia. No todo el que hace funcionar
  una herramienta política milita en ella, y el sistema no debería obligarlo a
  decir que sí.
- **Territorios** — los barrios y zonas de Villa Gesell.
- **Ajustes** — valores generales (estadísticas de la portada, máximo de
  miembros, etc.) y el **registro de actividad** (auditoría: quién hizo qué).

**Auditoría.** Cada acción importante (crear, editar, borrar, invitar,
moderar, cambiar roles) queda registrada con quién y cuándo. Es control y
transparencia interna.

---

## 5. Roles y permisos

**Por qué hay roles.** No todos los que colaboran deben poder todo. Un editor
carga noticias pero no debería cambiar la configuración; un moderador cuida el
foro pero no toca el diseño. Los roles reparten responsabilidades sin riesgo.

**Roles vigentes hoy** (esquema técnico):

| Rol | Puede |
|---|---|
| **Administrador** | Todo: contenido, comunidad, miembros, configuración. |
| **Editor** | Contenido del portal: noticias, causas, agenda, Perón 365, preguntas, anuncios, materiales. No toca miembros ni ajustes. |
| **Moderador** | Foro y anuncios de la comunidad. |
| **Referente territorial** | Su territorio dentro de la comunidad. |
| **Miembro** | Participa de la comunidad (foro, agenda interna, materiales). |

**Estructura de colaboradores acordada (en construcción).** El esquema
definitivo distingue:

1. **Admin builder** — acceso total, incluido diseño, estructura y concepto.
   Es quien decide sobre el sistema. (La conducción técnica.)
2. **Admin manager** — aprueba contenido y controla a los editores, pero **no
   decide sobre diseño, estructura ni concepto**. Su rol es de control
   editorial.
3. **Editores** — cargan contenido, que **queda pendiente hasta que un admin lo
   aprueba** antes de publicarse.

> El flujo de aprobación (editor propone → admin aprueba/publica) y la
> distinción admin builder / admin manager es la próxima etapa de desarrollo.
> Ver `_handoff/ROLES_FUTUROS.md`.

---

## 6. Seguridad y privacidad

**Principios que rigen toda la plataforma:**

- **La información pública nunca expone datos privados.** Una actividad de
  miembros no envía su dirección al portal público (verificado por pruebas
  automáticas). El territorio de un miembro no se publica.
- **Ingreso controlado.** Un WhatsApp desconocido genera un pedido, nunca una
  sesión. La sesión se puede revocar; si se suspende a un miembro, pierde el
  acceso al instante. Las claves de administración se guardan derivadas (scrypt
  con sal propia), nunca en texto plano.
- **Nada de datos innecesarios.** El Peronómetro y Perón 365 guardan solo
  métricas anónimas. No se piden datos personales para jugar o compartir.
- **Todo cambio queda registrado** (auditoría de roles, invitaciones, bajas y
  moderación).
- **Protecciones técnicas** — sesiones con cookie segura, verificación de rol
  en cada acción del servidor, límite de velocidad contra abuso, validación de
  todo lo que se carga, y encabezados de seguridad.

**Sin IA y sin servicios pagos por uso** en esta versión. El costo de operar
es mínimo y previsible.

---

## 7. PWA: la app en el teléfono

**Qué es.** La plataforma es una **PWA** (Progressive Web App): se puede
"instalar" en el teléfono desde el navegador y queda con su ícono, como una
app nativa, sin pasar por las tiendas de aplicaciones.

**Por qué.** Cero fricción: no hay que descargar nada de Play Store ni App
Store, no ocupa casi espacio, y se actualiza sola. Funciona el shell básico
sin conexión, aunque el contenido de la comunidad siempre pide datos frescos.

**Cómo se instala** (el usuario): en Chrome/Android, menú → "Agregar a
pantalla de inicio". En iPhone, compartir → "Agregar a inicio".

---

## 8. Preguntas frecuentes

**¿La app es parte de la web de Gustavo o es aparte?**
Las dos cosas: para el visitante es parte del entorno, pero técnicamente es una
aplicación **independiente**, con su propio despliegue, base de datos y ciclo
de actualización. Puede actualizarse o revertirse sin tocar la web personal de
Gustavo, y ninguna otra parte del dominio cambia.

**¿Necesito programador para cargar contenido?**
No. Todo se hace desde el panel llenando formularios.

**¿Qué pasa si cargo 50 noticias?**
La portada muestra las 6 más recientes; el resto queda en el archivo paginado.
Nada se pierde.

**¿La frase del día se repite?**
No dentro del intervalo configurado. Y una fecha ya publicada conserva su
frase para siempre (su permalink no cambia).

**¿Cuánto cuesta operarla?**
En esta versión, prácticamente nada: no usa IA ni servicios pagos por uso. El
detalle está en el README y en el documento de arquitectura y costos.

**¿Cómo se suma un colaborador?**
Desde el panel → **Miembros**, cargando su WhatsApp y asignándole un rol. Entra
con ese número. Si el rol es de administración, en el mismo alta se le define la
clave y hay que pasársela por WhatsApp.

---

*Este manual acompaña al `README.md` (instalación y despliegue técnico), al
`HANDOFF_CLAUDE.md` (especificación funcional) y a los documentos de
`_handoff/` (arquitectura, costos, Perón 365 y roles futuros).*
