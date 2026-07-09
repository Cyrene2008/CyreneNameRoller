# Cyrene's Name Roller

A random name picker desktop app built with Vue 3 + Electron, featuring Windows 11 Fluent Design.

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
