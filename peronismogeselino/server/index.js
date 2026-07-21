import { createApp } from "./app.js";

const PORT = Number(process.env.PORT || 4600);

const app = createApp();

app.listen(PORT, () => {
  console.log(`gustavobarrera.com + /peronismogeselino escuchando en :${PORT}`);
});
