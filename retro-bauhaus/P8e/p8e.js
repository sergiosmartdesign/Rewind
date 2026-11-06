/* SPDX-FileCopyrightText: 2026 Sergio Ayala
 * SPDX-License-Identifier: GPL-3.0-or-later */
/* P8e · Cassette V3 — franjas de información en reposo sobre el arte WebGL vivo + VHS Arte
   2026-10-23. Autor de lo publicable: Sergio Ayala
   <mail@sergio-ayala.com>. COPIA de P8d/p8d.js (P8d no se toca), con estos cambios:
   · Fondo = arte WebGL vivo (data-bg="art") + las franjas de P8d/90s.html encima (.bands), sin su lettering.
   · FRANJAS (v6, órdenes del autor del 2026-10-23; sustituye a la v5): son sólo el PANEL DE
     INFO de reposo. Aparecen únicamente con conexión (EN LÍNEA) + info cargada + IDLE_MS sin teclas en la
     app enfocada, también la 1.ª vez. Cualquier cambio de app las saca (una sola salida por ráfaga); si
     se pierde la conexión salen solas. Con SIN RED no se pide nada; con SIN INTERNET, backoff creciente.
   · El rótulo de la app (nº + nombre + Enter ▶ Abrir) vive bajo las franjas de la derecha, donde
     estaba «Abstract retro launcher · Side A» (retirado).
   · Entrada 15 «Arte» = VHS V3 con el icono Mona Lisa → Enter = SALVAPANTALLAS: obras en bucle
     con el dispersal de partículas + Ken Burns (escala + paneo) automático; cualquier tecla sale.
     El dispersal ahora parte del encuadre EXACTO del still (uniform uMap): sin salto al empezar.
   · v3 (2026-10-23, órdenes del autor): (1) icono Mona Lisa v2 dibujada a mano
     (../assets/icons/monalisa-v2.svg, leído del fichero tal cual, multitono: se dibuja SIN el tinte
     source-in, rasterizado al tamaño exacto de su caja); (2) MODO TV por defecto: fuera la barra de
     atajos, la cadena de versión, «OFFLINE» y el aviso del salvapantallas (todo .dbg → ?dev=1), F y
     Esc sólo con ?dev=1, el reloj sube al HUD; (3) LIENZO del TV: 1920×1080 px CSS fijos (#tv) escalados
     uniformemente a la ventana con letterbox negro, cursor oculto, DPR de canvas = 1 como el TV.
   · v4 (2026-10-23, decisión del autor): HUD en tres zonas. Arriba izq. = MODELO DEL TV leído del
     propio TV (webapis.productinfo; maqueta UN55MU6100 en localhost) · centro = «APP NN/15», igual ·
     arriba der. = APP_NAME · versión · estado de internet (EN LÍNEA / SIN INTERNET / SIN RED). Abajo der.
     = crédito de la obra en Rubik LIGHT tinta con halo crema y, a su derecha, la hora (también en el
     salvapantallas). «SYS.READY · MODE …» sólo con ?dev=1.

   PROCEDENCIA (heredada de P8d, copiado, no enlazado):
   · Dibujo del cassette V3 — P8c/cassette-lab/lab.js. R_DUR=560, RING_PERIOD=14000,
     RING_RAMP=1200, BAND_A=.72, A=.80 (VERS[2]).
   · Corredor 3D (ZGAP, easings, wrap, pixel-dissolve, glitch) — P8c/index.html.
     Motor de arte WebGL + vientos + Ken Burns — P8c.
   · Sólo LEE window.LOGOS (../logos.js). El WebGL es propio (gl.js, v12; antes three.js r128). NO usa core.js.

   PRESUPUESTO 2017 (panel UN55MU6100):
   · UN solo requestAnimationFrame (Ticker). Franjas, giros, paneo y Ken Burns = transiciones CSS /
     WAAPI de transform y opacity (compositor), sin rAF propio.
   · Sólo el cassette ENFOCADO es «rico»; los otros 14 son UN canvas «lite» cada uno.
   · Un solo contexto WebGL, creado a demanda; caché de texturas LRU de TEX_CACHE obras.
   · En reposo (v8, decisión del autor): carretes y anillos de texto del cassette enfocado SIGUEN
     girando (IDLE_SPIN=1, WAAPI); el rotador de DESTACADO sí se para. ?idlespin=0 vuelve al ahorro de la v6.
   · v8 (2026-10-23, decisión del autor): FICHA DE MUSEO abajo a la derecha (artista · título en
     cursiva, fecha; datos de ../assets/art/manifest.jsonl) y la HORA sola abajo a la izquierda.
   · v9 (2026-10-23, decisión del autor): ELECTRICIDAD en el despiece (canvas 2D
     propio .lx-zap, fuera de la pila 3D) y PORTAL de fondo (raymarch del Shader Decay Explorer portado a WebGL1, en
     el MISMO contexto del arte, a 1/4). Ver la sección «v9 · ELECTRICIDAD…» y el README.
   · v10 (2026-10-23, decisión del autor): AUTORÍA en el reverso de las franjas. De vez
     en cuando (AUTHOR_EVERY de panel de info visible, nunca en la 1.ª aparición) las franjas giran como un tablero
     split-flap: izquierda = QR a sergio-ayala.com, derecha = sello SN (fichero privado, fuera de git) + firma. Ver
     «v10 · AUTORÍA…» y el README. Ficha: un « — AAAA» final del título se quita si la fecha ya lo cubre.
   · v11 (2026-10-23): funciona en el motor web del TV 2017 (Chromium M47) sin cambiar cómo se ve
     ni cómo se mueve: teclas por keyCode, sin three.js se degrada (corte entre obras, despiece sin portal), respaldo
     por fase si onfinish no llega, Home durante el despiece vuelve al corredor, contrato launch(app, ok, err),
     movimiento reducido guardado (p8e.reduce), foco fuera de aria-hidden, hallazgos H1–H11 de la revisión de seguridad y limpieza.
     Comprobado con tools/m47_check.mjs (README, sección v11).
   · v12 (2026-10-23): SIN three.js. El dispersal y el portal van en WebGL1 propio (gl.js, ES5), con
     las mismas matrices, fusión, texturas y shaders: en Chrome los fotogramas posados salen idénticos a los de la v11, y en
     M47 el arte y el portal ya FUNCIONAN (antes se degradaban). ?glscale (palanca 6 de la auditoría). TODA la interfaz en
     inglés, en la tabla STR (y STR_WX en weather.js). README, sección v12.
   · v13 (2026-10-23, órdenes del autor): (a) LA VUELTA INVERSA: al salir de una app (y del
     salvapantallas) se reproduce el despiece + portal en espejo exacto, t' = LX.T − t, con el cuerpo del cassette rebotando
     al encajar; (b) LA AUTORÍA EN PIXEL ART como en Warp Drive: dos papiros que se desenrollan, pigmento que nace en el color
     de las franjas y vira al del portfolio, sello de abajo arriba, firma de izquierda a derecha, QR que florece. Secciones
     «v13 · LA VUELTA INVERSA» y «v13 · AUTORÍA EN PIXEL ART»; README, sección v13 (con la tabla de tiempos para el sonido).
   · v16 (2026-10-25, tras medir el TV: 15 fps en reposo): MISMO aspecto y mismos
     tiempos, otra técnica. (1) cada obra se pide y se decodifica UNA vez: un solo <img> por obra para el still, el aspecto y
     la textura (antes CSS background + 1–2 Image(): con no-store, M47 repetía la descarga), y la textura sube SIN forzar
     un 2.º decode (UNPACK_COLORSPACE_CONVERSION por defecto: los JPEG no llevan ICC, mismos píxeles); (2) la textura de la
     obra siguiente se sube en un rato quieto, no al empezar el relevo; (3) el still es una capa OPACA (fondo #1A0F14 bajo la
     obra): el compositor deja de pintar lo que tapa; (4) el cassette rico pasa de 4 superficies de aplanado a 2 (L1 y L2
     preserve-3d en reposo; planas durante el despiece) y las cards opacas del corredor dejan de aplanarse; (5) viñeta y
     líneas de barrido en UNA capa; (6) el dispersal no rasteriza partículas de alfa 0. Palancas para A/B en el TV y sondas
     de diagnóstico (?probe=, sólo ?dev=1): sección «v16 · RENDIMIENTO» y README, sección v16.
   · v16.1 (2026-10-25): banco automático ?dev=1&bench=1 (recorre solo sondas y palancas, mide sin panel
     y deja UNA tabla para una foto), medidor mínimo ?fps=1 y la jugada estructural ?flat=1 (apagada): el corredor quieto en un
     canvas. Sección «v16.1» y README, sección v16.1.
   · v16.2 (2026-10-25, tras el banco del TV): DECISIÓN del autor: el relevo de obra al
     cambiar de app espera ?relevowait ms (600) sin teclas y hace UN dispersal al mismo destino; relevo precalentado (programa,
     tamaño del canvas y primer dibujo fuera del relevo, ?artwarm) con su perfil en el banco; ?cassflat (apagada): el cassette
     quieto re-montado plano con lo quieto horneado en runtime; el armado de partículas no re-analiza un color repetido; banco
     de 18 filas. Secciones «v16.2 · …» y README, sección v16.2.
   · v16.4 (2026-10-25): BANCO REMOTO (?dev=1&remote=1): pide lotes a tools/serve_lan.py --remote, los
     corre con el mecanismo del banco y entrega el resultado por POST. Sección «v16.4 · BANCO REMOTO» y README, sección v16.4.
   · v16.5 (2026-10-25; parche de la revisión de seguridad): clave ?rk= → cabecera X-P8e-Remote, nav 0 o
     200–10000. README, sección v16.5.
   · v16.6 (2026-10-25): cassflat + flat POR DEFECTO; horneado de antemano y por pasos (cfPrep); caché de
     pintado por app (paintApp); perfil del Ticker en el banco; palancas de diagnóstico (stillpre, scramblehz, glitchlo, pcwarm);
     banco remoto: aviso visible, MIDIENDO n/N, retomar tras recargar, clave rechazada. README, sección v16.6.
   · v16.7 (2026-10-25): ids reales del TV; Navegador por ApplicationControl y plan de intentos de Netflix
     (adaptador); «Rewinding…» al volver y «WELCOME BACK» en la intro tras ser terminado (p8e.away); vigía de «ok sin imagen»;
     cintas del sistema 16–20 (Apps, Settings, Sources, Live TV, Search); Source → Sources; Exit con palanca; reposo a 3 s (orden de
     el autor) con el pre-horneado adelantado; el último fotograma del vuelo = reposo exacto. README, sección v16.7.
   · v16.9 (2026-10-26; órdenes del autor): FUERA el panel «Suggestions · Curated» (.rail) y la
     cinta Sources (org.tizen.SMSourceAPP no abre desde Rewind, medido): 19 cintas y la tecla Source vuelve a ser del TV; el
     rótulo (.cap) baja BAJO el cassette, centrado y más pequeño (en el armado de la intro espera a que encaje); PICO Y PLACA de
     Bogotá en la franja derecha 4 (pyp.js: cálculo local + contraste con bogota.gov.co si hay red). README, sección v16.9. */
(function(){
"use strict";

/* ===== parámetros de URL (capturas reproducibles) ========================================= */
var Q=location.search;
/* v11 (revisión de seguridad H10): un parámetro mal codificado (?dev=%) lanzaba URIError y mataba todo el IIFE (pantalla negra) */
function qp(k,d){ var m=new RegExp("[?&]"+k+"=([^&]*)").exec(Q); if(!m) return d; try{ return decodeURIComponent(m[1]); }catch(e){ return d; } }
/* v11 (auditoría 17): perilla numérica = número finito o su valor por defecto (una NaN llegaba a animate({duration:NaN})) */
function qn(k,d,lo){ var v=+qp(k,d); if(!isFinite(v)) v=d; return (lo!=null&&v<lo)?lo:v; }
var MQ=window.matchMedia?matchMedia("(prefers-reduced-motion: reduce)"):null;   // M47 no conoce la media feature: nunca coincide
/* v11 · MOVIMIENTO REDUCIDO PERSISTENTE: prefers-reduced-motion llegó en Chrome 74; en el TV sólo hay ?reduce=1 (nadie
   toca la URL de un .wgt). Por eso hay un ajuste guardado, "p8e.reduce" = "1", que se lee al arrancar. La interfaz para
   cambiarlo se decide en el diseño: aquí sólo está la función (reducePref; manda en el PRÓXIMO arranque). */
function reducePref(on){ try{ if(on===true) localStorage.setItem("p8e.reduce","1"); else if(on===false) localStorage.removeItem("p8e.reduce");
  return localStorage.getItem("p8e.reduce")==="1"; }catch(e){ return false; } }
var REDUCE=(MQ&&MQ.matches)||qp("reduce","0")==="1"||reducePref();
document.documentElement.classList.toggle("reduce",REDUCE);

/* ===== PERILLAS (rotuladas) ================================================================ */
var CASS_RICH=qp("rich","1")!=="0";      // false → el enfocado tampoco gira ni se inclina (plano)
var TINT_MODE=qp("tint","app");           // "app" = tintes por app de V3 (DEFECTO) | "palette" = 5 de la ref
var LITE_SCALE=qn("lite",0.6,0.05);           // resolución de los cassettes lite (1 = igual que el rico)
var LOGO_H=160;                           // alto del ráster de cada logo (px); el lab usaba 420
var TEX_CACHE=3;                          // texturas de arte vivas a la vez (LRU, se liberan con dispose)
var GRID_STEP=qn("grid",8,2);              // densidad del dispersal WebGL; sube si caen fps
/* v12 (palanca 6): resolución del framebuffer del dispersal. ?grid sólo cambia cuántos puntos hay, no cuántos
   píxeles se rellenan; ?glscale=0.5 dibuja a 960×540 (¼ de fragmentos) y el compositor lo estira. 1 = como la v11 (README, v12) */
var GL_SCALE=Math.max(0.25,Math.min(1,qn("glscale",1)));
var RING_PERIOD=qn("period",14000,500);      // ms por vuelta, carretes Y anillos (co-rotan)
var RING_RAMP=1200, RING_EASE_IN="cubic-bezier(.33,0,.667,.333)";
var RAMP_ANG=(360/RING_PERIOD)*RING_RAMP/2;
var R_DUR=560, R_STEP_U=2.6;              // armado en píxeles
var BAND_A=0.72;                          // banda oscura bajo el texto blanco del anillo (medido en el lab)
/* --- P8e --- */
var IDLE_MS=Math.max(1000,qn("idle",3000)); // ms sin teclas → reposo (franjas con el tiempo). ?idle=ms para probar
                                          // v16.7: 20000 → 3000, decisión del autor (2026-10-25): las franjas tardaban
                                          // demasiado en salir. Sólo cambia CUÁNDO salen, no cómo se anima cada franja (README v16.7)
var IDLE_SPIN=qp("idlespin","1")!=="0";   // v8: true (defecto) → en reposo carretes y anillos SIGUEN girando. ?idlespin=0 = ahorro v6
var IDLE_ART=qp("idleart","1")!=="0";     // false → en reposo el arte tampoco se releva ni se panea
var OUT_MS=360, OUT_STG=50, IN_MS=620, IN_STG=70;   // = p8e.css (.bands); 5 franjas
/* v6 · reintentos con SIN INTERNET (backoff creciente, regla 5): 1, 2, 5, 10 y 30 min; luego cada 30 min hasta el
   próximo éxito. Con SIN RED no se intenta nada. ?retry=1000,2000,5000 lo prueba en segundos (mín. 500 ms c/u). */
var LIVE_WX=!!(window.P8EWeather&&P8EWeather.adapter==="open-meteo");   // v11 (revisión de seguridad H9): con el live, nada de perillas de prueba
var RETRY_MS=(function(){ var d=[60000,120000,300000,600000,1800000], q=LIVE_WX?"":qp("retry","");
  var a=q?q.split(",").map(Number).filter(function(v){ return isFinite(v)&&v>=500; }).map(function(v){ return Math.min(v,3600000); }):[];
  return a.length?a:d; })();
var SAVER_DWELL=qn("dwell",26000,500);       // v16.10: salvapantallas: ms por obra (con el paneo). 9→14→20 s: el recorrido completo debe verse tranquilo
var KB_SCALE=qn("kb",1.14);              // Ken Burns: escala del extremo «cerca» (1 = sólo paneo)
/* --- P8e v3 --- */
var DEV=qp("dev","0")==="1";              // ?dev=1 → vuelve lo de prueba (atajos, versión, OFFLINE, F/Esc, cursor)
var STAGE_W=1920, STAGE_H=1080;           // lienzo del TV: apps web del UN55MU6100 (Tizen 3.0) a 1920×1080 px CSS
var TV_DPR=Math.max(1,Math.min(2,qn("dpr",1)));   // resolución de los canvas por px CSS. 1 = la del TV (DPR 1)
var ART_ICON_URL="../assets/icons/monalisa-v2.svg"; // icono del VHS Arte (Mona Lisa v2). NO se edita: se lee tal cual
/* --- P8e v4 · HUD --- */
var APP_NAME="Launcher";                  // PROVISIONAL (nombre por definir): éste es el ÚNICO sitio donde vive
var APP_VERSION="16.11.0";               // respaldo (v16.11: = config.xml; antes "0.8.4"). En el .wgt manda config.xml <widget version="x.y.z">
                                          // (tizen.application.getCurrentApplication().appInfo.version)
var MODEL_MOCK="UN55MU6100";              // SIMULADO: sólo sin webapis (localhost). ?model=XYZ prueba otro
var NET_FORCE=qp("net","");               // ?net=online|nointernet|nonet → fuerza el estado (capturas)
var HALO=qp("halo","");                    // ?halo=0.45 → opacidad del respaldo crema del crédito (CSS: .40, medida)
/* --- P8e v7 · abrir una app --- */
var LAUNCH_BACK_MS=Math.max(0,qn("launchback",5000));   // maqueta: la pantalla de paso vuelve sola a los N ms (0 = sólo Esc/Back)
var LAUNCH_SLOW=Math.max(0.25,Math.min(8,qn("launchslow",1)));   // ×N la duración del despiece (?launchslow=4 = verlo a 0,25×)
var LX_ARTE=qp("lxarte","1")!=="0";      // el VHS Arte también se desarma antes del salvapantallas (0 = como en la v6)
/* v15 · FASE BOOT: la intro cinemática de arranque. Por defecto ON; ?boot=0 la salta (pruebas).
   Cubre el tiempo en que el adaptador inicializa webapis tras DOMContentLoaded (modelo y red, v14). Saltable con cualquier
   tecla del mando. Nota TV: se mide si conviene mostrarla sólo en arranque en frío y no tras Instant On (perilla, se decide en
   el aparato). La reutiliza el portal del arte (gl.js, único contexto WebGL1) y las partículas del título son 2D (un canvas).
   v15.1 · RECORTE de la cabeza: fuera el encendido CRT, las barras de color 90s, la electricidad/rayos
   y el grano VHS (la piel de TV retro). La intro EMPIEZA en la apertura del portal (reloj reanclado: lo que era 1340 ms es t=0),
   dura ~2,0 s y sigue: portal → título → datos → resolución al corredor. El portal abre su iris desde 0 (es la propia entrada;
   no hace falta fundido añadido). Sólo se recortó la CABEZA de la intro; lo demás (título por partículas, datos reales,
   resolución al corredor v14) queda intacto. */
/* ===== v16 · RENDIMIENTO. Cada técnica tiene su palanca para medirla en el TV (A/B); por defecto
   TODAS encendidas y ?v16=0 las apaga a la vez (= técnica de la v15.2). Ninguna cambia cómo se ve ni cómo se mueve.
   ?artone=0   el still por CSS background + Image() aparte para aspecto y textura (v15.2: hasta 3 peticiones por obra)
   ?texcs=none textura con UNPACK_COLORSPACE_CONVERSION=NONE (v15.2: M47 re-decodifica el JPEG en cada subida)
   ?artpre=0   sin subir de antemano la textura de la obra siguiente (v15.2: decode + subida al empezar el relevo)
   ?artopaque=0 el still deja de ser capa opaca (el compositor vuelve a pintar el fondo que tapa)
   ?cass3d=0   L1/L2 del cassette planos también en reposo (v15.2: 2 superficies de aplanado más por fotograma)
   ?card3d=0   las cards del corredor siempre planas (v15.2: una superficie por card con canvas compuesto)
   ?ovl=2      viñeta y líneas de barrido en dos capas (v15.2)
   ?ptcull=0   el dispersal rasteriza también las partículas de alfa 0 (v15.2) */
var V16=qp("v16","1")!=="0";
function v16q(k,off){ var v=qp(k,""); return v===""?V16:v!==off; }
var ART_ONE=v16q("artone","0"), TEX_CS=qp("texcs",V16?"browser":"none")!=="none", ART_PRE=v16q("artpre","0"),
    ART_OPAQUE=v16q("artopaque","0"), CASS_3D=v16q("cass3d","0"), CARD_3D=v16q("card3d","0"), OVL_ONE=qp("ovl",V16?"1":"2")!=="2",
    PT_CULL=v16q("ptcull","0");
(function(h){ h.classList.toggle("cass3d",CASS_3D); h.classList.toggle("card3d",CARD_3D); h.classList.toggle("artopq",ART_OPAQUE);
  h.classList.toggle("ovl1",OVL_ONE&&!REDUCE); })(document.documentElement);   // con movimiento reducido no hay barrido: la viñeta va sola
/* ===== v16.11 · RENDIMIENTO, FASE A. Mismo aspecto; cada arreglo con su palanca para medirlo en el
   TV (banco remoto, lote «v1611»). En el .wgt no hay query: valen los valores por defecto. ?v1611=0 apaga las cuatro primeras a
   la vez (= v16.10); cada una por separado con =0.
   ?relevogap=0  F1 · el relevo podía arrancar en el MISMO fotograma que el asentado (los dos a 600 ms). ON: si el asentado está
                 pendiente o acaba de ocurrir, el relevo espera y arranca como mínimo UN fotograma después de que acabe
   ?prefretry=0  F2 · artPrefetch se rendía si había un relevo en marcha. ON: reintenta; precarga en un hueco quieto la obra del
                 siguiente relevo (artIdx+relevoPend+1; y la del pendiente si lo hay) sin tirar nunca una textura que se esté
                 dibujando; y si al arrancar un relevo falta su textura, la sube en su propio fotograma y arranca en el siguiente
   ?settle2=0    F3 · el asentado en dos fotogramas. ON: fotograma 1 = paintApp y la mudanza con la pila rica OCULTA (se ve el
                 lite, la misma vista frontal); fotograma 2 = se enseña, se inclina, arma y gira
   ?noreflow=0   F4 · sin layouts forzados: el glitch del rótulo se reinicia alternando dos animaciones idénticas (gA1/gA1b);
                 attach no lee offsetWidth (con settle2 la mudanza ya se calculó en el fotograma 1); settleStill devuelve la
                 transición del still en el fotograma siguiente
   ?bandsflat=1  F5 (APAGADA, ver abajo) · .bands .fr lleva rotateX(0deg) también en reposo (una capa 3D por franja sin nada que
                 girar). Con =1: none sólo con las franjas quietas (.bst), rotateX en la entrada, la salida y el giro
   APAGADAS por defecto (cambian el cálculo, no la intención): ?texmax=1 (F6 · textura del dispersal ≤ 1024 px; cambia el
   muestreo: cada punto toma un téxel de la imagen reducida) y ?warpfold=1 (F7 · el golpe de perspectiva del vuelo, dentro del
   transform de .world como scale3d(1,1,P0/P): proyección idéntica, sin cambiar perspective del viewport en cada fotograma). */
var V1611=qp("v1611","1")!=="0";
function v1611q(k){ var v=qp(k,""); return v===""?V1611:v!=="0"; }
var RELEVO_GAP=v1611q("relevogap"), PREF_RETRY=v1611q("prefretry"), SETTLE2=v1611q("settle2"), NO_REFLOW=v1611q("noreflow");
/* F5 APAGADA por defecto (decisión tomada al verificar): con .fr sin capa, el arnés midió 3–4 zonas de 60 px con píxeles distintos
   (≤ 0,034 %) en la entrada, en reposo y en la salida, por encima del ruido (0). No se puede afirmar «se ve igual»: queda para el banco */
var BANDS_FLAT=qp("bandsflat","0")==="1";
var TEX_MAX=(function(){ var v=qp("texmax","0"); if(v===""||v==="0") return 0; v=+v; return (v===1||!isFinite(v))?1024:Math.max(64,Math.min(4096,v|0)); })();
var WARP_FOLD=qp("warpfold","0")==="1";
document.documentElement.classList.toggle("bandsflat",BANDS_FLAT);
var V11={log:[]};                                          // registro para el arnés (P8E.v1611): asentados y relevos, con su fotograma
function v11log(ev,x){ if(V11.log.length>300) V11.log.shift(); var o={ev:ev,rf:T.run?T.frames:T.frames+1,t:Math.round(performance.now())}, k;
  if(x) for(k in x) if(Object.prototype.hasOwnProperty.call(x,k)) o[k]=x[k]; V11.log.push(o); }
var BOOT_INTRO=qp("boot","1")!=="0";
/* v16.10: si la intro está ON, marcamos data-boot DESDE YA (antes de que el corredor se pinte). boot() corre
   después de cargar los logos; en ese hueco se veía la UI (HUD, hora, obra, indicadores) ANTES del portal.
   El CSS la oculta con data-boot; bootOverlayGone (o bootSkip) lo quitan al terminar/saltar la intro. */
if(BOOT_INTRO) document.documentElement.setAttribute("data-boot","1");
var BOOT_SLOW=Math.max(0.25,Math.min(8,qn("bootslow",1)));   // ×N la duración de la intro (?bootslow=4 = verla a 0,25×)
var BOOT_PART=Math.max(0.3,Math.min(1,qn("bootpart",1)));    // densidad de las partículas del título (1 = plena; baja si caen fps)
/* fase: "" (launcher) · "out" (despiece, teclas ignoradas) · "open" (pantalla de paso; sólo Esc/Back) · "back" (vuelve) */
var LAUNCH={phase:"",app:null,arte:false,anims:[],t0:0,backT:0,starts:0,ignored:0,calls:0,returns:0,via:"",why:"",pending:false,err:"",
  fbT:0,fallbacks:0,aborts:0,fails:0,oks:0,away:false,nsT:0,noshows:0,
  specs:[],rec:false,rx0:0,ry0:0,center:null,rw:0,uiT:0,st:[],rewinds:0,cuts:0,arteBack:false,backFallbacks:0,posed:false};   // v13: la vuelta inversa                              // v11: respaldo por fase, Home en el despiece, errores del adaptador
var LAUNCH_ERR_MS=3000;                                                  // v11: «No se pudo abrir X» se queda esto y vuelve al corredor
/* v16.7 · palancas del lanzamiento en el TV. En el .wgt no hay query: valen los valores por defecto.
   ?sys=0        sin las cintas del sistema (v16.9: 4 — Apps, Settings, Live TV, Search; Sources salió): el roster vuelve a 15
   ?noshow=ms    vigía: el TV dijo «ok» pero NO nos ocultó en ms → «Couldn't open X» y vuelta (medido: el navegador decía ok y no
                 aparecía nada). 0 = apagado. Por defecto 12000 (Netflix en frío tarda; con menos, volveríamos encima de él)
   ?awayms=ms    al arrancar, si hubo un lanzamiento hace menos de ms (p8e.away), la intro dice «WELCOME BACK» y no «SYS.READY».
                 Por defecto 6 h (una película larga y algo más). 0 = nunca */
var SYS_TAPES=qp("sys","1")!=="0";
var NOSHOW_MS=Math.max(0,qn("noshow",12000));
var AWAY_MS=Math.max(0,qn("awayms",21600000));
var NOSCREEN_ON=qn("noscreen",1)!==0;                     // v16.10: TizenTube (noscreen:true) hace DESARMADO+electricidad pero NO muestra la tarjeta «Rewinding…»; ?noscreen=0 la fuerza (arnés)
/* v16.11 · CORTINA ANTI-REBOTE. Con Host PC IP = 127.0.0.1, TizenTube cierra su propia UI y su servicio la
   relanza en modo debug; en ese hueco el TV enseña Rewind (visible a los pocos segundos del lanzamiento). En CINE, una señal de vuelta
   ANTES de CURTAIN_MS no restaura el corredor: se queda el velo del lanzamiento («curtain on» en p8e.life). Cualquier tecla, el plazo
   cumplido con Rewind visible, o una vuelta DESPUÉS de CURTAIN_MS → cineReturn. ?curtain=0 = v16.10 exacto (sin cortina). */
var CURTAIN_MS=Math.max(0,qn("curtain",12000));
var CURT={t0:0,on:false,tm:0,ons:0,offs:0,backs:0,why:""};
var EXIT_GUARD_MS=2500;

/* ===== v12 · TEXTOS: TODA la interfaz en inglés, en UNA tabla (decisión del autor, 2026-10-23) ================
   Lo que se ve, lo que lee el lector de pantalla (#live, aria-label) y lo que se pinta en los canvas sale de aquí. Se
   quedan 24 h, °C y km/h. Lo que el CLIMA trae escrito (estado del cielo, días, avisos UV, puntos cardinales) vive en
   weather.js (STR_WX), porque es también su lista blanca de validación. Los nombres propios (apps, obras, artistas, la
   firma) no se traducen; las fichas de museo ya estaban en inglés. Las mayúsculas las pone el CSS donde ya las ponía. */
var STR={
  appBrowser:"Browser", appArt:"Art",                                   // nombres de las entradas 11 y 15 (eran «Navegador» y «Arte»)
  appApps:"Apps", appSettings:"Settings", appLiveTV:"Live TV", appSearch:"Search",   // v16.7: cintas del sistema (v16.9: 16–19, sin Sources)
  ringSideA:"SIDE A", ringGallery:"GALLERY", ringOpen:"OPEN", ringPlay:"PLAY",   // anillos de texto del cassette
  paperNo:"No. ", paperGallery:"GALLERY", paperWorks:function(n){ return n+" WORKS"; }, paperTape:"T-120 · VHS",
  tapeInsert:"Insert this side into recorder", tapeTouch:"Do not touch the tape inside",
  auInvite:["More work by","the same hand."], auBy:"by", auName:"Sergio Ayala", auUrl:"sergio-ayala.com",   // autoría (v10 → v13: en pixel art)
  auCopy:"© 2026 Sergio Ayala",                                         // v13: se pinta con los píxeles de la línea legal de WD (AU_LEGAL)
  clockAria:"Time",                                                     // v16.9: fuera railAria/railHead/sugg (el panel de sugerencias)
  /* v16.9 · PICO Y PLACA (franja derecha 4). En castellano a propósito: es una medida de Bogotá con nombre propio y por decisión de
     diseño sus textos van en castellano (NO CIRCULAN, SIN PICO Y PLACA HOY). Excepción declarada a la regla v12 de
     toda la interfaz en inglés (README v16.9); la fila lleva lang="es". */
  pyp:{title:"Pico y placa", hours:"6:00–21:00", today:"Hoy", out:"No circulan", none:"Sin pico y placa hoy",
       sat:"Sábado", sun:"Domingo", hol:"Festivo", verify:"Verificar", where:"bogota.gov.co",
       horario:"Horario pico y placa"},                     // v16.10: la franja R3 dice «Horario pico y placa» en letra normal + las horas
  rates:{trm:"TRM dólar", eur:"TRM euro", cop:"COP", none:"—", asOf:function(d){ return "· "+d; }},   // v16.10: franjas R4/R5, en COP
  capOpen:"Enter ▶ Open", capSaver:"Enter ▶ Screensaver",
  help:["Browse","Open","Fullscreen","Exit"], saverHint:"Screensaver &middot; any key to exit",   // sólo con ?dev=1
  modeIdle:"IDLE", modeCorridor:"CORRIDOR",                             // HUD de prueba (?dev=1)
  net:{online:"Online",nointernet:"No internet",nonet:"No network",checking:"Checking"},
  lxOpening:"Opening<i>.</i><i>.</i><i>.</i>", lxFail:function(n){ return "Couldn't open "+n; },
  lxBack:"Rewinding<i>.</i><i>.</i><i>.</i>",                           // v16.7: la pantalla de paso al VOLVER (antes repetía «Opening…»)
  bootReady:"SYS.READY", bootBack:"WELCOME BACK",                        // v16.7: línea de datos de la intro; tras volver de una app, la de vuelta
  exitAgain:"Press Exit again to close",                                 // v16.7: sólo con la palanca exitguard (README v16.7)
  /* píldora izquierda: «Weather · Now»; con el ÚLTIMO dato, «Updated 2 h 40 min ago» SIN el prefijo: con él no cabe (medido:
     «Weather · Updated 25 min ago» ya empieza en x = −13 px, fuera del lienzo; sin él, el peor caso, 2 h 59 min, en x = 117) */
  wxNowBig:"Weather now", wxAgo:function(t){ return "Updated "+t+" ago"; },   // v16.10: el título va en la franja L1 y la hora/dato viejo a su derecha
  wxSrc:"Data: Open-Meteo.com · CC BY 4.0",
  feels:"Feels like", hum:"Humidity", rain:"Rain", rainAt:function(h){ return "at "+h+":00"; }, wind:"Wind", windFrom:" · from ",
  today:"Today", tomorrow:"Tomorrow", sun:"Daylight", uvMax:"UV max", noData:"no data",
  liveFocus:function(n){ return n+", in focus. Press Enter to open."; }, liveSaver:"Screensaver. Press any key to exit.",
  liveSaverShort:"Screensaver.", liveOpening:function(n){ return "Opening "+n+"."; }, liveFail:function(n){ return "Couldn't open "+n+"."; },
  liveBack:function(n){ return "Back from "+n+"."; },                   // v16.7
  liveWx:function(c,t,d){ return "Weather. "+c+": "+t+" degrees, "+d+". Data from Open-Meteo."; }
};

/* --- P8e v10 · autoría en el reverso de las franjas --- */
var AU_FIXED=qp("author","")!=="";                          // v13.1: ?author=ms (sólo pruebas) fija un intervalo exacto y desactiva el azar
var AUTHOR_EVERY=AU_FIXED?Math.max(0,qn("author",0)):0;  // ms de panel de info VISIBLE entre dos autorías, SÓLO con ?author (0 = nunca). Sin él: azar (abajo)
var AUTHOR_MIN=Math.max(0,qn("authormin",900000));       // v13.1: intervalo aleatorio uniforme [MIN, MAX] de panel visible (15 min – 45 min)
var AUTHOR_MAX=Math.max(AUTHOR_MIN,qn("authormax",2700000));
var AUTHOR_P=Math.max(0,Math.min(1,qn("authorp",0.5)));  // v13.1: probabilidad de que cada oportunidad se use (si no, se re-sortea el intervalo)
var AU_RANDOM=!AU_FIXED&&AUTHOR_MAX>0;
var AU_ON=AU_FIXED?AUTHOR_EVERY>0:AU_RANDOM;
var AU_SEED=qn("authorseed",NaN);                          // v13.1: semilla del PRNG (pruebas); sin ella, la hora de arranque
if(!isFinite(AU_SEED)) AU_SEED=new Date().getTime()%4294967296;
var AU_RND=auRnd(AU_SEED);                                  // el mulberry32 de la v13 (función elevada)
function auNeed(){ return AU_FIXED?AUTHOR_EVERY:AUTHOR_MIN+AU_RND(AUTHOR_MAX-AUTHOR_MIN+1); }
var AUTHOR_DWELL=Math.max(2000,qn("authordwell",12000)); // ms que la autoría queda arriba, del final del giro al inicio de la vuelta
var AUTHOR_FIRST=qp("authorfirst","0")==="1";             // 1 → también en la 1.ª aparición del panel de la sesión (por defecto, nunca)
var NOBRAND=qp("nobrand","0")==="1";                       // 1 → no se pide el sello privado (prueba de la degradación: sólo la firma)
var AU_LEAD=Math.min(10000,(AU_FIXED?AUTHOR_EVERY:AUTHOR_MIN)||10000);           // la info se ve al menos esto en cada aparición antes de girar
var AU_FLIP_MS=760;                                        // = p8e.css (.bands.au): 4·70 + 2·240 ms
var AU_QR_URL="../assets/brand/qr-portfolio.svg";          // https://www.sergio-ayala.com (segno, v3, Q). Se LEE tal cual (v13: su matriz)
/* v13: los tableros HTML de la v10 (.bd: texto, <img> del QR y fondo del sello) se fueron: la autoría es pixel art en dos canvas
   (sección «v13 · AUTORÍA EN PIXEL ART»). El reverso de cada franja es ya sólo el fondo del estudio de WD. */
/* v13 · sonido (sound.js, módulo aparte): llamadas inocuas si no está. Nombres y tiempos: README, v13 «Tabla de sonido» */
/* v13 · fase 2: con REDUCE (también el de la media query) sólo suena `error`; el silencio y el volumen
   los guarda sound.js ("p8e.sound.mute", "p8e.sound.vol"). Los dur/step/hit de cada llamada salen de las constantes de aquí. */
function snd(ev,o){ if(REDUCE&&ev!=="error"&&ev!=="bootPortal"&&ev!=="bootDone") return; /* v15.1: en reduced-motion el fundido de la intro sí suena (portal/done) */
  try{ if(window.P8ESound&&typeof P8ESound.play==="function") P8ESound.play(ev,o||{}); }catch(e){} }

/* ===== PALETA 90s (ref-05) ================================================================= */
var PAL={y:"#FEC631",o:"#F9591F",r:"#F21E2C",b:"#B21D3B",p:"#6A1D41",cr:"#FFFEE8",k:"#26121B",ink:"#1D1A17"};
var PAL5=[PAL.y,PAL.o,PAL.r,PAL.b,PAL.p];

/* ===== UN SOLO rAF (Ticker). Cada tarea devuelve true cuando termina. ===================== */
/* v2 (2026-10-23): guarda de reentrada. Antes, una tarea que llamaba a tAdd DENTRO de tRun (p. ej. el
   scramble del rótulo, lanzado desde project()) pedía un 2.º frame además del de cierre de tRun: cadenas
   paralelas y tRun varias veces por frame (medido con CDP: hasta 7 rAF pendientes a la vez; igual en P8d). */
var T={q:[],raf:0,run:false,frames:0,calls:0};
function tAdd(fn,tag){ if(tag) fn.__tg=tag; T.q.push(fn); if(!T.raf&&!T.run){ T.calls++; T.raf=requestAnimationFrame(tRun); } }
/* v16.6 · PERFIL del Ticker: con TP.on, cada tarea suma su tiempo de JS a su etiqueta (corr = vuelo del corredor,
   asm = armado de partículas, scr = scramble del rótulo, gl = dispersal, fx = portal/electricidad, …) y attach (paintApp + arranque
   del armado) se cuenta aparte. El banco lo enseña en la nota: así se ve EN EL TV qué parte del fotograma es JS y cuál no. */
var TP={on:false,ms:{},n:0,frames:0,attach:0,attachN:0,attachMax:0,go:0,pre:0,preN:0,preMax:0};
function tpReset(){ TP.ms={}; TP.n=0; TP.frames=0; TP.attach=0; TP.attachN=0; TP.attachMax=0; TP.go=0; TP.pre=0; TP.preN=0; TP.preMax=0; TP.on=true; }
/* v16.11 · fn corre en el rAF del fotograma SIGUIENTE al que pinta lo hecho ahora: desde una tarea del Ticker basta un tick
   (el fotograma actual pinta al acabar tRun); desde un setTimeout hacen falta dos (el 1.º es el fotograma que lo pinta) */
function afterFrame(fn,tag){ var need=T.run?1:2, n=0; tAdd(function(now){ if(++n<need) return false; fn(now); return true; },tag||"v11"); }
function tRun(now){
  T.raf=0; T.run=true; T.frames++; var q=T.q, keep=[], i, done; T.q=[];
  var tp=TP.on, s0=0; if(tp) TP.frames++;
  for(i=0;i<q.length;i++){ if(tp) s0=performance.now(); try{ done=q[i](now); }catch(e){ done=true; if(window.console) console.error(e); }
    if(tp){ var tg=q[i].__tg||"otro"; TP.ms[tg]=(TP.ms[tg]||0)+(performance.now()-s0); }
    if(!done) keep.push(q[i]); }
  T.run=false; T.q=keep.concat(T.q);
  if(T.q.length){ T.calls++; T.raf=requestAnimationFrame(tRun); }
}

/* ===== utilidades ========================================================================== */
var REG=[];                                          // canvases propios (para el informe de memoria)
function mkCanvas(w,h){ var c=document.createElement("canvas"); if(w){ c.width=w; c.height=h; } REG.push(c); return c; }
function tmpCanvas(w,h){ var c=document.createElement("canvas"); c.width=Math.max(1,w); c.height=Math.max(1,h); return c; }
function el(tag,cls,parent){ var e=document.createElement(tag); if(cls) e.className=cls; if(parent) parent.appendChild(e); return e; }
function hx(h){ h=h.replace("#",""); return [parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16)]; }
function rgba(h,a){ var c=hx(h); return "rgba("+c[0]+","+c[1]+","+c[2]+","+a+")"; }
function mix(a,b,t){ var A=hx(a),B=hx(b),s="#",i,v; for(i=0;i<3;i++){ v=Math.round(A[i]+(B[i]-A[i])*t); s+=("0"+v.toString(16)).slice(-2); } return s; }
function clamp(v,a,b){ return v<a?a:(v>b?b:v); }
function bez(x1,y1,x2,y2){
  function Ac(a,b){return 1-3*b+3*a} function Bc(a,b){return 3*b-6*a} function Cc(a){return 3*a}
  function cx(t){return ((Ac(x1,x2)*t+Bc(x1,x2))*t+Cc(x1))*t}
  function cy(t){return ((Ac(y1,y2)*t+Bc(y1,y2))*t+Cc(y1))*t}
  function sx(t){return 3*Ac(x1,x2)*t*t+2*Bc(x1,x2)*t+Cc(x1)}
  return function(x){ if(x<=0)return 0; if(x>=1)return 1; var t=x,i,e,s;
    for(i=0;i<8;i++){ e=cx(t)-x; if(Math.abs(e)<1e-5)break; s=sx(t); if(Math.abs(s)<1e-6)break; t-=e/s; }
    return cy(t); };
}
var easeReveal=bez(0.22,1,0.36,1);
function rr(c,x,y,w,h,r){ var a=(typeof r==="number")?[r,r,r,r]:r;
  c.moveTo(x+a[0],y); c.lineTo(x+w-a[1],y); c.arcTo(x+w,y,x+w,y+a[1],a[1]);
  c.lineTo(x+w,y+h-a[2]); c.arcTo(x+w,y+h,x+w-a[2],y+h,a[2]);
  c.lineTo(x+a[3],y+h); c.arcTo(x,y+h,x,y+h-a[3],a[3]);
  c.lineTo(x,y+a[0]); c.arcTo(x,y,x+a[0],y,a[0]); c.closePath(); }
/* v3: 1u = 0,1vh DEL LIENZO = 1,08 px CSS. Ni K() ni vh() dependen ya de la ventana: el lienzo mide
   siempre 1080 de alto y el escalado a la ventana lo hace la composición (fitStage), no los canvas. */
function vh(u){ return (+(u*STAGE_H/1000).toFixed(3))+"px"; }
var DPR=TV_DPR;
function K(){ return (STAGE_H/1000)*DPR; }
function sizeCanvas(cv,xU,yU,wU,hU,k){
  cv.width=Math.max(1,Math.round(wU*k)); cv.height=Math.max(1,Math.round(hU*k));
  cv.style.left=vh(xU); cv.style.top=vh(yU); cv.style.width=vh(wU); cv.style.height=vh(hU);
  var c=cv.getContext("2d"); c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,cv.width,cv.height);
  c.setTransform(cv.width/wU,0,0,cv.height/hU,0,0); return c; }

/* ===== GEOMETRÍA V3 (unidades: 1u = 0,1vh; cassette 374×680u) — idéntica al lab ========= */
var CW=374, CH=680, RAD=8, PERS=150;                 // PERS = perspective de .stage, en vh
var HOLE={x:112,y:22,w:176,h:638,r:44}, FRAME_W=8;
var MOUNT={x:108,y:178,w:184,h:324}, LBL={x:4,y:20,w:176,h:284};
var REEL_T={x:200,y:184,flange:165,pack:152,hubR:52,full:true,size:338};
var REEL_B={x:200,y:532,flange:140,pack:62,hubR:34,full:false,size:288};
var RING_T={x:200,y:184,R:82,size:236,fmax:19,fmin:15,logo:2.4};
var RING_B={x:200,y:532,R:70,size:200,fmax:19,fmin:15,logo:1.8};
var Z={rear:-4.6,guts:-2.4,ring:-1.2,tapa:1.8,sticker:2.4};   // vh, = CSS de las capas

/* V3 «Tinte por app + papel» (VERS[2] del lab, sin cambios) */
var V3={ tint:function(a){return a.tint;}, A:.80, spine:null, spineA:.92,
  frame:function(a){return mix(a.tint,"#000000",.36);}, frameA:.96, grid:.15, frost:0, sheen:.34,
  rear:function(a){return mix(a.tint,"#000000",.80);}, rearA:.92, guts:.24, wallA:.86 };

/* ===== ROSTER (15; tintes por app de P8c; tinta del logo = amarillo/crema de la paleta) ===== */
var ART_N=15;                              // obras del salvapantallas (= ART.length, más abajo)
/* v3: el icono del VHS Arte es la Mona Lisa v2 dibujada a mano, MULTITONO. Se lee del fichero (ART_ICON_URL)
   antes de arrancar, para que sea idéntico byte a byte; su lsvg se rellena en start(). */
var MULTI={arte:true};                    // logos multitono: NUNCA pasan por logoTinted (source-in = placa maciza)
/* v11 · appId = id de la app en el TV (tizen.application). (v11: «vacío hasta H4»; desde la v14 el adaptador NO lee getAppsInfo:
   los ids van aquí, y los que faltan se leen a mano con el panel de diagnóstico.) HDMI 1–3 no son apps sino fuentes (otra API).
   v14 · ids del FIRMWARE oficial (§2.3): appId = el id numérico de la tienda,
   el que usa el propio home del TV (aul.launchApp); appAlias = el paquete.
   v14 · aliasLaunchable = si el adaptador puede reintentar con ese alias al fallar el id. El análisis del firmware
   (§«Pasada REA» R1): el home abre Netflix (org.tizen.netflix-app) y Prime (org.tizen.ignition) con
   aul.launchAppEx(alias,{"--app-js":…}); ese argumento es obligatorio y tizen.application.launch(id) no lo pasa, así que el alias
   a secas NO abriría esas dos → aliasLaunchable:false (el adaptador prueba sólo el id; si falla, onErr). YouTube es distinto: su
   alias 9Ur5IzDKqV.TizenYouTube es un id de app lanzable → aliasLaunchable:true. Los vacíos: «leer con getAppsInfo() en el TV»
   (panel de diagnóstico, diag.js): Disney+ no está en el
   firmware; HBO Max, Apple TV, Pluto TV, Claro video, Xbox y Nintendo, tampoco. Navegador: org.tizen.browser (arquitectura-ui-tv.md;
   paquete del firmware, no medido como id lanzable). HDMI: src = la fuente; cambiar de fuente es otra API (tizen.tvwindow /
   webapis.tv…) y NO está implementado: el adaptador responde onErr «Source switching not wired yet». Arte no lanza nada. */
var APPS=[
  /* v16.10 (decisión del autor 2026-10-26): ORDEN del loop — YouTube, Netflix, HBO Max, Disney+, Prime Video y luego el
     resto. FUERA las cintas muertas: Nintendo, Xbox y HDMI 1/2/3 (consolas/fuentes = la tecla Source del TV).
     Netflix conserva su plan de 4 intentos (v16.8, medido en el TV); el navegador su ApplicationControl (abajo). */
  {nm:"YouTube",    logo:"youtube",    tint:"#2FB48C", appId:"xvvl3S1TT1.TizenTubeStandalone", appAlias:"", noscreen:true},  // v16.10: TizenTube (adblock+SponsorBlock). noscreen:true = desarmado+electricidad SIN la tarjeta «Rewinding…» y de ahí directo a TizenTube. Requiere Host PC IP=127.0.0.1
  {nm:"Netflix",    logo:"netflix",    tint:"#DE3B30", appId:"RN1MCdNq8t.Netflix", appAlias:"org.tizen.netflix-app",
    tries:[{id:"org.tizen.netflix-app",ac:{op:"http://tizen.org/appcontrol/operation/default"}},{id:"RN1MCdNq8t.Netflix",ac:{op:"http://tizen.org/appcontrol/operation/default"}},{id:"org.tizen.netflixlowmem"},{id:"RN1MCdNq8t.Netflix"}]},
  {nm:"HBO Max",    logo:"hbomax",     tint:"#C7C23A", appId:"5b8c3eb16b.BeamCTVDev", appAlias:""},
  {nm:"Disney+",    logo:"disneyplus", tint:"#E07A2B", appId:"MCmYXNxgcu.DisneyPlus", appAlias:""},
  {nm:"Prime Video",logo:"primevideo", tint:"#E0A62B", appId:"evKhCgZelL.AmazonIgnitionLauncher2", appAlias:""},
  {nm:"Apple TV",   logo:"appletv",    tint:"#8FBE3C", appId:"Y6A54cEa22.AppleTV", appAlias:""},
  {nm:"Pluto TV",   logo:"plutotv",    tint:"#49B35A", appId:"X1pKpFCiUu.PlutoTV", appAlias:""},
  {nm:"Claro Video",logo:"claro",      tint:"#26B6C4", appId:"XqE4pU0E74.Clarovideo", appAlias:""},
  {nm:STR.appBrowser,logo:"navegador", tint:"#7A54E0", appId:"org.tizen.browser", appAlias:"",
    tries:[{id:"org.tizen.browser",ac:{op:"http://tizen.org/appcontrol/operation/view",uri:"https://www.google.com"}},
           {ac:{op:"http://tizen.org/appcontrol/operation/view",uri:"https://www.google.com"}},{id:"org.tizen.browser"}]},
  {nm:STR.appArt,    logo:"arte", lsvg:"", art:true, tint:"#6E8E59", appId:""}
];
/* v16.7 · CINTAS DEL SISTEMA, detrás de Arte (Arte sigue siendo la 15 y HDMI 12–14: nada cambia de sitio).
   ids leídos en el TV con «sdb shell 0 applist» (2026-10-25). El TV decide si deja abrirlas a una app de Dev Mode: un fallo
   sale en la pantalla de paso («Couldn't open X») y en el panel (fila 4). Tintes: rampa apagada (saturación .28–.55, luz ≈ .45,
   como Arte) de salvia a ladrillo, que cierra el bucle hacia el rojo de Netflix (20 → 01); logos de trazo propios (SYS_LOGOS).
   v16.9: FUERA la cinta Sources. v16.10 (decisión del autor 2026-10-26): FUERA Live TV
   (la TV en vivo se ve por la tecla Source del TV). Quedan 16 Apps · 17 Settings · 18 Search;
   cada una conserva su tinte (la rampa pierde su paso #A86A42 y sigue siendo monótona: salvia → ladrillo). */
/* los 5 logos de trazo de las cintas del sistema (24×24, trazo 1,6, como «navegador» de logos.js). Viven AQUÍ y entran por lsvg
   (como el icono de Arte): logos.js es compartido y no se toca (cabecera del README). */
var SYS_LOGOS={
  apps:"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3.5\" y=\"3.5\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"13.5\" y=\"3.5\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"3.5\" y=\"13.5\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"13.5\" y=\"13.5\" width=\"7\" height=\"7\" rx=\"1.5\"/></svg>",
  ajustes:"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M19.03 9.11 L21.52 9.67 L21.52 14.33 L19.03 14.89 L19.01 14.93 L20.38 17.08 L17.08 20.38 L14.93 19.01 L14.89 19.03 L14.33 21.52 L9.67 21.52 L9.11 19.03 L9.07 19.01 L6.92 20.38 L3.62 17.08 L4.99 14.93 L4.97 14.89 L2.48 14.33 L2.48 9.67 L4.97 9.11 L4.99 9.07 L3.62 6.92 L6.92 3.62 L9.07 4.99 L9.11 4.97 L9.67 2.48 L14.33 2.48 L14.89 4.97 L14.93 4.99 L17.08 3.62 L20.38 6.92 L19.01 9.07Z\"/><circle cx=\"12\" cy=\"12\" r=\"3.2\"/></svg>",
  tvlive:"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"2.8\" y=\"7\" width=\"18.4\" height=\"13\" rx=\"2\"/><path d=\"M8.5 3 12 7l3.5-4\"/></svg>",
  buscar:"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"10.5\" cy=\"10.5\" r=\"6.3\"/><path d=\"M15.3 15.3 20.6 20.6\"/></svg>"
};
if(SYS_TAPES) APPS=APPS.concat([
  {nm:STR.appApps,    logo:"apps", lsvg:SYS_LOGOS.apps,    tint:"#8A8A4E", appId:"org.volt.apps",        appAlias:"", role:"apps"},
  {nm:STR.appSettings,logo:"ajustes", lsvg:SYS_LOGOS.ajustes, tint:"#A08048", appId:"org.tizen.menu",       appAlias:"", role:"settings"},
  {nm:STR.appSearch,  logo:"buscar", lsvg:SYS_LOGOS.buscar,  tint:"#BA4436", appId:"org.volt.search-all",  appAlias:"", role:"search"}
]);
var N=APPS.length, NN=("0"+N).slice(-2);              // v16.7: «APP NN/20» (15 con ?sys=0) · v16.9: «NN/19» (Sources fuera)
APPS.forEach(function(a,i){ a.num=("0"+(i+1)).slice(-2); a.ink=(i%2)?PAL.cr:PAL.y;
  if(TINT_MODE==="palette") a.tint=PAL5[i%5]; });

/* ===== LOGOS: SVG → ráster una vez → copias tintadas en caché ============================== */
var logoImg={}, logoAsp={}, tinted={}, logoRing={}, ICON={bytes:0,ok:false,stickerPx:0,ringPx:0};
/* rasteriza el SVG a H px de alto (el navegador lo pinta como vector a ese tamaño exacto) */
function rasterSvg(svg,LH,cb){
  var vb=/viewBox="([\d.\- ]+)"/.exec(svg), asp=1;
  if(vb){ var p=vb[1].trim().split(/\s+/); if(p.length===4&&+p[3]) asp=(+p[2])/(+p[3]); }
  var H=LH, W=Math.round(H*asp); if(W>LH*2.25){ W=Math.round(LH*2.25); H=Math.round(W/asp); }
  var sized=svg.replace(/<svg /,'<svg width="'+W+'" height="'+H+'" ');
  var url=URL.createObjectURL(new Blob([sized],{type:"image/svg+xml"})), im=new Image();   // blob local, sin red
  im.onload=function(){ var c=mkCanvas(W,H); c.getContext("2d").drawImage(im,0,0,W,H);
    URL.revokeObjectURL(url); cb(c,W/H); };
  im.onerror=function(){ URL.revokeObjectURL(url); cb(null,1); };
  im.src=url;
}
/* Los logos monocromos se rasterizan a LOGO_H y se tiñen. Los MULTITONO (la Mona Lisa) se rasterizan al
   tamaño EXACTO en que se ven, sin tinte: 112u de caja × K() = 121 px a 1080 (los ojos son trazos de
   ~2,7 × 1,2 px; bajarlos desde 160 px los emborronaba) y, aparte, al tamaño del logo del anillo
   (fmax·logo u × K() = 49 px), para no reducir 2,5× desde el grande. */
function loadLogo(key,svg,cb){
  if(!svg){ logoImg[key]=null; cb(); return; }
  if(!MULTI[key]){ rasterSvg(svg,LOGO_H,function(c,asp){ logoImg[key]=c; logoAsp[key]=asp; cb(); }); return; }
  var hS=Math.round(LOGOBOX.bh*K()), hR=Math.round(RING_T.fmax*RING_T.logo*K());
  rasterSvg(svg,hS,function(c,asp){ logoImg[key]=c; logoAsp[key]=asp; ICON.stickerPx=c?c.height:0;
    rasterSvg(svg,hR,function(r){ logoRing[key]=r; ICON.ringPx=r?r.height:0; cb(); }); });
}
function logoTinted(key,col){
  var id=key+col; if(tinted[id]) return tinted[id]; var src=logoImg[key]; if(!src) return null;
  var c=mkCanvas(src.width,src.height), x=c.getContext("2d"); x.drawImage(src,0,0);
  x.globalCompositeOperation="source-in"; x.fillStyle=col; x.fillRect(0,0,c.width,c.height);
  tinted[id]=c; return c;
}
function drawLogoFit(c,key,col,cx,cy,bw,bh,nm){ var lg=MULTI[key]?logoImg[key]:logoTinted(key,col); if(!lg){ if(nm) drawMono(c,nm,col,cx,cy,bw,bh); return; }
  var s=Math.min(bw/lg.width,bh/lg.height), w=lg.width*s, h=lg.height*s; c.drawImage(lg,cx-w/2,cy-h/2,w,h); }
/* v11 (auditoría 19): una app SIN logo dejaba la pantallita negra. Respaldo: monograma (iniciales de hasta dos palabras,
   «Prime Video» → «PV», «HDMI 1» → «H1») en Gugi, con la tinta del logo, ajustado a la misma caja. Hoy no lo usa nadie:
   las 15 tienen logo. */
function drawMono(c,nm,col,cx,cy,bw,bh){ var w=String(nm).split(/\s+/).filter(Boolean), t=((w[0]||"?").charAt(0)+(w[1]?w[1].charAt(0):"")).toUpperCase(), fs=bh*0.62;
  c.save(); c.fillStyle=col; c.textAlign="center"; c.textBaseline="middle"; c.font="400 "+fs+"px Gugi, Rubik, sans-serif";
  while(c.measureText(t).width>bw*0.9&&fs>8){ fs-=2; c.font="400 "+fs+"px Gugi, Rubik, sans-serif"; }
  c.fillText(t,cx,cy); c.restore(); }

/* ===== ENSAMBLADO EN PÍXELES (lab) — corre dentro del Ticker ============================== */
function assemble(cv,src,k,onDone){
  if(cv._job){ cv._job.dead=true; cv._job=null; }
  var x=cv.getContext("2d");
  function sharp(){ x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,cv.width,cv.height); x.drawImage(src,0,0); }
  if(REDUCE||!CASS_RICH){ sharp(); if(onDone) onDone(); return; }
  var W=src.width, H=src.height, d=src.getContext("2d").getImageData(0,0,W,H).data;
  var st=Math.max(2,Math.round(R_STEP_U*k)), ps=st*0.92, parts=[], px, py;
  for(py=0;py<H;py+=st) for(px=0;px<W;px+=st){ var o=(py*W+px)*4, al=d[o+3]; if(al<40) continue;
    var ang=Math.random()*6.2832, dist=(40+Math.random()*170)*k;
    parts.push({x:px,y:py,ox:Math.cos(ang)*dist,oy:Math.sin(ang)*dist,
      col:"rgba("+d[o]+","+d[o+1]+","+d[o+2]+","+(al/255).toFixed(2)+")"}); }
  var job={dead:false,start:performance.now()}; cv._job=job;
  tAdd(function(now){
    if(job.dead) return true;
    var t=Math.min(1,Math.max(0,(now-job.start)/R_DUR)), m=1-easeReveal(t),
        ta=Math.min(1,t/0.70), al=0.25+0.75*(1-(1-ta)*(1-ta)), j, p;
    x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,cv.width,cv.height); x.globalAlpha=al;
    /* v16.2: fillStyle sólo cuando cambia el color (asignarlo re-analiza la cadena CSS; en la banda oscura del anillo miles de
       partículas seguidas comparten color). Mismo dibujo: mismo color, mismo orden. */
    var lc=null; for(j=0;j<parts.length;j++){ p=parts[j]; if(p.col!==lc){ x.fillStyle=p.col; lc=p.col; } x.fillRect(p.x+p.ox*m,p.y+p.oy*m,ps,ps); }
    x.globalAlpha=1;
    if(t>=1){ sharp(); cv._job=null; if(onDone) onDone(); return true; }
    return false; },"asm");
}
function stopAssemble(cv,src){ if(cv._job){ cv._job.dead=true; cv._job=null; }
  var x=cv.getContext("2d"); x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,cv.width,cv.height); x.drawImage(src,0,0); }

/* ===== GIRO (WAAPI, sólo transform). Rampa ease-in + crucero lineal C1 (lab) ============== */
function rot(a){ return "rotate("+a.toFixed(3)+"deg)"; }
function Spinner(el){ this.el=el; this.ang=0; this.anim=null; this.phase=0; this.base=0; }
Spinner.prototype.now=function(){ var a=this.anim; if(!a||!this.phase) return this.ang;
  var t=(a.currentTime==null)?0:a.currentTime;
  if(this.phase===1){ var p=Math.min(1,t/RING_RAMP); return this.base+RAMP_ANG*p*p; }
  return this.base+360*((t%RING_PERIOD)/RING_PERIOD); };
Spinner.prototype.start=function(){
  this.stop(); if(REDUCE||!CASS_RICH||!this.el.animate) return;
  var s=this, b=this.ang; s.phase=1; s.base=b;
  var a1=this.el.animate([{transform:rot(b)},{transform:rot(b+RAMP_ANG)}],{duration:RING_RAMP,easing:RING_EASE_IN,fill:"forwards"});
  s.anim=a1;
  function cruise(){ if(s.anim!==a1) return; clearTimeout(s.fb); s.fb=0; s.phase=2; s.base=b+RAMP_ANG;
    s.anim=s.el.animate([{transform:rot(s.base)},{transform:rot(s.base+360)}],{duration:RING_PERIOD,iterations:Infinity,easing:"linear"});
    /* FIX (heredado del lab): la rampa tiene fill:"forwards"; si no se cancela, al parar el crucero
       su último fotograma (+RAMP_ANG ≈ 15,4°) seguía pegado y el siguiente armado arrancaba girado. */
    try{ a1.cancel(); }catch(e){} }
  a1.onfinish=cruise;
  /* v11: si onfinish no llega (Animation de M47: sin verificar en el TV), el crucero entra por el temporizador; si ya
     llegó, cruise() no hace nada (s.anim ya es el crucero) */
  s.fb=setTimeout(cruise,RING_RAMP+250); };
Spinner.prototype.stop=function(){ clearTimeout(this.fb); this.fb=0; if(this.anim){ this.ang=this.now()%360; var a=this.anim; this.anim=null; try{a.cancel();}catch(e){} }
  this.phase=0; this.el.style.transform=rot(this.ang); };
Spinner.prototype.reset=function(){ this.stop(); this.ang=0; this.el.style.transform=rot(0); };

/* ===== DIBUJO V3 (lab, sin cambios de forma; la etiqueta de papel lleva la paleta 90s) ==== */
function drawRear(c,v,app){ var col=v.rear(app);
  c.beginPath(); rr(c,0,0,CW,CH,RAD); c.fillStyle=rgba(col,v.rearA); c.fill();
  var g=c.createRadialGradient(200,340,40,200,340,420);
  g.addColorStop(0,"rgba(255,255,255,0.06)"); g.addColorStop(1,"rgba(0,0,0,0.18)"); c.fillStyle=g; c.fill(); }
function drawChassis(c,v){
  c.globalAlpha=v.guts; c.lineCap="round"; c.lineJoin="round";
  c.beginPath(); c.moveTo(351,176); c.lineTo(361,40); c.lineTo(361,640); c.lineTo(352,654); c.lineTo(257,556);
  c.strokeStyle="#2B1813"; c.lineWidth=3.2; c.stroke(); c.strokeStyle="rgba(255,190,160,0.18)"; c.lineWidth=0.8; c.stroke();
  [[352,34],[352,646]].forEach(function(p){ c.beginPath(); c.arc(p[0],p[1],9.5,0,6.2832); c.fillStyle="#E9E5DE"; c.fill();
    c.lineWidth=1.4; c.strokeStyle="#8E877E"; c.stroke(); c.beginPath(); c.arc(p[0],p[1],3,0,6.2832); c.fillStyle="#6D665E"; c.fill(); });
  [[62,32],[62,648],[324,372],[62,372]].forEach(function(p){ c.beginPath(); c.arc(p[0],p[1],8,0,6.2832); c.fillStyle="rgba(255,255,255,0.30)"; c.fill();
    c.lineWidth=1.2; c.strokeStyle="rgba(0,0,0,0.38)"; c.stroke();
    c.beginPath(); c.moveTo(p[0]-4,p[1]); c.lineTo(p[0]+4,p[1]); c.moveTo(p[0],p[1]-4); c.lineTo(p[0],p[1]+4);
    c.lineWidth=1.3; c.strokeStyle="rgba(0,0,0,0.45)"; c.stroke(); });
  c.beginPath(); c.moveTo(262,372); for(var i=0;i<6;i++){ c.lineTo(268+i*7,(i%2)?364:380); }
  c.strokeStyle="rgba(230,226,218,0.75)"; c.lineWidth=2; c.stroke();
  c.beginPath(); rr(c,84,366,58,12,6); c.fillStyle="rgba(235,232,226,0.55)"; c.fill(); c.lineWidth=1; c.strokeStyle="rgba(0,0,0,0.3)"; c.stroke();
  c.globalAlpha=1; }
function drawReel(c,cfg){
  var o=cfg.size/2, F=cfg.flange, P=cfg.pack, H=cfg.hubR, full=cfg.full, i, a;
  c.save(); c.translate(o,o);
  c.beginPath(); c.arc(0,0,F,0,6.2832); c.fillStyle=full?"rgba(255,225,215,0.10)":"rgba(206,212,206,0.22)"; c.fill();
  c.lineWidth=1.4; c.strokeStyle="rgba(255,255,255,0.30)"; c.stroke();
  for(i=0;i<6;i++){ c.save(); c.rotate(i*Math.PI/3); c.beginPath(); rr(c,-3.6,-F+5,7.2,F-H-8,3.6); c.fillStyle="rgba(255,255,255,0.12)"; c.fill(); c.restore(); }
  if(full){ [[P,"#A65A49"],[P-5,"#55271F"],[P-24,"#8A4638"],[P-30,"#3A1B17"],[P-58,"#5A2A22"],[P-64,"#2B1512"]]
      .forEach(function(b){ c.beginPath(); c.arc(0,0,b[0],0,6.2832); c.fillStyle=b[1]; c.fill(); }); }
  else { c.beginPath(); c.arc(0,0,P,0,6.2832); c.fillStyle="#2A2624"; c.fill();
    c.beginPath(); c.arc(0,0,P-1.2,0,6.2832); c.lineWidth=2.4; c.strokeStyle="#57504B"; c.stroke(); }
  for(i=H+2;i<P;i+=2.6){ c.beginPath(); c.arc(0,0,i,0,6.2832); c.lineWidth=0.7;
    c.strokeStyle=(Math.round(i)%3)?"rgba(255,190,160,0.05)":"rgba(0,0,0,0.20)"; c.stroke(); }
  c.save(); c.rotate(-0.5); c.fillStyle="rgba(240,230,210,0.6)"; c.fillRect(-1.4,-P+1,2.8,11); c.restore();
  c.beginPath(); c.arc(0,0,H,0,6.2832); c.fillStyle=full?"#221D1A":"#E7E3DC"; c.fill();
  for(i=0;i<6;i++){ a=i*Math.PI/3+0.26; c.beginPath(); c.moveTo(0,0); c.arc(0,0,H-2,a,a+0.34); c.closePath();
    c.fillStyle=full?"rgba(255,235,220,0.17)":"rgba(0,0,0,0.12)"; c.fill(); }
  c.beginPath(); c.arc(0,0,H,0,6.2832); c.lineWidth=1.6; c.strokeStyle=full?"rgba(0,0,0,0.6)":"rgba(0,0,0,0.25)"; c.stroke();
  c.beginPath(); c.arc(0,0,12,0,6.2832); c.fillStyle="#0B0908"; c.fill();
  for(i=0;i<3;i++){ c.save(); c.rotate(i*2.0944); c.fillStyle=full?"#5B524B":"#F2EFEA"; c.fillRect(-1.9,-12,3.8,5.5); c.restore(); }
  c.restore(); }
function drawRing(c,k,cfg,tokens){
  var o=cfg.size/2, R=cfg.R, circ=2*Math.PI*R, FMAX=cfg.fmax, FMIN=cfg.fmin;
  c.textAlign="center"; c.textBaseline="middle";
  function units(px,reps){ c.font="700 "+px+"px Gugi, Rubik, Arial, sans-serif";
    var sepW=c.measureText(" · ").width, us=[], tot=0, r, i, j;
    for(r=0;r<reps;r++) for(i=0;i<tokens.length;i++){ var tk=tokens[i];
      if(tk.t==="sep"){ us.push({kind:"sep",w:sepW}); tot+=sepW; }
      else if(tk.t==="logo"){ var lh=px*cfg.logo, asp=logoAsp[tk.key]||1, lw=Math.min(lh*asp,px*4.6);
        lh=lw/asp; us.push({kind:"logo",key:tk.key,w:lw+px*0.3,lw:lw,lh:lh}); tot+=lw+px*0.3; }
      else for(j=0;j<tk.s.length;j++){ var w=c.measureText(tk.s[j]).width*1.12; us.push({kind:"ch",ch:tk.s[j],w:w}); tot+=w; } }
    return {us:us,tot:tot}; }
  var u1=units(FMAX,1), reps=Math.max(1,Math.round(circ/u1.tot));
  var px=Math.max(FMIN,Math.min(FMAX,FMAX*circ/(u1.tot*reps)));
  var u=units(px,reps), f=circ/u.tot, bandW=px*1.5;
  c.beginPath(); c.arc(o,o,R,0,6.2832); c.lineCap="butt";
  c.lineWidth=bandW*1.45; c.strokeStyle="rgba(8,6,5,0.30)"; c.stroke();
  c.lineWidth=bandW; c.strokeStyle="rgba(10,8,6,"+BAND_A+")"; c.stroke();
  c.font="700 "+px+"px Gugi, Rubik, Arial, sans-serif";
  c.lineJoin="round"; c.miterLimit=2; c.strokeStyle="#0C0A08"; c.lineWidth=2.4;
  var first=u.us[0], a=-(first.w*f/R)/2, i;
  for(i=0;i<u.us.length;i++){ var un=u.us[i], span=un.w*f/R, mid=a+span/2;
    c.save(); c.translate(o,o); c.rotate(mid); c.translate(0,-R);
    if(un.kind==="ch"){ c.shadowColor="#0C0A08"; c.shadowBlur=3*k; c.strokeText(un.ch,0,0); c.shadowBlur=0; c.fillStyle="#FFFFFF"; c.fillText(un.ch,0,0); }
    else if(un.kind==="logo"){ var lg=MULTI[un.key]?(logoRing[un.key]||logoImg[un.key]):logoTinted(un.key,"#FFFFFF");   // v3: multitono, en su color
      if(lg){ c.shadowColor="#0C0A08"; c.shadowBlur=4*k; c.drawImage(lg,-un.lw/2,-un.lh/2-px*0.15*cfg.logo,un.lw,un.lh); c.shadowBlur=0; } }
    c.restore(); a+=span; }
  return px; }
function tokensTop(app){ return [{t:"logo",key:app.logo},{t:"sep"},{t:"text",s:app.nm.toUpperCase()},{t:"sep"},{t:"text",s:app.art?STR.ringGallery:STR.ringSideA},{t:"sep"}]; }
function tokensBot(app){ return [{t:"text",s:app.num},{t:"sep"},{t:"text",s:app.art?STR.ringPlay:STR.ringOpen},{t:"sep"},{t:"text",s:"▶"},{t:"sep"}]; }
function drawTapa(c,k,v,app){
  var tint=v.tint(app), dark=mix(tint,"#000000",.55), light=mix(tint,"#FFFFFF",.5);
  var spine=v.spine||mix(tint,"#FFFFFF",.12), frame=v.frame(app), i, p, x0, y0;
  c.save(); c.beginPath(); rr(c,0,0,CW,CH,RAD); c.clip();
  c.fillStyle=rgba(tint,v.A); c.fillRect(0,0,CW,CH);
  c.fillStyle=rgba(spine,v.spineA); c.fillRect(0,0,36,CH);
  c.save(); c.setTransform(1,0,0,1,0,0);
  var ox=c._ox||0, oy=c._oy||0;                              // desplazamiento en px (lite con margen)
  p=Math.max(3,Math.round(3.4*k)); x0=Math.round(ox+38*k); y0=Math.round(oy+9*k);
  var x1=Math.round(ox+368*k), y1=Math.round(oy+671*k);
  c.fillStyle=rgba(dark,v.grid);
  for(i=x0;i<x1;i+=p) c.fillRect(i,y0,1,y1-y0);
  for(i=y0;i<y1;i+=p) c.fillRect(x0,i,x1-x0,1);
  c.fillStyle="rgba(255,255,255,"+(v.grid*0.55).toFixed(3)+")";
  for(i=x0+1;i<x1;i+=p) c.fillRect(i,y0,1,y1-y0);
  for(i=y0+1;i<y1;i+=p) c.fillRect(x0,i,x1-x0,1);
  c.restore();
  [5,13,29].forEach(function(xx){ c.fillStyle=rgba(dark,.32); c.fillRect(xx,0,0.9,CH); c.fillStyle="rgba(255,255,255,.22)"; c.fillRect(xx+0.9,0,0.7,CH); });
  c.fillStyle=rgba(dark,.55); c.fillRect(36,0,1.4,CH); c.fillStyle="rgba(255,255,255,.38)"; c.fillRect(37.4,0,1.1,CH);
  c.fillStyle="rgba(255,255,255,.12)"; c.fillRect(38,0,CW,8); c.fillRect(38,672,CW,8);
  c.fillStyle=rgba(dark,.40); c.fillRect(38,8,CW,1); c.fillRect(38,671,CW,1);
  c.fillStyle=rgba(light,.45); c.fillRect(40,1,50,5); c.fillRect(40,674,50,5);
  c.strokeStyle=rgba(dark,.45); c.lineWidth=0.8; c.strokeRect(40,1,50,5); c.strokeRect(40,674,50,5);
  c.fillStyle="rgba(255,255,255,.14)"; c.fillRect(CW-8,0,8,CH);
  c.save(); c.translate(24.5,664); c.rotate(-Math.PI/2);
  c.font="700 13.5px Rubik, Arial, sans-serif"; c.textAlign="left"; c.textBaseline="alphabetic";
  function etch(t,x){ c.fillStyle="rgba(255,255,255,.34)"; c.fillText(t,x+0.6,0.7); c.fillStyle=rgba(dark,.92); c.fillText(t,x,0); }
  etch(STR.tapeInsert,0);
  var w1=c.measureText(STR.tapeInsert).width;
  c.save(); c.translate(w1+16,-4.5); c.beginPath();
  c.moveTo(-6,0); c.lineTo(0,-6); c.lineTo(6,0); c.lineTo(3,0); c.lineTo(3,5); c.lineTo(-3,5); c.lineTo(-3,0); c.closePath();
  c.lineWidth=1.4; c.strokeStyle=rgba(dark,.92); c.stroke(); c.restore();
  etch(STR.tapeTouch,w1+32); c.restore();
  var g=c.createLinearGradient(0,0,CW,CH);
  g.addColorStop(0,"rgba(255,255,255,0)"); g.addColorStop(.28,"rgba(255,255,255,"+v.sheen+")");
  g.addColorStop(.40,"rgba(255,255,255,0)"); g.addColorStop(.72,"rgba(255,255,255,"+(v.sheen*.35)+")");
  g.addColorStop(.82,"rgba(255,255,255,0)"); c.fillStyle=g; c.fillRect(0,0,CW,CH);
  // LA VENTANA: hueco real (alfa 0). No es clip-path ni mask: son píxeles que no existen.
  c.globalCompositeOperation="destination-out";
  c.beginPath(); rr(c,HOLE.x,HOLE.y,HOLE.w,HOLE.h,HOLE.r); c.fillStyle="#000"; c.fill();
  c.globalCompositeOperation="source-over";
  c.beginPath(); rr(c,HOLE.x-FRAME_W,HOLE.y-FRAME_W,HOLE.w+FRAME_W*2,HOLE.h+FRAME_W*2,HOLE.r+FRAME_W); rr(c,HOLE.x,HOLE.y,HOLE.w,HOLE.h,HOLE.r);
  c.fillStyle=rgba(frame,v.frameA); c.fill("evenodd");
  var fg=c.createLinearGradient(0,HOLE.y,0,HOLE.y+HOLE.h);
  fg.addColorStop(0,"rgba(255,255,255,.22)"); fg.addColorStop(.5,"rgba(255,255,255,0)"); fg.addColorStop(1,"rgba(0,0,0,.18)");
  c.fillStyle=fg; c.fill("evenodd");
  c.beginPath(); rr(c,HOLE.x,HOLE.y,HOLE.w,HOLE.h,HOLE.r); c.lineWidth=1.3; c.strokeStyle="rgba(255,255,255,.42)"; c.stroke();
  c.beginPath(); rr(c,HOLE.x-FRAME_W,HOLE.y-FRAME_W,HOLE.w+FRAME_W*2,HOLE.h+FRAME_W*2,HOLE.r+FRAME_W); c.lineWidth=1.2; c.strokeStyle=rgba(dark,.5); c.stroke();
  c.restore();
  c.beginPath(); rr(c,0.9,0.9,CW-1.8,CH-1.8,RAD); c.lineWidth=1.8; c.strokeStyle=rgba(mix(tint,"#000000",.42),.9); c.stroke();
}
function drawMount(c,v,app){
  var frame=v.frame(app), dark=mix(v.tint(app),"#000000",.55);
  c.fillStyle=rgba(frame,v.frameA);
  c.fillRect(0,0,MOUNT.w,LBL.y); c.fillRect(0,LBL.y+LBL.h,MOUNT.w,MOUNT.h-LBL.y-LBL.h);
  c.fillRect(0,LBL.y,LBL.x,LBL.h); c.fillRect(LBL.x+LBL.w,LBL.y,MOUNT.w-LBL.x-LBL.w,LBL.h);
  c.fillStyle="rgba(255,255,255,.30)"; c.fillRect(0,0,MOUNT.w,1.2); c.fillRect(0,LBL.y+LBL.h+1,MOUNT.w,1);
  c.fillStyle=rgba(dark,.45); c.fillRect(0,LBL.y-1.2,MOUNT.w,1.2); c.fillRect(0,MOUNT.h-1.2,MOUNT.w,1.2);
  c.save(); c.translate(LBL.x,LBL.y); drawPaper(c,app); c.restore();
}
/* etiqueta de PAPEL V3 con la paleta 90s: papel crema #FFFEE8, filete superior rojo #F21E2C y
   las 5 franjas de la ref abajo. Tinta #1D1A17 sobre crema = 16.99:1. */
function drawPaper(c,app){
  var W=LBL.w, H=LBL.h, i, ink=PAL.ink;
  c.save(); c.beginPath(); c.rect(0,0,W,H); c.clip();
  c.fillStyle=PAL.cr; c.fillRect(0,0,W,H);
  for(i=58;i<H;i+=10){ c.fillStyle="rgba(106,29,65,.07)"; c.fillRect(0,i,W,0.8); }
  c.fillStyle=PAL.r; c.fillRect(0,0,W,7);
  c.fillStyle=ink; c.textAlign="center"; c.textBaseline="middle";
  var fs=26; c.font="400 "+fs+"px Gugi, Rubik, sans-serif";
  while(c.measureText(app.nm.toUpperCase()).width>W-20 && fs>16){ fs--; c.font="400 "+fs+"px Gugi, Rubik, sans-serif"; }
  c.fillText(app.nm.toUpperCase(),W/2,34);
  c.beginPath(); rr(c,14,58,W-28,150,6); c.fillStyle="#1C1816"; c.fill(); c.lineWidth=1; c.strokeStyle="rgba(0,0,0,.35)"; c.stroke();
  c.textAlign="left"; c.font="900 24px Rubik, Arial, sans-serif"; c.fillText(STR.paperNo+app.num,14,234);
  c.textAlign="right"; c.font="800 13px Rubik, Arial, sans-serif"; c.fillText(app.art?STR.paperGallery:STR.ringSideA,W-14,228);
  c.font="700 11px Rubik, Arial, sans-serif"; c.fillText(app.art?STR.paperWorks(ART_N):STR.paperTape,W-14,244);
  PAL5.forEach(function(col,j){ c.fillStyle=col; c.fillRect(14,254+j*4.8,W-28,4.6); });
  c.restore();
}
var LOGOBOX={x:LBL.x+14,y:LBL.y+58,w:LBL.w-28,h:150,bw:112,bh:112};   // pantallita (coords de montura)

/* ===== CASSETTE RICO: UNA sola pila 3D que se muda a la card enfocada ===================== */
function Rich(){
  var st=this.stage=el("div","stage"), cass=this.cass=el("div","cass",st);
  this.cvRear=mkCanvas(); this.cvRear.className="L0 full"; cass.appendChild(this.cvRear);
  this.walls=["wl","wr","wt","wb"].map(function(w){ return el("div","wall "+w,cass); });
  var L1=el("div","L1 full",cass); this.cvChassis=mkCanvas(); this.cvReelT=mkCanvas(); this.cvReelB=mkCanvas();
  L1.appendChild(this.cvChassis); L1.appendChild(this.cvReelT); L1.appendChild(this.cvReelB);
  var L2=el("div","L2 full",cass); this.cvRingT=mkCanvas(); this.cvRingB=mkCanvas(); L2.appendChild(this.cvRingT); L2.appendChild(this.cvRingB);
  this.cvTapa=mkCanvas(); this.cvTapa.className="L3 full"; cass.appendChild(this.cvTapa);
  var L4=el("div","L4",cass); this.cvMount=mkCanvas(); this.cvLogo=mkCanvas(); L4.appendChild(this.cvMount); L4.appendChild(this.cvLogo);
  this.srcRingT=mkCanvas(); this.srcRingB=mkCanvas(); this.srcLogo=mkCanvas();
  this.spReelT=new Spinner(this.cvReelT); this.spReelB=new Spinner(this.cvReelB);
  this.spRingT=new Spinner(this.cvRingT); this.spRingB=new Spinner(this.cvRingB);
  this.L1=L1; this.L2=L2; this.L4=L4;                    // v7: el despiece anima cada capa por separado
  this.app=null; this.k=0; this.card=null; this.focused=false;
}
Rich.prototype.layout=function(){ var k=this.k=K();
  drawChassis(sizeCanvas(this.cvChassis,0,0,CW,CH,k),V3);
  drawReel(sizeCanvas(this.cvReelT,REEL_T.x-REEL_T.size/2,REEL_T.y-REEL_T.size/2,REEL_T.size,REEL_T.size,k),REEL_T);
  drawReel(sizeCanvas(this.cvReelB,REEL_B.x-REEL_B.size/2,REEL_B.y-REEL_B.size/2,REEL_B.size,REEL_B.size,k),REEL_B);
  if(this.app) this.paintApp(); };
/* v16.6 · CACHÉ DE PINTADO por app (?paintcache=0 la apaga). paintApp pintaba en el hilo principal, al LLEGAR a
   cada app, el cuerpo, la tapa (rejilla de miles de fillRect), la montura y los anillos (texto con shadowBlur): una tarea larga
   en el fotograma de llegada (≈ 50 ms en el Mac con la CPU ×6). Ahora: (1) lo pintado se guarda (copias exactas, mismos píxeles)
   en una LRU de PC_MAX apps; (2) un rato después de llegar a una app, con el corredor quieto, se pinta de antemano la vecina en
   la dirección de la última flecha y luego la otra. Llegar a una app ya pintada = copiar 6 canvas (drawImage 1:1). */
/* MEDIDO en Chrome: pintar de antemano en canvas que NO son los del cassette rasteriza el texto un poco distinto (bordes de letra
   hasta 59/255 sueltos; menos insertados en el DOM, pero no 0). Por eso la pintura de las vecinas (?pcwarm=1) va APAGADA: por
   defecto la caché sólo guarda COPIAS EXACTAS de lo que el propio cassette pintó (volver a una app reciente = mismos píxeles). */
var PC_WARM=qp("pcwarm","0")==="1";
var PC_ON=V16&&qp("paintcache","1")!=="0", PC_MAX=3, PC={c:{},order:[],hits:0,miss:0,warm:0,warmT:0,dir:1};
function pcFit(cv,wU,hU,k){ cv.width=Math.max(1,Math.round(wU*k)); cv.height=Math.max(1,Math.round(hU*k));
  var c=cv.getContext("2d"); c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,cv.width,cv.height); c.setTransform(cv.width/wU,0,0,cv.height/hU,0,0); return c; }
function pcPut(app,S){ var key=app.nm; if(!PC.c[key]) PC.order.push(key); else { PC.order.splice(PC.order.indexOf(key),1); PC.order.push(key); }
  PC.c[key]=S; while(PC.order.length>PC_MAX){ var old=PC.order.shift(); pcDrop(PC.c[old]); delete PC.c[old]; } }
function pcGet(app,k){ var S=PC.c[app.nm]; if(!S||S.k!==k) return null; PC.order.splice(PC.order.indexOf(app.nm),1); PC.order.push(app.nm); return S; }
/* pinta una app entera en canvas sueltos, con la MISMA geometría que sizeCanvas/paintApp (mismos píxeles) */
/* los canvas de la pintura previa viven en el DOM (ocultos), como los del cassette: el texto de un canvas suelto (no insertado)
   se rasteriza distinto en Chrome (medido: bordes de letra hasta 59/255); insertados salen iguales */
var PC_HOLD=null;
function pcCanvas(){ if(!PC_HOLD){ PC_HOLD=el("div","pc-hold",tv); } var c=document.createElement("canvas"); c.width=1; c.height=1; PC_HOLD.appendChild(c); return c; }
function pcDrop(S){ ["rear","tapa","mount","sT","sB","sL"].forEach(function(n){ var c=S&&S[n]; if(c&&c.parentNode===PC_HOLD) PC_HOLD.removeChild(c); }); }
function pcPaint(app,k){ var v=V3, S={k:k,rear:pcCanvas(),tapa:pcCanvas(),mount:pcCanvas(),sT:pcCanvas(),sB:pcCanvas(),sL:pcCanvas()};
  drawRear(pcFit(S.rear,CW,CH,k),v,app); drawTapa(pcFit(S.tapa,CW,CH,k),k,v,app); drawMount(pcFit(S.mount,MOUNT.w,MOUNT.h,k),v,app);
  S.sT.width=S.sT.height=Math.max(1,Math.round(RING_T.size*k)); S.sB.width=S.sB.height=Math.max(1,Math.round(RING_B.size*k));
  var cT=S.sT.getContext("2d"), cB=S.sB.getContext("2d");
  cT.setTransform(S.sT.width/RING_T.size,0,0,S.sT.width/RING_T.size,0,0); drawRing(cT,k,RING_T,tokensTop(app));
  cB.setTransform(S.sB.width/RING_B.size,0,0,S.sB.width/RING_B.size,0,0); drawRing(cB,k,RING_B,tokensBot(app));
  var lb=LOGOBOX; S.sL.width=Math.max(1,Math.round(lb.w*k)); S.sL.height=Math.max(1,Math.round(lb.h*k));
  var cL=S.sL.getContext("2d"), sl=S.sL.width/lb.w; cL.setTransform(sl,0,0,sl,0,0); drawLogoFit(cL,app.logo,app.ink,lb.w/2,lb.h/2,lb.bw,lb.bh,app.nm);
  return S; }
function pcCopy(cv){ var c=pcCanvas(); c.width=cv.width; c.height=cv.height; c.getContext("2d").drawImage(cv,0,0); return c; }
function pcBlit(dst,src){ var c=dst.getContext("2d"); c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,dst.width,dst.height); c.drawImage(src,0,0); }
/* un rato después de llegar (armado acabado, corredor quieto): la vecina en la dirección de la última flecha, luego la otra */
function pcWarmSoon(){ clearTimeout(PC.warmT); if(!PC_ON||!PC_WARM||REDUCE) return; PC.warmT=setTimeout(function step(){
    if(tw||LAUNCH.phase||artMode||(BOOT&&BOOT.on)||!rich.focused||rich.cvRingT._job){ PC.warmT=setTimeout(step,700); return; }
    var ai=appIndex(), k=rich.k, list=[(ai+PC.dir+N)%N,(ai-PC.dir+N)%N];
    for(var j=0;j<list.length;j++){ var app=APPS[list[j]]; if(pcGet(app,k)) continue; pcPut(app,pcPaint(app,k)); PC.warm++;
      if(j===0) { PC.warmT=setTimeout(step,600); } return; } },1300); }
Rich.prototype.paintApp=function(){
  var k=this.k, v=V3, app=this.app, PCS=PC_ON?pcGet(app,k):null;
  if(PCS) PC.hits++; else PC.miss++;
  if(PCS){ sizeCanvas(this.cvRear,0,0,CW,CH,k); pcBlit(this.cvRear,PCS.rear); sizeCanvas(this.cvTapa,0,0,CW,CH,k); pcBlit(this.cvTapa,PCS.tapa); }
  else { drawRear(sizeCanvas(this.cvRear,0,0,CW,CH,k),v,app);
  drawTapa(sizeCanvas(this.cvTapa,0,0,CW,CH,k),k,v,app); }
  var tint=v.tint(app), dark=mix(tint,"#000000",.5);
  var bg="linear-gradient(90deg,"+rgba(dark,.35)+","+rgba("#FFFFFF",.10)+" 45%,"+rgba(dark,.30)+"),"+
         "repeating-linear-gradient(0deg,"+rgba(dark,.22)+" 0,"+rgba(dark,.22)+" 1.296px,transparent 1.296px,transparent 4.536px),"+rgba(tint,v.wallA);
  var bgH=bg.replace("repeating-linear-gradient(0deg","repeating-linear-gradient(90deg").replace("linear-gradient(90deg","linear-gradient(0deg");
  this.walls.forEach(function(w,i){ w.style.background=(i<2)?bg:bgH; });
  if(PCS){ sizeCanvas(this.cvMount,0,0,MOUNT.w,MOUNT.h,k); pcBlit(this.cvMount,PCS.mount); }
  else drawMount(sizeCanvas(this.cvMount,0,0,MOUNT.w,MOUNT.h,k),v,app);
  sizeCanvas(this.cvRingT,RING_T.x-RING_T.size/2,RING_T.y-RING_T.size/2,RING_T.size,RING_T.size,k);
  sizeCanvas(this.cvRingB,RING_B.x-RING_B.size/2,RING_B.y-RING_B.size/2,RING_B.size,RING_B.size,k);
  var sT=this.srcRingT, sB=this.srcRingB, sL=this.srcLogo;
  sT.width=this.cvRingT.width; sT.height=this.cvRingT.height; sB.width=this.cvRingB.width; sB.height=this.cvRingB.height;
  var cT=sT.getContext("2d"), cB=sB.getContext("2d");
  if(PCS){ pcBlit(sT,PCS.sT); pcBlit(sB,PCS.sB); }
  else { cT.setTransform(sT.width/RING_T.size,0,0,sT.width/RING_T.size,0,0); drawRing(cT,k,RING_T,tokensTop(app));
  cB.setTransform(sB.width/RING_B.size,0,0,sB.width/RING_B.size,0,0); drawRing(cB,k,RING_B,tokensBot(app)); }
  var lb=LOGOBOX; sizeCanvas(this.cvLogo,lb.x,lb.y,lb.w,lb.h,k);
  sL.width=this.cvLogo.width; sL.height=this.cvLogo.height;
  var cL=sL.getContext("2d"), sl=sL.width/lb.w;
  if(PCS) pcBlit(sL,PCS.sL);
  else { cL.setTransform(sl,0,0,sl,0,0); drawLogoFit(cL,app.logo,app.ink,lb.w/2,lb.h/2,lb.bw,lb.bh,app.nm); }
  if(PC_ON&&!PCS) pcPut(app,{k:k,rear:pcCopy(this.cvRear),tapa:pcCopy(this.cvTapa),mount:pcCopy(this.cvMount),sT:pcCopy(sT),sB:pcCopy(sB),sL:pcCopy(sL)});
  stopAssemble(this.cvRingT,sT); stopAssemble(this.cvRingB,sB); stopAssemble(this.cvLogo,sL);
};
/* se muda a `card`, repinta lo que depende de la app, se inclina y ARMA → GIRA (sólo en foco) */
Rich.prototype.prepaint=function(app){ if(this.k!==K()) this.layout(); if(this.app!==app){ this.app=app; this.paintApp(); } };   // v16.11 F3
Rich.prototype.attach=function(card,app){
  var a0=TP.on?performance.now():0;
  this.stage.classList.remove("st-hold");                              // v16.11 F3: la pila vuelve a verse (oculta en el fotograma 1)
  if(this.k!==K()) this.layout();
  if(this.app!==app){ this.app=app; this.paintApp(); }
  if(this.card!==card){ card.appendChild(this.stage); this.card=card; }
  this.spReelT.reset(); this.spReelB.reset(); this.spRingT.reset(); this.spRingB.reset();
  if(this.premoved&&this.card===card){ this.cass.classList.remove("t-leve"); }   // v16.11 F4: mudanza oculta en el fotograma anterior: el frontal ya está calculado
  else { this.cass.classList.remove("t-leve"); void this.cass.offsetWidth; }       // frontal = lo que enseñaba el lite
  this.premoved=false;
  if(CASS_RICH) this.cass.classList.add("t-leve");                     // y se inclina (transición .6 s)
  this.focused=true; this.paused=false; this.animateIn();
  if(TP.on){ var am=performance.now()-a0; TP.attach+=am; TP.attachN++; if(am>TP.attachMax) TP.attachMax=am; }
  pcWarmSoon(); cfPrepSoon();                                          // v16.6: vecinas pintadas y cassette horneado, de antemano
};
Rich.prototype.animateIn=function(){ var self=this;
  this.spReelT.start(); this.spReelB.start();
  assemble(this.cvRingT,this.srcRingT,this.k,function(){ if(self.focused) self.spRingT.start(); });
  assemble(this.cvRingB,this.srcRingB,this.k,function(){ if(self.focused) self.spRingB.start(); });
  assemble(this.cvLogo,this.srcLogo,this.k,null);
};
/* pierde el foco: congela giros, asienta nítido y vuelve a frontal mientras se aleja */
Rich.prototype.release=function(){
  if(!this.focused) return; this.focused=false;
  this.spReelT.stop(); this.spReelB.stop(); this.spRingT.stop(); this.spRingB.stop();
  stopAssemble(this.cvRingT,this.srcRingT); stopAssemble(this.cvRingB,this.srcRingB); stopAssemble(this.cvLogo,this.srcLogo);
  this.cass.classList.remove("t-leve");
};

/* P8e · reposo/salvapantallas: congela SÓLO los giros (sin tocar inclinación ni armado) */
Rich.prototype.pause=function(){ if(!this.focused||this.paused) return; this.paused=true;
  this.spReelT.stop(); this.spReelB.stop(); this.spRingT.stop(); this.spRingB.stop(); };
Rich.prototype.resume=function(){ if(!this.paused) return; this.paused=false; if(!this.focused) return;
  this.spReelT.start(); this.spReelB.start();
  if(!this.cvRingT._job) this.spRingT.start(); if(!this.cvRingB._job) this.spRingB.start(); };

/* ===== CASSETTE LITE: las mismas capas aplanadas en UN canvas por app ======================
   Vista frontal con la perspectiva de .stage emulada (cada capa escalada PERS/(PERS−z) desde el
   centro), así el relevo lite→rico al enfocar no salta. Anillos y logo nítidos y quietos. */
var LPAD=0.01;
function renderLite(app,cv){
  var k=K()*LITE_SCALE, W=CW*(1+2*LPAD), H=CH*(1+2*LPAD);
  cv.width=Math.max(1,Math.round(W*k)); cv.height=Math.max(1,Math.round(H*k));
  var c=cv.getContext("2d"); c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,cv.width,cv.height);
  var ox=CW*LPAD*k, oy=CH*LPAD*k;
  function layer(xU,yU,wU,hU,z,draw){
    var t=tmpCanvas(Math.round(wU*k),Math.round(hU*k)), tc=t.getContext("2d");
    tc.setTransform(t.width/wU,0,0,t.height/hU,0,0); draw(tc,t);
    var s=PERS/(PERS-z), cx=CW/2, cy=CH/2;
    c.drawImage(t, ox+(cx+(xU-cx)*s)*k, oy+(cy+(yU-cy)*s)*k, wU*s*k, hU*s*k); }
  layer(0,0,CW,CH,Z.rear,function(tc){ drawRear(tc,V3,app); });
  layer(0,0,CW,CH,Z.guts,function(tc){ drawChassis(tc,V3); });
  layer(REEL_T.x-REEL_T.size/2,REEL_T.y-REEL_T.size/2,REEL_T.size,REEL_T.size,Z.guts,function(tc){ drawReel(tc,REEL_T); });
  layer(REEL_B.x-REEL_B.size/2,REEL_B.y-REEL_B.size/2,REEL_B.size,REEL_B.size,Z.guts,function(tc){ drawReel(tc,REEL_B); });
  layer(RING_T.x-RING_T.size/2,RING_T.y-RING_T.size/2,RING_T.size,RING_T.size,Z.ring,function(tc){ drawRing(tc,k,RING_T,tokensTop(app)); });
  layer(RING_B.x-RING_B.size/2,RING_B.y-RING_B.size/2,RING_B.size,RING_B.size,Z.ring,function(tc){ drawRing(tc,k,RING_B,tokensBot(app)); });
  layer(0,0,CW,CH,Z.tapa,function(tc){ drawTapa(tc,k,V3,app); });
  layer(MOUNT.x,MOUNT.y,MOUNT.w,MOUNT.h,Z.sticker,function(tc){ drawMount(tc,V3,app); });
  layer(MOUNT.x+LOGOBOX.x,MOUNT.y+LOGOBOX.y,LOGOBOX.w,LOGOBOX.h,Z.sticker,function(tc){
    drawLogoFit(tc,app.logo,app.ink,LOGOBOX.w/2,LOGOBOX.h/2,LOGOBOX.bw,LOGOBOX.bh,app.nm); });
}

/* ===== DOM (las dos páginas son conchas idénticas; esto las rellena) ====================== */
var B=document.body;
if(DEV) B.classList.add("dev");
/* v3 · EL LIENZO DEL TV: todo vive en #tv (1920×1080 px CSS) y se escala UNIFORME a la ventana, centrado
   (letterbox negro). Es un transform 2D por encima de .viewport: la perspectiva y la cadena preserve-3d
   del corredor quedan dentro, intactas; los position:fixed pasan a ser relativos al lienzo. */
var tv=document.createElement("div"); tv.id="tv"; B.appendChild(tv);
/* v16 · SONDAS (sólo ?dev=1): ?probe=stars,ovl,bands,walls,hud,cards,still,cass,bg,dot quitan a propósito una capa para medir su coste
   en el TV con el panel ?diag=1 (p8e.css, «SONDAS»). No son el producto. Lista y orden: README, v16. */
var PROBE=DEV?qp("probe","").split(",").filter(function(t){ return /^(stars|ovl|bands|walls|hud|cards|still|cass|bg|dot)$/.test(t); }):[];
PROBE.forEach(function(t){ B.classList.add("probe-"+t); if(t==="dot") el("div","probe-dot-el",tv); });
var STAGE={s:1,x:0,y:0,w:0,h:0};
function fitStage(){ var de=document.documentElement, w=de.clientWidth||window.innerWidth, h=de.clientHeight||window.innerHeight;
  var s=Math.min(w/STAGE_W,h/STAGE_H), x=Math.round((w-STAGE_W*s)/2), y=Math.round((h-STAGE_H*s)/2);
  STAGE.s=s; STAGE.x=x; STAGE.y=y; STAGE.w=w; STAGE.h=h;
  var tf="translate("+x+"px,"+y+"px) scale("+(+s.toFixed(5))+")"; tv.style.webkitTransform=tf; tv.style.transform=tf; }
fitStage();
function html(parent,s){ var d=document.createElement("div"); d.innerHTML=s; while(d.firstChild) parent.appendChild(d.firstChild); }
html(tv,
  '<div class="artwrap" aria-hidden="true"><div class="art-still" id="artStill"></div><canvas class="art-canvas" id="artCanvas"></canvas></div>'+
  /* v8 · FICHA DE MUSEO (abajo a la derecha): artista / título en cursiva, fecha. Una sola cara (#fichaFace):
     al cambiar de obra se funde fuera, se reescribe y se funde dentro; nunca hay dos textos a la vez.
     La HORA va sola abajo a la izquierda (.foot). Las dos viven fuera del HUD: siguen en el salvapantallas. */
  /* v16.3 (decisión del autor, 2026-10-25): la ficha deja la esquina derecha (tapaba la atribución de
     Open-Meteo) y va en el pie, a la izquierda, tras la hora y separada por «|», en UNA línea. */
  '<div class="foot" id="foot"><span class="clk" id="clk" aria-label="'+STR.clockAria+'">00:00</span>'+
    '<span class="fsep" aria-hidden="true">|</span>'+
    '<div class="ficha" id="ficha" aria-hidden="true"><div class="fc" id="fichaFace"><span class="fa" id="fichaA"></span>'+
    '<span class="ft"><i id="fichaT"></i><span id="fichaD"></span></span></div></div></div>'+
  /* P8e · 5 franjas por lado SOBRE el arte (cada una, una hoja que se mueve sola) y sus píldoras: el panel
     de información de reposo (.ti). v6: sólo info; nacen FUERA y ocultas (out + gone) y .info es fijo */
  '<div class="bands out info gone" id="bands" aria-hidden="true">'+
    /* v10: cada franja tiene dos caras: .fr (la info, el color de la franja) y .bk (el reverso). v13: el reverso es sólo el
       fondo del estudio de WD (#001219); la autoría se pinta encima en dos canvas .au-px (pxCanvases, uno por lado) */
    '<div class="side L">'+[1,2,3,4,5].map(function(n){ return '<div class="st s'+n+'"><div class="fr"><div class="c" id="wL'+n+'"></div></div>'+
      '<div class="bk"></div></div>'; }).join("")+'</div>'+
    '<div class="side R">'+[1,2,3,4,5].map(function(n){ return '<div class="st s'+n+'"><div class="fr"><div class="c" id="wR'+n+'"></div></div>'+
      '<div class="bk"></div></div>'; }).join("")+'</div>'+
  '</div>'+
  /* v7 · oscurece SÓLO el arte mientras el cassette se desarma (va bajo el corredor, z 0 tras las franjas) */
  '<div class="lx-dim" id="lxDim" aria-hidden="true"></div>'+
  '<div class="viewport" aria-hidden="true"><div class="world" id="world"></div></div>'+
  '<div class="vig" aria-hidden="true"></div><div class="scan" aria-hidden="true"></div>'+
  '<div class="band5" aria-hidden="true"></div>'+
  /* v4 · HUD en tres zonas: modelo del TV | APP NN/15 (eje x=960) | app · versión · red.
     Lo de prueba (.dbg, ?dev=1): «SYS.READY · MODE …» y el adaptador del clima (WX OFFLINE/LIVE). */
  '<div class="hud"><span class="mdl" aria-hidden="true">TV <b id="hmodel">—</b></span>'+
    '<span class="dbg" aria-hidden="true">SYS.READY · MODE <b id="hmodeL">'+STR.modeCorridor+'</b></span><div class="ln"></div>'+
    '<span class="app" aria-hidden="true">APP <b id="hcoord">01/'+NN+'</b></span><div class="ln"></div>'+
    '<span class="dbg" aria-hidden="true">WX <b id="hmode">OFFLINE</b></span>'+
    '<span class="brand" id="hbrand" aria-hidden="true"><em id="happ">Launcher</em><i class="sep">·</i><em id="hver">v0.0.0</em>'+
      '<i class="sep">·</i><i class="net" id="hnetDot"></i><b id="hnet">'+STR.net.checking+'</b></span></div>'+
  /* v16.9: fuera el panel «Suggestions · Curated» (<nav class="rail">; decisión del autor).
     El rótulo (#cap) va BAJO el cassette, centrado (p8e.css, «RÓTULO DEL FOCO»). */
  '<div class="cap" id="cap" aria-hidden="true"><span class="no" id="capNo">01</span>'+
    '<span class="nm" id="capNm" data-text="Netflix">Netflix</span><span class="go" id="capGo">'+STR.capOpen+'</span></div>'+
  /* v3: la barra de atajos es de prueba: en el TV el mando no tiene F ni Esc y nadie necesita que le
     expliquen las flechas. Sólo con ?dev=1. */
  '<div class="help dbg"><span><kbd>&larr; &rarr; &uarr; &darr;</kbd>'+STR.help[0]+'</span><span><kbd>Enter</kbd>'+STR.help[1]+'</span>'+
    '<span><kbd>F</kbd>'+STR.help[2]+'</span><span><kbd>Esc</kbd>'+STR.help[3]+'</span></div>'+
  /* v7 · PANTALLA DE PASO al abrir una app: velo del color del cuerpo trasero del cassette (L0, el último
     que atraviesa la cámara: corte por color) + nº, logo, nombre y «Abriendo…». En el TV la tapa la app real. */
  '<div class="lx" id="lx" aria-hidden="true"><div class="lx-veil" id="lxVeil"></div>'+
    '<div class="lx-card" id="lxCard"><span class="no" id="lxNo">01</span><canvas class="lg" id="lxLogo"></canvas>'+
    '<span class="nm" id="lxNm">Netflix</span><span class="bar"></span>'+
    '<span class="msg" id="lxMsg">'+STR.lxBack+'</span></div></div>'+   // v16.10: la pantalla de paso dice SIEMPRE «Rewinding…» (abrir y cerrar)
  /* v3: un salvapantallas no lleva instrucciones encima de la obra (cualquier botón del mando sale). */
  '<div class="artmode-hint dbg" aria-hidden="true">'+STR.saverHint+'</div>'+
  '<div aria-live="polite" id="live" class="sr"></div>');
var world=document.getElementById("world"), viewport=document.querySelector(".viewport");
var hcoord=document.getElementById("hcoord"), live=document.getElementById("live");
var capNo=document.getElementById("capNo"), capNm=document.getElementById("capNm"), capGo=document.getElementById("capGo");

/* v16.9 · (aquí vivían las SUGERENCIAS: SUGG, fitRail y railStep; fuera con el panel) */

/* ===== CORREDOR 3D (P8c; constantes IDÉNTICAS:) =============== */
var ZGAP=700, PERSP_BASE=900, PERSP_WARP=250, LATERAL=232, VMAX=3.14;
var easeFresh=bez(0.45,0,0.15,1), easeRetarget=bez(0.2,0,0.15,1);
var PIX_FLOOR=0.04, PIX_GAIN=1.40, PIX_MAX=0.88, PIX_KN_POW=0.75, PIX_SIDE=0.12, PIX_ATTACK=0.55, PIX_RELEASE=0.22;
var items=[], cards=[], lites=[], stars=[], rich=new Rich();
APPS.forEach(function(app,i){
  var it=document.createElement("button"); it.type="button"; it.className="item"; it.setAttribute("aria-label",app.nm);
  it.tabIndex=-1;                                            // v11: viven en .viewport aria-hidden: el foco no entra; lo anuncia #live
  it.__phase=i*1.9; it.__rot=((i%2)?1:-1)*(6+(i%3)*3); it.__baseZ=-i*ZGAP;
  var card=el("div","card",it); el("div","drop",card);
  var lite=mkCanvas(); lite.className="lite"; card.appendChild(lite);
  it.__pix=el("div","pix",card); it.__pixv=0;
  it.addEventListener("click",(function(di){ return function(){ var d=di-appIndex(); while(d>N/2)d-=N; while(d<-N/2)d+=N; go(idx+d); }; })(i));
  world.appendChild(it); items.push(it); cards.push(card); lites.push(lite);
});
var STARN=REDUCE?0:60, LOOP=N*ZGAP;
var STAR_COL=[PAL.cr,PAL.y,PAL.cr];         // P8e: el fondo es siempre el arte (P8d tenía otra rama)
for(var s=0;s<STARN;s++){
  var st=el("div","star",world), sz=4+(s%3)*3; st.style.width=sz+"px"; st.style.height=sz+"px";
  st.style.background=STAR_COL[s%3]; st.style.borderRadius=(s%2)?"50%":"0"; st.style.opacity=(0.26+(s%3)*0.07).toFixed(2);
  stars.push({el:st,x:(Math.random()-0.5)*2600,y:(Math.random()-0.5)*2000,z:-Math.random()*LOOP});
}

var idx=0, camZ=0, lastKey=-9999, posterT=0, tw=null, corrOn=false;
function appIndex(){ return ((idx%N)+N)%N; }
function project(now){
  var k=0, kn=0, dirX=0, dirY=0, tSec=0;
  if(tw){ var u=Math.min(1,(now-tw.start)/tw.dur), p=tw.ease(u);
    camZ=tw.fromZ+(tw.toZ-tw.fromZ)*p; var du=u-tw.uPrev;
    if(du>1e-4){ var v=((p-tw.pPrev)/du)/VMAX; kn=Math.max(0,Math.min(1,v)); k=tw.A*kn; }
    tw.pPrev=p; tw.uPrev=u; dirX=tw.dirX; dirY=tw.dirY; tSec=(now-tw.start)/1000;
    if(!tw.glitched && u>=0.35){ tw.glitched=true; glitchCap(appIndex()); }
    if(u>=1){ camZ=tw.toZ; tw=null; k=0; kn=0; } }   // v16.7: el último fotograma del vuelo es el REPOSO exacto (world =
                                                      // identidad). Antes quedaba el k del último paso (residuo de la velocidad) y flatOn/cassFlatOn
                                                      // veían «world en movimiento» tras CUALQUIER navegación: sin aplanado ni horneado en reposo
  var active=(tw!==null), knE=active?Math.pow(kn,PIX_KN_POW):0;
  var shakeX=k?(6*k*Math.sin(2*Math.PI*8*tSec)):0;
  var wt="translateX("+shakeX.toFixed(2)+"px) rotateX("+(-dirY*2.5*k).toFixed(3)+"deg) rotateY("+(dirX*3.5*k).toFixed(3)+"deg) "+
    "rotateZ("+(dirX*0.8*k).toFixed(3)+"deg) scale3d(1,1,"+(1+0.18*k).toFixed(3)+")";
  if(WARP_FOLD){ var Pw=+(PERSP_BASE-PERSP_WARP*k).toFixed(0); if(Pw!==PERSP_BASE) wt="scale3d(1,1,"+(PERSP_BASE/Pw).toFixed(6)+") "+wt; }   // v16.11 F7: z·P0/P con perspective fija = la misma proyección
  else viewport.style.perspective=(PERSP_BASE-PERSP_WARP*k).toFixed(0)+"px";
  world.style.transform=wt;
  for(var i=0;i<N;i++){
    var it=items[i], rel=it.__baseZ+camZ; rel=350-((((350-rel)%LOOP)+LOOP)%LOOP);
    var a;
    if(rel<-2800){ it.style.display="none"; continue; } else if(rel<-1400) a=(rel+2800)/1400;
    else if(rel>350){ it.style.display="none"; continue; } else if(rel>0) a=1-(rel/350); else a=1;
    if(a<=0){ it.style.display="none"; continue; }
    it.style.display="block"; it.style.opacity=a.toFixed(3);
    if(CARD_3D&&it.__o1!==(a>=1)){ it.__o1=(a>=1); it.classList.toggle("o1",it.__o1); }   // v16: card sin superficie si opaca (p8e.css)
    var shrink=Math.min(1,Math.abs(rel)/ZGAP), lx=Math.cos(it.__phase)*LATERAL*shrink, ly=Math.sin(it.__phase)*LATERAL*0.5*shrink, rz=it.__rot*shrink;
    it.style.transform="translate3d("+lx.toFixed(1)+"px,"+ly.toFixed(1)+"px,"+rel.toFixed(1)+"px) rotateZ("+rz.toFixed(2)+"deg)";
    var op=0; if(active){ var side=1+PIX_SIDE*clamp(rel/(ZGAP*0.25),-1,1); op=Math.min(PIX_MAX,PIX_MAX*clamp(PIX_FLOOR+PIX_GAIN*shrink,0,1)*knE*side); }
    var pv=active?it.__pixv+(op-it.__pixv)*(op>it.__pixv?PIX_ATTACK:PIX_RELEASE):0; it.__pixv=pv;
    if(pv<0.01){ it.__pix.style.opacity="0"; it.__pix.style.visibility="hidden"; } else { it.__pix.style.visibility="visible"; it.__pix.style.opacity=pv.toFixed(3); }
  }
  if(STARN){ var stretch=1+6*k;
    for(var j=0;j<STARN;j++){ var p2=stars[j], vz=((p2.z+camZ)%LOOP+LOOP)%LOOP; if(vz>350)vz-=LOOP;
      if(vz<-9000||vz>350){ p2.el.style.display="none"; continue; }
      p2.el.style.display="block"; p2.el.style.transform="translate3d("+p2.x+"px,"+p2.y+"px,"+vz.toFixed(0)+"px) scale3d(1,1,"+stretch.toFixed(2)+")"; } }
}
function kick(){ if(corrOn) return; corrOn=true; tAdd(function(now){ project(now); if(tw) return false; corrOn=false; return true; },"corr"); }

/* ---- rótulo: glitch + scramble (patrón canónico) ---- */
var GLYPHS="!<>-_\\/[]{}=+*^?#ABCDEF0123456789";
/* v16.6 · ?scramblehz=N (APAGADA: 0 = como siempre, se reescribe en cada fotograma): reescribe el rótulo como mucho N veces por
   segundo (se propuso 15–20). Cambia el ritmo del barajado: sólo para medir en el banco; decide el autor. */
var SCR_HZ=Math.max(0,Math.min(60,qn("scramblehz",0)));
function scramble(node,text,cfg){
  if(REDUCE){ node.textContent=text; return; }
  var len=text.length, q=[], i; for(i=0;i<len;i++){ var start=Math.floor(i/len*cfg.spread)+Math.floor(Math.random()*(cfg.sjit+1));
    q.push({to:text[i],start:start,end:start+cfg.min+Math.floor(Math.random()*(cfg.ejit+1)),ch:""}); }
  var t0=performance.now(), tok={}; node.__tok=tok;
  var lastB=-1;
  tAdd(function(now){ if(node.__tok!==tok) return true;
    var frame=Math.floor((now-t0)/33.3), out="", done=0;
    if(SCR_HZ){ var bk=Math.floor((now-t0)*SCR_HZ/1000); if(bk===lastB&&frame<99) return false; lastB=bk; }
    for(var i=0;i<q.length;i++){ var c=q[i];
      /* v11 (revisión de seguridad H3): cada carácter pasa por esc(): el nombre llegará del TV (getAppsInfo) en H4 y GLYPHS ya lleva < > */
      if(frame>=c.end){ done++; out+=esc(c.to); }
      else if(frame>=c.start){ if(!c.ch||Math.random()<0.5) c.ch=GLYPHS[Math.floor(Math.random()*GLYPHS.length)]; out+='<span class="sc">'+esc(c.ch)+'</span>'; }
      else out+='<span class="sc" data-hidden>'+esc(c.to)+'</span>'; }
    node.innerHTML=out; if(done===q.length){ node.textContent=text; return true; } return false; },"scr");
}
function setCap(i){ var a=APPS[i]; capNo.textContent=a.num; capNm.textContent=a.nm; capNm.setAttribute("data-text",a.nm);
  capGo.textContent=a.art?STR.capSaver:STR.capOpen; }
var glitchT=0;                                               // v11: guardado; en ráfaga, el del glitch anterior cortaba el siguiente
function glitchCap(i,noScr){ setCap(i); if(REDUCE) return;
  if(NO_REFLOW){ capNm.classList.toggle("gb"); capNm.classList.add("glitching"); }   // v16.11 F4: gA1/gA2 ↔ gA1b/gA2b (idénticas): cambiar el nombre reinicia sin layout
  else { capNm.classList.remove("glitching"); void capNm.offsetWidth; capNm.classList.add("glitching"); }
  clearTimeout(glitchT); glitchT=setTimeout(function(){ glitchT=0; capNm.classList.remove("glitching"); }, 420);
  if(!noScr) scramble(capNm,APPS[i].nm,{spread:5,sjit:1,min:6,ejit:4}); }   // v16.9: noScr = sólo el glitch (la entrada tras la intro: el texto ya es el exacto)

/* ---- asentar: el cassette rico se muda a la card enfocada ---- */
function settle(){ var ai=appIndex();
  for(var i=0;i<N;i++) items[i].classList.toggle("rich",i===ai);
  rich.attach(cards[ai],APPS[ai]);
  settleDone();
  if(LAUNCH.pending){ LAUNCH.pending=false; activate(); } }
/* v16.11 F1/F3 · estado del asentado: 0 libre · 1 pendiente (posterT) · 2 entre sus dos fotogramas · 3 acabado, esperando el hueco */
var SET={st:0,tok:0,safe:0};
function settleNav(){ posterT=0; var ai=appIndex(), app=APPS[ai];
  if(!SETTLE2||REDUCE||rich.card===cards[ai]||rich.app===app){ settle(); return; }
  var tok=++SET.tok, p0=TP.on?performance.now():0; SET.st=2; v11log("settle1",{ai:ai});
  for(var i=0;i<N;i++) if(i!==ai) items[i].classList.remove("rich");
  rich.stage.classList.add("st-hold");                      // la pila rica, oculta: en la card nueva sigue el lite (misma vista frontal)
  rich.prepaint(app);                                       // fotograma 1: paintApp
  if(NO_REFLOW){ cards[ai].appendChild(rich.stage); rich.card=cards[ai]; rich.premoved=true; }   // y la mudanza, oculta: su frontal se calcula en este fotograma
  if(TP.on){ var pm=performance.now()-p0; TP.pre+=pm; TP.preN++; if(pm>TP.preMax) TP.preMax=pm; }
  afterFrame(function(){ if(tok!==SET.tok) return; settle(); },"set"); }   // fotograma 2: se enseña, se inclina y arma
function settleDone(){ var tok=++SET.tok; SET.st=3; clearTimeout(SET.safe); v11log("settle",{ai:appIndex()});
  afterFrame(function(){ if(tok!==SET.tok) return; SET.st=0; if(relevoT===-1) relevoGo(false); },"set");
  if(PREF_RETRY) artPrefSoon(R_DUR+200); }   // v7: Enter pulsado mientras el corredor aún volaba
function go(target,keyDirX,keyDirY){
  flatOff(); cassFlatOff();                                  // v16.1/v16.2: el corredor y el cassette vuelven al DOM 3D antes de moverse
  if(LAUNCH.phase) return;                                   // v7: abriendo una app no se navega (tampoco con el ratón)
  LAUNCH.pending=false;                                      // un Enter en pleno vuelo del corredor se anula si se sigue navegando
  if(target===idx && tw===null && camZ===idx*ZGAP) return;
  var now=performance.now(), jump=Math.abs(target-idx), sign=(target>idx)?1:-1;
  PC.dir=sign; clearTimeout(PC.warmT); clearTimeout(CF.prepT); cfPrepAbort(); clearTimeout(ARTSP.t);   // v16.11: tampoco la precarga especulativa
  SET.tok++; SET.st=1;                                       // v16.11 F1: hay un asentado por delante   // v16.6: nada de pintar/hornear de antemano mientras se navega
  idx=target; idleArm(); bandsLeave(); pypCancel(); ratesCancel(); var ai=appIndex(); bootLast(ai); snd("nav",{app:ai+1,jump:jump,index:ai,dir:sign});   // v11: sin focus() (los botones están en aria-hidden): anuncia #live // v15.2: recuerda la última app enfocada
  hcoord.textContent=APPS[ai].num+"/"+NN; live.textContent=STR.liveFocus(APPS[ai].nm);
  rich.release();
  artNavStep((now-lastKey)<220);                            // arte: avanza en cada cambio de app (v16.2: tras RELEVO_WAIT sin teclas)
  if(REDUCE){ camZ=idx*ZGAP; tw=null; project(now); setCap(ai); settle(); lastKey=now; return; }
  var dirX=keyDirX!=null?keyDirX:sign, dirY=keyDirY!=null?keyDirY:0, running=(tw!==null), rapid=(now-lastKey)<120, dur, ease, Amul=1;
  if(running){ ease=easeRetarget; dur=rapid?420:480; if(rapid)Amul=0.8; } else { ease=easeFresh; dur=Math.min(560+90*(jump-1),800); }
  var A=Math.min(1,0.45+0.275*(jump-1))*Amul;
  tw={fromZ:camZ,toZ:idx*ZGAP,start:now,dur:dur,ease:ease,A:A,dirX:dirX,dirY:dirY,glitched:false,pPrev:0,uPrev:0};
  lastKey=now; kick();
  clearTimeout(posterT); posterT=setTimeout(settleNav,dur+40);   // v16.11 F3: settleNav (= settle con ?settle2=0)
}

/* ===== ARTE WebGL (motor de P8c; UN contexto, a demanda; LRU de texturas) ================= */
/* v8 · datos de la ficha COPIADOS LITERALES de ../assets/art/manifest.jsonl (artist, title, date; id = AIC).
   Nada inventado: la ficha sólo ACORTA con las reglas de fichaTitle()/fichaDate() (README, v8). El título y la
   fecha completos siguen aquí y en el manifest. */
var ART=[
  {f:"../assets/art/01-hokusai-cranes.jpg",id:21720,a:"Katsushika Hokusai",t:"Cranes on snow-covered pine",d:"c. 1834",fx:0.5,fy:0.5},
  {f:"../assets/art/02-hokusai.jpg",id:24645,a:"Katsushika Hokusai",t:"Under the Wave off Kanagawa (Kanagawa oki nami ura), also known as The Great Wave, from the series \"Thirty-Six Views of Mount Fuji (Fugaku sanjūrokkei)\"",d:"1830/33",fx:0.45,fy:0.55},
  {f:"../assets/art/03-mucha.jpg",id:111986,a:"Alphonse Marie Mucha",t:"Zodiaque (\"La Plume\")",d:"1896–97",fx:0.42,fy:0.28},
  {f:"../assets/art/04-renoir.jpg",id:14655,a:"Pierre-Auguste Renoir",t:"Two Sisters (On the Terrace)",d:"1881",fx:0.42,fy:0.4},
  {f:"../assets/art/05-monet.jpg",id:16568,a:"Claude Monet",t:"Water Lilies",d:"1906",fx:0.5,fy:0.5},
  {f:"../assets/art/06-rembrandt.jpg",id:74,a:"Rembrandt van Rijn",t:"Three Oriental Figures (Jacob and Laban?)",d:"1641",fx:0.45,fy:0.5},
  {f:"../assets/art/07-seurat.jpg",id:27992,a:"Georges Seurat",t:"A Sunday on La Grande Jatte — 1884",d:"1884–86, border added 1888–89",fx:0.5,fy:0.5},
  {f:"../assets/art/08-degas.jpg",id:61603,a:"Hilaire Germain Edgar Degas",t:"Ballet at the Paris Opéra",d:"1877",fx:0.5,fy:0.55},
  {f:"../assets/art/09-hiroshige.jpg",id:4371,a:"Utagawa Hiroshige",t:"Hamamatsu, from the series \"Fifty-three Stations of the Tokaido (Tokaido gojusan tsugi),\" also known as the Tokaido with Poem (Kyoka iri Tokaido)",d:"c. 1837/42",fx:0.5,fy:0.5},
  {f:"../assets/art/10-turner.jpg",id:109938,a:"Joseph Mallord William Turner",t:"Valley of Aosta: Snowstorm, Avalanche, and Thunderstorm",d:"1836–37",fx:0.5,fy:0.5},
  {f:"../assets/art/11-turner.jpg",id:4796,a:"Joseph Mallord William Turner",t:"Fishing Boats with Hucksters Bargaining for Fish",d:"1837–38",fx:0.5,fy:0.5},
  {f:"../assets/art/12-caravaggio.jpg",id:19336,a:"Cecco del Caravaggio",t:"The Resurrection",d:"c. 1619-20",fx:0.55,fy:0.12},
  {f:"../assets/art/13-bruegel.jpg",id:15233,a:"Pieter Bruegel, the elder",t:"The Resurrection",d:"c. 1580",fx:0.5,fy:0.5},
  {f:"../assets/art/14-homer.jpg",id:25865,a:"Winslow Homer",t:"The Herring Net",d:"1885",fx:0.5,fy:0.5},
  {f:"../assets/art/15-cezanne.jpg",id:111436,a:"Paul Cezanne",t:"The Basket of Apples",d:"c. 1893",fx:0.5,fy:0.5}
];
/* v8 · REGLAS DE LA FICHA (deterministas; README, v8):
   TÍTULO · 1) se corta antes del PRIMER «, from the series» o «, also known as» (mayúsculas indiferentes);
            2) SÓLO si se cortó en 1), se quita también un paréntesis final (en los grabados japoneses del AIC
               es la transliteración del título: «(Kanagawa oki nami ura)»). Un paréntesis de un título que no
               se cortó se queda: «(Jacob and Laban?)» es parte del título.
   FECHA  · 1) se corta antes de la primera «, » (lo que sigue es una nota: «border added 1888–89»);
            2) un guion entre cifras pasa a raya corta (–), como en las demás fechas del manifest.
   v10 · TÍTULO 3) un « — AAAA» FINAL (raya, raya corta o guion, con espacios) se quita SÓLO si la fecha de la
            ficha ya cubre ese año: «A Sunday on La Grande Jatte — 1884» con «1884–86» → «A Sunday on La Grande
            Jatte». Cubrir = el año está entre el primero y el último de la fecha («1884–86» = 1884…1886; «1830/33» =
            1830…1833). Si no lo cubre, se queda: el año dice algo que la fecha no dice. */
function fichaYears(d){ var m=/(\d{4})(?:\s*[\u2013\-\/]\s*(\d{2,4}))?/.exec(d||""); if(!m) return null;
  var a=+m[1], b=m[2]?(m[2].length<4?+(m[1].slice(0,4-m[2].length)+m[2]):+m[2]):a; return [a,Math.max(a,b)]; }
function fichaTitle(t,d){ var m=/, (from the series|also known as)/i.exec(t);
  if(m) t=t.slice(0,m.index).replace(/\s*\([^()]*\)\s*$/,"").replace(/\s+$/,"");
  var y=/\s+[\u2014\u2013\-]\s+(\d{4})$/.exec(t), r=(y&&d!=null)?fichaYears(fichaDate(d)):null;
  if(y&&r&&+y[1]>=r[0]&&+y[1]<=r[1]) t=t.slice(0,y.index);
  return t; }
function fichaDate(d){ var k=d.indexOf(", "); if(k>=0) d=d.slice(0,k); return d.replace(/(\d)-(\d)/g,"$1\u2013$2"); }
var fichaFace=document.getElementById("fichaFace"), fichaA=document.getElementById("fichaA"), fichaT=document.getElementById("fichaT"), fichaD=document.getElementById("fichaD"), artCanvas=document.getElementById("artCanvas"), artStill=document.getElementById("artStill");
var artIdx=(((+qp("art",0)|0)%ART.length)+ART.length)%ART.length,   /* v11 (H10): ?art=abc daba ART[NaN] */ artTimer=0, ART_MS=45000, artMode=false, artModeTimer=0;
var HID={on:false,n:0,paused:0,resumed:0,cut:0,list:[]};
/* v16.1 · ?bg=fixed (APAGADA por defecto; propuesta de diseño del autor, AÚN NO decidida): fondo
   FIJO estándar = la obra de arranque (?art=N; si no, la 1.ª) quieta, centrada en «cover», sin paneo, sin relevo al cambiar de
   app y sin relevo cada ART_MS. La galería (dispersal + Ken Burns) sólo vive en el salvapantallas de la entrada VHS «Arte»; al
   salir de él se vuelve a la obra fija por corte (la UI está volviendo). No usa el portal ni ningún shader. */
var BG_FIXED=qp("bg","")==="fixed", BG_FIXED_ART=artIdx;
/* v16.6 · palancas de DIAGNÓSTICO del relevo y del glitch (APAGADAS; cambian algo, sólo para el banco):
   ?stillpre=1 — a mitad del dispersal (P ≥ 0,5) el still ya lleva la obra NUEVA, en su encuadre de llegada y a opacidad 1/255
   (≤ 1 nivel de diferencia bajo las partículas), para que el compositor la rasterice ANTES de asentar: si el parón de después de
   asentar (t del perfil) se va, era el rasterizado del still nuevo. ?glitchlo=1 — el glitch del rótulo con steps(4)/(5) (≈ 12
   cambios por segundo) en vez de steps(11). */
var STILL_PRE=qp("stillpre","0")==="1";
document.documentElement.classList.toggle("glitchlo",qp("glitchlo","0")==="1");
/* v16.2 · DECISIÓN del autor (2026-10-25): el relevo de obra al cambiar de app ESPERA a que se deje de navegar:
   RELEVO_WAIT ms tras la última pulsación (cada pulsación reinicia la espera) y entonces UN dispersal hasta la MISMA obra a la
   que habría llegado (la de antes + una por cada cambio de app de la ráfaga). Antes, cada go() arrancaba un relevo (subida de
   textura + dispersal a pantalla completa mientras el corredor volaba: los tirones de la fila «navegar» del banco). La regla
   ráfaga→corte (<220 ms entre pulsaciones = corte en vez de dispersal) sobra con la espera: una ráfaga ya es UN relevo, que
   llega con el corredor quieto; se conserva tal cual con ?relevowait=0 (= v16.1). ?relevowait=<ms> ajusta la espera. */
var RELEVO_WAIT=(function(){ var v=qp("relevowait",""); if(v==="") return 600; v=+v; return isFinite(v)&&v>0?Math.min(5000,v):0; })(),
    relevoT=0, relevoPend=0;
function artNavStep(rapid){ if(!RELEVO_WAIT){ artAdvance(rapid); return; }
  if(HID.on||(BG_FIXED&&!artMode)) return;
  relevoPend++; clearTimeout(relevoT); clearTimeout(artTimer); artTimer=0;
  relevoT=setTimeout(function(){
    if(RELEVO_GAP&&SET.st){ relevoT=-1; v11log("relevoWait",{st:SET.st}); clearTimeout(SET.safe);   // v16.11 F1: lo lanza settleDone un fotograma después
      SET.safe=setTimeout(function(){ if(relevoT===-1) relevoGo(false); },1200); return; }            // red: un asentado que nunca llega (lanzamiento)
    relevoGo(false); },RELEVO_WAIT); }
/* v16.11 · relevoT: id del temporizador · -1 esperando al asentado (F1) · -2 subiendo su textura (F2). relevoFlush corta en los tres */
function relevoGo(noPre){ var n=relevoPend; if(!n||LAUNCH.phase||HID.on||artMode){ relevoT=0; relevoPend=0; return; }
  var dest=(artIdx+n)%ART.length;
  if(PREF_RETRY&&!noPre&&artNeedsUp(dest)){ relevoT=-2; v11log("relevoPre",{dest:dest});
    artUp([artIdx,dest],function(){ afterFrame(function(){ if(relevoT===-2) relevoGo(true); },"gl"); }); return; }
  relevoT=0; relevoPend=0; artTransition(dest,false); artSchedule(); }
/* un relevo esperando cuando llega algo que no puede esperar (abrir una app, el salvapantallas, ocultarse): se llega al MISMO
   destino por corte, como hacía la v16.1 al cortar un dispersal en curso (portalBegin → settleStill) */
function relevoFlush(){ if(!relevoT) return; clearTimeout(relevoT); relevoT=0; var n=relevoPend; relevoPend=0;
  if(n&&!(BG_FIXED&&!artMode)) artCut((artIdx+n)%ART.length); }   // v16: página oculta (ver hidPause, junto a la vuelta de una app)
var WINDS=[
  {speed:0.60,turb:1.00,noiseScale:1.0,dirX: 0.00,dirY: 0.00,gust:0.00},{speed:1.00,turb:0.28,noiseScale:2.0,dirX:-1.00,dirY: 0.05,gust:0.10},
  {speed:1.50,turb:0.08,noiseScale:1.0,dirX:-0.71,dirY:-0.71,gust:0.15},{speed:1.45,turb:0.45,noiseScale:3.2,dirX: 0.00,dirY:-1.00,gust:0.60},
  {speed:1.20,turb:0.40,noiseScale:1.2,dirX: 0.71,dirY: 0.71,gust:0.05},{speed:1.60,turb:0.85,noiseScale:4.2,dirX: 0.35,dirY:-0.15,gust:0.45}];
var DISP={DISP_DUR:1800,SPLIT:0.5,OVERLAP:0.20,ROW_STAGGER:0.25,GRID_STEP:GRID_STEP,POINT_SCALE:1.9,STREAM_DIST:260};
var DPHASE_END=DISP.SPLIT+DISP.OVERLAP/2, APHASE_START=DISP.SPLIT-DISP.OVERLAP/2;
var AW=STAGE_W, AH=STAGE_H, GL=null, texCache={}, texOrder=[], inTransition=false, artStartT=0, artTok=null, panAnim=null, aspCache={};
var VSH=['uniform float uTime, uProgress, uRowFlip, uArm, uRowStagger;','uniform float uSpeed, uTurb, uNoiseScale, uGust, uDist, uPixel;','uniform vec2 uDir;',
 'varying vec2 vUv; varying float vAlpha;','vec2 windField(vec2 n, float t){','  float k = uNoiseScale * 6.2831853;',
 '  float tx = sin(n.y*k + t*0.8 + sin(n.x*k*0.7 + t*0.5)*1.2);','  float ty = cos(n.x*k + t*0.7 + cos(n.y*k*0.8 - t*0.4)*1.2);',
 '  float gm = 1.0 + uGust*0.5*(sin(t*2.3 + n.x*4.0) + sin(t*3.7 - n.y*3.0));','  float dr = 1.0 - uTurb;',
 '  return vec2((uDir.x*dr + tx*uTurb)*gm, (uDir.y*dr + ty*uTurb)*gm);','}','void main(){','  vUv = uv;','  vec3 targetPos = position;',
 '  vec2 n = vec2(uv.x, 1.0 - uv.y);','  float row = 1.0 - uv.y;','  vec2 v = windField(n, uTime*0.6);','  vec2 drift = vec2(v.x, -v.y) * uDist * uSpeed;',
 '  vec3 floatPos = targetPos + vec3(drift, 0.0);','  float delayRow = mix(row, 1.0 - row, uRowFlip);','  float inv = 1.0 / (1.0 - uRowStagger);',
 '  float tt = clamp((uProgress - delayRow*uRowStagger) * inv, 0.0, 1.0);','  float t2 = tt*tt, t4 = t2*t2, q = 1.0 - tt, q2 = q*q;',
 '  float e = (uArm > 0.5) ? (1.0 - q2*q2*q2) : (t2*(0.6 + 0.4*t4*t2));','  float homeFrac = mix(1.0 - e, e, uArm);','  vAlpha = mix(1.0 - e, e, uArm);',
 '  vec3 pos = mix(floatPos, targetPos, homeFrac);','  vec4 mv = modelViewMatrix * vec4(pos, 1.0);','  gl_Position = projectionMatrix * mv;','  gl_PointSize = uPixel;',
 /* v16: una partícula de alfa < 0.004 la descarta ENTERA el fragment shader (vAlpha es constante en todo el
    punto: GL_POINTS no interpola); sacándola del volumen de recorte aquí no llega a rasterizarse: los mismos píxeles, menos
    fragmentos (un punto mide uPixel² ≈ 230 px a 1920×1080). ?ptcull=0 = como la v15.2 */
 PT_CULL?'  if (vAlpha < 0.004) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);':'','}'].join('\n');
var FSH=['uniform sampler2D uTexture; uniform vec4 uMap;','varying vec2 vUv; varying float vAlpha;','void main(){',
 '  if(vAlpha < 0.004) discard;','  vec2 cxy = 2.0*gl_PointCoord - 1.0;','  float r = dot(cxy, cxy); if(r > 1.0) discard;',
 /* P8e: uv de pantalla → uv de textura con el encuadre EXACTO del still (escala + paneo) */
 '  vec2 cuv = vec2(vUv.x*uMap.x + uMap.y, vUv.y*uMap.z + uMap.w);','  vec4 col = texture2D(uTexture, cuv);','  float a = smoothstep(1.0, 0.35, r) * vAlpha * col.a;',
 '  gl_FragColor = vec4(col.rgb, a);','}'].join('\n');
/* v12 · WebGL1 propio (gl.js) en lugar de three.js r128. Lo que three anteponía a estos shaders (atributos y matrices de
   la cámara ortográfica) va escrito aquí; las matrices son las MISMAS que calculaba three (P8EGL.ortho / viewZ). */
var VSH_HEAD='attribute vec3 position;\nattribute vec2 uv;\nuniform mat4 modelViewMatrix;\nuniform mat4 projectionMatrix;\n';
function mkUniforms(arm,flip){ return {uTime:0,uProgress:0,uRowFlip:flip,uArm:arm,uRowStagger:DISP.ROW_STAGGER,
  uDir:[0,0],uSpeed:1,uTurb:0.3,uNoiseScale:1,uGust:0,uDist:DISP.STREAM_DIST,
  uPixel:DISP.GRID_STEP*DISP.POINT_SCALE*GL_SCALE,uTexture:null,uMap:[1,0,1,0],modelViewMatrix:null,projectionMatrix:null}; }
function initGL(){ if(GL||!window.P8EGL) return;
  var ctx=P8EGL.create(artCanvas); if(!ctx) return;                    // sin WebGL1: GL sigue null → corte entre obras, sin portal
  GLX.contexts++;                                                     // v9: contador real (debe ser 1 en toda la sesión)
  GL={ctx:ctx,prog:null,progFail:false,pos:null,uv:null,count:0,proj:null,mv:P8EGL.viewZ(10),uOut:mkUniforms(0.0,0.0),uIn:mkUniforms(1.0,1.0),
    showOut:true,showIn:true,portal:null};
  ctx.onLost=glLost; ctx.onRestore=glRestore; glResize(); }
function glProgram(){ if(!GL||GL.ctx.lost) return null; if(!GL.prog&&!GL.progFail){ GL.prog=GL.ctx.program("dispersal",VSH_HEAD+VSH,FSH); GL.progFail=!GL.prog; }
  return GL.prog; }
function buildGeo(){ var step=DISP.GRID_STEP, cols=Math.max(2,Math.ceil(AW/step)), rows=Math.max(2,Math.ceil(AH/step)), n=cols*rows,
    pos=new Float32Array(n*3), uv=new Float32Array(n*2), k=0;
  for(var r=0;r<rows;r++) for(var c=0;c<cols;c++){ var sx=c*step+step/2, sy=r*step+step/2;
    pos[k*3]=sx-AW/2; pos[k*3+1]=AH/2-sy; pos[k*3+2]=0; uv[k*2]=sx/AW; uv[k*2+1]=1-sy/AH; k++; }
  return {pos:pos,uv:uv,count:n}; }
function glSizeArt(){ GL.ctx.size(Math.round(AW*GL_SCALE),Math.round(AH*GL_SCALE)); }
function glResize(){ AW=STAGE_W; AH=STAGE_H; if(!GL) return;              // v3: el lienzo, no la ventana
  glSizeArt(); GL.proj=P8EGL.ortho(-AW/2,AW/2,AH/2,-AH/2,-1000,1000);
  GL.ctx.delBuffer(GL.pos); GL.ctx.delBuffer(GL.uv);
  var g=buildGeo(); GL.pos=GL.ctx.buffer(g.pos); GL.uv=GL.ctx.buffer(g.uv); GL.count=g.count; }
/* = renderer.render(scene,camera) de la v11: borra (autoClear) y dibuja la nube que sale y luego la que llega (el orden
   de three para dos objetos transparentes a la misma z: por id, el de salida primero) */
function glRender(){ var c=GL.ctx, gl=c.gl, p=GL.prog, at={position:[GL.pos,3],uv:[GL.uv,2]};
  c.clear(); if(!p) return; c.blendNormal();
  GL.uOut.modelViewMatrix=GL.uIn.modelViewMatrix=GL.mv; GL.uOut.projectionMatrix=GL.uIn.projectionMatrix=GL.proj;
  if(GL.showOut) c.draw(p,at,GL.uOut,gl.POINTS,GL.count);
  if(GL.showIn) c.draw(p,at,GL.uIn,gl.POINTS,GL.count); }
/* contexto perdido (el TV puede quitárselo a una página en segundo plano): las texturas, los programas y los buffers ya no
   existen. El relevo en curso acaba por corte; al restaurarse se rehace todo a demanda. */
function glLost(){ texCache={}; texOrder=[]; if(!GL) return; GL.prog=null; GL.progFail=false; GL.pos=GL.uv=null;
  if(GL.portal){ GL.portal.prog=null; GL.portal.fail=false; GL.portal.quad=null; GL.portal.compiled=false; GL.portal.sized=false; }
  if(inTransition){ artStop(); settleStill(artIdx); artCanvas.style.opacity="0"; if(artMode) saverNext(); } }   // revisión de seguridad W1: el salvapantallas sigue
function glRestore(){ if(!GL) return; glResize(); setTimeout(fxPrewarm,600); }   // revisión de seguridad N5: el portal se recompila en frío
function applyWind(u,w){ u.uDir=[w.dirX,w.dirY]; u.uSpeed=w.speed; u.uTurb=w.turb; u.uNoiseScale=w.noiseScale; u.uGust=w.gust; }
/* LRU: como mucho TEX_CACHE texturas en GPU (P8c las guardaba las 15: ~52 MB de textura). La que sale se BORRA
   (deleteTexture; GL.ctx.stats lo cuenta). */
function getTex(i,cb){
  initGL(); if(!GL||GL.ctx.lost){ cb(null); return; }                // sin WebGL1 no hay textura: corte
  if(texCache[i]){ texOrder.splice(texOrder.indexOf(i),1); texOrder.push(i); cb(texCache[i]); return; }
  if(ART_ONE){ artImg(i,function(im){ if(!im){ cb(null); return; } texFrom(i,im,cb); }); return; }   // v16: el mismo <img> del still
  var im=new Image(), done=false;
  im.onload=function(){ if(done) return; done=true; texFrom(i,im,cb); };
  im.onerror=function(){ if(done) return; done=true; cb(null); };
  im.src=ART[i].f;
}
/* v16: sube la obra i desde una imagen YA cargada (la comparten la v15.2 y el <img> único) */
function texFrom(i,im,cb){
    if(texCache[i]){ texOrder.splice(texOrder.indexOf(i),1); texOrder.push(i); cb(texCache[i]); return; }   // la pidió otro relevo a la vez
    if(!GL||GL.ctx.lost){ cb(null); return; }
    /* primero se borra la más antigua y DESPUÉS se sube la nueva: nunca hay más de TEX_CACHE en GPU (three subía a demanda,
       en el primer render, y tampoco pasaba de 3). La más antigua nunca es la del relevo en curso (se tocó al pedirla). */
    while(texOrder.length>=TEX_CACHE){ var oi=PREF_RETRY?texEvictAt():0, old=texOrder.splice(oi,1)[0]; if(texCache[old]){ GL.ctx.delTexture(texCache[old].tex); delete texCache[old]; } }
    var tx=GL.ctx.texture(im,/\.jpe?g($|\?)/i.test(ART[i].f),TEX_CS,TEX_MAX);   // v16.11 F6: TEX_MAX (0 = sin tope propio)   // = TextureLoader: RGB para JPEG. v16: TEX_CS (gl.js)
    if(!tx){ cb(null); return; }
    /* v16: naturalWidth (el <img> único puede estar en el DOM: .width sería el de su caja, no el del fichero) */
    var iw=im.naturalWidth||im.width, ih=im.naturalHeight||im.height, asp=(iw&&ih)?(iw/ih):1.0;
    texCache[i]={tex:tx,aspect:asp,w:tx.w,h:tx.h}; texOrder.push(i); aspCache[i]=asp; ART_STATS.uploads++;
    cb(texCache[i]);
}
/* v16 · UNA imagen por obra. En la v15.2 cada obra se pedía por tres caminos: el background-image del still,
   un Image() para el aspecto (getAspect) y otro para la textura (getTex). El servidor de la LAN responde no-store y M47 no
   reutiliza un recurso no-store entre peticiones distintas: 2 GET por obra en el log del TV (y dos decodificaciones). Ahora
   hay UN <img> por obra, cargado una vez y guardado (los 15 JPEG suman ~3,6 MB codificados): el still lo muestra (es su hijo),
   la textura sube desde él y el aspecto sale de él. artImgEl(i) lo crea y empieza a cargarlo; artImg(i,cb) espera a que
   cargue (null si falla). ART_STATS.imgReq cuenta cuántas veces se asigna src (debe ser ≤ 1 por obra en toda la sesión). */
var artImgs={};
function artImgEl(i){ var r=artImgs[i];
  if(!r){ var im=new Image(); r=artImgs[i]={im:im,st:0,cbs:[]};     // st: 0 cargando · 1 lista · -1 error
    im.className="art-img"; im.alt=""; im.setAttribute("aria-hidden","true");
    im.onload=function(){ r.st=(im.naturalWidth&&im.naturalHeight)?1:-1; var c=r.cbs; r.cbs=[]; c.forEach(function(f){ f(r.st===1?im:null); }); };
    im.onerror=function(){ r.st=-1; var c=r.cbs; r.cbs=[]; c.forEach(function(f){ f(null); }); };
    ART_STATS.imgReq++; im.src=ART[i].f; }
  return r.im; }
function artImg(i,cb){ artImgEl(i); var r=artImgs[i]; if(r.st===1) cb(r.im); else if(r.st===-1) cb(null); else r.cbs.push(cb); }
/* v16 · la textura de la obra SIGUIENTE (y la de la actual) se sube en un rato quieto tras asentarse la obra, no al empezar el
   relevo: en M47 la subida de un JPEG de 843 px es un bloqueo del hilo principal que se sumaba al primer fotograma del
   dispersal. Con TEX_CACHE = 3 caben la saliente, la entrante y la siguiente: el LRU no tira ninguna que haga falta. */
var ART_PRE_MS=1500, artPreT=0;
function artPrefetch(){ clearTimeout(artPreT); if(!ART_PRE||REDUCE||BG_FIXED||!window.P8EGL) return; var tries=0;
  artPreT=setTimeout(function again(){ if(inTransition||LAUNCH.phase||(GL&&GL.ctx.lost)){
      if(PREF_RETRY&&!(GL&&GL.ctx.lost)&&++tries<=20) artPreT=setTimeout(again,400);   // v16.11 F2: reintenta en vez de rendirse
      return; }
    var a=artIdx, n=(artIdx+1)%ART.length;
    getTex(a,function(){ if(inTransition||artIdx!==a) return; getTex(n,function(){ artWarm(); }); }); },ART_PRE_MS); }
/* v16.11 F2 · PRECARGA QUE NO SE RINDE. artOut = la obra saliente del dispersal en curso: mientras se dibuje (GL.showOut) no se
   tira, igual que la entrante (artIdx); el LRU tira la más antigua de las demás. Con TEX_CACHE = 3 siempre queda una libre. */
var artOut=-1, ARTSP={t:0,n:0};
function texPinned(k){ k=+k; return k===artIdx||(inTransition&&GL&&GL.showOut&&k===artOut); }
function texEvictAt(){ for(var j=0;j<texOrder.length;j++) if(!texPinned(texOrder[j])) return j; return 0; }
function artNeedsUp(i){ return !!window.P8EGL&&!REDUCE&&!(GL&&GL.ctx.lost)&&(!texCache[i]||!texCache[artIdx]); }
/* sube las que falten de la lista, UNA por fotograma (cada subida en su propio fotograma), y luego cb */
function artUp(list,cb){ var j=0; (function step(){ while(j<list.length&&texCache[list[j]]) j++;
  if(j>=list.length){ cb(); return; } var k=list[j++]; getTex(k,function(){ if(j<list.length) afterFrame(step,"gl"); else cb(); }); })(); }
/* precarga especulativa en un hueco quieto (tras el armado): la obra del siguiente relevo. Reintenta si hay vuelo o relevo por arrancar */
function artPrefSoon(ms){ clearTimeout(ARTSP.t); if(!ART_PRE||REDUCE||BG_FIXED||!window.P8EGL||artMode) return; ARTSP.n=0;
  ARTSP.t=setTimeout(function again(){ ARTSP.t=0;
    if(LAUNCH.phase||HID.on||artMode||(GL&&GL.ctx.lost)) return;
    if(tw||SET.st||relevoT||(BOOT&&BOOT.on)||(FX&&FX.portalOn)){ if(++ARTSP.n<=15) ARTSP.t=setTimeout(again,200); return; }   // hay vuelo, asentado o relevo a punto: luego
    var L=[], d1=(artIdx+relevoPend+1)%ART.length; if(relevoPend) L.push((artIdx+relevoPend)%ART.length); L.push(d1);
    L=L.filter(function(k){ return !texCache[k]; }); if(!L.length) return; v11log("pref",{list:L.join(",")});
    artUp(L.slice(0,1),function(){}); },ms); }
var STILLT={tok:0,pend:false,prev:""};
function stillTRestore(){ STILLT.tok++; if(!STILLT.pend) return; STILLT.pend=false; artStill.style.transition=STILLT.prev; }
/* v16.2 · PRECALENTAR el relevo (el banco del TV midió un fotograma de 333 ms al arrancar un relevo). Lo que la
   v16.1 aún hacía DENTRO del primer fotograma del dispersal y aquí se hace en un rato quieto, con el canvas a opacidad 0
   (cc ni lo dibuja): (1) portalRestore() — si el portal (intro o despiece) dejó el canvas a 1/PORTAL_RES, devolverlo a
   1920×1080 realoja el framebuffer; (2) glProgram() — el programa del dispersal se compilaba en el primer relevo (el del
   portal ya se precompilaba en fxPrewarm, éste no); (3) un dibujo de UN punto con ese programa y la textura de la obra
   actual (alfa 0: el vertex shader lo saca del recorte), para que el driver termine de preparar programa y textura; luego
   se borra. ?artwarm=0 = como la v16.1. */
var ART_WARM=qp("artwarm","1")!=="0";
function artWarm(){ if(!ART_WARM||!GL||GL.ctx.lost) return;
  if(inTransition||LAUNCH.phase||(BOOT&&BOOT.on)||(FX&&FX.portalOn)){ clearTimeout(artWarm.t); artWarm.t=setTimeout(artWarm,800); return; }   // la intro o el portal usan el canvas: luego
  try{ portalRestore(); var p=glProgram(), cur=texCache[artIdx]; if(!p||!cur) return;
    var c=GL.ctx, u=GL.uOut; u.uTexture=cur.tex; u.uProgress=1; u.uTime=0; u.modelViewMatrix=GL.mv; u.projectionMatrix=GL.proj;
    c.clear(); c.blendNormal(); c.draw(p,{position:[GL.pos,3],uv:[GL.uv,2]},u,c.gl.POINTS,1); c.clear(); ART_STATS.warm++; }catch(e){} }
var PAN_LOOP_MS=60000, PAN_EASE=["cubic-bezier(0.35,0.5,0.55,1)","cubic-bezier(0.37,0,0.63,1)","cubic-bezier(0.45,0,0.65,0.5)"], PAN_MIN_OV=2;
function getAspect(i,cb){ if(aspCache[i]!=null){ cb(aspCache[i]); return; }
  if(ART_ONE){ artImg(i,function(im){ aspCache[i]=im?im.naturalWidth/im.naturalHeight:AW/AH; cb(aspCache[i]); }); return; }   // v16
  var im=new Image(); im.onload=function(){ aspCache[i]=(im.naturalWidth&&im.naturalHeight)?im.naturalWidth/im.naturalHeight:(AW/AH); cb(aspCache[i]); };
  im.onerror=function(){ aspCache[i]=AW/AH; cb(aspCache[i]); }; im.src=ART[i].f; }
function stopPan(){ if(panAnim){ try{panAnim.cancel();}catch(e){} panAnim=null; } }
/* congela el still donde esté (paneo o Ken Burns) en vez de saltar al cancelar la animación */
function freezePan(){ if(!panAnim) return; var t=getComputedStyle(artStill).transform; stopPan(); artStill.style.transform=(t&&t!=="none")?t:"none"; }
function resetStill(){ var s=artStill.style; s.left="0"; s.top="0"; s.right="0"; s.bottom="0"; s.width=""; s.height=""; s.transform="none"; }

/* ---- ENCUADRE (P8e): estado del still = caja del tamaño «cover» de la obra (w×h, origen 0 0)
   con escala s y traslación (tx,ty). mapOf() lo convierte al uMap del shader, así las partículas
   salen EXACTAMENTE del encuadre que se veía y llegan al que se va a ver (sin salto). ---- */
function coverWH(ia){ var sa=AW/AH; return (ia>sa)?{w:Math.ceil(AH*ia),h:AH}:{w:AW,h:Math.ceil(AW/ia)}; }
function centerState(ia){ var c=coverWH(ia); return {w:c.w,h:c.h,s:1,tx:(AW-c.w)/2,ty:(AH-c.h)/2}; }
function mapOf(st){ var W=st.s*st.w, H=st.s*st.h; return [AW/W,-st.tx/W,AH/H,1-(AH-st.ty)/H]; }
function stillState(ia){
  var bw=artStill.offsetWidth||AW, bh=artStill.offsetHeight||AH, ba=bw/bh, iw, ih;
  if(ia>ba){ ih=bh; iw=bh*ia; } else { iw=bw; ih=bw/ia; }               // background-size:cover en la caja
  var ox=(bw-iw)/2, oy=(bh-ih)/2, t=getComputedStyle(artStill).transform, a=1, d=1, e=0, f=0;
  var m=/matrix\(([^)]+)\)/.exec(t||""); if(m){ var v=m[1].split(",").map(parseFloat); a=v[0]; d=v[3]; e=v[4]; f=v[5]; }
  return {w:iw,h:ih,s:a,tx:e+a*ox,ty:f+d*oy}; }
function applyState(st){ var s=artStill.style; s.left="0"; s.top="0"; s.right="auto"; s.bottom="auto";
  s.width=Math.ceil(st.w)+"px"; s.height=Math.ceil(st.h)+"px"; s.transform=stTf(st); }
function stTf(st){ return "translate("+st.tx.toFixed(1)+"px,"+st.ty.toFixed(1)+"px) scale("+st.s.toFixed(4)+")"; }
/* v16.10 · PANEO del salvapantallas: recorre TODA la obra (foco → extremo → extremo → foco, 4 claves,
   easing lineal, 60 % del dwell en el cruce) en vez de un zoom al azar. Cada estado cubre el lienzo
   (clamp al rango sin borde), así que cualquier combinación lineal también cubre: nunca se ve el fondo. */
var kbPlan=null;
function kbMake(i,ia){
  /* v16.10: el modo arte RECORRE toda la obra (no se queda en el foco): arranca en el rostro (foco),
     va a un extremo, al otro y vuelve. Así se ve entera antes de cambiar. */
  var sa=AW/AH, w,h,ov,axis;
  if(ia>sa){ h=AH; w=Math.ceil(AH*ia); ov=w-AW; axis="X"; } else { w=AW; h=Math.ceil(AW/ia); ov=h-AH; axis="Y"; }
  var A=ART[i]||{}, fd=(axis==="X"?(A.fx!=null?A.fx:0.5):(A.fy!=null?A.fy:0.5));
  var fOff=Math.max(-ov,Math.min(0,(axis==="X"?AW/2:AH/2)-fd*(axis==="X"?w:h)));
  function st(off){ return {w:w,h:h,s:1,tx:(axis==="X"?off:0),ty:(axis==="Y"?off:0)}; }
  return {i:i, keys:[st(fOff), st(0), st(-ov), st(fOff)]}; }
function startKB(i){ stopPan();
  if(REDUCE||!artStill.animate){ resetStill(); return; }
  var go2=function(ia){ if(i!==artIdx) return;
    var p=(kbPlan&&kbPlan.i===i)?kbPlan:kbMake(i,ia); kbPlan=null; var K=p.keys; applyState(K[0]);
    panAnim=artStill.animate([{transform:stTf(K[0]),offset:0},{transform:stTf(K[1]),offset:0.2},{transform:stTf(K[2]),offset:0.8},{transform:stTf(K[3]),offset:1}],
      {duration:SAVER_DWELL,easing:"linear",fill:"forwards"}); };   // v16.10: recorrido calmado (60% del tiempo va de un extremo al otro)
  getAspect(i,go2); }
function startPan(i){ stopPan();
  if(BG_FIXED&&!artMode){ resetStill(); return; }                    // v16.1 · ?bg=fixed: quieta, centrada
  if(REDUCE||!artStill.animate){ resetStill(); return; }
  getAspect(i,function(ia){ if(i!==artIdx) return;
    var sa=AW/AH, w, h, ov, axis;
    if(ia>sa){ h=AH; w=Math.ceil(AH*ia); ov=w-AW; axis="X"; } else { w=AW; h=Math.ceil(AW/ia); ov=h-AH; axis="Y"; }
    var s=artStill.style; s.left="0"; s.top="0"; s.right="auto"; s.bottom="auto"; s.width=w+"px"; s.height=h+"px";
    if(ov<PAN_MIN_OV){ s.transform="none"; return; }
    var c="translate"+axis, full=ov.toFixed(1);
    var A=ART[i]||{}, fd=(axis==="X"?(A.fx!=null?A.fx:0.5):(A.fy!=null?A.fy:0.5));
    var off=Math.max(-ov,Math.min(0,(axis==="X"?AW/2:AH/2)-fd*(axis==="X"?w:h))), o=off.toFixed(1);
    s.transform=c+"("+o+"px)";                                                             // v16.10: arranca en el foco (rostro)
    panAnim=artStill.animate([{transform:c+"("+o+"px)",easing:PAN_EASE[0],offset:0},{transform:c+"(0px)",easing:PAN_EASE[1],offset:0.25},
      {transform:c+"(-"+full+"px)",easing:PAN_EASE[2],offset:0.75},{transform:c+"("+o+"px)",offset:1}],{duration:PAN_LOOP_MS,iterations:Infinity,fill:"none"}); }); }
function stillPrep(i){ var ia=aspCache[i]; if(ia==null||BG_FIXED) return false;
  if(ART_ONE){ var im=artImgEl(i); if(artStill.firstChild!==im){ while(artStill.firstChild) artStill.removeChild(artStill.firstChild); artStill.appendChild(im); }
    artStill.setAttribute("data-art","url(\""+ART[i].f+"\")"); }
  else { artStill.style.backgroundImage="url('"+ART[i].f+"')"; artStill.setAttribute("data-art",artStill.style.backgroundImage); }
  var sa=AW/AH, w, h, ov, axis, s=artStill.style;                     // = el encuadre inicial de startPan (v16.10: en el foco)
  if(ia>sa){ h=AH; w=Math.ceil(AH*ia); ov=w-AW; axis="X"; } else { w=AW; h=Math.ceil(AW/ia); ov=h-AH; axis="Y"; }
  s.left="0"; s.top="0"; s.right="auto"; s.bottom="auto"; s.width=w+"px"; s.height=h+"px";
  var Af=ART[i]||{}, fdv=(axis==="X"?(Af.fx!=null?Af.fx:0.5):(Af.fy!=null?Af.fy:0.5));
  var offv=Math.max(-ov,Math.min(0,(axis==="X"?AW/2:AH/2)-fdv*(axis==="X"?w:h)));
  s.transform=(ov<PAN_MIN_OV)?"none":("translate"+axis+"("+offv.toFixed(1)+"px)");
  s.transition="none"; s.opacity="0.004"; return true; }
function settleStill(i){
  /* v16: el still muestra el <img> único de la obra (hijo de #artStill; object-fit:cover = background-size:cover); data-art
     dice cuál es (lo que antes se leía del background-image) */
  if(ART_ONE){ var im=artImgEl(i); if(artStill.firstChild!==im){ while(artStill.firstChild) artStill.removeChild(artStill.firstChild); artStill.appendChild(im); }
    artStill.setAttribute("data-art","url(\""+ART[i].f+"\")"); }
  else { artStill.style.backgroundImage="url('"+ART[i].f+"')"; artStill.setAttribute("data-art",artStill.style.backgroundImage); }
  var prevT=artStill.style.transition; artStill.style.transition="none"; artStill.style.opacity="1";
  if(NO_REFLOW){ var stk=++STILLT.tok; STILLT.pend=true; STILLT.prev=prevT; afterFrame(function(){ if(stk===STILLT.tok) stillTRestore(); },"gl"); }   // v16.11 F4: sin layout forzado
  else { void artStill.offsetWidth; artStill.style.transition=prevT; }
  if(artMode) startKB(i); else if(IDLE_ART||!IDLE.resting) startPan(i); else { stopPan(); resetStill(); }
  if(!artMode) artPrefetch(); }
/* revisión de seguridad W2: artReq numera cada petición de relevo. Una cadena de carga que llega tarde (la adelantó un corte,
   otro relevo o un lanzamiento) no arranca nada; y las dos texturas se validan contra la generación del contexto actual. */
var artReq=0;
function artStop(){ artTok=null; inTransition=false; }
function saverNext(){ clearTimeout(artModeTimer); if(artMode) artModeTimer=setTimeout(artAdvanceMode,SAVER_DWELL); }
function artCut(i){ artReq++; artStop(); artIdx=i; settleStill(i); setFicha(i,FICHA_OUT);
  if(GL){ artCanvas.style.opacity="0"; GL.ctx.clear(); }
  if(artMode) saverNext(); }
function artTransition(i,rapid){
  if(REDUCE||rapid||!window.P8EGL){ artCut(i); return; }              // v12: sin gl.js (o, abajo, sin WebGL1), corte entre obras
  var prev=artIdx; v11log("relevo",{to:i,cur:!!texCache[prev],nx:!!texCache[i]});
  var req=++artReq, PF={req:performance.now()};                      // v16.2: PERFIL del relevo (ART_STATS.prof; el banco lo enseña)
  getTex(prev,function(cur){ if(req!==artReq) return; PF.tex1=performance.now(); getTex(i,function(nx){ if(req!==artReq) return; PF.tex2=performance.now();
    if(!cur||!nx){ artCut(i); return; }
    initGL(); var q0=performance.now(); if(!GL||!glProgram()){ artCut(i); return; } PF.prog=performance.now()-q0;
    if(!cur.tex.t||cur.tex.gen!==GL.ctx.gen||!nx.tex.t||nx.tex.gen!==GL.ctx.gen){ artCut(i); return; }   // de un contexto perdido: corte
    q0=performance.now(); portalRestore(); PF.restore=performance.now()-q0;   // v9: si el portal dejó el canvas a 1/PORTAL_RES, vuelve a 1920×1080
    var wind=WINDS[(Math.random()*WINDS.length)|0]; applyWind(GL.uOut,wind); applyWind(GL.uIn,wind);
    /* sale del encuadre ACTUAL del still; llega al encuadre con el que va a asentarse */
    q0=performance.now(); var mo=mapOf(stillState(cur.aspect)), st2; PF.still=performance.now()-q0;
    if(artMode&&!REDUCE){ kbPlan=kbMake(i,nx.aspect); st2=kbPlan.keys[0]; } else st2=centerState(nx.aspect);
    var mi=mapOf(st2);
    GL.uOut.uTexture=cur.tex; GL.uOut.uMap=[mo[0],mo[1],mo[2],mo[3]];
    GL.uIn.uTexture=nx.tex; GL.uIn.uMap=[mi[0],mi[1],mi[2],mi[3]];
    artOut=prev; artIdx=i; setFicha(i,Math.round(APHASE_START*DISP.DISP_DUR));   // v8: la ficha se va con la obra y vuelve cuando llega la nueva
    if(STILLT.pend){ void artStill.offsetWidth; stillTRestore(); }   // v16.11 F4: caso raro (asentó en este mismo fotograma): como v16.10
    artStill.style.opacity="0"; stopPan(); artCanvas.style.opacity="1"; inTransition=true;
    var tok={}; artTok=tok; artStartT=performance.now(); PF.wait=artStartT-PF.req; PF.gap=0; PF.gapP=0; PF.last=0; PF.r1=-1; ART_STATS.prof=PF;
    tAdd(function(now){ if(artTok!==tok) return true;
      if(PF.last&&now-PF.last>PF.gap){ PF.gap=now-PF.last; PF.gapP=Math.min(1,(now-artStartT)/DISP.DISP_DUR); } PF.last=now;
      var r0=PF.r1<0?performance.now():0;
      var P=Math.min(1,Math.max(0,(now-artStartT)/DISP.DISP_DUR)), dP=Math.min(1,P/DPHASE_END), aP=Math.max(0,(P-APHASE_START)/(1-APHASE_START)), t=(now-artStartT)/1000;
      GL.uOut.uTime=t; GL.uIn.uTime=t; GL.uOut.uProgress=dP; GL.uIn.uProgress=aP;
      GL.showOut=(dP<1.0); GL.showIn=(aP>0.0);
      try{ glRender(); }catch(e){ artCut(artIdx); return true; }      // revisión de seguridad N6: si dibujar fallara, corte (nunca un relevo colgado)
      if(r0) PF.r1=performance.now()-r0;
      if(STILL_PRE&&!artMode&&!PF.pre&&P>=0.5&&stillPrep(artIdx)) PF.pre=P;
      if(P<1) return false;
      var s0=performance.now(); artTok=null; inTransition=false; settleStill(artIdx); PF.settle=performance.now()-s0;
      artCanvas.style.opacity="0"; ART_STATS.transitions++;
      var n0=performance.now(); tAdd(function(){ PF.after=performance.now()-n0; return true; },"gl");   // v16.2: el fotograma tras asentar (still nuevo)
      if(artMode) saverNext();
      setTimeout(function(){ if(!inTransition&&GL) GL.ctx.clear(); },220);
      return true; },"gl");
  }); });
}
/* v8 · FICHA: una sola cara. Cambio = fundido FUERA (FICHA_OUT, lineal) → texto nuevo → fundido DENTRO (FICHA_IN).
   Nunca dos textos a la vez (no es un fundido cruzado). En el dispersal el texto cambia cuando empieza a llegar la
   obra nueva (APHASE_START·DISP_DUR = 720 ms); en un corte, al acabar la salida. Reduced-motion o 1.ª vez: corte.
   Sólo opacity por transición CSS (compositor); los relojes son setTimeout, no rAF. = p8e.css (.ficha .fc). */
var FICHA_OUT=240, FICHA_IN=320, FICHA={i:-1,tok:0,t:0,ft:0,go:null,faded:false,swaps:0,cuts:0};
function fichaPaint(i){ fichaA.textContent=ART[i].a; fichaT.textContent=fichaTitle(ART[i].t,ART[i].d); fichaD.textContent=", "+fichaDate(ART[i].d); FICHA.i=i; }
function setFicha(i,swapAt){ clearTimeout(FICHA.t); clearTimeout(FICHA.ft); var tok=++FICHA.tok;
  if(REDUCE||FICHA.i<0){ fichaFace.classList.remove("fx"); FICHA.faded=false; fichaPaint(i); FICHA.cuts++; return; }
  if(i===FICHA.i&&!fichaFace.classList.contains("fx")) return;
  /* el texto sólo se reescribe con la cara YA a 0 (transitionend, o el respaldo FICHA_OUT+200 ms) Y pasado swapAt:
     un setTimeout solo cambiaba el texto aún a 0,17 de opacidad si el fundido arrancaba tarde (medido en headless) */
  if(!fichaFace.classList.contains("fx")){ FICHA.faded=false; fichaFace.classList.add("fx"); }
  var due=false; FICHA.go=function(){ if(tok!==FICHA.tok||!due||!FICHA.faded) return; FICHA.go=null;
    fichaPaint(i); FICHA.swaps++; fichaFace.classList.remove("fx"); FICHA.faded=false; };
  FICHA.ft=setTimeout(function(){ FICHA.faded=true; if(FICHA.go) FICHA.go(); },FICHA_OUT+200);
  FICHA.t=setTimeout(function(){ due=true; if(FICHA.go) FICHA.go(); },Math.max(FICHA_OUT,swapAt||0)); }
fichaFace.addEventListener("transitionend",function(e){ if(e.propertyName==="opacity"&&fichaFace.classList.contains("fx")){ FICHA.faded=true; if(FICHA.go) FICHA.go(); } });
var ART_STATS={transitions:0,saverEnter:0,saverExit:0,uploads:0,imgReq:0,warm:0};   // v16: subidas de textura y src asignados
function artSchedule(){ clearTimeout(artTimer); artTimer=0; if(!REDUCE&&!artMode&&!LAUNCH.phase&&!HID.on&&!BG_FIXED&&(IDLE_ART||!IDLE.resting)) artTimer=setTimeout(function(){ artAdvance(false); },ART_MS); }
function artAdvance(rapid){ if(HID.on||(BG_FIXED&&!artMode)) return; artTransition((artIdx+1)%ART.length,rapid); artSchedule(); }   // v16: oculta, ni relevo ni textura
function artAdvanceMode(){ if(!artMode||HID.on) return; var n=(artIdx+1)%ART.length; if(REDUCE) artCut(n); else artTransition(n,false); }
/* SALVAPANTALLAS (entrada 15): la UI se va, las obras rotan con el dispersal + Ken Burns; en
   reduced-motion es un pase de diapositivas por corte, sin partículas ni movimiento. */
function enterArtMode(){ if(artMode) return; flatOff(); cassFlatOff(); relevoFlush(); artMode=true; ART_STATS.saverEnter++; B.classList.add("artmode"); snd("saverIn");
  live.textContent=STR.liveSaver;
  clearTimeout(artTimer); clearTimeout(artModeTimer); idleCancel(); bandsHide(); rich.pause();   // v6: franjas fuera sin animar
  if(REDUCE){ saverNext(); return; }
  artAdvanceMode(); }
function exitArtMode(){ if(!artMode) return; artMode=false; ART_STATS.saverExit++; clearTimeout(artModeTimer);
  var ai=appIndex();
  live.textContent=STR.liveFocus(APPS[ai].nm);
  /* v13 · la vuelta inversa del Arte: si se entró con el despiece, se sale con su espejo (sin velo ni portal, como la ida).
     La clase launch va ANTES de quitar artmode: la UI reaparece ya oculta (sin transición) y vuelve con la del espejo */
  if(LAUNCH.arteBack&&LAUNCH.specs.length&&!REDUCE&&CASS_RICH&&lxEl.animate&&rich.card===cards[ai]&&APPS[ai].art){
    LAUNCH.arteBack=false; LAUNCH.phase="back"; LAUNCH.arte=true; LAUNCH.why="saver"; LAUNCH.returns++;
    B.classList.add("launch"); B.classList.add("launch-arte"); B.classList.remove("artmode");
    if(BG_FIXED){ if(artIdx!==BG_FIXED_ART) artCut(BG_FIXED_ART); else { stopPan(); resetStill(); } } else   // v16.1 · ?bg=fixed
    freezePan(); snd("returnStart",{app:APPS[ai].nm,why:"saver",dur:(LX.T-640)*LAUNCH_SLOW}); launchRewind(true); return; }
  LAUNCH.arteBack=false; B.classList.remove("artmode");
  freezePan(); rich.resume(); if(BG_FIXED&&artIdx!==BG_FIXED_ART) artCut(BG_FIXED_ART); else if(BG_FIXED){ stopPan(); resetStill(); }   // v16.1
  artSchedule(); idleArm(); }

/* ===== FRANJAS DE REPOSO Y PANEL DE INFORMACIÓN (P8e v6 · órdenes del autor, 2026-10-23) ==
   Sustituye a la v5. Ya NO existe un contenido «90s» (ni el lettering ni la píldora): las franjas son
   sólo el PANEL DE INFO de reposo. Aparecen SÓLO si se cumplen las tres cosas a la vez:
     (a) HAY CONEXIÓN: el estado de red del HUD es EN LÍNEA. COMPROBANDO (aún sin confirmar), SIN INTERNET
         y SIN RED cuentan como «sin conexión» → ninguna franja, aunque haya un dato guardado.
     (b) HAY INFO CARGADA: la nueva o, si no llega a tiempo, la última válida.
     (c) LA APP ENFOCADA LLEVA IDLE_MS SIN TECLAS (IDLE.quiet). También la 1.ª vez de la sesión.
   · NAVEGAR LAS SACA en el primer pulso; ráfaga = UNA salida (las teclas que llegan mientras salen sólo se
     cuentan); no vuelven mientras se navega.
   · VUELTA: tras IDLE_MS en la app nueva, con la info nueva si llega en SWAP_WAIT_MS; si no, con la última
     (marca «HACE N MIN»). Si la nueva llega después y es distinta, se re-anima con ella.
   · SIN CONEXIÓN, NINGUNA FRANJA. Si se pierde con las franjas en pantalla, salen animadas sin esperar a
     navegar. Al RECUPERARLA (desde SIN INTERNET o SIN RED) se cuenta un reposo entero desde ese momento
     (IDLE.quiet=false + idleArm): no reaparecen de golpe. La 1.ª confirmación de la sesión
     (COMPROBANDO → EN LÍNEA) no es una recuperación: si la app ya llevaba IDLE_MS quieta, entran al
     llegar los datos.
   · REINTENTOS (regla 5): con SIN RED no se pide nada; con SIN INTERNET sólo reintenta el backoff de la red
     (RETRY_MS: 1, 2, 5, 10 y 30 min, y luego cada 30 min) hasta el próximo éxito. Los reposos no piden.
   · REPOSO = IDLE.resting: tras IDLE_MS sin teclas, con o sin franjas, el rotador de DESTACADO se para; los
     carretes y los anillos SIGUEN girando (v8, IDLE_SPIN=1; con ?idlespin=0, parados como en la v6). Con el panel en pantalla se refresca cada WX_EVERY_MS y sólo se re-anima si los datos cambian.
   Estados (IDLE.state): off → waiting → entering → on ⇄ swapping → leaving → off. Fases CSS: out | in | "". */
var bandsEl=document.getElementById("bands"), hmodeL=document.getElementById("hmodeL"), hmode=document.getElementById("hmode");   // v16.10: fuera las píldoras (#wxWhen/#wxSrc viven ahora dentro de L1 y L5)
var IDLE={state:"off",phase:"",quiet:false,everShown:false,announced:false,resting:false,timer:0,refT:0,tok:0,landed:0,req:0,pend:null,queued:null,
  last:{},shown:null,shownStale:false,entries:0,exits:0,netExits:0,returns:0,cycles:0,coalesced:0,refreshes:0,late:0,blocked:0,noData:0,
  firstAt:null,adapter:(window.P8EWeather?P8EWeather.adapter:"none")};
hmode.textContent=(IDLE.adapter==="open-meteo")?"LIVE":"OFFLINE";
var T_OUT=OUT_MS+4*OUT_STG+30, T_IN=IN_MS+4*IN_STG;
var SWAP_WAIT_MS=900;                       // máx. espera de datos frescos antes de entrar con el último
var WX_DEF=(window.P8EWeather&&P8EWeather.REFRESH_MS)||1800000;
var WX_EVERY_MS=Math.max(LIVE_WX?WX_DEF:60000,qn("wxevery",WX_DEF));      // v11 (H9): con el live, nunca más a menudo que REFRESH_MS
function later(t,ms,fn){ setTimeout(function(){ if(IDLE.tok===t) fn(); },ms); }
function netOK(){ return netState()==="online"; }                 // (a): SÓLO «EN LÍNEA» es conexión

/* CAPA DE INFORMACIÓN POR APP. Hoy TODAS las apps devuelven el clima. Para que una app aporte la suya:
   dale a su entrada de APPS una función info() → Promise<{kind,data}|null>, un infoKey propio y un
   renderer en RENDER[kind]. El resto (ciclo, último dato, marca) no cambia. */
var RENDER={wx:function(d){ renderWx(d); }};
function infoKey(app){ return (app&&app.info)?("app:"+app.nm):"wx"; }
function getInfo(app){
  if(app&&typeof app.info==="function") return app.info();
  if(!window.P8EWeather) return Promise.resolve(null);
  return P8EWeather.getWeather().then(function(w){ netWx(w); return w?{kind:"wx",data:w}:null; }); }   // v4: cada refresco informa a la red
function sig(x){ if(!x) return ""; var d=x.data; return x.kind+JSON.stringify([d.ciudad,d.ahora,d.horas,d.dias,d.sol,d.uv]); }
/* una sola petición en vuelo: quien llega mientras tanto se cuelga de la misma */
function request(){ if(IDLE.pend&&!IDLE.pend.done) return IDLE.pend;
  var app=APPS[appIndex()], P={r:++IDLE.req,key:infoKey(app),done:false,res:null};
  P.p=getInfo(app).then(function(x){ return x; },function(){ return null; }).then(function(x){ P.done=true; P.res=x||null;
    if(x) IDLE.last[P.key]=x;
    if(IDLE.pend===P&&IDLE.phase==="out"&&IDLE.landed===-IDLE.tok) land(IDLE.tok);   // llegó durante la espera del barrido
    else if(x) arrived(x); });
  IDLE.pend=P; return P; }
function lastFor(key){ return IDLE.last[key]||IDLE.shown||null; }

/* LLEGAN DATOS (de cualquier petición): (b) se cumple ahora. Si (a) y (c) ya se cumplían, entran. */
function arrived(x){ if(artMode||LAUNCH.phase||!netOK()) return; var s=IDLE.state;
  if(AU.on&&s==="on"){ AU.defer=x; AU.deferred++; return; }        // v10: con la autoría arriba, los datos esperan a la vuelta
  if(s==="off"){ if(IDLE.quiet) enter(++IDLE.tok,x,!!x.data.stale); return; }
  if(x.data.stale) return;
  if(sig(x)===sig(IDLE.shown)){ if(IDLE.shownStale&&(s==="on"||s==="entering")){ IDLE.shown=x; IDLE.shownStale=false; setSrc(); } return; }   // el mismo, ya fresco: fuera la marca
  if(s==="on"&&IDLE.resting){ IDLE.late++; cycle(); refreshArm(); }   // datos nuevos con el panel en pantalla → se re-anima
  else if(s==="entering") IDLE.queued=x; }                           // entrando con el último: al acabar, el nuevo

function idleCancel(){ clearTimeout(IDLE.timer); IDLE.timer=0; }
function idleArm(){ idleCancel(); if(artMode||LAUNCH.phase) return; IDLE.timer=setTimeout(idleFire,IDLE_MS); }
function idleFire(){ IDLE.timer=0; if(artMode||LAUNCH.phase) return;
  if(tw){ idleArm(); return; }                                    // el corredor aún se mueve
  IDLE.quiet=true; if(!IDLE.resting) setIdle(true);               // (c) cumplida: reposo (ahorro 2017), haya franjas o no
  var s=IDLE.state;
  if(s==="on"){ refreshArm(); return; }
  if(s==="off"){
    if(netOK()) comeBack();
    else { IDLE.blocked++; if(netState()==="checking") request(); }   // sin conexión: nada. COMPROBANDO: se pregunta una vez
    return; }
  if(s!=="waiting") IDLE.timer=setTimeout(idleFire,T_IN+60); }    // en pleno barrido: se vuelve a mirar al acabar

/* arranque: se piden los datos ya (hace también de 1.er sondeo de red). Las franjas NO entran al llegar:
   esperan a que la app lleve IDLE_MS quieta (idleFire) o, si ya la lleva, entran al llegar (arrived). */
function panelBoot(){ if(canAsk()) request(); else netArm(); }

/* VUELTA: la app lleva IDLE_MS quieta y hay conexión. Info nueva si llega a tiempo; si no, la última. */
function comeBack(){ var t=++IDLE.tok, P=request(), fb=lastFor(P.key), fin=false;
  IDLE.state="waiting";
  function go2(x,stale){ if(fin||IDLE.tok!==t) return; fin=true;
    if(!x||!netOK()){ IDLE.state="off"; if(x) IDLE.blocked++; else IDLE.noData++; return; }   // sin datos o sin conexión: sin franjas
    if(IDLE.everShown) IDLE.returns++;
    enter(t,x,stale); }
  P.p.then(function(){ if(P.res) go2(P.res,!!P.res.data.stale); else go2(fb,true); });
  if(fb) later(t,SWAP_WAIT_MS,function(){ if(!P.done) go2(fb,true); }); }          // red lenta: el último, con marca

function enter(t,x,stale){ show(t,x,stale); refreshArm(); }
/* ENTRADA (franjas fuera → dentro) con la info dada */
function show(t,x,stale){ var c=bandsEl.classList;
  IDLE.state="entering"; IDLE.phase="in"; IDLE.entries++; IDLE.queued=null; snd("bandsIn",{dur:T_IN,step:IN_STG});
  if(!IDLE.everShown){ IDLE.everShown=true; IDLE.firstAt=Math.round(performance.now()); }
  paint(x,stale); announce(x);
  c.remove("gone");
  if(REDUCE){ c.remove("out"); IDLE.state="on"; IDLE.phase=""; AU.inAt=performance.now(); auSync(); return; }   // reduced-motion: por corte
  void bandsEl.offsetWidth; c.remove("out");
  later(t,T_IN,function(){ IDLE.state="on"; IDLE.phase=""; if(BANDS_FLAT) c.add("bst"); AU.inAt=performance.now(); auSync();   // v16.11 F5: .bst = franjas quietas. v10: el reloj de la autoría
    var q=IDLE.queued; IDLE.queued=null; if(q&&netOK()&&sig(q)!==sig(IDLE.shown)){ IDLE.late++; cycle(); } }); }

/* SALIDA animada: por navegación (bandsLeave, lo llama go() en cada cambio de app) o porque se perdió la
   conexión (panelNet). Desde entering, on o swapping; durante leaving, las teclas sólo se cuentan. */
function bandsOut(why){ var s=IDLE.state, c=bandsEl.classList; clearTimeout(IDLE.refT); IDLE.queued=null;
  if(s==="off"||s==="waiting"){ ++IDLE.tok; IDLE.state="off"; return; }          // ya fuera (o aún sin entrar)
  var t=++IDLE.tok;
  if(s==="leaving") IDLE.coalesced++; else if(why==="net") IDLE.netExits++; else IDLE.exits++;
  if(c.contains("bst")){ if(!c.contains("au")&&!c.contains("arm")){ c.add("bsx"); afterFrame(function(){ bandsEl.classList.remove("bsx"); },"v11"); }
    c.remove("bst"); }                                            // v16.11 F5: la salida, con la capa de siempre y sin transición none → rotateX(0)
  IDLE.state="leaving"; IDLE.phase="out"; c.add("out"); auSync(); snd("bandsOut",{why:why||"nav",dur:OUT_MS+4*OUT_STG,step:OUT_STG});
  if(AU.on) pxStop();                                              // v13: el pixel art se va en el acto; las franjas salen con su reverso oscuro
  if(REDUCE){ c.add("gone"); IDLE.state="off"; IDLE.phase=""; auClear(); return; }
  later(t,T_OUT,function(){ c.add("gone"); IDLE.state="off"; IDLE.phase=""; auClear(); }); }   // v10: fuera → de vuelta a la info
function bandsLeave(){ IDLE.quiet=false; bandsOut("nav"); }
/* salvapantallas: la UI ya no se ve; las franjas quedan fuera sin animación y, al salir, esperan un reposo */
function bandsHide(){ ++IDLE.tok; clearTimeout(IDLE.refT); IDLE.queued=null; IDLE.quiet=false;
  IDLE.state="off"; IDLE.phase=""; auClear(); bandsEl.className="bands out info gone"; }   // v10: auClear ANTES (con .au aún puesta: el corte sin giro)

/* LA RED CAMBIÓ (lo llama netRender en cada cambio de estado, también el primero) */
function panelNet(prev,s){
  if(s!=="online"){ if(s!=="checking") NET.lost=true; if(IDLE.state!=="off") bandsOut("net"); return; }
  if(NET.lost){ NET.lost=false; NET.recoveries++; if(!artMode){ IDLE.quiet=false; idleArm(); } } auSync(); }   // v10: auSync · recuperada: un reposo entero desde ya (idleArm no arma si se está abriendo una app)

/* ===== v10 · AUTORÍA EN EL REVERSO DE LAS FRANJAS (decisión de diseño, 2026-10-23) ===========================
   De vez en cuando, y no muy seguido, las franjas de información giran y dejan ver a la izquierda el QR al portfolio del
   autor y a la derecha su firma con sello, como en Warp Drive.
   · CUÁNDO gira (auOK): sólo con el PANEL DE INFO en pantalla y quieto (IDLE.state "on", sin barrido), en reposo, EN
     LÍNEA, sin salvapantallas, sin abrir una app y con la página visible. Es decir: la regla v6 del panel, y nada más.
   · CADA CUÁNTO: el reloj AU.acc cuenta SÓLO ese tiempo (el panel de info visible). Al llegar a AUTHOR_EVERY (4 min;
     ?author=ms) gira. Además, en cada aparición la info se ve al menos AU_LEAD (10 s) antes de girar: una aparición
     siempre ENTRA con la info, nunca con la autoría.
   · NUNCA EN LA 1.ª APARICIÓN del panel de la sesión: ni gira ni cuenta (?authorfirst=1 lo permite).
   · CUÁNTO DURA: AUTHOR_DWELL (12 s; ?authordwell=ms) con la autoría quieta arriba; luego vuelve a la info y el reloj
     empieza de 0.
   · INTERRUPCIONES: navegar o perder la red → las franjas salen como siempre (bandsOut, regla v6), con la autoría
     encima; ya fuera (.gone), auClear las devuelve a la info por corte: la próxima aparición es la info. Otra tecla
     que no navega → la autoría se va (giro de vuelta). Datos nuevos con la autoría arriba → esperan a la vuelta.
   · Reduced-motion: el giro es un corte. Sin rAF: transiciones CSS (p8e.css, .bands.au) y dos setTimeout.
   v13: el CUÁNDO y el CUÁNTO no cambian. Cambia lo que hay detrás del giro: pixel art con papiro,
   partículas y QR que florece (sección «v13 · AUTORÍA EN PIXEL ART», más abajo). Fases: "in" (giro + desenrollado +
   tinta, hasta el reposo del motor) · "up" (AUTHOR_DWELL quieta) · "back" (la tinta se levanta, los rollos se cierran y
   SÓLO ENTONCES las franjas giran de vuelta). Cada fase tiene su temporizador de respaldo si el Ticker no llega. */
var AU={on:false,phase:"",acc:0,runAt:0,inAt:0,dueAt:0,t:0,dt:0,shows:0,backs:0,clears:0,wakes:0,defer:null,deferred:0,
  seal:"",sealPx:null,sealM:null,qr:"",qrM:null,font:"",fontOK:false,fb:false,fallbacks:0,upAt:0,backAt:0,log:[],
  need:0,skips:0,ints:[]};                                       // v13.1: intervalo en curso, oportunidades saltadas, intervalos medidos
AU.need=auNeed();
/* sin QR no hay autoría (v10). v13: su matriz se LEE del SVG (mismo origen; no se regenera): auQrParse */
function auQrLoad(){ AU.qr="loading"; var x=new XMLHttpRequest(), fin=false;
  function done(s){ if(fin) return; fin=true; var q=null; try{ q=s?auQrParse(s):null; }catch(e){ q=null; } AU.qrM=q; AU.qr=q?"ok":"missing"; pxMaybePrep(); }
  try{ x.open("GET",AU_QR_URL,true); x.onload=function(){ done((x.status===200||x.status===0)?x.responseText:""); }; x.onerror=function(){ done(""); }; x.send(); }catch(e){ done(""); }
  setTimeout(function(){ done(""); },8000); }
function auLog(ev){ AU.log.push([ev,Math.round(performance.now())]); if(AU.log.length>40) AU.log.shift(); }
function auOK(){ return AU_ON&&!AU.on&&IDLE.state==="on"&&IDLE.phase===""&&IDLE.resting&&netOK()&&!artMode&&!LAUNCH.phase&&
  !document.hidden&&AU.qr==="ok"&&PX.ready&&(AUTHOR_FIRST||IDLE.entries>=2); }
/* el reloj: se llama en cada cambio que puede abrir o cerrar la ventana de auOK; suma lo corrido y reprograma */
function auSync(){ var now=performance.now();
  if(AU.runAt){ AU.acc+=now-AU.runAt; AU.runAt=0; }
  clearTimeout(AU.t); AU.t=0; AU.dueAt=0;
  if(!auOK()) return;
  var wait=Math.max(0,AU.need-AU.acc,AU_LEAD-(now-AU.inAt));
  AU.runAt=now; AU.dueAt=now+wait; AU.t=setTimeout(auFire,wait); }
function auFire(){ AU.t=0; if(!auOK()){ auSync(); return; }
  var now=performance.now(), c=bandsEl.classList, seen=AU.acc+(AU.runAt?now-AU.runAt:0);
  /* v13.1: la oportunidad llegó; con AUTHOR_P se usa o se salta (y se re-sortea el intervalo; acc vuelve a 0 = nunca dos en < MIN) */
  if(AU_RANDOM&&AU_RND(1000)>=Math.round(AUTHOR_P*1000)){ AU.skips++; AU.runAt=0; AU.dueAt=0; AU.acc=0; AU.need=auNeed(); auLog("skip"); auSync(); return; }
  AU.ints.push(Math.round(seen)); if(AU.ints.length>40) AU.ints.shift(); AU.need=auNeed();
  AU.runAt=0; AU.dueAt=0; AU.acc=0; AU.on=true; AU.phase="in"; AU.shows++; AU.upAt=now; AU.fb=false; auLog("in");
  c.add("arm"); void bandsEl.offsetWidth; c.add("au");          // el reverso existe (de canto) antes de girar
  snd("authorFlip",{dir:"in",dur:AU_FLIP_MS});
  pxIn(auUp);                                                   // v13: el motor (o, con reduced-motion, el final por corte)
  if(REDUCE){ auUp(); return; }
  /* respaldo: si el Ticker no llega al reposo (página oculta, motor parado), se posa el final y se sigue */
  AU.dt=setTimeout(function(){ if(AU.on&&AU.phase==="in"){ AU.fallbacks++; pxPose(AUT.IN_MAX); auUp(); } },Math.round(AUT.IN_MAX*AUF)+600); }
/* v13: la autoría ya está entera (reposo del motor): AUTHOR_DWELL quieta, sin nada corriendo */
function auUp(){ clearTimeout(AU.dt); AU.dt=0; if(!AU.on||AU.phase!=="in") return; AU.phase="up"; auLog("up"); AU.dt=setTimeout(auBack,AUTHOR_DWELL); }
/* vuelta a la info con el panel en pantalla (fin de AUTHOR_DWELL, o una tecla que no navega). v13: primero se cierra el
   papiro (pxBack, AUT.B_FLIP fotogramas) y al acabar giran las franjas (auFlipBack) */
function auBack(){ clearTimeout(AU.dt); AU.dt=0;
  if(!AU.on||AU.phase==="back"||IDLE.state!=="on"||LAUNCH.phase) return;    // saliendo o fuera: lo arregla auClear
  AU.phase="back"; AU.backs++; AU.backAt=performance.now(); AU.fb=false; auLog("back");
  if(REDUCE||!pxBack(auFlipBack)){ auFlipBack(); return; }
  AU.dt=setTimeout(function(){ if(AU.on&&AU.phase==="back"&&!AU.fb){ AU.fallbacks++; auFlipBack(); } },Math.round(AUT.B_FLIP*AUF)+400); }
function auFlipBack(){ if(!AU.on||AU.phase!=="back"||AU.fb) return; AU.fb=true; clearTimeout(AU.dt); AU.dt=0; pxStop(); auLog("flip");
  bandsEl.classList.remove("au"); snd("authorFlip",{dir:"out",dur:AU_FLIP_MS,back:true});
  AU.dt=setTimeout(auDone,REDUCE?0:AU_FLIP_MS); }
function auDone(){ AU.dt=0; AU.on=false; AU.phase=""; bandsEl.classList.remove("arm"); AU.inAt=performance.now(); auLog("info");
  var x=AU.defer; AU.defer=null; if(x) arrived(x);              // los datos que llegaron con la autoría arriba
  auSync(); }
/* franjas ya fuera (o el panel se oculta): de vuelta a la info POR CORTE, que nadie lo ve. La próxima aparición = info */
function auClear(){ clearTimeout(AU.dt); AU.dt=0; var c=bandsEl.classList, was=AU.on;
  AU.on=false; AU.phase=""; AU.defer=null; pxStop();
  if(c.contains("au")||c.contains("arm")){ if(was){ AU.clears++; auLog("clear"); }
    c.add("nf"); c.remove("au"); c.remove("arm"); void bandsEl.offsetWidth; c.remove("nf"); }
  auSync(); }
/* una tecla que no navega (las que navegan sacan las franjas en go(), justo después): la autoría se va */
function auWake(){ if(!AU.on||AU.phase==="back") return; setTimeout(function(){ if(AU.on&&IDLE.state==="on"&&!LAUNCH.phase){ AU.wakes++; auBack(); } },0); }
/* el sello: fichero PRIVADO (fuera de git). v13: sus CLASES de relieve (sello-px-104.png, 104×92 en gris: 0 papel · 85 sombra
   · 170 profunda · 255 brillo; la traducción de WD 1:1, sello-px.py). Si no carga, el papiro derecho lleva sólo la firma.
   ?nobrand=1 ni lo pide. */
function auSeal(){ if(NOBRAND){ AU.seal="off"; pxMaybePrep(); return; } var im=new Image(); AU.seal="loading";
  im.onload=function(){ try{ var w=im.naturalWidth, h=im.naturalHeight, c=tmpCanvas(w,h), x=c.getContext("2d"), d, n=w*h, cl=new Uint8Array(n), i;
      if(w!==104||h!==92) throw new Error("sello "+w+"x"+h);
      x.drawImage(im,0,0); d=x.getImageData(0,0,w,h).data; for(i=0;i<n;i++) cl[i]=Math.max(0,Math.min(3,Math.round(d[i*4]/85)));
      AU.sealM={w:w,h:h,c:cl}; AU.seal="ok"; AU.sealPx=[w,h]; }catch(e){ AU.seal="missing"; AU.sealM=null; }
    pxMaybePrep(); };
  im.onerror=function(){ AU.seal="missing"; pxMaybePrep(); };
  im.src=AU_SEAL_PX; }
/* v13: con el QR, el sello resuelto (ok, ausente o apagado) y la letra pixel cargada, se prepara la autoría UNA vez */
function pxMaybePrep(){ if(PX.ready||AU.qr!=="ok"||AU.seal===""||AU.seal==="loading"||!AU.fontOK) return;
  try{ auPrep(AU.qrM,AU.seal==="ok"?AU.sealM:null); }catch(e){ PX.err=String(e&&e.message||e); PX.ready=false; }
  auSync(); }
function auFont(){ if(!(document.fonts&&document.fonts.load)){ AU.fontOK=true; AU.font="sin FontFace API"; pxMaybePrep(); return; }
  document.fonts.load(AU_FONT).then(function(f){ AU.fontOK=!!(f&&f.length); AU.font=AU.fontOK?"ok":"missing"; pxMaybePrep(); },
    function(){ AU.font="missing"; }); }
document.addEventListener("visibilitychange",auSync);

/* ===== v13 · AUTORÍA EN PIXEL ART: dos papiros que se desenrollan, pigmento y QR que florece =====
   Decisión de diseño (2026-10-23): el QR, la firma y el sello usan la paleta y se animan como en Warp Drive, con sus
   partículas y el papiro que se desenrolla, todo en pixel art.
   Fuente: el estudio en pixel art de Warp Drive, otro proyecto del mismo autor (GPL-3.0-or-later): su motor de
   movimiento, su paleta y su papiro.
   · El GIRO split-flap de la v10 se queda: es el UMBRAL (en WD, la línea que baja y saca de la nave). El reverso de las
     franjas es ahora el fondo del estudio de WD (#001219); la autoría se pinta ENCIMA, en dos canvas, uno por lado.
   · PIXEL ART DE VERDAD: cada canvas mide AUW×AUH = 227×110 píxeles LÓGICOS y 1 lógico = 3 px CSS (681×330 en píxel
     entero: x 0 y 1239, y 494). Lo escala el compositor sin suavizar (image-rendering:pixelated, Chrome 41+). Respaldo
     (?auup=1, o si el motor no reconoce pixelated): el búfer va a ×3 y cada fotograma se escala DENTRO del canvas con
     drawImage e imageSmoothingEnabled=false (y su prefijo webkitImageSmoothingEnabled). ×3 es el mayor entero en el que
     caben a la vez el QR con módulos de 2 lógicos (6 px) y su zona de silencio de 4, el sello a 104 (la traducción de WD,
     1:1) y PixelOperator a su tamaño nativo: a ×4 el QR solo ya ocuparía las cinco franjas (README, v13).
   · UN PAPIRO POR ALA del cassette: izquierda = la columna de WD (invitación, dirección y QR con corchetes ámbar), derecha
     = el papiro de WD (sello gofrado, firma y línea legal). Dos rollos con tapas en espiral por papiro, que se separan del
     centro con anticipación, giran al avanzar (marcas del papel enrollado y espiral de las tapas), dejan ver las fibras
     poco después de pasar y asientan con 1 lógico de rebote.
   · PARTÍCULAS = el motor de WD en lo que importa: mulberry32, paseo por la retícula de 4 lógicos con el muelle del
     portfolio hacia una órbita, vuelos expo-out (0.22,1,0.36,1) en ARCO, golpe de 1 fotograma, estela de 8, una partícula
     por celda de tinta (y 8×4 si no caben en 384). El pigmento NACE en el color de la franja que gira (la paleta del
     launcher: #FEC631 · #F9591F · #F21E2C · #B21D3B · #6A1D41) y vira en 12 fotogramas a los 9 tonos del portfolio
     (PARTICLE_PALETTE, a luz 50/35/22 %), como en WD vira del cian de la nave. Ola del sello de abajo arriba, firma y
     dirección de izquierda a derecha, legal en glitch, QR que florece desde el centro por Chebyshev y sus buscadores
     encajan los ÚLTIMOS (ámbar, 1 fotograma): el QR sólo es exacto, y legible, en reposo.
   · Sólo enteros en posiciones (Q4) y curvas (tablas Q8): el estado depende sólo de la semilla y del fotograma (P8E.auPose).
     A doses: un fotograma del spec = 33,3 ms (= EST_SLOW de WD). UN rAF: el motor es una tarea del Ticker mientras algo
     se mueve; quieta la autoría, no corre nada. Reduced-motion: el estado final por corte, y el cierre también. */
var AUPX=3, AUW=227, AUH=110, AU_TOP=494, AU_LEFT=[0,1239], AUF=1000/30, AUG=4, AUGW=Math.ceil(AUW/AUG), AUGH=Math.ceil(AUH/AUG);
/* v14 · el canvas DERECHO sube AU_LIFT píxeles lógicos: la sombra del rótulo (#cap, y 827; su cola llega
   hasta y 812) caía sobre las filas lógicas 106–108 de su rollo (README v13, «Límites»). Medido (arnés, V14.C4, umbral 0 niveles):
   subir 1 lógico deja las filas 107–108 tocadas, 2 deja la 108, 3 = 0 píxeles. Sólo se mueve la capa (style.top: 494 → 485); la
   coreografía, que vive en coordenadas del canvas (AU_TOP incluido, con el que nacen las partículas en su franja), no cambia ni
   un fotograma. Coste: el rollo derecho queda 9 px CSS más alto que el izquierdo (4,5 px descentrado sobre sus franjas). */
var AU_LIFT=[3,3];   // 2026-10-24: los DOS rollos suben 3 lógicos (simétricos); con [0,3] el derecho quedaba 9 px más alto
var AU_MAXP=384, AU_TRAIL=8, AU_FONT='16px "Pixel Operator"', AU_UP=qp("auup","0")==="1";
var AU_SEAL_PX="../assets/brand/privado/sello-px-104.png";      // FUERA DE GIT: las clases del relieve de WD (sello-px.py)
/* tiempos en fotogramas del spec (f 0 = empieza el giro) · = tabla del README v13 */
var AUT={FLIP:23, BIRTH:[7,9,11,13,15], POP:19, SQZ:24, ROLL:26, ROLL_D:18, ROLL_END:45, PIG:12, FIB:3,
  SEAL0:34, SEAL_OLA:18, VUELO:16, JIT_SEAL:3, SIG0:50, SIG_OLA:12, VUELO_SIG:12, JIT_SIG:2,
  TXT0:34, TXT_OLA:16, TXT_FILAS:6, VUELO_TXT:14, JIT_TXT:2, GLI0:46, GLI_OLA:14, QR_ANTES:4, QR_CERROJO:3,
  B_OLA:8, B_FUERA:10, B_ANT:8, B_ROLL:10, B_ROLL_D:14, B_SHUT:24, B_POP:28, B_FLIP:29, IN_MAX:120};
/* filas del rollo de arriba (el de abajo, igual): cerrado · apretado (anticipación) · pasado (rebote) · reposo */
var AUR={H:7, closed:[48,55], sqz:[49,54], over:[0,103], rest:[1,102], SY0:8, SY1:101};
/* COLORES de WD (diseno.js / DISENO-ESTUDIO.md §6), sin la cuantización de la GBA: el papel y el fondo del portfolio y
   los derivados con las proporciones del diseño (sombra ×0,80, profunda ×0,60, fibra ×0,91 y ×1,05, borde ×0,80, rollo
   ×1,07 / ×0,78 / ×0,56). La tinta del papiro es #001219; sobre papel, el acento de WD que se lee es el petróleo #005F73
   (el del título de WD, 4,71:1); el ámbar #EE9B00 queda para los corchetes del QR (adorno, como en WD). */
function auK(h,k){ var c=hx(h); return [Math.min(255,Math.round(c[0]*k)),Math.min(255,Math.round(c[1]*k)),Math.min(255,Math.round(c[2]*k))]; }
function u32(c){ return ((255<<24)|(c[2]<<16)|(c[1]<<8)|c[0])>>>0; }
function auMix(a,b,t){ return [Math.round(a[0]+(b[0]-a[0])*t),Math.round(a[1]+(b[1]-a[1])*t),Math.round(a[2]+(b[2]-a[2])*t)]; }
function auHsl(h,s,l){ s/=100; l/=100; var a=s*Math.min(l,1-l);
  function f(n){ var k=(n+h/30)%12; return l-a*Math.max(-1,Math.min(k-3,9-k,1)); } return [Math.round(f(0)*255),Math.round(f(8)*255),Math.round(f(4)*255)]; }
var WDC={bg:"#001219",paper:"#E9D8A6",hi:"#FEFEFE",ink:"#001219",title:"#005F73",accent:"#EE9B00"};
var AUC={paper:u32(hx(WDC.paper)),shadow:u32(auK(WDC.paper,0.80)),deep:u32(auK(WDC.paper,0.60)),hi:u32(hx(WDC.hi)),
  fiber:u32(auK(WDC.paper,0.91)),fiberL:u32(auK(WDC.paper,1.05)),edge:u32(auK(WDC.paper,0.80)),rollHi:u32(auK(WDC.paper,1.07)),
  rollShade:u32(auK(WDC.paper,0.78)),rollDeep:u32(auK(WDC.paper,0.56)),ink:u32(hx(WDC.ink)),title:u32(hx(WDC.title)),accent:u32(hx(WDC.accent)),qr:u32(hx(WDC.ink))};
var AU_ROLL=[AUC.rollShade,AUC.paper,AUC.rollHi,AUC.rollHi,AUC.paper,AUC.rollShade,AUC.rollDeep];   // = el cilindro de WD
/* PIGMENTO: PARTICLE_PALETTE del portfolio ({h,s}, js/bundle-b.min.js) a luz 50 / 35 / 22 % (cabeza,
   estela media, estela baja). Nace en el color de su franja (y la estela en ese color medio y 3/4 hundido en el fondo,
   como en WD) y vira con la expo-out en AUT.PIG fotogramas: AU_RAMP[franja][tono][paso] = [cabeza, media, baja]. */
var AU_PP=[[191,100],[181,88],[162,38],[43,62],[39,100],[29,97],[20,95],[5,81],[358,62]];
var AUX=bez(0.22,1,0.36,1), AUE={};
function auE(D){ if(!AUE[D]){ var t=[],u; for(u=0;u<=D;u++) t.push(u===D?256:Math.round(AUX(u/D)*256)); AUE[D]=t; } return AUE[D]; }
var AU_RAMP=(function(){ var bg=hx(WDC.bg), out=[], s, k, j, e=auE(AUT.PIG);
  for(s=0;s<5;s++){ var b=hx(PAL5[s]), bm=auMix(b,bg,0.5), bl=auMix(b,bg,0.75), row=[];
    for(k=0;k<AU_PP.length;k++){ var h50=auHsl(AU_PP[k][0],AU_PP[k][1],50), h35=auHsl(AU_PP[k][0],AU_PP[k][1],35), h22=auHsl(AU_PP[k][0],AU_PP[k][1],22), st=[];
      for(j=0;j<=AUT.PIG;j++){ var t=e[j]/256; st.push([u32(auMix(b,h50,t)),u32(auMix(bm,h35,t)),u32(auMix(bl,h22,t))]); }
      row.push(st); }
    out.push(row); }
  return out; })();
/* ENTEROS, como el motor de WD: mulberry32 (n → 0…n−1), hash2 y la distancia octogonal */
function auRnd(seed){ var a=seed>>>0; return function(n){ a=(a+0x6D2B79F5)>>>0; var t=a; t=Math.imul(t^(t>>>15),t|1);
  t^=t+Math.imul(t^(t>>>7),t|61); return (((t^(t>>>14))>>>0)%n); }; }
function auH2(a,b){ var h=Math.imul(a^0x9E3779B9,0x85EBCA6B)^Math.imul(b+0x632BE59B,0xC2B2AE35); h^=h>>>13; h=Math.imul(h,0x27D4EB2F); return (h^(h>>>16))>>>0; }
function auOcto(dx,dy){ dx=Math.abs(dx); dy=Math.abs(dy); return Math.max(dx,dy,((dx+dy)*45)>>6); }
/* la línea legal de WD (DISENO-ESTUDIO §9: «© 2026 SERGIO AYALA» en las mayúsculas de 5 px del firmware, con el © de 7×7),
   COPIADA de sus píxeles en sim/public/estudio/final-en.png (público), filas 148–154, columnas 139–219: 81×7 */
var AU_LEGAL=["001110000000000000000000000000000000000000000000000000000000000000000000000000000",
  "010001000011100010011100011000001110111011100011101001100000110010100110010000110",
  "101110100000010101000010100000010000100010010100001010010001001010101001010001001",
  "101000100001100101001100111000001100110011100101101010010001111001001111010001111",
  "101110100010000101010000100100000010100010100100101010010001001001001001010001001",
  "010001000011110010011110011000011100111010010011101001100001001001001001011101001",
  "001110000000000000000000000000000000000000000000000000000000000000000000000000000"];
/* la tapa del rollo: óvalo de 5×7 (rollShade) con el papel enrollado dentro y el hueco de la espiral en rollDeep (WD);
   el «brazo» de la espiral (3 celdas del anillo interior) gira 3 celdas por paso de fase: se ve rodar */
var AU_CAPR=[[0,0],[1,0],[2,0],[2,1],[2,2],[2,3],[2,4],[1,4],[0,4],[0,3],[0,2],[0,1]];

var PX={ready:false,live:false,on:false,mode:"",tok:0,e0:0,f:0,S:[],cv:[],up:AU_UP,why:"",steps:0,draws:0,ms:0,msMax:0,
  restAt:-1,closeAt:-1,exact:[-1,-1],parts:[0,0],cell:["",""],font:"",fontOK:false,err:"",bk:-1,onRest:null,onClosed:null};
/* QR: la matriz se LEE de assets/brand/qr-portfolio.svg (segno; no se regenera): el trazo «qrline» son filas horizontales */
function auQrParse(svg){ var mN=/M0 0h(\d+)v\1/.exec(svg), m=/class="qrline"[^>]*\sd="([^"]+)"/.exec(svg); if(!mN||!m) return null;
  var N=+mN[1], g=new Uint8Array(N*N), tk=m[1].match(/[MmHh]|-?\d*\.?\d+/g), x=0, y=0, i=0, c, a, b, k, x2, row;
  if(!tk||N<21||N>61) return null;
  while(i<tk.length){ c=tk[i++];
    if(c==="M"||c==="m"){ a=+tk[i++]; b=+tk[i++]; if(c==="M"){ x=a; y=b; } else { x+=a; y+=b; } }
    else if(c==="h"||c==="H"){ a=+tk[i++]; x2=(c==="h")?x+a:a; row=Math.floor(y);
      for(k=Math.min(x,x2);k<Math.max(x,x2);k++) if(row>=0&&row<N&&k>=0&&k<N) g[row*N+k]=1; x=x2; }
    else return null; }
  /* los tres buscadores (7×7 con anillo, hueco y centro de 3×3) a 4 módulos del borde: si no están, no es nuestro QR */
  function fd(ox,oy){ for(var j=0;j<7;j++) for(var q=0;q<7;q++){ var ring=(j===0||j===6||q===0||q===6), core=(j>=2&&j<=4&&q>=2&&q<=4);
    if(g[(oy+j)*N+ox+q]!==((ring||core)?1:0)) return false; } return true; }
  if(!fd(4,4)||!fd(N-11,4)||!fd(4,N-11)) return null;
  return {n:N,m:g,quiet:4}; }
/* texto en PixelOperator a su tamaño nativo (16 px): se rasteriza UNA vez y se umbraliza al 50 % (máscara de 1 bit).
   Línea base en la fila 14 de una caja de 18: mayúsculas en las filas 5–13, descendentes hasta la 15 */
/* todas las líneas en UN canvas y UNA lectura (getImageData es una lectura de la GPU: medido en headless, de 8 a 284 ms
   cada una; con cinco por separado la preparación tardaba ≈ 260 ms) */
function auTexts(list){ var c=tmpCanvas(8,8), x=c.getContext("2d"), w=8, i, j, d, out=[];
  x.font=AU_FONT; for(i=0;i<list.length;i++) w=Math.max(w,Math.ceil(x.measureText(list[i]).width)+2);
  c.width=w; c.height=18*list.length; x=c.getContext("2d"); x.font=AU_FONT; x.textBaseline="alphabetic"; x.fillStyle="#000";
  for(i=0;i<list.length;i++) x.fillText(list[i],0,14+18*i);
  d=x.getImageData(0,0,w,c.height).data;
  for(j=0;j<list.length;j++){ var px=[], mx=0, y, xx; for(y=0;y<18;y++) for(xx=0;xx<w;xx++) if(d[((j*18+y)*w+xx)*4+3]>127){ px.push(xx,y); if(xx>mx) mx=xx; }
    out.push({w:mx+1,px:px}); }
  return out; }
function auLegal(){ var px=[], y, x; for(y=0;y<7;y++) for(x=0;x<81;x++) if(AU_LEGAL[y].charAt(x)==="1") px.push(x,y); return {w:81,px:px}; }

/* ---- UN LADO: el papiro, su tinta, sus unidades (celda × capa) y sus partículas ---- */
var AU_CATS=["fib","seal","sig","txt","qr","gli","deco"];          // 0…6 (el orden no importa: una celda × capa = una unidad)
function auSide(id,lay){
  var W=AUW, H=AUH, n=W*H, S={id:id,x0:lay.x0,x1:lay.x1,sy0:AUR.SY0,sy1:AUR.SY1,paper:new Uint32Array(n),fin:new Uint32Array(n),
    cat:new Int8Array(n),zone:new Uint8Array(n),ground:new Uint32Array(n),zero:new Uint32Array(n),units:[],parts:[],ring:lay.ring,
    seed:0x5E7A10+id, mark:new Int8Array(W), lay:lay}, R=auRnd(0x5A9+id*7), x, y, p, i, j, k;
  for(i=0;i<n;i++) S.cat[i]=-1;
  /* 1 · la hoja: papel con bordes rasgados (0–2 lógicos por fila y tres mellas de 3 por lado) y el corte en «edge» */
  var nick=[[],[]]; for(k=0;k<3;k++){ nick[0].push(S.sy0+6+R(S.sy1-S.sy0-12)); nick[1].push(S.sy0+6+R(S.sy1-S.sy0-12)); }
  for(y=S.sy0;y<=S.sy1;y++){ var a=R(3), b=R(3);
    for(k=0;k<3;k++){ if(Math.abs(y-nick[0][k])<=1) a=3; if(Math.abs(y-nick[1][k])<=1) b=3; }
    for(x=S.x0+a;x<=S.x1-b;x++) S.paper[y*W+x]=(x===S.x0+a||x===S.x1-b)?AUC.edge:AUC.paper; }
  S.fin.set(S.paper);
  /* 2 · la tinta (cada píxel con su capa) y las zonas sin fibra (regla 5 del diseño) */
  function put(x,y,c,cat){ if(x<0||y<0||x>=W||y>=H) return; var q=y*W+x; S.fin[q]=c; S.cat[q]=cat; }
  function zone(x0,y0,x1,y1){ for(var yy=Math.max(0,y0);yy<=Math.min(H-1,y1);yy++) for(var xx=Math.max(0,x0);xx<=Math.min(W-1,x1);xx++) S.zone[yy*W+xx]=1; }
  function text(m,ox,oy,c,cat){ var mnx=1e9,mny=1e9,mxx=-1,mxy=-1; for(var q=0;q<m.px.length;q+=2){ var xx=ox+m.px[q], yy=oy+m.px[q+1]; put(xx,yy,c,cat);
      if(xx<mnx) mnx=xx; if(yy<mny) mny=yy; if(xx>mxx) mxx=xx; if(yy>mxy) mxy=yy; }
    if(mxx>=0) zone(mnx-2,mny-2,mxx+2,mxy+2); }
  lay.ink(put,zone,text);
  /* 3 · la trama cruzada del papiro (WD: horizontales en «fiber» de 5–21 cada 3–5 filas; verticales en «fiberLight» de 4–11 cada
     5–9 columnas), escasa, con semilla fija, fuera de las zonas y nunca en el borde rasgado */
  function fib(x,y,c){ var q=y*W+x; if(S.paper[q]!==AUC.paper||S.zone[q]||S.cat[q]>=0) return; S.fin[q]=c; S.cat[q]=0; }
  for(y=S.sy0+2;y<S.sy1-1;y+=3+R(3)){ x=S.x0+R(S.x1-S.x0); var L=5+R(17); for(k=0;k<L;k++) fib(x+k,y,AUC.fiber); }
  for(x=S.x0+3;x<S.x1-2;x+=5+R(5)){ y=S.sy0+2+R(S.sy1-S.sy0-4); var L2=4+R(8); for(k=0;k<L2;k++) if(y+k<S.sy1) fib(x,y+k,AUC.fiberL); }
  /* marcas del papel enrollado (giro del rollo): cada 6–11 columnas, desfase 0–3 */
  for(x=0;x<W;x++) S.mark[x]=-1; for(x=S.x0+2;x<S.x1-2;x+=6+R(6)){ S.mark[x]=R(4); S.mark[x+1]=S.mark[x]; }
  /* 4 · unidades: (celda de 4×4, capa) con algún píxel distinto del papel; se guardan sus píxeles */
  var at={};
  for(y=0;y<H;y++) for(x=0;x<W;x++){ p=y*W+x; var c=S.cat[p]; if(c<0||S.fin[p]===S.paper[p]) continue;
    var key=((y>>2)*AUGW+(x>>2))*8+c, u=at[key];
    if(!u){ u=at[key]={id:S.units.length,cat:AU_CATS[c],cx:x>>2,cy:y>>2,x:(x>>2)*AUG,y:(y>>2)*AUG,px:[],stampAt:-1,unstampAt:-1,flashAt:-1,flashCol:0,
      glitchFrom:-1,settleAt:-1,part:-1,finder:false,d:0,liftAt:-1,stamped:false}; S.units.push(u); }
    u.px.push(p); }
  function bbox(us){ var b={x0:W,y0:H,x1:0,y1:0}; for(var q=0;q<us.length;q++){ var v=us[q]; if(v.x<b.x0) b.x0=v.x; if(v.y<b.y0) b.y0=v.y; if(v.x+AUG>b.x1) b.x1=v.x+AUG; if(v.y+AUG>b.y1) b.y1=v.y+AUG; }
    if(!us.length){ b.x0=0; b.y0=0; b.x1=W; b.y1=H; } return b; }
  S.by={}; AU_CATS.forEach(function(k2){ S.by[k2]=S.units.filter(function(v){ return v.cat===k2; }); });
  S.bb={}; AU_CATS.forEach(function(k2){ S.bb[k2]=bbox(S.by[k2]); });
  S.bInk=bbox(S.by.seal.concat(S.by.sig,S.by.txt));
  /* QR: distancia de Chebyshev al centro de la placa (en celdas) y celdas de los buscadores */
  if(lay.qr){ var Q=lay.qr, qcx=Q.x+(Q.w>>1), qcy=Q.y+(Q.w>>1), mod=Q.mod, s0=8*mod, fx=Q.x+Q.quiet*mod, fy=Q.y+Q.quiet*mod, fx1=fx+Q.n0*mod, fy1=fy+Q.n0*mod;
    var F=[[fx-mod,fy-mod],[fx1-s0,fy-mod],[fx-mod,fy1-s0]].map(function(o){ return {x0:o[0],y0:o[1],x1:o[0]+s0+mod,y1:o[1]+s0+mod}; });
    S.qrMaxD=0; S.by.qr.forEach(function(v){ v.finder=F.some(function(f){ return v.x<f.x1&&v.x+AUG>f.x0&&v.y<f.y1&&v.y+AUG>f.y0; });
      v.d=Math.max(Math.abs(v.x+2-qcx),Math.abs(v.y+2-qcy))>>2; if(!v.finder&&v.d>S.qrMaxD) S.qrMaxD=v.d; }); }
  /* 5 · partículas: una por unidad de tinta; si pasan de AU_MAXP, una lleva dos celdas vecinas (8×4) y luego cuatro (8×8).
     Aterriza en la primera y estampa todas (WD §4) */
  var tinta=S.by.seal.concat(S.by.sig,S.by.txt), grp=[0,0], gs=[[0,0],[1,0],[1,1]], seen;
  for(k=0;k<gs.length;k++){ grp=gs[k]; seen={}; var cnt=0;
    for(i=0;i<tinta.length;i++){ var kk=tinta[i].cat+":"+(tinta[i].cx>>grp[0])+":"+(tinta[i].cy>>grp[1]); if(!seen[kk]){ seen[kk]=1; cnt++; } }
    if(cnt<=AU_MAXP) break; }
  var G={}, order=[];
  for(i=0;i<tinta.length;i++){ var gk=tinta[i].cat+":"+(tinta[i].cx>>grp[0])+":"+(tinta[i].cy>>grp[1]); if(!G[gk]){ G[gk]=[]; order.push(gk); } G[gk].push(tinta[i]); }
  for(i=0;i<order.length;i++){ var us=G[order[i]]; for(j=0;j<us.length;j++) us[j].part=i;
    S.parts.push({u:us[0],us:us,i:i,k:i%AU_PP.length,s:i%5,x:0,y:0,vx:0,vy:0,px:-1,py:-1,node:0,mode:"wait",birth:0,dep:-1,depD:0,
      fx:0,fy:0,tx:0,ty:0,t0:0,D:0,dir:"in",sign:1,liftAt:-1,fadeAt:-1}); }
  S.cell=(AUG<<grp[0])+"x"+(AUG<<grp[1]);
  /* la órbita (el anillo del portfolio, WD §1): alrededor del sello (85 % de su radio) o de la placa del QR */
  S.field=new Uint8Array(AUGW*AUGH);
  for(j=0;j<AUGH;j++) for(i=0;i<AUGW;i++){ var dd=auOcto(i*AUG+1-S.ring[0],j*AUG+1-S.ring[1]); S.field[j*AUGW+i]=255-Math.min(255,Math.abs(dd-S.ring[2])*4); }
  return S; }

/* ---- LOS DOS PAPIROS (geometría en lógicos; README v13 §«La página») ---- */
function auLayouts(qr,seal){
  var L={}, R={}, tm=auTexts([STR.auInvite[0],STR.auInvite[1],STR.auUrl,STR.auBy,STR.auName]), inv1=tm[0], inv2=tm[1], url=tm[2], by=tm[3], nm=tm[4], lg=auLegal();
  PX.font=[inv1.w,inv2.w,url.w,by.w,nm.w].join(",");
  /* IZQUIERDA · texto (fuera) · corchete · placa del QR (junto al cassette) · corchete. Módulo = 2 lógicos (6 px) */
  var mod=2, plate=qr.n*mod, tw=Math.max(inv1.w,inv2.w,url.w), wL=5+tw+4+1+2+plate+2+1+5, x0=Math.round((AUW-wL)/2);
  L.x0=x0; L.x1=x0+wL-1;
  var qx=L.x1-5-1-2-plate+1, qy=Math.round((AUR.SY0+AUR.SY1+1)/2-plate/2);
  L.qr={x:qx,y:qy,w:plate,mod:mod,n:qr.n,quiet:qr.quiet,n0:qr.n-2*qr.quiet};
  L.ring=[qx+(plate>>1),qy+(plate>>1),(plate>>1)+6];
  var ty=Math.round((AUR.SY0+AUR.SY1+1)/2-22)-5, tx=L.x0+5;
  L.ink=function(put,zone,text){ var i, j, x, y;
    text(inv1,tx,ty,AUC.ink,3); text(inv2,tx,ty+13,AUC.ink,3); text(url,tx,ty+32,AUC.title,3);
    for(j=0;j<qr.n;j++) for(i=0;i<qr.n;i++) if(qr.m[j*qr.n+i]) for(y=0;y<mod;y++) for(x=0;x<mod;x++) put(qx+i*mod+x,qy+j*mod+y,AUC.qr,4);
    zone(qx-4,qy-2,qx+plate+3,qy+plate+1);
    /* corchetes ámbar (WD: a 2 lógicos de la placa, con pie de 1 hacia ella) */
    for(y=qy;y<qy+plate;y++){ put(qx-3,y,AUC.accent,6); put(qx+plate+2,y,AUC.accent,6); }
    put(qx-2,qy,AUC.accent,6); put(qx-2,qy+plate-1,AUC.accent,6); put(qx+plate+1,qy,AUC.accent,6); put(qx+plate+1,qy+plate-1,AUC.accent,6); };
  /* DERECHA · sello (junto al cassette) · firma y legal (fuera). Sin sello: sólo la firma, centrada (degradación de la v10) */
  var cw=Math.max(nm.w,lg.w,by.w), sw=seal?(4+104+8):5, wR=sw+cw+5, rx0=Math.round((AUW-wR)/2);
  R.x0=rx0; R.x1=rx0+wR-1;
  var sx=R.x0+4, sy=AUR.SY0+1, cx=R.x0+sw, cy=Math.round((AUR.SY0+AUR.SY1+1)/2-19)-5;
  R.ring=seal?[sx+52,sy+46,Math.round(52*218/256)]:[cx+(cw>>1),cy+20,40];
  R.ink=function(put,zone,text){ var x, y, v, k=[0,AUC.shadow,AUC.deep,AUC.hi];
    if(seal){ for(y=0;y<seal.h;y++) for(x=0;x<seal.w;x++){ v=seal.c[y*seal.w+x]; if(v) put(sx+x,sy+y,k[v],1); }
      for(y=-3;y<seal.h+3;y++) for(x=-3;x<seal.w+3;x++){ var ex=(x-52)/55, ey=(y-46)/49; if(ex*ex+ey*ey<=1) zone(sx+x,sy+y,sx+x,sy+y); } }   // la elipse del sello + 3 (regla 5)
    text(by,cx,cy,AUC.ink,2); text(nm,cx,cy+13,AUC.ink,2);
    for(var q=0;q<lg.px.length;q+=2) put(cx+lg.px[q],cy+5+13+9+2+7+lg.px[q+1],AUC.title,5);
    zone(cx-2,cy+5+31-2,cx+lg.w+1,cy+5+31+8); };
  return {L:L,R:R}; }
function auPrep(qr,seal){ var t0=performance.now(), ly=auLayouts(qr,seal), t1=performance.now();
  PX.S=[auSide(0,ly.L)]; var t2=performance.now(); PX.S.push(auSide(1,ly.R)); PX.prepSteps=[+(t1-t0).toFixed(1),+(t2-t1).toFixed(1),+(performance.now()-t2).toFixed(1)]; PX.parts=[PX.S[0].parts.length,PX.S[1].parts.length]; PX.cell=[PX.S[0].cell,PX.S[1].cell];
  PX.prepMs=+(performance.now()-t0).toFixed(1); PX.ready=true; }

/* ---- EL MOTOR (un fotograma del spec; los dos lados con el mismo reloj) ---- */
function auNodeXY(n){ return [(n%AUGW)*AUG+1,((n/AUGW)|0)*AUG+1]; }
function auFly(S,p,tx,ty,D,dir,t){ p.fx=(p.x+8)>>4; p.fy=(p.y+8)>>4; p.tx=tx; p.ty=ty; p.D=D; p.t0=t; p.dir=dir; p.mode="fly"; p.sign=(auH2(p.i+S.id*977,t)&1)?1:-1; }
function auFlyPos(p,t){ var u=Math.min(p.D,t-p.t0), e=auE(p.D)[u], dx=p.tx-p.fx, dy=p.ty-p.fy, k=e*(256-e);
  /* arco: perpendicular a la trayectoria, ∝ e·(1−e) (Williams, los arcos; = WD §3.1 en enteros) */
  return [p.fx+((dx*e)>>8)+((p.sign*-dy*k*205)>>24), p.fy+((dy*e)>>8)+((p.sign*dx*k*205)>>24)]; }
function auCrawl(S,p,t){ var R=S.R;
  if(R(2)){ var n=p.node, i=n%AUGW, j=(n/AUGW)|0, best=-1, bv=-1, d, a, b, v;
    for(d=0;d<4;d++){ a=i+(d===0?-1:d===1?1:0); b=j+(d===2?-1:d===3?1:0); if(a<0||b<0||a>=AUGW||b>=AUGH) continue;
      v=S.field[b*AUGW+a]+R(31); if(v>bv){ bv=v; best=b*AUGW+a; } }
    if(best>=0&&(t-S.busy[best]>15)){ p.node=best; S.busy[best]=t; } }
  /* el muelle del portfolio (k 8, viscosidad 0,4, paso 0,1) en Q4/Q8 (WD §3.2) */
  var q=auNodeXY(p.node), dx=p.x-(q[0]<<4), dy=p.y-(q[1]<<4);
  p.vx=((p.vx-8*dx)*102)>>8; p.vy=((p.vy-8*dy)*102)>>8; p.x+=(p.vx*26)>>8; p.y+=(p.vy*26)>>8; }
/* los rollos en el fotograma t: [fila del de arriba, fila del de abajo, fase de giro, pop] o null (aún no hay papiro) */
function auRollsIn(t){ var A=AUR;
  if(t<AUT.POP) return null;
  if(t<AUT.SQZ) return [A.closed[0],A.closed[1],0,t===AUT.POP];
  if(t<AUT.ROLL) return [A.sqz[0],A.sqz[1],0,false];
  if(t<AUT.ROLL+AUT.ROLL_D){ var e=auE(AUT.ROLL_D)[t-AUT.ROLL]; return [A.sqz[0]+(((A.over[0]-A.sqz[0])*e)>>8),A.sqz[1]+(((A.over[1]-A.sqz[1])*e+255)>>8),0,false]; }
  if(t<AUT.ROLL_END) return [A.over[0],A.over[1],0,false];
  return [A.rest[0],A.rest[1],0,false]; }
function auRolls(t){ var r, A=AUR;
  if(PX.bk<0) r=auRollsIn(t);
  else { var g=t-PX.bk, s=PX.bkRoll;
    if(!s) r=null;
    else if(g<AUT.B_ANT) r=[s[0],s[1]];
    else if(g<AUT.B_ROLL) r=(s[0]===A.rest[0]&&s[1]===A.rest[1])?[A.over[0],A.over[1]]:[s[0],s[1]];    // anticipación: tira hacia fuera
    else if(g<AUT.B_ROLL+AUT.B_ROLL_D){ var u=g-AUT.B_ROLL, e=256-auE(AUT.B_ROLL_D)[AUT.B_ROLL_D-u];                 // expo-in (la ida al revés)
      r=[s[0]+(((A.closed[0]-s[0])*e)>>8),s[1]+(((A.closed[1]-s[1])*e)>>8)]; }
    else if(g===AUT.B_SHUT) r=[A.sqz[0],A.sqz[1]];                                                                // choque: se aprietan
    else if(g<AUT.B_POP) r=[A.closed[0],A.closed[1]];
    else if(g===AUT.B_POP) r=[A.closed[0],A.closed[1],0,true];
    else r=null;
    if(r){ r[2]=0; r[3]=!!r[3]; } }
  if(r){ r[2]=Math.abs(A.closed[0]-r[0]); r[4]=Math.abs(r[1]-A.closed[1]); }
  return r; }
/* primer fotograma en que el papiro descubre la fila (tabla única: la geometría de los rollos es la misma en los dos lados) */
var AU_REV=null;
function auReveal(S,row){ if(!AU_REV){ AU_REV=new Int16Array(AUH); for(var y=0;y<AUH;y++){ AU_REV[y]=AUT.ROLL_END;
      for(var t=AUT.POP;t<=AUT.ROLL_END;t++){ var r=auRollsIn(t); if(r&&y>=r[0]+AUR.H&&y<r[1]){ AU_REV[y]=t; break; } } } }
  return AU_REV[Math.max(0,Math.min(AUH-1,row))]; }
function auStamp(S,u){ for(var i=0;i<u.px.length;i++) S.ground[u.px[i]]=S.fin[u.px[i]]; u.stamped=true; }
function auUnstamp(S,u){ for(var i=0;i<u.px.length;i++) S.ground[u.px[i]]=S.paper[u.px[i]]; u.stamped=false; }
function auPig(p,t){ return AU_RAMP[p.s][p.k][Math.max(0,Math.min(AUT.PIG,t-p.birth))]; }
/* la ENTRADA: calendario de todo (determinista: sólo depende de la semilla) */
function auEnter(S){ var R=S.R=auRnd(S.seed), i, p, u, b, t=0, us=S.units, P=S.parts;
  S.ground.set(S.paper); S.busy=new Int32Array(AUGW*AUGH); for(i=0;i<S.busy.length;i++) S.busy[i]=-100;
  S.rest=false; S.restAt=-1; S.exact=-1;
  for(i=0;i<us.length;i++){ u=us[i]; u.stampAt=u.unstampAt=u.flashAt=-1; u.glitchFrom=u.settleAt=-1; u.liftAt=-1; u.stamped=false; }
  /* fibras: aparecen AUT.FIB fotogramas después de que el rollo descubra su fila (sin golpe: es el papel, no la tinta) */
  S.by.fib.forEach(function(v){ v.stampAt=auReveal(S,v.y+3)+AUT.FIB; });
  /* nacen en su franja cuando la franja se pone de canto (240 + 70·i ms); la mitad, ya en la órbita */
  for(i=0;i<P.length;i++){ p=P[i]; p.mode="wait"; p.px=p.py=-1; p.liftAt=p.fadeAt=-1; p.vx=p.vy=0;
    var r0=Math.ceil((507.6+60.48*p.s-AU_TOP)/AUPX/AUG), r1=Math.floor((507.6+60.48*(p.s+1)-AU_TOP)/AUPX/AUG)-1, n=0, best=-1, cnt=(i&1)?8:1, k;
    for(k=0;k<cnt;k++){ var c=(r0+R(Math.max(1,r1-r0+1)))*AUGW+R(Math.min(AUGW,Math.ceil(AUW/AUG))); if(best<0||S.field[c]>S.field[best]) best=c; }
    p.node=best; var q=auNodeXY(best); p.x=q[0]<<4; p.y=q[1]<<4; p.birth=AUT.BIRTH[p.s]+R(3); }
  /* salidas: sello de abajo arriba · firma y textos de izquierda a derecha (y de arriba abajo, en el texto) · nunca antes de
     que el papiro haya descubierto la fila de destino */
  var bs=S.bb.seal, hs=Math.max(1,bs.y1-bs.y0), bg=S.bb.sig, wg=Math.max(1,bg.x1-bg.x0), bt=S.bb.txt, wt=Math.max(1,bt.x1-bt.x0), ht=Math.max(1,bt.y1-bt.y0);
  for(i=0;i<P.length;i++){ p=P[i]; u=p.u; var rv=auReveal(S,u.y+AUG)+1;
    if(u.cat==="seal"){ p.dep=AUT.SEAL0+(((bs.y1-AUG-u.y)*AUT.SEAL_OLA)/hs|0)+R(AUT.JIT_SEAL+1); p.depD=AUT.VUELO; }
    else if(u.cat==="sig"){ p.dep=AUT.SIG0+(((u.x-bg.x0)*AUT.SIG_OLA)/wg|0)+R(AUT.JIT_SIG+1); p.depD=AUT.VUELO_SIG; }
    else { p.dep=AUT.TXT0+(((u.x-bt.x0)*AUT.TXT_OLA)/wt|0)+(((u.y-bt.y0)*AUT.TXT_FILAS)/ht|0)+R(AUT.JIT_TXT+1); p.depD=AUT.VUELO_TXT; }
    if(p.dep<rv) p.dep=rv; if(p.dep<=p.birth) p.dep=p.birth+1; }
  /* legal: glitch-switch del portfolio (barajan a la vez; se asientan de izquierda a derecha) */
  var bl=S.bb.gli, wl=Math.max(1,bl.x1-bl.x0);
  S.by.gli.forEach(function(v){ v.glitchFrom=Math.max(AUT.GLI0,auReveal(S,v.y+AUG)); v.settleAt=v.glitchFrom+4+(((v.x-bl.x0)*AUT.GLI_OLA)/wl|0); v.stampAt=v.settleAt; });
  auQrPlan(S,0); }
/* el QR florece desde su centro cuando la tinta casi ha llegado; los buscadores (y los corchetes) encajan los ÚLTIMOS */
function auQrPlan(S,t){ var last=t, i, p, P=S.parts;
  if(!S.by.qr.length) return;
  for(i=0;i<P.length;i++){ p=P[i]; if(p.dep>=0) last=Math.max(last,p.dep+p.depD); if(p.mode==="fly"&&p.dir==="in") last=Math.max(last,p.t0+p.D); }
  S.qrStart=Math.max(t,last-AUT.QR_ANTES,AUT.ROLL_END); S.qrLock=Math.max(last,S.qrStart+S.qrMaxD)+AUT.QR_CERROJO;
  S.by.qr.forEach(function(v){ if(v.finder){ v.flashAt=S.qrLock; v.flashCol=-1; v.stampAt=S.qrLock+1; }
    else { v.flashAt=S.qrStart+v.d; v.flashCol=AU_RAMP[v.d%5][v.d%AU_PP.length][AUT.PIG][0]; v.stampAt=v.flashAt+1; } });
  var dy=S.lay.qr?S.lay.qr.y+(S.lay.qr.w>>1):0;
  S.by.deco.forEach(function(v){ v.stampAt=S.qrStart+(Math.abs(v.y+2-dy)>>3); }); }   // los corchetes crecen del centro, 2 celdas por fotograma
/* el CIERRE (vuelta a la info): el QR deja de serlo en el primer fotograma (t0 + 1: el fotograma t0 ya se calculó); la tinta se levanta de arriba abajo y su pigmento
   sale hacia fuera (WD, «Con A mantenido»); luego los rollos se cierran (anticipación hacia fuera, expo-in, choque, pop) */
function auBackPlan(S,t0){ var t=t0+1, R=S.R, i, p, u, P=S.parts, bi=S.bInk, hi=Math.max(1,bi.y1-bi.y0), bl=S.bb.gli, wl=Math.max(1,bl.x1-bl.x0);
  S.rest=false;
  for(i=0;i<P.length;i++){ p=P[i]; u=p.u; p.dep=-1;
    if(u.stamped||u.stampAt>t||p.mode==="landed"){ for(var j=0;j<p.us.length;j++) p.us[j].stampAt=-1; p.liftAt=t+(((u.y-bi.y0)*AUT.B_OLA)/hi|0); p.mode="landed"; }
    else if(p.mode==="fly"||p.mode==="float"){ var q=p.mode==="fly"?auFlyPos(p,t0):[(p.x+8)>>4,(p.y+8)>>4]; p.x=q[0]<<4; p.y=q[1]<<4; var o=auOut(S,p); auFly(S,p,o[0],o[1],AUT.B_FUERA,"out",t0); }
    else p.mode="dead"; }
  S.by.qr.forEach(function(v){ v.flashAt=-1; v.stampAt=-1; v.unstampAt=v.finder?t:t+((S.qrMaxD-v.d)>>1); });
  S.by.deco.forEach(function(v){ v.stampAt=-1; v.unstampAt=t+2; });
  S.by.gli.forEach(function(v){ v.stampAt=-1; v.settleAt=-1; v.glitchFrom=t; v.unstampAt=t+2+(((v.x-bl.x0)*6)/wl|0); }); }
function auOut(S,p){ var R=S.R, u=p.u, c=S.ring, vx=u.x+1-c[0], vy=u.y+1-c[1], s=96+R(129);       // 0,375…0,875 de su distancia, ± 6
  return [Math.max(0,Math.min(AUW-2,u.x+1+((vx*s)>>8)+R(13)-6)),Math.max(0,Math.min(AUH-2,u.y+1+((vy*s)>>8)+R(13)-6))]; }
function auStep(S){ var t=PX.f, P=S.parts, U=S.units, i, j, p, u, q, back=PX.bk>=0;
  for(i=0;i<P.length;i++){ p=P[i];
    if(p.mode==="dead") continue;
    p.px=(p.x+8)>>4; p.py=(p.y+8)>>4;
    if(p.mode==="wait"){ if(t>=p.birth){ p.mode="float"; p.px=-1; } else continue; }
    if(p.mode==="fade"){ if(t>p.fadeAt) p.mode="dead"; continue; }
    if(p.mode==="landed"){
      if(back&&p.liftAt===t){ for(j=0;j<p.us.length;j++){ u=p.us[j]; auUnstamp(S,u); u.flashAt=t; u.flashCol=auPig(p,t)[0]; } }
      else if(back&&p.liftAt>=0&&t===p.liftAt+1){ p.liftAt=-1; q=auNodeXY(p.u.cy*AUGW+p.u.cx); p.x=q[0]<<4; p.y=q[1]<<4; var o=auOut(S,p); auFly(S,p,o[0],o[1],AUT.B_FUERA,"out",t); }
      continue; }
    if(!back&&p.dep===t){ if(p.mode==="fly"){ q=auFlyPos(p,t); p.x=q[0]<<4; p.y=q[1]<<4; } auFly(S,p,p.u.x+1,p.u.y+1,p.depD,"in",t); p.dep=-1; }
    else if(p.mode==="float") auCrawl(S,p,t);
    if(p.mode==="fly"){ q=auFlyPos(p,t); p.x=q[0]<<4; p.y=q[1]<<4;
      if(t-p.t0>=p.D||(p.dir==="in"&&t>p.t0&&q[0]===p.tx&&q[1]===p.ty)){
        if(p.dir==="in"){ p.mode="landed"; var col=auPig(p,t)[0]; for(j=0;j<p.us.length;j++){ u=p.us[j]; u.flashAt=t; u.flashCol=col; u.stampAt=t+1; } }
        else { p.mode="fade"; p.fadeAt=t+1; } } } }
  for(i=0;i<U.length;i++){ u=U[i]; if(u.unstampAt===t){ auUnstamp(S,u); u.unstampAt=-1; u.glitchFrom=-1; } if(u.stampAt===t){ auStamp(S,u); u.stampAt=-1; } }
  if(!back&&!S.rest&&t>AUT.ROLL_END){ var quiet=true;
    for(i=0;i<P.length&&quiet;i++) if(P[i].mode!=="landed") quiet=false;
    for(i=0;i<U.length&&quiet;i++){ u=U[i]; if(!u.stamped||u.stampAt>t||u.flashAt>=t||u.settleAt>t) quiet=false; }
    if(quiet||t>=AUT.IN_MAX) auRestSide(S,t); } }
/* reposo: se vuelca el final exacto (lo que faltaba antes del volcado se mide: debe ser 0, como en WD §7) */
function auRestSide(S,t){ var d=0, i; for(i=0;i<S.fin.length;i++) if(S.ground[i]!==S.fin[i]) d++;
  S.exact=d; S.ground.set(S.fin); S.rest=true; S.restAt=t;
  for(i=0;i<S.units.length;i++){ var u=S.units[i]; u.stamped=true; u.stampAt=u.unstampAt=u.flashAt=-1; u.glitchFrom=u.settleAt=-1; }
  for(i=0;i<S.parts.length;i++){ S.parts[i].mode="landed"; S.parts[i].dep=-1; S.parts[i].liftAt=-1; } }

/* ---- PINTAR (un lado): hoja descubierta + golpes + glitch + rollos + partículas → putImageData ---- */
function auPut(o,x,y,c){ if(x>=0&&y>=0&&x<AUW&&y<AUH) o[y*AUW+x]=c; }
function auRoll(S,o,y,ph,pop,dir){ var W=AUW, x0=S.x0-1, x1=S.x1+1, r, x, yy, c, k;
  for(r=0;r<AUR.H;r++){ yy=y+r; if(yy<0||yy>=AUH) continue; c=pop?AUC.hi:AU_ROLL[r]; for(x=x0;x<=x1;x++) o[yy*W+x]=c; }
  if(!pop) for(x=x0;x<=x1;x++){ k=S.mark[x]; if(k<0) continue;                                 // el papel enrollado pasa por delante al girar
    r=1+((k+dir*(ph>>1))&3); yy=y+r; if(yy>=0&&yy<AUH) o[yy*W+x]=(r===2||r===3)?AUC.fiber:AUC.rollShade; }
  auCap(o,S.x0-6,y,ph,pop,dir); auCap(o,S.x1+2,y,ph,pop,dir); }
function auCap(o,cx,y,ph,pop,dir){ var r, x, c, k, a=(((dir*(ph>>1))%4)+4)%4*3;
  for(r=0;r<7;r++) for(x=0;x<5;x++){ var edge=(r===0||r===6)?(x>=1&&x<=3):(x===0||x===4); if(!edge&&(r===0||r===6)) continue;
    c=edge?AUC.rollShade:AUC.rollHi; if(!edge){ var ix=x-1, iy=r-1; if(ix===1&&iy>=1&&iy<=3) c=(iy===2)?AUC.rollDeep:AUC.rollShade;
      else for(k=0;k<3;k++){ var cp=AU_CAPR[(a+k)%12]; if(cp[0]===ix&&cp[1]===iy) c=AUC.rollDeep; } }
    auPut(o,cx+x,y+r,pop?AUC.hi:c); } }
function auTrail(o,x0,y0,x1,y1,cm,cl){ var dx=Math.abs(x1-x0), dy=-Math.abs(y1-y0), sx=x0<x1?1:-1, sy=y0<y1?1:-1, err=dx+dy, x=x0, y=y0, n=Math.max(dx,-dy), k, d, e2;
  for(k=0;k<n;k++){ d=n-k; if(d<=AU_TRAIL) auPut(o,x,y,d<=(Math.min(n,AU_TRAIL)>>1)?cm:cl); e2=2*err; if(e2>=dy){ err+=dy; x+=sx; } if(e2<=dx){ err+=dx; y+=sy; } } }
function auDraw(S,ci){ var o=S.out, t=PX.f, W=AUW, rp=auRolls(t), i, j, u, p, k, r0=1, r1=0;
  o.set(S.zero);
  if(rp){ r0=Math.max(S.sy0,rp[0]+AUR.H); r1=Math.min(S.sy1,rp[1]-1);
    if(r1>=r0){ o.set(S.ground.subarray(r0*W,(r1+1)*W),r0*W);
      if(r0===rp[0]+AUR.H) for(i=r0*W+S.x0;i<=r0*W+S.x1;i++) if(o[i]) o[i]=AUC.fiber;            // la sombra del rollo de arriba (WD)
      for(i=0;i<S.units.length;i++){ u=S.units[i];
        if(u.flashAt===t){ var fc=u.flashCol<0?AUC.accent:u.flashCol; for(j=0;j<u.px.length;j++){ k=u.px[j]; if(k>=r0*W&&k<(r1+1)*W) o[k]=fc; } }
        else if(u.glitchFrom>=0&&t>=u.glitchFrom&&(u.settleAt<0||t<u.settleAt)&&(u.unstampAt<0||t<u.unstampAt)){   // cada celda enseña otra celda legal
          var g=S.by.gli, oo=g[auH2(u.id,t)%g.length];
          for(j=0;j<u.px.length;j++){ k=u.px[j]; if(k>=r0*W&&k<(r1+1)*W) o[k]=S.paper[k]; }
          for(j=0;j<oo.px.length;j++){ var pp=oo.px[j], ddx=(pp%W)-oo.x, ddy=((pp/W)|0)-oo.y, tq=(u.y+ddy)*W+u.x+ddx; if(tq>=r0*W&&tq<(r1+1)*W&&S.paper[tq]) o[tq]=S.fin[pp]; } } } }
    auRoll(S,o,rp[0],rp[2],rp[3],-1); auRoll(S,o,rp[1],rp[4],rp[3],1); }
  for(i=0;i<S.parts.length;i++){ p=S.parts[i]; if(p.mode!=="float"&&p.mode!=="fly"&&p.mode!=="fade") continue;
    var x=(p.x+8)>>4, y=(p.y+8)>>4, c3=auPig(p,t), hc=p.mode==="fade"?c3[2]:c3[0];
    if(p.px>=0&&p.mode!=="fade") auTrail(o,p.px,p.py,x,y,c3[1],c3[2]);
    auPut(o,x,y,hc); auPut(o,x+1,y,hc); auPut(o,x,y+1,hc); auPut(o,x+1,y+1,hc); }
  var cv=PX.cv[ci]; if(!cv) return;
  if(PX.up){ S.sctx.putImageData(S.img,0,0); var c=cv.getContext("2d"); c.imageSmoothingEnabled=false; c.webkitImageSmoothingEnabled=false;
    c.clearRect(0,0,cv.width,cv.height); c.drawImage(S.scv,0,0,AUW*AUPX,AUH*AUPX); }
  else S.ctx.putImageData(S.img,0,0);
  PX.draws++; }
/* ---- los canvas (creados una vez; a 227×110, o a ×3 en el respaldo) ---- */
function pxCanvases(){ if(PX.cv.length) return;
  /* sólo «pixelated» es vecino más próximo (Chrome 41+). -webkit-optimize-contrast NO sirve (es un suavizado «nítido»): sin
     pixelated, el canvas pasa a ×3 y se escala dentro con drawImage sin suavizar */
  var ok=false; try{ ok=!!(window.CSS&&CSS.supports&&CSS.supports("image-rendering","pixelated")); }catch(e){ ok=false; }
  if(!ok) PX.up=true; PX.why=PX.up?(AU_UP?"?auup=1":"sin pixelated"):"css";
  [0,1].forEach(function(i){ var cv=mkCanvas(PX.up?AUW*AUPX:AUW,PX.up?AUH*AUPX:AUH); cv.className="au-px "+(i?"R":"L"); cv.setAttribute("aria-hidden","true");
    cv.style.left=AU_LEFT[i]+"px"; cv.style.top=(AU_TOP-AU_LIFT[i]*AUPX)+"px"; cv.style.width=(AUW*AUPX)+"px"; cv.style.height=(AUH*AUPX)+"px"; if(PX.up) cv.className+=" up";
    bandsEl.appendChild(cv); PX.cv.push(cv); var S=PX.S[i];
    if(PX.up){ S.scv=tmpCanvas(AUW,AUH); S.sctx=S.scv.getContext("2d"); S.img=S.sctx.createImageData(AUW,AUH); }
    else { S.ctx=cv.getContext("2d"); S.img=S.ctx.createImageData(AUW,AUH); }
    S.out=new Uint32Array(S.img.data.buffer); }); }
function pxShow(on){ bandsEl.classList.toggle("px",!!on); }
function pxDrawAll(){ var a0=performance.now(); auDraw(PX.S[0],0); auDraw(PX.S[1],1); var ms=performance.now()-a0; PX.ms+=ms; if(ms>PX.msMax) PX.msMax=ms; }
/* la tarea del Ticker: avanza a 30 Hz (como mucho 4 fotogramas por llamada: si el TV se atasca, se ralentiza, no salta) */
function pxRun(){ var tok=++PX.tok; PX.on=true;
  tAdd(function(now){ if(tok!==PX.tok||!PX.on) return true;
    var F=Math.floor((now-PX.e0)/AUF), n=0, f0=PX.f;
    while(PX.f<F&&n<4){ PX.f++; auStep(PX.S[0]); auStep(PX.S[1]); n++; PX.steps++; }
    /* sonido: con el reloj del motor, no con un setTimeout aparte */
    if(PX.bk<0){ if(f0<AUT.ROLL&&PX.f>=AUT.ROLL) snd("authorUnroll",{dir:"open",dur:AUT.ROLL_D*AUF,hit:(AUT.ROLL_END-AUT.ROLL)*AUF}); }
    else if(f0-PX.bk<AUT.B_ROLL&&PX.f-PX.bk>=AUT.B_ROLL) snd("authorUnroll",{dir:"close",dur:AUT.B_ROLL_D*AUF,hit:AUT.B_ROLL_D*AUF});
    if(PX.f<F) PX.e0=now-PX.f*AUF;
    if(n) pxDrawAll();
    if(PX.bk<0){ if(PX.S[0].rest&&PX.S[1].rest){ PX.on=false; PX.restAt=PX.f; PX.exact=[PX.S[0].exact,PX.S[1].exact]; pxDrawAll(); if(PX.onRest) PX.onRest(); return true; } }
    else if(PX.f-PX.bk>=AUT.B_FLIP){ PX.on=false; PX.closeAt=PX.f; if(PX.onClosed) PX.onClosed(); return true; }
    return false; }); }
/* ENTRADA (auFire). Reduced-motion: el final por corte, sin partículas ni desenrollado */
function pxIn(onRest){ if(!PX.ready) return false; pxCanvases(); PX.mode="in"; PX.bk=-1; PX.f=0; PX.restAt=-1; PX.closeAt=-1; PX.onRest=onRest; PX.onClosed=null;
  auEnter(PX.S[0]); auEnter(PX.S[1]);
  if(REDUCE){ PX.f=AUT.IN_MAX; auRestSide(PX.S[0],PX.f); auRestSide(PX.S[1],PX.f); PX.S[0].exact=PX.S[1].exact=0; PX.bk=-1; pxDrawAll(); pxShow(true); PX.restAt=PX.f; return true; }
  PX.e0=performance.now(); pxDrawAll(); pxShow(true); pxRun(); return true; }
/* CIERRE (auBack): al acabar (AUT.B_FLIP) onClosed da la vuelta a las franjas */
function pxBack(onClosed){ if(!PX.ready||!PX.cv.length) return false; PX.mode="back"; PX.onClosed=onClosed; PX.onRest=null;
  var r=auRollsIn(PX.f); PX.bk=PX.f; PX.bkRoll=r?[r[0],r[1]]:null;
  auBackPlan(PX.S[0],PX.f); auBackPlan(PX.S[1],PX.f);
  PX.e0=performance.now()-PX.f*AUF; pxRun(); return true; }
function pxStop(){ PX.tok++; PX.on=false; PX.mode=""; pxShow(false); }
/* P8E.auPose(f[, b]): el fotograma f re-calculado desde 0 (determinista); con b, el cierre empezado en el fotograma b */
function pxPose(f,b){ if(!PX.ready) return null; pxCanvases(); PX.tok++; PX.on=false; PX.bk=-1; PX.f=0; auEnter(PX.S[0]); auEnter(PX.S[1]);
  var lim=(b!=null)?Math.min(f,b):f;
  while(PX.f<lim){ PX.f++; auStep(PX.S[0]); auStep(PX.S[1]); }
  if(b!=null&&f>=b){ var r=auRollsIn(PX.f); PX.bk=PX.f; PX.bkRoll=r?[r[0],r[1]]:null; auBackPlan(PX.S[0],PX.f); auBackPlan(PX.S[1],PX.f);
    while(PX.f<f){ PX.f++; auStep(PX.S[0]); auStep(PX.S[1]); } }
  pxDrawAll(); pxShow(true);
  return {f:PX.f, rest:[PX.S[0].rest,PX.S[1].rest], exact:[PX.S[0].exact,PX.S[1].exact], alive:PX.S.map(function(S){ return S.parts.filter(function(p){ return p.mode==="float"||p.mode==="fly"||p.mode==="fade"; }).length; }),
    rolls:auRolls(PX.f)}; }


function refreshArm(){ clearTimeout(IDLE.refT); IDLE.refT=setTimeout(refreshTick,WX_EVERY_MS); }
function refreshTick(){ if(!IDLE.resting||artMode||LAUNCH.phase||IDLE.state!=="on"||!netOK()) return; IDLE.refreshes++;
  var P=request();
  P.p.then(function(){ if(!IDLE.resting||IDLE.state!=="on") return;   // datos nuevos: ya los re-animó arrived()
    if(P.res&&sig(P.res)===sig(IDLE.shown)){ IDLE.shown=P.res; IDLE.shownStale=!!P.res.data.stale; setSrc(); }
    refreshArm(); }); }
function setIdle(on){ IDLE.resting=on;
  hmodeL.textContent=on?STR.modeIdle:STR.modeCorridor;
  if(on){ flatOn(); cassFlatOn(); if(!IDLE_SPIN) rich.pause();   /* v8: por defecto NO se pausa (giran en reposo) */ if(!IDLE_ART){ clearTimeout(artTimer); freezePan(); } }
  else { flatOff(); cassFlatOff(); clearTimeout(IDLE.refT); rich.resume(); if(!IDLE_ART){ artSchedule(); if(!inTransition) startPan(artIdx); } auWake(); }
  auSync(); }

/* un barrido con las franjas en pantalla: salida → (datos) → pintar → entrada */
function cycle(){ var t=++IDLE.tok; IDLE.cycles++; IDLE.state="swapping"; IDLE.phase="out"; auSync();
  if(REDUCE){ landing(t); return; }                               // reduced-motion: por corte, sin barrido
  bandsEl.classList.add("out");
  later(t,T_OUT,function(){ landing(t); }); }
function landing(t){ var P=IDLE.pend;
  if(!P||P.done){ land(t); return; }
  IDLE.landed=-t;                                                 // esperando datos (request() aterriza si llegan)
  later(t,SWAP_WAIT_MS,function(){ land(t); }); }
function land(t){ if(IDLE.tok!==t||IDLE.landed===t) return; IDLE.landed=t;
  var P=IDLE.pend, x=(P&&P.done&&P.res)?P.res:null, stale=!x;
  if(!x) x=lastFor(P?P.key:"wx");                                 // sin datos nuevos → los últimos
  if(!x||!netOK()){ auClear(); bandsEl.className="bands out info gone"; IDLE.state="off"; IDLE.phase=""; return; }
  paint(x,stale||!!x.data.stale); announce(x);
  if(REDUCE){ bandsEl.className="bands info"; IDLE.state="on"; IDLE.phase=""; auSync(); return; }
  void bandsEl.offsetWidth; bandsEl.classList.remove("out");
  IDLE.phase="in"; later(t,T_IN,function(){ IDLE.state="on"; IDLE.phase=""; if(BANDS_FLAT) bandsEl.classList.add("bst"); auSync(); }); }   // v16.11 F5
/* aria-live: el panel se anuncia la 1.ª vez que sale (como en la v2), no en cada vuelta */
function announce(x){ if(IDLE.announced||!x||x.kind!=="wx") return; IDLE.announced=true; var d=x.data;
  live.textContent=STR.liveWx(d.ciudad,Math.round(d.ahora.temp),d.ahora.desc.toLowerCase()); }
function paint(x,stale){ IDLE.shown=x; IDLE.shownStale=stale; (RENDER[x.kind]||RENDER.wx)(x.data); setSrc(); tick(); }   // tick: reloj de la franja = reloj de la barra
function ago(ts){ var m=Math.floor((Date.now()-ts)/60000); if(m<1) return "<1 min"; if(m<60) return m+" min";
  var h=Math.floor(m/60); m=m%60; if(h>=24) return Math.floor(h/24)+" d "+(h%24)+" h"; return h+" h"+(m?" "+m+" min":""); }
/* MARCA DE DATO VIEJO (v16.10, sin píldoras): el extremo derecho de la franja L1 lleva la hora cuando el dato es
   de ahora, y «UPDATED 2 H 40 MIN AGO» cuando lo que se ve es el último dato bueno (el refresco falló). Así el
   título «WEATHER NOW» nunca miente y no hace falta una píldora aparte. */
function setSrc(){ var d=IDLE.shown&&IDLE.shown.data, old=!!(IDLE.shownStale&&d&&d.ts&&(Date.now()-d.ts)>=60000);   // v6: < 1 min sigue siendo «ahora»
  var w=document.getElementById("wxWhen"); if(w) w.textContent=old?STR.wxAgo(ago(d.ts)):hhmmNow(); }

/* ---- pintar el tiempo en las 10 franjas (iconos SVG propios, trazo = color de la tinta) ---- */
var BGC={1:PAL.y,2:PAL.o,3:PAL.r,4:PAL.b,5:PAL.p};
var CL="M13 36h23a9 9 0 0 0 1-18 12 12 0 0 0-23-1 9.5 9.5 0 0 0-1 19z", CLH="M14 30h20a8 8 0 0 0 1-16 10.5 10.5 0 0 0-20-1 8.5 8.5 0 0 0-1 17z";
function rays(cx,cy,r1,r2){ var s="",i,a; for(i=0;i<8;i++){ a=i*Math.PI/4;
  s+="M"+(cx+Math.cos(a)*r1).toFixed(1)+" "+(cy+Math.sin(a)*r1).toFixed(1)+"L"+(cx+Math.cos(a)*r2).toFixed(1)+" "+(cy+Math.sin(a)*r2).toFixed(1); } return '<path d="'+s+'"/>'; }
function ico(name,bg,cls,deg){
  var g="";
  if(name==="sun") g='<circle cx="24" cy="24" r="8"/>'+rays(24,24,13,19);
  else if(name==="moon") g='<path d="M30 8a16 16 0 1 0 10 26A13 13 0 0 1 30 8z"/>';
  else if(name==="part") g='<circle cx="17" cy="17" r="6"/>'+rays(17,17,10,14)+'<path d="M16 40h19a8 8 0 0 0 1-16 10.5 10.5 0 0 0-20-1 8.5 8.5 0 0 0-1 17z" fill="'+bg+'"/>';
  else if(name==="cloud") g='<path d="'+CL+'"/>';
  else if(name==="fog") g='<path d="M8 17h32M12 25h28M8 33h32"/>';
  else if(name==="drizzle") g='<path d="'+CLH+'"/><path d="M17 37v1M25 41v1M33 37v1" stroke-width="4.4"/>';
  else if(name==="rain") g='<path d="'+CLH+'"/><path d="M18 35l-3 8M26 35l-3 8M34 35l-3 8"/>';
  else if(name==="snow") g='<path d="'+CLH+'"/><path d="M17 35v7M13.5 38.5h7M31 35v7M27.5 38.5h7"/>';
  else if(name==="storm") g='<path d="'+CLH+'"/><path d="M26 31l-6 8h7l-5 7"/>';
  else if(name==="drop") g='<path d="M24 7C24 7 13 20 13 29a11 11 0 0 0 22 0C35 20 24 7 24 7z" fill="currentColor" stroke="none"/>';
  else if(name==="arrow") g='<g transform="rotate('+(deg||0)+' 24 24)"><path d="M24 41V8M14 18l10-10 10 10"/></g>';
  else if(name==="rise") g='<path d="M6 40h36M14 40a10 10 0 0 1 20 0M24 24V7M18 13l6-6 6 6"/>';
  else if(name==="set") g='<path d="M6 40h36M14 40a10 10 0 0 1 20 0M24 7v17M18 18l6 6 6-6"/>';
  return '<svg class="'+(cls||"ic")+'" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+g+'</svg>'; }
function esc(t){ return String(t).replace(/[&<>"']/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
function deg(v){ return (v==null)?"—":(Math.round(v)+"°"); }
function pct(v){ return (v==null)?"—":(Math.round(v)+"%"); }
function lb(t,cls){ return '<span class="lb'+(cls?" "+cls:"")+'">'+t+'</span>'; }
function vv(t,cls){ return '<span class="'+(cls||"v")+'">'+t+'</span>'; }
var SP='<span class="sp"></span>';
function hhmmNow(){ var d=new Date(); return ("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2); }
function renderWx(w){
  var a=w.ahora, H=w.horas, i, mx=-1, mh="", bars="";
  for(i=0;i<H.length;i++){ if(H[i].prob>mx){ mx=H[i].prob; mh=H[i].h; }
    bars+='<i style="height:'+(10.8*(0.4+3.8*(+H[i].prob||0)/100)).toFixed(2)+'px"></i>'; }
  /* v11 (revisión de seguridad H4): defensa en profundidad. weather.js ya re-valida la caché (readLast); aquí, además, todo texto que
     va a innerHTML pasa por esc() y todo número por +x (para datos válidos, el resultado es el mismo) */
  var set=function(id,h){ document.getElementById(id).innerHTML=h; };
  /* v16.10 (decisión del autor, 2026-10-26): IZQUIERDA = clima de AHORA en 5 franjas. Fuera el pronóstico de
     3 días, el viento, el UV y el amanecer/ocaso; la atribución de Open-Meteo (CC BY 4.0) pasa a la quinta franja. */
  set("wL1",'<span class="v wxt">'+STR.wxNowBig+'</span>'+SP+'<span class="lb" id="wxWhen">'+hhmmNow()+'</span>');
  set("wL2",ico(a.icon,BGC[2])+'<span class="v city">'+esc(w.ciudad)+'</span>'+SP+vv(deg(a.temp),"vb")+lb(esc(a.desc)));
  set("wL3",lb(STR.feels)+vv(deg(a.sens))+SP+lb(STR.hum)+vv(pct(a.hum)));
  set("wL4",lb(STR.rain)+'<span class="bars">'+bars+'</span>'+SP+vv(pct(mx))+lb(mh?STR.rainAt(esc(mh)):""));
  set("wL5",lb(STR.wxSrc));
  /* DERECHA: 3 franjas de pico y placa (R1–R3) + TRM dólar y TRM euro (R4–R5). */
  pypRender(); ratesRender(); pypCheck(); ratesCheck();
}

/* ===== v16.9 · PICO Y PLACA BOGOTÁ en la franja derecha 4 (decisión de diseño: cálculo local y contraste con la fuente oficial) ======
   Ocupa el sitio de «Daylight» (amanecer/ocaso): en Bogotá (4,6° N) apenas cambian en el año; con ?pyp=0 (o sin pyp.js) vuelve.
   La regla, los festivos y el contraste con bogota.gov.co viven en pyp.js (sin DOM); aquí sólo se PINTA, con textos fijos de STR y
   dígitos: nada del texto remoto llega al DOM (de la red sólo vuelve un veredicto: ok / diff / unk).
   · restricción: [PICO Y PLACA / 6:00–21:00]  ·  NO CIRCULAN  1-2-3-4-5
   · sin medida:  SIN PICO Y PLACA HOY  ·  SÁBADO | DOMINGO | FESTIVO
   · el texto oficial de hoy NO coincide: [PICO Y PLACA / HOY]  ·  [VERIFICAR / BOGOTA.GOV.CO]  (no se afirma nada)
   Palancas: ?pyp=0 · ?pypnet=0 (sin contraste) · ?dev=1&pypnow=AAAA-MM-DD[THH:MM] (hora de Bogotá; sin contraste) para capturas. */
var PYP_ON=qp("pyp","1")!=="0"&&!!window.P8EPyP;
var PYP_NOW=DEV?qp("pypnow",""):"";
if(window.P8EPyP&&(qp("pypnet","1")==="0"||PYP_NOW)) P8EPyP.net(false);
var PYP={day:"",v:"",renders:0,checks:0,verdicts:0,ct:0,cancels:0};
function pypMs(){ var m=/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(PYP_NOW); if(!m) return Date.now();
  return Date.UTC(+m[1],+m[2]-1,+m[3],+(m[4]||12),+(m[5]||0))+5*3600000; }        // hora de Bogotá (UTC−5) → instante
/* v16.10: el pico y placa ocupa TRES franjas (decisión del autor, 2026-10-26):
   R1 «Pico y placa» · R2 «No circulan 1-2-3-4-5» · R3 «Horario pico y placa 6:00–21:00» (el rótulo en letra normal).
   Sin medida: R2 «Sin pico y placa hoy» y R3 el día (Sábado / Domingo / Festivo). Si el boletín oficial no coincide:
   R2 «Verificar» y R3 «bogota.gov.co». El texto remoto NUNCA llega aquí: sólo el veredicto (ok/diff/unk). */
function pypBands(r,v){ var T=STR.pyp, k=r.kind, title='<span class="v pypbig">'+esc(T.title)+'</span>';
  if(v==="diff") return [title,'<span class="v">'+esc(T.verify)+'</span>',lb(esc(T.where))];
  if(k==="restrict") return [title,lb(esc(T.out))+SP+vv(esc(r.out.join("-")),"vb"),
    lb(esc(T.horario))+SP+vv(esc(T.hours))];                      // v16.10: el rótulo del horario usa la MISMA tipografía que «NO CIRCULAN»/«TRM»/«FEELS LIKE» (lb)
  return [title,lb(esc(T.none)),lb(esc(k==="sat"?T.sat:k==="sun"?T.sun:T.hol))]; }
function pypRender(){ if(!PYP_ON) return false; var ms=pypMs(), r=P8EPyP.today(ms), v=P8EPyP.net()?P8EPyP.shown(ms):"", h=pypBands(r,v), i, c, ok=false;
  for(i=0;i<3;i++){ c=document.getElementById("wR"+(i+1)); if(!c) continue; c.innerHTML=h[i]; c.setAttribute("lang","es"); c.className="c pypc"; ok=true; }
  PYP.day=r.day; PYP.v=v; PYP.renders++; return ok; }
function pypCheck(){ if(!PYP_ON||!P8EPyP.net()) return; clearTimeout(PYP.ct);
  PYP.ct=setTimeout(function(){ PYP.ct=0; if(P8EPyP.check(netState()==="online",function(){ PYP.verdicts++; pypRender(); })) PYP.checks++; },1500); }
/* v16.9.1: si se navega o se abre una app antes de los 1,5 s, el contraste NO arranca (se cancela el temporizador;
   volverá a intentarlo en el siguiente reposo). Una petición ya en vuelo no se aborta: su respuesta sólo guarda un veredicto. */
function pypCancel(){ if(PYP.ct){ clearTimeout(PYP.ct); PYP.ct=0; PYP.cancels++; } }
/* a medianoche (Bogotá) la fila cambia de día sola: tick() la vuelve a pintar si el día ya no es el pintado */
function pypTick(){ if(PYP_ON&&PYP.day&&P8EPyP.today(pypMs()).day!==PYP.day) pypRender(); }

/* ===== v16.10 · TRM DÓLAR Y TRM EURO en las franjas derechas 4 y 5 (2026-10-26) =====
   Los datos y su validación viven en rates.js (sin DOM): la TRM oficial de datos.gov.co y el USD/EUR del BCE, los dos
   ya en COP. Aquí sólo se PINTA: importes a la colombiana ($3.158,43) y la fecha del dato cuando no es de hoy (el BCE
   publica una vez por día hábil; la TRM de un viernes sigue vigente el fin de semana).
   Palancas: ?rates=0 (no pinta) · ?ratesnet=0 (sin red: sólo caché). */
var RATES_ON=qp("rates","1")!=="0"&&!!window.P8ERates;
if(RATES_ON&&qp("ratesnet","1")==="0") P8ERates.net(false);
var RATES={renders:0,checks:0,cancels:0,ct:0,ok:0};
function moneyC(v){ var s=(Math.round(v*100)/100).toFixed(2).split("."), n=s[0], o="", i;
  for(i=0;i<n.length;i++){ if(i>0&&(n.length-i)%3===0) o+="."; o+=n[i]; } return "$"+o+","+s[1]; }
function rateBand(label,x){ var T=STR.rates;
  if(!x||!x.v) return lb(esc(label))+SP+vv(T.none);
  var h=lb(esc(label))+SP+vv(moneyC(x.v))+lb(T.cop);
  if(x.d!==P8ERates.todayBogota()) h+=lb(T.asOf(P8ERates.shortDate(x.d)));
  return h; }
function ratesRender(){ if(!RATES_ON) return false; var d=P8ERates.get(), a=document.getElementById("wR4"), b=document.getElementById("wR5");
  if(!a||!b) return false;
  a.innerHTML=rateBand(STR.rates.trm,d&&d.trm); b.innerHTML=rateBand(STR.rates.eur,d&&d.eur);
  a.className="c rates"; b.className="c rates"; a.setAttribute("lang","es"); b.setAttribute("lang","es");
  RATES.renders++; return true; }
/* Se refresca 2,5 s después de que el panel aparezca, y se cancela si se navega o se abre una app (el XHR en vuelo no se
   aborta: su respuesta sólo actualiza la caché y repinta si el panel sigue). */
function ratesCheck(){ if(!RATES_ON||!P8ERates.net()) return; clearTimeout(RATES.ct);
  RATES.ct=setTimeout(function(){ RATES.ct=0; if(P8ERates.refresh(function(){ RATES.ok++; ratesRender(); })) RATES.checks++; },2500); }
function ratesCancel(){ if(RATES.ct){ clearTimeout(RATES.ct); RATES.ct=0; RATES.cancels++; } }

/* ===== teclas (d-pad) ======================================================================= */
/* v11 · KeyboardEvent.key llegó en Chrome 51: el motor web del TV 2017 (Chromium M47) sólo trae keyCode. Se traduce
   aquí a los mismos nombres; si el motor sí trae key, manda key. 10009 = Back del mando de Samsung (XF86Back). */
var KC={37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",13:"Enter",27:"Escape",10009:"XF86Back",70:"f"};
function keyOf(e){ var k=e.key; return (k&&k!=="Unidentified")?k:(KC[e.keyCode]||""); }
addEventListener("keydown",function(e){ var k=keyOf(e);
  /* v15 · la intro de arranque: CUALQUIER tecla del mando la corta y va al corredor al instante (la tecla se consume) */
  if(BOOT.on){ bootSkip(); e.preventDefault(); return; }
  if(CURT.on){ e.preventDefault(); curtainOff("key"); return; }     // v16.11: cortina puesta → cualquier tecla devuelve el corredor (y nada más)
  /* v7 · abriendo una app: durante el despiece y la vuelta TODA tecla se ignora (Enter repetido no relanza,
     las flechas no navegan); en la pantalla de paso sólo Back (mando: XF86Back, keyCode 10009) o Esc vuelven. */
  if(LAUNCH.phase){ e.preventDefault();
    if(LAUNCH.phase==="open"&&isBack(e)) launchReturn("key"); else LAUNCH.ignored++;
    return; }
  IDLE.quiet=false;                                             // v6: cualquier tecla reinicia la cuenta del reposo (c)
  if(e.keyCode===10182&&window.P8EApps&&P8EApps.exitGuard&&P8EApps.exitGuard()){ e.preventDefault(); exitGuard(); return; }   // v16.7: Exit sólo llega con la palanca exitguard (registrado)
  if(artMode){ exitArtMode(); e.preventDefault(); return; }      // salvapantallas: CUALQUIER tecla sale
  if(IDLE.resting) setIdle(false);                              // v2: ninguna tecla «sólo despierta»: navega ya
  idleArm();
  if(k==="ArrowRight"){ go(idx+1,1,0.4); e.preventDefault(); }
  else if(k==="ArrowDown"){ go(idx+1,0.4,1); e.preventDefault(); }
  else if(k==="ArrowLeft"){ go(idx-1,-1,0.4); e.preventDefault(); }
  else if(k==="ArrowUp"){ go(idx-1,-0.4,-1); e.preventDefault(); }
  else if(k==="Enter"){ activate(); e.preventDefault(); }
  else if(DEV&&(k==="f"||k==="F")){ toggleFS(); e.preventDefault(); }          // v3: el mando no tiene F
  else if(DEV&&k==="Escape"){ if(document.fullscreenElement) document.exitFullscreen(); }
});
/* v16.9: sin cinta Sources ya no hay sourceKey ni se registra Source (keyCode 10072): la tecla es del TV. */
/* v16.7 · Exit con la palanca exitguard: la 1.ª pulsación sólo avisa en el rótulo («Press Exit again to close», 2,5 s); la 2.ª
   cierra la app (P8EApps.exit → getCurrentApplication().exit()). Sin la palanca Exit no se registra y el TV cierra como siempre. */
var EXITG={at:0,t:0,asks:0,exits:0};
function exitGuard(){ var A=window.P8EApps, t=Date.now();
  if(EXITG.at&&t-EXITG.at<=EXIT_GUARD_MS){ EXITG.at=0; clearTimeout(EXITG.t); EXITG.exits++; setCap(appIndex()); if(A&&A.exit) A.exit(); return; }
  EXITG.at=t; EXITG.asks++; capGo.textContent=STR.exitAgain; live.textContent=STR.exitAgain+".";
  clearTimeout(EXITG.t); EXITG.t=setTimeout(function(){ EXITG.at=0; setCap(appIndex()); },EXIT_GUARD_MS); }
/* v7: Enter. Si el corredor aún vuela (o el cassette rico no ha llegado a la card), se aplaza a settle(). */
/* v16.10 (decisión del autor): las cintas del SISTEMA (Apps, Settings, Live TV, Search) abren DIRECTO,
   sin el despiece ni la pantalla «Rewinding…» (son paneles/funciones del propio TV; la coreografía se les quedaba encima o
   colgaba). Las apps de STREAMING (Netflix, Disney+, etc.) conservan la coreografía. Clave medida en el TV: el lanzamiento
   se APLAZA un tick (setTimeout 0) — llamar a tizen.application.launch DENTRO del manejador de tecla cuelga el WRT de este
   aparato (Settings no abría y Rewind se congelaba). */
function directLaunch(app){
  LAUNCH.cine=false; curtainClear();                            // v16.10: Ajustes/Apps/Search cancelan un «cine» colgado (evita que la vuelta cine pise el lanzamiento)
  pypCancel(); ratesCancel();
  var A=window.P8EApps;
  live.textContent=STR.liveOpening(app.nm);
  if(A&&typeof A.launch==="function"){
    LAUNCH.via="adapter"; awayMark(app,"pending");
    setTimeout(function(){
      try{ A.launch(app, function(){ LAUNCH.oks++; awayMark(app,"ok"); },
                   function(err){ awayClear(); LAUNCH.fails++; LAUNCH.err=String(err&&err.message||err||"error"); live.textContent=STR.liveFail(app.nm); snd("error",{app:app.nm}); });
      }catch(e){ awayClear(); LAUNCH.fails++; LAUNCH.err=String(e&&e.message||e||"error"); live.textContent=STR.liveFail(app.nm); snd("error",{app:app.nm}); }
    }, 0);
  } else LAUNCH.via="mock";
}

function activate(){ if(LAUNCH.phase) return; var ai=appIndex(), a=APPS[ai];
  if(tw||rich.card!==cards[ai]||!rich.focused){ LAUNCH.pending=true; return; }
  if(a.art){ if(LX_ARTE&&!REDUCE&&CASS_RICH) launchStart(a,true); else enterArtMode(); return; }   // Arte: despiece → salvapantallas
  if(a.role){ directLaunch(a); return; }                       // v16.10: cintas del SISTEMA abren directo; YouTube/TizenTube conserva la coreografía pero sin tarjeta (noscreen)
  launchStart(a,false); }

/* ===== v7 · ABRIR UNA APP: el cassette se DESARMA mientras se acerca y ATRAVIESA la cámara ==========
   Decisión de diseño (2026-10-23): el cassette se desarma mientras se acerca y sale de la vista de forma dramática;
   después, paso a la app.
   · Cada capa de la pila 3D (L0–L4, los 4 cantos, los 2 carretes y los 2 anillos) tiene SU pista WAAPI de
     transform/opacity: compositor, sin rAF propio. .cass sólo recibe transform (opacity<1 en .cass aplanaría
     preserve-3d: el patrón habitual). Las transiciones CSS de .cass se anulan con .lx-run (una transición CSS
     está por ENCIMA de una animación en la cascada y taparía el despiece).
   · La cámara del despiece es la de .stage (perspective 1620 px): ninguna capa pasa de z ≈ 1340 px (detrás
     de la cámara el navegador la recortaría). El cuerpo trasero (L0) es el último en cruzar y llena el
     encuadre con su color; el velo de la pantalla de paso es ESE color: el corte entra por color.
   · Tiempos en la tabla del README (v7). LX.T = 1250 ms hasta el velo opaco; ?launchslow=N los multiplica. */
var EZ={recoil:"cubic-bezier(.3,0,.2,1)", thrw:"cubic-bezier(.55,0,.8,.2)", spin:"cubic-bezier(.33,0,.667,.333)",
        inn:"cubic-bezier(.16,1,.3,1)", lin:"linear"};
var LX={T:1250, VEIL:1100, OPEN_FADE:320, BACK_FADE:300, RM_FADE:160};
var lxEl=document.getElementById("lx"), lxVeil=document.getElementById("lxVeil"), lxCard=document.getElementById("lxCard"),
    lxNo=document.getElementById("lxNo"), lxNm=document.getElementById("lxNm"), lxLogo=document.getElementById("lxLogo"),
    lxDim=document.getElementById("lxDim"), artwrapEl=document.querySelector(".artwrap"),
    lxMsg=document.getElementById("lxMsg"), LX_MSG=lxMsg.innerHTML;     // v11: «Abriendo…» (se restaura tras un error)
function isBack(e){ var k=e.key, c=e.keyCode;
  return k==="Escape"||k==="XF86Back"||k==="GoBack"||k==="BrowserBack"||c===10009||c===27; }
/* una pista: [desde, hasta] (mismas funciones en el mismo orden: se interpolan una a una, también en M47),
   inicio y duración en ms (×LAUNCH_SLOW), curva. fill:both = antes de su inicio sostiene el reposo. */
function trk(node,kf,start,dur,ease){ if(!node||!node.animate) return null;
  var a=node.animate(kf,{delay:start*LAUNCH_SLOW,duration:dur*LAUNCH_SLOW,easing:ease||EZ.lin,fill:"both"});
  if(LAUNCH.rec) LAUNCH.specs.push({n:node,kf:kf,s:start,d:dur,e:ease||EZ.lin});   // v13: la ida se graba; la vuelta es su espejo
  LAUNCH.anims.push(a); return a; }
function px(v){ return (+v.toFixed(2))+"px"; }
function zf(base,x,y,z,rz,rx,ry){   // reposo de la capa (translateZ base) + desplazamiento del despiece
  return "translateZ("+px(base)+") translate3d("+px(x)+","+px(y)+","+px(z)+") rotateZ("+rz+"deg) rotateX("+rx+"deg) rotateY("+ry+"deg)"; }
function lxPaint(app){
  lxMsg.innerHTML=LX_MSG; lxEl.classList.remove("err");          // v11: markup fijo (no lleva datos)
  lxVeil.style.background=V3.rear(app);                       // = color del cuerpo trasero L0 (sin su alfa .92)
  lxNo.textContent=STR.paperNo+app.num; lxNm.textContent=app.nm;
  var lg=MULTI[app.logo]?logoImg[app.logo]:logoTinted(app.logo,PAL.cr), H=112;
  if(lg){ var w=Math.round(H*lg.width/lg.height); lxLogo.width=w; lxLogo.height=H; lxLogo.style.width=w+"px"; lxLogo.style.height=H+"px";
    var c=lxLogo.getContext("2d"); c.clearRect(0,0,w,H); c.drawImage(lg,0,0,w,H); lxLogo.style.display="block"; }
  else lxLogo.style.display="none"; }

/* LA COREOGRAFÍA (ms absolutos desde Enter; = tabla del README v7). Capas: [t, x, y, z, rotZ, rotX, rotY, curva al
   siguiente]; x/y/z se SUMAN al translateZ de reposo de la capa. .cass: [t, z, ΔrotX, ΔrotY, rotZ, curva, escala]
   (Δ sobre la inclinación de reposo). Giros: {t0,t1,turn (grados en t²), pos:[[t,x,y,curva],…]}. */
var POP="cubic-bezier(.16,1,.3,1)";
/* DIVE: la zambullida. La perspectiva ya acelera sola (escala = P/(P−z)); con la curva dura de salida (THROW) el
   llenado de L0 caía TODO en los últimos 50 ms (medido: 1,62× a 1150 ms → 5,59× a 1250). Con DIVE la escala crece
   ≈ ×1,3 cada 50 ms (2,2 · 3,0 · 4,0 · 5,1 a 1050–1200 ms): se lee como una carrera constante hacia el objetivo. */
var DIVE="cubic-bezier(.45,0,.6,1)";
var LXK={
  cass:[[0,0,0,0,0,EZ.recoil,1],[130,-40,-2,6,0,POP,0.96],[560,160,8,-24,0,EZ.lin,1],[640,220,8,-26,0,DIVE,1],[1250,800,-11,24,-6,EZ.lin,1]],
  L4:[[130,0,0,0,0,0,0,POP],[470,30,-70,170,-8,6,0,EZ.lin],[560,30,-70,170,-8,6,0,DIVE],[1040,260,-520,640,-30,30,-20]],
  L3:[[160,0,0,0,0,0,0,POP],[500,-6,0,100,2,0,0,EZ.lin],[620,-6,0,100,2,0,0,DIVE],[1120,-40,60,700,8,0,-14]],
  L2:[[190,0,0,0,0,0,0,POP],[530,0,0,30,-4,0,0,EZ.lin],[680,0,0,30,-4,0,0,DIVE],[1170,0,0,600,-24,0,0]],
  L1:[[220,0,0,0,0,0,0,POP],[560,0,0,-40,3,0,0,EZ.lin],[740,0,0,-40,3,0,0,DIVE],[1210,0,0,470,10,0,0]],
  L0:[[250,0,0,0,0,0,0,POP],[590,0,0,-120,0,0,0,EZ.lin],[800,0,0,-120,0,0,0,DIVE],[1250,0,0,580,0,0,0]],
  fade:{L4:[900,1040],L3:[960,1120],L2:[1040,1170],L1:[1080,1210],L0:[900,1250]},   // L0 sólo se desvanece en Arte
  ringT:{t0:190,t1:1170,turn:900, pos:[[190,0,0,POP],[530,0,-40,EZ.lin],[680,0,-40,DIVE],[1170,-30,-240]]},
  ringB:{t0:190,t1:1170,turn:900, pos:[[190,0,0,POP],[530,0,40,EZ.lin],[680,0,40,DIVE],[1170,30,260]]},
  reelT:{t0:130,t1:1210,turn:1260,pos:[[130,0,0,POP],[560,0,-30,EZ.lin],[740,0,-30,DIVE],[1210,-80,-170]]},
  reelB:{t0:130,t1:1210,turn:1260,pos:[[130,0,0,POP],[560,0,30,EZ.lin],[740,0,30,DIVE],[1210,80,190]]}
};
function trkK(node,base,K){ var t0=K[0][0], t1=K[K.length-1][0];
  trk(node,K.map(function(k){ return {transform:zf(base,k[1],k[2],k[3],k[4],k[5],k[6]),offset:(k[0]-t0)/(t1-t0),easing:k[7]||EZ.lin}; }),t0,t1-t0,EZ.lin); }
/* giro: muestreado cada 50 ms (segmentos lineales) para que el ángulo siga una sola t² aunque la posición tenga
   dos tramos con curvas distintas */
var BZ={}; function bzOf(css){ if(!BZ[css]){ var m=/cubic-bezier\(([^)]+)\)/.exec(css); if(m){ var v=m[1].split(",").map(parseFloat); BZ[css]=bez(v[0],v[1],v[2],v[3]); } else BZ[css]=function(x){ return x; }; } return BZ[css]; }
function posAt(P,t){ if(t<=P[0][0]) return [P[0][1],P[0][2]]; for(var i=0;i<P.length-1;i++){ var a=P[i], b=P[i+1];
    if(t<=b[0]){ var e=bzOf(a[3]||EZ.lin)((t-a[0])/(b[0]-a[0])); return [a[1]+(b[1]-a[1])*e,a[2]+(b[2]-a[2])*e]; } }
  var l=P[P.length-1]; return [l[1],l[2]]; }
function spinK(node,a0,G){ var kf=[], n=Math.max(2,Math.round((G.t1-G.t0)/50)), i, t, u, p;
  for(i=0;i<=n;i++){ u=i/n; t=G.t0+(G.t1-G.t0)*u; p=posAt(G.pos,t);
    kf.push({transform:"translate("+px(p[0])+","+px(p[1])+") rotate("+(a0+G.turn*u*u).toFixed(2)+"deg)",offset:u}); }
  trk(node,kf,G.t0,G.t1-G.t0,EZ.lin); }
function launchStart(app,arte){
  LAUNCH.cine=false; curtainClear();                            // v16.10: un lanzamiento normal cancela un «cine» colgado
  pypCancel(); ratesCancel();                                                                // v16.9.1/v16.10: ni el contraste ni la TRM arrancan abriendo una app
  flatOff(); cassFlatOff(); relevoFlush();                                                    // v16.1: los ítems de detrás se desvanecen en el despiece: DOM
  var ai=appIndex(), cass=rich.cass, S=LAUNCH_SLOW;
  LAUNCH.phase="out"; LAUNCH.app=app; LAUNCH.arte=arte; LAUNCH.starts++; LAUNCH.t0=performance.now(); LAUNCH.anims=[]; LAUNCH.why=""; auSync();   // v10: el reloj de la autoría se para
  LAUNCH.specs=[]; LAUNCH.arteBack=false; LAUNCH.posed=false; lxTimers(); if(!BOOT.arming) snd("launchStart",{app:app.nm,arte:arte,dur:LXK.cass[1][0]*LAUNCH_SLOW});   // v15.2: el armado de la intro no es un lanzamiento (sin su sonido)
  idleCancel(); clearTimeout(artTimer); clearTimeout(posterT);
  if(!BOOT.arming) live.textContent=arte?STR.liveSaverShort:STR.liveOpening(app.nm);
  /* congela lo vivo del cassette: armado en píxeles → nítido, giros parados (sus ángulos quedan inline) */
  stopAssemble(rich.cvRingT,rich.srcRingT); stopAssemble(rich.cvRingB,rich.srcRingB); stopAssemble(rich.cvLogo,rich.srcLogo);
  rich.pause();
  if(!BOOT.arming){ B.classList.add("launch"); if(arte) B.classList.add("launch-arte"); }   // UI fuera (transiciones CSS). v15.2: en el armado de la intro la UI NO se va: el corredor se descubre entero
  if(!arte&&!BOOT.arming) lxPaint(app);
  if(REDUCE||!CASS_RICH){ launchOpenReduced(app); return; }

  var from=getComputedStyle(cass).transform; if(!from||from==="none") from="matrix(1,0,0,1,0,0)";
  cass.classList.add("lx-run");                                 // fuera las transiciones de .cass y sus capas
  var tilt=cass.classList.contains("t-leve");
  var rx0=tilt?5:0, ry0=tilt?-16:0, cf=lxCf;
  LAUNCH.rx0=rx0; LAUNCH.ry0=ry0; LAUNCH.rec=true;              // v13: desde aquí, cada pista se graba para la vuelta
  /* v13 · sonido: los cuatro tiempos de la ida, con el mismo ×LAUNCH_SLOW que las pistas */
  /* dur ×S: la grieta = fxSeam (120–430), la zambullida = LXK.cass 640 → LX.T, el velo = LX.VEIL → LX.T */
  if(!BOOT.arming){ lxAt(130,function(){ snd("launchCrack",{app:app.nm,dur:(430-130)*S}); }); lxAt(640,function(){ snd("launchDive",{app:app.nm,dur:(LX.T-640)*S}); });
    if(!arte) lxAt(LX.VEIL,function(){ snd("launchVeil",{app:app.nm,dur:(LX.T-LX.VEIL)*S}); }); }
  /* 1 · .cass: anticipación → giro a 3/4 (la pila se ve de canto: el despiece se LEE) → se lanza a cámara */
  var C=LXK.cass, ck=[{transform:from,offset:0,easing:C[0][5]}];
  for(var j=1;j<C.length;j++) ck.push({transform:cf(C[j][1],rx0+C[j][2],ry0+C[j][3],C[j][4],C[j][6]),offset:C[j][0]/LX.T,easing:C[j][5]||EZ.lin});
  trk(cass,ck,0,LX.T,EZ.lin);
  /* 2 · cantos: se abren hacia fuera y desaparecen (dejan de casar en cuanto la pila se separa) */
  var W=rich.walls, wd=[[-70,0],[70,0],[0,-70],[0,70]], wr=["rotateY(90deg)","rotateY(90deg)","rotateX(90deg)","rotateX(90deg)"];
  W.forEach(function(w,i){
    trk(w,[{transform:"translate3d(0px,0px,0px) translateZ(-15.12px) "+wr[i],opacity:1},
           {transform:"translate3d("+wd[i][0]+"px,"+wd[i][1]+"px,0px) translateZ(-15.12px) "+wr[i],opacity:0}],130,200,EZ.thrw); });
  var drop=cards[ai].querySelector(".drop"); trk(drop,[{opacity:1},{opacity:0}],0,160,EZ.lin);
  /* 3–7 · las cinco capas: despiece (POP, escalonado de delante a atrás) → sostén → zambullida (THROW) */
  var Lz={L4:Z.sticker*10.8,L3:Z.tapa*10.8,L2:Z.ring*10.8,L1:Z.guts*10.8,L0:Z.rear*10.8},
      Ln={L4:rich.L4,L3:rich.cvTapa,L2:rich.L2,L1:rich.L1,L0:rich.cvRear};
  ["L4","L3","L2","L1","L0"].forEach(function(k){ trkK(Ln[k],Lz[k],LXK[k]);
    var f=LXK.fade[k]; if(f&&(k!=="L0"||arte)) trk(Ln[k],[{opacity:1},{opacity:0}],f[0],f[1]-f[0],EZ.lin); });
  /* anillos y carretes: se abren en vertical y giran ACELERANDO (t², desde el primer fotograma del despiece) */
  spinK(rich.cvRingT,rich.spRingT.ang,LXK.ringT); spinK(rich.cvRingB,rich.spRingB.ang,LXK.ringB);
  spinK(rich.cvReelT,rich.spReelT.ang,LXK.reelT); spinK(rich.cvReelB,rich.spReelB.ang,LXK.reelB);
  /* 8 · el resto del corredor (cassettes de detrás) se apaga: el despiece no compite con nada. v15.2: en el armado de la intro
     NO se apagan (el corredor se descubre completo) */
  if(!BOOT.arming) for(var i=0;i<N;i++){ if(i===ai||items[i].style.display==="none") continue;
    trk(items[i],[{opacity:+(items[i].style.opacity||1)},{opacity:0}],40,260,EZ.lin); }
  /* 9 · el arte: se oscurece (bajo el corredor) y la cámara empuja; Arte: oscurece y vuelve, sin empujar.
     v15.2: en el armado de la intro NO hay velo, ni oscurecido, ni empuje de cámara, ni pantalla de paso, ni portal
     (la intro ya tuvo su portal): sólo las capas que encajan + la electricidad. */
  if(arte) trk(lxDim,[{opacity:0,offset:0},{opacity:0.5,offset:0.4},{opacity:0,offset:1}],60,LX.T-60,EZ.lin);
  else if(!BOOT.arming){ if(portalReady())   // v9: con portal, el oscurecido se levanta cuando el iris ya ha tapado el arte
      trk(lxDim,[{opacity:0,offset:0,easing:EZ.recoil},{opacity:0.45,offset:0.375,easing:EZ.lin},{opacity:0,offset:1}],60,640,EZ.lin);   // .45 a 300 ms → 0 a 700
    else trk(lxDim,[{opacity:0},{opacity:0.55}],60,420,EZ.recoil);
    trk(artwrapEl,[{transform:"scale(1)"},{transform:"scale(1.08)"}],0,LX.T,EZ.thrw);
    /* 10 · el velo (color de L0) aterriza a la vez que L0 cruza la cámara */
    lxEl.classList.add("on"); lxCard.style.opacity="0";
    trk(lxVeil,[{opacity:0},{opacity:1}],LX.VEIL,LX.T-LX.VEIL,EZ.lin); }
  var master=LAUNCH.anims[0], tok=LAUNCH.starts;
  LAUNCH.rec=false;
  fxStart(app,arte);                                            // v9: electricidad (y portal en las apps): una tarea del Ticker
  LAUNCH.center=FX.center;                                      // v13: el iris de la vuelta se cierra en el mismo sitio
  if(!master){ if(arte) launchArteDone(); else launchOpen(); return; }   // sin WAAPI: directo a la pantalla de paso
  function fin(){ clearTimeout(LAUNCH.fbT); LAUNCH.fbT=0; if(LAUNCH.starts!==tok||LAUNCH.phase!=="out") return; if(arte) launchArteDone(); else launchOpen(); }
  master.onfinish=fin;
  /* v11 · RESPALDO: si onfinish no llega (la Animation de M47 no está verificada en el TV), la fase avanza igual a los
     LX.T + 400 ms; sin esto, LAUNCH.phase se quedaba en "out" y TODA tecla se ignoraba para siempre */
  clearTimeout(LAUNCH.fbT); LAUNCH.fbT=setTimeout(function(){ if(LAUNCH.starts===tok&&LAUNCH.phase==="out") LAUNCH.fallbacks++; fin(); },LX.T*S+400);
}
/* despiece acabado (velo opaco): rótulo de la pantalla de paso y ENGANCHE */
function launchOpen(){ var app=LAUNCH.app;
  LAUNCH.phase="open"; bandsHide(); fxStop();                   // v9: con el velo opaco, fuera electricidad y portal
                             // v6: sin franjas hasta el próximo reposo
  lxEl.classList.add("open");
  if(LAUNCH.app&&LAUNCH.app.noscreen&&NOSCREEN_ON){             // v16.10 CINE: desarmado+electricidad, velo sin tarjeta, y CORTE a la app (sin ciclo de vuelta → sin rebote)
    lxCard.style.opacity="0"; LAUNCH.phase=""; LAUNCH.cine=true; launchCine(app); return; }
  lxCard.style.opacity="";
  var a=lxCard.animate?lxCard.animate([{opacity:0,transform:"translateY(16px)"},{opacity:1,transform:"translateY(0px)"}],
    {duration:LX.OPEN_FADE,easing:EZ.inn,fill:"both"}):null;
  if(a) LAUNCH.anims.push(a);
  launchApp(app); }
/* v16.10 · CINE: lanza la app SIN fase de lanzamiento (así no hay «vuelta» que provoque el rebote). La vuelta es por corte. */
function launchCine(app){ LAUNCH.calls++; LAUNCH.away=false; var A=window.P8EApps; curtainClear(); CURT.t0=performance.now();
  if(A&&typeof A.launch==="function"){ LAUNCH.via="adapter"; awayMark(app,"pending");
    setTimeout(function(){
      try{ A.launch(app, function(){ LAUNCH.oks++; awayMark(app,"ok"); },
                   function(err){ awayClear(); LAUNCH.fails++; LAUNCH.err=String(err&&err.message||err||"error"); live.textContent=STR.liveFail(app.nm); cineReturn(); });
      }catch(e){ awayClear(); LAUNCH.fails++; LAUNCH.err=String(e&&e.message||e||"error"); live.textContent=STR.liveFail(app.nm); cineReturn(); }
    },0);   /* v16.11: si el lanzamiento CINE falla, cineReturn quita el velo y restaura el corredor (antes el velo quedaba puesto y las flechas movían el corredor por debajo) */
  } else LAUNCH.via="mock"; }
/* vuelta por corte del modo cine (sin animación): restaura el corredor */
function cineReturn(){ curtainClear(); if(!LAUNCH.cine) return; LAUNCH.cine=false; CURT.backs++;
  lxTimers(); launchReset(); var ai=appIndex(); rich.release(); rich.attach(cards[ai],APPS[ai]);
  lxEl.classList.remove("on"); lxEl.classList.remove("open"); lxCard.style.opacity="";
  B.classList.remove("launch"); B.classList.remove("launch-arte"); launchBackDone(); }
/* v16.11 · la cortina: CURT.t0 = el lanzamiento CINE (0 = sin ventana). Velo y corredor quedan como los dejó CINE (nada nuevo que pintar) */
function curtainClear(){ clearTimeout(CURT.tm); CURT.tm=0; CURT.on=false; CURT.t0=0; }
function lifeMark(ev){ var A=window.P8EApps; try{ if(A&&typeof A.life==="function") A.life(ev); }catch(e){} }
/* señal automática de vuelta en CINE: dentro de la ventana, la cortina (true = no hay cineReturn) */
function curtainHold(){ if(!CURTAIN_MS||!CURT.t0) return false; var age=performance.now()-CURT.t0; if(age>=CURTAIN_MS) return false;
  if(!CURT.on){ CURT.on=true; CURT.ons++; lifeMark("curtain on"); clearTimeout(CURT.tm);
    CURT.tm=setTimeout(function(){ CURT.tm=0; if(CURT.on&&LAUNCH.cine&&!document.hidden) curtainOff("timeout"); },CURTAIN_MS-age); }
  return true; }
/* Rewind oculto otra vez (TizenTube delante): la cortina se pliega sin tocar nada; la ventana (t0) sigue */
function curtainFold(){ if(!CURT.on) return; CURT.on=false; clearTimeout(CURT.tm); CURT.tm=0; }
function curtainOff(why){ CURT.offs++; CURT.why=why; lifeMark("curtain off "+why); cineReturn(); }
function cineBack(){ if(!curtainHold()) cineReturn(); }
/* reduced-motion: sin despiece ni movimiento. Fundido breve (sólo opacidad, 160 ms) a la pantalla de paso */
function launchOpenReduced(app){
  if(LAUNCH.arte){ launchArteDone(); return; }
  LAUNCH.phase="open"; bandsHide();
  lxEl.classList.add("on"); lxEl.classList.add("open"); lxVeil.style.opacity="1"; if(!(LAUNCH.app&&LAUNCH.app.noscreen&&NOSCREEN_ON)) lxCard.style.opacity="1";
  var a=lxEl.animate?lxEl.animate([{opacity:0},{opacity:1}],{duration:LX.RM_FADE,easing:EZ.lin,fill:"both"}):null;
  if(a) LAUNCH.anims.push(a);
  if(CURTAIN_MS&&LAUNCH.app&&LAUNCH.app.noscreen&&NOSCREEN_ON){ LAUNCH.phase=""; LAUNCH.cine=true; launchCine(app); return; }   // v16.11: la cortina también con movimiento reducido
  launchApp(app); }

/* ===== v7 · PUNTO DE ENGANCHE ÚNICO: abrir la app ==========================================
   En el TV (H4) lo hará el adaptador de apps: tizen.application.launch(app.appId, ok, err). El adaptador aún NO
   existe; cuando exista se publica como window.P8EApps = {launch:function(app, onOk, onErr){…}} y nada más cambia aquí.
   v11 · CONTRATO: onOk() = la app se abrió (el TV nos oculta; al volver, visibilitychange → launchReturn); onErr(e) (o
   una excepción de launch) = no se abrió: la pantalla de paso dice «No se pudo abrir X» LAUNCH_ERR_MS y vuelve sola.
   Al volver al launcher (Back en la app lanzada) el TV nos devuelve el foco: visibilitychange → launchReturn.
   En localhost (maqueta): se queda la pantalla de paso y vuelve con Esc/Back o a los LAUNCH_BACK_MS. */
function launchApp(app){ LAUNCH.calls++; LAUNCH.away=false;
  var A=window.P8EApps, tok=LAUNCH.starts;
  if(A&&typeof A.launch==="function"){ LAUNCH.via="adapter"; awayMark(app,"pending");
    try{ A.launch(app,function(){ if(tok!==LAUNCH.starts) return; LAUNCH.oks++; awayMark(app,"ok"); noShowArm(app,tok); },function(err){ awayClear(); launchFail(app,err,tok); }); }
    catch(e){ awayClear(); launchFail(app,e,tok); }
    return; }
  LAUNCH.via="mock";
  clearTimeout(LAUNCH.backT); if(LAUNCH_BACK_MS>0) LAUNCH.backT=setTimeout(function(){ launchReturn("timer"); },LAUNCH_BACK_MS); }
/* v16.7 · «p8e.away»: qué app se lanzó y cuándo. Si el TV termina Rewind al abrir otra app (la fila 5 del
   panel dice «hidden → pagehide» y nada más), al volver arrancamos en frío: con esta marca la intro sabe que es una VUELTA. Sólo el
   índice, el estado y la hora; se borra al volver en caliente (launchReturn) y al leerla en el arranque. */
function awayMark(app,st){ try{ localStorage.setItem("p8e.away",JSON.stringify({i:APPS.indexOf(app),st:st,t:Date.now()})); }catch(e){} }
function awayClear(){ try{ localStorage.removeItem("p8e.away"); }catch(e){} }
function awayRead(){ var v=null; try{ v=JSON.parse(localStorage.getItem("p8e.away")||"null"); }catch(e){} awayClear();
  if(!v||!(v.i>=0&&v.i<N)||!(v.t>0)||!AWAY_MS) return null; var age=Date.now()-v.t; return (age>=0&&age<=AWAY_MS)?{i:v.i,st:v.st,age:age}:null; }
/* v16.7 · VIGÍA: el TV respondió «ok» pero no nos ocultó en NOSHOW_MS → la app no llegó a verse (medido con el navegador): se
   dice «Couldn't open X» y se vuelve, en vez de quedarse en la pantalla de paso hasta que alguien pulse Back. */
function noShowArm(app,tok){ clearTimeout(LAUNCH.nsT); if(!NOSHOW_MS) return;
  LAUNCH.nsT=setTimeout(function(){ if(tok!==LAUNCH.starts||LAUNCH.phase!=="open"||LAUNCH.away||document.hidden) return;
    LAUNCH.noshows++; awayClear(); launchFail(app,{name:"NoShow",message:"the TV said ok but did not show "+app.nm},tok); },NOSHOW_MS); }
/* v11 · el adaptador no pudo abrir la app: lo dice la pantalla de paso (texto, sin markup) y vuelve sola */
function launchFail(app,err,tok){ if(tok!==LAUNCH.starts||LAUNCH.phase!=="open") return;
  LAUNCH.fails++; LAUNCH.err=String(err&&err.message||err||"error"); snd("error",{app:app.nm});
  lxMsg.textContent=STR.lxFail(app.nm); lxEl.classList.add("err"); live.textContent=STR.liveFail(app.nm);
  clearTimeout(LAUNCH.backT); LAUNCH.backT=setTimeout(function(){ if(tok===LAUNCH.starts) launchReturn("error"); },LAUNCH_ERR_MS); }
/* v11 · Home (o cualquier cosa que oculte la página) en pleno despiece: se aborta y se vuelve al corredor. Antes, al
   volver, el onfinish pendiente podía abrir la app que el usuario ya había dejado. */
function launchAbort(){ if(LAUNCH.phase!=="out") return; LAUNCH.aborts++; clearTimeout(LAUNCH.fbT); LAUNCH.fbT=0; LAUNCH.phase="open"; launchReturn("hidden"); }
document.addEventListener("visibilitychange",function(){
  if(document.hidden&&LAUNCH.phase==="out"){ launchAbort(); return; }
  if(document.hidden){ curtainFold(); lxAway(); return; }
  if(LAUNCH.cine){ cineBack(); return; }
  if(LAUNCH.phase==="open"&&LAUNCH.via==="adapter") launchReturn("visible"); });
/* v14 · RESPALDO DE LA VUELTA (ADR-0005 §5): qué evento llega al volver de la
   app lanzada no está medido (lo emite el WRT, binario protegido). Además de visibilitychange valen focus y pageshow, pero SÓLO
   si antes nos fuimos de verdad (hidden, blur o pagehide con la app abierta por el adaptador): un focus suelto no adelanta la
   vuelta. launchReturn sólo actúa en la fase «open»: con los tres juntos hay UNA vuelta (el primero gana, los demás no hacen
   nada). En la maqueta (via "mock") no cambia nada. */
function lxAway(){ if(LAUNCH.phase==="open"&&LAUNCH.via==="adapter"){ LAUNCH.away=true; clearTimeout(LAUNCH.nsT); lxBackMsg(); } }
/* v16.7 · al irnos, la pantalla de paso ya dice «Rewinding…»: si el TV nos reanuda con la última imagen congelada, o el usuario
   vuelve con Back, lo que se ve es el mensaje de VUELTA, no «Opening…». Un error en pantalla («Couldn't open X») no se pisa. */
function lxBackMsg(){ if(lxEl.classList.contains("err")) return; lxMsg.innerHTML=STR.lxBack; }
/* v16 · PÁGINA OCULTA (otra app delante, Home). El navegador ya para el
   rAF (el Ticker: dispersal, portal, armado) y el compositor no dibuja nada oculto, pero los RELOJES seguían: cada ART_MS
   arrancaba un relevo (decodificar y subir una textura mientras la app de delante necesita la CPU y la GPU), la textura de
   la siguiente obra se subía igual y la línea de tiempo de los giros y del paneo seguía corriendo. Ahora, al ocultarse:
   un relevo en curso se asienta por corte (el que lo vería no está), se paran los relojes del arte (relevo, salvapantallas,
   subida previa) y se PAUSAN las animaciones WAAPI de los cuatro giros y del paneo/Ken Burns. Al volver: play() desde el
   punto exacto en que se pausaron (sin saltos: mismo ángulo, mismo encuadre) y los relojes se reprograman desde cero. Sólo
   se reanuda lo que sigue siendo la animación vigente (si la vuelta de una app ya rehízo la pila, eso manda). Este
   manejador va DESPUÉS del del lanzamiento: primero se resuelve el despiece/la vuelta, luego se pausa lo que quede. */
function hidAnims(){ var r=rich, a=[r.spReelT.anim,r.spReelB.anim,r.spRingT.anim,r.spRingB.anim,panAnim].concat(CF.anims), o=[], i;
  for(i=0;i<a.length;i++) if(a[i]) o.push(a[i]); return o; }
function hidPause(){ if(HID.on) return; relevoFlush(); HID.on=true; HID.n++;
  clearTimeout(artTimer); artTimer=0; clearTimeout(artModeTimer); clearTimeout(artPreT);
  if(inTransition){ artReq++; artStop(); settleStill(artIdx); artCanvas.style.opacity="0"; if(GL&&!GL.ctx.lost) GL.ctx.clear(); HID.cut++; }
  clearTimeout(artPreT);                                              // settleStill la reprogramó
  HID.list=[]; hidAnims().forEach(function(a){ if(a.playState==="running"){ try{ a.pause(); HID.list.push(a); HID.paused++; }catch(e){} } }); }
function hidResume(){ if(!HID.on) return; HID.on=false; var now=hidAnims();
  HID.list.forEach(function(a){ if(now.indexOf(a)>=0&&a.playState==="paused"){ try{ a.play(); HID.resumed++; }catch(e){} } }); HID.list=[];
  if(artMode) saverNext(); else artSchedule(); artPrefetch(); }
document.addEventListener("visibilitychange",function(){ if(document.hidden) hidPause(); else hidResume(); });
/* ===== v16.1 (tras medir la v16 en el TV) ===========================================
   (1) MEDIDOR SIN SESGO: el panel ?diag=1 es una caja opaca de 1776×984 px que repinta su texto cada 500 ms y está en todas las
       medidas; aquí se mide con una tarea del Ticker (el MISMO rAF de siempre: no se añade otro) y, durante el banco, sin
       nada en pantalla. ?fps=1 = sólo una esquina opaca diminuta con media y 1 % low (mismo cálculo que diag.js: 1 % low =
       fps de la media del 1 % de intervalos más largos).
   (2) BANCO ?dev=1&bench=1: recorre BENCH_LIST sola, recargando la página para cada fila (estado en sessionStorage), con
       BENCH_SETTLE ms de asentamiento tras forzar el reposo y BENCH_MS ms de medida; al final enseña UNA tabla legible a 3 m
       (y la guarda en localStorage "p8e.bench"; ?dev=1&benchshow=1 la vuelve a enseñar). Sin teclas: no hacen falta.
   (3) ?flat=1 (apagada por defecto; jugada estructural): en reposo, las cards de detrás y las estrellas (todo lo quieto del
       corredor, que está DETRÁS del cassette enfocado) se dibujan una vez en UN canvas 2D recortado a lo que ocupan, y sus
       ~60 capas 3D (y las superficies de las cards) se apagan. Con el corredor quieto todas son planos paralelos a la pantalla
       (sólo rotateZ), así que su proyección es afín: la misma matemática que el CSS (perspective 900 desde el 50 % 43 %),
       pintadas de atrás adelante. Cualquier navegación, el despiece, el salvapantallas o salir del reposo vuelven al DOM ANTES
       del primer fotograma de movimiento. */
var FPS_SHOW=DEV&&qp("fps","0")==="1", FLAT=V16&&qp("flat","1")!=="0";   // v16.6: POR DEFECTO (?flat=0 lo apaga)
var FM={on:false,task:false,d:[],last:0};
function fmStart(){ FM.d=[]; FM.last=0; FM.on=true; if(FM.task) return; FM.task=true;
  tAdd(function(now){ if(!FM.on){ FM.task=false; FM.last=0; return true; } if(FM.last&&now>FM.last) FM.d.push(now-FM.last); FM.last=now;
    if(FM.d.length>3000) FM.d.shift(); return false; }); }
function fmStats(d){ var n=d.length, i, sum=0, w=0; if(n<10) return null; var a=d.slice().sort(function(x,y){ return y-x; }), k=Math.max(1,Math.round(n*0.01));
  for(i=0;i<n;i++) sum+=a[i]; for(i=0;i<k;i++) w+=a[i];
  return {n:n,avg:+(1000*n/sum).toFixed(1),low1:+(1000*k/w).toFixed(1),worst:+a[0].toFixed(0)}; }
/* ---- (1) la esquina ?fps=1: opaca, 220×44 px, arriba a la izquierda; se reescribe 1 vez por segundo (últimos 300 intervalos) */
function fpsCorner(){ if(!FPS_SHOW) return; var e=el("div","fps-corner",tv); fmStart();
  setInterval(function(){ var s=fmStats(FM.d.slice(-300)); e.textContent=s?(s.avg.toFixed(1)+" fps · 1% "+s.low1.toFixed(1)):"…"; },1000); }
/* ---- (2) el banco */
var BENCH_MS=Math.max(3000,qn("benchms",10000)), BENCH_SETTLE=Math.max(500,qn("benchsettle",2000)), BENCH_KEY="p8e.benchrun";
var BG_ALL="stars,ovl,bands,walls,hud,cards,still,cass,bg";
/* v16.2: la bisección por grupos ya está respondida (banco del TV, 2026-10-25: el cassette domina, luego las cards); quedan
   18 filas (~5 min) con lo que falta por decidir. nav = ms entre «flechas» (benchNav); rel = un relevo dentro de la medida
   (la nota enseña su perfil: P compilar programa · R portalRestore · 1º primer dibujo · g peor hueco entre fotogramas @ fase ·
   a asentar · t el fotograma tras asentar, en ms) */
/* v16.6: 22 filas (~6 min) — reposo con el nuevo defecto (cassflat + flat) y sin él, la ENTRADA en reposo (con y sin pre-horneado),
   el relevo (y dos diagnósticos: stillpre, glscale=0.5), navegar a 1,5 s y ráfaga a 0,4 s con y sin cada arreglo de navegación,
   y los suelos. = el lote «v166» de tools/remote_queue.py */
var BENCH_LIST=(function(){ var L=[
  {k:"v16.6 (defecto: cassflat + flat)",q:""},{k:"sin cassflat ni flat",q:"&cassflat=0&flat=0"},{k:"cassflat=0",q:"&cassflat=0"},{k:"flat=0",q:"&flat=0"},
  {k:"v15.2 (v16=0, relevowait=0)",q:"&v16=0&relevowait=0"},
  {k:"entrada en reposo (pre-horneado)",q:"",idleIn:1},{k:"entrada en reposo sin pre (cfpre=0)",q:"&cfpre=0",idleIn:1},
  {k:"relevo",q:"",rel:1},{k:"relevo + stillpre=1 (diag.)",q:"&stillpre=1",rel:1},{k:"relevo + glscale=0.5 (diag.)",q:"&glscale=0.5",rel:1},
  {k:"navegar 1,5 s",q:"",nav:1500},{k:"navegar 1,5 s paintcache=0",q:"&paintcache=0",nav:1500},{k:"navegar 1,5 s pcwarm=1",q:"&pcwarm=1",nav:1500},
  {k:"ida y vuelta 1,5 s",q:"",nav:1500,alt:1},{k:"ida y vuelta 1,5 s paintcache=0",q:"&paintcache=0",nav:1500,alt:1},
  {k:"navegar 1,5 s scramblehz=15 glitchlo",q:"&scramblehz=15&glitchlo=1",nav:1500},{k:"navegar 1,5 s + bg=fixed",q:"&bg=fixed",nav:1500},
  {k:"navegar 1,5 s rich=0 (diag.)",q:"&rich=0",nav:1500},{k:"navegar 1,5 s probe=stars (diag.)",q:"&probe=stars",nav:1500},
  {k:"ráfaga 0,4 s",q:"",nav:400},{k:"ráfaga 0,4 s paintcache=0",q:"&paintcache=0",nav:400},
  {k:"ráfaga 0,4 s scramblehz=15 glitchlo",q:"&scramblehz=15&glitchlo=1",nav:400},{k:"ráfaga 0,4 s relevowait=0",q:"&relevowait=0",nav:400},
  {k:"dot (suelo)",q:"&rich=0&idleart=0&probe=dot"},{k:"quieto",q:"&rich=0&idleart=0"}];
  return L; })();
function benchGet(){ try{ return JSON.parse(sessionStorage.getItem(BENCH_KEY)||"null"); }catch(e){ try{ return JSON.parse(localStorage.getItem(BENCH_KEY)||"null"); }catch(e2){ return null; } } }
function benchPut(s){ var v=JSON.stringify(s); try{ sessionStorage.setItem(BENCH_KEY,v); }catch(e){ try{ localStorage.setItem(BENCH_KEY,v); }catch(e2){} } }
function benchList(S){ return (S&&S.list)||BENCH_LIST; }
function benchUrl(i,S){ return location.pathname+"?dev=1&boot=0&idle=600000&benchrun="+i+benchList(S)[i].q; }
var REMOTE_WAIT_Q="?dev=1&boot=0&idle=600000&rich=0&idleart=0";      // la página de espera: nada se mueve
function benchStart(){
  if(!DEV) return;
  remoteOn();                                                       // v16.5: carga la clave (RK) también en las filas del lote
  if(qp("bench","0")==="1"){ var S0={i:0,t0:Date.now(),ms:BENCH_MS,settle:BENCH_SETTLE,res:[]}; benchPut(S0); location.replace(benchUrl(0,S0)); return; }
  if(qp("benchshow","0")==="1"){ var sv=null; try{ sv=JSON.parse(localStorage.getItem("p8e.bench")||"null"); }catch(e){} benchTable(sv); return; }
  var i=+qp("benchrun","-1"); if(!(i>=0)){ if(remoteOn()) remoteWait(); return; }
  var S=benchGet(); if(!S||S.i!==i){ if(remoteOn()) remoteWait(); return; }
  var L=benchList(S), cfg=L[i], MS=S.ms||BENCH_MS, SET=S.settle||BENCH_SETTLE;
  if(S.remote) addEventListener("error",function(e){ S.errs=S.errs||[]; if(S.errs.length<20) S.errs.push(("fila "+(i+1)+": "+(e&&e.message||"error")).slice(0,200)); });
  if(S.remote) remoteBadge("MIDIENDO "+(i+1)+"/"+L.length+" · "+cfg.k, true);   // v16.6: visible (estático: no cuesta por fotograma)
  setTimeout(function(){ if(!cfg.nav&&!cfg.idleIn){ idleCancel(); idleFire(); }  // reposo forzado (franjas dentro, giros y paneo como en reposo)
    setTimeout(function(){ if(cfg.rel) artAdvance(false); var tr0=ART_STATS.transitions, nv=0; fmStart(); tpReset();
      /* fila «entrada en reposo»: la medida empieza con la UI despierta y a los 2 s entra el reposo (franjas, flat y cassflat) */
      var inT=cfg.idleIn?setTimeout(function(){ idleCancel(); idleFire(); },2000):0;
      /* filas «navegar»: lo mismo que la flecha → del mando, cada cfg.nav ms (benchNav = el camino de keydown para ArrowRight) */
      var navT=cfg.nav?setInterval(function(){ benchNav(cfg.alt&&(nv%2)?-1:1); nv++; },cfg.nav):0;   // alt: ida y vuelta (→ ←)
      setTimeout(function(){ FM.on=false; TP.on=false; clearInterval(navT); clearTimeout(inT); var st=fmStats(FM.d)||{n:FM.d.length,avg:0,low1:0,worst:0};
        var pf=cfg.rel&&ART_STATS.prof, note;
        if(pf) note="P"+Math.round(pf.prog||0)+" R"+Math.round(pf.restore||0)+" 1º"+Math.round(pf.r1||0)+" g"+Math.round(pf.gap||0)+"@"+(pf.gapP||0).toFixed(2)+
          " a"+Math.round(pf.settle||0)+" t"+Math.round(pf.after||0)+(pf.pre?" pre@"+pf.pre.toFixed(2):"");
        else if(cfg.nav){ var fr=Math.max(1,TP.frames), tot=0, parts=[]; for(var tg in TP.ms){ if(Object.prototype.hasOwnProperty.call(TP.ms,tg)){ tot+=TP.ms[tg]; parts.push(tg+" "+(TP.ms[tg]/fr).toFixed(1)); } }
          note="js/fot "+(tot/fr).toFixed(1)+" ("+parts.join(" ")+") · llegada "+Math.round(TP.attach/Math.max(1,TP.attachN))+" (máx "+Math.round(TP.attachMax)+")"+(TP.preN?" · pre "+Math.round(TP.pre/TP.preN)+" (máx "+Math.round(TP.preMax)+")":"")+" · caché "+PC.hits+"/"+(PC.hits+PC.miss)+" · subidas "+ART_STATS.uploads; }
        else if(cfg.idleIn) note="entrada: cassflat "+(CF.on?CF.mode+" "+CF.bakeMs:"off")+" ms · flat "+(FL.on?FL.ms:"off")+" ms · pre "+CF.prof.preps+" (máx paso "+CF.prof.maxStep+") · golpe "+CF.prof.sync;
        else note=CF.on?("cassflat "+CF.mode+" "+CF.bakeMs+"ms"+(CF.prof.hits?" (pre)":"")):"";
        S.res.push({k:cfg.k,q:cfg.q,avg:st.avg,low1:st.low1,worst:st.worst,n:st.n,rel:ART_STATS.transitions-tr0+(inTransition?1:0),nav:nv,note:note});
        S.i=i+1; benchPut(S);
        if(S.i<L.length) location.replace(benchUrl(S.i,S));
        else { var out={when:new Date().toISOString(),ua:navigator.userAgent,win:[innerWidth,innerHeight,window.devicePixelRatio||1],ms:MS,res:S.res};
          try{ localStorage.setItem("p8e.bench",JSON.stringify(out)); }catch(e){}
          try{ sessionStorage.removeItem(BENCH_KEY); }catch(e){}
          if(S.remote){ remoteSend(remotePayload(S,out),function(){ location.replace(location.pathname+REMOTE_WAIT_Q); }); return; }
          location.replace(location.pathname+"?dev=1&boot=0&idle=600000&rich=0&idleart=0&benchshow=1"); } },MS); },SET); },1500); }
/* ===== v16.4 · BANCO REMOTO (aprobado por el autor, contrato de arquitectura). SÓLO con ?dev=1:
   ?dev=1&remote=1 lo enciende (persiste en sessionStorage "p8e.remote", como el banco; ?remote=0 lo apaga). En espera, la página
   está quieta (rich=0&idleart=0), enseña un aviso pequeño y opaco «REMOTE · esperando» y hace GET /__remote/next cada 5 s
   (mismo origen: lo sirve tools/serve_lan.py --remote; sin red externa). 204 = nada. 200 = un LOTE
     {"id","rows":[{"label","q","nav","relevo"}],"ms","settle"}
   que se valida (≤ 40 filas; q sólo [A-Za-z0-9=&.,_-] y sin tocar dev, bench…, remote, boot ni idle; nav 0–10000 ms; relevo 0|1;
   ms 3000–60000; settle 500–10000; id saneado [A-Za-z0-9_-]{1,40}) y se corre con el MISMO mecanismo de filas del banco
   (una recarga por fila, sin aviso ni panel en pantalla). Al acabar: POST /__remote/result
     {"id","ua","win":"WxHxDPR","rows":[{label,q,fps,low1,worst,note}],"errors":[…]}
   (filas rechazadas y excepciones van en errors) y vuelta a esperar. Si el POST falla 3 veces, el resultado queda en
   localStorage "p8e.remote.unsent" y se reintenta antes de pedir el siguiente lote.
   v16.5 (parche de la revisión de seguridad): CLAVE. serve_lan.py imprime al arrancar una clave (rk) y la URL del TV la lleva:
   ?dev=1&remote=1&rk=<clave> (8–64 hex). Se guarda en sessionStorage junto a p8e.remote, la URL de espera ya no la lleva, y
   cada petición la manda en la cabecera X-P8e-Remote (el servidor la compara en tiempo constante; sin ella, 403). Sin clave no
   se pregunta nada: el aviso dice «REMOTE · falta rk». nav = 0 o 200–10000 ms. */
var REMOTE_KEY="p8e.remote", REMOTE_POLL=5000, RQ_DENY=/^(dev|bench\w*|remote|boot|idle|rk)$/, RK="";
function remoteOn(){ if(!DEV) return false; var v=qp("remote",""), k=qp("rk",""), on;
  try{ if(v==="1") sessionStorage.setItem(REMOTE_KEY,"1"); else if(v==="0"){ sessionStorage.removeItem(REMOTE_KEY); sessionStorage.removeItem(REMOTE_KEY+".rk"); }
    if(/^[0-9a-f]{8,64}$/.test(k)) sessionStorage.setItem(REMOTE_KEY+".rk",k);
    on=sessionStorage.getItem(REMOTE_KEY)==="1"; RK=sessionStorage.getItem(REMOTE_KEY+".rk")||""; }
  catch(e){ on=(v==="1"); RK=/^[0-9a-f]{8,64}$/.test(k)?k:""; }
  return on; }
var RM={badge:null,t:0,polls:0,state:""};
/* v16.6: el aviso baja a 110 px del borde (en el TV la barra del navegador tapa la franja de arriba: el autor no vio
   «REMOTE · esperando» y reabrió la URL a mitad de un lote) y es más grande; mientras mide dice «MIDIENDO n/N · fila» (estático) */
function remoteBadge(txt,meas){ if(!RM.badge) RM.badge=el("div","remote-badge",tv); RM.badge.textContent=txt; RM.badge.classList.toggle("meas",!!meas); RM.state=txt; }
function remoteXhr(method,url,body,cb){ var x=new XMLHttpRequest(), done=false;
  function fin(st,txt){ if(done) return; done=true; cb(st,txt); }
  try{ x.open(method,url,true); x.timeout=4000; if(body!=null) x.setRequestHeader("Content-Type","application/json");
    x.setRequestHeader("X-P8e-Remote",RK);
    x.onreadystatechange=function(){ if(x.readyState===4) fin(x.status,x.responseText); };
    x.ontimeout=function(){ fin(0,""); }; x.onerror=function(){ fin(0,""); }; x.send(body); }catch(e){ fin(0,""); } }
function remoteSend(payload,then){ var body=JSON.stringify(payload), n=0;
  if(body.length>60000){ payload.rows.forEach(function(r){ r.note=String(r.note||"").slice(0,40); }); payload.errors=payload.errors.slice(0,5); body=JSON.stringify(payload); }
  (function tryIt(){ remoteXhr("POST","/__remote/result",body,function(st){ if(st===201||st===200){ try{ localStorage.removeItem("p8e.remote.unsent"); }catch(e){} then(true); return; }
    if(++n<3){ setTimeout(tryIt,REMOTE_POLL); return; }
    try{ localStorage.setItem("p8e.remote.unsent",body); }catch(e){} then(false); }); })(); }
function remotePayload(S,out){ return {id:S.remote.id,ua:navigator.userAgent,win:out.win[0]+"x"+out.win[1]+"x"+out.win[2],
  rows:S.res.map(function(r){ return {label:r.k,q:String(r.q||"").replace(/^&/,""),fps:r.avg,low1:r.low1,worst:r.worst,
    note:((r.nav?((r.rel||0)+"·"+r.nav+" nav"):(r.rel?r.rel+" relevo":""))+(r.note?" · "+r.note:"")).replace(/^ · /,"")}; }),
  errors:(S.rerr||[]).concat(S.errs||[])}; }
function remoteParse(txt){ var o, errs=[], rows=[];
  try{ o=JSON.parse(txt); }catch(e){ return {err:"lote: JSON no válido"}; }
  if(!o||typeof o!=="object"||!(o.rows instanceof Array)) return {err:"lote: falta rows"};
  var id=String(o.id==null?"":o.id).replace(/[^A-Za-z0-9_-]/g,"").slice(0,40)||"sin-id";
  o.rows.slice(0,40).forEach(function(r,i){ var q=String(r&&r.q!=null?r.q:"").replace(/^[?&]/,""), nav=+((r&&r.nav)||0), rel=+((r&&r.relevo)||0), rep=+((r&&r.reposo)||0), alt=+((r&&r.alterna)||0), bad="";
    if(q.length>300||!/^[A-Za-z0-9=&.,_-]*$/.test(q)) bad="q con caracteres no permitidos";
    else if(q&&q.split("&").some(function(kv){ return RQ_DENY.test(kv.split("=")[0]); })) bad="q toca un parámetro reservado (dev/bench/remote/boot/idle)";
    else if(!(nav===0||(nav>=200&&nav<=10000))) bad="nav no es 0 ni 200–10000";
    else if(rel!==0&&rel!==1) bad="relevo no es 0|1";
    else if(rep!==0&&rep!==1) bad="reposo no es 0|1";
    else if(alt!==0&&alt!==1) bad="alterna no es 0|1";
    if(bad){ errs.push("fila "+(i+1)+" rechazada: "+bad); return; }
    rows.push({k:String(r.label==null?("fila "+(i+1)):r.label).slice(0,80),q:q?"&"+q:"",nav:Math.round(nav),rel:rel,idleIn:rep,alt:alt}); });   // v16.6: reposo = entrada en reposo
  if(o.rows.length>40) errs.push("lote: más de 40 filas; sólo se corren 40");
  var ms=+o.ms, se=+o.settle;
  return {id:id,rows:rows,errs:errs,ms:isFinite(ms)?Math.max(3000,Math.min(60000,ms)):BENCH_MS,settle:isFinite(se)?Math.max(500,Math.min(10000,se)):BENCH_SETTLE}; }
function remoteWait(){
  /* v16.6: si la página de espera se abre con un lote a medias (el TV recargó la URL), se RETOMA en la fila que se cortó */
  var S0=benchGet(); if(S0&&S0.remote&&S0.list&&S0.i<S0.list.length){
    if((S0.resumed||0)>=3){ try{ sessionStorage.removeItem(BENCH_KEY); }catch(e){}   // retomado 3 veces: se envía lo medido y se espera
      S0.rerr=(S0.rerr||[]).concat(["lote cortado en la fila "+(S0.i+1)+" tras 3 intentos: se envía lo medido"]);
      remoteSend(remotePayload(S0,{win:[innerWidth,innerHeight,window.devicePixelRatio||1]}),function(){ location.replace(location.pathname+REMOTE_WAIT_Q); }); return; }
    S0.resumed=(S0.resumed||0)+1; S0.rerr=(S0.rerr||[]).concat(["lote retomado en la fila "+(S0.i+1)]); benchPut(S0); location.replace(benchUrl(S0.i,S0)); return; }
  if(!/[?&]rich=0/.test(location.search)||!/[?&]idleart=0/.test(location.search)){ location.replace(location.pathname+REMOTE_WAIT_Q); return; }   // espera quieta
  if(!RK){ remoteBadge("REMOTE · falta rk"); return; }                  // sin la clave del servidor no se pregunta nada
  remoteBadge("REMOTE · esperando");
  var un=null; try{ un=localStorage.getItem("p8e.remote.unsent"); }catch(e){}
  if(un){ remoteBadge("REMOTE · reenviando"); remoteXhr("POST","/__remote/result",un,function(st){ if(st===201||st===200){ try{ localStorage.removeItem("p8e.remote.unsent"); }catch(e){} }
      remoteBadge(st===201||st===200?"REMOTE · esperando":"REMOTE · error al enviar (guardado)"); RM.t=setTimeout(remotePoll,REMOTE_POLL); }); return; }
  RM.t=setTimeout(remotePoll,1000); }
function remotePoll(){ RM.polls++;
  remoteXhr("GET","/__remote/next",null,function(st,txt){
    if(st===403||st===421){ remoteBadge("REMOTE · clave rechazada: abre la URL que imprime serve_lan"); return; }   // v16.6 (N4): no se insiste
    if(st!==200){ RM.t=setTimeout(remotePoll,REMOTE_POLL); return; }
    var J=remoteParse(txt);
    if(J.err){ remoteSend({id:"sin-id",ua:navigator.userAgent,win:innerWidth+"x"+innerHeight+"x"+(window.devicePixelRatio||1),rows:[],errors:[J.err]},function(){ RM.t=setTimeout(remotePoll,REMOTE_POLL); }); return; }
    if(!J.rows.length){ remoteSend({id:J.id,ua:navigator.userAgent,win:innerWidth+"x"+innerHeight+"x"+(window.devicePixelRatio||1),rows:[],errors:J.errs.concat(["lote: ninguna fila válida"])},function(){ RM.t=setTimeout(remotePoll,REMOTE_POLL); }); return; }
    remoteBadge("REMOTE · lote "+J.id);
    var S={i:0,t0:Date.now(),ms:J.ms,settle:J.settle,res:[],list:J.rows,remote:{id:J.id},rerr:J.errs,errs:[]}; benchPut(S);
    setTimeout(function(){ location.replace(benchUrl(0,S)); },300); }); }
/* el camino de la flecha → del keydown (sin el evento: en M47 un KeyboardEvent sintético llega con keyCode 0) */
function benchNav(d){ if(BOOT.on||LAUNCH.phase) return; IDLE.quiet=false; if(artMode){ exitArtMode(); return; }
  if(IDLE.resting) setIdle(false); idleArm(); d=d||1; go(idx+d,d,0.4); }   // = keydown ArrowRight (go(idx+1,1,0.4)) / ArrowLeft
/* la tabla final: opaca, a pantalla completa, nada se mueve detrás (rich=0&idleart=0); 30 filas a 26 px */
function benchTable(o){ var d=el("div","bench-t",tv), h="";
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]; }); }
  if(!o||!o.res){ d.textContent="BENCH: no hay resultados guardados (?dev=1&bench=1)"; return; }
  var m=/Chrome\/[\d.]+/.exec(o.ua||""), base=o.res[0]&&o.res[0].avg;
  h+='<div class="bh">P8e v16.6 · BENCH · '+esc(o.when.slice(0,16).replace("T"," "))+' UTC · '+esc(m?m[0]:"")+' · ventana '+esc(o.win.join("×"))+
     ' · '+(o.ms/1000)+' s por fila, sin panel</div><table><tr><th>#</th><th>configuración</th><th>fps</th><th>1% low</th><th>peor ms</th><th>relevos·nav · nota</th></tr>';
  o.res.forEach(function(r,i){ var rn=r.nav?((r.rel||0)+"·"+r.nav):(r.rel?String(r.rel):"");
    h+='<tr><td>'+(i+1)+'</td><td>'+esc(r.k)+'</td><td class="n">'+r.avg.toFixed(1)+'</td><td class="n">'+r.low1.toFixed(1)+
    '</td><td class="n">'+r.worst+'</td><td class="x">'+esc(rn+(rn&&r.note?" · ":"")+(r.note||""))+'</td></tr>'; });
  d.innerHTML=h+'</table>'; if(base) d.setAttribute("data-base",base); }
/* ---- (3) ?flat=1: el corredor quieto en UN canvas */
var FL={on:false,cv:null,n:0,hid:[],err:""};
function mx(s){ var m=/matrix(3d)?\(([^)]+)\)/.exec(s||""); if(!m) return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
  var v=m[2].split(",").map(parseFloat); if(!m[1]) return [v[0],v[1],0,0, v[2],v[3],0,0, 0,0,1,0, v[4],v[5],0,1]; return v; }
function flatPt(M,o){ return function(x,y){ var q=mxApply(M,x-o[0],y-o[1],-(o[2]||0)); return [q[0]/q[3]+o[0], q[1]/q[3]+o[1], q[2]/q[3]+(o[2]||0)]; }; }
function mxApply(M,x,y,z){ return [M[0]*x+M[4]*y+M[8]*z+M[12], M[1]*x+M[5]*y+M[9]*z+M[13], M[2]*x+M[6]*y+M[10]*z+M[14], M[3]*x+M[7]*y+M[11]*z+M[15]]; }
function flatOn(){
  if(!FLAT||FL.on||REDUCE||tw||LAUNCH.phase||artMode||(BOOT&&BOOT.on)) return;
  FL.t0=performance.now();
  try{
    var vs=getComputedStyle(viewport), P=parseFloat(vs.perspective), po=(vs.perspectiveOrigin||"").split(" ").map(parseFloat);
    var Wm=mx(getComputedStyle(world).transform), wx=world.offsetLeft, wy=world.offsetTop, i, k;
    for(k=0;k<16;k++) if(Math.abs(Wm[k]-((k%5===0)?1:0))>1e-6){ FL.err="world en movimiento"; return; }   // en reposo es la identidad
    if(!(P>0)||po.length<2){ FL.err="perspectiva"; return; }
    var proj=function(x,y,z){ var s=P/(P-z); return [po[0]+(wx+x-po[0])*s, po[1]+(wy+y-po[1])*s]; };
    var draws=[], ai=appIndex();
    for(i=0;i<N;i++){ var it=items[i]; if(i===ai||it.style.display==="none") continue;
      var cs=getComputedStyle(it), M=mx(cs.transform), o=cs.transformOrigin.split(" ").map(parseFloat), op=+(it.style.opacity||1);
      var itemPt=flatPt(M,o);
      var cw=cards[i].offsetWidth, ch=cards[i].offsetHeight, c0=itemPt(-cw/2,-ch/2), c1=itemPt(cw/2,-ch/2), c2=itemPt(-cw/2,ch/2);
      if(Math.abs(c0[2]-c1[2])>0.01||Math.abs(c0[2]-c2[2])>0.01||c0[2]>=0){ FL.err="card no paralela o delante"; return; }
      var p0=proj(c0[0],c0[1],c0[2]), p1=proj(c1[0],c1[1],c1[2]), p2=proj(c2[0],c2[1],c2[2]);
      draws.push({z:c0[2],kind:"card",i:i,op:op,cw:cw,ch:ch,a:(p1[0]-p0[0])/cw,b:(p1[1]-p0[1])/cw,c:(p2[0]-p0[0])/ch,d:(p2[1]-p0[1])/ch,e:p0[0],f:p0[1]}); }
    var front=[];
    for(i=0;i<stars.length;i++){ var sp=stars[i], se=sp.el; if(se.style.display==="none") continue;
      var vz=((sp.z+camZ)%LOOP+LOOP)%LOOP; if(vz>350) vz-=LOOP;
      if(vz>=0){ front.push(se); continue; }                          // delante del cassette: se queda en el DOM
      var sz=se.offsetWidth, ctr=proj(sp.x+sz/2,sp.y+sz/2,vz), sc=P/(P-vz);
      draws.push({z:vz,kind:"star",el:se,x:ctr[0],y:ctr[1],r:sz*sc/2,col:STAR_COL[i%3],round:(i%2)===1,op:+(se.style.opacity||1)}); }   // = la creación de las estrellas
    draws.sort(function(p,q){ return p.z-q.z; });                      // de atrás adelante
    /* caja: lo que ocupan (cards con su sombra, estrellas) */
    var x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    var grow=function(x,y){ if(x<x0)x0=x; if(y<y0)y0=y; if(x>x1)x1=x; if(y>y1)y1=y; };
    draws.forEach(function(r){ if(r.kind==="star"){ grow(r.x-r.r-2,r.y-r.r-2); grow(r.x+r.r+2,r.y+r.r+2); return; }
      var pts=[[-0.02*r.cw,-0.02*r.ch],[1.02*r.cw,-0.02*r.ch],[-0.02*r.cw,r.ch+40],[1.02*r.cw,r.ch+40]];
      pts.forEach(function(p){ grow(r.a*p[0]+r.c*p[1]+r.e, r.b*p[0]+r.d*p[1]+r.f); }); });
    x0=Math.max(0,Math.floor(x0)); y0=Math.max(0,Math.floor(y0)); x1=Math.min(STAGE_W,Math.ceil(x1)); y1=Math.min(STAGE_H,Math.ceil(y1));
    if(!draws.length||x1<=x0||y1<=y0){ FL.err="nada que aplanar"; return; }
    var cv=FL.cv; if(!cv){ cv=FL.cv=mkCanvas(); cv.className="corr-flat"; viewport.insertBefore(cv,world); }
    cv.width=x1-x0; cv.height=y1-y0; cv.style.left=x0+"px"; cv.style.top=y0+"px"; cv.style.width=(x1-x0)+"px"; cv.style.height=(y1-y0)+"px";
    var c=cv.getContext("2d"); c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,cv.width,cv.height);
    draws.forEach(function(r){
      if(r.kind==="star"){ c.setTransform(1,0,0,1,-x0,-y0); c.globalAlpha=r.op; c.fillStyle=r.col; c.beginPath();
        if(r.round) c.arc(r.x,r.y,r.r,0,6.2832); else c.rect(r.x-r.r,r.y-r.r,2*r.r,2*r.r); c.fill(); c.globalAlpha=1; return; }
      /* card: sombra (.drop, radial-gradient ellipse farthest-corner, .55 → 0 al 70 %) y el canvas lite (102 %, -1 %), con la
         opacidad del .item como GRUPO (un canvas intermedio si < 1, como la superficie de la card) */
      var tgt=c, tmp=null;
      if(r.op<1){ tmp=tmpCanvas(cv.width,cv.height); tgt=tmp.getContext("2d"); }
      tgt.setTransform(r.a,r.b,r.c,r.d,r.e-x0,r.f-y0);
      var dw=r.cw*0.92, dh=58.32, dx=r.cw*0.04, dy=r.ch+34.56-dh, rx=dw/2*Math.SQRT2, ry=dh/2*Math.SQRT2;
      tgt.save(); tgt.translate(dx+dw/2,dy+dh/2); tgt.scale(rx,ry); var g=tgt.createRadialGradient(0,0,0,0,0,1);
      g.addColorStop(0,"rgba(0,0,0,0.55)"); g.addColorStop(0.7,"rgba(0,0,0,0)"); tgt.fillStyle=g; tgt.fillRect(-dw/2/rx,-dh/2/ry,dw/rx,dh/ry); tgt.restore();
      tgt.drawImage(lites[r.i],-0.01*r.cw,-0.01*r.ch,1.02*r.cw,1.02*r.ch);
      if(tmp){ c.setTransform(1,0,0,1,0,0); c.globalAlpha=r.op; c.drawImage(tmp,0,0); c.globalAlpha=1; } });
    FL.hid=[]; draws.forEach(function(r){ var e=(r.kind==="card")?items[r.i]:r.el; e.classList.add("flatd"); FL.hid.push(e); });
    cv.style.display="block"; FL.on=true; FL.n++; FL.err=""; FL.ms=Math.round(performance.now()-FL.t0);
  }catch(e){ FL.err=String(e&&e.message||e).slice(0,120); flatOff(); } }
/* ===== v16.2 · ?cassflat (decisión del autor: ni vídeo ni tiras de fotogramas, hornear en
   runtime). El banco del TV: la pila 3D del cassette es el coste dominante AUNQUE esté quieta (dot sólo con ella 42,8 fps; sin
   ella 47). En REPOSO (el armado, el despiece y la vuelta siguen en el DOM 3D de siempre) el cassette se re-monta PLANO, sin
   contexto 3D, sin ordenación BSP y sin superficies, en una capa 2D (.cflat) encima del corredor, con el MISMO dibujo:
     · ATRÁS  = cuerpo trasero (L0) + chasis (L1), horneados en UN canvas a su proyección exacta;
     · los 4 cantos: copias de sus <div> (mismo fondo CSS), cada uno con su matrix3d (perspectiva incluida);
     · bobinas y anillos: copias de sus canvas, cada una dentro de un envoltorio con la matrix3d de su plano, girando con la
       MISMA animación WAAPI y el mismo currentTime que la original (siguen sincronizadas: misma línea de tiempo);
     · DELANTE = tapa (L3) + montura y logo (L4), horneados en otro canvas;
     · las estrellas que en el 3D quedaban por DELANTE del cassette y lo tocan, copiadas encima.
   El orden (atrás → cantos → bobinas → anillos → delante) es el que da la ordenación 3D en reposo: los cantos sólo se cruzan con el
   cuerpo trasero y con zonas TRANSPARENTES del chasis (comprobado por geometría: README, v16.2). Las matrices se LEEN del estilo
   calculado (perspective 1620 de .stage, inclinación de .cass, translateZ de cada capa) y se componen igual que el CSS. El
   horneado lo hace el contexto WebGL1 ÚNICO del arte en un framebuffer aparte (FBO; el canvas visible ni se toca), con muestreo
   bilineal como el compositor y 2 px de margen transparente para que los bordes salgan suavizados; readPixels → canvas 2D.
   ?cassflat=1 (horneado) · ?cassflat=dom (sin hornear: cada capa quieta como copia plana con su matrix3d; respaldo sin WebGL) ·
   por defecto APAGADA hasta que el banco del TV diga cuánto gana. Se deshace ANTES del primer fotograma de navegar, abrir
   una app, el salvapantallas o salir del reposo (la pila 3D original nunca dejó de girar: sólo estaba oculta). */
var CASS_FLAT=(function(v){ return v==="1"||v==="dom"?v:""; })(qp("cassflat",V16?"1":"0"));   // v16.6: POR DEFECTO (?cassflat=0 lo apaga)
var CF={on:false,el:null,anims:[],hid:[],n:0,err:"",mode:"",bakeMs:0,retry:0};
function m4mul(a,b){ var r=new Array(16), i, j; for(i=0;i<4;i++) for(j=0;j<4;j++) r[j*4+i]=a[i]*b[j*4]+a[4+i]*b[j*4+1]+a[8+i]*b[j*4+2]+a[12+i]*b[j*4+3]; return r; }
function m4T(x,y,z){ return [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z||0,1]; }
function m4P(d){ return [1,0,0,0, 0,1,0,0, 0,0,1,-1/d, 0,0,0,1]; }
function m4local(e,own){ var cs=getComputedStyle(e), M=m4T(e.offsetLeft,e.offsetTop,0);
  if(own&&cs.transform&&cs.transform!=="none"){ var o=cs.transformOrigin.split(" ").map(parseFloat); o[2]=o[2]||0;
    M=m4mul(M,m4mul(m4T(o[0],o[1],o[2]),m4mul(mx(cs.transform),m4T(-o[0],-o[1],-o[2])))); }
  return M; }
function m4css(M){ return "matrix3d("+M.map(function(v){ return +v.toFixed(8); }).join(",")+")"; }
function m4pt(M,x,y){ var w=M[3]*x+M[7]*y+M[15]; return [(M[0]*x+M[4]*y+M[12])/w,(M[1]*x+M[5]*y+M[13])/w]; }
/* card-local (homogéneo) de un elemento de la pila: .stage (perspectiva) × .cass (inclinación) × capa × [elemento sin su giro] */
function cfMatrix(e,own){ var r=rich, st=r.stage, ss=getComputedStyle(st), d=parseFloat(ss.perspective), po=ss.perspectiveOrigin.split(" ").map(parseFloat);
  var P=m4mul(m4T(st.offsetLeft,st.offsetTop,0),m4mul(m4T(po[0],po[1],0),m4mul(m4P(d),m4T(-po[0],-po[1],0))));
  var M=m4mul(P,m4local(r.cass,true)); if(e.parentNode!==r.cass) M=m4mul(M,m4local(e.parentNode,true)); return m4mul(M,m4local(e,own)); }
/* horneado de varias capas (canvas) en UN canvas 2D en coordenadas de la card: FBO del contexto del arte → readPixels */
var CF_VS="attribute vec2 position; attribute vec2 uv; uniform mat4 uM; uniform vec4 uBox; varying vec2 vUv;\n"+
  "void main(){ vUv=uv; vec4 p=uM*vec4(position,0.0,1.0);\n"+
  "  gl_Position=vec4(2.0*(p.x-uBox.x*p.w)/uBox.z-p.w, 2.0*(p.y-uBox.y*p.w)/uBox.w-p.w, 0.0, p.w); }";
var CF_FS="uniform sampler2D uTex; varying vec2 vUv; void main(){ vec4 c=texture2D(uTex,vUv); gl_FragColor=vec4(c.rgb*c.a,c.a); }";
/* v16.6 · el horneado POR PASOS. En el TV, hornear de golpe al entrar en reposo costaba ~650 ms (banco v16.5).
   Ahora es un trabajo en pasos (una capa subida por paso; dibujar + readPixels; volcar al canvas 2D) que: (a) se hace DE ANTEMANO
   (cfPrepSoon: CF_PRE_MS después de llegar a una app, con el corredor quieto), un paso por tarea (CF_STEP_MS entre pasos), y se
   guarda por app (LRU de 3); (b) al entrar en reposo sólo se monta el DOM con lo ya horneado. Si no está listo, se hornea de
   golpe como en la v16.5. CF.prof guarda el peor paso y el total (el banco los enseña). ?cfpre=0 = como la v16.5. */
/* v16.7 · con el reposo a 3 s (antes 20 s) el pre-horneado tiene que acabar ANTES: arranca a CF_PRE_MS = 600 ms
   (antes 2600), si el cassette aún se arma lo reintenta cada 200 ms (antes 800) y, si el reposo llega con el horneado a medias,
   cassFlatOn ESPERA a que acabe en vez de hornear de golpe (el parón de ~650 ms medido en el TV). ?cfprems=ms para medirlo. */
var CF_PRE=V16&&qp("cfpre","1")!=="0", CF_PRE_MS=Math.max(0,qn("cfprems",600)), CF_STEP_MS=60, CF_RETRY_MS=200;
function cfJob(list,box){ return {list:list,box:box,tx:[],i:0,px:null,out:null,err:"",gen:GL?GL.ctx.gen:-1}; }
/* las texturas del horneado son temporales y van FUERA de la cuenta del LRU del arte (gl.js stats): se crean y borran aquí */
function cfFree(J){ if(!J) return; if(GL&&!GL.ctx.lost&&J.gen===GL.ctx.gen) J.tx.forEach(function(t){ if(t.t) GL.ctx.gl.deleteTexture(t.t); t.t=null; }); J.tx=[]; }
function cfTex(c,img){ var gl=c.gl, t=gl.createTexture(); if(!t) return null;
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,t);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false); gl.pixelStorei(gl.UNPACK_ALIGNMENT,4);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.BROWSER_DEFAULT_WEBGL);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D,null); return {t:t,gen:c.gen}; }
/* un paso; true cuando acaba (J.out = canvas, o J.err) */
function cfStep(J){
  initGL(); if(!GL||GL.ctx.lost||J.gen!==GL.ctx.gen){ J.err="gl"; return true; } var c=GL.ctx, gl=c.gl, box=J.box, W=box[2], H=box[3];
  if(!CF.prog||CF.prog.gen!==c.gen){ CF.prog=c.program("cassflat",CF_VS,CF_FS); } if(!CF.prog){ J.err="prog"; return true; }
  if(J.i<J.list.length){ var L=J.list[J.i++], sc=L.cv, PAD=2, pc=tmpCanvas(sc.width+2*PAD,sc.height+2*PAD);
    pc.getContext("2d").drawImage(sc,PAD,PAD); var t=cfTex(c,pc); if(!t){ J.err="tex"; return true; } J.tx.push(t); return false; }
  if(!J.px){ var tex=gl.createTexture(), fb=gl.createFramebuffer(), bufs=[];
    try{
      gl.bindTexture(gl.TEXTURE_2D,tex); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,W,H,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER,fb); gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);
      if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE) throw new Error("fbo");
      gl.viewport(0,0,W,H); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND); gl.blendEquation(gl.FUNC_ADD); gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);   // «over» premultiplicado
      J.list.forEach(function(L,k){ var sc=L.cv, w=sc.offsetWidth, h=sc.offsetHeight, PAD=2, px=PAD*w/sc.width, py=PAD*h/sc.height;   // el margen, en px CSS
        var pos=c.buffer(new Float32Array([-px,-py, w+px,-py, -px,h+py, w+px,h+py])), uv=c.buffer(new Float32Array([0,1, 1,1, 0,0, 1,0])); bufs.push(pos,uv);
        c.draw(CF.prog,{position:[pos,2],uv:[uv,2]},{uM:new Float32Array(L.M),uBox:[box[0],box[1],W,H],uTex:J.tx[k]},gl.TRIANGLE_STRIP,4); });
      J.px=new Uint8Array(W*H*4); gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,J.px);
    }catch(e){ J.err="bake: "+String(e&&e.message||e).slice(0,80); }
    gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.deleteFramebuffer(fb); gl.deleteTexture(tex); bufs.forEach(function(b){ c.delBuffer(b); });
    glSizeArt(); if(GL.portal&&GL.portal.sized) GL.portal.sized=false;   // el viewport vuelve al del canvas (el portal lo re-dimensiona si lo usa)
    c.blendNormal(); c.cur=null; cfFree(J); return !!J.err; }
  var out=mkCanvas(W,H), cx=out.getContext("2d"), id=cx.createImageData(W,H), d=id.data, px2=J.px, q, a;
  for(q=0;q<px2.length;q+=4){ a=px2[q+3]; if(!a) continue; d[q]=Math.min(255,Math.round(px2[q]*255/a)); d[q+1]=Math.min(255,Math.round(px2[q+1]*255/a)); d[q+2]=Math.min(255,Math.round(px2[q+2]*255/a)); d[q+3]=a; }
  cx.putImageData(id,0,0); J.out=out; J.px=null; return true; }
function cfBake(list,box){ var J=cfJob(list,box); while(!cfStep(J)){} if(J.err){ CF.err=J.err; cfFree(J); return null; } return J.out; }
/* lo que define el horneado: la app, la escala y la inclinación de .cass (en reposo, la de t-leve) */
function cfKey(){ var r=rich; return r.app?(r.app.nm+"|"+r.k+"|"+getComputedStyle(r.cass).transform):""; }
CF.cache={}; CF.order=[]; CF.job=null; CF.prepT=0; CF.waits=0; CF.prof={prepMs:0,maxStep:0,steps:0,preps:0,hits:0,sync:0};
function cfCacheGet(key){ var e=CF.cache[key]; if(e){ CF.order.splice(CF.order.indexOf(key),1); CF.order.push(key); } return e||null; }
function cfCachePut(key,e){ if(!CF.cache[key]) CF.order.push(key); CF.cache[key]=e; while(CF.order.length>3) delete CF.cache[CF.order.shift()]; }
function cfLists(){ var r=rich, back=[{cv:r.cvRear},{cv:r.cvChassis}], front=[{cv:r.cvTapa},{cv:r.cvMount},{cv:r.cvLogo}];
  back.concat(front).forEach(function(L){ L.M=cfMatrix(L.cv,true); }); return {back:back,front:front}; }
function cfPrepAbort(){ if(CF.job){ CF.job.jobs.forEach(cfFree); CF.job=null; } }
function cfPrepSoon(){ clearTimeout(CF.prepT); if(CASS_FLAT!=="1"||!CF_PRE||REDUCE||!CASS_RICH) return; CF.prepT=setTimeout(cfPrep,CF_PRE_MS); }
function cfPrep(){
  var r=rich, ai=appIndex();
  if(CF.on||CF.job) return;
  if(tw||LAUNCH.phase||artMode||(BOOT&&BOOT.on)||inTransition||!r.focused||r.card!==cards[ai]||r.cvRingT._job||r.cvRingB._job||r.cvLogo._job||
     [r.spReelT,r.spReelB,r.spRingT,r.spRingB].some(function(x){ return x.phase===1; })){ CF.prepT=setTimeout(cfPrep,CF_RETRY_MS); return; }
  var key=cfKey(); if(!key||cfCacheGet(key)) return;
  var Ls=cfLists(), jb=cfJob(Ls.back,cfBox(Ls.back)), jf=cfJob(Ls.front,cfBox(Ls.front)), JB={key:key,jobs:[jb,jf],k:0,t:0,max:0,n:0};
  CF.job=JB;
  (function next(){ if(CF.job!==JB) return;
    if(tw||LAUNCH.phase||artMode||inTransition||cfKey()!==key){ cfPrepAbort(); return; }   // algo se movió: se descarta
    var J=JB.jobs[JB.k], t0=performance.now(), fin=cfStep(J), dt=performance.now()-t0; JB.t+=dt; JB.n++; if(dt>JB.max) JB.max=dt;
    if(fin){ if(J.err){ CF.err=J.err; cfPrepAbort(); return; } JB.k++; }
    if(JB.k<JB.jobs.length){ CF.prepT=setTimeout(next,CF_STEP_MS); return; }
    cfCachePut(key,{back:jb.out,bbox:jb.box,front:jf.out,fbox:jf.box}); CF.job=null;
    CF.prof.prepMs=Math.round(JB.t); CF.prof.maxStep=Math.round(JB.max); CF.prof.steps=JB.n; CF.prof.preps++; })(); }
function cfBox(list){ var x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; list.forEach(function(L){ var w=L.cv.offsetWidth, h=L.cv.offsetHeight;
    [[-3,-3],[w+3,-3],[-3,h+3],[w+3,h+3]].forEach(function(p){ var q=m4pt(L.M,p[0],p[1]); x0=Math.min(x0,q[0]); y0=Math.min(y0,q[1]); x1=Math.max(x1,q[0]); y1=Math.max(y1,q[1]); }); });
  x0=Math.floor(x0); y0=Math.floor(y0); return [x0,y0,Math.ceil(x1)-x0,Math.ceil(y1)-y0]; }
function cassFlatOn(){
  if(!CASS_FLAT||CF.on||REDUCE||!CASS_RICH||tw||LAUNCH.phase||artMode||(BOOT&&BOOT.on)) return;
  var r=rich, ai=appIndex(); if(!r.focused||r.card!==cards[ai]) return;
  var sps=[r.spReelT,r.spReelB,r.spRingT,r.spRingB];
  if(r.cvRingT._job||r.cvRingB._job||r.cvLogo._job||sps.some(function(s){ return s.phase===1; })){   // aún armando o en la rampa
    clearTimeout(CF.retry); CF.retry=setTimeout(cassFlatOn,800); return; }
  var t0=performance.now();
  try{
    var it=items[ai], Wm=mx(getComputedStyle(world).transform), Im=mx(getComputedStyle(it).transform), k;
    for(k=0;k<16;k++) if(Math.abs(Wm[k]-((k%5===0)?1:0))>1e-6||Math.abs(Im[k]-((k%5===0)?1:0))>1e-6){ CF.err="corredor en movimiento"; return; }
    var card=cards[ai], ox=world.offsetLeft-card.offsetWidth/2, oy=world.offsetTop-card.offsetHeight/2;
    var ov=CF.el; if(!ov){ ov=CF.el=el("div","cflat",null); viewport.parentNode.insertBefore(ov,viewport.nextSibling); }
    while(ov.firstChild) ov.removeChild(ov.firstChild);
    ov.style.left=ox+"px"; ov.style.top=oy+"px"; ov.style.width=card.offsetWidth+"px"; ov.style.height=card.offsetHeight+"px";
    var Ls=cfLists(), back=Ls.back, front=Ls.front, key=cfKey(), hit=(CASS_FLAT==="1")?cfCacheGet(key):null;
    /* v16.7 · el reposo llegó antes que el pre-horneado: si va a medias se le espera; si aún no empezó, se arranca ya (por pasos) */
    if(!hit&&CASS_FLAT==="1"&&CF_PRE){ if(!CF.job){ clearTimeout(CF.prepT); cfPrep(); hit=cfCacheGet(key); }
      if(!hit&&CF.job&&CF.job.key===key){ CF.waits++; clearTimeout(CF.retry); CF.retry=setTimeout(cassFlatOn,120); return; } }
    if(!hit&&CASS_FLAT==="1"){ cfPrepAbort(); var bb=cfBox(back), fb2=cfBox(front), cb=cfBake(back,bb), cf2=cb?cfBake(front,fb2):null;   // no estaba listo: de golpe
      if(cb&&cf2){ hit={back:cb,bbox:bb,front:cf2,fbox:fb2}; cfCachePut(key,hit); CF.prof.sync++; } }
    else if(hit) CF.prof.hits++;
    var flatCopy=function(L){ var cp=mkCanvas(L.cv.width,L.cv.height); cp.getContext("2d").drawImage(L.cv,0,0); cp.className="cf-l";
      cp.style.width=L.cv.offsetWidth+"px"; cp.style.height=L.cv.offsetHeight+"px"; cp.style.transform=cp.style.webkitTransform=m4css(L.M); ov.appendChild(cp); };
    var bakeOrCopy=function(list,cv,b){ if(cv){ cv.className="cf-b"; cv.style.left=b[0]+"px"; cv.style.top=b[1]+"px";
          cv.style.width=b[2]+"px"; cv.style.height=b[3]+"px"; ov.appendChild(cv); return "bake"; }
      list.forEach(flatCopy); return "dom"; };
    var mode=bakeOrCopy(back,hit&&hit.back,hit&&hit.bbox);
    r.walls.forEach(function(w){ var d=el("div","cf-l",ov); d.style.width=w.offsetWidth+"px"; d.style.height=w.offsetHeight+"px";
      d.style.background=w.style.background; d.style.transform=d.style.webkitTransform=m4css(cfMatrix(w,true)); });
    CF.anims=[];
    [[r.cvReelT,r.spReelT],[r.cvReelB,r.spReelB],[r.cvRingT,r.spRingT],[r.cvRingB,r.spRingB]].forEach(function(pr){
      var s=pr[0], sp=pr[1], wr=el("div","cf-l",ov); wr.style.transform=wr.style.webkitTransform=m4css(cfMatrix(s,false));
      var cp=mkCanvas(s.width,s.height); cp.getContext("2d").drawImage(s,0,0); cp.className="cf-d"; cp.style.width=s.offsetWidth+"px"; cp.style.height=s.offsetHeight+"px"; wr.appendChild(cp);
      if(sp.anim&&sp.phase===2&&cp.animate){ var a=cp.animate([{transform:rot(sp.base)},{transform:rot(sp.base+360)}],{duration:RING_PERIOD,iterations:Infinity,easing:"linear"});
        try{ a.currentTime=sp.anim.currentTime; }catch(e){} if(sp.anim.playState==="paused") a.pause(); CF.anims.push(a); }
      else cp.style.transform=rot(sp.ang); });
    var m2=bakeOrCopy(front,hit&&hit.front,hit&&hit.fbox); CF.mode=(mode==="bake"&&m2==="bake")?"bake":"dom";
    /* estrellas que en 3D van por DELANTE del cassette (vz > 0) y lo tocan: encima, en su sitio proyectado */
    var vs=getComputedStyle(viewport), Pp=parseFloat(vs.perspective), po=vs.perspectiveOrigin.split(" ").map(parseFloat), cw=card.offsetWidth, ch=card.offsetHeight;
    CF.hid=[]; stars.forEach(function(sp,i){ var se=sp.el; if(se.style.display==="none") return; var vz=((sp.z+camZ)%LOOP+LOOP)%LOOP; if(vz>350) vz-=LOOP; if(vz<=0) return;
      var sz=se.offsetWidth, sc=Pp/(Pp-vz), cxp=po[0]+(world.offsetLeft+sp.x+sz/2-po[0])*sc-ox, cyp=po[1]+(world.offsetTop+sp.y+sz/2-po[1])*sc-oy, rr2=sz*sc/2;
      if(cxp+rr2<-40||cyp+rr2<-40||cxp-rr2>cw+40||cyp-rr2>ch+40) return;
      var d=el("div","cf-s",ov); d.style.left=(cxp-rr2)+"px"; d.style.top=(cyp-rr2)+"px"; d.style.width=d.style.height=(2*rr2)+"px";
      d.style.background=STAR_COL[i%3]; d.style.borderRadius=(i%2)?"50%":"0"; d.style.opacity=se.style.opacity; se.classList.add("flatd"); CF.hid.push(se); });
    r.stage.classList.add("cf-hide"); ov.style.display="block"; CF.on=true; CF.n++; CF.err=""; CF.bakeMs=Math.round(performance.now()-t0);
  }catch(e){ CF.err=String(e&&e.message||e).slice(0,120); cassFlatOff(); } }
function cassFlatOff(){ clearTimeout(CF.retry); if(!CF.on&&!CF.hid.length&&!(CF.el&&CF.el.firstChild)) return; CF.on=false;
  CF.anims.forEach(function(a){ try{ a.cancel(); }catch(e){} }); CF.anims=[];
  rich.stage.classList.remove("cf-hide"); CF.hid.forEach(function(e){ e.classList.remove("flatd"); }); CF.hid=[];
  if(CF.el){ CF.el.style.display="none"; while(CF.el.firstChild) CF.el.removeChild(CF.el.firstChild); } }
function flatOff(){ if(!FL.on&&!FL.hid.length) return; FL.on=false;
  FL.hid.forEach(function(e){ e.classList.remove("flatd"); }); FL.hid=[]; if(FL.cv) FL.cv.style.display="none"; }
function lxBackup(why){ if(LAUNCH.cine){ cineBack(); return; } if(LAUNCH.phase==="open"&&LAUNCH.via==="adapter"&&LAUNCH.away) launchReturn(why); }
addEventListener("blur",lxAway); addEventListener("pagehide",lxAway);
addEventListener("focus",function(){ lxBackup("focus"); }); addEventListener("pageshow",function(){ lxBackup("pageshow"); });

/* deja la pila EXACTAMENTE en reposo: cancela todas las pistas (los transform/opacity vuelven a los del CSS y a los
   ángulos inline de los giros) con las transiciones aún anuladas, fuerza el estilo y sólo entonces quita .lx-run */
function launchReset(){ fxStop(); clearTimeout(LAUNCH.uiT); LAUNCH.uiT=0;
  LAUNCH.anims.forEach(function(a){ try{ a.cancel(); }catch(e){} }); LAUNCH.anims=[];
  void getComputedStyle(rich.cass).transform; void rich.cass.offsetWidth;
  rich.cass.classList.remove("lx-run");
  lxVeil.style.opacity=""; lxCard.style.opacity=""; }
/* ===== v13 · LA VUELTA INVERSA (decisión de diseño, 2026-10-23) ======================
   Al salir de una app, el desarmado y el portal se reproducen al revés hasta el modo inicial del launcher: la vuelta es el
   ESPEJO EXACTO de la ida. Cada pista de la ida quedó grabada (trk → LAUNCH.specs) y aquí se
   crea su gemela invertida en el tiempo, t' = LX.T − t: los fotogramas clave al revés (offset 1 − o), cada curva
   cubic-bezier(x1,y1,x2,y2) → (1−x2, 1−y2, 1−x1, 1−y1) y movida al tramo que le toca, y el inicio en LX.T − (inicio +
   duración). Así, sin una sola tabla nueva:
   · el velo se abre (0–150 ms), con el cuerpo L0 a pantalla completa delante del portal, que está abierto;
   · las capas vuelven DESDE la cámara en el orden inverso: cuerpo (L0), carretes (L1), anillos (L2), tapa (L3), etiqueta
     (L4), que es la última en volver; aceleran hasta encajar (la POP de la ida, invertida, es un golpe de llegada);
   · el portal se cierra en iris HACIA DETRÁS del cassette (el mismo centro de la ida, LAUNCH.center) y su campo frena;
   · la electricidad crepita mientras se re-ensamblan (fxEnv invertida) y se apaga al encajar; la grieta de los cantos
     chispea al cerrarse (850–1130 ms). Las chispas, eso sí, caen con la gravedad de siempre (tiempo físico, no invertido);
   · la UI vuelve al final (la salida de 0–200 ms, invertida, llega a las 1250).
   Lo único que NO es espejo literal: el cuerpo del cassette (.cass). Su anticipación de la ida, invertida, acabaría frenando
   en seco contra la pose pasada de vuelta; aquí se des-gira de 3/4 a frontal, PASA del frontal (+6°, z −40, ×0,96) frenando
   en LXB.peak y vuelve al reposo con una curva suave: un rebote de verdad (Williams: la amortiguación).
   Robustez (C1): teclas ignoradas toda la vuelta (LAUNCH.phase "back"); respaldo si onfinish no llega (LX.T + 400 ms); al
   acabar se cancelan TODAS las pistas y la pila vuelve a su CSS: reposo exacto (P8E.cassPose antes = después). La pantalla
   de paso nunca se apaga antes de que el velo se haya abierto. Arte (salvapantallas → cassette): la misma vuelta, sin
   portal ni velo, como la ida. Reduced-motion: fundido de 160 ms. Oculto (Home en pleno despiece): por corte. */
var LXB={peak:1100, unspin:"cubic-bezier(.45,0,.2,1)", settle:"cubic-bezier(.37,0,.63,1)", UI:540, CARD:150};
function lxCf(z,rx,ry,rz,s){ return "translateZ("+px(z)+") rotateX("+rx+"deg) rotateY("+ry+"deg) rotateZ("+rz+"deg) scale("+s+")"; }
function revEase(e){ if(!e||e==="linear") return "linear"; var m=/cubic-bezier\(([^)]+)\)/.exec(e); if(!m) return e;
  var v=m[1].split(",").map(parseFloat); function r(x){ return +(1-x).toFixed(4); } return "cubic-bezier("+r(v[2])+","+r(v[3])+","+r(v[0])+","+r(v[1])+")"; }
/* fotogramas clave invertidos: el k-ésimo nuevo es el (n−1−k)-ésimo viejo; la curva del tramo nuevo k→k+1 es la del tramo
   viejo (n−2−k)→(n−1−k), que vivía en el fotograma n−2−k, invertida */
function revKf(kf){ var n=kf.length, out=[], i, k, src, key;
  for(i=0;i<n;i++){ src=kf[n-1-i]; k={};
    for(key in src) if(Object.prototype.hasOwnProperty.call(src,key)&&key!=="offset"&&key!=="easing") k[key]=src[key];
    k.offset=(src.offset!=null)?+(1-src.offset).toFixed(6):(n>1?i/(n-1):0);
    if(i<n-1&&kf[n-2-i].easing) k.easing=revEase(kf[n-2-i].easing);
    out.push(k); }
  out[0].offset=0; out[n-1].offset=1; return out; }
/* temporizadores de la ida y de la vuelta (sonido, UI): se anulan juntos */
function lxTimers(){ LAUNCH.st.forEach(function(t){ clearTimeout(t); }); LAUNCH.st=[]; clearTimeout(LAUNCH.uiT); LAUNCH.uiT=0; }
function lxAt(ms,fn){ var tok=LAUNCH.starts, rw=LAUNCH.rw; LAUNCH.st.push(setTimeout(function(){ if(tok===LAUNCH.starts&&rw===LAUNCH.rw&&!LAUNCH.posed) fn(); },ms*LAUNCH_SLOW)); }
/* el cuerpo del cassette en la vuelta (= LXK.cass leída al revés, con el rebote al final) */
function lxCassBack(){ var T=LX.T, rx0=LAUNCH.rx0, ry0=LAUNCH.ry0;
  return trk(rich.cass,[{transform:lxCf(800,rx0-11,ry0+24,-6,1),offset:0,easing:revEase(DIVE)},                 // t' 0   (= ida 1250)
    {transform:lxCf(220,rx0+8,ry0-26,0,1),offset:(T-640)/T,easing:EZ.lin},                                            // t' 610 (= ida 640)
    {transform:lxCf(160,rx0+8,ry0-24,0,1),offset:(T-560)/T,easing:LXB.unspin},                                        // t' 690 (= ida 560): 3/4
    {transform:lxCf(-40,rx0-2,ry0+6,0,0.96),offset:LXB.peak/T,easing:LXB.settle},                                     // t' 1100: pasa del frontal
    {transform:lxCf(0,rx0,ry0,0,1),offset:1}],0,T,EZ.lin); }                                                          // t' 1250: reposo
/* VUELTA (Esc/Back, temporizador, error o el TV nos devuelve el foco) */
function launchReturn(why){ if(LAUNCH.phase!=="open") return;
  LAUNCH.phase="back"; LAUNCH.away=false; LAUNCH.why=why; LAUNCH.returns++; clearTimeout(LAUNCH.backT); clearTimeout(LAUNCH.fbT); LAUNCH.fbT=0;
  clearTimeout(LAUNCH.nsT); if(why!=="error") lxBackMsg(); if(LAUNCH.via==="adapter") awayClear();   // v16.7: vuelta en caliente: la marca sobra
  var ai=appIndex();
  live.textContent=STR.liveFocus(APPS[ai].nm);
  snd("returnStart",{app:APPS[ai].nm,why:why,dur:(LX.T-640)*LAUNCH_SLOW});   // = la zambullida al revés (t' 0–610)
  if(REDUCE){ launchBackFade(); return; }
  if(why==="hidden"||!CASS_RICH||!lxEl.animate||!LAUNCH.specs.length||rich.card!==cards[ai]){ launchBackCut(); return; }   // nadie lo ve, o no hay ida
  /* v16.10: red de seguridad — si la vuelta lanza una excepción (spec corrupto, WAAPI ausente en un caso raro), se
     completa por corte en vez de quedarse en «Rewinding…» con las teclas ignoradas. */
  try{ launchRewind(false); }
  catch(e){ if(window.console) console.error("launchRewind:",e); launchBackCut(); } }
/* reduced-motion (C6): sin movimiento; la pantalla de paso se funde en 160 ms y todo lo demás vuelve por corte */
function launchBackFade(){ var ai=appIndex(); LAUNCH.cuts++;
  lxTimers(); launchReset(); rich.release(); rich.attach(cards[ai],APPS[ai]);
  B.classList.remove("launch"); B.classList.remove("launch-arte");
  var a=lxEl.animate?lxEl.animate([{opacity:1},{opacity:0}],{duration:LX.RM_FADE,easing:EZ.lin,fill:"forwards"}):null, fin=false;
  function end(){ if(fin) return; fin=true; clearTimeout(LAUNCH.fbT); LAUNCH.fbT=0; if(a){ try{ a.cancel(); }catch(e){} } launchBackDone(); }
  if(!a){ end(); return; }
  a.onfinish=end; LAUNCH.fbT=setTimeout(function(){ if(!fin) LAUNCH.fallbacks++; end(); },LX.RM_FADE+400); }
/* por corte (oculto, sin WAAPI o sin ida grabada): como la v11 — la pila a reposo y el armado de siempre */
function launchBackCut(){ var ai=appIndex(); LAUNCH.cuts++;
  lxTimers(); launchReset(); rich.release(); rich.attach(cards[ai],APPS[ai]);
  B.classList.remove("launch"); B.classList.remove("launch-arte"); launchBackDone(); }
function launchBackDone(){ lxEl.classList.remove("on"); lxEl.classList.remove("open"); lxEl.classList.remove("err"); lxEl.style.opacity="";
  LAUNCH.phase=""; LAUNCH.arte=false; IDLE.quiet=false; idleArm(); artSchedule(); }
/* EL ESPEJO. arte = vuelta del salvapantallas (sin velo ni portal) */
function launchRewind(arte){ var S=LAUNCH_SLOW, T=LX.T, specs=LAUNCH.specs, old=LAUNCH.anims, i, sp, app=LAUNCH.app||APPS[appIndex()];
  LAUNCH.rw++; LAUNCH.rewinds++; LAUNCH.posed=false; lxTimers(); LAUNCH.anims=[]; LAUNCH.rec=false; var rw=LAUNCH.rw;
  rich.cass.classList.add("lx-run");                                   // fuera las transiciones (la trampa de la cascada, v7)
  var master=lxCassBack();                                             // la primera pista = el reloj de la vuelta
  for(i=0;i<specs.length;i++){ sp=specs[i]; if(sp.n===rich.cass) continue;
    trk(sp.n,revKf(sp.kf),T-(sp.s+sp.d),sp.d,revEase(sp.e)); }
  old.forEach(function(a){ try{ a.cancel(); }catch(e){} });           // las de ida, DESPUÉS: la de vuelta ya tapa su primer fotograma
  if(!arte&&!BOOT.arming){ lxCard.style.opacity="";
    var ca=lxCard.animate([{opacity:1,transform:"translateY(0px)"},{opacity:0,transform:"translateY(16px)"}],{duration:LXB.CARD*S,easing:EZ.thrw,fill:"both"});
    if(ca) LAUNCH.anims.push(ca); }
  FX.center=LAUNCH.center||FX.center;
  fxStart(app,arte,true);                                              // electricidad (y portal en las apps) con el tiempo invertido; v15.2 armado: sólo electricidad
  /* la UI vuelve para llegar justo al final (transición CSS de 120 + 420 ms). v15.2 armado: la UI nunca se fue */
  if(!BOOT.arming) LAUNCH.uiT=setTimeout(function(){ if(rw===LAUNCH.rw&&LAUNCH.phase==="back"&&!LAUNCH.posed){ B.classList.remove("launch"); B.classList.remove("launch-arte"); } },(T-LXB.UI)*S);
  if(!BOOT.arming) lxAt(LXB.peak,function(){ snd("returnAssembled",{app:app.nm}); });
  else lxAt(LXB.peak,function(){ snd("bootArmed",{app:app.nm}); });   // v15.2: el «clac» del cassette al encajar en la intro
  /* con el velo ya abierto (y el rótulo fuera) la pantalla de paso deja de existir: una capa de pantalla completa menos */
  if(!arte&&!BOOT.arming) lxAt(LXB.CARD+20,function(){ lxEl.classList.remove("on"); lxEl.classList.remove("open"); lxEl.classList.remove("err"); });
  function fin(){ if(rw!==LAUNCH.rw||LAUNCH.phase!=="back"||LAUNCH.posed) return; clearTimeout(LAUNCH.fbT); LAUNCH.fbT=0; launchRewound(); }
  if(!master){ launchRewound(); return; }
  master.onfinish=fin;
  /* respaldo (= el de la ida, v11): si onfinish no llega, la vuelta acaba igual; sin esto las teclas quedarían ignoradas */
  LAUNCH.fbT=setTimeout(function(){ if(rw===LAUNCH.rw&&LAUNCH.phase==="back"&&!LAUNCH.posed){ LAUNCH.fallbacks++; LAUNCH.backFallbacks++; fin(); } },T*S+400); }
/* fin de la vuelta: todas las pistas canceladas (la pila = su CSS = el reposo), giros en marcha, «modo inicial» */
function launchRewound(){ lxTimers(); launchReset();
  B.classList.remove("launch"); B.classList.remove("launch-arte");
  rich.resume(); live.textContent=STR.liveFocus(APPS[appIndex()].nm);
  launchBackDone();
  if(BOOT.armRun) bootAfterArm(); }   // v15.2: el armado de la intro encajó → la intro resuelve (corredor firme v14)
/* Arte: las piezas ya cruzaron y la obra quedó a la vista → la pila vuelve a reposo (oculta) y entra el salvapantallas */
function launchArteDone(){
  launchReset(); B.classList.remove("launch"); B.classList.remove("launch-arte");
  LAUNCH.phase=""; LAUNCH.arteBack=!!LAUNCH.specs.length; enterArtMode(); }   // v13: al salir del salvapantallas, la vuelta inversa

/* ===== v9 · ELECTRICIDAD EN EL DESPIECE + PORTAL DE FONDO ===================
   Decisión de diseño (2026-10-23): electricidad sobre el cassette desarmado mientras el fondo pasa a ser el portal, con
   la paleta de color de la app. Coreografía y procedencia: README, sección v9.
   · ELECTRICIDAD (FX.zap): un canvas 2D PROPIO (.lx-zap), hermano de .viewport dentro de #tv. NO es ancestro de la
     pila 3D y no lleva filter/mask/clip-path/blend: el 3D del cassette no se aplana. Cada fotograma LEE la pose real
     de las capas (getComputedStyle: transform + opacidad de .cass y L0–L4; sólo lectura) y la proyecta con la
     perspectiva de .stage, así los arcos siguen a las capas también en las tiras posadas y con ?launchslow.
     Arcos entre capas vecinas (desplazamiento fractal del punto medio + ramas), borde eléctrico que repta por los
     contornos (la técnica del Electric Border, reimplementada sin filtros SVG), chispas balísticas sin estado.
     El brillo son 4 trazos apilados en modo «lighter» (sin shadowBlur ni filter). Formas en DOSES (33 ms), anclas
     cada 100 ms, posición en unos: el rayo se sostiene un fotograma y salta.
   · PORTAL (GL.portal): el raymarch de ruido áureo del Shader Decay Explorer PORTADO a WebGL1 / GLSL ES 1.0, en el
     MISMO contexto WebGL1 del arte (gl.js desde la v12; three.js hasta la v11), a 1/PORTAL_RES del lienzo y escalado pixelado por el
     compositor; cuantizado a la paleta del launcher con tramado Bayer 4×4. Se abre como un iris desde detrás del
     cassette. Sólo en las apps (Arte no: su destino es la obra, no se sale de casa).
   · UN solo rAF: los dos corren en UNA tarea del Ticker. Con reduced-motion no existe ninguno (launchOpenReduced). */
var ZAP=qp("zap","1")!=="0";                                            // 0 = sin electricidad
var ZAP_RES=Math.max(1,Math.min(4,Math.round(+qp("zapres",1)||1)));      // 2 = canvas de la electricidad a 1/2 (más barato, más blando)
var PORTAL_ON=qp("portal","1")!=="0";                                   // 0 = sin portal (el arte se queda, como en la v8)
var PORTAL_RES=Math.max(1,Math.min(8,Math.round(+qp("portalres",4)||4))); // divisor de la resolución interna del portal (4 = 480×270)
var PORTAL_STEPS=Math.max(3,Math.min(12,Math.round(+qp("portalsteps",8)||8))); // pasos del raymarch (la referencia usa 10)
var PORTAL_TINT=qp("portaltint","palette")==="app"?"app":"palette";     // app = rampa del tinte de la app elegida
var FX_PROF=qp("fxprof","0")==="1";                                     // sólo pruebas: gl.finish() tras cada fotograma del portal
var FX={on:false,arte:false,tok:0,app:null,master:null,cv:null,c:null,sx:0,sy:0,sc:1,cx:0,cy:0,pd:1620,cm:null,L:{},box:null,
  portalOn:false,frames:0,zapFrames:0,portalFrames:0,bolts:0,sparks:0,maxBolts:0,maxSparks:0,ms:0,msMax:0,gpu:0,gpuMax:0,gpuN:0,
  runs:0,err:"",center:null,lastT:0,rev:false,revRuns:0};
var GLX={contexts:0};
/* contornos (px locales de cada capa). Círculos con «sp» = el canvas del anillo/carrete, que se mueve dentro de su capa */
var FXU=STAGE_H/1000, FX_OL={
  L4:[{r:[0,0,198.72,349.92]}],
  L3:[{r:[0,0,CW*FXU,CH*FXU]},{r:[HOLE.x*FXU,HOLE.y*FXU,HOLE.w*FXU,HOLE.h*FXU]}],
  L2:[{c:[RING_T.x*FXU,RING_T.y*FXU,RING_T.R*FXU],sp:"ringT"},{c:[RING_B.x*FXU,RING_B.y*FXU,RING_B.R*FXU],sp:"ringB"}],
  L1:[{c:[REEL_T.x*FXU,REEL_T.y*FXU,REEL_T.flange*FXU],sp:"reelT"},{c:[REEL_B.x*FXU,REEL_B.y*FXU,REEL_B.flange*FXU],sp:"reelB"}],
  L0:[{r:[0,0,CW*FXU,CH*FXU]}] };
var FX_PAIRS=[["L4","L3",2],["L3","L2",3],["L2","L1",3],["L1","L0",3]];   // [delante, detrás, arcos como mucho]
var FX_COL={r:"#F21E2C",o:"#F9591F",y:"#FEC631",cr:"#FFFEE8"};
/* PRNG con semilla (mulberry32) y hash de enteros: todo lo aleatorio sale de (pista, arco, cubo de tiempo) → determinista */
function rng(seed){ var a=seed>>>0; return function(){ a=(a+0x6D2B79F5)>>>0; var t=a; t=Math.imul(t^(t>>>15),t|1);
  t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
function hs(a,b,c){ return (Math.imul(a|0,73856093)^Math.imul(b|0,19349663)^Math.imul(c|0,83492791))>>>0; }
function h1(n){ var s=Math.sin(n*127.1+311.7)*43758.5453; return s-Math.floor(s); }
function vn(x){ var i=Math.floor(x), f=x-i, u=f*f*(3-2*f); return h1(i)+(h1(i+1)-h1(i))*u; }   // ruido de valor 1D
function smooth(a,b,x){ var t=clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); }
function pm(s){ if(!s||s==="none") return [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
  var v=s.slice(s.indexOf("(")+1,s.lastIndexOf(")")).split(",").map(parseFloat);
  return v.length===6?[v[0],v[1],0,0,v[2],v[3],0,0,0,0,1,0,v[4],v[5],0,1]:v; }
/* punto local (x,y) de la capa L → lienzo (#tv): transform de la capa (origen en su centro) → .cass (origen en el
   centro del escenario) → perspectiva de .stage (origen = su centro). false si queda detrás de la cámara */
function fxP(L,x,y,o){ var m=L.m, hx=L.w/2, hy=L.h/2, lx=x-hx, ly=y-hy;
  var X=m[0]*lx+m[4]*ly+m[12]+hx+L.x-FX.cx, Y=m[1]*lx+m[5]*ly+m[13]+hy+L.y-FX.cy, Zz=m[2]*lx+m[6]*ly+m[14], c=FX.cm;
  var X2=c[0]*X+c[4]*Y+c[8]*Zz+c[12], Y2=c[1]*X+c[5]*Y+c[9]*Zz+c[13], Z2=c[2]*X+c[6]*Y+c[10]*Zz+c[14], d=FX.pd-Z2;
  if(d<80) return false; var s=FX.pd/d; o.x=FX.sx+(FX.cx+X2*s)*FX.sc; o.y=FX.sy+(FX.cy+Y2*s)*FX.sc; o.s=s; return true; }
function spOff(o,t){ return o.sp?posAt(LXK[o.sp].pos,t):[0,0]; }
/* punto del contorno o en u∈[0,1) con su normal (px locales) */
function olPt(o,u,t,out){ u-=Math.floor(u);
  if(o.c){ var a=u*6.283185, f=spOff(o,t); out.nx=Math.cos(a); out.ny=Math.sin(a);
    out.x=o.c[0]+f[0]+out.nx*o.c[2]; out.y=o.c[1]+f[1]+out.ny*o.c[2]; return out; }
  var r=o.r, w=r[2], h=r[3], d=u*2*(w+h);
  if(d<w){ out.x=r[0]+d; out.y=r[1]; out.nx=0; out.ny=-1; }
  else if(d<w+h){ out.x=r[0]+w; out.y=r[1]+d-w; out.nx=1; out.ny=0; }
  else if(d<2*w+h){ out.x=r[0]+w-(d-w-h); out.y=r[1]+h; out.nx=0; out.ny=1; }
  else { out.x=r[0]; out.y=r[1]+h-(d-2*w-h); out.nx=-1; out.ny=0; }
  return out; }
/* el punto del contorno o más cercano a (x,y) (px de la pila; todas las capas comparten el origen salvo L4) */
function olNear(o,x,y,t,out){
  if(o.c){ var f=spOff(o,t), cx=o.c[0]+f[0], cy=o.c[1]+f[1], dx=x-cx, dy=y-cy, l=Math.sqrt(dx*dx+dy*dy)||1;
    out.x=cx+dx/l*o.c[2]; out.y=cy+dy/l*o.c[2]; }
  else { var r=o.r, x0=r[0], y0=r[1], x1=r[0]+r[2], y1=r[1]+r[3], px2=clamp(x,x0,x1), py2=clamp(y,y0,y1),
      dl=px2-x0, dr=x1-px2, dt=py2-y0, db=y1-py2, mn=Math.min(dl,dr,dt,db);
    if(mn===dl) px2=x0; else if(mn===dr) px2=x1; else if(mn===dt) py2=y0; else py2=y1; out.x=px2; out.y=py2; }
  var ex=out.x-x, ey=out.y-y; return ex*ex+ey*ey; }
/* rayo: desplazamiento del punto medio (amplitud proporcional al tramo: autosemejante) */
function bolt(ax,ay,bx,by,R,depth,amp){ var p=[ax,ay,bx,by], d, i;
  for(d=0;d<depth;d++){ var q=[p[0],p[1]];
    for(i=0;i<p.length-2;i+=2){ var x0=p[i], y0=p[i+1], x1=p[i+2], y1=p[i+3], dx=x1-x0, dy=y1-y0, l=Math.sqrt(dx*dx+dy*dy)||1,
        off=(R()-0.5)*amp*l; q.push((x0+x1)/2-dy/l*off,(y0+y1)/2+dx/l*off,x1,y1); }
    p=q; amp*=0.92; }
  return p; }
function fxPath(c,p){ c.beginPath(); c.moveTo(p[0],p[1]); for(var i=2;i<p.length;i+=2) c.lineTo(p[i],p[i+1]); }
/* brillo = 4 trazos del MISMO camino, de ancho a fino (en vez del blur(32/4/1 px) de la referencia) */
function fxGlow(c,p,w,a){ fxPath(c,p);
  c.strokeStyle=FX_COL.r;  c.lineWidth=24*w;  c.globalAlpha=0.14*a; c.stroke();
  c.strokeStyle=FX_COL.o;  c.lineWidth=9*w;   c.globalAlpha=0.40*a; c.stroke();
  c.strokeStyle=FX_COL.y;  c.lineWidth=3.6*w; c.globalAlpha=0.85*a; c.stroke();
  c.strokeStyle=FX_COL.cr; c.lineWidth=1.7*w; c.globalAlpha=Math.min(1,a); c.stroke(); }
function fxBox(p){ var b=FX.box, i; for(i=0;i<p.length;i+=2){ if(p[i]<b[0]) b[0]=p[i]; if(p[i]>b[2]) b[2]=p[i]; if(p[i+1]<b[1]) b[1]=p[i+1]; if(p[i+1]>b[3]) b[3]=p[i+1]; } }
/* pose real de la pila (sólo lectura) */
function fxRead(){ FX.cm=pm(getComputedStyle(rich.cass).transform);
  Object.keys(FX.L).forEach(function(k){ var L=FX.L[k], s=getComputedStyle(L.el); L.m=pm(s.transform); L.op=+s.opacity; }); }
/* intensidad global: arranca con la grieta de los cantos, plena en el despiece y el sostén, muere antes del velo */
function fxEnv(t){ return smooth(150,330,t)*(1-smooth(1020,1150,t)); }
function fxSeam(t){ return smooth(120,175,t)*(1-smooth(300,430,t)); }   // la grieta: los cantos se abren (130–330)
/* ancla del arco a del par pi en el cubo de anclas ab (cada 100 ms): punto del contorno delantero + el más cercano detrás */
function fxAnchor(pi,a,ab,t,A,Bp){ var P=FX_PAIRS[pi], F=FX.L[P[0]], Bk=FX.L[P[1]], R=rng(hs(pi*7+a,ab,911)), ol=FX_OL[P[0]];
  var o=ol[Math.floor(R()*ol.length)], q=olPt(o,R(),t,{}), qx=q.x+F.x, qy=q.y+F.y, best=1e12, bo={}, bl=FX_OL[P[1]], i, tmp={};
  for(i=0;i<bl.length;i++){ var dd=olNear(bl[i],qx-Bk.x,qy-Bk.y,t,tmp); if(dd<best){ best=dd; bo.x=tmp.x; bo.y=tmp.y; } }
  A.x=q.x; A.y=q.y; A.nx=q.nx; A.ny=q.ny; Bp.x=bo.x; Bp.y=bo.y; return R; }
function fxZap(t,tp){ if(tp==null) tp=t;   // v13: t = pose (ida), tp = reloj físico (en la ida, el mismo)
  var c=FX.c, k=1/ZAP_RES, b=FX.box, pb=FX.prevBox, E=fxEnv(t), S=fxSeam(t), sb=Math.floor(tp/33.333), ab, nb=0, ns=0;
  c.setTransform(1,0,0,1,0,0);
  if(pb) c.clearRect(Math.floor(pb[0]*k)-2,Math.floor(pb[1]*k)-2,Math.ceil((pb[2]-pb[0])*k)+4,Math.ceil((pb[3]-pb[1])*k)+4);
  FX.box=[1e9,1e9,-1e9,-1e9]; b=FX.box;
  if(E<=0.001&&S<=0.001){ FX.prevBox=null; FX.bolts=0; FX.sparks=0; return; }
  c.setTransform(k,0,0,k,0,0); c.globalCompositeOperation="lighter"; c.lineCap="round"; c.lineJoin="round";
  var A={}, Bq={}, pa={}, pbq={}, i, j, a, pi;
  /* 1 · la GRIETA y el BORDE ELÉCTRICO: tramos del contorno desplazados por ruido (repta en unos, como el feOffset
     animado de la referencia). En la grieta van por el frente (L3) y el cuerpo (L0); luego por la etiqueta, la ventana
     de la tapa y el cuerpo. */
  var crawl=[];
  if(S>0.01){ crawl.push(["L3",0,0.55,S*1.25,0]); crawl.push(["L3",0,0.45,S*1.1,0.5]); crawl.push(["L0",0,0.5,S,0.25]); }
  if(E>0.01){ crawl.push(["L4",0,0.4,E*0.9,0.1]); crawl.push(["L3",1,0.35,E*0.85,0.6]); crawl.push(["L0",0,0.3,E*0.7,0.8]); }
  for(i=0;i<crawl.length;i++){ var cw=crawl[i], L=FX.L[cw[0]], ia=cw[3]*L.op; if(ia<0.03) continue;
    var o=FX_OL[cw[0]][cw[1]], n=34, u0=cw[4]+tp*0.0011*(i%2?1:-1), pts=[], ok=true;
    for(j=0;j<n;j++){ var u=u0+cw[2]*j/(n-1), q=olPt(o,u,t,A), dsp=(vn(u*46+tp*0.021)*0.7+vn(u*130-tp*0.037)*0.3-0.5)*26;
      if(!fxP(L,q.x+q.nx*dsp,q.y+q.ny*dsp,pa)){ ok=false; break; } pts.push(pa.x,pa.y); }
    if(!ok) continue; fxBox(pts); fxGlow(c,pts,0.8,ia); nb++; }
  /* 2 · ARCOS entre capas vecinas: anclas cada 100 ms (escalonadas por arco), forma nueva cada 33 ms (en doses) */
  var sparkSrc=[];
  if(E>0.01) for(pi=0;pi<FX_PAIRS.length;pi++){ var P=FX_PAIRS[pi], LA=FX.L[P[0]], LB=FX.L[P[1]], op=Math.min(LA.op,LB.op);
    if(op<0.12) continue;
    for(a=0;a<P[2];a++){ ab=Math.floor((tp+a*37)/100); var R=fxAnchor(pi,a,ab,t,A,Bq);
      if(!fxP(LA,A.x,A.y,pa)||!fxP(LB,Bq.x,Bq.y,pbq)) continue;
      var dx=pbq.x-pa.x, dy=pbq.y-pa.y, gap=Math.sqrt(dx*dx+dy*dy); if(gap<5) continue;
      sparkSrc.push(pi*8+a);
      var Rs=rng(hs(pi*7+a,sb,313)); if(Rs()>0.82) continue;                  // parpadeo: algún arco se salta su fotograma
      var p=bolt(pa.x,pa.y,pbq.x,pbq.y,Rs,gap>140?6:5,0.62), w=0.75+Rs()*0.5, al=E*op*(0.75+Rs()*0.35);
      fxBox(p); fxGlow(c,p,w,al); nb++;
      if(Rs()<0.55){ var bi=2*(2+Math.floor(Rs()*(p.length/2-4))), bx=p[bi], by=p[bi+1], an=Math.atan2(dy,dx)+(Rs()<0.5?-1:1)*(0.45+Rs()*0.5),
          bl=gap*(0.25+Rs()*0.3), br=bolt(bx,by,bx+Math.cos(an)*bl,by+Math.sin(an)*bl,Rs,4,0.7);
        fxBox(br); fxGlow(c,br,w*0.55,al*0.8); nb++; } } }
  /* 3 · DESCARGA: algunos cubos (≈ 1 de cada 6, 300–950 ms) un rayo gordo atraviesa TODA la pila, de L4 a L0 */
  var Rk=rng(hs(77,sb,5));
  if(E>0.5&&t>=300&&t<=950&&Rk()<0.17){ var chain=[], ks=["L4","L3","L2","L1","L0"], cx0=null, cy0=null;
    for(j=0;j<ks.length;j++){ var LK=FX.L[ks[j]]; if(LK.op<0.2) continue; var ol2=FX_OL[ks[j]], tmp2={};
      if(cx0===null){ olPt(ol2[0],Rk(),t,tmp2); } else { olNear(ol2[Math.floor(Rk()*ol2.length)],cx0-LK.x,cy0-LK.y,t,tmp2); }
      cx0=tmp2.x+LK.x; cy0=tmp2.y+LK.y; if(fxP(LK,tmp2.x,tmp2.y,pa)) chain.push(pa.x,pa.y); }
    for(j=0;j+3<chain.length;j+=2){ var seg=bolt(chain[j],chain[j+1],chain[j+2],chain[j+3],Rk,5,0.55); fxBox(seg); fxGlow(c,seg,1.55,E*1.15); nb++; } }
  /* 4 · CHISPAS sin estado: cada arco suelta una por extremo y por cubo; su origen se recalcula con la pose actual */
  if(sparkSrc.length){ var sp=[], life=300, g=0.0022, bb, sx, sy;
    for(bb=sb-9;bb<=sb;bb++){ var age=tp-bb*33.333; if(age<0||age>life) continue;
      for(i=0;i<sparkSrc.length;i++){ var id=sparkSrc[i], Rq=rng(hs(id,bb,4242)); if(Rq()>0.6) continue;
        pi=(id/8)|0; a=id%8; ab=Math.floor((bb*33.333+a*37)/100); fxAnchor(pi,a,ab,t,A,Bq);
        var end=Rq()<0.5, Lq=FX.L[FX_PAIRS[pi][end?1:0]]; if(!fxP(Lq,end?Bq.x:A.x,end?Bq.y:A.y,pa)) continue;
        var va=Rq()*6.2832, vs=0.25+Rq()*0.6, vx=Math.cos(va)*vs, vy=Math.sin(va)*vs-0.2;
        sx=pa.x+vx*age; sy=pa.y+vy*age+g*age*age*0.5;
        var tx=sx-vx*14, ty=sy-(vy+g*age)*14; sp.push(sx,sy,tx,ty,1-age/life); } }
    ns=sp.length/5;
    if(ns){ c.beginPath(); for(i=0;i<sp.length;i+=5){ c.moveTo(sp[i],sp[i+1]); c.lineTo(sp[i+2],sp[i+3]); }
      c.strokeStyle=FX_COL.o; c.lineWidth=4.5; c.globalAlpha=0.45*Math.max(E,S); c.stroke();
      c.strokeStyle=FX_COL.cr; c.lineWidth=1.6; c.globalAlpha=Math.max(E,S); c.stroke();
      for(i=0;i<sp.length;i+=5){ if(sp[i]<b[0]) b[0]=sp[i]; if(sp[i]>b[2]) b[2]=sp[i]; if(sp[i+1]<b[1]) b[1]=sp[i+1]; if(sp[i+1]>b[3]) b[3]=sp[i+1];
        if(sp[i+2]<b[0]) b[0]=sp[i+2]; if(sp[i+2]>b[2]) b[2]=sp[i+2]; if(sp[i+3]<b[1]) b[1]=sp[i+3]; if(sp[i+3]>b[3]) b[3]=sp[i+3]; } } }
  /* 5 · la GRIETA suelta chispas por las cuatro costuras, hacia fuera (por donde se van los cantos) */
  if(S>0.05){ var sp2=[], L3=FX.L.L3;
    for(bb=sb-6;bb<=sb;bb++){ var age2=tp-bb*33.333; if(age2<0||age2>220) continue; var Rw=rng(hs(99,bb,17));
      for(i=0;i<7;i++){ var qq=olPt(FX_OL.L3[0],Rw(),t,A); if(!fxP(L3,qq.x,qq.y,pa)||!fxP(L3,qq.x+qq.nx*40,qq.y+qq.ny*40,pbq)) continue;
        var ndx=(pbq.x-pa.x)/40, ndy=(pbq.y-pa.y)/40, v2=0.35+Rw()*0.5, jx=(Rw()-0.5)*0.4, jy=(Rw()-0.5)*0.4,
            ex2=pa.x+(ndx+jx)*v2*age2, ey2=pa.y+(ndy+jy)*v2*age2+0.0018*age2*age2*0.5;
        sp2.push(ex2,ey2,ex2-(ndx+jx)*v2*16,ey2-(ndy+jy)*v2*16); } }
    if(sp2.length){ c.beginPath(); for(i=0;i<sp2.length;i+=4){ c.moveTo(sp2[i],sp2[i+1]); c.lineTo(sp2[i+2],sp2[i+3]); }
      c.strokeStyle=FX_COL.y; c.lineWidth=4; c.globalAlpha=0.5*S; c.stroke(); c.strokeStyle=FX_COL.cr; c.lineWidth=1.6; c.globalAlpha=S; c.stroke();
      fxBox(sp2); ns+=sp2.length/4; } }
  c.globalAlpha=1; c.globalCompositeOperation="source-over";
  if(b[0]<=b[2]){ b[0]-=24; b[1]-=24; b[2]+=24; b[3]+=24; FX.prevBox=b; } else FX.prevBox=null;
  FX.bolts=nb; FX.sparks=ns; if(nb>FX.maxBolts) FX.maxBolts=nb; if(ns>FX.maxSparks) FX.maxSparks=ns; FX.zapFrames++; }

/* ---- PORTAL: el shader. Procedencia: EngineeringIntelligence/ReferenceImplementations/shader-decay-explorer/index.html
   (raymarch de ruido áureo: no(), la rotación r(), el bucle de pasos con luz 1/distancia, el tonemap ACES golfeado) y
   shader-smoke.glsl (hash 2D y el glitch de filas sostenido 1/8 s). PORTADO a GLSL ES 1.0: sin #version 300 es, sin
   in/out (gl_FragColor), bucle con límite constante (STEPS es un #define), sin inicializaciones implícitas a cero, sin
   AA por supersampling (1 muestra), l acotado antes de elevar al cuadrado (desborda en mediump). PROPIO: el iris con
   borde roto, el centro en el cassette, la cuantización a la paleta con Bayer 4×4, el viñeteado interior y la
   compensación de pasos (10/STEPS). gl.js antepone la precisión y #define STEPS; PSH_HEAD, el atributo (v12; antes three). */
var PSH_V="void main(){ gl_Position=vec4(position.xy,0.0,1.0); }";
var PSH_F=[
 "uniform vec2 uRes; uniform vec2 uCenter; uniform float uTime; uniform float uOpen; uniform float uRim; uniform float uGlitch;",
 "uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform vec3 uC4; uniform vec3 uC5;",
 "vec2 rot2(vec2 v,float a){ float s=sin(a), c=cos(a); return mat2(c,-s,s,c)*v; }",
 "float gno(vec3 p){",
 "  const mat3 GOLD=mat3(-0.571464913,0.814921382,0.096597072,-0.278044873,-0.303026659,0.911518454,0.772087367,0.494042493,0.399753815);",
 "  return dot(cos(GOLD*p),sin(1.618033988*p*GOLD)); }",
 "vec3 aces(vec3 c){",
 "  mat3 m1=mat3(0.59719,0.07600,0.02840,0.35458,0.90834,0.13383,0.04823,0.01566,0.83777);",
 "  mat3 m2=mat3(1.60475,-0.10208,-0.00327,-0.53108,1.10813,-0.07276,-0.07367,-0.00605,1.07602);",
 "  vec3 v=m1*c; vec3 a=v*(v+0.0245786)-0.000090537; vec3 b=v*(0.983729*v+0.4329510)+0.238081; return m2*(a/b); }",
 "float hsh(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }",
 "float bayer4(vec2 p){ vec2 a=mod(floor(p),2.0); vec2 b=mod(floor(p*0.5),2.0);",
 "  return fract(a.x*0.5+a.y*0.75)+fract(b.x*0.5+b.y*0.75)*0.25; }",
 "void main(){",
 "  vec2 F=gl_FragCoord.xy; vec2 U=F;",
 "  float row=mod(floor(F.y/2.0),61.0); float tq=mod(floor(uTime*8.0),59.0);",   /* acotados: en mediump, fila×456 desbordaría */
 "  float trig=step(0.965,hsh(vec2(row,tq)))*uGlitch;",
 "  U.x+=(hsh(vec2(row,tq+1.0))-0.5)*uRes.x*0.08*trig;",
 "  float t=uTime*-2.0;",
 "  vec3 p=vec3(0.0,0.0,-1.0-0.5*sin(t*0.1)); vec3 l=vec3(0.0);",
 "  vec3 d=normalize(vec3(2.0*(U-uCenter),uRes.y));",
 "  for(int i=0;i<STEPS;i++){",
 "    vec3 b=p; b.xy=rot2(sin(b.xy*0.25),t*0.5+b.z*2.0);",
 "    float s=0.001+abs(gno(b*20.0)/20.0-gno(b))*0.7;",
 "    s+=abs(p.y*0.2+sin(p.z*2.0+abs(p.x)*0.5))*0.5;",
 "    p+=d*s;",
 "    l+=(1.0+1.5*sin(float(i)+length(p.xy*0.1)+2.0+vec3(3.0,1.5,0.5)))/s;",
 "  }",
 "  vec3 lt=min(l*(0.0316*10.0/float(STEPS)),vec3(60.0));",
 "  vec3 col=aces(lt*lt)*0.6+0.075;",
 "  float v=clamp((dot(col,vec3(0.299,0.587,0.114))-0.075)/0.6,0.0,1.0);",
 "  vec2 q=(F-uCenter)/uRes.y; float r=length(q); float an=atan(q.y,q.x);",
 "  float edge=uOpen*1.3+0.05*uOpen*sin(an*7.0+uTime*11.0)*sin(an*3.0-uTime*6.0);",
 "  float inside=step(r,edge);",
 "  float rim=uRim*(1.0-smoothstep(0.0,0.07,edge-r));",
 "  v=v*mix(0.5,1.0,smoothstep(0.06,0.5,r));",
 "  v=clamp(v+rim*0.95,0.0,1.0);",
 "  float lv=floor(v*5.0+bayer4(F)*0.999);",
 "  vec3 c=uC0; c=mix(c,uC1,step(0.5,lv)); c=mix(c,uC2,step(1.5,lv)); c=mix(c,uC3,step(2.5,lv));",
 "  c=mix(c,uC4,step(3.5,lv)); c=mix(c,uC5,step(4.5,lv));",
 "  gl_FragColor=vec4(c*inside,inside);",
 "}"].join("\n");
function v3(h){ var c=hx(h); return [c[0]/255,c[1]/255,c[2]/255]; }
/* v12: el quad a pantalla completa (lo que era PlaneGeometry(2,2) + cámara ortográfica −1…1) y el atributo que three anteponía */
var PSH_HEAD="attribute vec3 position;\n";
function portalMk(){ if(!GL) return null; if(GL.portal) return GL.portal;
  var u={uRes:[1,1],uCenter:[0,0],uTime:0,uOpen:0,uRim:0,uGlitch:1}, i;
  for(i=0;i<6;i++) u["uC"+i]=[0,0,0];
  GL.portal={prog:null,fail:false,quad:null,u:u,sized:false,compiled:false,w:Math.ceil(AW/PORTAL_RES),h:Math.ceil(AH/PORTAL_RES)}; return GL.portal; }
/* compila (una vez por contexto; si falla, no se reintenta: el despiece sigue sin portal) y crea el quad */
function portalProg(){ var P=GL.portal; if(GL.ctx.lost) return null;
  if(!P.prog&&!P.fail){ P.prog=GL.ctx.program("portal",PSH_HEAD+PSH_V,PSH_F,{STEPS:PORTAL_STEPS}); P.fail=!P.prog; P.compiled=!!P.prog; }
  if(P.prog&&(!P.quad||!P.quad.b)) P.quad=GL.ctx.buffer(new Float32Array([-1,-1,0, 1,-1,0, -1,1,0, 1,1,0]));
  return P.prog; }
/* ¿habrá portal en este lanzamiento? (decide también la curva del oscurecido, como window.THREE en la v11) */
function portalReady(){ if(!PORTAL_ON||!window.P8EGL) return false; initGL(); var P=portalMk(); return !!(P&&portalProg()); }
/* compila el programa del portal en frío, con el corredor quieto (en el TV compilar puede costar decenas de ms) */
function fxPrewarm(){ if(REDUCE||!PORTAL_ON||!CASS_RICH||!window.P8EGL) return;
  if(tw||LAUNCH.phase||BOOT.on){ setTimeout(fxPrewarm,600); return; }   // v15: no toca el portal mientras la intro lo usa
  initGL(); var P=portalMk(); if(!P||P.compiled) return;
  try{ portalProg(); }catch(e){ FX.err=String(e&&e.message||e); } }
/* el canvas del arte vuelve a su tamaño (lo llama el dispersal antes de usarlo) */
function portalRestore(){ if(GL&&GL.portal&&GL.portal.sized){ glSizeArt(); GL.portal.sized=false; } }
function portalPal(app){ var t=app.tint, K="#1A0F14";
  return PORTAL_TINT==="app"?[mix(t,K,0.86),mix(t,K,0.62),mix(t,K,0.36),t,mix(t,PAL.cr,0.42),PAL.cr]
                            :[K,PAL.p,PAL.b,PAL.r,PAL.o,PAL.y]; }
function portalBegin(app){ if(!portalReady()) return false; var P=GL.portal;
  artReq++;                                                              // v12: un relevo aún cargando ya no arranca encima del portal
  if(inTransition){ artStop(); settleStill(artIdx); }                     // un dispersal en curso cede el canvas
  var pal=portalPal(app), i; for(i=0;i<6;i++) P.u["uC"+i]=v3(pal[i]);
  if(!P.sized){ GL.ctx.size(P.w,P.h); P.sized=true; }              // ya a 1/PORTAL_RES (dos lanzamientos seguidos): no se realoja
  GL.ctx.clear();
  P.u.uRes=[P.w,P.h];
  var c=FX.center||[AW/2,AH/2]; P.u.uCenter=[c[0]/PORTAL_RES,(AH-c[1])/PORTAL_RES];
  P.u.uGlitch=1; P.u.uOpen=0; P.u.uRim=1;
  artCanvas.style.transition="none"; artCanvas.classList.add("portal"); artCanvas.style.opacity="1";
  return true; }
/* el iris: se abre tras la anticipación, 140 → 700 ms con RECOIL (con POP se comía el arte en 150 ms y no se veía
   abrirse); cubre el lienzo hacia los 560 ms. El campo ACELERA con la zambullida (t² desde 550 ms). */
var IRISF=bez(0.3,0,0.2,1);
function portalFrame(t){ var P=GL.portal, ts=t/1000, c=GL.ctx, a0;
  P.u.uOpen=IRISF(clamp((t-140)/560,0,1)); P.u.uRim=1-0.6*smooth(700,1000,t);
  P.u.uTime=3.0+ts*0.9+2.4*Math.pow(Math.max(0,ts-0.55),2);
  if(FX_PROF) a0=performance.now();
  c.clear(); c.blendOff(); c.draw(P.prog,{position:[P.quad,3]},P.u,c.gl.TRIANGLE_STRIP,4);   // = autoClear + NoBlending de la v11
  if(FX_PROF){ c.gl.finish(); var g=performance.now()-a0; FX.gpu+=g; FX.gpuN++; if(g>FX.gpuMax) FX.gpuMax=g; }
  FX.portalFrames++; }
function fxEnsureCanvas(){ if(FX.cv) return FX.cv; var cv=mkCanvas(1,1); cv.className="lx-zap"; cv.setAttribute("aria-hidden","true");
  tv.insertBefore(cv,document.querySelector(".vig")); FX.cv=cv; FX.c=cv.getContext("2d"); return cv; }
function fxStart(app,arte,rev){ fxStop(); if(REDUCE||!CASS_RICH) return;
  var master=LAUNCH.anims[0]; if(!master) return;
  var st=rich.stage, r=st.getBoundingClientRect(), tok=++FX.tok, cs=getComputedStyle(st);
  FX.on=true; FX.arte=arte; FX.app=app; FX.master=master; FX.runs++; FX.prevBox=null; FX.box=[0,0,0,0]; FX.rev=!!rev; if(rev) FX.revRuns++;
  FX.sc=(r.width/STAGE.s)/st.offsetWidth; FX.sx=(r.left-STAGE.x)/STAGE.s; FX.sy=(r.top-STAGE.y)/STAGE.s;
  FX.cx=st.offsetWidth/2; FX.cy=st.offsetHeight/2; FX.pd=parseFloat(cs.perspective)||1620;
  var LN={L0:rich.cvRear,L1:rich.L1,L2:rich.L2,L3:rich.cvTapa,L4:rich.L4};
  FX.L={}; Object.keys(LN).forEach(function(k){ var e=LN[k], s=getComputedStyle(e);
    FX.L[k]={el:e,x:parseFloat(s.left)||0,y:parseFloat(s.top)||0,w:parseFloat(s.width)||e.offsetWidth,h:parseFloat(s.height)||e.offsetHeight,m:null,op:1}; });
  fxRead(); var o={}; if(!rev||!FX.center) FX.center=fxP(FX.L.L0,FX.L.L0.w/2,FX.L.L0.h/2,o)?[o.x,o.y]:[AW/2,AH/2];   // v13: la vuelta usa el centro de la ida
  if(ZAP){ var cv=fxEnsureCanvas(); cv.width=Math.ceil(AW/ZAP_RES); cv.height=Math.ceil(AH/ZAP_RES); cv.style.display="block"; }
  FX.portalOn=!arte&&!BOOT.arming&&portalBegin(app);   // v15.2: el armado de la intro no abre un segundo portal (la intro ya tuvo el suyo)
  tAdd(function(){ if(FX.tok!==tok||!FX.on) return true;
    if(LAUNCH.phase!=="out"&&LAUNCH.phase!=="back"){ fxStop(); return true; }
    /* v13: en la vuelta, t es el tiempo de la IDA que se está viendo (LX.T − t'): poses, envolventes y portal invertidos;
       tp es el tiempo físico (forma de los rayos, anclas y edad de las chispas: caen con la gravedad de siempre) */
    var a0=performance.now(), ct=FX.master.currentTime, el=(ct==null?0:ct)/LAUNCH_SLOW, t=FX.rev?Math.max(0,LX.T-el):el, tp=el; FX.lastT=t;
    try{ fxRead(); if(ZAP) fxZap(t,tp); if(FX.portalOn) portalFrame(t); }catch(e){ FX.err=String(e&&e.message||e); fxStop(); return true; }
    var ms=performance.now()-a0; FX.ms+=ms; if(ms>FX.msMax) FX.msMax=ms; FX.frames++;
    return false; }); }
/* fuera: la electricidad desaparece (y libera su memoria); el portal se oculta y su canvas queda a opacidad 0 hasta el
   próximo dispersal (portalRestore). Se llama con el velo ya opaco, en Arte al llegar a la obra y en launchReset. */
function fxStop(){ var was=FX.on; FX.on=false; FX.tok++;
  if(FX.cv){ FX.cv.style.display="none"; FX.cv.width=1; FX.cv.height=1; FX.prevBox=null; }
  if(FX.portalOn){ FX.portalOn=false; artCanvas.style.opacity="0"; artCanvas.classList.remove("portal");
    void artCanvas.offsetWidth; artCanvas.style.transition=""; }
  return was; }
function toggleFS(){ if(document.fullscreenElement) document.exitFullscreen(); else if(document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); }
/* ===== v4 · HUD: MODELO DEL TV (arriba izq.) · APP · VERSIÓN · RED (arriba der.) =============
   Todo se lee del propio TV si está; en localhost hay respaldo y queda marcado como simulado.
   · Modelo: webapis.productinfo.getRealModel() («UN65JS9500»); si no, getModel() («UJS9500»).
     Samsung ProductInfo API, desde 2.3, privilegio público http://developer.samsung.com/privilege/productinfo.
     Requiere $WEBAPIS/webapis/webapis.js en el index.html del .wgt. Si hay webapis pero no responde, sale
     «SAMSUNG»: en un TV real nunca se enseña el valor de maqueta.
   · Versión: tizen.application.getCurrentApplication().appInfo.version (= config.xml); si no, APP_VERSION.
   · Red, TRES estados: EN LÍNEA = gateway conectado Y el último refresco del clima/sondeo fue bueno ·
     SIN INTERNET = gateway sí, refresco falla · SIN RED = sin gateway. Gateway: en el TV,
     webapis.network.isConnectedToGateway() + addNetworkStateChangeListener (Network API, desde 2.3,
     privilegio público http://developer.samsung.com/privilege/network.public); en localhost,
     navigator.onLine + online/offline. Antes del primer resultado dice «COMPROBANDO» (no se inventa). */
var hmodel=document.getElementById("hmodel"), happ=document.getElementById("happ"), hver=document.getElementById("hver"),
    hnet=document.getElementById("hnet"), hnetDot=document.getElementById("hnetDot"), hbrand=document.getElementById("hbrand");
function clip(s,n){ s=String(s==null?"":s).replace(/[^A-Za-z0-9_.\- ]/g,"").replace(/^\s+|\s+$/g,""); return s.length>n?s.slice(0,n):s; }
/* v14: webapis.productinfo crea un <embed> de plugin en document.body la 1.ª vez que se usa
   (W1/R6-4c); por eso NO se llama a webapis antes de DOMContentLoaded. Si el documento aún se
   está cargando y hay webapis, la lectura real se aplaza a DOMContentLoaded; mientras, el HUD enseña el respaldo «SAMSUNG»
   (nunca el valor de maqueta en un TV real). En localhost (sin webapis) se resuelve al momento, idéntico a antes. */
function modelFallback(){ if(window.webapis&&window.webapis.productinfo) return {model:"SAMSUNG",src:"respaldo",simulated:false};
  var q=clip(qp("model",""),24); return {model:q||MODEL_MOCK,src:q?"?model":"maqueta",simulated:true}; }
function readModel(){ var pi=window.webapis&&window.webapis.productinfo, m="", src="";
  if(!pi) return modelFallback();
  try{ if(typeof pi.getRealModel==="function"){ m=clip(pi.getRealModel(),24); src="getRealModel"; } }catch(e){ m=""; }
  if(!m){ try{ if(typeof pi.getModel==="function"){ m=clip(pi.getModel(),24); src="getModel"; } }catch(e){ m=""; } }
  return m?{model:m,src:src,simulated:false}:{model:"SAMSUNG",src:"respaldo",simulated:false}; }
var MODEL=modelFallback();
var VER=(function(){ try{ var t=window.tizen;
    if(t&&t.application&&typeof t.application.getCurrentApplication==="function"){
      var v=clip(t.application.getCurrentApplication().appInfo.version,16); if(v) return {v:v,src:"config.xml"}; } }catch(e){}
  return {v:APP_VERSION,src:"APP_VERSION"}; })();
hmodel.textContent=MODEL.model; happ.textContent=APP_NAME; hver.textContent="v"+VER.v;
/* v14: si hay webapis y el documento aún carga, la lectura real del modelo espera a DOMContentLoaded */
(function(){ function go(){ if(window.webapis&&window.webapis.productinfo){ MODEL=readModel(); hmodel.textContent=MODEL.model; } }
  if(window.webapis&&window.webapis.productinfo&&document.readyState==="loading") document.addEventListener("DOMContentLoaded",go); else go(); })();
/* ?halo=X: prueba otra opacidad del respaldo crema (0–0,9) sin tocar el CSS. Sin el parámetro manda p8e.css (.40). */
if(HALO!==""&&isFinite(+HALO)){ var hA=Math.max(0,Math.min(0.9,+HALO)), hs=document.createElement("style");
  hs.textContent=".foot::before{background:rgba(255,254,232,"+hA+");box-shadow:0 0 20px 12px rgba(255,254,232,"+hA+")}"; document.head.appendChild(hs); }

var NET_LABEL=STR.net;
var NET={state:"",gw:null,wx:"",wxAt:0,src:"",forced:/^(online|nointernet|nonet)$/.test(NET_FORCE)?NET_FORCE:"",
  changes:0,probes:0,events:0,listener:null,timer:0,k:0,retries:0,nextAt:0,lost:false,recoveries:0,code:null};
/* el sondeo propio sólo con adaptadores sin orden de llamadas (seq/stale alternan por llamada: no se tocan) */
var NET_PROBE=!!window.P8EWeather&&/^(fixture|open-meteo|fail|empty)$/.test(IDLE.adapter);
function gwNow(){ var n=window.webapis&&window.webapis.network;
  if(n&&typeof n.isConnectedToGateway==="function"){ try{ var g=!!n.isConnectedToGateway(); NET.src="webapis"; return g; }catch(e){} }
  NET.src="navigator.onLine"; return navigator.onLine!==false; }
function netState(){ if(NET.forced) return NET.forced; if(NET.gw===false) return "nonet";
  return NET.wx==="ok"?"online":(NET.wx==="fail"?"nointernet":"checking"); }
function canAsk(){ var s=netState(); return s==="online"||s==="checking"; }   // SIN INTERNET: sólo el backoff · SIN RED: nada
/* devuelve true si el estado cambió; cada cambio (también el 1.º) se lo cuenta a las franjas */
function netRender(){ var s=netState(); if(s===NET.state) return false; var prev=NET.state, first=!prev; NET.state=s; NET.changes++;
  hnet.textContent=NET_LABEL[s]; hnetDot.className="net "+s; hbrand.setAttribute("data-net",s);
  if(!first&&s!=="checking") live.textContent=NET_LABEL[s]+".";
  panelNet(prev,s); return true; }
/* resultado de CUALQUIER llamada al clima (panel, sondeo o reintento): dato fresco = bueno; viejo o nada = falla */
function netWx(x){ if(NET.gw!==false) NET.wx=(x&&!x.stale)?"ok":"fail"; NET.wxAt=Date.now(); netRender(); netArm(); }
/* v6 · PRÓXIMA LLAMADA según el estado (regla 5 del autor):
   · SIN RED: ninguna. Se espera al evento de la red (online / gateway del TV; v14: en este firmware no hay INTERNET_*).
   · SIN INTERNET: backoff creciente RETRY_MS[k] (1, 2, 5, 10, 30 min y luego cada 30 min) hasta el próximo
     éxito. k sólo vuelve a 0 con EN LÍNEA. Los reposos y el refresco del panel NO piden en este estado.
   · EN LÍNEA / COMPROBANDO: el sondeo de siempre, WX_EVERY_MS después de la última llamada. */
function netArm(){ clearTimeout(NET.timer); NET.timer=0; NET.nextAt=0; var s=netState();
  if(s==="nonet") return;
  if(s==="nointernet"){ var ms=RETRY_MS[Math.min(NET.k,RETRY_MS.length-1)]; NET.k++; NET.nextAt=Date.now()+ms;
    NET.timer=setTimeout(netRetry,ms); return; }
  if(s==="online") NET.k=0;
  if(NET_PROBE) NET.timer=setTimeout(function(){ netProbe(false); },WX_EVERY_MS); }
function netRetry(){ NET.timer=0; NET.nextAt=0; if(netState()!=="nointernet") return; NET.retries++; request(); }   // el resultado llega por netWx
/* sondeo: el periódico respeta el estado; el que dispara un evento de la red (force) no espera al backoff */
function netProbe(force){ if(!NET_PROBE) return; var s=netState(); if(s==="nonet"||(!force&&s==="nointernet")) return;
  NET.probes++; P8EWeather.getWeather().then(netWx,function(){ netWx(null); }); }
function netEvent(){ NET.events++; var was=NET.gw; NET.gw=gwNow();
  if(NET.gw===false) NET.wx="";                                     // sin gateway, lo de internet ya no se sabe: al volver, COMPROBANDO
  if(netRender()) netArm();
  if(NET.gw&&was===false) netProbe(true); }
(function(){ var n=window.webapis&&window.webapis.network;
  addEventListener("online",netEvent); addEventListener("offline",netEvent);   // listeners del DOM: sin webapis, van ya
  /* v14: isConnectedToGateway y addNetworkStateChangeListener pasan por un plugin Pepper que webapis.js
     monta como <embed> en document.body la 1.ª vez (W1/R6-4c); con webapis presente se aplazan a
     DOMContentLoaded. Sin webapis (localhost) todo esto corre al momento, idéntico a antes. */
  function go(){ var m=window.webapis&&window.webapis.network;
    if(m&&typeof m.addNetworkStateChangeListener==="function"){
      /* v14: en el firmware de este TV NetworkState va de 1 a 8
         (4 = GATEWAY_CONNECTED, 5 = GATEWAY_DISCONNECTED) y NO hay INTERNET_*: las dos ramas que los miraban no podían
         dispararse. Cualquier evento vuelve a leer el gateway (netEvent → isConnectedToGateway), que es lo que cuenta; con
         4 tras una caída, netEvent ya sondea al momento. El código crudo queda en NET.code (sólo informativo). */
      try{ NET.listener=m.addNetworkStateChangeListener(function(st){ NET.code=st; netEvent(); }); }catch(e){ NET.listener=null; } }
    NET.gw=gwNow(); netRender(); panelBoot(); }   // v5/v6: la 1.ª petición del panel hace de 1.er sondeo (una sola llamada)
  if(n&&document.readyState==="loading") document.addEventListener("DOMContentLoaded",go); else go(); })();

var clk=document.getElementById("clk");
function tick(){ var t=hhmmNow(); clk.textContent=t; if(IDLE.shownStale) setSrc(); else { var w=document.getElementById("wxWhen"); if(w) w.textContent=t; } pypTick(); }
/* v11 (auditoría 19): cada 15 s podía ir hasta 15 s tarde al cambiar el minuto; ahora se programa al minuto siguiente */
var clkT=0; function clockLoop(){ tick(); clearTimeout(clkT); clkT=setTimeout(clockLoop,60000-(Date.now()%60000)+30); }
clockLoop();

/* v3: el lienzo no cambia de tamaño; si cambia la ventana sólo se re-encaja (nada que repintar) */
addEventListener("resize",fitStage);
if(MQ&&MQ.addListener) MQ.addListener(function(m){ if(m.matches){ REDUCE=true; document.documentElement.classList.add("reduce"); rich.release(); settle(); stopPan(); resetStill(); clearTimeout(artTimer); } });

/* ===== informe de presupuesto (C11): canvases vivos y memoria estimada ===================== */
/* v11 (revisión de seguridad H11): las ayudas de prueba sólo existen con ?dev=1 (window.P8E); en el TV no hay window.P8E */
var P8E_API={
  stats:function(){
    var dom=[].slice.call(document.querySelectorAll("canvas")), b2d=0, n2d=0, live2d=0, i, c;
    for(i=0;i<REG.length;i++){ c=REG[i]; if(c.width>1||c.height>1){ n2d++; b2d+=c.width*c.height*4; if(dom.indexOf(c)>=0) live2d++; } }
    var gl=GL?{canvases:1,contexts:GLX.contexts,type:GL.ctx.type,webgl2:false,lost:GL.ctx.lost,buffer:[artCanvas.width,artCanvas.height],
      drawingBuffer:[GL.ctx.gl.drawingBufferWidth,GL.ctx.gl.drawingBufferHeight],scale:GL_SCALE,pointPx:+(DISP.GRID_STEP*DISP.POINT_SCALE*GL_SCALE).toFixed(2),
      backbufferMB:+(artCanvas.width*artCanvas.height*4*2/1048576).toFixed(1),points:GL.count,tex:GL.ctx.stats,errors:GL.ctx.errors.slice(0,4)}:{canvases:0,contexts:GLX.contexts};
    var tb=0; Object.keys(texCache).forEach(function(k){ tb+=texCache[k].w*texCache[k].h*4; });
    var richC=[rich.cvRear,rich.cvChassis,rich.cvReelT,rich.cvReelB,rich.cvRingT,rich.cvRingB,rich.cvTapa,rich.cvMount,rich.cvLogo];
    var rb=0; richC.forEach(function(c){ rb+=c.width*c.height*4; }); var lb=0; lites.forEach(function(c){ lb+=c.width*c.height*4; });
    return { reduce:REDUCE, canvas2dInDom:live2d, canvas2dTotal:n2d, mb2d:+(b2d/1048576).toFixed(1),
      richCanvases:richC.length, richMB:+(rb/1048576).toFixed(1), liteCanvases:lites.length, liteMB:+(lb/1048576).toFixed(1),
      webgl:gl, textures:Object.keys(texCache).length, textureMB:+(tb/1048576).toFixed(1),
      idle:IDLE.state, idleMs:IDLE_MS, wxEveryMs:WX_EVERY_MS, wxAdapter:IDLE.adapter, liveApproved:!!(window.P8EWeather&&P8EWeather.LIVE_APPROVED), idleEntered:IDLE.entries, noData:IDLE.noData,
      panel:{state:IDLE.state, phase:IDLE.phase, quiet:IDLE.quiet, netOK:netOK(), everShown:IDLE.everShown, firstAt:IDLE.firstAt,
        bands:bandsEl.className, resting:IDLE.resting, entries:IDLE.entries, exits:IDLE.exits, netExits:IDLE.netExits, returns:IDLE.returns, cycles:IDLE.cycles, coalesced:IDLE.coalesced,
        refreshes:IDLE.refreshes, late:IDLE.late, blocked:IDLE.blocked, stale:IDLE.shownStale, wxAgeMin:(IDLE.shown&&IDLE.shown.data.ts)?+((Date.now()-IDLE.shown.data.ts)/60000).toFixed(1):null,
        when:(function(){ var w=document.getElementById("wxWhen"); return w?w.textContent:""; })(), src:STR.wxSrc, temp:IDLE.shown?IDLE.shown.data.ahora.temp:null},
      weather:(window.P8EWeather&&P8EWeather.stats)?P8EWeather.stats():null,
      saver:artMode, art:ART_STATS,
      author:{every:AUTHOR_EVERY, fixed:AU_FIXED, random:AU_RANDOM, min:AUTHOR_MIN, max:AUTHOR_MAX, p:AUTHOR_P, seed:AU_SEED, need:AU.need, skips:AU.skips, ints:AU.ints.slice(), dwell:AUTHOR_DWELL, first:AUTHOR_FIRST, lead:AU_LEAD, flipMs:AU_FLIP_MS, on:AU.on, phase:AU.phase, shows:AU.shows,
        backs:AU.backs, clears:AU.clears, wakes:AU.wakes, deferred:AU.deferred, accMs:Math.round(AU.acc+(AU.runAt?performance.now()-AU.runAt:0)), running:!!AU.runAt,
        nextInMs:AU.dueAt?Math.round(AU.dueAt-performance.now()):null, appearances:IDLE.entries, qr:AU.qr, seal:AU.seal, sealPx:AU.sealPx, nobrand:NOBRAND,
        font:AU.font, fallbacks:AU.fallbacks, log:AU.log.slice(),
        /* v13: el pixel art (C2/C4): búfer de cada canvas, escala, partículas por lado y su celda, lo que faltaba antes del volcado */
        px:{ready:PX.ready, err:PX.err, on:PX.on, mode:PX.mode, f:PX.f, back:PX.bk, restAt:PX.restAt, closeAt:PX.closeAt, exact:PX.exact.slice(),
          parts:PX.parts.slice(), maxParts:AU_MAXP, cell:PX.cell.slice(), logical:[AUW,AUH], scale:AUPX, up:PX.up, why:PX.why, font:PX.font, prepMs:PX.prepMs,
          buffers:PX.cv.map(function(c){ return [c.width,c.height]; }), css:PX.cv.map(function(c){ return [c.style.left,c.style.top,c.style.width,c.style.height,getComputedStyle(c).imageRendering,getComputedStyle(c).display]; }),
          steps:PX.steps, draws:PX.draws, msAvg:PX.draws?+(PX.ms/PX.draws).toFixed(3):null, msMax:+PX.msMax.toFixed(3),
          qrStart:PX.S.length?PX.S[0].qrStart:null, qrLock:PX.S.length?PX.S[0].qrLock:null,
          units:PX.S.map(function(S){ var o={}; AU_CATS.forEach(function(k){ o[k]=S.by[k].length; }); return o; }),
          alive:PX.S.map(function(S){ return S.parts.filter(function(p){ return p.mode==="float"||p.mode==="fly"||p.mode==="fade"; }).length; }),
          prepSteps:PX.prepSteps, qr:PX.S.length?{x:PX.S[0].lay.qr.x,y:PX.S[0].lay.qr.y,w:PX.S[0].lay.qr.w,mod:PX.S[0].lay.qr.mod,n:PX.S[0].lay.qr.n,
            cssModule:PX.S[0].lay.qr.mod*AUPX,cssX:AU_LEFT[0]+PX.S[0].lay.qr.x*AUPX,cssY:AU_TOP+PX.S[0].lay.qr.y*AUPX,cssW:PX.S[0].lay.qr.w*AUPX}:null}},
      ficha:{i:FICHA.i, a:fichaA.textContent, t:fichaT.textContent, d:fichaD.textContent, fx:fichaFace.className.indexOf("fx")>=0, swaps:FICHA.swaps, cuts:FICHA.cuts}, idleSpin:IDLE_SPIN,
      launch:{phase:LAUNCH.phase, app:LAUNCH.app?LAUNCH.app.nm:null, arte:LAUNCH.arte, starts:LAUNCH.starts, ignored:LAUNCH.ignored, calls:LAUNCH.calls,
        returns:LAUNCH.returns, via:LAUNCH.via, why:LAUNCH.why, anims:LAUNCH.anims.length, backMs:LAUNCH_BACK_MS, slow:LAUNCH_SLOW, arteFx:LX_ARTE, T:LX.T, err:LAUNCH.err,
        fallbacks:LAUNCH.fallbacks, aborts:LAUNCH.aborts, fails:LAUNCH.fails, oks:LAUNCH.oks, away:LAUNCH.away,
        cine:LAUNCH.cine, curtain:{ms:CURTAIN_MS, armed:CURT.t0>0, on:CURT.on, ons:CURT.ons, offs:CURT.offs, backs:CURT.backs, why:CURT.why}, rewinds:LAUNCH.rewinds, cuts:LAUNCH.cuts, backFallbacks:LAUNCH.backFallbacks, specs:LAUNCH.specs.length, arteBack:LAUNCH.arteBack, posed:LAUNCH.posed, fxRev:FX.rev, fxRevRuns:FX.revRuns},
      hud:{model:MODEL.model, modelSrc:MODEL.src, modelSimulated:MODEL.simulated, app:APP_NAME, version:VER.v, versionSrc:VER.src,
        net:{state:NET.state, label:hnet.textContent, gw:NET.gw, wx:NET.wx, src:NET.src, forced:NET.forced, probe:NET_PROBE,
          probes:NET.probes, events:NET.events, changes:NET.changes, tvListener:NET.listener!=null, code:NET.code,
          retry:{k:NET.k, retries:NET.retries, nextInMs:NET.nextAt?Math.max(0,NET.nextAt-Date.now()):null, scheduleMs:RETRY_MS, lost:NET.lost, recoveries:NET.recoveries}}},
      stage:{w:STAGE_W,h:STAGE_H,scale:+STAGE.s.toFixed(4),x:STAGE.x,y:STAGE.y,win:[STAGE.w,STAGE.h],dpr:DPR,dev:DEV},
      icon:{bytes:ICON.bytes,ok:ICON.ok,djb2:ICON.djb2,stickerPx:ICON.stickerPx,ringPx:ICON.ringPx},
      fx:{zap:ZAP, zapRes:ZAP_RES, portal:PORTAL_ON, portalRes:PORTAL_RES, portalSteps:PORTAL_STEPS, portalTint:PORTAL_TINT,
        portalBuffer:GL&&GL.portal?[GL.portal.w,GL.portal.h]:null, compiled:!!(GL&&GL.portal&&GL.portal.compiled), on:FX.on, arte:FX.arte,
        portalOn:FX.portalOn, runs:FX.runs, t:+FX.lastT.toFixed(1), frames:FX.frames, zapFrames:FX.zapFrames, portalFrames:FX.portalFrames,
        bolts:FX.bolts, sparks:FX.sparks, maxBolts:FX.maxBolts, maxSparks:FX.maxSparks,
        jsMsAvg:FX.frames?+(FX.ms/FX.frames).toFixed(3):null, jsMsMax:+FX.msMax.toFixed(3),
        gpuMsAvg:FX.gpuN?+(FX.gpu/FX.gpuN).toFixed(3):null, gpuMsMax:+FX.gpuMax.toFixed(3), zapCanvas:FX.cv?[FX.cv.width,FX.cv.height,FX.cv.style.display]:null, err:FX.err},
      rafPending:!!T.raf, tickerTasks:T.q.length, rafCalls:T.calls, frames:T.frames,
      waapiRunning:document.getAnimations?document.getAnimations().filter(function(a){ return a.playState==="running"; }).length:-1 };
  },
  state:function(){ var ai=appIndex(); return {idx:idx,app:ai+1,name:APPS[ai].nm,hcoord:hcoord.textContent,cap:capNm.textContent,
    richOn:rich.card===cards[ai], tilt:rich.cass.classList.contains("t-leve"), artMode:artMode, artIdx:artIdx,
    idle:IDLE.state, phase:IDLE.phase, quiet:IDLE.quiet, bands:bandsEl.className, spinning:!!rich.spReelT.anim, launch:LAUNCH.phase,
    inTransition:inTransition, artMs:Math.round(performance.now()-artStartT),
    hid:{on:HID.on,n:HID.n,paused:HID.paused,resumed:HID.resumed,cut:HID.cut}, artTimer:!!artTimer,
    pc:{hits:PC.hits,miss:PC.miss,warm:PC.warm,cached:PC.order.length}, cfprof:CF.prof,
    flat:{on:FL.on,n:FL.n,hidden:FL.hid.length,err:FL.err,ms:FL.ms||0}, cassflat:{on:CF.on,n:CF.n,mode:CF.mode,ms:CF.bakeMs,anims:CF.anims.length,stars:CF.hid.length,err:CF.err,waits:CF.waits,preMs:CF_PRE_MS,job:!!CF.job},
    relevo:{wait:RELEVO_WAIT,pend:relevoPend,armed:!!relevoT}, prof:ART_STATS.prof?{wait:Math.round(ART_STATS.prof.wait||0),prog:+(ART_STATS.prof.prog||0).toFixed(1),restore:+(ART_STATS.prof.restore||0).toFixed(1),
      still:+(ART_STATS.prof.still||0).toFixed(1),r1:+(ART_STATS.prof.r1||0).toFixed(1),gap:Math.round(ART_STATS.prof.gap||0),gapP:+(ART_STATS.prof.gapP||0).toFixed(2),pre:ART_STATS.prof.pre?+ART_STATS.prof.pre.toFixed(2):0,settle:+(ART_STATS.prof.settle||0).toFixed(1),after:Math.round(ART_STATS.prof.after||0)}:null}; },   // v16 / v16.1
  idleNow:function(){ idleCancel(); idleFire(); },
  /* v7 · PRUEBAS: pose de la pila (transform y opacity calculados de cada capa + inline de los giros) para comparar
     el reposo antes de abrir una app con el de después de volver */
  cassPose:function(){ var r=rich, o={}, cs=function(n){ var s=getComputedStyle(n); return s.transform+" | "+s.opacity; };
    o.cass=cs(r.cass); o.L0=cs(r.cvRear); o.L1=cs(r.L1); o.L2=cs(r.L2); o.L3=cs(r.cvTapa); o.L4=cs(r.L4);
    r.walls.forEach(function(w,i){ o["wall"+i]=cs(w); });
    o.lx=r.cass.classList.contains("lx-run"); o.tilt=r.cass.classList.contains("t-leve"); o.anims=r.cass.getAnimations?r.cass.getAnimations().length:-1;
    o.layerAnims=[r.cvRear,r.L1,r.L2,r.cvTapa,r.L4].concat(r.walls).reduce(function(n,e){ return n+(e.getAnimations?e.getAnimations().length:0); },0);
    o.focused=r.focused; o.paused=r.paused; o.onCard=r.card===cards[appIndex()]; return o; },
  /* PRUEBAS: envejece N min el dato en memoria y el de la caché (simula el paso del tiempo sin esperar) */
  ageData:function(min){ var d=min*60000; function o(x){ if(x&&x.data&&x.data.ts) x.data.ts-=d; }
    var seen=[]; [IDLE.shown].concat(Object.keys(IDLE.last).map(function(k){ return IDLE.last[k]; })).forEach(function(x){ if(seen.indexOf(x)<0){ seen.push(x); o(x); } });
    try{ var k=P8EWeather.stats().cacheKey, c=JSON.parse(localStorage.getItem(k)||"null"); if(c){ c.ts-=d; c.clima.ts=c.ts; localStorage.setItem(k,JSON.stringify(c)); } }catch(e){}
    setSrc(); return d; },
  /* v8 · sólo pruebas: P8E.showArt(i) = corte a la obra i (la ficha se funde); P8E.nextArt() = relevo con el dispersal */
  showArt:function(i){ artCut(((i|0)%ART.length+ART.length)%ART.length); }, nextArt:function(){ artAdvance(false); },
  /* v16.11 · palancas, registro de asentados/relevos (rf = fotograma que lo pinta), caché de texturas y estado del asentado */
  v1611:function(){ return {lev:{relevogap:RELEVO_GAP,prefretry:PREF_RETRY,settle2:SETTLE2,noreflow:NO_REFLOW,bandsflat:BANDS_FLAT,texmax:TEX_MAX,warpfold:WARP_FOLD},
    log:V11.log.slice(), tex:texOrder.slice(), artStartT:artStartT, artIdx:artIdx, set:SET.st, relevoT:relevoT, relevoPend:relevoPend, frames:T.frames, uploads:ART_STATS.uploads,
    texWH:Object.keys(texCache).map(function(k){ return k+":"+texCache[k].w+"x"+texCache[k].h; })}; },
  /* v13 · sólo pruebas. auPose(f[, b]) = la autoría en el fotograma f del spec (con b, el cierre empezado en b), recalculada desde 0
     (determinista); auRun() = la próxima autoría ya (salta la espera de AUTHOR_EVERY, respeta auOK). lxPose(ms) = TODAS las pistas
     del lanzamiento (ida o vuelta) pausadas en ms (× ?launchslow); sin respaldos ni temporizadores mientras se posa. lxEnd() =
     termina la fase posada como si hubiera llegado onfinish. */
  auPose:function(f,b){ clearTimeout(AU.dt); AU.dt=0; return pxPose(f|0,b==null?null:(b|0)); }, auRun:function(){ if(!auOK()) return false; clearTimeout(AU.t); auFire(); return true; },
  auBack:function(){ auBack(); return AU.phase; },
  lxPose:function(ms){ LAUNCH.posed=true; clearTimeout(LAUNCH.fbT); LAUNCH.fbT=0; lxTimers();
    LAUNCH.anims.forEach(function(a){ try{ a.pause(); a.currentTime=ms*LAUNCH_SLOW; }catch(e){} }); return {phase:LAUNCH.phase,n:LAUNCH.anims.length,ms:ms}; },
  lxEnd:function(){ var p=LAUNCH.phase; LAUNCH.posed=false; if(p==="back") launchRewound(); else if(p==="out"){ if(LAUNCH.arte) launchArteDone(); else launchOpen(); } return p; },
  /* v15 · sólo pruebas: bootPose(ms) = la intro de arranque posada en ms (determinista, f(t); recalcula el fotograma y dibuja,
     incluido el portal); bootSkip() = cortar la intro ya (como una tecla del mando); bootState() = lo que la intro está
     mostrando (fase, modelo/red reales, portal, partículas). bootT = la duración total hasta el corredor. */
  bootPose:function(ms){ ms=+ms||0; bootEnsure(); BOOT.on=true; BOOT.posing=true;
    if(artwrapEl&&artwrapEl.style.zIndex!=="47"){ BOOT.prevZ=artwrapEl.style.zIndex; artwrapEl.style.zIndex="47"; }
    if(!REDUCE&&window.P8EGL&&PORTAL_ON){ try{ portalReady(); }catch(e){} }
    var resolved=ms>=BC.portalClose;
    BOOT.bg.style.opacity=resolved?"0":"1";
    if(artStill) artStill.style.visibility=resolved?(BOOT.stillVis||""):"hidden";                 // posando el final: se ve el corredor que resuelve
    if(artwrapEl) artwrapEl.style.zIndex=resolved?(BOOT.prevZ||""):"47";
    if(resolved&&BOOT.portalOn) bootPortalDown();
    bootRender(ms); return ms; },
  bootSkip:function(){ bootSkip(); return BOOT.done; },
  bootState:function(){ return {on:BOOT.on,done:BOOT.done,posing:BOOT.posing,skipped:BOOT.skipped,skips:BOOT.skips,
    frames:BOOT.frames,portalOn:BOOT.portalOn,model:BOOT.model,net:BOOT.net,shownModel:BOOT.shownModel,shownNet:BOOT.shownNet,
    parts:BOOT.title?BOOT.title.parts.length:0,T:BC.done,intro:BOOT_INTRO,
    armStart:BC.armStart,armEnd:BC.armEnd,Tfull:BC.armEnd,armStarted:BOOT.armStarted,armRun:BOOT.armRun,armApp:BOOT.armApp,
    overlayGone:BOOT.overlayGone,idx:idx,lastApp:bootLast(null),phase:LAUNCH.phase,specs:LAUNCH.specs?LAUNCH.specs.length:0,
    fxRev:FX.rev,fxRevRuns:FX.revRuns}; },
  /* v9 · sólo pruebas: diagnóstico de los programas GL (enlazado + log) y las fuentes del portal (para compilarlas aparte en
     un contexto WebGL1 de prueba) */
  glDiag:function(){ if(!GL) return null; var c=GL.ctx, g=c.gl, i=c.info();
    i.programs=c.programs.map(function(p){ return {name:p.name, linked:!!(p.prog&&g.getProgramParameter(p.prog,g.LINK_STATUS)), progLog:p.prog?g.getProgramInfoLog(p.prog):null,
      uniforms:Object.keys(p.u).length, attribs:Object.keys(p.a)}; });
    i.webgl2=false; return i; },
  portalSrc:function(){ return {vs:PSH_V, fs:PSH_F, steps:PORTAL_STEPS}; },
  fxProject:function(){ if(!FX.on) return null; var o={}, res={};   // esquinas proyectadas de cada capa (para comparar con su caja)
    Object.keys(FX.L).forEach(function(k){ var L=FX.L[k], xs=[], ys=[]; [[0,0],[L.w,0],[L.w,L.h],[0,L.h]].forEach(function(p){ if(fxP(L,p[0],p[1],o)){ xs.push(o.x); ys.push(o.y); } });
      var bc=L.el.getBoundingClientRect(); res[k]={mine:xs.length?[Math.min.apply(0,xs),Math.min.apply(0,ys),Math.max.apply(0,xs),Math.max.apply(0,ys)]:null,
        dom:[(bc.left-STAGE.x)/STAGE.s,(bc.top-STAGE.y)/STAGE.s,(bc.right-STAGE.x)/STAGE.s,(bc.bottom-STAGE.y)/STAGE.s], op:L.op}; });
    return res; },
  /* v11 · sólo pruebas: el rótulo con un texto cualquiera (C8: el scramble no interpreta markup), el roster con su appId y
     la preferencia de movimiento reducido (reducePref(true|false); manda en el próximo arranque) */
  scramble:function(t){ t=String(t); capNm.setAttribute("data-text",t); scramble(capNm,t,{spread:5,sjit:1,min:6,ejit:4}); },
  apps:function(){ return APPS.map(function(a){ return {nm:a.nm,appId:a.appId,appAlias:a.appAlias||"",aliasLaunchable:a.aliasLaunchable===true,src:a.src||"",
    role:a.role||"",logo:a.logo,tint:a.tint,num:a.num,tries:a.tries?JSON.parse(JSON.stringify(a.tries)):null}; }); }, reducePref:reducePref,
  v169:function(){ return {n:N,rail:!!document.getElementById("rail"),capw:{on:CAPW.on,reveals:CAPW.reveals},
    pyp:{on:PYP_ON,now:PYP_NOW,day:PYP.day,v:PYP.v,renders:PYP.renders,checks:PYP.checks,verdicts:PYP.verdicts,cancels:PYP.cancels,pending:!!PYP.ct,net:!!(window.P8EPyP&&P8EPyP.net())}}; },
  pypShow:function(ms,v){ if(!window.P8EPyP) return ""; var r=P8EPyP.today(ms), h=pypBands(r,v||""), t="", i, c;
    for(i=0;i<3;i++){ c=document.getElementById("wR"+(i+1)); if(!c) continue; c.innerHTML=h[i]; t+=c.textContent+" "; } return t; },
  ratesShow:function(){ ratesRender(); var a=document.getElementById("wR4"), b=document.getElementById("wR5"); return (a?a.textContent:"")+" | "+(b?b.textContent:""); },
  v167:function(){ return {sysLogos:SYS_LOGOS,sys:SYS_TAPES,n:N,noshowMs:NOSHOW_MS,awayMs:AWAY_MS,noshows:LAUNCH.noshows,boot:{back:BOOT.back,line:BOOT.line},
    exitg:{asks:EXITG.asks,exits:EXITG.exits,armed:!!EXITG.at},cap:capGo.textContent,msg:lxMsg.textContent}; },
  rich:rich, items:items
};
window.P8E=P8E_API;   // v16.10: API de introspección (solo lectura) siempre disponible: el arnés la necesita también SIN ?dev=1 (el pie de dev sube 34 px y falsea el encuadre)

/* ===== v15.1 · FASE BOOT: intro cinemática de arranque RECORTADA ==============
   Storyboard (ms; reloj = performance.now reanclado a t=0 = APERTURA DEL PORTAL; un solo rAF del Ticker; todo es f(t) → P8E.bootPose):
     0–720    el PORTAL se abre (raymarch de gl.js, único contexto WebGL1, paleta de franjas). Su iris crece desde 0: ES la entrada.
     540–1280 DISPERSAL de partículas 2D que forma el TÍTULO (wordmark provisional, lenguaje de pigmento del portfolio)
     1100–1510 datos reales: SYS.READY · modelo (getRealModel/maqueta) · estado de red (preconexión, v14)
     1510–1820 resuelve: el portal se cierra, las partículas se dispersan, el fondo se funde → corredor inicial v14
     ~2020    corredor v14 (fin de la intro)
   v15.1: la CABEZA retro (encendido CRT, barras de color 90s, electricidad/rayos y grano VHS) se RETIRÓ.
     La intro empieza en seco con el portal; como el portal abre su iris desde 0, no hace falta fundido añadido. El reloj se
     reancló restando 1340 ms a cada hito de la v15 (portalStart 1340→0). Duración ~2,0 s (antes 3,36 s).
   Saltable: cualquier tecla del mando corta y va al corredor al instante. reduced-motion: fundido breve, sin partículas. */
var BC={ portalStart:0, portalCover:560, portalFull:720,
  titleStart:540, titleLand:1280,
  dataStart:1100,
  resolve:1510, portalClose:1820, done:2020,
  /* v15.2: la intro NO corta a un corredor ya firme; RESUELVE armando el cassette de la última
     app. El re-ensamble arranca cuando el portal cede (armStart=portalClose) y dura LX.T (motor de la VUELTA INVERSA v13,
     reutilizado). armEnd = armStart + LX.T (nominal, ×LAUNCH_SLOW en vivo); el overlay (velo + lienzo 2D) se retira en
     `done`, el corredor queda firme al acabar el armado (bootAfterArm). */
  armStart:1820, armEnd:1820+LX.T };
var BOOT={on:false,done:false,posing:false,t0:0,tok:0,bg:null,cv:null,c:null,title:null,portalOn:false,prevZ:"",back:null,line:"",
  model:"",net:"",shownModel:false,shownNet:false,skipped:false,skips:0,frames:0,seed:0x5115A17,cued:0,
  bgFaded:false,artBack:false,overlayGone:false,resolvedOnce:false,arming:false,armRun:false,armStarted:false,armApp:-1};
var bE_out=bez(0.16,1,0.3,1), bE_in=bez(0.7,0,0.84,0);
function be(x){ return bE_out(clamp(x,0,1)); }
function bi(x){ return bE_in(clamp(x,0,1)); }
function lerp(a,b,u){ return a+(b-a)*u; }
function bootRnd(s){ s=s>>>0; return function(){ s=(s+0x6D2B79F5)>>>0; var t=s; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
function bootEnsure(){
  if(BOOT.cv) return;
  var bg=document.createElement("div"); bg.id="bootBg"; bg.setAttribute("aria-hidden","true");
  bg.style.cssText="position:fixed;top:0;right:0;bottom:0;left:0;z-index:46;background:#05040A;opacity:1;pointer-events:none;"+
    "-webkit-transition:opacity 180ms linear;transition:opacity 180ms linear";
  tv.appendChild(bg); BOOT.bg=bg;
  var cv=mkCanvas(Math.round(STAGE_W*DPR),Math.round(STAGE_H*DPR)); cv.id="bootCv"; cv.setAttribute("aria-hidden","true");
  cv.style.cssText="position:fixed;top:0;left:0;width:"+STAGE_W+"px;height:"+STAGE_H+"px;z-index:48;pointer-events:none";
  tv.appendChild(cv); BOOT.cv=cv; BOOT.c=cv.getContext("2d");
  if(artStill){ BOOT.stillVis=artStill.style.visibility; artStill.style.visibility="hidden"; }   // el still del corredor no es parte de la intro: tapado por el fondo
  BOOT.model=(typeof MODEL!=="undefined"&&MODEL&&MODEL.model)||"SAMSUNG";
  /* v15.1: fuera el grano VHS (líneas de barrido + ruido): era la piel de TV retro de la cabeza recortada. */
}
/* el wordmark (provisional) rasterizado una vez y muestreado en rejilla → partículas con destino */
function bootTitlePrep(){
  if(BOOT.title) return BOOT.title;
  var word=((typeof APP_NAME!=="undefined"&&APP_NAME)||"Launcher").toUpperCase();
  var fs=150, pad=36, tmp=tmpCanvas(8,8), tc=tmp.getContext("2d");
  tc.font="700 "+fs+'px "Gugi","Rubik",sans-serif';
  var w=Math.ceil(tc.measureText(word).width)||900, h=Math.ceil(fs*1.26);
  tmp.width=w+pad*2; tmp.height=h+pad*2; tc=tmp.getContext("2d");
  tc.font="700 "+fs+'px "Gugi","Rubik",sans-serif'; tc.textBaseline="middle"; tc.textAlign="left"; tc.fillStyle="#fff";
  tc.fillText(word,pad,tmp.height/2);
  var dat=tc.getImageData(0,0,tmp.width,tmp.height).data, step=Math.max(5,Math.round(8/BOOT_PART));
  var cx=STAGE_W/2, cy=STAGE_H*0.44, ox0=cx-tmp.width/2, oy0=cy-tmp.height/2, parts=[], rnd=bootRnd(BOOT.seed), maxd=0.42;
  var ramp=[PAL.r,PAL.o,PAL.y,PAL.cr], x,y;
  for(y=0;y<tmp.height;y+=step) for(x=0;x<tmp.width;x+=step){
    if(dat[(y*tmp.width+x)*4+3]<128) continue;
    var tx2=ox0+x, ty2=oy0+y, a=rnd()*6.2832, dist=520+rnd()*720, oa=Math.atan2(ty2-cy,tx2-cx)+(rnd()-0.5)*0.6, od=780+rnd()*520;
    var u=x/tmp.width, ci=Math.min(ramp.length-1,(u*ramp.length)|0), col=mix(ramp[ci],ramp[Math.min(ramp.length-1,ci+1)],(u*ramp.length)%1);
    parts.push({tx:tx2,ty:ty2,sx:cx+Math.cos(a)*dist,sy:cy+Math.sin(a)*dist,ox:cx+Math.cos(oa)*od,oy:cy+Math.sin(oa)*od,col:col,d:rnd()*maxd});
  }
  BOOT.title={parts:parts,size:Math.max(3,step-2),maxd:maxd,cx:cx,cy:cy}; return BOOT.title;
}
function bootPortalEnsure(){
  if(BOOT.portalOn||REDUCE||!PORTAL_ON||!window.P8EGL) return;
  if(!portalReady()) return;                                        // sin WebGL1: la intro corre sin raymarch (degrada)
  if(!portalBegin({nm:"BOOT",tint:PAL.r})) return;                   // paleta por defecto = rampa de franjas (portalPal)
  BOOT.portalOn=true;
}
function bootPortalFrame(t){ var P=GL&&GL.portal; if(!P||!P.prog) return; var c=GL.ctx, gl=c.gl;
  var open;
  if(t>=BC.resolve){ open=IRISF(clamp(1-(t-BC.resolve)/(BC.portalClose-BC.resolve),0,1)); }
  else open=IRISF(clamp((t-BC.portalStart)/(BC.portalFull-BC.portalStart),0,1));
  P.u.uOpen=open; P.u.uRim=0.9*clamp(open,0,1); P.u.uTime=3.0+(t/1000)*0.9+2.4*Math.pow(Math.max(0,(t-BC.portalStart)/1000),2);
  c.clear(); c.blendOff(); c.draw(P.prog,{position:[P.quad,3]},P.u,gl.TRIANGLE_STRIP,4); }
function bootPortalDown(){ if(!BOOT.portalOn) return; BOOT.portalOn=false;
  portalRestore(); if(GL) GL.ctx.clear();
  artCanvas.style.opacity="0"; artCanvas.classList.remove("portal"); void artCanvas.offsetWidth; artCanvas.style.transition=""; }
/* ---- dibujo 2D (todo en coordenadas lógicas 1920×1080) ----
   v15.1: bootBolt/bootCRT/bootBars/bootZap (encendido CRT, barras 90s, electricidad/rayos) RETIRADOS con la cabeza. */
function bootTitle(bc,t){ if(t<BC.titleStart) return; var T=bootTitlePrep(); if(!T.parts.length) return;
  var a=clamp(be((t-BC.titleStart)/(BC.titleLand-BC.titleStart)),0,1), out=(t>=BC.resolve)?bi((t-BC.resolve)/(BC.portalClose-BC.resolve)):0, P=T.parts, ps=T.size, i;
  bc.save();
  for(i=0;i<P.length;i++){ var p=P[i], la=clamp((a-p.d)/(1-T.maxd),0,1), e=be(la), x=lerp(p.sx,p.tx,e), y=lerp(p.sy,p.ty,e), al=e;
    if(out>0){ x=lerp(p.tx,p.ox,out); y=lerp(p.ty,p.oy,out); al=1-out; }
    if(al<=0.02) continue; bc.globalAlpha=al; bc.fillStyle=p.col; bc.fillRect(x-ps/2,y-ps/2,ps,ps); }
  bc.restore(); }
function bootData(bc,t){ if(t<BC.dataStart) return; var a=clamp((t-BC.dataStart)/260,0,1), out=(t>=BC.resolve)?clamp((t-BC.resolve)/200,0,1):0, al=a*(1-out);
  if(al<=0.02) return; var net=NET_LABEL[netState()]||""; BOOT.model=(MODEL&&MODEL.model)||BOOT.model; BOOT.net=net; BOOT.shownModel=true; if(net&&netState()!=="checking") BOOT.shownNet=true;
  var cy=STAGE_H*0.44+128; bc.save(); bc.globalAlpha=al; bc.textAlign="center"; bc.textBaseline="middle";
  BOOT.line=BOOT.back?STR.bootBack:STR.bootReady;                      // v16.7: tras volver de una app, la línea de vuelta
  bc.fillStyle=PAL.cr; bc.font='300 34px "Rubik",sans-serif'; bc.fillText(BOOT.line,STAGE_W/2,cy);
  bc.fillStyle="#C9B8BE"; bc.font='300 26px "Rubik",sans-serif'; bc.fillText(BOOT.model+(net?("   ·   "+net):""),STAGE_W/2,cy+44); bc.restore(); }
/* v15.1: bootGrain (grano VHS) RETIRADO con la cabeza retro. */
function bootRender(t){ var bc=BOOT.c; if(!bc) return; bc.setTransform(DPR,0,0,DPR,0,0); bc.clearRect(0,0,STAGE_W,STAGE_H);
  if(REDUCE) return;
  if(t>=BC.portalStart&&t<BC.portalClose){ bootPortalEnsure(); if(BOOT.portalOn) bootPortalFrame(t); }
  else if(BOOT.portalOn){ artCanvas.style.opacity="0"; }
  bootTitle(bc,t); bootData(bc,t); }
var BOOT_CUES=[[BC.portalStart,"bootPortal"],[BC.titleStart,"bootTitle"],[BC.dataStart,"bootReady"],[BC.resolve,"bootResolve"]];
function bootCues(t){ var i; for(i=0;i<BOOT_CUES.length;i++){ var bit=1<<i; if(!(BOOT.cued&bit)&&t>=BOOT_CUES[i][0]){ BOOT.cued|=bit; snd(BOOT_CUES[i][1],{}); } } }
/* v15.2 · el corredor (la OBRA) vuelve ANTES de que el velo negro se funda. Sin esto, el fundido descubría el fondo del
   escenario (#tv = #1A0F14, vinotinto oscuro) durante ~200 ms, porque el still del corredor seguía oculto hasta `done`.
   Al restaurar aquí el still y bajar la capa del arte a su z de reposo, el fundido descubre la pintura, nunca el vinotinto. */
function bootRestoreArt(){ if(BOOT.artBack) return; BOOT.artBack=true;
  if(artwrapEl) artwrapEl.style.zIndex=BOOT.prevZ||"";
  if(artStill) artStill.style.visibility=BOOT.stillVis||""; }
function bootReveal(){ if(BOOT.bgFaded||!BOOT.bg) return; BOOT.bgFaded=true; bootRestoreArt(); BOOT.bg.style.opacity="0"; }
/* el overlay de la intro (velo negro + lienzo 2D del título) deja de existir; el corredor (y el armado, si corre) sigue debajo */
function bootOverlayGone(){ if(BOOT.overlayGone) return; BOOT.overlayGone=true;
  if(BOOT.portalOn) bootPortalDown(); bootRestoreArt();
  if(BOOT.bg&&BOOT.bg.parentNode) BOOT.bg.parentNode.removeChild(BOOT.bg);
  if(BOOT.cv&&BOOT.cv.parentNode) BOOT.cv.parentNode.removeChild(BOOT.cv);
  BOOT.bg=null; BOOT.cv=null; BOOT.c=null; document.documentElement.removeAttribute("data-boot"); }
function bootFinish(){ if(BOOT.done) return; BOOT.on=false; BOOT.done=true; BOOT.tok++; bootOverlayGone(); snd("bootDone",{});
  if(!BOOT.armRun) capWait(false); }                                   // v16.9: sin armado (o saltada), el rótulo entra ya
/* el re-ensamble (la VUELTA INVERSA v13) ha encajado: el corredor queda EXACTAMENTE en reposo v14 → la intro resuelve */
function bootAfterArm(){ BOOT.armRun=false; if(!BOOT.done) bootFinish(); capWait(false); }
/* v16.9 · el rótulo bajo el cassette ESPERA fuera durante la intro (body.cap-wait, p8e.css): las capas del
   armado vuelan hacia el cassette y cruzan su zona. Al encajar entra con la transición de vuelta de la UI (120 + 420 ms) y el
   glitch RGB (sin scramble: el texto queda exacto al instante, como el estado v14 que exige el arnés en boot C2/C7.b; navegando, glitch
   y scramble siguen como siempre). CAPW cuenta las entradas (arnés). */
var CAPW={on:false,reveals:0,t:0};
function capWait(on){ if(on){ CAPW.on=true; B.classList.add("cap-wait"); return; }
  if(!CAPW.on) return; CAPW.on=false; CAPW.reveals++; CAPW.t=performance.now(); B.classList.remove("cap-wait"); glitchCap(appIndex(),true); }
/* RESUELVE armando el cassette de la app `ai` reutilizando el motor de la vuelta inversa: graba la ida (specs) y reproduce
   su espejo, pero GUARDADO por BOOT.arming → sin sonido de lanzamiento, sin velo/pantalla de paso, sin portal, sin oscurecer
   el resto; sólo las capas que llegan y encajan + la electricidad. poseRel != null = construir y posar en ese ms (arnés). */
function bootArm(ai,poseRel){
  if(REDUCE||!CASS_RICH||!lxEl.animate||!LAUNCH.specs) return false;
  var app=APPS[ai]; if(!app) return false;
  if(rich.card!==cards[ai]){ settle(); }
  if(rich.card!==cards[ai]) return false;
  BOOT.arming=true; BOOT.armRun=true; BOOT.armApp=ai;
  clearTimeout(LAUNCH.fbT); LAUNCH.fbT=0;
  try{ launchStart(app,false); }catch(e){ BOOT.arming=false; BOOT.armRun=false; if(window.console) console.error(e); return false; }
  LAUNCH.phase="back";                                      // la vuelta inversa espera la fase "back"
  try{ launchRewind(false); }catch(e){ BOOT.arming=false; if(window.console) console.error(e); }
  BOOT.arming=false;                                        // sólo la CONSTRUCCIÓN va guardada (el rAF del fx ya tiene FX.rev)
  if(poseRel!=null){ LAUNCH.posed=true; clearTimeout(LAUNCH.fbT); LAUNCH.fbT=0; lxTimers();
    LAUNCH.anims.forEach(function(a){ try{ a.pause(); a.currentTime=Math.max(0,poseRel)*LAUNCH_SLOW; }catch(e){} }); }
  return true; }
function bootSkip(){ if(!BOOT.on) return; BOOT.skipped=true; BOOT.skips++; snd("bootSkip",{});
  bootRestoreArt();
  if(BOOT.armRun){ try{ LAUNCH.posed=false; launchRewound(); }catch(e){ if(window.console) console.error(e); } }   // re-ensamble a reposo ya
  if(!BOOT.done){ bootReveal(); bootFinish(); } }
function bootReduce(){ var tok=BOOT.tok; bootEnsure();
  setTimeout(function(){ if(BOOT.tok!==tok||!BOOT.on) return; bootReveal(); },140);
  setTimeout(function(){ if(BOOT.tok!==tok||!BOOT.on) return; bootFinish(); },140+200); }
/* v15.2 · «última app usada»: el índice de la app enfocada se guarda en localStorage (p8e.lastApp) en cada cambio de foco
   (go). bootLast(i) GUARDA i; bootLast(null) LEE (−1 si no hay o es inválido). Coherente con el firmware («last app»). */
function bootLast(i){ try{ if(i==null){ var v=localStorage.getItem("p8e.lastApp"); if(v==null) return -1; v=+v; return (v>=0&&v<N&&v===(v|0))?v:-1; }
    localStorage.setItem("p8e.lastApp",String(((i%N)+N)%N)); }catch(e){ return -1; } return i; }
function bootStart(){ if(BOOT.on||BOOT.done) return; if(!BOOT_INTRO){ BOOT.done=true; return; }
  /* v15: el arranque no tiene gesto previo; en el motor del TV (M47, sin la política de autoplay de
     Chrome 71) el AudioContext corre al desbloquear, así que la intro suena en frío. Gateado a window.tizen (SÓLO el TV): en
     localhost/navegador moderno NO se desbloquea sin gesto (silencio elegante; sin replay al primer toque; y el arnés mide la
     intro muda en frío, tal como se diseñó). En el TV, tizen existe → la intro suena desde el encendido. */
  try{ if(window.tizen&&window.P8ESound&&P8ESound.unlock) P8ESound.unlock(); }catch(e){}
  BOOT.on=true; BOOT.posing=false; BOOT.t0=performance.now(); bootEnsure();
  if(!REDUCE) capWait(true);                                           // v16.9: el rótulo espera a que el cassette encaje
  if(artwrapEl){ BOOT.prevZ=artwrapEl.style.zIndex; artwrapEl.style.zIndex="47"; }
  document.documentElement.setAttribute("data-boot","1");
  if(REDUCE){ snd("bootPortal",{}); bootReduce(); return; }
  if(window.P8EGL&&PORTAL_ON){ try{ portalReady(); }catch(e){} }      // compila el portal en frío antes de usarlo
  var tok=++BOOT.tok;
  tAdd(function(now){ if(!BOOT.on||BOOT.tok!==tok) return true; var t=(now-BOOT.t0)/BOOT_SLOW;
    try{ bootRender(t); }catch(e){ if(window.console) console.error(e); bootSkip(); return true; }
    BOOT.frames++; bootCues(t);
    if(t>=BC.portalClose&&!BOOT.resolvedOnce){ BOOT.resolvedOnce=true; bootPortalDown(); bootReveal();   // v15.2: la obra vuelve y el velo se funde descubriéndola (nunca el vinotinto)
      BOOT.armStarted=bootArm(appIndex(),null); }                                                        // …y el cassette de la última app se ARMA (vuelta inversa)
    if(t>=BC.done){ bootOverlayGone();                                   // el overlay (velo + lienzo 2D) se retira; el armado, si corre, sigue en el corredor
      if(!(BOOT.armStarted&&BOOT.armRun)) bootFinish();                  // sin armado → resuelve ya; con armado → resuelve al encajar (bootAfterArm)
      return true; }
    return false; }); }

/* ===== arranque: fuentes → logos → lites cercanos → foco → resto de lites en diferido ====== */
var booted=false;
function boot(){ if(booted) return; booted=true;
  /* v15.2: el corredor arranca en la ÚLTIMA APP USADA. Precedencia: ?lastapp=N (prueba) > p8e.lastApp (localStorage) >
     ?app=N (compat) > 0. Sin historial → app 0 (Netflix), como siempre. */
  BOOT.back=awayRead();                                                                      // v16.7: ¿arranque tras lanzar una app?
  var la=qp("lastapp",null); la=(la==null)?bootLast(null):Math.max(0,Math.min(N-1,(+la||0)));
  idx=(la>=0)?la:Math.max(0,Math.min(N-1,(+qp("app",1)||1)-1)); camZ=idx*ZGAP; var ai=appIndex();
  rich.layout();
  var order=[ai,(ai+1)%N,(ai+N-1)%N]; order.forEach(function(i){ renderLite(APPS[i],lites[i]); });
  project(performance.now()); hcoord.textContent=APPS[ai].num+"/"+NN; setCap(ai);
  live.textContent=BOOT.back?STR.liveBack(APPS[BOOT.back.i].nm):STR.liveFocus(APPS[ai].nm);   // v16.7: tras volver, «Back from X.»
  settle();
  artCut(artIdx); artSchedule(); idleArm();   // v6: las franjas esperan al reposo (idleFire), nunca entran al arrancar
  setTimeout(fxPrewarm,2000);                 // v9: el programa del portal se compila en frío, con el corredor quieto
  setTimeout(auSeal,1500);                    // v10: el sello privado (si falta, sólo la firma)
  auQrLoad(); auFont();                       // v13: la matriz del QR (del SVG) y la letra pixel: con el sello, se prepara la autoría
  var rest=[]; for(var d=2;d<=N/2+1;d++){ rest.push((ai+d)%N); rest.push((ai+N-d)%N); }
  rest=rest.filter(function(v,i,a){ return a.indexOf(v)===i && order.indexOf(v)<0; });
  (function next(){ if(!rest.length){ document.documentElement.setAttribute("data-ready","1"); return; }
    var i=rest.shift(); renderLite(APPS[i],lites[i]); setTimeout(next,16); })();
  fpsCorner(); setTimeout(function(){ benchStart(); },0);   // v16.1: ?fps=1 y el banco (?dev=1&bench=1); benchStart espera solo a lo suyo
  bootStart();   // v15: la fase boot se superpone al corredor ya montado (estado v14 intacto debajo); saltable, ?boot=0 la quita
}
var pend=0, seen={};
function logosDone(){ if(--pend<=0) boot(); }
function startLogos(){ APPS.forEach(function(a){ if(!seen[a.logo]){ seen[a.logo]=1; pend++; } });
  Object.keys(seen).forEach(function(key){ var a=APPS.filter(function(x){ return x.logo===key; })[0];
    loadLogo(key,a.lsvg||(window.LOGOS&&LOGOS[key])||"",logosDone); }); }
var fontsP=(document.fonts&&document.fonts.load)?Promise.all([document.fonts.load('700 20px "Gugi"'),document.fonts.load('400 20px "Gugi"'),
  document.fonts.load('600 20px "Rubik"'),document.fonts.load('900 20px "Rubik"'),document.fonts.load('300 20px "Rubik"'),
  document.fonts.load('300 20px "Funnel Display"'),document.fonts.load(AU_FONT)]):null;   // v13: Pixel Operator (la autoría)   // v4: 300 = crédito y hora · v10: Funnel (la firma) cargada antes del 1.er giro, no en él
/* v3: el icono del VHS Arte se lee del fichero (local, mismo origen) antes de rasterizar los logos */
function loadArtIcon(cb){ var x=new XMLHttpRequest(), fin=false; function done(s){ if(fin) return; fin=true;
    /* huella para comprobar «idéntico»: bytes UTF-8 y djb2 sobre esos bytes (= los del fichero) */
    var u=s?unescape(encodeURIComponent(s)):"", h=5381, i; for(i=0;i<u.length;i++) h=(Math.imul(h,33)^u.charCodeAt(i))>>>0;
    ICON.ok=!!s; ICON.bytes=u.length; ICON.djb2=s?h:0;
    APPS.forEach(function(a){ if(a.logo==="arte") a.lsvg=s||""; }); cb(); }
  try{ x.open("GET",ART_ICON_URL,true); x.onload=function(){ done((x.status===200||x.status===0)&&/<svg[\s>]/.test(x.responseText)?x.responseText:""); };
    x.onerror=function(){ done(""); }; x.send(); }catch(e){ done(""); }
  setTimeout(function(){ done(""); },4000); }
var started=false; function start(){ if(started) return; started=true; loadArtIcon(startLogos); }
if(fontsP){ fontsP.then(start,start); setTimeout(start,2500); } else start();
})();
