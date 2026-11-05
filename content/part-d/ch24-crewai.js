/* Chapter 24 · Multi-agent with CrewAI */
(function () {

var CREW_SVG = `
<svg viewBox="0 0 680 250" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch24-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="crew"><rect class="dg-box" x="10" y="10" width="660" height="230" rx="14" style="fill:none;stroke-dasharray:5 4"/><text class="dg-muted" x="24" y="30">Crew(process=sequential)</text></g>
  <g data-step="agents"><rect class="dg-box accent" x="40" y="120" width="170" height="64" rx="10"/><text class="dg-title" x="125" y="146" text-anchor="middle">Agent: scheduler</text><text class="dg-muted" x="125" y="166" text-anchor="middle">role · goal · backstory</text>
    <rect class="dg-box accent" x="470" y="120" width="170" height="64" rx="10"/><text class="dg-title" x="555" y="146" text-anchor="middle">Agent: writer</text><text class="dg-muted" x="555" y="166" text-anchor="middle">role · goal · backstory</text></g>
  <g data-step="tasks"><rect class="dg-box amber" x="40" y="48" width="170" height="52" rx="10"/><text class="dg-title" x="125" y="70" text-anchor="middle">Task 1</text><text class="dg-muted" x="125" y="88" text-anchor="middle">what to do · expected result</text>
    <rect class="dg-box amber" x="470" y="48" width="170" height="52" rx="10"/><text class="dg-title" x="555" y="70" text-anchor="middle">Task 2</text><text class="dg-muted" x="555" y="88" text-anchor="middle">context=[task 1]</text></g>
  <g data-step="tool"><path class="dg-line" d="M125 184V198" marker-end="url(#ch24-a)"/><rect class="dg-box" x="30" y="200" width="190" height="30" rx="8"/><text class="dg-text" x="125" y="220" text-anchor="middle">tool: get_doctor_schedule</text></g>
  <g data-step="flow"><path class="dg-accent-line" d="M210 152H468" marker-end="url(#ch24-a)"/><text class="dg-muted" x="340" y="144" text-anchor="middle">task 1's output becomes context</text></g>
  <g data-step="out"><text class="dg-text" x="555" y="216" text-anchor="middle">final result: CrewOutput</text><path class="dg-line" d="M555 184V200" marker-end="url(#ch24-a)"/></g>
  <path class="dg-line" d="M125 100V118" marker-end="url(#ch24-a)"/><path class="dg-line" d="M555 100V118" marker-end="url(#ch24-a)"/>
</svg>`;

var HIER_SVG = `
<svg viewBox="0 0 680 258" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch24-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="task"><rect class="dg-box amber" x="250" y="10" width="180" height="44" rx="10"/><text class="dg-title" x="340" y="38" text-anchor="middle">Task (no agent set)</text></g>
  <g data-step="mgr"><rect class="dg-box accent" x="250" y="84" width="180" height="56" rx="10"/><text class="dg-title" x="340" y="108" text-anchor="middle">manager (manager_llm)</text><text class="dg-muted" x="340" y="126" text-anchor="middle">plans, delegates, reviews</text></g>
  <g data-step="deleg"><rect class="dg-box" x="90" y="180" width="180" height="46" rx="10"/><text class="dg-title" x="180" y="208" text-anchor="middle">Scheduling desk</text>
    <rect class="dg-box" x="410" y="180" width="200" height="46" rx="10"/><text class="dg-title" x="510" y="208" text-anchor="middle">Billing and insurance desk</text>
    <path class="dg-line" d="M290 140L190 178" marker-end="url(#ch24-b)"/><path class="dg-line" d="M390 140L500 178" marker-end="url(#ch24-b)"/>
    <text class="dg-muted" x="196" y="154" text-anchor="end">delegate_work_to_coworker</text></g>
  <g data-step="back"><text class="dg-muted" x="340" y="252" text-anchor="middle">answers go back to the manager, who checks and combines them</text></g>
  <path class="dg-line" d="M340 54V82" marker-end="url(#ch24-b)"/>
</svg>`;

window.COURSE.chapters.ch24 = {
  id: "ch24",
  title: "Multi-agent with CrewAI",
  oneLine: "CrewAI describes a multi-agent system the way you would describe a team: roles, tasks and a process. This chapter builds the clinic crew, adds tools and MCP, tries the manager design, and then makes it production-safe with typed output, guardrails and limits.",
  lessons: [

  { title: "Agents, tasks and crews", blocks: [
    { type: "section", label: "A team described in words" },
    { type: "text", md: `LangGraph (Chapter 23) makes you draw a graph. [[crew|CrewAI]] asks you to describe a **team**. Three objects are enough:

- **Agent**: a *role*, a *goal* and a *backstory*. These three sentences are the agent's system prompt, so write them like a job description.
- **Task**: what to do (\`description\`), what a good result looks like (\`expected_output\`), and which agent does it. A task can receive other tasks' results through \`context\`.
- **Crew**: the agents, the tasks and the **process**. \`Process.sequential\` runs tasks in order.` },
    { type: "stepper", svg: CREW_SVG, caption: "A sequential crew: scheduler, then writer.",
      steps: [
        { on: ["crew"], text: "The **crew** owns everything: agents, tasks and the process that runs them. \`crew.kickoff(inputs={...})\` starts it." },
        { on: ["agents"], text: "Two **agents**. Their role, goal and backstory become each model's instructions. Each gets only its own tools." },
        { on: ["tasks"], text: "Two **tasks**, one per agent. \`expected_output\` tells the agent when it is done, and is what the next step receives." },
        { on: ["tool"], text: "The scheduler has a **tool**. CrewAI sends the tool's description to the model using the provider's native function calling (Chapter 6)." },
        { on: ["flow"], text: "Task 2 has \`context=[task 1]\`, so the writer sees the scheduler's result. That is the *only* link between the two agents." },
        { on: ["out"], text: "The crew returns a **CrewOutput**: the last task's text in \`.raw\`, every task's output in \`.tasks_output\`, and token usage." }
      ]},
    { type: "code", file: "code-samples/ch24/crew_llm.py", lang: "python", code: "@ch24/crew_llm.py",
      note: "One place that chooses OpenAI or Anthropic for every crew. CrewAI names models \"<provider>/<model>\"." },
    { type: "code", file: "code-samples/ch24/clinic_tools.py", lang: "python", code: "@ch24/clinic_tools.py" },
    { type: "code", file: "code-samples/ch24/basic_crew.py", lang: "python", code: "@ch24/basic_crew.py",
      output: `Dr Rao sees cardiology patients on Thursday. Please call the front desk to book.

per task:
  Clinic scheduler: Dr Mehta: Mon, Wed. Dr Rao: Thu, Fri.
  Patient reply writer: Dr Rao sees cardiology patients on Thursday. Please call the front des

tokens reported by CrewAI: 840`,
      note: "From a test run with stand-in models (the HTTP calls to OpenAI and Anthropic were replaced; CrewAI 1.15.35, the tool and the data are real). The stand-in sent 3 requests of 140 tokens each, so 420 tokens in total, yet CrewAI reported 840. Cross-check CrewAI's token numbers with your provider's usage page before you use them for billing." },
    { type: "callout", kind: "tip", md: `**Count the calls.** Two tasks took **3 model calls** in our test: the scheduler picks the tool, the scheduler writes its answer from the tool result, and the writer writes the reply. Every extra agent, tool round or retry adds calls, so measure while you build (Chapter 21's cost lesson).` },
    { type: "section", label: "Two things to know early" },
    { type: "list", items: [
      "**\`allow_delegation=False\` on specialists.** If it is on, an agent may hand work to a colleague. That can help, but it makes costs and paths harder to predict, so turn it on only when you want it.",
      "**\`max_iter\`** caps an agent's reasoning rounds. Without it, an agent that cannot find an answer keeps trying."
    ]},
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "CrewAI = agents (role, goal, backstory) + tasks (description, expected_output) + a crew with a process.",
      "`context=[task]` is how a task receives another task's result.",
      "`kickoff(inputs={...})` fills `{placeholders}` in descriptions.",
      "Count model calls while building; every agent, tool round and retry adds one."
    ]},
    { type: "quiz", title: "Knowledge check: crews", questions: [
      { kind: "mcq", q: "How does the writer agent get the scheduler's result in `basic_crew.py`?",
        options: ["Both agents share one chat history", "Task 2 has `context=[find_doctors]`", "The writer calls the scheduler as a tool", "Through a global variable"],
        answer: 1,
        why: ["Each agent has its own context.", "Right: context passes a task's output on.", "That would be delegation, not used here.", "No."] },
      { kind: "match", q: "Match each CrewAI object to its job.",
        pairs: [["Agent", "Role, goal and backstory: who is doing the work"], ["Task", "What to do and what the finished result looks like"], ["Crew", "Agents + tasks + the process that runs them"]] },
      { kind: "tf", q: "`expected_output` is only documentation and does not reach the model.", answer: false,
        explain: " It is added to the agent's prompt so the model knows what a finished answer looks like." }
    ]}
  ]},

  { title: "Tools and MCP in a crew", blocks: [
    { type: "section", label: "Tools" },
    { type: "text", md: `A CrewAI tool is a function with the \`@tool\` decorator. As in Chapter 6, **the docstring is the instruction the model reads**, and the type hints are the arguments. You saw \`get_doctor_schedule\` in the last lesson; the same file also has \`request_appointment\`, which creates a *request* for staff to approve, never a booking.

Give a tool only to the agents that need it. Here the scheduler gets the look-up; the writer gets none, so it cannot invent a look-up.` },
    { type: "section", label: "MCP tools" },
    { type: "text", md: `Chapter 16 built an MCP server for the clinic. In CrewAI an \`MCPServerAdapter\` starts it, lists its tools and wraps them as CrewAI tools. The \`with\` block shuts the server down afterwards, even if the crew fails.` },
    { type: "code", file: "code-samples/ch24/mcp_crew.py", lang: "python", code: "@ch24/mcp_crew.py",
      output: `tools from the server: ['get_doctor_schedule']
Dr Iyer sees orthopaedics patients on Tuesday.`,
      note: "From a test run: the Chapter 16 MCP server really started over stdio and answered the tool call; the model's side was a stand-in. In Chapter 16's server the log line goes to stderr, never stdout." },
    { type: "text", md: `Two safety habits from Chapter 17 carry over:

- **Name the tools you want** (\`MCPServerAdapter(params, "get_doctor_schedule")\`). The server also offers \`request_appointment\`, but this agent cannot call it.
- **Prefer read-only tools for a crew** and put any write behind a person's approval (next lessons).` },
    { type: "callout", kind: "warning", md: `**Install note.** In our tests CrewAI 1.15 required \`openai\` 2.x, while the rest of this course uses \`openai\` 3.x. Create a separate virtual environment for Chapter 24 and install \`ch24/requirements-crewai.txt\` there. Pinning one environment per framework is normal in production too.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "`@tool` + a clear docstring + type hints = a CrewAI tool.",
      "`MCPServerAdapter` turns any MCP server's tools into CrewAI tools; use `with` so the server closes.",
      "List tool names to give the agent only what it needs.",
      "Crews with conflicting dependencies get their own virtual environment."
    ]},
    { type: "quiz", title: "Knowledge check: tools and MCP", questions: [
      { kind: "mcq", q: "Why pass `\"get_doctor_schedule\"` to `MCPServerAdapter`?",
        options: ["It is required", "It limits the agent to that one tool, even though the server offers more", "It makes the tool faster", "It renames the tool"],
        answer: 1,
        why: ["Optional.", "Right: least privilege.", "No speed effect.", "No."] },
      { kind: "tf", q: "The writer agent in the basic crew should also get the schedule tool, \"just in case\".", answer: false,
        explain: " Extra tools invite extra calls and mistakes. Give each agent only what its role needs." }
    ]}
  ]},

  { title: "The hierarchical process", blocks: [
    { type: "section", label: "A manager decides" },
    { type: "text", md: `In a sequential crew **you** decide who does what. In a hierarchical crew a **manager** agent decides. You give the crew tasks *without* assigning agents; the manager reads each task, [[delegation|delegates]] to the specialists, checks what comes back and combines it. This is Chapter 22's supervisor pattern, built in.` },
    { type: "stepper", svg: HIER_SVG, caption: "The manager delegates and reviews.",
      steps: [
        { on: ["task"], text: "A **task with no agent**. In the sequential crew every task named its agent; here the manager chooses." },
        { on: ["mgr"], text: "The **manager** uses \`manager_llm\` (or a full \`manager_agent\` with its own role and rules). It gets two tools, \`delegate_work_to_coworker\` and \`ask_question_to_coworker\`." },
        { on: ["deleg"], text: "It delegates parts of the task to the **specialists**, who must have \`allow_delegation=False\` so they do not pass work around." },
        { on: ["back"], text: "Specialists reply to the manager, who checks the answers and writes the final result." }
      ]},
    { type: "code", file: "code-samples/ch24/hierarchical_crew.py", lang: "python", code: "@ch24/hierarchical_crew.py",
      output: `Dr Rao is in on Thursday. The OPD fee is Rs 100.`,
      note: "From a test run with stand-in models: the manager delegated to both desks, and the scheduling desk called its tool. The tool names delegate_work_to_coworker and ask_question_to_coworker are what CrewAI 1.15.35 sent to the model." },
    { type: "section", label: "Sequential or hierarchical?" },
    { type: "text", md: `| | Sequential | Hierarchical |
| --- | --- | --- |
| Who plans | You, in code | The manager model |
| Model calls | Fewer, predictable | More: the manager plans, delegates to each specialist, then reviews |
| Failure mode | A bad task order | The manager delegates wrongly or loops |
| Best for | Known pipelines (look up, then write) | Requests whose parts you cannot predict |

Our advice, as in Chapter 21: **start sequential**. Move to a manager only when a test set shows that fixed ordering cannot cover your requests. If you do, test the manager's choices the way Chapter 23 tests routing.` },
    { type: "deeper", title: "Flows: when you want more control", md: `CrewAI also has **Flows**: an event-driven layer where ordinary Python methods, marked with decorators like \`@start\`, \`@listen\` and \`@router\`, pass shared state between steps, and any step can run a whole crew. Think of it as CrewAI's answer to a LangGraph graph: use a Flow for the fixed skeleton (receive, classify, approve, send) and a crew inside it for the thinking parts. The chapter code does not use Flows; see CrewAI's documentation for the current API.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Hierarchical: no agent on the task; `manager_llm` decides and delegates.",
      "Specialists keep `allow_delegation=False`.",
      "A manager adds model calls; start sequential.",
      "Flows give a fixed skeleton around crews."
    ]},
    { type: "quiz", title: "Knowledge check: hierarchical", questions: [
      { kind: "mcq", q: "What is different about a Task in a hierarchical crew?",
        options: ["It has no description", "It has no agent assigned: the manager chooses who does it", "It cannot have expected_output", "It must be async"],
        answer: 1,
        why: ["It still needs one.", "Right.", "It still has one.", "No."] },
      { kind: "order", q: "Put a hierarchical run in order.",
        items: ["Crew starts with a task that has no agent", "Manager reads the task", "Manager delegates parts to specialists", "Specialists answer, using their tools", "Manager checks and combines the answers", "Crew returns the final result"] }
    ]}
  ]},

  { title: "Production: typed output, guardrails and limits", blocks: [
    { type: "section", label: "Four controls" },
    { type: "text", md: `A crew that works in a demo is not a crew you can leave running. Four CrewAI settings do what Chapters 6, 15 and 21 asked for:

1. **\`output_pydantic\`**: the task must return a typed object, so code can rely on it (Chapter 6).
2. **\`guardrail\`**: plain Python that accepts or rejects the result. A rejection message goes back to the agent so it can fix the answer, up to \`guardrail_max_retries\` times.
3. **\`human_input=True\`**: a person reviews the result.
4. **Limits**: \`max_iter\`, \`max_execution_time\`, \`max_retry_limit\` on the agent.` },
    { type: "code", file: "code-samples/ch24/guarded_crew.py", lang: "python", code: "@ch24/guarded_crew.py",
      output: `{'intent': 'schedule', 'reply': 'Dr Rao sees cardiology patients on Thursday and Friday. Please call the front desk to book.', 'needs_human': False}`,
      note: "From a test run with stand-in models. The first stand-in answer contained \"You should take 2 tablets daily\"; the guardrail rejected it, CrewAI sent the rejection message back, and the second answer passed. The guardrail, the validation and the retry are real CrewAI 1.15.35 behaviour." },
    { type: "text", md: `Things this code taught us while testing:

- **The guardrail's return type must be exactly \`Tuple[bool, Any]\`.** CrewAI checks the annotation and refuses anything else, such as \`tuple[bool, object]\`.
- **Guardrails are your safety rules in code.** The model is *asked* not to give medical advice; the guardrail *checks* that it did not. Ask and check, as in Chapter 33.
- **\`human_input=True\` asks again on every attempt.** In our run it paused after each attempt, including ones the guardrail went on to reject. For unattended runs set it to \`False\`; for review, send the *final* output to a queue (Chapter 15's approval pattern).` },
    { type: "section", label: "Running it for real" },
    { type: "list", items: [
      "**Cost:** log token usage for every run and alert on spikes (Chapter 21). Cross-check CrewAI's numbers with your provider's usage page.",
      "**Tracing:** CrewAI emits events; connect Langfuse, LangSmith or OpenTelemetry to see each agent's calls (Chapter 10).",
      "**Check telemetry before real data:** CrewAI has built-in usage telemetry that you can switch off with environment variables (our tests set \`CREWAI_DISABLE_TELEMETRY=true\` and \`OTEL_SDK_DISABLED=true\`). Read its documentation against your privacy rules before you use real patient data.",
      "**Test per agent first:** run each agent's task alone with a test set (Chapter 9) before testing the whole crew.",
      "**Pin the version.** CrewAI changes quickly; this chapter was tested with 1.15.35."
    ]},
    { type: "list", style: "mistakes", items: [
      "**Trusting the prompt alone to stop unsafe replies.** Add a guardrail.",
      "**Hierarchical by default.** It doubles calls for requests a fixed order could handle.",
      "**Agents with `allow_delegation=True` everywhere.** Tasks bounce between agents.",
      "**No `max_iter` or time limit.** One stuck agent spends the budget."
    ]},
    { type: "section", label: "CrewAI or LangGraph?" },
    { type: "text", md: `Both build the same patterns. **CrewAI** is quicker to write when the system reads naturally as roles and tasks. **LangGraph** gives you explicit state, checkpoints and interrupts, so it suits long-running, approval-heavy systems. Many teams prototype in CrewAI and move the critical path to a graph, or run crews inside a Flow. Chapter 27 builds the capstone so you can compare.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "`output_pydantic` + `guardrail` = typed output that code checks before anyone sees it.",
      "The guardrail must return `Tuple[bool, Any]`.",
      "Use `human_input` for review sessions, not for unattended runs.",
      "Set `max_iter` and time limits; log token usage; pin the version."
    ]},
    { type: "quiz", title: "Knowledge check: production", questions: [
      { kind: "mcq", q: "The reply says \"take 2 tablets daily\". What happens with the guardrail in `guarded_crew.py`?",
        options: ["Nothing: it is only a warning", "The guardrail returns False with a message; the agent retries up to `guardrail_max_retries` times", "The crew stops immediately and deletes the output", "The patient gets the reply anyway"],
        answer: 1,
        why: ["It is enforced.", "Right.", "It retries first, then fails the task if it still fails.", "The reply is blocked."] },
      { kind: "tf", q: "Setting `human_input=True` is the best way to review replies in an unattended nightly run.", answer: false,
        explain: " It pauses for a person on each attempt. For unattended runs use a guardrail and a review queue." },
      { kind: "match", q: "Match each control to the risk it reduces.",
        pairs: [["output_pydantic", "Replies in an unpredictable shape"], ["guardrail", "Replies that break a clinic rule"], ["max_iter / max_execution_time", "An agent that never stops"]] }
    ]}
  ]}

  ]
};
})();
