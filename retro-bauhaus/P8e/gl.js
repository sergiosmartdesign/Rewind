/* SPDX-FileCopyrightText: 2026 Sergio Ayala
 * SPDX-License-Identifier: GPL-3.0-or-later */
/* P8e · gl.js — WebGL1 a mano, ES5 estricto (v12, 2026-10-23)
   Autor de lo publicable: Sergio Ayala <mail@sergio-ayala.com>.

   POR QUÉ: three.js r128 no se analiza en el motor web del TV 2017 (Chromium M47: 2.778 construcciones posteriores a
   ES5) y en el launcher sólo hacía dos cosas: el DISPERSAL (puntos con un shader) y el PORTAL (un quad a pantalla
   completa con un shader). Esto es lo mínimo para esas dos cosas, sin librería. Las fuentes de los shaders, los datos
   y las imágenes los pone p8e.js; este módulo no pide nada a la red.

   LO QUE IMITA DE three r128 (para que los fotogramas salgan iguales; leído en assets/vendor/threejs-r128/three.min.js):
   · Contexto: alpha, premultipliedAlpha, sin antialias, sin preserveDrawingBuffer. SIEMPRE WebGL1 ("webgl" y, si no,
     "experimental-webgl"; nunca "webgl2": three cogía webgl2 en Chrome, pero los dos programas son GLSL ES 1.0 y el
     resultado es el mismo; medido en el README, v12). Sin depth ni stencil: ningún programa los usa (three los
     reservaba igual; aquí no se gasta esa memoria).
   · Precisión: la MISMA en los dos shaders, highp si el motor la da en vértice Y fragmento, si no mediump (three r128,
     getMaxPrecision). Fusión «normal» sin premultiplicar = blendFuncSeparate(SRC_ALPHA, ONE_MINUS_SRC_ALPHA, ONE,
     ONE_MINUS_SRC_ALPHA). Texturas: flipY, sin premultiplicar, alineación 4, SIN conversión de espacio de color
     (pixelStorei 37443 = 0, como three), LINEAR/LINEAR, CLAMP_TO_EDGE, sin mipmaps; RGB para JPEG (TextureLoader).
     No hace falta potencia de dos (CLAMP + LINEAR); si una imagen supera MAX_TEXTURE_SIZE se reduce en un canvas.
   · clear() = color (0,0,0,0), como setClearColor(0x000000,0) + autoClear.

   ROBUSTEZ
   · program(): compila con log (COMPILE_STATUS / LINK_STATUS); el error queda en errors[] y devuelve null (quien llama
     degrada: corte entre obras, despiece sin portal). defines = sólo enteros (|0): la URL nunca llega al GLSL sin acotar.
   · texture(): cualquier excepción (p. ej. SecurityError) → null. delTexture() borra de verdad (deleteTexture) y cuenta.
   · Pérdida de contexto: se previene el comportamiento por defecto (para poder restaurarlo), lost=true y onLost();
     al restaurarse, gen++ y onRestore(): quien usa el módulo vuelve a crear programas, buffers y texturas. Un objeto de
     una generación anterior nunca se borra contra el contexto nuevo. No se usa WEBGL_lose_context (lección aprendida:
     deja Chrome a 30 fps).
   · Estado de atributos: draw() activa sólo los del programa en uso y apaga los que quedaron de otro.
   · stats: texturas creadas/borradas/vivas/máximo, programas, dibujos, pérdidas.

   v16 (2026-10-25) · texture(img, rgb, keepCs): con keepCs la subida usa la conversión de espacio de
   color POR DEFECTO del navegador. Con NONE (lo de three), Blink M47 vuelve a decodificar el JPEG desde sus bytes en el hilo
   principal en cada texImage2D (ImageExtractor, «ignoreGammaAndColorProfile»), aparte del decode que ya hizo para pintarlo.
   Los JPEG del arte no llevan perfil ICC ni EXIF (sólo JFIF: comprobado segmento a segmento), así que los píxeles subidos son
   los mismos; p8e.js lo pide salvo ?texcs=none. */
