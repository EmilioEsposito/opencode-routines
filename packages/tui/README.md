# opencode-routines-tui

[![npm](https://img.shields.io/npm/v/opencode-routines-tui)](https://www.npmjs.com/package/opencode-routines-tui)
[![license](https://img.shields.io/npm/l/opencode-routines-tui)](https://github.com/EmilioEsposito/opencode-routines/blob/main/LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-source-black?logo=github)](https://github.com/EmilioEsposito/opencode-routines)

TUI slash commands for [`opencode-routines`](https://www.npmjs.com/package/opencode-routines).

Install this alongside the server plugin:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "opencode-routines@latest",
    "opencode-routines-tui@latest"
  ]
}
```

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
