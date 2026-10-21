/*!
 * Emergente «UNA GESTIÓN QUE SE VE» — Municipalidad de Villa Gesell
 * Archivo único, autocontenido (las imágenes van adentro). Para instalarlo en
 * cualquier sitio alcanza con pegar una línea antes de </body>:
 *
 *   <script src="emergente-gesell.js" data-hasta="2026-11-30"></script>
 *
 * Opciones (todas opcionales, como atributos data- del <script>):
 *   data-hasta="AAAA-MM-DD"  Último día en que se muestra. Pasada esa fecha,
 *                            no aparece más: no hay que acordarse de sacarlo.
 *   data-cada="7"            Días entre una aparición y la siguiente para la
 *                            misma persona (por defecto 7). "0" = cada visita.
 *   data-demora="1200"       Milisegundos de espera antes de abrirse.
 *   data-siempre="1"         Mostrarlo siempre, ignorando fecha y frecuencia.
 *                            Útil para probar; no dejarlo en producción.
 *   data-audio-suspenso="…"  URL de una pista para el estado oscuro.
 *   data-audio-abierto="…"   URL de una pista para el estado encendido.
 *                            Si no se dan, el sonido se sintetiza en el
 *                            navegador (música genérica, para probar).
 *
 * El sonido arranca SOLO si la persona toca el botón del parlante: los
 * navegadores no permiten reproducir audio sin un gesto previo.
 *
 * También se puede manejar a mano: window.EmergenteGesell.abrir() / .cerrar()
 *
 * Accesibilidad: es un diálogo modal de verdad (role="dialog"), se cierra con
 * la tecla Escape o con la cruz, atrapa el foco mientras está abierto y lo
 * devuelve al cerrarse, y respeta la preferencia de menos animación.
 */
