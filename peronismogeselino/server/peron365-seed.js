// Corpus inicial de PERÓN 365.
// IMPORTANTE: es un arranque documentado de muestra. Antes del lanzamiento,
// el equipo debe repasar cada frase desde el panel (módulo Perón 365) y
// ampliar el corpus. Solo las frases «verificadas» entran al selector diario.

const VERDADES = "Las Veinte Verdades del Justicialismo · Plaza de Mayo";
const VERDADES_URL = "https://www.elhistoriador.com.ar/las-veinte-verdades-del-justicialismo/";
const CGT73 = "Discurso en la Confederación General del Trabajo";
const CGT73_URL =
  "https://cedinpe.unsam.edu.ar/content/per%C3%B3n-juan-d-per%C3%B3n-habla-los-trabajadores-diciembre-73";

export const PERON365_SEED = [
  {
    text: "Mejor que decir es hacer.",
    shortText: "Mejor que decir es hacer.",
    sourceTitle: CGT73,
    sourceType: "discurso",
    sourceDate: "27 de diciembre de 1973",
    sourceUrl: CGT73_URL,
    context:
      "En su último diciembre, Perón volvió a la CGT para hablarles directamente a los trabajadores y repasar la doctrina con la que había gobernado.",
    topic: "doctrina",
    status: "verified",
  },
  {
    text: "Mejor que decir es hacer, mejor que prometer es realizar.",
    shortText: "Mejor que prometer es realizar.",
    sourceTitle: VERDADES,
    sourceType: "discurso",
    sourceDate: "17 de octubre de 1950",
    sourceUrl: VERDADES_URL,
    context:
      "Quinta de las Veinte Verdades proclamadas ante la Plaza de Mayo en el Día de la Lealtad de 1950.",
    topic: "doctrina",
    status: "verified",
  },
  {
    text: "La verdadera democracia es aquella donde el gobierno hace lo que el pueblo quiere y defiende un solo interés: el del pueblo.",
    shortText: "La verdadera democracia defiende un solo interés: el del pueblo.",
    sourceTitle: VERDADES,
    sourceType: "discurso",
    sourceDate: "17 de octubre de 1950",
    sourceUrl: VERDADES_URL,
    context: "Primera de las Veinte Verdades del Justicialismo.",
    topic: "democracia",
    status: "verified",
  },
  {
    text: "En la Nueva Argentina los únicos privilegiados son los niños.",
    shortText: "Los únicos privilegiados son los niños.",
    sourceTitle: VERDADES,
    sourceType: "discurso",
    sourceDate: "17 de octubre de 1950",
    sourceUrl: VERDADES_URL,
    context:
      "Duodécima de las Veinte Verdades, síntesis de las políticas de infancia de la época.",
    topic: "infancia",
    status: "verified",
  },
  {
    text: "El trabajo es un derecho que crea la dignidad del hombre; y es un deber, porque es justo que cada uno produzca por lo menos lo que consume.",
    shortText: "El trabajo es un derecho que crea la dignidad del hombre.",
    sourceTitle: VERDADES,
    sourceType: "discurso",
    sourceDate: "17 de octubre de 1950",
    sourceUrl: VERDADES_URL,
    context: "Décima de las Veinte Verdades del Justicialismo.",
    topic: "trabajo",
    status: "verified",
  },
  {
    text: "La política no es para nosotros un fin, sino sólo el medio para el bien de la Patria, que es la felicidad de sus hijos y la grandeza nacional.",
    shortText: "La política es el medio para el bien de la Patria.",
    sourceTitle: VERDADES,
    sourceType: "discurso",
    sourceDate: "17 de octubre de 1950",
    sourceUrl: VERDADES_URL,
    context: "Sexta de las Veinte Verdades del Justicialismo.",
    topic: "política",
    status: "verified",
  },
  {
    text: "Para un peronista no puede haber nada mejor que otro peronista.",
    shortText: "Nada mejor que otro peronista.",
    sourceTitle: VERDADES,
    sourceType: "discurso",
    sourceDate: "17 de octubre de 1950",
    sourceUrl: VERDADES_URL,
    context:
      "Octava de las Veinte Verdades. En 1973, buscando la unidad nacional, el propio Perón la reformuló: «para un argentino no puede haber nada mejor que otro argentino».",
    topic: "unidad",
    status: "verified",
  },
  {
    text: "Todo en su medida y armoniosamente.",
    shortText: "Todo en su medida y armoniosamente.",
    sourceTitle: "Mensaje al país por cadena nacional",
    sourceType: "discurso",
    sourceDate: "21 de junio de 1973",
    sourceUrl: "https://www.elhistoriador.com.ar/",
    context:
      "Tras su regreso definitivo, Perón llamó a la pacificación y al orden en uno de sus mensajes más recordados.",
    topic: "unidad",
    status: "verified",
  },
  {
    text: "El año 2000 nos encontrará unidos o dominados.",
    shortText: "Unidos o dominados.",
    sourceTitle: "La hora de los pueblos",
    sourceType: "libro",
    sourceDate: "1968",
    sourceUrl: "https://www.elhistoriador.com.ar/",
    context:
      "Advertencia sobre la integración latinoamericana escrita durante el exilio.",
    topic: "latinoamérica",
    status: "verified",
  },
  {
    text: "La única verdad es la realidad.",
    shortText: "La única verdad es la realidad.",
    sourceTitle: "Conducción política",
    sourceType: "libro",
    sourceDate: "1951",
    sourceUrl: "https://www.elhistoriador.com.ar/",
    context:
      "Máxima de raíz aristotélica que Perón adoptó como principio de conducción. Pendiente de localizar la página exacta.",
    topic: "doctrina",
    status: "in_review",
  },
  {
    text: "La organización vence al tiempo.",
    shortText: "La organización vence al tiempo.",
    sourceTitle: "Atribuida · doctrina peronista",
    sourceType: "atribuida",
    sourceDate: "",
    sourceUrl: "",
    context: "Frase de amplia circulación militante. Pendiente de fuente primaria.",
    topic: "organización",
    status: "in_review",
  },
  {
    text: "Gobernar es crear trabajo.",
    shortText: "Gobernar es crear trabajo.",
    sourceTitle: "Atribuida",
    sourceType: "atribuida",
    sourceDate: "",
    sourceUrl: "",
    context: "Pendiente de verificación documental.",
    topic: "trabajo",
    status: "in_review",
  },
];

export function seedPeron365(db) {
  const count = db.prepare("SELECT COUNT(*) AS n FROM peron365_quotes").get().n;
  if (count > 0) return;
  const insert = db.prepare(`
    INSERT INTO peron365_quotes (text, short_text, source_title, source_type, source_date,
      source_url, historical_context, topic, verification_status, verified_by, verified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'verified' THEN datetime('now') ELSE NULL END)
  `);
  for (const q of PERON365_SEED) {
    insert.run(
      q.text,
      q.shortText,
      q.sourceTitle,
      q.sourceType,
      q.sourceDate,
      q.sourceUrl,
      q.context,
      q.topic,
      q.status,
      q.status === "verified" ? "corpus inicial (revisar)" : "",
      q.status,
    );
  }
}
