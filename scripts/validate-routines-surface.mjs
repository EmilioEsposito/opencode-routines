import assert from "node:assert/strict"
import RoutinesPlugin from "../dist/index.js"
import tuiPlugin from "../dist/tui.js"

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

const server = await RoutinesPlugin()
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

assert.equal(typeof tuiPlugin.tui, "function")
assert.equal(tuiPlugin.id, "opencode-routines-tui")

console.log("routines surface validation passed")
