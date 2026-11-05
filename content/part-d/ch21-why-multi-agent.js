/* Chapter 21 · Why and when multiple agents */
(function () {

var SPLIT_SVG = `
<svg viewBox="0 0 680 250" xmlns="http://www.w3.org/2000/svg">
  <g data-step="one"><text class="dg-title" x="150" y="24" text-anchor="middle">One agent does everything</text>
    <rect class="dg-box amber" x="40" y="40" width="220" height="190" rx="14"/>
    <text class="dg-title" x="150" y="66" text-anchor="middle">Helpdesk agent</text>
    <text class="dg-muted" x="150" y="90" text-anchor="middle">16 tools · 6 can change records</text>
    <text class="dg-muted" x="150" y="110" text-anchor="middle">rules for scheduling, billing,</text>
    <text class="dg-muted" x="150" y="128" text-anchor="middle">insurance and reports in one prompt</text>
    <text class="dg-muted" x="150" y="156" text-anchor="middle">~2,300 tokens of tool schemas</text>
    <text class="dg-muted" x="150" y="174" text-anchor="middle">in every single call</text>
    <text class="dg-muted" x="150" y="206" text-anchor="middle">one owner, one test set</text></g>
  <g data-step="many"><text class="dg-title" x="500" y="24" text-anchor="middle">Specialists</text>
    <rect class="dg-box accent" x="420" y="40" width="160" height="36" rx="8"/><text class="dg-text" x="500" y="63" text-anchor="middle">Supervisor</text>
    <rect class="dg-box" x="330" y="120" width="80" height="60" rx="8"/><text class="dg-text" x="370" y="146" text-anchor="middle">Schedule</text><text class="dg-muted" x="370" y="164" text-anchor="middle">4 tools</text>
    <rect class="dg-box" x="420" y="120" width="80" height="60" rx="8"/><text class="dg-text" x="460" y="146" text-anchor="middle">Billing</text><text class="dg-muted" x="460" y="164" text-anchor="middle">4 tools</text>
    <rect class="dg-box" x="510" y="120" width="80" height="60" rx="8"/><text class="dg-text" x="550" y="146" text-anchor="middle">Insurance</text><text class="dg-muted" x="550" y="164" text-anchor="middle">4 tools</text>
    <rect class="dg-box" x="600" y="120" width="76" height="60" rx="8"/><text class="dg-text" x="638" y="146" text-anchor="middle">Reports</text><text class="dg-muted" x="638" y="164" text-anchor="middle">4 tools</text>
    <path class="dg-line" d="M480 76L370 120M490 76L460 120M510 76L550 120M520 76L638 120"/>
    <text class="dg-muted" x="500" y="212" text-anchor="middle">small prompts, own rules and permissions,</text>
    <text class="dg-muted" x="500" y="230" text-anchor="middle">but more calls, hand-offs and moving parts</text></g>
</svg>`;

window.COURSE.chapters.ch21 = {
  id: "ch21",
  title: "Why and when multiple agents",
  oneLine: "Several specialised agents can beat one overloaded agent, but they cost more tokens, add latency and are harder to debug. Start with one agent and split only when you can name the reason and measure the gain.",
  lessons: [

  { title: "When one agent is not enough", blocks: [
    { type: "section", label: "The helpdesk keeps growing" },
    { type: "text", md: `Your Clinic Helpdesk started with two tools. Six months later it handles scheduling, billing, insurance and reports. Each team wants its own tools and rules. Here is what that does to one agent:` },
    { type: "code", file: "code-samples/ch21/tool_overload.py", lang: "python", code: "@ch21/tool_overload.py",
      output: `One agent: 16 tools, ~2,261 tokens of schemas in every call, 6 of them can change records
  scheduling  specialist: 4 tools, ~566 tokens, writes: ['request_appointment', 'cancel_appointment']
  billing     specialist: 4 tools, ~558 tokens, writes: ['create_refund_request']
  insurance   specialist: 4 tools, ~568 tokens, writes: ['start_preauth']
  reports     specialist: 4 tools, ~568 tokens, writes: ['send_report_link', 'request_report_correction']`,
      note: "Real output: plain Python, no model." },
    { type: "stepper", svg: SPLIT_SVG, caption: "One agent with everything, or a supervisor with specialists.",
      steps: [
        { on: ["one"], text: "**One agent** sees all 16 tools and every team's rules in every call. More choices mean more wrong choices (a billing question answered with \`start_preauth\`), and one prompt change can break another team's behaviour." },
        { on: ["many"], text: "**Specialists** each see 4 tools and one set of rules. A **supervisor** decides who handles what. Each part is smaller and easier to test, but the system now has hand-offs that can fail." }
      ]},
    { type: "text", md: `A [[multi-agent system]] is worth considering when you see these signs:

| Sign | Clinic example |
| --- | --- |
| **Too many tools** (roughly 10–20+) and the model picks wrong ones | Billing questions answered with insurance tools |
| **Conflicting instructions** that are hard to keep in one prompt | Billing must quote exact amounts; reports must never interpret results |
| **Different permissions** | Only the billing agent may create refunds |
| **Different owners** | The insurance team wants to change its part without retesting everything |
| **Work that can run in parallel** | Check insurance, schedule and directions at the same time |
| **Context that gets too long** | A long report summary pushes the conversation out of the window |

If none of these apply, a single agent with good tools (Part B) is simpler, cheaper and easier to fix.` },
    { type: "callout", kind: "analogy", md: `A small clinic has one receptionist who does everything. A large hospital has a front desk that sends you to billing, insurance or the lab. The hospital is not better because it has more people; it is better *at its size*. Your system's size and complexity should decide, not the fashion.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Split into agents for a reason you can name: tool overload, conflicting rules, permissions, owners, parallel work or context size.",
      "Specialists get smaller prompts and clearer rules.",
      "Every split adds hand-offs that can fail.",
      "No clear reason? Keep one agent."
    ]},
    { type: "quiz", title: "Knowledge check: when to split", questions: [
      { kind: "mcq", q: "Which is the strongest reason to split the helpdesk into specialists?",
        options: ["Multi-agent systems are more modern", "Only billing staff may approve refunds, and the refund tool must be invisible to other parts", "The system prompt has two paragraphs", "To use more models"],
        answer: 1,
        why: ["Fashion is not a reason.", "Right: different permissions are a clear reason.", "Two paragraphs is fine in one prompt.", "More models is a cost, not a goal."] },
      { kind: "tf", q: "A single agent with 4 well-described tools usually needs to be split into multiple agents.", answer: false,
        explain: " That is a comfortable size for one agent." }
    ]}
  ]},

  { title: "The costs: tokens, latency, debugging", blocks: [
    { type: "section", label: "Do the maths before building" },
    { type: "code", file: "code-samples/ch21/cost_model.py", lang: "python", code: "@ch21/cost_model.py",
      output: `design                                       calls  tokens in  cost (US$)  waits
One agent, 16 tools                              5     15,600     0.00744      5
Supervisor, one specialist at a time            13     17,040     0.00994     13
Supervisor plans, specialists in parallel       10     12,000     0.00720      4

Largest single prompt, one agent: 3,920 tokens with 16 tool schemas to choose from
Largest single prompt, specialist: 1,280 tokens with 4 tools

At 10,000 conversations a day: one agent $74.40, supervisor $99.36`,
      note: "Real output. The prices and sizes are illustrative assumptions; change them at the top of the file for your model." },
    { type: "text", md: `What the numbers say:

- **More calls, not always more tokens.** Specialists send small prompts, so total tokens can be similar. But a supervisor that waits for each specialist makes **13 calls in a row**: the patient waits 13 model round-trips instead of 5.
- **Parallel specialists fix latency** (4 waits) and can even be cheaper, but only when the sub-tasks do not depend on each other.
- **Prompt size per call drops a lot** (3,920 → 1,280 tokens). Smaller, focused prompts usually mean better tool choices.

Real systems are usually more expensive than this simple model. Anthropic reported that in its research product, agents used about **4×** the tokens of a chat, and its multi-agent system about **15×**, with clearly better results on research tasks. The same report notes that tasks where agents must share a lot of context or depend on each other closely are poor fits.` },
    { type: "text", md: `| Cost | Why it grows with more agents | What helps |
| --- | --- | --- |
| **Tokens** | Each agent re-reads its own context; hand-offs repeat information | Pass short summaries, not whole histories |
| **Latency** | Sequential hand-offs add round-trips | Run independent specialists in parallel |
| **Debugging** | A wrong answer may come from the supervisor, a specialist or the hand-off | Trace every hand-off with ids (Lesson 4) |
| **Testing** | Each agent and each route needs test cases | Test agents alone, then the routes |
| **Consistency** | Two agents may give different answers to the same fact | One source of truth per fact (a tool, not each agent's memory) |` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Count calls, prompt sizes and sequential waits before choosing a design.",
      "Sequential hand-offs hurt latency; parallel specialists help when tasks are independent.",
      "Specialists' smaller prompts often improve accuracy.",
      "Multi-agent systems usually cost several times more tokens; the task's value must justify it."
    ]},
    { type: "quiz", title: "Knowledge check: costs", questions: [
      { kind: "mcq", q: "Patients complain the multi-agent helpdesk is slow. The supervisor calls four specialists one after another, and their tasks are independent. Best fix?",
        options: ["A bigger model", "Run the four specialists in parallel", "Add a fifth specialist", "Remove the supervisor's system prompt"],
        answer: 1,
        why: ["Bigger models are usually slower.", "Right: independent tasks can run at the same time.", "More agents means more calls.", "That would break routing."] },
      { kind: "match", q: "Match each cost to what helps.",
        pairs: [["Tokens repeated in hand-offs", "Pass short summaries"], ["Hard to find which agent was wrong", "Trace every hand-off"], ["Two agents disagree on a fee", "One tool as the source of truth"]] }
    ]}
  ]},

  { title: "Designing the split", blocks: [
    { type: "section", label: "Split by responsibility, not by step" },
    { type: "text", md: `Good boundaries follow **who owns what**, not the order of steps:

- **Good:** a billing agent that owns all billing tools and rules. It can answer any billing question on its own.
- **Poor:** a "planner", a "searcher" and a "writer" for every question. Each one needs the full context to do its part, so information is passed back and forth constantly.

For each agent, write a one-paragraph **contract** before you code: what it is responsible for, what it must never do, its tools, its input and output, and who reviews its writes.` },
    { type: "text", md: `| Agent | Owns | Never | Tools | Writes need |
| --- | --- | --- | --- | --- |
| Supervisor | Understanding the request, routing, the final reply | Calling business tools itself | Hand-off tools only | — |
| Scheduling | Doctors' days, slots, booking requests | Medical advice | 4 scheduling tools | Staff approval |
| Billing | Bills, charges, refunds | Promising refunds before approval | 4 billing tools | Billing staff approval |
| Insurance | Scheme eligibility, pre-authorisation | Guessing coverage | 4 insurance tools + policy RAG | Insurance desk approval |` },
    { type: "section", label: "What travels between agents" },
    { type: "text", md: `A **[[handoff|hand-off]]** passes work from one agent to another. Decide exactly what goes with it:

1. **The task**, written for the receiving agent: "Find Dr Rao's next free Thursday slot for patient UHID-1001."
2. **Only the context it needs**, as a short summary, not the whole conversation.
3. **Identifiers**, not personal details, where possible (UHID rather than name and phone).
4. **What to return**: a structured result (\`{"slot": "Thu 10:30", "doctor": "Dr Rao"}\`) that the supervisor can use directly.

Shared state (everyone reads and writes one record) is simple but lets one agent's mistake spread. Private state with explicit hand-offs is safer and easier to debug. Part D's frameworks support both; Chapter 22 shows the patterns.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Split by responsibility and ownership, not by processing step.",
      "Write a contract per agent: owns, never, tools, inputs, outputs, approvals.",
      "Hand-offs carry a task, a short summary, identifiers and a defined result shape.",
      "Prefer private state with explicit hand-offs for safety and debugging."
    ]},
    { type: "quiz", title: "Knowledge check: designing the split", questions: [
      { kind: "mcq", q: "Which hand-off message is best for the scheduling agent?",
        options: ["The whole 40-message conversation", "\"Find Dr Rao's next free Thursday slot for UHID-1001; return slot and doctor as JSON\"", "\"Help the patient\"", "The patient's name, phone and address"],
        answer: 1,
        why: ["Too much: costly and distracting.", "Right: task, identifier, result shape.", "Too vague.", "Personal details it does not need."] },
      { kind: "tf", q: "A planner-searcher-writer split for every question usually reduces how much context is passed around.", answer: false,
        explain: " Each step needs the full context, so it is passed back and forth. Splitting by responsibility avoids that." }
    ]}
  ]},

  { title: "Production: guards and observability", blocks: [
    { type: "section", label: "New ways to fail" },
    { type: "text", md: `Multi-agent systems fail in ways a single agent cannot:

- **Runaway specialist:** one agent loops and spends the whole budget.
- **Ping-pong:** billing hands to insurance, insurance hands back to billing, forever.
- **Endless delegation:** a supervisor hands to a sub-supervisor, which hands to another…
- **Lost context:** the specialist did not get the one detail that mattered.
- **Conflicting answers:** two agents state different fees.

The first three are stopped by simple code guards that wrap **all** agents, not each one separately.` },
    { type: "code", file: "code-samples/ch21/failure_guards.py", lang: "python", code: "@ch21/failure_guards.py",
      output: `normal     finished: calls={'supervisor': 2, 'scheduling': 2} path=['scheduling']
ping-pong  STOPPED  ping-pong: billing -> insurance -> billing -> insurance
runaway    STOPPED  budget: 21 model calls; most by reports`,
      note: "Real output: plain Python. Chapter 23 adds this to a LangGraph supervisor." },
    { type: "section", label: "Tracing across agents" },
    { type: "list", items: [
      "**One run id for the whole request**, passed to every agent, so one search shows everything that happened.",
      "**Log every hand-off:** from, to, the task text, the summary passed and the result returned.",
      "**Per-agent metrics:** calls, tokens, latency and error rate per agent. A sudden rise in one agent's calls is an early warning.",
      "**Evaluate in layers:** each specialist on its own test set, the supervisor's routing on a routing test set (\"this question should go to billing\"), and the whole system end to end (Chapter 27).",
      "**Tools such as LangSmith, Langfuse and AgentOps** (Chapter 31) show multi-agent traces as trees, which makes hand-off problems visible."
    ]},
    { type: "list", style: "mistakes", items: [
      "**Splitting before measuring.** Build one agent, evaluate it, and split only the part that fails.",
      "**A separate budget per agent but no total.** Five agents × 20 calls each is still 100 calls.",
      "**No routing tests.** The specialists are perfect and the supervisor sends questions to the wrong one.",
      "**Each agent remembering facts itself.** Fees and schedules belong in tools, so every agent gets the same answer."
    ]},
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Guard the whole system: total budget, hand-off depth and ping-pong detection.",
      "Use one run id and log every hand-off.",
      "Evaluate specialists, routing and the whole system separately.",
      "Start with one agent; split where evaluation shows a need."
    ]},
    { type: "quiz", title: "Knowledge check: production", questions: [
      { kind: "match", q: "Match each failure to the guard or practice.",
        pairs: [["Billing and insurance hand back and forth", "Ping-pong detection"], ["One specialist makes 30 calls", "A total budget across all agents"], ["Questions reach the wrong specialist", "A routing test set"], ["Cannot see what happened in one request", "One run id passed to every agent"]] },
      { kind: "order", q: "Put the recommended path in order.",
        items: ["Build one agent", "Evaluate it with a test set", "Find the part that fails or overloads", "Split that part into a specialist", "Re-evaluate the whole system"] }
    ]}
  ]}

  ]
};
})();
