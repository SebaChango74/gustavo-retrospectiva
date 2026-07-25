import { test, before, after } from "node:test";
import assert from "node:assert/strict";

process.env.PG_DEV = "1";

const { openTestDb } = await import("../db.js");
const { createApp } = await import("../app.js");

let server;
let base;
let db;

function cookieFrom(response) {
  const header = response.headers.get("set-cookie") || "";
  return header.split(";")[0];
}

async function login(email) {
  const response = await fetch(`${base}/peronismogeselino/api/auth/dev`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return { response, cookie: cookieFrom(response) };
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

test("un correo sin invitación no puede ingresar", async () => {
  const { response } = await login("intruso@example.com");
  assert.equal(response.status, 403);
});

test("un miembro invitado ingresa y ve la comunidad; el público no", async () => {
  db.prepare(
    "INSERT INTO members (email, name, role, status) VALUES (?, ?, 'member', 'invited')",
  ).run("vecina@example.com", "Vecina Test");

  const anon = await fetch(`${base}/peronismogeselino/api/community/overview`);
  assert.equal(anon.status, 401);

  const { response, cookie } = await login("vecina@example.com");
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
  const { cookie: memberCookie } = await login("vecina@example.com");
  const denied = await fetch(`${base}/peronismogeselino/api/admin/news`, {
    headers: { cookie: memberCookie },
  });
  assert.equal(denied.status, 403);

  db.prepare(
    "INSERT INTO members (email, name, role, status) VALUES (?, ?, 'admin', 'active')",
  ).run("admin@example.com", "Admin Test");
  const { cookie: adminCookie } = await login("admin@example.com");
  const allowed = await fetch(`${base}/peronismogeselino/api/admin/news`, {
    headers: { cookie: adminCookie },
  });
  assert.equal(allowed.status, 200);
});

test("el foro guarda mensajes y la moderación puede ocultarlos", async () => {
  const { cookie } = await login("vecina@example.com");
  const posted = await fetch(`${base}/peronismogeselino/api/community/threads/1/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ body: "Mensaje de prueba" }),
  });
  assert.equal(posted.status, 200);
  const { id } = await posted.json();

  const { cookie: adminCookie } = await login("admin@example.com");
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
  const { cookie } = await login("admin@example.com");
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
  const response = await fetch(`${base}/peronismogeselino/api/auth/dev`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://sitio-malicioso.example" },
    body: JSON.stringify({ email: "admin@example.com" }),
  });
  assert.equal(response.status, 403);
});

test("blindaje: el ingreso de desarrollo se apaga solo al publicar", async () => {
  const { devLoginEnabled } = await import("../dev-login.js");
  const prevDev = process.env.PG_DEV;
  const prevPreview = process.env.PG_PREVIEW_CODE;
  const prevEnv = process.env.NODE_ENV;

  process.env.PG_DEV = "1";
  process.env.PG_PREVIEW_CODE = "clave";
  assert.equal(devLoginEnabled(), true, "privado con clave: habilitado");

  delete process.env.PG_PREVIEW_CODE;
  process.env.NODE_ENV = "production";
  assert.equal(devLoginEnabled(), false, "publicado sin clave: se apaga solo");

  process.env.PG_DEV = "0";
  assert.equal(devLoginEnabled(), false);

  process.env.PG_DEV = prevDev;
  if (prevPreview) process.env.PG_PREVIEW_CODE = prevPreview;
  process.env.NODE_ENV = prevEnv;
});

test("blindaje: no se puede escalar el propio rol", async () => {
  const { cookie } = await login("vecina@example.com");
  const attempt = await fetch(`${base}/peronismogeselino/api/admin/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ email: "nuevo@example.com", role: "admin" }),
  });
  assert.equal(attempt.status, 403, "un miembro no puede crear administradores");
});
