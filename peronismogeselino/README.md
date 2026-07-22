# Peronismo Geselino

Aplicación completa de **Peronismo Geselino**, integrada al repositorio de
gustavobarrera.com y publicada bajo la ruta **`/peronismogeselino`**, aislada
técnica y visualmente del resto de la web.

- **La web actual no cambia**: `index.html`, `fotos/` y `memogesell/` se sirven
  exactamente igual que antes, ahora a través de un pequeño servidor Node.
- **La app nueva** vive completa dentro de esta carpeta: portal público,
  comunidad privada, panel de control, agenda con Google Maps y Peronómetro.
- **Sin IA en producción** y **sin servicios pagos**: base SQLite embebida,
  Google Sign-In gratuito y mapas por iframe sin clave.

El prototipo visual aprobado está en `_handoff/peronismo-geselino` y es la
referencia de diseño: no cambiar portada, Peronómetro, colores, tipografías,
jerarquías ni fotografías sin aprobación.

---

## Arquitectura

```
repositorio/
├── index.html, fotos/, memogesell/   ← web actual, intacta
├── package.json / nixpacks.toml      ← ahora arrancan el servidor Node
├── _handoff/peronismo-geselino/      ← prototipo aprobado (referencia)
└── peronismogeselino/
    ├── server/          Express + node:sqlite (API, auth, roles, seguridad)
    │   ├── migrations.js, seed.js, questions-seed.js
    │   └── routes/ (public, auth, admin, community, quiz)
    ├── src/             SPA React (Vite) con el diseño aprobado
    │   ├── screens/ (Home, Cause, Agenda, Game, Peronometro, Community)
    │   └── panel/   (11 módulos de gestión)
    ├── public/          imágenes aprobadas, manifest PWA, service worker
    └── data/            base SQLite (se crea sola; no va a git)
```

Rutas principales:

| Ruta | Qué es |
|---|---|
| `/` | Web actual de Gustavo (sin cambios) |
| `/peronismogeselino` | Portal público |
| `/peronismogeselino/causas` · `/agenda` · `/juegos` | Secciones públicas |
| `/peronismogeselino/juegos/jugar` | Peronómetro jugable |
| `/peronismogeselino/comunidad` | Comunidad privada (Google + invitación) |
| `/peronismogeselino/panel` | Panel de control (roles) |
| `/peronismogeselino/api/*` | API REST |

## Cómo probar localmente

Requisitos: Node.js ≥ 22.13.

```bash
cd peronismogeselino
npm install
npm run build          # compila la SPA a dist/
cd ..
PG_DEV=1 PG_ADMIN_EMAILS=tu-correo@gmail.com PORT=4600 node peronismogeselino/server/index.js
```

Abrí `http://localhost:4600/peronismogeselino`.

Con `PG_DEV=1` aparece un **ingreso de desarrollo** (correo sin Google) para
probar comunidad y panel sin configurar nada. `PG_ADMIN_EMAILS` da rol de
administración a esos correos. **Nunca** usar `PG_DEV=1` en producción.

Para desarrollo con recarga en vivo:

```bash
cd peronismogeselino
npm run dev        # Vite en :5199 (proxy del API a :4600)
npm run dev:server # API en :4600 (en otra terminal)
```

Pruebas automatizadas (10 casos: seeds, visibilidad de eventos, auth,
roles, foro y moderación, Peronómetro, validaciones y bloqueo de rutas):

```bash
cd peronismogeselino && npm test
```

## Variables de entorno

| Variable | Qué hace |
|---|---|
| `PORT` | Puerto del servidor (la plataforma lo define sola) |
| `PG_GOOGLE_CLIENT_ID` | Client ID de Google para el ingreso real |
| `PG_ADMIN_EMAILS` | Correos (separados por coma) con rol administración |
| `PG_DATA_DIR` | Carpeta de la base SQLite (montar volumen persistente) |
| `PG_DEV` | `1` habilita ingreso de desarrollo. Solo local |
| `PG_SECURE_COOKIES` | `1` fuerza cookies Secure (con `NODE_ENV=production` ya lo son) |

## Configurar el ingreso con Google (gratis)

1. Entrar a <https://console.cloud.google.com> → crear proyecto
   «Peronismo Geselino».
2. **APIs y servicios → Pantalla de consentimiento OAuth**: tipo «Externo»,
   nombre y correo. No pide verificación porque solo se usa el ingreso básico.
