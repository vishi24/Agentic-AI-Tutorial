/* Chapter 11 · Agent design patterns */
(function () {

var REFLECT_SVG = `
<svg viewBox="0 0 680 170" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch11-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="gen"><rect class="dg-box" x="20" y="40" width="150" height="60" rx="10"/><text class="dg-title" x="95" y="66" text-anchor="middle">Generate</text><text class="dg-muted" x="95" y="84" text-anchor="middle">first draft</text></g>
  <g data-step="crit"><rect class="dg-box amber" x="240" y="40" width="170" height="60" rx="10"/><text class="dg-title" x="325" y="66" text-anchor="middle">Critique</text><text class="dg-muted" x="325" y="84" text-anchor="middle">check against rubric</text></g>
  <g data-step="rev"><rect class="dg-box accent" x="480" y="40" width="180" height="60" rx="10"/><text class="dg-title" x="570" y="66" text-anchor="middle">Pass? Send it.</text><text class="dg-muted" x="570" y="84" text-anchor="middle">Fail? Revise and recheck</text></g>
  <path class="dg-line" d="M170 70H238" marker-end="url(#ch11-a)"/><path class="dg-line" d="M410 70H478" marker-end="url(#ch11-a)"/>
  <path class="dg-line" d="M570 100V136H325V102" marker-end="url(#ch11-a)"/><text class="dg-muted" x="450" y="154" text-anchor="middle">revise (at most N rounds)</text>
</svg>`;

var PLANS_SVG = `
<svg viewBox="0 0 680 330" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch11-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="react"><text class="dg-title" x="20" y="24">ReAct: decide one step at a time</text>
    <rect class="dg-box accent" x="20" y="34" width="70" height="34" rx="6"/><text class="dg-text" x="55" y="56" text-anchor="middle">think</text>
    <rect class="dg-box" x="100" y="34" width="70" height="34" rx="6"/><text class="dg-text" x="135" y="56" text-anchor="middle">tool</text>
    <rect class="dg-box accent" x="180" y="34" width="70" height="34" rx="6"/><text class="dg-text" x="215" y="56" text-anchor="middle">think</text>
    <rect class="dg-box" x="260" y="34" width="70" height="34" rx="6"/><text class="dg-text" x="295" y="56" text-anchor="middle">tool</text>
    <rect class="dg-box accent" x="340" y="34" width="70" height="34" rx="6"/><text class="dg-text" x="375" y="56" text-anchor="middle">answer</text>
    <text class="dg-muted" x="430" y="56">model call before every step</text></g>
  <g data-step="pe"><text class="dg-title" x="20" y="114">Plan-and-execute: plan, run, replan only if needed</text>
    <rect class="dg-box accent" x="20" y="124" width="70" height="34" rx="6"/><text class="dg-text" x="55" y="146" text-anchor="middle">plan</text>
    <rect class="dg-box" x="100" y="124" width="60" height="34" rx="6"/><text class="dg-text" x="130" y="146" text-anchor="middle">tool</text>
    <rect class="dg-box" x="170" y="124" width="60" height="34" rx="6"/><text class="dg-text" x="200" y="146" text-anchor="middle">tool ✗</text>
    <rect class="dg-box amber" x="240" y="124" width="80" height="34" rx="6"/><text class="dg-text" x="280" y="146" text-anchor="middle">replan</text>
    <rect class="dg-box" x="330" y="124" width="60" height="34" rx="6"/><text class="dg-text" x="360" y="146" text-anchor="middle">tool</text>
    <rect class="dg-box accent" x="400" y="124" width="70" height="34" rx="6"/><text class="dg-text" x="435" y="146" text-anchor="middle">answer</text>
    <text class="dg-muted" x="490" y="146">adapts when a step fails</text></g>
  <g data-step="rewoo"><text class="dg-title" x="20" y="204">ReWOO: plan everything, run all tools, answer once</text>
    <rect class="dg-box accent" x="20" y="214" width="70" height="34" rx="6"/><text class="dg-text" x="55" y="236" text-anchor="middle">plan</text>
    <rect class="dg-box" x="100" y="214" width="60" height="34" rx="6"/><text class="dg-text" x="130" y="236" text-anchor="middle">#E1</text>
    <rect class="dg-box" x="170" y="214" width="60" height="34" rx="6"/><text class="dg-text" x="200" y="236" text-anchor="middle">#E2</text>
    <rect class="dg-box" x="240" y="214" width="60" height="34" rx="6"/><text class="dg-text" x="270" y="236" text-anchor="middle">#E3</text>
    <rect class="dg-box accent" x="310" y="214" width="70" height="34" rx="6"/><text class="dg-text" x="345" y="236" text-anchor="middle">answer</text>
    <text class="dg-muted" x="400" y="236">2 model calls, whatever the steps</text></g>
  <text class="dg-muted" x="20" y="300">Highlighted boxes are model calls. Fewer model calls = cheaper and faster; more = more adaptable.</text>
</svg>`;

window.COURSE.chapters.ch11 = {
  id: "ch11",
  title: "Agent design patterns",
  oneLine: "A handful of proven patterns (reflection, ReAct, plan-and-execute, ReWOO, human-in-the-loop and confidence-based hand-off) cover most agent designs. Each trades cost and speed for quality and control.",
  lessons: [

  { title: "Reflection: check your own work", blocks: [
    { type: "section", label: "The problem" },
    { type: "text", md: `A patient writes "I've had chest pain since morning. Should I take a Disprin and wait for Dr Rao on Thursday?" A first draft might answer the scheduling question and miss the danger. A good receptionist re-reads before sending. Agents can too.` },
    { type: "stepper", svg: REFLECT_SVG, caption: "Reflection: draft, critique against a written rubric, revise.",
      steps: [
        { on: ["gen"], text: "**Generate** a first draft as usual." },
        { on: ["crit"], text: "**Critique:** a second call checks the draft against a written **rubric** and returns pass/fail plus specific problems as JSON." },
        { on: ["rev"], text: "**Pass:** send it. **Fail:** revise using the listed problems and check again, at most N rounds." }
      ]},
    { type: "code", file: "code-samples/ch11/reflection.py", lang: "python", code: "@ch11/reflection.py",
      output: `round 1: pass=False problems=['Gives medicine advice', 'Does not send chest pain to Emergency']
round 2: pass=True problems=[]

Final (4 model calls):
Chest pain can be serious. Please go to Emergency now or call 108. Don't wait for
Thursday; we can book Dr Rao for a follow-up later.`,
      note: "Output from a test run with a stand-in model whose first draft was unsafe on purpose." },
    { type: "text", md: `What makes reflection work:

- **A specific rubric.** "Is this good?" gets "Yes". Five checkable points get real problems.
- **Structured verdicts.** JSON with \`pass\` and \`problems\` lets code decide, and the problems tell the reviser exactly what to fix.
- **A round limit.** Each round costs two calls. Two rounds catch most issues.
- **The right places.** Use it where a mistake is costly (safety replies, documents sent to patients), not on every "OPD opens at 9".` },
    { type: "callout", kind: "warning", md: `Reflection lowers risk; it does not remove it. For safety-critical rules, a **rule check in code** (like the emergency keywords in Lesson 3) is more reliable than asking a model to check a model.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Reflection = generate, critique against a rubric, revise; usually 1–2 rounds.",
      "A specific rubric and a JSON verdict make the critique useful.",
      "It roughly doubles to triples cost, so use it where mistakes matter."
    ]},
    { type: "quiz", title: "Knowledge check: reflection", questions: [
      { kind: "mcq", q: "Why does the critic return JSON with a list of problems?",
        options: ["JSON is faster", "Code can decide pass/fail, and the reviser gets exact problems to fix", "The API requires it", "To save tokens"],
        answer: 1,
        why: ["Not the reason.", "Right.", "It does not.", "It costs a little more, not less."] },
      { kind: "tf", q: "Reflection makes a reply guaranteed safe.", answer: false,
        explain: " It reduces mistakes. Hard safety rules belong in code." }
    ]}
  ]},

  { title: "Planning: ReAct, plan-and-execute, ReWOO", blocks: [
    { type: "section", label: "Three ways to organise steps" },
    { type: "stepper", svg: PLANS_SVG, caption: "Three planning patterns. Highlighted boxes are model calls.",
      steps: [
        { on: ["react"], text: "**ReAct** (Chapter 9): think, act, observe, repeat. Most flexible; one model call per step." },
        { on: ["pe"], text: "**Plan-and-execute:** write the whole plan first, run it, and **replan** only when a step fails or reveals something new." },
        { on: ["rewoo"], text: "**ReWOO** (Reasoning WithOut Observation): plan every tool call with placeholders, run them all with no model in between, answer once. Fewest calls; cannot adapt mid-way." }
      ]},
    { type: "code", file: "code-samples/ch11/plan_execute.py", lang: "python", code: "@ch11/plan_execute.py",
      output: `PLAN-AND-EXECUTE
  ran get_doctor_schedule({'department': 'orthopaedics'}) -> {'department': 'orthopaedics', 'doctors': {'Dr Iyer': ['Tue', 'Thu']}}
  ran request_appointment({'doctor': 'Dr Iyer', 'day': 'Wed', 'patient_name': 'Asha Verma'}) -> {'error': 'Dr Iyer does not see patients on Wed.', 'available_days': ['Tue', 'Thu']}
  step failed -> replanning
  ran request_appointment({'doctor': 'Dr Iyer', 'day': 'Thu', 'patient_name': 'Asha Verma'}) -> {'request_id': 'REQ-001', ..., 'status': 'pending staff approval'}
-> Dr Iyer doesn't see patients on Wednesday, so I've requested Thursday for you. Staff will confirm.
   (3 model calls, 3 tool steps)

REWOO
  #E1 = get_doctor_schedule({'department': 'cardiology'}) -> {...'Dr Rao': ['Thu', 'Fri']}}
  #E2 = get_doctor_schedule({'department': 'orthopaedics'}) -> {...'Dr Iyer': ['Tue', 'Thu']}}
-> Dr Rao works Thursday and Friday; Dr Iyer works Tuesday and Thursday.
   (2 model calls, 2 tool steps)`,
      note: "Output from a test run with a stand-in model. The replan is real: the planned Wednesday request failed, and the replanner used the error's available days." },
    { type: "text", md: `Notice what happened in plan-and-execute: the first plan was reasonable but wrong (Dr Iyer does not work Wednesdays). Instead of failing, the executor **replanned with the results so far**, including the tool's helpful \`available_days\`. That is why tools should return useful errors (Chapter 8).` },
    { type: "section", label: "Which one when?" },
    { type: "text", md: `| | ReAct | Plan-and-execute | ReWOO |
| --- | --- | --- | --- |
| Model calls | One per step | Plan + replans + answer | Exactly 2 |
| Adapts to surprises | Every step | When a step fails | No |
| Plan visible in advance | No | Yes, can be approved | Yes |
| Best for | Open-ended questions, conversation | Multi-step tasks with known tools | Fixed lookups that do not depend on each other |
| Clinic example | Helpdesk chat | "Book the earliest slot that suits my insurance" | "Which days do Dr Rao and Dr Iyer work?" |

A visible plan has a bonus: a person can **approve the plan** before anything runs, which is much easier than approving every step.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "ReAct decides step by step: flexible, more calls.",
      "Plan-and-execute plans up front and replans on failure: efficient and reviewable.",
      "ReWOO runs all planned tools without the model in between: cheapest, least adaptive.",
      "Helpful tool errors make replanning work."
    ]},
    { type: "quiz", title: "Knowledge check: planning patterns", questions: [
      { kind: "match", q: "Match each task to the best pattern.",
        pairs: [["Open-ended chat with a patient", "ReAct"], ["Look up 3 doctors' days and summarise", "ReWOO"], ["Multi-step booking that may hit unavailable days", "Plan-and-execute"]] },
      { kind: "mcq", q: "ReWOO needs only two model calls because…",
        options: ["It skips tools", "It plans all tool calls up front and writes the answer once, with no model calls between tools", "It uses a smaller model", "It caches answers"],
        answer: 1,
        why: ["It runs every planned tool.", "Right.", "Model size is unrelated.", "No caching involved."] }
    ]}
  ]},

  { title: "Knowing when to hand over", blocks: [
    { type: "section", label: "Human-in-the-loop, revisited" },
    { type: "text", md: `Chapter 9's harness asked a person before **write** actions. Two more hand-off triggers matter in healthcare: **danger** (possible emergencies) and **uncertainty** (the agent does not know). The order of checks matters:

1. **Hard rules first,** in code, with no model needed: emergency words, restricted topics, write actions.
2. **Then the model's confidence:** ask it to rate its confidence and say what information is missing.
3. **Then a person,** with the agent's draft attached so they do not start from zero.` },
    { type: "code", file: "code-samples/ch11/confidence.py", lang: "python", code: "@ch11/confidence.py",
      output: `auto      conf=0.92  Is OPD open on Saturday evening?
          -> Yes, OPD is open on Saturday from 4 to 7 pm.
human     conf=0.35  Does my company insurance cover a knee MRI?
          -> Let me connect you with our front desk to be sure.  (the patient's insurer's MRI coverage)
emergency conf=None  My father is breathless and very drowsy
          -> Please go to Emergency now or call 108. A nurse is being alerted.  (emergency keywords)`,
      note: "Output from a test run. The emergency case never reaches the model: the rule catches it first." },
    { type: "callout", kind: "warning", md: `A model's self-reported confidence is a **signal, not a guarantee**: models can be confidently wrong. Use it to route doubtful cases to people, never as the only safety check, and measure how well it matches real correctness on your test set.` },
    { type: "section", label: "Deep agents and self-improvement" },
    { type: "text", md: `You will hear "deep agents": agents built for long, complex tasks. They are not a new kind of thing; they **combine the patterns** you now know:

- **Planning** with a written plan they update as they go (plan-and-execute).
- **Reflection** on their own outputs against criteria.
- **Long-term memory** of facts, episodes and rules (Chapter 10).
- **Sub-tasks handed to helper agents** (Part D).
- **Confidence checks and escalation** when unsure.
- **Self-improvement** from evaluation scores: Chapter 9, Lesson 6 built this, with human approval and an evaluation gate.

The more of these you add, the more capable and the more expensive and harder to test the agent becomes. Add each only when your evaluation shows you need it.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Check hard rules in code first, then model confidence, then hand to a person with the draft.",
      "Self-reported confidence is a routing signal, not a safety guarantee.",
      "'Deep agents' combine planning, reflection, memory, delegation and self-improvement."
    ]},
    { type: "quiz", title: "Knowledge check: hand-over", questions: [
      { kind: "order", q: "Put the checks in the right order.",
        items: ["Hard rules in code (emergency words, write actions)", "Model's confidence and missing information", "Hand over to a person with the draft"] },
      { kind: "tf", q: "If the model says it is 95% confident, the answer can skip all other checks.", answer: false,
        explain: " Models can be confidently wrong. Rules and evaluation still apply." }
    ]}
  ]},

  { title: "Production: choosing and combining patterns", blocks: [
    { type: "section", label: "Start simple, add only what the evaluation demands" },
    { type: "text", md: `Every pattern adds model calls, delay and complexity. The production approach is to start with the simplest design that could work, measure it (Chapter 9), and add a pattern **only to fix a failure you have seen**.

| Failure you see in evaluation | Pattern that fixes it | Extra cost per request |
| --- | --- | --- |
| Unsafe or rubric-breaking replies | Reflection on those reply types | +1–4 calls |
| Long tasks wander or repeat steps | Plan-and-execute | Usually fewer calls than ReAct |
| Simple fixed lookups are slow | ReWOO | Fewer calls |
| Confident wrong answers on hard questions | Confidence routing to staff | +0 calls (same call returns confidence) |
| Emergencies handled like routine questions | A hard rule in code | None |
| Writes happen without consent | Approval in the harness (Chapter 9) | A person's time |` },
    { type: "section", label: "A sensible default for the Clinic Helpdesk" },
    { type: "list", items: [
      "**Rules first:** emergency keywords and restricted topics, in code.",
      "**ReAct agent** with read tools (Chapter 9) for ordinary questions.",
      "**Plan-and-execute** for booking flows, with the plan shown to the patient or staff before any write.",
      "**Reflection** only on replies that mention symptoms, money or documents sent to patients.",
      "**Confidence routing** to the front desk when the agent is unsure.",
      "**Evaluation** on every change, and **self-learning lessons** with approval and a gate."
    ]},
    { type: "callout", kind: "tip", md: `Measure the cost of each pattern on your own test set: count model calls and tokens per request (the traces from Chapter 9 already record them). A pattern that adds 3 calls to every request must earn its place in the score.` },
    { type: "section", label: "Watch" },
    { type: "videos", ids: ["ng-agentic-workflows"] },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Start simple; add a pattern only to fix a failure your evaluation shows.",
      "Put hard safety rules in code, not in patterns that rely on the model.",
      "Combine patterns per request type, and measure their cost in calls and tokens."
    ]},
    { type: "quiz", title: "Knowledge check: choosing patterns", questions: [
      { kind: "mcq", q: "Your evaluation shows the agent sometimes gives medicine advice. What do you add first?",
        options: ["A multi-agent team", "A hard rule or reflection on replies that mention symptoms, plus test cases", "A bigger context window", "ReWOO"],
        answer: 1,
        why: ["Far more than needed.", "Right.", "Unrelated.", "ReWOO is about efficiency, not safety."] },
      { kind: "tf", q: "Adding reflection to every reply is a good default because it always improves quality.", answer: false,
        explain: " It multiplies cost and delay. Use it where mistakes matter and the evaluation shows a need." }
    ]}
  ]}
  ]
};
})();
