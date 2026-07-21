// Contenido inicial: replica el contenido aprobado del prototipo para que el
// portal se vea igual desde el primer arranque. Todo es editable desde el panel.

import { QUESTIONS_SEED } from "./questions-seed.js";

const IMG = "/peronismogeselino/images";

export function seed(db) {
  seedQuestions(db);
  const hasNews = db.prepare("SELECT COUNT(*) AS n FROM news").get().n > 0;
  if (hasNews) return;

  const now = new Date().toISOString();

  const insertNews = db.prepare(`
    INSERT INTO news (slug, tag, title, summary, body, image, featured, status, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?)
  `);
  insertNews.run(
    "barrera-llevo-a-nacion-los-reclamos",
    "Villa Gesell",
    "Barrera llevó a Nación los reclamos de Villa Gesell",
    "Un pedido formal para defender obras, recursos y derechos que pertenecen a los geselinos.",
    "El intendente presentó una nota formal ante el jefe de Gabinete de Ministros de la Nación para solicitar una audiencia y llevar los reclamos prioritarios de Villa Gesell: defensa de obras públicas pendientes, recursos para sostener servicios locales y protección del beneficio de Zona Fría.",
    `${IMG}/gestion-obras.jpg`,
    1,
    "2026-07-14T12:00:00.000Z",
  );
  insertNews.run(
    "220-familias-regularizacion-hogares",
    "Provincia",
    "Más de 220 familias avanzaron en la regularización de sus hogares",
    "La Provincia entregó escrituras y boletos de compraventa para ampliar el acceso al hábitat.",
    "",
    `${IMG}/comunidad-grupo.jpg`,
    0,
    "2026-07-20T12:00:00.000Z",
  );
  insertNews.run(
    "peatonal-de-las-infancias-convocatoria",
    "Comunidad",
    "Peatonal de las Infancias: convocatoria a instituciones geselinas",
    "Una propuesta abierta para construir una jornada cultural, educativa y comunitaria.",
    "",
    `${IMG}/gustavo-infancias.jpg`,
    0,
    "2026-07-15T12:00:00.000Z",
  );

  const causeId = db
    .prepare(`
      INSERT INTO causes (slug, title, summary, status_label, progress, progress_from,
        progress_next, lead_image, brief_body, bullets, key_fact_value, key_fact_label,
        next_steps, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
    `)
    .run(
      "defender-lo-que-le-corresponde-a-villa-gesell",
      "DEFENDER OBRAS, RECURSOS Y DERECHOS DE VILLA GESELL",
      "El seguimiento completo del pedido presentado por Gustavo Barrera ante Nación.",
      "EN GESTIÓN",
      72,
      "Pedido presentado",
      "Próximo paso: audiencia",
      `${IMG}/gestion-obras.jpg`,
      "El intendente presentó una nota formal ante el jefe de Gabinete de Ministros de la Nación para solicitar una audiencia y llevar los reclamos prioritarios de Villa Gesell.",
      JSON.stringify([
        "Defensa de obras públicas pendientes.",
        "Recursos necesarios para sostener servicios locales.",
        "Protección del beneficio de Zona Fría.",
      ]),
      "11.000+",
      "hogares geselinos alcanzados por el beneficio de Zona Fría.",
      JSON.stringify([
        "Confirmación de audiencia",
        "Presentación de documentos",
        "Respuesta del Gobierno nacional",
      ]),
    ).lastInsertRowid;

  const insertTimeline = db.prepare(`
    INSERT INTO cause_timeline (cause_id, date_label, title, body, state, position)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertTimeline.run(
    causeId,
    "09 JUL",
    "Los reclamos de los geselinos",
    "Se reúnen las prioridades vinculadas a gas, cloacas, obra pública y actividad turística.",
    "done",
    1,
  );
  insertTimeline.run(
    causeId,
    "14 JUL",
    "Presentación formal ante Nación",
    "Gustavo Barrera entrega el pedido de audiencia al jefe de Gabinete.",
    "done",
    2,
  );
  insertTimeline.run(
    causeId,
    "AHORA",
    "Esperando respuesta",
    "El municipio mantiene abierto el seguimiento institucional.",
    "current",
    3,
  );
  insertTimeline.run(
    causeId,
    "PRÓXIMO",
    "Audiencia y respuesta pública",
    "El resultado y los documentos se incorporarán a esta causa.",
    "pending",
    4,
  );

  // La ubicación es una muestra genérica de Villa Gesell; se reemplaza desde el
  // panel cuando llegue la dirección real.
  const eventId = db
    .prepare(`
      INSERT INTO events (title, summary, event_type, starts_at, place_name, address,
        google_maps_url, visibility, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'members', 'published')
    `)
    .run(
      "Pensar 2027",
      "Reunión del PJ geselino para trabajar estrategias de comunicación digital, compromiso partidario y puesta en marcha del Plan 2027.",
      "ACTIVIDAD DE LA COMUNIDAD",
      "2026-08-10T18:30",
      "Villa Gesell",
      "Villa Gesell, Buenos Aires, Argentina",
      "https://www.google.com/maps/search/?api=1&query=Villa+Gesell%2C+Buenos+Aires%2C+Argentina",
    ).lastInsertRowid;

  db.prepare(`
    INSERT INTO events (title, summary, event_type, starts_at, visibility, status)
    VALUES (?, ?, ?, ?, 'public', 'published')
  `).run(
    "Gustavo en Telefe",
    "Las consecuencias de la quita del beneficio de Zona Fría.",
    "ENTREVISTA · TELEVISIÓN",
    "2026-08-15T12:00",
  );

  const territories = [
    "Zona Centro",
    "Zona Sur",
    "Zona Norte",
    "Mar Azul",
    "Mar de las Pampas",
    "Las Gaviotas",
    "Monte Rincón",
  ];
  const insertTerritory = db.prepare("INSERT INTO territories (name) VALUES (?)");
  for (const name of territories) insertTerritory.run(name);

  db.prepare(`
    INSERT INTO threads (eyebrow, title, moderation_note, cause_id, pinned, status)
    VALUES (?, ?, ?, ?, 1, 'open')
  `).run(
    "CAUSA VIVA · ZONA FRÍA",
    "Cuanto más unidos estemos, menos frío vamos a pasar",
    "Abrimos esta conversación para conocer qué está pasando en cada barrio y organizar propuestas concretas. No publiques facturas ni datos personales.",
    causeId,
  );

  db.prepare(`
    INSERT INTO announcements (title, body, event_id, pinned, status)
    VALUES (?, ?, ?, 1, 'published')
  `).run(
    "PENSAR 2027",
    "Encuentro para trabajar comunicación digital, compromiso partidario y organización territorial.",
    eventId,
  );

  const settings = {
    stats_territorios: "23",
    stats_causas_activas: "2",
    stats_municipios: "135",
    community_cap: "500",
    portal_url: "gustavobarrera.com/peronismogeselino",
    map_default_query: "Villa Gesell, Buenos Aires, Argentina",
    seeded_at: now,
  };
  const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
  for (const [key, value] of Object.entries(settings)) insertSetting.run(key, value);
}

function seedQuestions(db) {
  const count = db.prepare("SELECT COUNT(*) AS n FROM questions").get().n;
  if (count > 0) return;
  const insert = db.prepare(`
    INSERT INTO questions (category, prompt, options, correct_option, explanation,
      source_title, source_url, difficulty, enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  for (const q of QUESTIONS_SEED) {
    insert.run(
      q.category,
      q.prompt,
      JSON.stringify(q.options),
      q.correctOption,
      q.explanation,
      q.sourceTitle,
      q.sourceUrl,
      q.difficulty,
    );
  }
}
