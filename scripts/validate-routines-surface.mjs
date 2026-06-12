import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

// Isolate config side effects (managed command install) from the real user
// config. Must be set before importing the plugin module's consumers run it.
const configRoot = mkdtempSync(join(tmpdir(), "routines-validate-"))
process.env.XDG_CONFIG_HOME = configRoot

const { default: RoutinesPlugin } = await import("../dist/index.js")

const { __test } = RoutinesPlugin

const standalone = __test.buildOpencodeArgs({
  slug: "demo",
  name: "Demo",
  schedule: "*/10 * * * *",
  createdAt: new Date(0).toISOString(),
  run: { prompt: "fresh standalone" },
})

assert.equal(standalone.args[0], "run")
assert.equal(standalone.args.includes("--session"), false)
assert.equal(standalone.args.at(-1), "fresh standalone")

const explicit = __test.buildOpencodeArgs({
  slug: "demo",
  name: "Demo",
  schedule: "*/10 * * * *",
  createdAt: new Date(0).toISOString(),
  run: { prompt: "explicit session", session: "ses_explicit" },
})

assert.equal(explicit.args.includes("--session"), true)
assert.equal(explicit.args[explicit.args.indexOf("--session") + 1], "ses_explicit")

let promptThis
let promptPayload
const promptSession = {
  async promptAsync(input) {
    promptThis = this
    promptPayload = input
    return { data: "ok" }
  },
}

await __test.submitSessionPrompt({ session: promptSession }, "ses_current", "hello cron")
assert.equal(promptThis, promptSession)
assert.deepEqual(promptPayload, {
  path: { id: "ses_current" },
  body: { parts: [{ type: "text", text: "hello cron" }] },
})

// Managed command files: user-owned file (no marker) must never be touched.
const commandsDir = join(configRoot, "opencode", "commands")
mkdirSync(commandsDir, { recursive: true })
const userOwned = join(commandsDir, "loop.md")
writeFileSync(userOwned, "my own loop command\n")

const server = await RoutinesPlugin()

assert.equal(readFileSync(userOwned, "utf-8"), "my own loop command\n", "user-owned loop.md must not be overwritten")
for (const file of ["loops.md", "stop-loop.md", "schedule-standalone-session.md"]) {
  const dest = join(commandsDir, file)
  assert.ok(existsSync(dest), `${file} should be installed`)
  assert.ok(readFileSync(dest, "utf-8").includes("managed-by: opencode-routines"), `${file} should carry the managed marker`)
}

// commands: false opts out entirely.
const optOutRoot = mkdtempSync(join(tmpdir(), "routines-validate-optout-"))
process.env.XDG_CONFIG_HOME = optOutRoot
await RoutinesPlugin(undefined, { commands: false })
assert.ok(!existsSync(join(optOutRoot, "opencode", "commands", "loops.md")), "commands:false must skip install")
process.env.XDG_CONFIG_HOME = configRoot

for (const name of [
  "LoopCreate",
  "LoopList",
  "LoopDelete",
  "ScheduleWakeup",
  "CronCreate",
  "CronList",
  "CronDelete",
  "ScheduleCreate",
  "ScheduleList",
  "ScheduleDelete",
  "ScheduleRun",
  "ScheduleLogs",
]) {
  assert.ok(server.tool[name], `${name} alias should be registered`)
}


console.log("routines surface validation passed")
