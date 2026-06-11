# opencode-routines

Claude-Code-style routines for [opencode](https://opencode.ai): same-session loops, same-session cron prompts, and host-backed standalone scheduled agents.

This package is a hard fork / successor of `opencode-scheduler` by Benjamin Shafii. The durable host scheduler implementation is derived from that project; this fork changes the product model around routines and adds Claude-aligned tool names.

## Install

Server tools only:

```json
{
  "plugin": ["opencode-routines"]
}
```

Server tools plus optional TUI slash commands:

```json
{
  "plugin": ["opencode-routines", "opencode-routines/tui"]
}
```

`opencode-routines/tui` is a subpath export from the same npm package, not a separate package.

## Concepts

| Concept | Session model | Where it runs | Persistence |
|---|---|---|---|
| Loop | Same conversation | Current opencode host/process | Process-scoped |
| Cron prompt | Same conversation | Current opencode host/process | Session-only for now |
| Standalone schedule | Fresh standalone opencode run | Host scheduler: launchd/systemd/Task Scheduler/cron | Durable |

The ambiguous `/schedule` slash command is intentionally **not** registered. Use `/schedule-standalone-session` for help with durable standalone schedules, or use the `ScheduleCreate` tool directly.

## Same-session loop tools

| Tool | Description |
|---|---|
| `LoopCreate` | Start a same-session loop. Fixed interval when `interval` is provided; dynamic mode otherwise. |
| `LoopList` | List active loops in this plugin process. |
| `LoopDelete` | Stop an active loop. |
| `ScheduleWakeup` | Dynamic-loop wake-up tool. Only works for an active dynamic loop in the same session and prompt. |

`ScheduleWakeup` parameters align with Claude Code:

| Param | Type | Required | Description |
|---|---|---|---|
| `delaySeconds` | number | yes | Seconds until wake-up. Clamped to 60-3600. |
| `prompt` | string | yes | The loop prompt to fire on wake-up. |
| `reason` | string | yes | Short explanation for the wake-up. |

## Same-session cron tools

| Tool | Description |
|---|---|
| `CronCreate` | Schedule a prompt at wall-clock times in the current session. |
| `CronList` | List active same-session cron prompts. |
| `CronDelete` | Cancel a same-session cron prompt. |

`CronCreate` parameters:

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `cron` | string | yes | — | 5-field cron in local timezone: `M H DoM Mon DoW`. |
| `prompt` | string | yes | — | Prompt to enqueue in the same session. |
| `recurring` | boolean | no | `true` | `false` = one-shot. |
| `durable` | boolean | no | `false` | Accepted for Claude compatibility, but currently session-only. |

## Durable standalone schedule tools

Claude-aligned aliases:

| Tool | Description |
|---|---|
| `ScheduleCreate` | Create a durable host-backed standalone scheduled opencode run. |
| `ScheduleList` | List standalone schedules. |
| `ScheduleDelete` | Delete a standalone schedule. |
| `ScheduleRun` | Run a standalone schedule immediately. |
| `ScheduleLogs` | View logs for a standalone schedule. |

Legacy compatibility aliases are still present:

| Tool | Description |
|---|---|
| `schedule_job` | Create a durable standalone schedule. |
| `list_jobs` | List durable standalone schedules. |
| `get_job` | Get schedule details. |
| `update_job` | Update a schedule. |
| `delete_job` | Delete a schedule. |
| `run_job` | Run a schedule immediately. |
| `job_logs` | View schedule logs. |
| `cleanup_global` | Clean up scheduler artifacts across all scopes. |

Durable standalone schedules use the host scheduler: launchd on macOS, systemd on Linux, Task Scheduler on Windows, or cron fallback. Each run starts a fresh standalone `opencode run` by default. Pass explicit `session`, `continue`, or `attachUrl` only when you intentionally want different behavior.

## Optional TUI commands

Available when `opencode-routines/tui` is installed:

| Command | Meaning |
|---|---|
| `/loop` | Start a same-session live loop. Fixed interval syntax: `5m /babysit-prs`. Dynamic syntax: `/babysit-prs`. |
| `/loops` | List active loops. Selecting a loop stops it. |
| `/stop-loop` | Stop an active loop. |
| `/schedule-standalone-session` | Help entry for durable standalone schedules. |

## Storage

Standalone schedule storage remains compatible with `opencode-scheduler`:

| What | Where |
|---|---|
| Job configs | `~/.config/opencode/scheduler/scopes/<scopeId>/jobs/*.json` |
| Run records | `~/.config/opencode/scheduler/scopes/<scopeId>/runs/*.jsonl` |
| Locks | `~/.config/opencode/scheduler/scopes/<scopeId>/locks/*.json` |
| Logs | `~/.config/opencode/logs/scheduler/<scopeId>/*.log` |
| Supervisor script | `~/.config/opencode/scheduler/supervisor.pl` |

## Publishing

```bash
npm login
npm publish
```

Bump `version` in `package.json` before each release.

## License

MIT
