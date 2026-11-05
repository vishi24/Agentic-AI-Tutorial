/* Chapter 8 · Tools and function calling */
(function () {

var SEQ_SVG = `
<svg viewBox="0 0 680 330" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch08-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <text class="dg-title" x="100" y="24" text-anchor="middle">Your code</text>
  <text class="dg-title" x="360" y="24" text-anchor="middle">Model</text>
  <text class="dg-title" x="590" y="24" text-anchor="middle">Tool (your function)</text>
  <line x1="100" y1="32" x2="100" y2="320" stroke="var(--line)" stroke-dasharray="4 4"/>
  <line x1="360" y1="32" x2="360" y2="320" stroke="var(--line)" stroke-dasharray="4 4"/>
  <line x1="590" y1="32" x2="590" y2="320" stroke="var(--line)" stroke-dasharray="4 4"/>
  <g data-step="send"><path class="dg-line" d="M100 58H356" marker-end="url(#ch08-a)"/><text class="dg-muted" x="230" y="52" text-anchor="middle">question + tool descriptions</text></g>
  <g data-step="ask"><path class="dg-line" d="M360 100H104" marker-end="url(#ch08-a)"/><text class="dg-muted" x="230" y="94" text-anchor="middle">tool call: opd_fee {"visit_type": "new"}</text></g>
  <g data-step="validate"><rect class="dg-box amber" x="30" y="114" width="140" height="30" rx="6"/><text class="dg-text" x="100" y="134" text-anchor="middle">validate arguments</text></g>
  <g data-step="run"><path class="dg-line" d="M100 166H586" marker-end="url(#ch08-a)"/><text class="dg-muted" x="345" y="160" text-anchor="middle">opd_fee(FeeArgs(visit_type="new"))</text>
    <path class="dg-line" d="M590 196H104" marker-end="url(#ch08-a)"/><text class="dg-muted" x="345" y="190" text-anchor="middle">{"fee_rs": 100, ...}</text></g>
  <g data-step="result"><path class="dg-line" d="M100 238H356" marker-end="url(#ch08-a)"/><text class="dg-muted" x="230" y="232" text-anchor="middle">history + tool result</text></g>
  <g data-step="final"><path class="dg-line" d="M360 280H104" marker-end="url(#ch08-a)"/><text class="dg-muted" x="230" y="274" text-anchor="middle">"A new OPD visit costs Rs 100."</text></g>
</svg>`;

window.COURSE.chapters.ch08 = {
  id: "ch08",
  title: "Tools and function calling",
  oneLine: "Function calling lets a model ask your code to run a named function with specific arguments. The model decides what to call; your code decides whether and how it runs.",
  lessons: [

  { title: "How function calling works", blocks: [
    { type: "section", label: "The problem" },
    { type: "text", md: `RAG (Chapter 7) gives the model documents to read. But some answers must be **computed or looked up live**: today's schedule, a patient's fee given their last visit date, whether a slot is free. And some requests need **actions**: create an appointment request, send a reminder. Text cannot do these. Code can.` },
    { type: "section", label: "The idea" },
    { type: "text", md: `[[function calling|Function calling]] (also called tool calling or tool use) works like this: you describe some functions to the model. When the model decides one would help, it does **not** reply with text. It replies with a structured request: the function's name and the arguments as [[json|JSON]]. **Your code** runs the function and sends the result back. The model then writes the answer.` },
    { type: "stepper", svg: SEQ_SVG, caption: "One function-calling round trip. The model never runs anything itself.",
      steps: [
        { on: ["send"], text: "**Your code sends** the question plus the tool descriptions ([[tool schema|tool schemas]])." },
        { on: ["ask"], text: "**The model asks** for a tool by name, with arguments as JSON. This is just text in a fixed structure." },
        { on: ["validate"], text: "**Your code validates** the arguments. Models occasionally send wrong types or values." },
        { on: ["run"], text: "**Your code runs** the real function and gets the result." },
        { on: ["result"], text: "**The result goes back** to the model, linked to the request by an id." },
        { on: ["final"], text: "**The model answers** using the result, in plain language." }
      ]},
    { type: "callout", kind: "analogy", md: `A doctor (the model) writes a lab request: "CBC, fasting glucose". The lab (your code) checks the request is valid, runs the tests and sends back results. The doctor never touches the analyser, and the lab can refuse a request that makes no sense.` },
    { type: "section", label: "What the model sees" },
    { type: "text", md: `Only three things about each tool: its **name**, its **description**, and its **parameters** as a JSON Schema. Never your code. So the description is your only way to teach the model *when* to use a tool:

| Weak | Strong |
| --- | --- |
| \`fee\`: "Gets fee" | \`opd_fee\`: "Calculate the OPD consultation fee in rupees. Use for any question about what a visit costs." |
| \`department: string\` | \`department\`: one of cardiology, orthopaedics, paediatrics. "Heart = cardiology, bones/joints = orthopaedics, children = paediatrics." |` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "The model asks for a function by name with JSON arguments; your code runs it.",
      "The model sees only the name, description and parameter schema, so write them carefully.",
      "Results go back linked to the request id, and the model writes the final answer."
    ]},
    { type: "quiz", title: "Knowledge check: how function calling works", questions: [
      { kind: "order", q: "Put a function-calling round trip in order.",
        items: ["Send the question and tool descriptions", "Model returns a tool call with JSON arguments", "Your code validates and runs the function", "Send the result back to the model", "Model writes the final answer"] },
      { kind: "tf", q: "The model reads your Python function's code to understand what it does.", answer: false,
        explain: " It sees only the name, description and JSON Schema of the parameters." },
      { kind: "mcq", q: "The model never uses your `opd_fee` tool for questions like \"how much is a consultation?\". The likeliest cause?",
        options: ["The tool's Python code has a bug", "The description does not say when to use it", "Function calling is disabled", "Temperature"],
        answer: 1,
        why: ["The model never runs the code before deciding.", "Right.", "Possible, but check the description first.", "Unrelated."] }
    ]}
  ]},

  { title: "Typed tools with Pydantic", blocks: [
    { type: "section", label: "Define each tool once" },
    { type: "text", md: `Writing JSON Schemas by hand for every tool, in two provider formats, then checking arguments separately, is error-prone. Instead: describe each tool's arguments with a **Pydantic model**. From that one definition you get the schema for the model, both provider formats, and validation.` },
    { type: "code", file: "code-samples/ch08/tools.py", lang: "python", code: "@ch08/tools.py" },
    { type: "text", md: `How it fits together:

- **\`@tool(FeeArgs)\`** registers the function with its argument model and uses the docstring as the description.
- **\`Literal[...]\`** becomes an \`enum\` in the schema: the model can only choose valid departments, and validation rejects anything else.
- **\`Field(ge=0)\`** rejects impossible values, such as negative days, *before* your logic runs.
- **\`specs("openai")\` / \`specs("anthropic")\`** produce each provider's format from the same definitions.
- **\`run_tool\`** accepts arguments as a dict (Anthropic) or a JSON string (OpenAI), validates them, and turns every problem into an error message the model can read and correct.` },
    { type: "section", label: "Test tools like ordinary code" },
    { type: "code", file: "code-samples/ch08/test_tools.py", lang: "python", code: "@ch08/test_tools.py",
      output: `$ pytest -q test_tools.py
.......                                                                  [100%]
7 passed in 0.08s`, note: "Real output." },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Describe tool arguments with Pydantic: one source for schema, formats and validation.",
      "Use Literal for allowed values and Field limits for ranges.",
      "Return validation problems as messages, so the model can fix its call.",
      "Tools are ordinary code: unit-test them without a model."
    ]},
    { type: "quiz", title: "Knowledge check: typed tools", questions: [
      { kind: "mcq", q: "The model calls `opd_fee` with `days_since_last_visit: -2`. What happens?",
        options: ["The fee is calculated as free", "Validation returns an error message to the model", "The program crashes", "The model is blocked permanently"],
        answer: 1,
        why: ["Validation runs first.", "Right: Field(ge=0) rejects it.", "run_tool catches it.", "It can retry with a corrected value."] },
      { kind: "tf", q: "OpenAI sends tool arguments as a JSON string; Anthropic sends them already parsed.", answer: true,
        explain: " That is why run_tool accepts both." }
    ]}
  ]},

  { title: "Calling tools with both providers", blocks: [
    { type: "section", label: "One round trip, parallel calls, forced routing" },
    { type: "code", file: "code-samples/ch08/function_calling.py", lang: "python", code: "@ch08/function_calling.py",
      output: `  tool: get_doctor_schedule({"department": "orthopaedics"}) -> {'department': 'orthopaedics', 'doctors': {'Dr Iyer': ['Tue', 'Thu']}}
  tool: opd_fee({"visit_type": "follow_up", "days_since_last_visit": 5}) -> {'fee_rs': 0, 'reason': 'Follow-up within 7 days with the same doctor is free.'}
Yes, Dr Iyer sees orthopaedics patients on Thursday. Your follow-up 5 days after your
last visit is free, because it is within 7 days.
category='billing' urgent=False summary='Patient was charged twice for a consultation.'
category='emergency' urgent=True summary='Mother has been very breathless for an hour.'`,
      note: "Tested with both SDKs' real response types, including two tool calls in one reply and forced routing." },
    { type: "section", label: "Parallel tool calls" },
    { type: "text", md: `The patient asked two things, so the model requested **two tools in one reply**. Rules for handling that correctly:

- **Run every requested call**, not just the first.
- **Answer each by its id.** OpenAI: one \`tool\` message per call. Anthropic: **one** \`user\` message containing all the \`tool_result\` blocks.
- **Independent calls can run concurrently** (Chapter 4) to save time.` },
    { type: "section", label: "Controlling tool choice" },
    { type: "text", md: `| You want | OpenAI \`tool_choice\` | Anthropic \`tool_choice\` |
| --- | --- | --- |
| Model decides (default) | \`"auto"\` | \`{"type": "auto"}\` |
| Must call some tool | \`"required"\` | \`{"type": "any"}\` |
| Must call this tool | \`{"type": "function", "function": {"name": "route_message"}}\` | \`{"type": "tool", "name": "route_message"}\` |
| No tools this time | \`"none"\` | \`{"type": "none"}\` |

**Forcing a specific tool** is a reliable way to get structured output: \`route()\` always returns a validated \`RouteArgs\`. This is how many systems route incoming messages to the right team or agent (Part D).` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Handle every tool call in a reply and return each result by its id.",
      "Use tool_choice to let the model decide, require a tool, force one, or disallow tools.",
      "Forcing a routing tool is a dependable way to get structured routing decisions."
    ]},
    { type: "quiz", title: "Knowledge check: both providers", questions: [
      { kind: "mcq", q: "The model asks for two tools in one reply. Your code runs only the first. What happens next?",
        options: ["Nothing; the model ignores the second", "The next API call fails or the model lacks a result it asked for", "The second runs automatically", "The provider runs it"],
        answer: 1,
        why: ["Each request expects a result.", "Right: always answer every call.", "Nothing runs automatically.", "Providers never run your tools."] },
      { kind: "match", q: "Match the goal to the Anthropic tool_choice.",
        pairs: [["Let the model decide", "{\"type\": \"auto\"}"], ["Must call some tool", "{\"type\": \"any\"}"], ["Must call route_message", "{\"type\": \"tool\", \"name\": \"route_message\"}"]] }
    ]}
  ]},

  { title: "Production: designing safe tools", blocks: [
    { type: "section", label: "Tools are where agents touch the real world" },
    { type: "text", md: `Everything risky an agent can do, it does through a tool. So tool design is where safety, reliability and cost are mostly decided.` },
    { type: "text", md: `| Principle | Why | In practice |
| --- | --- | --- |
| **Small and specific** | The model chooses better between clear, distinct tools | \`opd_fee\` and \`get_doctor_schedule\`, not one \`hospital_api(action, params)\` |
| **Few tools per agent** | Every description costs tokens on every call, and more choice means more mistakes | Under ~10–15 per agent; split by role in Part D |
| **Read before write** | Read-only mistakes are cheap; writes have consequences | Start read-only; add writes behind approval (Chapter 9) |
| **Least privilege** | A tool can only do what its credentials allow | A read-only database user for lookups |
| **Validate everything** | Models send wrong values sometimes | Pydantic models with enums and ranges |
| **Errors as observations** | The model can recover from a clear message | \`{"error": "Invalid arguments: department ..."}\` |
| **Idempotent writes** | Retries must not create duplicates | Pass a request id; if seen before, return the earlier result |
| **Timeouts** | One slow system must not hang the patient | A timeout on every external call |
| **Small results** | Huge results flood the context and cost money | Return the 5 relevant rows, not 500 (Chapter 9) |
| **Logged** | You must be able to reconstruct what happened | Tool name, arguments, result, time and request id |` },
    { type: "section", label: "Idempotency, briefly" },
    { type: "code", file: "idempotent write (sketch)", lang: "python", code: `_done: dict[str, dict] = {}            # in production: a database table

def request_appointment(args: AppointmentArgs) -> dict:
    """Create an appointment request. Safe to retry: the same request_key returns the same result."""
    if args.request_key in _done:      # e.g. conversation id + doctor + day
        return _done[args.request_key]
    result = create_pending_request(args.doctor, args.day, args.patient_name)
    _done[args.request_key] = result
    return result` },
    { type: "text", md: `Networks fail after the work is done but before the reply arrives, and retries then repeat the action. With a request key, a retried call returns the first result instead of creating a second appointment.` },
    { type: "section", label: "Common mistakes" },
    { type: "list", style: "mistakes", items: [
      "**One giant 'do anything' tool.** The model cannot reason about it, and it cannot be permissioned.",
      "**Trusting arguments.** Always validate, even with native schema enforcement.",
      "**Raising exceptions out of tools.** The agent crashes instead of recovering.",
      "**Write tools without approval or idempotency.** Duplicates and unwanted actions follow."
    ]},
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Tools are where agents touch the real world: keep them small, few and specific.",
      "Read before write; least privilege; validate everything.",
      "Errors become observations; writes are idempotent and approved; results are small and logged."
    ]},
    { type: "quiz", title: "Knowledge check: safe tools", questions: [
      { kind: "mcq", q: "A network glitch makes your code retry `request_appointment`, and the patient gets two requests. What prevents this?",
        options: ["A longer timeout", "An idempotency key, so a repeated request returns the first result", "Fewer tools", "A bigger model"],
        answer: 1,
        why: ["Retries still repeat the action.", "Right.", "Unrelated.", "Unrelated."] },
      { kind: "tf", q: "One flexible `hospital_api(action, params)` tool is better than several specific ones because it is more powerful.", answer: false,
        explain: " Specific tools are easier for the model to choose correctly and for you to permission and test." },
      { kind: "match", q: "Match each principle to its practice.",
        pairs: [["Least privilege", "Read-only database user for lookups"], ["Small results", "Return 5 relevant rows, not 500"], ["Errors as observations", "Return {\"error\": ...} instead of raising"]] }
    ]}
  ]}
  ]
};
})();
