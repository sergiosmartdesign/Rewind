/* SPDX-FileCopyrightText: 2026 Sergio Ayala
 * SPDX-License-Identifier: GPL-3.0-or-later */
/* P8e v14 · DIAGNOSTICS PANEL (2026-10-24). ES5, no dependencies, English, legible at 10 ft.
   Closes ON THE TV the points the static firmware analysis could not («Lo no concluyente…»):
     1 engine (UA, WebGL1 + its renderer, WebGL2, AudioContext / webkitAudioContext, CSS.supports, rAF, KeyboardEvent.key)
     2 model (webapis.productinfo.getRealModel / getModel, or the SecurityError) — the DUID is NEVER read
     3 live keyCodes (every key pressed while open; colour keys / Exit registered only while open) + getSupportedKeys()
     4 launch test of Netflix by numeric id and by alias + dump of tizen.application.getAppsInfo() (id, name)
       v16.7: «Try Netflix method n/6» tries ONE form per press (launch / launchAppControl × the three ids the TV
       lists) and remembers which one is next, also across a restart; the row also shows the last launches of the UI (persisted
       by the adapter in «p8e.apps.log», so they survive the TV terminating Rewind).
     5 order of the lifecycle events when coming back (visibilitychange, blur/focus, pagehide/pageshow, performance.now)
       v16.7: plus the adapter's LIFE TRAIL («p8e.life», recorded from load, not only once the panel was opened): «#id» is the page
       session; a new #id right after «pagehide» = the TV terminated Rewind instead of hiding it.
     + v16.7 levers (localStorage, no query string in the .wgt): «Reply-return» and «Exit guard» (README v16.7).
     6 a deliberate CSP violation: an image from another origin that must NOT load (securitypolicyviolation or load error)
       + the real origin of $WEBAPIS (document.scripts ending in webapis.js, with URL/origin) and an
         <embed type="application/x-ppapi-productinfo"> object-src probe: append to body, read whether securitypolicyviolation
         (object-src) fired or the node stayed inert, then remove it (DOM clean). No src → no request. Panel only.
     7 network: isConnectedToGateway() and the raw codes of addNetworkStateChangeListener
     + an fps meter (mean and 1 % low of the last 300 frames), for H3.
   Everything is shown and saved in localStorage «p8e.diag» (JSON) so it can be read later (Web Inspector or the panel).

   HOW TO OPEN IT (never by accident):
   · Mac / LAN: ?dev=1&diag=1 opens it at start. (?dev=1 alone does NOT: it is the mode of the test suites.)
   · On the TV (.wgt, there is no query string): the remote sequence  Up Up Down Down Left Right Left Right  (the Konami code
     without B A), 8 arrow presses in a row within 4 s, nothing else in between. It only uses the arrows (keyCodes 37–40),
     which are mandatory keys on Tizen: no registration and no colour key whose code is still unmeasured. The keys still
     reach the corridor (↑↑ ↓↓ ←→ ←→ ends on the same app it started on).
   · Close: Back (or Esc) twice within 2 s. While it is open every key goes to the panel only (the launcher does not move).
     Up/Down/Left/Right choose a button, Enter presses it.
   Cost when closed: one keydown listener (capture) that keeps the last 8 arrows. Nothing else runs until the first open:
   no DOM, no rAF, no listener of the TV, no request. When open: its own rAF (the fps meter) and the TV APIs above.
   Privacy: no getDuid(), no IP/MAC, nothing leaves the TV. getAppsInfo() only when its button is pressed. */
