import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { Arrow, PeronometroLogo, ShareIcon } from "../ui";

const SECONDS = 10;
const PLATE_W = 1080;
const PLATE_H = 1350;
// URL oficial que lleva la placa compartible.
const PLATE_URL = "gustavobarrera.com/peronismogeselino/peronometro";

let plateArt: HTMLImageElement | null = null;
function loadPlateArt(): Promise<HTMLImageElement> {
  if (plateArt) return Promise.resolve(plateArt);
  const img = new Image();
  img.src = "/peronismogeselino/images/peronometro-placa.jpg";
  return img.decode().then(() => {
    plateArt = img;
    return img;
  });
}

type Question = {
  id: number;
  category: string;
  prompt: string;
  options: string[];
  correctOption: number;
  explanation: string;
  sourceTitle: string;
  sourceUrl: string;
};

type Phase = "intro" | "question" | "feedback" | "result";

type PlayQuestion = Question & { shuffledOptions: string[]; correctIndex: number };

function shuffleOptions(question: Question): PlayQuestion {
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    ...question,
    shuffledOptions: order.map((index) => question.options[index]),
    correctIndex: order.indexOf(question.correctOption),
  };
}

export function rangeFor(score: number): string {
  if (score <= 20) return "UNA VUELTA POR LA HISTORIA";
  if (score <= 40) return "MEMORIA EN CONSTRUCCIÓN";
  if (score <= 60) return "MILITANCIA CURIOSA";
  if (score <= 80) return "CORAZÓN JUSTICIALISTA";
  return "MEMORIA PERONISTA";
}

