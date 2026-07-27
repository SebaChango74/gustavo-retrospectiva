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
    ["/pg", "/peronismogeselino/instalar"],
    ["/app", "/peronismogeselino/instalar"],
    ["/bajar", "/peronismogeselino/instalar"],
    ["/peronismo", "/peronismogeselino/"],
  ]) {
    const r = await fetch(`${base}${corta}`, { redirect: "manual" });
    assert.equal(r.status, 302, `${corta} debe redirigir`);
    assert.equal(r.headers.get("location"), destino);
  }

  // Y el destino existe de verdad.
  const destino = await fetch(`${base}/peronismogeselino/instalar`);
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
