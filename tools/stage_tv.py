#!/usr/bin/python3 -I
# SPDX-FileCopyrightText: 2026 Sergio Ayala
# SPDX-License-Identifier: GPL-3.0-or-later
"""stage_tv.py <destino> [--no-sello]

Construye una copia MINIMA y LIMPIA del launcher P8e por LISTA BLANCA, para
servirla en la LAN (prueba H3) y empaquetarla como .wgt (H4).
Conserva las rutas relativas (P8e/index.html sigue viendo ../).
Solo LEE del origen; nunca escribe ni borra en el.

Decision de entrada: la RAIZ de la copia lleva un index.html que redirige a
P8e/index.html, para servirla por HTTP (http://ip:puerto/). En el .wgt,
config.xml arranca directo en <content src="P8e/index.html"/>: la CSP
(script-src 'self') bloquearia el script en linea de esa raiz.

Enlaces simbolicos: no se siguen. Un fichero que sea un enlace, o cuya ruta
real quede fuera del origen, no entra por los GLOBS; si esta en FIXED, para.

v14: copia tambien P8e/tizen-adapter.js y P8e/diag.js, y en la COPIA de
P8e/index.html descomenta <script src="$WEBAPIS/webapis/webapis.js"> (el WRT de Tizen sustituye
$WEBAPIS; en localhost daria un 404, por eso el origen lo lleva comentado). La transformacion exige
encontrar el bloque exactamente una vez y comprueba el resultado; si no, para sin escribir nada.
Ojo: por HTTP en la LAN (H3) esa linea da un 404 inocuo (no hay $WEBAPIS); en el .wgt es la buena.

v16.11: build reproducible.
 - MANIFEST.txt lleva una seccion "# source": sha256 de cada fichero de la FUENTE y de que ruta sale.
 - stage_tv.py --verify <wgt>: regenera la copia desde la fuente de hoy y la compara byte a byte con el .wgt
   (ignora author-signature.xml y signature1.xml, que anade `tizen package`). Sale 0 si coinciden; si no, 1 y la lista.
   Usa launcher/config.xml y launcher/icon.png salvo --config/--icon; --no-sello si el .wgt se hizo asi.
 - Poda: fonts/Rubik-latin-var.woff2 (solo la nombraba un comentario) no entra. check_fonts() para el staging si el CSS
   referencia una fuente que no se copia, o si se copia una fuente que ningun CSS referencia.
"""
import argparse, difflib, hashlib, os, re, shutil, sys, tempfile, zipfile

HERE = os.path.dirname(os.path.realpath(__file__))
SRC = os.path.join(os.path.dirname(HERE), "retro-bauhaus")

SELLO = "assets/brand/privado/sello-px-104.png"   # v13: la autoría pixel art lee esta traducción 1:1 de WD
FIXED = [
    "P8e/index.html", "P8e/p8e.js", "P8e/p8e.css", "P8e/weather.js",
    "P8e/gl.js", "P8e/sound.js", "logos.js",
    "P8e/pyp.js",                              # v16.9: pico y placa de Bogota (regla local + contraste con bogota.gov.co)
    "P8e/rates.js",                            # v16.10: TRM dolar (datos.gov.co) y TRM euro (TRM x BCE) en COP
    "P8e/tizen-adapter.js", "P8e/diag.js",     # v14: adaptador Tizen y panel de diagnostico   # sound.js: aprobado por el autor            # v12: gl.js en lugar de three.min.js (P8e ya no lo carga)
    "assets/icons/monalisa-v2.svg", "assets/brand/qr-portfolio.svg",
]
# v16.11: fuentes de la fuente que NO entran en el paquete (nadie las referencia fuera de un comentario)
FONT_PRUNE = {"fonts/Rubik-latin-var.woff2"}
FONT_EXTS = (".woff2", ".woff", ".ttf", ".otf")
FONT_CSS_SOURCES = ["P8e/p8e.css", "P8e/index.html"]   # donde el paquete puede declarar @font-face
UNSIGNED_EXCLUDE = {"author-signature.xml", "signature1.xml"}
GLOBS = [("P8e/data", ".json", False), ("fonts", FONT_EXTS + (".txt",), False), ("assets/art", ".jpg", False)]   # fonts: solo fuentes y sus licencias

ROOT_INDEX = """<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Launcher</title>
<meta http-equiv="refresh" content="0; url=P8e/index.html">
<style>html,body{margin:0;background:#000}</style>
</head><body>
<script>location.replace("P8e/index.html");</script>
</body></html>
"""

