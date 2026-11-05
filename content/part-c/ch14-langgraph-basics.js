/* Chapter 14 · LangGraph basics */
(function () {

var ROUTER_SVG = `
<svg viewBox="0 0 680 300" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch14-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="start"><rect class="dg-box" x="20" y="126" width="80" height="44" rx="22"/><text class="dg-text" x="60" y="153" text-anchor="middle">START</text></g>
  <g data-step="safety"><rect class="dg-box amber" x="140" y="118" width="130" height="60" rx="10"/><text class="dg-title" x="205" y="144" text-anchor="middle">safety_check</text><text class="dg-muted" x="205" y="162" text-anchor="middle">code, no model</text></g>
  <g data-step="classify"><rect class="dg-box accent" x="320" y="188" width="120" height="60" rx="10"/><text class="dg-title" x="380" y="214" text-anchor="middle">classify</text><text class="dg-muted" x="380" y="232" text-anchor="middle">model</text></g>
  <g data-step="emerg"><rect class="dg-box" x="320" y="40" width="120" height="50" rx="10"/><text class="dg-title" x="380" y="70" text-anchor="middle">emergency</text></g>
  <g data-step="leaves"><rect class="dg-box accent" x="490" y="150" width="110" height="46" rx="10"/><text class="dg-title" x="545" y="178" text-anchor="middle">answer</text>
    <rect class="dg-box" x="490" y="226" width="110" height="46" rx="10"/><text class="dg-title" x="545" y="254" text-anchor="middle">handoff</text></g>
  <g data-step="end"><rect class="dg-box" x="590" y="44" width="76" height="44" rx="22"/><text class="dg-text" x="628" y="71" text-anchor="middle">END</text></g>
  <path class="dg-line" d="M100 148H138" marker-end="url(#ch14-a)"/>
  <path class="dg-accent-line" d="M270 136L318 72" marker-end="url(#ch14-a)"/><text class="dg-muted" x="262" y="96">urgent</text>
  <path class="dg-accent-line" d="M270 162L318 210" marker-end="url(#ch14-a)"/><text class="dg-muted" x="262" y="208">else</text>
  <path class="dg-accent-line" d="M440 208L488 178" marker-end="url(#ch14-a)"/><path class="dg-accent-line" d="M440 228L488 246" marker-end="url(#ch14-a)"/>
  <path class="dg-line" d="M440 66H588" marker-end="url(#ch14-a)"/>
  <path class="dg-line" d="M600 160L622 90" marker-end="url(#ch14-a)"/><path class="dg-line" d="M610 236Q660 200 640 90" marker-end="url(#ch14-a)"/>
  <text class="dg-muted" x="20" y="290">Solid arrows: fixed edges. Highlighted arrows: conditional edges chosen by a function.</text>
</svg>`;

var AGENT_SVG = `
<svg viewBox="0 0 680 200" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch14-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="start"><rect class="dg-box" x="20" y="76" width="80" height="44" rx="22"/><text class="dg-text" x="60" y="103" text-anchor="middle">START</text></g>
  <g data-step="model"><rect class="dg-box accent" x="160" y="64" width="140" height="68" rx="10"/><text class="dg-title" x="230" y="94" text-anchor="middle">model</text><text class="dg-muted" x="230" y="114" text-anchor="middle">reason</text></g>
  <g data-step="cond"><rect class="dg-box amber" x="340" y="80" width="130" height="36" rx="8"/><text class="dg-text" x="405" y="103" text-anchor="middle">tools_condition</text></g>
  <g data-step="tools"><rect class="dg-box" x="330" y="150" width="150" height="40" rx="10"/><text class="dg-title" x="405" y="175" text-anchor="middle">tools (ToolNode)</text></g>
  <g data-step="end"><rect class="dg-box" x="560" y="76" width="80" height="44" rx="22"/><text class="dg-text" x="600" y="103" text-anchor="middle">END</text></g>
  <path class="dg-line" d="M100 98H158" marker-end="url(#ch14-b)"/><path class="dg-line" d="M300 98H338" marker-end="url(#ch14-b)"/>
  <path class="dg-accent-line" d="M470 98H558" marker-end="url(#ch14-b)"/><text class="dg-muted" x="514" y="88" text-anchor="middle">no tool calls</text>
  <path class="dg-accent-line" d="M405 116V148" marker-end="url(#ch14-b)"/>
  <path class="dg-line" d="M330 170H230V134" marker-end="url(#ch14-b)"/><text class="dg-muted" x="270" y="164" text-anchor="middle">results</text>
  <text class="dg-muted" x="20" y="30">The Chapter 9 loop as a graph: the cycle model → tools → model is the loop.</text>
</svg>`;

window.COURSE.chapters.ch14 = {
  id: "ch14",
  title: "LangGraph basics",
  oneLine: "LangGraph lets you draw your agent as a graph: shared state, nodes that do work, and edges that decide what runs next. You control every step and can pause, resume and remember.",
  lessons: [

  { title: "State, nodes and edges", blocks: [
    { type: "section", label: "Why a graph?" },
    { type: "text", md: `A chain (Chapter 12) always runs the same steps in the same order. An agent from \`create_agent\` (Chapter 13) lets the model decide everything. Real systems usually need something in between:

- "Check for emergency words **in code first**, and only then ask the model."
- "If the request is about billing, go to the billing team's flow."
- "Try again at most three times, then hand over to a person."

[[langgraph|LangGraph]] lets you write exactly that as a **graph**: boxes (nodes) joined by arrows (edges), some of which choose a path. It is made by the LangChain team and works with or without LangChain. \`create_agent\` is itself built on it.` },
    { type: "callout", kind: "analogy", md: `A hospital's patient-flow chart: registration → triage → (emergency | OPD | pharmacy). Each box is a desk that does one job; the arrows say where the patient goes next; the patient's file travels with them and every desk adds to it. In LangGraph the desks are **nodes**, the arrows are **edges**, and the file is the **state**.` },
    { type: "text", md: `Three ideas are all you need:

| Idea | What it is | In code |
| --- | --- | --- |
| **[[graph state|State]]** | A shared dict every node can read | A \`TypedDict\` listing the keys |
| **Node** | A function: state in, **only the changed keys** out | \`def classify(state) -> dict\` |
| **Edge** | What runs next | \`add_edge(a, b)\` fixed, or \`add_conditional_edges(a, fn)\` where \`fn\` returns the next node's name |` },
    { type: "stepper", svg: ROUTER_SVG, caption: "The helpdesk router built in the code below.",
      steps: [
        { on: ["start"], text: "\`START\` is where every run begins. You pass the starting state: \`{\"message\": \"…\"}\`." },
        { on: ["safety"], text: "\`safety_check\` is plain Python: it looks for emergency words. **No model call**, so it is free, instant and testable." },
        { on: ["emerg"], text: "A **conditional edge** reads the state: if the intent is \`emergency\`, go straight to the fixed emergency reply." },
        { on: ["classify"], text: "Otherwise the model classifies the message into schedule, billing or other, using structured output." },
        { on: ["leaves"], text: "A second conditional edge: known topics go to \`answer\`; anything else goes to \`handoff\` for a person." },
        { on: ["end"], text: "Every path ends at \`END\`. \`graph.invoke\` returns the final state." }
      ]},
    { type: "code", file: "code-samples/ch14/graph_basics.py", lang: "python", code: "@ch14/graph_basics.py",
      output: `Which days does Dr Rao see patients?
  path:  safety_check -> classify -> answer
  reply: Dr Rao sees patients on Thursday and Friday.

My mother has chest pain
  path:  safety_check -> emergency
  reply: Please go to Emergency now or call 108.

Can I bring my dog?
  path:  safety_check -> classify -> handoff
  reply: I'll pass this to our front desk (1800-000-000).

graph TD;
	__start__ --> safety_check;
	classify -.-> answer;
	classify -.-> handoff;
	safety_check -.-> classify;
	safety_check -.-> emergency;
	... (Mermaid text, trimmed)`,
      note: "From a test run with a stand-in model. The emergency path made no model call at all. Tested with langgraph 1.2.19." },
    { type: "text", md: `Points to notice:

1. **Nodes return only what they change.** \`safety_check\` returns \`{"intent": …, "route": […]}\`; LangGraph merges it into the state.
2. **Routing functions return a node name.** The \`Literal[...]\` type hint tells LangGraph which nodes are possible, so it can draw the graph.
3. **\`draw_mermaid()\`** prints the graph as Mermaid text. Paste it into mermaid.live to see the picture: a quick check that you wired what you meant.
4. **The graph is the documentation.** A reviewer can see from the drawing that emergencies never reach the model.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "State is a shared dict; nodes return only the keys they change.",
      "Fixed edges always go to the same node; conditional edges call a function to choose.",
      "Put cheap, reliable checks in code nodes before model nodes.",
      "`draw_mermaid()` shows what you actually wired."
    ]},
    { type: "quiz", title: "Knowledge check: graph basics", questions: [
      { kind: "match", q: "Match each LangGraph idea to the hospital analogy.",
        pairs: [["State", "The patient's file that travels with them"], ["Node", "A desk that does one job"], ["Conditional edge", "Triage deciding where the patient goes next"], ["END", "The patient leaves"]] },
      { kind: "mcq", q: "A node only needs to set `reply`. What should it return?",
        options: ["The whole state with reply changed", "`{\"reply\": \"...\"}`", "A string", "Nothing; it should edit the state in place"],
        answer: 1,
        why: ["It works, but returning everything risks overwriting other keys by mistake.", "Right: only the changed keys.", "Nodes return a dict of updates.", "Editing in place is not how LangGraph tracks changes."] },
      { kind: "tf", q: "In the router, a message about chest pain costs one model call.", answer: false,
        explain: " The code node catches it first and routes straight to the emergency reply: zero model calls." }
    ]}
  ]},

  { title: "Reducers and the agent loop as a graph", blocks: [
    { type: "section", label: "When nodes add rather than replace" },
    { type: "text", md: `By default, a node's update **replaces** a key. That is wrong for a conversation: when the model node returns its new message, you want it **added** to the history, not to replace it.

A **[[reducer]]** is a rule for merging an update into a key. You attach it with \`Annotated\`:

| Declaration | Update behaviour |
| --- | --- |
| \`reply: str\` | Replace (the default) |
| \`findings: Annotated[list, operator.add]\` | Append lists together |
| \`messages: Annotated[list, add_messages]\` | Append messages; a message with an existing id **replaces** that one |

\`MessagesState\` is a ready-made state with just \`messages\` and the \`add_messages\` reducer. It is what most agents use.` },
    { type: "stepper", svg: AGENT_SVG, caption: "An agent graph: two nodes and one cycle.",
      steps: [
        { on: ["start"], text: "The run starts with the user's message in \`messages\`." },
        { on: ["model"], text: "The **model** node sends the system prompt and history to the LLM with the tools bound, and returns the reply. \`add_messages\` appends it." },
        { on: ["cond"], text: "\`tools_condition\` is a ready-made routing function: if the last message has tool calls, go to \`tools\`; otherwise go to \`END\`." },
        { on: ["tools"], text: "\`ToolNode\` runs every requested tool and appends one \`ToolMessage\` per result. Then the fixed edge goes back to the model. This cycle **is** the agent loop." },
        { on: ["end"], text: "When the model answers without tool calls, the run ends." }
      ]},
    { type: "code", file: "code-samples/ch14/graph_agent.py", lang: "python", code: "@ch14/graph_agent.py",
      output: `[model] [{'name': 'get_doctor_schedule', 'args': {'department': 'orthopaedics'}, ...}]
[tools] {"department": "orthopaedics", "doctors": {"Dr Iyer": ["Tue", "Thu"]}}
[model] [{'name': 'request_appointment', 'args': {'doctor': 'Dr Iyer', 'day': 'Wed', 'patient_name': 'Ravi Kumar'}, ...}]
[tools] {"error": "Dr Iyer does not see patients on Wed.", "available_days": ["Tue", "Thu"]}
[model] Dr Iyer doesn't see patients on Wednesday; he works Tuesday and Thursday. Shall I request Thursday?`,
      note: "From a test run with a stand-in model. The tools and the graph are real." },
    { type: "text", md: `This is the same agent as Chapter 9 and Chapter 13. So why build it as a graph yourself?

- **Add steps anywhere.** A safety node before the model, a validation node after tools, an approval node before writes.
- **Different tools for different stages**, or a cheaper model for simple steps.
- **See and test each piece**: nodes are plain functions.

Rule of thumb: start with \`create_agent\`. When you find yourself fighting it to add a step, write the graph.` },
    { type: "deeper", title: "MessageGraph and older examples", md: `Older tutorials use \`MessageGraph\`, where the whole state is a list of messages. It still imports in LangGraph 1.x but is deprecated. Use \`StateGraph(MessagesState)\`, which does the same job and lets you add other keys later. Older code also imports \`create_react_agent\` from \`langgraph.prebuilt\`; the current equivalent is \`langchain.agents.create_agent\`.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Reducers decide how updates merge: replace (default), append, or `add_messages`.",
      "`MessagesState` + `ToolNode` + `tools_condition` is the agent loop as a graph.",
      "The cycle model → tools → model is the loop.",
      "Start with `create_agent`; write your own graph when you need extra steps."
    ]},
    { type: "quiz", title: "Knowledge check: reducers and agent graphs", questions: [
      { kind: "mcq", q: "Without the `add_messages` reducer, what would happen when the model node returns `{\"messages\": [reply]}`?",
        options: ["The reply is appended", "The whole history is replaced by just the reply", "LangGraph raises an error", "The reply is ignored"],
        answer: 1,
        why: ["Appending is what the reducer adds.", "Right: the default is replace.", "No error; it silently replaces.", "It is not ignored."] },
      { kind: "order", q: "Put one round of the agent graph in order.",
        items: ["model node calls the LLM", "tools_condition sees tool calls", "ToolNode runs the tools", "Edge returns to the model node"] }
    ]}
  ]},

  { title: "Memory: checkpointers, threads and trimming", blocks: [
    { type: "section", label: "Remembering a conversation" },
    { type: "text", md: `Compile a graph with a **[[checkpointer]]** and LangGraph saves the state after **every step**, filed under a \`thread_id\` you choose. Next time you invoke with the same \`thread_id\`, it loads that state first. You send only the **new** message.

| Concept | Meaning | Clinic example |
| --- | --- | --- |
| Thread | One conversation | One chat session with Asha |
| \`thread_id\` | Its key | \`"asha"\`, or a session id from your web app |
| Checkpoint | A saved state after a step | 6 saved for Asha's two turns |
| Checkpointer | Where checkpoints are stored | \`InMemorySaver\` (tests), \`SqliteSaver\`, \`PostgresSaver\`, Redis |` },
    { type: "code", file: "code-samples/ch14/graph_memory.py", lang: "python", code: "@ch14/graph_memory.py",
      output: `asha> Hi, I'm Asha. Is OPD open on Saturday?
  bot: Yes, OPD is open on Saturday, 9 am-1 pm and 4-7 pm.
asha> What was my name again?
  bot: Your name is Asha.
ravi> What was my name again?
  bot: I'm sorry, I don't know your name yet; could you tell me?

Saved for thread 'asha': 4 messages
Checkpoints saved: 6`,
      note: "From a test run with a stand-in model. Ravi's thread cannot see Asha's: threads are separate." },
    { type: "text", md: `**Trimming.** The saved history keeps growing, and every model call sends it (Chapter 2: cost grows with length). \`trim_messages\` keeps only the most recent part that fits \`max_tokens\`:

- \`strategy="last"\` keeps the newest messages.
- \`start_on="human"\` makes sure the kept part starts with a user message, never with an orphaned tool result.
- \`token_counter="approximate"\` is fast; pass the model for exact counts.

The full history stays in the checkpointer; only what is **sent** is trimmed. For long chats, summarise older turns instead (Chapter 10, or \`SummarizationMiddleware\` in Chapter 13).` },
    { type: "callout", kind: "warning", md: `\`thread_id\` is a security boundary. If it comes from the browser, a user could send someone else's id and read their conversation. Generate it on the server, tie it to the logged-in user, and check ownership on every request.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "A checkpointer saves state after every step, filed by `thread_id`.",
      "Send only the new message; the history is loaded for you.",
      "Trim (or summarise) what you send; keep the full history stored.",
      "Treat `thread_id` like a session key: check who owns it."
    ]},
    { type: "quiz", title: "Knowledge check: memory", questions: [
      { kind: "mcq", q: "Why did Ravi's thread not know Asha's name?",
        options: ["The model forgot", "Each thread_id has its own saved state", "Trimming removed it", "InMemorySaver only keeps one message"],
        answer: 1,
        why: ["The model never saw it in Ravi's thread.", "Right.", "Trimming only affects what is sent within one thread.", "It keeps everything."] },
      { kind: "tf", q: "`trim_messages` deletes old messages from the checkpointer.", answer: false,
        explain: " It only shortens what is sent to the model in that call. The stored history is unchanged." }
    ]}
  ]},

  { title: "Production: limits, retries, streaming, testing, Studio", blocks: [
    { type: "section", label: "Making graphs safe to run" },
    { type: "code", file: "code-samples/ch14/graph_production.py", lang: "python", code: "@ch14/graph_production.py",
      output: `Normal:       Dr Khan (paediatrics) works Monday, Tuesday and Friday.
Step limit 2: Sorry, I couldn't finish that. Our front desk can help: 1800-000-000.

stream_mode='values' (full state after each step):
  1 messages, last from human
  2 messages, last from ai
  3 messages, last from tool
  4 messages, last from ai`,
      note: "From a test run with a stand-in model. The step-limit error is real: the run needed 3 steps and was allowed 2." },
    { type: "text", md: `| Need | LangGraph feature |
| --- | --- |
| Stop runaway loops | \`config={"recursion_limit": 10}\` (default 25). Exceeding it raises \`GraphRecursionError\`; catch it and reply safely |
| Retry flaky steps | \`add_node(..., retry_policy=RetryPolicy(max_attempts=3))\`: backoff and jitter built in |
| Slow steps | \`add_node(..., timeout=30)\` |
| Tool exceptions | \`ToolNode(tools, handle_tool_errors=True)\` turns them into messages for the model |
| Show progress | \`stream_mode="updates"\` (each node's change), \`"values"\` (full state), \`"messages"\` (tokens as written) |` },
    { type: "section", label: "Testing" },
    { type: "code", file: "code-samples/ch14/test_graph.py", lang: "python", code: "@ch14/test_graph.py",
      output: `$ pytest test_graph.py
...                                                                      [100%]
3 passed in 0.99s`,
      note: "Real output, no API key needed: the tests never call the model." },
    { type: "text", md: `Because nodes and routing functions are plain functions, you can test the **most important logic without a model**: safety rules, routing and validation. Test the model's behaviour separately with the evaluation set approach from Chapter 9.` },
    { type: "section", label: "LangGraph Studio" },
    { type: "text", md: `**LangGraph Studio** is a visual debugger: it draws your graph, lets you send inputs, shows the state after every node, and lets you edit state and re-run. It finds your graphs through a \`langgraph.json\` file:` },
    { type: "code", file: "code-samples/ch14/langgraph.json", lang: "json", code: "@ch14/langgraph.json" },
    { type: "text", md: `Install \`pip install "langgraph-cli[inmem]"\` and run \`langgraph dev\` in that folder; it starts a local server and opens Studio in your browser. Studio needs a free LangSmith account to sign in.` },
    { type: "list", style: "mistakes", items: [
      "**Returning the whole state from every node.** Easy to overwrite another node's work by accident. Return only changed keys.",
      "**Forgetting a reducer on a list built by several nodes.** Sequential nodes silently replace each other's lists; parallel nodes raise `InvalidUpdateError`.",
      "**Side effects in routing functions.** Routers should only read state and return a name; do work in nodes.",
      "**No recursion limit handling.** Users see a stack trace instead of a polite hand-over."
    ]},
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Set a recursion limit and catch `GraphRecursionError`.",
      "Use node retry policies and timeouts for flaky steps.",
      "Unit-test nodes and routers as plain functions.",
      "Studio (`langgraph dev`) lets you see and replay every step."
    ]},
    { type: "quiz", title: "Knowledge check: production graphs", questions: [
      { kind: "match", q: "Match each need to the feature.",
        pairs: [["Agent loops forever", "recursion_limit"], ["Model API times out sometimes", "RetryPolicy on the node"], ["UI should show progress", "stream_mode=\"updates\""], ["Check routing without API cost", "Unit-test the routing function"]] },
      { kind: "mcq", q: "What is the best response to `GraphRecursionError` in a patient-facing helpdesk?",
        options: ["Show the error to the user", "Raise the limit to 1,000", "Catch it, log it, and hand over politely", "Retry the same input immediately"],
        answer: 2,
        why: ["Users should never see stack traces.", "That just makes runaway loops more expensive.", "Right.", "The same input will likely loop again."] }
    ]}
  ]}

  ]
};
})();
