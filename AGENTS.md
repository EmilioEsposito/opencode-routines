# Agent-Native Architecture: Implementation Guide

A practical reference for building applications where agents are first-class citizens.

---

## Core Principles

### 1. Parity

**Whatever the user can do through the UI, the agent must be able to achieve through tools.**

Create a capability map:

| User Action | Agent Method                        |
| ----------- | ----------------------------------- |
| Create item | `write_file` or `create_item` tool  |
| Update item | `update_file` or `update_item` tool |
| Delete item | `delete_file` or `delete_item` tool |
| Search      | `search_files` or `search` tool     |

**Test:** Pick any UI action. Can the agent accomplish it?

### 2. Granularity

**Prefer atomic primitives. Features are outcomes achieved by an agent in a loop.**

```
# Wrong - logic in code
Tool: classify_and_organize_files(files)

# Right - agent decides
Tools: read_file, write_file, move_file, list_directory, bash
Prompt: "Organize downloads by content and recency"
```

**Test:** To change behavior, do you edit prose or refactor code?

### 3. Composability

**New features = new prompts (when tools are atomic and parity exists).**

```
Prompt: "Review files modified this week. Summarize changes. Suggest three priorities."
```

No code written. Agent uses `list_files`, `read_file`, and judgment.

### 4. Emergent Capability

**Agent can accomplish things you didn't explicitly design for.**

Build atomic tools → Users ask unexpected things → Agent composes solutions → You observe patterns → Optimize common patterns → Repeat.

---

## Tool Design

### Domain Tools

Add when needed for:

1. **Vocabulary anchoring** - `create_note` teaches "note" concept better than "write file with format"
2. **Guardrails** - Validation that shouldn't be left to agent judgment
3. **Efficiency** - Common multi-step operations

**Rule:** One conceptual action per tool. Judgment stays in prompts.

```
# Wrong
analyze_and_publish(input)  # bundles judgment

# Right
publish(content)  # one action, agent decided what to publish
```

**Keep primitives available.** Domain tools are shortcuts, not gates.

### CRUD Completeness

For every entity, verify agent has:

- **Create** - Can make new instances
- **Read** - Can see what exists
- **Update** - Can modify existing
- **Delete** - Can remove

### Dynamic Capability Discovery

Instead of static tool-per-endpoint:

```python
# Two tools handle any API
list_available_types() → ["steps", "heart_rate", "sleep", ...]
read_data(type) → reads any discovered type
```

Agent discovers capabilities at runtime. New API features work automatically.

---

## Completion Signals

**Provide explicit completion tool. Don't use heuristics.**

```swift
struct ToolResult {
    let success: Bool
    let output: String
    let shouldContinue: Bool
}

// Usage patterns:
.success("Result")    // success=true, continue=true
.error("Message")     // success=false, continue=true (recoverable)
.complete("Done")     // success=true, continue=false (stop loop)
```

### Partial Completion

Track progress at task level:

```swift
struct AgentTask {
    var status: TaskStatus  // pending, in_progress, completed, failed, skipped
    var notes: String?
}
```

Checkpoint preserves which tasks completed. Resume continues from there.

---

## Files as Universal Interface

### Why Files

- Agents already know `cat`, `grep`, `mv`, `mkdir`
- Files are inspectable, portable, sync across devices
- Directory structure = information architecture

### File Organization

```
{entity_type}/{entity_id}/
├── primary content
├── metadata
└── related materials
```

**Naming conventions:**

| Type        | Pattern                  | Example            |
| ----------- | ------------------------ | ------------------ |
| Entity data | `{entity}.json`          | `library.json`     |
| Content     | `{type}.md`              | `introduction.md`  |
| Agent logs  | `agent_log.md`           | Per-entity history |
| Checkpoints | `{sessionId}.checkpoint` | UUID-based         |

**Ephemeral vs. durable:**

```
Documents/
├── AgentCheckpoints/     # Ephemeral
├── AgentLogs/            # Ephemeral
└── Research/             # Durable (user's work)
```

### The context.md Pattern

Agent reads at session start:

```markdown
# Context

## Who I Am

Reading assistant for the app.

## What I Know About This User

- Interested in military history
- Prefers concise analysis

## What Exists

- 12 notes in /notes
- 3 active projects

## Recent Activity

- Created "Project kickoff" (2 hours ago)

## My Guidelines

- Don't spoil books they're reading

## Current State

- No pending tasks
- Last sync: 10 minutes ago
```

### Files vs. Database

| Use files for                  | Use database for            |
| ------------------------------ | --------------------------- |
| User-readable/editable content | High-volume structured data |
| Configuration                  | Complex queries             |
| Agent-generated content        | Ephemeral state             |
| Transparency matters           | Relationships/indexing      |

---

## Context Injection

System prompts include:

