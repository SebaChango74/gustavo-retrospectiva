/* A pulso — juego de tres intentos que no se puede ganar.
   La alcancía es el Presupuesto 2024; la carga se paga a precios de 2026. */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var escena = $("escena"), gustavo = $("gustavo"), chancho = $("chancho");
  var chanchoImg = $("chancho-img"), globo = $("chancho-globo"), cartel = $("cartel");
  var nivel = $("medidor-nivel"), toca = $("toca"), discoNuevo = $("disco-nuevo");
  var poses = {};
  [].forEach.call(gustavo.querySelectorAll("img"), function (i) { poses[i.dataset.pose] = i; });

  /* Cada intento suma un disco a la misma barra.
     suba: cuánto sube la barra por toque · baja: cuánto cae por segundo
     tope: hasta dónde llega la fuerza sin plata extra */
  var INTENTOS = [
    { disco: "seguridad", nombre: "SEGURIDAD", suba: 0.07, baja: 0.12, tope: 1 },
    { disco: "salud", nombre: "SALUD", suba: 0.055, baja: 0.14, tope: 0.45 },
    { disco: "obras", nombre: "OBRAS Y SERVICIOS", suba: 0.03, baja: 0.08, tope: 0.1 },
  ];
  // Cada moneda que sale de la alcancía rinde menos que la anterior.
  var MONEDAS = [
    { tam: 1, rinde: 0.2 }, { tam: 0.78, rinde: 0.15 }, { tam: 0.58, rinde: 0.1 },
    { tam: 0.42, rinde: 0.07 }, { tam: 0.28, rinde: 0.04 },
  ];

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
    logro: function () { [523, 659, 784, 1047].forEach(function (f, i) { luego(i * 90, function () { tono(f, 0.18, "triangle", 0.09); }); }); },
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
    var n = e.intento, pesado = n > 0;
    if (e.fase === "logro") pose("arriba");
    else if (n === 2) pose("esfuerzo-piso");
    else if (e.p < 0.3) pose(pesado && e.p > 0.04 ? "esfuerzo-piso" : "listo");
    else pose(pesado ? "esfuerzo-pecho" : "pecho");
    nivel.style.height = Math.round(e.p * 100) + "%";
    gustavo.classList.toggle("tiembla", e.fase === "juego" && (pesado ? e.p > 0.04 : e.p > 0.6));
    alcancia();
  }

  /* ───────── Flujo ───────── */
  function empezar() {
    limpiarTemporizadores();
    e = { intento: -1, p: 0, fondos: 1, fase: "espera", pose: null, chancho: null };
    [].forEach.call(document.querySelectorAll(".hueco"), function (h) { h.classList.remove("puesto"); });
    chancho.className = "";
    escena.dataset.pantalla = "juego";
    pose("listo");
    alcancia();
    siguienteIntento();
  }

  function siguienteIntento() {
    e.intento++;
    var n = e.intento, c = INTENTOS[n];
    e.fase = "espera"; e.p = 0; e.tope = c.tope; e.monedas = 0; e.pidio = false;
    e.toquesVacio = 0; e.toques = 0;
    callar(); toca.classList.remove("ver"); chancho.classList.remove("pide");
    $("intento-txt").textContent = "Intento " + (n + 1) + " de 3";
    [].forEach.call(document.querySelectorAll(".punto"), function (p, i) {
      p.className = "punto" + (i < n ? " hecho" : i === n ? " actual" : "");
    });
    dibujar();

    // Presentación del disco que se suma a la barra.
    discoNuevo.querySelector("img").src = "img/disco-" + c.disco + ".webp";
    discoNuevo.querySelector("b").innerHTML = n === 0 ? "Levantá:<br>" + c.nombre : "Ahora sumale:<br>" + c.nombre;
    discoNuevo.classList.remove("ver"); void discoNuevo.offsetWidth; discoNuevo.classList.add("ver");
    son.disco();
    luego(1500, function () {
      discoNuevo.classList.remove("ver");
      document.querySelector('.hueco[data-disco="' + c.disco + '"]').classList.add("puesto");
      e.fase = "juego"; e.inicio = performance.now();
      toca.classList.add("ver");
      if (n === 2) luego(9000, function () { if (e.fase === "juego" && e.intento === 2) terminar(); });
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

    if (e.intento === 0) e.fondos = Math.min(e.fondos, 1 - e.p * 0.5); // levantar cuesta plata
    if (e.p >= 1) return logro();

    // La fuerza sola no alcanza: hay que ir a la alcancía.
    if ((e.p >= e.tope - 0.001 || (e.intento === 2 && e.toques >= 5)) && !e.pidio) {
      e.pidio = true;
      chancho.classList.add("pide");
      if (e.intento === 1) decir("¡No alcanza!<small>Sacá plata de la alcancía</small>", "alerta");
      else decir("¡No se mueve!<small>Sacá plata de la alcancía</small>", "alerta");
    }
    dibujar();
  }

  function tocarChancho(ev) {
    ev.stopPropagation();
    if (e.fase !== "juego" || !e.pidio) return toque();

    if (e.intento === 1 && e.monedas < MONEDAS.length) {
      var m = MONEDAS[e.monedas];
      e.tope = Math.min(1.001, e.tope + m.rinde);
      e.fondos = 0.5 * (1 - (e.monedas + 1) / MONEDAS.length);
      lanzarMoneda(m.tam);
      son.moneda(e.monedas);
      e.monedas++;
      if (e.monedas === 2) {
        decir("Son pesos de 2024…<small>y hoy todo cuesta precios de 2026</small>", "alerta");
        $("calendario").classList.remove("late"); void $("calendario").offsetWidth; $("calendario").classList.add("late");
      }
      if (e.monedas === MONEDAS.length) {
        chancho.classList.remove("pide");
        decir("Se vació la alcancía<small>¡Seguí tocando para levantar!</small>", "alerta");
        toca.classList.add("ver"); luego(1200, function () { toca.classList.remove("ver"); });
      }
      dibujar();
      return;
    }

    // Alcancía vacía.
    chancho.classList.remove("sacude"); void chancho.offsetWidth; chancho.classList.add("sacude");
    globo.textContent = "¡VACÍA!";
    globo.classList.remove("ver"); void globo.offsetWidth; globo.classList.add("ver");
    son.vacio();
    if (e.intento === 2) {
      e.toquesVacio++;
      if (e.toquesVacio === 1) decir("No queda nada<small>El Presupuesto 2024 ya se gastó</small>", "alerta");
      if (e.toquesVacio >= 3) luego(500, terminar);
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

  function logro() {
    e.fase = "logro"; e.p = 1;
    chancho.classList.remove("pide"); toca.classList.remove("ver");
    dibujar(); son.logro();
    if (e.intento === 0) decir("¡Arriba!<small>Pero la alcancía ya bajó a la mitad</small>", "bien");
    else decir("¡Llegó justo!<small>Y la alcancía quedó vacía</small>", "bien");
    luego(2300, siguienteIntento);
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
      // En el último intento, apenas se nota que no hay forma, se termina.
      if (e.intento === 2 && e.pidio && ahora - e.inicio > 6500) terminar();
      else dibujar();
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
