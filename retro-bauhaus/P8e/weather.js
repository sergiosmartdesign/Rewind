/* SPDX-FileCopyrightText: 2026 Sergio Ayala
 * SPDX-License-Identifier: GPL-3.0-or-later */
/* P8e · weather.js — capa adaptadora del clima (2026-10-23)
   Autor de lo publicable: Sergio Ayala <mail@sergio-ayala.com>.

   INTERFAZ ÚNICA:  P8EWeather.getWeather() → Promise<Clima|null>   (nunca rechaza: null = sin datos)
     Clima = { ciudad, fuente, adaptador,
               ahora:{ t, temp, sens, hum, code, desc, icon, dia, viento, vientoDir, vientoCard },
               horas:[ {t, h, prob} … 8 ],          // prob. de lluvia de las próximas horas (%)
               dias: [ {fecha, dow, max, min, prob, code, desc, icon} × 3 ],   // hoy, mañana, pasado
               sol:  { sale, pone },                // "HH:MM" hora local de la respuesta
               uv:   { max, nivel } | null }        // daily.uv_index_max[0]; nivel según la OMS
     + ts (ms epoch en que se obtuvo el dato) · stale (true = es el ÚLTIMO dato bueno de la caché,
       porque el refresco falló; el panel lo marca «act. hace N min»)
   Quien llama NO sabe de dónde vienen los datos. Si algo obligatorio falta y no hay caché válida
   → null → el panel no aparece por primera vez (nunca un panel roto).

   CACHÉ DEL ÚLTIMO DATO BUENO (v2, 2026-10-23): cada Clima válido se guarda en localStorage
   (LAST_KEY = "p8e.weather.last"; las pruebas fixture/seq/stale/fail/empty usan
   "p8e.weather.last.test", para que un dato ficticio NUNCA se cuele en el modo live). Si el
   refresco falla o llega vacío, getWeather() devuelve esa caché con stale:true mientras tenga
   menos de MAX_AGE_MS (3 h). Pasado eso devuelve null; la política de pantalla (qué hacer con
   el último dato ya mostrado) la decide p8e.js, no esta capa.

   ADAPTADORES
   · fixture (POR DEFECTO): lee data/weather-fixture.json, que tiene la FORMA EXACTA de la respuesta
     de Open-Meteo /v1/forecast (valores FICTICIOS, coordenadas 0,0; ciudad genérica «CIUDAD»).
   · open-meteo (encendido desde la v16.10, LIVE_APPROVED=true): sólo corre con LAS DOS LLAVES: LIVE_APPROVED===true
     (hasta la v16.9 estaba en false) **Y** la llave del TV: "live":true en localStorage "p8e.weather.cfg" (v11, revisión de seguridad H8: un .wgt no recibe query) o ?live=1 en la URL (localhost). La ciudad y las coordenadas se configuran EN el
     TV ("p8e.weather.cfg" = {ciudad, lat, lon, live}); en el repo solo queda la ciudad por defecto (ver DEFAULT_CFG). v11 (H1): lat/lon se guardan y se envían con
     2 decimales (≈1,1 km; la rejilla de Open-Meteo es de 1–11 km: más precisión no da nada y sí dice dónde está la casa).
   · fail / empty: sólo para probar el camino «sin datos» (?wx=fail · ?wx=empty). Con caché
     de prueba < 3 h devuelven esa caché (stale); sin caché, null.
   · seq: alterna weather-fixture.json y weather-fixture-2.json en cada llamada (?wx=seq):
     prueba «datos nuevos».
   · stale: la 1.ª llamada lee el fixture; las siguientes fallan (?wx=stale): prueba «últimos».

   Variables pedidas a Open-Meteo (doc oficial https://open-meteo.com/en/docs, leída 2026-10-23):
     current = temperature_2m, relative_humidity_2m, apparent_temperature, is_day, weather_code,
               wind_speed_10m, wind_direction_10m
     hourly  = precipitation_probability          (prob. de >0,1 mm en la hora PRECEDENTE)
     daily   = weather_code, temperature_2m_max, temperature_2m_min, precipitation_probability_max,
               sunrise, sunset, uv_index_max
     timezone=auto · forecast_days=3 · wind_speed_unit=kmh (por defecto)
   Licencia de los datos: CC BY 4.0 → atribución visible «Data: Open-Meteo.com» (v12, en inglés). */
