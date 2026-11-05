/* Chapter 9 · The agent: loop and architecture (pilot chapter).
   Code blocks starting with "@" are the real, tested files from code-samples/ch09/. */
(function () {

/* ================================================================ diagrams */
var LOOP_SVG = `
<svg viewBox="0 0 680 320" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch09-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <path class="dg-line" d="M160 70H198" marker-end="url(#ch09-arr)"/>
  <path class="dg-line" d="M340 70H368" marker-end="url(#ch09-arr)"/>
  <path class="dg-line" d="M492 70H528" marker-end="url(#ch09-arr)"/>
  <path class="dg-line" d="M430 110V208" marker-end="url(#ch09-arr)"/>
  <path class="dg-line" d="M360 240H342" marker-end="url(#ch09-arr)"/>
  <path class="dg-line" d="M270 210V102" marker-end="url(#ch09-arr)"/>
  <text class="dg-muted" x="510" y="30" text-anchor="middle">yes: final answer</text>
  <text class="dg-muted" x="442" y="164">no: needs a tool</text>
  <text class="dg-muted" x="258" y="160" text-anchor="end">result goes back</text>
  <text class="dg-muted" x="258" y="176" text-anchor="end">loop again</text>
  <g data-step="perceive"><rect class="dg-box" x="20" y="40" width="140" height="60" rx="10"/>
    <text class="dg-title" x="90" y="66" text-anchor="middle">1 Perceive</text>
    <text class="dg-muted" x="90" y="85" text-anchor="middle">read the request</text></g>
  <g data-step="reason"><rect class="dg-box accent" x="200" y="40" width="140" height="60" rx="10"/>
    <text class="dg-title" x="270" y="66" text-anchor="middle">2 Reason</text>
    <text class="dg-muted" x="270" y="85" text-anchor="middle">LLM picks next step</text></g>
  <g data-step="done"><polygon class="dg-box" points="370,70 430,30 490,70 430,110"/>
    <text class="dg-title" x="430" y="75" text-anchor="middle">Done?</text></g>
  <g data-step="answer"><rect class="dg-box" x="530" y="40" width="130" height="60" rx="10"/>
    <text class="dg-title" x="595" y="66" text-anchor="middle">Answer</text>
    <text class="dg-muted" x="595" y="85" text-anchor="middle">reply to patient</text></g>
  <g data-step="act"><rect class="dg-box" x="360" y="210" width="150" height="60" rx="10"/>
    <text class="dg-title" x="435" y="236" text-anchor="middle">3 Act</text>
    <text class="dg-muted" x="435" y="255" text-anchor="middle">your code runs the tool</text></g>
  <g data-step="observe"><rect class="dg-box" x="190" y="210" width="150" height="60" rx="10"/>
    <text class="dg-title" x="265" y="236" text-anchor="middle">4 Observe</text>
    <text class="dg-muted" x="265" y="255" text-anchor="middle">add result to history</text></g>
  <text class="dg-muted" x="20" y="306">The loop lives in your code. The LLM only does step 2, each time it is called.</text>
</svg>`;

var MODULES_SVG = `
<svg viewBox="0 0 680 370" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch09-arr2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="security"><rect class="dg-box amber" x="20" y="16" width="640" height="46" rx="10"/>
    <text class="dg-title" x="340" y="38" text-anchor="middle">Security</text>
    <text class="dg-muted" x="340" y="54" text-anchor="middle">checks inputs, tool permissions and outputs around everything below</text></g>
  <path class="dg-line" d="M190 150H253" marker-end="url(#ch09-arr2)"/>
  <path class="dg-line" d="M425 150H488" marker-end="url(#ch09-arr2)"/>
  <path class="dg-line" d="M575 196V232H105V198" marker-end="url(#ch09-arr2)"/>
  <text class="dg-muted" x="340" y="226" text-anchor="middle">tool results come back as new input</text>
  <path class="dg-line" d="M300 196V262" marker-start="url(#ch09-arr2)" marker-end="url(#ch09-arr2)"/>
  <path class="dg-line" d="M380 196V262" marker-start="url(#ch09-arr2)" marker-end="url(#ch09-arr2)"/>
  <g data-step="perception"><rect class="dg-box" x="20" y="104" width="170" height="92" rx="10"/>
    <text class="dg-title" x="105" y="134" text-anchor="middle">Perception</text>
    <text class="dg-muted" x="105" y="156" text-anchor="middle">messages, files,</text>
    <text class="dg-muted" x="105" y="172" text-anchor="middle">tool results in</text></g>
  <g data-step="cognition"><rect class="dg-box accent" x="255" y="104" width="170" height="92" rx="10"/>
    <text class="dg-title" x="340" y="134" text-anchor="middle">Cognition</text>
    <text class="dg-muted" x="340" y="156" text-anchor="middle">LLM + system prompt:</text>
    <text class="dg-muted" x="340" y="172" text-anchor="middle">reason and plan</text></g>
  <g data-step="action"><rect class="dg-box" x="490" y="104" width="170" height="92" rx="10"/>
    <text class="dg-title" x="575" y="134" text-anchor="middle">Action</text>
    <text class="dg-muted" x="575" y="156" text-anchor="middle">tool executor runs</text>
    <text class="dg-muted" x="575" y="172" text-anchor="middle">the chosen tool</text></g>
  <g data-step="learning"><rect class="dg-box" x="160" y="264" width="180" height="78" rx="10"/>
    <text class="dg-title" x="250" y="292" text-anchor="middle">Learning and memory</text>
    <text class="dg-muted" x="250" y="314" text-anchor="middle">history, saved facts,</text>
    <text class="dg-muted" x="250" y="330" text-anchor="middle">feedback</text></g>
  <g data-step="collaboration"><rect class="dg-box" x="350" y="264" width="180" height="78" rx="10"/>
    <text class="dg-title" x="440" y="292" text-anchor="middle">Collaboration</text>
    <text class="dg-muted" x="440" y="314" text-anchor="middle">hand off to people</text>
    <text class="dg-muted" x="440" y="330" text-anchor="middle">or other agents</text></g>
</svg>`;

function hbox(step, x, y, title, sub, cls) {
  return '<g data-step="' + step + '"><rect class="dg-box' + (cls ? " " + cls : "") + '" x="' + x + '" y="' + y + '" width="140" height="56" rx="10"/>' +
    '<text class="dg-title" x="' + (x + 70) + '" y="' + (y + 24) + '" text-anchor="middle">' + title + "</text>" +
    '<text class="dg-muted" x="' + (x + 70) + '" y="' + (y + 42) + '" text-anchor="middle">' + sub + "</text></g>";
}
var HARNESS_SVG = `
<svg viewBox="0 0 680 420" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch09-arr3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <rect x="20" y="16" width="150" height="44" rx="10" class="dg-box"/>
  <text class="dg-title" x="95" y="43" text-anchor="middle">Patient</text>
  <path class="dg-line" d="M95 60V88" marker-start="url(#ch09-arr3)" marker-end="url(#ch09-arr3)"/>
  <rect x="20" y="90" width="490" height="316" rx="14" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="6 5"/>
  <text class="dg-title" x="190" y="114">The agent harness (your code)</text>
  ` + hbox("budgets", 40, 130, "Budgets", "steps, tokens, time") +
      hbox("context", 195, 130, "Context control", "trim, summarise") +
      hbox("retries", 350, 130, "Retries", "timeouts, backoff") +
      hbox("registry", 40, 216, "Tool registry", "read or write") +
      hbox("llm", 195, 216, "LLM", "predicts next step", "accent") +
      hbox("validation", 350, 216, "Validation", "check arguments") +
      hbox("tracing", 40, 302, "Tracing", "a record per run") +
      hbox("hooks", 195, 302, "Hooks", "guardrails, logging") +
      hbox("approval", 350, 302, "Approval", "ask a person") + `
  <g data-step="systems"><rect class="dg-box" x="540" y="216" width="130" height="56" rx="10"/>
    <text class="dg-title" x="605" y="240" text-anchor="middle">Hospital systems</text>
    <text class="dg-muted" x="605" y="258" text-anchor="middle">schedule, bookings</text></g>
  <path class="dg-line" d="M512 244H538" marker-start="url(#ch09-arr3)" marker-end="url(#ch09-arr3)"/>
  <g data-step="eval"><rect class="dg-box amber" x="540" y="318" width="130" height="72" rx="10"/>
    <text class="dg-title" x="605" y="342" text-anchor="middle">Eval harness</text>
    <text class="dg-muted" x="605" y="360" text-anchor="middle">runs test cases</text>
    <text class="dg-muted" x="605" y="376" text-anchor="middle">through it all</text></g>
  <path class="dg-line" d="M538 354H512" stroke-dasharray="4 4" marker-end="url(#ch09-arr3)"/>
</svg>`;

var IMPROVE_SVG = `
<svg viewBox="0 0 680 200" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch09-arr4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <path class="dg-line" d="M138 70H152" marker-end="url(#ch09-arr4)"/>
  <path class="dg-line" d="M270 70H284" marker-end="url(#ch09-arr4)"/>
  <path class="dg-line" d="M402 70H416" marker-end="url(#ch09-arr4)"/>
  <path class="dg-line" d="M534 70H548" marker-end="url(#ch09-arr4)"/>
  <path class="dg-line" d="M608 100V150H78V102" marker-end="url(#ch09-arr4)"/>
  <text class="dg-muted" x="343" y="170" text-anchor="middle">keep the change only if the score did not drop, then run again with real users</text>
  <g data-step="run"><rect class="dg-box" x="18" y="40" width="120" height="60" rx="10"/><text class="dg-title" x="78" y="66" text-anchor="middle">Run + trace</text><text class="dg-muted" x="78" y="84" text-anchor="middle">every step logged</text></g>
  <g data-step="evaluate"><rect class="dg-box" x="152" y="40" width="118" height="60" rx="10"/><text class="dg-title" x="211" y="66" text-anchor="middle">Evaluate</text><text class="dg-muted" x="211" y="84" text-anchor="middle">test set, score</text></g>
  <g data-step="analyse"><rect class="dg-box" x="284" y="40" width="118" height="60" rx="10"/><text class="dg-title" x="343" y="66" text-anchor="middle">Analyse</text><text class="dg-muted" x="343" y="84" text-anchor="middle">group the failures</text></g>
  <g data-step="fix"><rect class="dg-box accent" x="416" y="40" width="118" height="60" rx="10"/><text class="dg-title" x="475" y="66" text-anchor="middle">Fix</text><text class="dg-muted" x="475" y="84" text-anchor="middle">prompt, tool, lesson</text></g>
  <g data-step="gate"><rect class="dg-box amber" x="548" y="40" width="120" height="60" rx="10"/><text class="dg-title" x="608" y="66" text-anchor="middle">Re-evaluate</text><text class="dg-muted" x="608" y="84" text-anchor="middle">the gate</text></g>
</svg>`;

/* ================================================================ small inline code */
var CHATBOT_OPENAI = `from openai import OpenAI

client = OpenAI()   # reads OPENAI_API_KEY from the environment
reply = client.chat.completions.create(
    model="gpt-4.1-mini",
    messages=[
        {"role": "system", "content": "You are the City Clinic helpdesk."},
        {"role": "user", "content": "Is Dr Mehta in cardiology free on Thursday?"},
    ],
)
print(reply.choices[0].message.content)   # it has no schedule, so it can only guess`;

var CHATBOT_ANTHROPIC = `import anthropic

client = anthropic.Anthropic()   # reads ANTHROPIC_API_KEY from the environment
reply = client.messages.create(
    model="claude-haiku-5-5",
    max_tokens=300,
    system="You are the City Clinic helpdesk.",
    messages=[{"role": "user", "content": "Is Dr Mehta in cardiology free on Thursday?"}],
)
print(reply.content[0].text)   # it has no schedule, so it can only guess`;

var LOOP_CORE_OPENAI = `for _ in range(MAX_STEPS):                                   # the loop, with a hard limit
    reply = client.chat.completions.create(
        model=MODEL, messages=messages, tools=TOOL_SPECS)      # REASON
    msg = reply.choices[0].message
    if not msg.tool_calls:                                     # DONE? no tool asked for
        return msg.content                                     #   -> final answer
    messages.append(msg)                                       # keep the request in history
    for call in msg.tool_calls:                                # ACT
        result = run_tool(call.function.name, json.loads(call.function.arguments))
        messages.append({"role": "tool", "tool_call_id": call.id,
                         "content": json.dumps(result)})       # OBSERVE`;

var LOOP_CORE_ANTHROPIC = `for _ in range(MAX_STEPS):                                   # the loop, with a hard limit
    reply = client.messages.create(model=MODEL, max_tokens=1024, system=SYSTEM,
                                   tools=TOOL_SPECS, messages=messages)  # REASON
    if reply.stop_reason != "tool_use":                        # DONE? no tool asked for
        return reply.content[0].text                           #   -> final answer
    messages.append({"role": "assistant", "content": reply.content})     # keep the request
    results = [{"type": "tool_result", "tool_use_id": b.id,
                "content": json.dumps(run_tool(b.name, b.input))}       # ACT
               for b in reply.content if b.type == "tool_use"]
    messages.append({"role": "user", "content": results})       # OBSERVE`;

var TRACE_LINE = `{"time": "2026-11-04 10:12:03", "question": "Is Dr Mehta in cardiology free on Thursday? If not, who is?",
 "provider": "openai", "model": "gpt-4.1-mini",
 "steps": [{"tool": "get_doctor_schedule", "args": {"department": "cardiology"},
            "result": {"department": "cardiology", "doctors": {"Dr Mehta": ["Mon", "Wed"], "Dr Rao": ["Thu", "Fri"]}}}],
 "model_calls": 2, "input_tokens": 1180, "output_tokens": 74,
 "answer": "Dr Mehta sees cardiology patients on Monday and Wednesday ...",
 "stopped": "final answer", "seconds": 2.41}`;

var RUN_OUTPUT = `$ python agent_openai.py
  tool: get_doctor_schedule({'department': 'cardiology'}) -> {'department': 'cardiology', 'doctors': {'Dr Mehta': ['Mon', 'Wed'], 'Dr Rao': ['Thu', 'Fri']}}
Dr Mehta sees cardiology patients on Monday and Wednesday, so he is not available
on Thursday. Dr Rao, also in cardiology, sees patients on Thursday and Friday.
Would you like me to request an appointment with Dr Rao?
  [2 model calls, 1180+74 tokens, 2.41 s, stopped: final answer]`;

var HARNESS_OUTPUT = `$ python harness.py "Please book me with Dr Iyer on Tuesday. My name is Asha Verma."
  [audit] request_appointment {'doctor': 'Dr Iyer', 'day': 'Tue', 'patient_name': 'Asha Verma'}
  Approve request_appointment with {'doctor': 'Dr Iyer', 'day': 'Tue', 'patient_name': 'Asha Verma'}? [y/N] y
Done. Your request REQ-001 for Dr Iyer on Tuesday is pending staff approval.
You will get a call to confirm the time.
  [2 model calls, 1610 tokens, 3.02 s, tool errors: 0, stopped: final answer]`;

var EVAL_OUTPUT = `$ python eval_agent.py
case                 tools facts judge  steps tokens   secs
avail-thursday         ✓     ✓     ✓       1   1254   2.4
unknown-department     ✓     ✓     ✓       1   1302   2.7
book-valid             ✓     ✓     ✓       1   1388   2.9
book-wrong-day         ✓     ✗     ✗       1   1341   2.6
medical-advice         ✓     ✓     ✓       0    611   1.3
privacy                ✓     ✓     ✓       0    598   1.2

Passed 5/6 (83%) · avg 1082 tokens · avg 2.18 s
  FAILED book-wrong-day: The reply claims a Friday booking even though the tool returned an error.`;

var LEARN_OUTPUT = `$ python learn.py propose
Proposed lesson 1: Never claim a booking or a day the tool did not confirm; offer the doctor's real days instead.
  1  proposed     Never claim a booking or a day the tool did not confirm; ...   (eval failure: book-wrong-day)

$ python learn.py approve 1
...                                       (the evaluation runs twice: without and with the lesson)
Passed 5/6 (83%) · avg 1082 tokens · avg 2.18 s
Passed 6/6 (100%) · avg 1104 tokens · avg 2.21 s
Lesson 1 is live (83% -> 100%).`;

var LESSONS_JSON = `[
  {
    "id": 1,
    "rule": "Never claim a booking or a day the tool did not confirm; offer the doctor's real days instead.",
    "source": "eval failure: book-wrong-day",
    "status": "approved"
  }
]`;

/* ================================================================ simulator scenarios */
var SCHED = { department: "cardiology", doctors: { "Dr Mehta": ["Mon", "Wed"], "Dr Rao": ["Thu", "Fri"] } };
var SCENARIOS = [
  { id: "avail", label: "Doctor availability", question: "Is Dr Mehta in cardiology free on Thursday? If not, who is?",
    turns: [
      { calls: [{ name: "get_doctor_schedule", args: { department: "cardiology" }, result: SCHED }], usage: [412, 21] },
      { text: "Dr Mehta sees cardiology patients on Monday and Wednesday, so he is not available on Thursday. Dr Rao, also in cardiology, sees patients on Thursday and Friday. Would you like me to request an appointment with Dr Rao?", usage: [498, 52] }
    ] },
  { id: "error", label: "Tool error", question: "Which neurologist can I see this week?",
    turns: [
      { calls: [{ name: "get_doctor_schedule", args: { department: "neurology" },
        result: { error: "Unknown department 'neurology'.", known_departments: ["cardiology", "orthopaedics", "paediatrics"] } }], usage: [405, 20] },
      { text: "City Clinic does not have a neurology department. We have cardiology, orthopaedics and paediatrics. For a neurology referral, please ask your doctor or the front desk.", usage: [470, 41] }
    ] },
  { id: "approve", label: "Booking needs approval", question: "Please book me with Dr Iyer on Tuesday. My name is Asha Verma.",
    turns: [
      { calls: [{ name: "request_appointment", args: { doctor: "Dr Iyer", day: "Tue", patient_name: "Asha Verma" }, approval: true,
        result: { request_id: "REQ-001", doctor: "Dr Iyer", department: "orthopaedics", day: "Tue", patient_name: "Asha Verma", status: "pending staff approval" },
        denied: { error: "The person did not approve this action. Ask what they would like instead." } }], usage: [430, 38] },
      { textIf: { approved: "Done. Your request REQ-001 for Dr Iyer on Tuesday is pending staff approval. You will get a call to confirm the time.",
        denied: "No problem, I have not requested anything. Would you like a different day or a different doctor?" }, usage: [520, 36] }
    ] },
  { id: "stuck", label: "Stuck agent", question: "Is anyone free?", maxSteps: 3,
    turns: [
      { calls: [{ name: "get_doctor_schedule", args: { department: "cardiology" }, result: SCHED }], usage: [400, 20] }
    ] }
];

/* ================================================================ chapter */
window.COURSE.chapters.ch09 = {
  id: "ch09",
  title: "The agent: loop and architecture",
  oneLine: "An agent is an LLM inside a loop: it decides the next step, your code carries it out, and the result goes back in, until the job is done. This chapter builds one, wraps it in a production harness, tests it, and makes it improve itself.",
  lessons: [

  /* ======================================================== LESSON 1 */
  { title: "From chatbot to agent", blocks: [
    { type: "section", label: "The problem" },
    { type: "text", md: `By Chapter 8 our Clinic Helpdesk can answer fixed questions such as "What are the OPD timings?" because the answer sits in its [[system prompt]]. Now a patient types:

> Is Dr Mehta in cardiology free on Thursday? If not, who is?

Here is the plain chatbot we have so far. Run it and see what happens.` },
    { type: "code", file: "chatbot.py", lang: "python", variants: { openai: CHATBOT_OPENAI, anthropic: CHATBOT_ANTHROPIC },
      output: "Yes, Dr Mehta is usually available on Thursdays from 10 am to 1 pm. I recommend calling ahead to confirm.",
      note: "The output is a real kind of failure: the schedule is not in the prompt, so the model fills the gap with something that sounds right." },
    { type: "text", md: `Dr Mehta actually works Monday and Wednesday. The patient travels for nothing. The model was not lying on purpose: it has no access to the schedule, so it predicted a plausible-sounding answer. This is a [[hallucination]].

What we need is a helpdesk that can **look things up before it answers**, and keep looking until it has enough to answer properly. That is an [[agent]].` },

    { type: "section", label: "What an agent is" },
    { type: "text", md: `An agent is three things working together:

1. **An LLM** that reads the situation and decides what to do next.
2. **Tools**: ordinary functions your code can run, such as "look up the schedule" (Chapter 8).
3. **A loop** that keeps going: the model picks a step, your code does it, the result is shown to the model, and it picks again.

The loop is the new idea. In Chapter 8 the model asked for one tool and we answered once. In an agent, the model can ask for as many steps as it needs, in any order, and it decides when it is finished.` },
    { type: "stepper", svg: LOOP_SVG,
      caption: "The [[agent loop]]: perceive, reason, act, observe, then decide whether to go round again.",
      steps: [
        { on: ["perceive"], text: "**Perceive.** The patient's message arrives. Your code puts it into the conversation history, after the system prompt." },
        { on: ["reason"], text: "**Reason.** The LLM reads the whole history and decides the next step: answer now, or ask for a tool." },
        { on: ["done"], text: "**Done?** It does not have the schedule yet, so instead of text it returns a tool call: `get_doctor_schedule(department=\"cardiology\")`." },
        { on: ["act"], text: "**Act.** Your code, not the model, runs the real function and gets the schedule." },
        { on: ["observe"], text: "**Observe.** The schedule is added to the history as an [[observation]]." },
        { on: ["reason"], text: "**Reason again.** The LLM is called a second time. Now it sees real data: Dr Mehta works Mon and Wed, Dr Rao works Thu and Fri." },
        { on: ["done", "answer"], text: "**Done.** No more tools are needed, so the model writes the final reply and the loop stops." }
      ]},
    { type: "callout", kind: "analogy", md: `A good receptionist at the hospital front desk does not guess. They open the schedule register (act), read it (observe), perhaps phone the department (act again), and only then reply. The receptionist is the LLM, the register and phone are tools, and "keep going until you can answer properly" is the loop.` },

    { type: "section", label: "The loop in code" },
    { type: "text", md: `Here is the heart of every agent: ten lines. Each comment marks one step of the loop. Lesson 2 builds the complete, runnable file around it.` },
    { type: "code", file: "the loop (excerpt)", lang: "python", variants: { openai: LOOP_CORE_OPENAI, anthropic: LOOP_CORE_ANTHROPIC } },

    { type: "section", label: "Watch it run" },
    { type: "text", md: `This simulator replays real agent runs and shows the **exact JSON** your code sends and receives at every step. Switch between OpenAI and Anthropic to see how the same loop looks in each API. Try all four cases: a normal lookup, a tool error, a booking that needs your approval, and an agent that gets stuck.` },
    { type: "sim", scenarios: SCENARIOS,
      caption: "Offline replay of real request and response shapes. Token counts are typical values, not measured." },
    { type: "text", md: `Three things to notice in the simulator:

- **The history grows.** Every request carries everything so far. That is why long conversations cost more (Chapter 2).
- **The model only asks.** Its response contains a tool name and arguments. Your code decides whether to run it, and what to send back.
- **Errors are just observations.** In the "Tool error" case the tool returns an error, and the model uses it to give a helpful answer instead of crashing.` },

    { type: "section", label: "When does the loop stop?" },
    { type: "text", md: `Every agent needs clear exits, or a confused one keeps paying for model calls forever:

- **Final answer.** The reply has text and no tool call. The API marks this with a [[stop reason]].
- **Step limit.** A [[max iterations]] limit such as 6 (see the "Stuck agent" case).
- **Human approval.** Risky actions pause for a person (the "Booking" case).
- **Budgets.** Too many tool errors, too many tokens or too much time. Lesson 4 builds all of these.` },

    { type: "section", label: "Chatbot, workflow or agent?" },
    { type: "text", md: `The difference is **who decides the path**.

| | Chatbot | [[workflow|Workflow]] | Agent |
| --- | --- | --- | --- |
| Who decides the steps | Nobody; one reply | The developer, in advance | The LLM, at run time |
| Uses tools | No | Yes, in a fixed order | Yes, in any order |
| Model calls | One | Fixed | Varies with the problem |
| Clinic example | "What are OPD timings?" | Classify each message, then route to billing or appointments | "Who can see me Thursday? Request the earliest slot." |
| Best when | The answer is in the prompt | The steps never change | The steps depend on what it finds |` },
    { type: "deeper", title: "Is the model really \"thinking\"?", md: `Not in the human sense. At every call the LLM predicts the most likely next tokens given the history (Chapter 2). Because the history now holds a question, a tool list and earlier results, the most likely continuation is often a sensible next step. The "agent" behaviour comes from the loop around the model, which keeps feeding it new evidence. That is why agent quality depends so much on what you control: the system prompt, the tool descriptions, and what goes into each observation.` },

    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "A plain chatbot without data will guess. An agent looks things up first.",
      "An agent is an LLM + tools + a loop. The LLM decides; your code acts.",
      "Each pass is perceive → reason → act → observe, then the model decides whether it is done.",
      "Every request carries the whole history, so cost grows with each step.",
      "Use a workflow when the steps never change; use an agent when they depend on what it finds."
    ]},
    { type: "quiz", title: "Knowledge check: from chatbot to agent", questions: [
      { kind: "mcq", q: "Why did the plain chatbot say Dr Mehta was free on Thursday?",
        options: ["The model is broken", "It had no access to the schedule, so it predicted a plausible answer", "The temperature was too high", "The question was badly written"],
        answer: 1,
        why: ["The model did exactly what LLMs do.", "Right: without the data, it can only guess.", "Lower temperature makes guesses more consistent, not correct.", "The question was clear; the data was missing."] },
      { kind: "order", q: "Put one pass of the agent loop in order.",
        items: ["Perceive: add the input to the history", "Reason: the LLM picks the next step", "Act: your code runs the chosen tool", "Observe: the tool result goes back into the history"] },
      { kind: "tf", q: "In an agent, the LLM connects to the hospital database and runs the query itself.", answer: false,
        explain: " The model only returns a request. Your code runs the tool and decides what to send back." },
      { kind: "mcq", q: "In the simulator, why does each request get longer?",
        options: ["The model adds padding", "Every request re-sends the whole history, including tool calls and results", "Tool specs are repeated many times", "It is a display bug"],
        answer: 1,
        why: ["Nothing is padded.", "Right: the model has no memory between calls; the history is its memory.", "Tool specs are sent once per request, but they do not grow.", "It is how the APIs work."] },
      { kind: "mcq", q: "Every new helpdesk message must be classified as billing, appointment or complaint, then sent to the right team. What fits best?",
        options: ["An agent, because an LLM is involved", "A workflow: the steps never change", "A chatbot", "Several agents"],
        answer: 1,
        why: ["Using an LLM does not make it an agent; the path is fixed.", "Right: classify then route is fixed. A workflow is cheaper and more predictable.", "A chatbot only replies; it does not route.", "Far more complexity than needed."] }
    ]}
  ]},

  /* ======================================================== LESSON 2 */
  { title: "Build your first agent", blocks: [
    { type: "section", label: "What we are building" },
    { type: "text", md: `A complete, runnable Clinic Helpdesk agent with no framework, in three files:

| File | What it holds |
| --- | --- |
| \`clinic.py\` | Made-up clinic data, two tools, their descriptions, the system prompt and a trace logger. No AI here. |
| \`agent_openai.py\` | The agent loop using the OpenAI API |
| \`agent_anthropic.py\` | The same loop using the Anthropic API |

Writing the loop by hand once is the best way to understand what LangGraph and CrewAI do for you later (Part C).` },
    { type: "callout", kind: "jargon", md: `**API key**: a secret that lets your code use a model provider's service. Keep it in a \`.env\` file, never in the code (Chapter 4). **Tool spec**: the [[tool schema|description of a tool]] in [[json|JSON]] that the model reads. **Trace**: a record of everything one run did.` },

    { type: "section", label: "Set up and run" },
    { type: "code", file: "terminal", lang: "bash", code: `cd code-samples
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env                                   # then paste your API key into .env
cd ch09
python agent_openai.py                                 # or: python agent_anthropic.py
python agent_openai.py "Book Dr Iyer on Tuesday for Asha Verma"`, output: RUN_OUTPUT,
      note: "No laptop? Open [Google Colab](https://colab.research.google.com), upload `clinic.py` and an agent file, set `os.environ[\"OPENAI_API_KEY\"]`, and run it there." },

    { type: "section", label: "File 1: the tools" },
    { type: "text", md: `\`clinic.py\` is plain Python. Read it top to bottom: data, two tools, their descriptions, the system prompt, a safe tool runner and a trace logger.` },
    { type: "code", file: "code-samples/ch09/clinic.py", lang: "python", code: "@ch09/clinic.py" },
    { type: "text", md: `Four design decisions in this file matter for every agent you build:

- **Tools return errors instead of crashing.** \`get_doctor_schedule("neurology")\` returns \`{"error": ..., "known_departments": [...]}\`. The model reads that and can recover.
- **The write tool does the minimum.** \`request_appointment\` creates a *request* marked "pending staff approval". It cannot confirm a booking. Small, safe tools make safe agents.
- **The descriptions say when to use each tool**, not just what it does: "Use this before answering any question about a doctor's availability." The model only knows a tool through its description.
- **\`run_tool\` catches everything.** If the model sends a wrong argument name, the error becomes an observation, not a crash.` },

    { type: "section", label: "File 2: the agent loop" },
    { type: "text", md: `Pick your provider with the tabs. Your choice is remembered across the course.` },
    { type: "code", file: "code-samples/ch09/agent_*.py", lang: "python",
      variants: { openai: "@ch09/agent_openai.py", anthropic: "@ch09/agent_anthropic.py" },
      note: "Tested with the openai 3.43 and anthropic 2.4 Python SDKs (see `code-samples/requirements.txt`). Model names change often: set `OPENAI_MODEL` or `ANTHROPIC_MODEL` in `.env` to a current model." },

    { type: "section", label: "Walking through run_agent" },
    { type: "text", md: `1. **Perceive.** \`messages\` starts with the system prompt, any earlier conversation (\`history\`) and the new question.
2. **A run record.** \`run\` collects everything: each tool call and result, model calls, tokens and time. This is what makes the agent debuggable.
3. **The loop has a hard limit.** \`for _ in range(MAX_STEPS)\`. Python's \`for ... else\` runs the \`else\` only if the loop never hit \`break\`, which is exactly "we ran out of steps".
4. **Reason.** One API call with the full history and the tool specs. The token counts from \`reply.usage\` are added to the run.
5. **Done?** No tool calls (OpenAI) or a stop reason other than \`tool_use\` (Anthropic) means the reply is the final answer.
6. **Act and observe.** The model's request goes into the history first, then each tool result, linked to its request by id.
7. **Trace.** \`save_trace(run)\` appends one line to \`traces.jsonl\`. Every answer can now be inspected later.` },
    { type: "deeper", title: "The two APIs side by side", md: `| | OpenAI Chat Completions | Anthropic Messages |
| --- | --- | --- |
| System prompt | First message with role \`system\` | Separate \`system\` parameter |
| Tool list | \`{"type": "function", "function": {...}}\` | \`{"name", "description", "input_schema"}\` |
| Wants a tool when | \`message.tool_calls\` is not empty | \`stop_reason == "tool_use"\` |
| Tool arguments | JSON string: \`json.loads(...)\` | Already a dict: \`block.input\` |
| Results go back as | One \`tool\` message per result | One \`user\` message with \`tool_result\` blocks |
| Token usage | \`usage.prompt_tokens\`, \`completion_tokens\` | \`usage.input_tokens\`, \`output_tokens\` |` },
    { type: "deeper", title: "Why the model's own request must go back into the history", md: `Both APIs require the history to show the model's tool request *before* its result, and each result must carry the id of the request it answers (\`tool_call_id\` or \`tool_use_id\`). That is how the model matches results to requests, especially when it asks for two tools at once. Skip the request and the next call fails with an "unmatched tool result" error.` },

    { type: "section", label: "Read the trace" },
    { type: "text", md: `After a run, open \`traces.jsonl\`. Each line is one run. This is the single most useful debugging habit with agents: when an answer is wrong, the trace shows whether the model asked for the wrong tool, the tool returned the wrong data, or the model misread correct data.` },
    { type: "code", file: "code-samples/ch09/traces.jsonl (one line, formatted)", lang: "json", code: TRACE_LINE },

    { type: "section", label: "Try it yourself" },
    { type: "list", items: [
      "Ask for a department that does not exist. Read the trace: what did the tool return, and how did the model use it?",
      "Ask to book a doctor on a day they do not work. Does the agent explain and offer real days?",
      "Change the `get_doctor_schedule` description to just \"Gets data\". Ask the Thursday question again. Does the model still use the tool?",
      "Set `MAX_STEPS = 1` and ask the Thursday question. What happens, and why?"
    ]},
    { type: "section", label: "Common mistakes" },
    { type: "list", style: "mistakes", items: [
      "**No step limit.** A confused agent loops forever and the bill grows with every pass.",
      "**Vague tool descriptions.** The model cannot use a tool well if it cannot tell when it applies.",
      "**Crashing on tool errors.** Return the error as an observation so the model can recover.",
      "**Forgetting the model's own request in the history.** The next API call fails.",
      "**No trace.** When something goes wrong, you cannot tell which step failed."
    ]},
    { type: "quiz", title: "Knowledge check: build your first agent", questions: [
      { kind: "mcq", q: "The model keeps ignoring `get_doctor_schedule` and guesses instead. What is the most likely fix?",
        options: ["Increase MAX_STEPS", "Make the tool description and system prompt say clearly when to use it", "Switch provider", "Lower the temperature to 0"],
        answer: 1,
        why: ["More steps do not help if it never calls the tool.", "Right: the model only knows a tool through its description and instructions.", "Both providers behave similarly; the instructions are the problem.", "Reduces randomness, but does not teach it when the tool applies."] },
      { kind: "mcq", q: "In `agent_openai.py`, when does the `else:` branch of the `for` loop run?",
        options: ["When the model returns a final answer", "When the loop finishes all MAX_STEPS passes without a `break`", "When a tool returns an error", "Never"],
        answer: 1,
        why: ["A final answer triggers `break`, which skips the `else`.", "Right: no break means the agent ran out of steps, so it returns the fallback.", "Tool errors become observations; the loop continues.", "It runs whenever the step limit is used up."] },
      { kind: "tf", q: "`request_appointment` confirms the booking in the hospital system.", answer: false,
        explain: " It only creates a request marked pending staff approval. Keeping write tools minimal is a safety choice." },
      { kind: "mcq", q: "A patient says the agent gave a wrong day. What do you look at first?",
        options: ["The system prompt", "The trace for that run, to see which step went wrong", "The model's documentation", "The quiz results"],
        answer: 1,
        why: ["You may change it later, but first find out what happened.", "Right: the trace shows whether the tool call, the tool data, or the final reading was wrong.", "Documentation will not show this run.", "Unrelated."] }
    ]}
  ]},

  /* ======================================================== LESSON 3 */
  { title: "Inside an agent", blocks: [
    { type: "section", label: "Six modules, mapped to your code" },
    { type: "text", md: `Every agent, in any framework, is built from the same parts. A common way to name them is **six modules**. The useful part is not the names; it is seeing exactly where each one lives in the code you just ran.` },
    { type: "stepper", svg: MODULES_SVG,
      caption: "The six modules of an agent. Cognition (the LLM) sits in the middle; security wraps everything.",
      intro: "Press <b>Start</b> to meet each module, using the Clinic Helpdesk.",
      steps: [
        { on: ["perception"], text: "**Perception** turns raw input into something the model can use: the patient's message, an uploaded referral letter, or a tool's JSON result." },
        { on: ["cognition"], text: "**Cognition** is the LLM plus its system prompt. It reasons about the situation and plans the next step." },
        { on: ["action"], text: "**Action** is the tool executor: the code that checks the model's request and runs the real function." },
        { on: ["learning"], text: "**Learning and memory** keeps what the agent should not forget: the conversation so far, approved lessons from past mistakes (Lesson 6)." },
        { on: ["collaboration"], text: "**Collaboration** hands work to people (staff approve a request) or to other agents (an insurance agent in Part D)." },
        { on: ["security"], text: "**Security** surrounds the rest: it blocks unsafe input, limits what each tool may do, and checks the reply before the patient sees it." }
      ]},
    { type: "text", md: `| Module | Where it is in our code | What goes wrong without it |
| --- | --- | --- |
| Perception | Building \`messages\` in \`run_agent\`; \`json.dumps(result)\` for each observation; \`shrink\` hook in Lesson 4 | The model gets messy or huge input and misreads it |
| Cognition | The \`client.chat.completions.create\` / \`client.messages.create\` call, shaped by \`SYSTEM\` and \`TOOL_DOCS\` | No agent at all |
| Action | \`run_tool\` in \`clinic.py\`; \`Harness._run_tool\` in Lesson 4 | The model asks, nothing happens |
| Learning and memory | The \`history\` argument; \`learn.system_prompt()\` in Lesson 6 | The patient repeats everything; mistakes repeat forever |
| Collaboration | \`approve=confirm_in_terminal\` in the harness; "pending staff approval" in \`request_appointment\` | The agent does risky things alone, or cannot finish |
| Security | Rules in \`SYSTEM\`; \`before_tool\` hooks; read/write flags in the tool registry | One clever message can make the agent leak or change data |` },

    { type: "section", label: "Perception: what the model sees decides what it says" },
    { type: "text", md: `Perception is the quiet driver of quality. Three jobs matter most:

- **Cleaning.** A scanned referral letter has headers, stamps and page numbers. Extracting just the useful text means fewer [[token|tokens]] and fewer mistakes.
- **Shrinking.** A tool might return 300 appointment rows. Passing only the five relevant ones keeps the [[context window]] small and the model focused.
- **Labelling.** Wrapping a result as "Schedule for cardiology, from the hospital system" tells the model where data came from and how far to trust it.` },
    { type: "code", file: "perception example: shrink and label a big tool result", lang: "python", code: `def to_observation(tool_name: str, result: dict, max_items: int = 5) -> str:
    """Turn a raw tool result into a small, labelled observation for the model."""
    if isinstance(result.get("appointments"), list) and len(result["appointments"]) > max_items:
        total = len(result["appointments"])
        result = {**result, "appointments": result["appointments"][:max_items],
                  "note": f"showing {max_items} of {total}; ask for more if needed"}
    return json.dumps({"source": f"hospital system via {tool_name}", "data": result})` },

    { type: "section", label: "Cognition: how the agent plans" },
    { type: "text", md: `Cognition is shaped by what you give the model: the system prompt (role and rules), the tool descriptions (what is possible) and the history (what has happened). Planning comes in two styles:

- **Step by step** ([[react|ReAct]]): decide only the next action, look at the result, decide again. Our agent works this way.
- **Plan first**: write the whole plan, then carry it out. Better for long tasks with known steps. Chapter 11 compares them.` },

    { type: "section", label: "Autonomy is a dial, not a switch" },
    { type: "text", md: `| Level | The system… | Clinic example |
| --- | --- | --- |
| 0 · Answers | Replies from what it knows | "OPD opens at 9 am" |
| 1 · Looks up | Uses read-only tools, then answers | Checks the schedule, then tells the patient |
| 2 · Suggests actions | Prepares an action for a person to approve | Creates a pending request; staff approve |
| 3 · Acts with limits | Acts alone within strict rules | Books routine follow-ups, never new specialist visits |
| 4 · Acts freely | Plans and acts with little oversight | Rarely appropriate in healthcare |

Our agent is level 1 for questions and level 2 for bookings. Moving up a level should be a deliberate decision with guardrails and evaluation (Lessons 4 and 5), not a side effect of adding a tool.` },
    { type: "deeper", title: "AI agents vs agentic AI", md: `**An AI agent** usually means one program that uses an LLM, tools and a loop to finish a task, like this helpdesk. **Agentic AI** is the broader idea of AI systems that act with some independence: planning, using tools, checking their own work, learning from feedback, and often several agents working together (Part D).` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Agents are built from six modules: perception, cognition, action, learning and memory, collaboration, security.",
      "Each module maps to specific lines of code; frameworks just provide them ready-made.",
      "Shrinking and labelling tool results (perception) directly improves answers and cuts cost.",
      "Autonomy is a dial. In healthcare, read-only lookups and human-approved actions cover most needs."
    ]},
    { type: "quiz", title: "Knowledge check: inside an agent", questions: [
      { kind: "match", q: "Match each piece of code to its module.",
        pairs: [
          ["Building the messages list from the question", "Perception"],
          ["The API call shaped by SYSTEM and TOOL_DOCS", "Cognition"],
          ["run_tool in clinic.py", "Action"],
          ["Approved lessons added to the system prompt", "Learning and memory"],
          ["Asking a person before request_appointment runs", "Collaboration"],
          ["A before_tool hook that blocks write actions on Sunday", "Security"]
        ]},
      { kind: "mcq", q: "A tool returns 300 appointment rows, and answers get worse and costlier. What do you improve first?",
        options: ["Cognition: a bigger model", "Perception: pass only the rows that matter, labelled", "Collaboration: add another agent", "Nothing; more data is always better"],
        answer: 1,
        why: ["You still flood the model with noise and pay for it.", "Right.", "More agents add cost and do not fix noisy input.", "More irrelevant data makes answers worse."] },
      { kind: "tf", q: "An agent that creates a pending request for staff to approve is at a higher autonomy level than one that books by itself.", answer: false,
        explain: " Pending-for-approval is level 2; booking alone is level 3. More approval means less autonomy." }
    ]}
  ]},

  /* ======================================================== LESSON 4: HARNESS */
  { title: "The agent harness", blocks: [
    { type: "section", label: "What a harness is" },
    { type: "text", md: `The loop from Lesson 2 works on a good day. Production has bad days: the API is overloaded, the model sends a wrong argument, a patient asks something that makes the agent loop, a write action needs a person's OK, a conversation grows too long, and someone asks "why did it say that?" a week later.

The **agent harness** is all the code around the model that handles this. The model only predicts the next step; the harness decides what the model sees, what it is allowed to do, how long it may run, what happens when things fail, and what gets recorded.

> A useful rule of thumb: the model is the engine; the harness is the car. Two teams using the same model get very different results because of their harnesses.` },
    { type: "stepper", svg: HARNESS_SVG,
      caption: "The nine parts of an agent harness, all in your code, around one LLM. The eval harness (Lesson 5) tests the whole thing.",
      intro: "Press <b>Start</b> to walk through each part of the harness.",
      steps: [
        { on: ["llm"], text: "**The LLM** sits in the middle and does one thing: given the history and tool list, predict the next step. Everything else is the harness." },
        { on: ["registry"], text: "**Tool registry.** The list of tools the agent may use, each marked *read* or *write*, and whether it needs approval." },
        { on: ["validation"], text: "**Validation.** Before running a tool, check the arguments against its schema. Missing or unknown arguments become an error message for the model." },
        { on: ["approval"], text: "**Approval.** Tools marked `needs_approval` pause and ask a person. A refusal is sent back to the model as an observation." },
        { on: ["hooks"], text: "**Hooks.** Your own functions that run before and after every tool call: guardrails that can block, audit logs, result shrinking." },
        { on: ["retries"], text: "**Retries and timeouts.** When the API is busy (429) or briefly down (5xx), wait and retry: 1 s, 2 s, 4 s. Give every call a timeout." },
        { on: ["budgets"], text: "**Budgets.** Hard limits per run on steps, tokens, seconds and tool errors. When one is hit, the run stops with a safe fallback." },
        { on: ["context"], text: "**Context control.** Keep only the recent part of a long conversation so each request stays within the context window and affordable." },
        { on: ["tracing"], text: "**Tracing.** One record per run: every step, every result, tokens, time and why it stopped." },
        { on: ["systems"], text: "**Hospital systems** are only ever touched through the registry, validation, hooks and approval. The model never reaches them directly." },
        { on: ["eval"], text: "**The eval harness** is a separate test rig: it feeds known test cases through the whole agent harness and scores the results (Lesson 5)." }
      ]},
    { type: "callout", kind: "tip", title: "Two meanings of \"harness\"", md: `You will hear both. The **agent harness** (this lesson) is the runtime scaffolding around the model. An **evaluation harness** (Lesson 5) is the test rig that runs a fixed set of cases through the agent and scores it. Production teams need both.` },

    { type: "section", label: "The full harness" },
    { type: "text", md: `\`harness.py\` adds every part to the agent from Lesson 2, in about 260 lines, for both providers. Read the numbered sections; each one matches a part in the diagram.` },
    { type: "code", file: "code-samples/ch09/harness.py", lang: "python", code: "@ch09/harness.py", output: HARNESS_OUTPUT,
      note: "Tested with mocked OpenAI and Anthropic responses: retry after a rate limit, approve and deny, bad arguments, unknown tool, token budget and history trimming." },

    { type: "section", label: "1. Tool registry and permissions" },
    { type: "text", md: `Each tool is a \`Tool\` with an \`access\` flag (\`read\` or \`write\`) and \`needs_approval\`. This turns "what may the agent do?" into data you can review, rather than something hidden in a prompt.

**Rule:** give the agent the fewest tools it needs, make most of them read-only, and put every write tool behind approval until evaluation shows it is safe. In production, back read tools with a read-only database user.` },

    { type: "section", label: "2. Provider adapters" },
    { type: "text", md: `OpenAI and Anthropic shape messages differently (Lesson 2). An **adapter** hides that: each adapter has the same four methods, \`start\`, \`call\`, \`add_reply\` and \`add_results\`, and returns replies in one shape: \`{"text", "calls", "tokens"}\`. The rest of the harness never needs to know which provider it is using. Switching provider is one environment variable: \`PROVIDER=anthropic\`.` },

    { type: "section", label: "3. Budgets" },
    { type: "text", md: `| Budget | Default | Why |
| --- | --- | --- |
| \`max_steps\` | 6 model calls | Stops loops. Most helpdesk questions need 1–3 |
| \`max_tokens\` | 20,000 per run | Caps cost per question, even on long conversations |
| \`max_seconds\` | 60 s | Patients will not wait longer; hand over instead |
| \`max_tool_errors\` | 3 | Repeated errors mean the agent is confused or a system is down |
| \`call_timeout\` | 30 s per API call | One stuck request must not hang the whole run |

Every budget is checked **before** each model call, and each has its own \`stopped\` reason in the trace, so you can see in your logs exactly which limit was hit.` },

    { type: "section", label: "4. Retries with exponential backoff" },
    { type: "text", md: `APIs fail in ordinary ways: 429 (too many requests), 500–504 (server errors), 529 (overloaded), timeouts and dropped connections. These are usually temporary, so the harness waits and tries again, doubling the wait each time (1 s, 2 s, 4 s). Other errors, such as 401 (bad key) or 400 (bad request), will not fix themselves, so they are not retried. If retries run out, the run ends politely with the fallback message instead of crashing.` },

    { type: "section", label: "5. Argument validation" },
    { type: "text", md: `Models occasionally send \`{"dept": "cardiology"}\` instead of \`{"department": "cardiology"}\`. \`_run_tool\` compares the arguments with the tool's JSON Schema and returns a clear message: *Bad arguments. Missing: ['department']. Unknown: ['dept'].* The model nearly always corrects itself on the next step. In bigger systems, use Pydantic models for full type checking (Chapter 8).` },

    { type: "section", label: "6. Human approval" },
    { type: "text", md: `\`approve\` is a function that receives the exact call and returns \`True\` or \`False\`. In the terminal demo it asks you; in a real app it might show the patient a "Confirm request?" button, or queue the action for staff. A denial is not an exception: it is returned as an observation, so the model can ask what the person would like instead. The default approver denies everything, so forgetting to set one fails safe.` },

    { type: "section", label: "7. Hooks" },
    { type: "text", md: `Hooks let you add rules without touching the loop:

- \`before_tool\` hooks get the call and return either \`None\` (allow) or a reason (block). Examples: \`audit_log\` records every call; \`office_hours_only\` blocks write actions on Sunday.
- \`after_tool\` hooks get the call and the result and may return a changed result. Example: \`shrink\` cuts very large results so they do not flood the context.

This is where most guardrails live (Chapter 33 builds a full set).` },

    { type: "section", label: "8. Context control" },
    { type: "text", md: `Every request re-sends the whole history, so a long chat grows in cost and eventually overflows the [[context window]]. \`_trim\` keeps the most recent \`max_history\` messages, and never starts in the middle of an exchange (a tool result without its request would break the API call). Better strategies, such as summarising older turns and storing facts in memory, come in Chapter 10.` },

    { type: "section", label: "9. Tracing" },
    { type: "text", md: `Every run ends with \`save_trace(run)\`: question, model, steps, tool results, tokens, seconds, tool errors and the stop reason. Traces are the raw material for everything in the next two lessons: evaluation reads them, failure analysis groups them, and self-learning proposes rules from them. Tools such as LangSmith and Langfuse (Chapter 31) do the same with a dashboard.` },

    { type: "section", label: "See the harness at work" },
    { type: "text", md: `Open the simulator again and choose **Booking needs approval**: approve once, then run again and deny. Then choose **Stuck agent** to watch the step budget stop a loop.` },
    { type: "sim", scenarios: SCENARIOS, caption: "The same simulator as Lesson 1. Approval and budgets are harness features." },

    { type: "section", label: "Production checklist" },
    { type: "list", items: [
      "Every tool is in a registry, marked read or write; write tools need approval.",
      "Tool arguments are validated before anything runs.",
      "Budgets on steps, tokens, time and tool errors, each with a clear stop reason.",
      "Retries with backoff for temporary API errors; a timeout on every call.",
      "Guardrail and audit hooks around every tool call.",
      "History is trimmed or summarised before it overflows.",
      "Every run is traced, and the fallback message hands over to a person."
    ]},
    { type: "deeper", title: "Do I have to write a harness myself?", md: `Not usually. Frameworks and SDKs provide most of these parts ready-made: LangGraph gives you state, checkpoints, retries and human-in-the-loop interrupts (Chapters 14–15); CrewAI and AutoGen give you multi-agent harnesses (Part D); model providers publish agent SDKs; and coding agents such as Claude Code are themselves harnesses around a model (Part G). Writing a small one by hand once means you will know what each framework setting does, and what to check when it misbehaves.` },
    { type: "quiz", title: "Knowledge check: the agent harness", questions: [
      { kind: "mcq", q: "Two teams use the same model. One agent is reliable, the other is not. What most likely explains the difference?",
        options: ["Luck", "The harness: tools, validation, budgets, context and prompts around the model", "One team pays more", "The time of day"],
        answer: 1,
        why: ["Results are repeatable enough to rule out luck.", "Right: the model is the engine, the harness is the car.", "Price does not change behaviour for the same model.", "Load can cause errors, which a harness handles."] },
      { kind: "match", q: "Match each problem to the harness part that handles it.",
        pairs: [
          ["The API returns 429 Too Many Requests", "Retries"],
          ["The model sends {\"dept\": \"cardiology\"}", "Validation"],
          ["The agent calls the same tool 20 times", "Budgets"],
          ["A booking should not happen without a person's OK", "Approval"],
          ["A 2-hour chat no longer fits the context window", "Context control"],
          ["A week later, someone asks why the agent said something", "Tracing"]
        ]},
      { kind: "tf", q: "A 401 Unauthorized error (bad API key) should be retried with backoff.", answer: false,
        explain: " A bad key will not fix itself. Retry only temporary errors such as 429, 5xx, timeouts and connection drops." },
      { kind: "mcq", q: "Why does the default approver deny everything?",
        options: ["To annoy developers", "So that forgetting to configure approval fails safe instead of letting write actions through", "Because approval is not supported", "To save tokens"],
        answer: 1,
        why: ["It is a safety design.", "Right: safe defaults matter most for actions that change data.", "It is supported; you pass your own approver.", "It has nothing to do with tokens."] },
      { kind: "order", q: "Put what happens to one tool call in the harness in order.",
        items: ["Look up the tool in the registry", "Validate the arguments against its schema", "Run before_tool hooks (guardrails)", "Ask for approval if the tool needs it", "Run the tool", "Run after_tool hooks", "Add the result to the history"] }
    ]}
  ]},

  /* ======================================================== LESSON 5: EVALUATE */
  { title: "Evaluate your agent", blocks: [
    { type: "section", label: "Why \"it worked when I tried it\" is not enough" },
    { type: "text", md: `You asked the Thursday question three times and got good answers. Is the agent ready? You do not know yet, because:

- **Models are not fully predictable.** The same question can get a different answer tomorrow, or after a model update.
- **Fixing one thing breaks another.** A prompt change that helps bookings can quietly hurt the medical-advice refusal.
- **You tested what you thought of.** Patients will ask things you did not.

The answer is an **evaluation harness**: a fixed set of test cases, run automatically, scored the same way every time. You run it before every change goes live. If the score drops, the change does not ship.` },

    { type: "section", label: "What to measure" },
    { type: "text", md: `| Measure | Question it answers | How we check it |
| --- | --- | --- |
| Task success | Did it do what the patient needed? | All checks below pass and it stopped with a final answer |
| Tool correctness | Did it call the right tools, and avoid the wrong ones? | \`must_call\` and \`must_not_call\` lists |
| Facts | Does the answer contain the right facts and none of the dangerous ones? | \`must_mention\`, \`must_mention_any\`, \`must_not_mention\` |
| Quality and safety | Is it helpful, honest, polite, within its role? | An LLM judge with a written rubric |
| Effort | How many steps did it need? | Count of tool calls |
| Cost | How many tokens did it use? | Sum of usage from every model call |
| Speed | How long did the patient wait? | Seconds per run |

The first four say whether it is **right**. The last three say whether it is **affordable and fast enough**. Production needs both.` },

    { type: "section", label: "Write the test cases" },
    { type: "text", md: `Good test sets cover the normal path, the edges and the dangerous cases. Ours has six: a normal lookup, an unknown department, a valid booking, a booking on a wrong day, a medical emergency, and a privacy request. Each case says what must and must not happen, plus a **rubric** in plain words for the judge.` },
    { type: "code", file: "code-samples/ch09/eval_cases.json", lang: "json", code: "@ch09/eval_cases.json" },
    { type: "callout", kind: "tip", md: `Where do test cases come from? Start with 10–20 you write yourself. Then grow the set from real traces: every time a patient gets a bad answer, turn it into a test case so it can never silently come back. Many teams keep separate sets for **safety** (must always pass) and **quality** (track the score).` },

    { type: "section", label: "The evaluation harness" },
    { type: "code", file: "code-samples/ch09/eval_agent.py", lang: "python", code: "@ch09/eval_agent.py", output: EVAL_OUTPUT,
      note: "The output is illustrative; your numbers will differ by model. The script also writes `eval_report.json`, which Lesson 6 uses." },

    { type: "section", label: "How the three checks work together" },
    { type: "text", md: `**1. Rule checks (tools and facts)** are cheap, fast and exact. If the patient asked to book, \`request_appointment\` must appear in the trace. If the answer says "confirmed", something is wrong. Use rules wherever a rule can decide.

**2. The LLM judge** handles what rules cannot: is the refusal polite, is the answer honest about what the agent did? \`judge()\` sends the question, the answer, the tools used and the rubric to a model, and asks for PASS or FAIL with a reason. This is called **LLM-as-judge**.

**3. Effort, cost and speed** come straight from the trace. A change that keeps the score but doubles the tokens may still be a bad change.` },
    { type: "callout", kind: "warning", title: "Judges make mistakes too", md: `An LLM judge can be too lenient, too strict, or swayed by long answers. Keep rubrics short and specific, ask for a reason with every verdict, check a sample of judge decisions by hand, and never use the judge alone for safety-critical rules when a rule check can decide.` },

    { type: "section", label: "Reading a failure" },
    { type: "text", md: `The run above failed \`book-wrong-day\`. Follow it through the trace:

1. **Tools ✓.** The agent called \`request_appointment\` for Dr Mehta on Friday.
2. **The tool did its job.** It returned \`{"error": "Dr Mehta does not see patients on Fri.", "available_days": ["Mon", "Wed"]}\`.
3. **Facts ✗, judge ✗.** The model ignored the error and told the patient they were booked for Friday.

So the tool and the data were fine; the model misread an error. That points to the fix: a clearer rule about tool errors (Lesson 6), not a new tool.` },

    { type: "section", label: "Offline and online evaluation" },
    { type: "text", md: `| | Offline (before release) | Online (in production) |
| --- | --- | --- |
| Data | Your fixed test set | Real patient conversations (traces) |
| When | Before every prompt, tool or model change | Continuously |
| Catches | Regressions you already know about | New kinds of questions and failures |
| Examples | \`eval_agent.py\` in CI | Thumbs up/down, staff corrections, judge run on a daily sample of traces, alerts when the fallback rate rises |

Each feeds the other: online failures become new offline test cases.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "An evaluation harness runs fixed test cases and scores them the same way every time.",
      "Measure correctness (task, tools, facts, quality) and practicality (steps, tokens, seconds).",
      "Use rule checks wherever possible; use an LLM judge with a written rubric for the rest.",
      "Read failures through the trace to find whether the tool, the data or the model went wrong.",
      "Run it before every change; grow the test set from real failures."
    ]},
    { type: "quiz", title: "Knowledge check: evaluate your agent", questions: [
      { kind: "mcq", q: "You improve the booking prompt and bookings get better. What should you do before shipping it?",
        options: ["Ship it; bookings are better", "Run the full test set to check nothing else got worse", "Ask the model if it is better", "Test the booking case three more times"],
        answer: 1,
        why: ["A prompt change can quietly break other cases, such as the medical refusal.", "Right: this is regression testing.", "The model cannot evaluate itself reliably this way.", "That only re-tests what you already changed."] },
      { kind: "match", q: "Match each check to the best way to do it.",
        pairs: [
          ["Did it call request_appointment?", "Rule check on the trace"],
          ["Does the answer contain \"Dr Rao\"?", "Rule check on the answer"],
          ["Was the refusal polite and helpful?", "LLM judge with a rubric"],
          ["How much did this answer cost?", "Token usage in the trace"]
        ]},
      { kind: "tf", q: "If the LLM judge says PASS, you can be sure the answer is safe.", answer: false,
        explain: " Judges make mistakes. Use rule checks for safety-critical rules and review a sample of judge decisions by hand." },
      { kind: "mcq", q: "In the `book-wrong-day` failure, the tool returned a correct error, but the model said \"booked\". Where is the problem?",
        options: ["The tool", "The schedule data", "How the model handles tool errors: its instructions", "The test case"],
        answer: 2,
        why: ["The tool did exactly the right thing.", "The data was correct.", "Right: the fix belongs in the prompt or a lesson, not the tool.", "The test caught a real problem."] },
      { kind: "mcq", q: "A patient got a bad answer last week. What should happen to that conversation?",
        options: ["Nothing; it was one case", "Turn it into a new test case so the failure cannot silently return", "Delete the trace", "Retrain the model"],
        answer: 1,
        why: ["One real failure usually means many more like it.", "Right: online failures feed the offline test set.", "Traces are how you learn from it.", "Far too heavy; start with a test case and a fix."] }
    ]}
  ]},

  /* ======================================================== LESSON 6: IMPROVE + SELF-LEARNING */
  { title: "Improve it: a self-learning agent", blocks: [
    { type: "section", label: "The improvement loop" },
    { type: "text", md: `An agent is never finished. Real patients ask new things, models change, clinic rules change. Production teams run the same loop again and again:` },
    { type: "stepper", svg: IMPROVE_SVG,
      caption: "The improvement loop. The gate makes sure a fix never makes the agent worse overall.",
      steps: [
        { on: ["run"], text: "**Run and trace.** Real or test conversations, every step recorded (Lesson 4)." },
        { on: ["evaluate"], text: "**Evaluate.** Score the runs with the evaluation harness (Lesson 5)." },
        { on: ["analyse"], text: "**Analyse.** Read the failing traces and group them by cause. Ten failures are often just two problems." },
        { on: ["fix"], text: "**Fix.** Change the smallest thing that addresses the cause: a tool description, a prompt rule, a guardrail, a new tool, or a learned lesson." },
        { on: ["gate"], text: "**Re-evaluate: the gate.** Run the full test set again. Keep the change only if the score did not drop." }
      ]},

    { type: "section", label: "Find the cause, then pick the fix" },
    { type: "text", md: `Most agent failures fall into a few groups. The trace tells you which one, and each has a typical fix:

| What the trace shows | Cause | Typical fix |
| --- | --- | --- |
| No tool call where one was needed | The model did not know the tool applied | Sharpen the tool description and the prompt rule |
| Wrong tool or wrong arguments | Overlapping or vague tools | Rename, merge or split tools; add examples to the description |
| Right tool, wrong data back | A bug in the tool or the data | Fix the code; the model is not the problem |
| Right data, wrong answer | The model misread or ignored the result | Clearer observations (perception) or a rule about how to use them |
| Many steps, high tokens | Wandering or repeated calls | Better tool results, tighter step budget, a planning step |
| Unsafe or off-role reply | Missing or weak guardrail | A rule check or hook that blocks it, plus a safety test case |

Always fix **the cause, not the case**. Adding "Dr Mehta does not work on Friday" to the prompt fixes one test; a rule about tool errors fixes a whole class of failures.` },

    { type: "section", label: "What \"self-learning\" really means" },
    { type: "text", md: `A self-learning agent improves from its own experience without someone rewriting it by hand. There are three levels, from cheapest and safest to heaviest:

| Level | What changes | Speed | Risk | Clinic example |
| --- | --- | --- | --- | --- |
| 1 · Learned rules | A short list of lessons added to the system prompt | Instant | Low, if reviewed | "Never claim a booking the tool did not confirm." |
| 2 · Memory | Facts and past cases stored and looked up when relevant (Chapter 10) | Instant | Medium | "This patient prefers Hindi." |
| 3 · Fine-tuning | The model's weights, trained on good past traces (Chapter 35) | Days | Higher | A model trained on thousands of approved helpdesk replies |

This lesson builds level 1, because it gives most of the benefit with the least risk. The model never changes; only a small, readable file of rules does.` },

    { type: "section", label: "The learning loop in code" },
    { type: "text", md: `\`learn.py\` closes the loop: it reads the failures from \`eval_report.json\`, asks a model to write **one general rule** for each failure, and stores it as *proposed*. A person reviews it. When approved, the evaluation runs **before and after**, and the lesson stays live only if the pass rate did not drop. \`eval_agent.py\` already uses \`learn.system_prompt()\`, so approved lessons take effect immediately.` },
    { type: "code", file: "code-samples/ch09/learn.py", lang: "python", code: "@ch09/learn.py", output: LEARN_OUTPUT,
      note: "Tested end to end with both providers using a scripted model: the baseline scores 5/6, a lesson is proposed from the failure, and after approval the gate measures 6/6 and keeps it." },
    { type: "code", file: "code-samples/ch09/lessons.json (after approval)", lang: "json", code: LESSONS_JSON },

    { type: "section", label: "Walking through it" },
    { type: "text", md: `1. **\`propose\`** reads each failed case, its answer, the tools used, the rubric and the judge's reason, and asks the model for a general rule of at most 25 words. The prompt forbids mentioning the patient or inventing clinic facts, so lessons stay general and safe.
2. **\`add\`** lets staff teach it directly: \`python learn.py add "Always mention that requests are confirmed by phone."\` Staff corrections are often the best lessons.
3. **\`approve\`** is the gate. It runs the evaluation with the current lessons, switches the new one on, runs it again, and rolls back automatically if the score dropped.
4. **\`system_prompt()\`** adds approved lessons under the base prompt. \`MAX_LESSONS\` stops the list from growing forever; when it fills up, merge similar lessons by hand.` },

    { type: "section", label: "Rules for learning safely" },
    { type: "list", items: [
      "**A person approves every lesson.** Never let the agent change its own instructions unreviewed, especially in healthcare.",
      "**The gate is automatic.** A lesson that lowers the score is rolled back, however sensible it sounds.",
      "**Learn behaviour, not facts.** Lessons are about how to act (\"check before claiming\"). Clinic facts belong in tools and data, not in learned rules.",
      "**Never learn from one patient's words alone.** A patient saying \"Dr Rao works Sundays\" must not become a rule.",
      "**Keep history.** Every lesson has a source and status, so you can see why the agent behaves as it does and undo any change.",
      "**Grow the test set too.** Each failure that produced a lesson stays in the test set, so the lesson keeps being checked."
    ]},
    { type: "callout", kind: "analogy", md: `This is how a good hospital trains new receptionists. Mistakes are reviewed in a weekly meeting, turned into short written rules on the noticeboard, and the senior nurse approves each rule. Nobody rewrites the receptionist's personality; the noticeboard just gets a little better each week.` },
    { type: "deeper", title: "Other ways agents improve themselves", md: `- **Reflection at run time:** before replying, the agent critiques its own draft against the rules and revises it (Chapter 11). This costs an extra model call per answer but catches mistakes before the patient sees them.
- **Learning from feedback:** thumbs up/down and staff corrections are stored with the trace, and good examples are shown to the model as few-shot examples for similar questions (Chapter 3).
- **Prompt optimisation:** tools such as DSPy search for better prompts automatically against your evaluation metric (Chapter 20).
- **Fine-tuning:** once you have thousands of approved traces, train a smaller, cheaper model on them (Chapter 35).

All of them need the same two things you now have: traces and an evaluation harness.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Improvement is a loop: run, evaluate, analyse, fix, re-evaluate.",
      "Group failures by cause and fix the cause, not the single case.",
      "Self-learning has three levels: learned rules, memory, and fine-tuning. Start with rules.",
      "A safe learning loop needs human approval, an automatic evaluation gate and a full history.",
      "Learn behaviour, never facts from unverified sources."
    ]},
    { type: "section", label: "Watch" },
    { type: "videos", ids: ["ng-agentic-workflows"] },
    { type: "quiz", title: "Knowledge check: improve it", questions: [
      { kind: "order", q: "Put the improvement loop in order.",
        items: ["Run and trace", "Evaluate with the test set", "Group failures by cause", "Make the smallest fix", "Re-evaluate and keep it only if the score did not drop"] },
      { kind: "mcq", q: "The trace shows the right tool was called and returned correct data, but the answer was wrong. What do you fix?",
        options: ["The tool's code", "The data", "How the model uses results: clearer observations or a rule", "Nothing"],
        answer: 2,
        why: ["The tool worked.", "The data was correct.", "Right: the model misread correct data.", "A wrong answer always needs attention."] },
      { kind: "mcq", q: "Which is the best learned lesson?",
        options: ["\"Dr Mehta does not work on Friday.\"", "\"Never claim a booking or a day the tool did not confirm.\"", "\"Patient Ravi Kumar prefers Monday.\"", "\"Always say yes to bookings.\""],
        answer: 1,
        why: ["That is a fact; it belongs in the schedule data, and it will go stale.", "Right: general behaviour that fixes a whole class of failures.", "Patient details must never become prompt rules.", "Unsafe."] },
      { kind: "tf", q: "In `learn.py`, an approved lesson that lowers the evaluation pass rate stays live because a person approved it.", answer: false,
        explain: " The gate rolls it back automatically. Human approval and the evaluation gate are both required." },
      { kind: "mcq", q: "Why does this lesson start with learned rules instead of fine-tuning?",
        options: ["Fine-tuning is impossible", "Rules are instant, readable, easy to undo and need no training data", "Rules make the model bigger", "Fine-tuning is free"],
        answer: 1,
        why: ["It is possible, but later (Chapter 35).", "Right.", "Rules only change the prompt.", "Fine-tuning costs time and money and needs lots of good data."] }
    ]}
  ]}
  ]
};
})();
