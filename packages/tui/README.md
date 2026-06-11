# opencode-routines-tui

[![npm](https://img.shields.io/npm/v/opencode-routines-tui)](https://www.npmjs.com/package/opencode-routines-tui)
[![license](https://img.shields.io/npm/l/opencode-routines-tui)](https://github.com/EmilioEsposito/opencode-routines/blob/main/LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-source-black?logo=github)](https://github.com/EmilioEsposito/opencode-routines)

TUI slash commands for [`opencode-routines`](https://www.npmjs.com/package/opencode-routines).

This is a **TUI plugin**: OpenCode loads it from `tui.json`, NOT from `opencode.json`'s `plugin` array (that array is for server plugins only and will reject this package with `must default export an object with server()`).

Install the server plugin in `opencode.json` and this package in `tui.json`:

```jsonc
// ~/.config/opencode/opencode.jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-routines@latest"]
}
```

```jsonc
// ~/.config/opencode/tui.json  (or .opencode/tui.json, or OPENCODE_TUI_CONFIG=<path>)
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["opencode-routines-tui@latest"]
}
```

Slash commands appear in the **terminal TUI**. OpenCode Desktop does not load TUI plugins yet.

Available commands:

| Command | Meaning |
|---|---|
| `/loop` | Start a same-session loop. Fixed interval syntax: `5m /babysit-prs`; dynamic syntax: `/babysit-prs`. |
| `/loops` | List active loops. Selecting a loop stops it. |
| `/stop-loop` | Stop an active loop. |
| `/schedule-standalone-session` | Help entry for durable standalone schedules. |

The ambiguous `/schedule` command is intentionally not registered.

## Publishing

```bash
cd packages/tui
npm login
npm publish
```

This package is built from the root package's `src/tui.ts`; run root `npm test` before publishing.
