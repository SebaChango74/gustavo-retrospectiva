import { test, before, after } from "node:test";
import assert from "node:assert/strict";

// Las pruebas hacen muchos ingresos seguidos; el límite de ritmo se prueba aparte.
process.env.PG_RATE_LIMIT_OFF = "1";

const { openTestDb } = await import("../db.js");
const { createApp } = await import("../app.js");
const { hashClave } = await import("../auth.js");
const { normalizarWhatsapp } = await import("../whatsapp.js");

let server;
let base;
let db;

// Números de prueba: código de área de Villa Gesell + abonado.
const VECINA = "2255400001";
const ADMIN = "2255400002";
const EDITOR = "2255400003";
const MANAGER = "2255400004";
const CLAVE_ADMIN = "clave-de-prueba";

function cookieFrom(response) {
  const header = response.headers.get("set-cookie") || "";
  return header.split(";")[0];
}

async function login(whatsapp, extra = {}) {
  const response = await fetch(`${base}/peronismogeselino/api/auth/ingresar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre: "Compañera Test", whatsapp, ...extra }),
  });
  return { response, cookie: cookieFrom(response) };
}

/** Alta directa en la base, como si ya estuviera aprobada. */
function crearMiembro({ phone, name, role = "member", status = "active", tier = "builder", clave }) {
  const id = Number(
    db
      .prepare(
        "INSERT INTO members (phone, name, role, status, admin_tier) VALUES (?, ?, ?, ?, ?)",
      )
      .run(normalizarWhatsapp(phone), name, role, status, tier).lastInsertRowid,
  );
  if (clave) {
    const { hash, salt } = hashClave(clave);
    db.prepare("UPDATE members SET key_hash = ?, key_salt = ? WHERE id = ?").run(hash, salt, id);
  }
  return id;
}

before(async () => {
  db = openTestDb();
  const app = createApp(db);
  await new Promise((resolve) => {
    server = app.listen(0, () => resolve());
  });
  base = `http://localhost:${server.address().port}`;
});

after(() => server?.close());

test("la semilla carga 50 preguntas habilitadas, 10 por categoría", () => {
  const rows = db
    .prepare("SELECT category, COUNT(*) AS n FROM questions WHERE enabled = 1 GROUP BY category")
    .all();
  assert.equal(rows.length, 5);
  for (const row of rows) assert.equal(row.n, 10);
});

test("la portada pública entrega noticias, causa y estadísticas", async () => {
  const response = await fetch(`${base}/peronismogeselino/api/public/home`);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.ok(data.news.length >= 3);
  assert.ok(data.cause);
  assert.ok(data.stats.territorios);
});

test("una actividad de miembros no expone su ubicación al público", async () => {
  const response = await fetch(`${base}/peronismogeselino/api/public/events`);
  const data = await response.json();
  const membersEvent = data.events.find((event) => event.visibility === "members");
  assert.ok(membersEvent, "existe la actividad de miembros sembrada");
  assert.equal(membersEvent.address, undefined);
  assert.equal(membersEvent.googleMapsUrl, undefined);
  assert.equal(membersEvent.mapsEmbedUrl, undefined);
  assert.equal(membersEvent.latitude, undefined);
});

test("el WhatsApp se normaliza escriba como escriba la persona", () => {
  const esperado = "542255456789";
  for (const entrada of [
    "2255456789",
    "2255 45-6789",
    "02255 456789",
    "+54 2255 456789",
    "+54 9 2255 456789",
    "02255 15 456789",
    "0054 2255 456789",
  ]) {
    assert.equal(normalizarWhatsapp(entrada), esperado, `falló con "${entrada}"`);
  }
  for (const invalido of ["", "1234", "no es un número", "0000000000"]) {
    assert.equal(normalizarWhatsapp(invalido), "", `debió rechazar "${invalido}"`);
  }
});

test("quien no está en la comunidad no entra: queda como pedido de ingreso", async () => {
  const { response } = await login("2255409999", { nombre: "Persona Nueva" });
  assert.equal(response.status, 202, "no entra, pero el pedido se registra");
  const data = await response.json();
  assert.equal(data.pendiente, true);
  assert.equal(data.member, undefined, "no devuelve sesión");

  const fila = db
    .prepare("SELECT * FROM access_requests WHERE phone = ?")
    .get(normalizarWhatsapp("2255409999"));
  assert.equal(fila.status, "pending");

  // Insistir no da acceso ni duplica el pedido.
  const otraVez = await login("2255409999", { nombre: "Persona Nueva" });
  assert.equal(otraVez.response.status, 202);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM access_requests").get().n, 1);
});

test("un miembro aprobado ingresa y ve la comunidad; el público no", async () => {
  crearMiembro({ phone: VECINA, name: "Vecina Test", status: "invited" });

  const anon = await fetch(`${base}/peronismogeselino/api/community/overview`);
  assert.equal(anon.status, 401);

  const { response, cookie } = await login(VECINA);
  assert.equal(response.status, 200);

  const overview = await fetch(`${base}/peronismogeselino/api/community/overview`, {
    headers: { cookie },
  });
  assert.equal(overview.status, 200);
  const data = await overview.json();
  assert.ok(data.stats.activeMembers >= 1);

  // ahora la ubicación de la actividad interna sí es visible
  const events = await fetch(`${base}/peronismogeselino/api/public/events`, {
    headers: { cookie },
  });
  const eventsData = await events.json();
  const membersEvent = eventsData.events.find((event) => event.visibility === "members");
  assert.ok(membersEvent.mapsEmbedUrl.includes("google.com/maps"));
});

test("el panel exige rol: miembro común no, administración sí", async () => {
  const { cookie: memberCookie } = await login(VECINA);
  const denied = await fetch(`${base}/peronismogeselino/api/admin/news`, {
    headers: { cookie: memberCookie },
  });
  assert.equal(denied.status, 403);

  crearMiembro({ phone: ADMIN, name: "Admin Test", role: "admin", clave: CLAVE_ADMIN });
  const { cookie: adminCookie } = await login(ADMIN, { clave: CLAVE_ADMIN });
  const allowed = await fetch(`${base}/peronismogeselino/api/admin/news`, {
    headers: { cookie: adminCookie },
  });
  assert.equal(allowed.status, 200);
});

