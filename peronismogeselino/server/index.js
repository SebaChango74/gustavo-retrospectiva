import { createApp, ensureAdmins } from "./app.js";
import { getDb } from "./db.js";

const PORT = Number(process.env.PORT || 4600);

const db = getDb();
ensureAdmins(db);
const app = createApp(db);

const server = app.listen(PORT, () => {
  console.log(`gustavobarrera.com + /peronismogeselino escuchando en :${PORT}`);
});

/**
 * Apagado ordenado. Sin esto, cuando la plataforma manda la señal de cierre
 * durante un despliegue, el proceso muere de golpe y se reporta como caída.
 */
let cerrando = false;
for (const senal of ["SIGTERM", "SIGINT"]) {
  process.on(senal, () => {
    if (cerrando) return;
    cerrando = true;
    console.log(`${senal} recibido: cerrando`);
    const salir = () => {
      try {
        db.close();
      } catch {}
      process.exit(0);
    };
    server.close(salir);
    setTimeout(salir, 8000).unref();
  });
}
