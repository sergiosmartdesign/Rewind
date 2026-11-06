/* SPDX-FileCopyrightText: 2026 Sergio Ayala
 * SPDX-License-Identifier: GPL-3.0-or-later */
/* P8e v16.9 · PICO Y PLACA BOGOTÁ (2026-10-26). ES5, no dependencies, no DOM.
   Author of the publishable work: Sergio Ayala <mail@sergio-ayala.com>.

   Design decision (2026-10-26), both sources: (a) the LOCAL calculation always; (b) a CONTRAST with bogota.gov.co
   ONLY if there is network: if the official text for today does not match the local calculation, the band says «verify»
   instead of affirming. The user's plate is never asked for nor stored.

   (a) RULE, private cars (vehículos particulares), Bogotá. Source: Alcaldía de Bogotá, official bulletin «Así opera el pico y
       placa en Bogotá para vehículos particulares durante octubre de 2026» (bogota.gov.co, 2026-10-01), read 2026-10-26:
       «rige de lunes a viernes, de 6:00 a. m. a 9:00 p. m.» · «En días impares pueden circular […] placa terminada en: 1, 2, 3,
       4 y 5» · «En días pares pueden circular […] 6, 7, 8, 9 y 0» · Saturdays, Sundays and holidays: «no aplica».
       → even day: plates ending 1-2-3-4-5 do NOT circulate; odd day: 6-7-8-9-0 do NOT. The DAY is the day of the month.
   HOLIDAYS of Colombia: Ley 51 de 1983, art. 1 (text: Función Pública, Gestor Normativo, norma i=4954). Fixed: 1 Jan, 1 May,
       20 Jul, 7 Aug, 8 Dec, 25 Dec, and Maundy Thursday / Good Friday (Easter − 3 / − 2). Moved to the NEXT MONDAY when they do
       not fall on a Monday (Emiliani): 6 Jan, 19 Mar, 29 Jun, 15 Aug, 12 Oct, 1 Nov, 11 Nov, Ascension (Easter + 39 → + 43),
       Corpus Christi (Easter + 60 → + 64), Sacred Heart (Easter + 68 → + 71). Easter: anonymous Gregorian algorithm (Meeus).
   DATE: Bogotá time, UTC−5 all year (Colombia has no DST), from the TV clock (Date.now). The same clock as the footer.

   (b) CONTRAST (network). Surface, for the security review (README v16.9 «Superficie de red»):
       · origin: https://bogota.gov.co ONLY (built by this file; no URL from the page is followed to another host)
       · ≤ 3 GET per attempt, in this order, stopping at the first that answers for today:
           1 /mi-ciudad/movilidad/pico-y-placa-en-bogota-vehiculos-particulares-1-<last day>-<month>-de-<year>
             (the monthly bulletin; the slug pattern of the cited October 2026 bulletin)
           2 /tag/pico-y-placa-en-bogota (the list of the portal's pico y placa articles), and from its links ONE article of
           3 this month: the monthly bulletin > the weekly one that contains today > today's daily one (strict regex on the path)
       · ≤ 3 attempts per Bogotá day, ≥ 30 min apart; after a definite answer, none until the next day (localStorage «p8e.pyp»)
       · each response: status 200, ≤ 120 000 CHARACTERS of responseText (v16.9.1, security review C1/C5: checked on Content-Length — bytes,
         so stricter —, on progress and on the text received so far, which also covers gzip without Content-Length; aborted
         beyond); timeout 8 s. The real pages measured 56 959 and 39 760 bytes
       · no cookies (withCredentials false), no custom headers (no preflight), no Referer (the page's meta referrer)
       · the response is TEXT: tags are stripped with regular expressions; nothing is executed, parsed as HTML or inserted
         into the DOM; only digits and a few fixed words are read from it, and only a verdict (ok / diff / unk) is stored
       · any failure (offline, CORS, 404, timeout, size, unexpected text) = silence: the band keeps the local calculation
   LEVERS: ?pyp=0 (no band: Daylight comes back) · ?pypnet=0 (no contrast) · PYP_NET below (the .wgt has no query string) ·
   v16.9.1: «PyP contrast» in the diagnostics panel (localStorage p8e.lever.pypnet, hot). */
