#!/usr/bin/python3 -I
# SPDX-FileCopyrightText: 2026 Sergio Ayala
# SPDX-License-Identifier: GPL-3.0-or-later
"""Pruebas de stage_tv.py (solo stdlib). Uso: python3 -I tools/test_stage_tv.py"""
import importlib.util, os, shutil, sys, tempfile, unittest, zipfile

HERE = os.path.dirname(os.path.realpath(__file__))
REPO = os.path.dirname(HERE)
spec = importlib.util.spec_from_file_location("stage_tv", os.path.join(HERE, "stage_tv.py"))
st = importlib.util.module_from_spec(spec)
spec.loader.exec_module(st)

CFG = os.path.join(REPO, "launcher", "config.xml")
ICON = os.path.join(REPO, "launcher", "icon.png")


def exits(fn, *a, **k):
    try:
        fn(*a, **k)
    except SystemExit as e:
        return e.code
    return None


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="test_stage_tv_")
        self.addCleanup(shutil.rmtree, self.tmp, True)

    def zip_dir(self, d, out):
        with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
            for r, _, fs in os.walk(d):
                for n in fs:
                    p = os.path.join(r, n)
                    z.write(p, os.path.relpath(p, d))
        return out


class TestWebapis(unittest.TestCase):
    def test_exactamente_una_vez(self):
        self.assertIsNotNone(exits(st.webapis_on, "<html>sin bloque</html>"))


class TestFontGuard(unittest.TestCase):
    def test_css_font_urls_ignora_comentarios_y_data(self):
        css = ('/* url("../fonts/Muerta.woff2") */ @font-face{src:url("../fonts/A.woff2")}'
               ' a{background:url(data:image/svg+xml;x)} b{src:url(../fonts/B.ttf?v=1)}')
        self.assertEqual(st.css_font_urls(css, "P8e/p8e.css"), {"fonts/A.woff2", "fonts/B.ttf"})

    def test_pasa_si_coinciden(self):
        self.assertIsNone(exits(st.check_fonts, ["fonts/A.woff2", "fonts/OFL.txt", "x.js"], {"fonts/A.woff2"}))

    def test_falla_si_falta_una_usada(self):
        self.assertIn("NO entran", str(exits(st.check_fonts, ["fonts/OFL.txt"], {"fonts/A.woff2"})))

    def test_falla_si_sobra_una_sin_uso(self):
        self.assertIn("ningun CSS", str(exits(st.check_fonts, ["fonts/A.woff2", "fonts/Muerta.woff2"], {"fonts/A.woff2"})))

    def test_fuente_real_poda(self):
        self.assertIn("fonts/Rubik-latin-var.woff2", st.FONT_PRUNE)
        css = open(os.path.join(st.SRC, "P8e/p8e.css"), encoding="utf-8").read()
        self.assertNotIn("fonts/Rubik-latin-var.woff2", st.css_font_urls(css, "P8e/p8e.css"))

    def test_quitar_una_usada_rompe_el_staging(self):
        old = set(st.FONT_PRUNE)
        st.FONT_PRUNE.add("fonts/Rubik-latin-400.woff2")
        try:
            code = exits(st.stage, os.path.join(tempfile.mkdtemp(prefix="test_stage_tv_g_"), "d"), quiet=True)
        finally:
            st.FONT_PRUNE.clear(); st.FONT_PRUNE.update(old)
        self.assertIn("Rubik-latin-400.woff2", str(code))

    def test_no_podar_la_var_rompe_el_staging(self):
        old = set(st.FONT_PRUNE)
        st.FONT_PRUNE.clear()
        try:
            code = exits(st.stage, os.path.join(tempfile.mkdtemp(prefix="test_stage_tv_g_"), "d"), quiet=True)
        finally:
            st.FONT_PRUNE.update(old)
        self.assertIn("Rubik-latin-var.woff2", str(code))


