/**
 * OpenCode Scheduler Plugin
 *
 * Schedule recurring jobs using launchd (Mac), systemd (Linux), schtasks (Windows), or cron fallback.
 * Jobs are stored under ~/.config/opencode/scheduler/ (scoped by workdir).
 *
 * Features:
 * - Survives reboots
 * - Catches up on missed runs (if computer was asleep)
 * - Cross-platform (Mac + Linux + Windows)
 * - Working directory support for MCP configs
 * - Environment variable injection (PATH for node/npx)
 */
import type { Plugin } from "@opencode-ai/plugin";
type OpencodeRunFormat = "default" | "json";
interface JobRunSpec {
    prompt?: string;
    command?: string;
    arguments?: string;
    files?: string[];
    agent?: string;
    model?: string;
    variant?: string;
    title?: string;
    share?: boolean;
    continue?: boolean;
    session?: string;
    runFormat?: OpencodeRunFormat;
    attachUrl?: string;
    port?: number;
}
type JobInvocation = {
    command: string;
    args: string[];
};
interface Job {
    scopeId?: string;
    slug: string;
    name: string;
    schedule: string;
    prompt?: string;
    attachUrl?: string;
    run?: JobRunSpec;
    invocation?: JobInvocation;
    timeoutSeconds?: number;
    source?: string;
    workdir?: string;
    createdAt: string;
    updatedAt?: string;
    lastRunAt?: string;
    lastRunExitCode?: number;
    lastRunError?: string;
    lastRunSource?: "manual" | "scheduled";
    lastRunStatus?: "running" | "success" | "failed";
}
export declare function __testBuildOpencodeArgs(job: Job): {
    command: string;
    args: string[];
};
export declare const SchedulerPlugin: Plugin;
export default SchedulerPlugin;
