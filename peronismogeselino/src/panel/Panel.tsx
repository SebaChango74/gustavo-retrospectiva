import { useState } from "react";
import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useSession } from "../session";
import { Ingreso } from "../Ingreso";
import { Crud, useList } from "./Crud";
import { Members } from "./Members";
import { Moderation } from "./Moderation";
import { Results } from "./Results";
import { SettingsModule } from "./Settings";
import { Peron365Admin } from "./Peron365Admin";
import { Approvals } from "./Approvals";
import { Solicitudes } from "./Solicitudes";
import { Seguridad } from "./Seguridad";
import { dateLabel } from "../ui";

const contentStatus = [
  { value: "draft", label: "Borrador" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Archivado" },
];

// Espejo de los permisos del servidor, solo para armar el menú.
const MODULES: { key: string; label: string; roles: string[] }[] = [
  { key: "aprobaciones", label: "Aprobaciones", roles: ["admin"] },
  { key: "noticias", label: "Noticias", roles: ["admin", "editor"] },
  { key: "causas", label: "Causas vivas", roles: ["admin", "editor"] },
  { key: "agenda", label: "Agenda", roles: ["admin", "editor"] },
  { key: "peron365", label: "Perón 365", roles: ["admin", "editor"] },
  { key: "preguntas", label: "Peronómetro · preguntas", roles: ["admin", "editor"] },
  { key: "resultados", label: "Peronómetro · resultados", roles: ["admin", "editor"] },
  { key: "anuncios", label: "Anuncios", roles: ["admin", "editor", "moderator"] },
  { key: "materiales", label: "Materiales", roles: ["admin", "editor"] },
  { key: "moderacion", label: "Moderación", roles: ["admin", "moderator"] },
  { key: "solicitudes", label: "Pedidos de ingreso", roles: ["admin"] },
  { key: "miembros", label: "Miembros", roles: ["admin"] },
  { key: "territorios", label: "Territorios", roles: ["admin"] },
  { key: "seguridad", label: "Seguridad de tu cuenta", roles: ["admin"] },
  { key: "ajustes", label: "Ajustes", roles: ["admin"] },
];

export default function Panel() {
  const { member, loading, logout } = useSession();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState("");

  if (loading) {
    return <div className="panel-loading">Cargando…</div>;
  }

  if (!member || !member.panelAccess) {
    return (
      <div className="panel-login tech-grid">
        <span className="eyebrow light">PANEL DE CONTROL</span>
        <h1>PERONISMO GESELINO</h1>
        <p>
          {member
            ? "Tu cuenta no tiene permisos de gestión. Hablá con la administración."
            : "Entrá con tu nombre, tu WhatsApp y tu clave de administración."}
        </p>
        {!member && <Ingreso onError={setLoginError} />}
        {loginError && <div className="panel-error">{loginError}</div>}
        <button className="text-action" onClick={() => navigate("/")}>
          ← Volver al portal
        </button>
      </div>
    );
  }

  const visible = MODULES.filter((m) => m.roles.includes(member.role));

  return (
    <div className="panel-shell">
      <header className="panel-header">
        <div>
          <span className="brand-title">PANEL · PERONISMO GESELINO</span>
          <span className="brand-subtitle">
            {member.name || "Mi cuenta"} · {roleLabel(member.role)}
          </span>
        </div>
        <div className="panel-header-actions">
          <button className="text-action" onClick={() => navigate("/")}>
            Ver portal
          </button>
          <button
            className="text-action"
            onClick={async () => {
              await logout();
              navigate("/");
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="panel-body">
        <nav className="panel-nav" aria-label="Módulos del panel">
          {visible.map((module) => (
            <NavLink
              key={module.key}
              to={`/panel/${module.key}`}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {module.label}
            </NavLink>
          ))}
        </nav>

        <div className="panel-content">
          <Routes>
            <Route path="/" element={<Navigate to={`/panel/${visible[0]?.key ?? ""}`} replace />} />
            <Route path="aprobaciones" element={<Approvals />} />
            <Route path="noticias" element={<NewsModule />} />
            <Route path="causas" element={<CausesModule />} />
            <Route path="agenda" element={<EventsModule />} />
            <Route path="peron365" element={<Peron365Admin />} />
            <Route path="preguntas" element={<QuestionsModule />} />
            <Route path="resultados" element={<Results />} />
            <Route path="anuncios" element={<AnnouncementsModule />} />
            <Route path="materiales" element={<MaterialsModule />} />
            <Route path="moderacion" element={<Moderation />} />
            <Route path="solicitudes" element={<Solicitudes />} />
            <Route path="miembros" element={<Members />} />
            <Route path="territorios" element={<TerritoriesModule />} />
            <Route path="seguridad" element={<Seguridad />} />
            <Route path="ajustes" element={<SettingsModule />} />
            <Route path="*" element={<Navigate to="/panel" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export function roleLabel(role: string): string {
  return (
    {
      admin: "Administración",
      admin_manager: "Administración (control)",
      editor: "Edición",
      moderator: "Moderación",
      referente: "Referente territorial",
      member: "Miembro",
    }[role] ?? role
  );
}

function NewsModule() {
  return (
    <Crud
      title="Noticias"
      subtitle="Lo que aparece en «Lo que está pasando» del portal público."
      path="/admin/news"
      columns={[
        { key: "title", label: "Título" },
        { key: "tag", label: "Etiqueta" },
        { key: "status", label: "Estado", render: (r) => statusLabel(r.status) },
        { key: "published_at", label: "Publicada", render: (r) => shortDate(r.published_at) },
        { key: "featured", label: "Destacada", render: (r) => (r.featured ? "★" : "") },
      ]}
      fields={[
        { key: "title", label: "Título", required: true },
        { key: "tag", label: "Etiqueta", placeholder: "Villa Gesell / Provincia / Comunidad" },
        { key: "summary", label: "Resumen", type: "textarea" },
        {
          key: "body",
          label: "Cuerpo (opcional)",
          type: "textarea",
          rich: true,
          help: "Para un enlace: seleccioná el texto y tocá 🔗, o pegá la dirección y se vuelve clickeable sola. También podés escribir [texto](https://...).",
        },
        { key: "image", label: "Imagen", type: "image" },
        {
          key: "video",
          label: "Video de YouTube (opcional)",
          placeholder: "https://www.youtube.com/watch?v=…",
          help: "Pegá el enlace del video. Si hay video, reemplaza a la imagen en el portal.",
        },
        { key: "attachment", label: "PDF para descargar", type: "pdf" },
        { key: "publishedAt", label: "Fecha de publicación", type: "datetime" },
        { key: "status", label: "Estado", type: "select", options: contentStatus },
        { key: "featured", label: "Noticia destacada (tarjeta grande)", type: "checkbox" },
      ]}
      emptyValues={{
        title: "",
        tag: "Villa Gesell",
        summary: "",
        body: "",
        image: "",
        video: "",
        attachment: "",
        attachmentName: "",
        publishedAt: "",
        status: "published",
        featured: false,
      }}
      fromRow={(row) => ({
        title: row.title,
        tag: row.tag,
        summary: row.summary,
        body: row.body,
        image: row.image,
        video: row.video ?? "",
        attachment: row.attachment ?? "",
        attachmentName: row.attachment_name ?? "",
        publishedAt: toLocalDatetime(row.published_at),
        status: row.status,
        featured: Boolean(row.featured),
      })}
    />
  );
}

function CausesModule() {
  return (
    <Crud
      title="Causas vivas"
      subtitle="Cada causa tiene ficha, datos clave y línea de tiempo."
      path="/admin/causes"
      columns={[
        { key: "title", label: "Título" },
        { key: "status_label", label: "Estado visible" },
        { key: "progress", label: "Avance", render: (r) => `${r.progress}%` },
        { key: "status", label: "Publicación", render: (r) => statusLabel(r.status) },
      ]}
      fields={[
        { key: "title", label: "Título", required: true },
        { key: "summary", label: "Bajada", type: "textarea" },
        { key: "statusLabel", label: "Estado visible", placeholder: "EN GESTIÓN" },
        { key: "progress", label: "Avance (0-100)", type: "number" },
        { key: "progressFrom", label: "Leyenda izquierda de la barra" },
        { key: "progressNext", label: "Leyenda derecha de la barra" },
        { key: "leadImage", label: "Imagen principal", type: "image" },
        {
          key: "video",
          label: "Video de YouTube (opcional)",
          placeholder: "https://www.youtube.com/watch?v=…",
          help: "Pegá el enlace del video. Si hay video, reemplaza a la imagen en el portal.",
        },
        { key: "attachment", label: "PDF para descargar", type: "pdf" },
        { key: "briefTitle", label: "Título del resumen", placeholder: "¿QUÉ ESTÁ PASANDO?" },
        {
          key: "briefBody",
          label: "Resumen en 30 segundos",
          type: "textarea",
          rich: true,
          help: "Podés insertar enlaces con 🔗 o pegando la dirección.",
        },
        { key: "bullets", label: "Puntos clave", type: "lines" },
        { key: "keyFactValue", label: "Dato clave (número)", placeholder: "11.000+" },
        { key: "keyFactLabel", label: "Dato clave (texto)" },
        { key: "nextSteps", label: "Qué sigue", type: "lines" },
        { key: "status", label: "Publicación", type: "select", options: contentStatus },
        {
          key: "timeline",
          label: "Línea de tiempo",
          type: "timeline",
          help: "Se muestra en la ficha de la causa, en orden.",
        },
      ]}
      emptyValues={{
        title: "",
        summary: "",
        statusLabel: "EN GESTIÓN",
        progress: 0,
        progressFrom: "",
        progressNext: "",
        leadImage: "",
        video: "",
        attachment: "",
        attachmentName: "",
        briefTitle: "¿QUÉ ESTÁ PASANDO?",
        briefBody: "",
        bullets: [],
        keyFactValue: "",
        keyFactLabel: "",
        nextSteps: [],
        status: "draft",
        timeline: [],
      }}
      fromRow={(row) => ({
        title: row.title,
        summary: row.summary,
        statusLabel: row.status_label,
        progress: row.progress,
        progressFrom: row.progress_from,
        progressNext: row.progress_next,
        leadImage: row.lead_image,
        video: row.video ?? "",
        attachment: row.attachment ?? "",
        attachmentName: row.attachment_name ?? "",
        briefTitle: row.brief_title,
        briefBody: row.brief_body,
        bullets: safeParse(row.bullets),
        keyFactValue: row.key_fact_value,
        keyFactLabel: row.key_fact_label,
        nextSteps: safeParse(row.next_steps),
        status: row.status,
        timeline: (row.__timeline ?? []).map((t: any) => ({
          dateLabel: t.date_label,
          title: t.title,
          body: t.body,
          state: t.state,
        })),
      })}
      aside={<CausesTimelineLoader />}
    />
  );
}

// La lista de causas del panel trae la línea de tiempo por separado; este
// componente la adjunta a cada fila para que el formulario la muestre.
function CausesTimelineLoader() {
  const { data } = useList("/admin/causes");
  if (data?.items && data?.timeline) {
    for (const item of data.items) {
      item.__timeline = data.timeline.filter((t: any) => t.cause_id === item.id);
    }
  }
  return null;
}

function EventsModule() {
  return (
    <Crud
      title="Agenda"
      subtitle="Actividades públicas y de la comunidad. Una actividad «members» nunca muestra su ubicación en el portal público."
      path="/admin/events"
      columns={[
        { key: "title", label: "Actividad" },
        { key: "starts_at", label: "Inicio", render: (r) => shortDate(r.starts_at) },
        {
          key: "visibility",
          label: "Visibilidad",
          render: (r) => (r.visibility === "members" ? "Miembros" : "Pública"),
        },
        { key: "status", label: "Estado", render: (r) => eventStatusLabel(r.status) },
      ]}
      fields={[
        { key: "title", label: "Título", required: true },
        { key: "eventType", label: "Tipo", placeholder: "ACTIVIDAD DE LA COMUNIDAD" },
        { key: "summary", label: "Descripción", type: "textarea" },
        { key: "image", label: "Foto", type: "image" },
        { key: "startsAt", label: "Comienza", type: "datetime", required: true },
        { key: "endsAt", label: "Termina (opcional)", type: "datetime" },
        { key: "placeName", label: "Nombre del lugar", placeholder: "Casa Peronista" },
        {
          key: "address",
          label: "Dirección",
          placeholder: "Av. 3 nº 820, Villa Gesell",
          help: "Con la dirección alcanza para generar el mapa.",
        },
        { key: "latitude", label: "Latitud (opcional)", type: "number", step: "0.000001" },
        { key: "longitude", label: "Longitud (opcional)", type: "number", step: "0.000001" },
        {
          key: "googleMapsUrl",
          label: "Enlace de Google Maps (opcional)",
          help: "Si queda vacío, se genera automáticamente desde la dirección o las coordenadas.",
        },
        {
          key: "visibility",
          label: "Visibilidad",
          type: "select",
          options: [
            { value: "public", label: "Pública" },
            { value: "members", label: "Solo miembros" },
          ],
        },
        {
          key: "status",
          label: "Estado",
          type: "select",
          options: [
            { value: "draft", label: "Borrador" },
            { value: "published", label: "Publicada" },
            { value: "cancelled", label: "Cancelada" },
          ],
        },
      ]}
      emptyValues={{
        title: "",
        eventType: "ACTIVIDAD",
        summary: "",
        startsAt: "",
        endsAt: "",
        placeName: "",
        address: "",
        latitude: "",
        longitude: "",
        googleMapsUrl: "",
        visibility: "public",
        status: "draft",
        image: "",
      }}
      fromRow={(row) => ({
        title: row.title,
        eventType: row.event_type,
        summary: row.summary,
        image: row.image ?? "",
        startsAt: row.starts_at ?? "",
        endsAt: row.ends_at ?? "",
        placeName: row.place_name,
        address: row.address,
        latitude: row.latitude ?? "",
        longitude: row.longitude ?? "",
        googleMapsUrl: row.google_maps_url,
        visibility: row.visibility,
        status: row.status,
      })}
    />
  );
}

function QuestionsModule() {
  const categories = [
    { value: "biography", label: "Biografía" },
    { value: "governments", label: "Gobiernos y políticas públicas" },
    { value: "rights", label: "Derechos sociales y laborales" },
    { value: "history", label: "Fechas y acontecimientos" },
    { value: "culture", label: "Cultura, símbolos y legado" },
  ];
  return (
    <Crud
      title="Peronómetro · banco de preguntas"
      subtitle="El juego usa 50 preguntas habilitadas. Cada una necesita 4 opciones y su fuente."
      path="/admin/questions"
      columns={[
        { key: "prompt", label: "Pregunta" },
        {
          key: "category",
          label: "Categoría",
          render: (r) => categories.find((c) => c.value === r.category)?.label ?? r.category,
        },
        { key: "difficulty", label: "Dificultad" },
        { key: "enabled", label: "Habilitada", render: (r) => (r.enabled ? "Sí" : "No") },
      ]}
      fields={[
        { key: "category", label: "Categoría", type: "select", options: categories },
        { key: "prompt", label: "Pregunta", type: "textarea", required: true },
        {
          key: "options",
          label: "Opciones (exactamente 4, una por línea)",
          type: "lines",
          required: true,
        },
        {
          key: "correctOption",
          label: "Opción correcta",
          type: "select",
          options: [
            { value: "0", label: "1ª opción" },
            { value: "1", label: "2ª opción" },
            { value: "2", label: "3ª opción" },
            { value: "3", label: "4ª opción" },
          ],
        },
        { key: "explanation", label: "Explicación breve", type: "textarea" },
        { key: "sourceTitle", label: "Fuente (título)" },
        { key: "sourceUrl", label: "Fuente (URL)" },
        {
          key: "difficulty",
          label: "Dificultad",
          type: "select",
          options: [
            { value: "1", label: "1 · accesible" },
            { value: "2", label: "2 · media" },
            { value: "3", label: "3 · exigente" },
          ],
        },
        { key: "enabled", label: "Habilitada para jugar", type: "checkbox" },
      ]}
      emptyValues={{
        category: "biography",
        prompt: "",
        options: [],
        correctOption: "0",
        explanation: "",
        sourceTitle: "",
        sourceUrl: "",
        difficulty: "1",
        enabled: true,
      }}
      fromRow={(row) => ({
        category: row.category,
        prompt: row.prompt,
        options: Array.isArray(row.options) ? row.options : safeParse(row.options),
        correctOption: String(row.correct_option),
        explanation: row.explanation,
        sourceTitle: row.source_title,
        sourceUrl: row.source_url,
        difficulty: String(row.difficulty),
        enabled: Boolean(row.enabled),
      })}
    />
  );
}

function AnnouncementsModule() {
  return (
    <Crud
      title="Anuncios internos"
      subtitle="Avisos de conducción que se muestran en la comunidad."
      path="/admin/announcements"
      columns={[
        { key: "title", label: "Título" },
        { key: "pinned", label: "Fijado", render: (r) => (r.pinned ? "📌" : "") },
        { key: "status", label: "Estado", render: (r) => statusLabel(r.status) },
      ]}
      fields={[
        { key: "title", label: "Título", required: true },
        {
          key: "body",
          label: "Texto",
          type: "textarea",
          rich: true,
          help: "Podés insertar enlaces con 🔗 o pegando la dirección.",
        },
        {
          key: "eventId",
          label: "ID de actividad vinculada (opcional)",
          type: "number",
          help: "Si el anuncio invita a una actividad de la agenda, poné su ID.",
        },
        { key: "pinned", label: "Fijar arriba de la comunidad", type: "checkbox" },
        { key: "status", label: "Estado", type: "select", options: contentStatus },
      ]}
      emptyValues={{ title: "", body: "", eventId: "", pinned: false, status: "published" }}
      fromRow={(row) => ({
        title: row.title,
        body: row.body,
        eventId: row.event_id ?? "",
        pinned: Boolean(row.pinned),
        status: row.status,
      })}
    />
  );
}

function MaterialsModule() {
  return (
    <Crud
      title="Materiales"
      subtitle="Documentos, placas y enlaces para la militancia."
      path="/admin/materials"
      columns={[
        { key: "title", label: "Título" },
        { key: "kind", label: "Tipo" },
        { key: "status", label: "Estado", render: (r) => statusLabel(r.status) },
      ]}
      fields={[
        { key: "title", label: "Título", required: true },
        { key: "description", label: "Descripción", type: "textarea" },
        { key: "url", label: "Enlace (Drive, PDF, imagen…)" },
        {
          key: "kind",
          label: "Tipo",
          type: "select",
          options: [
            { value: "document", label: "Documento" },
            { value: "image", label: "Imagen / placa" },
            { value: "video", label: "Video" },
            { value: "link", label: "Enlace" },
          ],
        },
        { key: "status", label: "Estado", type: "select", options: contentStatus },
      ]}
      emptyValues={{ title: "", description: "", url: "", kind: "link", status: "published" }}
      fromRow={(row) => ({
        title: row.title,
        description: row.description,
        url: row.url,
        kind: row.kind,
        status: row.status,
      })}
    />
  );
}

function TerritoriesModule() {
  return (
    <Crud
      title="Territorios"
      subtitle="Barrios y zonas de Villa Gesell para organizar la comunidad."
      path="/admin/territories"
      columns={[
        { key: "name", label: "Nombre" },
        { key: "members", label: "Miembros" },
      ]}
      fields={[
        { key: "name", label: "Nombre", required: true },
        { key: "description", label: "Descripción", type: "textarea" },
      ]}
      emptyValues={{ name: "", description: "" }}
      fromRow={(row) => ({ name: row.name, description: row.description })}
    />
  );
}

function statusLabel(status: string): string {
  return { draft: "Borrador", published: "Publicado", archived: "Archivado" }[status] ?? status;
}

function eventStatusLabel(status: string): string {
  return { draft: "Borrador", published: "Publicada", cancelled: "Cancelada" }[status] ?? status;
}

function shortDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return dateLabel(iso);
  } catch {
    return iso;
  }
}

function toLocalDatetime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function safeParse(text: any): any[] {
  if (Array.isArray(text)) return text;
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
