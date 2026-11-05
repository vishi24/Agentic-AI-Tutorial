/* Chapter 25 · Multi-agent with AutoGen */
(function () {

var LOOP_SVG = `
<svg viewBox="0 0 680 230" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch25-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="task"><rect class="dg-box amber" x="20" y="90" width="120" height="48" rx="10"/><text class="dg-title" x="80" y="119" text-anchor="middle">task</text></g>
  <g data-step="drafter"><rect class="dg-box accent" x="200" y="40" width="150" height="62" rx="10"/><text class="dg-title" x="275" y="66" text-anchor="middle">drafter</text><text class="dg-muted" x="275" y="86" text-anchor="middle">tool: get_doctor_schedule</text></g>
  <g data-step="reviewer"><rect class="dg-box accent" x="200" y="130" width="150" height="62" rx="10"/><text class="dg-title" x="275" y="156" text-anchor="middle">reviewer</text><text class="dg-muted" x="275" y="176" text-anchor="middle">no tools, only judges</text></g>
  <g data-step="thread"><rect class="dg-box" x="410" y="40" width="250" height="152" rx="10" style="fill:none"/><text class="dg-muted" x="425" y="62">one shared message thread</text>
    <text class="dg-text" x="425" y="90">1 user: patient asks…</text><text class="dg-text" x="425" y="112">2 drafter: reply v1</text><text class="dg-text" x="425" y="134">3 reviewer: problems…</text><text class="dg-text" x="425" y="156">4 drafter: reply v2</text><text class="dg-text" x="425" y="178">5 reviewer: APPROVED</text></g>
  <g data-step="stop"><rect class="dg-box amber" x="410" y="204" width="250" height="22" rx="8"/><text class="dg-text" x="535" y="220" text-anchor="middle">stop: "APPROVED" or 8 messages</text></g>
  <path class="dg-line" d="M140 114L198 78" marker-end="url(#ch25-a)"/>
  <path class="dg-accent-line" d="M262 102V128" marker-end="url(#ch25-a)"/><path class="dg-accent-line" d="M300 128V104" marker-end="url(#ch25-a)"/>
</svg>`;

var TEAMS_SVG = `
<svg viewBox="0 0 680 270" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch25-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="rr"><text class="dg-title" x="20" y="24">RoundRobin</text>
    <rect class="dg-box" x="20" y="40" width="64" height="34" rx="8"/><text class="dg-text" x="52" y="62" text-anchor="middle">A</text>
    <rect class="dg-box" x="104" y="40" width="64" height="34" rx="8"/><text class="dg-text" x="136" y="62" text-anchor="middle">B</text>
    <rect class="dg-box" x="62" y="104" width="64" height="34" rx="8"/><text class="dg-text" x="94" y="126" text-anchor="middle">C</text>
    <path class="dg-line" d="M84 57H102" marker-end="url(#ch25-b)"/><path class="dg-line" d="M136 74L112 102" marker-end="url(#ch25-b)"/><path class="dg-line" d="M62 118L44 76" marker-end="url(#ch25-b)"/>
    <text class="dg-muted" x="20" y="164">fixed turns, always in order</text></g>
  <g data-step="sel"><text class="dg-title" x="250" y="24">Selector</text>
    <rect class="dg-box amber" x="290" y="40" width="100" height="34" rx="8"/><text class="dg-text" x="340" y="62" text-anchor="middle">model picks</text>
    <rect class="dg-box" x="240" y="104" width="50" height="34" rx="8"/><text class="dg-text" x="265" y="126" text-anchor="middle">A</text>
    <rect class="dg-box" x="310" y="104" width="50" height="34" rx="8"/><text class="dg-text" x="335" y="126" text-anchor="middle">B</text>
    <rect class="dg-box" x="380" y="104" width="50" height="34" rx="8"/><text class="dg-text" x="405" y="126" text-anchor="middle">C</text>
    <path class="dg-line" d="M320 74L268 102" marker-end="url(#ch25-b)"/><path class="dg-line" d="M340 74L336 102" marker-end="url(#ch25-b)"/><path class="dg-line" d="M360 74L404 102" marker-end="url(#ch25-b)"/>
    <text class="dg-muted" x="240" y="164">a model chooses the next speaker</text></g>
  <g data-step="swarm"><text class="dg-title" x="490" y="24">Swarm</text>
    <rect class="dg-box accent" x="490" y="40" width="80" height="34" rx="8"/><text class="dg-text" x="530" y="62" text-anchor="middle">triage</text>
    <rect class="dg-box" x="480" y="104" width="76" height="34" rx="8"/><text class="dg-text" x="518" y="126" text-anchor="middle">sched.</text>
    <rect class="dg-box" x="580" y="104" width="76" height="34" rx="8"/><text class="dg-text" x="618" y="126" text-anchor="middle">billing</text>
    <path class="dg-accent-line" d="M520 74L518 102" marker-end="url(#ch25-b)"/><path class="dg-accent-line" d="M556 74L610 102" marker-end="url(#ch25-b)"/>
    <text class="dg-muted" x="480" y="164">agents hand off to named peers</text></g>
  <g data-step="use"><text class="dg-text" x="20" y="210">Use it when…</text>
    <text class="dg-muted" x="20" y="232">order is known</text><text class="dg-muted" x="240" y="232">order depends on content</text><text class="dg-muted" x="480" y="232">a desk owns the chat</text></g>
</svg>`;

window.COURSE.chapters.ch25 = {
  id: "ch25",
  title: "Multi-agent with AutoGen",
  oneLine: "AutoGen models a multi-agent system as a conversation: agents share a thread and take turns. This chapter builds reviewed replies, a selector team, a hand-off swarm, a code-running analyst with human approval, and the limits and saved state that make them safe to run.",
  lessons: [

  { title: "Agents, clients and a first team", blocks: [
    { type: "section", label: "A conversation between agents" },
    { type: "text", md: `In AutoGen, agents do not call each other like functions. They **talk in a [[group chat|shared thread]]**: every message goes to everyone on the team, and the team's type decides who speaks next. The basic pieces:

- **Model client**: the connection to OpenAI or Anthropic.
- **AssistantAgent**: a name, a model client, a system message, optional tools and optional hand-offs.
- **Team**: the agents plus a **[[termination condition|termination condition]]** that decides when the conversation ends.
- **\`team.run(task=...)\`** runs it; \`run_stream\` yields messages as they appear.` },
    { type: "code", file: "code-samples/ch25/clients.py", lang: "python", code: "@ch25/clients.py",
      note: "One place that chooses the provider. The model_info lines matter: see the callout below." },
    { type: "callout", kind: "warning", md: `**A silent AutoGen trap.** AutoGen has to know what a model can do. For a model name it does not recognise it assumes a cautious default with \`function_calling=False\`: in our test, \`claude-haiku-5-5\` got exactly that, and an agent with tools would then fail or ignore them. Passing \`model_info=ModelInfo(...)\` fixes it. Whenever you use a newer model than your framework, check what the framework thinks it can do.` },
    { type: "section", label: "Tools" },
    { type: "text", md: `Any Python function with type hints and a docstring is a tool. The clinic tools are plain async functions: \`get_doctor_schedule\` and \`request_appointment\` (a request for staff to approve, never a booking).` },
    { type: "code", file: "code-samples/ch25/clinic_tools.py", lang: "python", code: "@ch25/clinic_tools.py" },
    { type: "section", label: "Your first team: draft, review, repeat" },
    { type: "text", md: `This is Chapter 11's reflection pattern as a conversation. The **drafter** looks up the schedule and writes a reply; the **reviewer** (no tools) approves or lists problems; they alternate until the reviewer says \`APPROVED\`.` },
    { type: "stepper", svg: LOOP_SVG, caption: "RoundRobinGroupChat with a drafter and a reviewer.",
      steps: [
        { on: ["task"], text: "The **task** becomes the first message in the thread." },
        { on: ["drafter"], text: "The **drafter** goes first. It calls its tool, and with \`reflect_on_tool_use=True\` it then writes a normal reply from the result." },
        { on: ["reviewer"], text: "The **reviewer** reads the thread, with no tools, and either lists problems or answers \`APPROVED\`." },
        { on: ["thread"], text: "Everything lives in **one shared thread**. The drafter sees the reviewer's complaint and can fix exactly that." },
        { on: ["stop"], text: "The **termination condition** ends the run: the word APPROVED, or 8 messages, whichever comes first." }
      ]},
    { type: "code", file: "code-samples/ch25/reviewed_reply.py", lang: "python", code: "@ch25/reviewed_reply.py",
      output: `---------- user ----------
Patient asks: which cardiologist is in on Thursday?
---------- drafter (tool call) ----------
get_doctor_schedule(department="cardiology")
---------- drafter (tool result) ----------
{'department': 'cardiology', 'doctors': {'Dr Mehta': ['Mon', 'Wed'], 'Dr Rao': ['Thu', 'Fri']}}
---------- drafter ----------
Dr Rao sees cardiology patients on Thursday. Take 2 aspirin if you feel pain.
---------- reviewer ----------
Reject: the reply gives medical advice (aspirin).
---------- drafter ----------
Dr Rao sees cardiology patients on Thursday and Friday. Please call the front desk to book.
---------- reviewer ----------
APPROVED
stopped because: Text 'APPROVED' mentioned`,
      note: "From a test run with AutoGen's replay client as the stand-in model (scripted replies, including the bad first draft). AutoGen 0.7.5, the team, the tool call and the termination are real; the message headers are shortened for reading. The same script also ran against the real OpenAI and Anthropic client classes with the HTTP calls replaced." },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "AutoGen agents share one message thread; the team type decides who speaks next.",
      "AssistantAgent = name + model client + system message (+ tools, + hand-offs).",
      "Always combine stop rules: a keyword **and** a message limit.",
      "Tell AutoGen what a new model can do with `model_info`, or tools may silently not work."
    ]},
    { type: "quiz", title: "Knowledge check: first team", questions: [
      { kind: "mcq", q: "In `reviewed_reply.py`, how does the drafter learn what the reviewer disliked?",
        options: ["The reviewer calls the drafter as a tool", "Both agents see the same shared message thread", "It is passed as a function argument", "It is stored in a database"],
        answer: 1,
        why: ["That is agents-as-tools (Chapter 23).", "Right: the reviewer's message is in the thread the drafter reads next.", "No function arguments between agents.", "Nothing is stored."] },
      { kind: "tf", q: "A model name AutoGen does not recognise is always treated as fully capable, including tool use.", answer: false,
        explain: " It gets a cautious default with function_calling off, so you must pass model_info yourself." }
    ]}
  ]},

  { title: "Who speaks next: selector and swarm", blocks: [
    { type: "section", label: "Three ways to pick the next speaker" },
    { type: "stepper", svg: TEAMS_SVG, caption: "Three team types.",
      steps: [
        { on: ["rr"], text: "**RoundRobinGroupChat**: turns in a fixed order. Simple and cheap: no extra model call to choose a speaker." },
        { on: ["sel"], text: "**SelectorGroupChat**: after every message a **model** reads the thread and the agents' \`description\` fields, and picks who speaks. It is Chapter 22's supervisor, with only a prompt and no tools." },
        { on: ["swarm"], text: "**Swarm**: no selector. The agent speaking decides by calling a **hand-off tool** (\`transfer_to_billing\`). That is Chapter 22's network pattern." },
        { on: ["use"], text: "Use round robin when the order is known, a selector when it depends on the content, and a swarm when one desk should keep the conversation until it hands it on." }
      ]},
    { type: "section", label: "SelectorGroupChat" },
    { type: "text", md: `Each agent's **\`description\`** is what the selector reads, so write it as a job label ("Fees, bills and refunds"), not a prompt. The selector client is separate, so you can use a cheaper model for choosing than for answering.` },
    { type: "code", file: "code-samples/ch25/selector_team.py", lang: "python", code: "@ch25/selector_team.py",
      output: `---------- user ----------
Is Dr Rao in on Thursday, and does CGHS cover the OPD visit?
---------- scheduling (tool call) ----------
get_doctor_schedule(department="cardiology")
---------- scheduling ----------
Dr Rao sees cardiology patients on Thursday and Friday.
---------- insurance ----------
CGHS is accepted for OPD visits.
---------- closer ----------
Dr Rao is in on Thursday, and CGHS covers the OPD visit. DONE
stopped because: Text 'DONE' mentioned`,
      note: "From a test run with replay stand-ins for every model, including the selector (scripted to choose scheduling, insurance, closer). The team wiring is real AutoGen 0.7.5; with a real model the choices are the model's own, so test them." },
    { type: "text", md: `Two details to use:

- **\`allow_repeated_speaker=False\`** stops one agent talking twice in a row. It prevents some loops and some legitimate fixes, so turn it on knowingly.
- **\`selector_func\`** lets plain code choose the next speaker (return a name, or \`None\` to let the model decide). Use it for rules like "the closer always speaks last". As in Chapter 22: **rules in code, judgement in the model.**` },
    { type: "section", label: "Swarm and hand-offs" },
    { type: "code", file: "code-samples/ch25/swarm_team.py", lang: "python", code: "@ch25/swarm_team.py",
      output: `---------- user ----------
I want to see Dr Rao on Thursday.
---------- triage (tool call) ----------
transfer_to_scheduling()
---------- triage (handoff) ----------
Transferred to scheduling, adopting the role of scheduling immediately.
---------- scheduling (tool call) ----------
get_doctor_schedule(department="cardiology")
---------- scheduling ----------
Dr Rao is in on Thursday.
---------- scheduling (handoff to user) ----------
Ask the patient for the missing detail, then wait.
Patient: Asha Verma
---------- user (handoff) ----------
Asha Verma
---------- scheduling (tool call) ----------
request_appointment(doctor="Dr Rao", day="Thu", patient_name="Asha Verma")
---------- scheduling ----------
Requested for Dr Rao on Thursday; staff will confirm. DONE
stopped because: Text 'DONE' mentioned`,
      note: "From a test run with replay stand-ins (scripted hand-offs); the Swarm, the generated transfer_to_* tools, the pause for the user, the resume and the request_appointment call are real AutoGen 0.7.5. Message headers shortened for reading." },
    { type: "text", md: `What to notice:

- **\`handoffs=["scheduling", "billing"]\`** automatically creates the tools \`transfer_to_scheduling\` and \`transfer_to_billing\`. You never write them.
- **A hand-off to \`"user"\`** is how a swarm waits for a person. \`HandoffTermination(target="user")\` ends the run there; you collect the answer and resume with a \`HandoffMessage\`. The team remembers where it was.
- **The write tool is a request, not a booking.** \`request_appointment\` only queues a request for staff. In Chapter 23 we put an approval step in graph code; in a swarm, keep write tools that cheap and reversible.` },
    { type: "deeper", title: "GraphFlow: when you want a fixed graph", md: `AutoGen also has \`GraphFlow\` (built with \`DiGraphBuilder\`), a team whose order is an explicit directed graph, with parallel branches and conditions. It is AutoGen's counterpart to LangGraph for cases where free conversation is too loose. We do not run it in this course; see the AutoGen documentation for the current API.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "RoundRobin: fixed order. Selector: a model chooses. Swarm: agents hand off.",
      "A selector reads each agent's `description`: write job labels.",
      "`handoffs=[...]` creates transfer tools; a hand-off to `\"user\"` pauses for a person.",
      "Use `selector_func` for rules you can write in code."
    ]},
    { type: "quiz", title: "Knowledge check: team types", questions: [
      { kind: "match", q: "Match each need to the AutoGen team.",
        pairs: [["Drafter and reviewer always alternate", "RoundRobinGroupChat"], ["The next speaker depends on what was just said, decided by a model", "SelectorGroupChat"], ["The billing desk keeps the chat until it hands back to triage", "Swarm"]] },
      { kind: "mcq", q: "What does `handoffs=[\"billing\"]` give an agent?",
        options: ["Read access to billing's memory", "A generated tool `transfer_to_billing` it can call", "A copy of billing's prompt", "Nothing until you write a function"],
        answer: 1,
        why: ["Agents do not share memory.", "Right.", "No.", "AutoGen generates it."] }
    ]}
  ]},

  { title: "People and code in the conversation", blocks: [
    { type: "section", label: "A person is just another turn" },
    { type: "text", md: `You met the simplest human-in-the-loop in the swarm: an agent hands off to \`"user"\`, the run stops, and you resume with the person's reply. Two other ways exist:

- **\`UserProxyAgent\`**: a team member that, on its turn, asks a person (via an \`input_func\`) and posts the answer to the thread. Good for chat-like sessions where someone is present.
- **\`HandoffTermination\` / a keyword stop**, as in the swarm: the run ends, you store the state (next lesson), and continue later. Better when the person may answer hours later, such as an approval queue.` },
    { type: "section", label: "An agent that runs code" },
    { type: "text", md: `AutoGen's best-known trick is **writing and running code**: the analyst writes Python, an executor agent runs it and returns the real output, and the analyst explains the numbers. For counting and arithmetic this is far more reliable than asking a model to do the sums (Chapter 2).

**Code from a model is untrusted code.** The example makes three safe choices: a throw-away working folder, a timeout, and an \`approval_func\` that shows the code and waits for a person.` },
    { type: "code", file: "code-samples/ch25/analyst_team.py", lang: "python", code: "@ch25/analyst_team.py",
      output: `--- code the agent wants to run ---
\`\`\`python
bills = [450, 350, 100, 800]
print('total', sum(bills))
print('average', sum(bills)/len(bills))
\`\`\`
-----------------------------------
Run it? [y/N] y
---------- runner ----------
total 1700
average 425.0
---------- analyst ----------
The total is Rs 1700 and the average is Rs 425. DONE`,
      note: "From a test run: the code was really run by AutoGen's local executor (the numbers are computed, not scripted); the analyst's messages were scripted stand-ins. When we answered n, the runner replied \"Code execution was not approved\" and nothing ran." },
    { type: "callout", kind: "warning", md: `**\`LocalCommandLineCodeExecutor\` runs on your own machine,** with your files and keys in reach. Use it only for demos, with approval on. For anything real, run the code in **Docker** (\`DockerCommandLineCodeExecutor\`, commented in the file): the script then sees only its own container. Never connect an unattended executor to the internet or to real patient data.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "A person joins the conversation via a hand-off to `\"user\"`, a `UserProxyAgent`, or a stop-and-resume.",
      "Let code do arithmetic: an analyst agent writes it, an executor runs it.",
      "Model-written code is untrusted: approval, timeout, throw-away folder, and Docker for real use."
    ]},
    { type: "quiz", title: "Knowledge check: people and code", questions: [
      { kind: "mcq", q: "Which is the safest way to let an agent run model-written code for real work?",
        options: ["The local executor with no approval", "A Docker executor with a timeout, and approval where the code could do harm", "Run it on the production server for speed", "Ask the model whether the code is safe"],
        answer: 1,
        why: ["It has full access to your machine.", "Right: isolate it and limit it.", "The worst place for it.", "A model cannot vouch for its own code."] },
      { kind: "tf", q: "Asking the model to add up the day's bills is as reliable as letting it write and run a script.", answer: false,
        explain: " Models can slip on arithmetic; a script computes the exact sum." }
    ]}
  ]},

  { title: "Production: limits, saved state and what's next", blocks: [
    { type: "section", label: "Limits and saved state" },
    { type: "text", md: `Chapter 21's rules apply here: a team with no hard limit can talk for ever. AutoGen's termination conditions combine with \`|\` (either) and \`&\` (both). The file below uses four at once, then **saves the team's state** to a file and restores it in a new team, so a conversation can survive a restart or wait for a person.` },
    { type: "code", file: "code-samples/ch25/state_and_limits.py", lang: "python", code: "@ch25/state_and_limits.py",
      output: `run 1 stopped because: Text 'APPROVED' mentioned
saved 2230 bytes of team state
run 2 stopped because: Text 'APPROVED' mentioned
run 2 last reply: Yes, Dr Rao also sees patients on Friday. Please call the front desk to book.`,
      note: "From a test run with replay stand-ins. Saving the state to JSON, building a new team, loading the state and continuing are real AutoGen 0.7.5." },
    { type: "list", items: [
      "**Four limits, always:** a success phrase, a message limit, a token budget and a timeout.",
      "**Reset between users:** call \`team.reset()\` or build a new team, or one patient's conversation leaks into the next (Chapter 10).",
      "**Cheap selector:** the model that picks speakers runs every turn; use a small one.",
      "**Trace the thread:** log every message with a run id, and keep the agents' names stable (Chapters 10 and 21).",
      "**Evaluate:** test each agent alone, then the team on a test set (Chapter 9). Conversations make failures harder to see."
    ]},
    { type: "list", style: "mistakes", items: [
      "**Only a keyword to stop.** If the model never says it, the team never stops.",
      "**Reusing one team object for different patients** without a reset.",
      "**An unattended local code executor.** Model-written code with your machine's permissions.",
      "**Assuming the framework knows your model.** Check \`model_info\` when a model is newer than the framework."
    ]},
    { type: "section", label: "Where AutoGen stands" },
    { type: "callout", kind: "warning", md: `**Check the project's status before you build on it.** According to a third-party report on Microsoft's announcement, AutoGen moved to **maintenance mode in October 2025**: its last feature release is 0.7.5 (the version used here), and it now receives only critical fixes. Microsoft points new projects to the **Microsoft Agent Framework**, which combines AutoGen's multi-agent ideas with Semantic Kernel. Read the notice on AutoGen's GitHub page before you choose.

The **ideas in this chapter do not expire**: shared thread, selector, swarm hand-offs, termination conditions, human turns, executors. They reappear in other frameworks under similar names, so what you learned transfers.` },
    { type: "callout", kind: "warning", md: `**Install note: two version conflicts we hit.** (1) AutoGen 0.7.5's Anthropic client always sends \`temperature\`, which the current Anthropic SDK (1.0 and later) rejects, so AutoGen needs \`anthropic<1\` and its own virtual environment (\`ch25/requirements-autogen.txt\`). (2) We could not test against the live Anthropic API; if a newer Claude model rejects that parameter for you, use the OpenAI provider for this chapter or another framework from this part.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Combine four stop rules; save state to survive restarts and waits.",
      "Reset or rebuild teams between users.",
      "Check a framework's maintenance status; the patterns outlive it.",
      "Give AutoGen its own environment."
    ]},
    { type: "quiz", title: "Knowledge check: production", questions: [
      { kind: "mcq", q: "Which stop rule setup is safest?",
        options: ["TextMentionTermination(\"DONE\") only", "Keyword | MaxMessageTermination | TokenUsageTermination | TimeoutTermination", "MaxMessageTermination(1000)", "No stop rule; the agents will agree"],
        answer: 1,
        why: ["If the word never appears, it never stops.", "Right: a normal finish plus three hard limits.", "Too high to protect you.", "A hope, not a limit."] },
      { kind: "tf", q: "Because AutoGen is in maintenance mode, the patterns taught in this chapter are no longer worth learning.", answer: false,
        explain: " The patterns (shared thread, selectors, hand-offs, termination) carry over to other frameworks." },
      { kind: "order", q: "Put a pause-and-resume approval in order.",
        items: ["An agent hands off to the user", "HandoffTermination stops the run", "Save the team's state", "A person answers later", "Load the state into a team", "Resume with a HandoffMessage from the user"] }
    ]}
  ]}

  ]
};
})();
