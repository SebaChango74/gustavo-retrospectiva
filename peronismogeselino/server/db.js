import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MIGRATIONS } from "./migrations.js";
import { seed } from "./seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// PG_DATA_DIR permite montar un volumen persistente en producción.
const DATA_DIR = process.env.PG_DATA_DIR || path.join(__dirname, "..", "data");
const DB_FILE = process.env.PG_DB_FILE || path.join(DATA_DIR, "peronismogeselino.sqlite");

let db = null;

export function getDb() {
  if (db) return db;
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  db = new DatabaseSync(DB_FILE);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  migrate(db);
  seed(db);
  return db;
}

function migrate(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`);
  const applied = new Set(
    db.prepare("SELECT name FROM _migrations").all().map((r) => r.name),
  );
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.name)) continue;
    db.exec("BEGIN");
    try {
      db.exec(migration.sql);
      db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(migration.name);
      db.exec("COMMIT");
      console.log(`migración aplicada: ${migration.name}`);
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}

/** Solo para pruebas: abre una base efímera en memoria. */
export function openTestDb() {
  const testDb = new DatabaseSync(":memory:");
  testDb.exec("PRAGMA foreign_keys = ON;");
  migrate(testDb);
  seed(testDb);
  return testDb;
}