(function(){
"use strict";
var KEY="p8e.diag", VERSION=14, BUILD="16.9";
var COMBO=[38,38,40,40,37,39,37,39], COMBO_MS=4000, BACK2_MS=2000;
/* not "Exit" (B4): registered, it would stop closing the app while the panel is open; its code comes
   from getSupportedKeys() */
var REG_KEYS=["ColorF0Red","ColorF1Green","ColorF2Yellow","ColorF3Blue","Info","ChannelUp","ChannelDown","MediaPlayPause"];
var FPS_N=300, EV_N=40, KEYS_N=40;
/* another origin (loopback, port 9 = discard): the CSP (img-src 'self' blob: data:) must block it. Loopback on purpose: even
   without a CSP nothing leaves the device (no DNS, no LAN) */
var PROBE_URL="http://127.0.0.1:9/p8e-csp-probe.png";
/* v16.7: the v14 NETFLIX constant (11101200001 / org.tizen.netflix-app) went with its buttons; 11101200001 = NotFoundError on the TV */
/* v16.7 · the forms of opening Netflix, one per press (RN1MCdNq8t.Netflix by launch = BLACK, measured 2026-10-25) */
var OP_DEFAULT="http://tizen.org/appcontrol/operation/default";
var NF_METHODS=[{via:"launch",id:"RN1MCdNq8t.Netflix"},{via:"appcontrol",id:"RN1MCdNq8t.Netflix"},{via:"launch",id:"org.tizen.netflix-app"},
  {via:"appcontrol",id:"org.tizen.netflix-app"},{via:"launch",id:"org.tizen.netflixlowmem"},{via:"appcontrol",id:"org.tizen.netflixlowmem"}];
var CLEAR_KEYS=["p8e.life","p8e.apps.log","p8e.srcfail","p8e.away","p8e.pyp","p8e.rates","p8e.rates.try"];   // v16.9.1/v16.10: pico y placa + TRM   // «Clear saved data» also forgets these (v16.7)

function qp(k){ var m=new RegExp("[?&]"+k+"=([^&#]*)").exec(location.search); if(!m) return ""; try{ return decodeURIComponent(m[1]); }catch(e){ return ""; } }
var DEV=qp("dev")==="1", AUTO=DEV&&qp("diag")==="1";
function now(){ return Math.round(performance.now()*10)/10; }
function ename(e){ return String((e&&e.name)||(e&&e.message)||e||"Error").slice(0,60); }
function clip(s,n){ return String(s==null?"":s).replace(/[\u0000-\u001f<>]/g,"").replace(/^\s+|\s+$/g,"").slice(0,n||40); }
function yn(b){ return b===true?"yes":(b===false?"no":"?"); }

/* the saved record: read on the FIRST open only (what was measured before survives: launches, apps, events, network codes) */
var D=null;
function init(){ if(D) return; var o=load()||{};
  D={v:VERSION,opens:o.opens||0,p1:null,p2:null,p3:{keys:[],supported:null,registered:{ok:[],fail:[]}},
    p4:{tizen:false,adapter:null,launch:arr(o.p4&&o.p4.launch),apps:(o.p4&&o.p4.apps&&typeof o.p4.apps==="object")?o.p4.apps:{status:"not run"},
      nfNext:(o.p4&&o.p4.nfNext>=0&&o.p4.nfNext<NF_METHODS.length)?(o.p4.nfNext|0):0},
    p5:{events:arr(o.p5&&o.p5.events)},p6:null,p7:{api:false,codes:arr(o.p7&&o.p7.codes)},fps:null}; }
function arr(x){ return Array.isArray(x)?x:[]; }   // a damaged record never breaks the panel (security review I2)
function load(){ try{ var s=localStorage.getItem(KEY); return s?JSON.parse(s):null; }catch(e){ return null; } }
function save(){ D.at=new Date().toISOString(); try{ localStorage.setItem(KEY,JSON.stringify(D)); D.bytes=localStorage.getItem(KEY).length; }catch(e){ D.saveErr=ename(e); } }

/* ---------- 1 · engine ---------- */
function lose(g){ try{ var x=g.getExtension("WEBGL_lose_context"); if(x) x.loseContext(); }catch(e){} }
function sup(a,b){ try{ if(!(window.CSS&&typeof CSS.supports==="function")) return null; return b===undefined?!!CSS.supports(a):!!CSS.supports(a,b); }catch(e){ return null; } }
function engine(){ var r={ua:clip(navigator.userAgent,300)}, c, g, x;
  try{ c=document.createElement("canvas"); c.width=c.height=1; g=c.getContext("webgl")||c.getContext("experimental-webgl"); }catch(e){ g=null; }
  r.webgl=!!g;
  if(g){ try{ r.renderer=clip(g.getParameter(g.RENDERER),80); r.vendor=clip(g.getParameter(g.VENDOR),80); r.glVersion=clip(g.getParameter(g.VERSION),80);
      r.maxTexture=g.getParameter(g.MAX_TEXTURE_SIZE); x=g.getExtension("WEBGL_debug_renderer_info"); r.debugInfo=!!x;
      if(x){ r.unmaskedRenderer=clip(g.getParameter(x.UNMASKED_RENDERER_WEBGL),80); r.unmaskedVendor=clip(g.getParameter(x.UNMASKED_VENDOR_WEBGL),80); } }
    catch(e){ r.glErr=ename(e); }
    lose(g); }
  try{ c=document.createElement("canvas"); c.width=c.height=1; g=c.getContext("webgl2"); r.webgl2=!!g; if(g) lose(g); }catch(e){ r.webgl2=false; }
  r.AudioContext=!!window.AudioContext; r.webkitAudioContext=!!window.webkitAudioContext;
  r.cssVars=sup("(--a:0)"); r.webkitClipPath=sup("-webkit-clip-path","circle(1px)"); r.clipPath=sup("clip-path","circle(1px)");
  r.rAF=typeof window.requestAnimationFrame==="function";
  r.keyInPrototype=!!(window.KeyboardEvent&&("key" in KeyboardEvent.prototype)); r.keyOnEvent=null;   // filled by the first key pressed
  r.cspEvent=typeof window.SecurityPolicyViolationEvent!=="undefined";
  r.screen=[screen.width,screen.height,window.devicePixelRatio||1]; r.tizen=typeof window.tizen; r.webapis=typeof window.webapis;
  /* v14: el origen REAL de $WEBAPIS — qué <script …webapis.js> cargó el WRT y desde dónde (W2/R6-4b: la ruta/origen la sustituye el WRT). En localhost el tag va comentado → lista vacía (esperado). */
  r.webapisSrc=[]; try{ var ss=document.scripts||document.getElementsByTagName("script"), i2, an=document.createElement("a");
    for(i2=0;i2<ss.length;i2++){ var src=ss[i2].src||""; if(/webapis\.js(\?|#|$)/i.test(src)){ an.href=src; r.webapisSrc.push({src:clip(src,160),origin:clip(an.protocol+"//"+an.host,80)}); } } }catch(e){ r.webapisSrc={error:ename(e)}; }
  return r; }

/* ---------- 2 · model (getRealModel / getModel; never getDuid) ---------- */
function model(){ var pi=window.webapis&&window.webapis.productinfo, r={api:!!pi};
  if(!pi) return r;
  ["getRealModel","getModel"].forEach(function(f){
    if(typeof pi[f]!=="function"){ r[f]={missing:true}; return; }
    try{ r[f]={value:clip(pi[f](),24)}; }catch(e){ r[f]={error:ename(e),msg:clip(e&&e.message,100)}; } });
  return r; }

/* ---------- 3 · keys ---------- */
function tvKeys(on){ var d=window.tizen&&window.tizen.tvinputdevice; if(!d) return;
  if(on){ D.p3.registered={ok:[],fail:[]};
    if(!D.p3.supported&&typeof d.getSupportedKeys==="function"){ try{ D.p3.supported=d.getSupportedKeys().map(function(k){ return {name:clip(k.name,32),code:k.code}; }); }catch(e){ D.p3.supported={error:ename(e)}; } } }
  for(var i=0;i<REG_KEYS.length;i++){ try{ if(on){ d.registerKey(REG_KEYS[i]); D.p3.registered.ok.push(REG_KEYS[i]); } else d.unregisterKey(REG_KEYS[i]); }
    catch(e){ if(on) D.p3.registered.fail.push(REG_KEYS[i]+": "+ename(e)); } } }

/* ---------- 4 · launch + getAppsInfo ---------- */
/* v16.7 · one Netflix form per press; the next one is remembered (D.p4.nfNext, saved) so a press that leaves Rewind is not repeated */
function nfLabel(){ var m=NF_METHODS[D.p4.nfNext]; return "Try Netflix method "+(D.p4.nfNext+1)+"/"+NF_METHODS.length+": "+m.via+" "+m.id; }
function nfTry(){ var k=D.p4.nfNext, m=NF_METHODS[k], A=window.tizen&&window.tizen.application, rec={via:"#"+(k+1)+" "+m.via,id:m.id,t:now(),result:"pending"};
  D.p4.nfNext=(k+1)%NF_METHODS.length; D.p4.launch.push(rec); if(D.p4.launch.length>12) D.p4.launch.shift();
  function end(res,e){ rec.result=res; if(e) rec.msg=clip(e.message,100); rec.ms=Math.round(now()-rec.t); save(); render(); }
  try{
    if(!A) end("no tizen.application");
    else if(m.via==="launch") A.launch(m.id,function(){ end("ok"); },function(e){ end(ename(e),e); });
    else if(typeof window.tizen.ApplicationControl!=="function"||typeof A.launchAppControl!=="function") end("no launchAppControl");
    else A.launchAppControl(new window.tizen.ApplicationControl(OP_DEFAULT,null,null,null,[]),m.id,function(){ end("ok"); },function(e){ end(ename(e),e); });
  }catch(e){ end("throw "+ename(e),e); }
  if(BTN[0]) BTN[0].el.textContent=nfLabel();
  save(); render(); }
/* v16.7 · levers of the adapter (localStorage): reply-return and exit guard */
function leverOn(n){ var A=window.P8EApps; if(A&&A.lever) return !!A.lever(n); try{ return localStorage.getItem("p8e.lever."+n)==="1"; }catch(e){ return false; } }
function leverFlip(n){ var A=window.P8EApps, on=!leverOn(n);
  if(A&&A.lever) A.lever(n,on); else { try{ if(on) localStorage.setItem("p8e.lever."+n,"1"); else localStorage.removeItem("p8e.lever."+n); }catch(e){} }
  leverLabels(); render(); }
function leverLabels(){ if(BTN[4]) BTN[4].el.textContent="Reply-return: "+(leverOn("reply")?"ON":"off"); if(BTN[5]) BTN[5].el.textContent="Exit guard: "+(leverOn("exitguard")?"ON":"off");
  var P=window.P8EPyP; if(BTN[6]) BTN[6].el.textContent="PyP contrast: "+(!P||!P.lever?"n/a":(P.lever()?"ON":"off")); }
/* v16.9 · the pico y placa contrast (pyp.js) on row 7: verdict, GETs and last error — to see ON THE TV whether the
   WRT lets the XHR to https://bogota.gov.co through (README v16.9: CORS is inferred, not measured). Only words and counts, as text. */
function pypDiag(){ try{ var P=window.P8EPyP; if(!P||!P.stats) return ""; var s=P.stats();
    return " · pico y placa: "+(s.net?"":"contrast off · ")+"verdict "+(s.v||"none")+" · "+s.reqs+" GET"+(s.err?" · "+clip(s.err,20):""); }catch(e){ return ""; } }
/* v16.10 · TRM dólar y euro (rates.js) on the same row: last value + its date + GETs + last error, to see ON THE TV whether the
   WRT lets datos.gov.co and ecb.europa.eu through (CORS is measured, not inferred: README v16.10). */
function ratesDiag(){ try{ var R=window.P8ERates; if(!R||!R.stats) return ""; var s=R.stats(), g=R.get();
    var t=g&&g.trm?(g.trm.v.toFixed(2)+" "+g.trmDate):"none", e=g&&g.eur?(g.eur.v.toFixed(2)+" "+g.eurDate):"none";
    return " · TRM: "+t+" · EUR: "+e+" · "+s.reqs+" GET"+(s.err?" · "+clip(s.err,20):""); }catch(e){ return ""; } }
/* v16.7 · the adapter's life trail, compact: «#sid event» (only the last 8) */
function lifeTrail(){ try{ var L=window.P8EApps&&window.P8EApps.stats?window.P8EApps.stats().life:null;
    if(!L){ L=JSON.parse(localStorage.getItem("p8e.life")||"[]"); } if(!L||!L.length) return "";
    return " · trail: "+L.slice(-8).map(function(x){ return "#"+clip(x.s,6)+" "+clip(x.e,40); }).join(" → "); }catch(e){ return ""; } }
function appsInfo(){ var A=window.tizen&&window.tizen.application;
  if(!A||typeof A.getAppsInfo!=="function"){ D.p4.apps={status:"no tizen.application.getAppsInfo"}; save(); render(); return; }
  D.p4.apps={status:"pending",t:now()};
  try{ A.getAppsInfo(function(list){ list=list||[];
      D.p4.apps={status:"ok",n:list.length,list:list.slice(0,200).map(function(a){ return {id:clip(a.id,64),name:clip(a.name,40)}; })}; save(); render(); },
    function(e){ D.p4.apps={status:ename(e),msg:clip(e&&e.message,100)}; save(); render(); }); }
  catch(e){ D.p4.apps={status:"throw "+ename(e),msg:clip(e&&e.message,100)}; }
  save(); render(); }

/* ---------- 5 · lifecycle order (installed on the first open, then for the whole session) ---------- */
var evOn=false;
function evRec(name){ return function(){ var L=D.p5.events; L.push({e:name+(name==="visibilitychange"?(document.hidden?":hidden":":visible"):""),t:now()});
  if(L.length>EV_N) L.shift(); save(); if(OPEN) render(); }; }
function evInstall(){ if(evOn) return; evOn=true;
  document.addEventListener("visibilitychange",evRec("visibilitychange"));
  addEventListener("blur",evRec("blur")); addEventListener("focus",evRec("focus"));
  addEventListener("pagehide",evRec("pagehide")); addEventListener("pageshow",evRec("pageshow")); }

/* ---------- 6 · CSP probe ---------- */
function cspProbe(){ var r={url:PROBE_URL,t:now(),violation:null,load:false,error:false,verdict:"pending"}, img=new Image();
  D.p6=r;
  function onV(e){ var u=String(e.blockedURI||e.blockedURL||""); if(u&&u.indexOf("127.0.0.1")<0) return;
    r.violation={directive:clip(e.violatedDirective||e.effectiveDirective,40),blocked:clip(u,60),t:now()}; }
  document.addEventListener("securitypolicyviolation",onV);
  img.onload=function(){ r.load=true; }; img.onerror=function(){ r.error=true; };
  img.src=PROBE_URL;
  setTimeout(function(){ document.removeEventListener("securitypolicyviolation",onV); img.onload=img.onerror=null;
    r.verdict=r.load?"LOADED: the CSP did not block it":(r.violation?"blocked by the CSP ("+r.violation.directive+")":(r.error?"not loaded (load error, no CSP event)":"no answer"));
    save(); if(OPEN) render(); },1500);
  save(); }

/* ---------- 6b · <embed> / object-src probe ---------- */
/* v14: «CSP may block <embed> (object-src)». webapis.js monta sus plugins Pepper como
   <embed type="application/x-ppapi-*"> en document.body la 1.ª vez (W1/R6-4). Con object-src 'none'
   en la CSP (config.xml) esos embeds podrían no crearse y productinfo/network fallarían en silencio. Se MIDE aquí: se crea un
   <embed type="application/x-ppapi-productinfo"> (sin src → 0 peticiones), se añade a body, se mira si saltó
   securitypolicyviolation (object-src) o quedó inerte, y se RETIRA siempre (DOM limpio). Sólo en el panel, nada en producción. */
function embedProbe(){ var r={type:"application/x-ppapi-productinfo",t:now(),violation:null,created:false,removed:false,verdict:"pending"}, emb=null, fired=false;
  D.p6emb=r;
  function onV(e){ var d=String(e.violatedDirective||e.effectiveDirective||""); if(/object-src/.test(d)){ fired=true; r.violation=clip(d,40); } }
  document.addEventListener("securitypolicyviolation",onV);
  try{ emb=document.createElement("embed"); emb.type=r.type; emb.setAttribute("aria-hidden","true");
    emb.style.cssText="position:absolute;width:0;height:0;opacity:0;pointer-events:none"; document.body.appendChild(emb); r.created=!!emb.parentNode; }
  catch(e){ r.verdict="error "+ename(e); }
  setTimeout(function(){ document.removeEventListener("securitypolicyviolation",onV);
    if(emb&&emb.parentNode) emb.parentNode.removeChild(emb); r.removed=!(emb&&emb.parentNode);   // por referencia: en el TV webapis.js tiene sus propios <embed>, un querySelector global mentiría
    if(r.verdict==="pending") r.verdict=fired?("CSP may block <embed> (object-src): blocked ("+r.violation+")"):("CSP may block <embed> (object-src): no violation (embed created; inert on plugin-less engines)");
    save(); if(OPEN) render(); },400);
  save(); }

/* ---------- 7 · network ---------- */
var netId=null;
function network(on){ var n=window.webapis&&window.webapis.network, P=D.p7;
  if(on){ P.api=!!n; if(!n){ P.onLine=navigator.onLine; return; }
    try{ P.gateway=!!n.isConnectedToGateway(); }catch(e){ P.gateway=null; P.gatewayErr=ename(e); }
    try{ var NS=n.NetworkState, k; if(NS){ P.states={}; for(k in NS) if(Object.prototype.hasOwnProperty.call(NS,k)&&typeof NS[k]==="number") P.states[k]=NS[k]; } }catch(e){}
    if(netId==null&&typeof n.addNetworkStateChangeListener==="function"){
      try{ netId=n.addNetworkStateChangeListener(function(st){ P.codes.push({code:st,t:now()}); if(P.codes.length>20) P.codes.shift();
          try{ P.gateway=!!n.isConnectedToGateway(); }catch(e){} save(); if(OPEN) render(); }); P.listener=true; }
      catch(e){ P.listener=ename(e); } } }
  else if(netId!=null&&n&&typeof n.removeNetworkStateChangeListener==="function"){ try{ n.removeNetworkStateChangeListener(netId); }catch(e){} netId=null; } }

/* ---------- fps (own rAF, only while open) ---------- */
var F={last:0,d:[],raf:0};
function frame(t){ if(!OPEN){ F.raf=0; return; } if(F.last&&t>F.last) { F.d.push(t-F.last); if(F.d.length>FPS_N) F.d.shift(); } F.last=t; F.raf=requestAnimationFrame(frame); }
function fpsStats(){ var n=F.d.length, i, sum=0; if(n<10) return null; var a=F.d.slice().sort(function(x,y){ return y-x; }), k=Math.max(1,Math.round(n*0.01)), w=0;
  for(i=0;i<n;i++) sum+=a[i]; for(i=0;i<k;i++) w+=a[i];
  return {n:n,avg:+(1000*n/sum).toFixed(1),low1:+(1000*k/w).toFixed(1),meanMs:+(sum/n).toFixed(2),worstMs:+a[0].toFixed(1)}; }

/* v16.7 · lo que el launcher intentó lanzar desde la interfaz (registro del adaptador: id → resultado), sin el DUID */
function uiLaunches(){ try{ var L=window.P8EApps&&window.P8EApps.stats?window.P8EApps.stats().log:[]; if(!L||!L.length) return ""; return " · UI: "+L.slice(-4).map(function(x){ return clip(x.id,28)+" → "+clip(x.res,24); }).join(" · "); }catch(e){ return ""; } }
/* ---------- panel ---------- */
var OPEN=false, EL=null, ROWS={}, BTN=[], SEL=0, LIST=null, HINT=null, FPSEL=null, TICK=0, backAt=0, LASTLIST="apps";
/* own class names (dg-*): the launcher already styles .foot, .k, .b, .on… and those rules would leak in. Opaque, M47-safe CSS
   (no var(), no gap, no inset). Text 22–40 px on the 1920×1080 canvas; cream on #001219 ≈ 18:1, teal #94D2BD ≈ 11:1 */
var CSS_TXT="#p8eDiag{position:absolute;left:72px;top:48px;width:1776px;height:984px;z-index:9999;box-sizing:border-box;padding:26px 36px;"+
  "background:#001219;color:#FFFEE8;font:26px/1.32 Rubik,Arial,sans-serif;font-weight:400;border:4px solid #FEC631;border-radius:12px;overflow:hidden;cursor:auto;text-align:left}"+
  "#p8eDiag .dg-h{font-size:38px;font-weight:700;color:#FEC631;margin:0 0 14px 0;letter-spacing:.02em;padding-right:300px}"+
  "#p8eDiag .dg-hint{margin-left:36px;font-size:26px;color:#FFFEE8;font-weight:400;letter-spacing:0}"+
  "#p8eDiag .dg-row{margin:0 0 7px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"+
  "#p8eDiag .dg-ua{font-size:22px;color:#E9D8A6;padding-right:300px}"+
  "#p8eDiag .dg-k{display:inline-block;width:200px;color:#94D2BD;font-weight:700}"+
  "#p8eDiag .dg-fps{position:absolute;right:36px;top:22px;font-size:40px;font-weight:700;color:#FEC631;text-align:right}"+
  "#p8eDiag .dg-fps small{display:block;font-size:24px;color:#FFFEE8;font-weight:400}"+
  "#p8eDiag .dg-btns{margin:14px 0 10px 0}"+
  "#p8eDiag .dg-b{display:inline-block;margin:0 14px 12px 0;padding:9px 18px;border:3px solid #FFFEE8;border-radius:8px;font-size:25px}"+
  "#p8eDiag .dg-b.dg-on{background:#FEC631;color:#001219;border-color:#FEC631;font-weight:700}"+
  "#p8eDiag .dg-list{font-size:22px;line-height:1.3;color:#E9D8A6;white-space:normal;height:190px;overflow:hidden}"+
  "#p8eDiag .dg-foot{position:absolute;left:36px;right:36px;bottom:18px;font-size:22px;color:#94D2BD}";
function el(tag,cls,parent,txt){ var e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; if(parent) parent.appendChild(e); return e; }
function build(){ if(EL) return;
  var st=document.createElement("style"); st.id="p8eDiagCss"; st.textContent=CSS_TXT; document.head.appendChild(st);
  EL=el("div",null,null); EL.id="p8eDiag"; EL.setAttribute("role","dialog"); EL.setAttribute("aria-label","Diagnostics");
  var h=el("div","dg-h",EL,"DIAGNOSTICS · P8e v"+BUILD); HINT=el("span","dg-hint",h,"Back twice to close");
  FPSEL=el("div","dg-fps",EL,"— fps");
  ROWS.ua=el("div","dg-row dg-ua",EL);
  [["p1","1 Engine"],["p2","2 Model"],["p3","3 Keys"],["p4","4 Launch"],["p5","5 Return"],["p6","6 CSP"],["p7","7 Network"]].forEach(function(r){
    var d=el("div","dg-row",EL); el("span","dg-k",d,r[1]); ROWS[r[0]]=el("span",null,d); });
  var b=el("div","dg-btns",EL);
  /* v16.7: «Test Netflix by id / by alias» (v14) → one button that walks the six forms (nfTry); + the two levers */
  [[nfLabel(),function(){ nfTry(); }],
   ["List apps (getAppsInfo)",function(){ LASTLIST="apps"; appsInfo(); }],["Show supported keys",function(){ LASTLIST="keys"; render(); }],
   ["Run CSP probe",function(){ cspProbe(); render(); }],
   ["Reply-return: off",function(){ leverFlip("reply"); }],["Exit guard: off",function(){ leverFlip("exitguard"); }],
   /* v16.9.1 (security review C6): the pico y placa contrast, hot (pyp.js · localStorage p8e.lever.pypnet = "0" → off; default ON) */
   ["PyP contrast: ON",function(){ var P=window.P8EPyP; if(P&&P.lever) P.lever(!P.lever()); leverLabels(); render(); }],
   /* really clears (security review B1): removes the key, closes WITHOUT saving and forgets the record; the next open starts empty.
      v16.7: also the adapter's trail and launch log, the «Source released» mark and the away mark */
   ["Clear saved data and close",function(){ close(true); try{ localStorage.removeItem(KEY); CLEAR_KEYS.forEach(function(k){ localStorage.removeItem(k); }); }catch(e){} D=null; }],
   ["Close",function(){ close(); }]].forEach(function(x){ var e=el("span","dg-b",b,x[0]); BTN.push({el:e,fn:x[1]}); });
  LIST=el("div","dg-list",EL);
  ROWS.foot=el("div","dg-foot",EL);
  (document.getElementById("tv")||document.body).appendChild(EL); }
function render(){ if(!EL) return; var p, s, i, L;
  p=D.p1||{}; ROWS.ua.textContent="UA: "+(p.ua||"?");
  ROWS.p1.textContent="WebGL "+yn(p.webgl)+(p.webgl?" ("+(p.unmaskedRenderer||p.renderer||"?")+")":"")+" · WebGL2 "+yn(p.webgl2)+" · AudioContext "+yn(p.AudioContext)+
    " · webkitAudioContext "+yn(p.webkitAudioContext)+" · CSS vars "+yn(p.cssVars)+" · -webkit-clip-path "+yn(p.webkitClipPath)+" · rAF "+yn(p.rAF)+
    " · e.key "+(p.keyOnEvent==null?"(press a key)":p.keyOnEvent);
  p=D.p2||{}; if(!p.api) s="no webapis.productinfo (webapis.js not loaded: localhost, CSP or path)";
  else s=["getRealModel","getModel"].map(function(f){ var v=p[f]||{}; return f+" "+(v.value!=null?v.value:(v.error?v.error:(v.missing?"missing":"?"))); }).join(" · ");
  var ws=D.p1&&D.p1.webapisSrc, wss=!ws?"":(ws.error?(" · $WEBAPIS error "+ws.error):(ws.length?(" · $WEBAPIS: "+ws.map(function(x){ return x.origin+x.src.replace(/^[a-z]+:\/\/[^\/]+/i,""); }).join(", ")):" · $WEBAPIS: not in document.scripts (localhost/commented)"));
  ROWS.p2.textContent=s+wss;
  L=D.p3.keys; s=L.length?L.slice(-14).reverse().map(function(k){ return k.code; }).join(" · "):"press any key on the remote";
  ROWS.p3.textContent="last: "+s+" · registered "+D.p3.registered.ok.length+"/"+REG_KEYS.length;
  L=D.p4.launch; p=L.length?L[L.length-1]:null;
  ROWS.p4.textContent=(window.tizen?"":"no tizen · ")+(p?("Netflix "+p.via+" ("+p.id+"): "+p.result):"press a test button")+" · apps: "+(D.p4.apps.status==="ok"?D.p4.apps.n:D.p4.apps.status)+uiLaunches();
  L=D.p5.events; ROWS.p5.textContent=(L.length?L.slice(-6).map(function(x){ return x.e+" "+Math.round(x.t); }).join(" → "):"leave and come back to record the order")+lifeTrail();
  p=D.p6; var eb=D.p6emb, ebs=eb?(" · "+(eb.verdict==="pending"?"<embed> …":eb.verdict)+(eb.verdict==="pending"?"":(eb.removed?" · DOM clean":" · NODE LEFT"))):"";
  ROWS.p6.textContent=(p?(p.verdict+(p.violation?" · event yes":(p.verdict==="pending"?"":" · event no"))):"not run")+ebs;
  p=D.p7; ROWS.p7.textContent=(!p.api?("no webapis.network · navigator.onLine "+yn(p.onLine)):("gateway "+yn(p.gateway)+(p.gatewayErr?" ("+p.gatewayErr+")":"")+
    " · codes "+(p.codes.length?p.codes.slice(-8).map(function(c){ return c.code; }).join(", "):"none yet (unplug / replug)")+" · listener "+yn(p.listener===true)))+pypDiag()+ratesDiag();
  var f=D.fps; FPSEL.textContent=""; FPSEL.appendChild(document.createTextNode(f?f.avg+" fps":"— fps")); el("small",null,FPSEL,f?("1% low "+f.low1+" · "+f.n+" frames"):"measuring…");
  for(i=0;i<BTN.length;i++) BTN[i].el.className="dg-b"+(i===SEL?" dg-on":"");
  if(LASTLIST==="keys"){ s=D.p3.supported; LIST.textContent=!s?"Supported keys: no tizen.tvinputdevice":(s.error?"Supported keys: "+s.error:"Supported keys ("+s.length+"): "+s.map(function(k){ return k.name+" "+k.code; }).join(" · ")); }
  else { s=D.p4.apps; LIST.textContent=s.status!=="ok"?("Installed apps: "+s.status+(s.msg?" ("+s.msg+")":"")):("Installed apps ("+s.n+"): "+s.list.map(function(a){ return a.name+" "+a.id; }).join(" · ")); }
  ROWS.foot.textContent="Saved in localStorage “"+KEY+"”"+(D.bytes?" ("+D.bytes+" bytes)":"")+(D.saveErr?" · save error "+D.saveErr:"")+
    " · Arrows choose · Enter presses · Back twice closes · colour, Info, CH and play keys are captured while open"; }

function open(how){ if(OPEN) return; init(); build(); OPEN=true; D.opens++; D.how=how; SEL=0; backAt=0; F.last=0; F.d=[];
  D.p1=engine(); D.p2=model(); D.p4.tizen=!!(window.tizen&&window.tizen.application); D.p4.adapter=window.P8EApps?(window.P8EApps.platform||"custom"):null;
  evInstall(); tvKeys(true); network(true); cspProbe(); embedProbe();
  if(BTN[0]) BTN[0].el.textContent=nfLabel(); leverLabels(); EL.style.display="block"; F.raf=requestAnimationFrame(frame);
  TICK=setInterval(function(){ D.fps=fpsStats(); render(); },500);
  save(); render(); }
function close(noSave){ if(!OPEN) return; OPEN=false; clearInterval(TICK); TICK=0; if(F.raf){ cancelAnimationFrame(F.raf); F.raf=0; }
  tvKeys(false); network(false); if(!noSave){ D.fps=fpsStats()||D.fps; save(); } if(EL) EL.style.display="none"; }

function inPanel(e){ var c=e.keyCode, L=D.p3.keys;
  if(D.p1&&D.p1.keyOnEvent==null) D.p1.keyOnEvent=(typeof e.key==="string"&&e.key)?"yes ("+clip(e.key,16)+")":"no";
  L.push({code:c,t:now()}); if(L.length>KEYS_N) L.shift();
  if(c===10009||c===27){ var t=Date.now(); if(backAt&&t-backAt<=BACK2_MS){ backAt=0; save(); close(); return; } backAt=t; HINT.textContent="Press Back again to close"; }
  else { backAt=0; HINT.textContent="Back twice to close";
    if(c===37||c===38) SEL=(SEL+BTN.length-1)%BTN.length; else if(c===39||c===40) SEL=(SEL+1)%BTN.length; else if(c===13) BTN[SEL].fn(); }
  if(OPEN&&D){ save(); render(); } }

/* the only thing that runs while closed: the last 8 keys, arrows only, in a row and within COMBO_MS */
var BUF=[];
addEventListener("keydown",function(e){ var c=e.keyCode;
  if(OPEN){ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); inPanel(e); return; }
  if(c<37||c>40){ BUF.length=0; return; }
  BUF.push([c,Date.now()]); if(BUF.length>COMBO.length) BUF.shift();
  if(BUF.length<COMBO.length||BUF[BUF.length-1][1]-BUF[0][1]>COMBO_MS) return;
  for(var i=0;i<COMBO.length;i++) if(BUF[i][0]!==COMBO[i]) return;
  BUF.length=0; open("combo"); },true);

if(AUTO){ (function wait(n){ if(document.documentElement.getAttribute("data-ready")==="1"||n>50) open("?dev=1&diag=1"); else setTimeout(function(){ wait(n+1); },200); })(0); }
})();