export default function Peronometro() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<PlayQuestion[]>([]);
  const [loadError, setLoadError] = useState("");
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(SECONDS);
  const [announcement, setAnnouncement] = useState("");
  const timerRef = useRef<number | null>(null);
  const deadlineRef = useRef(0);
  const startedAtRef = useRef(0);
  const resultSentRef = useRef(false);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);

  const total = questions.length;
  const current = questions[index] ?? null;

  useEffect(() => {
    api
      .get<{ questions: Question[] }>("/quiz/questions")
      .then((data) => {
        if (data.questions.length === 0) {
          setLoadError("El banco de preguntas todavía no está publicado.");
          return;
        }
        setQuestions(data.questions.map(shuffleOptions));
      })
      .catch(() => setLoadError("No pudimos cargar las preguntas. Probá de nuevo."));
    // precarga del arte de la placa para la pantalla final
    loadPlateArt().catch(() => {});
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finishQuestion = useCallback(
    (choice: number | null) => {
      clearTimer();
      setSelected(choice);
      if (choice != null && questions[index] && choice === questions[index].correctIndex) {
        setCorrectCount((count) => count + 1);
      }
      setPhase("feedback");
    },
    [clearTimer, index, questions],
  );

  const startTimer = useCallback(() => {
    clearTimer();
    // Fuente de tiempo monotónica: no se ve afectada por cambios de reloj.
    deadlineRef.current = performance.now() + SECONDS * 1000;
    setSecondsLeft(SECONDS);
    timerRef.current = window.setInterval(() => {
      const remainingMs = deadlineRef.current - performance.now();
      const remaining = Math.max(0, Math.ceil(remainingMs / 1000));
      setSecondsLeft((prev) => {
        if (remaining !== prev) {
          if (remaining === 5) setAnnouncement("Quedan 5 segundos.");
          if (remaining === 2) setAnnouncement("Quedan 2 segundos.");
        }
        return remaining;
      });
      if (remainingMs <= 0) {
        finishQuestion(null);
      }
    }, 100);
  }, [clearTimer, finishQuestion]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const start = () => {
    startedAtRef.current = performance.now();
    resultSentRef.current = false;
    setCorrectCount(0);
    setIndex(0);
    setSelected(null);
    setPhase("question");
    startTimer();
  };

  const next = () => {
    if (index + 1 >= total) {
      setPhase("result");
      return;
    }
    setIndex(index + 1);
    setSelected(null);
    setPhase("question");
    startTimer();
    window.setTimeout(() => questionHeadingRef.current?.focus(), 50);
  };

  useEffect(() => {
    if (phase === "result" && !resultSentRef.current) {
      resultSentRef.current = true;
      const durationMs = Math.round(performance.now() - startedAtRef.current);
      api.post("/quiz/results", { correct: correctCount, total, durationMs }).catch(() => {});
    }
  }, [phase, correctCount, total]);

  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return (
    <div className="inner-page peronometro-play">
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {phase === "intro" && (
        <section className="play-intro tech-grid">
          <button className="game-back" onClick={() => navigate("/juegos")}>
            ← VOLVER
          </button>
          <PeronometroLogo />
          <h1>¿QUÉ TAN PERONISTA SOS?</h1>
          <p>
            {total > 0
              ? `${total} preguntas · ${SECONDS} segundos por respuesta · sin vuelta atrás.`
              : loadError || "Cargando preguntas…"}
          </p>
          <ul className="play-rules">
            <li>Correcta: 1 punto. Incorrecta o sin responder: 0.</li>
            <li>Al final: tu porcentaje, tu rango y una placa para compartir.</li>
            <li>No guardamos ningún dato personal.</li>
          </ul>
          <button className="button button-game" onClick={start} disabled={total === 0}>
            EMPEZAR AHORA <Arrow />
          </button>
        </section>
      )}

      {(phase === "question" || phase === "feedback") && current && (
        <section className="play-stage">
          <div className="play-card">
            <div className="question-demo-top">
              <span>
                PREGUNTA {index + 1} / {total}
              </span>
              <strong aria-hidden="true">{String(secondsLeft).padStart(2, "0")}</strong>
            </div>
            <div
              className="timer-line"
              role="timer"
              aria-label={`${secondsLeft} segundos restantes`}
            >
              <span
                style={{
                  width: `${(secondsLeft / SECONDS) * 100}%`,
                  transition: phase === "question" ? "width .12s linear" : "none",
                }}
              />
            </div>
            <h3 ref={questionHeadingRef} tabIndex={-1}>
              {current.prompt}
            </h3>
            <div className="answer-grid live">
              {current.shuffledOptions.map((option, optionIndex) => {
                let className = "";
                if (phase === "feedback") {
                  if (optionIndex === current.correctIndex) className = "is-correct";
                  else if (optionIndex === selected) className = "is-wrong";
                  else className = "is-off";
                }
                return (
                  <button
                    key={optionIndex}
                    className={className}
                    disabled={phase === "feedback"}
                    onClick={() => finishQuestion(optionIndex)}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {phase === "feedback" && (
              <div className="play-feedback">
                <strong className={selected === current.correctIndex ? "ok" : "bad"}>
                  {selected == null
                    ? "SE ACABÓ EL TIEMPO."
                    : selected === current.correctIndex
                      ? "¡CORRECTO!"
                      : "NO ERA ESA."}
                </strong>
                <p>{current.explanation}</p>
                {current.sourceTitle && (
                  <small>
                    Fuente:{" "}
                    {current.sourceUrl ? (
                      <a href={current.sourceUrl} target="_blank" rel="noreferrer">
                        {current.sourceTitle}
                      </a>
                    ) : (
                      current.sourceTitle
                    )}
                  </small>
                )}
                <button className="button button-game" onClick={next}>
                  {index + 1 >= total ? "VER MI RESULTADO" : "SIGUIENTE"} <Arrow />
                </button>
              </div>
            )}
          </div>
          <div className="play-progress" aria-hidden="true">
            {correctCount} correctas hasta ahora
          </div>
        </section>
      )}

      {phase === "result" && (
        <ResultScreen score={score} correct={correctCount} total={total} onReplay={start} />
      )}
    </div>
  );
}

function ResultScreen({
  score,
  correct,
  total,
  onReplay,
}: {
  score: number;
  correct: number;
  total: number;
  onReplay: () => void;
}) {
  const navigate = useNavigate();
  const [alias, setAlias] = useState("");
  const [plateUrl, setPlateUrl] = useState("");
  const [shareNote, setShareNote] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const range = rangeFor(score);

  const drawPlate = useCallback(async () => {
    const canvas = canvasRef.current ?? document.createElement("canvas");
    canvasRef.current = canvas;
    canvas.width = PLATE_W;
    canvas.height = PLATE_H;
    const ctx = canvas.getContext("2d")!;
    await document.fonts.ready;

    // fondo: arte de collage aprobado (916×1717), recortado con foco en Perón
    ctx.fillStyle = "#07090c";
    ctx.fillRect(0, 0, PLATE_W, PLATE_H);
    try {
      const art = await loadPlateArt();
      const sourceWidth = art.naturalWidth;
      const sourceHeight = Math.round(sourceWidth * (PLATE_H / PLATE_W));
      const sourceY = Math.min(190, Math.max(0, art.naturalHeight - sourceHeight));
      ctx.drawImage(art, 0, sourceY, sourceWidth, sourceHeight, 0, 0, PLATE_W, PLATE_H);
    } catch {
      // sin el arte, la placa sale con fondo oscuro liso
    }
    // sombra suave para que el texto respire sobre el collage
    ctx.shadowColor = "rgba(0,0,0,.6)";
    ctx.shadowBlur = 22;

    const condensed = (size: number, weight = 900) =>
      `${weight} ${size}px "Barlow Condensed", "Arial Narrow", sans-serif`;
    const sans = (size: number, weight = 700) => `${weight} ${size}px Manrope, Arial, sans-serif`;

    // encabezado
    ctx.fillStyle = "#35e97c";
    ctx.font = sans(26, 800);
    ctx.fillText("MI RESULTADO", 90, 120);

    // logo Peronómetro: medidor
    const cx = 150;
    const cy = 240;
    const radius = 62;
    const segments: [string, number, number][] = [
      ["#17bff5", 220, 320],
      ["#35e97c", 320, 392],
      ["#ffd23f", 392, 464],
      ["#ff612f", 464, 515],
    ];
    for (const [color, from, to] of segments) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 26;
      ctx.arc(cx, cy, radius - 13, (from * Math.PI) / 180, (to * Math.PI) / 180);
      ctx.stroke();
    }
    // aguja
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((42 * Math.PI) / 180);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-5, -46, 10, 46);
    ctx.restore();
    ctx.beginPath();
    ctx.fillStyle = "#ff612f";
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fill();

    // palabras del logo
    ctx.fillStyle = "#ffffff";
    ctx.font = condensed(84);
    ctx.fillText("PERONÓ", 240, 226);
    ctx.fillStyle = "#17bff5";
    ctx.fillText("METRO", 240, 296);

    // porcentaje gigante, centro-izquierda (la zona oscura del arte)
    ctx.fillStyle = "#17bff5";
    ctx.font = condensed(330);
    ctx.fillText(`${score}%`, 80, 780);

    // rango (el espaciado posterior se acomoda según ocupe 1 o 2 líneas)
    ctx.fillStyle = "#ffffff";
    ctx.font = condensed(88);
    const rangeEndY = wrapText(ctx, range, 90, 910, 600, 88);

    // aciertos
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.font = sans(34, 600);
    const hitsY = rangeEndY + 74;
    ctx.fillText(`${correct} de ${total} respuestas correctas`, 90, hitsY);

    // desafío
    ctx.fillStyle = "#35e97c";
    ctx.font = condensed(64, 800);
    ctx.fillText("¿PODÉS SUPERARME?", 90, hitsY + 88);

    // alias opcional
    if (alias.trim()) {
      ctx.fillStyle = "#f3eadb";
      ctx.font = sans(32, 800);
      ctx.fillText(alias.trim().slice(0, 30), 90, hitsY + 145);
    }

    // pie
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.font = sans(26, 700);
    ctx.fillText(PLATE_URL, 90, 1285);

    setPlateUrl(canvas.toDataURL("image/png"));
  }, [alias, correct, range, score, total]);

  useEffect(() => {
    drawPlate();
  }, [drawPlate]);

  const download = () => {
    if (!plateUrl) return;
    const link = document.createElement("a");
    link.href = plateUrl;
    link.download = `peronometro-${score}.png`;
    link.click();
  };

  const share = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    const file = new File([blob], `peronometro-${score}.png`, { type: "image/png" });
    const text = `Saqué ${score}% en el Peronómetro: ${range}. ¿Podés superarme? ${PLATE_URL}`;
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text, title: "Peronómetro" });
        return;
      } catch {
        // cancelado: cae a la descarga
      }
    }
    download();
    setShareNote("Placa descargada: subila a WhatsApp o Instagram.");
  };

  return (
    <section className="play-result tech-grid">
      <div className="play-result-plate">
        {plateUrl && <img src={plateUrl} alt={`Placa del Peronómetro: ${score}%, ${range}`} />}
      </div>
      <div className="play-result-copy">
        <span className="game-edition">TU RESULTADO</span>
        <h1>
          {score}% · {range}
        </h1>
        <p>
          Respondiste bien {correct} de {total}. La placa está lista para WhatsApp o Instagram, en
          vertical y sin datos personales.
        </p>
        <label className="play-alias">
          <span>Tu nombre o alias en la placa (opcional)</span>
          <input
            value={alias}
            maxLength={30}
            onChange={(event) => setAlias(event.target.value)}
            placeholder="Ej: Seba de Zona Centro"
          />
        </label>
        <div className="play-result-actions">
          <button className="button button-game" onClick={share}>
            COMPARTIR PLACA <ShareIcon />
          </button>
          <button className="button button-sky" onClick={download}>
            DESCARGAR PNG
          </button>
          <button className="button button-outline-light" onClick={onReplay}>
            JUGAR DE NUEVO
          </button>
        </div>
        {shareNote && <p className="play-share-note">{shareNote}</p>}
        <button className="text-action" onClick={() => navigate("/juegos")}>
          ← Volver a Juegos
        </button>
      </div>
    </section>
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY;
}
