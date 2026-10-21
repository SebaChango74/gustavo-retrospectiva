// Renderiza las placas de redes a JPG en tamaño exacto.
import { createRequire } from "node:module";
const require = createRequire("/opt/node22/lib/node_modules/playwright/index.js");
const { chromium } = require("playwright");
const DIR = "/tmp/claude-0/-home-user-gustavo-retrospectiva/eb6a7ca4-bd64-5c91-9161-d7a322fc3fb2/scratchpad/redes/";
const OUT = process.argv[2] || DIR + "out/";
const PLACAS = [["feed1", 1080, 1350, "carrusel-1-que-ves"], ["feed2", 1080, 1350, "carrusel-2-faltaba-luz"], ["feed3", 1080, 1350, "carrusel-3-una-gestion-que-se-ve"], ["guia", 1080, 1920, "GUIA-encuesta-historia-1"]];
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--allow-file-access-from-files"] });
for (const [k, w, h, nombre] of PLACAS) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.goto(`file://${DIR}placa.html#${k}`);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}${nombre}.jpg`, type: "jpeg", quality: 92, clip: { x: 0, y: 0, width: w, height: h } });
  console.log(nombre, `${w}×${h}`);
  await page.close();
}
await browser.close();
