# Sources, permissions and content boundaries

This is a new, independently authored local KYWOO album prototype. The latest center update reuses only the authorized original KYWOO triangle scene/semantics, with new album-specific sizing and paper colors. The old page structure, panel and cards are not imported. The prior prototype and host repository remain separate and unchanged.

## Reference studied, not included

https://github.com/Hchen1218/travel-album at commit e43508e1de1ab82fd9fabde77b6d731f6eef7ec4. The repo About/README did not supply a public demo URL, so its original page was served privately from a separate /tmp reference checkout, then inspected in real Chromium at 1440×1000 and 390×844.

Observed: 25 photographic images plus text tiles; four contiguous square-thumbnail lanes around a large empty center; no tilted cards; mobile retains the four-sided frame. Top moves left, right moves up, bottom moves right, left moves down. Hover pauses; scroll/drag/arrow inputs propel the ring; touch first selects and updates the center, second enters the chapter. Chapters use a horizontally scrolling gallery with print styles and a large-image view. Internal screenshots were compared at multiple timepoints and after interaction. Source screenshots are not part of this website or its downloadable code archive.

Its tree has no clear standard code license and the README reserves photo copyright. No reference source code, photos, style artwork, sound engine or scripts were copied. Our HTML/CSS/JS, spring-particle renderer, lane motion, pixel processing/reveal/palette code and chapter sound engine are independent implementations. The visual structure intentionally follows the user's requested reference; exact reproduction of every original effect is not claimed.

## Existing KYWOO assets used with the user's repository-work authorization

Source repository: https://github.com/KYWOO-Studio/kywoo_landing at b2af1b510c18fb55ebfa8dab319f1deb911d1ac3.

- assets/plate-floorstack.svg: existing generic floor diagram; labeled 方法示意. Not actual Wulin Intime floors or a commissioned project.
- assets/plate-matrix.svg: existing method matrix; labeled 方法示意. Not validated measurement/results.
- assets/plate-radar.svg: existing method graphic; labeled 方法示意. Not measured footfall or a project result.
- assets/plate-units.svg: existing generic space diagram; labeled 方法示意. Not an actual project plan.
- assets/wulin-data.svg: exact copy of source assets/method/wulin-data.svg; geographic research visualization. Three ring entries crop this same image; they are not three projects or photographs.

Wulin geography attribution: © Overture Maps Foundation / © OpenStreetMap contributors, ODbL 1.0: https://opendatacommons.org/licenses/odbl/ . Existing upstream attribution: https://github.com/KYWOO-Studio/kywoo_landing/blob/b2af1b510c18fb55ebfa8dab319f1deb911d1ac3/assets/method/ATTRIBUTION.md . Original bounded source data and generation record: https://github.com/KYWOO-Studio/kywoo_landing/tree/b2af1b510c18fb55ebfa8dab319f1deb911d1ac3/assets/tiles/wulin-intime/2026-09-23.1/source . Bounds: longitude 120.139–120.180, latitude 30.251–30.292. Diagram coordinates are linearly projected; no measured footfall, verified height, mall boundary or entrances are inferred. The original source and ODbL attribution remain available in the pinned upstream repository.

Other covers are locally authored text. Zhujiajiao remains a research example, not completed work. Legacy method/research assets remain accessible. The homepage now prioritizes six named projects/references; five use the licensed context photographs below. Songping has a text cover because no matched reusable photograph was verified. No externally sourced photograph is presented as the team’s own commissioned-project photography.

## Project content added 2026-11-06

The user supplied the names, service headings and descriptions for 黃大仙中心, 黃埔商場, 深圳松坪村 and 澳門新葡京 for the landing page. Their descriptions are preserved as project experience; no additional lead-designer, employer, completion-date, performance or photography claims are inferred.

The following entries use paraphrased public background information and are separately labelled 公開案例參考:

- 上海上生·新所: Shanghai Changning government, published 2024-10-07: https://www.shcn.gov.cn/col3991/20241008/1269200.html . The source describes historic/industrial building reuse and an open cultural district. Project-background photography is separately licensed below.
- 首爾路 7017 / Seoullo 7017 Skygarden: MVRDV official project page: https://www.mvrdv.com/projects/208/pressroom . The user's informal “首尔桥” is provisionally interpreted as this project for the local draft; this identification was stated in the chat. Architect credit remains MVRDV. Public team credits are not treated as proof of a KYWOO commission or an individual identity match. No MVRDV source images have been copied; the background photograph is separately licensed below.

The user confirmed openkai@kywoo.com in this chat. The contact link opens an email client; the website does not submit a form or confirm a booking.

## Project photography

Five Wikimedia Commons photographs are used as **场所背景照片** in the homepage ring, changing background, project index and detail. These document the places, not the specific team interventions. They are not evidence of KYWOO authorship or current site conditions. All photos were downloaded as Commons-generated thumbnails; CSS crops and opacity treatments are applied for display. Any adapted image retains its stated CC license. No AI reconstruction or stock substitute is used.

