/* Chapter 22 · Multi-agent patterns */
(function () {

function node(x, y, w, label, cls) {
  return '<rect class="dg-box' + (cls ? " " + cls : "") + '" x="' + x + '" y="' + y + '" width="' + w + '" height="28" rx="6"/>' +
    '<text class="dg-text" font-size="12" x="' + (x + w / 2) + '" y="' + (y + 18) + '" text-anchor="middle">' + label + "</text>";
}
var A = ' marker-end="url(#ch22-a)"';

var PATTERNS_SVG = '<svg viewBox="0 0 680 440" xmlns="http://www.w3.org/2000/svg">' +
  '<defs><marker id="ch22-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>' +
  // sequential
  '<g data-step="seq"><text class="dg-title" x="20" y="24">1 Sequential</text>' +
    node(20, 40, 60, "intake") + node(100, 40, 70, "specialist") + node(190, 40, 64, "reviewer") +
    '<path class="dg-line" d="M80 54H98"' + A + '/><path class="dg-line" d="M170 54H188"' + A + '/>' +
    '<text class="dg-muted" x="20" y="96">fixed order, set by you</text></g>' +
  // router
  '<g data-step="router"><text class="dg-title" x="250" y="24" transform="translate(110 0)">2 Router / supervisor</text>' +
    node(380, 56, 80, "supervisor", "amber") + node(500, 30, 70, "billing") + node(500, 64, 70, "schedule") + node(500, 98, 70, "insurance") +
    '<path class="dg-line" d="M460 66L498 46"' + A + '/><path class="dg-line" d="M460 70H498"' + A + '/><path class="dg-line" d="M460 74L498 110"' + A + '/>' +
    '<text class="dg-muted" x="590" y="74">picks one</text></g>' +
  // parallel
  '<g data-step="par"><text class="dg-title" x="20" y="166">3 Parallel</text>' +
    node(20, 210, 60, "request") + node(110, 176, 70, "schedule") + node(110, 210, 70, "insurance") + node(110, 244, 70, "billing") + node(210, 210, 70, "combine", "accent") +
    '<path class="dg-line" d="M80 220L108 190"' + A + '/><path class="dg-line" d="M80 224H108"' + A + '/><path class="dg-line" d="M80 228L108 258"' + A + '/>' +
    '<path class="dg-line" d="M180 190L208 220"' + A + '/><path class="dg-line" d="M180 224H208"' + A + '/><path class="dg-line" d="M180 258L208 228"' + A + '/>' +
    '<text class="dg-muted" x="20" y="296">all at once, then merge</text></g>' +
  // hierarchical
  '<g data-step="hier"><text class="dg-title" x="360" y="166">4 Hierarchical</text>' +
    node(470, 176, 90, "supervisor", "amber") + node(390, 222, 90, "OPD lead", "amber") + node(550, 222, 90, "finance lead", "amber") +
    node(360, 268, 60, "sched") + node(430, 268, 60, "rooms") + node(530, 268, 56, "billing") + node(594, 268, 66, "insurance") +
    '<path class="dg-line" d="M500 204L450 222M530 204L590 222M420 250L392 268M450 250L460 268M580 250L558 268M610 250L626 268"/>' +
    '<text class="dg-muted" x="360" y="318">teams of teams</text></g>' +
  // network
  '<g data-step="net"><text class="dg-title" x="20" y="346">5 Network / swarm</text>' +
    node(30, 370, 70, "schedule") + node(140, 370, 70, "insurance") + node(85, 408, 70, "billing") +
    '<path class="dg-line" d="M100 384H138"' + A + '/><path class="dg-line" d="M160 398L135 408"' + A + '/><path class="dg-line" d="M85 412L65 398"' + A + '/>' +
    '<text class="dg-muted" x="230" y="390">peers hand off</text><text class="dg-muted" x="230" y="406">directly</text></g>' +
  // debate
  '<g data-step="debate"><text class="dg-title" x="360" y="346">6 Debate / critic</text>' +
    node(380, 380, 80, "drafter", "accent") + node(520, 380, 80, "critic", "amber") +
    '<path class="dg-line" d="M460 388H518"' + A + '/><path class="dg-line" d="M518 402H462"' + A + '/>' +
    '<text class="dg-muted" x="490" y="378" text-anchor="middle">draft</text><text class="dg-muted" x="490" y="424" text-anchor="middle">problems</text></g>' +
  '</svg>';

window.COURSE.chapters.ch22 = {
  id: "ch22",
  title: "Multi-agent patterns",
  oneLine: "Six patterns cover almost every multi-agent design: sequential, router (supervisor), parallel, hierarchical, network and debate. Each answers one question: who decides what happens next?",
  lessons: [

  { title: "Six patterns, one question", blocks: [
    { type: "section", label: "Who decides what happens next?" },
    { type: "text", md: `Every multi-agent design is an answer to one question: **who decides which agent works next?** You (fixed order), one agent (a supervisor), each agent (peers), or nobody because everyone works at once (parallel). The frameworks in Chapters 23–25 are different ways of writing these same patterns.

To keep the patterns visible, this chapter uses a tiny \`Agent\` class with no framework: a name, a system prompt and a \`run()\` that calls the model through \`llm.py\`.` },
    { type: "code", file: "code-samples/ch22/agents.py", lang: "python", code: "@ch22/agents.py",
      note: "Each specialist gets only its own facts in its system prompt. In real systems the facts come from tools (Part B); here they are inline to keep the patterns short." },
    { type: "stepper", svg: PATTERNS_SVG, caption: "The six patterns. Amber boxes decide the route.",
      steps: [
        { on: ["seq"], text: "**Sequential:** a fixed assembly line you design. Each agent's output is the next agent's input. Predictable and easy to test." },
        { on: ["router"], text: "**Router / supervisor:** one agent reads the request and chooses who handles it. The most common pattern for helpdesks." },
        { on: ["par"], text: "**Parallel:** independent specialists work at the same time; a combiner merges their answers. Fast when sub-tasks do not depend on each other." },
        { on: ["hier"], text: "**Hierarchical:** supervisors of supervisors. For large systems where each team has its own lead. Every level adds calls and latency." },
        { on: ["net"], text: "**Network / swarm:** no boss. Each agent either answers or hands off to a named peer. Flexible, but needs loop guards." },
        { on: ["debate"], text: "**Debate / critic:** one agent drafts, another with a different job challenges it. Chapter 11's reflection, with two separate agents." }
      ]},
    { type: "section", label: "Sequential and router in code" },
    { type: "code", file: "code-samples/ch22/sequential_router.py", lang: "python", code: "@ch22/sequential_router.py",
      output: `SEQUENTIAL
  intake     -> Book the paediatrician (children's doctor) on Wednesday for my son.
  scheduling -> Dr Khan (paediatrics) sees patients on Mon, Tue and Fri, not Wednesday. Would Tuesday or Friday suit you?
  reviewer   -> Dr Khan (paediatrics) sees patients on Mon, Tue and Fri, not Wednesday. Would Tuesday or Friday suit you?

ROUTER
  Is the OPD fee refundable?
    -> billing: The Rs 100 OPD registration fee is valid for 7 days; refunds need billing-desk approval.
  Does PM-JAY cover gloves and syringes?
    -> insurance: No. Consumables such as gloves and syringes are not covered by PM-JAY.
  Can I bring my dog?
    -> front desk: I'll connect you with our front desk (1800-000-000).`,
      note: "From a test run with stand-in models for each agent. The routing, the order and the fallback are real code." },
    { type: "text", md: `Notice:

- In **sequential**, the **intake** agent removed the phone number and turned a messy message into a clear request. The **reviewer** found nothing to change. Every message pays for three calls, even simple ones.
- In **router**, the supervisor returns JSON and **code** does the routing. An unknown desk goes to a person instead of to a guess.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Every pattern answers: who decides which agent works next?",
      "Sequential: you decide; predictable, but every message pays for every step.",
      "Router: a supervisor decides; code enforces the choice and the fallback.",
      "The frameworks in the next chapters implement these same patterns."
    ]},
    { type: "quiz", title: "Knowledge check: the patterns", questions: [
      { kind: "match", q: "Match each pattern to who decides what runs next.",
        pairs: [["Sequential", "The developer, in a fixed order"], ["Router / supervisor", "One agent chooses a specialist"], ["Network / swarm", "Each agent chooses the next peer"], ["Parallel", "No one: all run at once, then merge"]] },
      { kind: "tf", q: "In the router example, the supervisor itself calls the billing tools.", answer: false,
        explain: " It only chooses a desk. Code then calls that specialist." }
    ]}
  ]},

  { title: "Parallel work and debate", blocks: [
    { type: "section", label: "Two patterns that improve speed and quality" },
    { type: "code", file: "code-samples/ch22/parallel_debate.py", lang: "python", code: "@ch22/parallel_debate.py",
      output: `PARALLEL
  3 desks answered in parallel in 0.30s
  -> Dr Rao (cardiology) sees patients on Thursday. PM-JAY is accepted here. The OPD registration fee is Rs 100, valid for 7 days.

DEBATE
  round 1: approved=False problems=['Recommends a medicine and dose']
  round 2: approved=True problems=[]
  final after 2 round(s): I'm sorry about the headache. I can't advise on medicines; please ask Dr Mehta at your
  visit, or see a doctor sooner if it gets worse. Dr Mehta sees patients on Monday and Wednesday.`,
      note: "From a test run with stand-in models that each took 0.3 s: three in parallel finished in 0.3 s instead of 0.9 s. The stand-in drafter suggested a medicine on purpose." },
    { type: "text", md: `**Parallel** uses \`asyncio.gather\` (Chapter 4) to call three desks at once. The patient waits for the slowest one, not the sum. Two cautions:

- Only parallelise **independent** work. If billing needs the slot that scheduling picks, they must run in order.
- The **combiner** is told to keep every fact and add none. Combining is where facts get blended or invented, so check it in your evaluation.

**Debate** puts a second agent with a **different job** (patient safety) between the draft and the patient. It caught a medicine recommendation. Compare with Chapter 11's reflection: there the same model checked its own work; here a separate agent with its own instructions does, which is usually stricter. The round limit and the hand-over to a nurse stop endless arguments.` },
    { type: "callout", kind: "warning", md: `A critic agent is a safety **layer**, not a guarantee. Keep hard rules in code too: the emergency keyword check from Chapter 11 should run before any agent sees the message.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Parallel: independent specialists at once; latency = the slowest, not the sum.",
      "The combiner must keep facts and add none; evaluate it.",
      "Debate: a critic with a different job reviews drafts; limit rounds and hand over on disagreement.",
      "Hard safety rules still belong in code."
    ]},
    { type: "quiz", title: "Knowledge check: parallel and debate", questions: [
      { kind: "mcq", q: "Billing must know which slot scheduling chose before quoting the fee. Can they run in parallel?",
        options: ["Yes, always", "No: billing depends on scheduling's result, so they must run in order", "Only with a bigger model", "Only in debate mode"],
        answer: 1,
        why: ["Dependent tasks cannot run at the same time.", "Right.", "Model size does not change the dependency.", "Unrelated."] },
      { kind: "tf", q: "If drafter and critic still disagree after the round limit, the latest draft should be sent.", answer: false,
        explain: " Disagreement means the reply is not safe yet. Hand over to a person." }
    ]}
  ]},

  { title: "Hierarchies and networks", blocks: [
    { type: "section", label: "Hierarchical: teams of teams" },
    { type: "text", md: `A large hospital might have a top supervisor that routes to an **OPD lead** (scheduling, rooms) or a **finance lead** (billing, insurance), and each lead routes to its workers. This keeps each supervisor's choices small (2–4 options), which helps routing accuracy.

The cost: a question to the insurance desk now passes **two** supervisors, each a model call. Use hierarchies only when one supervisor would have too many specialists to choose from reliably (roughly more than 6–8), or when teams must own their own sub-systems.` },
    { type: "section", label: "Network: peers hand off directly" },
    { type: "code", file: "code-samples/ch22/handoffs.py", lang: "python", code: "@ch22/handoffs.py",
      output: `Which days does Dr Iyer work?
  path: scheduling
  reply: Dr Iyer (orthopaedics) works on Tuesday and Thursday.

Is my knee surgery pre-authorisation needed if I use PM-JAY?
  path: scheduling -> insurance
  reply: Yes. With PM-JAY, a planned knee surgery needs pre-authorisation at least 48 hours before admission.`,
      note: "From a test run with stand-in models. The hand-off parsing and the guard from Chapter 21 are real." },
    { type: "text", md: `In a **network** (also called a **swarm**), whichever agent has the conversation either answers or names the next agent. No supervisor call is needed when the first agent is the right one, so simple questions are cheaper. The note passed in the hand-off ("patient asks about PM-JAY pre-authorisation for planned knee surgery") is the context the next agent needs.

The risk is loops (billing → insurance → billing…). That is why the swarm runs inside Chapter 21's \`RunGuard\` with a call budget, a depth limit and ping-pong detection.

| | Supervisor | Network |
| --- | --- | --- |
| Routing calls | One per request (or more) | None when the first agent is right |
| Control | Central, easy to audit | Spread across agents |
| Loops | Rare | Need guards |
| Good for | Helpdesks, clear categories | Conversations that move between topics |` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Hierarchies keep each supervisor's choices small but add calls per level.",
      "Networks let peers hand off directly; cheap when the first agent is right.",
      "Every hand-off needs a short note with the context the next agent needs.",
      "Networks need loop guards: budget, depth, ping-pong."
    ]},
    { type: "quiz", title: "Knowledge check: hierarchies and networks", questions: [
      { kind: "mcq", q: "When is a hierarchy worth its extra calls?",
        options: ["Always, it is more organised", "When one supervisor would choose among too many specialists, or teams own sub-systems", "When there are two specialists", "When tasks run in parallel"],
        answer: 1,
        why: ["It costs calls at every level.", "Right.", "Two specialists need one simple supervisor.", "Parallelism is a separate choice."] },
      { kind: "order", q: "Put a swarm hand-off in order.",
        items: ["Current agent reads the request", "It replies HANDOFF: insurance | note", "The guard records the hand-off and checks for loops", "The insurance agent receives the request plus the note", "The insurance agent answers"] }
    ]}
  ]},

  { title: "Production: state, contracts and choosing a pattern", blocks: [
    { type: "section", label: "Shared or private state?" },
    { type: "text", md: `| | Shared state | Private state + hand-offs |
| --- | --- | --- |
| How | Every agent reads and writes one record (a "blackboard") | Each agent has its own context; only hand-off messages pass between them |
| Good | Simple; every agent sees everything | Small contexts, clear responsibility, easy to trace |
| Risk | One agent's mistake or injected text reaches all; contexts grow | A needed detail may not be passed |
| Use for | Small teams of closely related agents | Most production systems, and anything with personal data |` },
    { type: "section", label: "Contracts between agents" },
    { type: "code", file: "code-samples/ch22/contracts.py", lang: "python", code: "@ch22/contracts.py",
      output: `valid:   {'run_id': 'run-42', 'from_agent': 'supervisor', 'to_agent': 'scheduling', 'task': "Find Dr Rao's next Thursday slot", 'patient_ref': 'UHID-1001', 'context': ''}
refused: to_agent: Input should be 'scheduling', 'billing' or 'insurance'
refused: patient_ref: String should match pattern '^UHID-\\d{4,}$'
refused: context: Value error, contains a phone number; pass the UHID instead
result:  {'run_id': 'run-42', 'agent': 'scheduling', 'status': 'needs_approval', 'answer': 'Thu 10:30 with Dr Rao is free; staff will confirm.', 'data': {'slot': 'Thu 10:30'}}`,
      note: "Real output: plain Python and Pydantic." },
    { type: "text", md: `A **contract** is a Pydantic model for every hand-off and every result. It gives you:

- **Early errors:** a hand-off to a desk that does not exist fails at once, not three calls later.
- **Privacy by design:** names and phone numbers are refused; only the UHID travels.
- **Traceability:** every message carries the \`run_id\` (Chapter 21).
- **Clear status:** \`done\`, \`needs_approval\` or \`cannot_help\` tells the supervisor exactly what to do next.

Ask agents for these shapes with structured output (Chapter 12), and validate them in code.` },
    { type: "section", label: "Choosing a pattern" },
    { type: "text", md: `| Situation | Start with |
| --- | --- |
| Steps are known and always the same | Sequential (or a single agent with a workflow) |
| Requests fall into clear categories | Router / supervisor |
| Several independent look-ups per request | Parallel, inside a supervisor |
| Many teams, many specialists | Hierarchical |
| Conversations wander between topics | Network / swarm, with guards |
| High-stakes replies | Add a debate / critic step before sending |

Patterns combine: the capstone in Chapter 27 is a supervisor with parallel specialists and a compliance critic.` },
    { type: "list", style: "mistakes", items: [
      "**Free-text hand-offs.** Details get lost or invented; use contracts.",
      "**Passing the whole conversation to every agent.** Costly, and spreads personal data.",
      "**Parallel agents that secretly depend on each other.** Results conflict.",
      "**A critic with the same instructions as the drafter.** It agrees with itself; give it a different job."
    ]},
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Prefer private state with explicit hand-offs in production.",
      "Use validated contracts (run id, task, ids not personal details, status).",
      "Pick the pattern from the shape of the work; combine patterns as needed.",
      "Give critics a different job from drafters."
    ]},
    { type: "quiz", title: "Knowledge check: production patterns", questions: [
      { kind: "match", q: "Match each situation to a starting pattern.",
        pairs: [["Requests fall into billing, scheduling or insurance", "Router / supervisor"], ["Always intake, then answer, then review", "Sequential"], ["Check three systems at once for one request", "Parallel"], ["Replies about medicines need a safety check", "Debate / critic"]] },
      { kind: "tf", q: "A hand-off contract should include the patient's phone number so the next agent can call them.", answer: false,
        explain: " Pass an identifier (UHID). Agents that need contact details can look them up with permission-checked tools." }
    ]}
  ]}

  ]
};
})();
