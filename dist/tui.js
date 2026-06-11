// @bun
var __defProp = Object.defineProperty;
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};

// src/tui.ts
var loops = new Map;
function activeSessionID(api) {
  const route = api.route.current;
  if (route.name !== "session")
    return;
  return typeof route.params?.sessionID === "string" ? route.params.sessionID : undefined;
}
function parseDurationSeconds(input) {
  const match = input.trim().match(/^(\d+)(s|m|h)$/i);
  if (!match)
    return;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0)
    return;
  const unit = match[2].toLowerCase();
  if (unit === "s")
    return value;
  if (unit === "m")
    return value * 60;
  return value * 3600;
}
function parseLoop(input) {
  const trimmed = input.trim();
  if (!trimmed)
    return;
  const [first, ...rest] = trimmed.split(/\s+/);
  const intervalSeconds = parseDurationSeconds(first ?? "");
  if (intervalSeconds === undefined)
    return { prompt: trimmed };
  const prompt = rest.join(" ").trim();
  if (!prompt)
    return;
  return { intervalSeconds, prompt };
}
function loopID() {
  return `loop_${Math.random().toString(16).slice(2, 10)}`;
}
async function submitPrompt(api, loop) {
  loop.fires += 1;
  await api.client.session.promptAsync({
    sessionID: loop.sessionID,
    parts: [{ type: "text", text: loop.prompt }]
  });
}
function scheduleFixed(api, loop) {
  if (!loop.intervalSeconds)
    return;
  loop.timer = setTimeout(async () => {
    if (!loops.has(loop.id))
      return;
    try {
      await submitPrompt(api, loop);
      scheduleFixed(api, loop);
    } catch (error) {
      loops.delete(loop.id);
      api.ui.toast({
        variant: "error",
        title: "Loop stopped",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }, loop.intervalSeconds * 1000);
}
function stopLoop(id) {
  const loop = loops.get(id);
  if (!loop)
    return false;
  if (loop.timer)
    clearTimeout(loop.timer);
  loops.delete(id);
  return true;
}
function showLoops(api) {
  const items = [...loops.values()];
  if (items.length === 0) {
    api.ui.dialog.replace(() => api.ui.DialogAlert({
      title: "Loops",
      message: "No active loops."
    }));
    return;
  }
  api.ui.dialog.replace(() => api.ui.DialogSelect({
    title: "Active loops",
    options: items.map((loop) => ({
      title: `${loop.id} \xB7 ${loop.mode}${loop.intervalSeconds ? ` \xB7 every ${loop.intervalSeconds}s` : ""}`,
      value: loop.id,
      description: loop.prompt,
      footer: `${loop.fires} fires \xB7 session ${loop.sessionID}`
    })),
    onSelect: (option) => {
      stopLoop(String(option.value));
      api.ui.toast({ variant: "success", message: `Stopped ${String(option.value)}` });
      api.ui.dialog.clear();
    }
  }));
}
function openLoopPrompt(api) {
  const sessionID = activeSessionID(api);
  if (!sessionID) {
    api.ui.toast({ variant: "warning", message: "Open a session before starting /loop." });
    return;
  }
  api.ui.dialog.replace(() => api.ui.DialogPrompt({
    title: "Start loop",
    placeholder: "5m /babysit-prs  or  /babysit-prs",
    onConfirm: (value) => {
      const parsed = parseLoop(value);
      if (!parsed) {
        api.ui.toast({ variant: "warning", message: "Usage: /loop 5m <prompt> or /loop <prompt>" });
        return;
      }
      const loop = {
        id: loopID(),
        sessionID,
        prompt: parsed.prompt,
        mode: parsed.intervalSeconds === undefined ? "dynamic" : "fixed",
        intervalSeconds: parsed.intervalSeconds,
        createdAt: new Date().toISOString(),
        fires: 0
      };
      loops.set(loop.id, loop);
      if (loop.mode === "fixed")
        scheduleFixed(api, loop);
      else
        submitPrompt(api, loop);
      api.ui.toast({
        variant: "success",
        title: "Loop started",
        message: loop.mode === "fixed" ? `${loop.id} every ${loop.intervalSeconds}s` : `${loop.id} dynamic mode; use ScheduleWakeup to continue`
      });
      api.ui.dialog.clear();
    }
  }));
}
function showStandaloneSchedulesHelp(api) {
  api.ui.dialog.replace(() => api.ui.DialogAlert({
    title: "Standalone schedules",
    message: "Use the ScheduleCreate tool (or natural language like 'create a standalone scheduled run...') to create durable OS-backed standalone sessions. The ambiguous /schedule command is intentionally not registered."
  }));
}
function legacyCommands(api) {
  return [
    {
      title: "Start same-session loop",
      value: "routines.loop",
      description: "Start a same-session loop. Fixed: 5m <prompt>; dynamic: <prompt>.",
      category: "Scheduler",
      slash: { name: "loop" },
      onSelect: () => openLoopPrompt(api)
    },
    {
      title: "List active loops",
      value: "routines.loops",
      description: "List and stop active same-session loops.",
      category: "Scheduler",
      slash: { name: "loops" },
      onSelect: () => showLoops(api)
    },
    {
      title: "Stop a same-session loop",
      value: "routines.stop-loop",
      description: "List active loops and select one to stop.",
      category: "Scheduler",
      slash: { name: "stop-loop" },
      onSelect: () => showLoops(api)
    },
    {
      title: "Create standalone scheduled session",
      value: "routines.schedule-standalone-session",
      description: "Show help for durable OS-backed standalone schedules.",
      category: "Scheduler",
      slash: { name: "schedule-standalone-session" },
      onSelect: () => showStandaloneSchedulesHelp(api)
    }
  ];
}
var tui = async (api) => {
  api.lifecycle.onDispose(() => {
    for (const id of [...loops.keys()])
      stopLoop(id);
  });
  api.command?.register(() => legacyCommands(api));
  api.keymap.registerLayer({
    commands: [
      {
        name: "routines.loop",
        title: "Start same-session loop",
        category: "Scheduler",
        namespace: "palette",
        slashName: "loop",
        run: () => openLoopPrompt(api)
      },
      {
        name: "routines.loops",
        title: "List active loops",
        category: "Scheduler",
        namespace: "palette",
        slashName: "loops",
        run: () => showLoops(api)
      },
      {
        name: "routines.stop_loop",
        title: "Stop a same-session loop",
        category: "Scheduler",
        namespace: "palette",
        slashName: "stop-loop",
        run: () => showLoops(api)
      },
      {
        name: "routines.schedule_standalone_session",
        title: "Create standalone scheduled session",
        category: "Scheduler",
        namespace: "palette",
        slashName: "schedule-standalone-session",
        run: () => showStandaloneSchedulesHelp(api)
      }
    ]
  });
};
var tui_default = {
  id: "opencode-routines-tui",
  tui
};
export {
  tui_default as default
};