- `assets/projects/wong-tai-sin.jpg` — Pp0912 · CC BY-SA 3.0. [Original source](https://commons.wikimedia.org/wiki/File:Temple_Mall_North_201510.jpg) · [License](https://creativecommons.org/licenses/by-sa/3.0). Context: Temple Mall North (Oct 2015). Display changes: responsive crop and background opacity.
- `assets/projects/whampoa.jpg` — Wing1990hk · CC BY 3.0. [Original source](https://commons.wikimedia.org/wiki/File:Wonderful_Worlds_of_Whampoa_Treasure_World_Entrance_201108.jpg) · [License](https://creativecommons.org/licenses/by/3.0). Context: Wonderful Worlds of Whampoa Treasure World. Display changes: responsive crop and background opacity.
- `assets/projects/grand-lisboa.jpg` — variationblogr · CC BY 2.0. [Original source](https://commons.wikimedia.org/wiki/File:Grand_Lisboa_22.jpg) · [License](https://creativecommons.org/licenses/by/2.0). Context: Grand Lisboa. Display changes: responsive crop and background opacity.
- `assets/projects/columbia-circle.jpg` — WQL · CC BY-SA 4.0. [Original source](https://commons.wikimedia.org/wiki/File:Columbia_Circle_07.jpg) · [License](https://creativecommons.org/licenses/by-sa/4.0). Context: ​上生新所园区随拍. Display changes: responsive crop and background opacity.
- `assets/projects/seoullo-7017.jpg` — Christian Bolz · CC BY-SA 4.0. [Original source](https://commons.wikimedia.org/wiki/File:Seoullo_7017_Overview_(4).jpg) · [License](https://creativecommons.org/licenses/by-sa/4.0). Context: Seoullo 7017, ehemaliger Highway nahe Seoul Station.. Display changes: responsive crop and background opacity.

The original architectural photography credits do not imply endorsement. Full download metadata is stored in `assets/projects/credits.json`.

## Dependencies

Frontend: no package installation or runtime CDN, no downloaded font/audio files. Three.js 0.170.0 is now vendored solely for the original KYWOO center graph, with its MIT license. System Arial / Microsoft YaHei / sans-serif fallbacks. Canvas and Web Audio are browser APIs.

Python 3 can serve the static files. Browser test scripts use the cloud runtime's installed Playwright 1.62.1 and /usr/bin/chromium (Chromium 151.0.7922.173, Debian 13). Those tools are not shipped frontend dependencies.

Feature update: image-lab.js and sound-lab.js are newly authored local code with no third-party dependency. Original reference audio was observed only through a runtime analyser; no source/recordings were reused. Four print styles are now independently rendered pixels rather than CSS approximations. Source colors and palette are derived solely from the listed authorized SVGs or explicitly labeled local text covers.

## Authorized original KYWOO triangle reuse (latest user instruction)

`triangle-scene.js` adapts `living-loop-scene.js` from KYWOO-Studio/kywoo_landing at b2af1b510c18fb55ebfa8dab319f1deb911d1ac3. Source: https://github.com/KYWOO-Studio/kywoo_landing/blob/b2af1b510c18fb55ebfa8dab319f1deb911d1ac3/living-loop-scene.js . The original `living-loop.js`, `index.html` and network-node CSS in `styles.css` were read for the three semantic roles, focus/pin/Escape and layout. No source files in the original checkout were changed. The old dark panel/background photos are not imported. Our adapter and compact styles sit inside the existing album center.

Three.js 0.170.0: https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js (1314681 bytes, SHA-256 ce1fa418de16a19495a9f72495580e3015d7745c296d3ce0485897f902ddedfb). MIT license: https://cdn.jsdelivr.net/npm/three@0.170.0/LICENSE (1081 bytes, SHA-256 4c40a1ef62450b857c3b2aaf294936304cd552d965fbcd9d32d4c5bcf4ba4454). The exact previously downloaded official files are included unchanged, so the prototype has no runtime CDN dependency. No broader license is asserted for the KYWOO source beyond the user's authorization to reuse their code for this task.

## v5 scene framework and independent implementation

The parent supplied the actual five Section details from Notion `Landing Page｜逐节内容框架 v0.1`, updated 2026-11-04: https://app.notion.com/p/40e300548805819cac41f83546cc99fc . All sections remain draft/pending discussion. No Notion/history/permissions were changed. Visitor content excludes historical follow-up logs. `scenes.js` and `scenes.css` are independently authored for this prototype; no reference code or photos were copied. Existing authorized KYWOO assets and triangle origin above remain unchanged. The public report address could not be verified in this run, so the visitor site exposes no report external link.

## Spatial interaction reference — 2026-11-07

The live https://lorenzolottici.it/en/services page was inspected in the browser, including selecting “Websites & e-commerce”. Its overview separates two planetary objects; the selected view enlarges one into the foreground, leaves another distant, and keeps the copy upright beside the scene. This foreground/background relationship informs the KYWOO triangle stage. No reference geometry, source code, textures, typography, or sound is copied. The four-edge album still mixes project context photographs with the existing map and method diagrams.
