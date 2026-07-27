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

MIGRATIONS.push({
  name: "002_peron365",
  sql: `
    CREATE TABLE peron365_quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      short_text TEXT NOT NULL DEFAULT '',
      author TEXT NOT NULL DEFAULT 'Juan Domingo Perón',
      source_title TEXT NOT NULL,
      source_type TEXT NOT NULL DEFAULT 'discurso',
      source_date TEXT NOT NULL DEFAULT '',
      source_url TEXT NOT NULL DEFAULT '',
      source_locator TEXT NOT NULL DEFAULT '',
      historical_context TEXT NOT NULL DEFAULT '',
      topic TEXT NOT NULL DEFAULT '',
      verification_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (verification_status IN ('draft','in_review','verified','rejected')),
      verified_by TEXT NOT NULL DEFAULT '',
      verified_at TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE peron365_days (
      day_key TEXT PRIMARY KEY,
      quote_id INTEGER NOT NULL REFERENCES peron365_quotes(id),
      theme TEXT NOT NULL DEFAULT 'almanaque',
      status TEXT NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled','published')),
      opens INTEGER NOT NULL DEFAULT 0,
      shares INTEGER NOT NULL DEFAULT 0,
      published_at TEXT,
      created_by INTEGER REFERENCES members(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE peron365_saves (
      member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      day_key TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (member_id, day_key)
    );

    CREATE INDEX idx_p365_quotes_status ON peron365_quotes(verification_status, active);
    CREATE INDEX idx_p365_days_quote ON peron365_days(quote_id, day_key);
  `,
});

// Estructura de colaboradores: admin builder / admin manager / editores con
// aprobación. Sin recrear tablas (columnas agregadas de forma segura).
MIGRATIONS.push({
  name: "003_colaboradores",
  sql: `
    -- Nivel de administración: 'builder' (acceso total) o 'manager'
    -- (aprueba y controla editores, sin decidir diseño/estructura/config).
    ALTER TABLE members ADD COLUMN admin_tier TEXT NOT NULL DEFAULT 'builder';

    -- Contenido a la espera de aprobación de un admin (lo envía un editor).
    ALTER TABLE news ADD COLUMN pending INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE causes ADD COLUMN pending INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE events ADD COLUMN pending INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE announcements ADD COLUMN pending INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE materials ADD COLUMN pending INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE news ADD COLUMN submitted_by INTEGER;
    ALTER TABLE causes ADD COLUMN submitted_by INTEGER;
    ALTER TABLE events ADD COLUMN submitted_by INTEGER;
    ALTER TABLE announcements ADD COLUMN submitted_by INTEGER;
    ALTER TABLE materials ADD COLUMN submitted_by INTEGER;
  `,
});

MIGRATIONS.push({
  name: "004_ingreso_por_whatsapp",
  foreignKeysOff: true,
  sql: `
    -- El ingreso pasa a ser por WhatsApp + nombre. El correo deja de
    -- identificar a nadie y queda como dato de contacto opcional, así que hay
    -- que rehacer la tabla: antes era obligatorio y único.
    -- legacy_alter_table evita que el RENAME reescriba las referencias que las
    -- demás tablas ya tienen apuntando a "members".
    PRAGMA legacy_alter_table = ON;

    CREATE TABLE members_nuevo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      -- WhatsApp normalizado (solo dígitos). Es la identidad de la persona.
      phone TEXT,
      name TEXT NOT NULL DEFAULT '',
      -- Correo opcional, solo contacto.
      email TEXT COLLATE NOCASE,
      affiliate_number TEXT NOT NULL DEFAULT '',
      picture TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'member'
        CHECK (role IN ('admin','editor','moderator','referente','member')),
      admin_tier TEXT NOT NULL DEFAULT 'builder',
      status TEXT NOT NULL DEFAULT 'invited'
        CHECK (status IN ('invited','active','suspended')),
      territory_id INTEGER REFERENCES territories(id) ON DELETE SET NULL,
      invited_by INTEGER REFERENCES members(id) ON DELETE SET NULL,
      -- Clave personal. Solo la usan quienes aprueban y publican (admins).
      key_hash TEXT NOT NULL DEFAULT '',
      key_salt TEXT NOT NULL DEFAULT '',
      last_login_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT INTO members_nuevo
      (id, phone, name, email, picture, role, admin_tier, status,
       territory_id, invited_by, last_login_at, created_at)
    SELECT id, NULL, name, NULLIF(email, ''), picture, role, admin_tier, status,
           territory_id, invited_by, last_login_at, created_at
    FROM members;

    DROP TABLE members;
    ALTER TABLE members_nuevo RENAME TO members;

    -- Un WhatsApp = una persona; un correo = una persona. Índices parciales
    -- para que puedan convivir muchas filas sin teléfono o sin correo.
    CREATE UNIQUE INDEX idx_members_phone ON members(phone) WHERE phone IS NOT NULL;
    CREATE UNIQUE INDEX idx_members_email ON members(email) WHERE email IS NOT NULL;

    -- Solicitudes de ingreso: quedan acá hasta que un admin apruebe o rechace.
    CREATE TABLE access_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      affiliate_number TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','approved','rejected')),
      decided_by INTEGER REFERENCES members(id) ON DELETE SET NULL,
      decided_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    PRAGMA legacy_alter_table = OFF;
  `,
});
