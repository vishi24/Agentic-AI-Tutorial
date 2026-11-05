/* Chapter 23 · Multi-agent with LangGraph */
(function () {

var SUP_SVG = `
<svg viewBox="0 0 680 290" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch23-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="sup"><rect class="dg-box amber" x="270" y="20" width="140" height="56" rx="10"/><text class="dg-title" x="340" y="44" text-anchor="middle">supervisor</text><text class="dg-muted" x="340" y="62" text-anchor="middle">Command(goto=…)</text></g>
  <g data-step="spec"><rect class="dg-box" x="20" y="130" width="130" height="50" rx="10"/><text class="dg-title" x="85" y="160" text-anchor="middle">scheduling</text>
    <rect class="dg-box" x="170" y="130" width="120" height="50" rx="10"/><text class="dg-title" x="230" y="160" text-anchor="middle">billing</text>
    <rect class="dg-box" x="310" y="130" width="120" height="50" rx="10"/><text class="dg-title" x="370" y="160" text-anchor="middle">insurance</text>
    <text class="dg-muted" x="225" y="200" text-anchor="middle">each runs with a private, fresh context</text></g>
  <g data-step="gate"><rect class="dg-box accent" x="470" y="130" width="90" height="50" rx="10"/><text class="dg-title" x="515" y="152" text-anchor="middle">approve</text><text class="dg-muted" x="515" y="170" text-anchor="middle">interrupt()</text>
    <rect class="dg-box" x="580" y="130" width="90" height="50" rx="10"/><text class="dg-title" x="625" y="160" text-anchor="middle">book</text>
    <path class="dg-line" d="M560 155H578" marker-end="url(#ch23-a)"/></g>
  <g data-step="shared"><rect class="dg-box" x="140" y="232" width="400" height="40" rx="8"/><text class="dg-text" x="340" y="257" text-anchor="middle">shared state: request · results[] · booking · steps · reply</text></g>
  <g data-step="end"><rect class="dg-box" x="560" y="30" width="80" height="36" rx="18"/><text class="dg-text" x="600" y="53" text-anchor="middle">END</text></g>
  <path class="dg-line" d="M290 76L95 128" marker-end="url(#ch23-a)"/><path class="dg-line" d="M320 76L232 128" marker-end="url(#ch23-a)"/>
  <path class="dg-line" d="M350 76L370 128" marker-end="url(#ch23-a)"/><path class="dg-line" d="M395 76L505 128" marker-end="url(#ch23-a)"/>
  <path class="dg-line" d="M410 48H558" marker-end="url(#ch23-a)"/><text class="dg-muted" x="484" y="40" text-anchor="middle">FINISH</text>
  <path class="dg-accent-line" d="M20 155H8V40H268" marker-end="url(#ch23-a)"/><text class="dg-muted" x="16" y="32">every specialist returns its result here</text>
</svg>`;

window.COURSE.chapters.ch23 = {
  id: "ch23",
  title: "Multi-agent with LangGraph",
  oneLine: "LangGraph builds multi-agent systems from what you already know: specialists are agents, the supervisor is a node that routes with Command, approval is an interrupt, and the whole system is one graph you can trace and test.",
  lessons: [

  { title: "Specialists and agents-as-tools", blocks: [
    { type: "section", label: "Specialists first" },
    { type: "text", md: `Each specialist is a normal \`create_agent\` (Chapter 13) with **only its own tools and rules**. Two design choices matter for safety:

1. **No write tools for specialists.** The scheduling agent can *check* a slot, not book it. Booking happens later, in graph code, after a person approves.
2. **A fresh, private context.** \`ask()\` gives a specialist only the task text. It never sees the rest of the conversation or other specialists' results.` },
    { type: "code", file: "code-samples/ch23/specialists.py", lang: "python", code: "@ch23/specialists.py",
      note: "Bill and coverage data are made up. Each specialist has its own call limit: during testing, a specialist that looped inside a tool call ran on until LangGraph's very high default recursion limit stopped it, so inner agents need their own budget." },
    { type: "section", label: "The simplest multi-agent system" },
    { type: "text", md: `Wrap each specialist as a **tool** of a supervisor agent. The supervisor is an ordinary agent; when it "calls a tool", a whole specialist runs and returns its answer. If the supervisor calls two tools at once, two specialists work in parallel (Chapter 8's parallel tool calls).` },
    { type: "code", file: "code-samples/ch23/agents_as_tools.py", lang: "python", code: "@ch23/agents_as_tools.py",
      output: `supervisor -> [('ask_billing', 'Explain the charges on BILL-2291.'), ('ask_insurance', 'Does CGHS cover OPD visits?')]
ask_billing    <- BILL-2291: OPD registration Rs 100, ECG Rs 350. Total Rs 450.
ask_insurance  <- CGHS: OPD is covered.
REPLY: BILL-2291 has the OPD registration (Rs 100) and an ECG (Rs 350), total Rs 450. CGHS covers OPD visits.`,
      note: "From a test run with stand-in models; the tools, the agents and the data are real. 6 model calls: supervisor 2, each specialist 2." },
    { type: "text", md: `Notice how the supervisor wrote **standalone tasks** ("Explain the charges on BILL-2291"), because the specialist will see nothing else. The tool descriptions tell it to do so. This "agents as tools" (or "subagents") design is now LangChain's recommended starting point for multi-agent systems: it is just Chapter 13 plus one idea.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Specialists are ordinary agents with only their own tools and rules.",
      "Give specialists a fresh context and their own call limit.",
      "Agents-as-tools: wrap each specialist as a tool of a supervisor agent.",
      "Parallel tool calls run specialists in parallel."
    ]},
    { type: "quiz", title: "Knowledge check: specialists", questions: [
      { kind: "mcq", q: "Why does the scheduling specialist have `check_slot` but no booking tool?",
        options: ["Booking is slow", "So no model can book without passing the human approval step in graph code", "LangGraph forbids write tools", "To save tokens"],
        answer: 1,
        why: ["Speed is not the reason.", "Right: agents propose, code and people decide.", "It does not.", "Not the reason."] },
      { kind: "tf", q: "In agents-as-tools, each specialist sees the full conversation with the patient.", answer: false,
        explain: " It sees only the task the supervisor wrote, so tasks must be standalone." }
    ]}
  ]},

  { title: "A supervisor graph with a human gate", blocks: [
    { type: "section", label: "When you need more control" },
    { type: "text", md: `Agents-as-tools lets the supervisor model decide everything. When some steps must **always** happen in a certain way, such as "a person approves every booking", build the supervisor as a **graph**:` },
    { type: "stepper", svg: SUP_SVG, caption: "The supervisor graph built below.",
      steps: [
        { on: ["sup"], text: "The **supervisor** node asks the model for a structured \`Decision\` and returns \`Command(goto=…)\`: the node itself says where to go next, no separate routing edge needed." },
        { on: ["spec"], text: "Each **specialist** node runs its agent on the supervisor's task with a private context, appends one line to \`results\`, and returns to the supervisor." },
        { on: ["gate"], text: "To book, the supervisor can only go to **approve**, which calls \`interrupt()\`. Only after a person approves does **book**, plain code, call \`request_appointment\`." },
        { on: ["shared"], text: "**Shared state** holds only what the supervisor needs: the request, one-line results, the proposed booking, a step counter and the reply." },
        { on: ["end"], text: "**FINISH** ends the run with a reply written only from the results. A step limit sends the patient to the front desk if the supervisor loops." }
      ]},
    { type: "code", file: "code-samples/ch23/supervisor_graph.py", lang: "python", code: "@ch23/supervisor_graph.py",
      output: `  result: scheduling: Yes, Dr Rao works on Thursday (he sees patients Thu and Fri).
  result: insurance: PM-JAY: surgery is covered.
PAUSED: {'approve_booking': {'doctor': 'Dr Rao', 'day': 'Thu', 'patient_name': 'Asha Verma'}}
  result: booking: {'request_id': 'REQ-001', 'doctor': 'Dr Rao', 'department': 'cardiology', 'day': 'Thu', ...}
REPLY: Your request for Dr Rao on Thursday is booked as REQ-001, pending staff confirmation. PM-JAY covers surgery.
Supervisor steps: 4`,
      note: "From a test run with stand-in models. Command routing, the interrupt, the resume and the booking code are real (langgraph 1.2.19)." },
    { type: "text", md: `Key details in the code:

- **\`Command(goto=..., update=...)\`** both updates state and routes. \`destinations=(...)\` on \`add_node\` tells LangGraph the possible targets, so the graph can still be drawn and checked.
- **\`results\` has the \`operator.add\` reducer**, so each specialist's line is appended.
- **The booking path is fixed in code:** \`approve\` → \`book\`. The model chooses *whether* to propose a booking, never whether to skip approval.
- **\`MAX_STEPS\`** is the Chapter 21 guard, kept in state.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Build the supervisor as a graph when some steps must always happen.",
      "`Command(goto=...)` lets a node update state and choose the next node.",
      "Put approval in an `interrupt()` node and writes in a code node after it.",
      "Keep shared state small: one-line results, not whole conversations."
    ]},
    { type: "quiz", title: "Knowledge check: supervisor graph", questions: [
      { kind: "order", q: "Put a booking request through the graph in order.",
        items: ["Supervisor sends a check task to scheduling", "Scheduling confirms the slot and returns to the supervisor", "Supervisor proposes the booking: goto approve", "A person approves at the interrupt", "book node calls request_appointment", "Supervisor finishes with the reply"] },
      { kind: "mcq", q: "What does `destinations=(...)` on `add_node` do for a node that returns `Command`?",
        options: ["Makes it faster", "Declares where it may go, so the graph can be drawn and checked", "Adds retries", "Runs destinations in parallel"],
        answer: 1,
        why: ["No speed effect.", "Right.", "Retries are a retry_policy.", "Use Send for parallel."] }
    ]}
  ]},

  { title: "Handoffs, swarms and ready-made helpers", blocks: [
    { type: "section", label: "Peers handing off in LangGraph" },
    { type: "text", md: `The **network / swarm** pattern from Chapter 22 maps directly onto \`Command\`. Give each agent a **hand-off tool**; when the model calls it, the tool returns a \`Command\` that moves the conversation to another agent node:

\`\`\`python
from langchain_core.tools import tool, InjectedToolCallId
from langchain_core.messages import ToolMessage
from langgraph.types import Command
from typing import Annotated

@tool
def transfer_to_insurance(note: str, tool_call_id: Annotated[str, InjectedToolCallId]) -> Command:
    """Hand the patient to the insurance desk, with a one-line note."""
    return Command(goto="insurance", graph=Command.PARENT,           # jump to a node in the parent graph
                   update={"messages": [ToolMessage(f"Transferred: {note}", tool_call_id=tool_call_id)],
                           "active_agent": "insurance"})
\`\`\`

\`graph=Command.PARENT\` is needed because the tool runs inside the agent's own sub-graph and the target node is in the parent. Store \`active_agent\` in state so the next message from the patient goes straight to whoever has the conversation.` },
    { type: "text", md: `| Design | How in LangGraph | Choose when |
| --- | --- | --- |
| Agents as tools | Specialists wrapped in \`@tool\` for a supervisor \`create_agent\` | Starting point; supervisor writes the final reply |
| Supervisor graph | Supervisor node + \`Command(goto)\` + specialist nodes | Fixed steps such as approval, budgets, audits |
| Handoffs / swarm | Hand-off tools returning \`Command(graph=Command.PARENT)\` | Conversations move between desks; the active desk replies directly |
| Parallel specialists | \`Send\` from a planning node (Chapter 15) | Independent look-ups for one request |
| Hierarchical | Sub-graphs as nodes (Chapter 15) | Teams that own their own sub-systems |` },
    { type: "callout", kind: "tip", md: `The LangChain team also publishes small helper packages, \`langgraph-supervisor\` and \`langgraph-swarm\`, that build these graphs in a few lines. They are convenient once you understand what they generate, which this chapter shows by hand. Check their documentation for current versions; they are not used in the course tests.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Hand-off tools return `Command(goto=..., graph=Command.PARENT)` to move between agents.",
      "Track the active agent in state so follow-up messages go to the right desk.",
      "Pick agents-as-tools, supervisor graph, swarm, Send or sub-graphs by the shape of the work.",
      "Helper packages exist; understand the graph they build first."
    ]},
    { type: "quiz", title: "Knowledge check: handoffs", questions: [
      { kind: "mcq", q: "Why does a hand-off tool use `graph=Command.PARENT`?",
        options: ["To end the run", "The tool runs inside the agent's sub-graph, and the target agent is a node in the parent graph", "To run in parallel", "To skip approval"],
        answer: 1,
        why: ["It moves, it does not end.", "Right.", "Unrelated.", "Never."] },
      { kind: "match", q: "Match each need to the LangGraph design.",
        pairs: [["Every booking must be approved by a person", "Supervisor graph with an interrupt node"], ["Check three desks at once for one request", "Send to parallel specialists"], ["The insurance desk keeps the conversation once it takes over", "Handoffs with an active agent in state"]] }
    ]}
  ]},

  { title: "Production: routing tests, tracing and limits", blocks: [
    { type: "section", label: "Test routing on its own" },
    { type: "code", file: "code-samples/ch23/routing_eval.py", lang: "python", code: "@ch23/routing_eval.py",
      output: `ok  Which days does Dr Khan see children?            -> scheduling  (expected scheduling)
ok  Why is there an ECG charge on BILL-2291?         -> billing     (expected billing)
ok  Does PM-JAY cover consumables?                   -> insurance   (expected insurance)
ok  Is the OPD fee refundable?                       -> billing     (expected billing)
ok  Can I see the orthopaedics doctor on Tuesday?    -> scheduling  (expected scheduling)
ok  Is CGHS accepted for surgery?                    -> insurance   (expected insurance)
BAD My insurance claim for the ECG bill was rejected -> billing     (expected insurance)
ok  Do you have a cafeteria?                         -> FINISH      (expected FINISH)

Routing accuracy: 7/8`,
      note: "From a test run with a keyword-based stand-in supervisor. Run it with your model: the cases that fail will differ, and that is the point." },
    { type: "text", md: `A routing test set is cheap (one supervisor call per case, no specialists) and catches the commonest multi-agent bug. The failure here is typical: a message with **two topics** ("insurance claim" and "bill"). Fixes, in order of preference: add a line to the supervisor prompt ("claims and rejections go to insurance"), add an example, or let the supervisor call both desks. Re-run the set after every prompt change.` },
    { type: "section", label: "Running the system" },
    { type: "list", items: [
      "**Trace sub-graphs:** `graph.stream(..., stream_mode=\"updates\", subgraphs=True)` shows steps inside each specialist, labelled by agent. LangSmith or Langfuse show the same as a tree.",
      "**One run id:** put it in `config[\"metadata\"]` so every agent's traces share it (Chapter 21).",
      "**Budgets at two levels:** the supervisor's step counter and each specialist's `ModelCallLimitMiddleware`.",
      "**A durable checkpointer** (Postgres) so approvals survive restarts (Chapter 15).",
      "**Models per role:** a small, cheap model often routes well; use a stronger one only where the evaluation shows it helps.",
      "**Evaluate in three layers:** each specialist alone, routing (above), and end to end (Chapter 27)."
    ]},
    { type: "list", style: "mistakes", items: [
      "**Specialists without their own limit.** An inner loop runs until a very high default limit.",
      "**Booking tools given to specialists.** One prompt injection away from an unapproved booking.",
      "**Copying the whole message history into shared state.** Contexts and costs grow with every hand-off.",
      "**No routing tests.** The specialists look perfect while patients reach the wrong desk."
    ]},
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Keep a routing test set and re-run it after every supervisor change.",
      "Trace sub-graphs with one run id across all agents.",
      "Budget the supervisor and every specialist.",
      "Evaluate specialists, routing and the whole system separately."
    ]},
    { type: "quiz", title: "Knowledge check: production", questions: [
      { kind: "mcq", q: "The routing set shows \"insurance claim for the ECG bill\" going to billing. Best first fix?",
        options: ["Replace the supervisor with a bigger model", "Add a routing rule or example to the supervisor prompt, then re-run the set", "Delete the case", "Merge billing and insurance agents"],
        answer: 1,
        why: ["Try the cheap, targeted fix first.", "Right.", "That hides the problem.", "A big change for one case."] },
      { kind: "tf", q: "`subgraphs=True` in `stream` shows the steps inside each specialist agent.", answer: true,
        explain: " Updates are labelled with the sub-graph they came from." }
    ]}
  ]}

  ]
};
})();
