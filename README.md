# Vortex64 — sitio oficial

Sitio web oficial de **Vortex64**, emulador de Nintendo 64 nativo para Windows 10/11 x64 y Linux, creado por [SugarSV11](https://github.com/SugarSV11).

- Sitio: https://sugarsv11.github.io/vortex64-site/
- Código (Linux): https://github.com/SugarSV11/Vortex64
- Código (Windows): https://github.com/SugarSV11/Vortex64-Windows

Landing page estática (HTML/CSS/JS) con capturas reales de Vortex64 para Windows ejecutando Super Mario 64 (USA).

Vista previa: `py -m http.server 8000` en esta carpeta y abrir http://localhost:8000
Capturas en `assets/screenshots/`. Enlaces de descarga en `script.js`.
SEO: `sitemap.xml`, `robots.txt`, metadatos y Schema.org en `index.html`.

Idiomas: ES/EN con el botón de la barra superior (texto en `data-en` dentro de `index.html`, lógica en `script.js`; también `?lang=en`).
Los enlaces de descarga de Windows están directamente en el HTML; el de Linux se activa con el selector o, sin JavaScript, desde el bloque `noscript`.
El sitio muestra el crédito a Project64 (GPLv2) en el pie de página.