**Available resources:**

```
## Available Data
- 12 notes in /notes, most recent: "Project kickoff" (today)
- 3 projects in /projects
```

**Capabilities:**

```
## What You Can Do
- Create, edit, tag, delete notes
- Organize files into projects
- Search across all content
```

**Recent activity:**

```
## Recent Context
- User created "Project kickoff" (2 hours ago)
```

---

## Agent-to-UI Communication

**Event types:**

```swift
enum AgentEvent {
    case thinking(String)
    case toolCall(String, String)
    case toolResult(String)
    case textResponse(String)
    case statusChange(Status)
}
```

**Principles:**

- No silent actions - changes visible immediately
- Show progress during execution, not just results
- Consider `ephemeralToolCalls` flag for noisy internal operations

---

## Mobile Specifics

### Checkpoint and Resume

```swift
struct AgentCheckpoint: Codable {
    let agentType: String
    let messages: [[String: Any]]
    let iterationCount: Int
    let taskListJSON: String?
    let customState: [String: String]
    let timestamp: Date
}
```

**When to checkpoint:**

- On app backgrounding
- After each tool result
- Periodically during long operations

**Resume flow:**

1. Load interrupted sessions on launch
2. Filter by validity (default 1 hour max age)
3. Show resume prompt if valid
4. Restore messages and continue loop

### Background Execution

~30 seconds available. Use to:

- Complete current tool call if possible
- Checkpoint session state
- Transition to backgrounded state

### Storage (iCloud-first)

```swift
var containerURL: URL {
    if let iCloudURL = fileManager.url(forUbiquityContainerIdentifier: nil) {
        return iCloudURL.appendingPathComponent("Documents")
    }
    return fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
}
```

---

## Anti-Patterns

| Anti-Pattern                                   | Fix                                        |
| ---------------------------------------------- | ------------------------------------------ |
| Agent as router only                           | Let agent act, not just route              |
| Workflow-shaped tools (`analyze_and_organize`) | Break into primitives                      |
| Orphan UI actions                              | Maintain parity                            |
| Context starvation                             | Inject resources into system prompt        |
| Gates without reason                           | Default to open, keep primitives available |
| Heuristic completion detection                 | Explicit completion tool                   |
| Static API mapping                             | Dynamic capability discovery               |

---

## Success Checklist

**Architecture:**

- [ ] Agent can achieve anything users can (parity)
- [ ] Tools are atomic primitives (granularity)
- [ ] New features = new prompts (composability)
- [ ] Agent handles unexpected requests (emergent capability)

**Implementation:**

- [ ] System prompt includes resources and capabilities
- [ ] Agent and user share same data space
- [ ] Agent actions reflect immediately in UI
- [ ] Every entity has full CRUD
- [ ] Agents explicitly signal completion

**Ultimate test:** Describe an outcome in your domain that you didn't build a feature for. Can the agent figure it out in a loop until success?

---

# Repo-Specific: Testing opencode-routines

Hard-won verification methods for this repo. OpenCode plugin bugs are often
silent (plugin installs fine but registers nothing), so **never claim a fix
works without one of these end-to-end checks.**

## Package layout / loader contracts

- `opencode-routines` (root) is a **server plugin**: loaded from
  `opencode.json`'s `plugin` array. Module must default-export a function (or
  `{ server }`). Named non-function exports break the loader — keep test
  helpers as properties on the default export, never as named exports.
- `opencode-routines-tui` (`packages/tui/`) is a **TUI plugin**: loaded from
  `tui.json`'s `plugin` array (NOT `opencode.json`). Module must
  default-export `{ id, tui }`.
- For **npm** TUI plugins, OpenCode resolves the entrypoint ONLY from
  `package.json` `exports["./tui"]`. The `main`/`"."` export fallback applies
  to server plugins only. Without `./tui`, install succeeds but the plugin is
  silently skipped ("tui plugin has no entrypoint"). Keep both `"."` and
  `"./tui"` in `packages/tui/package.json`.
- Slash commands come from `api.keymap.registerLayer` command entries with a
  `slashName` field (plus optional `slashAliases`). The legacy
  `api.command.register` shim with `slash: { name }` also works but warns.
- Same-session prompt injection must use `session.promptAsync` (NOT
  `session.prompt`, which streams a nested run and fails under Desktop):
  - Server plugin client (non-v2 SDK): `{ path: { id: sessionID }, body: { parts } }`
  - TUI plugin client (v2 SDK): `{ sessionID, parts }`

## Managed command files (server plugin side effect)

On load, the server plugin idempotently installs `/loop`, `/loops`,
`/stop-loop`, and `/schedule-standalone-session` as OpenCode custom command
files under `$XDG_CONFIG_HOME/opencode/commands/` (default
`~/.config/opencode/commands/`). Rules:

- Files carry a `managed-by: opencode-routines` marker. Files without the
  marker are user-owned and must NEVER be overwritten.
- Writes are staged + `rename` (atomic) and skipped when content is current
  (no spurious mtime bumps).
- Disable via plugin options: `["opencode-routines", {"commands": false}]`.
- Tests and local runs MUST set `XDG_CONFIG_HOME` to a temp dir before
  importing/initializing the plugin, or you will write into the real user
  config (see `scripts/validate-routines-surface.mjs`).
- These commands appear in BOTH terminal TUI and Desktop. Installing the
  optional `opencode-routines-tui` plugin alongside them duplicates the slash
  entries in the terminal TUI.

## 1. TUI slash-command test (tmux)

Raw PTY scripting stalls (the TUI blocks on terminal capability queries), so
use tmux as the terminal emulator:

```bash
# point a throwaway tui.json at the LOCAL package dir to test unpublished code
cat > /tmp/routines-tui-test.json <<'JSON'
{"$schema":"https://opencode.ai/tui.json","plugin":["/Users/<you>/code/opencode-routines/packages/tui"]}
JSON
# or test the published package: "plugin": ["opencode-routines-tui@X.Y.Z"]

tmux kill-session -t octui 2>/dev/null
tmux new-session -d -s octui -x 160 -y 42 \
  "env -u OPENCODE_CLIENT -u OPENCODE_DISABLE_EMBEDDED_WEB_UI \
       -u OPENCODE_SERVER_USERNAME -u OPENCODE_SERVER_PASSWORD -u XDG_STATE_HOME \
   OPENCODE_TUI_CONFIG=/tmp/routines-tui-test.json opencode /path/to/repo"
sleep 18   # plugin npm install can take ~15-25s on first run
tmux send-keys -t octui "/loop"
sleep 3
tmux capture-pane -t octui -p | tail -45   # expect /loop /loops /stop-loop rows
tmux kill-session -t octui
```

Pass = the slash suggestion list shows the plugin's commands. "No matching
items" = plugin not loaded (check the `./tui` export and `tui.json` path).
The `env -u` strips are required when running from inside OpenCode Desktop
(see opencode-mdm/AGENTS.md in the mdm repo).

## 2. Server plugin test (headless serve + direct API)

Spin an isolated server with the local build, then exercise the prompt
helper against a real session:

```bash
env -u OPENCODE_CLIENT -u OPENCODE_DISABLE_EMBEDDED_WEB_UI \
    -u OPENCODE_SERVER_USERNAME -u OPENCODE_SERVER_PASSWORD -u XDG_STATE_HOME \
  XDG_STATE_HOME=/tmp/oc-test-state OPENCODE_DISABLE_PROJECT_CONFIG=1 \
  OPENCODE_CONFIG_CONTENT='{"plugin":["/Users/<you>/code/opencode-routines/dist/index.js"]}' \
  opencode serve --port 61933 --hostname 127.0.0.1 --log-level DEBUG --print-logs \
  > /tmp/oc-serve.log 2>&1 &

curl -s -X POST http://127.0.0.1:61933/session -H 'Content-Type: application/json' -d '{}'
# then call the helper attached to the default export:
node --input-type=module -e '
import { createOpencodeClient } from "./node_modules/@opencode-ai/sdk/dist/client.js"
import RoutinesPlugin from "./dist/index.js"
const client = createOpencodeClient({ baseUrl: "http://127.0.0.1:61933" })
await RoutinesPlugin.__test.submitSessionPrompt(client, "<session-id>", "test prompt")
'
```

Then grep `/tmp/oc-serve.log` for `failed to load plugin` (must be absent for
this plugin) and `process session.id=` (proof the injected prompt ran).

## 3. Desktop same-session test

When OpenCode Desktop is running, its sidecar URL is in the Desktop logs
(`~/Library/Application Support/ai.opencode.desktop/logs/<ts>/main.log`) and
auth comes from `OPENCODE_SERVER_USERNAME` / `OPENCODE_SERVER_PASSWORD` in the
inherited env. `POST /session/<id>/prompt_async` with `{parts:[...]}` must
inject a message into the open session. Timer-callback failures land in the
same logs dir under `server.log` (plugin stderr).

## Release checklist

1. `npm test && npm run typecheck` (root)
2. `cd packages/tui && npm run build`
3. tmux TUI test against the **local** `packages/tui` dir (section 1)
4. Bump BOTH `package.json` versions in lockstep
5. Commit/push, then `npm publish` root and `packages/tui` (needs OTP — only
   Emilio publishes)
6. Re-run the tmux test against the **published** version
7. Update pins in the mdm repo: `opencode-mdm/opencode.json` (server plugin)
   and `opencode-mdm/tui.json` (TUI plugin), run that repo's smoke tests, push