(function(){
"use strict";

var LIVE_APPROVED=true;                  // ← v16.10 (2026-10-26): clima actual real, por decisión del autor; antes false
var FIXTURE_URL="data/weather-fixture.json", FIXTURE2_URL="data/weather-fixture-2.json";
var API="https://api.open-meteo.com/v1/forecast";
var CFG_KEY="p8e.weather.cfg", CACHE_KEY="p8e.weather.cache";   // CACHE_KEY = respuesta cruda del live (cadencia REFRESH_MS)
var LAST_KEY="p8e.weather.last";                                   // último Clima BUENO normalizado {ts, clima}
var REFRESH_MS=30*60*1000;               // 48 llamadas/día (límite gratuito: <10 000/día)
var MAX_AGE_MS=3*60*60*1000;             // caducidad de la caché: un dato de más de 3 h no cuenta como «datos cargados»
var TIMEOUT_MS=8000, MAX_CHARS=65536;   // v16.10 (revisión de seguridad MAJOR-1): tope de respuesta, como rates.js

function qp(k,d){ var m=new RegExp("[?&]"+k+"=([^&]*)").exec(location.search); if(!m) return d; try{ return decodeURIComponent(m[1]); }catch(e){ return d; } }   // v11 (H10): ?dev=% no rompe

/* XHR (no fetch): funciona en el widget de Tizen 2017 y con file:// del .wgt */
/* v16.10 (revisión de seguridad MAJOR-1): tope de 64 KiB y corte en cuanto se pasa (Content-Length, progreso y texto), como rates.js.
   Un origen comprometido ya no puede inflar la respuesta ni llenar localStorage con la caché cruda. */
function getJSON(url){
  return new Promise(function(res,rej){
    var x=new XMLHttpRequest(), done=false, tm=0;
    function fin(ok,v){ if(done) return; done=true; clearTimeout(tm); if(ok) res(v); else rej(v); }
    function tooBig(){ try{ return (x.responseText||"").length>MAX_CHARS; }catch(e){ return false; } }
    function stop(why){ fin(false,new Error(why)); try{ x.abort(); }catch(e){} }
    try{ x.open("GET",url,true); }catch(e){ rej(e); return; }
    x.timeout=TIMEOUT_MS;
    x.onreadystatechange=function(){
      if(x.readyState===2){ var cl=+(x.getResponseHeader("Content-Length")||0); if(cl>MAX_CHARS){ stop("size"); return; } }
      if(x.readyState===3&&tooBig()){ stop("size"); return; }
      if(x.readyState!==4||done) return;
      if(x.status===200||(x.status===0&&x.responseText)){ var t=x.responseText||""; if(t.length>MAX_CHARS){ fin(false,new Error("size")); return; }
        try{ fin(true,JSON.parse(t)); }catch(e){ fin(false,e); } }
      else fin(false,new Error("HTTP "+x.status)); };
    x.onprogress=function(e){ if((e&&e.loaded>MAX_CHARS)||tooBig()) stop("size"); };
    x.ontimeout=function(){ stop("timeout"); };
    x.onerror=function(){ stop("network"); };
    x.send();
    tm=setTimeout(function(){ stop("timeout"); },TIMEOUT_MS+1000);
  });
}

/* ---- v12 · TEXTOS DEL CLIMA EN INGLÉS (STR_WX). Son a la vez lo que se pinta y la LISTA BLANCA de validClima(): una sola
   tabla para las dos cosas. Los textos de la interfaz están en p8e.js (STR). Un «último dato bueno» guardado en español
   por una versión anterior ya no valida: cuenta como «sin caché» y el panel espera al dato nuevo (README, v12). ---- */
var STR_WX={
  /* WMO (tabla oficial de la doc de Open-Meteo) → texto corto (cabe a 10 ft) + familia de icono */
  wmo:{0:["CLEAR","sun"],1:["MAINLY CLEAR","sun"],2:["PARTLY CLOUDY","part"],3:["OVERCAST","cloud"],
    45:["FOG","fog"],48:["RIME FOG","fog"],51:["LIGHT DRIZZLE","drizzle"],53:["DRIZZLE","drizzle"],
    55:["DENSE DRIZZLE","drizzle"],56:["FREEZING DRIZZLE","drizzle"],57:["FREEZING DRIZZLE","drizzle"],
    61:["LIGHT RAIN","rain"],63:["RAIN","rain"],65:["HEAVY RAIN","rain"],66:["FREEZING RAIN","rain"],
    67:["FREEZING RAIN","rain"],71:["LIGHT SNOW","snow"],73:["SNOW","snow"],75:["HEAVY SNOW","snow"],
    77:["SNOW GRAINS","snow"],80:["SHOWERS","rain"],81:["SHOWERS","rain"],82:["HEAVY SHOWERS","rain"],
    85:["SNOW SHOWERS","snow"],86:["SNOW SHOWERS","snow"],95:["THUNDERSTORM","storm"],
    96:["STORM AND HAIL","storm"],97:["SEVERE STORM","storm"],99:["STORM AND HAIL","storm"]},
  /* OMS, «Radiation: the ultraviolet (UV) index» (who.int, Q&A, leída 2026-10-23): 0–2 · 3–7 · 8+ */
  uv:["NO RISK","SEEK SHADE","AVOID THE SUN"],
  card:["N","NE","E","SE","S","SW","W","NW"],
  dow:["SUN","MON","TUE","WED","THU","FRI","SAT"],
  city:"CITY"                                                    // ciudad genérica del fixture (la real se configura EN el TV)
};
var WMO=STR_WX.wmo;
function wmo(code,isDay){ var w=WMO[code]; if(!w) return null;
  var ic=w[1]; if(ic==="sun"&&isDay===0) ic="moon"; return {desc:w[0],icon:ic}; }

function uvNivel(v){ return v<3?STR_WX.uv[0]:(v<8?STR_WX.uv[1]:STR_WX.uv[2]); }
var CARD=STR_WX.card;
var DOW=STR_WX.dow;
function num(v){ return (typeof v==="number"&&isFinite(v)); }
function hhmm(iso){ var m=/T(\d\d):(\d\d)/.exec(iso||""); return m?(m[1]+":"+m[2]):null; }
function dowOf(iso){ var m=/^(\d{4})-(\d\d)-(\d\d)/.exec(iso||""); if(!m) return null;
  return DOW[new Date(+m[1],+m[2]-1,+m[3]).getDay()]; }

/* Open-Meteo (forma de la API) → Clima. Cualquier hueco obligatorio → null. */
function normalize(om,ciudad){
  if(!om||om.error||!om.current||!om.hourly||!om.daily) return null;
  var c=om.current, h=om.hourly, d=om.daily, i;
  if(!num(c.temperature_2m)||!num(c.weather_code)) return null;
  var now=wmo(c.weather_code,c.is_day); if(!now) return null;
  var anchor=c.time||null;                       // hora local de la respuesta (no la del aparato)
  var ht=h.time||[], hp=h.precipitation_probability||[], horas=[];
  var k0=anchor?-1:0; if(anchor){ for(i=0;i<ht.length;i++){ if(ht[i]>anchor){ k0=i; break; } } }
  if(k0<0) return null;
  for(i=k0;i<ht.length&&horas.length<8;i++){ if(num(hp[i])) horas.push({t:ht[i],h:(hhmm(ht[i])||"").slice(0,2),prob:hp[i]}); }
  if(horas.length<4) return null;
  var dt=d.time||[], dias=[];
  for(i=0;i<3&&i<dt.length;i++){
    var w=wmo(d.weather_code&&d.weather_code[i],1);
    if(!w||!num(d.temperature_2m_max[i])||!num(d.temperature_2m_min[i])) return null;
    dias.push({fecha:dt[i],dow:dowOf(dt[i]),max:d.temperature_2m_max[i],min:d.temperature_2m_min[i],
      prob:(d.precipitation_probability_max&&num(d.precipitation_probability_max[i]))?d.precipitation_probability_max[i]:null,
      code:d.weather_code[i],desc:w.desc,icon:w.icon}); }
  if(dias.length<3) return null;
  var sale=hhmm(d.sunrise&&d.sunrise[0]), pone=hhmm(d.sunset&&d.sunset[0]); if(!sale||!pone) return null;
  var uvm=d.uv_index_max&&d.uv_index_max[0];
  var wd=num(c.wind_direction_10m)?c.wind_direction_10m:null;
  return { ciudad:String(ciudad||STR_WX.city).toUpperCase(), fuente:"Open-Meteo.com",
    ahora:{ t:anchor, temp:c.temperature_2m, sens:num(c.apparent_temperature)?c.apparent_temperature:null,
      hum:num(c.relative_humidity_2m)?c.relative_humidity_2m:null, code:c.weather_code, desc:now.desc, icon:now.icon,
      dia:c.is_day, viento:num(c.wind_speed_10m)?c.wind_speed_10m:null, vientoDir:wd,
      vientoCard:(wd==null)?null:CARD[Math.round(wd/45)%8] },
    horas:horas, dias:dias, sol:{sale:sale,pone:pone},
    uv:num(uvm)?{max:uvm,nivel:uvNivel(uvm)}:null };
}

/* ---- adaptadores ---- */
function fromFixture(url){ return getJSON(url).then(function(om){ return normalize(om,STR_WX.city); }); }
var fixture={ name:"fixture", get:function(){ return fromFixture(FIXTURE_URL); } };
var seqN=0, seqA={ name:"seq", get:function(){ return fromFixture((seqN++%2===0)?FIXTURE_URL:FIXTURE2_URL); } };
var staleN=0, staleA={ name:"stale", get:function(){ return (staleN++===0)?fromFixture(FIXTURE_URL):Promise.reject(new Error("test: refresh fails")); } };

/* v11 (H1): 2 decimales al guardar y al enviar. readCfg() también reescribe una configuración guardada con más precisión. */
function r2(v){ return Math.round(v*100)/100; }
function geo(c){ return !!c&&num(c.lat)&&num(c.lon)&&Math.abs(c.lat)<=90&&Math.abs(c.lon)<=180; }   // v11 (revisión de seguridad N3): rango
function saveCfg(c){ var o={ciudad:String(c.ciudad==null?"":c.ciudad).slice(0,60),lat:r2(c.lat),lon:r2(c.lon),live:c.live===true};
  try{ localStorage.setItem(CFG_KEY,JSON.stringify(o)); }catch(e){} return o; }
/* v16.10 (2026-10-26): la PRIMERA vez en el TV no hay configuración y el .wgt no acepta query: se siembra Bogotá
   (4,71 / −74,07 ≈ 1,1 km; Open-Meteo la ajusta a su rejilla) con live=true. Es la ciudad de la medida de pico y placa
   y una excepción declarada al ADR-0004 («la ciudad se configura EN el TV»): queda en el repo por decisión del autor, y P8EWeather.configure() la puede cambiar sin tocar código. */
var DEFAULT_CFG={ciudad:"Bogotá",lat:4.71,lon:-74.07,live:true};
function readCfg(){ try{ var c=JSON.parse(localStorage.getItem(CFG_KEY)||"null");
  if(geo(c)){ if(r2(c.lat)!==c.lat||r2(c.lon)!==c.lon) c=saveCfg(c); return c; } }catch(e){}
  return saveCfg(DEFAULT_CFG); }
function buildURL(cfg){ return API+"?latitude="+r2(cfg.lat)+"&longitude="+r2(cfg.lon)+
    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m"+
    "&hourly=precipitation_probability"+
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max"+
    "&timezone=auto&forecast_days=3"; }
function readCache(){ try{ return JSON.parse(localStorage.getItem(CACHE_KEY)||"null"); }catch(e){ return null; } }
var openMeteo={ name:"open-meteo", get:function(){
  if(!LIVE_APPROVED) return Promise.resolve(null);          // doble llave: sin aprobación, ni una petición
  var cfg=readCfg(); if(!cfg) return Promise.resolve(null);   // ciudad sin configurar en el TV
  var cache=readCache(), t=Date.now();
  if(cache&&cache.om&&num(cache.ts)&&t>=cache.ts&&(t-cache.ts)<REFRESH_MS){ /* v11 (N4): un reloj hacia atrás no la hace «fresca» */ var cw=normalize(cache.om,cfg.ciudad); if(cw) cw._ts=cache.ts; return Promise.resolve(cw); }
  var url=buildURL(cfg);
  return getJSON(url).then(function(om){
    /* v16.10 (revisión de seguridad MAJOR-1): primero se valida (normalize) y sólo después se guarda la caché cruda. */
    var c=normalize(om,cfg.ciudad);
    if(c&&om&&!om.error){ if(num(om.latitude)) om.latitude=r2(om.latitude); if(num(om.longitude)) om.longitude=r2(om.longitude);
      try{ localStorage.setItem(CACHE_KEY,JSON.stringify({ts:Date.now(),om:om})); }catch(e){} }
    return c;
  },function(){ return null; }); } };                         // sin red: el respaldo (LAST_KEY) lo pone getWeather()
var failA={ name:"fail", get:function(){ return Promise.reject(new Error("test: failure")); } };
var emptyA={ name:"empty", get:function(){ return Promise.resolve(normalize({},STR_WX.city)); } };

var WX=qp("wx","");
var TEST={fail:failA,empty:emptyA,seq:seqA,stale:staleA};
/* v11 (H8): la 2.ª llave = la del TV ("live":true en p8e.weather.cfg) o ?live=1 (localhost). La 1.ª sigue siendo LIVE_APPROVED. */
/* v11 (revisión de seguridad N1): ?live=1 SÓLO en localhost; una URL empaquetada o servida por la LAN no es la llave del TV */
/* v16.10: en localhost manda la llave de la URL (?live=1) y NO la configuración: el arnés y el Mac siguen viendo el
   fixture salvo que pidan el live a propósito. En el .wgt (file://, sin query) manda la configuración del TV. */
function liveKey(){ var h=location.hostname;
  if(/^(localhost|127\.0\.0\.1)$/.test(h)) return qp("live","0")==="1";
  var c=readCfg(); return !!(c&&c.live===true); }
var A=(LIVE_APPROVED&&liveKey())?openMeteo:(Object.prototype.hasOwnProperty.call(TEST,WX)?TEST[WX]:fixture);   // v11 (H10): ?wx=constructor no sale del prototipo
var LK=(A===openMeteo)?LAST_KEY:LAST_KEY+".test";
var ST={calls:0,fresh:0,fallback:0,none:0};
/* SÓLO PRUEBAS (P8e v5): ?wxdelay=ms retrasa la respuesta del adaptador (máx. 60 s). Nunca con el live. */
var DELAY=(A===openMeteo)?0:Math.max(0,Math.min(60000,+qp("wxdelay",0)||0));
function delayed(p){ return DELAY?p.then(function(x){ return new Promise(function(r){ setTimeout(function(){ r(x); },DELAY); }); },
  function(e){ return new Promise(function(r,j){ setTimeout(function(){ j(e); },DELAY); }); }):p; }

function saveLast(x){ try{ localStorage.setItem(LK,JSON.stringify({ts:x.ts,clima:x})); }catch(e){} }
/* v11 (revisión de seguridad H4): el último dato bueno vuelve de localStorage y antes se pintaba TAL CUAL (varios campos van a
   innerHTML). Ahora se re-valida con las mismas tablas que normalize(): tipos, listas blancas y formatos. Si no pasa,
   es como si no hubiera caché (null → sin panel; nunca un panel con lo que alguien escribió en el origen). */
var ICONS={sun:1,moon:1,part:1,cloud:1,fog:1,drizzle:1,rain:1,snow:1,storm:1}, DESCS={}, NIVELES={}; NIVELES[STR_WX.uv[0]]=NIVELES[STR_WX.uv[1]]=NIVELES[STR_WX.uv[2]]=1;
(function(){ for(var k in WMO) if(Object.prototype.hasOwnProperty.call(WMO,k)) DESCS[WMO[k][0]]=1; })();
function nn(v){ return v===null||num(v); }
function inT(t,v){ return typeof v==="string"&&Object.prototype.hasOwnProperty.call(t,v); }
function validClima(c){ var i, a, h, d;
  if(!c||typeof c!=="object"||typeof c.ciudad!=="string"||c.ciudad.length>200) return false;
  a=c.ahora; if(!a||!num(a.temp)||!nn(a.sens)||!nn(a.hum)||!nn(a.viento)||!nn(a.vientoDir)||!inT(DESCS,a.desc)||!inT(ICONS,a.icon)) return false;
  if(!(a.vientoCard===null||a.vientoCard===undefined||CARD.indexOf(a.vientoCard)>=0)) return false;
  if(!Array.isArray(c.horas)||c.horas.length<4||c.horas.length>8) return false;
  for(i=0;i<c.horas.length;i++){ h=c.horas[i]; if(!h||typeof h.h!=="string"||!/^\d\d$/.test(h.h)||!num(h.prob)) return false; }
  if(!Array.isArray(c.dias)||c.dias.length!==3) return false;
  for(i=0;i<3;i++){ d=c.dias[i]; if(!d||!num(d.max)||!num(d.min)||!nn(d.prob)||!inT(DESCS,d.desc)||!inT(ICONS,d.icon)||!(d.dow===null||DOW.indexOf(d.dow)>=0)) return false; }
  if(!c.sol||!/^\d\d:\d\d$/.test(c.sol.sale||"")||!/^\d\d:\d\d$/.test(c.sol.pone||"")) return false;
  if(!(c.uv===null||(c.uv&&num(c.uv.max)&&inT(NIVELES,c.uv.nivel)))) return false;
  return true; }
function readLast(){ try{ var o=JSON.parse(localStorage.getItem(LK)||"null");
  if(o&&o.clima&&num(o.ts)&&validClima(o.clima)) return o; }catch(e){} return null; }

window.P8EWeather={
  getWeather:function(){ var p; ST.calls++;
    try{ p=delayed(A.get()); }catch(e){ p=Promise.reject(e); }
    return p.then(function(x){ return x||null; },function(){ return null; }).then(function(x){
      if(x){ x.adaptador=A.name; x.ts=x._ts||Date.now(); delete x._ts; x.stale=false; saveLast(x); ST.fresh++; return x; }
      var o=readLast();                                            // refresco fallido → último dato bueno (< 3 h)
      if(o&&Date.now()>=o.ts&&(Date.now()-o.ts)<MAX_AGE_MS){ var c=o.clima; c.ts=o.ts; c.stale=true; c.adaptador=A.name; ST.fallback++; return c; }
      ST.none++; return null; }); },
  stats:function(){ return {calls:ST.calls,fresh:ST.fresh,fallback:ST.fallback,none:ST.none,cacheKey:LK,delayMs:DELAY}; },
  adapter:A.name, LIVE_APPROVED:LIVE_APPROVED, REFRESH_MS:REFRESH_MS, MAX_AGE_MS:MAX_AGE_MS, LAST_KEY:LAST_KEY, normalize:normalize,
  /* v11 · para los ajustes del TV (H4): guarda {ciudad, lat, lon, live} ya redondeado (H1). No pide nada a nadie. */
  configure:function(c){ return geo(c)?saveCfg(c):null; }, validClima:validClima
};
})();
