/* SPDX-FileCopyrightText: 2026 Sergio Ayala
 * SPDX-License-Identifier: GPL-3.0-or-later */
/* P8e v16.10 · TRM DÓLAR Y TRM EURO EN COP (2026-10-26, decisión del autor).
   Author of the publishable work: Sergio Ayala <mail@sergio-ayala.com>.

   QUÉ HACE. Devuelve el último dato BUENO de dos indicadores, ya en COP:
     · trm  = TRM oficial del dólar (COP por USD), publicada por la Superintendencia Financiera en datos.gov.co.
     · eur  = TRM × tipo de cambio de referencia del BCE (USD por EUR), es decir COP por EUR. El euro NO tiene TRM
              oficial colombiana: es una CONVERSIÓN, y por eso la franja la presenta como «TRM EURO» con la fecha del BCE.
   Nada de texto remoto llega a la pantalla ni se guarda: de las respuestas sólo salen NÚMEROS y FECHAS validados aquí.

   FUENTES (medidas el 2026-10-26 desde el Mac):
     · https://www.datos.gov.co/resource/ceyp-9c7c.json?$order=vigenciadesde DESC&$limit=1
       → [{"valor":"3158.43","vigenciadesde":"2026-10-24T00:00:00.000","vigenciahasta":"2026-10-26T00:00:00.000"}]
       Socrata, JSON, sin clave, Access-Control-Allow-Origin: *. «vigenciahasta» del último día hábil es la fecha que se pinta.
     · https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml
       → <Cube time='2026-10-23'><Cube currency='USD' rate='1.1193'/>…  XML pequeño, sin clave. Se publica una vez por día
       hábil hacia las 16:00 CET. Se lee con una expresión regular (M47 no tiene por qué tragarse un DOMParser aquí).

   SUPERFICIE DE RED (para revisión de seguridad; el README de P8e lleva el detalle de la versión):
     · dos orígenes, HTTPS, construidos aquí (ninguna URL viene de una respuesta: no se sigue ningún enlace).
     · 2 GET como máximo por refresco (uno por origen), sin cabeceras propias, sin cookies (withCredentials=false),
       sin Referer propio (referrer no-referrer del config).
     · timeout 8 s; tope 65 536 caracteres por respuesta (medido: TRM ≈ 200 bytes, BCE ≈ 12 KB), abortando al pasarse.
     · refresco como mucho cada 60 min; ≤ 8 intentos por día de Bogotá (los aciertos no gastan cupo); tras un fallo, 20 min de espera.
     · cualquier fallo (sin red, CORS, 404, timeout, tamaño, JSON raro, cifra fuera de rango) = silencio: se conserva
       el último dato bueno (hasta 7 días, marcado con su fecha) o la franja enseña «—».

   CACHÉ. localStorage «p8e.rates» = {ts, trm:{v,d}, usd:{v,d}}. Se re-valida al leer (tipos, rangos y fechas): una
   caché manipulada a mano no pinta nada. Es el mismo criterio que weather.js (v11, revisión de seguridad H4) y pyp.js.

   PALANCAS. ?rates=0 (no pinta) · ?ratesnet=0 (no sale a la red; sólo caché) · P8ERates.net(false) · P8ERates.clear(). */
