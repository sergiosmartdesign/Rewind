# Rewind

*[Read in English](README.md)*

Un launcher propio para un Smart TV Samsung, con estética VHS de los 90. Cada app es un cassette en un pasillo
3D: te mueves con las flechas del control y la abres con Enter. Cuando te quedas quieto, entran unas franjas con
el clima actual, el pico y placa de Bogotá y el dólar y el euro en pesos. La cinta Arte convierte el TV en una
galería de 15 pinturas de dominio público.

Versión 16.11.0. Proyecto personal y pieza de portafolio.

## Dónde se probó

Solo en un **Samsung UN55MU6100** (2017, Tizen 3.0, motor web Chromium M47), instalado en modo desarrollador.
No se ha probado en nada más. Es una app no oficial: no reemplaza el inicio de Samsung, es una app más que abres.

## Qué hay aquí

```
retro-bauhaus/P8e/      el launcher (JavaScript ES5, CSS, HTML; sin librerías ni paso de compilación)
retro-bauhaus/logos.js  los logos de las apps (ver THIRD-PARTY.md)
retro-bauhaus/fonts/    las fuentes, con sus licencias
retro-bauhaus/assets/   las 15 pinturas, el icono de la Mona Lisa y el QR al portafolio
launcher/               config.xml (el manifiesto de Tizen) e icon.png
tools/stage_tv.py       arma la carpeta que se empaqueta, desde una lista blanca de ficheros
tools/test_stage_tv.py  pruebas de stage_tv.py
tools/m47_check.mjs     arnés de pruebas: emula el motor viejo del TV sobre un Chrome moderno
```

## Probarlo en el computador

```sh
cd retro-bauhaus
python3 -m http.server 8800 --bind 127.0.0.1
```

Abre <http://127.0.0.1:8800/P8e/index.html> y usa las flechas y Enter. Con `?dev=1` salen las ayudas de prueba.
En el computador las apps no abren (no hay TV donde lanzarlas) y el clima es de muestra.

## Construir e instalar en el TV

