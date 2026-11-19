/*!
 * Emergente del juego «A pulso».
 * Se instala igual en la web y en la app, pegando una línea antes de </body>:
 *
 *   <script src="/apulso/emergente.js"></script>
 *
 * PARA DARLO DE BAJA: poner la fecha del último día en HASTA (acá abajo), o
 * quitar esa línea de las páginas. Pasada la fecha no aparece más y los otros
 * emergentes (frase de Perón en la app, alumbrado LED en la web) vuelven solos.
 *
 * Opciones (atributos data- del <script>, todas opcionales):
 *   data-hasta="AAAA-MM-DD"  Último día en que se muestra (pisa a HASTA).
 *   data-cada="1"            Días entre una aparición y la siguiente para la
 *                            misma persona (por defecto 1). "0" = cada visita.
 *   data-demora="1200"       Milisegundos de espera antes de abrirse.
 *   data-solo="/ruta/"       Mostrarlo únicamente en esa dirección exacta
 *                            (la app lo usa para que salga solo en la portada).
 *
 * Para probarlo sin esperar: agregar ?juego=1 a la dirección.
 * A mano: window.EmergenteAPulso.abrir() / .cerrar()
 *
 * Mientras está vigente, window.EmergenteAPulso.activo() devuelve true: los
 * otros emergentes lo consultan y no se abren, para no encimarse.
 */