WEBAPIS_TAG = '<script src="$WEBAPIS/webapis/webapis.js"></script>'
# el bloque del origen: un comentario HTML que termina con la etiqueta y "-->" en la linea siguiente
WEBAPIS_RE = re.compile(r'(<!--(?:(?!-->).)*?)\n' + re.escape(WEBAPIS_TAG) + r'\n-->', re.S)

def webapis_on(html):
    """Devuelve el index.html con webapis.js ACTIVO. Para (SystemExit) si no encuentra el bloque una sola vez."""
    found = WEBAPIS_RE.findall(html)
    if len(found) != 1:
        sys.exit("ERROR: bloque comentado de webapis.js en P8e/index.html encontrado %d veces (se esperaba 1)" % len(found))
    out = WEBAPIS_RE.sub(lambda m: m.group(1) + "\n     (stage_tv.py v14: descomentado en esta copia) -->\n" + WEBAPIS_TAG, html)
    live = re.sub(r"<!--.*?-->", "", out, flags=re.S)
    if live.count(WEBAPIS_TAG) != 1 or out.count("<!--") != out.count("-->"):
        sys.exit("ERROR: la transformacion de webapis.js no dejo exactamente una etiqueta activa")
    if live.find(WEBAPIS_TAG) > live.find('<script src="p8e.js">'):
        sys.exit("ERROR: webapis.js quedaria despues de p8e.js")
    return out

def junk(name):
    return name.startswith("._") or name == ".DS_Store"

def inside_src(p):
    """True si p no es un enlace simbolico y su ruta real queda dentro de SRC."""
    real_src = os.path.realpath(SRC)
    return not os.path.islink(p) and os.path.realpath(p).startswith(real_src + os.sep)

def listing(rel, ext):
    d = os.path.join(SRC, rel)
    out = []
    for n in sorted(os.listdir(d)):
        p = os.path.join(d, n)
        if junk(n) or os.path.islink(p) or not os.path.isfile(p) or not inside_src(p):
            continue
        if ext and not n.lower().endswith(ext):
            continue
        out.append(rel + "/" + n)
    return out

def css_font_urls(text, base_rel):
    """Rutas (relativas a SRC) de las fuentes que referencia un CSS/HTML con url(...). Los comentarios /* */ no cuentan."""
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    out = set()
    for m in re.finditer(r"""url\(\s*["']?([^)"'\s]+)""", text):
        u = m.group(1).split("?")[0].split("#")[0]
        if u.startswith(("data:", "http:", "https:", "//")):
            continue
        rel = os.path.normpath(os.path.join(os.path.dirname(base_rel), u)).replace(os.sep, "/")
        if rel.startswith("fonts/") and rel.lower().endswith(FONT_EXTS):
            out.add(rel)
    return out

def check_fonts(files, referenced):
    """Para (SystemExit) si el CSS referencia una fuente que no se copia, o si se copia una fuente que nada referencia."""
    copied = {f for f in files if f.startswith("fonts/") and f.lower().endswith(FONT_EXTS)}
    lacking = sorted(referenced - copied)
    if lacking:
        sys.exit("ERROR: el CSS referencia fuentes que NO entran en el paquete: " + ", ".join(lacking))
    unused = sorted(copied - referenced)
    if unused:
        sys.exit("ERROR: fuentes copiadas que ningun CSS referencia (podalas con FONT_PRUNE): " + ", ".join(unused))