test("el foro guarda mensajes y la moderación puede ocultarlos", async () => {
  const { cookie } = await login(VECINA);
  const posted = await fetch(`${base}/peronismogeselino/api/community/threads/1/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ body: "Mensaje de prueba" }),
  });
  assert.equal(posted.status, 200);
  const { id } = await posted.json();

  const { cookie: adminCookie } = await login(ADMIN, { clave: CLAVE_ADMIN });
  const hidden = await fetch(`${base}/peronismogeselino/api/admin/moderation/posts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", cookie: adminCookie },
    body: JSON.stringify({ status: "hidden", reason: "prueba" }),
  });
  assert.equal(hidden.status, 200);

  const thread = await fetch(`${base}/peronismogeselino/api/community/threads/1`, {
    headers: { cookie },
  });
  const threadData = await thread.json();
  assert.ok(!threadData.posts.some((post) => post.id === id));
});

test("el Peronómetro entrega 50 preguntas y registra resultados anónimos", async () => {
  const questions = await fetch(`${base}/peronismogeselino/api/quiz/questions`);
  const data = await questions.json();
  assert.equal(data.total, 50);
  assert.equal(data.secondsPerQuestion, 10);
  assert.equal(data.questions[0].options.length, 4);

  const result = await fetch(`${base}/peronismogeselino/api/quiz/results`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ correct: 39, total: 50, durationMs: 300000 }),
  });
  const resultData = await result.json();
  assert.equal(resultData.score, 78);
  const stored = db.prepare("SELECT * FROM quiz_results ORDER BY id DESC").get();
  assert.equal(stored.score, 78);
  assert.equal(stored.member_id, null);
});

test("valida entradas del panel", async () => {
  const { cookie } = await login(ADMIN, { clave: CLAVE_ADMIN });
  const bad = await fetch(`${base}/peronismogeselino/api/admin/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ prompt: "¿Pregunta?", options: ["a", "b"], correctOption: 0, category: "culture" }),
  });
  assert.equal(bad.status, 400);
});

test("la web actual se sirve y las rutas sensibles quedan bloqueadas", async () => {
  const home = await fetch(`${base}/`);
  assert.equal(home.status, 200);
  const html = await home.text();
  assert.ok(html.includes("Gustavo Barrera"));

  for (const path of ["/_handoff/peronismo-geselino/README.md", "/.git/config"]) {
    const blocked = await fetch(`${base}${path}`);
    assert.notEqual(blocked.status, 200, `${path} no debe servirse`);
  }

  // El código del servidor nunca se expone: esa ruta devuelve el shell de la SPA.
  const shell = await fetch(`${base}/peronismogeselino/server/db.js`);
  const shellBody = await shell.text();
  assert.ok(!shellBody.includes("DatabaseSync"));
});

test("Perón 365: frase diaria estable, verificada y con permalink", async () => {
  const first = await fetch(`${base}/peronismogeselino/api/peron365/today`);
  assert.equal(first.status, 200);
  const a = await first.json();
  assert.ok(a.day.quote.text.length > 0);
  assert.ok(a.day.quote.sourceTitle.length > 0);

  // la misma fecha devuelve siempre la misma frase
  const second = await fetch(`${base}/peronismogeselino/api/peron365/today`);
  const b = await second.json();
  assert.equal(a.day.quote.id, b.day.quote.id);

  // el permalink fechado coincide
  const dated = await fetch(
    `${base}/peronismogeselino/api/peron365/days/${a.day.dayKey}`,
  );
  const c = await dated.json();
  assert.equal(c.day.quote.id, a.day.quote.id);

  // solo se seleccionan frases verificadas
  const verifiedIds = db
    .prepare(
      "SELECT id FROM peron365_quotes WHERE verification_status = 'verified' AND active = 1",
    )
    .all()
    .map((row) => row.id);
  assert.ok(verifiedIds.includes(a.day.quote.id));

  // una fecha futura no existe para el público
  const future = await fetch(`${base}/peronismogeselino/api/peron365/days/2099-01-01`);
  assert.equal(future.status, 404);
});

test("Perón 365: el archivo lista el día publicado", async () => {
  const response = await fetch(`${base}/peronismogeselino/api/peron365/archive`);
  const data = await response.json();
  assert.ok(data.days.length >= 1);
  assert.ok(data.days[0].shortText.length > 0);
});

test("blindaje: encabezados de seguridad presentes", async () => {
  const response = await fetch(`${base}/peronismogeselino/`);
  const csp = response.headers.get("content-security-policy") || "";
  assert.ok(csp.includes("default-src 'self'"), "CSP restringe el origen");
  assert.ok(csp.includes("object-src 'none'"), "CSP bloquea plugins");
  assert.ok(csp.includes("frame-ancestors 'self'"), "CSP evita ser embebido");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN");
  assert.ok((response.headers.get("referrer-policy") || "").length > 0);
});

test("blindaje: anti-CSRF rechaza un origen ajeno", async () => {
  const response = await fetch(`${base}/peronismogeselino/api/auth/ingresar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://sitio-malicioso.example" },
    body: JSON.stringify({ nombre: "Admin Test", whatsapp: ADMIN, clave: CLAVE_ADMIN }),
  });
  assert.equal(response.status, 403);
});

test("blindaje: sin la clave correcta, un administrador no entra", async () => {
  const sinClave = await login(ADMIN);
  assert.equal(sinClave.response.status, 401, "el WhatsApp solo no alcanza");
  assert.equal((await sinClave.response.json()).claveRequerida, true);

  const claveMala = await login(ADMIN, { clave: "cualquier-cosa" });
  assert.equal(claveMala.response.status, 401);

  const bien = await login(ADMIN, { clave: CLAVE_ADMIN });
  assert.equal(bien.response.status, 200);
});

