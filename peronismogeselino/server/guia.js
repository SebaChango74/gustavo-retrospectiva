import crypto from "node:crypto";
import { normalizarWhatsapp } from "./whatsapp.js";
import { hasPanelAccess } from "./auth.js";

const COOKIE = "pg_guia";
const DIAS = 60;

/** La contraseña compartida de la guía. Se cambia por entorno. */
export function claveGuia() {
  return process.env.PG_GUIA_CLAVE || "PeronGeselino";
}

function sello() {
  return crypto.createHash("sha256").update(`pg-guia:${claveGuia()}`).digest("hex").slice(0, 40);
}

export function cookieGuia() {
  const seguro = process.env.NODE_ENV === "production" || process.env.PG_SECURE_COOKIES === "1";
  const vence = new Date(Date.now() + DIAS * 86400_000).toUTCString();
  const ruta = process.env.PG_STANDALONE === "1" ? "/" : "/peronismogeselino";
  return [
    `${COOKIE}=${sello()}`,
    "HttpOnly",
    "SameSite=Lax",
    `Path=${ruta}`,
    `Expires=${vence}`,
    seguro ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function guiaAbierta(req) {
  const cookies = req.headers.cookie || "";
  return cookies.split(";").some((c) => c.trim() === `${COOKIE}=${sello()}`);
}

/**
 * Abre la guía. Pide las dos cosas: un WhatsApp que sea de alguien con acceso
 * al panel y la contraseña compartida. Con una sola no alcanza.
 */
export function abrirGuia(db, { whatsapp, clave }) {
  if (String(clave || "").trim() !== claveGuia()) {
    return { ok: false, error: "Contraseña incorrecta." };
  }
  const phone = normalizarWhatsapp(whatsapp);
  if (!phone) {
    return { ok: false, error: "Revisá el WhatsApp: código de área y número, sin el 0 ni el 15." };
  }
  const persona = db
    .prepare("SELECT role, status FROM members WHERE phone = ?")
    .get(phone);
  if (!persona || persona.status === "suspended" || !hasPanelAccess(persona)) {
    return {
      ok: false,
      error: "Ese WhatsApp no figura entre quienes tienen acceso a la guía.",
    };
  }
  return { ok: true };
}

/**
 * El contenido de la guía vive en el servidor, no en el programa que se
 * descarga el navegador: si estuviera del lado del cliente, el candado sería
 * un adorno y cualquiera podría leerla sin abrirlo.
 */
export const SECCIONES = [
  {
    tag: "Para empezar",
    titulo: "Cómo se entra",
    intro:
      "No hay usuario, ni correo, ni cuenta de Google. Se entra con el WhatsApp y, en el caso de la administración, con una clave personal.",
    pasos: [
      {
        titulo: "Abrir el panel",
        texto: "Ir a gustavobarrera.com/peronismogeselino/panel desde el celular o la computadora.",
      },
      {
        titulo: "Nombre y apellido",
        texto: "Tal como querés que te vea el resto de la mesa.",
      },
      {
        titulo: "El WhatsApp",
        texto:
          "Tu número, como lo tengas anotado. Con o sin el 0, con o sin el 15, con o sin el +54: el sistema lo entiende igual y siempre lo guarda de la misma manera.",
      },
      {
        titulo: "La clave",
        texto:
          "Al salir del campo del WhatsApp, el formulario reconoce que ese número es de administración y aparece el campo de la clave.",
      },
      {
        titulo: "Entrar",
        texto:
          "La sesión dura 30 días en ese teléfono. Después vuelve a pedir los datos.",
      },
    ],
    aviso: {
      titulo: "Lo primero",
      texto:
        "Cambiar la clave inicial: Panel → Miembros → tu propia fila → Cambiar clave. Al cambiarla se cierran todas tus sesiones abiertas. Es normal, volvés a entrar con la nueva.",
    },
  },
  {
    tag: "Los roles",
    titulo: "Quién puede qué",
    intro:
      "Cuatro niveles. La diferencia no es de jerarquía sino de responsabilidad: quién decide la forma del portal, quién decide qué se publica y quién escribe.",
    tabla: {
      columnas: ["Rol", "Qué puede hacer", "Qué no"],
      filas: [
        [
          "Administración · Builder",
          "Todo, incluidos ajustes, estructura y configuración del portal.",
          "—",
        ],
        [
          "Administración · Manager",
          "Aprobar o devolver lo que cargan los editores, publicar, moderar el foro, aceptar o rechazar pedidos de ingreso, manejar miembros y territorios.",
          "Ajustes del portal. No decide diseño, estructura ni concepto.",
        ],
        [
          "Edición",
          "Cargar noticias, causas, actividades, materiales, anuncios y frases de Perón 365.",
          "Nada de lo que carga sale publicado hasta que un administrador lo aprueba.",
        ],
        [
          "Moderación",
          "Abrir, fijar y cerrar conversaciones del foro; ocultar mensajes.",
          "Cargar o publicar contenido del portal.",
        ],
        [
          "Referente territorial",
          "Su barrio: ve y organiza lo de su territorio dentro de la comunidad.",
          "El resto del panel.",
        ],
        [
          "Miembro",
          "Toda la comunidad privada: foro, agenda interna, materiales.",
          "No entra al panel.",
        ],
      ],
    },
    aviso: {
      titulo: "Cuenta técnica",
      texto:
        "Aparte de los roles, en Miembros hay una columna «Figura». Una cuenta técnica administra el portal pero no cuenta como miembro de la comunidad ni aparece en sus listas. No todo el que sostiene una herramienta política milita en ella.",
    },
  },
  {
    tag: "El panel",
    titulo: "Módulo por módulo",
    intro:
      "El menú de la izquierda muestra solo lo que tu rol puede tocar. Esto es todo lo que hay, en el orden en que aparece.",
    modulos: [
      {
        nombre: "Aprobaciones",
        marca: "Tarea principal",
        texto:
          "La bandeja de entrada del portal. Todo lo que carga un editor cae acá y no se publica hasta que alguien decide.",
        detalle:
          "«Aprobar» lo manda al portal en el acto. «Devolver» lo baja a borrador para que el editor lo corrija. Si está vacío, dice «Todo al día».",
      },
      {
        nombre: "Noticias",
        marca: "Carga y publica",
        texto:
          "Lo que aparece en «Lo que está pasando». Cada nota lleva título, etiqueta, resumen, cuerpo, imagen y fecha.",
        detalle:
          "La casilla «Destacada» la convierte en la tarjeta grande de la portada. Conviene tener una sola destacada por vez.",
      },
      {
        nombre: "Causas vivas",
        marca: "Carga y publica",
        texto:
          "Los temas que se sostienen en el tiempo. Cada causa tiene ficha propia: resumen en 30 segundos, puntos clave, un dato fuerte, qué sigue y línea de tiempo.",
        detalle:
          "La barra de avance y la línea de tiempo son lo que diferencia una causa de una noticia: muestran que el tema se sigue, no que pasó.",
      },
      {
        nombre: "Agenda",
        marca: "Carga y publica",
        texto:
          "Actividades con fecha, lugar y mapa. El mapa se genera solo con la dirección, sin costo.",
        detalle:
          "La visibilidad es la decisión importante: una actividad marcada «Solo miembros» nunca envía su dirección al portal público. Ni la dirección, ni las coordenadas, ni el enlace del mapa. Está verificado con pruebas automáticas.",
      },
      {
        nombre: "Perón 365",
        marca: "Verifica",
        texto:
          "Una frase documentada de Perón por día, con placa compartible. La biblioteca, el calendario de los próximos 30 días y las estadísticas están acá.",
        detalle:
          "Solo salen al aire las frases marcadas «Verificada», con su fuente cargada. El corpus inicial es de muestra: necesita revisión histórica antes de confiar en él.",
      },
      {
        nombre: "Peronómetro · preguntas",
        marca: "Revisa",
        texto:
          "El banco del juego: 50 preguntas habilitadas, cuatro opciones cada una, con explicación y fuente.",
        detalle:
          "Las 50 actuales son un modelo de trabajo. Antes de difundir el juego hay que revisarlas una por una: es contenido histórico con nuestro nombre encima.",
      },
      {
        nombre: "Peronómetro · resultados",
        marca: "Consulta",
        texto:
          "Cuánta gente jugó, qué puntaje sacó, cómo se distribuye. Todo anónimo: no se guarda quién jugó.",
      },
      {
        nombre: "Anuncios",
        marca: "Carga y publica",
        texto:
          "Avisos de conducción para adentro de la comunidad. Los importantes se fijan arriba de todo.",
      },
      {
        nombre: "Materiales",
        marca: "Carga y publica",
        texto:
          "Documentos, placas, enlaces y videos para la militancia. Solo los ven los miembros.",
      },
      {
        nombre: "Moderación",
        marca: "Tarea",
        texto:
          "El foro por dentro. Abrir una conversación nueva, fijarla, cerrarla u ocultar un mensaje que se fue de tema.",
        detalle:
          "Cada conversación lleva una nota de moderación: una línea que fija de qué se habla ahí. Puesta al abrir el hilo, evita la mitad de los problemas después.",
      },
      {
        nombre: "Pedidos de ingreso",
        marca: "Tarea",
        texto:
          "Quien completó el formulario de la comunidad y espera respuesta. Cada pedido muestra nombre, WhatsApp y número de afiliado si lo cargó.",
        detalle:
          "El WhatsApp es un enlace: se toca y se abre la conversación con esa persona. Si no la ubicás, preguntá antes de aprobar. Un pedido rechazado no puede volver a intentarlo.",
      },
      {
        nombre: "Miembros",
        marca: "Tarea",
        texto:
          "La lista completa. Acá se suma gente directo, se cambia el rol, se asigna territorio y se suspende a quien haya que suspender.",
        detalle:
          "Suspender corta el acceso al instante, no en el próximo ingreso. Para sumar un administrador hay que definirle la clave en el mismo momento del alta.",
      },
      {
        nombre: "Territorios",
        marca: "Organiza",
        texto:
          "Los barrios y zonas de Villa Gesell. Sirven para agrupar miembros y para que cada conversación del foro tenga su lugar.",
      },
      {
        nombre: "Ajustes",
        marca: "Solo builder",
        soloBuilder: true,
        texto:
          "Configuración general del portal y registro de actividad. Es donde se cambia la forma de la herramienta, no su contenido.",
      },
    ],
  },
  {
    tag: "La rutina",
    titulo: "Un día normal",
    intro: "Lo que conviene mirar cada vez que entrás, en este orden.",
    pasos: [
      {
        titulo: "Aprobaciones",
        texto: "¿Hay algo esperando? Es lo único que frena la publicación de un compañero.",
      },
      {
        titulo: "Pedidos de ingreso",
        texto: "Gente esperando entrar. Si no la conocés, escribile antes de decidir.",
      },
      {
        titulo: "Moderación",
        texto: "Una pasada por el foro. Cerrar lo que se agotó, fijar lo que importa esta semana.",
      },
      {
        titulo: "Agenda",
        texto: "Que lo que viene esté cargado y con la visibilidad correcta.",
      },
    ],
  },
  {
    tag: "El portal",
    titulo: "Qué ve la gente",
    intro:
      "La parte pública no pide nada: se entra y se lee. Está pensada para alguien que llega desde un enlace de WhatsApp y tiene dos minutos.",
    partes: [
      {
        nombre: "Portada",
        texto:
          "La foto de Gustavo, las noticias recientes, la causa que se está empujando y las próximas actividades. Es la primera impresión y no debe parecer un depósito de notas.",
      },
      {
        nombre: "Causas vivas",
        texto:
          "La diferencia con una noticia. Una causa se sigue: tiene estado, avance y línea de tiempo. Es la forma de mostrar que un tema no se abandonó.",
      },
      {
        nombre: "Agenda",
        texto:
          "Lo público con dirección y mapa, y un botón que agrega la actividad al calendario del teléfono. Lo interno solo lo ven los miembros, y sin revelar dónde es.",
      },
      {
        nombre: "Peronómetro",
        texto:
          "Cincuenta preguntas, diez segundos cada una. Al final da un porcentaje y una placa para compartir. No es un adorno: es la puerta de entrada para el que todavía no se acercó.",
      },
      {
        nombre: "Perón 365",
        texto:
          "Una frase documentada por día, con su fuente, su permalink fechado y su placa compartible. La frase de hoy es la misma para todos y no cambia nunca una vez publicada.",
      },
      {
        nombre: "La comunidad",
        texto:
          "El espacio cerrado. Se pide nombre y WhatsApp, queda el pedido, la mesa aprueba. Adentro: foro por causa y por barrio, anuncios, materiales, territorio y agenda interna.",
      },
    ],
  },
  {
    tag: "En el teléfono",
    titulo: "Cómo se instala",
    intro:
      "No está en Play Store ni en App Store, y no hace falta. La dirección corta para compartir es gustavobarrera.com/pg y lleva directo a la instalación.",
    partes: [
      {
        nombre: "Android",
        texto:
          "Aparece un botón «Instalar la app» que abre el diálogo del sistema. Un toque y listo.",
      },
      {
        nombre: "iPhone",
        texto:
          "Safari no permite instalar por botón, así que la página muestra los tres pasos: compartir → «Agregar a inicio» → Agregar. Tiene que ser Safari; en el iPhone, Chrome no puede.",
      },
      {
        nombre: "Computadora",
        texto: "En Chrome o Edge aparece un ícono de instalar en la barra de direcciones.",
      },
      {
        nombre: "Si la abren dentro de WhatsApp",
        texto:
          "La página lo detecta y avisa que hay que abrirla en Chrome o Safari. Desde el navegador de WhatsApp no se puede instalar nada.",
      },
    ],
    aviso: {
      titulo: "Qué gana instalada",
      texto:
        "Abre a pantalla completa, sin barra de navegador, con su propio ícono. Lo que ya se visitó queda disponible aunque se corte la señal. La comunidad y el panel siempre piden conexión: donde se toman decisiones no mostramos datos viejos.",
    },
  },
  {
    tag: "Antes de difundir",
    titulo: "Lo que falta revisar",
    intro:
      "La herramienta está terminada. El contenido que trae adentro es material de trabajo y necesita ojo político e histórico.",
    lista: [
      "Las 50 preguntas del Peronómetro. Son un modelo. Hay que leerlas una por una antes de que circulen con nuestro nombre.",
      "Las frases de Perón 365. Solo salen las verificadas, pero el corpus inicial es de muestra y pide revisión de fuentes.",
      "Las direcciones de la agenda. Hoy apuntan a Villa Gesell en general; cada actividad real necesita la suya.",
      "Las noticias y causas de ejemplo. Reemplazarlas por las verdaderas antes de mostrar el portal a alguien de afuera.",
    ],
  },
];
