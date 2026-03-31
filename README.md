# Focus Flow

A Pomodoro timer Spicetify custom app with bell chimes, voice announcements, and focus-level playlist selection.

## Features

- **Pomodoro timer** — configurable work, short break, and long break durations
- **SVG progress ring** — animated countdown ring
- **Bell chime** — synthesized 3-note bell using Web Audio API (no external files)
- **Voice announcements** — Web Speech API reads out each phase transition
- **Focus level playlists** — Chill / Deep Focus / Creative / Power, plays instantly
- **Persistent settings** — all preferences saved via Spicetify LocalStorage
- **Auto-start** — optionally auto-start the next session

## Installation

### Via Spicetify Marketplace
Search for **Focus Flow** in the Marketplace.

### Manual
```bash
cd ~/.config/spicetify/CustomApps
git clone https://github.com/rathtakrit/spicetify-focus-flow focus-flow
cp focus-flow/dist/* focus-flow/
spicetify config custom_apps focus-flow
spicetify apply
```

## Development

```bash
npm install
npm run build-local   # build to dist/
npm run watch         # watch mode
```

Requires [Spicetify](https://spicetify.app) and Node.js.

## License

MIT
