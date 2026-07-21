// Migraciones del esquema. Cada entrada se ejecuta una sola vez, en orden,
// y queda registrada en la tabla _migrations.

export const MIGRATIONS = [
  {
    name: "001_esquema_inicial",
    sql: `
      CREATE TABLE territories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        name TEXT NOT NULL DEFAULT '',
        picture TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL DEFAULT 'member'
          CHECK (role IN ('admin','editor','moderator','referente','member')),
        status TEXT NOT NULL DEFAULT 'invited'
          CHECK (status IN ('invited','active','suspended')),
        territory_id INTEGER REFERENCES territories(id) ON DELETE SET NULL,
        invited_by INTEGER REFERENCES members(id) ON DELETE SET NULL,
        last_login_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE sessions (
        token_hash TEXT PRIMARY KEY,
        member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE,
        tag TEXT NOT NULL DEFAULT 'Villa Gesell',
        title TEXT NOT NULL,
        summary TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '',
        image TEXT NOT NULL DEFAULT '',
        featured INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft','published','archived')),
        published_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE causes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        summary TEXT NOT NULL DEFAULT '',
        status_label TEXT NOT NULL DEFAULT 'EN GESTIÓN',
        progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
        progress_from TEXT NOT NULL DEFAULT '',
        progress_next TEXT NOT NULL DEFAULT '',
        lead_image TEXT NOT NULL DEFAULT '',
        brief_title TEXT NOT NULL DEFAULT '¿QUÉ ESTÁ PASANDO?',
        brief_body TEXT NOT NULL DEFAULT '',
        bullets TEXT NOT NULL DEFAULT '[]',
        key_fact_value TEXT NOT NULL DEFAULT '',
        key_fact_label TEXT NOT NULL DEFAULT '',
        next_steps TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft','published','archived')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE cause_timeline (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cause_id INTEGER NOT NULL REFERENCES causes(id) ON DELETE CASCADE,
        date_label TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL,
        body TEXT NOT NULL DEFAULT '',
        state TEXT NOT NULL DEFAULT 'pending'
          CHECK (state IN ('done','current','pending')),
        position INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        summary TEXT NOT NULL DEFAULT '',
        event_type TEXT NOT NULL DEFAULT 'ACTIVIDAD',
        starts_at TEXT NOT NULL,
        ends_at TEXT,
        place_name TEXT NOT NULL DEFAULT '',
        address TEXT NOT NULL DEFAULT '',
        latitude REAL,
        longitude REAL,
        google_maps_url TEXT NOT NULL DEFAULT '',
        visibility TEXT NOT NULL DEFAULT 'public'
          CHECK (visibility IN ('public','members')),
        status TEXT NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft','published','cancelled')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE event_rsvps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        response TEXT NOT NULL DEFAULT 'yes' CHECK (response IN ('yes','no')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE (event_id, member_id)
      );

      CREATE TABLE questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL
          CHECK (category IN ('biography','governments','rights','history','culture')),
        prompt TEXT NOT NULL,
        options TEXT NOT NULL,
        correct_option INTEGER NOT NULL CHECK (correct_option BETWEEN 0 AND 3),
        explanation TEXT NOT NULL DEFAULT '',
        source_title TEXT NOT NULL DEFAULT '',
        source_url TEXT NOT NULL DEFAULT '',
        difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
        enabled INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE quiz_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        correct INTEGER NOT NULL,
        total INTEGER NOT NULL,
        score INTEGER NOT NULL,
        duration_ms INTEGER,
        member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE threads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        eyebrow TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL,
        moderation_note TEXT NOT NULL DEFAULT '',
        cause_id INTEGER REFERENCES causes(id) ON DELETE SET NULL,
        territory_id INTEGER REFERENCES territories(id) ON DELETE SET NULL,
        pinned INTEGER NOT NULL DEFAULT 0,
        locked INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'open'
          CHECK (status IN ('open','closed','hidden')),
        created_by INTEGER REFERENCES members(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
        member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'visible'
          CHECK (status IN ('visible','hidden','deleted')),
        hidden_reason TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        body TEXT NOT NULL DEFAULT '',
        event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
        pinned INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'published'
          CHECK (status IN ('draft','published','archived')),
        created_by INTEGER REFERENCES members(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        url TEXT NOT NULL DEFAULT '',
        kind TEXT NOT NULL DEFAULT 'link'
          CHECK (kind IN ('document','image','video','link')),
        status TEXT NOT NULL DEFAULT 'published'
          CHECK (status IN ('draft','published','archived')),
        created_by INTEGER REFERENCES members(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actor_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        entity TEXT NOT NULL DEFAULT '',
        entity_id INTEGER,
        detail TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX idx_news_status ON news(status, published_at);
      CREATE INDEX idx_events_starts ON events(status, visibility, starts_at);
      CREATE INDEX idx_posts_thread ON posts(thread_id, status);
      CREATE INDEX idx_sessions_member ON sessions(member_id);
      CREATE INDEX idx_quiz_results_created ON quiz_results(created_at);
    `,
  },
];
