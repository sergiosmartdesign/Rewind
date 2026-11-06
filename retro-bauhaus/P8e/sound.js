/* SPDX-FileCopyrightText: 2026 Sergio Ayala
 * SPDX-License-Identifier: GPL-3.0-or-later */
/* sound.js — P8e v13: procedural UI sound for the TV launcher (Samsung UN55MU6100, Tizen 3.0, Chromium M47).
   2026-10-23. Author of the publishable work: Sergio Ayala <mail@sergio-ayala.com>.

   ES5 STRICT on purpose (M47): no let/const/arrows/classes/template literals/default params. No samples, no network:
   every sound is built from oscillators, a seeded noise buffer and a synthesised reverb impulse.

   PALETTE (see SOUND.md): F major, chord Fmaj9 (F A C E G), melodies on the F major pentatonic (F G A C D).
   Timbres of the family: two-operator FM "tine" electric piano (DX7 E.Piano idea), warm detuned saw/triangle pads
   through a low-pass, a soft sine bass, filtered noise for air/paper/electricity, one shared convolution room.

   API: window.P8ESound = { play(ev, opts), setVolume(0..1), mute(bool), isMuted(), unlock(), stats(), render(seq, o) }
   Events: nav bandsIn bandsOut authorFlip authorUnroll launchStart launchCrack launchDive launchVeil
           returnStart returnAssembled saverIn error
   opts: { dur: ms, intensity: 0..1, index: n, dir: -1|1|"left"|"right"|"up"|"down", back: bool,
           step: ms (bands: the CSS stagger), hit: ms (authorUnroll: the seat / the crash, from the event start) }
   Phase 2: wired to p8e.js; every dur/step/hit comes from p8e.js's own constants (SOUND.md «Integración»).

   Rules: localStorage "p8e.sound.mute" ("1" = muted), "p8e.sound.vol" ("0".."1", default 0.7, gain = 0.779·vol^1.3);
   "p8e.reduce" = "1" (or ?reduce=1) → only `error` sounds. Muted or reduced → play() creates 0 nodes.
   Idle: per-event nodes are released when the event ends; the shared bus (master + room) is torn down and the
   context suspended IDLE_MS after the last sound → 0 nodes alive, 0 audio rendering. */
