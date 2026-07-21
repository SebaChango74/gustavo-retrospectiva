import { Router } from "express";
import { intIn, parseJson } from "../util.js";

export function quizRoutes(db) {
  const router = Router();

  // Entrega el set de juego: hasta 50 preguntas habilitadas, barajadas en el
  // servidor. Incluye la respuesta correcta y la explicación porque el juego
  // muestra la corrección después de cada pregunta.
  router.get("/questions", (_req, res) => {
    const rows = db
      .prepare(`
        SELECT id, category, prompt, options, correct_option, explanation,
          source_title, source_url
        FROM questions WHERE enabled = 1
      `)
      .all();
    const shuffled = shuffle(rows).slice(0, 50);
    res.json({
      total: shuffled.length,
      secondsPerQuestion: 10,
      questions: shuffled.map((row) => ({
        id: row.id,
        category: row.category,
        prompt: row.prompt,
        options: parseJson(row.options, []),
        correctOption: row.correct_option,
        explanation: row.explanation,
        sourceTitle: row.source_title,
        sourceUrl: row.source_url,
      })),
    });
  });

  // Métricas anónimas: solo guarda cuántas correctas hubo y la duración.
  // Si hay sesión iniciada se asocia el id de miembro; si no, queda anónimo.
  router.post("/results", (req, res) => {
    const total = intIn(req.body?.total, 1, 50, 50);
    const correct = intIn(req.body?.correct, 0, total, 0);
    const durationMs = intIn(req.body?.durationMs, 0, 3_600_000, 0);
    const score = Math.round((correct / total) * 100);

    const recent = db
      .prepare(
        "SELECT COUNT(*) AS n FROM quiz_results WHERE created_at > datetime('now', '-1 minute')",
      )
      .get().n;
    if (recent > 120) {
      return res.json({ ok: true, score });
    }

    db.prepare(
      "INSERT INTO quiz_results (correct, total, score, duration_ms, member_id) VALUES (?, ?, ?, ?, ?)",
    ).run(correct, total, score, durationMs || null, req.member?.id ?? null);
    res.json({ ok: true, score });
  });

  return router;
}

function shuffle(list) {
  const array = [...list];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