(function(){
"use strict";

var TRM_URL="https://www.datos.gov.co/resource/ceyp-9c7c.json?$order=vigenciadesde%20DESC&$limit=1";
var BCE_URL="https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
var KEY="p8e.rates", TRY_KEY="p8e.rates.try";
var REFRESH_MS=60*60*1000, RETRY_MS=20*60*1000, MAX_TRIES=8, TIMEOUT_MS=8000, MAX_CHARS=65536;
var STALE_MS=7*24*3600*1000;
var MONTHS=["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
var BOG_OFF=-5*3600000, DAY=86400000;

/* ---- utilidades numéricas y de fecha (sin dependencias) ---- */
function num(v){ return typeof v==="number"&&isFinite(v); }
function isDate(s){ if(typeof s!=="string") return false; var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s); if(!m) return false; var mo=+m[2], d=+m[3]; return mo>=1&&mo<=12&&d>=1&&d<=31; }
function isoDay(ms){ var d=new Date(ms+BOG_OFF); return d.getUTCFullYear()+"-"+pad(d.getUTCMonth()+1)+"-"+pad(d.getUTCDate()); }
function pad(n){ return (n<10?"0":"")+n; }
function dayOf(s){ var m=/^(\d{4})-(\d\d)-(\d\d)/.exec(s||""); return m?(m[1]+"-"+m[2]+"-"+m[3]):null; }
function shortDate(s){ var d=dayOf(s); if(!d) return ""; return (+d.slice(8,10))+" "+MONTHS[+d.slice(5,7)-1]; }
function todayBogota(){ return isoDay(Date.now()); }

/* XHR: funciona en el WRT de Tizen 3.0 (y con file:// del .wgt). Sólo orígenes de la lista; nada más sale. */
var ALLOWED=["https://www.datos.gov.co/","https://www.ecb.europa.eu/"];
function allowed(url){ for(var i=0;i<ALLOWED.length;i++) if(url.indexOf(ALLOWED[i])===0) return true; return false; }
function httpGet(url,cb){
  var x, done=false, tm=0;
  function fin(ok,txt,why){ if(done) return; done=true; clearTimeout(tm); cb(ok?txt:null,why||""); }
  function stop(why){ fin(false,null,why); try{ x.abort(); }catch(e){} }
  function tooBig(){ try{ return (x.responseText||"").length>MAX_CHARS; }catch(e){ return false; } }
  if(!allowed(url)){ fin(false,null,"origin"); return; }              // defensa en profundidad
  try{ x=new XMLHttpRequest(); ST.reqs++; x.open("GET",url,true);
    x.onreadystatechange=function(){
      if(x.readyState===2){ var cl=+(x.getResponseHeader("Content-Length")||0); if(cl>MAX_CHARS) stop("size"); }
      if(x.readyState===3&&tooBig()) stop("size");
      if(x.readyState===4){ if(x.status===200||(x.status===0&&x.responseText)){ var t=x.responseText||"";
          if(t.length>MAX_CHARS) fin(false,null,"size"); else fin(true,t,""); }
        else fin(false,null,x.status?("http "+x.status):"network"); } };
    x.onprogress=function(e){ if((e&&e.loaded>MAX_CHARS)||tooBig()) stop("size"); };
    x.onerror=function(){ fin(false,null,"network"); };
    x.send(); }catch(e){ fin(false,null,"throw"); return; }
  tm=setTimeout(function(){ stop("timeout"); },TIMEOUT_MS);
}

/* ---- lectores: de la respuesta cruda a {v,d}, o null. Nada más se conserva. ---- */
function parseTrm(txt){
  var a, o, v, d;
  try{ a=JSON.parse(txt); }catch(e){ return null; }
  if(!a||typeof a!=="object"||!a.length) return null;
  o=a[0]; if(!o||typeof o!=="object") return null;
  v=parseFloat(o.valor); if(!num(v)||v<1000||v>30000) return null;     // rangos plausibles de la TRM (1991-2026)
  d=dayOf(o.vigenciahasta||o.vigenciadesde||""); if(!d) return null;
  return {v:v,d:d};
}
function parseBce(txt){
  var s=String(txt==null?"":txt), m, d, v;
  if(s.length>MAX_CHARS) return null;
  m=/<Cube\s+currency=['"]USD['"]\s+rate=['"]([0-9.]+)['"]\s*\/>/.exec(s); if(!m) return null;
  v=parseFloat(m[1]); if(!num(v)||v<0.5||v>2) return null;              // USD por EUR
  m=/<Cube\s+time=['"](\d{4}-\d{2}-\d{2})['"]>/.exec(s); d=m?dayOf(m[1]):null; if(!d) return null;
  return {v:v,d:d};
}
function eurOf(trm,usd){ return {v:Math.round(trm.v*usd.v*100)/100,d:usd.d}; }

/* ---- caché validada ---- */
/* Cada mitad se valida por separado: si un origen falla, la otra franja sigue mostrando su último dato bueno. */
function okTrm(t){ return !!t&&num(t.v)&&t.v>=1000&&t.v<=30000&&isDate(t.d); }
function okUsd(u){ return !!u&&num(u.v)&&u.v>=0.5&&u.v<=2&&isDate(u.d); }
function readStore(){
  try{ var o=JSON.parse(localStorage.getItem(KEY)||"null"); if(!o||!num(o.ts)) return null;
    var r={ts:o.ts,trm:okTrm(o.trm)?{v:o.trm.v,d:o.trm.d}:null,usd:okUsd(o.usd)?{v:o.usd.v,d:o.usd.d}:null};
    return (r.trm||r.usd)?r:null; }catch(e){ return null; }
}
function writeStore(o){ try{ localStorage.setItem(KEY,JSON.stringify(o)); }catch(e){} }
function readTry(){ try{ var o=JSON.parse(localStorage.getItem(TRY_KEY)||"null");
    if(o&&o.d===todayBogota()&&num(o.n)&&o.n>=0&&o.n<=99&&num(o.t)) return o; }catch(e){} return {d:todayBogota(),n:0,t:0}; }
function writeTry(o){ try{ localStorage.setItem(TRY_KEY,JSON.stringify(o)); }catch(e){} }

/* ---- estado y refresco ---- */
var NET=true, OFF_Q=false, ST={busy:false,tries:0,ok:0,fail:0,err:"",last:0,reqs:0};
function netOn(){ if(OFF_Q) return false; return NET; }
function refresh(cb){
  if(!netOn()||ST.busy) return false;
  var st=readStore(), now=Date.now(), tr=readTry();
  if(st&&now>=st.ts&&(now-st.ts)<REFRESH_MS) return false;            // fresco: ni una petición
  if(tr.n>=MAX_TRIES||(tr.t&&now-tr.t<RETRY_MS)) return false;        // tope diario / espera tras fallo
  ST.busy=true; tr.n++; tr.t=now; writeTry(tr); ST.tries++; ST.err=""; ST.last=now;
  var got={}, done=0, failed=false;
  // Las dos lecturas se guardan juntas al final: si una falla se conserva la mitad vieja (fechada), nunca una mezcla sin fechas.
  function finish(){
    ST.busy=false;
    if(got.trm||got.usd){ writeStore({ts:(got.trm&&got.usd)?Date.now():(st?st.ts:Date.now()),
      trm:got.trm||(st?st.trm:null),usd:got.usd||(st?st.usd:null)}); }
    if(failed){ ST.fail++; if(!ST.err) ST.err="network"; }
    else { ST.ok++; var t2=readTry(); t2.n=0; t2.t=Date.now(); writeTry(t2); }   // un refresco bueno devuelve el cupo del día
    if(cb) cb(get());
  }
  function one(k){ return function(txt,why){
    done++;
    if(txt==null){ failed=true; if(why&&!ST.err) ST.err=why; }
    else { var p=(k==="trm")?parseTrm(txt):parseBce(txt);
      if(p) got[k]=p; else { failed=true; if(!ST.err) ST.err="parse"; } }
    if(done===2) finish();
  }; }
  httpGet(TRM_URL,one("trm")); httpGet(BCE_URL,one("usd"));
  return true;
}
/* get(): lo que se pinta. Sin caché válida → null (la franja pone «—»). */
function get(){
  var st=readStore(); if(!st) return null;
  if(st.ts>Date.now()+5*60*1000) return null;                 // reloj hacia atrás: la caché no es «fresca»
  if(Date.now()-st.ts>STALE_MS) return null;
  var trm=st.trm?{v:Math.round(st.trm.v*100)/100,d:st.trm.d}:null, usd=st.usd?{v:st.usd.v,d:st.usd.d}:null;
  return {ts:st.ts,trm:trm,usd:usd,eur:(trm&&usd)?eurOf(trm,usd):null,stale:(Date.now()-st.ts)>=REFRESH_MS,
    trmDate:trm?shortDate(trm.d):"",usdDate:usd?shortDate(usd.d):"",eurDate:usd?shortDate(usd.d):""};
}
function clear(){ try{ localStorage.removeItem(KEY); localStorage.removeItem(TRY_KEY); }catch(e){} }

window.P8ERates={
  get:get, refresh:refresh, clear:clear, todayBogota:todayBogota, shortDate:shortDate,
  net:function(on){ if(on!==undefined){ OFF_Q=!on; } return netOn(); },
  _parseTrm:parseTrm, _parseBce:parseBce, _eurOf:eurOf,
  stats:function(){ var st=readStore(); return {net:netOn(),busy:ST.busy,ok:ST.ok,fail:ST.fail,err:ST.err,tries:ST.tries,reqs:ST.reqs,
    cached:!!st,cachedTs:st?st.ts:0,trm:st?st.trm:null,usd:st?st.usd:null}; },
  LIMITS:{refreshMs:REFRESH_MS,retryMs:RETRY_MS,maxTries:MAX_TRIES,timeoutMs:TIMEOUT_MS,maxChars:MAX_CHARS,origins:ALLOWED.slice()}
};
})();