(function(){
"use strict";
var PYP_NET=true;                                  // master switch of the contrast (b) for the .wgt; ?pypnet=0 also turns it off
var ORIGIN="https://bogota.gov.co";
var MAX_CHARS=120000, TIMEOUT_MS=8000, MAX_TRIES=3, RETRY_MS=1800000, STORE_KEY="p8e.pyp";
var DAY=86400000, BOG_OFF=-5*3600000;
var MONTHS=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
var DOWS=["domingo","lunes","martes","miercoles","jueves","viernes","sabado"];
var LO=[1,2,3,4,5], HI=[6,7,8,9,0];

function pad(n){ return (n<10?"0":"")+n; }
function utc(y,m,d){ return Date.UTC(y,m-1,d); }
function parts(t){ var D=new Date(t); return {y:D.getUTCFullYear(),m:D.getUTCMonth()+1,d:D.getUTCDate(),dow:D.getUTCDay()}; }
function key(p){ return p.y+"-"+pad(p.m)+"-"+pad(p.d); }
/* Bogotá's calendar day for an instant (ms since the epoch) */
function bogota(ms){ var p=parts(ms+BOG_OFF); p.h=new Date(ms+BOG_OFF).getUTCHours(); return p; }
/* Easter Sunday (Gregorian), Meeus/Jones/Butcher; returns ms UTC of that day */
function easter(y){ var a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),
    h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),n=h+l-7*m+114;
  return utc(y,Math.floor(n/31),(n%31)+1); }
function monday(t){ var w=new Date(t).getUTCDay(); return t+((8-w)%7)*DAY; }       // the same day if it is a Monday
var HCACHE={};
/* Ley 51 de 1983, art. 1 → [{d:"YYYY-MM-DD", n:name}] sorted */
function holidays(y){ if(HCACHE[y]) return HCACHE[y];
  var E=easter(y), L=[], i;
  function add(t,n){ L.push({t:t,n:n}); }
  add(utc(y,1,1),"Año Nuevo"); add(monday(utc(y,1,6)),"Reyes Magos"); add(monday(utc(y,3,19)),"San José");
  add(E-3*DAY,"Jueves Santo"); add(E-2*DAY,"Viernes Santo"); add(utc(y,5,1),"Día del Trabajo");
  add(monday(E+39*DAY),"Ascensión del Señor"); add(monday(E+60*DAY),"Corpus Christi"); add(monday(E+68*DAY),"Sagrado Corazón");
  add(monday(utc(y,6,29)),"San Pedro y San Pablo"); add(utc(y,7,20),"Independencia"); add(utc(y,8,7),"Batalla de Boyacá");
  add(monday(utc(y,8,15)),"Asunción de la Virgen"); add(monday(utc(y,10,12)),"Día de la Raza"); add(monday(utc(y,11,1)),"Todos los Santos");
  add(monday(utc(y,11,11)),"Independencia de Cartagena"); add(utc(y,12,8),"Inmaculada Concepción"); add(utc(y,12,25),"Navidad");
  L.sort(function(a,b){ return a.t-b.t; });
  var out=[]; for(i=0;i<L.length;i++) out.push({d:key(parts(L[i].t)),n:L[i].n});
  HCACHE[y]=out; return out; }
function holidayOf(p){ var H=holidays(p.y), k=key(p), i; for(i=0;i<H.length;i++) if(H[i].d===k) return H[i].n; return ""; }
/* the local verdict for a Bogotá day: kind "restrict" (out = the plate endings that do NOT circulate) | "sat" | "sun" | "hol" */
function rule(p){ var r={day:key(p),dow:p.dow,kind:"restrict",out:null,hol:""};
  if(p.dow===0){ r.kind="sun"; return r; }
  if(p.dow===6){ r.kind="sat"; return r; }
  r.hol=holidayOf(p); if(r.hol){ r.kind="hol"; return r; }
  r.out=(p.d%2===0)?LO.slice():HI.slice(); return r; }
function today(ms){ return rule(bogota(ms==null?Date.now():ms)); }
function same(a,b){ return !!a&&!!b&&a.join()===b.join(); }

/* ---- (b) the official text → a verdict for ONE day (no DOM: plain string work) ---- */
function norm(s){ return s.toLowerCase().replace(/[áàâä]/g,"a").replace(/[éèêë]/g,"e").replace(/[íìîï]/g,"i").replace(/[óòôö]/g,"o")
  .replace(/[úùûü]/g,"u").replace(/ñ/g,"n").replace(/[ \s]+/g," "); }
