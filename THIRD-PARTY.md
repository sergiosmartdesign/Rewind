# Third-party components

Rewind is © 2026 Sergio Ayala, licensed under the GNU GPL v3 or later
(`LICENSE`). These parts come from others and keep their own licenses. Full
texts are in `LICENSES/`; `REUSE.toml` says which license covers which file.

## Fonts (`retro-bauhaus/fonts/`)

| Font | Author | License | Files |
|---|---|---|---|
| Rubik (body and interface). The six static weights are instances of the variable font, made with fontTools | © 2015 The Rubik Project Authors (github.com/googlefonts/rubik) | SIL OFL 1.1 | `Rubik-latin-*.woff2` |
| Gugi (titles) | © 2017 TAE System & Typefaces Co. | SIL OFL 1.1 | `Gugi-latin.woff2` |
| Funnel Display Light (signature panel) | © 2023 The Funnel Project Authors (github.com/Dicotype/Funnel) | SIL OFL 1.1 | `FunnelDisplay-Light.ttf` |
| Pixel Operator (authorship screen) | Jayvee Enaguas | CC0 1.0 | `PixelOperator.ttf`, `PixelOperator_CC0.txt` |

`retro-bauhaus/fonts/OFL.txt` travels with the fonts inside the package.

## Paintings of the Art tape (`retro-bauhaus/assets/art/`)

Public-domain works. Images and data from the
[Art Institute of Chicago](https://www.artic.edu) open access program, released
under CC0 1.0. The record of each file is in `manifest.jsonl`.

| File | Title | Artist, date | AIC id |
|---|---|---|---|
| `01-hokusai-cranes.jpg` | Cranes on snow-covered pine | Katsushika Hokusai, c. 1834 | [21720](https://www.artic.edu/artworks/21720) |
| `02-hokusai.jpg` | Under the Wave off Kanagawa (Kanagawa oki nami ura), also known as The Great Wave, from the series "Thirty-Six Views of Mount Fuji (Fugaku sanjūrokkei)" | Katsushika Hokusai, 1830/33 | [24645](https://www.artic.edu/artworks/24645) |
| `03-mucha.jpg` | Zodiaque ("La Plume") | Alphonse Marie Mucha, 1896–97 | [111986](https://www.artic.edu/artworks/111986) |
| `04-renoir.jpg` | Two Sisters (On the Terrace) | Pierre-Auguste Renoir, 1881 | [14655](https://www.artic.edu/artworks/14655) |
| `05-monet.jpg` | Water Lilies | Claude Monet, 1906 | [16568](https://www.artic.edu/artworks/16568) |
| `06-rembrandt.jpg` | Three Oriental Figures (Jacob and Laban?) | Rembrandt van Rijn, 1641 | [74](https://www.artic.edu/artworks/74) |
| `07-seurat.jpg` | A Sunday on La Grande Jatte — 1884 | Georges Seurat, 1884–86, border added 1888–89 | [27992](https://www.artic.edu/artworks/27992) |
| `08-degas.jpg` | Ballet at the Paris Opéra | Hilaire Germain Edgar Degas, 1877 | [61603](https://www.artic.edu/artworks/61603) |
| `09-hiroshige.jpg` | Hamamatsu, from the series "Fifty-three Stations of the Tokaido (Tokaido gojusan tsugi)," also known as the Tokaido with Poem (Kyoka iri Tokaido) | Utagawa Hiroshige, c. 1837/42 | [4371](https://www.artic.edu/artworks/4371) |
| `10-turner.jpg` | Valley of Aosta: Snowstorm, Avalanche, and Thunderstorm | Joseph Mallord William Turner, 1836–37 | [109938](https://www.artic.edu/artworks/109938) |
| `11-turner.jpg` | Fishing Boats with Hucksters Bargaining for Fish | Joseph Mallord William Turner, 1837–38 | [4796](https://www.artic.edu/artworks/4796) |
| `12-caravaggio.jpg` | The Resurrection | Cecco del Caravaggio, c. 1619-20 | [19336](https://www.artic.edu/artworks/19336) |
| `13-bruegel.jpg` | The Resurrection | Pieter Bruegel, the elder, c. 1580 | [15233](https://www.artic.edu/artworks/15233) |
| `14-homer.jpg` | The Herring Net | Winslow Homer, 1885 | [25865](https://www.artic.edu/artworks/25865) |
| `15-cezanne.jpg` | The Basket of Apples | Paul Cezanne, c. 1893 | [111436](https://www.artic.edu/artworks/111436) |

The Mona Lisa icon of the Art tape (`retro-bauhaus/assets/icons/monalisa-v2.svg`)
was drawn by hand for this project after Leonardo's painting (public domain):
GPL-3.0-or-later, like the rest of Rewind.

## Brand marks (`retro-bauhaus/logos.js`)

The tapes show the logo of the app they open. The drawings come from:

| Logos | Source | License of the drawing |
|---|---|---|
| Netflix, Prime Video, Apple TV, YouTube, Nintendo Switch, Xbox | [simple-icons](https://simpleicons.org) | CC0 1.0 |
| HBO Max | Wikimedia Commons, `File:HBO_Max_(2025).svg` | Public domain (text logo), as stated on Commons |
| Disney+, Pluto TV, Claro video | Wikimedia Commons, official SVG files | As stated on each Commons file page (not re-checked for this release) |
| Browser and HDMI icons | Drawn for this project | GPL-3.0-or-later |

Nintendo Switch and Xbox are still in `logos.js` but no tape uses them today.

**Trademarks.** Every logo and name is a trademark of its owner. A license on a
drawing is not a trademark license, and this project grants no right to use
these marks (`LICENSES/LicenseRef-Rewind-Marks.txt`). Rewind is an independent
project, not affiliated with, endorsed or sponsored by Samsung, Netflix,
Google/YouTube, HBO Max, Disney+, Amazon/Prime Video, Apple, Pluto TV, Claro,
Nintendo, Microsoft/Xbox or the Linux Foundation (Tizen). Rights holders: open
an issue on the repository or write through
[sergio-ayala.com](https://www.sergio-ayala.com) and the mark will be removed.

## Data the app reads at runtime (not included)

Only with a network connection, only over HTTPS, and only these four origins
(`launcher/config.xml`, `<access>` and the CSP):

| Service | What for | Terms |
|---|---|---|
| [Open-Meteo](https://open-meteo.com) `api.open-meteo.com` | Current weather (Bogotá) | Data under CC BY 4.0; the app shows "Data: Open-Meteo.com" |
| [Datos Abiertos Colombia](https://www.datos.gov.co) `www.datos.gov.co` | Official USD/COP rate (TRM) | Their terms of use |
| [European Central Bank](https://www.ecb.europa.eu) `www.ecb.europa.eu` | USD/EUR reference rate (the EUR/COP figure is TRM × ECB) | Their terms of use |
| [Alcaldía de Bogotá](https://bogota.gov.co) `bogota.gov.co` | Cross-check of the local pico y placa rule | Their terms of use |

The weather files in `retro-bauhaus/P8e/data/` are made-up test data with the
shape of an Open-Meteo response (coordinates 0,0); they are not Open-Meteo data.

## Only for development (not included)

Tizen Studio and the Tizen CLI (Samsung / the Tizen project), Python 3, Node.js
and Google Chrome, under their own licenses, installed on the developer's
machine. `tools/m47_check.mjs` uses no packages beyond Node's standard library.
