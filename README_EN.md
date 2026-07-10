# Cyrene's Name Roller

A random name picker desktop app built with Vue 3 + Electron, featuring Windows 11 Fluent Design.

## Views

<img width="1655" height="1021" alt="ScreenShot_2026-07-10_101123_833" src="https://github.com/user-attachments/assets/f7fcb810-3cd0-4d8c-9a6b-69a1a7f7de4d" />
<img width="1655" height="1021" alt="ScreenShot_2026-07-10_100935_090" src="https://github.com/user-attachments/assets/57dc6aa5-8ea6-4a04-9ed1-29cfcc513c50" />
<img width="1655" height="1021" alt="ScreenShot_2026-07-10_100952_359" src="https://github.com/user-attachments/assets/d0bb484f-f474-42b5-b221-eccd35eca42c" />
<img width="1655" height="1021" alt="ScreenShot_2026-07-10_100959_607" src="https://github.com/user-attachments/assets/39c997a5-a801-4a24-bc3b-e9c3b87cab33" />
<img width="1655" height="1021" alt="ScreenShot_2026-07-10_101005_678" src="https://github.com/user-attachments/assets/ea989841-1436-4170-9a3c-4e93fa23224b" />
<img width="1655" height="1021" alt="ScreenShot_2026-07-10_101012_407" src="https://github.com/user-attachments/assets/d012c58f-53a8-47c6-8411-6f31125f5fb0" />
<img width="1655" height="1021" alt="ScreenShot_2026-07-10_101018_167" src="https://github.com/user-attachments/assets/75edb038-89de-42bd-8913-0a65519eaa0b" />
<img width="1655" height="2380" alt="wechat_longscreenshot_2026-07-10_101035_521" src="https://github.com/user-attachments/assets/cbc33cb6-7e86-4c77-9c24-643aa2cc1302" />
<img width="2011" height="958" alt="ScreenShot_2026-07-10_101211_600" src="https://github.com/user-attachments/assets/dc43abf1-ac54-40b6-9833-859386070530" />

## Features

**Random Name Roller**
- Single/multi-player mode, forbid duplicates (sampling without replacement)
- Balance algorithm: fewer picks = higher probability next round
- Rainbow name animation, English Mode

**Card Flip Mode**
- 3D card flip animation
- Quick multi-draw (auto shuffle + flip)
- Persistent card history, real-time list switching

**Data Management**
- Statistics: pick count, probability, balanced probability
- Extraction records: name, list, source, timestamp
- List manager: CRUD, batch delete (10s undo), import/export
- SHA-256 password protection

**Personalization**
- UI scale (75%-200%), name font size adjustment
- Dark/Light mode, Chinese/English switch

## Quick Start

```bash
git clone https://github.com/Cyrene2008/CyreneNameRoller.git
cd CyreneNameRoller
npm install
npm run dev
```

## Build Electron Client

```bash
npm run electron:build
```

Output is in the `release/` directory.

## Tech Stack

Vue 3 + Vite + Electron + Pinia + Vue Router + @iconify/vue (Fluent UI Icons)

## License

[GPL-3.0](LICENSE)
