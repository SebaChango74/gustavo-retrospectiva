// Banco inicial del Peronómetro: 50 preguntas (10 por categoría).
// IMPORTANTE: este banco debe pasar revisión histórica y editorial del equipo
// antes de publicarse. Todo es editable desde el panel (módulo Preguntas).

const EH = "El Historiador (Felipe Pigna)";
const EH_URL = "https://www.elhistoriador.com.ar/";
const BRIT = "Encyclopaedia Britannica";
const BRIT_URL = "https://www.britannica.com/biography/Juan-Peron";
const ARG = "Casa Rosada · Galería de presidentes";
const ARG_URL = "https://www.casarosada.gob.ar/nuestro-pais/galeria-de-presidentes";

export const QUESTIONS_SEED = [
  // ─── Biografía (10) ────────────────────────────────────────────────────────
  {
    category: "biography",
    prompt: "¿En qué localidad bonaerense nació Juan Domingo Perón?",
    options: ["Lobos", "Roque Pérez", "Chascomús", "Azul"],
    correctOption: 0,
    explanation:
      "La historiografía tradicional registra su nacimiento en Lobos, provincia de Buenos Aires, el 8 de octubre de 1895.",
    sourceTitle: BRIT,
    sourceUrl: BRIT_URL,
    difficulty: 1,
  },
  {
    category: "biography",
    prompt: "¿En qué año nació Perón?",
    options: ["1890", "1895", "1899", "1902"],
    correctOption: 1,
    explanation: "Nació el 8 de octubre de 1895.",
    sourceTitle: BRIT,
    sourceUrl: BRIT_URL,
    difficulty: 1,
  },
  {
    category: "biography",
    prompt: "¿En qué institución se formó como militar?",
    options: [
      "La Escuela Naval Militar",
      "El Colegio Militar de la Nación",
      "La Escuela de Aviación Militar",
      "El Liceo Militar General San Martín",
    ],
    correctOption: 1,
    explanation:
      "Ingresó al Colegio Militar de la Nación en 1911 y egresó como subteniente de infantería.",
    sourceTitle: ARG,
    sourceUrl: ARG_URL,
    difficulty: 1,
  },
  {
    category: "biography",
    prompt: "¿En qué deporte se destacó Perón dentro del Ejército?",
    options: ["Boxeo", "Equitación", "Esgrima", "Tiro"],
    correctOption: 2,
    explanation: "Fue campeón militar de esgrima del Ejército argentino.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 2,
  },
  {
    category: "biography",
    prompt: "¿Cómo se llamaba su primera esposa?",
    options: ["Aurelia Tizón", "Regina Duarte", "Delia Parodi", "Mercedes San Martín"],
    correctOption: 0,
    explanation:
      "Se casó con Aurelia Tizón en 1929; ella falleció en 1938.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 2,
  },
  {
    category: "biography",
    prompt: "¿Con quién se casó Perón en octubre de 1945?",
    options: [
      "María Estela Martínez",
      "María Eva Duarte",
      "Aurelia Tizón",
      "Isabel Sarli",
    ],
    correctOption: 1,
    explanation:
      "Tras el 17 de octubre de 1945 se casó con María Eva Duarte, Evita.",
    sourceTitle: BRIT,
    sourceUrl: BRIT_URL,
    difficulty: 1,
  },
  {
    category: "biography",
    prompt: "¿A qué país viajó Perón en 1939 en misión de estudios militares?",
    options: ["Alemania", "España", "Italia", "Estados Unidos"],
    correctOption: 2,
    explanation:
      "Entre 1939 y 1941 estuvo en Italia perfeccionándose en tácticas de montaña y observando la Europa de entreguerras.",
    sourceTitle: BRIT,
    sourceUrl: BRIT_URL,
    difficulty: 2,
  },
  {
    category: "biography",
    prompt: "Antes de ser presidente, ¿qué cargo clave ocupó entre 1943 y 1945?",
    options: [
      "Ministro de Economía",
      "Secretario de Trabajo y Previsión",
      "Canciller",
      "Gobernador de Buenos Aires",
    ],
    correctOption: 1,
    explanation:
      "Desde la Secretaría de Trabajo y Previsión impulsó derechos laborales y construyó su vínculo con el movimiento obrero. También fue vicepresidente y ministro de Guerra.",
    sourceTitle: ARG,
    sourceUrl: ARG_URL,
    difficulty: 1,
  },
  {
    category: "biography",
    prompt: "¿Cómo se llamaba su tercera esposa, que lo sucedió en la presidencia?",
    options: [
      "Eva Duarte",
      "María Estela Martínez",
      "Nélida Rivas",
      "Margarita Durán",
    ],
    correctOption: 1,
    explanation:
      "María Estela «Isabel» Martínez de Perón era vicepresidenta y asumió tras su muerte en 1974.",
    sourceTitle: BRIT,
    sourceUrl: BRIT_URL,
    difficulty: 1,
  },
  {
    category: "biography",
    prompt: "¿Cuándo falleció Juan Domingo Perón?",
    options: [
      "El 1 de julio de 1974",
      "El 26 de julio de 1972",
      "El 17 de octubre de 1975",
      "El 8 de octubre de 1973",
    ],
    correctOption: 0,
    explanation: "Murió el 1 de julio de 1974, ejerciendo su tercera presidencia.",
    sourceTitle: BRIT,
    sourceUrl: BRIT_URL,
    difficulty: 1,
  },

  // ─── Gobiernos y políticas públicas (10) ──────────────────────────────────
  {
    category: "governments",
    prompt: "¿En qué año ganó Perón su primera elección presidencial?",
    options: ["1943", "1946", "1951", "1955"],
    correctOption: 1,
    explanation: "Ganó las elecciones del 24 de febrero de 1946 y asumió el 4 de junio.",
    sourceTitle: ARG,
    sourceUrl: ARG_URL,
    difficulty: 1,
  },
  {
    category: "governments",
    prompt: "¿Cómo se llamaba la coalición opositora que enfrentó a Perón en 1946?",
    options: [
      "La Unión Cívica",
      "La Unión Democrática",
      "El Frente Nacional",
      "La Concordancia",
    ],
    correctOption: 1,
    explanation:
      "La Unión Democrática reunió a radicales, socialistas, demócratas progresistas y comunistas.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 2,
  },
  {
    category: "governments",
    prompt: "¿Cómo se llamó el plan económico lanzado en 1947?",
    options: [
      "Plan Austral",
      "Primer Plan Quinquenal",
      "Plan Conintes",
      "Plan Marshall criollo",
    ],
    correctOption: 1,
    explanation:
      "El Primer Plan Quinquenal (1947-1951) orientó la industrialización y la obra pública.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 1,
  },
  {
    category: "governments",
    prompt: "¿Qué servicio se nacionalizó en 1948 con gran impacto simbólico?",
    options: ["Los teléfonos", "Los ferrocarriles", "Los puertos", "La energía eléctrica"],
    correctOption: 1,
    explanation:
      "El 1 de marzo de 1948 se concretó la compra de los ferrocarriles, hasta entonces mayormente británicos.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 1,
  },
  {
    category: "governments",
    prompt: "¿En qué año se reformó la Constitución durante su primer gobierno?",
    options: ["1946", "1949", "1953", "1955"],
    correctOption: 1,
    explanation:
      "La Constitución de 1949 incorporó derechos sociales y habilitó la reelección presidencial.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 1,
  },
  {
    category: "governments",
    prompt: "¿Qué área encabezó Ramón Carrillo, elevada a ministerio en 1949?",
    options: ["Educación", "Salud Pública", "Obras Públicas", "Agricultura"],
    correctOption: 1,
    explanation:
      "Carrillo fue el primer ministro de Salud Pública: campañas sanitarias, hospitales y salud preventiva.",
    sourceTitle: ARG,
    sourceUrl: "https://www.argentina.gob.ar/salud",
    difficulty: 2,
  },
  {
    category: "governments",
    prompt: "¿Qué organismo estatal manejaba el comercio exterior de granos?",
    options: ["El IAPI", "La Junta Nacional de Granos", "El BCRA", "La CAP"],
    correctOption: 0,
    explanation:
      "El Instituto Argentino de Promoción del Intercambio (IAPI) compraba cosechas y financiaba la industrialización.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 3,
  },
  {
    category: "governments",
    prompt: "¿En qué año fue reelecto Perón por primera vez?",
    options: ["1949", "1951", "1952", "1954"],
    correctOption: 1,
    explanation:
      "En noviembre de 1951 fue reelecto con más del 62% de los votos, en la primera elección presidencial con voto femenino.",
    sourceTitle: ARG,
    sourceUrl: ARG_URL,
    difficulty: 1,
  },
  {
    category: "governments",
    prompt: "¿Cómo se autodenominó el golpe que derrocó a Perón en 1955?",
    options: [
      "Revolución Argentina",
      "Revolución Libertadora",
      "Revolución del Parque",
      "Proceso de Reorganización Nacional",
    ],
    correctOption: 1,
    explanation:
      "El golpe de septiembre de 1955 se autodenominó «Revolución Libertadora» y proscribió al peronismo.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 1,
  },
  {
    category: "governments",
    prompt: "¿Con qué porcentaje aproximado ganó Perón las elecciones de septiembre de 1973?",
    options: ["45%", "52%", "62%", "75%"],
    correctOption: 2,
    explanation:
      "La fórmula Perón-Perón obtuvo cerca del 62% de los votos en septiembre de 1973.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 3,
  },

  // ─── Derechos sociales y laborales (10) ───────────────────────────────────
  {
    category: "rights",
    prompt: "¿En qué año se sancionó la ley de voto femenino en Argentina?",
    options: ["1945", "1947", "1949", "1951"],
    correctOption: 1,
    explanation: "La ley 13.010 de sufragio femenino se sancionó el 23 de septiembre de 1947.",
    sourceTitle: ARG,
    sourceUrl: "https://www.argentina.gob.ar/interior/ley-13010-voto-femenino",
    difficulty: 1,
  },
  {
    category: "rights",
    prompt: "¿Quién fue la gran impulsora pública del voto femenino?",
    options: ["Alicia Moreau de Justo", "Eva Perón", "Cecilia Grierson", "Victoria Ocampo"],
    correctOption: 1,
    explanation:
      "Eva Perón encabezó la campaña por la ley 13.010 y luego fundó el Partido Peronista Femenino.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 1,
  },
  {
    category: "rights",
    prompt: "¿Qué beneficio anual para los trabajadores se estableció por decreto en 1945?",
    options: [
      "Las vacaciones pagas",
      "El aguinaldo (sueldo anual complementario)",
      "El salario mínimo vital y móvil",
      "Las asignaciones familiares",
    ],
    correctOption: 1,
    explanation:
      "El decreto 33.302 de diciembre de 1945 instauró el sueldo anual complementario, el aguinaldo.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 1,
  },
  {
    category: "rights",
    prompt: "¿Qué norma de 1944 protegió a los trabajadores rurales?",
    options: [
      "El Estatuto del Peón de Campo",
      "La Ley de Arrendamientos",
      "El Código Rural",
      "La Ley de Cosecheros",
    ],
    correctOption: 0,
    explanation:
      "El Estatuto del Peón de Campo fijó salarios mínimos, descanso y condiciones dignas para el trabajo rural.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 2,
  },
  {
    category: "rights",
    prompt: "¿Qué Constitución incorporó los derechos del trabajador, de la familia y de la ancianidad?",
    options: ["La de 1853", "La de 1949", "La de 1957", "La de 1994"],
    correctOption: 1,
    explanation:
      "La Constitución de 1949 constitucionalizó los derechos sociales en su artículo 37.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 2,
  },
  {
    category: "rights",
    prompt: "¿Qué central sindical se consolidó como columna vertebral del movimiento?",
    options: ["La CTA", "La CGT", "La FORA", "La USA"],
    correctOption: 1,
    explanation:
      "La Confederación General del Trabajo (CGT) se transformó en el gran actor gremial del peronismo.",
    sourceTitle: BRIT,
    sourceUrl: BRIT_URL,
    difficulty: 1,
  },
  {
    category: "rights",
    prompt: "¿Qué herramienta igualó la negociación entre gremios y patronales?",
    options: [
      "Los convenios colectivos de trabajo",
      "Las paritarias docentes",
      "El arbitraje obligatorio",
      "Los consejos de fábrica",
    ],
    correctOption: 0,
    explanation:
      "La generalización de los convenios colectivos permitió negociar salarios y condiciones por rama.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 2,
  },
  {
    category: "rights",
    prompt: "¿En qué año proclamó Eva Perón los Derechos de la Ancianidad?",
    options: ["1946", "1948", "1950", "1952"],
    correctOption: 1,
    explanation:
      "En agosto de 1948 Evita proclamó el decálogo de los Derechos de la Ancianidad, luego llevado a la Constitución de 1949.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 3,
  },
  {
    category: "rights",
    prompt: "¿Cómo se llamó la institución de ayuda social creada por Evita en 1948?",
    options: [
      "La Sociedad de Beneficencia",
      "La Fundación Eva Perón",
      "La Cruzada de Ayuda Social",
      "El Consejo de la Mujer",
    ],
    correctOption: 1,
    explanation:
      "La Fundación Eva Perón construyó hospitales, hogares, escuelas y policlínicos, y entregó ayuda directa.",
    sourceTitle: BRIT,
    sourceUrl: "https://www.britannica.com/biography/Eva-Peron",
    difficulty: 1,
  },
  {
    category: "rights",
    prompt: "¿En qué elección presidencial votaron por primera vez las mujeres argentinas?",
    options: ["1946", "1948", "1951", "1954"],
    correctOption: 2,
    explanation:
      "En noviembre de 1951 las mujeres votaron por primera vez en una elección presidencial argentina.",
    sourceTitle: ARG,
    sourceUrl: "https://www.argentina.gob.ar/interior/ley-13010-voto-femenino",
    difficulty: 1,
  },

  // ─── Fechas y acontecimientos (10) ────────────────────────────────────────
  {
    category: "history",
    prompt: "¿Qué se conmemora cada 17 de octubre?",
    options: [
      "El Día del Trabajador",
      "El Día de la Lealtad",
      "El Día de la Independencia Económica",
      "El Día del Militante",
    ],
    correctOption: 1,
    explanation:
      "El 17 de octubre de 1945 una gran movilización obrera exigió y logró la liberación de Perón: el Día de la Lealtad.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 1,
  },
  {
    category: "history",
    prompt: "¿Dónde estuvo detenido Perón en octubre de 1945?",
    options: [
      "En la cárcel de Devoto",
      "En la isla Martín García",
      "En Campo de Mayo",
      "En el buque 17 de Octubre",
    ],
    correctOption: 1,
    explanation:
      "Fue detenido y trasladado a la isla Martín García, y luego al Hospital Militar.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 2,
  },
  {
    category: "history",
    prompt: "¿Desde dónde habló Perón a la multitud la noche del 17 de octubre de 1945?",
    options: [
      "Desde el balcón de la Casa Rosada",
      "Desde el Cabildo",
      "Desde la CGT",
      "Desde el Congreso",
    ],
    correctOption: 0,
    explanation:
      "Habló desde el balcón de la Casa Rosada ante la Plaza de Mayo colmada.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 1,
  },
  {
    category: "history",
    prompt: "¿Cuándo falleció Eva Perón?",
    options: [
      "El 26 de julio de 1952",
      "El 22 de agosto de 1951",
      "El 1 de mayo de 1953",
      "El 17 de octubre de 1950",
    ],
    correctOption: 0,
    explanation:
      "Evita murió el 26 de julio de 1952, a los 33 años. «Son las 20.25...»",
    sourceTitle: BRIT,
    sourceUrl: "https://www.britannica.com/biography/Eva-Peron",
    difficulty: 1,
  },
  {
    category: "history",
    prompt: "¿Qué ocurrió el 16 de junio de 1955?",
    options: [
      "El golpe que derrocó a Perón",
      "El bombardeo a la Plaza de Mayo",
      "La quema de las urnas",
      "El Cordobazo",
    ],
    correctOption: 1,
    explanation:
      "Aviones navales bombardearon la Plaza de Mayo con cientos de víctimas civiles, meses antes del golpe.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 2,
  },
  {
    category: "history",
    prompt: "¿En qué ciudad transcurrió la mayor parte del exilio de Perón?",
    options: ["Asunción", "Caracas", "Ciudad de Panamá", "Madrid"],
    correctOption: 3,
    explanation:
      "Tras pasar por varios países, se instaló en Madrid, en la quinta «17 de Octubre» de Puerta de Hierro.",
    sourceTitle: BRIT,
    sourceUrl: BRIT_URL,
    difficulty: 1,
  },
  {
    category: "history",
    prompt: "¿Cuándo volvió Perón a la Argentina tras 17 años de exilio?",
    options: [
      "El 17 de noviembre de 1972",
      "El 25 de mayo de 1973",
      "El 20 de junio de 1973",
      "El 12 de octubre de 1973",
    ],
    correctOption: 0,
    explanation:
      "El 17 de noviembre de 1972 aterrizó en Ezeiza: hoy se recuerda como el Día del Militante.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 2,
  },
  {
    category: "history",
    prompt: "¿Quién ganó las elecciones de marzo de 1973 por el peronismo?",
    options: [
      "Héctor J. Cámpora",
      "Raúl Lastiri",
      "Vicente Solano Lima",
      "Ricardo Balbín",
    ],
    correctOption: 0,
    explanation:
      "Con Perón proscripto, ganó Héctor Cámpora («Cámpora al gobierno, Perón al poder») y renunció para habilitar nuevas elecciones.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 2,
  },
  {
    category: "history",
    prompt: "¿Cuándo asumió Perón su tercera presidencia?",
    options: [
      "El 25 de mayo de 1973",
      "El 12 de octubre de 1973",
      "El 1 de julio de 1973",
      "El 4 de junio de 1974",
    ],
    correctOption: 1,
    explanation: "Asumió el 12 de octubre de 1973, con Isabel Perón como vicepresidenta.",
    sourceTitle: ARG,
    sourceUrl: ARG_URL,
    difficulty: 3,
  },
  {
    category: "history",
    prompt: "¿Qué día murió Perón y quedó al frente del país Isabel Perón?",
    options: [
      "El 1 de julio de 1974",
      "El 17 de octubre de 1974",
      "El 24 de marzo de 1975",
      "El 8 de octubre de 1974",
    ],
    correctOption: 0,
    explanation:
      "El 1 de julio de 1974; «llevo en mis oídos la más maravillosa música...» había dicho semanas antes desde el balcón.",
    sourceTitle: BRIT,
    sourceUrl: BRIT_URL,
    difficulty: 1,
  },

  // ─── Cultura, símbolos y legado (10) ──────────────────────────────────────
  {
    category: "culture",
    prompt: "¿Cómo empieza la marcha peronista?",
    options: [
      "«Los muchachos peronistas...»",
      "«Perón, Perón, qué grande sos...»",
      "«Aquí está la clase obrera...»",
      "«Al gran pueblo argentino, salud...»",
    ],
    correctOption: 0,
    explanation:
      "«Los muchachos peronistas, todos unidos triunfaremos...» es el inicio de la marcha «Perón, Perón, qué grande sos».",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 1,
  },
  {
    category: "culture",
    prompt: "¿Cuáles son las tres banderas históricas del justicialismo?",
    options: [
      "Independencia económica, soberanía política y justicia social",
      "Libertad, igualdad y fraternidad",
      "Patria, familia y trabajo",
      "Pan, paz y trabajo",
    ],
    correctOption: 0,
    explanation:
      "Las tres banderas del movimiento: independencia económica, soberanía política y justicia social.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 1,
  },
  {
    category: "culture",
    prompt: "¿Cómo se llama la doctrina fundada por Perón?",
    options: ["El desarrollismo", "El justicialismo", "El nacionalismo popular", "El laborismo"],
    correctOption: 1,
    explanation:
      "El justicialismo toma su nombre de la justicia social, su bandera central.",
    sourceTitle: BRIT,
    sourceUrl: BRIT_URL,
    difficulty: 1,
  },
  {
    category: "culture",
    prompt: "¿Cuál de estos libros escribió Perón?",
    options: [
      "La comunidad organizada",
      "El hombre mediocre",
      "Radiografía de la pampa",
      "Facundo",
    ],
    correctOption: 0,
    explanation:
      "«La comunidad organizada» (1949) reúne su pensamiento filosófico y político; también escribió «Conducción política».",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 2,
  },
  {
    category: "culture",
    prompt: "¿Cómo se llamaba popularmente a los trabajadores que se movilizaron el 17 de octubre?",
    options: ["Los grasitas", "Los descamisados", "Los cabecitas", "Los compañeros"],
    correctOption: 1,
    explanation:
      "«Descamisados»: el término despectivo fue reivindicado con orgullo por el movimiento.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 1,
  },
  {
    category: "culture",
    prompt: "¿Cómo tituló Eva Perón su autobiografía de 1951?",
    options: [
      "Mi mensaje",
      "La razón de mi vida",
      "Historia del peronismo",
      "Mi vida por Perón",
    ],
    correctOption: 1,
    explanation:
      "«La razón de mi vida» (1951) llegó a usarse como texto escolar; «Mi mensaje» fue su texto final.",
    sourceTitle: BRIT,
    sourceUrl: "https://www.britannica.com/biography/Eva-Peron",
    difficulty: 2,
  },
  {
    category: "culture",
    prompt: "¿Qué figuras aparecen en el centro del escudo peronista?",
    options: [
      "Dos manos estrechadas bajo un gorro frigio",
      "Un sol naciente sobre el mar",
      "Una paloma con ramas de olivo",
      "Un martillo y una espiga",
    ],
    correctOption: 0,
    explanation:
      "El escudo justicialista muestra dos manos estrechadas sosteniendo una pica con el gorro frigio, sobre los colores patrios.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 2,
  },
  {
    category: "culture",
    prompt: "Según la consigna histórica, ¿qué es «mejor que decir»?",
    options: ["Hacer", "Prometer", "Callar", "Escuchar"],
    correctOption: 0,
    explanation:
      "«Mejor que decir es hacer, mejor que prometer es realizar», una de las veinte verdades peronistas.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 1,
  },
  {
    category: "culture",
    prompt: "¿Cómo llamaba el peronismo a los niños en su década fundacional?",
    options: [
      "Los únicos privilegiados",
      "Los herederos de la patria",
      "Los soldados de Perón",
      "Los hijos del pueblo",
    ],
    correctOption: 0,
    explanation:
      "«En la Nueva Argentina los únicos privilegiados son los niños», reza una de las veinte verdades.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 2,
  },
  {
    category: "culture",
    prompt: "¿Qué fecha se celebra como Día del Militante peronista?",
    options: [
      "El 17 de octubre",
      "El 17 de noviembre",
      "El 1 de mayo",
      "El 26 de julio",
    ],
    correctOption: 1,
    explanation:
      "El 17 de noviembre recuerda el regreso de Perón al país en 1972 tras 17 años de exilio.",
    sourceTitle: EH,
    sourceUrl: EH_URL,
    difficulty: 2,
  },
];
