import fs from "node:fs";
import path from "node:path";

const KEEP = 7; // copias diarias que se conservan

/**
 * Respaldo de la base: una copia por día junto a los datos, conservando las
 * últimas 7. Usa la API de respaldo de SQLite, así que es consistente incluso
 * con el servidor en uso (no copia un archivo a medio escribir).
 */
export function scheduleBackups(db, dbFile) {
  const dir = path.join(path.dirname(dbFile), "backups");

  const run = async () => {
    try {
      fs.mkdirSync(dir, { recursive: true });
      const stamp = new Date().toISOString().slice(0, 10);
      const target = path.join(dir, `peronismogeselino-${stamp}.sqlite`);
      if (fs.existsSync(target)) return; // ya hay copia de hoy

      if (typeof db.backup === "function") {
        await db.backup(target);
      } else {
        // Reserva por si la versión de Node no expone backup().
        db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
      }

      const old = fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".sqlite"))
        .sort()
        .slice(0, -KEEP);
      for (const file of old) fs.rmSync(path.join(dir, file), { force: true });
      console.log(`respaldo creado: ${path.basename(target)}`);
    } catch (error) {
      console.error("no se pudo crear el respaldo:", error.message);
    }
  };

  run();
  const timer = setInterval(run, 24 * 60 * 60 * 1000);
  timer.unref?.();
}
