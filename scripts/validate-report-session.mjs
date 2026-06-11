import assert from "node:assert/strict"
import { __testBuildOpencodeArgs, __testRunSpecWithReportSession } from "../dist/index.js"

const run = __testRunSpecWithReportSession({ prompt: "report back" }, "ses_parent")
assert.equal(run.session, "ses_parent")

const explicit = __testRunSpecWithReportSession({ prompt: "report back", session: "ses_explicit" }, "ses_parent")
assert.equal(explicit.session, "ses_explicit")

const continued = __testRunSpecWithReportSession({ prompt: "report back", continue: true }, "ses_parent")
assert.equal(continued.session, undefined)
assert.equal(continued.continue, true)

const attached = __testRunSpecWithReportSession({ prompt: "report back", attachUrl: "http://127.0.0.1:4096" }, "ses_parent")
assert.equal(attached.session, undefined)
assert.equal(attached.attachUrl, "http://127.0.0.1:4096")

const invocation = __testBuildOpencodeArgs({
  slug: "demo",
  name: "Demo",
  schedule: "*/10 * * * *",
  createdAt: new Date(0).toISOString(),
  run: { prompt: "report back", session: run.session },
})

assert.equal(invocation.args[0], "run")
assert.ok(invocation.args.includes("--session"))
assert.equal(invocation.args[invocation.args.indexOf("--session") + 1], "ses_parent")
assert.equal(invocation.args.at(-1), "report back")

console.log("report-session validation passed")