(function(){
"use strict";

var ATTR={alpha:true,antialias:false,depth:false,stencil:false,premultipliedAlpha:true,preserveDrawingBuffer:false,
  powerPreference:"high-performance",failIfMajorPerformanceCaveat:false};

function Ctx(canvas,gl,type){
  var self=this;
  this.canvas=canvas; this.gl=gl; this.type=type; this.lost=false; this.gen=0; this.errors=[]; this.programs=[];
  this.on={};            // atributos activos: localización → true
  this.cur=null;         // programa en uso
  this.stats={texCreated:0,texDeleted:0,texDropped:0,texLive:0,texMax:0,progs:0,draws:0,lostEvents:0,restored:0};
  this.onLost=null; this.onRestore=null;
  this.prec=this.precision();
  canvas.addEventListener("webglcontextlost",function(e){ e.preventDefault(); self.lost=true; self.stats.lostEvents++;
    self.programs=[]; self.on={}; self.cur=null; self.stats.texLive=0; if(self.onLost) self.onLost(); },false);
  canvas.addEventListener("webglcontextrestored",function(){ self.lost=false; self.gen++; self.stats.restored++;
    self.on={}; self.cur=null; self.prec=self.precision(); if(self.onRestore) self.onRestore(); },false);
}
/* three r128 (getMaxPrecision): highp sólo si vértice Y fragmento la dan; si no, mediump en los dos */
/* revisión de seguridad N2: el registro de errores no crece sin fin (un launcher encendido días) */
Ctx.prototype.err=function(m){ if(this.errors.length>=32) this.errors.shift(); this.errors.push(m); };
Ctx.prototype.precision=function(){ var gl=this.gl, v, f;
  try{ v=gl.getShaderPrecisionFormat(gl.VERTEX_SHADER,gl.HIGH_FLOAT); f=gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT);
    return (v&&v.precision>0&&f&&f.precision>0)?"highp":"mediump"; }catch(e){ return "mediump"; } };
Ctx.prototype.shader=function(type,src,name){ var gl=this.gl, s=gl.createShader(type);
  if(!s) return null;
  gl.shaderSource(s,src); gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){
    if(!gl.isContextLost()) this.err(name+" ("+(type===gl.VERTEX_SHADER?"vs":"fs")+"): "+String(gl.getShaderInfoLog(s)||"no log").slice(0,800));
    gl.deleteShader(s); return null; }
  return s; };
/* defines: {NOMBRE: entero}. Devuelve {name, prog, u:{nombre:{loc,type}}, a:{nombre:loc}} o null */
Ctx.prototype.program=function(name,vs,fs,defines){ var gl=this.gl, pre="", k, p, v, f, i, n, info, ok, rec;
  if(this.lost) return null;
  if(defines) for(k in defines) if(Object.prototype.hasOwnProperty.call(defines,k)&&/^(?!GL_)(?!.*__)[A-Z][A-Z0-9_]*$/.test(k)) pre+="#define "+k+" "+(defines[k]|0)+"\n";
  var head="precision "+this.prec+" float;\nprecision "+this.prec+" int;\n"+pre;
  v=this.shader(gl.VERTEX_SHADER,head+vs,name); f=v?this.shader(gl.FRAGMENT_SHADER,head+fs,name):null;
  if(!v||!f){ if(v) gl.deleteShader(v); if(f) gl.deleteShader(f); return null; }
  p=gl.createProgram(); gl.attachShader(p,v); gl.attachShader(p,f); gl.linkProgram(p);
  ok=!!gl.getProgramParameter(p,gl.LINK_STATUS);
  /* los shaders ya enlazados no hacen falta: se sueltan (el programa sigue valiendo) */
  gl.detachShader(p,v); gl.detachShader(p,f); gl.deleteShader(v); gl.deleteShader(f);
  if(!ok){ if(!gl.isContextLost()) this.err(name+" (link): "+String(gl.getProgramInfoLog(p)||"").slice(0,800));
    gl.deleteProgram(p); return null; }
  rec={name:name,prog:p,gen:this.gen,u:{},a:{}};
  n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);
  for(i=0;i<n;i++){ info=gl.getActiveUniform(p,i); if(info) rec.u[info.name.replace(/\[0\]$/,"")]={loc:gl.getUniformLocation(p,info.name),type:info.type}; }
  n=gl.getProgramParameter(p,gl.ACTIVE_ATTRIBUTES);
  for(i=0;i<n;i++){ info=gl.getActiveAttrib(p,i); if(info) rec.a[info.name]=gl.getAttribLocation(p,info.name); }
  this.programs.push(rec); this.stats.progs++; return rec; };
