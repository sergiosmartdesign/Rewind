/* SPDX-FileCopyrightText: 2026 Sergio Ayala
 * SPDX-License-Identifier: GPL-3.0-or-later */
/* P8e v16.9 · TIZEN ADAPTER (v14; v16.7, 2026-10-25; v16.9). ES5, no dependencies.
   Thin layer between the launcher core (p8e.js) and the TV, kept OUT of the core (architecture audit n.º 16, ADR-0005 §4): the core
   stays portable (LG webOS, H6) and only knows the v11 contract
       window.P8EApps.launch(app, onOk, onErr)
   onOk() = the app opened (the TV hides us; the core comes back on visibilitychange, with focus/pageshow as backup) ·
   onErr(e) = it did not open (the core shows «Couldn't open X» for 3 s and goes back to the corridor).

   v16.7 · ATTEMPT PLAN per app (first that does not fail wins; the TV's onError/throw moves to the next attempt):
     app.tries = [{id, ac?, nf?}, …]   explicit order (Netflix). ac = {op, uri, mime, data:[{key,value:[…]}]} → launchAppControl;
                                       without ac → tizen.application.launch(id). nf:true = only tried after a NotFoundError.
     otherwise: app.appControl (if any) → app.appId → app.appAlias (only on NotFound and only if aliasLaunchable === true, v14 C1).
   Why: the Browser opens with an ApplicationControl (operation view + uri) — launch(id) answered «ok» on the TV and showed
   nothing (2026-10-25) —; Netflix RN1MCdNq8t.Netflix by launch(id) opened BLACK, so the roster lists the other forms.
   Caveat (measured on the TV): «ok» from the TV only means the request was accepted, not that a picture appeared. That is
   why every attempt goes to a log that survives the page (localStorage), and why the core has a no-show watchdog.

   v16.7 · LIFE TRAIL (localStorage «p8e.life», last 24): session id + boot / hidden / visible / pagehide / pageshow / blur /
   focus / launch results / reply callbacks. A NEW session id after «pagehide» = the TV terminated Rewind (it did not just
   hide it). The diagnostics panel shows it (row 5). Only event names, app ids and times: no DUID, no model, no list of apps.

   v16.7 · KEYS: the core may ask for keys with P8EApps.wantKeys([...]). «Exit» is NOT registered unless the «exitguard»
   lever is on (Samsung: Exit must leave the app; on the 2017 Smart Remote it is the long press of Back; see README v16.7).
   v16.9: the Sources tape is gone (org.tizen.SMSourceAPP does not open from Rewind, measured 2026-10-26),
   so the core asks for NO key and «Source» belongs to the TV again; the «p8e.srcfail» release logic went with it (an old mark
   left on a TV does nothing; the panel's «Clear saved data» still forgets it).

   v16.7 · LEVERS (localStorage, toggled from the diagnostics panel; the .wgt has no query string):
     p8e.lever.reply     = "1" → launchAppControl carries a reply callback; when it fires after we have been hidden ≥ 1.5 s,
                                 Rewind relaunches itself (experiment: only works if the TV did not terminate Rewind). Default off.
     p8e.lever.exitguard = "1" → «Exit» registered; the core asks for a second press within 2.5 s. Default off.

   Without window.tizen (localhost, the Mac) the adapter does NOT install itself: the core keeps its mock handoff screen.
   Privacy: this file reads nothing from the TV (no DUID, no model, no list of apps). */