3. **Credenciales → Crear credencial → ID de cliente OAuth → Aplicación web**:
   - Orígenes de JavaScript autorizados: `https://gustavobarrera.com`
     (y `http://localhost:4600` para pruebas).
4. Copiar el Client ID y definir `PG_GOOGLE_CLIENT_ID` en el servidor.

El servidor valida cada credencial contra Google y después exige que el correo
esté en **Miembros e invitaciones** del panel. Nadie entra sin invitación.

## Despliegue (Railway u otra plataforma con nixpacks)

El `nixpacks.toml` de la raíz ya hace todo: `npm run build` compila la SPA y
`npm start` levanta el servidor que sirve ambas webs.

**Importante — persistencia**: la base SQLite vive en
`peronismogeselino/data/`. En Railway el disco es efímero, así que hay que
**montar un volumen** y apuntarlo con `PG_DATA_DIR` (por ejemplo, montar el
volumen en `/data` y definir `PG_DATA_DIR=/data`). Sin volumen, cada deploy
reinicia miembros, foro y resultados (el contenido semilla se regenera solo).

Migraciones: **automáticas al arrancar** (tabla `_migrations`); no hay ningún
paso manual.

### Checklist antes de publicar

- [ ] Revisión histórica y editorial de las 50 preguntas (panel → Preguntas).
- [ ] Cargar la dirección real de las actividades (hoy Villa Gesell genérica).
- [ ] Configurar `PG_GOOGLE_CLIENT_ID` y probar el ingreso real.
- [ ] Cargar la lista de correos invitados y roles en el panel.
- [ ] Montar el volumen persistente (`PG_DATA_DIR`).
- [ ] Quitar `PG_DEV` del entorno de producción.

## Costos externos potenciales

| Servicio | Costo |
|---|---|
| Google Sign-In (Identity Services) | **$0** |
| Google Maps por iframe embed (sin clave) | **$0** |
| Google Fonts (Barlow Condensed + Manrope) | **$0** |
| SQLite embebido (node:sqlite) | **$0** |
| Placa del Peronómetro (Canvas en el navegador) | **$0** |
| IA durante el uso | **No se usa** |
| Hosting | El mismo servicio actual; puede subir de plan por tráfico |
| Volumen persistente (Railway) | Según plan (~USD 0,15/GB·mes; la base pesa MB) |

## Seguridad

- Sesiones con cookie `HttpOnly` + `SameSite=Lax` limitadas a
  `/peronismogeselino`; en la base solo se guarda el hash del token.
- Roles verificados en el servidor en cada endpoint (administrador, editor,
  moderador, referente territorial).
- Una actividad de miembros **nunca** envía dirección, coordenadas ni enlace
  de Maps al público (probado por tests).
- Rate limiting en el API y en el ingreso; validación y truncado de entradas;
  encabezados de seguridad; `_handoff`, dotfiles y código del servidor
  bloqueados como estáticos.
- El Peronómetro guarda solo métricas anónimas (aciertos, duración).

## PERÓN 365

Módulo diario compartible («una idea por día»): una frase documentada de Perón
por día, con permalink (`/peron365/2026-07-22`), archivo, emergente en la
portada (una vez por día y dispositivo, controlado por `localStorage`) y placa
compartible 1080×1350 / 1080×1920 generada en el navegador.

- Selección automática a medianoche de Buenos Aires, determinística y sin
  repetir dentro de un intervalo configurable (ajuste `peron365_min_gap`,
  120 días por defecto). Una fecha publicada nunca cambia.
- Solo entran al selector frases con estado **Verificada** (panel → Perón 365).
  El corpus inicial es de muestra y requiere revisión editorial.
- El panel administra biblioteca, verificación, calendario de 30 días,
  plantillas y estadísticas (aperturas/compartidas). El emergente se apaga con
  el ajuste `peron365_modal = 0`.
- Miembros: guardar frases y «Conversar sobre esta frase» (crea como máximo un
  tema de foro por fecha).
- Regla visual 70/30 según la referencia V3 del handoff
  (`_handoff/peron365`). Fotos en `public/images/peron365/` (sumar más para
  variar). Sin IA y sin servicios pagos.

## PWA

Manifest + service worker con alcance limitado a `/peronismogeselino/`:
instalable en el teléfono, shell disponible sin conexión y estáticos en caché.
El API siempre va a la red para no mostrar datos viejos en la comunidad.