Ctx.prototype.delProgram=function(rec){ if(!rec||!rec.prog) return; var i=this.programs.indexOf(rec); if(i>=0) this.programs.splice(i,1);
  if(!this.lost&&rec.gen===this.gen) this.gl.deleteProgram(rec.prog); if(this.cur===rec) this.cur=null; rec.prog=null; };
Ctx.prototype.buffer=function(data){ var gl=this.gl, b; if(this.lost) return null; b=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,b); gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW); gl.bindBuffer(gl.ARRAY_BUFFER,null);
  return {b:b,gen:this.gen}; };
Ctx.prototype.delBuffer=function(x){ if(x&&x.b&&!this.lost&&x.gen===this.gen) this.gl.deleteBuffer(x.b); if(x) x.b=null; };
/* tamaño del framebuffer = tamaño del canvas (asignar width/height lo realoja: sólo si cambia) + viewport */
Ctx.prototype.size=function(w,h){ var c=this.canvas; w=Math.max(1,w|0); h=Math.max(1,h|0);
  if(c.width!==w) c.width=w; if(c.height!==h) c.height=h; this.gl.viewport(0,0,w,h); };
Ctx.prototype.clear=function(){ var gl=this.gl; gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT); };
/* fusión NORMAL de three r128 para un material transparente sin premultiplicar (la del dispersal) */
Ctx.prototype.blendNormal=function(){ var gl=this.gl; gl.enable(gl.BLEND); gl.blendEquation(gl.FUNC_ADD);
  gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA); };
Ctx.prototype.blendOff=function(){ this.gl.disable(this.gl.BLEND); };
/* uniformes por tipo (los que usan los dos programas). Un número, un array o, para un sampler, una textura de texture() */
Ctx.prototype.uniforms=function(rec,vals){ var gl=this.gl, k, u, v, unit=0;
  for(k in vals){ if(!Object.prototype.hasOwnProperty.call(vals,k)) continue; u=rec.u[k]; if(!u) continue; v=vals[k];
    switch(u.type){
      case gl.FLOAT: gl.uniform1f(u.loc,v); break;
      case gl.FLOAT_VEC2: gl.uniform2f(u.loc,v[0],v[1]); break;
      case gl.FLOAT_VEC3: gl.uniform3f(u.loc,v[0],v[1],v[2]); break;
      case gl.FLOAT_VEC4: gl.uniform4f(u.loc,v[0],v[1],v[2],v[3]); break;
      case gl.FLOAT_MAT4: gl.uniformMatrix4fv(u.loc,false,v); break;
      case gl.INT: case gl.BOOL: gl.uniform1i(u.loc,v|0); break;
      case gl.SAMPLER_2D: gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D,(v&&v.t&&v.gen===this.gen)?v.t:null);
        gl.uniform1i(u.loc,unit); unit++; break;
      default: break; } } };
/* un dibujo: programa, atributos {nombre:[buffer, componentes]}, uniformes, modo y nº de vértices */
Ctx.prototype.draw=function(rec,attrs,vals,mode,count){ var gl=this.gl, k, loc, want={}, x;
  if(this.lost||!rec||!rec.prog||rec.gen!==this.gen) return false;
  if(this.cur!==rec){ gl.useProgram(rec.prog); this.cur=rec; }
  for(k in attrs){ if(!Object.prototype.hasOwnProperty.call(attrs,k)) continue; loc=rec.a[k]; x=attrs[k];
    if(loc==null||loc<0||!x||!x[0]||!x[0].b||x[0].gen!==this.gen) continue;
    gl.bindBuffer(gl.ARRAY_BUFFER,x[0].b); gl.vertexAttribPointer(loc,x[1],gl.FLOAT,false,0,0);
    if(!this.on[loc]){ gl.enableVertexAttribArray(loc); this.on[loc]=true; } want[loc]=true; }
  for(k in this.on){ if(Object.prototype.hasOwnProperty.call(this.on,k)&&!want[k]){ gl.disableVertexAttribArray(+k); delete this.on[k]; } }
  gl.bindBuffer(gl.ARRAY_BUFFER,null);
  this.uniforms(rec,vals);
  gl.drawArrays(mode,0,count); this.stats.draws++; return true; };