test("blindaje: la clave no se guarda en texto plano", () => {
  const fila = db
    .prepare("SELECT key_hash, key_salt FROM members WHERE phone = ?")
    .get(normalizarWhatsapp(ADMIN));
  assert.ok(fila.key_hash.length >= 64);
  assert.ok(fila.key_salt.length > 0);
  assert.ok(!fila.key_hash.includes(CLAVE_ADMIN));
});

test("blindaje: no se puede escalar el propio rol", async () => {
  const { cookie } = await login(VECINA);
  const attempt = await fetch(`${base}/peronismogeselino/api/admin/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ phone: "2255408888", role: "admin" }),
  });
  assert.equal(attempt.status, 403, "un miembro no puede crear administradores");
});

test("colaboradores: lo que carga un editor no sale hasta que un admin aprueba", async () => {
  crearMiembro({ phone: EDITOR, name: "Editor Test", role: "editor" });
  const { cookie: editorCookie } = await login(EDITOR);

  // El editor publica una noticia
  const created = await fetch(`${base}/peronismogeselino/api/admin/news`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: editorCookie },
    body: JSON.stringify({ title: "Nota de un editor", summary: "Prueba", status: "published" }),
  });
  assert.equal(created.status, 200);
  const { id } = await created.json();

  // Queda pendiente: el portal público NO la muestra
  const publicList = await fetch(`${base}/peronismogeselino/api/public/news?page=1`);
  const publicData = await publicList.json();
  assert.ok(
    !publicData.news.some((n) => n.title === "Nota de un editor"),
    "el contenido pendiente no se publica solo",
  );

  // El editor no puede aprobar
  const editorApprove = await fetch(
    `${base}/peronismogeselino/api/admin/pending/news/${id}/approve`,
    { method: "POST", headers: { cookie: editorCookie } },
  );
  assert.equal(editorApprove.status, 403);

  // El admin ve la bandeja y aprueba
  const { cookie: adminCookie } = await login(ADMIN, { clave: CLAVE_ADMIN });
  const pending = await fetch(`${base}/peronismogeselino/api/admin/pending`, {
    headers: { cookie: adminCookie },
  });
  const pendingData = await pending.json();
  assert.ok(pendingData.items.some((i) => i.id === id && i.table === "news"));

  const approved = await fetch(
    `${base}/peronismogeselino/api/admin/pending/news/${id}/approve`,
    { method: "POST", headers: { cookie: adminCookie } },
  );
  assert.equal(approved.status, 200);

  // Ahora sí aparece en el portal
  const after = await fetch(`${base}/peronismogeselino/api/public/news?page=1`);
  const afterData = await after.json();
  assert.ok(afterData.news.some((n) => n.title === "Nota de un editor"), "aprobada: ya se ve");
});

test("colaboradores: el admin manager aprueba pero no toca los ajustes", async () => {
  crearMiembro({
    phone: MANAGER,
    name: "Manager Test",
    role: "admin",
    tier: "manager",
    clave: CLAVE_ADMIN,
  });
  const { cookie } = await login(MANAGER, { clave: CLAVE_ADMIN });

  const canSeePending = await fetch(`${base}/peronismogeselino/api/admin/pending`, {
    headers: { cookie },
  });
  assert.equal(canSeePending.status, 200, "el manager ve la bandeja de aprobación");

  const settings = await fetch(`${base}/peronismogeselino/api/admin/settings`, {
    headers: { cookie },
  });
  assert.equal(settings.status, 403, "el manager no entra a los ajustes");
});

test("ingreso: el admin aprueba un pedido y esa persona ya puede entrar", async () => {
  const nuevo = "2255407777";

  // 1. La persona pide entrar y no obtiene acceso.
  const pedido = await login(nuevo, { nombre: "Compañero Nuevo", afiliado: "12345" });
  assert.equal(pedido.response.status, 202);

  const bloqueado = await fetch(`${base}/peronismogeselino/api/community/overview`, {
    headers: { cookie: pedido.cookie },
  });
  assert.equal(bloqueado.status, 401, "el pedido no crea sesión");

  // 2. El admin la ve en la bandeja.
  const { cookie: adminCookie } = await login(ADMIN, { clave: CLAVE_ADMIN });
  const bandeja = await fetch(`${base}/peronismogeselino/api/admin/requests`, {
    headers: { cookie: adminCookie },
  });
  const items = (await bandeja.json()).items;
  const fila = items.find((i) => i.phone === normalizarWhatsapp(nuevo));
  assert.ok(fila, "el pedido aparece en la bandeja");
  assert.equal(fila.affiliate_number, "12345");
  assert.ok(fila.phone_link.startsWith("https://wa.me/549"), "hay enlace para responderle");

  // 3. Un editor no puede aprobar ingresos.
  const { cookie: editorCookie } = await login(EDITOR);
  const editorIntenta = await fetch(
    `${base}/peronismogeselino/api/admin/requests/${fila.id}/approve`,
    { method: "POST", headers: { cookie: editorCookie } },
  );
  assert.equal(editorIntenta.status, 403);

  // 4. El admin aprueba y la persona entra con el mismo WhatsApp.
  const aprobado = await fetch(
    `${base}/peronismogeselino/api/admin/requests/${fila.id}/approve`,
    { method: "POST", headers: { cookie: adminCookie } },
  );
  assert.equal(aprobado.status, 200);

  const entra = await login(nuevo, { nombre: "Compañero Nuevo" });
  assert.equal(entra.response.status, 200);
  const comunidad = await fetch(`${base}/peronismogeselino/api/community/overview`, {
    headers: { cookie: entra.cookie },
  });
  assert.equal(comunidad.status, 200);
});

test("ingreso: un pedido rechazado no vuelve a colarse", async () => {
  const rechazado = "2255406666";
  await login(rechazado, { nombre: "No Corresponde" });

  const { cookie: adminCookie } = await login(ADMIN, { clave: CLAVE_ADMIN });
  const items = (
    await (
      await fetch(`${base}/peronismogeselino/api/admin/requests`, { headers: { cookie: adminCookie } })
    ).json()
  ).items;
  const fila = items.find((i) => i.phone === normalizarWhatsapp(rechazado));

  const respuesta = await fetch(
    `${base}/peronismogeselino/api/admin/requests/${fila.id}/reject`,
    { method: "POST", headers: { cookie: adminCookie } },
  );
  assert.equal(respuesta.status, 200);

  const reintento = await login(rechazado, { nombre: "No Corresponde" });
  assert.equal(reintento.response.status, 403);
});

test("ingreso: a un miembro suspendido se le corta el acceso", async () => {
  const suspendido = "2255405555";
  crearMiembro({ phone: suspendido, name: "Suspendido Test", status: "suspended" });
  const { response } = await login(suspendido);
  assert.equal(response.status, 403);
});

test("cuenta técnica: entra al panel pero no figura como miembro de la comunidad", async () => {
  const tecnico = "1136360000";
  const { cookie: adminCookie } = await login(ADMIN, { clave: CLAVE_ADMIN });

  const antes = (
    await (
      await fetch(`${base}/peronismogeselino/api/community/overview`, { headers: { cookie: adminCookie } })
    ).json()
  ).stats.activeMembers;

  crearMiembro({ phone: tecnico, name: "Equipo Técnico", role: "admin", clave: CLAVE_ADMIN });
  db.prepare("UPDATE members SET oculto = 1 WHERE phone = ?").run(normalizarWhatsapp(tecnico));

  // Entra y administra sin problema.
  const { response, cookie } = await login(tecnico, { clave: CLAVE_ADMIN });
  assert.equal(response.status, 200);
  const panel = await fetch(`${base}/peronismogeselino/api/admin/news`, { headers: { cookie } });
  assert.equal(panel.status, 200);

  // Pero no suma al recuento de la comunidad.
  const despues = (
    await (
      await fetch(`${base}/peronismogeselino/api/community/overview`, { headers: { cookie: adminCookie } })
    ).json()
  ).stats.activeMembers;
  assert.equal(despues, antes, "la cuenta técnica no engrosa la comunidad");
});

test("colaboradores: se puede sumar un admin manager con correo y clave en un solo paso", async () => {
  const { cookie } = await login(ADMIN, { clave: CLAVE_ADMIN });
  const alta = await fetch(`${base}/peronismogeselino/api/admin/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({
      phone: "2255521000",
      name: "Editorial Test",
      email: "editorial@example.com",
      role: "admin",
      adminTier: "manager",
      clave: "clave-editorial",
    }),
  });
  assert.equal(alta.status, 200);

  const fila = db
    .prepare("SELECT * FROM members WHERE phone = ?")
    .get(normalizarWhatsapp("2255521000"));
  assert.equal(fila.admin_tier, "manager");
  assert.equal(fila.email, "editorial@example.com");
  assert.equal(fila.oculto, 0, "un colaborador sí figura en la comunidad");
  assert.ok(fila.key_hash.length > 0, "quedó con clave");

  // Entra con su clave y aprueba, pero no toca los ajustes.
  const suyo = await login("2255521000", { nombre: "Editorial Test", clave: "clave-editorial" });
  assert.equal(suyo.response.status, 200);
  const bandeja = await fetch(`${base}/peronismogeselino/api/admin/pending`, {
    headers: { cookie: suyo.cookie },
  });
  assert.equal(bandeja.status, 200);
  const ajustes = await fetch(`${base}/peronismogeselino/api/admin/settings`, {
    headers: { cookie: suyo.cookie },
  });
  assert.equal(ajustes.status, 403);
});

