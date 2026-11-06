# Rewind

*[Leer en español](README.es.md)*

A custom launcher for a Samsung Smart TV, with a 90s VHS look. Each app is a cassette in a 3D corridor; you
move with the remote's arrows and open it with Enter. When you stop, bands slide in with the current weather,
Bogotá's *pico y placa* (driving restriction) and the dollar and euro rates in Colombian pesos. The Art tape turns
the TV into a gallery of 15 public-domain paintings.

Version 16.11.0. A personal project and a portfolio piece.

## Where it has been tested

Only on a **Samsung UN55MU6100** (2017, Tizen 3.0, Chromium M47 web runtime), installed in Developer Mode.
Nothing else has been tried. It's an unofficial app: it doesn't replace Samsung's home screen, it's one more app
you open.

## What's here

```
retro-bauhaus/P8e/      the launcher (ES5 JavaScript, CSS, HTML; no libraries, no build step)
retro-bauhaus/logos.js  the app logos (see THIRD-PARTY.md)
retro-bauhaus/fonts/    fonts, with their licenses
retro-bauhaus/assets/   the 15 paintings, the Mona Lisa icon, the QR to the portfolio
launcher/               config.xml (the Tizen manifest) and icon.png
tools/stage_tv.py       builds the folder that gets packaged, from a whitelist of files
tools/test_stage_tv.py  tests for stage_tv.py
tools/m47_check.mjs     test harness: emulates the TV's old engine on a modern Chrome
```

## Try it on a computer

```sh
cd retro-bauhaus
python3 -m http.server 8800 --bind 127.0.0.1
```

Open <http://127.0.0.1:8800/P8e/index.html> and use the arrow keys and Enter. Add `?dev=1` for the test
helpers. On a computer the apps don't open (there's no TV to launch them on) and the weather is sample data.

## Build and install on the TV

You need Python 3, Tizen Studio ([developer.tizen.org](https://developer.tizen.org)) with the TV
extensions (`tizen` and `sdb` commands), a computer and the TV on the same network, and your own certificate.

1. **Developer Mode on the TV.** Open Apps, type `1 2 3 4 5` with the remote, switch Developer mode on, enter
   your computer's IP address as *Host PC IP* and restart the TV.
2. **Connect.** `sdb connect <your TV's IP address>`, then `sdb devices`: the TV should be listed.
3. **Your certificate.** Create a certificate profile in Tizen Studio's Certificate Manager. Everyone uses their
   own; none is included here, and `.gitignore` keeps certificates (`*.p12`), profiles and signatures out of the
   repository. On the tested 2017 TV, a profile of the *Samsung* type failed to install (`install failed[118]`)
   and one of the *Tizen* type worked.
4. **Stage the files.**
   ```sh
   python3 tools/stage_tv.py build/rewind --config launcher/config.xml --icon launcher/icon.png
   ```
   It copies only what the app needs, checks the network permissions in `config.xml`, and turns on Samsung's
   `webapis.js` in the copy (it's commented out in the source because it only exists on the TV). It warns that the
   seal is missing; that's expected (see below).
5. **Package and install.**
   ```sh
   tizen package -t wgt -s <your certificate profile> -- build/rewind
   cd build/rewind && tizen install -n Rewind.wgt -t <your TV, as sdb devices lists it>
   ```
6. Open Rewind from Apps. You can pin it first on the home bar.

`python3 tools/stage_tv.py --verify build/rewind/Rewind.wgt --no-sello` checks that a `.wgt` matches today's
source byte for byte (ignoring the signature files).

## Make your own mod

[`docs/modding/MODDING.pdf`](docs/modding/MODDING.pdf) is a short guide to making your own version for your TV, and to
where to start if you want to port it to another TV or streaming box. Its editable source is next to it;
`python3 docs/modding/build_pdf.py` rebuilds the PDF (it needs Chrome or Chromium and `pdftotext` from poppler).

## Tests

```sh
python3 tools/test_stage_tv.py
```

`tools/m47_check.mjs` loads the launcher in Chrome headless and removes what the TV's 2017 engine doesn't
understand: newer CSS, newer JavaScript syntax, newer APIs. It needs Node 22 or later, Google Chrome (the macOS
path is the default; another one with `--chrome`), a git repository (any clone works) and a local server answering
on `127.0.0.1:8800` (the command from *Try it on a computer*). Then `node tools/m47_check.mjs`. The default run
takes several minutes; `--suite author` adds the authorship screen and needs macOS (`swift`, to read the QR).
Requests to other hosts never leave the machine.
If the Mac's screen is locked, Chrome may report the page as hidden and the suites stop; point `--chrome` to a
small script that runs Chrome with `--disable-backgrounding-occluded-windows` added.

## Network

With a connection, the app talks only to four HTTPS origins, declared in `launcher/config.xml`:
`bogota.gov.co` (pico y placa), `api.open-meteo.com` (weather), `www.datos.gov.co` (dollar rate) and
`www.ecb.europa.eu` (euro rate). Without a connection the launcher works the same, but the info bands don't show up. The weather and
the pico y placa are for Bogotá. The app doesn't read the TV's unique ID (DUID), its IP or MAC address. It does
read the TV model to show it in the top bar, and the diagnostics panel can list the installed apps only if you
uncomment the `application.info` privilege in `launcher/config.xml`.

## Not tested or not working

- Other TV models, years or Tizen versions. App ids (Netflix, YouTube…) are the ones read on the tested TV and may
  differ elsewhere.
- The Home key can't be captured: it always goes to Samsung's home. To come back from an app, long-press Back.
- The TV's "Autorun Last App" doesn't reopen a sideloaded app, so Rewind doesn't start by itself at power-on.
- Some apps can hang when they open or close (seen with Settings, YouTube and Prime Video). It also happened with
  earlier versions: it comes from the TV's runtime, not from Rewind's code.
- The tools were only run on macOS.
- The remote benchmark mode (`?dev=1&remote=1`) needs a server that isn't in this repository.

## Notes on the source

Most comments are in Spanish. They keep the history of each version (v3…v16.11) and mention sections of a
development log ("README, v13"), architecture decisions ("ADR-0005") and a few tools (`serve_lan.py`, `wcag.py`,
`rubik_static.py`) that are not part of this repository.

## The seal

The authorship screen shows a QR to the portfolio, the signature and, in the official build, the author's SN seal.
The seal is his personal mark, all rights reserved, and it's not in this repository. Without it the screen shows
the QR and the signature, and everything else works the same.

## How it was made

Designed, directed and tested on the TV by Sergio Ayala. The code was written by a team of AI agents under his
direction.

## License

Rewind © 2026 Sergio Ayala. Free software under the **GPL-3.0-or-later** (`LICENSE`, SPDX headers in the code
and `REUSE.toml` for the rest). Fonts, paintings and logos keep their own licenses: see
[`THIRD-PARTY.md`](THIRD-PARTY.md) and `LICENSES/`.

Independent project. Not affiliated with, endorsed or sponsored by Samsung, Netflix, YouTube, HBO Max, Disney+,
Prime Video, Apple TV, Pluto TV, Claro, Nintendo or Xbox. Samsung, Tizen and every app name and logo are
trademarks of their respective owners.

More of my work: [sergio-ayala.com](https://www.sergio-ayala.com)
