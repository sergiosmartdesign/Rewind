#!/usr/bin/env python3
"""Build MODDING.pdf (EN) and MODDING.es.pdf (ES) from modding.html / modding.es.html.

Offline and contained:
  * renders from a throwaway copy that holds only modding*.html, guia.css, fonts/ and img/, so a
    relative path in the HTML cannot reach any other file on the disk (symlinks are not copied);
  * local Chrome/Chromium in headless mode: muted, its own throwaway profile, no PDF header/footer
    (Chrome's default one prints the file's local path), every host name resolves to "not found"
    and all traffic goes to a dead proxy (127.0.0.1:9);
  * before rendering, every resource the HTML and the CSS load (src, href of <link>, url(), ...)
    must be a plain relative path to a file of that copy: no scheme (file:, http:), no absolute
    path, no "..". Frames, objects, scripts, forms, <base> and @import are refused. (Chrome's CSP
    'self' on a file:// page allows any file: URL, so this check is what keeps absolute paths out.)
  * the HTML also carries its own Content-Security-Policy: no frames, objects, scripts or network;
  * PDF dates in UTC, a hard timeout, and the whole process group killed at the end;
  * a PDF is only kept if its text (pdftotext, from poppler) is contained in the text of the HTML
    and the CSS (words split by a line-break hyphen tolerated). Otherwise the old PDF stays and
    the build fails.

    python3 build_pdf.py                     # both PDFs
    CHROME=/path/to/chrome python3 build_pdf.py
    python3 build_pdf.py --skip-text-check   # only if pdftotext is not installed (not recommended)
"""
import html, os, re, shutil, signal, subprocess, sys, tempfile, unicodedata
from urllib.parse import unquote

HERE = os.path.dirname(os.path.abspath(__file__))
JOBS = [("modding.html", "MODDING.pdf"), ("modding.es.html", "MODDING.es.pdf")]
COPY_FILES = ["modding.html", "modding.es.html", "guia.css"]
COPY_DIRS = ["fonts", "img"]
CANDIDATES = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "google-chrome", "chromium", "chromium-browser",
]
TIMEOUT_S = 90


def find_chrome():
    if os.environ.get("CHROME"):
        return os.environ["CHROME"]
    for c in CANDIDATES:
        p = c if os.path.isabs(c) else shutil.which(c)
        if p and os.path.exists(p):
            return p
    sys.exit("Chrome/Chromium not found; set CHROME=/path/to/chrome")


def find_pdftotext():
    for p in (shutil.which("pdftotext"), "/opt/homebrew/bin/pdftotext", "/usr/local/bin/pdftotext", "/usr/bin/pdftotext"):
        if p and os.path.isfile(p) and os.access(p, os.X_OK):
            return p
    return None


def copy_regular(src, dst):
    """Copy a regular file; refuse symlinks (they could point anywhere on the disk)."""
    if os.path.islink(src) or not os.path.isfile(src):
        sys.exit("refusing to copy (not a regular file): " + os.path.relpath(src, HERE))
    shutil.copyfile(src, dst)


def stage_sources(dest):
    for f in COPY_FILES:
        copy_regular(os.path.join(HERE, f), os.path.join(dest, f))
    for d in COPY_DIRS:
        src = os.path.join(HERE, d)
        if os.path.islink(src):
            sys.exit("refusing to copy a symlinked folder: " + d)
        os.makedirs(os.path.join(dest, d))
        for n in sorted(os.listdir(src)):
            p = os.path.join(src, n)
            if n.startswith(".") or os.path.isdir(p) and not os.path.islink(p):
                continue                                     # no hidden files, no sub-folders
            copy_regular(p, os.path.join(dest, d, n))