Necesitas Python 3, Tizen Studio ([developer.tizen.org](https://developer.tizen.org)) con las extensiones de TV
(los comandos `tizen` y `sdb`), el computador y el TV en la misma red, y tu propio certificado.

1. **Modo desarrollador en el TV.** Abre Apps, marca `1 2 3 4 5` con el control, activa Developer mode, pon la IP
   de tu computador como *Host PC IP* y reinicia el TV.
2. **Conectar.** `sdb connect <la IP de tu TV>` y luego `sdb devices`: el TV tiene que aparecer.
3. **Tu certificado.** Crea un perfil de certificado en el Certificate Manager de Tizen Studio. Cada quien usa el
   suyo; aquí no hay ninguno, y el `.gitignore` deja fuera del repositorio los certificados (`*.p12`), los perfiles
   y las firmas. En el TV de 2017 donde se probó, un perfil de tipo *Samsung* no instaló (`install failed[118]`) y
   uno de tipo *Tizen* sí.
4. **Armar la carpeta.**
   ```sh
   python3 tools/stage_tv.py build/rewind --config launcher/config.xml --icon launcher/icon.png
   ```
   Copia solo lo que la app necesita, revisa los permisos de red de `config.xml` y activa en la copia el
   `webapis.js` de Samsung (en el código va comentado porque solo existe en el TV). Avisa que falta el sello; es
   normal (ver abajo).
5. **Empaquetar e instalar.**
   ```sh
   tizen package -t wgt -s <tu perfil de certificado> -- build/rewind
   cd build/rewind && tizen install -n Rewind.wgt -t <tu TV, como lo lista sdb devices>
   ```
6. Abre Rewind desde Apps. Puedes fijarla de primera en la barra de inicio.

`python3 tools/stage_tv.py --verify build/rewind/Rewind.wgt --no-sello` comprueba que un `.wgt` coincide byte a
byte con el código de hoy (sin contar los ficheros de firma).

## Haz tu propio mod

[`docs/modding/MODDING.es.pdf`](docs/modding/MODDING.es.pdf) es una guía corta para hacer tu propia versión para tu
TV, y para saber por dónde empezar si quieres llevarlo a otro televisor o caja de streaming. Su fuente editable
está al lado; `python3 docs/modding/build_pdf.py` vuelve a generar el PDF (necesita Chrome o Chromium y `pdftotext`, de poppler).

## Pruebas

```sh
python3 tools/test_stage_tv.py
```

`tools/m47_check.mjs` carga el launcher en Chrome sin ventana y le quita lo que el motor del TV de 2017 no
entiende: CSS nuevo, sintaxis de JavaScript nueva, APIs nuevas. Necesita Node 22 o más nuevo, Google Chrome (la
ruta de macOS es la de serie; otra con `--chrome`), un repositorio git (cualquier clon sirve) y un servidor local
en `127.0.0.1:8800` (el comando de *Probarlo en el computador*). Luego `node tools/m47_check.mjs`. La pasada de
serie tarda varios minutos; `--suite author` suma la pantalla de autoría y necesita macOS (`swift`, para leer el
QR). Las peticiones a otros servidores nunca salen del equipo.
Si la pantalla del Mac está bloqueada, Chrome puede dar la página por oculta y las suites se detienen; apunta
`--chrome` a un script corto que abra Chrome con `--disable-backgrounding-occluded-windows` además.

## Red

Con conexión, la app habla solo con cuatro orígenes HTTPS, declarados en `launcher/config.xml`: `bogota.gov.co`
(pico y placa), `api.open-meteo.com` (clima), `www.datos.gov.co` (dólar) y `www.ecb.europa.eu` (euro). Sin conexión
el launcher funciona igual, pero las franjas de información no salen. El clima y el pico y placa son de Bogotá. La app no lee el
identificador único del TV (DUID), ni su IP, ni su dirección MAC. Sí lee el modelo del TV para mostrarlo en la
barra superior, y el panel de diagnóstico solo puede listar las apps instaladas si descomentas el privilegio
`application.info` en `launcher/config.xml`.

## Lo que no se probó o no funciona

- Otros modelos, años o versiones de Tizen. Los ids de las apps (Netflix, YouTube…) son los que se leyeron en el TV
  de prueba y pueden cambiar en otros.
- La tecla Home no se puede capturar: siempre va al inicio de Samsung. Para volver desde una app, deja oprimido
  Atrás.
- El «Autorun Last App» del TV no reabre una app instalada a mano, así que Rewind no arranca sola al encender.
- Algunas apps se pueden colgar al abrir o cerrar (pasó con Ajustes, YouTube y Prime Video). También pasaba en
  versiones anteriores: viene del motor del TV, no del código de Rewind.
- Las herramientas solo se corrieron en macOS.
- El modo de banco remoto (`?dev=1&remote=1`) necesita un servidor que no está en este repositorio.

## Sobre el código

Casi todos los comentarios están en español. Guardan la historia de cada versión (v3…v16.11) y nombran secciones
de una bitácora de desarrollo («README, v13»), decisiones de arquitectura («ADR-0005») y algunas herramientas
(`serve_lan.py`, `wcag.py`, `rubik_static.py`) que no hacen parte de este repositorio.

## El sello

La pantalla de autoría muestra un QR al portafolio, la firma y, en el build oficial, el sello SN del autor. El
sello es su marca personal, con todos los derechos reservados, y no está en este repositorio. Sin él la pantalla
muestra el QR y la firma, y todo lo demás funciona igual.

## Cómo se hizo

Diseñado, dirigido y probado en el TV por Sergio Ayala. El código lo escribió un equipo de agentes de IA bajo su
dirección.

## Licencia

Rewind © 2026 Sergio Ayala. Software libre bajo la **GPL-3.0 o posterior** (`LICENSE`, cabeceras SPDX en el código
y `REUSE.toml` para el resto). Las fuentes, las pinturas y los logos conservan sus licencias: ver
[`THIRD-PARTY.md`](THIRD-PARTY.md) y `LICENSES/`.

Proyecto independiente. Sin afiliación, respaldo ni patrocinio de Samsung, Netflix, YouTube, HBO Max, Disney+,
Prime Video, Apple TV, Pluto TV, Claro, Nintendo ni Xbox. Samsung, Tizen y cada nombre y logo de las apps son marcas
de sus respectivos dueños.

Más de mi trabajo: [sergio-ayala.com](https://www.sergio-ayala.com)
