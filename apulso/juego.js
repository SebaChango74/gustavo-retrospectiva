/* A pulso — juego de tres intentos que no se puede ganar.
   La alcancía es el Presupuesto 2024; la carga se paga a precios de 2026. */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var escena = $("escena"), gustavo = $("gustavo"), chancho = $("chancho");
  var chanchoImg = $("chancho-img"), globo = $("chancho-globo"), cartel = $("cartel");
  var nivel = $("medidor-nivel"), toca = $("toca"), porc = $("porcentaje"), discoNuevo = $("disco-nuevo");
  var poses = {};
  [].forEach.call(gustavo.querySelectorAll("img"), function (i) { poses[i.dataset.pose] = i; });

  /* Ningún área llega a cubrirse: cada intento rinde menos que el anterior.
     suba: cuánto sube la barra por toque · baja: cuánto cae por segundo
     base: hasta dónde llega la fuerza sola · max: hasta dónde llega con la plata
     monedas: cuántas se pueden sacar de la alcancía en ese intento */
  var INTENTOS = [
    { disco: "seguridad", nombre: "SEGURIDAD", corto: "Seguridad", suba: 0.045, baja: 0.1, base: 0.2, max: 0.5, monedas: 3 },
    { disco: "salud", nombre: "SALUD", corto: "Salud", suba: 0.035, baja: 0.09, base: 0.12, max: 0.3, monedas: 3 },
    { disco: "obras", nombre: "OBRAS Y SERVICIOS", corto: "Obras y servicios", suba: 0.025, baja: 0.06, base: 0.1, max: 0.1, monedas: 0 },
  ];
  // Cada moneda que sale de la alcancía es más chica que la anterior.
  var TAMANOS = [1, 0.85, 0.7, 0.55, 0.42, 0.3];

  var e = {}; // estado
  var temporizadores = [];
  function luego(ms, fn) { temporizadores.push(setTimeout(fn, ms)); }
  function limpiarTemporizadores() { temporizadores.forEach(clearTimeout); temporizadores = []; }

  /* ───────── Sonido (sintetizado, sin archivos) ───────── */
  var audio = null, mudo = false;
  function tono(frec, dur, tipo, vol, hasta) {
    if (mudo) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
      o.type = tipo || "sine";
      o.frequency.setValueAtTime(frec, t);
      if (hasta) o.frequency.exponentialRampToValueAtTime(hasta, t + dur);
      g.gain.setValueAtTime(vol || 0.08, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(audio.destination);
      o.start(t); o.stop(t + dur);
    } catch (_) { /* sin sonido no pasa nada */ }
  }
  var son = {
    toque: function () { tono(180 + e.p * 320, 0.06, "triangle", 0.06); },
    moneda: function (i) { tono(1300 - i * 150, 0.09, "square", 0.04); luego(70, function () { tono(1750 - i * 200, 0.14, "square", 0.04); }); },
        vacio: function () { tono(140, 0.22, "sawtooth", 0.06, 70); },
    disco: function () { tono(90, 0.3, "sine", 0.2, 45); },
    final: function () { [392, 330, 262, 196].forEach(function (f, i) { luego(i * 220, function () { tono(f, 0.4, "triangle", 0.09); }); }); },
  };

  /* ───────── Dibujo ───────── */
  function pose(nombre) {
    if (e.pose === nombre) return;
    e.pose = nombre;
    for (var k in poses) poses[k].classList.toggle("ver", k === nombre);
  }
  function decir(html, clase) {
    cartel.className = "ver" + (clase ? " " + clase : "");
    cartel.innerHTML = html;
  }
  function callar() { cartel.className = ""; }
  function alcancia() {
    var img = e.fondos > 0.6 ? "lleno" : e.fondos > 0.05 ? "medio" : "vacio";
    if (e.chancho !== img) { e.chancho = img; chanchoImg.src = "img/chancho-" + img + ".webp"; }
  }
  function dibujar() {
    var esfuerzo = e.intento > 0 || e.pidio;
    if (e.p < 0.28) pose(esfuerzo && e.p > 0.03 ? "esfuerzo-piso" : "listo");
    else pose(esfuerzo ? "esfuerzo-pecho" : "pecho");
    nivel.style.height = Math.round(e.p * 100) + "%";
    porc.textContent = Math.round(e.p * 100) + "%";
    gustavo.classList.toggle("tiembla", e.fase !== "espera" && e.p > 0.03 && esfuerzo);
    alcancia();
  }

  /* ───────── Flujo ───────── */
  function empezar() {
    limpiarTemporizadores();
    e = { intento: -1, p: 0, fondos: 1, sacadas: 0, fase: "espera", pose: null, chancho: null };
    [].forEach.call(document.querySelectorAll(".hueco"), function (h) { h.classList.remove("puesto"); h.textContent = ""; });
    chancho.className = "";
    escena.dataset.pantalla = "juego";
    pose("listo");
    alcancia();
    siguienteIntento();
  }

  function siguienteIntento() {
    e.intento++;
    var n = e.intento, c = INTENTOS[n];
    e.fase = "espera"; e.p = 0; e.tope = c.base; e.monedas = 0; e.pidio = false;
    e.toquesVacio = 0; e.toques = 0;
    callar(); toca.classList.remove("ver"); chancho.classList.remove("pide");
    $("intento-txt").textContent = "Intento " + (n + 1) + " de 3";
    [].forEach.call(document.querySelectorAll(".punto"), function (p, i) {
      p.className = "punto" + (i < n ? " hecho" : i === n ? " actual" : "");
    });
    dibujar();

    // Presentación del disco de este intento.
    discoNuevo.querySelector("img").src = "img/disco-" + c.disco + ".webp";
    discoNuevo.querySelector("b").innerHTML = (n === 0 ? "Levantá:<br>" : "Ahora levantá:<br>") + c.nombre;
    discoNuevo.classList.remove("ver"); void discoNuevo.offsetWidth; discoNuevo.classList.add("ver");
    son.disco();
    luego(1500, function () {
      discoNuevo.classList.remove("ver");
      document.querySelector('.hueco[data-disco="' + c.disco + '"]').classList.add("puesto");
      e.fase = "juego";
      toca.classList.add("ver");
    });
  }

  function toque() {
    if (e.fase !== "juego") return;
    var c = INTENTOS[e.intento];
    e.toques++;
    if (e.toques === 3) toca.classList.remove("ver");
    e.p = Math.min(e.tope, e.p + c.suba);
    son.toque();
    gustavo.classList.remove("golpe"); void gustavo.offsetWidth; gustavo.classList.add("golpe");

    var enTope = e.p >= e.tope - 0.001;
    // Con toda la plata disponible ya puesta, hasta acá llega.
    if (enTope && c.monedas > 0 && e.monedas >= c.monedas) return cierre();

    // La fuerza sola no alcanza: hay que ir a la alcancía.
    if (enTope && !e.pidio) {
      e.pidio = true;
      chancho.classList.add("pide");
      decir(e.intento === 2 ? "¡No se mueve!<small>Sacá plata de la alcancía</small>"
        : "¡No alcanza!<small>Sacá plata de la alcancía</small>", "alerta");
      // En el último intento no hay de dónde sacar: se termina solo.
      if (e.intento === 2) luego(5500, cierre);
    }
    dibujar();
  }

  function tocarChancho(ev) {
    ev.stopPropagation();
    if (e.fase !== "juego" || !e.pidio) return toque();
    var c = INTENTOS[e.intento];

    if (e.monedas < c.monedas) {
      e.tope = Math.min(c.max, e.tope + (c.max - c.base) / c.monedas + 0.0001);
      lanzarMoneda(TAMANOS[e.sacadas]);
      son.moneda(e.sacadas);
      e.monedas++; e.sacadas++;
      e.fondos = 1 - e.sacadas / 6;
      if (e.monedas === 2) {
        decir("Son pesos de 2024…<small>y hoy todo cuesta precios de 2026</small>", "alerta");
        $("calendario").classList.remove("late"); void $("calendario").offsetWidth; $("calendario").classList.add("late");
      }
      if (e.monedas === c.monedas) {
        chancho.classList.remove("pide");
        decir(e.intento === 0 ? "Lo que queda es para Salud y Obras<small>¡Seguí tocando para levantar!</small>"
          : "Se vació la alcancía<small>¡Seguí tocando para levantar!</small>", "alerta");
        toca.classList.add("ver"); luego(1200, function () { toca.classList.remove("ver"); });
      }
      dibujar();
      return;
    }

    // No se puede sacar más.
    chancho.classList.remove("sacude"); void chancho.offsetWidth; chancho.classList.add("sacude");
    globo.textContent = e.fondos > 0.05 ? "¡NO ALCANZA!" : "¡VACÍA!";
    globo.classList.remove("ver"); void globo.offsetWidth; globo.classList.add("ver");
    son.vacio();
    if (e.intento === 2) {
      e.toquesVacio++;
      if (e.toquesVacio === 1) decir("No queda nada<small>El Presupuesto 2024 ya se gastó</small>", "alerta");
      if (e.toquesVacio >= 3) luego(500, cierre);
    }
  }

  function lanzarMoneda(tam) {
    var m = document.createElement("img");
    m.src = "img/moneda.webp"; m.className = "moneda"; m.alt = "";
    var a = chancho.getBoundingClientRect(), b = gustavo.getBoundingClientRect(), s = escena.getBoundingClientRect();
    m.style.left = (a.left - s.left + a.width * 0.45) + "px";
    m.style.top = (a.top - s.top + a.height * 0.1) + "px";
    m.style.transform = "scale(" + tam + ")";
    escena.appendChild(m);
    var dx = b.left + b.width / 2 - (a.left + a.width * 0.55), dy = b.top + b.height * 0.5 - a.top;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        m.style.transform = "translate(" + dx + "px," + dy + "px) scale(" + tam * 0.6 + ")";
        m.style.opacity = "0.2";
      });
    });
    setTimeout(function () { m.remove(); }, 650);
  }

  // Fin de un intento: nunca se llega arriba, queda anotado hasta dónde.
  function cierre() {
    if (e.fase !== "juego") return;
    var c = INTENTOS[e.intento], pct = Math.round(c.max * 100);
    e.fase = "cierre"; e.p = c.max;
    chancho.classList.remove("pide"); toca.classList.remove("ver");
    dibujar(); son.vacio();
    document.querySelector('.hueco[data-disco="' + c.disco + '"]').textContent = pct + "%";
    decir(c.corto + ": solo al " + pct + "%<small>Hasta ahí llegó la plata</small>", "alerta");
    luego(2400, e.intento === 2 ? terminar : siguienteIntento);
  }

  function terminar() {
    if (e.fase === "final") return;
    limpiarTemporizadores();
    e.fase = "final"; e.p = 0;
    callar(); toca.classList.remove("ver"); chancho.classList.remove("pide");
    gustavo.classList.remove("tiembla");
    son.final();
    escena.dataset.pantalla = "final";
  }

  // La barra cae sola si se deja de tocar.
  var antes = performance.now();
  function cuadro(ahora) {
    var dt = Math.min(0.1, (ahora - antes) / 1000); antes = ahora;
    if (e.fase === "juego" && e.p > 0) {
      e.p = Math.max(0, e.p - INTENTOS[e.intento].baja * dt);
      dibujar();
    }
    requestAnimationFrame(cuadro);
  }
  requestAnimationFrame(cuadro);

  /* ───────── Compartir ───────── */
  var enlace = location.origin + location.pathname;
  var mensaje = "Probá levantar la ciudad en 3 intentos 💪 " + enlace;
  $("whatsapp").href = "https://wa.me/?text=" + encodeURIComponent(mensaje);
  $("copiar").addEventListener("click", function () {
    var boton = this, listo = function () {
      boton.textContent = "¡Copiado!";
      setTimeout(function () { boton.textContent = "Copiar link"; }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(enlace).then(listo, function () { prompt("Copiá el link:", enlace); });
    } else { prompt("Copiá el link:", enlace); }
  });

  /* ───────── Entradas ───────── */
  $("jugar").addEventListener("click", empezar);
  $("otra").addEventListener("click", empezar);
  chancho.addEventListener("pointerdown", tocarChancho);
  $("sonido").addEventListener("pointerdown", function (ev) {
    ev.stopPropagation(); mudo = !mudo; this.textContent = mudo ? "🔇" : "🔊";
  });
  $("juego").addEventListener("pointerdown", function (ev) { ev.preventDefault(); toque(); });
  document.addEventListener("keydown", function (ev) {
    if (ev.repeat) return;
    if (ev.code === "Space" || ev.code === "Enter") {
      if (escena.dataset.pantalla === "juego") { ev.preventDefault(); toque(); }
    }
  });
  document.addEventListener("contextmenu", function (ev) { ev.preventDefault(); });
})();