var ENT={aacute:"á",eacute:"é",iacute:"í",oacute:"ó",uacute:"ú",ntilde:"ñ",Aacute:"á",Eacute:"é",Iacute:"í",Oacute:"ó",Uacute:"ú",Ntilde:"ñ",nbsp:" ",amp:"&"};
/* v16.9.1 (C1) · tags out in ONE linear pass with indexOf. The three regexes of v16.9 were quadratic on
   hostile input (measured in Node during the security review: «<a»×200k 26,8 s · «<!--»×100k 20 s · «<svg»×100k 15,9 s). Comments, the blocks
   script/style/noscript/template/svg and every tag become one space; an unclosed comment, block or tag ends the text there.
   Function proposed in the security review; on review: `lo` is lowercased ASCII-only (same length as s). String.toLowerCase() can change
   the length («İ» → «i̇», 2 code units) and then the indexes of lo and s drift apart. */
var BLK=/^<(script|style|noscript|template|svg)\b/;
function lowerAscii(s){ return s.replace(/[A-Z]+/g,function(c){ return c.toLowerCase(); }); }
function strip(s){ var lo=lowerAscii(s), out=[], i=0, n=s.length, lt, e, m;
  while(i<n){ lt=s.indexOf("<",i); if(lt<0){ out.push(s.slice(i)); break; }
    out.push(s.slice(i,lt)," ");
    if(lo.substr(lt,4)==="<!--"){ e=lo.indexOf("-->",lt+4); if(e<0) break; i=e+3; continue; }
    m=BLK.exec(lo.substr(lt,10));
    if(m){ e=lo.indexOf("</"+m[1],lt+1); if(e<0) break; e=lo.indexOf(">",e); if(e<0) break; i=e+1; continue; }
    e=s.indexOf(">",lt+1); if(e<0) break; i=e+1; }
  return out.join(""); }