class TestStageAndVerify(Base):
    def stage(self, **k):
        d = os.path.join(self.tmp, "stage")
        st.stage(d, config=CFG, icon=ICON, quiet=True, **k)
        return d

    def test_manifest_con_seccion_source(self):
        d = self.stage()
        m = open(os.path.join(d, "MANIFEST.txt"), encoding="utf-8").read()
        self.assertIn("\n# source", m)
        self.assertIn("P8e/p8e.js  <-  retro-bauhaus/P8e/p8e.js", m)
        self.assertIn("config.xml  <-  launcher/config.xml", m)
        self.assertNotIn(REPO, m)           # nada de rutas absolutas: reproducible entre arboles
        self.assertFalse(os.path.exists(os.path.join(d, "fonts", "Rubik-latin-var.woff2")))

    def test_verify_ok_y_firmas_ignoradas(self):
        d = self.stage()
        w = self.zip_dir(d, os.path.join(self.tmp, "a.wgt"))
        with zipfile.ZipFile(w, "a") as z:
            z.writestr("author-signature.xml", "<x/>"); z.writestr("signature1.xml", "<y/>")
        self.assertEqual(st.verify(w), 0)

    def test_verify_detecta_byte_cambiado(self):
        d = self.stage()
        with open(os.path.join(d, "P8e", "p8e.js"), "ab") as fh:
            fh.write(b"\n//x")
        w = self.zip_dir(d, os.path.join(self.tmp, "b.wgt"))
        self.assertEqual(st.verify(w), 1)

    def test_verify_detecta_sobra_y_falta(self):
        d = self.stage()
        os.remove(os.path.join(d, "P8e", "pyp.js"))
        open(os.path.join(d, "extra.txt"), "w").write("x")
        w = self.zip_dir(d, os.path.join(self.tmp, "c.wgt"))
        self.assertEqual(st.verify(w), 1)

    def test_verify_no_zip(self):
        p = os.path.join(self.tmp, "no.wgt"); open(p, "w").write("x")
        self.assertEqual(st.verify(p), 2)

    def test_symlinks_no_entran(self):
        """Un enlace simbolico plantado en un GLOB no entra; uno en lugar de un fichero de FIXED para el staging."""
        src = os.path.join(self.tmp, "src", "retro-bauhaus")
        shutil.copytree(st.SRC, src, ignore=shutil.ignore_patterns("privado"))
        outside = os.path.join(self.tmp, "fuera.txt")
        open(outside, "w").write("contenido de fuera")
        os.symlink(outside, os.path.join(src, "fonts", "Planted.woff2"))
        os.symlink(outside, os.path.join(src, "fonts", "PLANTED-LICENSE.txt"))
        os.symlink(outside, os.path.join(src, "P8e", "data", "planted.json"))
        os.symlink(os.path.join(src, "assets", "art", "01-hokusai-cranes.jpg"), os.path.join(src, "assets", "art", "99-planted.jpg"))
        open(os.path.join(src, "fonts", "notas.md"), "w").write("x")   # ni fuente ni licencia: no entra
        old = st.SRC
        st.SRC = src
        try:
            d = os.path.join(self.tmp, "stage-links")
            st.stage(d, config=CFG, icon=ICON, quiet=True)
            got = set()
            for r, ds, fs in os.walk(d):
                for n in ds + fs:
                    self.assertFalse(os.path.islink(os.path.join(r, n)))
                for n in fs:
                    got.add(os.path.relpath(os.path.join(r, n), d).replace(os.sep, "/"))
            for bad in ("fonts/Planted.woff2", "fonts/PLANTED-LICENSE.txt", "P8e/data/planted.json", "assets/art/99-planted.jpg", "fonts/notas.md"):
                self.assertNotIn(bad, got)
            self.assertIn("fonts/OFL.txt", got)
            self.assertIn("assets/art/01-hokusai-cranes.jpg", got)
            os.remove(os.path.join(src, "P8e", "gl.js"))
            os.symlink(outside, os.path.join(src, "P8e", "gl.js"))
            code = exits(st.stage, os.path.join(self.tmp, "stage-links-2"), config=CFG, icon=ICON, quiet=True)
            self.assertIn("enlace simbolico", str(code))
            self.assertFalse(os.path.exists(os.path.join(self.tmp, "stage-links-2")))
        finally:
            st.SRC = old

    def test_config_invalida_sigue_fallando(self):   # C5: MAJOR-2 de la revisión de seguridad
        bad = os.path.join(self.tmp, "bad.xml")
        open(bad, "w").write('<widget><access origin="https://a.com" subdomains="false"/></widget>')
        code = exits(st.stage, os.path.join(self.tmp, "d2"), config=bad, quiet=True)
        self.assertIn("4 <access>", str(code))


if __name__ == "__main__":
    unittest.main(verbosity=1)