(function(){
"use strict";
var T=window.tizen;
if(!T||!T.application||typeof T.application.launch!=="function") return;

var SOURCE_MSG="Source switching not wired yet";
var OP_DEFAULT="http://tizen.org/appcontrol/operation/default";
var LOG_KEY="p8e.apps.log", LIFE_KEY="p8e.life", LEVER="p8e.lever.";
var LOG_N=12, LIFE_N=24, REPLY_MIN_HIDDEN=1500;
var SID=(new Date().getTime()%2176782336).toString(36);          // this page's session id (base 36, ≤ 6 chars)
var STATS={calls:0,retries:0,oks:0,errs:0,keys:{ok:[],fail:[],released:[]},log:load(LOG_KEY),life:load(LIFE_KEY),sid:SID,self:"",replies:0,selfback:[]};
var hiddenAt=0;

function load(k){ try{ var v=JSON.parse(localStorage.getItem(k)||"[]"); return Array.isArray(v)?v:[]; }catch(e){ return []; } }
function store(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
function lever(n){ try{ return localStorage.getItem(LEVER+n)==="1"; }catch(e){ return false; } }
function now(){ return new Date().getTime(); }
function mkErr(msg,name){ var e=new Error(msg); e.name=name||"Error"; return e; }
function ename(e){ return String((e&&e.name)||"error").slice(0,40); }
/* Tizen WebAPIError: name "NotFoundError", legacy code 8 (NOT_FOUND_ERR) */
function notFound(e){ return !!e&&(e.name==="NotFoundError"||e.code===8); }
function life(ev){ STATS.life.push({s:SID,e:String(ev).slice(0,64),t:now()}); if(STATS.life.length>LIFE_N) STATS.life.splice(0,STATS.life.length-LIFE_N); store(LIFE_KEY,STATS.life); }
function note(id,res){ STATS.log.push({id:String(id).slice(0,64),res:String(res).slice(0,40),t:now(),s:SID}); if(STATS.log.length>LOG_N) STATS.log.splice(0,STATS.log.length-LOG_N);
  store(LOG_KEY,STATS.log); life("launch "+id+" → "+res); }
try{ var me=T.application.getCurrentApplication(); STATS.self=String((me&&me.appInfo&&me.appInfo.id)||""); }catch(e){}

/* ---- life trail: installed at load, for the whole session ---- */
life("boot");
document.addEventListener("visibilitychange",function(){ if(document.hidden){ hiddenAt=now(); life("hidden"); } else { hiddenAt=0; life("visible"); } });
addEventListener("pagehide",function(){ life("pagehide"); }); addEventListener("pageshow",function(){ life("pageshow"); });
addEventListener("blur",function(){ life("blur"); }); addEventListener("focus",function(){ life("focus"); });

/* ---- the plan of attempts for one app ---- */
function plan(app){ var out=[], i, t;
  if(app.tries&&app.tries.length){ for(i=0;i<app.tries.length;i++){ t=app.tries[i]; if(t&&(t.id||t.ac)) out.push({id:t.id?String(t.id):"",ac:t.ac||null,nf:t.nf===true}); } return out; }
  var id=String(app.appId||""), alias=String(app.appAlias||"");
  if(app.appControl) out.push({id:String(app.appControl.appId||""),ac:app.appControl,nf:false});
  if(id) out.push({id:id,ac:null,nf:false});
  /* v14 C1: the alias only after a NotFound and only if it launches on its own */
  if(alias&&alias!==id&&app.aliasLaunchable===true) out.push({id:alias,ac:null,nf:true});
  return out; }
function label(t){ return t.ac?("ac:"+(t.id||"*")+(t.ac.uri?" "+t.ac.uri:"")):t.id; }

/* reply callback (lever «reply»): if it fires once we have been hidden ≥ 1.5 s, the launched app is gone → relaunch ourselves */
function replyCb(lb){ function back(kind){ STATS.replies++; life("reply "+kind+" ("+lb+")");
    if(!lever("reply")||!STATS.self||!hiddenAt||now()-hiddenAt<REPLY_MIN_HIDDEN) return;
    try{ T.application.launch(STATS.self,function(){ STATS.selfback.push("ok"); life("selfback ok"); },function(e){ STATS.selfback.push(ename(e)); life("selfback "+ename(e)); }); }
    catch(e){ STATS.selfback.push("throw "+ename(e)); life("selfback throw "+ename(e)); } }
  return {onsuccess:function(){ back("success"); },onfailure:function(){ back("failure"); }}; }

/* one attempt; a synchronous throw (TypeMismatchError, a missing extension…) counts as an error of that attempt */
function attempt(t,ok,bad){ var lb=label(t);
  try{
    if(t.ac){ var AC=T.ApplicationControl, ACD=T.ApplicationControlData, L=T.application.launchAppControl;
      if(typeof AC!=="function"||typeof L!=="function") throw mkErr("launchAppControl unavailable","NotSupportedError");
      var data=[], d=t.ac.data||[], i;
      for(i=0;i<d.length;i++) data.push(new ACD(String(d[i].key),d[i].value||[]));
      var ctl=new AC(t.ac.op||OP_DEFAULT,t.ac.uri||null,t.ac.mime||null,null,data);
      var okf=function(){ note(lb,"ok"); ok(); }, errf=function(e){ note(lb,ename(e)); bad(e); };
      if(lever("reply")) L.call(T.application,ctl,t.id||null,okf,errf,replyCb(lb));
      else L.call(T.application,ctl,t.id||null,okf,errf);
    } else T.application.launch(t.id,function(){ note(lb,"ok"); ok(); },function(e){ note(lb,ename(e)); bad(e); });
  }catch(e){ note(lb,(e&&e.name)?e.name:"throw"); bad(e); } }

function launch(app,onOk,onErr){
  var done=false; STATS.calls++;
  function ok(){ if(done) return; done=true; STATS.oks++; if(typeof onOk==="function") onOk(); }
  function fail(e){ if(done) return; done=true; STATS.errs++; if(typeof onErr==="function") onErr(e); }
  if(!app){ fail(mkErr("No app","TypeMismatchError")); return; }
  if(app.src){ note(app.src,"source"); fail(mkErr(SOURCE_MSG,"NotSupportedError")); return; }
  var P=plan(app);
  if(!P.length){ note(app.nm,"no id"); fail(mkErr("No app id for "+app.nm+" (read it with getAppsInfo() on the TV)","NotFoundError")); return; }
  (function run(k){ attempt(P[k],ok,function(e){
      var nx=P[k+1];
      if(nx&&(!nx.nf||notFound(e))){ STATS.retries++; run(k+1); }
      else fail(e); }); })(0);
}

/* ---- keys ---- */
var D=T.tvinputdevice, WANT=[];
function reg(n){ if(!D||typeof D.registerKey!=="function") return false;
  try{ D.registerKey(n); if(STATS.keys.ok.indexOf(n)<0) STATS.keys.ok.push(n); return true; }catch(e){ STATS.keys.fail.push(n+": "+ename(e)); return false; } }
function unreg(n){ var i=STATS.keys.ok.indexOf(n); if(i>=0) STATS.keys.ok.splice(i,1);
  if(D&&typeof D.unregisterKey==="function"){ try{ D.unregisterKey(n); }catch(e){} } }
/* each name on its own, so one refusal does not hide the rest */
function wantKeys(names){ for(var i=0;i<(names||[]).length;i++){ var n=String(names[i]); if(WANT.indexOf(n)<0) WANT.push(n); reg(n); } }
function setLever(n,on){ try{ if(on) localStorage.setItem(LEVER+n,"1"); else localStorage.removeItem(LEVER+n); }catch(e){}
  if(n==="exitguard"){ if(on) reg("Exit"); else unreg("Exit"); }
  return lever(n); }
if(lever("exitguard")) reg("Exit");

function exitApp(){ life("exit (guarded)"); try{ T.application.getCurrentApplication().exit(); }catch(e){ life("exit "+ename(e)); } }

window.P8EApps={launch:launch,platform:"tizen",wantKeys:wantKeys,exit:exitApp,
  exitGuard:function(){ return lever("exitguard"); },
  lever:function(n,on){ return (on===undefined)?lever(n):setLever(n,!!on); },
  life:function(ev){ life(ev); },   /* v16.11: p8e.js marks «curtain on/off …» in the same trail */
  stats:function(){ return JSON.parse(JSON.stringify(STATS)); }};
})();
