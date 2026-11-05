/* Chapter 13 · LangChain agents and tools */
(function () {

var AGENT_SVG = `
<svg viewBox="0 0 680 290" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch13-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="in"><rect class="dg-box" x="10" y="110" width="100" height="56" rx="10"/><text class="dg-title" x="60" y="134" text-anchor="middle">Messages</text><text class="dg-muted" x="60" y="152" text-anchor="middle">+ thread id</text></g>
  <g data-step="mw"><rect class="dg-box amber" x="150" y="30" width="380" height="36" rx="8"/><text class="dg-text" x="340" y="53" text-anchor="middle">Middleware: before_model · after_model · wrap_tool_call</text></g>
  <g data-step="model"><rect class="dg-box accent" x="170" y="100" width="140" height="76" rx="10"/><text class="dg-title" x="240" y="132" text-anchor="middle">model node</text><text class="dg-muted" x="240" y="152" text-anchor="middle">call the LLM</text></g>
  <g data-step="tools"><rect class="dg-box" x="380" y="100" width="140" height="76" rx="10"/><text class="dg-title" x="450" y="132" text-anchor="middle">tools node</text><text class="dg-muted" x="450" y="152" text-anchor="middle">run requested tools</text></g>
  <g data-step="out"><rect class="dg-box" x="570" y="110" width="100" height="56" rx="10"/><text class="dg-title" x="620" y="142" text-anchor="middle">Answer</text></g>
  <path class="dg-line" d="M110 138H168" marker-end="url(#ch13-a)"/>
  <path class="dg-line" d="M310 122H378" marker-end="url(#ch13-a)"/><text class="dg-muted" x="344" y="114" text-anchor="middle">tool calls</text>
  <path class="dg-line" d="M378 160H312" marker-end="url(#ch13-a)"/><text class="dg-muted" x="344" y="178" text-anchor="middle">results</text>
  <path class="dg-line" d="M240 176V214H600V168" marker-end="url(#ch13-a)"/><text class="dg-muted" x="420" y="208" text-anchor="middle">no tool calls: done</text>
  <g data-step="ckpt"><rect class="dg-box" x="150" y="236" width="380" height="36" rx="8"/><text class="dg-text" x="340" y="259" text-anchor="middle">Checkpointer: saves state after every step (pause, resume, memory)</text></g>
</svg>`;

window.COURSE.chapters.ch13 = {
  id: "ch13",
  title: "LangChain agents and tools",
  oneLine: "create_agent gives you the Chapter 9 agent loop ready-made, and middleware gives you the harness: limits, retries, privacy filters and human approval, each in one line.",
  lessons: [

  { title: "Your first LangChain agent", blocks: [
    { type: "section", label: "The loop you already built" },
    { type: "text", md: `In Chapter 9 you wrote about 60 lines for the agent loop: call the model, check for tool calls, run them, append results, repeat, stop at a limit. LangChain's \`create_agent\` is that loop, tested and maintained for you.

First, the tools. The \`@tool\` decorator turns a Python function into a LangChain tool. It builds the [[tool schema]] from the function name, the type hints and the **docstring**, which becomes the description the model reads.` },
    { type: "code", file: "code-samples/ch13/clinic_tools.py", lang: "python", code: "@ch13/clinic_tools.py",
      note: "The tools call the same plain functions as Chapter 9 (`ch09/clinic.py`), so the behaviour is identical." },
    { type: "code", file: "code-samples/ch13/agent_basic.py", lang: "python", code: "@ch13/agent_basic.py",
      output: `human  -> Is any cardiologist free on Thursday?
model  -> call get_doctor_schedule({'department': 'cardiology'})
tool   -> {"department": "cardiology", "doctors": {"Dr Mehta": ["Mon", "Wed"], "Dr Rao": ["Thu", "Fri"]}}
ai     -> Yes, Dr Rao (cardiology) sees patients on Thursday and Friday.

Tool schema the model saw:
{'description': "Look up which doctors in a hospital department see patients on which weekdays.
Use this before answering any question about a doctor's availability.",
 'properties': {'department': {'description': 'Department name, for example cardiology.', 'type': 'string'}},
 'required': ['department'], 'title': 'get_doctor_schedule', 'type': 'object'}`,
      note: "Output from a test run with a stand-in model. We also ran this agent with the real `ChatOpenAI` and `ChatAnthropic` classes against recorded API responses: the requests were exactly the Chapter 9 JSON shapes (`role: tool` for OpenAI, a `tool_result` block for Anthropic)." },
    { type: "stepper", svg: AGENT_SVG, caption: "Inside create_agent: a small LangGraph graph with two nodes.",
      steps: [
        { on: ["in"], text: "You send a list of **messages**. With a checkpointer you also send a **thread id**, so the agent remembers the conversation." },
        { on: ["model"], text: "The **model node** calls the LLM with the system prompt, the history and the tool schemas. This is the *reason* step of Chapter 9." },
        { on: ["tools"], text: "If the reply has tool calls, the **tools node** runs them (several in parallel if asked) and adds a \`ToolMessage\` per result. Then back to the model." },
        { on: ["out"], text: "A reply with **no tool calls** is the final answer. The full history is returned in \`result[\"messages\"]\`." },
        { on: ["mw"], text: "**Middleware** hooks run around each model call and tool call. This is where the harness from Chapter 9 lives (Lesson 4)." },
        { on: ["ckpt"], text: "A **checkpointer** saves the state after every step, which enables memory, pausing for approval and resuming (Chapter 14)." }
      ]},
    { type: "text", md: `| Chapter 9 (by hand) | create_agent |
| --- | --- |
| \`messages = [system, ...history, user]\` | \`system_prompt=\` and \`{"messages": [...]}\` |
| \`TOOL_DOCS\` converted per provider | \`@tool\` builds schemas for any provider |
| \`for _ in range(MAX_STEPS)\` | \`ModelCallLimitMiddleware\` (Lesson 4); a default recursion limit also stops runaway loops |
| \`run_tool\` catching errors | Tool error handling (Lesson 2) |
| Approval before writes | \`HumanInTheLoopMiddleware\` (Lesson 4) |
| \`save_trace\` | Callbacks, LangSmith or Langfuse |` },
    { type: "callout", kind: "tip", md: `Because you built the loop yourself, you can now debug this one. When a LangChain agent misbehaves, print \`result["messages"]\` and read it like the trace in Chapter 9: what did the model ask for, what did the tool return, what did the model do next?` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "`create_agent(model, tools, system_prompt)` is the Chapter 9 loop, ready-made.",
      "`@tool` builds the schema from the name, type hints and docstring.",
      "The result contains the full message history: read it to debug.",
      "Inside, it is a two-node LangGraph graph with middleware and an optional checkpointer."
    ]},
    { type: "quiz", title: "Knowledge check: create_agent", questions: [
      { kind: "mcq", q: "Where does the tool description the model reads come from when you use `@tool`?",
        options: ["The function's return value", "The function's docstring", "The variable name", "LangChain writes one"],
        answer: 1,
        why: ["Return values are results, not descriptions.", "Right, so write docstrings for the model.", "Only the function name is used, as the tool name.", "It does not invent descriptions."] },
      { kind: "tf", q: "When the model's reply contains no tool calls, create_agent treats it as the final answer.", answer: true,
        explain: " Exactly the stop rule from Chapter 9." }
    ]}
  ]},

  { title: "Tools in depth", blocks: [
    { type: "section", label: "Three ways to make a tool" },
    { type: "text", md: `1. **\`@tool\`** on a function. Quickest. Add \`parse_docstring=True\` and Google-style \`Args:\` lines to describe each argument.
2. **A Pydantic \`args_schema\`.** Exact rules for each argument: allowed values, patterns, lengths. Bad arguments are rejected **before** your code runs.
3. **\`StructuredTool.from_function\`.** Wrap an existing function without changing it, and set the name, description and error handling yourself.` },
    { type: "code", file: "code-samples/ch13/tools_deep.py", lang: "python", code: "@ch13/tools_deep.py",
      output: `Valid call:      {'request_id': 'REQ-001', 'doctor': 'Dr Rao', 'department': 'cardiology', 'day': 'Thu', 'patient_name': 'Asha Verma', 'status': 'pending staff approval'}
Wrong day:       Dr Rao does not see patients on Mon. Available days: Thu, Fri.
Invalid args:    Invalid arguments: doctor: String should match pattern '^Dr [A-Z][a-z]+$'; day: Input should be 'Mon', 'Tue', 'Wed', 'Thu', 'Fri' or 'Sat'; patient_name: String should have at least 2 characters
Docstring tool:  Rs 0 (free follow-up)

Schema sent to the model for opd_fee:
{'description': 'Work out the OPD fee for a visit.', 'properties': {'visit': {'description': 'Whether this
is a new visit or a follow-up.', 'enum': ['new', 'follow-up'], ...}, 'days_since_last': {'default': 0, ...}},
'required': ['visit'], 'title': 'opd_fee', 'type': 'object'}`,
      note: "Real output: these tools run without a model." },
    { type: "text", md: `Look at the two error lines. Neither crashed the program. With \`handle_tool_error\` and \`handle_validation_error\`, the error text becomes the **tool result**, so the agent reads "Available days: Thu, Fri" and can fix its next call. This is Chapter 8's rule, "errors are observations", built in.

Make error messages **useful to the model**: the default validation message is just "Tool input validation error", which gives the model nothing to fix. The \`explain_bad_args\` function turns it into a list of exact problems.` },

    { type: "section", label: "Ready-made tools" },
    { type: "text", md: `LangChain has hundreds of integrations. Three you will meet often:` },
    { type: "code", file: "code-samples/ch13/builtin_tools.py", lang: "python", code: "@ch13/builtin_tools.py",
      note: "Needs internet, a Tavily API key and the extra packages listed at the top. Not run in our offline tests; imports checked with langchain-tavily 0.2.18." },
    { type: "text", md: `| Tool | Good for | Watch out |
| --- | --- | --- |
| **Tavily search** | Current web facts, with source URLs | Restrict \`include_domains\` for health topics; web text can contain [[prompt injection]] |
| **Wikipedia** | Background facts | Not a clinical source |
| **Python REPL** | Calculations, data analysis | Runs any code the model writes. Never with untrusted input; use a sandbox |` },
    { type: "callout", kind: "warning", md: `A tool's power is the agent's power. Before adding any tool, ask: "If a patient's message tricked the model, what is the worst this tool could do?" Give read-only tools freely, give write tools only with approval (Lesson 4), and never give general code execution to a public-facing agent.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "`@tool`, Pydantic `args_schema` and `StructuredTool` cover every case.",
      "Pydantic rules reject bad arguments before your code runs.",
      "Turn errors into clear tool results so the model can correct itself.",
      "Judge every tool by the worst thing it could do if the model is tricked."
    ]},
    { type: "quiz", title: "Knowledge check: tools", questions: [
      { kind: "mcq", q: "The model calls `request_appointment` with day \"Sunday\". With `args_schema` and `handle_validation_error` set, what happens?",
        options: ["The program crashes", "The function runs and books Sunday", "The model receives an error message listing the allowed days, and can retry", "LangChain silently changes it to Monday"],
        answer: 2,
        why: ["The error is handled.", "Validation runs before the function.", "Right.", "It never changes arguments silently."] },
      { kind: "tf", q: "A Python REPL tool is safe for a public patient chatbot if the system prompt says \"only do calculations\".", answer: false,
        explain: " Prompts can be overridden by prompt injection. Code execution needs a sandbox, not a polite instruction." }
    ]}
  ]},

  { title: "A SQL agent", blocks: [
    { type: "section", label: "Questions about your own data" },
    { type: "text", md: `The operations manager asks: "Which doctor had the most no-shows?" The answer is in the appointments database. A **SQL agent** looks at the table structure, writes a query, runs it, reads the result or the error, and answers.

The risk is obvious: a model writing SQL against a hospital database. The safety must come from the **database connection**, not from asking the model nicely.` },
    { type: "code", file: "code-samples/ch13/sql_agent.py", lang: "python", code: "@ch13/sql_agent.py",
      output: `Write attempt blocked: Error: only a single SELECT statement is allowed.
Database refuses writes too: attempt to write a readonly database
model -> describe_tables {}
tool  -> CREATE TABLE appointments (id INTEGER PRIMARY KEY, doctor TEXT, department TEXT, day TEXT, status TEXT ...
model -> run_sql {'query': "SELECT doctor, COUNT(*) AS no_shows FROM appointment WHERE status='no_show' GROUP BY doctor ORDER BY no_shows DESC"}
tool  -> SQL error: no such table: appointment. Check the column names with describe_tables and try again.
model -> run_sql {'query': "SELECT doctor, COUNT(*) AS no_shows FROM appointments WHERE status='no_show' GROUP BY doctor ORDER BY no_shows DESC"}
tool  -> doctor | no_shows / Dr Rao | 6 / Dr Khan | 5 / Dr Mehta | 4 / Dr Iyer | 4
answer-> Dr Rao had the most no-shows (6). SQL: SELECT doctor, COUNT(*) ... WHERE status='no_show' GROUP BY doctor ORDER BY 2 DESC`,
      note: "From a test run with a stand-in model that made a typo on purpose. The database, the tools and the query results are real." },
    { type: "text", md: `The run shows the pattern working: the model misspelled the table, the tool returned a **helpful error**, and the model fixed the query. Now the safety layers, from strongest to weakest:

| Layer | In the code | Why |
| --- | --- | --- |
| Read-only connection | \`mode=ro\` in the SQLite URI | The database itself refuses writes, whatever the SQL says |
| Restricted data | The table has no patient names | The agent cannot leak what it cannot see. In real systems, give it a database user that can only read specific views |
| One SELECT only | Checks in \`run_sql\` | Stops stacked statements like \`SELECT …; DROP …\` |
| Row cap | \`MAX_ROWS = 50\` | Stops huge dumps and huge token bills |
| Prompt instructions | System prompt | Helps the model behave, but is the weakest layer |` },
    { type: "deeper", title: "LangChain's ready-made SQL toolkit", md: `\`langchain_community\` has \`SQLDatabase\` and \`SQLDatabaseToolkit\`, which give an agent four tools: list tables, get schema, check a query, run a query. It works with any database SQLAlchemy supports:

\`\`\`python
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import SQLDatabaseToolkit
db = SQLDatabase.from_uri("postgresql://helpdesk_readonly@db/clinic", include_tables=["appointment_stats"])
tools = SQLDatabaseToolkit(db=db, llm=model).get_tools()
\`\`\`

The same rule applies: connect with a **read-only database user** that can see only the tables or views it needs. Chapter 41 connects coding agents to databases through MCP with the same principle.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "A SQL agent reads the schema, writes SQL, and fixes it from error messages.",
      "Real safety comes from a read-only connection and limited data, not the prompt.",
      "Limit to single SELECT statements and cap the rows returned."
    ]},
    { type: "quiz", title: "Knowledge check: SQL agent", questions: [
      { kind: "order", q: "Put the safety layers from strongest to weakest.",
        items: ["Read-only database connection", "Agent can only see non-identifying tables or views", "Code check: single SELECT, row cap", "System prompt instructions"] },
      { kind: "mcq", q: "The model's query fails with \"no such table: appointment\". What should the tool do?",
        options: ["Raise an exception and stop the agent", "Return the error message so the model can fix the query", "Guess the right table and run it", "Return an empty result"],
        answer: 1,
        why: ["Stopping wastes a fixable mistake.", "Right: errors are observations.", "Guessing hides problems.", "An empty result would mislead the model into answering \"none\"."] }
    ]}
  ]},

  { title: "Production: middleware, approval and streaming", blocks: [
    { type: "section", label: "The harness, as middleware" },
    { type: "text", md: `Chapter 9's harness had budgets, retries, approval, hooks and privacy rules. In LangChain each of these is a **[[middleware]]** object you add to the list. Middleware runs at fixed points: before and after each model call, and around each tool call.` },
    { type: "code", file: "code-samples/ch13/agent_production.py", lang: "python", code: "@ch13/agent_production.py",
      output: `PIIMiddleware[email].before_model: Book Dr Rao on Thursday for Asha Verma. My email is [REDACTED_EMAIL] and phone 9876543210.
PIIMiddleware[phone].before_model: Book Dr Rao on Thursday for Asha Verma. My email is [REDACTED_EMAIL] and phone ****3210.
  [hook] model call with 1 messages in history
model: [{'name': 'get_doctor_schedule', 'args': {'department': 'cardiology'}, ...}]
tools: {"department": "cardiology", "doctors": {"Dr Mehta": ["Mon", "Wed"], "Dr Rao": ["Thu", "Fri"]}}
  [hook] model call with 3 messages in history
model: [{'name': 'request_appointment', 'args': {'doctor': 'Dr Rao', 'day': 'Thu', 'patient_name': 'Asha Verma'}, ...}]
PAUSED for approval: request_appointment({'doctor': 'Dr Rao', 'day': 'Thu', 'patient_name': 'Asha Verma'})

What the model received: Book Dr Rao on Thursday for Asha Verma. My email is [REDACTED_EMAIL] and phone ****3210.

Staff approves...
  [hook] model call with 5 messages in history
Final: Done: I've requested Dr Rao on Thursday for Asha Verma. Staff will confirm.`,
      note: "From a test run with a stand-in model; the middleware, pause and resume are real (langchain 1.4.8, langgraph 1.2.19)." },
    { type: "text", md: `Read the run carefully:

1. **PII middleware** rewrote the message **before** the model saw it: the email was redacted and the phone number masked. The model never received them.
2. The read tool ran freely. The **write tool paused** the whole agent and returned an \`__interrupt__\` with the exact action for review.
3. The state was saved by the **checkpointer** under \`thread_id\`. The approval could come minutes later, from a different web request.
4. \`Command(resume={"decisions": [{"type": "approve"}]})\` continued from exactly where it stopped. A reviewer could instead send \`{"type": "reject", "message": "Dr Rao is on leave"}\` or \`{"type": "edit", "edited_action": {...}}\`.` },
    { type: "text", md: `| Middleware | Chapter 9 harness part |
| --- | --- |
| \`ModelCallLimitMiddleware(run_limit=6)\` | Step budget |
| \`ToolCallLimitMiddleware(tool_name=..., run_limit=1)\` | Per-tool limits (no double bookings) |
| \`ModelRetryMiddleware\`, \`ToolRetryMiddleware\` | Retries with backoff |
| \`ModelFallbackMiddleware(backup_model)\` | Switch model on failure |
| \`HumanInTheLoopMiddleware(interrupt_on={...})\` | Approval before write actions |
| \`PIIMiddleware(type, strategy=redact/mask/hash/block)\` | Privacy filter |
| \`SummarizationMiddleware\` | Trimming long histories (Chapter 10) |
| \`@before_model\`, \`@after_model\`, \`@wrap_tool_call\` | Your own hooks: logging, guards, metrics |` },
    { type: "callout", kind: "warning", md: `The built-in PII detectors cover emails, card numbers, IP and MAC addresses and URLs. Indian phone numbers, Aadhaar-style IDs, UHIDs and names need **your own detectors** (a regex as in the code, or a tool like Presidio in Chapter 33). Test them with real-looking samples before trusting them.` },
    { type: "section", label: "Streaming steps" },
    { type: "text", md: `\`agent.stream(input, config, stream_mode="updates")\` yields one update per step, so a UI can show "Checking the schedule…" while the agent works. Other modes: \`"values"\` (the full state after each step) and \`"messages"\` (the model's text token by token).` },
    { type: "deeper", title: "AgentExecutor and older agent code", md: `Tutorials before late 2025 use \`create_tool_calling_agent\` + \`AgentExecutor\`, or \`create_react_agent\`. These still work but are **legacy**, moved to \`langchain_classic.agents\`. Mapping:

| Old | New |
| --- | --- |
| \`AgentExecutor(agent, tools, max_iterations=5)\` | \`create_agent(model, tools, middleware=[ModelCallLimitMiddleware(run_limit=5)])\` |
| \`handle_parsing_errors=True\` | Tool error handling + \`ToolRetryMiddleware\` |
| \`return_intermediate_steps=True\` | Read \`result["messages"]\` |
| \`memory=ConversationBufferMemory()\` | \`checkpointer=InMemorySaver()\` + \`thread_id\` |` },
    { type: "list", style: "mistakes", items: [
      "**Approval without a checkpointer.** The agent cannot pause and resume without saved state.",
      "**Reusing one `thread_id` for every user.** Conversations mix. Use one id per conversation.",
      "**Trusting built-in PII detection for Indian identifiers.** Add and test your own detectors.",
      "**No model-call limit.** A confused agent can loop until the default recursion limit, costing money each step."
    ]},
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Middleware is the harness: limits, retries, fallbacks, approval, privacy and hooks.",
      "Human approval pauses the agent; a checkpointer lets it resume later with `Command(resume=...)`.",
      "Reviewers can approve, reject with a reason, or edit the action.",
      "`stream_mode=\"updates\"` shows progress step by step."
    ]},
    { type: "quiz", title: "Knowledge check: production agents", questions: [
      { kind: "match", q: "Match each requirement to the middleware.",
        pairs: [["Never send patient emails to the model", "PIIMiddleware"], ["Staff must approve every booking", "HumanInTheLoopMiddleware"], ["Stop after 6 model calls", "ModelCallLimitMiddleware"], ["Only one booking per run", "ToolCallLimitMiddleware"]] },
      { kind: "mcq", q: "Why does `HumanInTheLoopMiddleware` need a checkpointer?",
        options: ["To speed up the model", "To save the agent's state so it can resume after the approval arrives", "To store API keys", "To count tokens"],
        answer: 1,
        why: ["No effect on speed.", "Right.", "Keys belong in environment variables.", "Callbacks count tokens."] }
    ]}
  ]}

  ]
};
})();