test("direcciones cortas: /pg y /app llevan a la instalación", async () => {
  for (const [corta, destino] of [
    ["/pg", "/peronismogeselino/?instalar=1"],
    ["/app", "/peronismogeselino/?instalar=1"],
    ["/bajar", "/peronismogeselino/?instalar=1"],
    ["/peronismo", "/peronismogeselino/"],
  ]) {
    const r = await fetch(`${base}${corta}`, { redirect: "manual" });
    assert.equal(r.status, 302, `${corta} debe redirigir`);
    assert.equal(r.headers.get("location"), destino);
  }

  // El destino es el portal, no una página aparte: una sola pantalla.
  const destino = await fetch(`${base}/peronismogeselino/?instalar=1`);
  assert.equal(destino.status, 200);
});

test("la vista previa del enlace trae imagen y descripción", async () => {
  const html = await (await fetch(`${base}/peronismogeselino/`)).text();
  assert.ok(html.includes('property="og:title"'), "tiene título de vista previa");
  assert.ok(
    html.includes("https://gustavobarrera.com/peronismogeselino/images/og.jpg"),
    "la imagen apunta a una dirección absoluta",
  );
  const imagen = await fetch(`${base}/peronismogeselino/images/og.jpg`);
  assert.equal(imagen.status, 200, "la imagen de vista previa existe");
});