function textOf(html){ var s=String(html==null?"":html); if(s.length>MAX_CHARS) s=s.slice(0,MAX_CHARS);
  s=strip(s);
  s=s.replace(/&([a-zA-Z]{2,8});/g,function(m,n){ return ENT.hasOwnProperty(n)?ENT[n]:" "; })
     .replace(/&#(\d{1,5});/g,function(m,n){ n=+n; return (n>=32&&n<55296)?String.fromCharCode(n):" "; });
  return norm(s); }
function digitsOf(s){ var m=s.match(/\d/g)||[], out=[], i; for(i=0;i<m.length;i++){ var v=+m[i]; if(out.indexOf(v)<0) out.push(v); } return out; }
function setIs(ds,ref){ if(ds.length!==ref.length) return false; for(var i=0;i<ref.length;i++) if(ds.indexOf(ref[i])<0) return false; return true; }
var DAYRE="(lunes|martes|miercoles|jueves|viernes|sabado|domingo)( festivo)? ";
/* one segment of text (what follows «<weekday> <d> de <month>») → {kind:"restrict",out} | {kind:"none"} | null */
function classify(seg){
  var m=seg.match(/(no pueden circular|pueden circular)[^.]{0,90}?terminad[ao]s? en:? ((?:\d\s*(?:,|y)?\s*){5,10})/);
  if(m){ var ds=digitsOf(m[2]), neg=m[1]==="no pueden circular";
    if(setIs(ds,LO)) return {kind:"restrict",out:neg?LO.slice():HI.slice()};
    if(setIs(ds,HI)) return {kind:"restrict",out:neg?HI.slice():LO.slice()};
    return null; }                                                    // taxis, cargo, special: other sets → not ours
  if(/no aplica|sin pico y placa|no rige/.test(seg)) return {kind:"none"};
  return null; }
/* the official text for day p: {v:"restrict",out} | {v:"none"} | {v:"conflict"} | null (nothing for that day) */
function parse(html,p){ var t=textOf(html), mon=MONTHS[p.m-1];
  if(t.indexOf(mon)<0||t.indexOf("pico y placa")<0) return null;
  var re=new RegExp(DAYRE+"0?"+p.d+" de "+mon+"\\b","g"), nx=new RegExp(DAYRE+"\\d{1,2} de ","g"), got=[], m, i;
  while((m=re.exec(t))&&got.length<12){
    var from=m.index+m[0].length, seg=t.slice(from,from+260); nx.lastIndex=0; var n2=nx.exec(seg); if(n2) seg=seg.slice(0,n2.index);
    var c=classify(seg); if(!c&&m[2]) c={kind:"none"};                // «Lunes festivo 12 de octubre: aplica […] pico y placa regional»
    if(c) got.push(c); }
  if(!got.length) return null;
  for(i=1;i<got.length;i++) if(got[i].kind!==got[0].kind||(got[0].out&&!same(got[i].out,got[0].out))) return {v:"conflict"};
  return got[0].kind==="none"?{v:"none"}:{v:"restrict",out:got[0].out}; }
/* compare: "ok" (agrees) · "diff" (the official text says something else, or contradicts itself) · "unk" (nothing for today) */
function compare(local,remote){ if(!remote) return "unk"; if(remote.v==="conflict") return "diff";
  if(local.kind==="restrict") return (remote.v==="restrict"&&same(remote.out,local.out))?"ok":"diff";
  return remote.v==="none"?"ok":"diff"; }
/* the monthly bulletin URL (pattern of the cited October 2026 bulletin) */
function bulletinUrl(p){ var last=new Date(utc(p.y,p.m+1,1)-DAY).getUTCDate();
  return ORIGIN+"/mi-ciudad/movilidad/pico-y-placa-en-bogota-vehiculos-particulares-1-"+last+"-"+MONTHS[p.m-1]+"-de-"+p.y; }
/* from the tag page: ONE article of this month for today; only same-origin paths that match a strict pattern */
function pickLink(html,p){ var s=String(html==null?"":html).slice(0,MAX_CHARS), mon=MONTHS[p.m-1], re=/href="(\/mi-ciudad\/movilidad\/(?:\d{4}-\d{2}\/)?[a-z0-9-]{8,180})"/g,
    m, best=null, rank=0, ym=new RegExp("-"+mon+"-del?-"+p.y+"(-|$)");
  while((m=re.exec(s))){ var u=m[1], r=0, w;
    if(u.indexOf("pico-y-placa")<0||!ym.test(u)) continue;
    if(/vehiculos-particulares-1-(a-)?\d{2}-/.test(u)) r=3;
    else if((w=u.match(/semana-del-(\d{1,2})-al-(\d{1,2})-de-/))&&+w[1]<=p.d&&p.d<=+w[2]) r=2;
    else if(new RegExp("-"+p.d+"-de-"+mon+"-").test(u)) r=1;
    if(r>rank){ rank=r; best=u; } }
  return best?ORIGIN+best:null; }

/* ---- the network (only from the .wgt / a browser with network; every failure is silent) ---- */
/* v16.9.1 (security review C6) · hot lever from the diagnostics panel: localStorage «p8e.lever.pypnet» = "0" → contrast off (default on).
   ?pypnet=0 / ?pypnow (p8e.js → net(false)) also switch it off; PYP_NET=false switches it off for good. */
var LEVER_KEY="p8e.lever.pypnet", OFF_Q=false;
function leverOn(){ try{ return localStorage.getItem(LEVER_KEY)!=="0"; }catch(e){ return true; } }
var ST={net:PYP_NET&&leverOn(),day:"",v:"",n:0,t:0,busy:false,reqs:0,bytes:0,last:"",err:"",urls:[]};
function readStore(){ try{ var o=JSON.parse(localStorage.getItem(STORE_KEY)||"null");
    if(o&&/^\d{4}-\d{2}-\d{2}$/.test(o.d)&&/^(ok|diff|unk|)$/.test(o.v)&&o.n===(o.n|0)&&o.n>=0&&o.n<=9&&+o.t>=0) return o; }catch(e){} return null; }
function writeStore(){ try{ localStorage.setItem(STORE_KEY,JSON.stringify({d:ST.day,v:ST.v,n:ST.n,t:ST.t})); }catch(e){} }
function get(url,cb){ var x, done=false, tm=0;
  function fin(ok,txt,why){ if(done) return; done=true; clearTimeout(tm); if(!ok) ST.err=why; cb(ok?txt:null); }
  function stop(why){ fin(false,null,why); try{ x.abort(); }catch(e){} }     // the reason first: abort() fires readystatechange (status 0)
  function tooBig(){ try{ return (x.responseText||"").length>MAX_CHARS; }catch(e){ return false; } }   // C5: gzip = no Content-Length
  if(url.indexOf(ORIGIN+"/")!==0){ fin(false,null,"origin"); return; }   // defence in depth: nothing leaves for another host
  try{ x=new XMLHttpRequest(); ST.reqs++; ST.urls.push(url.slice(ORIGIN.length)); if(ST.urls.length>6) ST.urls.shift();
    x.open("GET",url,true);
    x.onreadystatechange=function(){ if(x.readyState===2){ var cl=+(x.getResponseHeader("Content-Length")||0); if(cl>MAX_CHARS) stop("size"); }
      if(x.readyState===3&&tooBig()) stop("size");
      if(x.readyState===4){ if(x.status===200){ var t=x.responseText||""; ST.bytes+=t.length; if(t.length>MAX_CHARS) fin(false,null,"size"); else fin(true,t,""); }
        else fin(false,null,x.status?"http "+x.status:"network"); } };                 // status 0 = blocked / offline / CORS: not an HTTP answer
    x.onprogress=function(e){ if((e&&e.loaded>MAX_CHARS)||tooBig()) stop("size"); };
    x.onerror=function(){ fin(false,null,"network"); };
    x.send(); }catch(e){ fin(false,null,"throw"); return; }
  tm=setTimeout(function(){ stop("timeout"); },TIMEOUT_MS); }
/* contrast today's local verdict with the official text; cb(v) only when there is a definite new verdict */
function check(online,cb,ms){
  if(!ST.net||ST.busy||!online) return false;
  var now=(ms==null)?Date.now():ms, p=bogota(now), k=key(p), local=rule(p);
  if(ST.day!==k){ var o=readStore(); if(o&&o.d===k){ ST.day=k; ST.v=o.v; ST.n=o.n; ST.t=+o.t; } else { ST.day=k; ST.v=""; ST.n=0; ST.t=0; } }
  if(ST.v==="ok"||ST.v==="diff"||ST.n>=MAX_TRIES||(ST.t&&now-ST.t<RETRY_MS)) return false;
  ST.busy=true; ST.n++; ST.t=now; ST.err=""; writeStore();
  function end(v){ ST.busy=false; if(v){ ST.v=v; ST.last=v; } writeStore(); if(v&&cb) cb(v); }
  function judge(html){ try{ var r=html?parse(html,p):null; return r?compare(local,r):""; }catch(e){ ST.err="parse"; return ""; } }   // silence
  function link(html){ try{ return html?pickLink(html,p):null; }catch(e){ ST.err="parse"; return null; } }
  get(bulletinUrl(p),function(h1){ var v=judge(h1); if(v){ end(v); return; }
    if(!h1&&!/^http /.test(ST.err)){ end(""); return; }                // no network / timeout / size: stop here (silence)
    get(ORIGIN+"/tag/pico-y-placa-en-bogota",function(h2){ var u=link(h2); if(!u){ end(h2?"unk":""); return; }
      get(u,function(h3){ var v3=judge(h3); end(v3||(h3?"unk":"")); }); }); });
  return true; }
/* the verdict to SHOW for a Bogotá day: "diff" only for the same day (a stored verdict from yesterday says nothing today) */
function shown(ms){ var p=bogota(ms==null?Date.now():ms), k=key(p);
  if(ST.day!==k){ var o=readStore(); return (o&&o.d===k)?o.v:""; } return ST.v; }

window.P8EPyP={today:today,rule:rule,bogota:bogota,holidays:holidays,easter:function(y){ return key(parts(easter(y))); },
  parse:parse,textOf:textOf,compare:compare,pickLink:pickLink,bulletinUrl:bulletinUrl,check:check,shown:shown,
  net:function(on){ if(on!==undefined){ OFF_Q=!on; ST.net=!!on&&PYP_NET&&leverOn(); } return ST.net; },
  lever:function(on){ if(on!==undefined){ try{ if(on) localStorage.removeItem(LEVER_KEY); else localStorage.setItem(LEVER_KEY,"0"); }catch(e){}
      ST.net=!!on&&PYP_NET&&!OFF_Q; } return leverOn(); },
  _strip:strip,
  stats:function(){ return JSON.parse(JSON.stringify(ST)); },
  LIMITS:{origin:ORIGIN,maxChars:MAX_CHARS,timeoutMs:TIMEOUT_MS,maxTries:MAX_TRIES,retryMs:RETRY_MS,perAttempt:3}};
})();
