const BASE = `${import.meta.env.BASE_URL}api`;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    credentials: "same-origin",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    ...options,
  });
  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // sin cuerpo JSON
  }
  if (!response.ok) {
    throw new ApiError(response.status, data?.error || `Error ${response.status}`);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export type Member = {
  id: number;
  email: string;
  name: string;
  picture: string;
  role: "admin" | "editor" | "moderator" | "referente" | "member";
  territoryId: number | null;
  territoryName: string;
  panelAccess: boolean;
};

export type EventItem = {
  id: number;
  title: string;
  summary: string;
  eventType: string;
  startsAt: string;
  endsAt?: string | null;
  visibility: "public" | "members";
  status: string;
  placeName?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  googleMapsUrl?: string;
  mapsEmbedUrl?: string;
};

export type NewsItem = {
  slug: string;
  tag: string;
  title: string;
  summary: string;
  body?: string;
  image: string;
  featured: number;
  published_at: string;
};

export type CauseSummary = {
  slug: string;
  title: string;
  summary: string;
  status_label: string;
  progress: number;
  progress_from: string;
  progress_next: string;
  lead_image?: string;
};

export type HomePayload = {
  news: NewsItem[];
  cause: CauseSummary | null;
  events: EventItem[];
  stats: { territorios: string; causasActivas: string; municipios: string };
};