def sha(path):
    with open(path, "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()

def src_label(path):
    """Ruta de origen estable (relativa al repo si esta dentro; si no, solo el nombre): el manifiesto no depende de donde se ejecute."""
    repo = os.path.dirname(os.path.realpath(SRC))
    rp = os.path.realpath(path)
    if rp.startswith(repo + os.sep):
        return os.path.relpath(rp, repo).replace(os.sep, "/")
    return "(externo)/" + os.path.basename(rp)

def stage(dest, no_sello=False, config=None, icon=None, quiet=False):
    """Construye la copia en dest. Toda la logica de staging; main() y --verify la comparten."""
    class a:  # los nombres del cuerpo previo
        pass
    a.dest, a.no_sello, a.config, a.icon = dest, no_sello, config, icon
    dest = os.path.realpath(os.path.expanduser(a.dest))
    if os.path.realpath(SRC).startswith(dest + os.sep) or dest == os.path.realpath(SRC):
        sys.exit("ERROR: destino contiene/es el origen")
    if os.path.exists(dest) and (not os.path.isdir(dest) or os.listdir(dest)):
        sys.exit("ERROR: el destino ya existe con contenido: " + dest)

    files = list(FIXED)
    for rel, ext, _ in GLOBS:
        files += [f for f in listing(rel, ext) if f not in FONT_PRUNE]
    sello_ok = False
    if not a.no_sello:
        if os.path.isfile(os.path.join(SRC, SELLO)):
            files.append(SELLO); sello_ok = True
        else:
            print("AVISO: no existe " + SELLO + "; sigo sin sello (el launcher degrada).", file=sys.stderr)

    # seguridad extra: nada prohibido en la lista
    for f in files:
        low = f.lower()
        if ("sello-original" in low or "capturas" in low or low.endswith((".mjs", ".md"))
                or "readme" in low or junk(os.path.basename(f))
                or (f.startswith("assets/brand/privado/") and f != SELLO)):
            sys.exit("ERROR interno: fichero prohibido en la lista: " + f)
    missing = [f for f in files if not os.path.isfile(os.path.join(SRC, f))]
    if missing:
        sys.exit("ERROR: faltan en el origen: " + ", ".join(missing))
    linked = [f for f in files if not inside_src(os.path.join(SRC, f))]
    if linked:
        sys.exit("ERROR: enlace simbolico o ruta fuera del origen: " + ", ".join(linked))

    # v16.11: guarda de fuentes, ANTES de escribir nada
    refs = set()
    for c in FONT_CSS_SOURCES:
        with open(os.path.join(SRC, c), encoding="utf-8") as fh:
            refs |= css_font_urls(fh.read(), c)
    check_fonts(files, refs)

    # v14: la copia del index.html, transformada ANTES de escribir nada (si falla, no queda una copia a medias)
    idx_html = webapis_on(open(os.path.join(SRC, "P8e/index.html"), encoding="utf-8").read())

    os.makedirs(dest, exist_ok=True)
    rows = []
    srcmap = {}
    for f in files:
        t = os.path.join(dest, f)
        os.makedirs(os.path.dirname(t), exist_ok=True)
        if f == "P8e/index.html":
            with open(t, "w", encoding="utf-8") as fh:
                fh.write(idx_html)
        else:
            shutil.copyfile(os.path.join(SRC, f), t, follow_symlinks=False)  # contenido solo, sin xattrs
        rows.append(f)
        srcmap[f] = os.path.join(SRC, f)
    with open(os.path.join(dest, "index.html"), "w", encoding="utf-8") as fh:
        fh.write(ROOT_INDEX)
    rows.append("index.html")
    srcmap["index.html"] = None   # generado por este script

    # v16.10 (revisión de seguridad MAJOR-2): el manifest entraba al .wgt a mano; ahora se copia aqui y se COMPRUEBA que sus
    # <access> son solo https, sin subdominios, y que connect-src lleva exactamente esos mismos origenes.
    if a.config:
        cfgpath = os.path.realpath(os.path.expanduser(a.config))
        if not os.path.isfile(cfgpath):
            sys.exit("ERROR: no existe el config.xml: " + cfgpath)
        cfg = open(cfgpath, encoding="utf-8").read()
        cfg = re.sub(r"<!--.*?-->", "", cfg, flags=re.S)   # los comentarios no cuentan: el primer «connect-src» podia estar en uno
        origins = re.findall(r'<access\s+origin="(https://[^"]+)"', cfg)
        if len(origins) != 4 or len(set(origins)) != 4:
            sys.exit("ERROR: config.xml debe declarar 4 <access> https distintos (hay %d): %s" % (len(origins), origins))
        if 'subdomains="true"' in cfg:
            sys.exit("ERROR: config.xml con subdomains=\"true\" (se exige false)")
        mcs = re.search(r"connect-src ([^;]+);", cfg)
        if not mcs:
            sys.exit("ERROR: config.xml sin connect-src")
        for o in origins:
            if o not in mcs.group(1):
                sys.exit("ERROR: connect-src no incluye " + o)
        shutil.copyfile(cfgpath, os.path.join(dest, "config.xml"))
        rows.append("config.xml")
        srcmap["config.xml"] = cfgpath
    if a.icon:
        iconpath = os.path.realpath(os.path.expanduser(a.icon))
        if not os.path.isfile(iconpath):
            sys.exit("ERROR: no existe el icono: " + iconpath)
        shutil.copyfile(iconpath, os.path.join(dest, "icon.png"))
        rows.append("icon.png")
        srcmap["icon.png"] = iconpath

    # limpieza SOLO en la copia
    for r, ds, fs in os.walk(dest):
        for n in fs:
            if junk(n):
                os.remove(os.path.join(r, n))

    lines = []
    for f in sorted(rows):
        p = os.path.join(dest, f)
        h = hashlib.sha256(open(p, "rb").read()).hexdigest()
        lines.append("%s  %9d  %s" % (h, os.path.getsize(p), f))
    src_lines = []
    for f in sorted(srcmap):
        if srcmap[f] is None:
            src_lines.append("%s  %9s  %s  <-  (generado por stage_tv.py)" % ("-" * 64, "-", f))
        else:
            p = srcmap[f]
            src_lines.append("%s  %9d  %s  <-  %s" % (sha(p), os.path.getsize(p), f, src_label(p)))
    with open(os.path.join(dest, "MANIFEST.txt"), "w", encoding="utf-8") as fh:
        fh.write("# sha256  bytes  ruta  (sello: %s)\n" % ("incluido" if sello_ok else "NO incluido"))
        fh.write("\n".join(lines) + "\n")
        fh.write("# source  (sha256 de la FUENTE  bytes  ruta-en-paquete  <-  ruta-en-la-fuente; el index.html del paquete va transformado)\n")
        fh.write("\n".join(src_lines) + "\n")
    if not quiet:
        print("OK: %d ficheros en %s (sello: %s; webapis.js activo en P8e/index.html)" % (len(rows), dest, "si" if sello_ok else "no"))

def verify(wgt, no_sello=False, config=None, icon=None):
    """Compara el .wgt (sin firmas) con lo que se generaria hoy desde la fuente. Devuelve 0 si coincide, 1 si no."""
    wgt = os.path.realpath(os.path.expanduser(wgt))
    if not zipfile.is_zipfile(wgt):
        print("ERROR: no es un zip/.wgt: " + wgt, file=sys.stderr)
        return 2
    repo = os.path.dirname(os.path.realpath(SRC))
    config = config or os.path.join(repo, "launcher", "config.xml")
    icon = icon or os.path.join(repo, "launcher", "icon.png")
    tmp = tempfile.mkdtemp(prefix="stage_verify_")
    try:
        exp_dir = os.path.join(tmp, "expected")
        stage(exp_dir, no_sello=no_sello, config=config, icon=icon, quiet=True)
        expected = {}
        for r, _, fs in os.walk(exp_dir):
            for n in fs:
                p = os.path.join(r, n)
                with open(p, "rb") as fh:
                    expected[os.path.relpath(p, exp_dir).replace(os.sep, "/")] = fh.read()
        actual = {}
        with zipfile.ZipFile(wgt) as z:
            for i in z.infolist():
                if i.filename.endswith("/") or i.filename in UNSIGNED_EXCLUDE:
                    continue
                actual[i.filename] = z.read(i)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    diffs = []
    for n in sorted(set(expected) | set(actual)):
        if n not in actual:
            diffs.append("FALTA en el .wgt (la fuente la genera): " + n)
        elif n not in expected:
            diffs.append("SOBRA en el .wgt (la fuente no la genera): " + n)
        elif expected[n] != actual[n]:
            msg = "DISTINTO: %s  (.wgt %d B sha256 %s..  fuente %d B sha256 %s..)" % (
                n, len(actual[n]), hashlib.sha256(actual[n]).hexdigest()[:12],
                len(expected[n]), hashlib.sha256(expected[n]).hexdigest()[:12])
            try:
                a_l = actual[n].decode("utf-8").splitlines()
                e_l = expected[n].decode("utf-8").splitlines()
                nd = sum(1 for l in difflib.unified_diff(a_l, e_l, lineterm="", n=0) if l[:1] in "+-" and l[:3] not in ("+++", "---"))
                msg += "  [%d lineas +/- en el diff]" % nd
            except UnicodeDecodeError:
                pass
            diffs.append(msg)
    if diffs:
        print("VERIFY FALLA: %d diferencias entre %s y la fuente de hoy" % (len(diffs), wgt))
        for d in diffs:
            print("  " + d)
        return 1
    print("VERIFY OK: %s coincide byte a byte con la fuente (%d ficheros; sin %s)" % (wgt, len(expected), ", ".join(sorted(UNSIGNED_EXCLUDE))))
    return 0

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("dest", nargs="?", help="carpeta destino (vacia o inexistente); con --verify no se usa")
    ap.add_argument("--no-sello", action="store_true", help="no copia el sello (para un .wgt compartible)")
    ap.add_argument("--config", help="config.xml a copiar y VALIDAR (4 <access> https y connect-src con esos origenes)")
    ap.add_argument("--icon", help="icon.png a copiar a la raiz del .wgt")
    ap.add_argument("--verify", metavar="WGT", help="compara el .wgt con lo que se generaria hoy desde la fuente; 0 si coincide")
    a = ap.parse_args()
    if a.verify:
        sys.exit(verify(a.verify, a.no_sello, a.config, a.icon))
    if not a.dest:
        ap.error("falta <destino> (o usa --verify <wgt>)")
    stage(a.dest, a.no_sello, a.config, a.icon)

if __name__ == "__main__":
    main()
