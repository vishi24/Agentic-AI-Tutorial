/* Agent loop simulator: replays scripted scenarios and shows the exact JSON each API would send and
   receive, for OpenAI or Anthropic. Runs fully offline; no model is called. */
(function () {
  "use strict";
  var esc = function (t) { return window.Render.esc(t); };
  var md = function (t) { return window.Render.md(t, true); };

  var SYSTEM = "You are the helpdesk assistant for City Clinic. Always check the schedule with get_doctor_schedule before saying when a doctor is available. Never guess. Never give medical advice.";
  var MODEL = { openai: "gpt-4.1-mini", anthropic: "claude-haiku-5-5" };

  function json(o) { return JSON.stringify(o, null, 2); }

  /* Build the provider's message list from a neutral history. */
  function messages(provider, hist) {
    var out = [];
    if (provider === "openai") out.push({ role: "system", content: SYSTEM });
    hist.forEach(function (h) {
      if (h.kind === "user") out.push({ role: "user", content: h.text });
      else if (h.kind === "calls") {
        if (provider === "openai") out.push({ role: "assistant", content: null, tool_calls: h.calls.map(function (c) {
          return { id: c.id, type: "function", "function": { name: c.name, arguments: JSON.stringify(c.args) } }; }) });
        else out.push({ role: "assistant", content: h.calls.map(function (c) {
          return { type: "tool_use", id: c.id, name: c.name, input: c.args }; }) });
      } else if (h.kind === "results") {
        if (provider === "openai") h.results.forEach(function (r) { out.push({ role: "tool", tool_call_id: r.id, content: JSON.stringify(r.result) }); });
        else out.push({ role: "user", content: h.results.map(function (r) {
          return { type: "tool_result", tool_use_id: r.id, content: JSON.stringify(r.result) }; }) });
      }
    });
    return out;
  }

  function request(provider, hist) {
    var body = { model: MODEL[provider] };
    if (provider === "anthropic") { body.max_tokens = 1024; body.system = SYSTEM; }
    body.messages = messages(provider, hist);
    body.tools = "[ 2 tool specs: get_doctor_schedule, request_appointment ]";
    return body;
  }

  function response(provider, turn, usage) {
    if (provider === "openai") {
      var msg = turn.text !== undefined ? { role: "assistant", content: turn.text }
        : { role: "assistant", content: null, tool_calls: turn.calls.map(function (c) {
            return { id: c.id, type: "function", "function": { name: c.name, arguments: JSON.stringify(c.args) } }; }) };
      return { choices: [{ finish_reason: turn.text !== undefined ? "stop" : "tool_calls", message: msg }],
        usage: { prompt_tokens: usage[0], completion_tokens: usage[1] } };
    }
    var content = turn.text !== undefined ? [{ type: "text", text: turn.text }]
      : turn.calls.map(function (c) { return { type: "tool_use", id: c.id, name: c.name, input: c.args }; });
    return { stop_reason: turn.text !== undefined ? "end_turn" : "tool_use", content: content,
      usage: { input_tokens: usage[0], output_tokens: usage[1] } };
  }

  function idFor(provider, n) { return provider === "openai" ? "call_" + n : "toolu_0" + n; }

  function init(root, block) {
    var provider = window.App.provider();
    var sc = block.scenarios[0];
    var state;

    function reset() {
      state = { hist: [{ kind: "user", text: sc.question }], turn: 0, phase: "request", events: [], calls: 0, tokens: 0, done: false, approval: null, n: 0 };
    }

    function stats() {
      return '<div class="sim-stats"><span><b>' + state.calls + "</b> model calls</span><span><b>" + messages(provider, state.hist).length +
        "</b> messages in history</span><span><b>" + state.tokens + "</b> tokens (est.)</span>" +
        (sc.maxSteps ? "<span>budget: <b>" + sc.maxSteps + "</b> model calls</span>" : "") + "</div>";
    }

    function draw() {
      var tabs = block.scenarios.map(function (s) {
        return '<button class="sim-scn' + (s === sc ? " active" : "") + '" data-scn="' + s.id + '">' + esc(s.label) + "</button>";
      }).join("");
      var prov = ["openai", "anthropic"].map(function (p) {
        return '<button class="code-tab' + (p === provider ? " active" : "") + '" data-prov="' + p + '">' + (p === "openai" ? "OpenAI" : "Anthropic") + "</button>";
      }).join("");
      var events = state.events.map(function (e, i) {
        return '<li class="sim-ev ' + e.cls + '"><div class="sim-ev-head"><span class="who">' + esc(e.who) + "</span>" + md(e.title) + "</div>" +
          (e.json ? "<pre>" + esc(e.json) + "</pre>" : "") + (e.note ? '<div class="sim-note">' + md(e.note) + "</div>" : "") + "</li>";
      }).join("");
      var btn;
      if (state.approval) btn = '<button class="btn primary" data-approve="yes">Approve</button><button class="btn" data-approve="no">Deny</button>';
      else if (state.done) btn = '<button class="btn" data-act="reset">Run again</button>';
      else btn = '<button class="btn primary" data-act="next">' + (state.events.length ? "Next step" : "Start") + "</button>" +
        (state.events.length ? '<button class="btn" data-act="reset">Reset</button>' : "");
      root.innerHTML = '<div class="sim-top"><div class="sim-scns">' + tabs + '</div><div class="sim-prov">' + prov + "</div></div>" +
        '<div class="sim-q"><span class="who">Patient asks</span>' + esc(sc.question) + "</div>" +
        '<ol class="sim-events">' + events + "</ol>" + stats() + '<div class="sim-ctrl">' + btn + "</div>";
      root.querySelectorAll("[data-scn]").forEach(function (b) {
        b.addEventListener("click", function () { sc = block.scenarios.filter(function (s) { return s.id === b.getAttribute("data-scn"); })[0]; reset(); draw(); });
      });
      root.querySelectorAll("[data-prov]").forEach(function (b) {
        b.addEventListener("click", function () { provider = b.getAttribute("data-prov"); window.App.setProvider(provider); replay(); });
      });
      var nx = root.querySelector('[data-act="next"]'); if (nx) nx.addEventListener("click", function () { step(); draw(); scrollLast(); });
      var rs = root.querySelector('[data-act="reset"]'); if (rs) rs.addEventListener("click", function () { reset(); draw(); });
      root.querySelectorAll("[data-approve]").forEach(function (b) {
        b.addEventListener("click", function () { decide(b.getAttribute("data-approve") === "yes"); draw(); scrollLast(); });
      });
    }

    function scrollLast() {
      var list = root.querySelectorAll(".sim-ev");
      if (list.length) list[list.length - 1].scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    /* Re-run the same scenario to the same point in the other provider's format. */
    function replay() {
      var count = state.events.length, choices = state.choices || [];
      reset(); state.choices = [];
      var guard = 0;
      while (state.events.length < count && !state.done && guard++ < 50) {
        if (state.approval) decide(choices[state.choices.length]); else step();
      }
      draw();
    }

    function turnNow() {
      var t = sc.turns[Math.min(state.turn, sc.turns.length - 1)];
      if (t && t.textIf) return { text: t.textIf[state.lastApproval ? "approved" : "denied"], usage: t.usage };
      return t;
    }

    function step() {
      if (state.phase === "request") {
        if (sc.maxSteps && state.calls >= sc.maxSteps) {
          state.events.push({ cls: "stop", who: "Harness", title: "**Budget reached.** " + sc.maxSteps + " model calls used, so the loop stops.",
            note: "The patient gets the safe fallback: “Sorry, I could not finish this. Please call the front desk.” Without this limit the loop would never end." });
          state.done = true; return;
        }
        state.events.push({ cls: "req", who: "Your code → model", title: "Request " + (state.calls + 1) + ": the **whole history** is sent again", json: json(request(provider, state.hist)) });
        state.phase = "response"; return;
      }
      if (state.phase === "response") {
        var t = turnNow();
        state.calls++; state.tokens += t.usage[0] + t.usage[1];
        if (t.calls) {
          var calls = t.calls.map(function (c) { state.n++; return { id: idFor(provider, state.n), name: c.name, args: c.args, result: c.result, approval: c.approval, denied: c.denied }; });
          state.pending = calls; state.curResults = [];
          state.hist.push({ kind: "calls", calls: calls });
          state.events.push({ cls: "res", who: "Model → your code", title: "The model asks for a tool. It does **not** run it.", json: json(response(provider, t, t.usage)) });
          state.phase = "tool";
        } else {
          state.events.push({ cls: "res done", who: "Model → your code", title: "No tool call: this is the **final answer**. The loop stops.", json: json(response(provider, t, t.usage)) });
          state.done = true;
        }
        return;
      }
      if (state.phase === "tool") {
        var c = state.pending[0];
        if (c.approval && state.approval === null) {
          state.events.push({ cls: "appr", who: "Harness", title: "`" + c.name + "` changes data, so the harness **pauses for approval**.",
            note: "Arguments: `" + JSON.stringify(c.args) + "`. Choose below." });
          state.approval = c; return;
        }
        runTool(c);
      }
    }

    function decide(yes) {
      var c = state.approval; state.approval = null;
      state.choices = (state.choices || []).concat([yes]);
      state.lastApproval = yes;
      state.events.push({ cls: yes ? "ok" : "no", who: "Person", title: yes ? "Approved." : "Denied. The tool is **not** run; the model is told why." });
      runTool(c, !yes);
    }

    function runTool(c, denied) {
      var result = denied ? (c.denied || { error: "The person did not approve this action." }) : c.result;
      var argStr = Object.keys(c.args).map(function (k) { return k + "=" + JSON.stringify(c.args[k]); }).join(", ");
      state.events.push({ cls: "tool", who: "Your code runs the tool", title: denied ? "Skipped `" + c.name + "`; returning the refusal as the observation" : "`" + c.name + "(" + argStr + ")`", json: json(result) });
      state.pending.shift();
      state.curResults.push({ id: c.id, result: result });
      if (!state.pending.length) {
        state.hist.push({ kind: "results", results: state.curResults });
        state.turn++; state.phase = "request";
      }
    }

    reset(); draw();
  }

  window.Sim = { init: init };
})();
