/* Chapter 15 · LangGraph in depth */
(function () {

var CYCLE_SVG = `
<svg viewBox="0 0 680 220" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch15-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="extract"><rect class="dg-box accent" x="40" y="70" width="150" height="64" rx="10"/><text class="dg-title" x="115" y="98" text-anchor="middle">extract</text><text class="dg-muted" x="115" y="118" text-anchor="middle">model → Booking</text></g>
  <g data-step="validate"><rect class="dg-box amber" x="260" y="70" width="150" height="64" rx="10"/><text class="dg-title" x="335" y="98" text-anchor="middle">validate</text><text class="dg-muted" x="335" y="118" text-anchor="middle">code checks</text></g>
  <g data-step="done"><rect class="dg-box" x="490" y="30" width="150" height="50" rx="10"/><text class="dg-title" x="565" y="60" text-anchor="middle">done</text></g>
  <g data-step="handoff"><rect class="dg-box" x="490" y="128" width="150" height="50" rx="10"/><text class="dg-title" x="565" y="158" text-anchor="middle">handoff</text></g>
  <path class="dg-line" d="M190 102H258" marker-end="url(#ch15-a)"/>
  <path class="dg-accent-line" d="M410 90L488 58" marker-end="url(#ch15-a)"/><text class="dg-muted" x="448" y="62" text-anchor="middle">ok</text>
  <path class="dg-accent-line" d="M410 116L488 150" marker-end="url(#ch15-a)"/><text class="dg-muted" x="440" y="152" text-anchor="middle">3rd fail</text>
  <g data-step="loop"><path class="dg-accent-line" d="M335 134V190H115V136" marker-end="url(#ch15-a)"/><text class="dg-muted" x="225" y="208" text-anchor="middle">problems → try again with feedback</text></g>
</svg>`;

var PAUSE_SVG = `
<svg viewBox="0 0 680 210" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch15-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="run"><rect class="dg-box" x="20" y="40" width="130" height="56" rx="10"/><text class="dg-title" x="85" y="66" text-anchor="middle">invoke</text><text class="dg-muted" x="85" y="84" text-anchor="middle">request #1</text></g>
  <g data-step="int"><rect class="dg-box amber" x="200" y="40" width="150" height="56" rx="10"/><text class="dg-title" x="275" y="66" text-anchor="middle">interrupt()</text><text class="dg-muted" x="275" y="84" text-anchor="middle">pause + payload</text></g>
  <g data-step="db"><rect class="dg-box" x="200" y="140" width="150" height="50" rx="10"/><text class="dg-title" x="275" y="170" text-anchor="middle">SQLite / Postgres</text></g>
  <g data-step="staff"><rect class="dg-box accent" x="410" y="40" width="120" height="56" rx="10"/><text class="dg-title" x="470" y="66" text-anchor="middle">Staff</text><text class="dg-muted" x="470" y="84" text-anchor="middle">minutes later</text></g>
  <g data-step="resume"><rect class="dg-box" x="560" y="40" width="110" height="56" rx="10"/><text class="dg-title" x="615" y="66" text-anchor="middle">resume</text><text class="dg-muted" x="615" y="84" text-anchor="middle">request #2</text></g>
  <path class="dg-line" d="M150 68H198" marker-end="url(#ch15-b)"/><path class="dg-line" d="M350 68H408" marker-end="url(#ch15-b)"/><path class="dg-line" d="M530 68H558" marker-end="url(#ch15-b)"/>
  <path class="dg-line" d="M275 96V138" marker-end="url(#ch15-b)"/><text class="dg-muted" x="285" y="122">state saved</text>
  <path class="dg-line" d="M615 96V165H352" marker-end="url(#ch15-b)"/><text class="dg-muted" x="480" y="160" text-anchor="middle">load state, continue</text>
</svg>`;

var SEND_SVG = `
<svg viewBox="0 0 680 230" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch15-c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="plan"><rect class="dg-box accent" x="20" y="88" width="120" height="56" rx="10"/><text class="dg-title" x="80" y="114" text-anchor="middle">plan</text><text class="dg-muted" x="80" y="132" text-anchor="middle">which depts?</text></g>
  <g data-step="send"><rect class="dg-box" x="215" y="20" width="230" height="44" rx="10"/><text class="dg-text" font-size="13" x="330" y="47" text-anchor="middle">check_department(paediatrics)</text>
    <rect class="dg-box" x="215" y="94" width="230" height="44" rx="10"/><text class="dg-text" font-size="13" x="330" y="121" text-anchor="middle">check_department(cardiology)</text>
    <rect class="dg-box" x="215" y="168" width="230" height="44" rx="10"/><text class="dg-muted" x="330" y="195" text-anchor="middle">… one per Send</text></g>
  <g data-step="reduce"><rect class="dg-box amber" x="480" y="94" width="80" height="44" rx="10"/><text class="dg-text" x="520" y="121" text-anchor="middle">+ reducer</text></g>
  <g data-step="combine"><rect class="dg-box accent" x="590" y="88" width="80" height="56" rx="10"/><text class="dg-title" x="630" y="121" text-anchor="middle">combine</text></g>
  <path class="dg-line" d="M140 106L213 44" marker-end="url(#ch15-c)"/><path class="dg-line" d="M140 116H213" marker-end="url(#ch15-c)"/><path class="dg-line" d="M140 126L213 188" marker-end="url(#ch15-c)"/>
  <path class="dg-line" d="M445 44L478 108" marker-end="url(#ch15-c)"/><path class="dg-line" d="M445 116H478" marker-end="url(#ch15-c)"/><path class="dg-line" d="M445 188L478 126" marker-end="url(#ch15-c)"/>
  <path class="dg-line" d="M560 116H588" marker-end="url(#ch15-c)"/>
</svg>`;

var MEM_SVG = `
<svg viewBox="0 0 680 210" xmlns="http://www.w3.org/2000/svg">
  <g data-step="threads"><rect class="dg-box" x="20" y="30" width="170" height="54" rx="10"/><text class="dg-title" x="105" y="54" text-anchor="middle">Thread: Monday chat</text><text class="dg-muted" x="105" y="72" text-anchor="middle">checkpointer</text>
    <rect class="dg-box" x="20" y="120" width="170" height="54" rx="10"/><text class="dg-title" x="105" y="144" text-anchor="middle">Thread: Friday chat</text><text class="dg-muted" x="105" y="162" text-anchor="middle">checkpointer</text></g>
  <g data-step="store"><rect class="dg-box accent" x="330" y="60" width="320" height="84" rx="12"/><text class="dg-title" x="490" y="88" text-anchor="middle">Store, namespace ("patients", "UHID-1001")</text><text class="dg-text" x="490" y="114" text-anchor="middle">preferred_language = Hindi</text><text class="dg-muted" x="490" y="132" text-anchor="middle">shared by every thread for this patient</text></g>
  <path class="dg-line" d="M190 57L328 92"/><path class="dg-line" d="M190 147L328 112"/>
  <text class="dg-muted" x="20" y="200">Checkpointer: memory of one conversation. Store: facts that outlive conversations.</text>
</svg>`;

window.COURSE.chapters.ch15 = {
  id: "ch15",
  title: "LangGraph in depth",
  oneLine: "The features that make LangGraph worth learning: loops that correct themselves, pauses for human approval that survive restarts, parallel work, sub-graphs, long-term memory, and replaying the past.",
  lessons: [

  { title: "Cycles: graphs that correct themselves", blocks: [
    { type: "section", label: "Try, check, try again" },
    { type: "text", md: `A patient writes: "Please book the heart doctor Rao for me on thursday." The model extracts \`doctor: "Rao", day: "thursday"\`. Close, but your booking system needs \`"Dr Rao"\` and \`"Thu"\`.

Instead of failing, the graph **loops**: code checks the extraction, lists the exact problems, and sends them back to the model to fix. A limit stops the loop, and a person takes over if it still fails. This is Chapter 11's reflection pattern, with the checking done by **code** because the rules are exact.` },
    { type: "stepper", svg: CYCLE_SVG, caption: "A self-correcting extraction graph.",
      steps: [
        { on: ["extract"], text: "**extract** asks the model for a \`Booking\` (structured output). On a retry it adds the previous problems to the prompt." },
        { on: ["validate"], text: "**validate** is plain code: is the doctor real, does he work that day, is the patient's full name present?" },
        { on: ["done"], text: "No problems: the request is ready for staff." },
        { on: ["loop"], text: "Problems and fewer than 3 attempts: the edge goes **back** to extract. This backward edge is the cycle." },
        { on: ["handoff"], text: "Still wrong after 3 attempts: stop and hand over, with the problems listed for the person." }
      ]},
    { type: "code", file: "code-samples/ch15/self_correct.py", lang: "python", code: "@ch15/self_correct.py",
      output: `Please book the heart doctor Rao for me on thursday. I'm Meena Pillai.
  attempt 1: {'doctor': 'Rao', 'day': 'thursday', 'patient_name': 'Meena Pillai'}
  attempt 2: {'doctor': 'Dr Rao', 'day': 'Thu', 'patient_name': 'Meena Pillai'}
 -> Request ready for staff: {'doctor': 'Dr Rao', 'day': 'Thu', 'patient_name': 'Meena Pillai'}

Book Dr Gupta tomorrow for Ali
  attempt 1: {'doctor': 'Dr Gupta', 'day': 'tomorrow', 'patient_name': 'Ali'}
  attempt 2: {'doctor': 'Dr Gupta', 'day': 'tomorrow', 'patient_name': 'Ali'}
  attempt 3: {'doctor': 'Dr Gupta', 'day': 'tomorrow', 'patient_name': 'Ali'}
 -> Could not understand the request; passing to the front desk. Problems: 'Dr Gupta' is not a doctor here;
    choose from ['Dr Mehta', 'Dr Rao', 'Dr Iyer', 'Dr Khan']; patient_name must be the full name from the message`,
      note: "From a test run with a stand-in model that made the first mistake on purpose. The checks and the loop are real." },
    { type: "text", md: `Three design choices make this safe:

1. **The attempt counter is in the state**, so the routing function can see it. Without it the loop could run until the recursion limit.
2. **Feedback is specific.** "Dr Rao works only on Thu, Fri, not 'thursday'" gives the model something to fix; "invalid" does not.
3. **Some problems cannot be fixed by retrying.** Dr Gupta does not exist; three attempts changed nothing. In production, check whether the problem is fixable (a format issue) before looping, and hand over at once if not.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "A backward edge makes a cycle: try, check, try again.",
      "Check exact rules in code and feed specific problems back.",
      "Keep an attempt counter in state and hand over at the limit.",
      "Do not retry problems that more attempts cannot fix."
    ]},
    { type: "quiz", title: "Knowledge check: cycles", questions: [
      { kind: "mcq", q: "Why is the attempt counter stored in the graph state?",
        options: ["For logging only", "So the routing function can decide to stop looping", "LangGraph requires it", "To save tokens"],
        answer: 1,
        why: ["Logging is a bonus, not the reason.", "Right.", "It is your design choice.", "Not directly."] },
      { kind: "tf", q: "If validation fails because the doctor does not exist, retrying the extraction will usually fix it.", answer: false,
        explain: " The message itself names a doctor who does not exist; a person needs to clarify." }
    ]}
  ]},

  { title: "Human approval that survives a restart", blocks: [
    { type: "section", label: "Pausing for days if needed" },
    { type: "text", md: `Chapter 13's approval used middleware. In your own graph, you pause with one function: **\`interrupt(payload)\`**.

- When a node calls \`interrupt(...)\`, the graph **stops**, saves its state through the checkpointer, and returns the payload to the caller under \`__interrupt__\`.
- Later, you call \`graph.invoke(Command(resume=value), config)\` with the same \`thread_id\`. The node runs again from the top, and this time \`interrupt()\` **returns** \`value\`.

With a database checkpointer, the pause can last minutes or days and survive server restarts.` },
    { type: "stepper", svg: PAUSE_SVG, caption: "Pause and resume across two separate requests.",
      steps: [
        { on: ["run"], text: "Request 1: the agent prepares an appointment request." },
        { on: ["int"], text: "\`ask_staff\` calls \`interrupt()\` with the details. The graph stops." },
        { on: ["db"], text: "The checkpointer has saved the state in SQLite (or Postgres). The web request can now finish; nothing is kept in memory." },
        { on: ["staff"], text: "A staff member reviews it on a dashboard, perhaps after lunch." },
        { on: ["resume"], text: "Request 2, maybe on a different server: load the state by \`thread_id\` and continue with \`Command(resume={\"approved\": True})\`." }
      ]},
    { type: "code", file: "code-samples/ch15/approval_graph.py", lang: "python", code: "@ch15/approval_graph.py",
      output: `Paused: {'question': 'Approve this appointment request?', 'request': {'doctor': 'Dr Rao', 'day': 'Thu', 'patient_name': 'Asha Verma'}}
Next node waiting: ('ask_staff',)
Resumed: {'request_id': 'REQ-001', 'doctor': 'Dr Rao', 'department': 'cardiology', 'day': 'Thu',
          'patient_name': 'Asha Verma', 'status': 'approved', 'approved_by': 'staff-17'}`,
      note: "Real output (no model needed). The resume used a brand-new graph object and database connection, as after a restart. Tested with langgraph-checkpoint-sqlite 3.1.3." },
    { type: "callout", kind: "warning", md: `**The node re-runs from the start on resume.** Any code *before* \`interrupt()\` runs twice. Never put side effects (sending an SMS, writing to the database) before an interrupt in the same node; put them in the next node, as \`book\` does here.` },
    { type: "text", md: `What the reviewer can send back is up to you: \`{"approved": True}\`, \`{"approved": False, "reason": "doctor on leave"}\`, or edited details. Record **who** approved (\`approved_by\`) for the audit trail; in healthcare this is often required.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "`interrupt(payload)` pauses the graph and returns the payload to the caller.",
      "`Command(resume=value)` continues; `interrupt()` returns `value`.",
      "A database checkpointer makes pauses survive restarts.",
      "Code before `interrupt()` runs again on resume: keep side effects after it."
    ]},
    { type: "quiz", title: "Knowledge check: interrupts", questions: [
      { kind: "order", q: "Put the approval flow in order.",
        items: ["Node calls interrupt() with the request details", "Checkpointer saves the state", "Staff reviews and decides", "Caller sends Command(resume=decision) with the same thread_id", "interrupt() returns the decision and the graph continues"] },
      { kind: "mcq", q: "A node sends an SMS and then calls `interrupt()`. What goes wrong?",
        options: ["Nothing", "The SMS is sent twice: once before the pause and again when the node re-runs on resume", "The SMS is never sent", "The interrupt is ignored"],
        answer: 1,
        why: ["The node re-runs on resume.", "Right: move side effects after the interrupt.", "It is sent, twice.", "The interrupt works."] }
    ]}
  ]},

  { title: "Parallel work and sub-graphs", blocks: [
    { type: "section", label: "Map-reduce with Send" },
    { type: "text", md: `"My son needs a paediatrician and I need a cardiologist. Is any day good for both?" The agent must check **two departments**. In a normal loop it would check one, then the other. With the **Send API** it checks both **at the same time**.

A routing function can return a list of \`Send("node", input)\`. LangGraph runs one copy of that node per \`Send\`, in parallel, each with its own small input. A reducer on the state (here \`operator.add\`) collects their results, and the next node waits until all copies finish.` },
    { type: "stepper", svg: SEND_SVG, caption: "Fan out with Send, collect with a reducer.",
      steps: [
        { on: ["plan"], text: "**plan** asks the model which departments are needed: \`[\"paediatrics\", \"cardiology\"]\`." },
        { on: ["send"], text: "\`fan_out\` returns one \`Send\` per department. Each copy of \`check_department\` gets only \`{\"department\": …}\`, not the whole state." },
        { on: ["reduce"], text: "Each copy returns \`{\"findings\": [one line]}\`. Because \`findings\` has the \`operator.add\` reducer, the lists are joined, not overwritten." },
        { on: ["combine"], text: "**combine** runs once, after all copies finish, and writes the answer from the facts." }
      ]},
    { type: "code", file: "code-samples/ch15/fanout.py", lang: "python", code: "@ch15/fanout.py",
      output: `Departments: ['paediatrics', 'cardiology']
Findings:    ["paediatrics: {'Dr Khan': ['Mon', 'Tue', 'Fri']}", "cardiology: {'Dr Mehta': ['Mon', 'Wed'], 'Dr Rao': ['Thu', 'Fri']}"]
Answer:      Monday works for both: Dr Khan (paediatrics) and Dr Mehta (cardiology) see patients on Mondays.
             Friday also works with Dr Khan and Dr Rao.`,
      note: "From a test run with a stand-in model. The parallel lookups are real." },
    { type: "callout", kind: "tip", md: `Parallel branches finish in any order. That is why \`combine\` sorts the findings before using them: the same input should give the same prompt, which makes answers repeatable and caching possible.` },

    { type: "section", label: "Sub-graphs" },
    { type: "text", md: `As a system grows, one big graph becomes hard to read. A **sub-graph** is a compiled graph used as a single node in another graph. The billing team can build and test their graph on its own; the helpdesk graph just adds it with \`add_node("billing", billing_graph)\`. Keys with the same name (\`message\`, \`reply\`) flow in and out automatically.` },
    { type: "code", file: "code-samples/ch15/subgraph.py", lang: "python", code: "@ch15/subgraph.py",
      output: `Can you explain bill-2291?
  -> BILL-2291: OPD fee Rs 100, ECG Rs 350. Total Rs 450.
Why is my bill so high?
  -> Please share your bill number (it starts with BILL-).
When is OPD open?
  -> OPD runs Mon-Sat, 9-1 and 4-7.

Nodes in the parent graph: ['__start__', 'billing', 'general', '__end__']
Nodes including sub-graphs: ['__start__', 'general', '__end__', 'billing:find_bill', 'billing:explain_bill']`,
      note: "Real output (no model needed). The bill amounts are made up." },
    { type: "text", md: `Sub-graphs are also how **multi-agent systems** are built in Part D: each agent is a sub-graph, and a supervisor graph routes between them.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Return a list of `Send(...)` to run a node many times in parallel.",
      "A reducer on the state collects the parallel results.",
      "A compiled graph can be a node in another graph (a sub-graph).",
      "Sub-graphs keep big systems readable and are the basis of multi-agent graphs."
    ]},
    { type: "quiz", title: "Knowledge check: Send and sub-graphs", questions: [
      { kind: "mcq", q: "Three parallel `check_department` nodes each return `{\"findings\": [...]}`. Without a reducer on `findings`, what happens?",
        options: ["All three lists are joined", "LangGraph raises InvalidUpdateError: a plain key can take only one value per step", "The graph runs them one by one", "The last branch silently wins"],
        answer: 1,
        why: ["Joining needs a reducer like operator.add.", "Right. The error message even suggests using an Annotated key.", "Send still runs them in parallel.", "LangGraph refuses rather than silently dropping results."] },
      { kind: "tf", q: "A sub-graph must be built by the same person who builds the parent graph.", answer: false,
        explain: " It is a self-contained compiled graph, so another team can own and test it." }
    ]}
  ]},

  { title: "Long-term memory, time travel and production", blocks: [
    { type: "section", label: "Memory across conversations: the Store" },
    { type: "stepper", svg: MEM_SVG, caption: "Two kinds of memory.",
      steps: [
        { on: ["threads"], text: "The **checkpointer** remembers one conversation (thread). Friday's chat starts empty." },
        { on: ["store"], text: "The **Store** keeps facts in namespaces, such as \`(\"patients\", \"UHID-1001\")\`. Every thread for that patient can read them. This is Chapter 10's semantic memory." }
      ]},
    { type: "code", file: "code-samples/ch15/store_memory.py", lang: "python", code: "@ch15/store_memory.py",
      output: `Friday reply: OPD subah 9 se 1 aur shaam 4 se 7 baje tak, somvar se shanivar khula hai.
Stored: [(('patients', 'UHID-1001'), 'preferred_language', {'value': 'Hindi'})]
Friday thread only has 2 messages: the preference came from the store`,
      note: "From a test run with a stand-in model. The Store, namespaces and threads are real." },
    { type: "text", md: `Nodes receive the store through \`runtime: Runtime\` (\`runtime.store.put\`, \`.get\`, \`.search\`). The Chapter 10 rules still apply: an **allowlist** of what may be stored, a way to **forget** a patient (\`store.delete\`), and no medical details unless your policies allow it. In production use \`PostgresStore\` or a Redis store; pass an \`index\` with an embedding model to search memories by meaning.` },

    { type: "section", label: "Time travel" },
    { type: "code", file: "code-samples/ch15/time_travel.py", lang: "python", code: "@ch15/time_travel.py",
      output: `Run: cardio: no doctors found
  checkpoint before (end): {'department': 'cardio', 'doctors': [], 'reply': 'cardio: no doctors found'}
  checkpoint before ('reply',): {'department': 'cardio', 'doctors': []}
  checkpoint before ('lookup',): {'department': 'cardio'}
  checkpoint before ('__start__',): {}
Replay from the fixed checkpoint: cardiology: Dr Mehta, Dr Rao`,
      note: "Real output (no model needed)." },
    { type: "text", md: `Every checkpoint is kept, so you can:

- **Debug:** \`get_state_history\` shows the state before each step. Find where it went wrong.
- **Fork:** \`update_state(old_checkpoint.config, {...})\` creates a corrected branch; \`invoke(None, that_config)\` continues from there. The original run is untouched, which is good for audits.` },

    { type: "section", label: "Running LangGraph in production" },
    { type: "text", md: `| Concern | Choice |
| --- | --- |
| Checkpointer | \`PostgresSaver\` (most common), \`SqliteSaver\` (single server), Redis (fast, needs persistence configured). Never \`InMemorySaver\` in production |
| Store | \`PostgresStore\` or Redis, with an embedding index if you search by meaning |
| Serving | Your own FastAPI app (Chapter 12 pattern) calling \`graph.ainvoke\` / \`astream\`; or LangGraph Platform / \`langgraph up\`, which adds a task queue, streaming endpoints and cron runs |
| Durability | \`graph.invoke(..., durability="sync")\` waits for each checkpoint to be written; \`"async"\` (default) is faster; \`"exit"\` saves only at the end |
| Old checkpoints | Delete threads after your retention period, especially if they hold personal data |
| Versioning | Changing the state schema can break saved threads; add new keys with defaults rather than renaming |` },
    { type: "list", style: "mistakes", items: [
      "**`InMemorySaver` in production.** A restart loses every paused approval.",
      "**Side effects before `interrupt()`.** They run twice.",
      "**Storing everything in the Store.** Use an allowlist; memory poisoning and privacy (Chapter 10) still apply.",
      "**Never deleting checkpoints.** Conversations with personal data pile up forever."
    ]},
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Checkpointer = one conversation; Store = facts across conversations.",
      "Every checkpoint is kept: inspect history and fork from any point.",
      "Use Postgres (or SQLite on one server) in production, with retention rules.",
      "Serve with FastAPI or LangGraph Platform; choose durability per use case."
    ]},
    { type: "quiz", title: "Knowledge check: memory and production", questions: [
      { kind: "match", q: "Match each need to the feature.",
        pairs: [["Remember a patient's language next week", "Store"], ["Continue today's chat after a page refresh", "Checkpointer"], ["Find which step produced a wrong answer", "get_state_history"], ["Re-run with a corrected input without losing the original", "update_state on an old checkpoint (fork)"]] },
      { kind: "tf", q: "InMemorySaver is fine in production if the server rarely restarts.", answer: false,
        explain: " Any restart or second server loses paused approvals and conversations. Use a database." }
    ]}
  ]}

  ]
};
})();
