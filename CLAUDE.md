# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build-local   # compile TypeScript → dist/ (minified) — use this for all changes
npm run watch         # rebuild on save (dev mode, outputs to Spicetify directly)
npm run build         # build and install into Spicetify in one step

# After any build-local, sync dist to app root then reload Spotify:
cp dist/* .
spicetify apply
```

There are no tests. Verification is done by restarting Spotify and exercising the UI.

## Build Pipeline

`spicetify-creator` (wraps esbuild + sass) bundles all TypeScript/SCSS into four files:

| Output | Source |
|---|---|
| `index.js` | `src/app.tsx` and all imports |
| `extension.js` | `src/extensions/extension.tsx` |
| `style.css` | `src/css/app.module.scss` |
| `manifest.json` | generated from `src/settings.json` + root `manifest.json` icons |

CSS modules use hashed class names in the bundle. The `src/types/css-modules.d.ts` provides the `*.module.scss` type declarations. `src/types/spicetify.d.ts` provides full types for all `Spicetify.*` globals.

The compiled files in `dist/` must be **copied to the app root** before `spicetify apply` — spicetify reads `index.js`, `style.css`, etc. from the app root, not from `dist/`.

## Architecture

### Runtime Model
This is a Spicetify custom app. Spicetify injects React as `Spicetify.React` / `Spicetify.ReactDOM` at runtime — there is no React in the bundle. `src/extensions/extension.tsx` runs as a separate script on Spotify startup (loaded via `manifest.json → subfiles_extension`); it has no access to the React tree.

### State Flow
```
app.tsx (Settings state + tab routing)
  ├── PomodoroTimer.tsx  — timer state (phase, secondsLeft, status, sessionCount)
  ├── SettingsPanel.tsx  — controlled form, calls onChange on every change
  └── PlaylistPicker.tsx — calls Spicetify.Player.playUri() on level select
```

Settings are loaded from `Spicetify.LocalStorage` on mount in `app.tsx` and written back on every change via `lib/storage.ts`. `PomodoroTimer` re-reads settings from props; when settings change while the timer is idle the `useEffect` in `PomodoroTimer` resets `secondsLeft`.

### Phase Transitions
`PomodoroTimer` drives all phase logic. On reaching zero:
1. Increments `sessionCount` (if `phase === 'work'`)
2. Decides next phase: `shortBreak` normally, `longBreak` every `sessionsBeforeLong` sessions
3. Calls `playBell()` → `announcePhase()` → `Spicetify.showNotification()`
4. Sets `status` to `'idle'` or `'running'` depending on `settings.autoStart`

### Audio & Voice
- `lib/soundEngine.ts` — single shared `AudioContext`, synthesizes a 3-note bell (A5→C#6→E6) using `OscillatorNode` + `GainNode`. Resumes the context on each call to handle browser autoplay suspension.
- `lib/voiceEngine.ts` — wraps `window.speechSynthesis`. Cancels any in-progress utterance before speaking.

Both modules silently no-op if their browser APIs are unavailable.

## Key Constraints

- **No external assets** — all audio is synthesized; no CDN images (lesson from the broken study-banger-app). Playlist cards use emoji + text only.
- **Spicetify globals are runtime-only** — `Spicetify.*` is never available during build; only reference it inside event handlers or effects, never at module top-level (except in `extension.tsx` which has its own async init loop).
- **`manifest.json` is overwritten by the build** — edit icons in the root `manifest.json` before running `build-local`; the build regenerates this file from `src/settings.json`.
- **Marketplace discovery** — the GitHub repo has the `spicetify-apps` topic set; no PR to the marketplace repo is needed.