(function (W) {
  "use strict";

  var AC = W.AudioContext || W.webkitAudioContext;
  var OAC = W.OfflineAudioContext || W.webkitOfflineAudioContext;

  var EVENTS = ["nav", "bandsIn", "bandsOut", "authorFlip", "authorUnroll", "launchStart", "launchCrack",
    "launchDive", "launchVeil", "returnStart", "returnAssembled", "saverIn", "error",
    /* v15.1 boot: the start-up cinematic, retro HEAD removed. Clock reanchored to
       t=0 = portal opening. Fire at ms-from-intro (p8e.js BC): bootPortal 0 (the entrance, FIRST sound), bootTitle 540, bootReady 1100,
       bootResolve 1510, bootDone, bootSkip on skip. The old pre-portal head (bootPower/bootBars/bootCharge/bootDischarge) is gone.
       v15.2 boot (2026-10-24): the intro no longer cuts to a firm runner at ~2020 — it RESOLVES by ARMING the
       cassette of the last app (re-using the v13 reverse-return engine). So the tail grows and there is a NEW cue, bootArmed
       ~2920 (= armStart 1820 + LXB.peak 1100): the «clac» of the deck snapping shut. bootDone MOVES to ~3070 (= armStart 1820 + LX.T 1250):
       the runner stands firm. Between ~2020 and ~3070 the launch cues are SUPPRESSED on purpose (it is an arming, not a launch): the only
       cue of the arming is bootArmed. */
    "bootPortal", "bootTitle", "bootReady", "bootResolve", "bootArmed", "bootDone", "bootSkip"];
  /* reduced-motion: only these may sound. error is information; the stripped-down boot fade keeps two voices — the ENTRANCE (bootPortal)
     and the ARRIVAL (bootDone). bootArmed is deliberately OUT: in reduced-motion there is no armed cassette (the boot is a plain fade,
     no re-assembly), so there is no «clac» to sound. NOTE for p8e.js: snd() (line ~197) also gates on `ev!=="error"`, and already allows
     bootPortal/bootDone in REDUCE, so they reach here. Keep this in sync with that gate. */
  var REDUCE_OK = { error: 1, bootPortal: 1, bootDone: 1 };

  /* ---------- tuning ---------- */
  var DEF_VOL = 0.7;           // default slider position
  function volGain(v) { return 0.779 * Math.pow(v, 1.3); }   // 0.49 (−6.2 dB) at 0.7; only +4.0 dB more at 1 → worst overlap < −12 dBFS
  var IDLE_MS = 20000;         // after this long with nothing sounding: tear the bus down and suspend
  var NAV_GAP = 0.045;         // s: nav throttle (two navs closer than this → the second is dropped)
  var MAX_NAV = 3;             // nav voices alive at once (the 4th steals the oldest)
  var MAX_ALL = 8;             // all voices alive at once
  var STEAL = 0.015;           // s: fade of a stolen voice
  var IR_SEC = 1.9;            // s: synthesised room length

  /* per-event trim in dB, and room send. Trim = trim0 + (target peak − measured peak), measured from the offline render at
     the default volume (SOUND.md, rounds 2–4, room return 1.6, post-level send). Target peaks at vol 0.7: nav −24, bands −24/−28, author −28/−27, launch −22/−26/
     −24/−20, return −26/−22, saver −34, error −20 dBFS. */
  var TRIM = { nav: -16.1, bandsIn: -17.6, bandsOut: -20.4, authorFlip: -14.4, authorUnroll: -18.6, launchStart: -14.8,
    launchCrack: -18.7, launchDive: -12.3, launchVeil: -17.9, returnStart: -10.4, returnAssembled: -16.2, saverIn: -29.5,
    error: -13.2,
    /* v15.1 boot target peaks at vol 0.7 (bigger than the use-sounds; this is an ARRIVAL). The retro head is gone,
       so the lightning ACCENT (bootDischarge) is gone with it: the PORTAL OPENING is now the dynamic peak of the kit — the entrance hit from
       silence — and the rest descend into the arrival. Targets: bootPortal −15 (the accent), bootTitle −20, bootReady −22, bootResolve −22,
       bootDone −30, bootSkip −20 (the functional cut, outside the arc). trim = target − raw peak, raw from the offline render at vol 0.7
       (2026-10-24). No master limiter: the hottest, bootPortal, peaks −15 at 0.7 and ≈−11 at vol 1 — clear of 0 dBFS. */
    /* v15.2 (the cue was registered before the EV.bootArmed synth existed, so its first −13.5 was a placeholder, never
       measured; the synth was then written and calibrated). bootArmed is the «clac» of the cassette deck arming, the lone cue of
       the ~2020→3070 assembly tramo. Target −20 dBFS @0,7 — a mechanical punctuation that reads after the quiet tramo, 5 dB under the
       entrance (bootPortal −15) and clearly over the soft bootDone (−30) that settles 150 ms later. trim = target − raw peak: the synth
       renders at −11.5 dBFS raw @0,7, so trim −8.5 lands it on −20 (measured by m47 S7.a: −19.96, 2026-10-24). */
    bootPortal: -5.3, bootTitle: -13.4, bootReady: -14.2, bootResolve: -14.7, bootArmed: -8.5, bootDone: -14.3, bootSkip: -3.7 };
  var WET = { nav: 0.10, bandsIn: 0.30, bandsOut: 0.22, authorFlip: 0.22, authorUnroll: 0.34, launchStart: 0.12,
    launchCrack: 0.18, launchDive: 0.20, launchVeil: 0.38, returnStart: 0.20, returnAssembled: 0.20,
    saverIn: 0.55, error: 0.10,
    bootPortal: 0.40, bootTitle: 0.45, bootReady: 0.14, bootResolve: 0.38, bootArmed: 0.14, bootDone: 0.30, bootSkip: 0.06 };

  /* ---------- small helpers ---------- */
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function db(x) { return Math.pow(10, x / 20); }
  function rng(seed) {                        // mulberry32: same seed, same "random" sound every time
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0; var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function store(k, v) { try { if (v === null) W.localStorage.removeItem(k); else W.localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return W.localStorage.getItem(k); } catch (e) { return null; } }
  function reduced() {
    if (read("p8e.reduce") === "1") return true;
    try { if (W.matchMedia && W.matchMedia("(prefers-reduced-motion: reduce)").matches) return true; } catch (e0) {}   // = p8e.js REDUCE (M47 never matches)
    try { return /[?&]reduce=1(&|$)/.test(W.location.search); } catch (e) { return false; }
  }
  function volFromStore() { var v = parseFloat(read("p8e.sound.vol")); return isNaN(v) ? DEF_VOL : clamp(v, 0, 1); }
  function dirOf(o) {
    var d = o && o.dir;
    if (d === -1 || d === "left" || d === "up" || d === "prev") return -1;
    return 1;
  }

  /* ---------- cached buffers (AudioBuffers are not nodes: they are kept, nodes are not) ---------- */
  var BUF = {};                                // by sample rate: { noise, ir }
  function bufs(ctx) {
    var sr = ctx.sampleRate, b = BUF[sr];
    if (b) return b;
    var r = rng(9091), i, n = Math.floor(sr * 1.0);
    var noise = ctx.createBuffer(1, n, sr), nd = noise.getChannelData(0);
    for (i = 0; i < n; i++) nd[i] = r() * 2 - 1;
    var len = Math.floor(sr * IR_SEC), pre = Math.floor(sr * 0.012);
    var ir = ctx.createBuffer(2, len, sr), c, d, y, a, t, x;
    for (c = 0; c < 2; c++) {
      d = ir.getChannelData(c); y = 0; r = rng(c ? 4242 : 1717);
      for (i = 0; i < len; i++) {
        if (i < pre) { d[i] = 0; continue; }
        t = (i - pre) / sr;
        a = 0.85 - 0.7 * Math.min(1, t / IR_SEC);          // the tail gets darker as it decays
        x = (r() * 2 - 1) * Math.exp(-3.4 * t);
        y += a * (x - y); d[i] = y;
      }
    }
    b = BUF[sr] = { noise: noise, ir: ir };
    return b;
  }

  /* ======================================================================================================
     ENGINE: one per AudioContext (the live one, or a temporary OfflineAudioContext for render())
     ====================================================================================================== */
  function Engine(ctx, offline, vol) {
    this.ctx = ctx; this.offline = offline;
    this.vol = vol; this.bus = null;
    this.voices = []; this.created = 0; this.live = 0; this.maxVoices = 0; this.maxNav = 0;
    this.steals = 0; this.drops = 0; this.lastNav = -1; this.navPos = 0; this.lastEnd = 0;
  }
  var E = Engine.prototype;

  E.count = function (v, n) { this.created++; this.live++; if (v) v.nodes.push(n); return n; };

  E.ensureBus = function (room) {
    var ctx = this.ctx, b = this.bus;
    if (!b) {
      b = this.bus = { master: ctx.createGain(), conv: null, ret: null };
      b.master.gain.value = volGain(this.vol);
      b.master.connect(ctx.destination); this.created++; this.live++;
    }
    if (room && !b.conv) {
      b.conv = ctx.createConvolver(); b.conv.buffer = bufs(ctx).ir;
      b.ret = ctx.createGain(); b.ret.gain.value = 1.6;   // room return: a −20 dBFS burst → room peak −25.9 at 1.0 (measured)
      b.conv.connect(b.ret); b.ret.connect(b.master); this.created += 2; this.live += 2;
    }
    return b;
  };
  E.dropBus = function () {
    var b = this.bus; if (!b) return;
    try { b.master.disconnect(); } catch (e) {}
    this.live--;
    if (b.conv) { try { b.conv.disconnect(); b.ret.disconnect(); } catch (e2) {} this.live -= 2; }
    this.bus = null;
  };

  /* node factories: every node is counted and owned by a voice */
  E.osc = function (v, type, f, t0, t1) {
    var o = this.count(v, this.ctx.createOscillator());
    o.type = type; o.frequency.setValueAtTime(f, t0); o.start(t0); o.stop(t1); v.srcs.push(o);
    if (t1 > v.end) v.end = t1;
    return o;
  };
  E.gain = function (v, g) { var n = this.count(v, this.ctx.createGain()); n.gain.value = g; return n; };
  E.filt = function (v, type, f, q) {
    var n = this.count(v, this.ctx.createBiquadFilter()); n.type = type; n.frequency.value = f; n.Q.value = q; return n;
  };
  E.pan = function (v, p) {
    if (!this.ctx.createStereoPanner) return this.gain(v, 1);
    var n = this.count(v, this.ctx.createStereoPanner()); n.pan.value = clamp(p, -1, 1); return n;
  };
  E.noise = function (v, t0, t1, off) {
    var s = this.count(v, this.ctx.createBufferSource());
    s.buffer = bufs(this.ctx).noise; s.loop = true; s.start(t0, off || 0); s.stop(t1); v.srcs.push(s);
    if (t1 > v.end) v.end = t1;
    return s;
  };

  /* envelopes: setValueAtTime before every ramp; exponential only towards 1e-4, never 0 */
  function perc(p, t0, atk, peak, dec) {
    p.setValueAtTime(0, t0); p.linearRampToValueAtTime(peak, t0 + atk);
    p.exponentialRampToValueAtTime(0.0001, t0 + atk + dec); p.setValueAtTime(0, t0 + atk + dec + 0.002);
    return t0 + atk + dec + 0.004;
  }
  function swell(p, t0, atk, peak, hold, rel) {      // linear: pads and cross-fades
    p.setValueAtTime(0, t0); p.linearRampToValueAtTime(peak, t0 + atk);
    p.setValueAtTime(peak, t0 + atk + hold); p.linearRampToValueAtTime(0, t0 + atk + hold + rel);
    return t0 + atk + hold + rel + 0.004;
  }

  /* --- instrument 1: two-operator FM "tine" piano (DX7 E.Piano idea) --- */
  E.tine = function (v, dest, f, t0, o) {
    var dec = o.dec || 0.32, atk = o.atk || 0.004, end = t0 + atk + dec + 0.01;
    var car = this.osc(v, "sine", f, t0, end), cg = this.gain(v, 0);
    perc(cg.gain, t0, atk, o.amp || 1, dec);
    if (o.bend) { car.detune.setValueAtTime(o.bend, t0); car.detune.linearRampToValueAtTime(0, t0 + 0.045); }
    var mod = this.osc(v, "sine", f * (o.ratio || 1), t0, end), mg = this.gain(v, 0);
    var ix = (o.index === undefined ? 1.5 : o.index) * f;
    mg.gain.setValueAtTime(ix, t0); mg.gain.exponentialRampToValueAtTime(Math.max(ix * 0.12, 0.01), t0 + (o.idxDec || 0.16));
    mod.connect(mg); mg.connect(car.frequency);
    if (o.tine !== 0) {                                // the bright "tine" strike: ratio 14, gone in ~30 ms
      var m2 = this.osc(v, "sine", f * 14, t0, t0 + 0.06), m2g = this.gain(v, 0);
      m2g.gain.setValueAtTime(f * (o.tine || 0.5), t0); m2g.gain.exponentialRampToValueAtTime(0.01, t0 + 0.03);
      m2.connect(m2g); m2g.connect(car.frequency);
    }
    var lp = this.filt(v, "lowpass", o.lp || 3800, 0.5);
    car.connect(cg); cg.connect(lp); lp.connect(dest);
    return end;
  };
  /* --- instrument 2: warm pad, two detuned oscillators per note --- */
  E.pad = function (v, dest, f, t0, atk, hold, rel, amp, type, cents) {
    var end = t0 + atk + hold + rel + 0.01, g = this.gain(v, 0), c = cents || 7;
    var a = this.osc(v, type || "sawtooth", f, t0, end), b = this.osc(v, type || "sawtooth", f, t0, end);
    a.detune.value = -c; b.detune.value = c;
    swell(g.gain, t0, atk, amp, hold, rel);
    a.connect(g); b.connect(g); g.connect(dest);
    return end;
  };
  /* --- instrument 3: soft sine bass with a short pitch drop --- */
  E.bass = function (v, dest, f, t0, dec, amp) {
    var end = t0 + dec + 0.02, o = this.osc(v, "sine", f * 1.5, t0, end), g = this.gain(v, 0);
    o.frequency.exponentialRampToValueAtTime(f, t0 + 0.06);
    perc(g.gain, t0, 0.006, amp, dec);
    o.connect(g); g.connect(dest);
    return end;
  };

  /* ======================================================================================================
     THE 13 EVENTS: fn(eng, v, t0, o, lvl) → end time. They write into v.input (dry + room send).
     ====================================================================================================== */
  var NAV = [69, 72, 74, 77, 79, 81, 84];            // A4 C5 D5 F5 G5 A5 C6 (F major pentatonic)
  var FMAJ9 = [65, 69, 72, 76, 79];                  // F4 A4 C5 E5 G5
  var EV = {};

  EV.nav = function (e, v, t, o) {
    var d = dirOf(o), deg;
    if (typeof o.index === "number") deg = ((Math.floor(o.index) % NAV.length) + NAV.length) % NAV.length;
    else { e.navPos = (e.navPos + d + NAV.length * 99) % NAV.length; deg = e.navPos; }
    var f = mtof(NAV[deg]), p = e.pan(v, d * 0.18); p.connect(v.input);
    var end = e.tine(v, p, f, t, { amp: 1, dec: 0.26, index: 1.3, idxDec: 0.12, tine: 0.45, lp: 3600, bend: -d * 35 });
    var g = e.gain(v, 0.22), p2 = e.pan(v, -d * 0.3); g.connect(p2); p2.connect(v.input);   // ghost echo, a 16th at 91 BPM
    var e2 = e.tine(v, g, f, t + 0.165, { amp: 1, dec: 0.22, index: 0.8, tine: 0, lp: 2000 });
    return Math.max(end, e2);
  };

  EV.bandsIn = function (e, v, t, o) {
    var dur = (o.dur || 600) / 1000, step = o.step > 0 ? o.step / 1000 : Math.min(0.07, dur / 8), end = t, i;   // step = IN_STG (70 ms)
    for (i = 0; i < FMAJ9.length; i++) {
      end = Math.max(end, e.tine(v, v.input, mtof(FMAJ9[i]), t + i * step,
        { amp: 0.62 - i * 0.06, dec: 0.9, index: 0.9, idxDec: 0.25, tine: 0.3, lp: 3200 }));
    }
    var lp = e.filt(v, "lowpass", 500, 0.7); lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(1500, t + dur);
    lp.connect(v.input);
    end = Math.max(end, e.pad(v, lp, mtof(53), t, dur * 0.5, dur * 0.4, 0.7, 0.16));    // F3
    end = Math.max(end, e.pad(v, lp, mtof(60), t, dur * 0.5, dur * 0.4, 0.7, 0.12));    // C4
    return end;
  };

  EV.bandsOut = function (e, v, t, o) {
    var dur = (o.dur || 560) / 1000, step = o.step > 0 ? o.step / 1000 : Math.min(0.06, dur / 8), notes = [79, 76, 72], end = t, i;   // step = OUT_STG (50 ms)
    var lp = e.filt(v, "lowpass", 3000, 0.6); lp.frequency.setValueAtTime(3000, t); lp.frequency.exponentialRampToValueAtTime(900, t + dur);
    lp.connect(v.input);
    for (i = 0; i < notes.length; i++) {
      end = Math.max(end, e.tine(v, lp, mtof(notes[i]), t + i * step, { amp: 0.7 - i * 0.12, dec: 0.32, index: 0.9, tine: 0.25, lp: 3000 }));
    }
    return end;
  };

  EV.authorFlip = function (e, v, t, o) {
    var back = !!o.back || o.dir === "out", total = (o.dur || 760) / 1000, i, end = t;   // p8e.js: {dir:"in"|"out"}
    var rows = back ? [67, 69, 72, 74, 77] : [89, 86, 84, 81, 79];   // swap ticks: F6 D6 C6 A5 G5 (back: low, rising)
    var hp = e.filt(v, "bandpass", 2400, 1.2); hp.connect(v.input);
    for (i = 0; i < 5; i++) {                          // face swap of each row: 240 + 70·i ms (p8e.css .bands.au)
      var tt = t + (0.24 + 0.07 * i) * (total / 0.76);
      var c = e.osc(v, "sine", mtof(rows[i]) * 2, tt, tt + 0.05), cg = e.gain(v, 0);
      c.frequency.exponentialRampToValueAtTime(mtof(rows[i]), tt + 0.012);
      perc(cg.gain, tt, 0.002, 0.42, 0.035); c.connect(cg); cg.connect(hp);
      end = Math.max(end, tt + 0.05);
    }
    var chord = back ? [65, 69, 72, 76] : [69, 72, 76, 79];          // Fmaj7 back home / Am7 (inside Fmaj9) turning
    var lp = e.filt(v, "lowpass", 1800, 0.5); lp.connect(v.input);
    for (i = 0; i < chord.length; i++) {
      end = Math.max(end, e.pad(v, lp, mtof(chord[i]), t + 0.2 * (total / 0.76), 0.36 * (total / 0.76), 0.1, 0.55, 0.07, "triangle", 5));
    }
    return end;
  };

  EV.authorUnroll = function (e, v, t, o) {           // open: the papyrus unrolls (rising sweep) · close: it rolls up (falling)
    var close = o.dir === "close", dur = (o.dur || 900) / 1000, r = rng(close ? 2026 : 1990), end = t + dur + 0.06, i, n = 0;
    var f0 = close ? 3000 : 500, f1 = close ? 500 : 3000;
    var src = e.noise(v, t, end, 0.31), bp = e.filt(v, "bandpass", f0, 0.9), g = e.gain(v, 0);
    bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5, t + 0.08);
    for (i = 0.1; i < dur - 0.05; i += 0.028) g.gain.linearRampToValueAtTime(0.25 + 0.3 * r(), t + i);   // paper grain (ramped: no zipper)
    g.gain.setValueAtTime(0.4, t + dur - 0.05); g.gain.linearRampToValueAtTime(0, t + dur + 0.05);
    src.connect(bp); bp.connect(g); g.connect(v.input);
    var SPK = [84, 86, 89, 91, 93];                    // C6 D6 F6 G6 A6: the particles (closing: fewer, the ink has already gone)
    for (i = 0; i < (close ? 3 : 6); i++) {
      var tt = t + 0.08 + r() * (dur - 0.1), p = e.pan(v, (r() * 2 - 1) * 0.6); p.connect(v.input);
      end = Math.max(end, e.tine(v, p, mtof(SPK[Math.floor(r() * SPK.length)]), tt,
        { amp: 0.32, dec: 0.38, index: 0.6, ratio: 3.5, tine: 0, lp: 6000 }));
      n++;
    }
    end = Math.max(end, e.pad(v, v.input, mtof(close ? 53 : 57), t, dur * 0.6, dur * 0.3, 0.6, 0.06, "triangle", 6));   // A3 bed (closing: F3, home)
    if (o.hit > 0) {                                   // the seat (open, f45) or the crash of the rolls (close, g24): a soft paper tap
      var th = t + o.hit / 1000, hs = e.noise(v, th, th + 0.03, 0.57), hb = e.filt(v, "bandpass", close ? 900 : 1400, 1.4), hg = e.gain(v, 0);
      perc(hg.gain, th, 0.002, close ? 0.5 : 0.32, close ? 0.024 : 0.016); hs.connect(hb); hb.connect(hg); hg.connect(v.input);
      if (close) end = Math.max(end, e.tine(v, v.input, mtof(53), th, { amp: 0.22, dec: 0.12, index: 0.7, tine: 0, lp: 1400 }));   // F3 under the crash
      end = Math.max(end, th + 0.034);
    }
    return end;
  };

  EV.launchStart = function (e, v, t, o) {             // the VCR "clunk" when PLAY goes down
    var end = e.bass(v, v.input, mtof(41), t, 0.22, 0.9);                     // F2 thock
    var s = e.noise(v, t, t + 0.03, 0.07), bp = e.filt(v, "bandpass", 1900, 2.5), g = e.gain(v, 0);
    perc(g.gain, t, 0.001, 0.55, 0.018); s.connect(bp); bp.connect(g); g.connect(v.input);
    var dur = (o.dur || 130) / 1000, lp = e.filt(v, "lowpass", 300, 0.8);   // the inhale under it
    lp.frequency.setValueAtTime(300, t); lp.frequency.linearRampToValueAtTime(1200, t + dur + 0.2); lp.connect(v.input);
    end = Math.max(end, e.pad(v, lp, mtof(48), t, dur + 0.12, 0.02, 0.16, 0.18));    // C3 (the fifth, unresolved)
    return Math.max(end, t + 0.04);
  };

  EV.launchCrack = function (e, v, t, o) {              // electricity "in twos" (33 ms), not a buzz
    var dur = (o.dur || 310) / 1000, r = rng(1987), end = t + dur + 0.03, i;
    var s = e.noise(v, t, end, 0.53), hp = e.filt(v, "highpass", 2600, 0.7), g = e.gain(v, 0);
    g.gain.setValueAtTime(0, t);
    for (i = 0; i < dur; i += 0.033) {
      var on = r() < 0.82 ? 0.15 + 0.35 * r() : 0;
      g.gain.setValueAtTime(on, t + i); g.gain.setValueAtTime(on * 0.3, t + i + 0.012);
    }
    g.gain.setValueAtTime(0.1, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + 0.025);
    s.connect(hp); hp.connect(g); g.connect(v.input);
    for (i = 0; i < 3; i++) {                           // metallic FM sparks (ratio 1.41, inharmonic) on C6/G6/E6
      end = Math.max(end, e.tine(v, v.input, mtof([84, 91, 88][i]), t + i * 0.099 * (dur / 0.31),
        { amp: 0.28, dec: 0.12, index: 2.4, ratio: 1.41, idxDec: 0.08, tine: 0, lp: 5200 }));
    }
    return end;
  };

  EV.launchDive = function (e, v, t, o) {               // the camera dive: rising whoosh + supersaw-lite glide
    var dur = (o.dur || 610) / 1000, end = t + dur + 0.07, i;
    var s = e.noise(v, t, end, 0.11), lp = e.filt(v, "lowpass", 400, 0.9), g = e.gain(v, 0);
    lp.frequency.setValueAtTime(400, t); lp.frequency.exponentialRampToValueAtTime(5200, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.35, t + dur * 0.85); g.gain.linearRampToValueAtTime(0, t + dur + 0.06);
    s.connect(lp); lp.connect(g); g.connect(v.input);
    var sl = e.filt(v, "lowpass", 500, 1.2), sg = e.gain(v, 0); sl.connect(sg); sg.connect(v.input);
    sl.frequency.setValueAtTime(500, t); sl.frequency.exponentialRampToValueAtTime(3400, t + dur);
    sg.gain.setValueAtTime(0, t); sg.gain.linearRampToValueAtTime(0.16, t + dur * 0.9); sg.gain.linearRampToValueAtTime(0, t + dur + 0.06);
    var notes = [53, 60, 65], cents = [-9, 0, 9];
    for (i = 0; i < 3; i++) {                           // F3 C4 F4, one octave up over the dive
      var x = e.osc(v, "sawtooth", mtof(notes[i]), t, end);
      x.frequency.exponentialRampToValueAtTime(mtof(notes[i] + 12), t + dur); x.detune.value = cents[i]; x.connect(sl);
    }
    return end;
  };

  EV.launchVeil = function (e, v, t, o) {               // arrival: the Fmaj9 bloom (the one big chord of the set)
    var end = t, i, lp = e.filt(v, "lowpass", 900, 0.5);
    lp.frequency.setValueAtTime(900, t); lp.frequency.linearRampToValueAtTime(2400, t + 0.25); lp.frequency.linearRampToValueAtTime(1100, t + 1.6);
    lp.connect(v.input);
    for (i = 0; i < FMAJ9.length; i++) {
      end = Math.max(end, e.tine(v, v.input, mtof(FMAJ9[i]), t + i * 0.012, { amp: 0.34, dec: 1.3, index: 0.9, idxDec: 0.3, tine: 0.3, lp: 3400 }));
      end = Math.max(end, e.pad(v, lp, mtof(FMAJ9[i] - 12), t, 0.08, 0.35, 1.1, 0.07));
    }
    end = Math.max(end, e.bass(v, v.input, mtof(41), t, 0.9, 0.55));
    return end;
  };

  EV.returnStart = function (e, v, t, o) {              // the dive played backwards: falling whoosh and glide
    var dur = (o.dur || 300) / 1000 + 0.12, end = t + dur + 0.05, i;
    var s = e.noise(v, t, end, 0.71), lp = e.filt(v, "lowpass", 4200, 0.8), g = e.gain(v, 0);
    lp.frequency.setValueAtTime(4200, t); lp.frequency.exponentialRampToValueAtTime(350, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.3, t + 0.05); g.gain.linearRampToValueAtTime(0, t + dur);
    s.connect(lp); lp.connect(g); g.connect(v.input);
    var sl = e.filt(v, "lowpass", 2400, 1), sg = e.gain(v, 0); sl.connect(sg); sg.connect(v.input);
    sl.frequency.setValueAtTime(2400, t); sl.frequency.exponentialRampToValueAtTime(500, t + dur);
    swell(sg.gain, t, 0.04, 0.13, dur - 0.14, 0.1);
    var notes = [65, 72], cents = [-8, 8];
    for (i = 0; i < 2; i++) {
      var x = e.osc(v, "sawtooth", mtof(notes[i]), t, end);
      x.frequency.exponentialRampToValueAtTime(mtof(notes[i] - 12), t + dur); x.detune.value = cents[i]; x.connect(sl);
    }
    return end;
  };

  EV.returnAssembled = function (e, v, t, o) {          // back in place: cassette-insert thock + C5 → F5 (home)
    var end = e.bass(v, v.input, mtof(41), t, 0.18, 0.7);
    var s = e.noise(v, t, t + 0.025, 0.91), bp = e.filt(v, "bandpass", 1500, 2.5), g = e.gain(v, 0);
    perc(g.gain, t, 0.001, 0.4, 0.015); s.connect(bp); bp.connect(g); g.connect(v.input);
    end = Math.max(end, e.tine(v, v.input, mtof(72), t + 0.01, { amp: 0.6, dec: 0.3, index: 1.1, tine: 0.4, lp: 3400 }));
    end = Math.max(end, e.tine(v, v.input, mtof(77), t + 0.1, { amp: 0.7, dec: 0.55, index: 1.0, tine: 0.4, lp: 3400 }));
    return end;
  };

  EV.saverIn = function (e, v, t, o) {                  // a pad from the next room: Fmaj7, one-shot, 8 s, no loop
    var notes = [53, 57, 60, 64], end = t, i, lp = e.filt(v, "lowpass", 650, 0.4); lp.connect(v.input);
    for (i = 0; i < notes.length; i++) end = Math.max(end, e.pad(v, lp, mtof(notes[i]), t + i * 0.25, 2.4, 2.0, 3.4, 0.2, "triangle", 6));
    return end;
  };

  EV.error = function (e, v, t, o) {                    // "can't open": E4 → C4, hollow FM (ratio 2), no harsh interval
    var end = e.tine(v, v.input, mtof(64), t, { amp: 0.85, dec: 0.16, index: 1.6, ratio: 2, tine: 0, lp: 1800 });
    end = Math.max(end, e.tine(v, v.input, mtof(60), t + 0.15, { amp: 0.9, dec: 0.28, index: 1.4, ratio: 2, tine: 0, lp: 1600 }));
    return end;
  };

  /* ======================================================================================================
     v15.1 · THE BOOT CINEMATIC (retro head removed). Each cue fires on its own snd()
     at its ms (p8e.js BC, t=0 = portal opening); they do NOT cross-schedule — the picture's clock (one rAF) places them. Palette stays
     F major / Fmaj9. It is an ARRIVAL: bigger than nav/launch. bootPortal is the entrance hit from silence and the LOUDEST of the kit;
     the rest descend into the arrival. Everything still honours mute/reduce/idle/hidden through play().
     ====================================================================================================== */
  EV.bootPortal = function (e, v, t, o) {              // 0 ms · THE ENTRANCE (first sound of boot): a grave whoosh rising + a sub gliding down (suction into the tunnel)
    var dur = 0.56, end = t + dur + 0.08;
    var s = e.noise(v, t, end, 0.15), lp = e.filt(v, "lowpass", 300, 1.0), g = e.gain(v, 0);
    lp.frequency.setValueAtTime(300, t); lp.frequency.exponentialRampToValueAtTime(3600, t + dur);   // the opening whoosh brightening
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.42, t + dur * 0.8); g.gain.linearRampToValueAtTime(0, t + dur + 0.07);
    s.connect(lp); lp.connect(g); g.connect(v.input);
    var sl = e.filt(v, "lowpass", 900, 1.1), sg = e.gain(v, 0); sl.connect(sg); sg.connect(v.input);
    sl.frequency.setValueAtTime(1400, t); sl.frequency.exponentialRampToValueAtTime(260, t + dur);
    var a = e.osc(v, "sawtooth", mtof(53), t, end), b = e.osc(v, "sawtooth", mtof(53), t, end);
    a.detune.value = -10; b.detune.value = 10;
    a.frequency.exponentialRampToValueAtTime(mtof(29), t + dur); b.frequency.exponentialRampToValueAtTime(mtof(29), t + dur);   // F3→F1, the suction pulling in
    swell(sg.gain, t, 0.04, 0.3, dur - 0.2, 0.14); a.connect(sl); b.connect(sl);
    end = Math.max(end, e.pad(v, v.input, mtof(41), t, dur * 0.5, dur * 0.3, 0.2, 0.12, "triangle", 6));   // the portal's low drone
    return end;
  };
  EV.bootTitle = function (e, v, t, o) {               // 540 ms · particles gather into «LAUNCHER»: a granular shimmer converging, then an Fmaj9 bloom when they land (~1280)
    var conv = 0.74, end = t, r = rng(2025), i, n = 12;
    var SPK = [84, 86, 88, 89, 91, 93, 96];            // C6 D6 E6 F6 G6 A6 C7 (Fmaj9 extensions)
    for (i = 0; i < n; i++) {
      var frac = i / n, tt = t + frac * conv, p = e.pan(v, (r() * 2 - 1) * (0.7 - 0.6 * frac));   // scattered → centred as they converge
      p.connect(v.input);
      end = Math.max(end, e.tine(v, p, mtof(SPK[Math.floor(r() * SPK.length)]), tt,
        { amp: 0.14 + 0.18 * frac, dec: 0.3 + 0.3 * frac, index: 0.6, ratio: 3.0, idxDec: 0.12, tine: 0, lp: 7000 }));
    }
    var bl = t + conv, lp = e.filt(v, "lowpass", 1400, 0.5);
    lp.frequency.setValueAtTime(1400, bl); lp.frequency.linearRampToValueAtTime(3200, bl + 0.2); lp.frequency.linearRampToValueAtTime(1600, bl + 0.9);
    lp.connect(v.input);
    for (i = 0; i < FMAJ9.length; i++) {               // the bloom: Fmaj9 an octave up, bright and resolved
      end = Math.max(end, e.tine(v, v.input, mtof(FMAJ9[i] + 12), bl + i * 0.015, { amp: 0.26, dec: 1.0, index: 0.8, idxDec: 0.3, tine: 0.35, lp: 5000 }));
      end = Math.max(end, e.pad(v, lp, mtof(FMAJ9[i]), bl, 0.1, 0.4, 0.8, 0.06));
    }
    return end;
  };
  EV.bootReady = function (e, v, t, o) {               // 1100 ms · SYS.READY: a clean confirmation, C5 → F5 (home) with a high sparkle
    var end = t;
    end = Math.max(end, e.tine(v, v.input, mtof(72), t, { amp: 0.55, dec: 0.16, index: 1.1, tine: 0.45, lp: 3800 }));        // C5
    end = Math.max(end, e.tine(v, v.input, mtof(77), t + 0.08, { amp: 0.72, dec: 0.3, index: 1.0, tine: 0.45, lp: 4200 }));  // F5 (home)
    end = Math.max(end, e.tine(v, v.input, mtof(89), t + 0.08, { amp: 0.2, dec: 0.22, index: 0.5, ratio: 3, tine: 0, lp: 7000 }));   // F6 sparkle on top
    return end;
  };
  EV.bootResolve = function (e, v, t, o) {             // 1510 ms · the cadence that delivers to the corridor: an exhale falling home to F major, G→F resolving
    var dur = 0.5, end = t + dur + 0.05, i;
    var s = e.noise(v, t, t + dur, 0.8), lp = e.filt(v, "lowpass", 2200, 0.6), g = e.gain(v, 0);
    lp.frequency.setValueAtTime(2200, t); lp.frequency.exponentialRampToValueAtTime(400, t + dur);   // the breath darkening as it settles
    swell(g.gain, t, 0.05, 0.16, dur * 0.4, dur * 0.5); s.connect(lp); lp.connect(g); g.connect(v.input);
    var pl = e.filt(v, "lowpass", 1600, 0.5); pl.connect(v.input);
    pl.frequency.setValueAtTime(1600, t); pl.frequency.linearRampToValueAtTime(700, t + dur);
    var FHOME = [53, 57, 60, 65];                      // F3 A3 C4 F4: plain F major, home
    for (i = 0; i < FHOME.length; i++) end = Math.max(end, e.pad(v, pl, mtof(FHOME[i]), t, 0.08, dur * 0.4, dur * 0.5, 0.14, "triangle", 5));
    end = Math.max(end, e.tine(v, v.input, mtof(79), t, { amp: 0.3, dec: 0.3, index: 0.9, tine: 0.3, lp: 3400 }));           // G5
    end = Math.max(end, e.tine(v, v.input, mtof(77), t + 0.18, { amp: 0.34, dec: 0.5, index: 0.9, tine: 0.3, lp: 3200 }));   // F5, the cadence lands
    end = Math.max(end, e.bass(v, v.input, mtof(41), t, 0.4, 0.3));                          // soft F2 under it
    return end;
  };
  EV.bootArmed = function (e, v, t, o) {               // ~2920 ms (armStart 1820 + LXB.peak 1100) · THE «CLAC»: the cassette deck snapping shut as the last app re-arms. The LONE cue of the ~2020→3070 assembly tramo (launch cues suppressed under BOOT.arming). Mechanical, not melodic: the home chord belongs to returnAssembled, not here.
    var end = e.bass(v, v.input, mtof(41), t, 0.12, 0.5);                                     // F2 thock: the mechanism seating (shorter/softer than returnAssembled)
    var s = e.noise(v, t, t + 0.022, 0.95), bp = e.filt(v, "bandpass", 1900, 2.2), g = e.gain(v, 0);
    perc(g.gain, t, 0.001, 0.5, 0.016); s.connect(bp); bp.connect(g); g.connect(v.input);     // the snap: a sharp band-passed click (the lid/gear)
    var cs = e.noise(v, t + 0.019, t + 0.034, 0.4), ch = e.filt(v, "bandpass", 3200, 2.0), cg = e.gain(v, 0);
    perc(cg.gain, t + 0.019, 0.001, 0.22, 0.01); cs.connect(ch); ch.connect(cg); cg.connect(v.input);   // the second tick 19 ms later: the «c-lac» double
    end = Math.max(end, e.tine(v, v.input, mtof(65), t + 0.004, { amp: 0.2, dec: 0.11, index: 0.8, ratio: 3.2, tine: 0, lp: 4200 }));   // a brief metallic ring (F4), damped — character, in palette
    return Math.max(end, t + 0.05);
  };
  EV.bootDone = function (e, v, t, o) {                // ~3070 ms (armStart 1820 + LX.T 1250) · the arrival: a soft low F, barely there. In reduced-motion (no arming) this is the end of the plain fade (the closing voice, bookend to bootPortal)
    var end = e.pad(v, v.input, mtof(53), t, 0.06, 0.12, 0.2, 0.18, "triangle", 5);          // F3
    end = Math.max(end, e.tine(v, v.input, mtof(65), t, { amp: 0.14, dec: 0.3, index: 0.7, tine: 0, lp: 2400 }));            // F4 whisper
    return end;
  };
  EV.bootSkip = function (e, v, t, o) {                // on skip · a short DRY whoosh cutting the seam to the corridor (the ringing boot voices are stolen in E.play)
    var dur = 0.14;
    var s = e.noise(v, t, t + dur + 0.02, 0.33), lp = e.filt(v, "lowpass", 4000, 0.9), g = e.gain(v, 0);
    lp.frequency.setValueAtTime(4000, t); lp.frequency.exponentialRampToValueAtTime(500, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.45, t + 0.015); g.gain.linearRampToValueAtTime(0, t + dur + 0.01);
    s.connect(lp); lp.connect(g); g.connect(v.input);
    var cs = e.noise(v, t, t + 0.02, 0.1), ch = e.filt(v, "bandpass", 1600, 1.5), cg = e.gain(v, 0);
    perc(cg.gain, t, 0.001, 0.25, 0.012); cs.connect(ch); ch.connect(cg); cg.connect(v.input);   // a tiny click at the cut
    return t + dur + 0.03;
  };

  /* ---------- voices ---------- */
  E.prune = function (t) {
    var keep = [], i;
    for (i = 0; i < this.voices.length; i++) { if (this.voices[i].end + 0.02 > t) keep.push(this.voices[i]); else this.release(this.voices[i]); }
    this.voices = keep;
  };
  E.release = function (v) {
    if (v.freed) return; v.freed = true;
    for (var i = 0; i < v.nodes.length; i++) { try { v.nodes[i].disconnect(); } catch (e) {} }
    this.live -= v.nodes.length; v.nodes = []; v.srcs = [];
  };
  E.steal = function (v, t) {
    var g = v.out.gain, lvl = v.level, i;
    g.setValueAtTime(lvl, t); g.linearRampToValueAtTime(0, t + STEAL);
    for (i = 0; i < v.srcs.length; i++) { try { v.srcs[i].stop(t + STEAL + 0.005); } catch (e) {} }
    v.end = Math.min(v.end, t + STEAL + 0.01); v.stolen = true; this.steals++;   // stolen = no longer counts as a voice
  };
  E.alive = function (t, ev) {
    var n = 0, i;
    for (i = 0; i < this.voices.length; i++) { var v = this.voices[i]; if (v.end > t && !v.stolen && (!ev || v.ev === ev)) n++; }
    return n;
  };
  E.oldest = function (t, ev) {
    var best = null, i;
    for (i = 0; i < this.voices.length; i++) { var v = this.voices[i]; if (v.end > t && !v.stolen && (!ev || v.ev === ev) && (!best || v.t0 < best.t0)) best = v; }
    return best;
  };

  /* schedule one event at context time t; returns the voice or null */
  E.play = function (ev, o, t) {
    var fn = EV[ev]; if (!fn) return null;
    o = o || {};
    if (!this.offline) this.prune(t);                  // offline (render): t is in the future; pruning there disconnected the earlier events before rendering
    if (ev === "nav") {
      if (this.lastNav >= 0 && t - this.lastNav < NAV_GAP) { this.drops++; return null; }
      this.lastNav = t;
      var guard = 0;                                   // bounded: never more than MAX_ALL steals per play
      while (this.alive(t, "nav") >= MAX_NAV && guard++ < MAX_ALL) this.steal(this.oldest(t, "nav"), t);
    }
    if (ev === "saverIn" && this.alive(t, "saverIn")) { this.drops++; return null; }
    if (ev === "bootSkip") {                           // the intro was cut: kill any boot voice still ringing so the skip leaves no tail hanging into the corridor
      for (var bk = 0; bk < this.voices.length; bk++) {
        var bv = this.voices[bk];
        if (bv.end > t && !bv.stolen && bv.ev !== "bootSkip" && bv.ev.indexOf("boot") === 0) this.steal(bv, t);
      }
    }
    var g2 = 0;
    while (this.alive(t) >= MAX_ALL && g2++ < MAX_ALL) this.steal(this.oldest(t), t);
    var wet = WET[ev] || 0, bus = this.ensureBus(wet > 0);
    var inten = typeof o.intensity === "number" ? clamp(o.intensity, 0, 1) : 1;
    var v = { ev: ev, t0: t, end: t, nodes: [], srcs: [], freed: false };
    v.level = db(TRIM[ev] || 0) * (0.35 + 0.65 * inten);
    v.out = this.gain(v, v.level); v.out.connect(bus.master);
    v.input = this.gain(v, 1); v.input.connect(v.out);
    if (wet > 0) { var s = this.gain(v, wet); v.out.connect(s); s.connect(bus.conv); }     // post-level send: trim, intensity and steal reach the room too
    var end = fn(this, v, t, o);
    v.end = Math.max(v.end, end);
    this.voices.push(v);
    if (v.end > this.lastEnd) this.lastEnd = v.end;
    var n = this.alive(t); if (n > this.maxVoices) this.maxVoices = n;
    var nn = this.alive(t, "nav"); if (nn > this.maxNav) this.maxNav = nn;
    return v;
  };

  /* ======================================================================================================
     LIVE: one context, born only inside a real gesture (keydown/pointerdown/touchend/click)
     ====================================================================================================== */
  var ctx = null, eng = null, muted = read("p8e.sound.mute") === "1", vol = volFromStore();
  var gestureEvents = ["keydown", "pointerdown", "mousedown", "touchend", "click"];
  var idleTimer = 0, relTimers = 0, failed = false;

  function onGesture() { unlock(); }
  function listen(on) {
    for (var i = 0; i < gestureEvents.length; i++) {
      // M47 does not understand the options object ({once}): plain capture flag and manual removal
      if (on) W.addEventListener(gestureEvents[i], onGesture, true); else W.removeEventListener(gestureEvents[i], onGesture, true);
    }
  }

  function unlock() {
    if (failed || !AC) return false;
    if (muted && !ctx) return false;                     // muted: no context at all (0 nodes); the next gesture after unmuting creates it
    try {
      if (!ctx) {
        ctx = new AC(); eng = new Engine(ctx, false, vol);
        if (!reduced()) {                                // reduced: only `error` can sound; no warm-up node (Chromium does not need it)
          var b = ctx.createBuffer(1, 1, ctx.sampleRate), s = ctx.createBufferSource();   // 1-sample silent warm-up (Safari)
          s.buffer = b; s.connect(ctx.destination); s.start(0);
          s.onended = function () { try { s.disconnect(); } catch (e) {} };
        }
        setTimeout(function () { try { bufs(ctx); } catch (e) {} }, 1200);           // noise + room built off the key
        armIdle();                                       // nothing plays → the context is suspended after IDLE_MS anyway
      }
      // keep listening until the context really runs (a blocked resume is retried on the next gesture)
      if (ctx.state === "running") listen(false);
      else if (ctx.resume) {
        var p = ctx.resume();
        if (p && p.then) p.then(function () { if (ctx && ctx.state === "running") listen(false); }, function () {});
      }
      return true;
    } catch (e) { failed = true; ctx = null; eng = null; return false; }
  }

  function armIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function idle() {
      if (!eng) return;
      var now = ctx.currentTime;
      eng.prune(now);
      if (eng.voices.length || now < eng.lastEnd + IR_SEC) { idleTimer = setTimeout(idle, 1000); return; }
      eng.dropBus();
      if (ctx.state === "running" && ctx.suspend) { var p = ctx.suspend(); if (p && p["catch"]) p["catch"](function () {}); }
    }, IDLE_MS);
  }
  function armRelease(v) {
    var ms = Math.max(0, (v.end - ctx.currentTime) * 1000) + 60;
    relTimers++;
    setTimeout(function () { relTimers--; if (eng) eng.prune(ctx.currentTime); }, ms);
  }

  function play(ev, opts) {
    if (muted || !AC || failed) return false;
    if (EVENTS.indexOf(ev) < 0) return false;
    if (!REDUCE_OK[ev] && reduced()) return false;
    if (W.document && W.document.hidden) return false;  // hidden (another app on screen, Home): nothing can be heard → 0 nodes
    if (!ctx || !eng) return false;                     // no gesture yet: silence (never create the context here)
    try {
      if (ctx.state !== "running" && ctx.resume) { var p = ctx.resume(); if (p && p["catch"]) p["catch"](function () {}); }
      var v = eng.play(ev, opts, ctx.currentTime + 0.006);
      if (!v) return false;
      armRelease(v); armIdle();
      return true;
    } catch (e) { return false; }                       // a failed sound is silence, never an exception
  }

  function setVolume(x) {
    vol = clamp(+x || 0, 0, 1); store("p8e.sound.vol", String(Math.round(vol * 100) / 100));
    if (eng) { eng.vol = vol; if (eng.bus) { var g = eng.bus.master.gain, t = ctx.currentTime; g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(volGain(vol), t + 0.05); } }
    return vol;
  }
  function mute(on) {
    muted = !!on; store("p8e.sound.mute", muted ? "1" : null);
    if (muted && eng) {
      var t = ctx.currentTime, i;
      for (i = 0; i < eng.voices.length; i++) if (eng.voices[i].end > t && !eng.voices[i].stolen) eng.steal(eng.voices[i], t);
      armIdle();
    }
    return muted;
  }

  function stats() {
    var t = ctx ? ctx.currentTime : 0;
    return { ctx: ctx ? ctx.state : "none", sampleRate: ctx ? ctx.sampleRate : 0, muted: muted, vol: vol, reduce: reduced(),
      voices: eng ? eng.alive(t) : 0, navVoices: eng ? eng.alive(t, "nav") : 0, live: eng ? eng.live : 0, created: eng ? eng.created : 0,
      bus: !!(eng && eng.bus), maxVoices: eng ? eng.maxVoices : 0, steals: eng ? eng.steals : 0, drops: eng ? eng.drops : 0 };
  }

  /* ======================================================================================================
     OFFLINE RENDER (preview page and tests): seq = "ev" | [{ev, at (ms), opts}], o = {vol, sampleRate, tail (s)}
     Returns a Promise of { buffer, maxVoices, maxNav, created, steals, drops, ends }.
     ====================================================================================================== */
  function render(seq, o) {
    o = o || {};
    if (typeof seq === "string") seq = [{ ev: seq, at: 0, opts: o.opts || {} }];
    var sr = o.sampleRate || 48000, v = typeof o.vol === "number" ? o.vol : vol;
    var est = 0, i;
    for (i = 0; i < seq.length; i++) est = Math.max(est, (seq[i].at || 0) / 1000 + (seq[i].ev === "saverIn" ? 9 : 3.2));
    var len = Math.ceil(sr * (est + (o.tail || IR_SEC + 0.3)));
    var octx = new OAC(2, len, sr), e = new Engine(octx, true, v), ends = [];
    for (i = 0; i < seq.length; i++) { var x = e.play(seq[i].ev, seq[i].opts || {}, 0.02 + (seq[i].at || 0) / 1000); ends.push(x ? x.end - 0.02 - (seq[i].at || 0) / 1000 : null); }
    var info = { maxVoices: e.maxVoices, maxNav: e.maxNav, created: e.created, steals: e.steals, drops: e.drops, ends: ends };
    return new Promise(function (res, rej) {
      octx.oncomplete = function (ev) { info.buffer = ev.renderedBuffer; res(info); };
      var p = octx.startRendering();
      if (p && p.then) p.then(function (b) { info.buffer = b; res(info); }, rej);
    });
  }

  if (AC) listen(true);
  if (W.document && W.document.addEventListener) {
    W.document.addEventListener("visibilitychange", function () {
      if (!W.document.hidden || !ctx || !eng) return;           // hidden (another app on screen): nothing can be heard
      for (var i = 0; i < eng.voices.length; i++) eng.release(eng.voices[i]);
      eng.voices = []; eng.dropBus(); eng.lastEnd = 0; clearTimeout(idleTimer);
      if (ctx.state === "running" && ctx.suspend) { var p = ctx.suspend(); if (p && p["catch"]) p["catch"](function () {}); }
    }, false);
  }

  W.P8ESound = {
    play: play, setVolume: setVolume, mute: mute, isMuted: function () { return muted; }, unlock: unlock,
    getVolume: function () { return vol; }, stats: stats, render: render, events: EVENTS.slice(0),
    _idle: function (ms) { IDLE_MS = Math.max(200, +ms || IDLE_MS); return IDLE_MS; }   // test hook
  };
})(window);