(function () {
  "use strict";

  // Último día en que se muestra, "AAAA-MM-DD". Vacío = sin fecha de fin.
  var HASTA = "";

  var JUEGO = "/apulso/";
  var IMG = "/apulso/img/";

  var script = document.currentScript;
  var d = (script && script.dataset) || {};
  var cfg = {
    hasta: d.hasta || HASTA,
    cada: isNaN(+d.cada) || d.cada === undefined ? 1 : +d.cada,
    demora: isNaN(+d.demora) || d.demora === undefined ? 1200 : +d.demora,
    solo: d.solo || "",
    forzar: /[?&]juego=1(&|$)/.test(location.search),
    clave: "emergente-apulso-visto"
  };

  function vencido() {
    if (!cfg.hasta) return false;
    var fin = new Date(cfg.hasta + "T23:59:59");
    return isNaN(fin.getTime()) ? false : Date.now() > fin.getTime();
  }
  function vistoHace() {
    try {
      var v = localStorage.getItem(cfg.clave);
      return v ? Date.now() - Number(v) : Infinity;
    } catch (e) { return Infinity; }
  }
  function marcarVisto() {
    try { localStorage.setItem(cfg.clave, String(Date.now())); } catch (e) {}
  }
  function enSuLugar() {
    return !cfg.solo || location.pathname === cfg.solo;
  }
  function debeMostrar() {
    if (cfg.forzar) return true;
    if (vencido() || !enSuLugar()) return false;
    return vistoHace() > cfg.cada * 86400000;
  }

  var CSS =
    ".ap-fondo{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;padding:16px;" +
      "background:rgba(10,20,50,.78);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);" +
      "opacity:0;transition:opacity .25s;overflow:auto;-webkit-tap-highlight-color:transparent}" +
    ".ap-fondo.ap-ver{opacity:1}" +
    ".ap-fondo *{box-sizing:border-box;margin:0;padding:0}" +
    ".ap-tarjeta{position:relative;width:min(400px,100%);border-radius:26px;overflow:hidden;outline:none;" +
      "background:#7fc4ee url('" + IMG + "fondo.webp') center 38%/cover no-repeat;" +
      "box-shadow:0 26px 80px rgba(0,0,0,.55);color:#fff;text-align:center;" +
      "font-family:'Baloo 2','Arial Rounded MT Bold','Trebuchet MS',Arial,sans-serif;" +
      "transform:translateY(18px) scale(.96);transition:transform .3s cubic-bezier(.3,1.4,.5,1)}" +
    ".ap-ver .ap-tarjeta{transform:none}" +
    ".ap-cuerpo{display:flex;flex-direction:column;align-items:center;padding:22px 20px 20px;" +
      "background:linear-gradient(#14275cf2 0%,#14275cb8 30%,#14275c1a 52%,#14275c00 62%,#14275ce6 86%,#14275c 100%)}" +
    ".ap-ceja{font-size:13px;font-weight:800;letter-spacing:.14em;line-height:1;color:#14275c;background:#ffc928;" +
      "padding:6px 12px 4px;border-radius:20px}" +
    ".ap-titulo{font-size:68px;font-weight:800;line-height:.95;color:#ffc928;letter-spacing:.02em;margin-top:8px;" +
      "text-shadow:0 5px 0 #14275c,0 8px 18px rgba(0,0,0,.5)}" +
    ".ap-bajada{font-size:23px;font-weight:700;line-height:1.1;text-shadow:0 2px 0 rgba(0,0,0,.4)}" +
    ".ap-escena{position:relative;width:100%;height:250px;margin-top:6px}" +
    ".ap-gus{position:absolute;left:50%;bottom:0;height:100%;width:auto;transform:translateX(-50%);" +
      "filter:drop-shadow(0 8px 6px rgba(0,0,0,.45));animation:ap-tiembla .13s linear infinite}" +
    ".ap-chancho{position:absolute;left:0;bottom:4px;width:31%;height:auto;filter:drop-shadow(0 5px 4px rgba(0,0,0,.4))}" +
    ".ap-jugar{display:block;width:100%;margin-top:14px;padding:15px 12px 12px;border:0;border-radius:40px;cursor:pointer;" +
      "font:inherit;font-size:27px;font-weight:800;line-height:1;text-decoration:none;color:#14275c;background:#ffc928;" +
      "box-shadow:0 7px 0 #b98600,0 12px 20px rgba(0,0,0,.4);animation:ap-latido 1s ease-in-out infinite}" +
    ".ap-jugar:active{transform:translateY(4px);box-shadow:0 3px 0 #b98600}" +
    ".ap-nota{font-size:15px;font-weight:700;margin-top:14px;color:#ffe38a}" +
    ".ap-despues{margin-top:6px;border:0;background:none;cursor:pointer;font:inherit;font-size:15px;font-weight:700;" +
      "color:#fff;opacity:.85;text-decoration:underline;padding:6px 12px}" +
    ".ap-cerrar{position:absolute;top:10px;right:10px;z-index:2;width:40px;height:40px;border:0;border-radius:50%;cursor:pointer;" +
      "background:rgba(255,255,255,.2);color:#fff;font:700 24px/1 Arial,sans-serif}" +
    ".ap-fondo button:focus-visible,.ap-fondo a:focus-visible{outline:3px solid #fff;outline-offset:3px}" +
    "@keyframes ap-latido{50%{transform:scale(1.04)}}" +
    "@keyframes ap-tiembla{0%{margin-left:1px}50%{margin-left:-1px}100%{margin-left:1px}}" +
    "@media (max-height:640px){.ap-escena{height:170px}.ap-titulo{font-size:54px}.ap-bajada{font-size:20px}}" +
    "@media (prefers-reduced-motion:reduce){.ap-gus,.ap-jugar{animation:none}.ap-fondo,.ap-tarjeta{transition:none}}";

  var HTML =
    '<div class="ap-tarjeta" role="dialog" aria-modal="true" aria-labelledby="ap-titulo" tabindex="-1">' +
      '<button class="ap-cerrar" type="button" aria-label="Cerrar">×</button>' +
      '<div class="ap-cuerpo">' +
        '<span class="ap-ceja">NUEVO JUEGO</span>' +
        '<h2 class="ap-titulo" id="ap-titulo">A PULSO</h2>' +
        '<p class="ap-bajada">¿Podés levantar la ciudad?</p>' +
        '<div class="ap-escena">' +
          '<img class="ap-gus" src="' + IMG + 'esfuerzo-pecho.webp" alt="Caricatura de Gustavo haciendo fuerza para levantar una barra con pesas">' +
          '<img class="ap-chancho" src="' + IMG + 'chancho25-vacio.webp" alt="Alcancía vacía con el cartel Presupuesto 2025">' +
        '</div>' +
        '<a class="ap-jugar" href="' + JUEGO + '">JUGAR AHORA ▶</a>' +
        '<p class="ap-nota">Tenés 3 intentos</p>' +
        '<button class="ap-despues" type="button">Ahora no</button>' +
      '</div>' +
    '</div>';

  var raiz = null, focoPrevio = null;

  function alTeclado(ev) {
    if (ev.key === "Escape") return cerrar();
    if (ev.key !== "Tab" || !raiz) return;
    // El foco no sale del emergente mientras está abierto.
    var f = raiz.querySelectorAll("a[href],button");
    var primero = f[0], ultimo = f[f.length - 1];
    if (ev.shiftKey && document.activeElement === primero) { ev.preventDefault(); ultimo.focus(); }
    else if (!ev.shiftKey && document.activeElement === ultimo) { ev.preventDefault(); primero.focus(); }
  }

  function abrir() {
    if (raiz) return;
    if (!document.getElementById("ap-estilos")) {
      var fuente = document.createElement("link");
      fuente.rel = "stylesheet";
      fuente.href = "https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&display=swap";
      document.head.appendChild(fuente);
      var estilo = document.createElement("style");
      estilo.id = "ap-estilos";
      estilo.textContent = CSS;
      document.head.appendChild(estilo);
    }
    focoPrevio = document.activeElement;
    raiz = document.createElement("div");
    raiz.className = "ap-fondo";
    raiz.innerHTML = HTML;
    document.body.appendChild(raiz);
    raiz.addEventListener("click", function (ev) { if (ev.target === raiz) cerrar(); });
    raiz.querySelector(".ap-cerrar").addEventListener("click", cerrar);
    raiz.querySelector(".ap-despues").addEventListener("click", cerrar);
    document.addEventListener("keydown", alTeclado);
    void raiz.offsetWidth;
    raiz.classList.add("ap-ver");
    raiz.querySelector(".ap-tarjeta").focus();
    marcarVisto();
  }

  function cerrar() {
    if (!raiz) return;
    var viejo = raiz;
    raiz = null;
    document.removeEventListener("keydown", alTeclado);
    viejo.classList.remove("ap-ver");
    setTimeout(function () { viejo.remove(); }, 260);
    if (focoPrevio && focoPrevio.focus) { try { focoPrevio.focus(); } catch (e) {} }
  }

  window.EmergenteAPulso = {
    abrir: abrir,
    cerrar: cerrar,
    // true mientras el juego está en campaña: los otros emergentes no se abren.
    activo: function () { return !vencido(); },
    config: cfg
  };

  if (debeMostrar()) {
    var arrancar = function () { setTimeout(abrir, cfg.demora); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar);
    else arrancar();
  }
})();