# ---------- resource check: only relative paths to files of the staged copy ----------
FORBIDDEN_TAGS = re.compile(r"<\s*(iframe|frame|frameset|object|embed|applet|portal|script|base|form|video|audio|source|track)\b", re.I)
REFRESH = re.compile(r"<meta[^>]+http-equiv\s*=\s*[\"']?refresh", re.I)
RES_ATTR = re.compile(r"<\s*(\w+)([^>]*)>", re.S)
ATTR = re.compile(r"""([\w:-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)""")
CSS_URL = re.compile(r"""url\(\s*("[^"]*"|'[^']*'|[^)]*)\s*\)""", re.I)


def bad_ref(stage, ref):
    ref = html.unescape(ref.strip().strip("\"'")).strip()
    if not ref or ref.startswith("#"):
        return None
    if re.match(r"^[a-z][a-z0-9+.-]*:", ref, re.I) or ref.startswith(("/", "\\")) or "\\" in ref:
        return "not a relative path"
    path = re.split(r"[?#]", ref)[0]
    parts = unquote(path).split("/")
    if ".." in parts or any(p.startswith(".") for p in parts if p):
        return "goes up or into a hidden file"
    target = os.path.normpath(os.path.join(stage, *parts))
    if not target.startswith(stage + os.sep) or not os.path.isfile(target):
        return "not a file of the guide"
    return None


def css_refs(css):
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    if re.search(r"@import", css, re.I):
        yield "@import"
    for m in CSS_URL.finditer(css):
        yield m.group(1)


def resource_problems(stage):
    probs = []
    for f in COPY_FILES:
        p = os.path.join(stage, f)
        with open(p, encoding="utf-8") as fh:
            text = fh.read()
        refs = []
        if f.endswith(".css"):
            refs = list(css_refs(text))
        else:
            for m in FORBIDDEN_TAGS.finditer(text):
                probs.append("%s: <%s> is not allowed" % (f, m.group(1).lower()))
            if REFRESH.search(text):
                probs.append("%s: meta refresh is not allowed" % f)
            for m in re.finditer(r"<style[^>]*>(.*?)</style>", text, re.S | re.I):
                refs += list(css_refs(m.group(1)))
            for tag in RES_ATTR.finditer(re.sub(r"<!--.*?-->", "", text, flags=re.S)):
                name = tag.group(1).lower()
                for k, v in ATTR.findall(tag.group(2)):
                    k = k.lower()
                    if k == "style":
                        refs += list(css_refs(html.unescape(v.strip("\"'"))))
                    elif k in ("src", "srcset", "data", "poster", "background", "xlink:href", "formaction", "action") or (k == "href" and name != "a"):
                        refs += [x.strip().split(" ")[0] for x in v.strip("\"'").split(",")] if k == "srcset" else [v]
        for r in refs:
            why = "@import is not allowed" if r == "@import" else bad_ref(stage, r)
            if why:
                probs.append("%s: %s (%s)" % (f, r.strip("\"'")[:80], why))
    return probs


# ---------- text check: everything pdftotext reads must come from the HTML or the CSS ----------
def norm(t):
    t = unicodedata.normalize("NFKD", t)
    return "".join(c for c in t if unicodedata.category(c) not in ("Mn", "Me", "Cf")).casefold()


def source_text(html_path):
    with open(html_path, encoding="utf-8") as fh:
        h = fh.read()
    styles = " ".join(re.findall(r"<style[^>]*>(.*?)</style>", h, flags=re.S | re.I))
    h = re.sub(r"<head>.*?</head>", " ", h, flags=re.S | re.I)
    h = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", h, flags=re.S | re.I)
    text = html.unescape(re.sub(r"<[^>]+>", " ", h))
    with open(os.path.join(os.path.dirname(html_path), "guia.css"), encoding="utf-8") as fh:
        css = fh.read() + " " + styles
    generated = " ".join(re.findall(r'content:\s*"([^"]*)"', css))
    return text + " " + generated


