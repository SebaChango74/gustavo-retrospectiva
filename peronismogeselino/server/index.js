import { createApp, ensureAdmins } from "./app.js";
import { getDb } from "./db.js";

const PORT = Number(process.env.PORT || 4600);

const db = getDb();
ensureAdmins(db);
const app = createApp(db);

app.listen(PORT, () => {
  console.log(`gustavobarrera.com + /peronismogeselino escuchando en :${PORT}`);
});