Ctx.prototype.texture=function(img,rgb,keepCs,maxPx){ var gl=this.gl, t=null, src=img, w=img.naturalWidth||img.width, h=img.naturalHeight||img.height, mx, s, cv, fmt;
  if(!w||!h||this.lost) return null;
  try{
    mx=gl.getParameter(gl.MAX_TEXTURE_SIZE)||2048; if(maxPx>0&&maxPx<mx) mx=maxPx;   // v16.11 F6 (?texmax): tope propio, mismo reescalado
    if(w>mx||h>mx){ s=mx/Math.max(w,h); cv=document.createElement("canvas");
      cv.width=Math.max(1,Math.floor(w*s)); cv.height=Math.max(1,Math.floor(h*s));
      cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height); src=cv; w=cv.width; h=cv.height; }
    t=gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false); gl.pixelStorei(gl.UNPACK_ALIGNMENT,4);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,keepCs?gl.BROWSER_DEFAULT_WEBGL:gl.NONE);   // v16 (ver cabecera)
    fmt=rgb?gl.RGB:gl.RGBA;
    for(s=0;s<8&&gl.getError()!==gl.NO_ERROR;s++){}           // un error anterior (de otra llamada) no cuenta como de ésta
    gl.texImage2D(gl.TEXTURE_2D,0,fmt,fmt,gl.UNSIGNED_BYTE,src);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D,null);
    if(!t||gl.isContextLost()) return null;                      // revisión de seguridad N1: contexto caído antes del evento: nada que contar
    if(gl.getError()!==gl.NO_ERROR) throw new Error("texImage2D");
  }catch(e){ if(t) gl.deleteTexture(t); this.err("texture: "+String(e&&e.message||e).slice(0,300)); return null; }
  this.stats.texCreated++; this.stats.texLive++; if(this.stats.texLive>this.stats.texMax) this.stats.texMax=this.stats.texLive;
  return {t:t,w:w,h:h,gen:this.gen}; };
/* borrar = deleteTexture de verdad. Con el contexto perdido la textura ya no existe: sólo se suelta (no cuenta como borrada) */
Ctx.prototype.delTexture=function(x){ if(!x||!x.t) return; if(x.gen===this.gen&&!this.lost){ this.gl.deleteTexture(x.t); this.stats.texLive--; this.stats.texDeleted++; }
  else this.stats.texDropped++; x.t=null; };
Ctx.prototype.info=function(){ var gl=this.gl, r={type:this.type,lost:this.lost,precision:this.prec,buffer:[this.canvas.width,this.canvas.height],
    drawingBuffer:[gl.drawingBufferWidth,gl.drawingBufferHeight],programs:this.programs.length,errors:this.errors.slice(0,6),stats:this.stats};
  try{ r.version=gl.getParameter(gl.VERSION); r.sl=gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
    r.pointRange=[].slice.call(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)||[]); r.maxTex=gl.getParameter(gl.MAX_TEXTURE_SIZE); }catch(e){}
  return r; };

/* matrices como las de three r128 (column-major, Float32): OrthographicCamera.updateProjectionMatrix y la vista de una
   cámara en (0,0,z) sin rotar (matrixWorldInverse) */
function ortho(left,right,top,bottom,near,far){ var w=1/(right-left), h=1/(top-bottom), p=1/(far-near);
  return new Float32Array([2*w,0,0,0, 0,2*h,0,0, 0,0,-2*p,0, -(right+left)*w,-(top+bottom)*h,-(far+near)*p,1]); }
function viewZ(z){ return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,-z,1]); }

window.P8EGL={
  /* el ÚNICO contexto del lienzo del arte. null si el motor no da WebGL1 (quien llama corta entre obras, sin portal) */
  create:function(canvas){ var names=["webgl","experimental-webgl"], gl=null, i;
    for(i=0;i<names.length;i++){ try{ gl=canvas.getContext(names[i],ATTR); }catch(e){ gl=null; } if(gl) return new Ctx(canvas,gl,names[i]); }
    return null; },
  ortho:ortho, viewZ:viewZ, ATTR:ATTR
};
})();