def text_problems(pdf_text, src):
    src_n = norm(src)
    words = set(re.findall(r"[0-9a-z]+", src_n))
    dotted = set(re.findall(r"[0-9a-z]+(?:[.:][0-9a-z]+)+", src_n))
    pdf_n = norm(pdf_text)
    pw = re.findall(r"[0-9a-z]+", pdf_n)
    bad = []
    for i, w in enumerate(pw):
        if w in words or len(w) <= 2:
            continue
        if i and pw[i - 1] + w in words or i + 1 < len(pw) and w + pw[i + 1] in words:
            continue                                         # a word the PDF splits (line-break hyphen, accented capital)
        if any(w[:k] in words and w[k:] in words for k in range(2, len(w) - 1)):
            continue                                         # two words pdftotext joined when it removed a line-break hyphen
        bad.append(w)
    for d in re.findall(r"[0-9a-z]+(?:[.:][0-9a-z]+)+", pdf_n):
        if re.search(r"\d", d) and d not in dotted:          # versions and addresses must match exactly
            bad.append(d)
    return sorted(set(bad))


def check_text(pdftotext, pdf, html_path):
    r = subprocess.run([pdftotext, "-q", "-enc", "UTF-8", pdf, "-"], capture_output=True, timeout=60)
    if r.returncode != 0 or not r.stdout.strip():
        return ["(pdftotext could not read the PDF)"]
    return text_problems(r.stdout.decode("utf-8", "replace"), source_text(html_path))


# ---------- render ----------
def render(chrome, stage, src, out_path):
    profile = tempfile.mkdtemp(prefix="guide-chrome-")
    cmd = [chrome, "--headless", "--disable-gpu", "--mute-audio", "--no-first-run",
           "--no-default-browser-check", "--disable-extensions", "--disable-sync",
           "--disable-background-networking", "--disable-component-update", "--disable-domain-reliability",
           "--no-pings", "--metrics-recording-only",
           "--host-resolver-rules=MAP * ~NOTFOUND", "--proxy-server=127.0.0.1:9",
           "--user-data-dir=" + profile,
           "--no-pdf-header-footer", "--generate-pdf-document-outline",
           "--run-all-compositor-stages-before-draw", "--virtual-time-budget=5000",
           "--print-to-pdf=" + out_path,
           "file://" + os.path.join(stage, src)]
    env = dict(os.environ, TZ="UTC")   # PDF dates in UTC, without the local offset
    p = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True, env=env)
    try:
        p.wait(timeout=TIMEOUT_S)
    except subprocess.TimeoutExpired:
        print("timeout: " + src, file=sys.stderr)
    finally:
        try:
            os.killpg(p.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        p.wait()
        shutil.rmtree(profile, ignore_errors=True)
    return os.path.isfile(out_path) and os.path.getsize(out_path) > 0


def main(argv):
    skip_check = "--skip-text-check" in argv
    chrome = find_chrome()
    pdftotext = find_pdftotext()
    if not pdftotext and not skip_check:
        sys.exit("pdftotext (poppler) not found: install it, or run with --skip-text-check")
    stage = tempfile.mkdtemp(prefix="guide-src-")
    failed = False
    try:
        stage_sources(stage)
        probs = resource_problems(stage)
        if probs:
            for p in probs:
                print("refused: " + p, file=sys.stderr)
            return 1
        os.makedirs(os.path.join(stage, "out"))
        for src, out in JOBS:
            tmp_pdf = os.path.join(stage, "out", out)
            if not render(chrome, stage, src, tmp_pdf):
                print("no PDF for " + src, file=sys.stderr)
                failed = True
                continue
            if not skip_check:
                bad = check_text(pdftotext, tmp_pdf, os.path.join(stage, src))
                if bad:
                    print("%s: text in the PDF that is not in %s or guia.css: %s" % (out, src, ", ".join(bad[:20])), file=sys.stderr)
                    failed = True
                    continue
            final = os.path.join(HERE, out)
            shutil.copyfile(tmp_pdf, final + ".part")
            os.replace(final + ".part", final)
            print("OK " + out)
    finally:
        shutil.rmtree(stage, ignore_errors=True)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
