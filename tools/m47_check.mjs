#!/usr/bin/env node
/* SPDX-FileCopyrightText: 2026 Sergio Ayala
 * SPDX-License-Identifier: GPL-3.0-or-later */
/* m47_check.mjs — Chromium M47 (Tizen 3.0 TV web runtime, 2017) emulation harness for the launcher.
   2026-10-23. Node >= 22 (global WebSocket), stdlib only, Chrome headless over CDP.
   Author of the publishable work: Sergio Ayala <mail@sergio-ayala.com>.

   WHAT IT EMULATES (it is an emulation on a modern Chrome, NOT M47; see README «Límites»):
   (a) CSS that M47 does not understand is REMOVED from every stylesheet before the page sees it (CDP
       Fetch.fulfillRequest): custom properties and var() (Chrome 49), unprefixed clip-path (55), font-weight
       ranges in @font-face = variable fonts (62; the variable face is also pinned to its default instance),
       inset (87), gap/row-gap/column-gap (flex 84), aspect-ratio (88), two-position colour stops (71), and a
       few more listed in CSS_RULES. Removing a declaration = what an old engine does with an invalid one:
       the previous declaration of the same property in the rule wins (that is how literal fallbacks work).
   (b) Keys are sent ONLY with keyCode (37-40, 13, 10009, 27): KeyboardEvent.key/.code are hidden (51/48).
   (c) Every script with syntax newer than ES5 (scanner below) is served as a script that does not parse
       (real SyntaxError, nothing in it runs). Up to v11 that was three.min.js r128 (default parameters, Chrome 49); since
       v12 P8e no longer loads it and EVERY script it loads must scan clean (suite scan).
   (d) A token scanner reports syntax newer than ES5 in every script the page loads. LIMIT: it is a token
       scanner with heuristics (regex-vs-division by previous token, brace kinds by context), not a parser.
   Also: APIs newer than M47 that the launcher might touch are removed (NodeList.forEach, Element.append…),
   media features M47 does not know never match (prefers-reduced-motion), WebGL2 returns null,
   addEventListener's options object becomes `true`, focus(options) ignores the options.
   Always: Math.random seeded, rAF/WebGL accounting, no request leaves the machine (non-local requests are
   failed before they are sent + host resolver mapped to NOTFOUND), Chrome muted, hard timeout, own profile.

   USAGE
     node m47_check.mjs [--suite a,b,…] [--rev <git-rev>] [--base URL] [--out DIR] [--shots] [--timeout ms]
       --timeout: hard limit of the whole run, default 1 200 000 ms (v14: the default run measured 496 s on 2026-10-24 and author alone 573 s; it was 600 000)
     node m47_check.mjs --selftest            # scanner fixtures only (no browser)
     node m47_check.mjs --scan FILE…          # scan files on disk (no browser)
   Suites: scan keys gl frames english css glitch fonts launch reduce security tour clean v13 sound adapter diag author hidden meter v162 remote v166 v167 idle3 pyp v169
     v1611: rendimiento fase A — por palanca (relevogap, prefretry, settle2, noreflow, bandsflat, texmax, warpfold) la imagen
     posada ON = OFF (reloj congelado) y lo que promete (registro P8E.v1611(): relevo ≥ 1 fotograma tras el asentado, texturas precargadas, asentado
     en 2 fotogramas, 0 lecturas de layout de la tecla al asentado).
     pyp + v169: pico y placa (festivos 2026/2027, regla, Bogotá UTC−5, lector del texto oficial, enlaces, franja, red
     cortada y respuestas falsas de punta a punta, límites, palancas); sin rail, sin Sources, .cap bajo el cassette sin solapes (reposo, navegación, intro).
     v167 + idle3: ids reales del TV, ApplicationControl y respaldos, plan de Netflix, vuelta («Rewinding…», «WELCOME BACK»),
     rastro p8e.life, cintas del sistema, Source/Exit, vigía noshow, reply-return, ?sys=0; reposo a 3 s con el pre-horneado listo o esperado.
     DEFAULT (no --suite): all of them EXCEPT author (it alone takes ~4 min); author runs with --suite author (or --suite all).
     adapter (alias-launchable + C2): tizen-adapter.js against a simulated `tizen` (cfg.tizen in
     the shim). C1: the NotFound alias retry happens ONLY for aliasLaunchable apps — Netflix/Prime (alias needs
     --app-js) → id only, NotFound → onErr direct, no alias; YouTube (alias is a launchable id) → id NotFound → alias → onOk. Also:
     id OK → onOk, sync throw, HDMI = «Source switching not wired yet», apps without id, the backup return (visibilitychange + focus +
     pageshow together = ONE return; focus without leaving first = none), network codes 4/5, no `tizen` → mock, DUID decoy never read.
     C2: a counter in the shim proves 0 webapis.* calls while document.readyState is "loading" (model/network deferred to DOMContentLoaded).
     diag ($WEBAPIS + <embed> probe): the diagnostics panel (diag.js) under the TV's CSP (taken from
     launcher/config.xml and sent as a header): ?dev=1&diag=1 and the remote sequence ↑↑↓↓←→←→ (keyCode only) open it;
     ?dev=1 alone, ?diag=1 alone, near misses and 200 random keys (seeded) do not; p8e.diag holds the 7 points + fps; the CSP probe loads
     nothing; the $WEBAPIS origin is dumped (document.scripts …webapis.js) and an <embed>/object-src probe runs and leaves the DOM clean.
     sound: sound.js loaded before p8e.js and ES5; P8ESound.play log (performance.now) of a real launch + return
     at ?launchslow=1 and 2 and of the authorship (open/close) against the times of the choreography (±1 frame, 33.4 ms); nav burst
     (10 keys in 1 s: ≤ 3 voices, cost of play(), long tasks vs. muted); mute / reduce / idle / hidden = 0 AudioNodes (own count,
     not sound.js's); only webkitAudioContext; 0 exceptions. The measured logs go to report.json (rep.sound) for the offline mix.
     v13: the reverse return (mirror of the despiece, keys ignored, pose = rest, fallback without onfinish,
     Arte, reduced-motion fade) and the pixel-art authorship (rest exact, 227×110 buffers, ≤384 particles, CoreImage QR decode on the
     1920×1080 capture, 3×3 crispness, ?auup=1 with (webkit)imageSmoothingEnabled=false, ?nobrand=1, reduced-motion by cut).
     v12: gl = the own WebGL1 (gl.js) WORKS in the M47 emulation (dispersal, portal, saver, LRU ≤ 3, no-WebGL
     fallback) · frames = POSED frames (frozen clock: performance.now + rAF timestamps, cfg.clock) of the dispersal, the saver and
     the portal, compared with --against <rev> next to that rev's own noise; knobs ?portalres ?portalsteps ?portaltint ?glscale ·
     english = every state in English, lang=en, nothing overflows or leaves the 1920×1080 canvas (captures P8e-v12-C5-* with --shots).
     frames needs --against (without it, it is skipped with an [INFO]).
   --rev bad911b serves the launcher files tracked at that commit (from git, in memory) instead of the disk:
   the same suites run against the previous version without touching the working tree.
   One line per case: [PASA]/[FALLA] (+ [INFO]); exit 0 only if every case passes. Report: <out>/report.json. */
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/* ======================================================================================================
   1 · ES5 TOKEN SCANNER
   ====================================================================================================== */
const KW_EXPR = new Set(["return", "typeof", "instanceof", "in", "of", "new", "delete", "void", "throw", "case", "do", "else", "yield", "await"]);
const KW_NOT_FN = new Set(["if", "for", "while", "switch", "catch", "with", "function", "return", "typeof", "new", "delete", "void", "throw", "in", "of", "instanceof", "case"]);
const PUNCT = [">>>=", "...", "===", "!==", "**=", "<<=", ">>=", ">>>", "&&=", "||=", "??=", "=>", "==", "!=", "<=", ">=", "&&", "||", "??", "?.", "++", "--", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "**", "<<", ">>"];
const FEATURE_LABEL = {
  LET: "let", CONST: "const", CLASS: "class", ARROW: "=>", TEMPLATE: "template literal", SPREAD_REST: "spread/rest (...)",
  FOR_OF: "for-of", DEFAULT_PARAM: "default parameter", DESTRUCTURING: "destructuring", SHORTHAND_METHOD: "shorthand method",
  SHORTHAND_PROP: "shorthand property", COMPUTED_KEY: "computed key", REGEX_FLAG: "regex flag u/y/s/d", REGEX_GROUP: "regex (?< group/lookbehind",
  NUM_LITERAL: "0b/0o/separator/BigInt literal", EXPONENT: "** operator", OPTIONAL_CHAIN: "?.", NULLISH: "??", ASYNC: "async", GENERATOR: "function*",
  MODULE: "import/export", TRAILING_COMMA_CALL: "trailing comma in call/params", LOGICAL_ASSIGN: "&&= ||= ??=",
};

function tokenize(src) {
  const toks = []; let i = 0, line = 1, lineStart = 0; const n = src.length;
  const braceStack = [];                      // "{" or "tpl" (inside ${ … })
  const last = () => { for (let k = toks.length - 1; k >= 0; k--) return toks[k]; return null; };
  const push = (type, v, start, extra) => { const t = { type, v, line, col: start - lineStart + 1, pos: start }; if (extra) Object.assign(t, extra); toks.push(t); return t; };
  function regexAllowed() { const p = last(); if (!p) return true;
    if (p.type === "punct") return !/^(\)|\]|\}|\+\+|--)$/.test(p.v);
    if (p.type === "name") return KW_EXPR.has(p.v);
    return false; }
  function scanTemplate(start) {            // from after a backtick; returns when the template ends or a ${ opens
    while (i < n) { const c = src[i];
      if (c === "\\") { i += 2; continue; }
      if (c === "\n") { line++; lineStart = i + 1; }
      if (c === "`") { i++; return "end"; }
      if (c === "$" && src[i + 1] === "{") { i += 2; braceStack.push("tpl"); return "expr"; }
      i++; }
    return "eof"; }
  while (i < n) {
    const c = src[i];
    if (c === "\n") { line++; i++; lineStart = i; continue; }
    if (c === " " || c === "\t" || c === "\r" || c === "\f" || c === "\v" || c === "\u00a0" || c === "\ufeff" || c === "\u2028" || c === "\u2029") { i++; continue; }
    if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "/" && src[i + 1] === "*") { const e = src.indexOf("*/", i + 2); const end = e < 0 ? n : e + 2;
      for (let k = i; k < end; k++) if (src[k] === "\n") { line++; lineStart = k + 1; } i = end; continue; }
    if (c === "'" || c === '"') { const s = i; i++; while (i < n && src[i] !== c) { if (src[i] === "\\") i++; else if (src[i] === "\n") break; i++; } i++;
      push("string", src.slice(s, i), s); continue; }
    if (c === "`") { const s = i; i++; push("template", "`", s); if (scanTemplate(s) === "expr") {} continue; }
    if (c === "}" && braceStack.length && braceStack[braceStack.length - 1] === "tpl") { braceStack.pop(); i++; if (scanTemplate(i) === "expr") {} continue; }
    if (c === "/" && regexAllowed()) { const s = i; i++; let inCls = false;
      while (i < n) { const d = src[i]; if (d === "\\") { i += 2; continue; } if (d === "\n") break;
        if (inCls) { if (d === "]") inCls = false; } else if (d === "[") inCls = true; else if (d === "/") break; i++; }
      const body = src.slice(s + 1, i); i++; const fs0 = i; while (i < n && /[a-z]/i.test(src[i])) i++;
      push("regex", src.slice(s, i), s, { body, flags: src.slice(fs0, i) }); continue; }
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] || ""))) { const s = i;
      if (c === "0" && /[xXbBoO]/.test(src[i + 1] || "")) { i += 2; while (i < n && /[0-9a-fA-F_]/.test(src[i])) i++; }
      else { while (i < n && /[0-9_]/.test(src[i])) i++; if (src[i] === ".") { i++; while (i < n && /[0-9_]/.test(src[i])) i++; }
        if (/[eE]/.test(src[i] || "")) { i++; if (/[+-]/.test(src[i])) i++; while (i < n && /[0-9_]/.test(src[i])) i++; } }
      if (src[i] === "n") i++;
      push("num", src.slice(s, i), s); continue; }
    if (/[A-Za-z$_\\]/.test(c) || c.charCodeAt(0) > 127) { const s = i; i++;
      while (i < n && (/[A-Za-z0-9$_\\]/.test(src[i]) || (src.charCodeAt(i) > 127 && !/[\u00a0\u2028\u2029\ufeff]/.test(src[i])))) i++;
      push("name", src.slice(s, i), s); continue; }
    let p = null; for (const q of PUNCT) if (src.startsWith(q, i)) { p = q; break; }
    if (p === "?." && /[0-9]/.test(src[i + 2] || "")) p = null;          // a?.5:1 is a conditional
    if (!p) p = c;
    const t = push("punct", p, i); i += p.length;
    if (p === "{") braceStack.push("{"); else if (p === "}") braceStack.pop();
    void t;
  }
  return toks;
}

function scanES5(src) {
  const toks = tokenize(src), hits = [];
  const hit = (f, t) => hits.push({ f, line: t.line, col: t.col });
  const parenStack = [];   // {open:index, before:tok, before2:tok, isFor:bool}
  const braceKinds = [];   // "obj" | "block" | "fn" | "class"
  const groups = [];       // closed paren groups: {open, close, before, before2}
  const prev = (k) => toks[k - 1] || null;
  const isName = (t, v) => t && t.type === "name" && (v === undefined || t.v === v);
  const isP = (t, v) => t && t.type === "punct" && (v === undefined || t.v === v);
  const lastGroupAt = {};  // close index → group
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k], p = prev(k), nx = toks[k + 1];
    const dotBefore = isP(p, ".") || isP(p, "?.");
    if (t.type === "template") hit("TEMPLATE", t);
    if (t.type === "regex") { if (/[uysdv]/.test(t.flags)) hit("REGEX_FLAG", t); if (/\(\?<[^=!]|\(\?<[=!]/.test(t.body)) hit("REGEX_GROUP", t); }
    if (t.type === "num") { if (/^0[bBoO]/.test(t.v) || /_/.test(t.v) || /n$/.test(t.v)) hit("NUM_LITERAL", t); }
    if (t.type === "name" && !dotBefore) {
      if ((t.v === "let" || t.v === "const") && nx && (nx.type === "name" || isP(nx, "[") || isP(nx, "{")) && !(isP(nx, "[") && t.v === "let" && isP(p, "="))) {
        hit(t.v === "let" ? "LET" : "CONST", t); if (isP(nx, "[") || isP(nx, "{")) hit("DESTRUCTURING", nx); }
      if (t.v === "var" && nx && (isP(nx, "[") || isP(nx, "{"))) hit("DESTRUCTURING", nx);
      if (t.v === "class" && nx && (nx.type === "name" || isP(nx, "{")) && !isP(nx, ":")) hit("CLASS", t);
      if (t.v === "async" && nx && (isName(nx, "function") || (nx.type === "name" && isP(toks[k + 2], "=>")) || (nx.type === "name" && isP(toks[k + 2], "(") && (braceKinds[braceKinds.length - 1] === "obj" || braceKinds[braceKinds.length - 1] === "class")))) hit("ASYNC", t);
      if (t.v === "function" && isP(nx, "*")) hit("GENERATOR", t);
      if ((t.v === "import" || t.v === "export") && (!p || isP(p, ";") || isP(p, "}") || isP(p, "{")) && nx && !isP(nx, "(") && !isP(nx, ".")) hit("MODULE", t);
      if (t.v === "of" && parenStack.length) { const g = parenStack[parenStack.length - 1]; if (g.isFor && g.depth === parenStack.length && (p && (p.type === "name" || isP(p, "]") || isP(p, "}")))) hit("FOR_OF", t); }
    }
    if (t.type === "punct") {
      switch (t.v) {
        case "=>": hit("ARROW", t); break;
        case "...": hit("SPREAD_REST", t); break;
        case "**": case "**=": hit("EXPONENT", t); break;
        case "?.": hit("OPTIONAL_CHAIN", t); break;
        case "??": case "??=": hit("NULLISH", t); break;
        case "&&=": case "||=": hit("LOGICAL_ASSIGN", t); break;
        case ",": if (isP(nx, ")")) hit("TRAILING_COMMA_CALL", t); break;
        case "(": parenStack.push({ open: k, before: p, before2: prev(k - 1), isFor: isName(p, "for") || (isName(p, "await") && isName(prev(k - 1), "for")), depth: parenStack.length + 1 }); break;
        case ")": { const g = parenStack.pop(); if (g) { g.close = k; lastGroupAt[k] = g; groups.push(g); } break; }
        case "{": {
          let kind = "block";
          if (!p) kind = "block";
          else if (isP(p, ")")) { const g = lastGroupAt[k - 1]; kind = g && isParamList(g) ? "fn" : "block"; }
          else if (isP(p, "=>")) kind = "fn";
          else if (p.type === "name" && ["else", "try", "finally", "do"].includes(p.v)) kind = "block";
          else if (p.type === "name" && (isName(prev(k - 1), "class") || isName(prev(k - 1), "extends") || p.v === "class")) kind = "class";
          else if (p.type === "name" && KW_EXPR.has(p.v)) kind = "obj";
          else if (isP(p, ";") || isP(p, "{") || isP(p, "}")) kind = "block";
          else if (isP(p, ":")) kind = braceKinds[braceKinds.length - 1] === "obj" ? "obj" : "block";
          else if (p.type === "punct") kind = "obj";
          else kind = "block";
          braceKinds.push(kind);
          if (kind === "obj") checkObjEntry(k + 1);
          break; }
        case "}": braceKinds.pop(); break;
      }
      if (isP(t, ",") && braceKinds[braceKinds.length - 1] === "obj" && openBraceDepthIsTop(k)) checkObjEntry(k + 1);
    }
  }
  // parameter lists: default values, destructuring
  for (const g of groups) {
    if (!isParamList(g)) continue;
    let depth = 0, atStart = true;
    for (let k = g.open + 1; k < g.close; k++) { const t = toks[k];
      if (isP(t, "(") || isP(t, "[") || isP(t, "{")) { if (depth === 0 && atStart && !isP(t, "(")) hit("DESTRUCTURING", t); depth++; atStart = false; continue; }
      if (isP(t, ")") || isP(t, "]") || isP(t, "}")) { depth--; continue; }
      if (depth === 0 && isP(t, "=")) hit("DEFAULT_PARAM", t);
      atStart = depth === 0 && isP(t, ","); }
  }
  function isParamList(g) {
    const after = toks[g.close + 1], b = g.before, b2 = g.before2;
    if (isP(after, "=>")) return true;
    if (!isP(after, "{")) return false;
    if (isName(b, "function")) return true;
    if (b && b.type === "name" && isName(b2, "function")) return true;
    if (b && b.type === "name" && !KW_NOT_FN.has(b.v) && (isP(b2, ",") || isP(b2, "{") || isP(b2, "}") || isName(b2, "get") || isName(b2, "set") || isName(b2, "static") || isName(b2, "async") || isP(b2, "*") || isP(b2, ";"))) return true;
    return false; }
  function openBraceDepthIsTop(k) {      // the "," belongs to the innermost brace (no open paren/bracket inside it)
    let d = 0; for (let j = k - 1; j >= 0; j--) { const t = toks[j];
      if (isP(t, ")") || isP(t, "]") || isP(t, "}")) d++;
      else if (isP(t, "(") || isP(t, "[")) { if (d === 0) return false; d--; }
      else if (isP(t, "{")) { if (d === 0) return true; d--; } }
    return false; }
  function checkObjEntry(j) {            // the token after "{" or "," inside an object literal
    const a = toks[j], b = toks[j + 1], c = toks[j + 2];
    if (!a) return;
    if (isP(a, "[")) { hit("COMPUTED_KEY", a); return; }
    if (isP(a, "...")) return;           // counted as spread already
    if (isP(a, "*")) { hit("GENERATOR", a); return; }
    if ((a.type === "name" || a.type === "string" || a.type === "num") && isP(b, "(")) { hit("SHORTHAND_METHOD", a); return; }
    if ((isName(a, "get") || isName(a, "set")) && b && (b.type === "name" || b.type === "string" || b.type === "num") && isP(c, "(")) return;   // ES5 accessor
    if (a.type === "name" && (isP(b, ",") || isP(b, "}"))) hit("SHORTHAND_PROP", a);
  }
  return hits;
}
function summarize(hits) { const by = {}; for (const h of hits) { (by[h.f] = by[h.f] || []).push(h.line + ":" + h.col); } return by; }

const SELFTEST = {
  pos: [
    ["LET", "let a = 1;"], ["CONST", "const b = 2;"], ["CLASS", "class A {}"], ["ARROW", "x.map(v => v*2);"], ["ARROW", "f((a,b)=>{});"],
    ["TEMPLATE", "var s = `hi ${a} there`;"], ["SPREAD_REST", "f(...args);"], ["SPREAD_REST", "function g(...r){}"],
    ["FOR_OF", "for (var x of list) {}"], ["FOR_OF", "for (const [k,v] of m) {}"], ["DEFAULT_PARAM", "function f(t, e = 1) {}"],
    ["DEFAULT_PARAM", "var o = {pingpong:function(t,e=1){return t}};"], ["DEFAULT_PARAM", "var o = {set(t, e=0){}};"],
    ["DESTRUCTURING", "var {a, b} = o;"], ["DESTRUCTURING", "function f({a}) {}"], ["SHORTHAND_METHOD", "var o = { foo() { return 1; } };"],
    ["SHORTHAND_PROP", "var o = { a, b: 2 };"], ["COMPUTED_KEY", "var o = { [k]: 1 };"], ["REGEX_FLAG", "var r = /x/u;"],
    ["REGEX_GROUP", "var r = /(?<y>\\d+)/;"], ["NUM_LITERAL", "var n = 0b1010;"], ["NUM_LITERAL", "var n = 1_000;"], ["EXPONENT", "var p = 2 ** 3;"],
    ["OPTIONAL_CHAIN", "var z = a?.b;"], ["NULLISH", "var z = a ?? b;"], ["ASYNC", "async function f(){}"], ["GENERATOR", "function* g(){}"],
    ["MODULE", "import x from 'y';"], ["TRAILING_COMMA_CALL", "f(a, b,);"], ["LOGICAL_ASSIGN", "a ||= b;"],
    ["ARROW", "var s = 'x'; var f = () => `${s}`;"],
  ],
  neg: [
    "var a = obj.let + obj.const + obj.class;", "var o = {class: 1, let: 2, of: 3};", "var of = 1; for (of in x) {}", "var q = a / b / c;",
    "if (a = b) { c(); }", "while (x = y) {}", "var r = /[/]=>/g; var s = \"=>\";", "// const x = 1\n/* let y => */ var z = 1;",
    "var t = a ? .5 : 1;", "var o = { get x() { return 1; }, set x(v) {} };", "function f(a) { return a == 1; }",
    "var x = { a: function (b) { return b; } };", "L: { break L; }", "switch (a) { case 1: { b(); } }", "var d = (a) / 2;",
    "function g() { return /x/g.test(s); }", "f(a, b);", "var arr = [1, 2,]; var ob = {a: 1,};", "var s = 'it\\'s'; var t = \"a\\\"b\";",
    "for (var i = 0; i < n; i++) {}", "x = y ? function(a){} : null;", "var re = /\\/\\*/; var after = 1;", "a.b(c).d(function(e){ return e > 1; });",
    "var o = {}; o.async = 1; o.get = 2;", "var x = typeof /re/ === 'object';",
  ],
};
function selftest() {
  let fail = 0;
  for (const [f, s] of SELFTEST.pos) { const got = scanES5(s).map((h) => h.f); const ok = got.includes(f);
    console.log(`${ok ? "[PASA]" : "[FALLA]"} escáner detecta ${f} · ${JSON.stringify(s)} · obtenido ${JSON.stringify(got)}`); if (!ok) fail++; }
  for (const s of SELFTEST.neg) { const got = scanES5(s).map((h) => h.f); const ok = got.length === 0;
    console.log(`${ok ? "[PASA]" : "[FALLA]"} escáner NO marca ES5 válido · ${JSON.stringify(s)} · obtenido ${JSON.stringify(got)}`); if (!ok) fail++; }
  const total = SELFTEST.pos.length + SELFTEST.neg.length;
  console.log(`TOTAL selftest: ${total - fail}/${total} pasan`);
  return fail === 0;
}

/* ======================================================================================================
   2 · CSS → «what M47 keeps»
   ====================================================================================================== */
const CSS_RULES = [
  [(p) => p.startsWith("--"), "custom property (Chrome 49)"],
  [(p, v) => /\bvar\(/.test(v), "var() (Chrome 49)"],
  [(p) => p === "clip-path", "clip-path sin prefijo (Chrome 55)"],
  [(p) => /^inset(-block|-inline)?(-start|-end)?$/.test(p), "inset (Chrome 87)"],
  [(p) => p === "gap" || p === "row-gap" || p === "column-gap", "gap (flex: Chrome 84)"],
  [(p) => p === "aspect-ratio", "aspect-ratio (Chrome 88)"],
  [(p) => p === "translate" || p === "rotate" || p === "scale", "transform individual (Chrome 104)"],
  [(p) => p === "font-variation-settings" || p === "font-optical-sizing", "font variations (Chrome 62)"],
  [(p) => p === "font-variant-numeric", "font-variant-numeric (Chrome 52)"],
  [(p) => /^place-(items|content|self)$/.test(p), "place-* (Chrome 59)"],
  [(p) => p === "contain" || p === "content-visibility", "contain (Chrome 52/85)"],
  [(p) => p === "backdrop-filter", "backdrop-filter (Chrome 76)"],
  [(p) => /^overscroll-behavior/.test(p) || p === "scroll-behavior", "overscroll/scroll-behavior (Chrome 61/63)"],
  [(p) => p === "caret-color" || p === "accent-color" || /^text-(underline-offset|decoration-thickness)$/.test(p), "caret/accent/decoration (57+)"],
  [(p, v) => p === "display" && /\b(contents|flow-root|grid|inline-grid)\b/.test(v), "display contents/flow-root/grid (57+)"],
  [(p, v) => p === "position" && /\bsticky\b/.test(v), "position:sticky (Chrome 56)"],
  [(p, v) => /\b(min|max|clamp)\(/.test(v) && !/^(min|max)-/.test(p) || /\benv\(/.test(v), "min()/max()/clamp()/env() (Chrome 79/69)"],
  [(p, v) => /#([0-9a-f]{4}|[0-9a-f]{8})\b/i.test(v), "#rgba hex (Chrome 62)"],
  [(p, v) => /\b(rgba?|hsla?)\(\s*[-\d.]+%?\s+[-\d.]/.test(v), "rgb() sin comas (Chrome 65)"],
  [(p, v) => /conic-gradient\(/.test(v), "conic-gradient (Chrome 69)"],
  [(p, v) => /steps\([^)]*jump-/.test(v), "steps(jump-*) (Chrome 77)"],
  [(p, v) => hasDoubleStop(v), "doble posición en una parada de degradado (Chrome 71)"],
];
const FONT_FACE_RULES = [
  [(p, v) => (p === "font-weight" || p === "font-stretch") && v.trim().split(/\s+/).length > 1, "rango de pesos en @font-face = fuente variable (Chrome 62)"],
  [(p) => p === "font-display", "font-display (Chrome 60)"],
];
const SELECTOR_DROP = [[/:(is|where|has)\(/, ":is/:where/:has"], [/:focus-(visible|within)/, ":focus-visible/within (60+)"], [/:not\([^)]*[,\s>+~][^)]*\)/, ":not() complejo (Chrome 88)"]];
const MEDIA_UNKNOWN = /prefers-|dynamic-range|forced-colors|inverted-colors|scripting|overflow-(block|inline)|any-(hover|pointer)/;
function splitTop(s, sep) { const out = []; let d = 0, q = null, cur = "";
  for (const c of s) { if (q) { cur += c; if (c === q) q = null; continue; } if (c === "'" || c === '"') { q = c; cur += c; continue; }
    if (c === "(") d++; else if (c === ")") d--; if (d === 0 && c === sep) { out.push(cur); cur = ""; } else cur += c; }
  out.push(cur); return out; }
function hasDoubleStop(v) {
  const re = /(repeating-)?(linear|radial)-gradient\(/g; let m;
  while ((m = re.exec(v))) { let d = 1, j = m.index + m[0].length; const s0 = j; for (; j < v.length && d; j++) { if (v[j] === "(") d++; else if (v[j] === ")") d--; }
    const args = splitTop(v.slice(s0, j - 1), ",");
    for (const a of args) { const parts = splitTop(a.trim(), " ").filter(Boolean); const lens = parts.filter((x) => /^-?[\d.]+(%|px|em|rem|vh|vw|vmin|vmax|deg|turn)?$/.test(x));
      const hasColor = parts.some((x) => /^(#|rgb|hsl|transparent|currentColor|[a-z]+$)/i.test(x) && !/^(to|at|circle|ellipse|closest|farthest|left|right|top|bottom|center)/.test(x));
      if (hasColor && lens.length >= 2) return true; } }
  return false; }
function parseBlocks(css) {        // → [{pre, body}|{decls}] at one level
  const out = []; let i = 0, n = css.length;
  while (i < n) { while (i < n && /\s/.test(css[i])) i++; if (i >= n) break;
    let j = i, q = null; for (; j < n; j++) { const c = css[j]; if (q) { if (c === q) q = null; continue; } if (c === "'" || c === '"') { q = c; continue; } if (c === "{" || c === ";") break; }
    if (j >= n) break;
    if (css[j] === ";") { out.push({ stmt: css.slice(i, j + 1) }); i = j + 1; continue; }
    const pre = css.slice(i, j).trim(); let d = 1, k = j + 1; q = null;
    for (; k < n && d; k++) { const c = css[k]; if (q) { if (c === q) q = null; continue; } if (c === "'" || c === '"') { q = c; continue; } if (c === "{") d++; else if (c === "}") d--; }
    out.push({ pre, body: css.slice(j + 1, k - 1) }); i = k; }
  return out; }
function filterDecls(body, rules, log, where) {
  const decls = splitTop(body, ";"), keep = [];
  for (const d of decls) { const t = d.trim(); if (!t) continue; const c = t.indexOf(":"); if (c < 0) { keep.push(t); continue; }
    const p = t.slice(0, c).trim().toLowerCase(), v = t.slice(c + 1);
    const r = rules.find(([f]) => f(p, v)); if (r) { log.push({ where, decl: t.slice(0, 160), why: r[1] }); continue; } keep.push(t); }
  return keep.join(";"); }
function m47css(css, opts = {}) {
  const log = [];
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  function walk(src, ctx) { return parseBlocks(src).map((b) => {
    if (b.stmt) return b.stmt;
    const pre = b.pre;
    if (/^@media/i.test(pre)) { if (MEDIA_UNKNOWN.test(pre)) { log.push({ where: pre, decl: "(bloque entero)", why: "media feature desconocida en M47 → no se aplica" }); return ""; } return pre + "{" + walk(b.body, "media") + "}"; }
    if (/^@supports/i.test(pre)) return pre + "{" + walk(b.body, "supports") + "}";
    if (/^@(-webkit-)?keyframes/i.test(pre)) return pre + "{" + parseBlocks(b.body).map((k) => k.stmt ? k.stmt : k.pre + "{" + filterDecls(k.body, CSS_RULES, log, pre + " " + k.pre) + "}").join("") + "}";
    if (/^@font-face/i.test(pre)) { let body = filterDecls(b.body, FONT_FACE_RULES.concat(CSS_RULES), log, "@font-face");
      const fam = /font-family\s*:\s*([^;]+)/i.exec(body); if (fam && /var/i.test(b.body.match(/src\s*:[^;]*/i)?.[0] || "")) opts.varFamilies && opts.varFamilies.add(fam[1].trim().replace(/["']/g, ""));
      return pre + "{" + body + "}"; }
    if (/^@/.test(pre)) return pre + "{" + b.body + "}";
    const sels = splitTop(pre, ",").map((s) => s.trim()), keepSel = sels.filter((s) => { const r = SELECTOR_DROP.find(([re]) => re.test(s)); if (r) log.push({ where: s, decl: "(selector)", why: r[1] }); return !r; });
    if (!keepSel.length) return "";
    if (keepSel.length < sels.length) { log.push({ where: pre, decl: "(regla entera)", why: "una lista de selectores con uno inválido invalida la regla" }); return ""; }
    return pre + "{" + filterDecls(b.body, CSS_RULES, log, pre) + "}"; }).join("\n"); }
  let out = walk(css, "top");
  if (opts.pinVariable) out += `\n/* m47_check: sin variaciones en M47 → la fuente variable se queda en su instancia por defecto */\n*{font-variation-settings:${opts.pinVariable}!important}`;
  return { css: out, log };
}

/* ======================================================================================================
   3 · PNG (decode + diff) — stdlib only
   ====================================================================================================== */
function pngDecode(buf) {
  let p = 8, w = 0, h = 0, ct = 0, bd = 0; const idat = [];
  while (p < buf.length) { const len = buf.readUInt32BE(p), type = buf.toString("ascii", p + 4, p + 8), data = buf.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bd = data[8]; ct = data[9]; if (data[12]) throw new Error("PNG entrelazado no soportado"); }
    else if (type === "IDAT") idat.push(data); else if (type === "IEND") break; p += 12 + len; }
  if (bd !== 8 || (ct !== 6 && ct !== 2)) throw new Error("PNG no soportado: bitDepth " + bd + " colorType " + ct);
  const bpp = ct === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, out = Buffer.alloc(w * h * 4); let prev = Buffer.alloc(stride), cur;
  for (let y = 0; y < h; y++) { const f = raw[y * (stride + 1)]; cur = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let x = 0; x < stride; x++) { const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0; let v = cur[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1; else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
      cur[x] = v & 255; }
    for (let x = 0; x < w; x++) { out[(y * w + x) * 4] = cur[x * bpp]; out[(y * w + x) * 4 + 1] = cur[x * bpp + 1]; out[(y * w + x) * 4 + 2] = cur[x * bpp + 2]; out[(y * w + x) * 4 + 3] = bpp === 4 ? cur[x * bpp + 3] : 255; }
    prev = cur; }
  return { w, h, px: out };
}
function pngDiff(a, b, thr = 24, cell = 60, mask = []) {
  const A = pngDecode(a), B = pngDecode(b); if (A.w !== B.w || A.h !== B.h) return { error: "tamaños distintos" };
  let n = 0; const cells = {};
  for (let y = 0; y < A.h; y++) for (let x = 0; x < A.w; x++) { const i = (y * A.w + x) * 4;
    if (mask.some((r) => x >= r[0] && y >= r[1] && x < r[2] && y < r[3])) continue;
    const d = Math.max(Math.abs(A.px[i] - B.px[i]), Math.abs(A.px[i + 1] - B.px[i + 1]), Math.abs(A.px[i + 2] - B.px[i + 2]));
    if (d > thr) { n++; const k = ((x / cell) | 0) + "," + ((y / cell) | 0); cells[k] = (cells[k] || 0) + 1; } }
  const hot = Object.keys(cells).filter((k) => cells[k] > cell * cell * 0.02);
  let box = null; for (const k of hot) { const [cx, cy] = k.split(",").map(Number); const r = [cx * cell, cy * cell, cx * cell + cell, cy * cell + cell];
    box = box ? [Math.min(box[0], r[0]), Math.min(box[1], r[1]), Math.max(box[2], r[2]), Math.max(box[3], r[3])] : r; }
  return { ratio: +(n / (A.w * A.h)).toFixed(5), pixels: n, hotCells: hot.length, box };
}

/* ======================================================================================================
   4 · CHROME + CDP
   ====================================================================================================== */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function httpGet(url) { return new Promise((res, rej) => { const r = http.get(url, (s) => { const ch = []; s.on("data", (d) => ch.push(d)); s.on("end", () => res({ status: s.statusCode, headers: s.headers, body: Buffer.concat(ch) })); }); r.on("error", rej); r.setTimeout(8000, () => r.destroy(new Error("timeout " + url))); }); }
const CTYPE = { ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".mjs": "application/javascript", ".css": "text/css; charset=utf-8", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".jsonl": "application/json" };

function shimSource(cfg) {
  return `(function(cfg){ "use strict";
  var H=window.__m47={errors:[],rafMax:0,rafPending:0,glContexts:0,glTypes:[],removed:[],onfinishBlocked:0,cfg:cfg};
  if(cfg.seed){ var s=cfg.seed>>>0; Math.random=function(){ s=(s+0x6D2B79F5)>>>0; var t=s; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
  addEventListener("error",function(e){ if(!(e instanceof ErrorEvent)) return; H.errors.push({msg:String(e.message||e.type), src:String(e.filename||(e.target&&e.target.src)||""), line:e.lineno||0}); },true);
  addEventListener("unhandledrejection",function(e){ H.errors.push({msg:"unhandledrejection: "+String(e.reason&&e.reason.message||e.reason)}); });
  /* v12 · RELOJ POSABLE (cfg.clock): __m47.clk.frozen = ms → performance.now() y la marca de tiempo de cada rAF dan ese valor
     (el Ticker y el dispersal miden con los dos); null = reloj real. Las animaciones WAAPI/CSS no dependen de él (se posan aparte). */
  var pn=performance.now.bind(performance); H.clk={frozen:null,t0:0};
  if(cfg.clock) performance.now=function(){ return H.clk.frozen!=null?H.clk.frozen:pn(); };
  /* v12 · PERFIL GL (cfg.glprof): cada drawArrays de WebGL se cuenta (modo, vértices, tamaño del framebuffer) */
  H.gl={draws:0,points:0,quads:0,lastFb:null,fb:{}};
  if(cfg.glprof&&window.WebGLRenderingContext){ var da=WebGLRenderingContext.prototype.drawArrays;
    WebGLRenderingContext.prototype.drawArrays=function(m,f,c){ var w=this.drawingBufferWidth, h=this.drawingBufferHeight, k=w+"x"+h; H.gl.draws++;
      if(m===this.POINTS) H.gl.points+=c; else H.gl.quads++; H.gl.lastFb=[w,h]; H.gl.fb[k]=(H.gl.fb[k]||0)+1; return da.apply(this,arguments); }; }
  var raf=window.requestAnimationFrame.bind(window), caf=window.cancelAnimationFrame.bind(window), pend={};
  window.requestAnimationFrame=function(cb){ var id=raf(function(t){ if(pend[id]){ delete pend[id]; H.rafPending--; } cb(H.clk.frozen!=null?H.clk.frozen:t); }); pend[id]=1; H.rafPending++; if(H.rafPending>H.rafMax) H.rafMax=H.rafPending; return id; };
  window.cancelAnimationFrame=function(id){ if(pend[id]){ delete pend[id]; H.rafPending--; } return caf(id); };
  var gc=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type){ if(cfg.m47&&type==="webgl2") return null;
    var c=gc.apply(this,arguments); if(c&&/webgl/.test(String(type))&&!this.__m47gl){ this.__m47gl=1; H.glContexts++; H.glTypes.push(type); } return c; };
  H.getAnims=Element.prototype.getAnimations; H.docAnims=Document.prototype.getAnimations;
  if(cfg.dropLogo){ var L; Object.defineProperty(window,"LOGOS",{configurable:true,get:function(){ return L; },set:function(v){ if(v) delete v[cfg.dropLogo]; L=v; }}); }
  if(cfg.noOnfinish&&window.Animation){ Object.defineProperty(Animation.prototype,"onfinish",{configurable:true,get:function(){ return null; },set:function(){ H.onfinishBlocked++; }}); }
  if(cfg.store){ try{ Object.keys(cfg.store).forEach(function(k){ if(cfg.store[k]===null) localStorage.removeItem(k); else localStorage.setItem(k,cfg.store[k]); }); }catch(e){} }
  /* v15.2: aislamiento de pruebas. Las claves de estado del arranque (p8e.lastApp = última app usada,
     p8e.reduce = movimiento reducido) persisten de verdad entre cargas del mismo perfil; en el arnés eso haría que una
     prueba arrastre el arranque de la siguiente (p.ej. C5 pone p8e.reduce=1 y contaminaba C6/C7/C8, que esperan movimiento
     pleno). Se limpian en cada documento SALVO que la prueba las fije explícitamente en store. (En el TV real no hay arnés:
     la persistencia es real.) Toda prueba que quiere reduce lo pone explícito ("p8e.reduce":"1"); las que lo quieren fuera ya
     ponían null — este barrido las hace correctas-por-construcción sin depender de recordarlo. */
  try{ ["p8e.lastApp","p8e.reduce","p8e.away","p8e.life","p8e.apps.log","p8e.srcfail","p8e.lever.reply","p8e.lever.exitguard","p8e.pyp","p8e.lever.pypnet"].forEach(function(k){ if(!(cfg.store && Object.prototype.hasOwnProperty.call(cfg.store,k))) localStorage.removeItem(k); }); }catch(e){}
  /* sound · cfg.snd: log of every P8ESound.play (performance.now, opts, result, cost) and an
     accounting of the AudioNodes of the LIVE context that does not trust sound.js: created by any create*() of the context,
     alive until their disconnect(). Offline renders are counted apart. cfg.noAC: no AudioContext / OfflineAudioContext,
     only webkitAudioContext (what an engine without the unprefixed name would expose). */
  if(cfg.snd){ var SN=H.snd={log:[],keys:[],made:0,offline:0,maxLive:0,set:new Set()};
    var OACR=window.OfflineAudioContext||window.webkitOfflineAudioContext, BAC=window.BaseAudioContext||window.AudioContext||window.webkitAudioContext;
    if(BAC){ var BP=BAC.prototype; Object.getOwnPropertyNames(BP).forEach(function(n){ if(!/^create/.test(n)||n==="createBuffer"||n==="createPeriodicWave") return;
      var d=Object.getOwnPropertyDescriptor(BP,n); if(!d||typeof d.value!=="function") return; var f=d.value;
      BP[n]=function(){ var x=f.apply(this,arguments); if(OACR&&this instanceof OACR){ SN.offline++; return x; }
        SN.made++; SN.set.add(x); if(SN.set.size>SN.maxLive) SN.maxLive=SN.set.size; return x; }; }); }
    var ANP=window.AudioNode&&AudioNode.prototype, adc=ANP&&ANP.disconnect;
    if(adc) ANP.disconnect=function(){ SN.set.delete(this); return adc.apply(this,arguments); };
    addEventListener("keydown",function(e){ SN.keys.push([e.keyCode,Math.round(performance.now()*10)/10]); },true);
    SN.anims=[]; var ean=Element.prototype.animate;     // the motion's own clock: Animation.startTime (document timeline = performance.now)
    if(ean) Element.prototype.animate=function(kf,o){ var a=ean.apply(this,arguments), x={at:performance.now(),st:null};
      if(SN.anims.length<6000){ SN.anims.push(x); setTimeout(function(){ x.st=a.startTime; },60); } return a; };   // read while alive: cancel() clears it
    SN.anim0=function(since){ for(var i=0;i<SN.anims.length;i++){ var x=SN.anims[i]; if(x.at>=since&&x.st!=null) return Math.round(x.st*10)/10; } return null; };
    var SPV; Object.defineProperty(window,"P8ESound",{configurable:true,get:function(){ return SPV; },set:function(v){ SPV=v;
      if(v&&typeof v.play==="function"){ var pl=v.play; v.play=function(ev,o){ var t=performance.now(), r=pl.apply(this,arguments), t2=performance.now();
        SN.log.push({ev:ev,t:Math.round(t*10)/10,ms:Math.round((t2-t)*100)/100,o:JSON.parse(JSON.stringify(o||{})),r:r,live:SN.set.size}); return r; }; } }}); }
  /* v14 · every securitypolicyviolation of the page (the diag suite serves the TV's CSP as a header) */
  H.csp=[]; try{ document.addEventListener("securitypolicyviolation",function(e){ H.csp.push({uri:String(e.blockedURI||""),dir:String(e.violatedDirective||e.effectiveDirective||"")}); },true); }catch(e){}
  /* v14 · cfg.tizen: a SIMULATED Tizen 3.0 TV (window.tizen + window.webapis) with the names and constants of the firmware.
     launch(id): ok if id ∈ cfg.tizen.ok, else NotFoundError (code 8) after ms; ids in throwIds
     throw TypeMismatchError synchronously. getDuid/getModelCode and network getMac/getIp/getGateway/getDns/getSubnetMask
     are DECOYS: every call is counted in __m47.tizen.duid (must stay 0). */
  /* v16.7 · launchAppControl(ctl, id, ok, err[, reply]) + tizen.ApplicationControl(Data): the call is logged in
     TZ.acs as {op, uri, mime, id, data, reply}; it opens if "ac:"+(id||"*") ∈ cfg.tizen.ok (else NotFoundError; noAC = the API is
     missing, as in an old WRT). TZ.launches also gets "ac:<id>" so the ORDER of all attempts is one list. getCurrentApplication():
     appInfo.id = RewindSA01.Rewind, exit() counted in TZ.exits. reply callbacks are kept in TZ.replies (fired by the suite). */
  if(cfg.tizen){ var tc=cfg.tizen, TZ=H.tizen={launches:[],acs:[],reg:[],unreg:[],duid:0,apps:0,cbs:0,netRemoved:0,gw:true,exits:0,replyCbs:0};
    var cbs=[], rcbs=[], werr=function(n){ var e=new Error(n+" (shim)"); e.name=n; e.code=n==="NotFoundError"?8:17; return e; };
    window.tizen={application:{
        launch:function(id,ok,err){ id=String(id); TZ.launches.push(id); if((tc.throwIds||[]).indexOf(id)>=0) throw werr("TypeMismatchError");
          setTimeout(function(){ if((tc.ok||[]).indexOf(id)>=0){ if(ok) ok(); } else if(err) err(werr("NotFoundError")); },tc.ms||60); },
        getAppsInfo:function(ok){ TZ.apps++; setTimeout(function(){ ok([{id:"11101200001",name:"Netflix"},{id:"111299001912",name:"YouTube"},{id:"3201512006785",name:"Prime Video"},{id:"shim.disneyplus",name:"Disney+"}]); },30); },
        getCurrentApplication:function(){ return {appInfo:{version:"1.0.0",id:"RewindSA01.Rewind"},exit:function(){ TZ.exits++; }}; } },
      tvinputdevice:{registerKey:function(n){ TZ.reg.push(String(n)); },unregisterKey:function(n){ TZ.unreg.push(String(n)); },
        getSupportedKeys:function(){ return [{name:"ColorF0Red",code:403},{name:"ColorF1Green",code:404},{name:"ColorF2Yellow",code:405},{name:"ColorF3Blue",code:406},{name:"Exit",code:10182},{name:"Source",code:10072}]; } } };
    window.webapis={productinfo:{getRealModel:function(){ return "UN55MU6100"; },getModel:function(){ return "UMU6100"; },
        getDuid:function(){ TZ.duid++; return "SHIMDUIDCANARY0000"; },getModelCode:function(){ TZ.duid++; return "SHIMCODECANARY"; } },
      /* (network decoys, security review B3: network.public also opens getMac/getIp/getGateway/getDns/getSubnetMask) */
      network:{NetworkState:{LAN_CABLE_ATTACHED:1,LAN_CABLE_DETACHED:2,LAN_CABLE_STATE_UNKNOWN:3,GATEWAY_CONNECTED:4,GATEWAY_DISCONNECTED:5,WIFI_MODULE_STATE_ATTACHED:6,WIFI_MODULE_STATE_DETACHED:7,WIFI_MODULE_STATE_UNKNOWN:8},
        isConnectedToGateway:function(){ return TZ.gw; },
        getMac:function(){ TZ.duid++; return "SHIMMACCANARY"; },getIp:function(){ TZ.duid++; return "SHIMIPCANARY"; },getGateway:function(){ TZ.duid++; return "SHIMGWCANARY"; },
        getDns:function(){ TZ.duid++; return "SHIMDNSCANARY"; },getSubnetMask:function(){ TZ.duid++; return "SHIMMASKCANARY"; },
        addNetworkStateChangeListener:function(cb){ cbs.push(cb); TZ.cbs=cbs.filter(Boolean).length; return cbs.length; },
        removeNetworkStateChangeListener:function(id){ TZ.netRemoved++; cbs[id-1]=null; TZ.cbs=cbs.filter(Boolean).length; } } };
    /* v14 · C2: cuenta cada llamada a webapis.* y cuántas ocurren con document.readyState "loading"
       (antes de DOMContentLoaded). webapis.js crea un <embed> en document.body la 1.ª vez que se usa cada namespace
       (W1), así que llamarlo antes de que exista el body falla. wapi.loading debe quedar en 0. */
    TZ.wapi={calls:0,loading:0,first:null};
    (function(){ var nss=["productinfo","network"]; for(var a=0;a<nss.length;a++){ var o=window.webapis[nss[a]]; if(!o) continue;
      for(var k in o){ if(Object.prototype.hasOwnProperty.call(o,k)&&typeof o[k]==="function"){
        (function(ns,name,orig){ o[name]=function(){ TZ.wapi.calls++;
          if(document.readyState==="loading"){ TZ.wapi.loading++; if(!TZ.wapi.first) TZ.wapi.first={ns:ns,fn:name}; } return orig.apply(this,arguments); }; })(nss[a],k,o[k]); } } } })();
    if(!tc.noAC){ window.tizen.ApplicationControlData=function(k,v){ this.key=k; this.value=v; };
      window.tizen.ApplicationControl=function(op,uri,mime,cat,data){ this.operation=op; this.uri=uri; this.mime=mime; this.category=cat; this.data=data||[]; };
      window.tizen.application.launchAppControl=function(ctl,id,ok,err,reply){ var key="ac:"+(id||"*");
        TZ.launches.push(key); TZ.acs.push({op:ctl&&ctl.operation,uri:ctl&&ctl.uri,mime:ctl&&ctl.mime,id:id,data:(ctl&&ctl.data||[]).map(function(d){ return [d.key,d.value]; }),reply:!!reply});
        if(reply){ rcbs.push(reply); TZ.replyCbs=rcbs.length; }
        setTimeout(function(){ if((tc.ok||[]).indexOf(key)>=0){ if(ok) ok(); } else if(err) err(werr("NotFoundError")); },tc.ms||60); }; }
    TZ.reply=function(kind){ rcbs.forEach(function(r){ if(r&&r[kind]) r[kind](); }); return rcbs.length; };
    TZ.fire=function(code){ if(code===4) TZ.gw=true; else if(code===5) TZ.gw=false; cbs.forEach(function(f){ if(f) f(code); }); }; }
  if(cfg.noAC&&window.AudioContext){ var _AC=window.AudioContext, _OAC=window.OfflineAudioContext;
    try{ delete window.AudioContext; delete window.OfflineAudioContext; }catch(e){}
    window.webkitAudioContext=_AC; window.webkitOfflineAudioContext=_OAC; H.removed.push("AudioContext → sólo webkitAudioContext"); }
  if(!cfg.m47) return;
  ["key","code"].forEach(function(p){ try{ Object.defineProperty(KeyboardEvent.prototype,p,{configurable:true,get:function(){ return undefined; }}); }catch(e){} });
  var mm=window.matchMedia;
  window.matchMedia=function(q){ if(${MEDIA_UNKNOWN}.test(String(q))) return {matches:false,media:"not all",addListener:function(){},removeListener:function(){},onchange:null}; return mm.call(window,q); };
  function gone(o,p,label){ try{ if(o&&(p in o)){ delete o[p]; if(p in o) Object.defineProperty(o,p,{configurable:true,writable:true,value:undefined}); H.removed.push(label); } }catch(e){} }
  gone(NodeList.prototype,"forEach","NodeList.forEach (51)"); ["append","prepend","before","after","replaceWith","toggleAttribute","getAnimations"].forEach(function(p){ gone(Element.prototype,p,"Element."+p); });
  gone(Document.prototype,"getAnimations","document.getAnimations (84)"); gone(String.prototype,"padStart","padStart (57)"); gone(String.prototype,"padEnd","padEnd (57)");
  gone(String.prototype,"replaceAll","replaceAll"); gone(String.prototype,"matchAll","matchAll"); gone(Object,"values","Object.values (54)"); gone(Object,"entries","Object.entries (54)");
  gone(Object,"fromEntries","Object.fromEntries"); gone(Promise.prototype,"finally","Promise.finally (63)"); gone(Promise,"allSettled","allSettled"); gone(Promise,"any","Promise.any");
  gone(Array.prototype,"flat","flat"); gone(Array.prototype,"flatMap","flatMap"); gone(Array.prototype,"at","at"); gone(DOMTokenList.prototype,"replace","classList.replace (61)");
  gone(HTMLImageElement.prototype,"decode","img.decode (64)"); gone(HTMLCanvasElement.prototype,"toBlob","toBlob (50)"); gone(CanvasRenderingContext2D.prototype,"filter","ctx.filter (52)");
  ["URLSearchParams","IntersectionObserver","ResizeObserver","DOMMatrix","OffscreenCanvas","createImageBitmap","queueMicrotask","structuredClone","requestIdleCallback"].forEach(function(p){ if(p!=="requestIdleCallback") gone(window,p,p); });
  if(window.Animation){ gone(Animation.prototype,"finished","Animation.finished"); gone(Animation.prototype,"ready","Animation.ready"); gone(Animation.prototype,"commitStyles","commitStyles"); gone(Animation.prototype,"persist","persist"); }
  var ael=EventTarget.prototype.addEventListener, rel=EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener=function(t,f,o){ return ael.call(this,t,f,(o&&typeof o==="object")?true:o); };
  EventTarget.prototype.removeEventListener=function(t,f,o){ return rel.call(this,t,f,(o&&typeof o==="object")?true:o); };
  var fo=HTMLElement.prototype.focus; HTMLElement.prototype.focus=function(){ return fo.call(this); };
  var sp=CSSStyleDeclaration.prototype.setProperty; CSSStyleDeclaration.prototype.setProperty=function(p,v){ if(/^--|^clip-path$/.test(String(p))||/var\\(/.test(String(v))) return; return sp.apply(this,arguments); };
  try{ Object.defineProperty(CSSStyleDeclaration.prototype,"clipPath",{configurable:true,get:function(){ return ""; },set:function(){}}); }catch(e){}
})(${JSON.stringify(cfg)});`;
}

class Browser {
  constructor(o) { this.o = o; this.pend = {}; this.id = 0; this.on = {}; this.ext = []; this.errors = []; this.console = []; this.scripts = {}; this.scan = {}; this.cssLog = {}; this.blocked = []; this.reqHeaders = []; this.urls = []; }
  async start() {
    const o = this.o; this.prof = fs.mkdtempSync(path.join(os.tmpdir(), "m47prof-"));
    const args = ["--headless=new", "--mute-audio", "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--hide-scrollbars", "--disable-background-networking",
      "--disable-component-update", "--disable-sync", "--disable-default-apps", "--metrics-recording-only", "--disable-domain-reliability", "--no-pings",
      "--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1 , EXCLUDE localhost", `--user-data-dir=${this.prof}`, "--remote-debugging-port=0",
      "--window-size=1920,1080", "about:blank"];
    if (process.env.P8E_NO_SANDBOX === "1") args.unshift("--no-sandbox");   // entornos ya enjaulados (CI, contenedores)
    this.proc = spawn(o.chrome, args, { stdio: "ignore", detached: true });
    let port = 0; for (let i = 0; i < 80 && !port; i++) { await sleep(150); try { port = +fs.readFileSync(path.join(this.prof, "DevToolsActivePort"), "utf8").split("\n")[0]; } catch (e) {} }
    if (!port) throw new Error("Chrome no abrió el puerto de depuración");
    let list = []; for (let i = 0; i < 40; i++) { try { list = JSON.parse((await httpGet(`http://127.0.0.1:${port}/json/list`)).body); if (list.find((t) => t.type === "page")) break; } catch (e) {} await sleep(150); }
    const page = list.find((t) => t.type === "page"); this.pageId = page.id;
    this.ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise((r, j) => { this.ws.onopen = r; this.ws.onerror = j; });
    this.ws.onmessage = (m) => this.msg(JSON.parse(m.data));
    await this.send("Page.enable"); await this.send("Runtime.enable"); await this.send("Network.enable"); await this.send("Log.enable");
    await this.send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
    await this.send("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
    /* Chrome puede abrir solo una pestaña propia (se vio chrome://settings/help a mitad de una pasada): la nuestra pasa a
       oculta, rAF se para y todo lo animado da falsos fallos. Se cierra cualquier otra página y la nuestra vuelve al frente. */
    this.on["Target.targetCreated"] = [(p) => { const t = p.targetInfo; if (t.type === "page" && t.targetId !== this.pageId) { this.closed = (this.closed || 0) + 1;
      this.send("Target.closeTarget", { targetId: t.targetId }).catch(() => {}).then(() => this.send("Page.bringToFront").catch(() => {})); } }];
    await this.send("Target.setDiscoverTargets", { discover: true });
  }
  msg(d) {
    if (d.id && this.pend[d.id]) { const p = this.pend[d.id]; delete this.pend[d.id]; d.error ? p.rej(new Error(d.error.message + " (" + p.m + ")")) : p.res(d.result); return; }
    if (d.method === "Fetch.requestPaused") { this.paused(d.params).catch((e) => console.log("[INFO] interceptación:", e.message)); return; }
    if (d.method === "Runtime.exceptionThrown") { const e = d.params.exceptionDetails; this.errors.push({ text: (e.exception && e.exception.description || e.text || "").split("\n").slice(0, 4).join(" | "), url: e.url || (e.stackTrace && e.stackTrace.callFrames[0] && e.stackTrace.callFrames[0].url) || "", line: e.lineNumber }); }
    if (d.method === "Runtime.consoleAPICalled" && (d.params.type === "error" || d.params.type === "assert")) this.console.push(d.params.args.map((a) => a.description || a.value).join(" ").slice(0, 300));
    if (d.method === "Network.requestWillBeSent") { const r = d.params.request; this.reqHeaders.push({ url: r.url, referer: r.headers.Referer || r.headers.referer || null }); }
    (this.on[d.method] || []).forEach((f) => f(d.params));
  }
  send(m, params = {}, ms = 25000) { return new Promise((res, rej) => { const id = ++this.id;
    const t = setTimeout(() => { if (this.pend[id]) { delete this.pend[id]; rej(new Error("CDP sin respuesta en " + ms + " ms: " + m)); } }, ms);
    this.pend[id] = { res: (v) => { clearTimeout(t); res(v); }, rej: (e) => { clearTimeout(t); rej(e); }, m }; this.ws.send(JSON.stringify({ id, method: m, params })); }); }
  async ev(expr) { const r = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true, timeout: 20000 }, 30000);
    if (r.exceptionDetails) throw new Error("ev: " + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text).split("\n")[0] + " ← " + expr.slice(0, 120)); return r.result.value; }
  async setMode(m) { this.mode = Object.assign({ m47: false, rev: null, noOnfinish: false, seed: 20171023, dropLogo: null, store: null, patch: null, clock: false, glprof: false, snd: false, noAC: false, tizen: null, csp: null }, m);
    if (this.shimId) await this.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: this.shimId });
    this.shimId = (await this.send("Page.addScriptToEvaluateOnNewDocument", { source: shimSource({ m47: this.mode.m47, seed: this.mode.seed, noOnfinish: this.mode.noOnfinish, dropLogo: this.mode.dropLogo, store: this.mode.store, clock: this.mode.clock, glprof: this.mode.glprof, snd: this.mode.snd, noAC: this.mode.noAC, tizen: this.mode.tizen }) })).identifier;
    this.cache = {}; }
  local(url) { try { const u = new URL(url); return u.protocol === "data:" || u.protocol === "blob:" || u.hostname === "127.0.0.1" || u.hostname === "localhost"; } catch (e) { return true; } }
  async body(url) {                 // the bytes the page gets: git object (--rev, if tracked there) or the file under --root
    const o = this.o, u = new URL(url);   // (served by the harness: the single-threaded dev server is not in the path)
    let rel = decodeURIComponent(u.pathname).replace(/^\/+/, ""); if (rel === "" || rel.endsWith("/")) rel += "index.html";
    if (this.mode.rev) { const gp = path.posix.join(o.gitPrefix, rel);
      if (o.revFiles(this.mode.rev).has(gp)) return { status: 200, body: execFileSync("git", ["-C", o.gitTop, "show", `${this.mode.rev}:${gp}`], { maxBuffer: 64 << 20 }), from: "git", rel }; }
    const f = path.resolve(o.root, rel); if (!f.startsWith(o.root + path.sep)) return { status: 403, body: Buffer.from("fuera de --root"), from: "guard", rel };
    try { return { status: 200, body: fs.readFileSync(f), from: "disk", rel }; } catch (e) { return { status: 404, body: Buffer.from("404"), from: "disk", rel }; } }
  async paused(p) {
    const url = p.request.url, rid = p.requestId; this.urls.push(url);
    if (!this.local(url)) { this.ext.push(url);
      /* v16.9 · mode.web = { url: {status, body} }: una respuesta FALSA de otro origen, servida aquí sin salir de la
         máquina (suite pyp: el contraste con bogota.gov.co de punta a punta). Lleva ACAO:* porque la página de pruebas vive en
         127.0.0.1 (en el .wgt, inferido, el <access> de config.xml hace ese papel: a verificar en el TV). Lo demás, cortado. */
      const W = this.mode && this.mode.web;
      if (W && Object.prototype.hasOwnProperty.call(W, url)) { const w = W[url]; return this.send("Fetch.fulfillRequest", { requestId: rid, responseCode: w.status || 200,
        responseHeaders: [{ name: "Content-Type", value: "text/html; charset=UTF-8" }, { name: "Access-Control-Allow-Origin", value: "*" }, { name: "Cache-Control", value: "no-store" }], body: Buffer.from(w.body || "", "utf8").toString("base64") }); }
      return this.send("Fetch.failRequest", { requestId: rid, errorReason: "BlockedByClient" }); }
    const u = new URL(url), m = this.mode;
    if (u.protocol !== "http:" || u.origin !== new URL(this.o.base).origin) return this.send("Fetch.continueRequest", { requestId: rid });
    /* v16.4 · banco remoto FALSO para la suite remote: el mismo contrato que tools/serve_lan.py --remote */
    if (u.pathname.startsWith("/__remote/") && this.remoteFake) return this.remoteServe(p, u);
    let r = this.cache[u.pathname]; if (!r) { r = await this.body(url); this.cache[u.pathname] = r; }
    const ext = path.extname(r.rel).toLowerCase();
    let body = r.body;
    if (r.status === 200 && m.patch) for (const pt of m.patch) if (("/" + r.rel).endsWith(pt.file)) { const s = body.toString("utf8"), cnt = s.split(pt.find).length - 1;
      if (cnt !== 1) throw new Error(`parche ${pt.file}: «${pt.find}» aparece ${cnt} veces (se esperaba 1)`); body = Buffer.from(s.replace(pt.find, pt.repl)); }
    if (r.status === 200 && ext === ".js") { if (!r.scan) { const hits = scanES5(body.toString("utf8")); r.scan = { hits: hits.length, by: summarize(hits), bytes: body.length }; } this.scan[u.pathname] = r.scan; const hits = { length: r.scan.hits };
      if (m.m47 && hits.length) { if (!this.blocked.includes(u.pathname)) this.blocked.push(u.pathname); body = Buffer.from(`/* m47_check: este script tiene ${hits.length} construcciones posteriores a ES5 (${Object.keys(r.scan.by).join(", ")}): M47 no lo analiza. */\n@@m47_syntax_error@@`); } }
    if (r.status === 200 && ext === ".css" && m.m47) { const t = m47css(body.toString("utf8"), { pinVariable: this.o.pinVariable }); this.cssLog[u.pathname] = t.log; body = Buffer.from(t.css); }
    const hdr = [{ name: "Content-Type", value: CTYPE[ext] || "application/octet-stream" }, { name: "Cache-Control", value: "no-store" }];
    if (m.csp && ext === ".html") hdr.push({ name: "Content-Security-Policy", value: m.csp });   // v14: the TV's CSP (config.xml), as the WRT would apply it
    return this.send("Fetch.fulfillRequest", { requestId: rid, responseCode: r.status, responseHeaders: hdr, body: body.toString("base64") });
  }
  async remoteServe(p, u) {
    const R = this.remoteFake, rid = p.requestId, meth = p.request.method, H = [{ name: "Cache-Control", value: "no-store" }];
    const reply = (code, obj) => this.send("Fetch.fulfillRequest", { requestId: rid, responseCode: code, responseHeaders: obj ? H.concat([{ name: "Content-Type", value: "application/json" }]) : H, body: obj ? Buffer.from(JSON.stringify(obj)).toString("base64") : "" });
    /* v16.5: la clave en X-P8e-Remote, como serve_lan.py (sin ella o distinta → 403) */
    const kh = Object.entries(p.request.headers).find(([k]) => k.toLowerCase() === "x-p8e-remote");
    if (!kh || kh[1] !== R.key) { R.nokey++; return reply(403); }
    if (u.pathname === "/__remote/next" && meth === "GET") { R.gets++; return R.queue.length ? reply(200, R.queue.shift()) : reply(204); }
    if (u.pathname === "/__remote/result" && meth === "POST") {
      const ct = Object.entries(p.request.headers).find(([k]) => k.toLowerCase() === "content-type");
      if (!ct || !/^application\/json/i.test(ct[1])) { R.bad.push("tipo " + (ct && ct[1])); return reply(415); }
      let body = p.request.postData; if (body == null && p.request.hasPostData) { try { body = (await this.send("Fetch.getRequestPostData", { requestId: rid })).postData; } catch (e) {} }
      try { R.results.push(JSON.parse(body)); } catch (e) { R.bad.push("json"); return reply(400); }
      return reply(201, { ok: true, file: "falso.json" }); }
    return reply(405);
  }
  async load(url, ready = true) { this.errors = []; this.console = []; this.reqHeaders = []; this.urls = [];
    const others = (await this.send("Target.getTargets")).targetInfos.filter((t) => t.type === "page" && t.targetId !== this.pageId);
    for (const t of others) { this.closed = (this.closed || 0) + 1; await this.send("Target.closeTarget", { targetId: t.targetId }).catch(() => {}); }
    await this.send("Page.bringToFront");
    await this.send("Page.navigate", { url });
    if (!ready) { await sleep(1500); return true; }
    for (let i = 0; i < 100; i++) { await sleep(200); try { if (await this.ev("document.documentElement.getAttribute('data-ready')") === "1") { await sleep(400); await this.visible(); return true; } } catch (e) { if (/OCULTA/.test(e.message)) throw e; } }
    await this.visible(); return false; }
  async visible() { if (await this.ev("document.visibilityState") === "visible") return;
    await this.send("Page.bringToFront"); await sleep(300);
    if (await this.ev("document.visibilityState") !== "visible") throw new Error("PÁGINA OCULTA (rAF parado): el resultado no valdría; paro esta suite"); }
  async key(code, mode) {           // M47: only keyCode. std: key + code too (what a modern engine sends)
    const NAMES = { 37: "ArrowLeft", 38: "ArrowUp", 39: "ArrowRight", 40: "ArrowDown", 13: "Enter", 27: "Escape" };
    const base = { windowsVirtualKeyCode: code };   // sin nativeVirtualKeyCode: en macOS es un código nativo y disparaba atajos del navegador (chrome://settings/help)
    if (mode === "std" && NAMES[code]) Object.assign(base, { key: NAMES[code], code: NAMES[code] });
    await this.send("Input.dispatchKeyEvent", Object.assign({ type: "rawKeyDown" }, base)); await this.send("Input.dispatchKeyEvent", Object.assign({ type: "keyUp" }, base)); }
  async shot(file, clip) { const r = await this.send("Page.captureScreenshot", clip ? { format: "png", clip: Object.assign({ scale: 1 }, clip) } : { format: "png" }); const b = Buffer.from(r.data, "base64"); if (file) fs.writeFileSync(file, b); return b; }
  async stop() { try { this.ws && this.ws.close(); } catch (e) {} try { process.kill(-this.proc.pid, "SIGKILL"); } catch (e) {} await sleep(300); try { fs.rmSync(this.prof, { recursive: true, force: true }); } catch (e) {} }
}

/* ======================================================================================================
   5 · THE SUITES (P8e). They probe the DOM and the harness shim; window.P8E only with ?dev=1 (H11).
   ====================================================================================================== */
/* v16: la obra del still se lee de data-art (P8e v16 la muestra con un <img> único, sin background-image;
   con ?artone=0 o una versión anterior, data-art falta o copia el background-image y se lee éste) */
const PROBE = `(function(){ var q=function(s){ return document.querySelector(s); }, b=document.body.classList, cap=q("#capNm"), lx=q("#lx"), still=q("#artStill");
  return { app:(q("#hcoord")||{}).textContent, cap:cap&&cap.textContent, launch:b.contains("launch"), arteRun:b.contains("launch-arte"), artmode:b.contains("artmode"),
    lxOn:!!lx&&lx.classList.contains("on"), lxOpen:!!lx&&lx.classList.contains("open"), msg:(q(".lx-card .msg")||{}).textContent, bands:(q("#bands")||{}).className,
    still:still&&(still.getAttribute("data-art")||still.style.backgroundImage), live:(q("#live")||{}).textContent, reduce:document.documentElement.classList.contains("reduce"),
    three:typeof window.THREE, rafMax:__m47.rafMax, gl:__m47.glContexts, jsErr:__m47.errors.length, vis:document.visibilityState }; })()`;

function contrast(c1, c2) { const L = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const a = L(c1), b = L(c2); return +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2); }
const STYLE_PROBE = `(function(list){ function rgb(s){ var m=/rgba?\\(([^)]+)\\)/.exec(s||""); if(!m) return null; var v=m[1].split(",").map(parseFloat); return [v[0],v[1],v[2],v.length>3?v[3]:1]; }
  function over(top,bot){ var a=top[3]; return [top[0]*a+bot[0]*(1-a),top[1]*a+bot[1]*(1-a),top[2]*a+bot[2]*(1-a),1]; }
  function bgOf(e,base){ var layers=[]; for(var n=e;n&&n.nodeType===1;n=n.parentElement){ var c=rgb(getComputedStyle(n).backgroundColor); if(c&&c[3]>0){ layers.push(c); if(c[3]>=1) break; } }
    var acc=base; for(var i=layers.length-1;i>=0;i--) acc=over(layers[i],acc); return acc; }
  return list.map(function(it){ var e=document.querySelector(it[1]); if(!e) return {id:it[0],missing:true};
    var s=getComputedStyle(e,it[2]||null);
    return {id:it[0], color:s.color, bg:s.backgroundColor, bgImg:s.backgroundImage.replace(/\\s+/g," ").slice(0,220), border:s.borderTopColor+" "+s.borderTopWidth, weight:s.fontWeight, family:s.fontFamily.slice(0,40),
      display:s.display, visibility:s.visibility, opacity:s.opacity, clip:s.clipPath||s.webkitClipPath, textC:rgb(s.color), onBlack:bgOf(e,[0,0,0,1]), onWhite:bgOf(e,[255,255,255,1])}; }); })`;
const STYLE_TARGETS = [
  ["hud.mdl", ".hud>.mdl"], ["hud.model", "#hmodel"], ["hud.app", ".hud>.app"], ["hud.coord", "#hcoord"], ["hud.brand", "#hbrand"], ["hud.net", "#hnet"], ["hud.ln", ".hud .ln"],
  ["band5", ".band5"], ["scan", ".scan"], ["cap", "#cap"], ["cap.no", "#capNo"], ["cap.nm", "#capNm"], ["cap.go", "#capGo"], ["cap.after", "#cap", "::after"], ["cap.nmBefore", "#capNm", "::before"],
  ["ficha.fc", ".ficha .fc"], ["ficha.fa", "#fichaA"], ["ficha.ft", ".ficha .ft"], ["clk", "#clk"], ["foot.before", "#foot", "::before"],
  ["band.L1", ".bands .L .s1 .fr"], ["band.L1.lb", "#wL1 .v"], ["band.L2.lb", "#wL2 .lb"], ["band.L3.lb", "#wL3 .lb"], ["band.L4.lb", "#wL4 .lb"], ["band.L5.lb", "#wL5 .lb"], ["band.R1.lb", "#wR1 .lb"], ["band.R4.lb", "#wR4 .lb"], ["band.R5.v", "#wR5 .v"],   // v16.9: R4 = pico y placa
  ["tag", ".bands .tag span"], ["abs", ".bands .abs span"],
  ["au.bk", ".bands .L .s1 .bk"], ["au.pxL", ".bands .au-px.L"], ["au.pxR", ".bands .au-px.R"],   // v13: la autoría es pixel art (canvas); los tableros HTML de la v10 ya no existen
  ["lx.card", ".lx-card"], ["lx.no", ".lx-card .no"], ["body", "body"], ["card.drop", ".item.rich .drop"], ["pix", ".item .pix"], ["help", ".help"], ["help.kbd", ".help kbd"],
];
const PAIRS = [["hud.mdl", "TV (modelo)"], ["hud.coord", "APP NN/13 (amarillo)"], ["hud.net", "estado de red"], ["hud.brand", "app · versión"],   // v16.9: sin rail (panel de sugerencias fuera)
  ["cap.nm", "rótulo"], ["cap.no", "nº del rótulo"], ["cap.go", "Enter ▶ Abrir"], ["ficha.fa", "ficha"], ["band.L2.lb", "franja naranja"], ["band.L3.lb", "franja roja"], ["band.L5.lb", "franja ciruela"], ["band.R4.lb", "pico y placa (crema sobre burdeos)"],
  ["band.R5.v", "valor amarillo en ciruela"], ["tag", "píldora del panel"]];   // v13: el texto de la autoría va en canvas (su contraste: README v13)
function pairContrast(s) { if (!s || s.missing || !s.textC) return null; return Math.min(contrast(s.textC, s.onBlack), contrast(s.textC, s.onWhite)); }

async function suiteKeys(B, C, U) {
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?launchback=0&noscreen=0"));
  const st = async () => B.ev(PROBE), k = async (c, w = 1100) => { const pre = await st(); await B.key(c, "m47"); await sleep(w); const s = await st(); s.pre = pre; return s; };
  const step = (s, from, to) => s.pre.app === from && s.app === to;
  let s = await st(); C.check("C1.0", "arranca en la app 01", s.app === "01/13", s.app, "01/13");
  s = await k(39); C.check("C1.1", "→ (keyCode 39): 01 → 02", step(s, "01/13", "02/13"), s.pre.app + " → " + s.app, "01/13 → 02/13");
  s = await k(37); C.check("C1.2", "← (37): 02 → 01", step(s, "02/13", "01/13"), s.pre.app + " → " + s.app, "02/13 → 01/13");
  s = await k(37); C.check("C1.3", "← (37) da la vuelta: 01 → 13 (v16.10: 3 cintas del sistema detrás de Arte (11–13); fuera Sources, Live TV, Nintendo/Xbox/HDMI)", step(s, "01/13", "13/13"), s.pre.app + " → " + s.app, "01/13 → 13/13");
  s = await k(39); C.check("C1.4", "→ (39) da la vuelta: 13 → 01", step(s, "13/13", "01/13"), s.pre.app + " → " + s.app, "13/13 → 01/13");
  s = await k(40); C.check("C1.5", "↓ (40): 01 → 02", step(s, "01/13", "02/13"), s.pre.app + " → " + s.app, "01/13 → 02/13");
  s = await k(38); C.check("C1.6", "↑ (38): 02 → 01", step(s, "02/13", "01/13"), s.pre.app + " → " + s.app, "02/13 → 01/13");
  s = await k(13, 2000); C.check("C1.7", "Enter (13) lanza: despiece → pantalla de paso", !s.pre.launch && s.launch && s.lxOpen, `launch ${s.launch} · open ${s.lxOpen}`, "launch true · open true");
  s = await k(10009, 900); C.check("C1.8", "Back (10009) desde la pantalla de paso vuelve al corredor", s.pre.lxOpen && !s.launch && !s.lxOn && s.app === "01/13", `antes open ${s.pre.lxOpen} → launch ${s.launch} · lx ${s.lxOn} · ${s.app}`, "antes open true → false · false · 01/13");
  await sleep(600); await k(13, 2000); s = await k(27, 900); C.check("C1.9", "Back (27) desde la pantalla de paso también vuelve", s.pre.lxOpen && !s.launch && !s.lxOn, `antes open ${s.pre.lxOpen} → launch ${s.launch} · lx ${s.lxOn}`, "antes open true → false · false");
  await sleep(600); for (let i = 0; i < 8 && s.app !== "10/13"; i++) s = await k(37, 900); s = await k(13, 2300); C.check("C1.10", "Enter en Arte (10, sigue en su sitio) → salvapantallas", s.app === "10/13" && s.artmode, `${s.app} · artmode ${s.artmode}`, "10/13 · artmode true");
  s = await k(39, 600); C.check("C1.11", "cualquier tecla sale del salvapantallas", s.pre.artmode && !s.artmode, `antes ${s.pre.artmode} → ${s.artmode}`, "antes true → false");
  C.info("C1", "eventos: CDP Input.dispatchKeyEvent sólo con windowsVirtualKeyCode; KeyboardEvent.key/.code ocultos (undefined), como en M47");
}

async function styleState(B, U, m47, rev, extra = "") {
  await B.setMode({ m47, rev });
  await B.load(U("?idle=1500&author=4000&authordwell=60000&authorfirst=1&net=online" + extra));
  const out = {};
  for (let i = 0; i < 40; i++) { await sleep(250); const b = await B.ev("document.getElementById('bands').className"); if (/\binfo\b/.test(b) && !/\b(out|gone)\b/.test(b)) break; }
  await sleep(700); out.info = await B.ev(STYLE_PROBE + "(" + JSON.stringify(STYLE_TARGETS) + ")");
  out.shotInfo = await B.shot(null);
  for (let i = 0; i < 40; i++) { await sleep(250); if (/\bau\b/.test(await B.ev("document.getElementById('bands').className"))) break; }
  await sleep(1300); out.au = await B.ev(STYLE_PROBE + "(" + JSON.stringify(STYLE_TARGETS) + ")"); out.shotAu = await B.shot(null);
  out.cssLog = B.cssLog; return out;
}
async function suiteCss(B, C, U) {
  const std = await styleState(B, U, false, C.rev), em = await styleState(B, U, true, C.rev);
  if (C.shots) { for (const [n, b] of [["css-std-info", std.shotInfo], ["css-m47-info", em.shotInfo], ["css-std-autoria", std.shotAu], ["css-m47-autoria", em.shotAu]]) fs.writeFileSync(path.join(C.out, n + ".png"), b);
    await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?idle=600000")); await B.shot(path.join(C.out, "css-m47-hud.png"), { x: 0, y: 0, width: 1920, height: 140 }); await B.shot(path.join(C.out, "css-m47-cap.png"), { x: 700, y: 870, width: 520, height: 130 }); }   // v16.9: el rótulo bajo el cassette (antes, el rail)
  const drops = Object.values(em.cssLog).flat(); C.info("C3", `emulación M47: ${drops.length} declaraciones quitadas · ${JSON.stringify(Object.entries(drops.reduce((a, d) => (a[d.why] = (a[d.why] || 0) + 1, a), {})))}`);
  C.rep.cssDrops = drops;
  const keys = ["color", "bg", "bgImg", "border", "display", "visibility"];
  for (const ph of ["info", "au"]) { const diff = [];
    std[ph].forEach((s, i) => { const e = em[ph][i]; if (s.missing || e.missing) return; for (const k of keys) if (s[k] !== e[k] && !(k === "bgImg" && s[k] === e[k])) diff.push(`${s.id}.${k}: ${s[k]} ≠ ${e[k]}`); });
    C.check("C3." + (ph === "info" ? "1" : "2"), `estilos calculados iguales estándar vs M47 emulado (${ph === "info" ? "panel de info" : "autoría"})`, diff.length === 0, diff.slice(0, 6).join(" · ") || "0 diferencias", "0 diferencias"); C.rep["cssDiff_" + ph] = diff; }
  const rows = []; let worse = [];
  for (const [id, label] of PAIRS) { const ph = id.startsWith("au.") ? "au" : "info"; const s = std[ph].find((x) => x.id === id), e = em[ph].find((x) => x.id === id);
    const cs = pairContrast(s), ce = pairContrast(e); rows.push({ id, label, std: cs, m47: ce }); if (cs != null && (ce == null || ce + 0.01 < cs)) worse.push(`${label} ${cs}→${ce}`); }
  C.rep.contrast = rows;
  C.check("C3.3", "contraste en M47 emulado ≥ estándar en cada par (texto/fondo, peor caso sobre negro o blanco)", worse.length === 0, worse.join(" · ") || rows.map((r) => `${r.label} ${r.m47}`).join(" · "), "ningún par baja");
  const band = em.info.find((x) => x.id === "band5"), scan = em.info.find((x) => x.id === "scan");
  C.check("C3.4", ".band5 (las 5 franjas de arriba) existe en M47 emulado", band && band.bgImg && band.bgImg !== "none", band && band.bgImg.slice(0, 60), "linear-gradient(…)");
  C.check("C3.5", ".scan (líneas de barrido) existe en M47 emulado", scan && scan.bgImg && scan.bgImg !== "none", scan && scan.bgImg.slice(0, 60), "repeating-linear-gradient(…)");
}

async function suiteGlitch(B, C, U) {
  const res = {};
  for (const m47 of [false, true]) { await B.setMode({ m47, rev: C.rev }); await B.load(U("?idle=600000"));
    const base = await B.ev(`(function(){ var s=getComputedStyle(document.getElementById('capNm'),'::before'); return s.clipPath||s.webkitClipPath; })()`);
    await B.ev(`(function(){ var e=document.getElementById('capNm'), t0=performance.now(); window.__gl=null;
      (function poll(){ if(window.__gl) return; if(/glitching/.test(e.className)){ setTimeout(function(){ var s=getComputedStyle(e,'::before'), a=getComputedStyle(e,'::after');
          window.__gl={cls:e.className, before:s.clipPath||s.webkitClipPath, after:a.clipPath||a.webkitClipPath, op:s.opacity, at:Math.round(performance.now()-t0)}; },60); window.__gl=0; return; }
        if(performance.now()-t0<4000) setTimeout(poll,10); })(); })(); 1`);       // the watcher goes in BEFORE the key
    await B.key(39, m47 ? "m47" : "std");
    for (let t = 0; t < 4000 && !(await B.ev("!!window.__gl")); t += 100) await sleep(100);
    const mid = (await B.ev("window.__gl")) || await B.ev(`(function(){ var e=document.getElementById('capNm'), s=getComputedStyle(e,'::before'), a=getComputedStyle(e,'::after'); return {cls:e.className, before:s.clipPath||s.webkitClipPath, after:a.clipPath||a.webkitClipPath, at:-1}; })()`);
    const shot = await B.shot(C.shots ? path.join(C.out, `glitch-${m47 ? "m47" : "std"}-260ms.png`) : null, { x: 1180, y: 800, width: 720, height: 110 });
    res[m47 ? "m47" : "std"] = { base, mid, shot }; }
  C.check("C4.1", "M47 emulado: el ::before del rótulo arranca recortado entero (-webkit-clip-path)", /inset\(0(px)? 0(px)? 100%/.test(res.m47.base || ""), res.m47.base, "inset(0px 0px 100%)");
  C.check("C4.2", "M47 emulado, en pleno glitch: las capas están recortadas (no es el texto entero duplicado)", res.m47.mid.before && res.m47.mid.before !== "none" && res.m47.mid.after && res.m47.mid.after !== "none", `${res.m47.mid.cls} · before ${res.m47.mid.before} · after ${res.m47.mid.after}`, "inset(…) · inset(…)");
  C.check("C4.3", "estándar: el glitch sigue animando el recorte", res.std.mid.before && res.std.mid.before !== "none" && /glitching/.test(res.std.mid.cls), `${res.std.mid.cls} · ${res.std.mid.before}`, "glitching · inset(…)");
}

const SPEC = `(function(){ var d=document.createElement("div"); d.id="m47spec"; d.style.cssText="position:fixed;left:40px;top:160px;z-index:99;background:#FFFEE8;color:#1D1A17;padding:16px 24px";
  [300,400,500,700,800,900].forEach(function(w){ var s=document.createElement("div"); s.style.cssText="font-family:Rubik;font-size:44px;line-height:56px;white-space:nowrap;font-weight:"+w;
    var t=document.createElement("span"); t.textContent=w+" · APP 01/15 · Suggestions · Feels like"; s.appendChild(t); d.appendChild(s); });
  document.getElementById("tv").appendChild(d); return document.fonts.ready.then(function(){
    var faces=[]; document.fonts.forEach(function(f){ if(/Rubik/.test(f.family)) faces.push(f.weight+":"+f.status); });
    return {faces:faces, widths:[].map.call(d.querySelectorAll("span"),function(s){ return +s.getBoundingClientRect().width.toFixed(1); })}; }); })()`;
async function suiteFonts(B, C, U) {
  const r = {};
  for (const m47 of [false, true]) { await B.setMode({ m47, rev: C.rev }); await B.load(U("?idle=600000")); await sleep(300);
    r[m47 ? "m47" : "std"] = await B.ev(SPEC); if (C.shots) await B.shot(path.join(C.out, `fuentes-${m47 ? "m47" : "std"}.png`), { x: 40, y: 160, width: 1100, height: 380 }); }
  const w = r.m47.widths, mono = w.every((v, i) => i === 0 || v > w[i - 1] + 0.5);
  C.check("C5.1", "M47 emulado: cada peso 300…900 tiene su ancho (jerarquía sin fuente variable)", mono, JSON.stringify(w), "estrictamente creciente");
  const faces = r.m47.faces.filter((f) => /loaded/.test(f)).map((f) => f.split(":")[0]);
  C.check("C5.2", "M47 emulado: caras estáticas de Rubik cargadas 300/400/500/700/800/900", ["300", "400", "500", "700", "800", "900"].every((x) => faces.includes(x)), JSON.stringify(r.m47.faces), "las seis, loaded");
  const ws = r.std.widths, same = ws.every((v, i) => Math.abs(v - w[i]) <= 0.6);
  C.check("C5.3", "estándar = M47 emulado (mismas métricas en los dos motores)", same, `std ${JSON.stringify(ws)}`, "iguales (±0,6 px)");
  C.rep.fonts = r;
}

async function suiteLaunch(B, C, U) {
  const st = async () => B.ev(PROBE), k = async (c, w) => { await B.key(c, "m47"); await sleep(w); return st(); };
  // C6.1 onfinish never fires
  await B.setMode({ m47: true, rev: C.rev, noOnfinish: true }); await B.load(U("?launchback=0&idle=600000&retg=0&noscreen=0"));
  await sleep(1600);
  const spin = await B.ev(`(function(){ var c=document.querySelector('.item.rich .L1 canvas:nth-child(2)'); var a=c&&__m47.getAnims?__m47.getAnims.call(c):[]; return a.map(function(x){ var t=x.effect&&x.effect.getTiming?x.effect.getTiming():{}; return {state:x.playState, it:String(t.iterations)}; }); })()`);
  C.check("C6.1", "sin onfinish: los carretes pasan de la rampa al crucero (giro infinito)", spin.some((a) => a.it === "Infinity" && a.state === "running"), JSON.stringify(spin), "una animación Infinity running");
  let s = await k(13, 1250 + 400 + 500);
  C.check("C6.2", "sin onfinish: el despiece llega a la pantalla de paso por el temporizador de respaldo", s.lxOpen, `open ${s.lxOpen} · onfinish bloqueados ${await B.ev("__m47.onfinishBlocked")}`, "open true");
  s = await k(10009, 1250 + 400 + 500);   // v13: la vuelta es el espejo del despiece (LX.T = 1250 ms), no el fundido de 300 ms; sin onfinish, + 400 de respaldo
  C.check("C6.3", "sin onfinish: la vuelta termina (teclas no quedan bloqueadas)", !s.launch && !s.lxOn, `launch ${s.launch} · lx ${s.lxOn}`, "false · false");
  s = await k(39, 1100); C.check("C6.4", "sin onfinish: después se navega", s.app === "02/13", s.app, "02/13");
  // C6.5 hidden during the despiece
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?launchback=0&idle=600000&retg=0&noscreen=0"));
  await B.key(13, "m47"); await sleep(350);
  await B.ev(`(function(){ Object.defineProperty(document,"hidden",{configurable:true,get:function(){return true;}}); Object.defineProperty(document,"visibilityState",{configurable:true,get:function(){return "hidden";}}); document.dispatchEvent(new Event("visibilitychange")); })()`);
  await sleep(2000); s = await st();
  await B.ev(`(function(){ delete document.hidden; delete document.visibilityState; document.dispatchEvent(new Event("visibilitychange")); })()`);
  C.check("C6.5", "Home (oculto) en pleno despiece → vuelve al corredor, no abre nada", !s.launch && !s.lxOn && !s.lxOpen && s.app === "01/13", `launch ${s.launch} · lx ${s.lxOn} · open ${s.lxOpen} · ${s.app}`, "false · false · false · 01/13");
  s = await k(39, 1100); C.check("C6.6", "tras volver, se navega", s.app === "02/13", s.app, "02/13");
  // C6.7 adapter error
  await B.load(U("?launchback=0&idle=600000&retg=0&noscreen=0"));
  await B.ev(`window.P8EApps={launch:function(app,ok,err){ window.__m47.launched=app.nm+"|"+(app.appId===""?"appId vacío":String(app.appId)); setTimeout(function(){ err&&err(new Error("prueba")); },200); }}; 1`);
  s = await k(13, 1250 + 700);
  C.check("C6.7", "adaptador con error → «Couldn't open X» (v12: en inglés)", /couldn't open youtube/i.test(s.msg || ""), s.msg, "Couldn't open YouTube");
  C.check("C6.8", "el adaptador recibe la app con su campo appId (v16.7: el id leído en el TV con sdb applist, 2026-10-25)", /^YouTube\|xvvl3S1TT1\.TizenTubeStandalone$/.test(await B.ev("window.__m47.launched||''")), await B.ev("window.__m47.launched||''"), "YouTube|xvvl3S1TT1.TizenTubeStandalone");
  await sleep(3300 + 1250); s = await st(); C.check("C6.9", "…y a los ~3 s vuelve sola al corredor (v13: + la vuelta inversa, 1250 ms)", !s.launch && !s.lxOn, `launch ${s.launch} · lx ${s.lxOn}`, "false · false");
  await B.ev(`window.P8EApps={launch:function(){}}; 1`);
  await sleep(700); s = await k(13, 1900); C.check("C6.10", "tras el error, el siguiente lanzamiento vuelve a decir «Rewinding…» (v16.10: mensaje único)", /^rewinding/i.test(s.msg || ""), s.msg, "Rewinding…");
  s = await k(10009, 900); C.check("C6.10b", "y Back vuelve (adaptador sin respuesta)", !s.launch && !s.lxOn, `launch ${s.launch} · lx ${s.lxOn}`, "false · false");
  // C6.11 adapter ok → hidden → visible returns
  await B.load(U("?launchback=0&idle=600000&retg=0&noscreen=0"));
  await B.ev(`window.P8EApps={launch:function(app,ok){ setTimeout(function(){ ok&&ok(); },100); }}; 1`);
  s = await k(13, 1250 + 900);
  await B.ev(`(function(){ Object.defineProperty(document,"hidden",{configurable:true,get:function(){return true;}}); document.dispatchEvent(new Event("visibilitychange")); })()`); await sleep(400);
  await B.ev(`(function(){ delete document.hidden; document.dispatchEvent(new Event("visibilitychange")); })()`); await sleep(1100); s = await st();
  C.check("C6.11", "adaptador ok: al volver a primer plano, vuelve al corredor", !s.launch && !s.lxOn, `launch ${s.launch} · lx ${s.lxOn}`, "false · false");
  C.check("C6.12", "0 excepciones en las pruebas de lanzamiento", B.errors.length === 0, JSON.stringify(B.errors).slice(0, 300), "[]");
}

async function suiteReduce(B, C, U) {
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.reduce": "1" } }); await B.load(U("?idle=600000"));
  let s = await B.ev(PROBE), stars = await B.ev("document.querySelectorAll('#world .star').length");
  C.check("C7.1", "localStorage p8e.reduce=1 (sin ?reduce) → movimiento reducido al arrancar", s.reduce && stars === 0, `reduce ${s.reduce} · estrellas ${stars}`, "true · 0");
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.reduce": null } }); await B.load(U("?idle=600000"));
  s = await B.ev(PROBE); C.check("C7.2", "sin la preferencia → movimiento normal", !s.reduce, s.reduce, "false");
  await B.key(39, "m47"); await sleep(1100);
  const f = await B.ev(`(function(){ var a=document.activeElement, hidden=false; for(var n=a;n;n=n.parentElement) if(n.getAttribute&&n.getAttribute("aria-hidden")==="true") hidden=true;
    var items=[].slice.call(document.querySelectorAll('#world .item')); return {active:a&&(a.id||a.tagName), insideHidden:hidden, tab:items.map(function(i){ return i.getAttribute('tabindex'); }).filter(function(t){ return t!=="-1"; }).length, live:document.getElementById('live').textContent}; })()`);
  C.check("C7.3", "el foco no queda dentro de aria-hidden", !f.insideHidden, JSON.stringify(f), "insideHidden false");
  C.check("C7.4", "los 13 botones del corredor llevan tabindex=-1", f.tab === 0, `${f.tab} sin tabindex=-1`, "0");
  C.check("C7.5", "#live anuncia la app enfocada (v12: en inglés)", /^Netflix, in focus\. Press Enter to open\.$/.test(f.live), f.live, "Netflix, in focus. Press Enter to open.");
}

async function suiteSecurity(B, C, U) {
  // H11 / H10
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?idle=600000"));
  C.check("C8.H11a", "sin ?dev=1 no hay window.P8E", await B.ev("typeof window.P8E") === "undefined", await B.ev("typeof window.P8E"), "undefined");
  C.check("C8.H2", "<meta name=referrer content=no-referrer>", await B.ev("!!document.querySelector('meta[name=referrer][content=no-referrer]')"), "", "true");
  const xo = (r) => { try { return new URL(r.url).origin !== new URL(r.referer).origin; } catch (e) { return true; } };
  const cross = B.reqHeaders.filter((r) => r.referer && !/^(data|blob):/.test(r.url) && xo(r)), same = B.reqHeaders.filter((r) => r.referer && !xo(r) && /\?/.test(r.referer));
  C.check("C8.H2b", "ninguna petición a OTRO origen lleva Referer", cross.length === 0, JSON.stringify(cross.slice(0, 3)), "[]");
  if (same.length) C.info("C8.H2b", `mismo origen, con la URL de la página en el Referer (Chrome aplica su política por defecto, strict-origin-when-cross-origin, a las imágenes de un estilo en línea; van al mismo servidor que ya sirvió esa URL): ${same.map((r) => r.url.replace(/.*\//, "")).join(", ")}`);
  let ok = await B.load(U("?dev=%&idle=600000")); C.check("C8.H10a", "?dev=% no mata el arranque", ok, `data-ready ${ok} · errores ${JSON.stringify(B.errors).slice(0, 160)}`, "data-ready 1");
  ok = await B.load(U("?dev=1&art=abc&wx=constructor&idle=600000"));
  const a = await B.ev("({still:(function(e){ return e.getAttribute('data-art')||e.style.backgroundImage; })(document.getElementById('artStill')), wx:P8EWeather.adapter, p8e:typeof window.P8E})");
  C.check("C8.H10b", "?art=abc → una obra válida", /01-gogh\.jpg/.test(a.still), a.still, "url(…01-gogh.jpg)");
  C.check("C8.H10c", "?wx=constructor → adaptador fixture (no el prototipo)", a.wx === "fixture", a.wx, "fixture");
  C.check("C8.H11b", "con ?dev=1 sí hay window.P8E", a.p8e === "object", a.p8e, "object");
  // H3 scramble with markup
  const evil = "<img src=x onerror=window.__pwn=1>";
  const sc = await B.ev(`new Promise(function(res){ var n=document.getElementById('capNm'), imgs=0, mo=new MutationObserver(function(m){ m.forEach(function(r){ [].forEach.call(r.addedNodes,function(x){ if(x.nodeName==='IMG'||(x.querySelectorAll&&x.querySelectorAll('img').length)) imgs++; }); }); });
    mo.observe(n,{childList:true,subtree:true}); if(!window.P8E||!P8E.scramble){ res({missing:'sin gancho P8E.scramble (v10)'}); return; } P8E.scramble(${JSON.stringify(evil)}); setTimeout(function(){ mo.disconnect(); res({imgs:imgs, text:n.textContent, pwn:!!window.__pwn}); },1500); })`);
  C.check("C8.H3", "scramble con <img onerror> → texto literal, 0 nodos img", sc.imgs === 0 && sc.text === evil && !sc.pwn, JSON.stringify(sc), `{imgs:0,text:${evil},pwn:false}`);
  // H4 poisoned cache
  const now = Date.now(), X = "<img src=x onerror=window.__pwn=1>";
  const poison = { ts: now - 60000, clima: { ciudad: "CIUDAD", fuente: "x", ahora: { temp: 20, sens: 20, hum: 50, code: 0, desc: X, icon: "sun", dia: 1, viento: 5, vientoDir: 90, vientoCard: X },
    horas: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ t: "x", h: X, prob: 10 })), dias: [0, 1, 2].map(() => ({ fecha: "2026-10-23", dow: X, max: 20, min: 10, prob: 10, code: 0, desc: "x", icon: "sun" })),
    sol: { sale: X, pone: X }, uv: { max: 3, nivel: X } } };
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.weather.last.test": JSON.stringify(poison) } });
  await B.load(U("?wx=fail&net=online&idle=1500")); await sleep(5000);
  const p = await B.ev(`({pwn:!!window.__pwn, bad:document.querySelectorAll('#bands img[src="x"]').length, bands:document.getElementById('bands').className})`);
  C.check("C8.H4", "caché envenenada → no se pinta HTML", !p.pwn && p.bad === 0, JSON.stringify(p), "{pwn:false,bad:0}");
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?idle=600000"));
  const vc = await B.ev(`new Promise(function(res){ if(!P8EWeather.validClima){ res("sin validClima (v10)"); return; } var out=[], files=["data/weather-fixture.json","data/weather-fixture-2.json"];
    (function next(){ var f=files.shift(); if(!f){ res(out.join(" ")); return; } var x=new XMLHttpRequest(); x.open("GET",f); x.onload=function(){ var c=P8EWeather.normalize(JSON.parse(x.responseText),"CIUDAD");
      out.push(f.split("/").pop()+":"+P8EWeather.validClima(c)+"/"+P8EWeather.validClima(JSON.parse(JSON.stringify(c)))); next(); }; x.send(); })(); })`);
  C.check("C8.H4b", "la re-validación acepta los datos válidos (fixtures normalizados, tal cual y tras JSON)", /fixture\.json:true\/true.*fixture-2\.json:true\/true/.test(vc), vc, "true/true en los dos");
  // H1 / H8 / H9 con el modo live REAL (v16.10: LIVE_APPROVED=true en disco, decisión del autor) y el API bloqueado antes de salir.
  // En localhost la llave es ?live=1 (la configuración del TV NO arma el live en el Mac/arnés); en el .wgt (file://) manda cfg.live.
  const cfg = JSON.stringify({ ciudad: "PRUEBA", lat: 4.711234, lon: -74.072109, live: true });
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.weather.cfg": cfg } }); B.ext = [];
  await B.load(U("?dev=1&retry=500&wxevery=1000&idle=600000&live=1")); await sleep(1500);
  const live = await B.ev(`({adapter:P8EWeather.adapter, cfg:localStorage.getItem('p8e.weather.cfg'), retry:P8E.stats().hud.net.retry.scheduleMs, every:P8E.stats().wxEveryMs})`);
  const api = B.ext.filter((u) => /api\.open-meteo\.com/.test(u)), apiRef = B.reqHeaders.filter((r) => /api\.open-meteo\.com/.test(r.url));
  C.check("C8.H8a", "?live=1 + cfg.live (localhost) → adaptador live", live.adapter === "open-meteo", live.adapter, "open-meteo");
  C.check("C8.H1a", "la URL construida lleva lat/lon a 2 decimales", api.length > 0 && api.every((u) => /latitude=4\.71&longitude=-74\.07&/.test(u)), (api[0] || "(ninguna petición)").replace(/&current.*/, "…"), "latitude=4.71&longitude=-74.07");
  C.check("C8.H2c", "la petición al API no lleva Referer", apiRef.length > 0 && apiRef.every((r) => !r.referer), JSON.stringify(apiRef.map((r) => r.referer)), "[null…]");
  C.check("C8.H1b", "y se guardan redondeados", /"lat":4\.71,"lon":-74\.07/.test(live.cfg || ""), live.cfg, '"lat":4.71,"lon":-74.07');
  C.check("C8.H9", "con el live, ?retry=500 se ignora (backoff por defecto)", JSON.stringify(live.retry) === "[60000,120000,300000,600000,1800000]", JSON.stringify(live.retry), "[60000,…,1800000]");
  C.check("C8.H9b", "con el live, ?wxevery=1000 se ignora (nunca más a menudo que REFRESH_MS)", live.every === 1800000, String(live.every), "1800000");
  C.check("C8.egress", "la petición al API se cortó antes de salir (ninguna respuesta externa)", B.ext.every((u) => /api\.open-meteo\.com/.test(u)), JSON.stringify(B.ext.map((u) => u.replace(/\?.*/, ""))), "sólo api.open-meteo.com, bloqueada");
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.weather.cfg": JSON.stringify({ ciudad: "PRUEBA", lat: 4.71, lon: -74.07 }) } }); B.ext = [];
  await B.load(U("?idle=600000")); await sleep(800);
  C.check("C8.H8b", "sin cfg.live ni ?live → fixture, 0 peticiones", await B.ev("P8EWeather.adapter") === "fixture" && B.ext.length === 0, `${await B.ev("P8EWeather.adapter")} · ${B.ext.length}`, "fixture · 0");
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.weather.cfg": cfg } }); B.ext = [];
  await B.load(U("?idle=600000")); await sleep(800);
  C.check("C8.H8c", "v16.10: cfg.live=true SIN ?live=1 (localhost) NO arma el live → fixture, 0 peticiones, y el disco sigue aprobado", await B.ev("P8EWeather.adapter") === "fixture" && B.ext.length === 0 && await B.ev("P8EWeather.LIVE_APPROVED") === true, `${await B.ev("P8EWeather.adapter")} · ${B.ext.length} · ${await B.ev("P8EWeather.LIVE_APPROVED")}`, "fixture · 0 · true");
  for (const [id, label, cfgX] of [["C8.H8d", 'cfg "live":"true" (cadena, no booleano) → fixture', { ciudad: "P", lat: 4.71, lon: -74.07, live: "true" }],
                                    ["C8.H1c", "lat fuera de rango (200) → sin cfg válida → fixture", { ciudad: "P", lat: 200, lon: -74.07, live: true }]]) {
    await B.setMode({ m47: true, rev: C.rev, store: { "p8e.weather.cfg": JSON.stringify(cfgX) } }); B.ext = [];
    await B.load(U("?idle=600000")); await sleep(800);
    const ad = await B.ev("P8EWeather.adapter"); C.check(id, `${label}, 0 peticiones`, ad === "fixture" && B.ext.length === 0, `${ad} · ${B.ext.length}`, "fixture · 0"); }
  const fut = Object.assign({}, poison, { ts: Date.now() + 3600000, clima: Object.assign({}, poison.clima, { ahora: Object.assign({}, poison.clima.ahora, { desc: "CLEAR", vientoCard: "N" }),
    horas: poison.clima.horas.map((h) => ({ t: "x", h: "10", prob: 10 })), dias: poison.clima.dias.map(() => ({ fecha: "2026-10-23", dow: "MON", max: 20, min: 10, prob: 10, code: 0, desc: "CLEAR", icon: "sun" })),
    sol: { sale: "06:00", pone: "18:00" }, uv: { max: 3, nivel: "SEEK SHADE" } }) });
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.weather.last.test": JSON.stringify(fut), "p8e.weather.cfg": null } });
  await B.load(U("?dev=1&wx=fail&net=online&idle=600000")); await sleep(1200);
  const fs2 = await B.ev("P8EWeather.stats()");
  C.check("C8.N4", "un «último dato bueno» con fecha FUTURA (reloj hacia atrás) no se sirve", fs2.fallback === 0, JSON.stringify(fs2), "fallback 0");
  /* v12 · control positivo: el MISMO dato con fecha pasada sí se sirve; si no, N4 pasaría por otra razón (p. ej. un texto que ya no valida) */
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.weather.last.test": JSON.stringify(Object.assign({}, fut, { ts: Date.now() - 600000 })), "p8e.weather.cfg": null } });
  await B.load(U("?dev=1&wx=fail&net=online&idle=600000")); await sleep(1200);
  const fs3 = await B.ev("P8EWeather.stats()");
  C.check("C8.N4b", "control: el mismo dato con fecha PASADA sí se sirve (N4 no pasa por otra razón)", fs3.fallback >= 1, JSON.stringify(fs3), "fallback ≥ 1");
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.weather.cfg": null, "p8e.weather.last.test": null } });
}

async function tourRun(B, U, rev, tag, C) {
  await B.setMode({ m47: false, rev });
  await B.load(U("?idle=3000&author=7000&authordwell=2500&authorfirst=1&launchback=2500&dwell=3000"));
  const shots = {}, cap = async (n) => { shots[n] = await B.shot(null); if (C.shots) fs.writeFileSync(path.join(C.out, `tour-${tag}-${n}.png`), shots[n]); };
  const pose = () => B.ev(`[].map.call(document.querySelectorAll('.item.rich .cass, .item.rich .cass>*'),function(e){ var s=getComputedStyle(e); return s.transform+"|"+s.opacity; })`);
  await sleep(800); await cap("01-arranque");
  const style0 = await B.ev(STYLE_PROBE + "(" + JSON.stringify(STYLE_TARGETS) + ")");
  for (let i = 0; i < 40; i++) { await sleep(250); const b = await B.ev("document.getElementById('bands').className"); if (/\binfo\b/.test(b) && !/\b(out|gone)\b/.test(b)) break; }
  await sleep(900); await cap("02-reposo-panel");
  const styleInfo = await B.ev(STYLE_PROBE + "(" + JSON.stringify(STYLE_TARGETS) + ")");
  for (let i = 0; i < 40; i++) { await sleep(250); if (/\bau\b/.test(await B.ev("document.getElementById('bands').className"))) break; }
  await sleep(1200); await cap("03-autoria");
  for (let i = 0; i < 30; i++) { await sleep(250); if (!/\bau\b/.test(await B.ev("document.getElementById('bands').className"))) break; }
  await sleep(1500);
  const pose0 = await pose();
  await B.key(13, "std"); await sleep(600); await cap("04-despiece-600ms");
  await sleep(1200); await cap("05-pantalla-de-paso");
  for (let t = 0; t < 8000; t += 100) { if (!(await B.ev("document.body.classList.contains('launch')||document.getElementById('lx').classList.contains('on')"))) break; await sleep(100); }
  const pose1a = await pose(); await sleep(1400); await cap("06-vuelta");
  const pose1 = await pose();
  const until = async (expr, ms) => { for (let t = 0; t < ms; t += 100) { if (await B.ev(expr)) return true; await sleep(100); } return false; };
  await until("!document.body.classList.contains('launch')&&!document.getElementById('lx').classList.contains('on')", 4000);
  for (let i = 0; i < 8; i++) { await B.key(37, "std"); if (await until("document.getElementById('hcoord').textContent==='10/13'", 1200)) break; } await sleep(1000);   // v16.7: Arte (15) ya no es la vecina de 01
  await B.key(13, "std"); const saver = await until("document.body.classList.contains('artmode')", 5000);
  await until("getComputedStyle(document.getElementById('artCanvas')).opacity==='0'&&document.getElementById('artStill').style.opacity==='1'", 6000); await sleep(300); await cap("07-salvapantallas");
  await B.key(39, "std"); await sleep(900);
  const m = await B.ev("({rafMax:__m47.rafMax, gl:__m47.glContexts, glTypes:__m47.glTypes, live:P8EWeather.LIVE_APPROVED, errs:__m47.errors.length})");
  return { shots, pose0, pose1, pose1a, saver, m, ext: B.ext.slice(), errors: B.errors.slice(), style0, styleInfo };
}
/* reduced motion = still frames: the static design compared pixel by pixel (clock masked: it is the time of day) */
async function stillRun(B, U, rev, tag, C, patch) {
  await B.setMode({ m47: false, rev, patch }); await B.load(U("?reduce=1&idle=2000&author=5000&authordwell=60000&authorfirst=1"));
  const shots = {}, cap = async (n) => { shots[n] = await B.shot(null); if (C.shots) fs.writeFileSync(path.join(C.out, `quieto-${tag}-${n}.png`), shots[n]); };
  const until = async (expr, ms) => { for (let t = 0; t < ms; t += 100) { if (await B.ev(expr)) return true; await sleep(100); } return false; };
  await sleep(500); await cap("01-arranque");
  await until("/\\binfo\\b/.test(document.getElementById('bands').className)&&!/\\b(out|gone)\\b/.test(document.getElementById('bands').className)", 8000); await sleep(400); await cap("02-panel");
  await until("/\\bau\\b/.test(document.getElementById('bands').className)", 9000); await sleep(400); await cap("03-autoria");
  await B.key(39, "std"); await sleep(900); await cap("04-app02");
  return shots; }
async function suiteTour(B, C, U) {
  B.ext = [];
  const cur = await tourRun(B, U, C.rev, C.rev ? C.rev : "actual", C);
  C.check("C9.1", "1 rAF pendiente como máximo", cur.m.rafMax <= 1, cur.m.rafMax, "≤ 1");
  C.check("C9.2", "1 contexto WebGL", cur.m.gl === 1, `${cur.m.gl} ${JSON.stringify(cur.m.glTypes)}`, "1");
  /* v16.9: el contraste del pico y placa (pyp.js) pide a https://bogota.gov.co con red y en reposo (≤ 3 por intento;
     aquí, el arnés la corta en la 1.ª y pyp.js para). Cualquier OTRA petición externa sigue siendo un fallo. */
  const PYP_RE = /^https:\/\/bogota\.gov\.co\/(mi-ciudad\/movilidad\/|tag\/pico-y-placa-en-bogota$)/;
  const ext9 = cur.ext.filter((u) => !PYP_RE.test(u));
  C.check("C9.3", "0 peticiones externas (salvo el contraste de pico y placa a https://bogota.gov.co, v16.9: ≤ 1 por reposo con la red cortada)", ext9.length === 0 && cur.ext.length <= 1, JSON.stringify(cur.ext), "[] (o sólo el boletín de bogota.gov.co)");
  C.check("C9.4", "LIVE_APPROVED=true (v16.10, decisión del autor)", cur.m.live === true, cur.m.live, "true");
  C.check("C9.5", "salvapantallas desde el VHS Arte", cur.saver === true, cur.saver, "true");
  C.check("C9.6", "cassette re-armado exacto tras la vuelta (pose calculada igual que antes de lanzar)", JSON.stringify(cur.pose0) === JSON.stringify(cur.pose1), cur.pose0.length + " capas · " + (JSON.stringify(cur.pose0) === JSON.stringify(cur.pose1) ? "iguales" : "DISTINTAS: " + JSON.stringify(cur.pose1).slice(0, 200)), "iguales");
  C.check("C9.7", "0 excepciones en el recorrido estándar", cur.errors.length === 0 && cur.m.errs === 0, JSON.stringify(cur.errors).slice(0, 300), "[]");
  if (C.against) {
    const ref = await tourRun(B, U, C.against, C.against, C), ref2 = await tourRun(B, U, C.against, C.against + "-b", C);
    const rows = [];
    for (const n of Object.keys(cur.shots)) { const d = pngDiff(ref.shots[n], cur.shots[n]), noise = pngDiff(ref.shots[n], ref2.shots[n]); rows.push({ n, v10v11: d, ruido_v10v10: noise }); }
    C.rep.tourDiff = rows;
    const qa = await stillRun(B, U, C.against, C.against, C), qb = await stillRun(B, U, C.rev, C.rev || "actual", C), CLOCK = [[0, 990, 330, 1080], [520, 505, 700, 570]];   // la hora de abajo y la del panel (#wxClk): son la hora del día
    /* atribución: la versión actual con la fuente VARIABLE de la v10 servida en memoria (sólo el bloque @font-face de Rubik) */
    let qv = null; if (!C.rev) { const css = fs.readFileSync(path.join(C.root, "P8e/p8e.css"), "utf8"), a = css.indexOf('@font-face{font-family:"Rubik";src:url("../fonts/Rubik-latin-300'), b = css.indexOf("\n", css.indexOf("Rubik-latin-900.woff2"));
      if (a > 0 && b > a) qv = await stillRun(B, U, null, "actual-fuentevar", C, [{ file: "/P8e/p8e.css", find: css.slice(a, b), repl: '@font-face{font-family:"Rubik";src:url("../fonts/Rubik-latin-var.woff2") format("woff2");font-weight:300 900;font-display:block}' }]); }
    for (const n of Object.keys(qa)) { const d = pngDiff(qa[n], qb[n], 24, 60, CLOCK), big = pngDiff(qa[n], qb[n], 100, 60, CLOCK);
      if (qv) { const dv = pngDiff(qa[n], qv[n], 24, 60, CLOCK);
        C.check("C9.q1", `quieto ${n}: actual con la fuente variable de ${C.against} = ${C.against} píxel a píxel (fuera de la fuente, nada cambió)`, dv.pixels === 0, `${dv.pixels} px`, "0 px"); }
      C.check("C9.q2", `quieto ${n}: actual vs ${C.against} sólo difiere en el suavizado de las letras (caras estáticas)`, big.pixels === 0 && d.ratio < 0.001, `${d.pixels} px > 24/255 ${d.box ? "en " + JSON.stringify(d.box) : ""} · ${big.pixels} px > 100/255`, "< 0,1 % y ninguno > 100/255"); }
    for (const r of rows) C.info("C9.px", `${r.n}: ${C.against}→actual ${(r.v10v11.ratio * 100).toFixed(2)} % (caja ${JSON.stringify(r.v10v11.box)}) · ruido ${C.against}→${C.against} ${(r.ruido_v10v10.ratio * 100).toFixed(2)} %`);
    const keys = ["color", "bg", "border", "weight", "family", "display", "visibility", "opacity"];
    for (const [ph, a, b] of [["arranque", ref.style0, cur.style0], ["panel", ref.styleInfo, cur.styleInfo]]) { const diff = [];
      a.forEach((s, i) => { const e = b[i]; if (s.missing && e.missing) return; if (s.missing !== e.missing) { diff.push(s.id + " existe " + !s.missing + "→" + !e.missing); return; } for (const k of keys) if (s[k] !== e[k]) diff.push(`${s.id}.${k}: ${s[k]} → ${e[k]}`); });
      C.check("C9.8" + (ph === "panel" ? "b" : "a"), `estilos calculados ${C.against} = actual (${ph}; color, fondo, borde, peso, familia, display, opacidad)`, diff.length === 0, diff.slice(0, 8).join(" · ") || "0 diferencias", "0 diferencias"); C.rep["styleDiff_" + ph] = diff; }
  }
}

/* ======================================================================================================
   v12 · FOTOGRAMAS POSADOS (reloj congelado) y el WebGL1 propio en la emulación M47
   ====================================================================================================== */
/* sólo se ve el lienzo WebGL del arte (sin la obra fija ni la interfaz): se compara lo que dibuja el GL, nada más */
const HIDE_UI = `(function(){ var s=document.createElement("style"); s.id="m47hide"; s.textContent="#tv>*:not(.artwrap){visibility:hidden!important}#artStill{visibility:hidden!important}"; document.head.appendChild(s); return 1; })()`;
/* el paneo de la obra fija se posa en 0 (el dispersal parte de su encuadre), el azar se fija (viento, Ken Burns) y el reloj se congela */
const FREEZE = (R) => `(function(){ var s=document.getElementById('artStill'); (s.getAnimations?s.getAnimations():[]).forEach(function(a){ a.pause(); a.currentTime=0; });
  Math.random=function(){ return ${R}; }; __m47.clk.frozen=performance.now(); __m47.clk.t0=__m47.clk.frozen; return __m47.clk.t0; })()`;
function pxStats(a, b) {          // diferencia por canal (RGB), sobre toda la captura
  const A = pngDecode(a), Bq = pngDecode(b); if (A.w !== Bq.w || A.h !== Bq.h) return { error: "tamaños distintos" };
  let max = 0, sum = 0, n0 = 0, n8 = 0, n24 = 0, lit = 0; const N = A.w * A.h, bg = [A.px[0], A.px[1], A.px[2]];   // fondo = esquina superior izquierda
  for (let i = 0; i < N * 4; i += 4) { const d = Math.max(Math.abs(A.px[i] - Bq.px[i]), Math.abs(A.px[i + 1] - Bq.px[i + 1]), Math.abs(A.px[i + 2] - Bq.px[i + 2]));
    if (d > max) max = d; sum += d; if (d > 0) n0++; if (d > 8) n8++; if (d > 24) n24++; if (Math.max(Math.abs(A.px[i] - bg[0]), Math.abs(A.px[i + 1] - bg[1]), Math.abs(A.px[i + 2] - bg[2])) > 24) lit++; }
  return { max, mean: +(sum / N).toFixed(4), gt0: +(n0 / N).toFixed(5), gt8: +(n8 / N).toFixed(5), gt24: +(n24 / N).toFixed(5), litA: +(lit / N).toFixed(4) };
}
async function poseDispersal(B, U, rev, q, R, times) {
  await B.setMode({ m47: false, rev, clock: true, glprof: true }); await B.load(U("?dev=1&idle=600000" + q)); await sleep(2600);
  await B.ev(HIDE_UI); await B.ev(FREEZE(R)); await B.ev("P8E.nextArt(); 1");
  for (let i = 0; i < 60 && !(await B.ev("P8E.state().inTransition")); i++) await sleep(100);
  const shots = {}; for (const ms of times) { await B.ev(`__m47.clk.frozen=__m47.clk.t0+${ms}; 1`); await sleep(350); shots[ms] = await B.shot(null); }
  return { shots, info: await B.ev("({st:P8E.state(), gl:P8E.stats().webgl, prof:__m47.gl})"), errors: B.errors.slice() };
}
async function poseSaver(B, U, rev, q, R, times) {
  await B.setMode({ m47: false, rev, clock: true }); await B.load(U("?dev=1&idle=600000&lxarte=0&dwell=600000&app=10" + q)); await sleep(2600);
  await B.ev(HIDE_UI); await B.ev(FREEZE(R)); await B.key(13, "std");
  for (let i = 0; i < 60 && !(await B.ev("P8E.state().inTransition&&P8E.state().artMode")); i++) await sleep(100);
  const shots = {}; for (const ms of times) { await B.ev(`__m47.clk.frozen=__m47.clk.t0+${ms}; 1`); await sleep(350); shots[ms] = await B.shot(null); }
  return { shots, info: await B.ev("({st:P8E.state(), gl:P8E.stats().webgl})"), errors: B.errors.slice() };
}
/* el despiece se posa como en la v9: todas las pistas en pausa y el mismo currentTime (×8: ?launchslow=8 deja 10 s antes del respaldo) */
async function posePortal(B, U, rev, q, times, m47 = false, hide = true) {
  await B.setMode({ m47, rev, glprof: true }); await B.load(U("?dev=1&idle=600000&launchback=0&launchslow=8" + q)); await sleep(2600);
  if (hide) await B.ev(HIDE_UI); await B.key(13, m47 ? "m47" : "std");
  await B.ev("(document.getAnimations?document.getAnimations():[]).forEach(function(a){ a.pause(); }); 1");
  const shots = {}; for (const ms of times) { await B.ev(`(document.getAnimations?document.getAnimations():[]).forEach(function(a){ a.currentTime=${ms * 8}; }); 1`); await sleep(400); shots[ms] = await B.shot(null); }
  return { shots, info: await B.ev("({fx:P8E.stats().fx, gl:P8E.stats().webgl, prof:__m47.gl, center:null})"), errors: B.errors.slice() };
}
async function suiteFrames(B, C, U) {
  if (!C.against) { C.info("C2f", "fotogramas posados: omitido (hace falta --against <rev>, p. ej. 6eafe22 = v11)"); return; }
  const save = (tag, r) => { if (C.shots) for (const [ms, b] of Object.entries(r.shots)) fs.writeFileSync(path.join(C.out, `frames-${tag}-${ms}ms.png`), b); };
  const rows = []; C.rep.frames = rows;
  const cmp = (id, name, ref, ref2, cur, lim) => { for (const ms of Object.keys(cur.shots)) { const d = pxStats(ref.shots[ms], cur.shots[ms]), nz = pxStats(ref.shots[ms], ref2.shots[ms]);
      rows.push({ id, ms, cur: d, noise: nz });
      C.check(`${id}.${ms}`, `${name} a ${ms} ms: ${C.against} → actual (ruido ${C.against}→${C.against} al lado)`, !d.error && d.gt24 <= lim && d.litA > 0.02,
        `>24/255 ${(d.gt24 * 100).toFixed(3)} % · >8 ${(d.gt8 * 100).toFixed(3)} % · media ${d.mean} · máx ${d.max} · ruido >24 ${(nz.gt24 * 100).toFixed(3)} % · lienzo con dibujo ${(d.litA * 100).toFixed(1)} %`, `≤ ${(lim * 100).toFixed(2)} % de píxeles > 24/255 y lienzo con dibujo`); } };
  /* C2 · dispersal: dos vientos (0 = remolino, 3 = ráfaga hacia arriba), 3 instantes; salvapantallas (Ken Burns de llegada), 3 instantes */
  for (const [R, w] of [[0.01, 0], [0.55, 3]]) { const T = [300, 900, 1500];
    const ref = await poseDispersal(B, U, C.against, "&art=4", R, T), ref2 = await poseDispersal(B, U, C.against, "&art=4", R, T), cur = await poseDispersal(B, U, C.rev, "&art=4", R, T);
    save(`dispersal-viento${w}-ref`, ref); save(`dispersal-viento${w}-v12`, cur); cmp(`C2.f${w}`, `dispersal (viento ${w}, obra 5→6)`, ref, ref2, cur, 0.002);
    C.info(`C2.f${w}`, `v12: ${JSON.stringify(cur.info.gl && { type: cur.info.gl.type, buffer: cur.info.gl.buffer, points: cur.info.gl.points, pointPx: cur.info.gl.pointPx })} · ${C.against}: webgl2=${ref.info.gl && ref.info.gl.webgl2} · errores v12 ${cur.errors.length}`); }
  { const T = [300, 900, 1500]; const ref = await poseSaver(B, U, C.against, "&art=8", 0.37, T), ref2 = await poseSaver(B, U, C.against, "&art=8", 0.37, T), cur = await poseSaver(B, U, C.rev, "&art=8", 0.37, T);
    save("salvapantallas-ref", ref); save("salvapantallas-v12", cur); cmp("C2.fs", "salvapantallas (dispersal hacia el encuadre Ken Burns)", ref, ref2, cur, 0.002); }
  /* C3 · portal: despiece posado a 300/600/900 ms */
  { const T = [300, 600, 900]; const ref = await posePortal(B, U, C.against, "", T), ref2 = await posePortal(B, U, C.against, "", T), cur = await posePortal(B, U, C.rev, "", T);
    save("portal-ref", ref); save("portal-v12", cur); cmp("C3.f", "portal (Netflix, paleta)", ref, ref2, cur, 0.002);
    C.info("C3.f", `v12 fx ${JSON.stringify({ portalBuffer: cur.info.fx.portalBuffer, frames: cur.info.fx.portalFrames, compiled: cur.info.fx.compiled, fb: cur.info.prof.fb })}`);
    const refA = await posePortal(B, U, C.against, "&portaltint=app&app=1", [450]), curA = await posePortal(B, U, C.rev, "&portaltint=app&app=1", [450]);
    save("portal-tintapp-youtube-ref", refA); save("portal-tintapp-youtube-v12", curA);
    const dA = pxStats(refA.shots[450], curA.shots[450]); rows.push({ id: "C3.tint", ms: 450, cur: dA });
    C.check("C3.tint", "?portaltint=app (YouTube, 450 ms): v12 = referencia", dA.gt24 <= 0.002 && curA.info.fx.portalTint === "app", `>24/255 ${(dA.gt24 * 100).toFixed(3)} % · media ${dA.mean} · tinte ${curA.info.fx.portalTint}`, "≤ 0,2 % · app"); }
  /* C7 · el despiece ENTERO posado (cassette, electricidad v9, portal): lo único que puede cambiar es el texto traducido del
     cassette (anillos ABRIR → OPEN, etiqueta Nº → No.); la caja de la diferencia lo dice */
  { const T = [200, 600, 900]; const ref = await posePortal(B, U, C.against, "", T, false, false), ref2 = await posePortal(B, U, C.against, "", T, false, false), cur = await posePortal(B, U, C.rev, "", T, false, false);
    save("despiece-entero-ref", ref); save("despiece-entero-v12", cur);
    for (const ms of T) { const d = pngDiff(ref.shots[ms], cur.shots[ms], 24, 60), nz = pngDiff(ref.shots[ms], ref2.shots[ms], 24, 60); rows.push({ id: "C7.lx", ms, cur: d, noise: nz });
      C.info(`C7.lx.${ms}`, `despiece entero a ${ms} ms: ${C.against}→actual ${(d.ratio * 100).toFixed(3)} % de píxeles > 24/255, caja ${JSON.stringify(d.box)} · ruido ${C.against}→${C.against} ${(nz.ratio * 100).toFixed(3)} %`); }
    C.check("C7.lx", "despiece entero (electricidad + portal) en 3 instantes: sin excepciones en las dos versiones, el mismo nº de fotogramas de electricidad que dibujan", cur.errors.length === 0 && cur.info.fx.zapFrames > 0 && cur.info.fx.portalFrames > 0,
      `errores ${cur.errors.length} · zap ${cur.info.fx.zapFrames} · portal ${cur.info.fx.portalFrames} · máx. arcos ${cur.info.fx.maxBolts} (ref ${ref.info.fx.maxBolts}) · chispas ${cur.info.fx.maxSparks} (ref ${ref.info.fx.maxSparks})`, "0 · > 0 · > 0"); }
  /* C3 · perillas del portal */
  for (const [q, exp] of [["&portalres=2", [960, 540]], ["&portalres=8", [240, 135]]]) { const r = await posePortal(B, U, C.rev, q, [600]);
    C.check("C3.res" + q.split("=")[1], `?portalres=${q.split("=")[1]} → framebuffer del portal ${exp.join("×")}`, JSON.stringify(r.info.fx.portalBuffer) === JSON.stringify(exp) && JSON.stringify(r.info.prof.lastFb) === JSON.stringify(exp) && r.info.fx.portalFrames > 0,
      `${JSON.stringify(r.info.fx.portalBuffer)} · último dibujo en ${JSON.stringify(r.info.prof.lastFb)} · ${r.info.fx.portalFrames} fotogramas`, exp.join("×")); }
  { const a = await posePortal(B, U, C.rev, "&portalsteps=4", [600]), b = await posePortal(B, U, C.rev, "&portalsteps=12", [600]); const d = pxStats(a.shots[600], b.shots[600]);
    C.check("C3.steps", "?portalsteps=4 y =12 compilan, dibujan y dan imágenes distintas", a.info.fx.compiled && b.info.fx.compiled && a.info.fx.portalSteps === 4 && b.info.fx.portalSteps === 12 && a.info.fx.portalFrames > 0 && b.info.fx.portalFrames > 0 && d.gt24 > 0.01,
      `4: ${a.info.fx.compiled}/${a.info.fx.portalFrames} · 12: ${b.info.fx.compiled}/${b.info.fx.portalFrames} · distintas ${(d.gt24 * 100).toFixed(1)} %`, "compilan, dibujan, distintas"); }
  /* C4 · ?glscale: framebuffer y fragmentos del dispersal; el aspecto se mide contra glscale=1 */
  const g1 = await poseDispersal(B, U, C.rev, "&art=4", 0.01, [900]); const gs = { 1: g1 };
  for (const k of [0.75, 0.5]) { gs[k] = await poseDispersal(B, U, C.rev, `&art=4&glscale=${k}`, 0.01, [900]); save(`glscale-${k}`, gs[k]); }
  save("glscale-1", g1);
  const frag = (r) => { const g = r.info.gl; return Math.round(g.points * Math.pow(Math.round(g.pointPx), 2)); };
  for (const k of [0.75, 0.5]) { const r = gs[k], g = r.info.gl, exp = [Math.round(1920 * k), Math.round(1080 * k)], d = pxStats(g1.shots[900], r.shots[900]);
    rows.push({ id: "C4." + k, ms: 900, cur: d });
    C.check("C4." + k, `?glscale=${k} → framebuffer ${exp.join("×")}, punto ${(15.2 * k).toFixed(1)} px, fragmentos ≈ ${k}² de los de 1`, JSON.stringify(g.buffer) === JSON.stringify(exp) && JSON.stringify(r.info.prof.lastFb) === JSON.stringify(exp) && Math.abs(g.pointPx - 15.2 * k) < 0.01,
      `fb ${JSON.stringify(g.buffer)} (dibujo en ${JSON.stringify(r.info.prof.lastFb)}) · punto ${g.pointPx} px · fragmentos/nube ≈ ${frag(r).toLocaleString("es")} frente a ${frag(g1).toLocaleString("es")} · aspecto vs 1: >24/255 ${(d.gt24 * 100).toFixed(2)} %, >8 ${(d.gt8 * 100).toFixed(2)} %, media ${d.mean}`, exp.join("×")); }
  C.check("C4.def", "por defecto glscale=1 (framebuffer 1920×1080 = v11)", JSON.stringify(g1.info.gl.buffer) === "[1920,1080]" && g1.info.gl.scale === 1, JSON.stringify(g1.info.gl.buffer), "[1920,1080]");
}

async function suiteGL(B, C, U) {
  /* v12: en la emulación M47 el arte y el portal FUNCIONAN (antes, sin three, se degradaban). Sustituye a «nothree». */
  await B.setMode({ m47: true, rev: C.rev, glprof: true });
  await B.load(U("?dev=1&idle=2500&dwell=2200&author=6000&authordwell=2500&authorfirst=1&launchback=1200"));
  const st = async () => B.ev(PROBE), k = async (c, w = 800) => { await B.key(c, "m47"); await sleep(w); return st(); };
  const S = () => B.ev("P8E.stats()");
  await sleep(2600);                                            // fxPrewarm compila el portal a los 2 s del arranque
  let s = await st(), x = await S();
  C.check("C6.gl0", "ningún script bloqueado por sintaxis > ES5 · sin three", B.blocked.length === 0 && s.three === "undefined", `bloqueados ${JSON.stringify(B.blocked)} · THREE ${s.three}`, "[] · undefined");
  C.check("C6.gl1", "contexto WebGL1 propio (gl.js), 1 contexto, programa del portal compilado en frío", x.webgl && x.webgl.type === "webgl" && x.webgl.contexts === 1 && x.fx.compiled === true && (x.webgl.errors || []).length === 0,
    JSON.stringify(x.webgl && { type: x.webgl.type, contexts: x.webgl.contexts, errors: x.webgl.errors, compiled: x.fx.compiled }), "webgl · 1 · compilado · sin errores");
  const t0 = x.art.transitions, still0 = s.still;
  /* v16.2: el relevo ESPERA RW ms tras la última pulsación (decisión del autor); los tiempos de
     estas comprobaciones suman esa espera, lo que comprueban no cambia (dispersal, no corte; 3 relevos; 1920×1080 tras el portal) */
  const RW = 650;
  s = await k(39, 400 + RW); const mid = await B.ev("({tr:P8E.state().inTransition, op:getComputedStyle(document.getElementById('artCanvas')).opacity, pts:__m47.gl.points})");
  C.check("C6.gl2", "al navegar, el arte se releva con el DISPERSAL (no por corte): lienzo visible y puntos dibujados", mid.tr === true && mid.op === "1" && mid.pts > 0, JSON.stringify(mid), "inTransition true · opacidad 1 · puntos > 0");
  await sleep(1800); s = await k(39, 2300 + RW); s = await k(39, 2300 + RW); x = await S();
  C.check("C6.gl3", "3 relevos con dispersal completos", x.art.transitions - t0 >= 3 && s.app === "04/13" && s.still !== still0, `${x.art.transitions - t0} relevos · ${s.app}`, "≥ 3 · 04/13");
  let ok = false; for (let i = 0; i < 30 && !ok; i++) { await sleep(300); s = await st(); ok = /\binfo\b/.test(s.bands) && !/\b(out|gone)\b/.test(s.bands); }
  C.check("C6.gl4", "reposo: el panel de info entra", ok, s.bands, "bands info");
  ok = false; for (let i = 0; i < 40 && !ok; i++) { await sleep(300); s = await st(); ok = /\bau\b/.test(s.bands); }
  C.check("C6.gl5", "reposo: gira a la autoría", ok, s.bands, "… au");
  await sleep(300); await B.key(13, "m47"); await sleep(650); x = await S();
  C.check("C6.gl6", "lanzamiento: el PORTAL se abre en el mismo contexto (a 480×270)", x.fx.portalOn === true && x.fx.portalFrames > 0 && JSON.stringify(x.fx.portalBuffer) === "[480,270]" && x.webgl.contexts === 1,
    JSON.stringify({ on: x.fx.portalOn, frames: x.fx.portalFrames, buf: x.fx.portalBuffer, ctx: x.webgl.contexts, err: x.fx.err }), "on · > 0 · [480,270] · 1");
  await sleep(1300); s = await st(); C.check("C6.gl7", "…y llega a la pantalla de paso", s.launch && s.lxOpen, `launch ${s.launch} · open ${s.lxOpen}`, "true · true");
  await sleep(1800); s = await st(); C.check("C6.gl8", "vuelve sola al corredor (launchback)", !s.launch && !s.lxOn, `launch ${s.launch} · lx ${s.lxOn}`, "false · false");
  await sleep(600); const tb = (await S()).art.transitions; await B.key(39, "m47"); await sleep(2400 + RW); x = await S();
  C.check("C6.gl9", "tras el portal, el dispersal vuelve a 1920×1080", x.art.transitions > tb && JSON.stringify(x.webgl.buffer) === "[1920,1080]", `${x.art.transitions - tb} relevo · ${JSON.stringify(x.webgl.buffer)}`, "1 · [1920,1080]");
  for (let i = 0; i < 14 && s.app !== "10/13"; i++) s = await k(37, 900);   // v16.7: hasta 10 pasos (v16.9: 11–13 están entre 01 y Arte)
  s = await k(13, 2600); x = await S(); const ts0 = x.art.transitions;
  C.check("C6.gl10", "Arte → salvapantallas", s.artmode, `artmode ${s.artmode}`, "true");
  await sleep(5600); s = await st(); x = await S();
  C.check("C6.gl11", "salvapantallas: las obras se relevan con el dispersal (no por corte)", s.artmode && x.art.transitions > ts0, `${x.art.transitions - ts0} relevos en 5,6 s`, "≥ 1");
  s = await k(39, 700); C.check("C6.gl12", "sale del salvapantallas", !s.artmode, s.artmode, "false");
  x = await S(); const t = x.webgl.tex;
  C.check("C6.gl13", "LRU: ≤ 3 texturas vivas en GPU en TODO momento, las que salen se borran (deleteTexture)", t.texMax <= 3 && t.texLive <= 3 && x.textures <= 3 && t.texDeleted >= 1 && t.texCreated - t.texDeleted === t.texLive,
    JSON.stringify(t), "texMax ≤ 3 · creadas − borradas = vivas");
  C.check("C6.gl14", "0 excepciones no capturadas · 0 console.error · 1 contexto · 1 rAF", B.errors.length === 0 && B.console.length === 0 && x.webgl.contexts === 1 && (await B.ev("__m47.rafMax")) <= 1,
    JSON.stringify(B.errors).slice(0, 300) + JSON.stringify(B.console).slice(0, 200), "[] · [] · 1 · ≤ 1");
  /* revisión de seguridad W2: un corte mientras se cargan las texturas de un relevo lo anula (la cadena tardía no arranca nada) */
  await B.ev("P8E.showArt(11); 1"); await sleep(500); const tr0 = (await S()).art.transitions;
  await B.ev("P8E.nextArt(); P8E.showArt(13); 1"); await sleep(2600); const w2 = await B.ev("({i:P8E.state().artIdx, tr:P8E.state().inTransition, n:P8E.stats().art.transitions})");
  C.check("C6.gl16", "un corte durante la carga anula el relevo pendiente (revisión de seguridad W2)", w2.i === 13 && !w2.tr && w2.n === tr0, JSON.stringify(w2), `{i:13, tr:false, n:${tr0}}`);
  C.rep.gl = { stats: x, errors: B.errors, console: B.console };
  /* sin WebGL (motor sin contexto): degrada como la v11 (corte entre obras, despiece sin portal), sin excepciones */
  await B.setMode({ m47: true, rev: C.rev, patch: [{ file: "/P8e/gl.js", find: 'var names=["webgl","experimental-webgl"]', repl: 'var names=[]' }] });
  await B.load(U("?idle=600000&launchback=1200")); s = await st(); const sv = s.still;
  s = await k(39, 1200); const s2 = await k(13, 1900);
  C.check("C6.gl15", "sin WebGL: corte entre obras y despiece sin portal hasta la pantalla de paso, 0 excepciones", s.still !== sv && s2.lxOpen && B.errors.length === 0, `obra ${s.still !== sv} · open ${s2.lxOpen} · errores ${B.errors.length}`, "true · true · 0");
}

/* v12 · C5: la interfaz en inglés. En cada estado: TODO el texto del DOM de #tv (visible u oculto; la ficha de museo es un
   dato en inglés con nombres propios y se excluye), los atributos que lee el lector de pantalla, #live (cada cambio, por
   MutationObserver), <html lang> y el título. Y nada desborda: scrollWidth > clientWidth + 1 en los contenedores de texto. */
const ES_WORDS = /[áéíóúñÁÉÍÓÚÑ¿¡ºª]|\b(de|del|la|las|el|los|en|para|sin|con|y|hoy|hora|abrir|abriendo|tiempo|datos|hace|lluvia|viento|sol|humedad|sensación|sugerencias|curado|galería|salvapantallas|tecla|salir|pantalla|información|grados|foco|comprobando|línea|red|obra|obras|mano|misma|navegador|arte|reposo|dato|mañana|pronóstico|días|ciudad|despejado|cubierto|nublado|niebla|llovizna|nieve|tormenta|chubascos|sombra|riesgo|evita|busca|lun|mié|jue|vie|sáb|dom|recorrer|clásicos|cine|autor|documentales|animación|todos|conciertos|vivo|grabado|modo|colección|destacado|selección|por|no se pudo)\b/i;
/* desbordes que YA estaban en la v11 (medidos con este mismo sondeo y --rev 6eafe22): el reloj (99 > 97 px) y los corchetes
   decorativos del QR (318 > 296 px: ::before/::after fuera de la imagen a propósito). No son texto traducido. */
const PRE_OVER = ["#foot.foot", ".au-qr"];
/* v16.9: la fila de pico y placa (.pypc, franja R4) está en castellano A PROPÓSITO (decisión del autor, README v16.9): se excluye
   del texto como la ficha; sus desbordes y su salida del lienzo SÍ se miden (sondeo sobre el DOM vivo). */
const TEXT_PROBE = `(function(){ var PRE=${JSON.stringify(PRE_OVER)}, tv=document.getElementById('tv'), clone=tv.cloneNode(true), f=clone.querySelector('.ficha'); if(f) f.parentNode.removeChild(f);
  var pp=clone.querySelectorAll('.pypc,.rates'); [].forEach.call(pp,function(e){ e.parentNode.removeChild(e); });
  var attrs=[]; [].forEach.call(document.querySelectorAll('[aria-label],[title],[alt],[data-text]'),function(e){ ['aria-label','title','alt','data-text'].forEach(function(a){ var v=e.getAttribute(a); if(v) attrs.push(v); }); });
  var over=[]; [].forEach.call(tv.querySelectorAll('.bands .c, .bands .c > *, .bands .ti, .bands .bd > span, .cap, .cap > span, .hud, .hud > *, .lx-card, .lx-card > span, .foot'),function(e){
    var cs=getComputedStyle(e); if(cs.display==='none'||!e.clientWidth) return; var k=(e.id?'#'+e.id:'')+'.'+String(e.className).replace(/\\s+/g,'.');
    if(e.scrollWidth>e.clientWidth+1&&PRE.indexOf(k)<0) over.push({c:k,t:e.textContent.slice(0,60),sw:e.scrollWidth,cw:e.clientWidth}); });
  /* además, ningún texto se sale del lienzo de 1920×1080 (una píldora que crece hacia la izquierda no desborda su caja: sale del lienzo).
     Abriendo una app (body.launch) la interfaz SALE del lienzo a propósito (coreografía v7): ahí no se mide. */
  var T=tv.getBoundingClientRect(), sc=T.width/1920; if(!document.body.classList.contains('launch')) [].forEach.call(tv.querySelectorAll('.bands .ti, .cap, .hud > *, .lx-card .nm, .lx-card .msg, .foot'),function(e){ var r=e.getBoundingClientRect(); if(!r.width) return;
    var l=(r.left-T.left)/sc, rr=(r.right-T.left)/sc; if(l<-0.5||rr>1920.5) over.push({c:(e.id?'#'+e.id:'')+'.'+String(e.className).replace(/\\s+/g,'.'),t:e.textContent.slice(0,60),fuera:[Math.round(l),Math.round(rr)]}); });
  return {text:clone.textContent.replace(/\\s+/g,' '), attrs:attrs, live:(window.__lives||[]).slice(), lang:document.documentElement.lang, title:document.title, over:over,
    vis:(document.getElementById('tv').innerText||'').replace(/\\s+/g,' ').slice(0,400)}; })()`;
const LIVE_REC = `(function(){ window.__lives=[]; var l=document.getElementById('live'); new MutationObserver(function(){ window.__lives.push(l.textContent); }).observe(l,{childList:true,characterData:true,subtree:true}); return 1; })()`;
async function suiteEnglish(B, C, U) {
  const rows = []; C.rep.english = rows;
  const st = async () => B.ev(PROBE), until = async (expr, ms) => { for (let t = 0; t < ms; t += 150) { if (await B.ev(expr)) return true; await sleep(150); } return false; };
  const grab = async (name) => { const r = await B.ev(TEXT_PROBE), hay = [r.text, ...r.attrs, ...r.live, r.title].join(" | "), bad = [];
      for (const part of [r.text, ...r.attrs, ...r.live, r.title]) { const m = ES_WORDS.exec(part); if (m) bad.push(`«${m[0]}» en «${part.slice(Math.max(0, m.index - 30), m.index + 30)}»`); }
      rows.push({ name, bad, over: r.over, lang: r.lang, live: r.live.slice(-3), vis: r.vis.slice(0, 300) });
      if (C.shots) await B.shot(path.join(C.out, `P8e-v12-C5-${name}.png`));
      C.check(`C5.${name}`, `${name}: 0 cadenas en español (DOM, aria, #live, título) · lang=en · nada desborda`, bad.length === 0 && r.lang === "en" && r.over.length === 0,
        `${bad.length ? bad.slice(0, 3).join(" · ") : "0 en español"} · lang ${r.lang} · desbordes ${r.over.length ? JSON.stringify(r.over.slice(0, 3)) : 0} · #live «${r.live.slice(-1)[0] || ""}»`, "0 · en · 0"); void hay; };
  const load = async (q, mode = {}) => { await B.setMode(Object.assign({ m47: true, rev: C.rev }, mode)); await B.load(U(q)); await B.ev(LIVE_REC); };
  // corredor · reposo con clima · autoría
  await load("?net=online&idle=2500&author=4500&authordwell=60000&authorfirst=1"); await sleep(600); await grab("01-corredor");
  await until("/\\binfo\\b/.test(document.getElementById('bands').className)&&!/\\b(out|gone)\\b/.test(document.getElementById('bands').className)", 9000); await sleep(900); await grab("02-reposo-clima");
  await until("/\\bau\\b/.test(document.getElementById('bands').className)", 12000); await sleep(1400); await grab("03-autoria");
  // el cassette de Arte (GALLERY · 15 WORKS) y el de HBO Max (logo 2025 apaisado), enfocados y armados
  for (const [n, a] of [["01b-cassette-arte", 10], ["01c-cassette-hbomax", 3]]) { await load(`?idle=600000&app=${a}`); await sleep(1800); await grab(n);
    if (C.shots) await B.shot(path.join(C.out, `P8e-v12-C5-${n}-detalle.png`), { x: 660, y: 150, width: 600, height: 860 }); }
  // lanzamiento · pantalla de paso · error
  await load("?idle=600000&launchback=0"); await sleep(2600);
  await B.key(13, "m47"); await sleep(600); await grab("04-lanzamiento-600ms");
  await sleep(1500); await grab("05-pantalla-de-paso"); await B.key(10009, "m47"); await sleep(1100);
  await B.ev(`window.P8EApps={launch:function(app,ok,err){ setTimeout(function(){ err&&err(new Error("test")); },200); }}; 1`);
  await B.key(13, "m47"); await sleep(1250 + 700); await grab("06-error-al-abrir"); await sleep(3400);
  // salvapantallas
  await load("?idle=600000&app=10&dwell=2500"); await sleep(1200); await B.key(13, "m47"); await sleep(4200); await grab("07-salvapantallas");
  // red: sin red · sin internet · comprobando
  await load("?net=nonet&idle=600000"); await sleep(800); await grab("08-sin-red");
  await load("?net=nointernet&idle=600000"); await sleep(800); await grab("09-sin-internet");
  await load("?wxdelay=60000&idle=600000"); await sleep(800); await grab("10-comprobando");
  // peor caso de ancho: último dato de hace 2 h 40 min, el estado del cielo más largo, UV alto y viento del NO
  const base = await (async () => { await load("?dev=1&idle=600000"); return B.ev(`new Promise(function(res){ var x=new XMLHttpRequest(); x.open("GET","data/weather-fixture.json"); x.onload=function(){ res(P8EWeather.normalize(JSON.parse(x.responseText),"CITY")); }; x.send(); })`); })();
  const worst = JSON.parse(JSON.stringify(base)); worst.ahora.code = 56; worst.ahora.desc = "FREEZING DRIZZLE"; worst.ahora.icon = "drizzle"; worst.ahora.vientoCard = "NW"; worst.ahora.temp = -12.4; worst.ahora.sens = -18.2;
  worst.dias.forEach((d) => { d.desc = "STORM AND HAIL"; d.icon = "storm"; d.max = -10; d.min = -22; }); worst.uv = { max: 11, nivel: "AVOID THE SUN" };
  const ts = Date.now() - (2 * 60 + 40) * 60000;
  await load("?wx=fail&net=online&idle=1500", { store: { "p8e.weather.last.test": JSON.stringify({ ts, clima: worst }) } });
  await until("/\\binfo\\b/.test(document.getElementById('bands').className)&&!/\\b(out|gone)\\b/.test(document.getElementById('bands').className)", 9000); await sleep(900);
  const when = await B.ev("document.getElementById('wxWhen').textContent");
  const pl = await B.ev("Math.round(document.getElementById('wxWhen').getBoundingClientRect().left-document.getElementById('tv').getBoundingClientRect().left)");
  C.check("C5.stale", "dato viejo: la píldora dice «Updated N … ago» (en lugar de «El tiempo · hace N min») y empieza dentro del lienzo", /^Updated 2 h 40 min ago$/.test(when) && pl >= 24, `${when} · x = ${pl} px`, "Updated 2 h 40 min ago · x ≥ 24 px (v11: 54)");
  await grab("11-peor-caso-ancho-dato-viejo");
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.weather.last.test": null } });
}

async function suiteClean(B, C, U) {
  const src = (f) => C.rev ? execFileSync("git", ["-C", C.gitTop, "show", `${C.rev}:${path.posix.join(C.gitPrefix, f)}`]).toString() : fs.readFileSync(path.join(C.root, f), "utf8");
  const code = (t) => tokenize(t).map((x) => x.v).join(" ");                       // comments out: the history notes may name what was removed
  const js = code(src("P8e/p8e.js")), css = src("P8e/p8e.css").replace(/\/\*[\s\S]*?\*\//g, ""), html = src("P8e/index.html").replace(/<!--[\s\S]*?-->/g, "");
  const dead = [["#flash / .flash", /id="flash"|\.flash\b/.test(js + css)], ["clase .focus (setFocusClass)", /setFocusClass|"focus" , i === ai/.test(js)], ["BG", /\bvar BG\b|\bBG ===/.test(js)],
    ['body[data-bg="art"]', /data-bg/.test(css + html + js)], ["VIEW", /\bVIEW\b/.test(js)]];
  C.check("C10.1", "código muerto fuera (auditoría 18)", dead.every((d) => !d[1]), dead.filter((d) => d[1]).map((d) => d[0]).join(", ") || "ninguno", "ninguno");
  await B.setMode({ m47: true, rev: C.rev, dropLogo: "netflix" }); await B.load(U("?idle=600000")); await sleep(800);
  const px = await B.ev(`(function(){ var c=document.querySelector('.item.rich .L4 canvas:nth-child(2)'); if(!c) return -1; var d=c.getContext('2d').getImageData(0,0,c.width,c.height).data, n=0; for(var i=3;i<d.length;i+=4) if(d[i]>40) n++; return n; })()`);
  C.check("C10.2", "app sin logo → monograma de respaldo en la pantallita", px > 200, px + " píxeles pintados", "> 200");
  if (C.shots) await B.shot(path.join(C.out, "monograma-sin-logo.png"), { x: 700, y: 120, width: 520, height: 820 });
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?idle=600000"));
  await B.key(39, "m47"); await sleep(250); await B.key(39, "m47"); await sleep(450);
  const g = await B.ev("document.getElementById('capNm').classList.contains('glitching')");
  C.check("C10.3", "temporizador del glitch guardado: una ráfaga no corta el glitch siguiente", g === true, `glitching a los 450 ms de la 2.ª tecla: ${g}`, "true");
  const wait = 60000 - (Date.now() % 60000);
  if (C.fast) { C.info("C10.4", "reloj alineado al minuto: omitido (--fast)"); return; }
  const before = await B.ev("document.getElementById('clk').textContent"); await sleep(wait + 1200);
  const after = await B.ev("document.getElementById('clk').textContent"), real = await B.ev(`(function(){ var d=new Date(); return ("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2); })()`);
  C.check("C10.4", "reloj alineado al minuto (cambia ≤ 1,2 s tras el minuto)", after === real && after !== before, `${before} → ${after} (reloj ${real})`, real);
}

async function suiteScan(B, C, U) {
  /* v12: TODO lo que carga la página debe ser ES5 (three.min.js ya no se carga) */
  await B.setMode({ m47: true, rev: C.rev }); B.scan = {}; await B.load(U("?idle=600000"));
  const files = Object.keys(B.scan);
  C.check("scan.0", "three.min.js no se carga", !files.some((f) => /three/.test(f)), JSON.stringify(files), "sin three.min.js");
  let total = 0, bytes = 0;
  for (const [f, r] of Object.entries(B.scan)) { total += r.hits; bytes += r.bytes;
    C.check("scan", `${f}: 0 construcciones posteriores a ES5`, r.hits === 0, r.hits ? JSON.stringify(Object.fromEntries(Object.entries(r.by).map(([k, v]) => [k, v.slice(0, 4)]))) : "0", "0"); }
  C.check("scan.all", `todo lo que se carga (${files.length} scripts, ${bytes} bytes): 0 construcciones > ES5`, total === 0 && files.length >= 4, `${total}`, "0");
  C.rep.scan = B.scan;
}


/* ======================================================================================================
   v13 · LA VUELTA INVERSA y LA AUTORÍA EN PIXEL ART, en la emulación M47 (teclas sólo keyCode, CSS
   recortado, ES5, sin getAnimations). Con ?dev=1 (window.P8E) para leer la pose de la pila y el estado del motor.
   ====================================================================================================== */
const QR_SWIFT = `import Foundation
import CoreImage
var bad = 0
for p in CommandLine.arguments.dropFirst() {
  guard let img = CIImage(contentsOf: URL(fileURLWithPath: p)) else { print("\\(p): no se pudo leer"); bad += 1; continue }
  let det = CIDetector(ofType: CIDetectorTypeQRCode, context: nil, options: [CIDetectorAccuracy: CIDetectorAccuracyHigh])
  let msgs = (det?.features(in: img) ?? []).compactMap { ($0 as? CIQRCodeFeature)?.messageString }
  print(msgs.isEmpty ? "SIN QR" : msgs.joined(separator: " | ")); if msgs.isEmpty { bad += 1 }
}
exit(bad == 0 ? 0 : 1)
`;
const PXMASK = `(function(i){ var c=document.querySelectorAll('.au-px')[i], k=c.width>300?3:1, d=c.getContext('2d').getImageData(0,0,c.width,c.height).data, s="", x, y;
  for(y=0;y<110;y++) for(x=0;x<227;x++) s+=d[((y*k)*c.width+x*k)*4+3]===255?"1":"0"; return s; })`;
const PXRECT = "JSON.stringify([].map.call(document.querySelectorAll('.au-px'),function(c){ var r=c.getBoundingClientRect(); return [Math.round(r.left),Math.round(r.top)]; }))";
/* v14 · how many screen pixels of the OPAQUE logical pixels of a canvas differ between two captures (a vs b) */
function maskedDiff(a, b, x0, y0, w, h, k, mask, thr = 2) { const A = pngDecode(a), Bp = pngDecode(b); let n = 0, rows = {}, max = 0;
  for (let by = 0; by < h; by++) for (let bx = 0; bx < w; bx++) { if (mask.charAt(by * w + bx) !== "1") continue;
    for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) { const X = x0 + bx * k + i, Y = y0 + by * k + j; if (X >= A.w || Y >= A.h) continue; const q = (Y * A.w + X) * 4;
      const dd = Math.max(Math.abs(A.px[q] - Bp.px[q]), Math.abs(A.px[q + 1] - Bp.px[q + 1]), Math.abs(A.px[q + 2] - Bp.px[q + 2])); if (dd > max) max = dd;
      if (dd > thr) { n++; rows[by] = 1; } } }
  return { px: n, max, rows: Object.keys(rows).map(Number).sort((p, q) => p - q) }; }
function qrDecode(C, file) { const sw = path.join(C.out, "qr_decode.swift"); fs.writeFileSync(sw, QR_SWIFT);   // always rewritten: never run a file planted in --out
  try { return execFileSync("swift", [sw, file], { timeout: 120000 }).toString().trim(); } catch (e) { return "ERROR " + String(e.stdout || e.message).trim().slice(0, 200); } }
/* nítido = cada píxel lógico (3×3 px de pantalla) es de un solo color: muestreo de TODOS los bloques del canvas */
function crispBlocks(buf, x0, y0, w, h, k, mask) { const I = pngDecode(buf); let bad = 0, n = 0, ex = null;
  for (let by = 0; by < h; by++) for (let bx = 0; bx < w; bx++) { const X = x0 + bx * k, Y = y0 + by * k; if (X + k > I.w || Y + k > I.h) continue;
    if (mask && mask.charAt(by * w + bx) !== "1") continue; n++;     // sólo los píxeles lógicos OPACOS del canvas (lo transparente deja ver la obra)
    const o = (Y * I.w + X) * 4; let same = true;
    for (let j = 0; j < k && same; j++) for (let i = 0; i < k; i++) { const q = ((Y + j) * I.w + X + i) * 4; if (I.px[q] !== I.px[o] || I.px[q + 1] !== I.px[o + 1] || I.px[q + 2] !== I.px[o + 2]) { same = false; break; } }
    if (!same) { bad++; if (!ex) ex = [bx, by]; } }
  return { n, bad, ex }; }
async function suiteV13(B, C, U) {
  const st = (e) => B.ev(e), waitFor = async (expr, ms) => { for (let t = 0; t < ms; t += 100) { if (await B.ev(expr)) return true; await sleep(100); } return false; };
  const POSE = "JSON.stringify(P8E.cassPose())", diffPose = (a, b) => { a = JSON.parse(a); b = JSON.parse(b); return Object.keys(a).filter((k) => a[k] !== b[k]); };
  /* ---- (a) la vuelta inversa ---- */
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?dev=1&launchback=0&idle=600000&retg=0&noscreen=0"));
  const p0 = await st(POSE);
  await B.key(13, "m47"); await sleep(1250 + 900);
  await B.key(10009, "m47"); await sleep(400);
  let s = JSON.parse(await st("JSON.stringify({ph:P8E.stats().launch.phase,fx:P8E.stats().fx,anims:P8E.stats().launch.anims,ign:P8E.stats().launch.ignored,app:P8E.state().app})"));
  C.check("V13.R1", "Back (10009): empieza la vuelta inversa (fase back, electricidad con el tiempo invertido, portal)", s.ph === "back" && s.fx.on && s.fx.portalOn && s.anims > 10, `fase ${s.ph} · fx ${s.fx.on} · portal ${s.fx.portalOn} · t ${s.fx.t} · pistas ${s.anims}`, "back · true · true · > 10 pistas");
  await B.key(39, "m47"); await B.key(13, "m47"); await B.key(37, "m47"); await sleep(80);
  let s2 = JSON.parse(await st("JSON.stringify({ph:P8E.stats().launch.phase,ign:P8E.stats().launch.ignored,app:P8E.state().app})"));
  C.check("V13.R2", "teclas ignoradas durante la vuelta (→ Enter ←)", s2.ign - s.ign === 3 && s2.app === s.app && s2.ph === "back", `ignoradas +${s2.ign - s.ign} · app ${s.app}→${s2.app} · ${s2.ph}`, "+3 · sin cambio · back");
  await sleep(1300);
  s = JSON.parse(await st("JSON.stringify({ph:P8E.stats().launch.phase,rw:P8E.stats().launch.rewinds,fb:P8E.stats().launch.backFallbacks,hud:getComputedStyle(document.querySelector('.hud')).opacity,lx:document.getElementById('lx').className,raf:__m47.rafMax,gl:__m47.glContexts})"));
  C.check("V13.R3", "la vuelta acaba por onfinish: «modo inicial» (UI de vuelta, sin pantalla de paso)", s.ph === "" && s.rw === 1 && s.fb === 0 && /^lx$/.test(s.lx), `fase «${s.ph}» · espejos ${s.rw} · respaldos ${s.fb} · lx «${s.lx}» · hud ${s.hud}`, "« » · 1 · 0 · lx");
  await sleep(500); const p1 = await st(POSE), d1 = diffPose(p0, p1);
  C.check("V13.R4", "pose de las 17 capas tras la vuelta = reposo de antes de abrir", d1.length === 0 && Object.keys(JSON.parse(p0)).length === 17, `${Object.keys(JSON.parse(p0)).length} campos · ${d1.length} distintos ${JSON.stringify(d1)}`, "17 · 0");
  C.check("V13.R5", "un rAF y un contexto WebGL en ida + vuelta", s.raf <= 1 && s.gl <= 1, `rAF máx ${s.raf} · GL ${s.gl}`, "≤ 1 · ≤ 1");
  let k1 = await (async () => { await B.key(39, "m47"); await sleep(1100); return st("P8E.state().app"); })();
  C.check("V13.R6", "después se navega", k1 === 2, k1, "2");
  /* sin onfinish (la Animation de M47 no está verificada en el TV): el respaldo termina la vuelta */
  await B.setMode({ m47: true, rev: C.rev, noOnfinish: true }); await B.load(U("?dev=1&launchback=0&idle=600000&retg=0&noscreen=0"));
  const q0 = await st(POSE); await B.key(13, "m47"); await sleep(1250 + 400 + 600); await B.key(10009, "m47"); await sleep(1250 + 400 + 600);
  s = JSON.parse(await st("JSON.stringify({ph:P8E.stats().launch.phase,fb:P8E.stats().launch.backFallbacks})")); await sleep(400);
  const d2 = diffPose(q0, await st(POSE));
  C.check("V13.R7", "sin onfinish: la vuelta acaba por su temporizador de respaldo y la pose es el reposo", s.ph === "" && s.fb >= 1 && d2.length === 0, `fase «${s.ph}» · respaldos ${s.fb} · ${d2.length} distintos`, "« » · ≥ 1 · 0");
  /* Arte: salvapantallas → cassette, el espejo sin portal ni velo */
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?dev=1&launchback=0&idle=600000&app=10"));
  const a0 = await st(POSE); await B.key(13, "m47"); await sleep(2400);
  const sv = await st("P8E.state().artMode"); await B.key(39, "m47"); await sleep(350);
  s = JSON.parse(await st("JSON.stringify({ph:P8E.stats().launch.phase,saver:P8E.state().artMode,fx:P8E.stats().fx,arte:document.body.classList.contains('launch-arte')})"));
  C.check("V13.R8", "Arte: una tecla en el salvapantallas → vuelta inversa sin portal (sólo electricidad)", sv === true && s.ph === "back" && !s.saver && s.fx.on && !s.fx.portalOn && s.arte, `salvapantallas ${sv} → fase ${s.ph} · fx ${s.fx.on} · portal ${s.fx.portalOn} · launch-arte ${s.arte}`, "true → back · true · false · true");
  await sleep(1600); const d3 = diffPose(a0, await st(POSE)); s = JSON.parse(await st("JSON.stringify({ph:P8E.stats().launch.phase,app:P8E.state().app})"));
  C.check("V13.R9", "Arte: al acabar, el cassette 15 en reposo exacto", s.ph === "" && s.app === 10 && d3.length === 0, `fase «${s.ph}» · app ${s.app} · ${d3.length} distintos ${JSON.stringify(d3)}`, "« » · 10 · 0");
  /* reduced-motion: la vuelta es un fundido breve (sólo opacidad), sin espejo */
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.reduce": "1" } }); await B.load(U("?dev=1&launchback=0&idle=600000&retg=0&noscreen=0"));
  await B.key(13, "m47"); await sleep(600); await B.key(27, "m47"); await sleep(70);
  const op = +(await st("getComputedStyle(document.getElementById('lx')).opacity")); s = JSON.parse(await st("JSON.stringify({ph:P8E.stats().launch.phase,rw:P8E.stats().launch.rewinds,cuts:P8E.stats().launch.cuts})"));
  await sleep(600); const ph2 = await st("P8E.stats().launch.phase");
  C.check("V13.R10", "reduced-motion: vuelta por fundido (opacidad intermedia a 70 ms, sin espejo) y acaba", op > 0.05 && op < 0.95 && s.rw === 0 && ph2 === "", `opacidad ${op.toFixed(2)} · espejos ${s.rw} · fase luego «${ph2}»`, "0,05–0,95 · 0 · « »");
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.reduce": null } });
  /* ---- (b) la autoría en pixel art ---- */
  const AQ = "?dev=1&idle=1500&author=2500&authorfirst=1&authordwell=60000&net=online";
  await B.load(U(AQ));
  const up = await waitFor("P8E.stats().author.phase==='up'", 14000);
  const A = JSON.parse(await st("JSON.stringify(P8E.stats().author)")), px = A.px;
  C.check("V13.A1", "la autoría llega a su reposo (giro + papiro + tinta) y el estampado ya era exacto antes del volcado", up && px.exact[0] === 0 && px.exact[1] === 0 && px.restAt > 60 && px.restAt < 110, `reposo ${up} en f ${px.restAt} (${Math.round(px.restAt * 33.33)} ms) · faltaban ${JSON.stringify(px.exact)} px`, "true · f 60–110 · [0,0]");
  C.check("V13.A2", "dos canvas a baja resolución (227×110 lógicos, ×3 entero, pixelated) en píxel entero", JSON.stringify(px.buffers) === "[[227,110],[227,110]]" && px.css.every((c) => c[4] === "pixelated" && /^\d+px$/.test(c[0]) && /^\d+px$/.test(c[1]) && c[2] === "681px" && c[3] === "330px"), JSON.stringify(px.buffers) + " " + JSON.stringify(px.css), "[[227,110],[227,110]] · pixelated · 681×330 en px enteros");
  C.check("V13.A3", "partículas ≤ 384 por lado (una por celda de tinta; 8×4 si no caben)", px.parts[0] <= 384 && px.parts[1] <= 384 && px.parts[0] > 50 && px.parts[1] > 50, `${JSON.stringify(px.parts)} · celdas ${JSON.stringify(px.cell)}`, "≤ 384 cada lado");
  const shotF = path.join(C.out, "v13-autoria-1920x1080.png"), sb = await B.shot(shotF);
  const dec = qrDecode(C, shotF);
  C.check("V13.A4", "QR final decodificable con CoreImage sobre la captura 1920×1080, módulo ≥ 6 px", /https:\/\/www\.sergio-ayala\.com/.test(dec) && px.qr.cssModule >= 6, `«${dec.split("\n").pop()}» · módulo ${px.qr.cssModule} px · placa ${px.qr.cssW} px en (${px.qr.cssX},${px.qr.cssY})`, "https://www.sergio-ayala.com · ≥ 6");
  /* la nitidez se mide SIN las dos capas de encima de toda la pantalla (líneas de barrido .scan y viñeta .vig, que por diseño
     cubren también la autoría) y el corredor (.viewport: sus estrellas pasan por delante): se ocultan sólo para esta captura */
  const NOV = "(function(on){ var e=document.getElementById('m47nov'); if(on&&!e){ e=document.createElement('style'); e.id='m47nov'; e.textContent='.scan,.vig,.viewport,#cap{visibility:hidden!important}'; document.head.appendChild(e); } if(!on&&e) e.parentNode.removeChild(e); return 1; })";
  await st(NOV + "(true)"); await sleep(120); const sbc = await B.shot(C.shots ? path.join(C.out, "v13-autoria-sin-barrido.png") : null); await st(NOV + "(false)");
  const mL = await st(PXMASK + "(0)"), mR = await st(PXMASK + "(1)");
  const RC = JSON.parse(await st(PXRECT));   // v14: where each canvas really is (the right one sits 1 logical px higher)
  const cL = crispBlocks(sbc, RC[0][0], RC[0][1], 227, 110, 3, mL), cR = crispBlocks(sbc, RC[1][0], RC[1][1], 227, 110, 3, mR);
  C.check("V13.A5", "píxeles nítidos: cada píxel lógico (3×3) de un solo color en los dos canvas (sin lo que va encima por diseño: .scan, .vig, las estrellas del corredor y la sombra del rótulo)", cL.bad === 0 && cR.bad === 0, `izq ${cL.bad}/${cL.n} · der ${cR.bad}/${cR.n} bloques mezclados ${JSON.stringify(cL.ex || cR.ex)}`, "0 / 0");
  /* v14 · C4: the shadow of the caption (#cap) must not fall on the OPAQUE pixels of the authorship rolls. Same frame (rest), the
     layers on top hidden as above but the caption kept; capture with its shadow and without it (box-shadow:none): 0 pixels of
     either canvas may change. The background art (only behind transparent pixels) is not compared. */
  { const HIDE = "(function(on){ var e=document.getElementById('m47c4'); if(on&&!e){ e=document.createElement('style'); e.id='m47c4'; e.textContent='.scan,.vig,.viewport{visibility:hidden!important}'; document.head.appendChild(e); } if(!on&&e) e.parentNode.removeChild(e); return 1; })";
    const NOSH = "(function(on){ var e=document.getElementById('m47c4b'); if(on&&!e){ e=document.createElement('style'); e.id='m47c4b'; e.textContent='#cap{box-shadow:none!important}'; document.head.appendChild(e); } if(!on&&e) e.parentNode.removeChild(e); return 1; })";
    await st(HIDE + "(true)"); await sleep(150); const withSh = await B.shot(path.join(C.out, "P8e-v14-C4-autoria-con-sombra.png"));
    await st(NOSH + "(true)"); await sleep(150); const noSh = await B.shot(null); await st(NOSH + "(false)"); await st(HIDE + "(false)");
    const R4 = JSON.parse(await st(PXRECT)), dR = maskedDiff(withSh, noSh, R4[1][0], R4[1][1], 227, 110, 3, mR, 0), dL = maskedDiff(withSh, noSh, R4[0][0], R4[0][1], 227, 110, 3, mL, 0);   // umbral 0: la cola de la sombra cambia 1–2 niveles
    const capTop = await st("Math.round(document.getElementById('cap').getBoundingClientRect().top)");
    await B.shot(path.join(C.out, "P8e-v14-C4-rotulo-y-rollo.png"), { x: 1239, y: 784, width: 681, height: 120 });   // sólo la vara del rollo y el rótulo: sin el sello
    C.rep.c4 = { right: dR, left: dL, rects: R4, capTop };
    C.check("V14.C4", "la sombra del rótulo no pisa el rollo derecho (ni el izquierdo): 0 píxeles opacos de los canvas cambian (ni 1 nivel) con o sin box-shadow", dR.px === 0 && dL.px === 0, `der ${dR.px} px (máx ${dR.max} niveles; filas lógicas ${JSON.stringify(dR.rows.slice(0, 8))}) · izq ${dL.px} px · canvas der en y ${R4[1][1]} (fondo ${R4[1][1] + 330}) · rótulo en y ${capTop}`, "0 · 0"); }
  const m = JSON.parse(await st("JSON.stringify({raf:__m47.rafMax,gl:__m47.glContexts,err:__m47.errors.length})"));
  C.check("V13.A6", "un rAF, un contexto WebGL, 0 errores con la autoría", m.raf <= 1 && m.gl <= 1 && m.err === 0 && B.errors.length === 0, JSON.stringify(m) + " " + JSON.stringify(B.errors).slice(0, 200), "≤1 · ≤1 · 0");
  /* una tecla que no navega (Esc) → se cierra el papiro y SÓLO después giran las franjas de vuelta */
  await B.key(27, "m47"); await sleep(300);
  const b1 = JSON.parse(await st("JSON.stringify({ph:P8E.stats().author.phase,au:document.getElementById('bands').classList.contains('au'),px:document.getElementById('bands').classList.contains('px'),back:P8E.stats().author.px.back})"));
  await sleep(29 * 33.4 + 760 + 500);
  const b2 = JSON.parse(await st("JSON.stringify({on:P8E.stats().author.on,bands:document.getElementById('bands').className,fb:P8E.stats().author.fallbacks,alive:P8E.stats().author.px.alive})"));
  C.check("V13.A7", "cierre: el papiro se enrolla con las franjas aún giradas y luego vuelven a la info", b1.ph === "back" && b1.au && b1.px && !b2.on && /\binfo\b/.test(b2.bands) && !/\b(au|px)\b/.test(b2.bands) && b2.fb === 0, `a 300 ms: ${JSON.stringify(b1)} · al final: ${JSON.stringify(b2)}`, "back · au · px → info sin au/px · respaldos 0");
  /* navegar con la autoría arriba: el pixel art se va EN EL ACTO y las franjas salen (regla v6) */
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U(AQ)); await waitFor("P8E.stats().author.phase==='up'", 14000);
  await B.key(39, "m47"); await sleep(40);
  const n1 = await st("document.getElementById('bands').className"); await sleep(900);
  const n2 = JSON.parse(await st("JSON.stringify({on:P8E.stats().author.on,bands:document.getElementById('bands').className,px:P8E.stats().author.px.on})"));
  C.check("V13.A8", "navegar con la autoría: canvas fuera en el acto, franjas fuera y de vuelta a la info por corte", !/\bpx\b/.test(n1) && /\bout\b/.test(n1) && !n2.on && /\bgone\b/.test(n2.bands) && !/\bau\b/.test(n2.bands), `a 40 ms «${n1}» · luego ${JSON.stringify(n2)}`, "sin px, out → gone, sin au");
  /* respaldo de webkitImageSmoothingEnabled: búfer ×3 y escalado entero DENTRO del canvas */
  await B.load(U(AQ + "&auup=1")); await waitFor("P8E.stats().author.phase==='up'", 14000);
  const U2 = JSON.parse(await st("JSON.stringify({px:P8E.stats().author.px,sm:[].map.call(document.querySelectorAll('.au-px'),function(c){ var x=c.getContext('2d'); return [x.imageSmoothingEnabled,x.webkitImageSmoothingEnabled]; })})"));
  await st(NOV + "(true)"); await sleep(120); const sb2 = await B.shot(C.shots ? path.join(C.out, "v13-autoria-auup.png") : null); await st(NOV + "(false)"); const RC2 = JSON.parse(await st(PXRECT)), u1 = crispBlocks(sb2, RC2[0][0], RC2[0][1], 227, 110, 3, await st(PXMASK + "(0)")), u2 = crispBlocks(sb2, RC2[1][0], RC2[1][1], 227, 110, 3, await st(PXMASK + "(1)"));
  C.check("V13.A9", "?auup=1: búfer 681×330, imageSmoothingEnabled y webkitImageSmoothingEnabled = false, y nítido", JSON.stringify(U2.px.buffers) === "[[681,330],[681,330]]" && U2.px.up && U2.sm.every((v) => v[0] === false && v[1] !== true) && u1.bad === 0 && u2.bad === 0, `${JSON.stringify(U2.px.buffers)} · ${JSON.stringify(U2.sm)} · mezclados ${u1.bad}/${u2.bad}`, "[[681,330],[681,330]] · false · 0/0");
  /* sin sello (?nobrand=1): degradación limpia; el QR sigue */
  await B.load(U(AQ + "&nobrand=1")); await waitFor("P8E.stats().author.phase==='up'", 14000);
  const N = JSON.parse(await st("JSON.stringify(P8E.stats().author)")); const shotN = path.join(C.out, "v13-autoria-nobrand.png"); await B.shot(shotN); const decN = qrDecode(C, shotN);
  C.check("V13.A10", "?nobrand=1: sin sello (0 unidades de sello), sólo firma, reposo exacto y QR legible", N.seal === "off" && N.px.units[1].seal === 0 && N.px.exact[1] === 0 && /sergio-ayala\.com/.test(decN), `sello ${N.seal} · unidades ${JSON.stringify(N.px.units[1])} · QR «${decN.split("\n").pop()}»`, "off · seal 0 · legible");
  /* reduced-motion: por corte (sin partículas ni desenrollado) */
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.reduce": "1" } }); await B.load(U(AQ));
  const r0 = await waitFor("P8E.stats().author.on", 14000); const R = JSON.parse(await st("JSON.stringify(P8E.stats().author)"));
  C.check("V13.A11", "reduced-motion: la autoría entra por corte (ya en reposo, 1 dibujo, 0 partículas vivas, sin pasos del motor)", r0 && R.phase === "up" && R.px.steps === 0 && R.px.alive[0] + R.px.alive[1] === 0 && R.px.draws <= 2, `fase ${R.phase} · pasos ${R.px.steps} · vivas ${JSON.stringify(R.px.alive)} · dibujos ${R.px.draws}`, "up · 0 · 0 · ≤ 2");
  await B.key(27, "m47"); await sleep(60);
  const R2 = await st("JSON.stringify({on:P8E.stats().author.on,bands:document.getElementById('bands').className})");
  C.check("V13.A12", "reduced-motion: el cierre también por corte", /"on":false/.test(R2) && !/\b(au|px)\b/.test(JSON.parse(R2).bands), R2, "on false · sin au/px");
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.reduce": null } });
  if (C.shots) { await B.load(U(AQ)); await waitFor("P8E.stats().author.phase==='up'", 14000); await B.shot(path.join(C.out, "v13-autoria-m47.png")); }
}
/* ======================================================================================================
   sound · sound.js INTEGRATED: every sound on its movement. Times = README v13 «Tabla de sonido».
   ====================================================================================================== */
/* author · v13.1: la autoría es ESPORÁDICA (intervalo al azar + probabilidad), con semilla en las pruebas */
async function suiteAuthor(B, C, U) {
  const st = (e) => B.ev(e), waitFor = async (expr, ms) => { for (let t = 0; t < ms; t += 250) { if (await B.ev(expr)) return true; await sleep(250); } return false; };
  const AS = () => st("JSON.stringify(P8E.stats().author)").then(JSON.parse);
  const BASE = "?dev=1&idle=3000&authorfirst=1&authordwell=2000&net=online";
  await B.setMode({ m47: true, rev: C.rev });
  /* A1 · intervalos aleatorios dentro de [min, max] y distintos entre sí */
  await B.load(U(BASE + "&authorseed=7&authormin=20000&authormax=60000&authorp=1"));
  const got4 = await waitFor("P8E.stats().author.ints.length>=4", 330000); let a = await AS();
  const inR = a.ints.every((v) => v >= 20000 - 50 && v <= 60000 + 50), distinct = new Set(a.ints.map((v) => Math.round(v / 100))).size === a.ints.length;
  C.check("A1", "azar: ≥3 intervalos medidos (panel visible), todos en [20 s, 60 s] y distintos entre sí (semilla 7, p = 1)", got4 && a.random && !a.fixed && a.skips === 0 && inR && distinct, `ints ${JSON.stringify(a.ints)} · skips ${a.skips} · random ${a.random}`, "≥4 · en [20000,60000] · distintos · 0 saltadas");
  /* A2 · con p = 0,5 se saltan oportunidades (contador skips) */
  await B.load(U(BASE + "&authorseed=7&authormin=6000&authormax=9000&authorp=0.5"));
  const gotSkip = await waitFor("P8E.stats().author.skips>=1", 120000); await waitFor("P8E.stats().author.shows>=1", 120000); a = await AS();
  C.check("A2", "azar: con authorp = 0,5 y semilla fija se registran oportunidades saltadas (y también hay autorías)", gotSkip && a.skips >= 1 && a.shows >= 1, `skips ${a.skips} · shows ${a.shows} · ints ${JSON.stringify(a.ints)}`, "skips ≥ 1 · shows ≥ 1");
  /* A3 · por defecto: nada antes de 15 min de panel visible (el siguiente intervalo programado >= 15 min, para 3 semillas) */
  const rows = [];
  for (const sd of [1, 7, 12345]) { await B.load(U("?dev=1&idle=3000&net=online&authorfirst=1&authorseed=" + sd)); await waitFor("P8E.stats().idle==='on'", 15000); await sleep(1500); a = await AS(); rows.push({ sd, need: a.need, next: a.nextInMs, shows: a.shows, min: a.min, max: a.max, p: a.p, running: a.running }); }
  C.check("A3", "por defecto: min 15 min · max 45 min · p 0,5; intervalo en curso ∈ [15, 45] min y 0 autorías (el siguiente disparo está a > 14 min)", rows.every((r) => r.min === 900000 && r.max === 2700000 && r.p === 0.5 && r.need >= 900000 && r.need <= 2700000 && r.shows === 0 && r.running && r.next > 14 * 60000), JSON.stringify(rows), "need ∈ [900000,2700000] · shows 0 · next > 840000");
  /* A4 · ?author=ms fija el intervalo y desactiva el azar */
  await B.load(U(BASE + "&author=20000"));
  const got3 = await waitFor("P8E.stats().author.ints.length>=2", 110000); a = await AS();
  C.check("A4", "?author=20000: intervalo fijo (azar apagado, sin saltadas), medidas ≈ 20 s", got3 && a.fixed && !a.random && a.skips === 0 && a.every === 20000 && a.ints.every((v) => Math.abs(v - 20000) <= 50), `ints ${JSON.stringify(a.ints)} · fixed ${a.fixed} · skips ${a.skips}`, "20000 ± 50 · fixed");
}
async function suiteSound(B, C, U) {
  const FR = 33.4, SNDQ = "JSON.stringify({log:__m47.snd.log,keys:__m47.snd.keys,made:__m47.snd.made,live:__m47.snd.set.size,maxLive:__m47.snd.maxLive,st:window.P8ESound&&P8ESound.stats(),raf:__m47.rafMax,gl:__m47.glContexts,err:__m47.errors.length})";
  const get = async () => JSON.parse(await B.ev(SNDQ)), waitFor = async (expr, ms) => { for (let t = 0; t < ms; t += 100) { if (await B.ev(expr)) return true; await sleep(100); } return false; };
  const near = (got, exp) => got != null && Math.abs(got - exp) <= FR, fmt = (x) => x == null ? "—" : x.toFixed(1);
  C.rep.sound = { launch: {}, author: null, burst: null };
  let errs = 0;
  const CLEAN = { "p8e.sound.mute": null, "p8e.sound.vol": null, "p8e.reduce": null }, mode = (x) => B.setMode(Object.assign({ m47: true, rev: C.rev, snd: true }, x || {}, { store: Object.assign({}, CLEAN, (x && x.store) || {}) }));
  /* S0 · cargado, antes de p8e.js, ES5; antes de un gesto no existe el contexto */
  await mode(); B.scan = {}; await B.load(U("?launchback=0&idle=600000&retg=0&noscreen=0"));
  const order = await B.ev("[].map.call(document.scripts,function(s){ return (s.getAttribute('src')||'').replace(/.*\\//,''); }).filter(Boolean).join(',')");
  const sc = B.scan["/P8e/sound.js"];
  C.check("S0.1", "sound.js se carga, antes de p8e.js, y es ES5 (0 construcciones > ES5 en la emulación M47)", /sound\.js,p8e\.js(,|$)/.test(order) && sc && sc.hits === 0 && await B.ev("typeof P8ESound.play") === "function", `${order} · escáner ${sc ? sc.hits : "sin cargar"}`, "…,sound.js,p8e.js · 0");
  let g = await get();
  C.check("S0.2", "antes del primer gesto: sin contexto y 0 nodos", g.st.ctx === "none" && g.made === 0, `ctx ${g.st.ctx} · nodos ${g.made}`, "none · 0");
  /* S1 · lanzar + volver, ×1 y ×2 */
  const LAUNCH = [["launchStart", 0, 130], ["launchCrack", 130, 300], ["launchDive", 640, 610], ["launchVeil", 1100, 150]];
  for (const S of [1, 2]) {
    await mode(); await B.load(U("?launchback=0&idle=600000&retg=0&noscreen=0" + (S !== 1 ? "&launchslow=" + S : "")));
    await B.key(13, "m47"); await sleep(1250 * S + 900); await B.key(10009, "m47"); await sleep(1250 * S + 1200);
    g = await get(); errs += g.err;
    const ev = g.log.filter((x) => /^(launch|return)/.test(x.ev)), names = ev.map((x) => x.ev).join(" ");
    const vis = JSON.parse(await B.ev(`JSON.stringify([__m47.snd.anim0(${(ev[0] || {}).t || 0}),__m47.snd.anim0(${(ev.find((x) => x.ev === "returnStart") || {}).t || 0})])`));
    const exp = "launchStart launchCrack launchDive launchVeil returnStart returnAssembled";
    const t0 = ev[0] ? ev[0].t : 0, tr = (ev.find((x) => x.ev === "returnStart") || {}).t, kEnter = (g.keys.find((k) => k[0] === 13) || [])[1], kBack = (g.keys.find((k) => k[0] === 10009) || [])[1];
    const rows = [];
    for (const [n, at, dur] of LAUNCH) { const x = ev.find((y) => y.ev === n); rows.push({ ev: n, exp: at * S, got: x ? x.t - t0 : null, dur: x && x.o.dur, expDur: dur * S, r: x && x.r }); }
    const xs = ev.find((y) => y.ev === "returnStart"), xa = ev.find((y) => y.ev === "returnAssembled");
    rows.push({ ev: "returnStart", exp: 0, got: xs && kBack != null ? xs.t - kBack : null, dur: xs && xs.o.dur, expDur: 610 * S, r: xs && xs.r, ref: "Back" });
    rows.push({ ev: "returnAssembled", exp: 1100 * S, got: xa && tr != null ? xa.t - tr : null, dur: undefined, expDur: undefined, r: xa && xa.r, ref: "returnStart" });
    C.rep.sound.launch[S] = { events: ev, rows, kEnter, kBack, visualStart: vis };
    const tR0 = xs ? xs.t : null;
    C.info(`S1.${S}v`, `reloj de la imagen (Animation.startTime de las pistas WAAPI): la ida arranca ${vis[0] != null ? fmt(vis[0] - t0) : "—"} ms después de launchStart y la vuelta ${vis[1] != null && tR0 != null ? fmt(vis[1] - tR0) : "—"} ms después de returnStart; ` +
      `sonido respecto a ese arranque: ${rows.filter((r) => r.ref !== "Back" && r.ref !== "returnStart").map((r) => `${r.ev} ${vis[0] != null && r.got != null ? fmt(r.got - (vis[0] - t0)) : "—"}/${r.exp}`).join(" · ")} · returnStart ${vis[1] != null && tR0 != null ? fmt(tR0 - vis[1]) : "—"}/0 · returnAssembled ${vis[1] != null && xa ? fmt(xa.t - vis[1]) : "—"}/${1100 * S}` +
      ` · Enter → launchStart ${fmt(t0 - kEnter)} ms (lo decide el launcher: un Enter con el corredor aún en vuelo espera a settle, v7)`);
    C.check(`S1.${S}a`, `lanzar + volver (×${S}): los 6 eventos, en orden, una vez cada uno`, names === exp, names, exp);
    C.check(`S1.${S}b`, `lanzar + volver (×${S}): cada evento a su ms (±1 fotograma; launch* desde launchStart, returnStart desde la tecla Back, returnAssembled desde returnStart) y con su dur ×${S}`,
      rows.every((r) => near(r.got, r.exp) && (r.expDur === undefined || r.dur === r.expDur)),
      rows.map((r) => `${r.ev} ${fmt(r.got)}/${r.exp}${r.expDur !== undefined ? " dur " + r.dur : ""}`).join(" · "), "|Δ| ≤ 33,4 ms");
    C.check(`S1.${S}c`, `lanzar + volver (×${S}): todos sonaron (play = true, nodos creados, contexto running)`, ev.every((x) => x.r === true) && g.made > 0 && g.st.ctx === "running",
      `${ev.filter((x) => x.r).length}/${ev.length} true · nodos ${g.made} · ctx ${g.st.ctx} · voces máx ${g.st.maxVoices}`, "6/6 · > 0 · running");
  }
  /* S2 · autoría: el giro y el papiro, abrir y cerrar, con el reloj del motor */
  const AQ = "?dev=1&idle=1500&author=2500&authorfirst=1&authordwell=60000&net=online";
  await mode(); await B.load(U(AQ));
  await B.key(71, "m47");                                  // una tecla que no navega: el gesto que desbloquea el audio
  const up = await waitFor("P8E.stats().author.phase==='up'", 16000); await sleep(300);
  await B.key(27, "m47"); await sleep(29 * 33.4 + 760 + 700);
  g = await get(); errs += g.err;
  const au = g.log.filter((x) => /^(author|bands)/.test(x.ev)), kEsc = (g.keys.filter((k) => k[0] === 27).pop() || [])[1];
  const fIn = au.find((x) => x.ev === "authorFlip" && x.o.dir === "in"), uOpen = au.find((x) => x.ev === "authorUnroll" && x.o.dir === "open");
  const uClose = au.find((x) => x.ev === "authorUnroll" && x.o.dir === "close"), fOut = au.find((x) => x.ev === "authorFlip" && x.o.dir === "out");
  const arow = [
    { ev: "authorFlip in", ref: "auFire", exp: 0, got: fIn ? 0 : null, dur: fIn && fIn.o.dur, expDur: 760 },
    { ev: "authorUnroll open", ref: "authorFlip in", exp: 26 * 1000 / 30, got: uOpen && fIn ? uOpen.t - fIn.t : null, dur: uOpen && uOpen.o.dur, expDur: 18 * 1000 / 30, hit: uOpen && uOpen.o.hit, expHit: 19 * 1000 / 30 },
    { ev: "authorUnroll close", ref: "Esc", exp: 10 * 1000 / 30, got: uClose && kEsc != null ? uClose.t - kEsc : null, dur: uClose && uClose.o.dur, expDur: 14 * 1000 / 30, hit: uClose && uClose.o.hit, expHit: 14 * 1000 / 30 },
    { ev: "authorFlip out", ref: "Esc", exp: 29 * 1000 / 30, got: fOut && kEsc != null ? fOut.t - kEsc : null, dur: fOut && fOut.o.dur, expDur: 760 }];
  C.rep.sound.author = { events: au, rows: arow, kEsc };
  const aseq = au.map((x) => x.ev + (x.o.dir ? ":" + x.o.dir : "")).join(" ");
  C.check("S2.a", "autoría: bandsIn → giro → papiro abre → (Esc) papiro cierra → giro de vuelta, una vez cada uno", up && aseq === "bandsIn authorFlip:in authorUnroll:open authorUnroll:close authorFlip:out", aseq, "bandsIn authorFlip:in authorUnroll:open authorUnroll:close authorFlip:out");
  const close = (a, b) => a != null && b != null && Math.abs(a - b) < 0.5;
  C.check("S2.b", "autoría: cada evento a su fotograma del motor (±1 fotograma), con dur/hit de AUT×33,3 y el giro de 760",
    arow.every((r) => near(r.got, r.exp) && close(r.dur, r.expDur) && (r.expHit === undefined || close(r.hit, r.expHit))),
    arow.map((r) => `${r.ev} ${fmt(r.got)}/${fmt(r.exp)} (desde ${r.ref}) dur ${r.dur != null ? fmt(r.dur) : "—"}${r.expHit !== undefined ? " hit " + fmt(r.hit) : ""}`).join(" · "), "|Δ| ≤ 33,4 ms");
  const bi = au.find((x) => x.ev === "bandsIn");
  C.check("S2.c", "franjas: bandsIn con dur T_IN = 900 y escalón IN_STG = 70; todos sonaron", bi && bi.o.dur === 900 && bi.o.step === 70 && au.every((x) => x.r === true), `${bi ? JSON.stringify(bi.o) : "—"} · ${au.filter((x) => x.r).length}/${au.length} true`, "{dur:900,step:70} · todos true");
  /* bandsOut: navegar con el panel arriba */
  await mode(); await B.load(U("?dev=1&idle=1500&author=0&net=online"));
  await B.key(71, "m47"); const bon = await waitFor("P8E.stats().idle==='on'", 9000);
  await sleep(400); await B.key(39, "m47"); await sleep(700);
  g = await get(); errs += g.err;
  const bo = g.log.find((x) => x.ev === "bandsOut"), nv = g.log.filter((x) => x.ev === "nav").pop(), k39 = (g.keys.find((k) => k[0] === 39) || [])[1];
  C.check("S2.d", "franjas: navegar las saca → nav + bandsOut en el mismo pulso (dur 560, escalón OUT_STG = 50)", bon && bo && nv && bo.o.dur === 560 && bo.o.step === 50 && near(bo.t - k39, 0) && near(nv.t - k39, 0) && bo.r && nv.r,
    bo ? `bandsOut ${JSON.stringify(bo.o)} a ${fmt(bo.t - k39)} ms · nav ${JSON.stringify(nv && nv.o)} a ${fmt(nv && nv.t - k39)} ms` : "sin bandsOut", "560 · 50 · 0 ms");
  /* S3 · ráfaga de nav: 10 teclas en 1 s */
  const SAMPLER = `(function(){ var M=window.__snds={nav:0,all:0,lag:0,lt:0,n:0}, last=performance.now();
    try{ new PerformanceObserver(function(l){ l.getEntries().forEach(function(e){ M.lt++; M.ltMax=Math.max(M.ltMax||0,e.duration); }); }).observe({entryTypes:["longtask"]}); }catch(e){ M.lt=-1; }
    M.id=setInterval(function(){ var t=performance.now(), s=P8ESound.stats(); M.n++; M.lag=Math.max(M.lag,t-last); last=t; if(s.navVoices>M.nav) M.nav=s.navVoices; if(s.voices>M.all) M.all=s.voices; },4); return 1; })()`;
  const burst = async (store) => {
    await mode({ store }); await B.load(U("?idle=600000"));
    await B.key(39, "m47"); await sleep(1800); await B.ev(SAMPLER); const k0 = (await get()).log.length;
    for (let i = 0; i < 10; i++) { await B.key(39, "m47"); await sleep(100); }
    await sleep(1200); await B.ev("clearInterval(__snds.id),1");
    const m = await B.ev("JSON.stringify(__snds)"), gg = await get(); errs += gg.err;
    return { m: JSON.parse(m), navs: gg.log.slice(k0).filter((x) => x.ev === "nav"), st: gg.st }; };
  const bs = await burst(null), bm = await burst({ "p8e.sound.mute": "1" });
  C.rep.sound.burst = { sound: bs, muted: bm };
  const costMax = Math.max(...bs.navs.map((x) => x.ms));
  C.check("S3.a", "ráfaga de 10 nav en 1 s: ≤ 3 voces de nav (y ≤ 8 en total) muestreando cada 4 ms; las 10 suenan", bs.navs.length === 10 && bs.navs.every((x) => x.r) && bs.m.nav <= 3 && bs.m.all <= 8 && bs.st.maxVoices <= 8,
    `${bs.navs.filter((x) => x.r).length}/10 true · nav máx ${bs.m.nav} · todas máx ${bs.m.all} · robos ${bs.st.steals} · descartes ${bs.st.drops} · ${bs.m.n} muestras`, "10/10 · ≤ 3 · ≤ 8");
  C.check("S3.b", "ráfaga: 0 bloqueos del hilo por el sonido (cada play() < 4 ms; tareas largas y hueco máx. ≤ los de la misma ráfaga en silencio + 1 fotograma)",
    costMax < 4 && (bs.m.lt < 0 || bs.m.lt <= bm.m.lt) && bs.m.lag <= bm.m.lag + 16.7,
    `play() máx ${costMax.toFixed(2)} ms · tareas largas ${bs.m.lt} (en silencio ${bm.m.lt}) · hueco máx ${bs.m.lag.toFixed(1)} ms (en silencio ${bm.m.lag.toFixed(1)})`, "< 4 ms · ≤ · ≤ +16,7");
  C.check("S3.c", "nav lleva índice y sentido de la app (index = app − 1, dir = ±1)", bs.navs.every((x) => x.o.index === x.o.app - 1 && x.o.dir === 1), JSON.stringify(bs.navs.slice(0, 3).map((x) => x.o)), "index = app − 1 · dir 1");
  /* S4 · silencio, movimiento reducido, reposo y página oculta = 0 nodos */
  const seq = async () => { await B.key(13, "m47"); await sleep(1250 + 700); await B.key(10009, "m47"); await sleep(1250 + 600); for (let i = 0; i < 3; i++) { await B.key(39, "m47"); await sleep(150); } await sleep(600); };
  await mode({ store: { "p8e.sound.mute": "1" } }); await B.load(U("?launchback=0&idle=600000&retg=0&noscreen=0")); await seq();
  g = await get(); errs += g.err;
  C.check("S4.a", "silencio (p8e.sound.mute = 1): lanzar + volver + 3 nav → 0 nodos, ni contexto; play = false", g.made === 0 && g.st.ctx === "none" && g.log.length >= 9 && g.log.every((x) => x.r === false),
    `nodos ${g.made} · ctx ${g.st.ctx} · ${g.log.length} llamadas, ${g.log.filter((x) => x.r).length} true`, "0 · none · 0 true");
  await mode({ store: { "p8e.reduce": "1" } }); await B.load(U("?launchback=0&idle=600000&retg=0&noscreen=0")); await seq();
  g = await get(); errs += g.err;
  const madeR = g.made;
  await B.ev(`window.P8EApps={launch:function(app,ok,err){ setTimeout(function(){ err&&err(new Error("prueba")); },200); }}; 1`);
  await B.key(13, "m47"); await sleep(900);
  const gE = await get(); errs += gE.err; const er = gE.log.find((x) => x.ev === "error");
  C.check("S4.b", "movimiento reducido (p8e.reduce = 1): 0 nodos en lanzar + volver + nav; sólo `error` suena (decisión de diseño de sonido: es información, no movimiento)",
    madeR === 0 && er && er.r === true && gE.made > 0 && gE.log.filter((x) => x.r).length === 1,
    `nodos sin error ${madeR} · error ${er ? er.r : "—"} → nodos ${gE.made} · llamadas que sonaron ${gE.log.filter((x) => x.r).map((x) => x.ev).join(",")}`, "0 · true → > 0 · error");
  await mode(); await B.load(U("?launchback=0&idle=600000&retg=0&noscreen=0"));
  await B.ev("P8ESound._idle(1500),1"); await seq();
  const rest = await waitFor("__m47.snd.set.size===0&&!P8ESound.stats().bus&&P8ESound.stats().live===0&&P8ESound.stats().ctx==='suspended'", 10000);
  g = await get(); errs += g.err;
  C.check("S4.c", "reposo: tras lanzar + volver + nav, todo se suelta, el bus se desmonta y el contexto se suspende (cuenta propia: 0 nodos vivos)", rest && g.made > 0,
    `nodos creados ${g.made} · vivos ${g.live} (sound.js ${g.st.live}) · máx vivos ${g.maxLive} · bus ${g.st.bus} · ctx ${g.st.ctx}`, "vivos 0 · bus false · suspended");
  await B.load(U("?launchback=0&idle=600000&retg=0&noscreen=0")); await B.key(13, "m47"); await sleep(700);
  const live0 = (await get()).live;
  await B.ev(`(function(){ Object.defineProperty(document,"hidden",{configurable:true,get:function(){return true;}}); Object.defineProperty(document,"visibilityState",{configurable:true,get:function(){return "hidden";}}); document.dispatchEvent(new Event("visibilitychange")); })()`);
  await sleep(300); g = await get(); errs += g.err;
  const madeH = g.made; await sleep(1500); const g2 = await get();
  await B.ev(`(function(){ delete document.hidden; delete document.visibilityState; document.dispatchEvent(new Event("visibilitychange")); })()`);
  const rs = g.log.find((x) => x.ev === "returnStart");
  C.check("S4.d", "página oculta (Home en pleno despiece): de N nodos vivos a 0 en el acto; returnStart (hidden) no crea nodos", live0 > 0 && g.live === 0 && g.st.live === 0 && !g.st.bus && rs && rs.r === false && g2.made === madeH && g2.live === 0,
    `vivos ${live0} → ${g.live} (sound.js ${g.st.live}) · bus ${g.st.bus} · returnStart ${rs ? rs.o.why + " " + rs.r : "—"} · nodos después ${g2.made - madeH}`, "> 0 → 0 · false · hidden false · 0");
  /* S5 · sin AudioContext, sólo webkitAudioContext */
  await mode({ noAC: true }); await B.load(U("?launchback=0&idle=600000&retg=0&noscreen=0"));
  const nameAC = await B.ev("typeof window.AudioContext+'/'+typeof window.webkitAudioContext");
  await B.key(13, "m47"); await sleep(400); g = await get(); errs += g.err;
  C.check("S5", "sin AudioContext (sólo webkitAudioContext): el contexto nace igual y launchStart suena", nameAC === "undefined/function" && g.st.ctx === "running" && g.made > 0 && g.log[0] && g.log[0].r,
    `${nameAC} · ctx ${g.st.ctx} · nodos ${g.made} · ${g.log.map((x) => x.ev + " " + x.r).join(", ")}`, "undefined/function · running · > 0 · true");
  /* S7 · v15.1 FASE BOOT recortada (motion + diseño de sonido): la intro arranca en el portal. 6 cues (la cabeza
     —bootPower/bootBars/bootCharge/bootDischarge— se retiró); el acento es ahora bootPortal (la entrada). Reloj reanclado a t=0 = portal.
     Realidad de autoplay: la intro suena en cuanto existe el contexto. En el motor del TV (Chromium M47, 2015, sin la política de autoplay
     de Chrome 71/2018) el contexto corre solo; aquí (Chromium moderno) queda suspendido hasta un gesto real, y la única tecla posible
     (mando) a la vez SALTA la intro (p8e.js). Por eso en frío las cues se registran pero r=false (silencio elegante), y el salto
     —que es el propio gesto— sí suena. Las cifras de pico del render offline las fijó el diseño de sonido a su objetivo a vol 0,7. */
  /* v15.2 (motion + diseño de sonido): la intro ya no corta a ~2020; RESUELVE ARMANDO el cassette de la última app
     (motor de la VUELTA INVERSA v13, BOOT.arming). NUEVA cue bootArmed = el «clac» del deck al encajar, lxAt(LXB.peak) dentro del armado
     → armStart 1820 + LXB.peak 1100 = 2920 ms. bootDone se mueve al fin del armado → armStart 1820 + LX.T 1250 = 3070 ms. bootArmed es la
     ÚNICA cue del tramo (las de lanzamiento quedan suprimidas) y NO suena en movimiento reducido (sin armado: fundido plano). */
  const BOOT = ["bootPortal", "bootTitle", "bootReady", "bootResolve", "bootArmed", "bootDone", "bootSkip"];
  const BC_MS = { bootPortal: 0, bootTitle: 540, bootReady: 1100, bootResolve: 1510, bootArmed: 2920, bootDone: 3070 };
  const TARGET = { bootPortal: -15, bootTitle: -20, bootReady: -22, bootResolve: -22, bootArmed: -20, bootDone: -30, bootSkip: -20 };
  /* S7.a · las 7 cues sintetizan en el render offline (sin gesto): crean nodos y su pico cae en su objetivo (±1,5 dB); bootPortal es el más alto (la entrada) */
  await mode(); await B.load(U("?boot=0&idle=600000"));
  const peaks = JSON.parse(await B.ev(`(function(){ var n=${JSON.stringify(BOOT)}, out={};
    return n.reduce(function(p,nm){ return p.then(function(){ return P8ESound.render(nm,{vol:0.7}).then(function(r){ var b=r.buffer,pk=0,c,i,d,a; for(c=0;c<b.numberOfChannels;c++){ d=b.getChannelData(c); for(i=0;i<b.length;i++){ a=Math.abs(d[i]); if(a>pk) pk=a; } } out[nm]={peak:+(pk>0?20*Math.log(pk)/Math.LN10:-999).toFixed(2),nodes:r.created}; }); }); }, Promise.resolve()).then(function(){ return JSON.stringify(out); }); })()`));
  const maxPeak = Math.max.apply(null, BOOT.map((n) => peaks[n].peak));
  C.check("S7.a", "arranque: las 7 cues sintetizan en el render offline (nodos > 0) y cada pico cae en su objetivo a vol 0,7 (±1,5 dB); bootPortal es el más alto (la entrada)",
    BOOT.every((n) => peaks[n].nodes > 0 && Math.abs(peaks[n].peak - TARGET[n]) <= 1.5) && peaks.bootPortal.peak === maxPeak,
    BOOT.map((n) => `${n} ${peaks[n].peak}/${TARGET[n]} (${peaks[n].nodes}n)`).join(" · "), "cada pico ±1,5 dB de su objetivo · portal el más alto");
  /* S7.b · movimiento reducido: por play() sólo pasan bootPortal y bootDone; las otras 5 devuelven false (bootArmed incluida: en reduce no hay armado) */
  await mode({ store: { "p8e.reduce": "1" } }); await B.load(U("?boot=0&idle=600000"));
  await B.key(39, "m47"); await sleep(200);                   // ArrowRight: un gesto que desbloquea sin saltar nada (no hay intro)
  const rr = JSON.parse(await B.ev(`(function(){ var n=${JSON.stringify(BOOT)}, out={}, i; for(i=0;i<n.length;i++) out[n[i]]=P8ESound.play(n[i],{}); return JSON.stringify(out); })()`));
  g = await get(); errs += g.err;
  const others = BOOT.filter((n) => n !== "bootPortal" && n !== "bootDone");
  C.check("S7.b", "movimiento reducido: sólo bootPortal y bootDone suenan del arranque (es el fundido plano, sin armado); las otras 5 cues (bootArmed incluida) devuelven false",
    rr.bootPortal === true && rr.bootDone === true && others.every((n) => rr[n] === false) && g.st.ctx === "running",
    `portal ${rr.bootPortal} · done ${rr.bootDone} · resto [${others.map((n) => rr[n]).join(",")}] · ctx ${g.st.ctx}`, "portal/done true · resto false · running");
  /* S7.c · salto sin cola: offline, un portal largo + un skip 120 ms después roba la voz del portal; en vivo, la tecla que salta es el gesto y suena */
  const sk = JSON.parse(await B.ev("P8ESound.render([{ev:'bootPortal',at:0},{ev:'bootSkip',at:120}]).then(function(r){ return JSON.stringify({steals:r.steals,maxVoices:r.maxVoices}); })"));
  await mode(); await B.load(U("?boot=1&idle=600000&net=online"));
  await sleep(520);                                           // deja sonar al menos la cue del portal EN SILENCIO (aún sin gesto)
  await B.key(13, "m47"); await sleep(700);                   // Enter en plena intro → bootSkip (corta) y es a la vez el gesto que desbloquea
  g = await get(); errs += g.err;
  const bl = g.log.filter((x) => /^boot/.test(x.ev)), skE = bl.find((x) => x.ev === "bootSkip"), dnE = bl.filter((x) => x.ev === "bootDone").pop();
  const pre = bl.filter((x) => x.ev !== "bootSkip" && x.ev !== "bootDone");
  C.check("S7.c", "salto: offline el skip roba la voz de boot que aún suena (0 cola); en vivo bootSkip + bootDone suenan (la tecla es el gesto) y las cues previas no sonaron (sin gesto todavía)",
    sk.steals >= 1 && skE && skE.r === true && dnE && dnE.r === true && g.st.ctx === "running" && pre.length > 0 && pre.every((x) => x.r === false),
    `offline robos ${sk.steals} · bootSkip ${skE ? skE.r : "—"} · bootDone ${dnE ? dnE.r : "—"} · previas [${pre.map((x) => x.ev).join(",") || "—"}] r=false ${pre.every((x) => x.r === false)} · ctx ${g.st.ctx}`,
    "robos ≥ 1 · skip/done true · previas false · running");
  /* S7.d · arranque en frío (sin gesto): las 6 cues de la intro (bootArmed entre bootResolve y bootDone) se registran en orden; sin contexto, r=false (silencio elegante) */
  await mode(); await B.load(U("?boot=1&idle=600000&net=online"));
  const sawDone = await waitFor("__m47.snd.log.filter(function(x){return x.ev==='bootDone';}).length>0", 7000);
  g = await get(); errs += g.err;
  const cold = g.log.filter((x) => /^boot/.test(x.ev) && x.ev !== "bootSkip"), t0b = cold[0] ? cold[0].t : 0;
  const bootOrder = cold.map((x) => x.ev).join(" "), EXPB = "bootPortal bootTitle bootReady bootResolve bootArmed bootDone";
  C.info("S7.dt", `arranque en frío, reloj de la intro (ms desde bootPortal / objetivo BC): ${cold.map((x) => `${x.ev} ${fmt(x.t - t0b)}/${BC_MS[x.ev]}`).join(" · ")}`);
  C.check("S7.d", "arranque en frío (sin gesto): las 6 cues de la intro se registran en orden (bootArmed entre bootResolve y bootDone), y sin contexto todas devuelven r=false (silencio elegante, nunca excepción)",
    sawDone && bootOrder === EXPB && cold.every((x) => x.r === false) && g.made === 0 && g.st.ctx === "none",
    `${bootOrder} · r [${cold.map((x) => (x.r === false ? "f" : x.r)).join(",")}] · nodos ${g.made} · ctx ${g.st.ctx}`, "orden exacto · todas r=false · 0 nodos · none");
  await mode(); await B.load(U("?idle=600000"));             // deja el perfil limpio (sin silencio ni reduce guardados)
  C.check("S6", "0 excepciones en la suite sound; un rAF y un contexto WebGL como máximo", errs === 0 && B.errors.length === 0 && g.raf <= 1 && g.gl <= 1, `__m47 ${errs} · CDP ${JSON.stringify(B.errors).slice(0, 200)} · rAF ${g.raf} · GL ${g.gl}`, "0 · 0 · ≤ 1 · ≤ 1");
}
/* ======================================================================================================
   v14 · adapter + diag: the launcher ready for the TV (facts from the static firmware analysis)
   ====================================================================================================== */
const TV_CONFIG = path.join(HERE, "..", "launcher", "config.xml");
const TV_CSP_FALLBACK = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self' https://api.open-meteo.com; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; referrer no-referrer";
function tvCsp() { try { const x = fs.readFileSync(TV_CONFIG, "utf8").replace(/<!--[\s\S]*?-->/g, ""), m = /<tizen:content-security-policy>([\s\S]*?)<\/tizen:content-security-policy>/.exec(x);
    if (m) return { csp: m[1].trim(), from: TV_CONFIG }; } catch (e) {} return { csp: TV_CSP_FALLBACK, from: "copia embebida (no se pudo leer " + TV_CONFIG + ")" }; }
const LEAVE = `(function(o){ if(o.hidden){ Object.defineProperty(document,"hidden",{configurable:true,get:function(){return true;}}); Object.defineProperty(document,"visibilityState",{configurable:true,get:function(){return "hidden";}}); document.dispatchEvent(new Event("visibilitychange")); }
  if(o.blur) window.dispatchEvent(new Event("blur")); if(o.pagehide) window.dispatchEvent(new Event("pagehide")); return 1; })`;
const COMEBACK = `(function(o){ if(o.visible){ delete document.hidden; delete document.visibilityState; document.dispatchEvent(new Event("visibilitychange")); }
  if(o.focus) window.dispatchEvent(new Event("focus")); if(o.pageshow) window.dispatchEvent(new Event("pageshow")); return 1; })`;
const ALL_ON = { hidden: true, blur: true, pagehide: true, visible: true, focus: true, pageshow: true };

async function suiteAdapter(B, C, U) {
  const st = () => B.ev(PROBE), L = async () => JSON.parse(await B.ev("JSON.stringify(P8E.stats().launch)")), TZ = async () => JSON.parse(await B.ev("JSON.stringify(window.__m47.tizen||null)"));
  const AD = async () => JSON.parse(await B.ev("JSON.stringify(P8EApps.stats())"));
  const Q = "?dev=1&launchback=0&idle=600000&noshow=0&retg=0&noscreen=0", OPEN_MS = 1250 + 900, ERR_BACK = 3000 + 1250 + 700;
  /* v16.7: the ids READ ON THE TV (sdb shell 0 applist, 2026-10-25). Netflix: plan of 4 attempts; Browser:
     ApplicationControl view + uri first. In the shim an ApplicationControl attempt is «ac:<id>» (see the shim). */
  const NF = ["ac:org.tizen.netflix-app", "ac:RN1MCdNq8t.Netflix", "org.tizen.netflixlowmem", "RN1MCdNq8t.Netflix"];
  const IDS = ["ac:org.tizen.netflix-app", "xvvl3S1TT1.TizenTubeStandalone", "evKhCgZelL.AmazonIgnitionLauncher2", "ac:org.tizen.browser", "MCmYXNxgcu.DisneyPlus", "5b8c3eb16b.BeamCTVDev",
    "Y6A54cEa22.AppleTV", "X1pKpFCiUu.PlutoTV", "XqE4pU0E74.Clarovideo"];
  /* the v14 C1 alias logic is still in the adapter (no app of the roster uses it today): the suite serves p8e.js patched */
  const YT_ALIAS = [{ file: "/P8e/p8e.js", find: 'appId:"xvvl3S1TT1.TizenTubeStandalone", appAlias:""', repl: 'appId:"111299001912", appAlias:"9Ur5IzDKqV.TizenYouTube", aliasLaunchable:true' }];
  const PV_ALIAS = [{ file: "/P8e/p8e.js", find: 'appId:"evKhCgZelL.AmazonIgnitionLauncher2", appAlias:""', repl: 'appId:"evKhCgZelL.AmazonIgnitionLauncher2", appAlias:"org.tizen.ignition"' }];
  let duid = 0, errs = [];
  const go = async (tz, q = "", patch = null) => { await B.setMode({ m47: true, rev: C.rev, tizen: tz, patch }); await B.load(U(Q + q)); };
  const done = async () => { const t = await TZ(); if (t) duid += t.duid; errs = errs.concat(B.errors); return t; };
  /* AD1 · instalado; v16.9: NINGUNA tecla registrada (sin cinta Sources, Source es del TV); roster con los ids leídos en el TV */
  await go({ ok: IDS }, "&app=2");
  const inst = JSON.parse(await B.ev("JSON.stringify({t:typeof window.P8EApps, p:window.P8EApps&&P8EApps.platform, apps:P8E.apps()})")), tz0 = await TZ();
  const want = { "Netflix": "RN1MCdNq8t.Netflix", "Disney+": "MCmYXNxgcu.DisneyPlus", "Prime Video": "evKhCgZelL.AmazonIgnitionLauncher2", "HBO Max": "5b8c3eb16b.BeamCTVDev",
    "Apple TV": "Y6A54cEa22.AppleTV", "Pluto TV": "X1pKpFCiUu.PlutoTV", "YouTube": "xvvl3S1TT1.TizenTubeStandalone", "Claro Video": "XqE4pU0E74.Clarovideo", "Browser": "org.tizen.browser" };
  const nf = inst.apps.find((a) => a.nm === "Netflix") || {}, br = inst.apps.find((a) => a.nm === "Browser") || {};
  const rosterOk = Object.keys(want).every((n) => inst.apps.some((a) => a.nm === n && a.appId === want[n] && a.aliasLaunchable === false))
    && inst.apps[9].nm === "Art" && inst.apps.length === 13
    && JSON.stringify((nf.tries || []).map((t) => (t.ac ? "ac:" : "") + (t.id || "*"))) === JSON.stringify(NF)
    && br.tries && br.tries[0].ac && br.tries[0].ac.op === "http://tizen.org/appcontrol/operation/view" && br.tries[0].ac.uri === "https://www.google.com" && br.tries[2].id === "org.tizen.browser" && !br.tries[2].ac;
  C.check("AD1", "con `tizen`: P8EApps (tizen), registerKey = [] (v16.9: sin cinta Sources la tecla Source es del TV), roster con los ids leídos en el TV, Netflix con su plan de 4, Browser con ApplicationControl, Arte 15 y HDMI 12–14 en su sitio, 13 cintas",
    inst.t === "object" && inst.p === "tizen" && JSON.stringify(tz0.reg) === '[]' && rosterOk, `${inst.t} · ${inst.p} · registerKey ${JSON.stringify(tz0.reg)} · roster ${rosterOk} · n ${inst.apps.length}`, 'object · tizen · [] · true · 13');
  /* AD2 · C2: ninguna llamada a webapis.* ocurrió con document.readyState "loading" (contador del shim); y sí se usó tras cargar */
  const w0 = JSON.parse(await B.ev("JSON.stringify((window.__m47.tizen&&window.__m47.tizen.wapi)||null)"));
  C.check("AD2", "C2 · 0 llamadas a webapis.* antes de DOMContentLoaded (readyState loading), y > 0 tras cargar (modelo + red aplazados)", !!w0 && w0.loading === 0 && w0.calls > 0,
    `loading ${w0 && w0.loading} · calls ${w0 && w0.calls} · primera-en-loading ${JSON.stringify(w0 && w0.first)}`, "loading 0 · calls > 0");
  /* AD3 · Netflix: 1.er intento = ApplicationControl operation/default a org.tizen.netflix-app → onOk; pantalla «Rewinding…» (v16.10: ya al confirmarse la app, no «Opening…») */
  let s = await (async () => { await B.key(13, "m47"); await sleep(OPEN_MS); return st(); })(), l = await L(), t = await TZ();
  const okId = JSON.stringify(t.launches) === '["ac:org.tizen.netflix-app"]' && t.acs[0].op === "http://tizen.org/appcontrol/operation/default" && t.acs[0].uri === null && !t.acs[0].reply && l.oks === 1 && l.via === "adapter" && l.phase === "open" && /^rewinding/i.test(s.msg || "");
  await B.ev(LEAVE + "(" + JSON.stringify(ALL_ON) + ")"); await sleep(300); const away = (await L()).away, sAway = await st();
  await B.ev(COMEBACK + "(" + JSON.stringify(ALL_ON) + ")"); await B.ev(COMEBACK + "(" + JSON.stringify({ focus: true, pageshow: true }) + ")"); await sleep(1250 + 600); l = await L();
  C.check("AD3", "Netflix: ApplicationControl operation/default a org.tizen.netflix-app (sin reply) → onOk; pantalla «Rewinding…»", okId, `${JSON.stringify(t.launches)} · ${JSON.stringify(t.acs[0])} · oks ${l.oks} · via ${l.via} · «${s.msg}»`, '["ac:org.tizen.netflix-app"] · operation/default · 1 · adapter · Rewinding…');
  C.check("AD4", "vuelta idempotente: hidden+blur+pagehide y luego visibilitychange+focus+pageshow (y otra vez focus+pageshow) → 1 vuelta, 1 espejo", away === true && l.returns === 1 && l.rewinds === 1 && l.phase === "" && l.why === "visible",
    `away ${away} · vueltas ${l.returns} · espejos ${l.rewinds} · fase «${l.phase}» · por ${l.why}`, "true · 1 · 1 · « » · visible");
  C.check("AD4a", "v16.7: al irnos la pantalla de paso ya dice «Rewinding…» (no «Opening…»): es lo que se ve si el TV nos reanuda", /^rewinding/i.test(sAway.msg || "") && sAway.lxOn, `«${sAway.msg}» · lx ${sAway.lxOn}`, "Rewinding… · true");
  s = await (async () => { await B.key(39, "m47"); await sleep(1100); return st(); })(); C.check("AD4b", "después se navega", s.app === "03/13", s.app, "03/13");
  await done();
  /* AD5 · Netflix: los 4 intentos fallan (NotFound) → onErr «Couldn't open Netflix», en ese orden */
  await go({ ok: [] }, "&app=2");
  s = await (async () => { await B.key(13, "m47"); await sleep(OPEN_MS); return st(); })(); l = await L(); t = await TZ(); let ad = await AD();
  C.check("AD5", "Netflix: ac:org.tizen.netflix-app → ac:RN1MCdNq8t.Netflix → org.tizen.netflixlowmem → RN1MCdNq8t.Netflix, todos NotFound → onErr → «Couldn't open Netflix»; el registro del adaptador lo dice",
    JSON.stringify(t.launches) === JSON.stringify(NF) && /couldn't open netflix/i.test(s.msg || "") && l.fails === 1 && ad.retries === 3 && /NotFound/.test(l.err) && ad.log.slice(-4).map((x) => x.id).join("|") === "ac:org.tizen.netflix-app|ac:RN1MCdNq8t.Netflix|org.tizen.netflixlowmem|RN1MCdNq8t.Netflix",
    `${JSON.stringify(t.launches)} · «${s.msg}» · fails ${l.fails} · reintentos ${ad.retries} · log ${JSON.stringify(ad.log.slice(-4).map((x) => [x.id, x.res]))}`, "los 4 en orden · Couldn't open Netflix · fails 1 · reintentos 3");
  await sleep(ERR_BACK); s = await st(); l = await L();
  C.check("AD6", "…y vuelve sola al corredor (3 s + la vuelta inversa)", !s.launch && !s.lxOn && l.returns === 1 && l.why === "error", `launch ${s.launch} · lx ${s.lxOn} · vueltas ${l.returns} · por ${l.why}`, "false · false · 1 · error");
  await done();
  /* AD7 · C1 (v14): alias lanzable (aliasLaunchable true) → id NotFound → reintento con el alias → onOk; vuelta por respaldo focus.
     Ninguna app del roster lo usa hoy: YouTube servido con id numérico + alias (parche en memoria) */
  await go({ ok: ["9Ur5IzDKqV.TizenYouTube"] }, "&app=1", YT_ALIAS);
  await B.key(13, "m47"); await sleep(OPEN_MS); l = await L(); t = await TZ(); ad = await AD();
  C.check("AD7", "C1: alias lanzable → id (111299001912) NotFound → reintento con el alias (9Ur5IzDKqV.TizenYouTube) → onOk", JSON.stringify(t.launches) === '["111299001912","9Ur5IzDKqV.TizenYouTube"]' && l.oks === 1 && l.fails === 0 && ad.retries === 1,
    `${JSON.stringify(t.launches)} · oks ${l.oks} · fails ${l.fails} · reintentos ${ad.retries}`, '[id, alias] · 1 · 0 · 1');
  await B.ev(LEAVE + "({blur:true})"); await sleep(200); await B.ev(COMEBACK + "({focus:true})"); await sleep(1250 + 600); l = await L();
  C.check("AD8", "respaldo focus: blur y luego focus (sin visibilitychange) → 1 vuelta, por focus", l.returns === 1 && l.phase === "" && l.why === "focus", `vueltas ${l.returns} · fase «${l.phase}» · por ${l.why}`, "1 · « » · focus");
  await done();
  /* AD9 · C1: alias NO lanzable (sin aliasLaunchable) → id NotFound → onErr directo, SIN alias. Prime con su id real + alias (parche) */
  await go({ ok: [] }, "&app=5", PV_ALIAS);
  s = await (async () => { await B.key(13, "m47"); await sleep(OPEN_MS); return st(); })(); l = await L(); t = await TZ(); ad = await AD();
  C.check("AD9", "C1: Prime Video (evKhCgZelL.AmazonIgnitionLauncher2, alias sin aliasLaunchable) → NotFound → onErr directo, SIN alias → «Couldn't open Prime Video»", JSON.stringify(t.launches) === '["evKhCgZelL.AmazonIgnitionLauncher2"]' && /couldn't open prime video/i.test(s.msg || "") && l.fails === 1 && ad.retries === 0,
    `${JSON.stringify(t.launches)} · «${s.msg}» · fails ${l.fails} · reintentos ${ad.retries}`, '["evKhCgZelL.AmazonIgnitionLauncher2"] · Couldn\'t open Prime Video · reintentos 0');
  await done();
  /* AD10 · un focus o un pageshow sueltos NO adelantan la vuelta; pagehide → pageshow sí */
  await go({ ok: IDS });
  await B.key(13, "m47"); await sleep(OPEN_MS);
  await B.ev(COMEBACK + "({focus:true,pageshow:true})"); await sleep(700); const l1 = await L();
  await B.ev(LEAVE + "({pagehide:true})"); await sleep(150); await B.ev(COMEBACK + "({pageshow:true})"); await sleep(1250 + 600); l = await L();
  C.check("AD10", "focus/pageshow sin habernos ido → nada (sigue abierta); pagehide → pageshow → 1 vuelta, por pageshow", l1.phase === "open" && l1.returns === 0 && l.returns === 1 && l.why === "pageshow" && l.phase === "",
    `sueltos: fase ${l1.phase} · vueltas ${l1.returns} → tras pagehide: ${l.returns} · por ${l.why}`, "open · 0 → 1 · pageshow");
  await done();
  /* AD11 · cada id leído en el TV llega tal cual (un intento, abre); Browser por ApplicationControl; HDMI y apps sin id no llaman al TV */
  const per = [];
  for (const [app, exp, msg] of [[1, "xvvl3S1TT1.TizenTubeStandalone", null], [5, "evKhCgZelL.AmazonIgnitionLauncher2", null], [9, "ac:org.tizen.browser", null],
    [4, "MCmYXNxgcu.DisneyPlus", null], [3, "5b8c3eb16b.BeamCTVDev", null], [6, "Y6A54cEa22.AppleTV", null], [7, "X1pKpFCiUu.PlutoTV", null], [8, "XqE4pU0E74.Clarovideo", null]]) {
    await go({ ok: IDS }, "&app=" + app); await B.key(13, "m47"); await sleep(OPEN_MS); s = await st(); l = await L(); t = await TZ();
    per.push({ app, launches: t.launches, acs: t.acs, msg: s.msg, err: l.err, ok: exp ? (JSON.stringify(t.launches) === JSON.stringify([exp]) && l.oks === 1) : (t.launches.length === 0 && msg.test(s.msg || "")) });
    await done(); }
  const bac = per[2].acs[0] || {};
  C.check("AD11", "YouTube, Prime Video, Disney+, HBO Max, Apple TV, Pluto TV y Claro Video → su id leído en el TV (un launch cada una, abre)", [0, 1, 3, 4, 5, 6, 7].every((i) => per[i].ok), JSON.stringify([0, 1, 3, 4, 5, 6, 7].map((i) => [per[i].app, per[i].launches])), "un launch con su id cada una");
  C.check("AD11b", "Browser → launchAppControl(view, https://www.google.com, org.tizen.browser) → abre al 1.er intento", per[2].ok && bac.op === "http://tizen.org/appcontrol/operation/view" && bac.uri === "https://www.google.com" && bac.id === "org.tizen.browser",
    `${JSON.stringify(per[2].launches)} · ${JSON.stringify(bac)}`, '["ac:org.tizen.browser"] · view · https://www.google.com');
  /* AD12c · excepción síncrona de launch en una app de un solo intento → onErr, sin reintento */
  await go({ ok: IDS, throwIds: ["xvvl3S1TT1.TizenTubeStandalone"] }, "&app=1");
  s = await (async () => { await B.key(13, "m47"); await sleep(OPEN_MS); return st(); })(); l = await L(); t = await TZ();
  C.check("AD12c", "launch lanza TypeMismatchError síncrono (YouTube, un intento) → onErr («Couldn't open YouTube»)", JSON.stringify(t.launches) === '["xvvl3S1TT1.TizenTubeStandalone"]' && /couldn't open youtube/i.test(s.msg || "") && /TypeMismatch/.test(l.err), `${JSON.stringify(t.launches)} · «${s.msg}» · err ${l.err}`, '["xvvl3S1TT1.TizenTubeStandalone"] · Couldn\'t open YouTube · TypeMismatchError');
  await done();
  /* AD13 · red con los códigos del firmware (5 = GATEWAY_DISCONNECTED, 4 = GATEWAY_CONNECTED); HUD con el modelo y la versión del TV */
  await go({ ok: IDS }, "&net=");
  const h0 = JSON.parse(await B.ev("JSON.stringify(P8E.stats().hud)"));
  await B.ev("__m47.tizen.fire(5); 1"); await sleep(300); const h5 = JSON.parse(await B.ev("JSON.stringify(P8E.stats().hud.net)"));
  await B.ev("__m47.tizen.fire(4); 1"); await sleep(300); const h4 = JSON.parse(await B.ev("JSON.stringify(P8E.stats().hud.net)"));
  C.check("AD13", "listener de red: 5 → SIN RED (gateway false), 4 → sale de SIN RED; código crudo en hud.net.code", h0.net.tvListener && h5.state === "nonet" && h5.gw === false && h5.code === 5 && h4.state !== "nonet" && h4.gw === true && h4.code === 4,
    `listener ${h0.net.tvListener} · 5 → ${h5.state}/${h5.gw}/${h5.code} · 4 → ${h4.state}/${h4.gw}/${h4.code}`, "true · nonet/false/5 · ≠nonet/true/4");
  C.check("AD14", "HUD en el TV simulado: modelo de getRealModel y versión de config.xml", h0.model === "UN55MU6100" && h0.modelSrc === "getRealModel" && !h0.modelSimulated && h0.version === "1.0.0" && h0.versionSrc === "config.xml",
    `${h0.model} (${h0.modelSrc}, simulado ${h0.modelSimulated}) · v${h0.version} (${h0.versionSrc})`, "UN55MU6100 (getRealModel, false) · v1.0.0 (config.xml)");
  await done();
  /* AD15 · sin `tizen` (localhost): el adaptador no se instala y la maqueta sigue como antes */
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?dev=1&launchback=1500&idle=600000&noscreen=0"));
  const noT = await B.ev("typeof window.P8EApps"); await B.key(13, "m47"); await sleep(OPEN_MS); const lm = await L(); await sleep(1500 + 1250 + 600); l = await L();
  C.check("AD15", "sin `tizen`: window.P8EApps undefined, lanzamiento de maqueta y vuelta por su temporizador", noT === "undefined" && lm.via === "mock" && l.returns === 1 && l.why === "timer" && l.phase === "", `${noT} · via ${lm.via} · vueltas ${l.returns} · por ${l.why}`, "undefined · mock · 1 · timer");
  errs = errs.concat(B.errors);
  C.check("AD16", "señuelos: getDuid/getModelCode y getMac/getIp/getGateway/getDns/getSubnetMask llamados 0 veces en toda la suite; 0 excepciones", duid === 0 && errs.length === 0, `DUID ${duid} · excepciones ${JSON.stringify(errs).slice(0, 300)}`, "0 · 0");
}

async function suiteDiag(B, C, U) {
  const csp = tvCsp(); C.info("D0", "CSP del TV servida como cabecera: " + csp.from + " · " + csp.csp);
  const OPEN = "(function(){ var e=document.getElementById('p8eDiag'); return !!e&&e.style.display!=='none'; })()", EXISTS = "!!document.getElementById('p8eDiag')";
  const DG = async () => JSON.parse(await B.ev("localStorage.getItem('p8e.diag')||'null'"));
  const keys = async (codes, gap) => { for (const c of codes) { await B.key(c, "m47"); await sleep(gap); } };
  const COMBO = [38, 38, 40, 40, 37, 39, 37, 39];
  /* D1 · ?dev=1&diag=1, TV simulado, CSP del TV: abre solo y rellena los 7 puntos */
  await B.setMode({ m47: true, rev: C.rev, tizen: { ok: ["RN1MCdNq8t.Netflix"] }, csp: csp.csp, store: { "p8e.diag": null } });
  const ready = await B.load(U("?dev=1&diag=1&idle=600000")); await sleep(2600);
  const o1 = await B.ev(OPEN), raf1 = await B.ev("__m47.rafMax");
  C.check("D1", "?dev=1&diag=1 → el panel se abre solo (y la app arranca bajo la CSP del TV)", ready && o1, `data-ready ${ready} · abierto ${o1}`, "true · true");
  await keys([403, 404, 405, 406, 10182], 120);                                         // 3: códigos en vivo (colores y Exit, registrados mientras está abierto)
  await B.key(13, "m47"); await sleep(400);                                            // 4: «Try Netflix method 1/6» = launch RN1MCdNq8t.Netflix (botón 1)
  const nfLbl = await B.ev("document.querySelector('#p8eDiag .dg-b').textContent");     //    v16.7: el botón ya anuncia el método 2
  await B.key(13, "m47"); await sleep(400);                                            //    método 2 = launchAppControl a RN1MCdNq8t.Netflix (el simulado no lo abre)
  await B.key(39, "m47"); await sleep(120); await B.key(13, "m47"); await sleep(400);  //    getAppsInfo (botón 2)
  await B.ev(LEAVE + "({hidden:true,blur:true,pagehide:true})"); await sleep(200); await B.ev(COMEBACK + "({visible:true,focus:true,pageshow:true})"); await sleep(200);   // 5
  await B.ev("__m47.tizen.fire(5); 1"); await sleep(150); await B.ev("__m47.tizen.fire(4); 1"); await sleep(1200);   // 7
  const d = await DG(), tz = JSON.parse(await B.ev("JSON.stringify(__m47.tizen)")), cspEv = await B.ev("JSON.stringify(__m47.csp)");
  fs.writeFileSync(path.join(C.out, "P8e-v14-p8e.diag.json"), JSON.stringify(d, null, 1));
  await B.shot(path.join(C.out, "P8e-v14-C2-panel-diagnostico.png"));
  C.rep.diag = d;
  const p = d || {}, p1 = p.p1 || {}, p2 = p.p2 || {}, p3 = p.p3 || {}, p4 = p.p4 || {}, p5 = p.p5 || {}, p6 = p.p6 || {}, p6emb = p.p6emb || {}, p7 = p.p7 || {}, f = p.fps || {};
  const codes = (p3.keys || []).map((k) => k.code), ev = (p5.events || []).map((x) => x.e), evT = (p5.events || []).map((x) => x.t);
  C.check("D2.1", "p8e.diag · 1 motor: UA, WebGL1 sí con renderer, WebGL2 no (M47), Audio, CSS.supports, rAF, KeyboardEvent.key", /Chrome\//.test(p1.ua || "") && p1.webgl === true && !!(p1.renderer) && p1.webgl2 === false && typeof p1.AudioContext === "boolean" && typeof p1.webkitClipPath === "boolean" && p1.rAF === true && p1.keyOnEvent === "no",
    JSON.stringify({ webgl: p1.webgl, r: p1.unmaskedRenderer || p1.renderer, webgl2: p1.webgl2, AC: p1.AudioContext, wAC: p1.webkitAudioContext, vars: p1.cssVars, wcp: p1.webkitClipPath, rAF: p1.rAF, key: p1.keyOnEvent }), "webgl true · webgl2 false · key «no» (emulación: key oculto)");
  C.check("D2.2", "p8e.diag · 2 modelo: getRealModel y getModel (sin DUID)", p2.api === true && p2.getRealModel && p2.getRealModel.value === "UN55MU6100" && p2.getModel && p2.getModel.value === "UMU6100", JSON.stringify(p2), "UN55MU6100 · UMU6100");
  C.check("D2.3", "p8e.diag · 3 teclas: 403 404 405 406 10182 registradas en vivo; 8 teclas registradas al abrir (Exit no: su código sale de getSupportedKeys); getSupportedKeys volcado", [403, 404, 405, 406, 10182].every((c) => codes.includes(c)) && (p3.registered || {}).ok && p3.registered.ok.length === 8 && !p3.registered.ok.includes("Exit") && Array.isArray(p3.supported) && p3.supported.length === 6,
    `códigos ${JSON.stringify(codes)} · registradas ${(p3.registered || {}).ok && p3.registered.ok.length} · soportadas ${Array.isArray(p3.supported) ? p3.supported.length : JSON.stringify(p3.supported)}`, "los 5 · 8 · 6 (v16.7: el simulado anuncia también Source 10072)");
  const la = p4.launch || [];
  C.check("D2.4", "p8e.diag · 4 lanzamiento (v16.7): «Try Netflix method» 1 = launch RN1MCdNq8t.Netflix → ok, 2 = launchAppControl RN1MCdNq8t.Netflix → NotFoundError, el botón anuncia el siguiente y p8e.diag guarda nfNext = 2; getAppsInfo → 4 apps",
    la.length >= 2 && la[0].via === "#1 launch" && la[0].id === "RN1MCdNq8t.Netflix" && la[0].result === "ok" && la[1].via === "#2 appcontrol" && la[1].id === "RN1MCdNq8t.Netflix" && la[1].result === "NotFoundError" && /method 2\/6: appcontrol RN1MCdNq8t\.Netflix/.test(nfLbl) && p4.nfNext === 2
      && p4.apps && p4.apps.status === "ok" && p4.apps.n === 4 && JSON.stringify(tz.launches) === '["RN1MCdNq8t.Netflix","ac:RN1MCdNq8t.Netflix"]',
    `${JSON.stringify(la.map((x) => [x.via, x.id, x.result]))} · botón «${nfLbl}» · nfNext ${p4.nfNext} · apps ${p4.apps && p4.apps.status} ${p4.apps && p4.apps.n} · TV ${JSON.stringify(tz.launches)}`, "#1 launch ok · #2 appcontrol NotFoundError · method 2/6 · 2 · ok 4");
  const want5 = ["visibilitychange:hidden", "blur", "pagehide", "visibilitychange:visible", "focus", "pageshow"];
  C.check("D2.5", "p8e.diag · 5 orden de eventos al volver, con performance.now creciente", JSON.stringify(ev.slice(-6)) === JSON.stringify(want5) && evT.slice(-6).every((v, i, a) => i === 0 || v >= a[i - 1]), JSON.stringify(ev.slice(-6)), JSON.stringify(want5));
  C.check("D2.6", "p8e.diag · 6 CSP: la imagen de otro origen queda bloqueada (evento securitypolicyviolation, img-src), no carga, 0 peticiones a ella y 0 externas", /blocked by the CSP/.test(p6.verdict || "") && p6.load === false && p6.violation && /img-src/.test(p6.violation.directive) && !B.urls.some((u) => /127\.0\.0\.1:9\//.test(u)) && B.ext.filter((u) => !/^https:\/\/bogota\.gov\.co\//.test(u)).length === 0,
    `${p6.verdict} · load ${p6.load} · peticiones a la sonda ${B.urls.filter((u) => /127\.0\.0\.1:9\//.test(u)).length} · externas ${B.ext.length} (de ellas, a bogota.gov.co — el contraste de pico y placa, v16.9 — ${B.ext.filter((u) => /^https:\/\/bogota\.gov\.co\//.test(u)).length})`, "blocked by the CSP (img-src) · false · 0 · 0 fuera de bogota.gov.co");
  const others = JSON.parse(cspEv).filter((v) => !/127\.0\.0\.1:9/.test(v.uri) && !/object-src/.test(v.dir || ""));   // excluye las sondas deliberadas: img (loopback:9) y <embed> (object-src)
  C.check("D2.6b", "bajo la CSP del TV, la app entera no provoca ninguna otra violación (fuera de las dos sondas deliberadas)", others.length === 0, JSON.stringify(others).slice(0, 300), "[]");
  /* D2.6c: el origen real de $WEBAPIS se vuelca (document.scripts …webapis.js). En localhost el <script> va comentado → lista vacía */
  C.check("D2.6c", "p8e.diag · origen de $WEBAPIS volcado (document.scripts …webapis.js); en localhost el tag va comentado → lista vacía (en el TV: URL + origen)", Array.isArray(p1.webapisSrc),
    `webapisSrc ${JSON.stringify(p1.webapisSrc)}`, "array (vacío en localhost)");
  /* D2.6d: la prueba <embed>/CSP (object-src) escribe su resultado, deja el DOM limpio y no rompe nada */
  const embDom = await B.ev("document.querySelectorAll('embed').length");
  C.check("D2.6d", "p8e.diag · prueba <embed type=application/x-ppapi-productinfo>/object-src: escribió verdict, nodo creado y RETIRADO (DOM limpio), 0 <embed> en la página",
    typeof p6emb.verdict === "string" && /object-src/.test(p6emb.verdict) && p6emb.created === true && p6emb.removed === true && embDom === 0,
    `verdict «${p6emb.verdict}» · created ${p6emb.created} · removed ${p6emb.removed} · embeds en DOM ${embDom}`, "verdict con object-src · created true · removed true · 0 embeds");
  C.check("D2.7", "p8e.diag · 7 red: gateway, NetworkState 1–8 y códigos crudos del listener [5, 4]", p7.api === true && p7.gateway === true && p7.states && p7.states.GATEWAY_CONNECTED === 4 && Object.keys(p7.states).length === 8 && JSON.stringify((p7.codes || []).slice(-2).map((c) => c.code)) === "[5,4]",
    `gateway ${p7.gateway} · estados ${p7.states && Object.keys(p7.states).length} · códigos ${JSON.stringify((p7.codes || []).map((c) => c.code))}`, "true · 8 · [5,4]");
  C.check("D2.8", "fps: media y 1 % peor de los últimos fotogramas, en el panel y en p8e.diag", f.n >= 10 && f.avg > 0 && f.low1 > 0 && f.low1 <= f.avg + 0.05 && /fps/.test(await B.ev("document.querySelector('#p8eDiag .dg-fps').textContent")), JSON.stringify(f), "n ≥ 10 · avg > 0 · 0 < low1 ≤ avg");
  const raw = await B.ev("localStorage.getItem('p8e.diag')||''");
  C.check("D2.9", "privacidad: getDuid/getModelCode y getMac/getIp/getGateway/getDns/getSubnetMask llamados 0 veces y ningún señuelo en p8e.diag", tz.duid === 0 && !/CANARY/.test(raw), `llamadas ${tz.duid} · señuelo en el JSON ${/CANARY/.test(raw)}`, "0 · false");
  C.check("D2.10", "abierto: un rAF propio (el medidor) además del del launcher → ≤ 2; 1 contexto WebGL de la app + las sondas del punto 1", raf1 <= 2, `rAF máx ${raf1} · contextos ${await B.ev("__m47.glContexts")}`, "≤ 2");
  /* D3 · Back una vez no cierra; dos veces separadas > 2 s tampoco; dos seguidas sí. Al cerrar: suelta teclas, red y rAF */
  await B.key(10009, "m47"); await sleep(300); const b1 = await B.ev(OPEN); await sleep(2300); await B.key(10009, "m47"); await sleep(300); const b2 = await B.ev(OPEN);
  await B.key(10009, "m47"); await sleep(400); const b3 = await B.ev(OPEN), tz2 = JSON.parse(await B.ev("JSON.stringify(__m47.tizen)")), rp = await B.ev("__m47.rafPending");
  C.check("D3", "Back ×1 no cierra · ×2 separadas > 2 s no cierra · ×2 seguidas cierra; suelta las 8 teclas, el listener de red y su rAF", b1 && b2 && !b3 && tz2.unreg.length === 8 && tz2.netRemoved >= 1 && rp <= 1,
    `${b1} · ${b2} · ${b3} · unregister ${tz2.unreg.length} · red quitada ${tz2.netRemoved} · rAF pendientes ${rp}`, "true · true · false · 8 · ≥ 1 · ≤ 1");
  let s = await (async () => { await B.key(39, "m47"); await sleep(1100); return B.ev(PROBE); })();
  C.check("D3b", "cerrado, las teclas vuelven al launcher (→ navega)", s.app === "02/13", s.app, "02/13");
  /* D4 · ?dev=1 solo y ?diag=1 solo NO lo abren */
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?dev=1&idle=600000")); await sleep(1500); const n1 = await B.ev(EXISTS);
  await B.load(U("?diag=1&idle=600000")); await sleep(1500); const n2 = await B.ev(EXISTS);
  C.check("D4", "?dev=1 solo (modo de las pruebas) y ?diag=1 sin dev → no se abre (ni se crea el DOM)", !n1 && !n2, `${n1} · ${n2}`, "false · false");
  /* D5 · la secuencia del mando, sólo con keyCode (key/code ocultos), sin dev ni tizen */
  await B.load(U("?idle=600000")); await keys(COMBO, 160); await sleep(400); const c1 = await B.ev(OPEN), how = (await DG() || {}).how;
  await B.shot(path.join(C.out, "P8e-v14-C2-panel-por-combinacion.png"));
  await keys([10009, 10009], 150); await sleep(300); const c2 = await B.ev(OPEN); s = await B.ev(PROBE);
  C.check("D5", "↑↑↓↓←→←→ (keyCode 38 38 40 40 37 39 37 39) abre el panel en navegación normal; Back ×2 lo cierra; el corredor acaba donde empezó", c1 && how === "combo" && !c2 && s.app === "01/13", `abierto ${c1} (${how}) · tras Back×2 ${c2} · app ${s.app}`, "true (combo) · false · 01/13");
  /* D5b · «Clear saved data and close» borra de verdad (B1): la clave desaparece y no se reescribe */
  await keys(COMBO, 160); await sleep(400); const c3 = await B.ev(OPEN); await keys([39, 39, 39, 39, 39, 39, 39], 120); await B.key(13, "m47"); await sleep(600);   // v16.7: «Clear» era el 7.º botón · v16.9.1: el 8.º (entra «PyP contrast»)
  const cl = await B.ev("JSON.stringify({open:" + OPEN + ",key:localStorage.getItem('p8e.diag')})").then(JSON.parse);
  C.check("D5b", "«Clear saved data and close»: cierra y p8e.diag queda borrado (null), sin reescribirse", c3 && !cl.open && cl.key === null, `abierto ${c3} → ${cl.open} · clave ${cl.key === null ? "null" : String(cl.key).slice(0, 60)}`, "true → false · null");
  /* D6 · casi-combinaciones: no abren */
  const near = [];
  await B.load(U("?idle=600000")); await keys(COMBO.slice(0, 7), 140); await sleep(4300); await keys([39], 300); near.push(["7 + pausa de 4,3 s + →", await B.ev(EXISTS)]);
  await B.load(U("?idle=600000")); await keys([38, 38, 40, 40, 27, 37, 39, 37, 39], 140); await sleep(300); near.push(["Esc en medio", await B.ev(EXISTS)]);
  await B.load(U("?idle=600000")); await keys(COMBO, 600); await sleep(300); near.push(["8 teclas en 4,2 s (> 4 s)", await B.ev(EXISTS)]);
  await B.load(U("?idle=600000")); await keys([38, 38, 40, 40, 37, 39, 39, 37], 140); await sleep(300); near.push(["orden cambiado al final", await B.ev(EXISTS)]);
  await B.load(U("?idle=600000")); await keys([38, 38, 38, 40, 40, 37, 39, 37], 140); await sleep(300); near.push(["↑ de más (7 de 8 en ventana)", await B.ev(EXISTS)]);
  C.check("D6", "casi-combinaciones no abren (pausa, otra tecla en medio, demasiado lenta, orden cambiado)", near.every((n) => n[1] === false), JSON.stringify(near), "todas false");
  /* D7 · 200 teclas al azar (semilla fija) por la navegación normal: nunca se abre */
  await B.load(U("?idle=600000&launchback=1500"));
  let seed = 20171023 >>> 0; const rnd = () => { seed = (seed + 0x6D2B79F5) >>> 0; let x = seed; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const POOL = [37, 38, 39, 40, 13, 10009, 27], seq = [];
  for (let i = 0; i < 200; i++) { const c = POOL[Math.floor(rnd() * POOL.length)]; seq.push(c); await B.key(c, "m47"); await sleep(40 + Math.floor(rnd() * 100)); }
  await sleep(500); const r1 = await B.ev(EXISTS), errs = B.errors.length + await B.ev("__m47.errors.length");
  let hits = 0; for (let i = 0; i + 8 <= seq.length; i++) if (COMBO.every((c, j) => seq[i + j] === c)) hits++;
  C.check("D7", "200 teclas al azar (semilla 20171023; flechas, Enter, Back, Esc) → el panel nunca se abre; 0 excepciones", !r1 && errs === 0, `abierto ${r1} · la secuencia aparece ${hits} veces en lo enviado · excepciones ${errs} · prob. teórica por ventana (1/7)^8 = ${(Math.pow(1 / 7, 8)).toExponential(2)}, en 193 ventanas ≈ ${(193 * Math.pow(1 / 7, 8)).toExponential(2)}`, "false · 0");
  fs.writeFileSync(path.join(C.out, "P8e-v14-D7-teclas.json"), JSON.stringify(seq));
}

/* v15 · boot = the start-up cinematic intro (the "fase boot"): posed frame strip from power-on to
   corridor, skippable by any remote key landing on the EXACT v14 initial state, real model/network shown during the intro
   (preconnect), one rAF + one WebGL context + 1920×1080 + ES5, reduced-motion by fade. */
const BOOTST = `(function(){ var s=window.P8E?P8E.state():{}, b=document.getElementById('bands'), lx=document.getElementById('lx'), st=document.getElementById('artStill');
  return JSON.stringify({idx:s.idx, app:s.app, name:s.name, hcoord:s.hcoord, cap:s.cap,
    bands:(b||{}).className, lx:(lx||{}).className, still:st&&(st.getAttribute("data-art")||st.style.backgroundImage),
    bodycls:document.body.className, bootBg:!!document.getElementById('bootBg'), bootCv:!!document.getElementById('bootCv'),
    ready:document.documentElement.getAttribute('data-ready')}); })()`;
async function suiteBoot(B, C, U) {
  const waitFor = async (expr, ms) => { for (let t = 0; t < ms; t += 100) { if (await B.ev(expr)) return true; await sleep(100); } return false; };
  const strip = [0, 90, 180, 300, 440, 600, 760, 900, 1050, 1180, 1300, 1420, 1560, 1700, 1820, 1960];
  // C1 · posed frame strip (deterministic f(t)); kill the auto intro first, then pose each ms (glprof: count GL draws)
  await B.setMode({ m47: true, rev: C.rev, glprof: true }); await B.load(U("?dev=1&boot=1&idle=600000&net=online"));
  await B.ev("P8E.bootSkip()");                         // stop the live intro; bootPose re-creates the overlay deterministically
  const seen = { portal: 0, parts: 0 };
  for (const ms of strip) {
    await B.ev(`P8E.bootPose(${ms})`); await sleep(90);
    const bs = JSON.parse(await B.ev("JSON.stringify(P8E.bootState())"));
    if (bs.portalOn) seen.portal++; if (bs.parts > 0) seen.parts = bs.parts;
    if (C.shots) await B.shot(path.join(C.out, `P8e-v15.2-boot-${String(ms).padStart(4, "0")}ms.png`));
  }
  const climax = JSON.parse(await B.ev("P8E.bootPose(1280), JSON.stringify(P8E.bootState())")); await sleep(80);
  const climShot = path.join(C.out, "P8e-v15.2-C1-climax.png"); await B.shot(climShot);
  C.check("C1", "tira de fotogramas posada de la intro (0→corredor); clímax con título (partículas) y portal activo", seen.parts > 200 && seen.portal >= 3 && climax.parts > 200, `partículas ${climax.parts} · fotogramas con portal ${seen.portal}/${strip.length}`, "partículas > 200 · portal ≥ 3");
  const gq = await B.ev("__m47.gl.quads"); C.check("C1.p", "el portal (raymarch de gl.js) dibujó su quad en los fotogramas posados del portal", gq > 0, `quads ${gq}`, "> 0");

  // C2 · skippable → corridor immediately, EXACT v14 initial state (same as ?boot=0)
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?dev=1&boot=0&idle=600000&net=online")); await sleep(300);
  const ref = JSON.parse(await B.ev(BOOTST));
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?dev=1&boot=1&idle=600000&net=online"));
  const mid = JSON.parse(await B.ev("JSON.stringify(P8E.bootState())"));
  await sleep(600); await B.key(39, "m47"); await sleep(260);     // any remote key mid-intro cuts it
  const afterKey = JSON.parse(await B.ev(BOOTST)), bst = JSON.parse(await B.ev("JSON.stringify(P8E.bootState())"));
  const sameKeys = ["idx", "app", "name", "hcoord", "cap", "bands", "lx", "still", "bodycls", "bootBg", "bootCv"];
  const diffs = sameKeys.filter((k) => JSON.stringify(ref[k]) !== JSON.stringify(afterKey[k]));
  C.check("C2", "una tecla del mando corta la intro → corredor inmediato, estado = v14 inicial (0 diferencias con ?boot=0)", bst.done && bst.skipped && diffs.length === 0 && !afterKey.bootBg && !afterKey.bootCv, `saltada ${bst.skipped} · done ${bst.done} · diferencias ${JSON.stringify(diffs)} · overlay bg/cv ${afterKey.bootBg}/${afterKey.bootCv}`, "saltada · done · 0 diferencias · sin overlay");
  // also prove it was really mid-intro when we cut (the overlay existed)
  C.check("C2.b", "la intro estaba en marcha al pulsar (fase boot activa, overlay montado)", mid.on === true || mid.intro === true, `on ${mid.on} · intro ${mid.intro}`, "true");

  // C3 · preconnect: during the intro the real model and network state are shown (localhost: mock UN55MU6100)
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?dev=1&boot=1&idle=600000&net=online"));
  await B.ev("P8E.bootSkip()"); await B.ev(`P8E.bootPose(${1300})`); await sleep(90);
  const dshot = path.join(C.out, "P8e-v15.2-C3-datos.png"); await B.shot(dshot);
  const d = JSON.parse(await B.ev("JSON.stringify(P8E.bootState())"));
  C.check("C3", "preconexión: la intro muestra el modelo real (maqueta UN55MU6100) y el estado de red tras DOMContentLoaded", d.shownModel && d.model === "UN55MU6100" && d.shownNet && !!d.net, `modelo «${d.model}» · red «${d.net}» · shownModel ${d.shownModel} · shownNet ${d.shownNet}`, "UN55MU6100 · red no vacía · ambos mostrados");

  // C4 · performance/compat during the LIVE intro + el ARMADO (motor v13): one rAF, one WebGL context, 1920×1080, ES5
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.lastApp": null } }); await B.load(U("?dev=1&boot=1&idle=600000&net=online")); await sleep(700);   // v15.2 intro ~2,0 s + armado ~1,25 s: 0,7 s cae en pleno portal/título
  const liveOn = JSON.parse(await B.ev("JSON.stringify(P8E.bootState())"));
  const m = JSON.parse(await B.ev("JSON.stringify({raf:__m47.rafMax, gl:__m47.glContexts, glTypes:__m47.glTypes, err:__m47.errors.length, stage:[P8E.stats().stage.w,P8E.stats().stage.h]})"));
  await waitFor("P8E.bootState().done===true && P8E.bootState().phase===''", 6000);   // deja que la intro RESUELVA del todo (velo + armado encajado)
  const done = JSON.parse(await B.ev(BOOTST)), m2 = JSON.parse(await B.ev("JSON.stringify({raf:__m47.rafMax, gl:__m47.glContexts, err:__m47.errors.length})"));
  const sc = B.scan["/P8e/p8e.js"];
  C.check("C4", "un rAF, un contexto WebGL, lienzo 1920×1080, 0 errores, p8e.js ES5 (escáner 0)", m2.raf <= 1 && m2.gl <= 1 && m.stage[0] === 1920 && m.stage[1] === 1080 && m2.err === 0 && B.errors.length === 0 && sc && sc.hits === 0, `rAF ${m2.raf} · gl ${m2.gl} (${JSON.stringify(m.glTypes)}) · lienzo ${JSON.stringify(m.stage)} · errores ${m2.err}/${B.errors.length} · escáner ${sc ? sc.hits : "?"}`, "≤1 · ≤1 · 1920×1080 · 0 · 0");
  C.check("C4.b", "la intro acabó sola y resolvió al corredor (overlay fuera, sin fase boot)", !done.bootBg && !done.bootCv && !!done.cap, `overlay ${done.bootBg}/${done.bootCv} · cap «${done.cap}»`, "sin overlay · cap presente");
  C.info("C4.p", `portal en marcha a 0,7 s: ${liveOn.portalOn} · partículas del título ${liveOn.parts} · palancas: ?boot=0 (saltar), ?bootslow=N (lento), ?bootpart=0..1 (densidad), reutiliza ?portalres y ?glscale (coste del raymarch)`);

  // C5 · reduced-motion: fade only, no particles, no animated portal, still skippable
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.reduce": "1" } }); await B.load(U("?dev=1&boot=1&idle=600000&net=online"));
  const r0 = JSON.parse(await B.ev("JSON.stringify(P8E.bootState())"));
  const rm = JSON.parse(await B.ev("JSON.stringify({raf:__m47.rafMax, gl:__m47.glContexts})"));
  await sleep(700); const rDone = JSON.parse(await B.ev(BOOTST));
  C.check("C5", "reduced-motion: intro por fundido (0 partículas, 0 portal animado, ≤1 rAF, ≤1 contexto) y resuelve al corredor", r0.parts === 0 && !r0.portalOn && rm.gl <= 1 && rm.raf <= 1 && !rDone.bootBg, `partículas ${r0.parts} · portal ${r0.portalOn} · rAF ${rm.raf} · gl ${rm.gl} · overlay luego ${rDone.bootBg}`, "0 · false · ≤1 · ≤1 · sin overlay");
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.reduce": "1" } }); await B.load(U("?dev=1&boot=1&idle=600000&net=online"));
  await sleep(50); await B.key(13, "m47"); await sleep(120); const rSkip = JSON.parse(await B.ev("JSON.stringify(P8E.bootState())"));
  C.check("C5.b", "reduced-motion: también saltable con una tecla", rSkip.done, `done ${rSkip.done} · skipped ${rSkip.skipped}`, "done true");

  // C6 · v15.2: NI UN fotograma de fondo vinotinto entre la intro y el corredor. En la entrega del portal al corredor, el still
  // del corredor (la OBRA) debe estar visible ANTES de que el velo negro se funda; si no, el fundido descubría #tv = #1A0F14
  // (vinotinto oscuro) ~200 ms. Un registrador por rAF captura la entrega en VIVO y mide cada fotograma.
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.lastApp": null } }); await B.load(U("?dev=1&boot=1&idle=600000&net=online"));
  await B.ev("window.__wine=[];(function m(){var bg=document.getElementById('bootBg'),st=document.getElementById('artStill'),o=document.documentElement.getAttribute('data-boot'),bs=P8E.bootState();if(bs.on||o){window.__wine.push({bg:bg?bg.style.opacity:'x',vis:st?getComputedStyle(st).visibility:'x',db:o});}if(!(bs.on||o)&&window.__wine.length>4)return;requestAnimationFrame(m);})();");
  await waitFor("P8E.bootState().done===true && P8E.bootState().overlayGone===true", 7000); await sleep(200);
  const wine = JSON.parse(await B.ev("JSON.stringify(window.__wine||[])"));
  const wineGap = wine.filter((r) => r.vis === "hidden" && r.bg !== "1" && r.db === "1");
  C.check("C6", "ni un fotograma de fondo vinotinto (#1A0F14) entre intro y corredor: en cada fotograma de la entrega, con el velo ya fundiéndose, el still del corredor ya está presente (la obra, no el escenario)", wine.length > 10 && wineGap.length === 0, `fotogramas de entrega ${wine.length} · con velo abierto y still OCULTO ${wineGap.length}`, "> 10 muestreados · 0 con fondo plano");

  // C7 · v15.2: la intro RESUELVE armando el cassette (motor de la VUELTA INVERSA v13, fxRev) en la ÚLTIMA APP USADA.
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.lastApp": null } }); await B.load(U("?dev=1&boot=1&lastapp=5&idle=600000&net=online"));
  const sawArm = await waitFor("P8E.bootState().armStarted===true && P8E.bootState().armApp===5 && P8E.bootState().armRun===true", 7000);
  const armMid = JSON.parse(await B.ev("JSON.stringify(P8E.bootState())"));
  if (C.shots && sawArm) await B.shot(path.join(C.out, "P8e-v15.2-C7-armado.png"));   // armado a mitad (vuelta inversa en marcha)
  await waitFor("P8E.bootState().done===true && P8E.bootState().phase==='' && P8E.bootState().armRun===false", 7000);
  const armDone = JSON.parse(await B.ev(BOOTST)), armDs = JSON.parse(await B.ev("JSON.stringify(P8E.bootState())"));
  if (C.shots) await B.shot(path.join(C.out, "P8e-v15.2-C7-corredor-firme-app5.png"));
  C.check("C7", "la intro RESUELVE armando el cassette (motor v13: fxRev, specs grabadas) en la última app (?lastapp=5) y queda firme en esa app", sawArm && armMid.fxRev === true && armDs.specs > 0 && armDs.fxRevRuns > 0 && armDs.idx === 5 && armDone.app === 6 && !armDone.bootBg && !armDone.bootCv && !!armDone.cap, `armApp ${armMid.armApp} · fxRev ${armMid.fxRev} · specs ${armDs.specs} · fxRevRuns ${armDs.fxRevRuns} · idx ${armDs.idx} · app ${armDone.app} · overlay ${armDone.bootBg}/${armDone.bootCv} · cap «${armDone.cap}»`, "arma app 5 (idx 5, app 6) · motor v13 · corredor firme sin overlay");

  // C7.b · reutiliza el motor SIN reimplementarlo: la vuelta inversa dejó la pila EXACTAMENTE en reposo = al saltar (?boot=0 en app 5)
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.lastApp": null } }); await B.load(U("?dev=1&boot=0&lastapp=5&idle=600000&net=online")); await sleep(400);
  const ref5 = JSON.parse(await B.ev(BOOTST));
  const diffs5 = ["idx", "app", "name", "hcoord", "cap", "bands", "lx", "still", "bodycls"].filter((k) => JSON.stringify(ref5[k]) !== JSON.stringify(armDone[k]));
  C.check("C7.b", "el corredor tras el armado = el corredor directo en la misma app (?boot=0&lastapp=5): 0 diferencias (reposo v14 exacto, cassette firme)", diffs5.length === 0 && !ref5.bootBg, `diferencias ${JSON.stringify(diffs5)}`, "0 diferencias");

  // C8 · «última app usada»: sin historial → app 0; el foco se GUARDA en cada cambio (go, write); al arrancar se LEE (read).
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.lastApp": null } }); await B.load(U("?dev=1&boot=1&idle=600000&net=online"));
  const d0 = JSON.parse(await B.ev("JSON.stringify(P8E.bootState())"));                                   // sin historial → app 0
  // WRITE: salta la intro, navega dos a la derecha → el foco (índice 2) queda en localStorage
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.lastApp": null } }); await B.load(U("?dev=1&boot=0&idle=600000&net=online")); await sleep(300);
  await B.key(39, "m47"); await sleep(420); await B.key(39, "m47"); await sleep(420);
  const stored = await B.ev("localStorage.getItem('p8e.lastApp')"), navSt = JSON.parse(await B.ev("JSON.stringify(P8E.state())"));
  // READ: un valor sembrado en localStorage hace que el arranque empiece en esa app (reinicio del TV)
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.lastApp": "2" } }); await B.load(U("?dev=1&boot=1&idle=600000&net=online")); await sleep(200);
  const reSt = JSON.parse(await B.ev("JSON.stringify(P8E.bootState())"));
  C.check("C8", "persistencia de la última app: sin historial arranca en app 0; el foco se GUARDA (p8e.lastApp) al navegar y se LEE al arrancar (TV reiniciado → misma app)", d0.idx === 0 && d0.lastApp === -1 && String(stored) === String(navSt.idx) && navSt.idx === 2 && reSt.idx === 2, `sin historial idx ${d0.idx}/lastApp ${d0.lastApp} · al navegar idx ${navSt.idx} guardado «${stored}» · sembrado 2 → arranca idx ${reSt.idx}`, "app 0 · guarda 2 · lee 2");
}

/* ======================================================================================================
   6 · MAIN
   ====================================================================================================== */
function parseArgs(a) { const o = { suite: null, rev: null, against: null, base: "http://127.0.0.1:8800/P8e/", out: null, shots: false, timeout: 1200000, chrome: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", fast: false, scanFiles: null };
  for (let i = 0; i < a.length; i++) { const k = a[i];
    if (k === "--selftest") o.selftest = true; else if (k === "--shots") o.shots = true; else if (k === "--fast") o.fast = true;
    else if (k === "--scan") { o.scanFiles = a.slice(i + 1); break; }
    else if (/^--(suite|rev|against|base|out|timeout|chrome|root)$/.test(k) && a[i + 1] !== undefined) o[k.slice(2)] = a[++i];
    else { console.log(`[FALLA] opción desconocida o sin valor: ${JSON.stringify(k)} (válidas: --suite --rev --against --base --out --timeout --chrome --root --shots --fast --selftest --scan)`); process.exit(64); } }
  o.timeout = +o.timeout; if (!isFinite(o.timeout) || o.timeout < 10000) { console.log("[FALLA] --timeout debe ser ≥ 10000 ms"); process.exit(64); } return o; }

/* v16 · PÁGINA OCULTA: con document.hidden el launcher no relevaba obras ni subía
   texturas por su cuenta? Antes sí (relojes vivos). Ahora: relevo en curso asentado por corte, relojes del arte parados, los
   cuatro giros y el paneo en PAUSA (currentTime quieto), nextArt oculto = nada; al volver, play() desde el mismo punto (sin
   salto) y el relevo reprogramado. document.hidden se simula (getter + visibilitychange): headless no oculta una pestaña sin
   pararle el rAF, y lo que se prueba es la reacción del launcher al evento. */
async function suiteHidden(B, C, U) {
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?dev=1&idle=600000")); await sleep(3200);
  const HIDE = (h) => `(function(){ Object.defineProperty(document,"hidden",{configurable:true,get:function(){ return ${h}; }}); document.dispatchEvent(new Event("visibilitychange")); return 1; })()`;
  const ANIMS = `(function(){ var g=__m47.getAnims||Element.prototype.getAnimations, els=[].slice.call(document.querySelectorAll('.item.rich .L1 canvas, .item.rich .L2 canvas')).concat([document.getElementById('artStill')]), o=[];
    els.forEach(function(e){ (g.call(e)||[]).forEach(function(a){ if(a.playState==="running"||a.playState==="paused") o.push({s:a.playState,t:Math.round(a.currentTime||0)}); }); }); return o; })()`;
  const st = () => B.ev("(function(){ var s=P8E.state(), a=P8E.stats().art; return {hid:s.hid, inT:s.inTransition, timer:s.artTimer, tr:a.transitions, up:a.uploads, idx:s.artIdx}; })()");
  await B.ev("P8E.nextArt(),1"); await sleep(450);
  const s0 = await st();
  await B.ev(HIDE(true)); await sleep(100);
  const s1 = await st(), a1 = await B.ev(ANIMS);
  C.check("HD1", "oculta con un relevo en marcha: el relevo se asienta por corte y el reloj del relevo se para", s0.inT === true && s1.hid.on && s1.hid.cut === 1 && s1.inT === false && s1.timer === false, `antes inTransition ${s0.inT} · después ${JSON.stringify(s1)}`, "en marcha → asentado, cut 1, sin reloj");
  await sleep(1500);
  const a2 = await B.ev(ANIMS);
  C.check("HD2", "oculta: los 4 giros y el paneo en PAUSA y su currentTime quieto 1,5 s", a1.length >= 5 && a1.every((x) => x.s === "paused") && JSON.stringify(a1) === JSON.stringify(a2), `${JSON.stringify(a1)} → ${JSON.stringify(a2)}`, "≥ 5 pausadas, mismas t");
  await B.ev("P8E.nextArt(),1"); await sleep(600);
  const s2 = await st();
  C.check("HD3", "oculta: un relevo pedido no arranca ni sube texturas", s2.tr === s1.tr && s2.up === s1.up && s2.inT === false && s2.idx === s1.idx, `relevos ${s1.tr}→${s2.tr} · subidas ${s1.up}→${s2.up} · obra ${s1.idx}→${s2.idx}`, "iguales");
  await B.ev(HIDE(false)); await sleep(60);
  const s3 = await st(), a3 = await B.ev(ANIMS);
  const cont = a3.length === a2.length && a3.every((x, i) => x.s === "running" && x.t >= a2[i].t && x.t - a2[i].t < 400);
  C.check("HD4", "visible otra vez: todo sigue desde el MISMO punto (sin salto: Δt < 400 ms) y el relevo se reprograma", !s3.hid.on && s3.hid.resumed >= 5 && cont && s3.timer === true, `${JSON.stringify(a2)} → ${JSON.stringify(a3)} · ${JSON.stringify(s3.hid)} · reloj ${s3.timer}`, "running, Δt < 400, resumed ≥ 5, reloj");
  await sleep(2600); await B.ev("P8E.nextArt(),1"); await sleep(2600);
  const s4 = await st();
  C.check("HD5", "tras volver, el relevo funciona (dispersal completo) y 0 excepciones", s4.tr === s3.tr + 1 && B.errors.length === 0, `relevos ${s3.tr}→${s4.tr} · errores ${JSON.stringify(B.errors).slice(0, 200)}`, "+1 · 0");
}

/* v16.1 · el medidor ?fps=1, ?flat=1 (el corredor quieto en un canvas: entra en reposo, sale ANTES de
   navegar, mismo aspecto) y la tabla del banco (?benchshow=1 con un resultado sembrado). El banco entero (30 recargas) no corre
   aquí: tarda ~8 min a 10 s por fila; se probó aparte con ?benchms=3000 (README, v16.1). */
async function suiteMeter(B, C, U) {
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?dev=1&idle=600000&fps=1")); await sleep(2800);
  const f = await B.ev("(function(){ var e=document.querySelector('.fps-corner'); if(!e) return null; var r=e.getBoundingClientRect(), s=getComputedStyle(e); return {t:e.textContent, w:r.width, h:r.height, bg:s.backgroundColor}; })()");
  C.check("MT1", "?fps=1: esquina opaca pequeña con media y 1 % low", f && /^\d+(\.\d)? fps · 1% \d+(\.\d)?$/.test(f.t) && f.w * f.h <= 220 * 44 + 1 && f.bg === "rgb(0, 0, 0)", JSON.stringify(f), "«NN.N fps · 1% NN.N», ≤ 220×44, negro");
  await B.load(U("?dev=1&idle=600000&flat=1")); await sleep(1500);
  const vis = "(function(){ var n=0; [].forEach.call(document.querySelectorAll('.item,.star'),function(e){ if(getComputedStyle(e).display!=='none') n++; }); var c=document.querySelector('.corr-flat'); return {dom:n, cv:c?getComputedStyle(c).display:'none', fl:P8E.state().flat}; })()";
  const v0 = await B.ev(vis); await B.ev("P8E.idleNow(),1"); await sleep(400); const v1 = await B.ev(vis);
  C.check("MT2", "?flat=1 en reposo: el corredor quieto pasa a UN canvas y sus capas se apagan", v1.fl.on && v1.cv === "block" && v1.dom < v0.dom && v1.fl.hidden === v0.dom - v1.dom && !v1.fl.err, `${JSON.stringify(v0)} → ${JSON.stringify(v1)}`, "on, canvas visible, ítems/estrellas fuera del DOM pintado");
  await B.key(39, "m47"); await sleep(60); const v2 = await B.ev(vis);
  C.check("MT3", "una tecla que navega: el corredor vuelve al DOM antes de moverse (canvas oculto, nada con .flatd)", !v2.fl.on && v2.cv === "none" && v2.fl.hidden === 0 && (await B.ev("document.querySelectorAll('.flatd').length")) === 0, JSON.stringify(v2), "off · none · 0");
  await sleep(1500); C.check("MT4", "0 excepciones con ?flat=1", B.errors.length === 0, JSON.stringify(B.errors).slice(0, 200), "0");
  await B.load(U("?dev=1&idle=600000&rich=0&idleart=0")); await sleep(800);
  await B.ev(`localStorage.setItem("p8e.bench",JSON.stringify({when:"2026-10-25T00:00:00Z",ua:"Chrome/47.0.2526.69",win:[1536,864,1.25],ms:10000,res:[{k:"v16",avg:16.2,low1:4.1,worst:240,n:160,rel:0},{k:"dot",avg:22.3,low1:13.8,worst:80,n:220,rel:0}]})),1`);
  await B.load(U("?dev=1&idle=600000&rich=0&idleart=0&benchshow=1")); await sleep(800);
  const t = await B.ev("(function(){ var d=document.querySelector('.bench-t'); if(!d) return null; var r=d.getBoundingClientRect(); return {rows:d.querySelectorAll('tr').length, txt:d.textContent.slice(0,400), w:r.width, h:r.height}; })()");
  C.check("MT5", "?benchshow=1: tabla opaca a pantalla completa con las filas guardadas", t && t.rows === 3 && /16\.2/.test(t.txt) && t.w === 1920 && t.h === 1080, JSON.stringify(t), "cabecera + 2 filas, 1920×1080");
  await B.ev("localStorage.removeItem('p8e.bench'),1");
  /* ?bg=fixed (propuesta del autor, apagada por defecto): still quieto y centrado, sin relevo al navegar ni por reloj */
  await B.load(U("?dev=1&idle=600000&bg=fixed&art=2")); await sleep(1800);
  const fx = "(function(){ var e=document.getElementById('artStill'), g=__m47.getAnims||Element.prototype.getAnimations, s=P8E.state(); return {anims:(g.call(e)||[]).filter(function(a){ return a.playState==='running'; }).length, tf:e.style.transform, art:s.artIdx, tr:P8E.stats().art.transitions, timer:s.artTimer}; })()";
  const b0 = await B.ev(fx); await B.key(39, "m47"); await sleep(2400); const b1 = await B.ev(fx);
  C.check("MT6", "?bg=fixed: obra fija sin paneo; navegar no la releva; sin reloj de relevo", b0.anims === 0 && b0.art === 2 && b1.art === 2 && b1.tr === b0.tr && b0.timer === false && b1.timer === false && B.errors.length === 0, `${JSON.stringify(b0)} → ${JSON.stringify(b1)}`, "0 anims · obra 2 → 2 · 0 relevos · sin reloj");
}

/* v16.2 · relevo con ESPERA (decisión del autor: tras la última pulsación, RELEVO_WAIT ms, UN
   dispersal hasta el mismo destino), precalentado del relevo, ?cassflat (el cassette quieto re-montado plano: entra en reposo,
   sale antes de navegar, bobinas/anillos sincronizados con los originales). */
async function suiteV162(B, C, U) {
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?dev=1&idle=600000")); await sleep(4200);
  const st = () => B.ev("(function(){ var s=P8E.state(), a=P8E.stats().art; return {art:s.artIdx, tr:a.transitions, inT:s.inTransition, rel:s.relevo, warm:a.warm, cf:s.cassflat}; })()");
  const s0 = await st();
  C.check("R1", "precalentado: con la página quieta, el programa del dispersal y las texturas ya están listos (warm ≥ 1)", s0.warm >= 1, JSON.stringify(s0), "warm ≥ 1");
  for (let i = 0; i < 3; i++) { await B.key(39, "m47"); await sleep(250); }
  const s1 = await st();
  C.check("R2", "ráfaga de 3 flechas: ningún relevo mientras se navega (espera armada, 3 pendientes)", s1.tr === s0.tr && !s1.inT && s1.rel.armed && s1.rel.pend === 3, JSON.stringify(s1), "0 relevos · armada · pend 3");
  await sleep(700); const s2 = await st();
  C.check("R3", "a los 600 ms de la última: UN dispersal hacia la MISMA obra de antes (+3)", s2.inT && s2.art === (s0.art + 3) % 15 && !s2.rel.armed, `${s0.art} → ${s2.art} · en relevo ${s2.inT}`, "en relevo · obra +3");
  await sleep(2400); const s3 = await st();
  C.check("R4", "el relevo acaba y es uno solo", s3.tr === s0.tr + 1 && !s3.inT, `relevos ${s0.tr}→${s3.tr} · ${JSON.stringify(s3)} · ${JSON.stringify(await B.ev("P8E.state().prof"))}`, "+1");
  await B.load(U("?dev=1&idle=600000&relevowait=0")); await sleep(3000);
  const t0 = await st(); await B.key(39, "m47"); await sleep(120); const t1 = await st();
  C.check("R5", "?relevowait=0: el relevo arranca en cada cambio de app, como la v16.1", t1.inT && t1.art === (t0.art + 1) % 15, `${JSON.stringify(t0.art)} → ${t1.art} · ${t1.inT}`, "en relevo · +1");
  /* cassflat */
  await B.load(U("?dev=1&idle=600000&cassflat=1")); await sleep(3500); await B.ev("P8E.idleNow(),1"); await sleep(600);
  const c1 = await B.ev(`(function(){ var s=P8E.state().cassflat, o=document.querySelector('.cflat'), g=__m47.getAnims||Element.prototype.getAnimations;
    var orig=[].slice.call(document.querySelectorAll('.item.rich .L1 canvas, .item.rich .L2 canvas')).map(function(e){ return (g.call(e)||[]).filter(function(a){ return a.playState==='running'; })[0]; }).filter(Boolean);
    var cl=[].slice.call(document.querySelectorAll('.cflat .cf-d')).map(function(e){ return (g.call(e)||[])[0]; }).filter(Boolean);
    var dt=orig.length===4&&cl.length===4?Math.max.apply(null,[1,2,3].map(function(i){ return Math.abs(orig[i].currentTime-cl[i].currentTime); })):-1;
    return {s:s, vis:o?getComputedStyle(o).display:'none', stage:getComputedStyle(document.querySelector('.item.rich .stage')).visibility, kids:o?o.children.length:0, dt:Math.round(dt)}; })()`);
  C.check("CF1", "?cassflat=1 en reposo: cassette plano horneado (atrás + 4 cantos + 4 bobinas/anillos + delante), pila 3D oculta, giros sincronizados (Δ < 50 ms)", c1.s.on && c1.s.mode === "bake" && c1.vis === "block" && c1.stage === "hidden" && c1.kids >= 10 && c1.s.anims === 4 && c1.dt >= 0 && c1.dt < 50 && !c1.s.err, JSON.stringify(c1), "on · bake · ≥ 10 hijos · 4 anims · Δ < 50");
  await B.key(39, "m47"); await sleep(60);
  const c2 = await B.ev("(function(){ var o=document.querySelector('.cflat'); return {on:P8E.state().cassflat.on, vis:o?getComputedStyle(o).display:'none', stage:getComputedStyle(document.querySelector('.item.rich .stage')).visibility, hid:document.querySelectorAll('.cf-hide,.flatd').length}; })()");
  C.check("CF2", "una flecha: vuelve la pila 3D antes de moverse (capa plana fuera, nada oculto)", !c2.on && c2.vis === "none" && c2.stage === "visible" && c2.hid === 0, JSON.stringify(c2), "off · none · visible · 0");
  await sleep(1500); C.check("CF3", "0 excepciones con ?cassflat=1", B.errors.length === 0, JSON.stringify(B.errors).slice(0, 200), "0");
}

/* v16.4 · BANCO REMOTO del launcher contra un servidor FALSO del arnés (el contrato de serve_lan.py
   --remote; los rechazos del servidor de verdad los prueba tools/test_serve_lan.py). Lote corto: 2 filas de 3 s. */
async function suiteRemote(B, C, U) {
  await B.setMode({ m47: true, rev: C.rev });
  B.remoteFake = { queue: [], results: [], gets: 0, bad: [], key: "c0ffee42", nokey: 0 };
  const R = B.remoteFake;
  /* sin dev: nada */
  await B.load(U("?remote=1&idle=600000")); await sleep(6500);
  C.check("RM0", "sin ?dev=1 el modo remoto no existe (0 GET, sin aviso)", R.gets === 0 && (await B.ev("!document.querySelector('.remote-badge')")), `GET ${R.gets}`, "0 · sin aviso");
  /* sin la clave (rk) no se pregunta nada */
  await B.load(U("?dev=1&remote=1"), false); await sleep(4500);
  const nk = await B.ev("(document.querySelector('.remote-badge')||{}).textContent||''");
  C.check("RM0b", "?dev=1&remote=1 SIN rk: aviso «REMOTE · falta rk» y 0 peticiones", nk === "REMOTE · falta rk" && R.gets === 0 && R.nokey === 0, `${nk} · GET ${R.gets} · sin clave ${R.nokey}`, "falta rk · 0 · 0");
  await B.load(U("?dev=1&remote=1&rk=c0ffee42"), false); await sleep(4500);
  const w = await B.ev("(function(){ var b=document.querySelector('.remote-badge'); if(!b) return null; var r=b.getBoundingClientRect(); return {t:b.textContent, w:r.width, h:r.height, bg:getComputedStyle(b).backgroundColor, q:location.search}; })()");
  C.check("RM1", "?dev=1&remote=1: espera quieta (rich=0&idleart=0) con el aviso pequeño y opaco, y pregunta /__remote/next", w && w.t === "REMOTE · esperando" && w.bg === "rgb(0, 0, 0)" && w.h <= 52 && w.w < 700 && /rich=0/.test(w.q) && R.gets >= 1, JSON.stringify(w) + " · GET " + R.gets, "aviso · negro · ≤ 52 px · GET ≥ 1");
  R.queue.push({ id: "prueba-1", ms: 3000, settle: 500, rows: [{ label: "v16.2", q: "", nav: 0, relevo: 0 }, { label: "cassflat", q: "cassflat=1", nav: 0, relevo: 1 }, { label: "mala", q: "dev=0", nav: 0, relevo: 0 }] });
  /* v16.6: mientras mide se ve «MIDIENDO n/N · fila» */
  let meas = ""; for (let t2 = 0; t2 < 20 && !/^MIDIENDO/.test(meas); t2++) { await sleep(500); try { meas = await B.ev("(document.querySelector('.remote-badge')||{}).textContent||''"); } catch (e) {} }
  C.check("RM6", "mientras mide: aviso visible «MIDIENDO n/N · fila»", /^MIDIENDO 1\/2 · v16\.2$/.test(meas), meas, "MIDIENDO 1/2 · v16.2");
  let t = 0; while (!R.results.length && t < 90) { await sleep(1000); t++; }
  const r = R.results[0] || {};
  const rowsOk = r.rows && r.rows.length === 2 && r.rows.every((x) => typeof x.fps === "number" && x.fps > 0 && typeof x.low1 === "number" && typeof x.worst === "number") && r.rows[1].q === "cassflat=1" && r.rows[0].label === "v16.2";
  C.check("RM2", "lote de 3 filas (1 inválida): corre 2, POST con id, ua, win WxHxDPR, filas con fps/low1/worst/note y la rechazada en errors", r.id === "prueba-1" && /^\d+x\d+x[\d.]+$/.test(r.win || "") && /Chrome/.test(r.ua || "") && rowsOk && (r.errors || []).length === 1 && /reservado/.test(r.errors[0]) && R.bad.length === 0,
    JSON.stringify(r).slice(0, 400) + " · sin clave " + R.nokey, "2 filas · 1 error · id");
  C.check("RM2b", "todas las peticiones llevaron la clave (0 rechazadas por falta de X-P8e-Remote) y la URL de espera ya no la lleva", R.nokey === 0 && !/rk=/.test(await B.ev("location.search")), `sin clave ${R.nokey} · ${await B.ev("location.search")}`, "0 · sin rk");
  await sleep(2500); const g0 = R.gets; await sleep(6000);
  const w2 = await B.ev("(function(){ var b=document.querySelector('.remote-badge'); return b?b.textContent:null; })()");
  C.check("RM3", "tras entregar vuelve a esperar (aviso) y sigue preguntando cada 5 s", w2 === "REMOTE · esperando" && R.gets > g0, `${w2} · GET ${g0}→${R.gets}`, "esperando · GET +");
  R.queue.push("{esto no es json");
  t = 0; while (R.results.length < 2 && t < 15) { await sleep(1000); t++; }
  const r2 = R.results[1] || {};
  C.check("RM4", "lote roto: no corre nada y entrega el error", r2.rows && r2.rows.length === 0 && /JSON|rows/.test((r2.errors || [])[0] || ""), JSON.stringify(r2).slice(0, 200), "0 filas · error");
  C.check("RM5", "0 excepciones", B.errors.length === 0, JSON.stringify(B.errors).slice(0, 200), "0");
  /* v16.6: el TV recarga la URL de espera a mitad de un lote → se retoma en la fila cortada */
  R.queue.push({ id: "retoma", ms: 3000, settle: 500, rows: [{ label: "uno", q: "", nav: 0, relevo: 0 }, { label: "dos", q: "flat=0", nav: 0, relevo: 0 }] });
  let rt = 0; while (rt < 30) { await sleep(500); rt++; let q = ""; try { q = await B.ev("location.search"); } catch (e) {} if (/benchrun=1/.test(q)) break; }
  await B.load(U("?dev=1&remote=1&rk=c0ffee42"), false);
  let tt = 0; while (R.results.length < 3 && tt < 60) { await sleep(1000); tt++; }
  const r3 = R.results[2] || {};
  C.check("RM7", "recargar a mitad del lote: se retoma y entrega las 2 filas con la nota del corte", r3.id === "retoma" && r3.rows && r3.rows.length === 2 && (r3.errors || []).some((e) => /retomado/.test(e)), JSON.stringify(r3).slice(0, 300), "2 filas · «retomado»");
  /* v16.6 (N4): 403 → «clave rechazada» y no insiste */
  R.key = "otraclave"; const g1 = R.gets; await sleep(6500);
  const bad = await B.ev("(document.querySelector('.remote-badge')||{}).textContent||''"); const n1 = R.nokey; await sleep(6000);
  C.check("RM8", "con la clave rechazada (403): aviso «clave rechazada» y deja de preguntar", /clave rechazada/.test(bad) && R.nokey === n1, `${bad} · 403 ${n1}→${R.nokey}`, "clave rechazada · sin más intentos");
  await B.ev("try{ sessionStorage.removeItem('p8e.remote'); sessionStorage.removeItem('p8e.remote.rk'); }catch(e){} 1"); B.remoteFake = null;
}

/* v16.6 · cassflat + flat POR DEFECTO, horneado por pasos DE ANTEMANO, caché de pintado por app con la
   vecina pintada antes de llegar (mismos píxeles), stillpre (diagnóstico). */
async function suiteV166(B, C, U) {
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?dev=1&idle=600000")); await sleep(4500);
  const st0 = await B.ev("(function(){ var s=P8E.state(); return {cf:s.cassflat, fl:s.flat}; })()");
  await B.ev("P8E.idleNow(),1"); await sleep(500);
  const st1 = await B.ev("(function(){ var s=P8E.state(); return {cf:s.cassflat, fl:s.flat}; })()");
  C.check("V1", "por defecto, en reposo: flat y cassflat (horneado) activos", st1.cf.on && st1.cf.mode === "bake" && st1.fl.on && !st1.cf.err, JSON.stringify(st1), "cassflat bake · flat on");
  const pf = await B.ev("JSON.stringify(window.__cfprof||null)");
  C.check("V2", "el horneado estaba hecho DE ANTEMANO (al entrar en reposo sólo se monta el DOM)", st1.cf.ms < 200 && (await B.ev("P8E.stats?1:0")) === 1, `montaje ${st1.cf.ms} ms`, "< 200 ms");
  await B.load(U("?dev=1&idle=600000&cassflat=0&flat=0")); await sleep(3000); await B.ev("P8E.idleNow(),1"); await sleep(400);
  const st2 = await B.ev("(function(){ var s=P8E.state(); return {cf:s.cassflat.on, fl:s.flat.on}; })()");
  C.check("V3", "?cassflat=0&flat=0 los apaga", !st2.cf && !st2.fl, JSON.stringify(st2), "off · off");
  /* caché de pintado (bg=fixed para que el arte no cambie): volver a la app 1 desde la caché da los MISMOS píxeles que la app 1
     recién arrancada. Sin caché, repintarla al volver NO da exactamente lo mismo en Chrome (el texto de un canvas se rasteriza un
     poco distinto la 2.ª vez: medido, es del navegador, también en la v16.5); la caché la deja como la primera vez. */
  const shot = async (q, seq) => { await B.load(U("?dev=1&idle=600000&cassflat=0&flat=0&bg=fixed" + q)); await sleep(2500);
    for (const kc of seq) { await B.key(kc, "m47"); await sleep(3400); }
    const pc = await B.ev("JSON.stringify(P8E.state().pc||null)");
    await B.ev("(function(){ var a=__m47.docAnims?__m47.docAnims.call(document):document.getAnimations(); a.forEach(function(x){ try{ x.pause(); x.currentTime=3000; }catch(e){} }); return 1; })()");
    await sleep(400); return { png: await B.shot(null), pc }; };
  const A = await shot("", [39, 37]), Z = await shot("", []);
  const d = pngDiff(A.png, Z.png, 2, 60, [[0, 900, 760, 1080], [0, 0, 1920, 120], [1480, 100, 1920, 440]]);   // reloj, HUD y el rotador de sugerencias
  C.check("V4", "caché de pintado: al volver a la app 1 sale de la caché (hit) y es igual a la app 1 recién arrancada (sólo el ruido de dos arranques iguales; sin reloj, HUD ni sugerencias)", /"hits":[1-9]/.test(A.pc || "") && d.hotCells === 0 && d.ratio < 0.0005, `${A.pc} · ${JSON.stringify(d)}`, "hits ≥ 1 · 0 zonas · < 0,05 % (= ruido entre dos arranques iguales, ~300 px sueltos)");
  /* stillpre (diagnóstico) */
  await B.load(U("?dev=1&idle=600000&stillpre=1")); await sleep(3500); await B.ev("P8E.nextArt(),1"); await sleep(2600);
  const pr = await B.ev("JSON.stringify(P8E.state().prof)");
  C.check("V5", "?stillpre=1: el still nuevo entra a mitad del dispersal (pre ≥ 0,5) y el relevo acaba sin errores", /"pre":0\.[5-9]/.test(pr) && B.errors.length === 0, pr, "pre ≥ 0,5 · 0 errores");
}

/* v16.7 · launch on the real TV: system tapes, Browser by ApplicationControl and its fallbacks, the Netflix
   plan, the return message (hot and cold), the life trail that survives the TV terminating Rewind, Source / Exit keys, the no-show
   watchdog, the reply-return lever and ?sys=0. Against the simulated `tizen` of the shim (ApplicationControl = «ac:<id>»). */
async function suiteV167(B, C, U) {
  const st = () => B.ev(PROBE), L = async () => JSON.parse(await B.ev("JSON.stringify(P8E.stats().launch)")), TZ = async () => JSON.parse(await B.ev("JSON.stringify(window.__m47.tizen||null)"));
  const AD = async () => JSON.parse(await B.ev("JSON.stringify(P8EApps.stats())")), V = async () => JSON.parse(await B.ev("JSON.stringify(P8E.v167())"));
  const LS = async (k) => B.ev(`localStorage.getItem(${JSON.stringify(k)})`);
  const Q = "?dev=1&launchback=0&idle=600000&retg=0&noscreen=0", OPEN_MS = 1250 + 900;   // sin noshow: V10 lo fija (qp toma la 1.ª aparición)
  const SYS = [[11, "Apps", "org.volt.apps"], [12, "Settings", "org.tizen.menu"], [13, "Search", "org.volt.search-all"]];   // v16.9: Sources fuera
  const ALLOK = SYS.map((x) => x[2]).concat(["ac:RN1MCdNq8t.Netflix", "xvvl3S1TT1.TizenTubeStandalone", "ac:org.tizen.browser", "RewindSA01.Rewind"]);
  let errs = [];
  const go = async (tz, q = "", store = null) => { await B.setMode({ m47: true, rev: C.rev, tizen: tz, store }); await B.load(U(Q + q)); };
  const done = () => { errs = errs.concat(B.errors); };
  /* V1 · las cintas del sistema (v16.9: 4, 11–13), en inglés, con su id, su logo de logos.js (SVG 24×24) y su tinte; cada una lanza su id */
  const per = [];
  for (const [n, nm, id] of SYS) { await go({ ok: ALLOK }, "&app=" + n); const s0 = await st();
    await B.key(13, "m47"); await sleep(OPEN_MS); const l = await L(), t = await TZ();
    per.push({ n, nm, cap: s0.cap, app: s0.app, launches: t.launches, oks: l.oks, ok: s0.cap === nm && s0.app === n + "/13" && JSON.stringify(t.launches) === JSON.stringify([id]) && l.oks === 1 }); done(); }
  const apps = JSON.parse(await B.ev("JSON.stringify(P8E.apps())"));
  const logos = JSON.parse(await B.ev(`JSON.stringify(["apps","ajustes","buscar"].map(function(k){ var s=(P8E.v167().sysLogos||{})[k]||"", d=s?new DOMParser().parseFromString(s,"image/svg+xml").documentElement:null;
    return [k, !!d&&d.nodeName==="svg"&&d.getAttribute("viewBox")==="0 0 24 24"&&d.getAttribute("stroke")==="currentColor"&&!(window.LOGOS&&LOGOS[k])]; }))`));
  C.check("V167.1", "cintas del sistema 11–13 (Apps, Settings, Search; v16.9 sin Sources): rótulo en inglés, «NN/13», cada una lanza SU id leído en el TV (un intento, abre)", per.length === 3 && per.every((p) => p.ok), JSON.stringify(per.map((p) => [p.n, p.cap, p.app, p.launches])), "3 × [nombre, NN/13, [id]]");
  C.check("V167.1b", "logos de trazo propios en p8e.js (SYS_LOGOS, por lsvg; logos.js intacto) (apps, ajustes, buscar: SVG 24×24, stroke currentColor, como «navegador»; v16.9 sin «fuentes») y tintes de la rampa salvia → ladrillo; roles",
    logos.every((x) => x[1]) && JSON.stringify(apps.slice(10).map((a) => [a.logo, a.tint, a.role])) === JSON.stringify([["apps", "#8A8A4E", "apps"], ["ajustes", "#A08048", "settings"], ["buscar", "#BA4436", "search"]]),
    `${JSON.stringify(logos)} · ${JSON.stringify(apps.slice(10).map((a) => [a.logo, a.tint, a.role]))}`, "4 logos válidos · tintes y roles");
  /* V2 · si el TV no deja abrir una cinta del sistema: «Couldn't open Settings» en pantalla y el intento con su error en el registro */
  await go({ ok: [] }, "&app=12"); await B.key(13, "m47"); await sleep(OPEN_MS);
  let s = await st(), l = await L(), ad = await AD();
  const last = ad.log[ad.log.length - 1] || {};
  C.check("V167.2", "Settings rechazada (NotFound) → apertura directa (sin pantalla de paso): fails 1 y el registro del adaptador: org.tizen.menu → NotFoundError (persistido en p8e.apps.log)",
    l.fails === 1 && last.id === "org.tizen.menu" && last.res === "NotFoundError" && /org\.tizen\.menu/.test(await LS("p8e.apps.log") || ""),
    `fails ${l.fails} · log ${JSON.stringify(last)}`, "1 · org.tizen.menu → NotFoundError");
  done();
  /* V3 · Browser sin launchAppControl (WRT viejo): los dos intentos ApplicationControl fallan síncronos (NotSupportedError) → launch(id) */
  await go({ ok: ["org.tizen.browser"], noAC: true }, "&app=9"); await B.key(13, "m47"); await sleep(OPEN_MS);
  l = await L(); let t = await TZ(); ad = await AD();
  C.check("V167.3", "Browser sin ApplicationControl → respaldo: ac (NotSupported) → ac sin appId (NotSupported) → launch org.tizen.browser → abre",
    JSON.stringify(t.launches) === '["org.tizen.browser"]' && l.oks === 1 && ad.retries === 2 && JSON.stringify(ad.log.slice(-3).map((x) => x.res)) === '["NotSupportedError","NotSupportedError","ok"]',
    `${JSON.stringify(t.launches)} · oks ${l.oks} · reintentos ${ad.retries} · log ${JSON.stringify(ad.log.slice(-3).map((x) => [x.id, x.res]))}`, '["org.tizen.browser"] · 1 · 2 · NotSupported, NotSupported, ok');
  done();
  /* V3b · Browser: el id explícito no atiende «view» (NotFound) → el mismo ApplicationControl SIN appId (lo elige el TV) → abre */
  await go({ ok: ["ac:*"] }, "&app=9"); await B.key(13, "m47"); await sleep(OPEN_MS);
  l = await L(); t = await TZ();
  C.check("V167.3b", "Browser: ac:org.tizen.browser NotFound → ac sin appId (view + uri) → abre", JSON.stringify(t.launches) === '["ac:org.tizen.browser","ac:*"]' && t.acs[1].id === null && t.acs[1].uri === "https://www.google.com" && l.oks === 1,
    `${JSON.stringify(t.launches)} · ${JSON.stringify(t.acs[1])} · oks ${l.oks}`, '["ac:org.tizen.browser","ac:*"] · id null · uri google · 1');
  done();
  /* V4 · Netflix: el plan sigue cuando un intento falla (error o excepción síncrona) y para en el primero que abre */
  await go({ ok: ["ac:RN1MCdNq8t.Netflix"] }, "&app=2"); await B.key(13, "m47"); await sleep(OPEN_MS); l = await L(); t = await TZ();
  const v4a = JSON.stringify(t.launches) === '["ac:org.tizen.netflix-app","ac:RN1MCdNq8t.Netflix"]' && l.oks === 1; const v4aGot = JSON.stringify(t.launches); done();
  await go({ ok: ["RN1MCdNq8t.Netflix"], throwIds: ["org.tizen.netflixlowmem"] }, "&app=2"); await B.key(13, "m47"); await sleep(OPEN_MS); l = await L(); t = await TZ();
  C.check("V167.4", "Netflix: ac:org.tizen.netflix-app NotFound → ac:RN1MCdNq8t.Netflix abre (para ahí) · con org.tizen.netflixlowmem lanzando TypeMismatch síncrono → sigue a RN1MCdNq8t.Netflix",
    v4a && JSON.stringify(t.launches) === '["ac:org.tizen.netflix-app","ac:RN1MCdNq8t.Netflix","org.tizen.netflixlowmem","RN1MCdNq8t.Netflix"]' && l.oks === 1, `${v4aGot} · ${JSON.stringify(t.launches)}`, "[ac netflix-app, ac RN1] · [ac netflix-app, ac RN1, netflixlowmem (throw), RN1]");
  done();
  /* V5 · el mensaje de VUELTA: Back en la pantalla de paso (maqueta) → «Rewinding…» mientras vuelve; un error en pantalla no se pisa */
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?dev=1&launchback=0&idle=600000&launchslow=4&noscreen=0"));
  await B.key(13, "m47"); await sleep(1250 * 4 + 900); const sOpen = await st();
  await B.key(10009, "m47"); await sleep(80); const sBack = await st(), lBack = await L();
  C.check("V167.5", "v16.10: la pantalla de paso dice SIEMPRE «Rewinding…» (abrir y cerrar); Back → vuelta; el siguiente lanzamiento sigue «Rewinding…»",
    /^rewinding/i.test(sOpen.msg || "") && lBack.phase === "back" && /^rewinding/i.test(sBack.msg || ""), `«${sOpen.msg}» → fase ${lBack.phase} · «${sBack.msg}»`, "Rewinding… → back · Rewinding…");
  await sleep(1250 * 4 + 1200); await B.key(13, "m47"); await sleep(1250 * 4 + 900); s = await st();
  C.check("V167.5b", "…y al lanzar otra vez, la pantalla de paso sigue «Rewinding…»", /^rewinding/i.test(s.msg || ""), `«${s.msg}»`, "Rewinding…");
  done();
  await go({ ok: [] }, "&app=1");
  await B.key(13, "m47"); await sleep(OPEN_MS);
  const errMsg = await B.ev(`new Promise(function(res){ var t0=Date.now(); (function w(){ var l=P8E.stats().launch; if(l.phase==="back"||Date.now()-t0>6000) res(l.phase+" · "+document.querySelector(".lx-card .msg").textContent); else setTimeout(w,20); })(); })`);
  C.check("V167.5c", "con error: al volver sola (3 s) la pantalla de paso sigue diciendo «Couldn't open YouTube» (no se pisa con «Rewinding…»)", /^back · couldn't open youtube/i.test(errMsg), errMsg, "back · Couldn't open YouTube");
  done();
  /* V6 · el rastro sobrevive a la página: p8e.away + p8e.life + p8e.apps.log; arranque «en frío» con ellos → «WELCOME BACK» y nueva sesión */
  await go({ ok: ALLOK }, "&app=2", { "p8e.life": null }); await B.key(13, "m47"); await sleep(OPEN_MS);
  const away = JSON.parse(await LS("p8e.away") || "null");
  await B.ev(LEAVE + "({hidden:true,blur:true,pagehide:true})"); await sleep(200);
  const lifeRaw = await LS("p8e.life"), logRaw = await LS("p8e.apps.log"), life = JSON.parse(lifeRaw || "[]"), sid0 = (await AD()).sid;
  const ev0 = life.map((x) => x.e);
  C.check("V167.6", "en caliente: p8e.away = {i:0, st:ok}; p8e.life con la sesión: boot → launch ac:RN1MCdNq8t.Netflix → ok → hidden → blur → pagehide",
    away && away.i === 1 && away.st === "ok" && ev0[0] === "boot" && ev0.indexOf("launch ac:RN1MCdNq8t.Netflix → ok") > 0 && ev0.slice(-3).join("|") === "hidden|blur|pagehide" && life.every((x) => x.s === sid0),
    `${JSON.stringify(away)} · ${JSON.stringify(ev0)}`, "{i:0,st:ok} · boot … launch … ok … hidden|blur|pagehide");
  done();
  /* el TV termina Rewind: se recarga con lo que quedó en localStorage (p8e.away con hora actual) y con la intro */
  const awayNow = JSON.stringify({ i: 1, st: "ok", t: Date.now() - 60000 });
  await go({ ok: ALLOK }, "&boot=1&net=online", { "p8e.away": awayNow, "p8e.life": lifeRaw, "p8e.apps.log": logRaw });
  await sleep(1800); let v = await V(); const live = (await st()).live;   // v16.10: la línea aparece a los 1100 ms (BC.dataStart)
  const ad2 = await AD(), life2 = ad2.life;
  C.check("V167.6b", "arranque tras ser terminado: la intro dice «WELCOME BACK» (no «SYS.READY»), #live «Back from Netflix.», p8e.away consumida, el rastro sigue con una sesión NUEVA y el registro de lanzamientos sobrevive",
    v.boot.back && v.boot.back.i === 1 && /WELCOME BACK/.test(v.boot.line) && /back from netflix/i.test(live || "") && (await LS("p8e.away")) === null
      && life2.length > life.length && life2[life2.length - 1].s !== sid0 && life2.some((x) => x.e === "pagehide" && x.s === sid0) && ad2.log.some((x) => x.id === "ac:RN1MCdNq8t.Netflix"),
    `back ${JSON.stringify(v.boot.back)} · línea «${v.boot.line}» · live «${live}» · away ${await LS("p8e.away")} · sesiones ${JSON.stringify([...new Set(life2.map((x) => x.s))])} · log ${ad2.log.length}`, "back {i:0} · WELCOME BACK · Back from Netflix. · null · 2 sesiones · log con Netflix");
  done();
  await go({ ok: ALLOK }, "&boot=1&net=online", { "p8e.away": null }); await sleep(1800); v = await V(); const lnA = v.boot.line;
  await go({ ok: ALLOK }, "&boot=1&net=online", { "p8e.away": JSON.stringify({ i: 1, st: "ok", t: Date.now() - 7 * 3600000 }) }); await sleep(1800); v = await V();
  C.check("V167.6c", "sin marca, o con una de hace 7 h (> 6 h), la intro dice «SYS.READY» como siempre", lnA === "SYS.READY" && v.boot.line === "SYS.READY" && !v.boot.back, `«${lnA}» · «${v.boot.line}» · back ${JSON.stringify(v.boot.back)}`, "SYS.READY · SYS.READY · null");
  done();
  /* V7 · vuelta en caliente: la marca se borra (no queda un «WELCOME BACK» falso para el próximo arranque) */
  await go({ ok: ALLOK }); await B.key(13, "m47"); await sleep(OPEN_MS); const a1 = await LS("p8e.away");
  await B.ev(LEAVE + "({hidden:true})"); await sleep(150); await B.ev(COMEBACK + "({visible:true})"); await sleep(1250 + 600);
  C.check("V167.7", "vuelta en caliente (visibilitychange) → p8e.away borrada", !!a1 && (await LS("p8e.away")) === null, `antes ${a1 ? "sí" : "no"} · después ${await LS("p8e.away")}`, "sí · null");
  done();
  /* V8 · v16.9: sin cinta Sources la tecla Source es del TV: no se registra, y si llegara (el simulado la entrega igual) no mueve ni lanza */
  await go({ ok: ALLOK }); let t0 = await TZ(); s = await st();
  await B.key(10072, "m47"); await sleep(1400); const s8 = await st(); await B.key(10072, "m47"); await sleep(OPEN_MS); t = await TZ(); l = await L();
  C.check("V167.8", "v16.9 · Source (10072) NO registrada (registerKey = []) y no hace nada en Rewind: el corredor no se mueve y no se lanza nada (en el TV, Source abre el menú de fuentes del propio TV)",
    JSON.stringify(t0.reg) === "[]" && s.app === "01/13" && s8.app === "01/13" && JSON.stringify(t.launches) === "[]" && l.calls === 0,
    `reg ${JSON.stringify(t0.reg)} · ${s.app} → ${s8.app} · lanzamientos ${JSON.stringify(t.launches)} · calls ${l.calls}`, "[] · 01/13 → 01/13 · [] · 0");
  done();
  /* V9 · Exit: por defecto NO se registra y no hace nada; con la palanca exitguard, 1.ª pulsación avisa, 2.ª (≤ 2,5 s) cierra */
  await go({ ok: ALLOK }); t0 = await TZ(); await B.key(10182, "m47"); await sleep(300); await B.key(10182, "m47"); await sleep(300); t = await TZ(); v = await V();
  const v9a = t0.reg.indexOf("Exit") < 0 && t.exits === 0 && v.exitg.asks === 0; const v9aGot = `reg ${JSON.stringify(t0.reg)} · exits ${t.exits} · avisos ${v.exitg.asks}`; done();
  await go({ ok: ALLOK }, "", { "p8e.lever.exitguard": "1" }); t0 = await TZ();
  await B.key(10182, "m47"); await sleep(300); const cap1 = (await V()).cap, t1 = await TZ();
  await B.key(10182, "m47"); await sleep(300); t = await TZ(); v = await V();
  await sleep(300); await B.key(10182, "m47"); await sleep(2800); await B.key(10182, "m47"); await sleep(300); const t3 = await TZ(), v3 = await V();
  C.check("V167.9", "Exit: sin palanca no se registra ni cierra · con exitguard: registrada; 1.ª → «Press Exit again to close» sin cerrar; 2.ª en ≤ 2,5 s → exit(); dos separadas 2,8 s → no cierra",
    v9a && t0.reg.indexOf("Exit") >= 0 && /press exit again/i.test(cap1) && t1.exits === 0 && t.exits === 1 && t3.exits === 1 && v3.exitg.asks === 3,
    `${v9aGot} | reg ${JSON.stringify(t0.reg)} · «${cap1}» · exits ${t1.exits} → ${t.exits} → ${t3.exits} · avisos ${v3.exitg.asks}`, "no · 0 · 0 | Exit · Press Exit again… · 0 → 1 → 1 · 3");
  done();
  /* V10 · vigía: el TV dice «ok» pero no nos oculta en ?noshow ms → «Couldn't open YouTube» y vuelta; con ocultación a tiempo no salta */
  await go({ ok: ALLOK }, "&app=1&noshow=1500"); await B.key(13, "m47"); await sleep(OPEN_MS + 1500 + 300); s = await st(); l = await L(); v = await V();
  const v10a = /couldn't open youtube/i.test(s.msg || "") && v.noshows === 1 && /did not show/.test(l.err); const v10aGot = `«${s.msg}» · noshows ${v.noshows} · err ${l.err}`; done();
  await go({ ok: ALLOK }, "&app=1&noshow=1500"); await B.key(13, "m47"); await sleep(OPEN_MS); await B.ev(LEAVE + "({hidden:true})"); await sleep(1800); v = await V(); l = await L();
  C.check("V167.10", "vigía: ok sin ocultarnos en 1,5 s → «Couldn't open YouTube» (NoShow) · ok y oculta a tiempo → no salta (sigue fuera, sin error)", v10a && v.noshows === 0 && l.fails === 0 && l.away === true,
    `${v10aGot} | noshows ${v.noshows} · fails ${l.fails} · away ${l.away}`, "Couldn't open YouTube · 1 | 0 · 0 · true");
  done();
  /* V11 · palanca reply-return: sin ella, launchAppControl va sin reply; con ella, lleva reply y, si llega tras ≥ 1,5 s ocultos, Rewind se relanza */
  await go({ ok: ALLOK }, "&app=9"); await B.key(13, "m47"); await sleep(OPEN_MS); t = await TZ(); const noRep = t.acs[0] && t.acs[0].reply === false; done();
  await go({ ok: ALLOK }, "&app=9", { "p8e.lever.reply": "1" }); await B.key(13, "m47"); await sleep(OPEN_MS);
  await B.ev("__m47.tizen.reply('onfailure')"); await sleep(200); const tEarly = await TZ();
  await B.ev(LEAVE + "({hidden:true})"); await sleep(1700); await B.ev("__m47.tizen.reply('onfailure')"); await sleep(200); t = await TZ(); ad = await AD();
  C.check("V167.11", "reply-return: sin palanca, sin reply · con palanca: reply presente; si llega con la página visible no hace nada; tras 1,7 s oculta → launch(RewindSA01.Rewind)",
    noRep && t.acs[0].reply === true && tEarly.launches.indexOf("RewindSA01.Rewind") < 0 && t.launches[t.launches.length - 1] === "RewindSA01.Rewind" && ad.selfback.join() === "ok" && ad.replies === 2,
    `sin palanca reply ${t.acs && noRep ? "no" : "sí"} · con: reply ${t.acs[0].reply} · temprano ${JSON.stringify(tEarly.launches)} · después ${JSON.stringify(t.launches)} · selfback ${JSON.stringify(ad.selfback)}`, "no · true · sin relanzar · …RewindSA01.Rewind · ok");
  done();
  /* V12 · ?sys=0: el roster de 10 de siempre, «NN/15», Source no se registra y no hace nada */
  await go({ ok: ALLOK }, "&sys=0"); t0 = await TZ(); s = await st(); await B.key(10072, "m47"); await sleep(1200); const s2 = await st();
  const n15 = JSON.parse(await B.ev("JSON.stringify(P8E.apps().length)"));
  C.check("V167.12", "?sys=0 → 10 cintas, «01/10», sin registrar Source y Source no mueve el corredor", n15 === 10 && s.app === "01/10" && t0.reg.length === 0 && s2.app === "01/10", `${n15} · ${s.app} · reg ${JSON.stringify(t0.reg)} · tras Source ${s2.app}`, "10 · 01/10 · [] · 01/10");
  done();
  C.check("V167.13", "0 excepciones en la suite v167", errs.length === 0, JSON.stringify(errs).slice(0, 300), "0");
  if (C.shots) { await B.setMode({ m47: false, rev: C.rev }); for (const n of [11, 12, 13]) { await B.load(U("?idle=600000&app=" + n)); await sleep(900); await B.shot(path.join(C.out, `P8e-v167-cinta-${n}.png`)); } }
}

/* ======================================================================================================
   v16.9 · PICO Y PLACA (pyp.js) y la v16.9 (sin rail, sin Sources, rótulo bajo el cassette)
   ====================================================================================================== */
/* Festivos esperados: derivados A MANO de la Ley 51 de 1983, art. 1 (Función Pública, Gestor Normativo, norma i=4954) con la
   Pascua de `ncal -e` (macOS): 2025-04-20, 2026-04-05, 2027-03-28, 2028-04-16. Confirmados además en bogota.gov.co:
   2026-10-12 («Lunes festivo 12 de octubre», boletín de pico y placa de octubre de 2026) y 2026-08-17 («puente festivo 15 al
   17 de agosto», plan retorno «lunes 17 de agosto»). No hay una lista anual oficial descargable verificada (README v16.9). */
const HOL_2026 = ["2026-01-01", "2026-01-12", "2026-03-23", "2026-04-02", "2026-04-03", "2026-05-01", "2026-05-18", "2026-06-08", "2026-06-15",
  "2026-06-29", "2026-07-20", "2026-08-07", "2026-08-17", "2026-10-12", "2026-11-02", "2026-11-16", "2026-12-08", "2026-12-25"];
const HOL_2027 = ["2027-01-01", "2027-01-11", "2027-03-22", "2027-03-25", "2027-03-26", "2027-05-01", "2027-05-10", "2027-05-31", "2027-06-07",
  "2027-07-05", "2027-07-20", "2027-08-07", "2027-08-16", "2027-10-18", "2027-11-01", "2027-11-15", "2027-12-08", "2027-12-25"];
/* fixtures: el MISMO fraseo del boletín oficial de octubre de 2026 (bogota.gov.co, leído 2026-10-26), recortado y con trampas */
const PYP_BULLETIN = `<html><head><title>Pico y placa en Bogotá vehículos particulares 1 a 31 octubre de 2026</title>
<script>var x="Lunes 26 de octubre: pueden circular los vehículos con placas terminadas en 1, 2, 3, 4 y 5.";</script></head><body>
<p>El pico y placa para vehículos particulares funciona en Bogotá de 6:00 a. m. a 9:00 p. m., de lunes a viernes.</p>
<!-- Lunes 26 de octubre: pueden circular los vehículos con placas terminadas en 1, 2, 3, 4 y 5. -->
<h3>Semana del 12 al 18 de octubre</h3>
<p><strong>Lunes festivo 12 de octubre</strong>: aplica la medida de <a href="/tag/pico-y-placa-regional">pico y placa regional</a> de ingreso a Bogotá.</p>
<p>Martes 13 de octubre: pueden circular los vehículos con placas terminadas en 1, 2, 3, 4 y 5.</p>
<p>S&aacute;bado 17 de octubre: no aplica la medida de pico y placa.</p>
<h3>Semana del 26 al 31 de octubre</h3>
<p>Lunes 26 de octubre: pueden circular los veh&iacute;culos con placas terminadas en 6, 7, 8, 9 y 0.</p>
<p>Martes 27 de octubre: pueden circular los vehículos con placas terminadas en 1, 2, 3, 4 y 5.</p>
<p>Miércoles 28 de octubre: no pueden circular los vehículos con placas terminadas en 1, 2, 3, 4 y 5.</p>
<p>Taxis. Jueves 29 de octubre: pueden circular los vehículos con placas terminadas en 1, 2, 3, 4, 5, 6, 9 y 0.</p>
<p>Viernes 30 de octubre: pueden circular los vehículos con placas terminadas en 1, 2, 3, 4 y 5.</p>
<p>Viernes 30 de octubre: pueden circular los vehículos con placas terminadas en 6, 7, 8, 9 y 0.</p>
<p>Sábado 31 de octubre: no aplica la medida de pico y placa.</p></body></html>`;
const PYP_TAG = `<a href="https://evil.example/mi-ciudad/movilidad/2026-10/pico-y-placa-en-bogota-vehiculos-particulares-1-31-octubre-de-2026">x</a>
<a href="/mi-ciudad/movilidad/2026-09/pico-y-placa-en-bogota-vehiculos-particulares-1-30-septiembre-de-2026">sep</a>
<a href="/mi-ciudad/movilidad/2026-10/medida-de-pico-y-placa-en-bogota-para-el-lunes-26-de-octubre-de-2026">dia</a>
<a href="/mi-ciudad/movilidad/2026-10/pico-y-placa-en-bogota-para-la-semana-del-26-al-31-de-octubre-de-2026">semana</a>
<a href="/mi-ciudad/movilidad/2026-10/pico-y-placa-en-bogota-para-la-semana-del-19-al-25-de-octubre-de-2026">semana vieja</a>
<a href="/mi-ciudad/movilidad/2026-10/pico-y-placa/../../../etc">trampa</a>`;
async function suitePyp(B, C, U) {
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?dev=1&idle=600000&pypnet=0"));
  const E = async (x) => JSON.parse(await B.ev(`JSON.stringify((function(){ var P=window.P8EPyP; ${x} })())`));
  const errs0 = B.errors.length;
  const extB = () => B.ext.filter((u) => u.indexOf("https://bogota.gov.co/") === 0);
  const PYP_T = `(function(){ return ['wR1','wR2','wR3'].map(function(id){ var c=document.getElementById(id); return c?c.textContent:''; }).join(' '); })()`;
  /* PY1–PY3 · calendario */
  const h = await E(`return {a:P.holidays(2026).map(function(x){ return x.d; }), b:P.holidays(2027).map(function(x){ return x.d; }), e:[2025,2026,2027,2028].map(P.easter)};`);
  C.check("PY1", "festivos de Colombia 2026 (Ley 51/1383, Emiliani + fijos + Semana Santa): 18 fechas exactas", JSON.stringify(h.a) === JSON.stringify(HOL_2026), h.a.join(" "), HOL_2026.join(" "));
  C.check("PY2", "festivos de Colombia 2027: 18 fechas exactas", JSON.stringify(h.b) === JSON.stringify(HOL_2027), h.b.join(" "), HOL_2027.join(" "));
  C.check("PY3", "Pascua 2025–2028 = la de `ncal -e`", h.e.join() === "2025-04-20,2026-04-05,2027-03-28,2028-04-16", h.e.join(" "), "2025-04-20 2026-04-05 2027-03-28 2028-04-16");
  /* PY4 · la regla en fechas de prueba (mediodía de Bogotá = 17:00 UTC) */
  const CASES = [["2026-10-26", "restrict12345", "lunes par"], ["2026-10-27", "restrict67890", "martes impar"], ["2026-10-30", "restrict12345", "viernes par"],
    ["2026-10-24", "sat", "sábado"], ["2026-10-25", "sun", "domingo"], ["2026-10-12", "hol", "Día de la Raza (lunes)"], ["2026-08-17", "hol", "Asunción trasladada"],
    ["2026-04-02", "hol", "Jueves Santo"], ["2026-04-03", "hol", "Viernes Santo"], ["2026-11-02", "hol", "Todos los Santos trasladado"], ["2026-11-16", "hol", "Cartagena trasladado"],
    ["2026-12-31", "restrict67890", "jueves 31 impar"], ["2027-01-01", "hol", "Año Nuevo (viernes)"], ["2027-01-04", "restrict12345", "lunes 4 par"],
    ["2027-03-25", "hol", "Jueves Santo 2027"], ["2027-06-29", "restrict67890", "San Pedro cae en martes: NO es festivo ese día"], ["2027-07-05", "hol", "San Pedro trasladado"],
    ["2027-05-01", "sat", "1 de mayo en sábado: sábado"], ["2027-10-12", "restrict12345", "12 oct 2027 (martes) no es festivo: se traslada al 18"], ["2027-10-18", "hol", "Día de la Raza 2027"]];
  const got = await E(`return ${JSON.stringify(CASES)}.map(function(c){ var p=c[0].split("-"), r=P.today(Date.UTC(+p[0],+p[1]-1,+p[2],17)); return c[0]+" "+r.kind+(r.out?r.out.join(""):""); });`);
  const bad = got.filter((g, i) => g !== CASES[i][0] + " " + CASES[i][1]);
  C.check("PY4", `regla local en ${CASES.length} fechas (par → no circulan 1-5, impar → 6-0, L–V; sábados, domingos y festivos sin medida)`, bad.length === 0, bad.join(" · ") || `${got.length} de ${got.length}`, CASES.map((c) => c[0] + " " + c[1]).slice(0, 4).join(" · ") + " …");
  const mid = await E(`return [P.today(Date.UTC(2026,9,27,4,59)).day, P.today(Date.UTC(2026,9,27,5,0)).day];`);
  C.check("PY5", "el día es el de Bogotá (UTC−5, sin horario de verano): 04:59 UTC del 27 = 23:59 del 26; 05:00 UTC = 00:00 del 27", mid.join() === "2026-10-26,2026-10-27", mid.join(" "), "2026-10-26 2026-10-27");
  /* PY6 · el lector del texto oficial (sin DOM): script y comentarios no cuentan, entidades, festivo, negación, taxis, contradicción */
  const prs = await E(`var H=${JSON.stringify(PYP_BULLETIN)}; function d(n){ return P.parse(H,P.bogota(Date.UTC(2026,9,n,17))); }
    return {d26:d(26),d27:d(27),d28:d(28),d29:d(29),d30:d(30),d31:d(31),d12:d(12),d13:d(13),d17:d(17),d5:d(5),other:P.parse("<p>Hola mundo</p>",P.bogota(Date.UTC(2026,9,26,17))),
      big:P.parse(new Array(60000).join("Lunes 26 de octubre: pico y placa. "),P.bogota(Date.UTC(2026,9,26,17))), nov:P.parse(H,P.bogota(Date.UTC(2026,10,26,17)))};`);
  const want6 = { d26: '{"v":"restrict","out":[1,2,3,4,5]}', d27: '{"v":"restrict","out":[6,7,8,9,0]}', d28: '{"v":"restrict","out":[1,2,3,4,5]}', d29: "null", d30: '{"v":"conflict"}',
    d31: '{"v":"none"}', d12: '{"v":"none"}', d13: '{"v":"restrict","out":[6,7,8,9,0]}', d17: '{"v":"none"}', d5: "null", other: "null", big: "null", nov: "null" };
  const bad6 = Object.keys(want6).filter((k) => JSON.stringify(prs[k]) !== want6[k]);
  C.check("PY6", "parse(): 26 (script y comentario con el grupo CONTRARIO ignorados; entidad &iacute;) → no circulan 1-5 · 27 → 6-0 · 28 «no pueden circular 1-5» · 29 sólo taxis (8 dígitos) → nada · 30 contradicho → conflict · 31/17 «no aplica» · 12 «Lunes festivo» → sin medida · 13 → 6-0 · otro texto, 2,4 MB de basura u otro mes → null",
    bad6.length === 0, bad6.map((k) => `${k}=${JSON.stringify(prs[k])}`).join(" · ") || "13 de 13", "13 de 13");
  const cmp = await E(`var L=P.today(Date.UTC(2026,9,26,17)), S=P.today(Date.UTC(2026,9,24,17));
    return [P.compare(L,{v:"restrict",out:[1,2,3,4,5]}),P.compare(L,{v:"restrict",out:[6,7,8,9,0]}),P.compare(L,{v:"none"}),P.compare(L,null),P.compare(L,{v:"conflict"}),P.compare(S,{v:"none"}),P.compare(S,{v:"restrict",out:[1,2,3,4,5]})];`);
  C.check("PY7", "compare(): igual → ok · otro grupo, «sin medida» o contradicción → diff · nada para hoy → unk (no se avisa) · sábado vs «no aplica» → ok", cmp.join() === "ok,diff,diff,unk,diff,ok,diff", cmp.join(" "), "ok diff diff unk diff ok diff");
  const lk = await E(`var T=${JSON.stringify(PYP_TAG)}; return [P.pickLink(T,P.bogota(Date.UTC(2026,9,27,17))),P.pickLink(T,P.bogota(Date.UTC(2026,9,26,17))),P.pickLink(T,P.bogota(Date.UTC(2026,9,5,17))),
    P.pickLink(T.replace(/semana-del-26/g,"x"),P.bogota(Date.UTC(2026,9,26,17))), P.bulletinUrl(P.bogota(Date.UTC(2026,9,26,17))), P.bulletinUrl(P.bogota(Date.UTC(2027,1,3,17)))];`);
  const W = "https://bogota.gov.co/mi-ciudad/movilidad/2026-10/pico-y-placa-en-bogota-para-la-semana-del-26-al-31-de-octubre-de-2026";
  C.check("PY8", "pickLink(): sólo rutas /mi-ciudad/movilidad/… del mismo origen (fuera evil.example, otro mes, «..»); la semana que contiene hoy > el artículo del día; nada para el 5 · bulletinUrl = la URL citada de octubre de 2026 (y 1-28 en febrero de 2027)",
    lk[0] === W && lk[1] === W && lk[2] === null && lk[3] === "https://bogota.gov.co/mi-ciudad/movilidad/2026-10/medida-de-pico-y-placa-en-bogota-para-el-lunes-26-de-octubre-de-2026"
      && lk[4] === "https://bogota.gov.co/mi-ciudad/movilidad/pico-y-placa-en-bogota-vehiculos-particulares-1-31-octubre-de-2026" && /1-28-febrero-de-2027$/.test(lk[5]), JSON.stringify(lk), "semana · semana · null · día · boletín citado · 1-28 febrero");
  /* PY9 · v16.10: el pico y placa ocupa TRES franjas (R1 título, R2 no circulan/día, R3 horario en letra normal), lang="es" y nada desborda */
  const rows = [];
  const EXP9 = [["2026-10-26", ["Pico y placa", "No circulan1-2-3-4-5", "Horario pico y placa6:00–21:00"]],
    ["2026-10-27", ["Pico y placa", "No circulan6-7-8-9-0", "Horario pico y placa6:00–21:00"]],
    ["2026-10-12", ["Pico y placa", "Sin pico y placa hoy", "Festivo"]],
    ["2026-10-24", ["Pico y placa", "Sin pico y placa hoy", "Sábado"]],
    ["2026-10-25", ["Pico y placa", "Sin pico y placa hoy", "Domingo"]]];
  for (const [q, exp] of EXP9) {
    await B.load(U("?dev=1&idle=1500&net=online&pypnow=" + q)); await sleep(3600);
    const r = JSON.parse(await B.ev(`JSON.stringify(['wR1','wR2','wR3'].map(function(id){ var c=document.getElementById(id), cr=c.getBoundingClientRect(), pr=parseFloat(getComputedStyle(c).paddingRight), mx=0;
      [].forEach.call(c.children,function(e){ mx=Math.max(mx,e.getBoundingClientRect().right); }); return {id:id,t:c.textContent,lang:c.getAttribute("lang"),sw:c.scrollWidth,cw:c.clientWidth,free:Math.round(cr.right-pr-mx)}; }))`));
    const bands = await B.ev("document.getElementById('bands').className");
    rows.push({ q, r, ok: JSON.stringify(r.map((b) => b.t)) === JSON.stringify(exp) && r.every((b) => b.lang === "es" && b.sw <= b.cw + 1 && b.free >= 0) && /\binfo\b/.test(bands) && !/\bout\b/.test(bands) });
  }
  const dv = await B.ev("P8E.pypShow(Date.UTC(2026,9,26,17),'diff')").then((x) => x.trim());
  const dvr = JSON.parse(await B.ev(`JSON.stringify(['wR1','wR2','wR3'].map(function(id){ var c=document.getElementById(id); return {sw:c.scrollWidth,cw:c.clientWidth}; }))`));
  C.check("PY9", "tres franjas derechas en reposo: restricción, festivo, sábado, domingo y el aviso «verificar»; lang=es en las tres; nada desborda ni se sale de la caja útil",
    rows.every((r) => r.ok) && dv === "Pico y placa Verificar bogota.gov.co" && dvr.every((x) => x.sw <= x.cw + 1),
    rows.map((r) => `${r.q} «${r.r.map((b) => b.t).join(" | ")}»`).join(" · ") + ` · diff «${dv}»`, "5 juegos · lang es · sin desborde");
  /* PY10 · la red: con red (net=online) y el reposo, UNA petición al boletín del mes; el arnés la corta → silencio (se queda el cálculo local) */
  await B.setMode({ m47: true, rev: C.rev }); B.ext = []; await B.load(U("?dev=1&idle=1500&net=online&noscreen=0")); await sleep(1500 + 900 + 1500 + 1500);
  const today = await B.ev("P8EPyP.bulletinUrl(P8EPyP.bogota(Date.now()))"), st10 = JSON.parse(await B.ev(`JSON.stringify({s:P8EPyP.stats(),v:P8E.v169().pyp,t:['wR1','wR2','wR3'].map(function(id){ return document.getElementById(id).textContent; }).join(' '),ls:localStorage.getItem('p8e.pyp')})`));
  const ext10 = extB();
  C.check("PY10", "con red: tras el reposo, 1 petición (el boletín del mes, https://bogota.gov.co/…), cortada → silencio: 1 intento guardado, sin veredicto, la franja sigue con el cálculo local, 0 excepciones",
    ext10.length === 1 && ext10[0] === today && st10.s.reqs === 1 && st10.s.err === "network" && st10.v.checks === 1 && !st10.v.v && /^Pico y placa|^Sin pico y placa/.test(st10.t) && /"n":1/.test(st10.ls || "") && B.errors.length === 0,
    `${JSON.stringify(ext10)} · reqs ${st10.s.reqs} · err ${st10.s.err} · «${st10.t}» · store ${st10.ls}`, "[boletín de hoy] · 1 · network · local · n 1");
  /* PY11 · límites: un 2.º reposo inmediato no repite (30 min entre intentos); con 3 intentos ya hechos hoy, ninguno */
  await B.ev("P8E.pypShow(Date.now(),''),1"); await B.key(39, "m47"); await sleep(1100 + 1500 + 1500 + 1500);
  const n11a = extB().length;
  const day = await B.ev("P8EPyP.today().day");
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.pyp": JSON.stringify({ d: day, v: "", n: 3, t: 1 }) } }); B.ext = []; await B.load(U("?dev=1&idle=1500&net=online&noscreen=0")); await sleep(5400);
  const n11b = extB().length;
  C.check("PY11", "límites: otro reposo a los pocos segundos no repite la petición (≥ 30 min entre intentos) · con 3 intentos hoy (p8e.pyp) no sale ninguna", n11a === 1 && n11b === 0, `tras el 2.º reposo ${n11a} · con n=3 ${n11b}`, "1 · 0");
  /* PY12 · palancas: ?pypnet=0 → 0 peticiones; ?pyp=0 → «Daylight» como antes y 0 peticiones; sin red (net=nointernet) → 0 */
  const lev = [];
  for (const q of ["&pypnet=0", "&pyp=0", ""]) { await B.setMode({ m47: true, rev: C.rev }); B.ext = []; await B.load(U("?dev=1&idle=1500&net=" + (q ? "online" : "nointernet") + q)); await sleep(5400);
    lev.push({ q: q || "nointernet", n: extB().length, t: (await B.ev(PYP_T)).trim() }); }
  C.check("PY12", "palancas: ?pypnet=0 → franjas locales y 0 peticiones al boletín · ?pyp=0 → las 3 franjas vacías (el sitio lo ocupan TRM dólar/euro) y 0 peticiones · sin internet → 0 peticiones",
    lev[0].n === 0 && /^Pico y placa|^Sin pico/.test(lev[0].t) && lev[1].n === 0 && lev[1].t === "" && lev[2].n === 0, JSON.stringify(lev.map((x) => [x.q, x.n, x.t.slice(0, 24)])), "0 · local | 0 · vacío | 0");
  /* PY13 · de punta a punta con respuestas FALSAS (mode.web, sin salir de la máquina): boletín 404 → etiqueta → artículo de la semana */
  const ms13 = Date.UTC(2026, 9, 26, 17), bU = "https://bogota.gov.co/mi-ciudad/movilidad/pico-y-placa-en-bogota-vehiculos-particulares-1-31-octubre-de-2026";
  const tagU = "https://bogota.gov.co/tag/pico-y-placa-en-bogota";
  const run13 = async (art) => { await B.setMode({ m47: true, rev: C.rev, web: { [bU]: { status: 404, body: "no" }, [tagU]: { status: 200, body: PYP_TAG }, [W]: { status: 200, body: art } } }); B.ext = [];
    await B.load(U("?dev=1&idle=600000"));
    return JSON.parse(await B.ev(`new Promise(function(res){ var P=P8EPyP, v0=null; P.check(true,function(v){ v0=v; },${ms13}); var t0=Date.now();
      (function w(){ var s=P.stats(); if(!s.busy||Date.now()-t0>9000) res(JSON.stringify({v:v0,s:s,shown:P.shown(${ms13})})); else setTimeout(w,50); })(); })`)); };
  const okR = await run13(PYP_BULLETIN), ext13 = B.ext.slice(), diffR = await run13(PYP_BULLETIN.replace("en 6, 7, 8, 9 y 0.</p>\n<p>Martes 27", "en 1, 2, 3, 4 y 5.</p>\n<p>Martes 27"));
  C.check("PY13", "de punta a punta (respuestas falsas): boletín 404 → etiqueta → artículo de la semana; coincide → «ok» · el texto oficial dice otro grupo → «diff» (la franja dirá «Verificar»); 3 GET, todos a https://bogota.gov.co",
    okR.v === "ok" && okR.s.reqs === 3 && diffR.v === "diff" && diffR.shown === "diff" && ext13.length === 3 && ext13.every((u) => u.indexOf("https://bogota.gov.co/") === 0),
    `ok: ${okR.v} (${okR.s.reqs} GET ${JSON.stringify(okR.s.urls)}) · diff: ${diffR.v} · mostrado ${diffR.shown}`, "ok (3 GET) · diff · diff");
  /* PY14 · tamaño: una respuesta > 120 000 caracteres se descarta (sin veredicto) · v16.9.1: era 400 000 (revisión de seguridad C1) */
  await B.setMode({ m47: true, rev: C.rev, web: { [bU]: { status: 200, body: "x".repeat(120001) } } }); B.ext = []; await B.load(U("?dev=1&idle=600000"));
  const big = JSON.parse(await B.ev(`new Promise(function(res){ var P=P8EPyP; P.check(true,null,${ms13}); var t0=Date.now(); (function w(){ var s=P.stats(); if(!s.busy||Date.now()-t0>9000) res(JSON.stringify(s)); else setTimeout(w,50); })(); })`));
  C.check("PY14", "respuesta de 120 001 caracteres → descartada por tamaño, sin veredicto y sin seguir pidiendo", big.err === "size" && big.reqs === 1 && !big.v, `err ${big.err} · reqs ${big.reqs} · v «${big.v}»`, "size · 1 · ''");
  /* PY16 · el panel de diagnóstico (fila 7, Network) dice cómo fue el contraste: para verlo EN EL TV (¿deja pasar el WRT el XHR?) */
  await B.setMode({ m47: true, rev: C.rev }); B.ext = []; await B.load(U("?dev=1&diag=1&idle=1500&net=online")); await sleep(1500 + 900 + 1500 + 1200);
  const row7 = await B.ev(`(function(){ var r=[].filter.call(document.querySelectorAll('#p8eDiag .dg-row'),function(d){ return /7 Network/.test(d.textContent); })[0]; return r?r.textContent:""; })()`);
  C.check("PY16", "panel ?diag=1, fila 7: «pico y placa: verdict none · 1 GET · network» y la línea de TRM (v16.10) tras el reposo con la red cortada por el arnés",
    /pico y placa: verdict none · 1 GET · network/.test(row7) && /TRM: /.test(row7) && /EUR: /.test(row7), row7.slice(-140), "… pico y placa: verdict none · 1 GET · network … TRM: … EUR: …");
  /* PY17 · v16.9.1 (C1): entradas HOSTILES con presupuesto de tiempo. Las regex de la v16.9 eran cuadráticas
     («<a»×200k 26,8 s en Node); el recorrido lineal tarda < 2 ms en el Mac. Presupuesto: < 50 ms por llamada (emulación M47, Chrome 155),
     strip() sobre la entrada ENTERA (hasta 400 000 caracteres) y textOf/parse/pickLink (que cortan en 120 000) */
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?dev=1&idle=600000&pypnet=0"));
  const hostile = JSON.parse(await B.ev(`JSON.stringify((function(){ var P=window.P8EPyP, p=P.bogota(Date.UTC(2026,9,26,17)), out=[];
    function rep(t,n){ return new Array(n+1).join(t); }
    var H={"<a×200k":rep("<a",200000),"<!--×100k":rep("<!--",100000),"<svg×100k":rep("<svg",100000),"<script>×50k":rep("<script>",50000),
      "<×400k":rep("<",400000),"&amp×100k":rep("&amp",100000),"<b>×100k":rep("<b>",100000),"<!---->x×50k":rep("<!---->x",50000),
      "lunes 26 de octubre ×20k":rep("lunes 26 de octubre ",20000),"href×2k":rep('href="/mi-ciudad/movilidad/'+rep("a",170),2000)};
    for(var k in H){ var t0=performance.now(); P._strip(H[k]); var t1=performance.now(); P.textOf(H[k]); var t2=performance.now(); P.parse(H[k],p); var t3=performance.now(); P.pickLink(H[k],p); var t4=performance.now();
      out.push([k,H[k].length,+(t1-t0).toFixed(1),+(t2-t1).toFixed(1),+(t3-t2).toFixed(1),+(t4-t3).toFixed(1)]); }
    return out; })())`));
  const slow = hostile.filter((r) => Math.max(r[2], r[3], r[4], r[5]) >= 50);
  C.check("PY17", `entradas hostiles (${hostile.length}): strip / textOf / parse / pickLink < 50 ms por llamada`, slow.length === 0,
    hostile.map((r) => `${r[0]} ${r[2]}/${r[3]}/${r[4]}/${r[5]} ms`).join(" · "), "todas < 50 ms");
  /* PY18 · el texto que sale de strip(): el mismo que la v16.9 en lo normal, y el desplazamiento de toLowerCase() no cuela un <script>
     («İ» → 2 unidades al pasar a minúsculas: con lo=s.toLowerCase() el bloque se leía desalineado y su texto pasaba) */
  const st18 = JSON.parse(await B.ev(`JSON.stringify([P8EPyP.textOf("İİİİ<script>Lunes 26 de octubre: pueden circular 1, 2, 3, 4 y 5</script>ok"),
    P8EPyP.textOf("a<b>B</b> <!-- c --> <STYLE>d</style> e<svg><text>f</text></svg> g<noscript>h</noscript> i &aacute; &#65; <x"),
    P8EPyP.parse("İİİİ<script>Lunes 26 de octubre: pueden circular 1, 2, 3, 4 y 5</script> pico y placa octubre", P8EPyP.bogota(Date.UTC(2026,9,26,17)))])`));
  C.check("PY18", "strip(): comentario, script/style/svg/noscript (mayúsculas incluidas) y etiquetas fuera, entidades, una etiqueta sin cerrar corta ahí; con «İ» delante un <script> NO cuela su texto",
    (!/lunes|circular|script/.test(st18[0]) && /ok$/.test(st18[0].trim())) && st18[1].replace(/ +/g, " ").trim() === "a b e g i a a" && st18[2] === null, JSON.stringify(st18), '«…ok» sin el texto del script · "a b e g i a a" · null');
  /* PY19 · si se navega antes de los 1,5 s del reposo, el contraste NO arranca (temporizador cancelado) */
  await B.setMode({ m47: true, rev: C.rev }); B.ext = []; await B.load(U("?dev=1&idle=1500&net=online&noscreen=0"));
  await B.ev(`new Promise(function(r){ var t0=Date.now(); (function w(){ if(P8E.v169().pyp.pending||Date.now()-t0>8000) r(1); else setTimeout(w,20); })(); })`);
  const pend19 = JSON.parse(await B.ev("JSON.stringify(P8E.v169().pyp)")); await B.key(39, "m47"); await sleep(400);
  const after19 = JSON.parse(await B.ev("JSON.stringify(P8E.v169().pyp)")), ext19a = extB().length; await sleep(1400); const ext19b = extB().length;
  C.check("PY19", "reposo → temporizador del contraste pendiente; → antes de 1,5 s: cancelado, 0 peticiones", pend19.pending && !after19.pending && after19.cancels === 1 && ext19a === 0 && ext19b === 0,
    `pendiente ${pend19.pending} → ${after19.pending} · cancelados ${after19.cancels} · peticiones ${ext19a}/${ext19b}`, "true → false · 1 · 0/0");
  /* PY20 · la palanca en caliente del panel («PyP contrast», p8e.lever.pypnet): off → check() no pide; on → vuelve; ?pypnet=0 manda sobre on */
  const lv = JSON.parse(await B.ev(`JSON.stringify((function(){ var P=P8EPyP, r=[]; P.lever(false); r.push(P.lever(), P.net(), localStorage.getItem("p8e.lever.pypnet"), P.check(true,null,Date.UTC(2026,9,26,17)));
    P.lever(true); r.push(P.lever(), P.net(), localStorage.getItem("p8e.lever.pypnet")); return r; })())`));
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.lever.pypnet": "0" } }); await B.load(U("?dev=1&idle=600000")); const lvBoot = await B.ev("P8EPyP.net()");
  await B.load(U("?dev=1&idle=600000&pypnet=0")); const lvQ = await B.ev("P8EPyP.lever(true), P8EPyP.net()");
  C.check("PY20", "palanca «PyP contrast» (p8e.lever.pypnet): off → net false, se guarda «0» y check() no pide · on → net true, se borra · arrancar con «0» → apagado · ?pypnet=0 manda sobre la palanca",
    JSON.stringify(lv) === '[false,false,"0",false,true,true,null]' && lvBoot === false && lvQ === false, `${JSON.stringify(lv)} · arranque con 0 → ${lvBoot} · ?pypnet=0 + on → ${lvQ}`, '[false,false,"0",false,true,true,null] · false · false');
  C.check("PY15", "0 excepciones en la suite pyp", B.errors.length === 0 && errs0 === 0, JSON.stringify(B.errors).slice(0, 300), "0");
  if (C.shots) { await B.setMode({ m47: false, rev: C.rev }); for (const q of ["2026-10-26", "2026-10-12"]) { await B.load(U("?dev=1&idle=1500&net=online&pypnow=" + q)); await sleep(3600); await B.shot(path.join(C.out, `P8e-v169-pyp-${q}.png`)); } }
}

/* v16.9 · sin rail, sin Sources, y el rótulo bajo el cassette sin solapes (en reposo, navegando y en la intro/armado) */
const BOXES = `(function(){ var T=document.getElementById('tv').getBoundingClientRect(), s=T.width/1920;
  function R(e){ if(!e) return null; var cs=getComputedStyle(e); if(cs.display==='none'||cs.visibility==='hidden') return null; var r=e.getBoundingClientRect(); if(!r.width||!r.height) return null;
    return [(r.left-T.left)/s,(r.top-T.top)/s,(r.right-T.left)/s,(r.bottom-T.top)/s]; }
  function op(e){ var o=1; for(var n=e;n&&n.nodeType===1;n=n.parentElement) o*=+getComputedStyle(n).opacity; return o; }
  var q=function(x){ return document.querySelector(x); }, it=q('.item.rich'), bands=q('#bands'), bOn=/\\binfo\\b/.test(bands.className)&&!/\\b(gone)\\b/.test(bands.className);
  var o={cap:R(q('#cap')), capOp:op(q('#cap')), foot:R(q('#foot')), hud:R(q('.hud')), cass:R(q('.cass')), cflat:R(q('.cflat')), drop:R(it&&it.querySelector('.drop')),
    card:R(it&&it.querySelector('.card')), cls:document.body.className, bands:bands.className, sides:[], tis:[]};
  if(bOn){ [].forEach.call(document.querySelectorAll('.bands .side'),function(e){ o.sides.push(R(e)); }); [].forEach.call(document.querySelectorAll('.bands .ti'),function(e){ if(op(e)>0.01) o.tis.push(R(e)); }); }
  return JSON.stringify(o); })()`;
const hit = (a, b) => !!a && !!b && Math.min(a[2], b[2]) - Math.max(a[0], b[0]) > 0.5 && Math.min(a[3], b[3]) - Math.max(a[1], b[1]) > 0.5;
function capClear(o) { if (!o.cap || o.capOp < 0.02) return []; const bad = [];
  for (const k of ["foot", "hud", "cass", "cflat", "drop", "card"]) if (hit(o.cap, o[k])) bad.push(k);
  o.sides.forEach((r, i) => { if (hit(o.cap, r)) bad.push("franja" + i); }); o.tis.forEach((r, i) => { if (hit(o.cap, r)) bad.push("píldora" + i); }); return bad; }
/* v16.10 · LANZAMIENTO DIRECTO de YouTube/TizenTube: pulsar Enter NO arranca la coreografía (sin pantalla de paso) */
async function suiteDirect(B, C, U) {
  /* TizenTube (noscreen): Enter SÍ arranca desarmado+electricidad (body.launch true) pero la tarjeta «Rewinding…» NO aparece */
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?dev=1&idle=600000&boot=0")); await sleep(1500);
  await B.key(13, "m47"); await sleep(1400);
  const noCard = JSON.parse(await B.ev("JSON.stringify({launch:document.body.classList.contains('launch'), card:getComputedStyle(document.getElementById('lxCard')).opacity})"));
  C.check("DIR1", "TizenTube: desarmado+electricidad SÍ (body.launch), tarjeta «Rewinding…» NO (opacity 0)", noCard.launch && +noCard.card === 0, JSON.stringify(noCard), "launch true · card 0");
  /* control ?noscreen=0: la tarjeta SÍ aparece */
  await B.load(U("?dev=1&idle=600000&boot=0&noscreen=0")); await sleep(1500);
  await B.key(13, "m47"); await sleep(1400);
  const ctl = JSON.parse(await B.ev("JSON.stringify({card:getComputedStyle(document.getElementById('lxCard')).opacity})"));
  C.check("DIR2", "control ?noscreen=0: la tarjeta SÍ aparece", +ctl.card > 0, JSON.stringify(ctl), "card > 0");
  C.check("DIR3", "0 excepciones", B.errors.length === 0, JSON.stringify(B.errors).slice(0, 300), "[]");
  /* BOOT con la última app = YouTube (noscreen): la intro debe CORRER (portal+velo), no saltar al corredor */
  await B.load(U("?dev=1&boot=1&lastapp=0")); await sleep(700);
  const bs = JSON.parse(await B.ev("JSON.stringify({db:document.documentElement.getAttribute('data-boot'), on:(window.P8E&&P8E.bootState)?P8E.bootState().on:null, phase:(window.P8E&&P8E.stats)?P8E.stats().launch.phase:null})"));
  C.check("BOOT1", "boot ?lastapp=0 (YouTube): la intro corre (data-boot=1 y boot.on true)", bs.db === "1" && bs.on === true, JSON.stringify(bs), "db 1 · on true");
  /* el overlay (bootBg 46 / bootCv 48) debe TAPAR el HUD (20)/cap(20)/foot(19) */
  const zs = JSON.parse(await B.ev("JSON.stringify((function(){ var g=function(id){var e=document.getElementById(id);return e?getComputedStyle(e).zIndex:null;}; var q=function(sel){var e=document.querySelector(sel);return e?getComputedStyle(e).zIndex:null;}; return {bg:g('bootBg'),cv:g('bootCv'),hud:q('.hud'),cap:g('cap'),foot:q('.foot'),ficha:q('.ficha')}; })())"));
  const zmax = Math.max(+(zs.hud||0), +(zs.cap||0), +(zs.foot||0), +(zs.ficha||0));
  const bootMin = Math.min(+(zs.bg||999), +(zs.cv||999));
  C.check("BOOT2", "el overlay de la intro tapa el HUD/cap/foot/ficha (z boot > z HUD)", zs.bg !== null && bootMin > zmax, JSON.stringify(zs), "boot > hud");
  /* y además el CSS los oculta de raíz con data-boot=1 (no depende del overlay) */
  const vis = JSON.parse(await B.ev("JSON.stringify((function(){ var v=function(sel){var e=document.querySelector(sel);return e?getComputedStyle(e).visibility:null;}; return {hud:v('.hud'),cap:v('#cap'),foot:v('.foot'),ficha:v('.ficha')}; })())"));
  C.check("BOOT3", "data-boot=1 oculta la UI del corredor (hud/cap/foot/ficha visibility hidden)", vis.hud === "hidden" && vis.cap === "hidden" && vis.foot === "hidden" && vis.ficha === "hidden", JSON.stringify(vis), "hidden x4");
  /* v16.10: data-boot desde el primer instante (antes de boot(), que corre tras los logos) */
  await B.load(U("?dev=1&boot=1&idle=600000")); await sleep(60);
  const early = JSON.parse(await B.ev("JSON.stringify({db:document.documentElement.getAttribute('data-boot'), hud:document.querySelector('.hud')?getComputedStyle(document.querySelector('.hud')).visibility:null, cap:document.getElementById('cap')?getComputedStyle(document.getElementById('cap')).visibility:null})"));
  C.check("BOOT4", "data-boot desde el primer paint (UI oculta ANTES de la intro)", early.db === "1" && early.hud === "hidden" && early.cap === "hidden", JSON.stringify(early), "db 1 · hidden");
}

/* v16.11 · CORTINA ANTI-REBOTE. With Host PC IP = 127.0.0.1 TizenTube closes its own UI and its service
   relaunches it in debug mode; in that gap the TV shows Rewind (hidden → visible a few seconds after the launch). A return signal
   in CINE mode before CURTAIN_MS keeps the launch veil (no cineReturn); any key, the CURTAIN_MS timeout, or a return signal after
   CURTAIN_MS restores the corridor. Uses the simulated TV (real tizen-adapter.js) so the «p8e.life» trail is the real one. */
async function suiteCurtain(B, C, U) {
  const ALLOK = ["xvvl3S1TT1.TizenTubeStandalone", "ac:RN1MCdNq8t.Netflix", "org.tizen.menu"], OPEN_MS = 1250 + 450;
  const Q = "?dev=1&launchback=0&idle=600000&retg=0&noshow=0";
  const HIDE = LEAVE + "(" + JSON.stringify({ hidden: true, blur: true, pagehide: true }) + ")", SHOW = COMEBACK + "(" + JSON.stringify({ visible: true, focus: true, pageshow: true }) + ")";
  const S = async () => JSON.parse(await B.ev(`JSON.stringify((function(){ var l=P8E.stats().launch, lx=document.getElementById("lx"), v=document.getElementById("lxVeil"), A=window.P8EApps;
    return {cine:l.cine, cu:l.curtain, phase:l.phase, returns:l.returns, rewinds:l.rewinds, lxOn:lx.classList.contains("on"), veil:getComputedStyle(v).opacity, launch:document.body.classList.contains("launch"),
      app:(document.getElementById("hcoord")||{}).textContent, life:(A&&A.stats)?A.stats().life.slice(-10).map(function(x){ return x.e; }):[], tz:(window.__m47.tizen||{}).launches||[]}; })())`));
  const go = async (q = "", store = null) => { await B.setMode({ m47: true, rev: C.rev, tizen: { ok: ALLOK }, store }); await B.load(U(Q + q)); await sleep(1200); };
  const enter = async () => { await B.key(13, "m47"); await sleep(OPEN_MS); };
  const bounce = async () => { await B.ev(HIDE); await sleep(300); await B.ev(SHOW); await sleep(300); };   // TizenTube closes itself ~1 s after the launch
  const has = (s, e) => s.life.indexOf(e) >= 0;
  let errs = [];
  /* CU-a · default 12000: hidden → visible at ~1 s → curtain on, veil opaque, no cineReturn, «curtain on» in the life trail */
  await go(); await enter(); const a0 = await S(); await bounce(); const a1 = await S();
  C.check("CU-a", "TizenTube (CINE), visible ~1 s tras el lanzamiento: cortina ON (sin cineReturn), velo opaco y corredor tapado, «curtain on» en p8e.life; CURTAIN_MS por defecto 12000",
    a0.cine === true && a1.cine === true && a1.cu.ms === 12000 && a1.cu.on === true && a1.cu.ons === 1 && a1.cu.backs === 0 && a1.lxOn && +a1.veil === 1 && has(a1, "curtain on") && JSON.stringify(a1.tz) === '["xvvl3S1TT1.TizenTubeStandalone"]',
    JSON.stringify({ cine0: a0.cine, cine: a1.cine, cu: a1.cu, lxOn: a1.lxOn, veil: a1.veil, life: a1.life.slice(-4), tz: a1.tz }), "cine true · ms 12000 · on · ons 1 · backs 0 · lx on · veil 1 · curtain on");
  errs = errs.concat(B.errors);
  /* CU-b · curtain=4000: curtain on, then hidden (TizenTube in front) → nothing; still nothing at > CURTAIN_MS while hidden; visible after → cineReturn */
  await go("&curtain=4000"); await enter(); await bounce(); const b1 = await S();
  await B.ev(HIDE); await sleep(300); const b2 = await S(); await sleep(4000); const b3 = await S(); await B.ev(SHOW); await sleep(300); const b4 = await S();
  C.check("CU-b", "cortina ON → hidden (TizenTube delante): sigue CINE; pasado CURTAIN_MS oculto: nada; visible después de CURTAIN_MS → cineReturn (corredor de vuelta)",
    b1.cu.on && b2.cine && !b2.cu.on && b2.lxOn && b3.cine && b3.cu.backs === 0 && !b4.cine && b4.cu.backs === 1 && !b4.lxOn && b4.phase === "" && !b4.launch,
    JSON.stringify({ on1: b1.cu.on, b2: [b2.cine, b2.cu.on, b2.lxOn], b3: [b3.cine, b3.cu.backs], b4: [b4.cine, b4.cu.backs, b4.lxOn, b4.phase, b4.launch] }), "on · [true,false,true] · [true,0] · [false,1,false,'',false]");
  errs = errs.concat(B.errors);
  /* CU-c · curtain on and a key (→) → cineReturn at once, «curtain off key», the corridor does NOT move; the next → navigates */
  await go(); await enter(); await bounce(); const c1 = await S(); await B.key(39, "m47"); await sleep(400); const c2 = await S(); await B.key(39, "m47"); await sleep(1100); const c3 = await S();
  C.check("CU-c", "cortina ON + tecla → cineReturn inmediato («curtain off key»), la tecla NO mueve el corredor; la siguiente sí navega",
    c1.cu.on && !c2.cine && c2.cu.backs === 1 && !c2.lxOn && has(c2, "curtain off key") && c2.app === c1.app && c3.app !== c1.app,
    JSON.stringify({ on: c1.cu.on, cine: c2.cine, backs: c2.cu.backs, lxOn: c2.lxOn, app: [c1.app, c2.app, c3.app], life: c2.life.slice(-3) }), "true · false · 1 · false · [01/13,01/13,02/13] · curtain off key");
  errs = errs.concat(B.errors);
  /* CU-d · curtain=3000: curtain on and nothing else → cineReturn at CURTAIN_MS («curtain off timeout») */
  await go("&curtain=3000"); await enter(); await bounce(); const d1 = await S(); await sleep(1500); const d2 = await S(); await sleep(1700); const d3 = await S();
  C.check("CU-d", "cortina ON y nada más → sigue a mitad de CURTAIN_MS; cineReturn al cumplirse («curtain off timeout»)",
    d1.cu.on && d2.cine && d2.cu.on && !d3.cine && d3.cu.backs === 1 && !d3.lxOn && has(d3, "curtain off timeout"),
    JSON.stringify({ d1: d1.cu.on, d2: [d2.cine, d2.cu.on], d3: [d3.cine, d3.cu.backs, d3.lxOn], life: d3.life.slice(-3) }), "true · [true,true] · [false,1,false] · curtain off timeout");
  errs = errs.concat(B.errors);
  /* CU-e · curtain=0: the v16.10 behaviour, exactly (visible → cineReturn at once, no curtain, nothing in the life trail) */
  await go("&curtain=0"); await enter(); const e0 = await S(); await bounce(); const e1 = await S();
  C.check("CU-e", "?curtain=0 = v16.10 exacto: visible → cineReturn inmediato, 0 cortinas, sin «curtain» en p8e.life",
    e0.cine && !e1.cine && e1.cu.ms === 0 && e1.cu.ons === 0 && e1.cu.backs === 1 && !e1.lxOn && !e1.life.some((x) => /curtain/.test(x)),
    JSON.stringify({ cine: [e0.cine, e1.cine], cu: e1.cu, lxOn: e1.lxOn }), "[true,false] · ms 0 · ons 0 · backs 1 · lx off");
  errs = errs.concat(B.errors);
  /* CU-f · a normal/direct launch after a curtain clears it: curtain → key → ← ← (Settings) → Enter (direct) → hidden/visible within the old window: no curtain */
  await go(); await enter(); await bounce(); await B.key(39, "m47"); await sleep(400); await B.key(37, "m47"); await sleep(1100); await B.key(37, "m47"); await sleep(1100);
  const f0 = await S(); await B.key(13, "m47"); await sleep(400); const f1 = await S(); await bounce(); const f2 = await S();
  C.check("CU-f", "tras una cortina, un lanzamiento directo (Settings) la deja limpia: armed false, y su vuelta (dentro de la ventana antigua) no pone cortina ni toca el velo",
    f0.app === "12/13" && !f1.cu.armed && !f1.cine && f2.cu.ons === 1 && !f2.cu.on && !f2.lxOn && f2.phase === "" && f2.tz.join(",") === "xvvl3S1TT1.TizenTubeStandalone,org.tizen.menu",
    JSON.stringify({ app: f0.app, armed: f1.cu.armed, cine: f1.cine, ons: f2.cu.ons, on: f2.cu.on, lxOn: f2.lxOn, phase: f2.phase, tz: f2.tz }), "12/13 · false · false · 1 · false · false · '' · [TizenTube, org.tizen.menu]");
  errs = errs.concat(B.errors);
  /* CU-g · Netflix (no noscreen): unchanged — normal launch (phase open), its return within 1 s is the mirror (launchReturn), never a curtain */
  await go("&app=2"); await enter(); const g0 = await S(); await bounce(); await sleep(1250 + 600); const g1 = await S();
  C.check("CU-g", "Netflix (sin noscreen): sin cambios — fase open, no CINE, sin cortina; su vuelta a ~1 s es el espejo (returns 1, rewinds 1)",
    g0.phase === "open" && !g0.cine && !g0.cu.armed && g1.returns === 1 && g1.rewinds === 1 && g1.cu.ons === 0 && g1.phase === "" && !g1.lxOn,
    JSON.stringify({ g0: [g0.phase, g0.cine, g0.cu.armed], g1: [g1.returns, g1.rewinds, g1.cu.ons, g1.phase, g1.lxOn] }), "[open,false,false] · [1,1,0,'',false]");
  errs = errs.concat(B.errors);
  /* CU-h · reduced motion: the curtain is static and applies the same (TizenTube goes CINE); with ?curtain=0 the v16.10 reduced path (phase open) */
  await go("", { "p8e.reduce": "1" }); await enter(); const h0 = await S(); await bounce(); const h1 = await S(); await B.key(39, "m47"); await sleep(400); const h2 = await S();
  await go("&curtain=0", { "p8e.reduce": "1" }); await enter(); const h3 = await S();
  C.check("CU-h", "movimiento reducido: TizenTube en CINE con cortina (velo opaco, sin animación); tecla → corredor; con ?curtain=0 el camino reducido de v16.10 (fase open)",
    h0.cine && h1.cu.on && h1.lxOn && +h1.veil === 1 && !h2.cine && !h2.lxOn && h2.app === h1.app && h3.phase === "open" && !h3.cine,
    JSON.stringify({ h0: h0.cine, h1: [h1.cu.on, h1.lxOn, h1.veil], h2: [h2.cine, h2.lxOn, h2.app], h3: [h3.phase, h3.cine] }), "true · [true,true,1] · [false,false,01/13] · [open,false]");
  errs = errs.concat(B.errors);
  C.check("CU-z", "0 excepciones en la suite curtain", errs.length === 0, JSON.stringify(errs).slice(0, 300), "[]");
}

async function suiteV169(B, C, U) {
  const errs = [];
  /* V169.1 · el panel «Suggestions · Curated» no existe: ni DOM, ni reglas .rail, ni textos */
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?dev=1&idle=1500&net=online&noscreen=0")); await sleep(3600);
  const r1 = JSON.parse(await B.ev(`JSON.stringify({dom:document.querySelectorAll('#rail,.rail').length, css:[].reduce.call(document.styleSheets,function(n,sh){ var k=0; try{ [].forEach.call(sh.cssRules,function(r){ if(/\\.rail\\b/.test(r.cssText)) k++; }); }catch(e){} return n+k; },0),
    txt:/suggestions|curated|70s classics|arthouse/i.test(document.getElementById('tv').textContent), v:P8E.v169()})`));
  C.check("V169.1", "sin panel de sugerencias: 0 nodos #rail/.rail, 0 reglas .rail en las hojas, 0 textos «Suggestions/Curated/70s Classics», v169().rail false", r1.dom === 0 && r1.css === 0 && !r1.txt && r1.v.rail === false, `${r1.dom} · ${r1.css} · ${r1.txt} · ${r1.v.rail}`, "0 · 0 · false · false");
  /* V169.2 · la cinta Sources no existe: 13 cintas, ningún SMSourceAPP; 18 = Search */
  const r2 = JSON.parse(await B.ev(`JSON.stringify({n:P8E.apps().length, src:P8E.apps().filter(function(a){ return a.nm==="Sources"||a.appId==="org.tizen.SMSourceAPP"||a.role==="sources"||a.logo==="fuentes"; }).length, last:P8E.apps()[12]&&P8E.apps()[12].nm, coord:document.getElementById('hcoord').textContent})`));
  C.check("V169.2", "sin cinta Sources: 13 cintas, 0 con Sources/org.tizen.SMSourceAPP/«fuentes», la 13 es Search, HUD «01/13»", r2.n === 13 && r2.src === 0 && r2.last === "Search" && r2.coord === "01/13", JSON.stringify(r2), "13 · 0 · Search · 01/13");
  errs.push(...B.errors);
  /* V169.3 · el rótulo, más pequeño y centrado bajo el cassette, sin solapes EN REPOSO (franjas y píldoras fuera), en las 13 cintas */
  await B.load(U("?idle=1500&net=online&noscreen=0")); await sleep(3800);
  const rest = JSON.parse(await B.ev(BOXES)), fs3 = JSON.parse(await B.ev(`JSON.stringify(['#capNo','#capNm','#capGo'].map(function(s){ return parseFloat(getComputedStyle(document.querySelector(s)).fontSize); }))`));
  const b3 = capClear(rest), cx = rest.cap ? (rest.cap[0] + rest.cap[2]) / 2 : 0;
  C.check("V169.3", "reposo (franjas fuera): la caja de .cap NO corta cassette (3D y plano), su sombra (.drop), .foot, HUD, las 2 franjas ni sus píldoras; centrada en x 960 (±1); más pequeña (nº 27,65 · nombre 31,97 · Enter 17,28 px; antes 34,56 · 39,96 · 20,52)",
    b3.length === 0 && rest.sides.length === 2 && rest.tis.length === 0 && Math.abs(cx - 960) <= 1 && fs3.join() === "27.65,31.97,17.28" && rest.cap[1] >= 909,
    `solapes ${JSON.stringify(b3)} · cap ${JSON.stringify(rest.cap.map(Math.round))} · cassette ${JSON.stringify((rest.cflat || rest.cass).map(Math.round))} · drop ${JSON.stringify(rest.drop && rest.drop.map(Math.round))} · pie ${JSON.stringify(rest.foot.map(Math.round))} · franjas ${rest.sides.length} · centro ${cx.toFixed(1)} · fuentes ${fs3}`, "[] · centro 960 · 27.65,31.97,17.28 · top ≥ 909");
  C.rep.v169rest = rest;
  /* V169.4 · NAVEGANDO: cada fotograma de 13 pasos (→, 1,1 s cada uno): .cap contra la cinta que LLEGA (su card y, al asentar, el cassette rico),
     .foot y HUD; centrado en cada cinta. La que SE VA cruza por debajo (z 20 del rótulo sobre el corredor): se mide aparte (INFO). */
  await B.ev(`(function(){ window.__v169={hits:[],fr:0,flyby:0,flyMax:0,cx:[]}; var T=document.getElementById('tv').getBoundingClientRect(), s=T.width/1920;
    function R(e){ var r=e.getBoundingClientRect(); return [(r.left-T.left)/s,(r.top-T.top)/s,(r.right-T.left)/s,(r.bottom-T.top)/s]; }
    function hit(a,b){ return Math.min(a[2],b[2])-Math.max(a[0],b[0])>0.5&&Math.min(a[3],b[3])-Math.max(a[1],b[1])>0.5; }
    (function loop(){ var V=window.__v169; V.fr++; var cap=document.getElementById('cap'), c=R(cap), co=+getComputedStyle(cap).opacity, ai=+document.getElementById('hcoord').textContent.slice(0,2)-1;
      var items=document.querySelectorAll('.item'), tgt=items[ai]&&items[ai].querySelector('.card');
      if(co>0.02){ if(tgt&&items[ai].style.display!=='none'&&hit(c,R(tgt))) V.hits.push('llega:'+ai);
        ['#foot','.hud'].forEach(function(sel){ var f=R(document.querySelector(sel)); if(hit(c,f)){ V.hits.push(sel); if(!V.dbg) V.dbg={cap:[Math.round(c[0]),Math.round(c[1]),Math.round(c[2]),Math.round(c[3])],other:[Math.round(f[0]),Math.round(f[1]),Math.round(f[2]),Math.round(f[3])],body:document.body.className,capOp:+co}; } });
        var rc=document.querySelector('.item.rich .cass'); if(rc&&document.querySelector('.item.rich')===items[ai]&&getComputedStyle(rc).visibility!=='hidden'&&hit(c,R(rc))) V.hits.push('cassette:'+ai);
        [].forEach.call(items,function(it,i){ if(i===ai||it.style.display==='none') return; var o=+getComputedStyle(it).opacity; if(o>0.02&&hit(c,R(it.querySelector('.card')))){ V.flyby++; V.flyMax=Math.max(V.flyMax,o); } }); }
      if(!V.stop) requestAnimationFrame(loop); })(); return 1; })()`);
  const cxs = [];
  for (let i = 0; i < 13; i++) { await B.key(39, "m47"); await sleep(1100); const o = JSON.parse(await B.ev(BOXES)); cxs.push(Math.round(((o.cap[0] + o.cap[2]) / 2) * 10) / 10); }
  const nav = JSON.parse(await B.ev("window.__v169.stop=true, JSON.stringify(window.__v169)"));
  C.check("V169.4", `navegando 13 pasos (${nav.fr} fotogramas): .cap no corta la cinta que llega (card ni cassette rico), .foot ni HUD; centrada en x 960 (±1) en las 13 cintas`,
    nav.hits.length === 0 && cxs.every((c) => Math.abs(c - 960) <= 1), `solapes ${JSON.stringify(nav.hits.slice(0, 6))} · centros ${[...new Set(cxs)].join(",")}`, "[] · 960");
  C.info("V169.4i", `la cinta que SE VA vuela hacia la cámara y cruza por DEBAJO del rótulo (z 20 sobre el corredor) mientras se funde: ${nav.flyby} fotogramas en 13 pasos, opacidad máx. ${nav.flyMax.toFixed(2)} (la posición vieja, a la derecha, también la cruzaba: medido en HEAD)`);
  errs.push(...B.errors);
  /* V169.5 · glitch/scramble siguen: al navegar, .glitching y el scramble (spans .sc) en #capNm, y acaba en el nombre exacto */
  const g = JSON.parse(await B.ev(`new Promise(function(res){ var n=document.getElementById('capNm'), sc=0, gl=0, mo=new MutationObserver(function(){ if(n.querySelector('.sc')) sc++; if(n.classList.contains('glitching')) gl++; });
    mo.observe(n,{childList:true,subtree:true,attributes:true}); var e=new KeyboardEvent('keydown',{bubbles:true}); Object.defineProperty(e,'keyCode',{get:function(){ return 39; }}); dispatchEvent(e);
    setTimeout(function(){ mo.disconnect(); res(JSON.stringify({sc:sc,gl:gl,txt:n.textContent,want:n.getAttribute('data-text')})); },1300); })`));
  C.check("V169.5", "glitch y scramble del rótulo intactos al navegar (clase .glitching + spans .sc del scramble) y el nombre final exacto", g.sc > 0 && g.gl > 0 && g.txt === g.want, JSON.stringify(g), "sc > 0 · gl > 0 · nombre exacto");
  /* V169.6 · INTRO / ARMADO: cada fotograma desde el arranque hasta 1 s tras encajar: con el rótulo visible, ninguna capa del cassette (ni
     el plano), ni .foot ni HUD lo corta; durante el armado espera fuera (body.cap-wait, opacidad 0) y entra con glitch al encajar */
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?boot=1&idle=600000"), false);   // v16.10: modo producto (sin ?dev=1): el pie de dev sube 34 px y roza el rótulo sólo en dev (V169.dev)
  const intro = JSON.parse(await B.ev(`new Promise(function(res){ var t0=performance.now(), V={hits:[],fr:0,wait:0,shown:0,glitch:0,end:0}, TT=document.getElementById('tv').getBoundingClientRect(), SS=TT.width/1920;
    function R(e){ var r=e.getBoundingClientRect(); return [(r.left-TT.left)/SS,(r.top-TT.top)/SS,(r.right-TT.left)/SS,(r.bottom-TT.top)/SS]; }
    function hit(a,b){ return Math.min(a[2],b[2])-Math.max(a[0],b[0])>0.5&&Math.min(a[3],b[3])-Math.max(a[1],b[1])>0.5; }
    var n=document.getElementById('capNm'); new MutationObserver(function(){ if(n.classList.contains('glitching')) V.glitch++; }).observe(n,{attributes:true});
    (function loop(){ TT=document.getElementById('tv').getBoundingClientRect(); SS=TT.width/1920; V.fr++; var cap=document.getElementById('cap'), op=+getComputedStyle(cap).opacity, c=R(cap), bg=document.getElementById('bootBg'), veil=bg?+getComputedStyle(bg).opacity:0;
      if(document.body.classList.contains('cap-wait')) V.wait++;
      /* capas (planos) del cassette, no sus canvas sueltos: un canvas cuadrado que GIRA (bobinas, anillos) tiene una caja girada mayor que lo
         que pinta (un círculo con esquinas transparentes); medido: la bobina de abajo a 45° llega a y 936 con el cassette acabando en y 889 */
      if(op>0.02&&veil<0.98){ V.shown++; [].forEach.call(document.querySelectorAll('.cass, .cass > *, .cflat, .item.rich .drop, #foot, .hud'),function(e){ var cs=getComputedStyle(e); if(cs.display==='none'||cs.visibility==='hidden') return;
          var r=R(e); if(r[2]-r[0]>0&&hit(c,r)) V.hits.push(Math.round(performance.now()-t0)+':'+(e.id||e.className||e.tagName)); }); }
      var v=P8E.v169(); if(!V.end&&v.capw.reveals>0) V.end=performance.now();
      if((V.end&&performance.now()-V.end>1000)||performance.now()-t0>9000){ V.reveals=v.capw.reveals; V.hits=V.hits.slice(0,8); res(JSON.stringify(V)); } else requestAnimationFrame(loop); })(); })`));
  C.check("V169.6", `intro + armado (${intro.fr} fotogramas): con el rótulo visible y el velo abierto, 0 solapes con capas del cassette, su sombra y HUD; espera fuera durante el armado (${intro.wait} fotogramas con cap-wait) y entra 1 vez con glitch`,
    intro.hits.length === 0 && intro.wait > 10 && intro.reveals === 1 && intro.glitch > 0 && intro.shown > 0, JSON.stringify(intro), "0 solapes · espera > 10 · 1 entrada · glitch");
  errs.push(...B.errors);
  /* V169.7 · abrir una app: el rótulo sale hacia ABAJO conservando el centrado (translate(-50%, 48px)) y vuelve centrado */
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?dev=1&idle=600000&launchback=0&noscreen=0"));
  await B.key(13, "m47"); await sleep(1250 + 900);
  const lx = JSON.parse(await B.ev(`JSON.stringify((function(){ var c=document.getElementById('cap'), m=getComputedStyle(c).transform; return {m:m, op:getComputedStyle(c).opacity, w:c.offsetWidth, launch:document.body.classList.contains('launch')}; })())`));
  await B.key(10009, "m47"); await sleep(1250 + 1200); const back = JSON.parse(await B.ev(BOXES));
  const mm = /matrix\(1, 0, 0, 1, (-?[\d.]+), (-?[\d.]+)\)/.exec(lx.m || "");
  C.check("V169.7", "al abrir: .cap fuera hacia abajo (translate(−50 %, 48 px), opacidad 0); al volver, centrada otra vez en x 960",
    lx.launch && mm && Math.abs(+mm[1] + lx.w / 2) <= 1 && Math.abs(+mm[2] - 48) <= 0.5 && +lx.op === 0 && Math.abs((back.cap[0] + back.cap[2]) / 2 - 960) <= 1,
    `${lx.m} · op ${lx.op} · ancho ${lx.w} · vuelta centro ${((back.cap[0] + back.cap[2]) / 2).toFixed(1)}`, `matrix(…, −ancho/2, 48) · 0 · 960`);
  errs.push(...B.errors);
  /* INFO · con ?dev=1 el pie sube a y 961 (barra de ayuda): ¿corta al rótulo? (sólo diagnóstico; el TV no lleva dev) */
  await B.load(U("?dev=1&idle=600000")); await sleep(600); const dv = JSON.parse(await B.ev(BOXES));
  C.info("V169.dev", `?dev=1: rótulo ${JSON.stringify(dv.cap && dv.cap.map(Math.round))} · pie ${JSON.stringify(dv.foot && dv.foot.map(Math.round))} · ${hit(dv.cap, dv.foot) ? "SE CORTAN (sólo en dev)" : "sin corte"}`);
    C.check("V169.8", "0 excepciones en la suite v169", errs.length === 0, JSON.stringify(errs).slice(0, 300), "0");
  if (C.shots) { await B.setMode({ m47: false, rev: C.rev }); await B.load(U("?idle=1500&net=online&noscreen=0")); await sleep(3800); await B.shot(path.join(C.out, "P8e-v169-reposo.png")); }
}

/* v16.7 · idle3: el reposo a 3 s por defecto (decisión del autor, 2026-10-25) */
async function suiteIdle3(B, C, U) {
  /* V14 · reposo a 3 s por defecto (decisión del autor, 2026-10-25): el pre-horneado del cassette acaba ANTES de los 3 s, el
     reposo monta lo horneado (sin horneado de golpe), las franjas salen, y ni el relevo del arte (25 s) ni la autoría se adelantan */
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?dev=1&net=online&launchback=0&noscreen=0")); await sleep(1500);
  const art0 = JSON.parse(await B.ev("JSON.stringify({t:P8E.stats().art.transitions,au:P8E.stats().author.shows,sync:P8E.state().cfprof.sync,preps:P8E.state().cfprof.preps})"));
  await B.key(39, "m47");
  const tl = JSON.parse(await B.ev(`new Promise(function(res){ var t0=performance.now(), o={job:null,prep:null,rest:null,flat:null,bands:null}, p0=P8E.state().cfprof.preps;
    (function w(){ var s=P8E.state(), x=P8E.stats(), t=Math.round(performance.now()-t0);
      if(o.job==null&&s.cassflat.job) o.job=t; if(o.prep==null&&s.cfprof.preps>p0) o.prep=t; if(o.rest==null&&x.panel.resting) o.rest=t; if(o.flat==null&&s.cassflat.on) o.flat=t;
      var bc=" "+x.panel.bands+" "; if(o.bands==null&&o.rest!=null&&bc.indexOf(" info ")>=0&&bc.indexOf(" out ")<0&&bc.indexOf(" gone ")<0) o.bands=t;
      if(t>6000||(o.prep!=null&&o.flat!=null&&o.bands!=null)){ o.idleMs=x.idleMs; o.sync=s.cfprof.sync; o.mount=s.cassflat.ms; o.waits=s.cassflat.waits; o.err=s.cassflat.err; res(JSON.stringify(o)); } else setTimeout(w,25); })(); })`));
  const art1 = JSON.parse(await B.ev("JSON.stringify({t:P8E.stats().art.transitions,au:P8E.stats().author.shows})"));
  /* el relevo del arte que dispara el propio cambio de app (600 ms + 1800 ms de dispersal) bloquea el pre-horneado hasta ~2,4 s: si en
     el TV no acaba antes de los 3 s, el reposo ESPERA al horneado por pasos (waits > 0), nunca hornea de golpe (sync igual) */
  C.check("V167.14", "reposo por defecto 3 s (antes 20 s): entra a ~3 s; el cassette se aplana con lo pre-horneado (0 horneados de golpe, montaje < 200 ms; si el pre-horneado iba a medias, se le espera), a ≤ 1,5 s del reposo; las franjas salen; ≤ 1 relevo (el de navegar) y autoría igual",
    tl.idleMs === 3000 && tl.prep != null && tl.rest >= 2950 && tl.rest <= 3600 && tl.flat != null && tl.flat - tl.rest <= 1500 && tl.sync === art0.sync && tl.mount < 200 && !tl.err && tl.bands != null && tl.bands <= 5000 && art1.t - art0.t <= 1 && art1.au === art0.au,
    `${JSON.stringify(tl)} · relevos ${art0.t}→${art1.t} · autoría ${art0.au}→${art1.au}`, "idleMs 3000 · rest ≈ 3000 · flat ≤ rest+1500 · sync igual · montaje < 200 · franjas ≤ 5 s · ≤ 1 relevo · autoría igual");
  C.info("V167.14i", `línea de tiempo desde la flecha (ms): pre-horneado empieza ${tl.job} · listo ${tl.prep} · reposo ${tl.rest} · aplanado ${tl.flat} · franjas ${tl.bands} · esperas ${tl.waits}`);
  /* V15 · el camino de espera: con el pre-horneado tarde a propósito (?cfprems=2900) el reposo lo arranca/espera, sin horneado de golpe */
  await B.load(U("?dev=1&net=online&launchback=0&cfprems=2900")); await sleep(1500);
  const sy0 = JSON.parse(await B.ev("JSON.stringify(P8E.state().cfprof)")); await B.key(39, "m47"); await sleep(5200);
  const w = JSON.parse(await B.ev("JSON.stringify({cf:P8E.state().cassflat, prof:P8E.state().cfprof})"));
  C.check("V167.15", "reposo con el pre-horneado sin acabar (?cfprems=2900): espera al horneado por pasos (waits > 0) y se aplana sin hornear de golpe (sync igual, montaje < 200 ms)",
    w.cf.on && w.cf.waits > 0 && w.prof.sync === sy0.sync && w.cf.ms < 200 && !w.cf.err, `on ${w.cf.on} · esperas ${w.cf.waits} · sync ${sy0.sync}→${w.prof.sync} · montaje ${w.cf.ms} ms · err «${w.cf.err}»`, "true · > 0 · igual · < 200");
  C.check("V167.14b", "0 excepciones en idle3", B.errors.length === 0, JSON.stringify(B.errors).slice(0, 300), "0");
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  if (o.selftest) process.exit(selftest() ? 0 : 1);
  if (o.scanFiles) { let bad = 0; for (const f of o.scanFiles) { const h = scanES5(fs.readFileSync(f, "utf8")); if (h.length) bad++;
      console.log(`${h.length ? "[FALLA]" : "[PASA]"} ${f}: ${h.length} construcciones > ES5 ${h.length ? JSON.stringify(Object.fromEntries(Object.entries(summarize(h)).map(([k, v]) => [k, v.slice(0, 5)]))) : ""}`); }
    process.exit(bad ? 1 : 0); }
  if (!selftest()) { console.log("El escáner no pasa su propio selftest: paro."); process.exit(1); }
  o.root = path.resolve(o.root || path.join(HERE, "..", "retro-bauhaus"));
  o.gitTop = execFileSync("git", ["-C", o.root, "rev-parse", "--show-toplevel"]).toString().trim();
  o.gitPrefix = execFileSync("git", ["-C", o.root, "rev-parse", "--show-prefix"]).toString().trim().replace(/\/$/, "");
  const revCache = {}; o.revFiles = (rev) => revCache[rev] || (revCache[rev] = new Set(execFileSync("git", ["-C", o.gitTop, "ls-tree", "-r", "--name-only", rev, "--", o.gitPrefix], { maxBuffer: 64 << 20 }).toString().split("\n").filter(Boolean)));
  o.pinVariable = '"wght" 300';   // Rubik-latin-var.woff2: fvar wght 300…900, default 300 (fontTools, 2026-10-23)
  o.out = o.out || fs.mkdtempSync(path.join(os.tmpdir(), "m47out-")); fs.mkdirSync(o.out, { recursive: true });
  try { await httpGet(o.base); } catch (e) { console.log(`[FALLA] el servidor ${o.base} no responde (${e.message}). Arráncalo (p. ej. python3 -m http.server 8800 --bind 127.0.0.1, desde retro-bauhaus/) o usa --base.`); process.exit(1); }
/* ===== v16.10 · TRM DÓLAR Y TRM EURO (rates.js, 2026-10-26) ===== */
async function suiteRates(B, C, U) {
  const errs0 = B.errors.length;
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?dev=1&idle=600000&ratesnet=0"));
  const P = JSON.parse(await B.ev(`JSON.stringify((function(){ var R=P8ERates;
    return {trm:R._parseTrm('[{"valor":"3158.43","vigenciadesde":"2026-10-24T00:00:00.000","vigenciahasta":"2026-10-26T00:00:00.000"}]'),
      trmHigh:R._parseTrm('[{"valor":"999999","vigenciahasta":"2026-10-26T00:00:00.000"}]'),
      trmLow:R._parseTrm('[{"valor":"12","vigenciahasta":"2026-10-26T00:00:00.000"}]'),
      trmNoDate:R._parseTrm('[{"valor":"3158.43"}]'),
      trmJunk:R._parseTrm('{"valor":"3158.43"}'),
      bce:R._parseBce("<Cube time='2026-10-23'><Cube currency='USD' rate='1.1193'/></Cube>"),
      bceHigh:R._parseBce("<Cube time='2026-10-23'><Cube currency='USD' rate='99'/></Cube>"),
      bceNoUsd:R._parseBce("<Cube time='2026-10-23'><Cube currency='JPY' rate='175.51'/></Cube>"),
      eur:R._eurOf({v:3158.43,d:"2026-10-26"},{v:1.1193,d:"2026-10-23"})}; })())`));
  C.check("RT1", "rates.js lee la TRM real (3158.43, 26 OCT) y el USD/EUR del BCE (1.1193, 23 OCT); euro = 3535.23; cualquier cifra fuera de rango, fecha ausente o JSON con otra forma → null",
    P.trm && P.trm.v === 3158.43 && P.trm.d === "2026-10-26" && P.bce && P.bce.v === 1.1193 && P.bce.d === "2026-10-23" && P.eur && P.eur.v === 3535.23
      && !P.trmHigh && !P.trmLow && !P.trmNoDate && !P.trmJunk && !P.bceHigh && !P.bceNoUsd,
    JSON.stringify(P), "3158.43/26 OCT · 1.1193/23 OCT · 3535.23 · rechazos");

  /* RT2 · get(): caché validada; una caché manipulada no pinta; caducada (>7 días) → null */
  const store = JSON.stringify({ ts: Date.now() - 3600000, trm: { v: 3158.43, d: "2026-10-26" }, usd: { v: 1.1193, d: "2026-10-23" } });
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.rates": store } }); await B.load(U("?dev=1&idle=600000&ratesnet=0"));
  const G = JSON.parse(await B.ev("JSON.stringify({g:P8ERates.get(),s:P8ERates.stats()})"));
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.rates": JSON.stringify({ ts: Date.now(), trm: { v: "3158.43", d: "2026-10-26" }, usd: { v: 1.1193, d: "2026-10-23" } }) } });
  await B.load(U("?dev=1&idle=600000&ratesnet=0"));
  const Gbad = await B.ev("P8ERates.get()");
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.rates": JSON.stringify({ ts: Date.now() - 8 * 86400000, trm: { v: 3158.43, d: "2026-10-16" }, usd: { v: 1.1193, d: "2026-10-16" } }) } });
  await B.load(U("?dev=1&idle=600000&ratesnet=0"));
  const Gold = await B.ev("P8ERates.get()");
  C.check("RT2", "get(): con caché buena devuelve trm/eur y su fecha; una mitad con tipos cambiados se descarta (la otra sigue) y sin las dos no hay euro; una caché de hace 8 días caduca (null)",
    G.g && G.g.trm.v === 3158.43 && G.g.eur.v === 3535.23 && G.g.trmDate === "26 OCT" && G.g.eurDate === "23 OCT"
      && Gbad && Gbad.trm === null && Gbad.usd && Gbad.eur === null && Gold === null,
    JSON.stringify({ ok: G.g && [G.g.trm.v, G.g.eur.v, G.g.trmDate, G.g.eurDate], bad: Gbad, old: Gold }), "3158.43 · 3535.23 · 26 OCT · 23 OCT · trm null · null");

  /* RT3 · franjas R4/R5: importe a la colombiana + COP + fecha del dato cuando no es de hoy; nada desborda; lang=es */
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.rates": store } }); await B.load(U("?dev=1&idle=1500&net=online&ratesnet=0&pypnow=2026-10-26"));
  await sleep(3600);
  const R3 = JSON.parse(await B.ev(`JSON.stringify(['wR4','wR5'].map(function(id){ var c=document.getElementById(id); return {t:c.textContent,lang:c.getAttribute("lang"),sw:c.scrollWidth,cw:c.clientWidth,cls:c.className}; }))`));
  C.check("RT3", "R4 «TRM dólar $3.158,43 COP» · R5 «TRM euro $3.535,23 COP · 23 OCT» (fecha del BCE, que no es de hoy); lang=es; sin desbordes",
    R3[0].t === "TRM dólar$3.158,43COP" && R3[1].t === "TRM euro$3.535,23COP· 23 OCT" && R3.every((x) => x.lang === "es" && x.sw <= x.cw + 1 && /\brates\b/.test(x.cls)),
    JSON.stringify(R3), "TRM dólar$3.158,43COP · TRM euro$3.535,23COP· 23 OCT");

  /* RT4 · red: con red y sin caché, 2 GET (datos.gov.co y ecb.europa.eu), cortados por el arnés → «—», 0 excepciones */
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.rates": null, "p8e.rates.try": null } }); B.ext = []; await B.load(U("?dev=1&idle=1500&net=online&noscreen=0"));
  await sleep(1500 + 900 + 1500 + 2500 + 1200);
  const ext4 = B.ext.filter((u) => /datos\.gov\.co|ecb\.europa\.eu/.test(u)), t4 = await B.ev("document.getElementById('wR4').textContent+'|'+document.getElementById('wR5').textContent");
  C.check("RT4", "sin caché y con red: exactamente 2 GET (datos.gov.co/ceyp-9c7c y ecb.europa.eu), los dos orígenes HTTPS; al cortarlos, las franjas dicen «—» y no hay excepciones",
    ext4.length === 2 && /^https:\/\/www\.datos\.gov\.co\/resource\/ceyp-9c7c\.json\?/.test(ext4[0]) && ext4[1] === "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"
      && t4 === "TRM dólar—|TRM euro—" && B.errors.length === 0,
    `${JSON.stringify(ext4)} · «${t4}»`, "2 URL · —/—");

  /* RT5 · palancas: ?ratesnet=0 → 0 peticiones; sin internet → 0; y a los pocos segundos no se repite (60 min) */
  const lev = [];
  for (const q of ["?dev=1&idle=1500&net=online&ratesnet=0", "?dev=1&idle=1500&net=nointernet"]) {
    B.ext = []; await B.load(U(q)); await sleep(1500 + 900 + 1500 + 2500 + 800);
    lev.push(B.ext.filter((u) => /datos\.gov\.co|ecb\.europa\.eu/.test(u)).length);
  }
  C.check("RT5", "palancas: ?ratesnet=0 → 0 peticiones · sin internet → 0 peticiones", lev[0] === 0 && lev[1] === 0, JSON.stringify(lev), "0 · 0");

  C.check("RT6", "0 excepciones en la suite rates", B.errors.length === 0 && errs0 === 0, JSON.stringify(B.errors).slice(0, 300), "0");
  if (C.shots) { await B.setMode({ m47: false, rev: C.rev, store: { "p8e.rates": store } }); await B.load(U("?dev=1&idle=1500&net=online&ratesnet=0&pypnow=2026-10-26")); await sleep(3600); await B.shot(path.join(C.out, "P8e-v1610-panel.png")); }
}

/* ===== v16.10 · EL PANEL REDISEÑADO: clima actual a la izquierda, pico y placa + TRM a la derecha, sin píldoras ===== */
async function suiteV1610(B, C, U) {
  const store = JSON.stringify({ ts: Date.now() - 3600000, trm: { v: 3158.43, d: "2026-10-26" }, usd: { v: 1.1193, d: "2026-10-23" } });
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.rates": store } });
  await B.load(U("?dev=1&idle=1500&net=online&ratesnet=0&pypnow=2026-10-26"));
  await B.ev(LIVE_REC); await sleep(3800);
  const R = JSON.parse(await B.ev(`JSON.stringify((function(){
    function B(id){ var c=document.getElementById(id); if(!c) return null; return {t:c.textContent,sw:c.scrollWidth,cw:c.clientWidth,lang:c.getAttribute("lang"),cls:c.className,vis:getComputedStyle(c).display}; }
    var ids=["wL1","wL2","wL3","wL4","wL5","wR1","wR2","wR3","wR4","wR5"], o={bands:{},extra:{}};
    ids.forEach(function(id){ o.bands[id]=B(id); });
    o.extra.tag=document.querySelectorAll(".bands .tag,.bands .abs").length;
    o.extra.ti=document.querySelectorAll(".bands .ti").length;
    o.extra.wxWhen=!!document.getElementById("wxWhen");
    o.extra.wxWhenIn=!!document.querySelector("#wL1 #wxWhen");
    o.extra.oldText=/3-day forecast|Weather · Now|Weather · Updated/i.test(document.getElementById("bands").textContent);
    o.extra.bandCls=document.getElementById("bands").className;
    return o; })())`));
  const L = R.bands, bad = [];
  const has = (id, s) => L[id] && L[id].t.indexOf(s) >= 0;
  if (!has("wL1", "Weather now")) bad.push("L1 sin «Weather now»");
  if (!R.extra.wxWhenIn) bad.push("L1 sin #wxWhen");
  if (!has("wL2", "CITY") || !has("wL2", "18°") || !/PARTLY CLOUDY|OVERCAST|CLEAR/.test(R.bands.wL2.t)) bad.push("L2 sin ciudad/temperatura/estado");
  if (!has("wL3", "Feels like") || !has("wL3", "Humidity")) bad.push("L3 sin sensación/humedad");
  if (!has("wL4", "Rain")) bad.push("L4 sin lluvia");
  if (!has("wL5", "Open-Meteo.com") || !has("wL5", "CC BY 4.0")) bad.push("L5 sin atribución");
  if (!has("wR1", "Pico y placa")) bad.push("R1 sin título");
  if (!has("wR2", "No circulan")) bad.push("R2 sin «no circulan»");
  if (!has("wR3", "Horario pico y placa") || !has("wR3", "6:00–21:00")) bad.push("R3 sin horario");
  if (!has("wR4", "TRM dólar") || !has("wR4", "3.158,43")) bad.push("R4 sin TRM");
  if (!has("wR5", "TRM euro") || !has("wR5", "3.535,23")) bad.push("R5 sin euro");
  if (R.extra.tag !== 0) bad.push("quedan píldoras .tag/.abs");
  if (R.extra.ti !== 0) bad.push("quedan .ti");
  if (R.extra.oldText) bad.push("texto viejo del panel");
  const over = Object.keys(L).filter((k) => L[k] && (L[k].sw > L[k].cw + 1 || L[k].vis === "none"));
  if (over.length) bad.push("desbordan/ocultas: " + over.join(","));
  const langEs = ["wR1", "wR2", "wR3", "wR4", "wR5"].every((k) => L[k] && L[k].lang === "es");
  if (!langEs) bad.push("franjas derechas sin lang=es");
  C.check("V1610.1", "panel nuevo en reposo: 10 franjas con su contenido (clima actual L1–L5; pico y placa R1–R3; TRM R4–R5), sin píldoras (.tag/.abs/.ti = 0), sin textos viejos, sin desbordes y lang=es a la derecha",
    bad.length === 0, bad.join(" · ") || "10 franjas ok · 0 píldoras", "10 · 0 · 0");
  C.rep.v1610 = R;

  /* la hora/dato viejo vive DENTRO de L1: con ?wx=fail y un último dato de hace 2 h 40 min, dice «Updated …» */
  const base = JSON.parse(await B.ev(`JSON.stringify({ciudad:"BOGOTÁ",ahora:{t:"2026-10-26T08:00",temp:17,sens:18,hum:66,code:3,desc:"OVERCAST",icon:"cloud",dia:1,viento:3,vientoDir:75,vientoCard:"E"}})`) || "null");
  const last = { ts: Date.now() - (2 * 60 + 40) * 60000, clima: Object.assign(base, { horas: [{ t: "2026-10-26T09:00", h: "09", prob: 10 }, { t: "2026-10-26T10:00", h: "10", prob: 20 }, { t: "2026-10-26T11:00", h: "11", prob: 30 }, { t: "2026-10-26T12:00", h: "12", prob: 40 }], dias: [{ fecha: "2026-10-26", dow: "MON", max: 18, min: 8, prob: 40, code: 3, desc: "OVERCAST", icon: "cloud" }, { fecha: "2026-10-27", dow: "TUE", max: 19, min: 9, prob: 30, code: 2, desc: "PARTLY CLOUDY", icon: "part" }, { fecha: "2026-10-28", dow: "WED", max: 20, min: 10, prob: 20, code: 1, desc: "MAINLY CLEAR", icon: "sun" }], sol: { sale: "05:44", pone: "17:41" }, uv: { max: 9, nivel: "SEEK SHADE" }, fuente: "Open-Meteo.com", adaptador: "fixture", stale: false, ts: Date.now() - 160 * 60000 }) };
  await B.setMode({ m47: true, rev: C.rev, store: { "p8e.weather.last.test": JSON.stringify(last) } });
  await B.load(U("?dev=1&wx=fail&net=online&idle=1500&ratesnet=0")); await sleep(3800);
  const w = await B.ev("document.getElementById('wxWhen').textContent"), inL1 = await B.ev("!!document.querySelector('#wL1 #wxWhen')");
  C.check("V1610.2", "dato viejo: el extremo de L1 dice «Updated 2 h 40 min ago» (sin píldora) y sigue dentro de la franja", /^Updated 2 h 40 min ago$/.test(w) && inL1, `${w} · en L1 ${inL1}`, "Updated 2 h 40 min ago · true");
}

  const suites = { scan: suiteScan, keys: suiteKeys, gl: suiteGL, frames: suiteFrames, english: suiteEnglish, css: suiteCss, glitch: suiteGlitch, fonts: suiteFonts, launch: suiteLaunch, reduce: suiteReduce, security: suiteSecurity, tour: suiteTour, clean: suiteClean, v13: suiteV13, sound: suiteSound, adapter: suiteAdapter, diag: suiteDiag, author: suiteAuthor, boot: suiteBoot, hidden: suiteHidden, meter: suiteMeter, v162: suiteV162, remote: suiteRemote, v166: suiteV166, v167: suiteV167, idle3: suiteIdle3, pyp: suitePyp, v169: suiteV169, rates: suiteRates, v1610: suiteV1610, v1611: suiteV1611, direct: suiteDirect, curtain: suiteCurtain };
  /* v14: author (~4 min, timers of 20–60 s) is out of the default run; --suite author or --suite all */
  const DEFAULT_SKIP = ["author"];
  const list = !o.suite ? Object.keys(suites).filter((k) => !DEFAULT_SKIP.includes(k)) : (o.suite === "all" ? Object.keys(suites) : o.suite.split(","));
  const B = new Browser(o); let pass = 0, fail = 0; const rep = { args: { ...o, revFiles: undefined }, cases: [] };
  const C = { rev: o.rev, against: o.against, shots: o.shots, out: o.out, root: o.root, gitTop: o.gitTop, gitPrefix: o.gitPrefix, fast: o.fast, rep,
    check(id, name, ok, got, exp) { ok = !!ok; ok ? pass++ : fail++; rep.cases.push({ id, name, ok, got, exp }); console.log(`${ok ? "[PASA]" : "[FALLA]"} ${id} ${name} · obtenido ${typeof got === "string" ? got : JSON.stringify(got)} · esperado ${exp}`); },
    info(id, s) { rep.cases.push({ id, info: s }); console.log(`[INFO] ${id} ${s}`); } };
  /* v15: la fase boot (intro de arranque) viene ON por defecto; las suites existentes prueban el
     corredor tal cual, así que U añade &boot=0 salvo que la URL ya fije boot (la suite boot pide ?boot=1). Un solo sitio: cero
     regresiones v6–v14.1 (C6). */
  const U = (q) => o.base + q + (/[?&]boot=/.test(q) ? "" : (q.indexOf("?") >= 0 ? "&boot=0" : "?boot=0"));
  const hard = setTimeout(async () => { console.log("[FALLA] TIMEOUT DURO: " + o.timeout + " ms"); await B.stop(); process.exit(2); }, o.timeout);
  const bye = async (sig) => { console.log("[INFO] señal " + sig + ": cierro Chrome"); await B.stop(); process.exit(3); };
  process.on("SIGINT", () => bye("SIGINT")); process.on("SIGTERM", () => bye("SIGTERM"));
  console.log(`[INFO] m47_check · versión: ${o.rev ? "git " + o.rev : "disco"} · ${o.base} · salida ${o.out}`);
  try { await B.start();
    for (const s of list) { if (!suites[s]) { C.check("arg", "suite desconocida " + s, false, s, Object.keys(suites).join(",")); continue; }
      console.log(`--- ${s}`); try { await suites[s](B, C, U); } catch (e) { C.check(s, "la suite terminó sin error del arnés", false, e.message.slice(0, 300), "sin error"); } }
  } finally { clearTimeout(hard); await B.stop(); }
  if (B.closed) console.log(`[INFO] el arnés cerró ${B.closed} pestaña(s) que Chrome abrió por su cuenta (p. ej. chrome://settings/help)`);
  fs.writeFileSync(path.join(o.out, "report.json"), JSON.stringify(rep, (k, v) => (Buffer.isBuffer(v) ? undefined : v), 1));
  console.log(`TOTAL: ${pass} pasan · ${fail} fallan · informe ${path.join(o.out, "report.json")}`);
  process.exit(fail ? 1 : 0);
}
export { Browser, scanES5, m47css, pngDiff, pngDecode, pxStats, PROBE, parseArgs, tourRun, stillRun, suiteCss, suiteKeys, suiteGL, suiteFrames, styleState };
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

/* ===== v16.11 · RENDIMIENTO, FASE A ================================================================
   Por arreglo: (a) con la palanca ON y OFF la imagen POSADA es la misma en los instantes clave (reloj congelado del arnés:
   performance.now y rAF; animaciones CSS/WAAPI pausadas en el mismo currentTime; Math.random fijo), y (b) el comportamiento que
   promete, leído del registro P8E.v1611(). Tolerancia de imagen: la de V4 (umbral 2/255, 0 zonas calientes de 60 px y < 0,05 %
   de píxeles), salvo warpfold (umbral 16/255: la proyección es la misma matemática, pero el rasterizador redondea distinto). */
const V11_MASK = [[0, 900, 760, 1080], [0, 0, 1920, 120], [1480, 100, 1920, 440]];   // reloj, HUD y sugerencias (= V4)
const V11_ANIMS = (t, keepStill) => `(function(){ var a=__m47.docAnims?__m47.docAnims.call(document):document.getAnimations(); a.forEach(function(x){ try{ if(${keepStill ? "true" : "false"}&&x.effect&&x.effect.target&&x.effect.target.id==="artStill") return; x.pause(); x.currentTime=${t}; }catch(e){} }); return a.length; })()`;
/* K1: la disolución .pix se suaviza por NÚMERO de rAF (no por tiempo): con el reloj congelado depende de cuántos fotogramas reales
   pasan hasta la captura (ruido del arnés, igual en ON y OFF: ninguna palanca toca .pix). Se oculta sólo para esa captura. */
const V11_PIX = (on) => on ? `(function(){ var s=document.createElement("style"); s.id="v11pix"; s.textContent=".pix{visibility:hidden!important}"; document.head.appendChild(s); return 1; })()` : `(function(){ var s=document.getElementById("v11pix"); if(s) s.parentNode.removeChild(s); return 1; })()`;
const V11_RAF = (n) => `new Promise(function(r){ var k=0; function f(){ if(++k>=${n}) r(1); else requestAnimationFrame(f); } requestAnimationFrame(f); })`;
/* una navegación posada: K1 en pleno vuelo (glitch y scramble), K2/K3 en el dispersal (P 0,35 / 0,8) con el cassette ya asentado,
   K4 después de asentar la obra. La tecla y K1 caben de sobra antes de los 600 ms reales del asentado. */
async function v11Pose(B, C, U, q) {
  await B.setMode({ m47: true, rev: C.rev, clock: true }); await B.load(U("?dev=1&idle=600000" + q)); await sleep(4200);
  const t0 = await B.ev(FREEZE(0.37)); await B.ev(V11_ANIMS(0)); const out = {};   // en modo M47 FREEZE no ve getAnimations: el paneo se pausa aquí, en 0, y ya no se toca
  await B.key(39, "m47"); await B.ev(`__m47.clk.frozen=${t0}+250; 1`); await B.ev(V11_PIX(true)); await B.ev(V11_RAF(3)); await B.ev(V11_ANIMS(150, true)); out.K1 = await B.shot(null); await B.ev(V11_PIX(false));
  await B.ev(`__m47.clk.frozen=${t0}+700; 1`); await B.ev(V11_ANIMS(0, true).replace("x.pause(); x.currentTime=0;", "x.play();"));
  await B.ev("(function(){ var s=document.getElementById('artStill'); (s.getAnimations?s.getAnimations():[]).forEach(function(a){ a.pause(); a.currentTime=0; }); return 1; })()");
  await sleep(1800); const inT = await B.ev("P8E.state().inTransition");
  const st = await B.ev("P8E.v1611().artStartT");   // el relevo arrancó con el reloj congelado: se posa respecto a SU inicio
  for (const [k, P] of [["K2", 0.35], ["K3", 0.8]]) { await B.ev(`__m47.clk.frozen=${st}+${Math.round(P * 1800)}; 1`); await B.ev(V11_RAF(4)); await B.ev(V11_ANIMS(3000, true)); out[k] = await B.shot(null); }
  await B.ev(`__m47.clk.frozen=${st}+1900; 1`); await B.ev(V11_RAF(4)); await sleep(300); await B.ev(V11_ANIMS(3000)); out.K4 = await B.shot(null);
  out.info = await B.ev("JSON.stringify({v:P8E.v1611(),st:{inT:P8E.state().inTransition},gl:(P8E.stats().webgl||{}).errors||[]})"); out.inT = inT; out.errors = B.errors.slice();
  return out; }
function v11Cmp(a, b, keys, thr = 2, lim = 0.0005, noise = null) { const r = {}; let ok = true;
  for (const k of keys) { const d = pngDiff(a[k], b[k], thr, 60, V11_MASK), n = noise ? pngDiff(noise[k], a[k], thr, 60, V11_MASK) : null;
    r[k] = d.ratio + "/" + d.hotCells + (d.box ? "@" + d.box.join(",") : "") + (n ? " (ruido " + n.ratio + "/" + n.hotCells + ")" : "");
    if (d.error || (noise ? (d.hotCells > n.hotCells || d.ratio > n.ratio + 0.0002) : (d.hotCells !== 0 || d.ratio >= lim))) ok = false; }
  return { ok, txt: JSON.stringify(r) }; }
async function v11Log(B, C, U, q, seq, waitMs) {   // seq: [[keyCode, ms después]]
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?dev=1&idle=600000" + q)); await sleep(4200);
  for (const [kc, ms] of seq) { await B.key(kc, "m47"); await sleep(ms); } await sleep(waitMs);
  return JSON.parse(await B.ev("JSON.stringify(P8E.v1611())")); }
/* F1: cada relevo arranca en un fotograma posterior al del asentado que lo precede (rf = el fotograma que pinta cada cosa) */
function v11Gap(L) { const S = L.log.filter((e) => e.ev === "settle"), out = [];   // relevo − el asentado más cercano en el tiempo
  for (const e of L.log) if (e.ev === "relevo" && S.length) { let b = S[0]; for (const x of S) if (Math.abs(x.t - e.t) < Math.abs(b.t - e.t)) b = x; out.push(e.rf - b.rf); } return out; }
async function suiteV1611(B, C, U) {
  /* palancas */
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?dev=1&idle=600000")); await sleep(2500);
  const L0 = await B.ev("JSON.stringify(P8E.v1611().lev)");
  await B.load(U("?dev=1&idle=600000&v1611=0")); await sleep(2500); const L1 = await B.ev("JSON.stringify(P8E.v1611().lev)");
  await B.load(U("?dev=1&idle=600000&settle2=0&texmax=1&warpfold=1")); await sleep(2500); const L2 = await B.ev("JSON.stringify(P8E.v1611().lev)");
  C.check("V1611.0", "palancas: por defecto relevogap, prefretry, settle2 y noreflow ON; bandsflat, texmax y warpfold OFF; ?v1611=0 apaga las cuatro; cada una por separado",
    L0 === '{"relevogap":true,"prefretry":true,"settle2":true,"noreflow":true,"bandsflat":false,"texmax":0,"warpfold":false}' &&
    L1 === '{"relevogap":false,"prefretry":false,"settle2":false,"noreflow":false,"bandsflat":false,"texmax":0,"warpfold":false}' &&
    L2 === '{"relevogap":true,"prefretry":true,"settle2":false,"noreflow":true,"bandsflat":false,"texmax":1024,"warpfold":true}', `${L0} · ${L1} · ${L2}`, "defecto · todo off · settle2 off + texmax 1024 + warpfold");

  /* (a) imagen: defecto frente a cada palanca OFF y frente a todo OFF (= v16.10), en K1–K4 */
  const KS = ["K1", "K2", "K3", "K4"], ON = await v11Pose(B, C, U, ""), ON2 = await v11Pose(B, C, U, "");
  const noise = v11Cmp(ON, ON2, KS); C.info("V1611.a0", "ruido de dos arranques iguales (defecto ×2), ratio/zonas por instante: " + noise.txt + ` · en relevo en K2: ${ON.inT}`);
  const cases = [["F1", "relevogap=0"], ["F2", "prefretry=0"], ["F3", "settle2=0"], ["F4", "noreflow=0"], ["todas", "v1611=0"]];
  for (const [id, q] of cases) { const OFF = await v11Pose(B, C, U, "&" + q), c = v11Cmp(ON, OFF, KS);
    C.check("V1611.a" + id, `misma imagen con la palanca ON y con ?${q} en K1 (vuelo: glitch y scramble), K2/K3 (dispersal P 0,35/0,8, cassette asentado) y K4 (obra asentada); 0 excepciones y 0 errores GL`,
      c.ok && ON.inT && OFF.inT && ON.errors.length === 0 && OFF.errors.length === 0 && JSON.parse(OFF.info).gl.length === 0, c.txt + ` · relevo ${ON.inT}/${OFF.inT} · exc ${ON.errors.length}/${OFF.errors.length}`, "0 zonas · < 0,05 % en los 4 · relevo en marcha en K2"); }
  if (C.shots) for (const k of KS) fs.writeFileSync(path.join(C.out, `P8e-v1611-${k}.png`), ON[k]);

  /* (b) F1: el relevo nunca arranca en el fotograma del asentado */
  const nav3 = [[39, 1500], [39, 1500], [39, 1500]], burst = [[39, 400], [39, 400], [39, 400], [39, 400]];
  const g1 = await v11Log(B, C, U, "", nav3, 1200), g2 = await v11Log(B, C, U, "", burst, 1200), g0 = await v11Log(B, C, U, "&relevogap=0", nav3, 1200);
  const d1 = v11Gap(g1).concat(v11Gap(g2)), d0 = v11Gap(g0);
  C.check("V1611.bF1", "F1: en navegar a 1,5 s (×3) y en una ráfaga de 4 a 0,4 s, cada relevo arranca ≥ 1 fotograma después del asentado que lo precede (con ?relevogap=0 se enseña el desfase de v16.10)",
    d1.length >= 4 && d1.every((x) => x >= 1), `defecto ${JSON.stringify(d1)} · relevogap=0 ${JSON.stringify(d0)}`, "todos ≥ 1");

  /* (b) F2: en una ráfaga, la textura de llegada (y la saliente) ya está en caché cuando arranca el relevo */
  const r2 = g2.log.filter((e) => e.ev === "relevo"), p2 = await v11Log(B, C, U, "&prefretry=0", burst, 1200), r0 = p2.log.filter((e) => e.ev === "relevo");
  const n1 = g1.log.filter((e) => e.ev === "relevo"), pre1 = g1.log.filter((e) => e.ev === "pref" || e.ev === "relevoPre").map((e) => e.ev + ":" + (e.list || e.dest));
  C.check("V1611.bF2", "F2: ráfaga de 4 → el relevo arranca con las dos texturas en caché (subidas antes, en su propio fotograma); con ?prefretry=0 la de llegada se sube al arrancar. Navegar a 1,5 s: los relevos 2.º y 3.º la encuentran precargada (hueco quieto)",
    r2.length === 1 && r2[0].nx && r2[0].cur && r0.length === 1 && !r0[0].nx && n1.length === 3 && n1.slice(1).every((e) => e.nx && e.cur),
    `ráfaga ${JSON.stringify(r2)} · prefretry=0 ${JSON.stringify(r0)} · navegar ${JSON.stringify(n1.map((e) => (e.cur ? "c" : "-") + (e.nx ? "n" : "-")))} ${pre1.join(" ")} · LRU ${JSON.stringify(g1.tex)}`, "nx y cur en caché · prefretry=0: nx false · 2.º y 3.º precargados");

  /* (b) F3: el asentado en dos fotogramas consecutivos */
  const s1 = g1.log.filter((e) => e.ev === "settle1"), s2 = g1.log.filter((e) => e.ev === "settle"), q3 = await v11Log(B, C, U, "&settle2=0", [[39, 1500]], 600);
  const pairs = s1.map((a) => { const b = s2.find((x) => x.t >= a.t); return b ? b.rf - a.rf : null; });
  C.check("V1611.bF3", "F3: cada asentado de navegar tiene su fotograma 1 (paintApp + mudanza oculta) y el 2 (se enseña y arma) en el fotograma siguiente; con ?settle2=0 no hay fotograma 1",
    s1.length === 3 && pairs.every((x) => x === 1) && q3.log.filter((e) => e.ev === "settle1").length === 0, `defecto ${JSON.stringify(pairs)} · settle2=0 settle1 ${q3.log.filter((e) => e.ev === "settle1").length}`, "[1,1,1] · 0");

  /* (b) F4: 0 lecturas de layout en el camino de navegar (tecla → asentado + 1 fotograma); y el inclinado sigue siendo una transición */
  const READS = `(function(){ window.__rd={n:0,on:true,by:{}}; function wrap(o,p){ var d=Object.getOwnPropertyDescriptor(o,p); if(!d||!d.get) return; Object.defineProperty(o,p,{configurable:true,get:function(){ if(__rd.on){ __rd.n++; var s=(new Error().stack||"").split("\\n")[2]||""; var m=/at (\\S+) /.exec(s); var k=p+"@"+(m?m[1]:"?"); __rd.by[k]=(__rd.by[k]||0)+1; } return d.get.call(this); }}); }
    ["offsetWidth","offsetHeight","offsetTop","offsetLeft"].forEach(function(p){ wrap(HTMLElement.prototype,p); }); ["clientWidth","clientHeight","scrollWidth","scrollHeight"].forEach(function(p){ wrap(Element.prototype,p); });
    var gb=Element.prototype.getBoundingClientRect; Element.prototype.getBoundingClientRect=function(){ if(__rd.on){ __rd.n++; __rd.by.gbcr=(__rd.by.gbcr||0)+1; } return gb.apply(this,arguments); };
    var gc=window.getComputedStyle; window.getComputedStyle=function(){ if(__rd.on){ __rd.n++; var s=(new Error().stack||"").split("\\n")[2]||""; var m=/at (\\S+) /.exec(s); var k="gcs@"+(m?m[1]:"?"); __rd.by[k]=(__rd.by[k]||0)+1; } return gc.apply(window,arguments); }; return 1; })()`;
  const reads = async (q) => { await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?dev=1&idle=600000" + q)); await sleep(4200);
    await B.key(39, "m47"); await sleep(1500); await B.ev(READS); const kt = await B.ev("performance.now()"); await B.key(39, "m47");
    let s = null; for (let i = 0; i < 40 && !s; i++) { await sleep(50); s = await B.ev(`(function(){ var L=P8E.v1611().log, k=L.length-1; for(;k>=0;k--) if(L[k].ev==='settle'&&L[k].t>${kt}) return L[k].t; return null; })()`); }
    await B.ev(V11_RAF(2)); const a = JSON.parse(await B.ev("JSON.stringify(__rd)")); await sleep(1400); const b = JSON.parse(await B.ev("JSON.stringify(__rd)")); return { a, b }; };
  const F4on = await reads(""), F4off = await reads("&noreflow=0&settle2=0"), nav = (r) => Object.keys(r.by).filter((k) => !/@stillState$/.test(k)).reduce((x, k) => x + r.by[k], 0);
  C.check("V1611.bF4", "F4: de la tecla al asentado (+1 fotograma) 0 lecturas de geometría/estilo (offset*, client*, scroll*, getBoundingClientRect, getComputedStyle) fuera de stillState (arranque del relevo, que no es de F4: se informa); con ?noreflow=0&settle2=0 aparecen las de v16.10 (glitch y attach). Hasta 1,5 s se informa del resto (stillState al arrancar el relevo: fuera de F4)",
    nav(F4on.a) === 0 && nav(F4off.a) >= 2, `defecto ${F4on.a.n} ${JSON.stringify(F4on.a.by)} · v16.10 ${F4off.a.n} ${JSON.stringify(F4off.a.by)} · hasta 1,5 s: defecto ${JSON.stringify(F4on.b.by)}`, "0 · ≥ 2");
  await B.setMode({ m47: true, rev: C.rev }); await B.load(U("?dev=1&idle=600000")); await sleep(4200); await B.key(39, "m47"); await sleep(560);
  let tilt = null; for (let i = 0; i < 30; i++) { await sleep(25); const v = await B.ev("(function(){ var c=document.querySelector('.item.rich .cass'); if(!c||!c.classList.contains('t-leve')) return null; return getComputedStyle(c).transform; })()"); if (v) { tilt = tilt || []; tilt.push(v); if (tilt.length >= 3) break; } }
  const mid = tilt && tilt.length >= 2 && tilt[0] !== tilt[tilt.length - 1];
  C.check("V1611.bF4b", "F4/F3: sin el offsetWidth de attach, el cassette sigue INCLINÁNDOSE con su transición de 0,6 s (valores intermedios), no salta", !!mid, JSON.stringify(tilt && tilt.map((s) => s.slice(0, 40))), "≥ 2 valores distintos");

  /* F5: franjas — entrada (transición de .st) y giro de la autoría posados con y sin bandsflat; y la capa: transform de .fr en reposo */
  const BQ = "?dev=1&idle=600000&net=online&ratesnet=0&pypnow=2026-10-26";
  const bands = async (q) => { const o = {}; await B.setMode({ m47: true, rev: C.rev, clock: true });
    for (const t of [120, 300, 520]) { await B.load(U(BQ + q)); await sleep(3800); await B.ev("P8E.idleNow(),1"); await B.ev(V11_RAF(3)); await B.ev(V11_ANIMS(t)); await B.ev(V11_RAF(2)); o["in" + t] = await B.shot(null);
      o["bst" + t] = await B.ev("document.getElementById('bands').classList.contains('bst')"); }
    await B.ev(V11_ANIMS(5000)); await sleep(1500); await B.ev(V11_RAF(2)); o.rest = await B.shot(null);
    o.tf = await B.ev("getComputedStyle(document.querySelector('.bands .fr')).transform+'|'+document.getElementById('bands').className");
    await B.ev(FREEZE(0.37)); await B.key(39, "m47"); await B.ev(V11_RAF(3));
    for (const t of [90, 220, 380]) { await B.ev(V11_ANIMS(t)); await B.ev(V11_RAF(2)); o["out" + t] = await B.shot(null); } o.errors = B.errors.slice(); return o; };
  const b1 = await bands("&bandsflat=1"), b2 = await bands("&bandsflat=1"), b0 = await bands(""), bk = ["in120", "in300", "in520", "rest", "out90", "out220", "out380"], bc = v11Cmp(b1, b0, bk, 2, 0.0005, b2);
  C.info("V1611.F5i", "F5 (APAGADA por defecto): diferencia de imagen bandsflat=1 frente al defecto, por instante (zonas > ruido = no es «igual»): " + bc.txt);
  C.check("V1611.F5", "F5 (palanca, apagada por defecto): con ?bandsflat=1 la cara .fr va sin transformación sólo con las franjas quietas (.bst), no durante la entrada; 0 excepciones. Imagen: ver V1611.F5i. Antes decía: franjas posadas con y sin ?bandsflat — entrada (120/300/520 ms), quietas y salida (90/220/380 ms) — sin más diferencia que el ruido de dos arranques iguales (zonas ≤ ruido, ratio ≤ ruido + 0,02 %); quietas: .fr none con .bst; durante la entrada no hay .bst. (El giro de la autoría no cambia de CSS: con .arm/.au manda la regla de v16.10; lo cubre la suite v13)",
    /^none\|.*\bbst\b/.test(b1.tf) && !/^none/.test(b0.tf) && !b1.bst120 && !b1.bst300 && !b1.bst520 && b1.errors.length === 0, `${bc.txt} · .fr ${b1.tf} / ${String(b0.tf).slice(0, 40)}`, "≤ ruido · none|… bst");

  /* F6 (OFF por defecto): textura ≤ 1024 px con ?texmax=1; la imagen del dispersal SÍ cambia (por eso va apagada): se informa */
  const T6 = await v11Pose(B, C, U, "&texmax=1"), t6 = JSON.parse(T6.info).v.texWH, big = t6.filter((s) => { const m = /:(\d+)x(\d+)/.exec(s); return m && Math.max(+m[1], +m[2]) > 1024; });
  C.check("V1611.F6", "F6: con ?texmax=1 ninguna textura del arte pasa de 1024 px de lado y el relevo funciona (0 excepciones, 0 errores GL); diferencia de imagen frente al defecto informada (cambia el muestreo)",
    big.length === 0 && t6.length > 0 && T6.errors.length === 0 && JSON.parse(T6.info).gl.length === 0, `${JSON.stringify(t6)} · dif K2/K3 ${v11Cmp(ON, T6, ["K2", "K3"]).txt}`, "0 texturas > 1024 · 0 errores");

  /* F7 (OFF por defecto): vuelo posado en 3 instantes con y sin ?warpfold=1 */
  const fly = async (q, ms) => { await B.setMode({ m47: true, rev: C.rev, clock: true }); await B.load(U("?dev=1&idle=600000&rich=0" + q)); await sleep(4000);
    const t0 = await B.ev(FREEZE(0.37)); await B.key(39, "m47"); await B.ev(`__m47.clk.frozen=${t0}+${ms}; 1`); await B.ev(V11_RAF(3)); await B.ev(V11_ANIMS(150));
    const o = { s: await B.shot(null), p: await B.ev("document.querySelector('.viewport').style.perspective+'|'+document.getElementById('world').style.transform.slice(0,40)") }; return o; };
  const w7 = {}, f7 = {}, ps = []; for (const ms of [120, 220, 330]) { const a = await fly("", ms), b = await fly("&warpfold=1", ms); w7["t" + ms] = a.s; f7["t" + ms] = b.s; ps.push(a.p + " ⇄ " + b.p); }
  const c7 = v11Cmp(w7, f7, ["t120", "t220", "t330"], 16, 0.001);
  C.check("V1611.F7", "F7: con ?warpfold=1 el vuelo se ve igual en 3 instantes con golpe de perspectiva (umbral 16/255, 0 zonas, < 0,1 %) y el viewport no cambia de perspective",
    c7.ok && ps.every((p) => /^\s*\|/.test(p.split(" ⇄ ")[1]) || /^900px\|/.test(p.split(" ⇄ ")[1])), `${c7.txt} · ${ps.join(" ; ")}`, "0 zonas · < 0,1 %");

  /* movimiento reducido: navegar sigue asentando por el camino directo (sin fotograma 1) */
  const R = await v11Log(B, C, U, "&reduce=1", [[39, 900]], 300);
  C.check("V1611.R", "movimiento reducido: navegar asienta directo (sin fotograma 1) y el relevo es un corte; 0 excepciones", R.log.filter((e) => e.ev === "settle1").length === 0 && R.log.filter((e) => e.ev === "settle").length >= 1 && B.errors.length === 0, JSON.stringify(R.log.map((e) => e.ev)), "settle sin settle1");
}