test("la guía está bajo candado: hacen falta las dos cosas", async () => {
  const url = `${base}/peronismogeselino/api/public/guia`;
  const abrir = (cuerpo) =>
    fetch(`${url}/abrir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });

  // Cerrada de entrada.
  assert.equal((await fetch(url)).status, 401);

  // La contraseña sola no alcanza: el WhatsApp tiene que tener acceso al panel.
  assert.equal(
    (await abrir({ whatsapp: "2255409999", clave: "PeronGeselino" })).status,
    401,
    "un número cualquiera con la contraseña no entra",
  );
  const comun = await abrir({ whatsapp: VECINA, clave: "PeronGeselino" });
  assert.equal(comun.status, 401, "un miembro sin panel tampoco");

  // El WhatsApp solo, tampoco.
  assert.equal((await abrir({ whatsapp: ADMIN, clave: "otra cosa" })).status, 401);
  assert.equal((await abrir({ whatsapp: ADMIN, clave: "" })).status, 401);

  // Las dos juntas, sí.
  const bien = await abrir({ whatsapp: ADMIN, clave: "PeronGeselino" });
  assert.equal(bien.status, 200);
  const datos = await bien.json();
  assert.ok(datos.secciones.length >= 5, "devuelve el contenido");
  assert.ok(datos.secciones.some((s) => s.modulos?.length), "incluye los módulos del panel");

  // Y con la llave puesta, queda abierta.
  const cookie = cookieFrom(bien);
  assert.ok(cookie.startsWith("pg_guia="));
  const otra = await fetch(url, { headers: { cookie } });
  assert.equal(otra.status, 200);
});

test("la guía no viaja en el programa que baja el navegador", async () => {
  // Si el texto estuviera del lado del cliente, el candado sería un adorno.
  const html = await (await fetch(`${base}/peronismogeselino/`)).text();
  const script = html.match(/src="([^"]*\.js)"/)?.[1];
  assert.ok(script, "hay un archivo de programa");
  const codigo = await (await fetch(`${base}${script}`)).text();
  assert.ok(
    !codigo.includes("La bandeja de entrada del portal"),
    "el contenido de la guía no está en el programa",
  );
});

test("segundo factor: el código de seis dígitos es el estándar y tolera el reloj", async () => {
  const { generarSecreto, codigoActual, codigoValido } = await import("../totp.js");
  const secreto = generarSecreto();
  const ahora = 1_800_000_000_000;

  assert.match(codigoActual(secreto, ahora), /^\d{6}$/);
  assert.ok(codigoValido(secreto, codigoActual(secreto, ahora), ahora));

  // Un reloj corrido 30 segundos para cualquier lado sigue entrando.
  assert.ok(codigoValido(secreto, codigoActual(secreto, ahora - 30_000), ahora));
  assert.ok(codigoValido(secreto, codigoActual(secreto, ahora + 30_000), ahora));
  // Dos minutos de diferencia, no.
  assert.equal(codigoValido(secreto, codigoActual(secreto, ahora - 120_000), ahora), false);

  assert.equal(codigoValido(secreto, "000000", ahora) && codigoActual(secreto, ahora) !== "000000", false);
  assert.equal(codigoValido(secreto, "", ahora), false);
  assert.equal(codigoValido(secreto, "12345", ahora), false);

  // Dos secretos distintos no comparten código.
  assert.notEqual(codigoActual(secreto, ahora), codigoActual(generarSecreto(), ahora));
});

test("segundo factor: con el WhatsApp y la clave no alcanza", async () => {
  const { codigoActual } = await import("../totp.js");
  const { cookie } = await login(ADMIN, { clave: CLAVE_ADMIN });

  // Se prepara y se confirma con un código real.
  const prep = await fetch(`${base}/peronismogeselino/api/admin/segundo-factor/preparar`, {
    method: "POST",
    headers: { cookie },
  });
  assert.equal(prep.status, 200);
  const { secreto, direccion } = await prep.json();
  assert.ok(direccion.startsWith("otpauth://totp/"), "trae la dirección para la app");

  const limpio = secreto.replace(/\s/g, "");
  const activar = await fetch(`${base}/peronismogeselino/api/admin/segundo-factor/activar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ codigo: codigoActual(limpio) }),
  });
  assert.equal(activar.status, 200);
  const { codigos } = await activar.json();
  assert.equal(codigos.length, 8, "entrega códigos de recuperación");

  // Ahora el WhatsApp y la clave, solos, no entran.
  const sinCodigo = await login(ADMIN, { clave: CLAVE_ADMIN });
  assert.equal(sinCodigo.response.status, 401);
  const cuerpo = await sinCodigo.response.json();
  assert.equal(cuerpo.codigoRequerido, true);

  // Un código inventado tampoco.
  assert.equal((await login(ADMIN, { clave: CLAVE_ADMIN, codigo: "111111" })).response.status, 401);

  // El código real, sí.
  const conCodigo = await login(ADMIN, { clave: CLAVE_ADMIN, codigo: codigoActual(limpio) });
  assert.equal(conCodigo.response.status, 200);

  // Un código de recuperación sirve una vez y se quema.
  const primera = await login(ADMIN, { clave: CLAVE_ADMIN, codigo: codigos[0] });
  assert.equal(primera.response.status, 200);
  const segunda = await login(ADMIN, { clave: CLAVE_ADMIN, codigo: codigos[0] });
  assert.equal(segunda.response.status, 401, "el código de recuperación no se reusa");

  // Y se puede desactivar, pero solo con la clave.
  const sesion = conCodigo.cookie;
  const sinClave = await fetch(`${base}/peronismogeselino/api/admin/segundo-factor/desactivar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: sesion },
    body: JSON.stringify({ clave: "otra" }),
  });
  assert.equal(sinClave.status, 401);
  const bien = await fetch(`${base}/peronismogeselino/api/admin/segundo-factor/desactivar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: sesion },
    body: JSON.stringify({ clave: CLAVE_ADMIN }),
  });
  assert.equal(bien.status, 200);
  assert.equal((await login(ADMIN, { clave: CLAVE_ADMIN })).response.status, 200);
});

test("segundo factor: nadie se lo saca a otro, y el panel exige sesión", async () => {
  // Sin sesión, ninguna ruta del panel responde.
  for (const ruta of ["/admin/segundo-factor", "/admin/members", "/admin/pending"]) {
    const r = await fetch(`${base}/peronismogeselino/api${ruta}`);
    assert.equal(r.status, 401, `${ruta} sin sesión`);
  }

  // Un editor no puede activarse un segundo factor ni tocar el de nadie:
  // las rutas trabajan siempre sobre la cuenta propia.
  const { cookie } = await login(EDITOR);
  const intento = await fetch(`${base}/peronismogeselino/api/admin/segundo-factor/preparar`, {
    method: "POST",
    headers: { cookie },
  });
  assert.equal(intento.status, 403);
});