(function () {
  "use strict";

  var script = document.currentScript || (function () {
    var s = document.getElementsByTagName("script");
    return s[s.length - 1];
  })();
  var d = (script && script.dataset) || {};
  var cfg = {
    hasta: d.hasta || "",
    cada: isNaN(+d.cada) ? 7 : +d.cada,
    demora: isNaN(+d.demora) ? 1200 : +d.demora,
    // Para probarlo en el sitio en línea sin esperar los 7 días: agregar
    // ?emergente=1 a la dirección (p. ej. gustavobarrera.com/?emergente=1).
    siempre: d.siempre === "1" || d.siempre === "true" || /[?&]emergente=1(&|$)/.test(location.search),
    audioSuspenso: d.audioSuspenso || "",
    audioAbierto: d.audioAbierto || "",
    clave: "emergente-gesell-led-visto"
  };

  var IMG_OSCURA = "__OSCURA__";
  var IMG_LED = "__LED__";

  var CSS = "__CSS__";

  var ICONO_SONIDO =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M11 5 6 9H2v6h4l5 4z"/><path class="eg-onda" d="M15.5 8.5a5 5 0 0 1 0 7"/><path class="eg-onda" d="M18.5 5.5a9 9 0 0 1 0 13"/><path class="eg-mute" d="M22 9l-6 6M16 9l6 6"/>' +
    '</svg>';

  var HTML =
    '<div class="eg-root" id="eg-root">' +
      '<div class="eg-overlay" id="eg-overlay">' +
        '<div class="campaign" id="eg-campaign" role="dialog" aria-modal="true" aria-labelledby="eg-titulo" aria-label="Experiencia interactiva de alumbrado LED en Villa Gesell">' +
          '<button class="eg-sound" id="eg-sound" type="button" aria-pressed="false" aria-label="Activar sonido">' + ICONO_SONIDO + '</button>' +
          '<button class="eg-close" id="eg-close" type="button" aria-label="Cerrar">×</button>' +
          '<button class="scene" id="eg-scene" type="button" aria-label="Encender la luminaria LED para descubrir quién camina por la calle">' +
            '<img class="dark-img" src="' + IMG_OSCURA + '" alt="Una figura con capucha y un perro se acercan por una calle de arena, entre pinos, a la noche" draggable="false">' +
            '<img class="lit-img" src="' + IMG_LED + '" alt="Una mujer de pelo largo pasea tranquila con su perro por una calle de arena bien iluminada" draggable="false">' +
            '<span class="flash" aria-hidden="true"></span><span class="photo-label" id="eg-photo-label">Luz tenue</span>' +
            '<span class="scene-hint" aria-hidden="true"><span>VILLA GESELL · CALLE DE ARENA</span><b id="eg-stage-name">ANTES</b></span>' +
          '</button>' +
          '<section class="panel" aria-live="polite"><div class="head">MUNICIPALIDAD DE VILLA GESELL</div><div class="content">' +
            '<div class="intro" id="eg-intro"><div><div class="kicker">Una experiencia para descubrir</div><h1 id="eg-titulo">¿QUÉ <em>VES</em> EN ESTA IMAGEN?</h1></div><div><p>Cuando la luz no alcanza, las cosas no siempre son lo que parecen.</p>' +
            '<button class="power-btn" type="button" id="eg-turn-on">TOCÁ PARA ENCENDER LA LUZ <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v9M6 5.5a8 8 0 1 0 12 0"/></svg></button></div></div>' +
            // En celular la revelación va en dos bloques (título arriba, remate
            // abajo) sin caja, para que la luminaria quede a la vista.
            '<div class="reveal" id="eg-reveal"><div class="reveal-arriba"><div class="kicker">Ahora mirá bien</div><h1>NO ERA LO QUE PARECÍA. <em>FALTABA LUZ.</em></h1></div>' +
            '<div class="reveal-abajo"><p class="purchase">La Municipalidad de Villa Gesell compró nuevas luminarias LED.</p>' +
            '<div class="benefits"><span>Más potencia.</span><span>Más visibilidad.</span><span>Más seguridad.</span></div>' +
            '<div class="claim">PARA QUE VEAS MEJOR.<br><b>UNA GESTIÓN QUE SE VE.</b></div></div></div>' +
          '</div><div class="foot"><span>ALUMBRADO PÚBLICO · VILLA GESELL</span><button class="replay" id="eg-replay" type="button">Volver a empezar ↻</button></div></section>' +
          '<div class="demo-tag" aria-hidden="true">MAQUETA VISUAL · ESCENAS ILUSTRATIVAS</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  // ── Fecha y frecuencia ────────────────────────────────────────────────────
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
  function debeMostrar() {
    if (cfg.siempre) return true;
    if (vencido()) return false;
    return vistoHace() > cfg.cada * 86400000;
  }

  // ── Sonido ────────────────────────────────────────────────────────────────
  // Dos "climas": suspenso (estado oscuro) y abierto (al encender la luz), con
  // un fundido cruzado de 1,3 s que acompaña a la luz. Si se pasan URLs, se
  // usan esas pistas; si no, se sintetizan con el motor de audio del navegador
  // (música genérica, para probar). Nada suena hasta que la persona lo pida.
  var Sonido = (function () {
    var activo = false, ctx = null, master = null, cama = null, abierto = null;
    var pistas = null; // {suspenso: Audio, abierto: Audio}
    var FUNDIDO = 1.3;

    function rampa(g, valor, seg) {
      var t = ctx.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(valor, t + seg);
    }

    function osc(tipo, hz, dest, nivel, detune) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = tipo; o.frequency.value = hz; if (detune) o.detune.value = detune;
      g.gain.value = nivel; o.connect(g); g.connect(dest); o.start();
      return { o: o, g: g, base: hz };
    }

    // Suspenso: un bordón grave y oscuro, con una segunda menor que late, un
    // filtro que "respira" y un pulso lento tipo latido.
    function crearSuspenso() {
      var salida = ctx.createGain(); salida.gain.value = 0;
      var filtro = ctx.createBiquadFilter(); filtro.type = "lowpass"; filtro.frequency.value = 380; filtro.Q.value = 0.8;
      filtro.connect(salida); salida.connect(master);
      var voces = [
        osc("triangle", 55, filtro, 0.22),
        osc("sawtooth", 55, filtro, 0.05, 6),
        osc("triangle", 58.27, filtro, 0.09),
        osc("sine", 82.41, filtro, 0.12),
        osc("sine", 27.5, filtro, 0.14)
      ];
      var lfo = ctx.createOscillator(), lfoG = ctx.createGain();
      lfo.type = "sine"; lfo.frequency.value = 0.11; lfoG.gain.value = 170;
      lfo.connect(lfoG); lfoG.connect(filtro.frequency); lfo.start();
      var latido = setInterval(function () {
        if (!ctx) return;
        var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(62, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.25);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
        o.connect(g); g.connect(salida); o.start(t); o.stop(t + 0.5);
      }, 2300);
      return { gain: salida, parar: function () {
        clearInterval(latido); voces.forEach(function (v) { try { v.o.stop(); } catch (e) {} }); try { lfo.stop(); } catch (e) {}
      } };
    }

    // Abierto: un colchón mayor y luminoso que se abre (el filtro sube con la
    // luz) y un arpegio suave y ascendente. Para que no sea reiterativo, cada
    // 4 compases cambia de tonalidad: sube un tono, sube otro, baja uno y
    // vuelve a la habitual (pedido de Gustavo).
    var BLOQUES = [0, 2, 4, 2];          // semitonos de cada bloque de 4 compases
    var PASOS_POR_BLOQUE = 16;           // 4 compases × 4 tiempos de arpegio
    function crearAbierto() {
      var salida = ctx.createGain(); salida.gain.value = 0;
      var filtro = ctx.createBiquadFilter(); filtro.type = "lowpass"; filtro.frequency.value = 700; filtro.Q.value = 0.5;
      filtro.connect(salida); salida.connect(master);
      var voces = [
        osc("triangle", 130.81, filtro, 0.16),
        osc("triangle", 164.81, filtro, 0.12, 4),
        osc("triangle", 196.0, filtro, 0.12, -4),
        osc("sine", 261.63, filtro, 0.10),
        osc("sine", 392.0, filtro, 0.05),
        osc("sine", 65.41, filtro, 0.12)
      ];
      var notas = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25], i = 0;
      var bloque = 0, factor = 1;
      // Lleva el colchón a la tonalidad del bloque con un deslizamiento corto.
      function transportar(semitonos) {
        factor = Math.pow(2, semitonos / 12);
        var t = ctx.currentTime;
        voces.forEach(function (v) {
          v.o.frequency.cancelScheduledValues(t);
          v.o.frequency.setValueAtTime(v.o.frequency.value, t);
          v.o.frequency.exponentialRampToValueAtTime(v.base * factor, t + 0.35);
        });
      }
      var arpegio = setInterval(function () {
        if (!ctx) return;
        if (i > 0 && i % PASOS_POR_BLOQUE === 0) {
          bloque = (bloque + 1) % BLOQUES.length;
          transportar(BLOQUES[bloque]);
        }
        var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = notas[i++ % notas.length] * factor;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        o.connect(g); g.connect(salida); o.start(t); o.stop(t + 1);
      }, 420);
      return { gain: salida, filtro: filtro,
        // Al encender la luz la música arranca desde la tonalidad habitual.
        reiniciar: function () { i = 0; bloque = 0; transportar(0); },
        parar: function () {
          clearInterval(arpegio); voces.forEach(function (v) { try { v.o.stop(); } catch (e) {} });
        } };
    }

    function arrancarSintesis(encendido) {
      master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
      cama = crearSuspenso(); abierto = crearAbierto();
      rampa(encendido ? abierto.gain : cama.gain, 1, 0.9);
      if (encendido) abierto.filtro.frequency.value = 3800;
    }

    function arrancarPistas(encendido) {
      pistas = { suspenso: new Audio(cfg.audioSuspenso), abierto: new Audio(cfg.audioAbierto) };
      [pistas.suspenso, pistas.abierto].forEach(function (a) { a.loop = true; a.preload = "auto"; a.volume = 0; });
      (encendido ? pistas.abierto : pistas.suspenso).volume = 1;
      pistas.suspenso.play().catch(function () {}); pistas.abierto.play().catch(function () {});
    }

    function fundirPistas(deA, haciaB) {
      var pasos = 26, n = 0, iv = setInterval(function () {
        n++; var k = n / pasos;
        deA.volume = Math.max(0, 1 - k); haciaB.volume = Math.min(1, k);
        if (n >= pasos) clearInterval(iv);
      }, (FUNDIDO * 1000) / 26);
    }

    return {
      activo: function () { return activo; },
      activar: function (encendido) {
        if (activo) return true;
        try {
          if (cfg.audioSuspenso && cfg.audioAbierto) { arrancarPistas(encendido); }
          else {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return false;
            ctx = new AC(); if (ctx.state === "suspended") ctx.resume();
            arrancarSintesis(encendido);
          }
          activo = true; return true;
        } catch (e) { return false; }
      },
      encender: function () {
        if (!activo) return;
        if (pistas) { fundirPistas(pistas.suspenso, pistas.abierto); return; }
        abierto.reiniciar();
        rampa(cama.gain, 0, FUNDIDO); rampa(abierto.gain, 1, FUNDIDO);
        var t = ctx.currentTime;
        abierto.filtro.frequency.cancelScheduledValues(t);
        abierto.filtro.frequency.setValueAtTime(700, t);
        abierto.filtro.frequency.exponentialRampToValueAtTime(3800, t + 2.2);
      },
      apagar: function () {
        if (!activo) return;
        if (pistas) { fundirPistas(pistas.abierto, pistas.suspenso); return; }
        rampa(abierto.gain, 0, FUNDIDO); rampa(cama.gain, 1, FUNDIDO);
      },
      parar: function () {
        if (!activo) return;
        activo = false;
        if (pistas) { pistas.suspenso.pause(); pistas.abierto.pause(); pistas = null; return; }
        try { rampa(master, 0, 0.35); } catch (e) {}
        var c = ctx, k = cama, a = abierto;
        setTimeout(function () { try { k.parar(); a.parar(); c.close(); } catch (e) {} }, 420);
        ctx = null; master = null; cama = null; abierto = null;
      }
    };
  })();

  // ── Diálogo ───────────────────────────────────────────────────────────────
  var root = null, foco = null, temporizador = null, estiloPrevio = "";

  function focusables(c) {
    var sel = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    // Se descartan los que el navegador tampoco enfocaría: ocultos o con
    // visibility:hidden (como «Volver a empezar» antes de encender la luz).
    return Array.prototype.filter.call(c.querySelectorAll(sel), function (el) {
      if (el === document.activeElement) return true;
      return el.offsetParent !== null && getComputedStyle(el).visibility !== "hidden";
    });
  }

  function onKey(e) {
    if (!root) return;
    if (e.key === "Escape" || e.key === "Esc") { e.preventDefault(); cerrar(); return; }
    if (e.key === "Tab") {
      var f = focusables(root);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  function abrir() {
    if (root) return;
    foco = document.activeElement;
    var caja = document.createElement("div");
    caja.innerHTML = HTML;
    root = caja.firstChild;

    if (!document.getElementById("eg-estilos")) {
      var st = document.createElement("style");
      st.id = "eg-estilos";
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    document.body.appendChild(root);
    estiloPrevio = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    var campaign = root.querySelector("#eg-campaign"),
        scene = root.querySelector("#eg-scene"),
        trigger = root.querySelector("#eg-turn-on"),
        replay = root.querySelector("#eg-replay"),
        label = root.querySelector("#eg-photo-label"),
        stage = root.querySelector("#eg-stage-name"),
        cerrarBtn = root.querySelector("#eg-close"),
        sonidoBtn = root.querySelector("#eg-sound"),
        overlay = root.querySelector("#eg-overlay");

    // Comportamiento aprobado de la pieza, sin cambios (más el sonido).
    function turnOn() {
      if (campaign.classList.contains("lit")) return;
      campaign.classList.add("lit");
      Sonido.encender();
      label.textContent = "Luz LED";
      stage.textContent = "DESPUÉS";
      scene.setAttribute("aria-label", "La luz deja ver a una mujer de pelo largo que pasea a su perro");
      temporizador = setTimeout(function () {
        campaign.classList.add("complete");
        replay.style.visibility = "visible";
        scene.disabled = true;
      }, 1300);
    }
    function reset() {
      clearTimeout(temporizador);
      campaign.classList.remove("lit", "complete");
      Sonido.apagar();
      label.textContent = "Luz tenue";
      stage.textContent = "ANTES";
      scene.disabled = false;
      scene.setAttribute("aria-label", "Encender la luminaria LED para descubrir quién camina por la calle");
      replay.style.visibility = "hidden";
      trigger.focus({ preventScroll: true });
    }
    function alternarSonido() {
      if (Sonido.activo()) {
        Sonido.parar();
        sonidoBtn.setAttribute("aria-pressed", "false");
        sonidoBtn.setAttribute("aria-label", "Activar sonido");
        campaign.classList.remove("con-sonido");
      } else if (Sonido.activar(campaign.classList.contains("lit"))) {
        sonidoBtn.setAttribute("aria-pressed", "true");
        sonidoBtn.setAttribute("aria-label", "Silenciar");
        campaign.classList.add("con-sonido");
      }
    }
    scene.addEventListener("click", turnOn);
    trigger.addEventListener("click", turnOn);
    replay.addEventListener("click", reset);
    sonidoBtn.addEventListener("click", alternarSonido);
    cerrarBtn.addEventListener("click", cerrar);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) cerrar(); });
    document.addEventListener("keydown", onKey);

    marcarVisto();
    trigger.focus({ preventScroll: true });
  }

  function cerrar() {
    if (!root) return;
    clearTimeout(temporizador);
    Sonido.parar();
    document.removeEventListener("keydown", onKey);
    document.documentElement.style.overflow = estiloPrevio;
    if (root.parentNode) root.parentNode.removeChild(root);
    root = null;
    if (foco && typeof foco.focus === "function") { try { foco.focus({ preventScroll: true }); } catch (e) {} }
    foco = null;
  }

  window.EmergenteGesell = { abrir: abrir, cerrar: cerrar, config: cfg };

  if (debeMostrar()) {
    var arrancar = function () { setTimeout(abrir, cfg.demora); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar);
    else arrancar();
  }
})();