test("caché: la página y el motor nunca se guardan; los archivos con huella, para siempre", async () => {
  const pedir = (ruta) => fetch(`${base}${ruta}`);
  const cache = async (ruta) => (await pedir(ruta)).headers.get("cache-control") || "";

  // La página dice qué versión hay que usar: si se guarda, se sigue viendo la
  // versión vieja después de publicar. Este fue un error real.
  for (const ruta of ["/peronismogeselino/", "/peronismogeselino/instalar"]) {
    const valor = await cache(ruta);
    assert.match(valor, /no-cache/, `${ruta} no se puede guardar (dio "${valor}")`);
  }

  // El service worker, ni el navegador ni la red de distribución: gobierna
  // todo lo demás, y una copia vieja congela la app entera.
  const sw = await cache("/peronismogeselino/sw.js");
  assert.match(sw, /no-store/, `sw.js no se puede guardar (dio "${sw}")`);
  const swCdn =
    (await pedir("/peronismogeselino/sw.js")).headers.get("cdn-cache-control") || "";
  assert.match(swCdn, /no-store/, "tampoco la red de distribución");

  // Y la página lo pide con un sello distinto en cada versión, para que una
  // copia guardada en el borde no pueda servirse igual.
  const paginaHtml = await (await pedir("/peronismogeselino/")).text();
  const programa = paginaHtml.match(/\/peronismogeselino\/(assets\/index-[^"]+\.js)/)?.[1];
  const fuente = await (await pedir(`/peronismogeselino/${programa}`)).text();
  assert.ok(fuente.includes("sw.js?v="), "el motor se pide con sello de versión");

  // Los archivos con huella en el nombre sí, para siempre: si cambian, cambia
  // el nombre.
  const html = await (await pedir("/peronismogeselino/")).text();
  const archivo = html.match(/\/peronismogeselino\/(assets\/index-[^"]+\.js)/)?.[1];
  assert.ok(archivo, "la página apunta a un archivo con huella");
  const conHuella = await cache(`/peronismogeselino/${archivo}`);
  assert.match(conHuella, /immutable/, `los archivos con huella se guardan (dio "${conHuella}")`);
});

// PNG 1x1 mínimo válido, en base64.
const PNG_1x1 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

test("fotos: un editor sube una imagen válida y se sirve; un archivo falso se rechaza", async () => {
  crearMiembro({ phone: "2255410010", name: "Foto Editor", role: "editor" });
  const { cookie } = await login("2255410010");

  // Un archivo que dice ser imagen pero no lo es: rechazado.
  const falso = await fetch(`${base}/peronismogeselino/api/admin/media`, {
    method: "POST",
    headers: { "Content-Type": "image/png", cookie },
    body: Buffer.from("esto no es una imagen"),
  });
  assert.equal(falso.status, 400);

  // Un PNG de verdad: aceptado.
  const png = Buffer.from(PNG_1x1, "base64");
  const ok = await fetch(`${base}/peronismogeselino/api/admin/media`, {
    method: "POST",
    headers: { "Content-Type": "image/png", cookie },
    body: png,
  });
  assert.equal(ok.status, 200);
  const { url } = await ok.json();
  assert.match(url, /^\/peronismogeselino\/subidas\/[a-f0-9]{16}\.png$/);

  // La foto subida se sirve de verdad.
  const servida = await fetch(`${base}${url}`);
  assert.equal(servida.status, 200);
  assert.match(servida.headers.get("content-type") || "", /image\/png/);

  // Aparece en el listado.
  const lista = await (await fetch(`${base}/peronismogeselino/api/admin/media`, { headers: { cookie } })).json();
  assert.ok(lista.items.some((i) => i.url === url));
});

test("fotos: un miembro común no puede subir", async () => {
  const { cookie } = await login(VECINA);
  const r = await fetch(`${base}/peronismogeselino/api/admin/media`, {
    method: "POST",
    headers: { "Content-Type": "image/png", cookie },
    body: Buffer.from(PNG_1x1, "base64"),
  });
  assert.equal(r.status, 403);
});

test("fotos: la agenda guarda y publica su foto, sin filtrar la ubicación", async () => {
  const { cookie } = await login(ADMIN, { clave: CLAVE_ADMIN });
  const foto = "/peronismogeselino/subidas/abc123def4567890.png";

  const creada = await fetch(`${base}/peronismogeselino/api/admin/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({
      title: "Acto con foto",
      startsAt: "2026-12-01T18:00",
      status: "published",
      visibility: "members",
      address: "Calle secreta 123",
      image: foto,
    }),
  });
  assert.equal(creada.status, 200);

  // El público ve la foto pero no la dirección de una actividad de miembros.
  const pub = await (await fetch(`${base}/peronismogeselino/api/public/events`)).json();
  const evento = pub.events.find((e) => e.title === "Acto con foto");
  assert.ok(evento, "la actividad aparece");
  assert.equal(evento.image, foto, "la foto sí es pública");
  assert.equal(evento.address, undefined, "la dirección sigue oculta");
});

test("fotos: una foto con encuadre pegado sigue contando como en uso", async () => {
  const { cookie } = await login(ADMIN, { clave: CLAVE_ADMIN });

  // Subir una foto real.
  const subida = await fetch(`${base}/peronismogeselino/api/admin/media`, {
    method: "POST",
    headers: { "Content-Type": "image/png", cookie },
    body: Buffer.from(PNG_1x1, "base64"),
  });
  const { url, nombre } = await subida.json();

  // Usarla en una noticia, con el encuadre pegado a la dirección.
  await fetch(`${base}/peronismogeselino/api/admin/news`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ title: "Nota con encuadre", image: `${url}#e=48,22`, status: "draft" }),
  });

  // Borrarla tiene que avisar que está en uso, no borrarla en silencio.
  const intento = await fetch(`${base}/peronismogeselino/api/admin/media/${nombre}`, {
    method: "DELETE",
    headers: { cookie },
  });
  assert.equal(intento.status, 409, "avisa que está en uso");
  const cuerpo = await intento.json();
  assert.ok(cuerpo.usos.some((u) => u.includes("Nota con encuadre")));
});

test("agenda: vivas y vencidas nunca se mezclan, y el cierre manda", async () => {
  const { ahoraLocal } = await import("../util.js");
  const { cookie } = await login(ADMIN, { clave: CLAVE_ADMIN });
  const ahora = ahoraLocal();
  const dia = (dias) => {
    const d = new Date(`${ahora}:00`);
    d.setDate(d.getDate() + dias);
    return d.toISOString().slice(0, 16);
  };
  const crear = (title, startsAt, endsAt) =>
    fetch(`${base}/peronismogeselino/api/admin/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ title, startsAt, endsAt, status: "published" }),
    });

  // El caso que fallaba: empezó hace 5 días pero vence en 5. Sigue viva.
  await crear("Larga todavía viva", dia(-5), dia(5));
  // Venció ayer: afuera en el momento en que venció.
  await crear("Vencida ayer", dia(-5), dia(-1));
  // Sin cierre, fue ayer: desaparece al día siguiente.
  await crear("De ayer sin cierre", dia(-1), "");
  // Sin cierre, es hoy: viva todo el día aunque la hora ya haya pasado.
  await crear("De hoy sin cierre", `${ahora.slice(0, 10)}T00:05`, "");

  const publica = await (await fetch(`${base}/peronismogeselino/api/public/events`)).json();
  const titulos = publica.events.map((e) => e.title);

  assert.ok(titulos.includes("Larga todavía viva"), "una actividad con cierre futuro sigue viva");
  assert.ok(titulos.includes("De hoy sin cierre"), "la de hoy vive hasta la medianoche");
  assert.ok(!titulos.includes("Vencida ayer"), "la vencida desaparece");
  assert.ok(!titulos.includes("De ayer sin cierre"), "sin cierre, desaparece al día siguiente");

  // Y el orden es cronológico por inicio.
  const inicios = publica.events.map((e) => e.startsAt);
  assert.deepEqual(inicios, [...inicios].sort(), "orden cronológico");
});

test("video: cualquier forma del enlace de YouTube se guarda canónica; otra cosa se rechaza", async () => {
  const { youtubeId, normalizarVideo } = await import("../util.js");
  for (const forma of [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ?si=abc123",
    "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    "https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=30s",
    "youtube.com/live/dQw4w9WgXcQ",
  ]) {
    assert.equal(youtubeId(forma), "dQw4w9WgXcQ", `falló con ${forma}`);
  }
  assert.equal(normalizarVideo("").valor, "", "vacío es válido: sin video");
  assert.ok(normalizarVideo("https://vimeo.com/12345").error, "otro sitio se rechaza");
  assert.ok(normalizarVideo("cualquier texto").error);

  // Por el API: se guarda canónico y sale en el portal.
  const { cookie } = await login(ADMIN, { clave: CLAVE_ADMIN });
  const alta = await fetch(`${base}/peronismogeselino/api/admin/news`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({
      title: "Nota con video",
      video: "https://youtu.be/dQw4w9WgXcQ?si=xyz",
      status: "published",
    }),
  });
  assert.equal(alta.status, 200);

  const rechazo = await fetch(`${base}/peronismogeselino/api/admin/news`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ title: "Video trucho", video: "https://malicioso.example/v.mp4" }),
  });
  assert.equal(rechazo.status, 400, "un enlace que no es de YouTube no entra");

  const portada = await (await fetch(`${base}/peronismogeselino/api/public/home`)).json();
  const nota = portada.news.find((n) => n.title === "Nota con video");
  assert.equal(nota.video, "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "guardado canónico");
});

test("compartir una nota muestra la nota, no la placa genérica de la app", async () => {
  const { cookie } = await login(ADMIN, { clave: CLAVE_ADMIN });
  await fetch(`${base}/peronismogeselino/api/admin/news`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({
      title: "Gira por Tandil & Necochea",
      summary: "Barrera acompañará a Ferraresi.",
      image: "/peronismogeselino/subidas/aaaa111122223333.jpg#e=48,22",
      status: "published",
    }),
  });

  const html = await (
    await fetch(`${base}/peronismogeselino/noticias/gira-por-tandil-necochea`)
  ).text();

  assert.ok(
    html.includes('og:title" content="Gira por Tandil &amp; Necochea"'),
    "el título de la vista previa es el de la nota (y escapado)",
  );
  assert.ok(html.includes("Barrera acompañará a Ferraresi."), "la descripción es el resumen");
  assert.ok(
    html.includes("/peronismogeselino/subidas/aaaa111122223333.jpg"),
    "la imagen es la de la nota",
  );
  assert.ok(!html.includes("#e="), "el encuadre no viaja en la vista previa");
  assert.ok(
    html.includes("<title>Gira por Tandil &amp; Necochea — Peronismo Geselino</title>"),
    "el título de la pestaña también",
  );

  // Una nota con video usa la miniatura del video.
  const conVideo = await (
    await fetch(`${base}/peronismogeselino/noticias/nota-con-video`)
  ).text();
  assert.ok(
    conVideo.includes("i.ytimg.com/vi/dQw4w9WgXcQ"),
    "con video, la vista previa es la miniatura del video",
  );

  // El resto de las páginas conservan la vista previa genérica.
  const portada = await (await fetch(`${base}/peronismogeselino/`)).text();
  assert.ok(portada.includes('og:title" content="Peronismo Geselino"'));

  // Una nota inexistente o en borrador no filtra nada.
  const inexistente = await (
    await fetch(`${base}/peronismogeselino/noticias/no-existe`)
  ).text();
  assert.ok(inexistente.includes('og:title" content="Peronismo Geselino"'));
});

test("compartir una actividad de la agenda muestra su foto y título", async () => {
  const { cookie } = await login(ADMIN, { clave: CLAVE_ADMIN });
  const creada = await fetch(`${base}/peronismogeselino/api/admin/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({
      title: "Gustavo junto a Jorge Ferraresi",
      summary: "Encuentro por obras para Villa Gesell.",
      startsAt: "2026-08-14T12:00",
      status: "published",
      image: "/peronismogeselino/subidas/bbbb222233334444.jpg#e=50,30",
    }),
  });
  const { id } = await creada.json();

  const html = await (await fetch(`${base}/peronismogeselino/agenda/${id}`)).text();
  assert.ok(
    html.includes('og:title" content="Gustavo junto a Jorge Ferraresi"'),
    "el título de la vista previa es el de la actividad",
  );
  assert.ok(html.includes("Encuentro por obras para Villa Gesell."), "la descripción es el resumen");
  assert.ok(
    html.includes("/peronismogeselino/subidas/bbbb222233334444.jpg"),
    "la imagen es la de la actividad",
  );
  assert.ok(!html.includes("#e="), "el encuadre no viaja en la vista previa");

  // La lista completa y una actividad inexistente conservan la placa genérica.
  const lista = await (await fetch(`${base}/peronismogeselino/agenda`)).text();
  assert.ok(lista.includes('og:title" content="Peronismo Geselino"'));
  const inexistente = await (await fetch(`${base}/peronismogeselino/agenda/999999`)).text();
  assert.ok(inexistente.includes('og:title" content="Peronismo Geselino"'));
});

test("adjunto: se sube un PDF y una nota lo ofrece para descargar", async () => {
  const { cookie } = await login(ADMIN, { clave: CLAVE_ADMIN });

  // Un archivo que no es PDF: rechazado.
  const falso = await fetch(`${base}/peronismogeselino/api/admin/media/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/pdf", cookie },
    body: Buffer.from("no soy un pdf"),
  });
  assert.equal(falso.status, 400);

  // Un PDF de verdad (empieza con %PDF-).
  const pdf = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(2048, 0x20), Buffer.from("\n%%EOF")]);
  const subida = await fetch(`${base}/peronismogeselino/api/admin/media/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/pdf", cookie },
    body: pdf,
  });
  assert.equal(subida.status, 200);
  const { url, nombre } = await subida.json();
  assert.match(url, /^\/peronismogeselino\/subidas\/[a-f0-9]{16}\.pdf$/);

  // Se sirve como PDF.
  const servido = await fetch(`${base}${url}`);
  assert.equal(servido.status, 200);
  assert.match(servido.headers.get("content-type") || "", /application\/pdf/);

  // Una nota con el PDF adjunto lo devuelve al público.
  await fetch(`${base}/peronismogeselino/api/admin/news`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({
      title: "Guía para militantes",
      attachment: url,
      attachmentName: "Guia_Peronismo_Geselino.pdf",
      status: "published",
    }),
  });
  const nota = await (
    await fetch(`${base}/peronismogeselino/api/public/news/guia-para-militantes`)
  ).json();
  assert.equal(nota.item.attachment, url, "la nota expone el PDF");
  assert.equal(nota.item.attachment_name, "Guia_Peronismo_Geselino.pdf");

  // Un adjunto que no sea un PDF de la propia carpeta se descarta.
  await fetch(`${base}/peronismogeselino/api/admin/news`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({
      title: "Nota con adjunto trucho",
      attachment: "https://malicioso.example/x.pdf",
      status: "published",
    }),
  });
  const trucha = await (
    await fetch(`${base}/peronismogeselino/api/public/news/nota-con-adjunto-trucho`)
  ).json();
  assert.equal(trucha.item.attachment, "", "un enlace externo no se guarda como adjunto");

  // Borrar el PDF en uso avisa antes.
  const borrar = await fetch(`${base}/peronismogeselino/api/admin/media/${nombre}`, {
    method: "DELETE",
    headers: { cookie },
  });
  assert.equal(borrar.status, 409, "el PDF en uso no se borra en silencio");
});

test("una noticia puede incrustar una publicación (Instagram/X/YouTube)", async () => {
  const { cookie } = await login(ADMIN, { clave: CLAVE_ADMIN });
  await fetch(`${base}/peronismogeselino/api/admin/news`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({
      title: "Reel de Gustavo en el barrio",
      slug: "reel-gustavo-barrio",
      status: "published",
      embed: "https://www.instagram.com/reel/Db8LTSjuF7j/?igsh=abc123",
    }),
  });
  const nota = await (
    await fetch(`${base}/peronismogeselino/api/public/news/reel-gustavo-barrio`)
  ).json();
  assert.equal(
    nota.item.embed,
    "https://www.instagram.com/reel/Db8LTSjuF7j/?igsh=abc123",
    "la publicación incrustada se guarda y se entrega",
  );
});

test("una noticia guarda y entrega una galería de fotos", async () => {
  const { cookie } = await login(ADMIN, { clave: CLAVE_ADMIN });
  await fetch(`${base}/peronismogeselino/api/admin/news`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({
      title: "Recorrida por el barrio",
      slug: "recorrida-barrio",
      status: "published",
      gallery: [
        "/peronismogeselino/subidas/aaaa000011112222.jpg",
        "/peronismogeselino/subidas/bbbb000011112222.jpg",
        "",
      ],
    }),
  });
  const nota = await (
    await fetch(`${base}/peronismogeselino/api/public/news/recorrida-barrio`)
  ).json();
  assert.deepEqual(
    nota.item.gallery,
    [
      "/peronismogeselino/subidas/aaaa000011112222.jpg",
      "/peronismogeselino/subidas/bbbb000011112222.jpg",
    ],
    "la galería se guarda como lista y descarta los vacíos",
  );
});
