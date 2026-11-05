/* Chapter 29 · Zapier and Make */
(function () {

var ZAP_SVG = `
<svg viewBox="0 0 680 230" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch29-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="trigger"><rect class="dg-box amber" x="10" y="80" width="110" height="60" rx="10"/><text class="dg-title" x="65" y="106" text-anchor="middle">Trigger</text><text class="dg-muted" x="65" y="124" text-anchor="middle">new portal msg</text></g>
  <g data-step="code"><rect class="dg-box" x="150" y="80" width="100" height="60" rx="10"/><text class="dg-title" x="200" y="106" text-anchor="middle">Code</text><text class="dg-muted" x="200" y="124" text-anchor="middle">hard rules</text></g>
  <g data-step="paths"><rect class="dg-box" x="280" y="80" width="90" height="60" rx="10"/><text class="dg-title" x="325" y="106" text-anchor="middle">Paths</text><text class="dg-muted" x="325" y="124" text-anchor="middle">route</text></g>
  <g data-step="ai"><rect class="dg-box accent" x="410" y="20" width="120" height="56" rx="10"/><text class="dg-title" x="470" y="44" text-anchor="middle">AI step</text><text class="dg-muted" x="470" y="62" text-anchor="middle">draft a reply</text></g>
  <g data-step="human"><rect class="dg-box" x="410" y="150" width="120" height="56" rx="10"/><text class="dg-title" x="470" y="174" text-anchor="middle">Alert staff</text><text class="dg-muted" x="470" y="192" text-anchor="middle">emergency / private</text></g>
  <g data-step="action"><rect class="dg-box amber" x="570" y="80" width="100" height="60" rx="10"/><text class="dg-title" x="620" y="106" text-anchor="middle">Action</text><text class="dg-muted" x="620" y="124" text-anchor="middle">reply + log row</text></g>
  <path class="dg-line" d="M120 110H148" marker-end="url(#ch29-a)"/><path class="dg-line" d="M250 110H278" marker-end="url(#ch29-a)"/>
  <path class="dg-line" d="M355 82L410 56" marker-end="url(#ch29-a)"/><path class="dg-line" d="M355 138L410 168" marker-end="url(#ch29-a)"/>
  <path class="dg-line" d="M530 56L580 82" marker-end="url(#ch29-a)"/><path class="dg-line" d="M530 170L580 138" marker-end="url(#ch29-a)"/>
</svg>`;

var DOOR_SVG = `
<svg viewBox="0 0 680 210" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch29-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="sender"><rect class="dg-box" x="10" y="75" width="100" height="60" rx="10"/><text class="dg-title" x="60" y="100" text-anchor="middle">Zap /</text><text class="dg-title" x="60" y="118" text-anchor="middle">scenario</text></g>
  <g data-step="sig"><rect class="dg-box amber" x="150" y="75" width="95" height="60" rx="10"/><text class="dg-title" x="197" y="100" text-anchor="middle">1 Signed?</text><text class="dg-muted" x="197" y="118" text-anchor="middle">authentic</text></g>
  <g data-step="fresh"><rect class="dg-box amber" x="260" y="75" width="95" height="60" rx="10"/><text class="dg-title" x="307" y="100" text-anchor="middle">2 Fresh?</text><text class="dg-muted" x="307" y="118" text-anchor="middle">not replayed</text></g>
  <g data-step="once"><rect class="dg-box amber" x="370" y="75" width="95" height="60" rx="10"/><text class="dg-title" x="417" y="100" text-anchor="middle">3 New?</text><text class="dg-muted" x="417" y="118" text-anchor="middle">once only</text></g>
  <g data-step="shape"><rect class="dg-box amber" x="480" y="75" width="85" height="60" rx="10"/><text class="dg-title" x="522" y="100" text-anchor="middle">4 Valid?</text><text class="dg-muted" x="522" y="118" text-anchor="middle">right shape</text></g>
  <g data-step="agent"><rect class="dg-box accent" x="590" y="75" width="80" height="60" rx="10"/><text class="dg-title" x="630" y="110" text-anchor="middle">Agent</text></g>
  <g data-step="reject"><rect class="dg-box" x="150" y="160" width="415" height="36" rx="8" style="fill:none;stroke-dasharray:5 4"/><text class="dg-muted" x="357" y="183" text-anchor="middle">any "no"  →  401 / 422 / harmless 200, and the agent never runs</text></g>
  <path class="dg-line" d="M110 105H148" marker-end="url(#ch29-b)"/><path class="dg-line" d="M245 105H258" marker-end="url(#ch29-b)"/><path class="dg-line" d="M355 105H368" marker-end="url(#ch29-b)"/><path class="dg-line" d="M465 105H478" marker-end="url(#ch29-b)"/><path class="dg-line" d="M565 105H588" marker-end="url(#ch29-b)"/>
</svg>`;

window.COURSE.chapters.ch29 = {
  id: "ch29",
  title: "Zapier and Make",
  oneLine: "Connect your agent to the thousands of apps a clinic already uses, without writing connector code. You will learn the trigger-and-action model, build the helpdesk Zap with a code step, and learn the part everyone skips: making webhooks safe.",
  lessons: [

  { title: "Triggers, actions and when to use a platform", blocks: [
    { type: "section", label: "The idea in one line" },
    { type: "text", md: `Zapier and Make are **automation platforms**: you pick an app that something happens in (the **[[trigger]]**), then chain **actions** in other apps (send an email, add a spreadsheet row, post to Slack). You draw the chain on a screen instead of writing code. They already hold the logins and connectors for thousands of apps, which is the boring part of integration.

An automation platform is a **[[workflow]] engine**, not an agent. The path is fixed when you build it. That is a strength: fixed paths are predictable, cheap and easy to audit. The skill is knowing **which part of a job is fixed plumbing and which part needs judgment**.` },
    { type: "callout", kind: "analogy", md: `**The hospital porter.** A porter takes a file from ward A to the lab, every time, by the same corridor. Nobody wants the porter to "use judgment" about the route. The *doctor* judges what the results mean. Use the platform as the porter and your agent as the doctor.` },
    { type: "section", label: "Anatomy of a Zap" },
    { type: "text", md: `Here is the clinic's patient-message flow, built as a Zapier **Zap**. Click through it.` },
    { type: "stepper", svg: ZAP_SVG, caption: "One Zap, left to right. Each box is a step; Paths splits the flow.",
      steps: [
        { on: ["trigger"], text: "The **[[trigger]]**: *a new message arrives* (from the patient portal, WhatsApp or a form). Triggers either **push** (the app calls a webhook) or are **polled** (the platform asks \"anything new?\" every few minutes, depending on plan)." },
        { on: ["code"], text: "A **Code** step runs plain Python or JavaScript. We use it for the rules that must **always** fire: emergency words, privacy words. No AI, no cost, cannot be talked around." },
        { on: ["paths"], text: "**Paths** (Zapier) or a **Router** (Make) splits the flow by a condition. Normal questions go up to the AI step; emergencies and private topics go down to a person." },
        { on: ["ai"], text: "The **AI step** drafts a reply. It can be the platform's own AI action, an OpenAI or Anthropic app action, or a webhook to **your own agent** (Lesson 3), which is how the Chapter 27 helpdesk plugs in." },
        { on: ["human"], text: "The **escalation** branch alerts staff by Slack or email. Sensitive cases never reach a model." },
        { on: ["action"], text: "The **actions**: send the reply, and add a row to a log table (Zapier Tables, Sheets or Airtable) so every message and decision can be audited later." }
      ]},
    { type: "section", label: "Zapier and Make, side by side" },
    { type: "text", md: `Both do the same job with different habits. Plans, prices and limits change often, so treat the numbers on their pricing pages as the truth and use this table for the **shape** of each tool.

| | Zapier | Make |
| --- | --- | --- |
| Unit you build | a **Zap**: a straight line of steps, with Paths for branches | a **[[scenario]]**: a canvas of modules, with a **[[router|Router]]** for branches |
| Style | list view, quick to learn | visual canvas, more control over data (iterators and aggregators for lists) |
| What you pay for | **tasks**: roughly one per successful action step (triggers are not counted) | **credits** or operations: roughly one per module run |
| AI features | AI actions, **Agents**, **MCP** server for outside AI tools | **Make AI Agents** inside a scenario, with approval points and stop conditions |
| Self-host | no | no (n8n, Chapter 28, can be) |
| Best at | getting a simple flow live in minutes | flows that reshape lists and data in the middle |

Because you pay **per step that runs**, a flow that loops over 200 rows costs 200 times what one row costs. Count before you build.` },
    { type: "callout", kind: "warning", md: `**Check the current rules before you commit.** At the time of writing, Zapier's free plan includes a small monthly task allowance and Zapier's MCP calls cost two tasks each, but these details move. Read the live pricing page of whichever tool you choose, and put an alert on usage.` },
    { type: "section", label: "When to reach for a platform" },
    { type: "list", items: [
      "**Use a platform** when the job is *move data from app A to app B*, the steps are known, and a business user must be able to change it.",
      "**Use your own agent** when the steps depend on reasoning over free text, many tools, or a loop. Call it *from* the platform with one webhook.",
      "**Use both** (the usual answer): the platform owns triggers, connectors and logging; your agent owns the thinking."
    ]},
    { type: "quiz", title: "Knowledge check: platforms", questions: [
      { kind: "match", q: "Match each job to the better owner.",
        pairs: [["Notice a new portal message and log it to a spreadsheet", "Automation platform"], ["Work out whether a rescheduling request is allowed under three policies", "Your agent"], ["Always send chest-pain messages to staff", "Plain code (rule), not an AI"], ["Reach 40 different apps without writing connectors", "Automation platform"]] },
      { kind: "mcq", q: "A Zap loops over 200 patient rows, each with 3 action steps. Roughly how many billable actions per run?",
        options: ["3", "200", "About 600", "1"],
        answer: 2,
        why: ["That is one row.", "That ignores the three steps.", "Right: 200 rows x 3 steps. Loops multiply cost.", "No."] },
      { kind: "tf", q: "A Zap is an agent, because it can decide what to do.", answer: false,
        explain: " A Zap follows the path you drew. Only a step that calls a model (or a platform agent) adds judgment, and even then the surrounding path is fixed." }
    ]}
  ]},

  { title: "Building the helpdesk Zap, and AI inside platforms", blocks: [
    { type: "section", label: "Step 1: hard rules in a code step" },
    { type: "text", md: `Every Zap that touches patients starts with **rules that cannot fail**. Zapier's **Code** step runs Python 3 with the standard library and \`requests\`. The fields you map arrive in a dictionary called \`input_data\`; you finish by setting one variable called \`output\` (a dictionary, or a list of dictionaries, that can be turned into JSON).

The file below is written as a normal function so you can test it on your laptop. In Zapier you paste the body in and end it with \`output = run(input_data)\`.` },
    { type: "code", file: "code-samples/ch29/zapier_code_step.py", lang: "python", code: "@ch29/zapier_code_step.py",
      output: "{'route': 'ai', 'message': 'What time does Dr Mehta see patients?', 'length': 37}\n{'route': 'emergency', 'message': 'I have chest pain since morning', 'length': 31}\n{'route': 'human-only', 'message': 'Is HIV testing done here?', 'length': 25}",
      note: "Output produced by running the file locally. The pasted version inside Zapier behaves the same; we could not run Zapier itself here, so test the Zap with its built-in Test button." },
    { type: "text", md: `Notice the first line of \`run\`: it **cuts the message to 1000 characters**. Anything arriving from outside can be huge or hostile; shrink it before anything else sees it.

The **Paths** step then reads \`route\`: \`ai\` goes to the AI branch, the other two to the staff alert.` },
    { type: "section", label: "Step 2: where the AI comes in" },
    { type: "text", md: `Three ways to put intelligence in the AI branch, from simplest to most powerful:

1. **A platform AI action.** Add an AI step ("write a reply to this message in a friendly tone"). Quick, but it knows nothing about your doctors or bills. Fine for tone, summaries and sorting.
2. **A model app step** (an OpenAI or Anthropic action). Same, with the model you choose. You write the prompt; you still pass in all the facts yourself.
3. **A webhook to your own agent.** The Zap sends the message to the Chapter 27 helpdesk. It has the tools, the policies and the guardrails, and the Zap just carries the answer onward. This is the pattern we build next, and the one to prefer for anything beyond tone and summaries.` },
    { type: "callout", kind: "tip", md: `**Why not put the whole helpdesk inside the Zap?** You could chain many AI steps, but you would lose tests, version control, the budget limits and the evaluation from earlier chapters. Keep the *logic* in code you can test, and use the platform for what it does best: triggers and connectors.` },
    { type: "section", label: "Platform agents and MCP" },
    { type: "text", md: `Both platforms now also offer agents of their own, and Zapier opens its connectors to outside AI tools:

- **Zapier Agents**: you describe a job in plain language, pick the apps it may use, and the agent decides which to call. Usage is metered separately from ordinary tasks ("activities").
- **Zapier MCP**: Zapier acts as an **[[mcp|MCP]] server**, so Claude, Cursor or your own agent can call Zapier's actions as tools (Chapters 16 to 17). Each tool call counts toward your tasks, currently two per call. It is the fastest way to give your agent "send a Slack message" or "add a calendar event" without writing the integration.
- **Make AI Agents**: an agent you place inside a scenario, which chooses between modules you give it as tools. Make documents **manual approval points** and **stop conditions** for them.` },
    { type: "callout", kind: "warning", md: `**The old rules still apply.** An agent that can call "send email" through Zapier MCP can send the wrong email. Give it only the actions it needs, require approval for anything that writes outside the clinic (Chapter 11), and never connect it to an account whose damage you could not undo.` },
    { type: "list", items: [
      "Keep **fixed rules in code steps**; use AI only where wording or judgment is needed.",
      "For real logic, **call your own agent** by webhook rather than chaining AI steps.",
      "Platform agents and MCP are quick to start with and still need **least-privilege actions and approvals**."
    ]},
    { type: "quiz", title: "Knowledge check: the AI Zap", questions: [
      { kind: "order", q: "Put the helpdesk Zap's steps in order.",
        items: ["Trigger: new portal message", "Code step applies emergency and privacy rules", "Paths branches on the route", "AI branch calls the helpdesk by webhook", "Action: reply sent and a log row added"] },
      { kind: "mcq", q: "Why does the code step truncate the message to 1000 characters?",
        options: ["Zapier requires it", "Anything arriving from outside can be huge or hostile, so shrink it first", "Models cannot read more than 1000 characters", "To save disk space"],
        answer: 1,
        why: ["Not a Zapier rule.", "Right: bound untrusted input before anything else touches it.", "Models read far more.", "Not the reason."] },
      { kind: "tf", q: "Once Zapier MCP is connected, your agent should be allowed to call every Zapier action it can see.", answer: false,
        explain: " Expose only the actions the job needs. Each extra action is extra damage the agent can do if it is fooled." }
    ]}
  ]},

  { title: "Webhooks: letting platforms call your agent, safely", blocks: [
    { type: "section", label: "What a webhook is" },
    { type: "text", md: `A **[[webhook]]** is a web address on **your** server that another system calls when something happens. The Zap says "a message arrived" by sending an HTTP POST to your address. Simple, and also a **public door** into your agent. Anyone who finds the address can knock.

A safe webhook asks four questions before the agent runs. Click through them.` },
    { type: "stepper", svg: DOOR_SVG, caption: "Four checks stand between the internet and the agent.",
      steps: [
        { on: ["sender"], text: "The Zap or scenario sends a POST with a JSON body and a few headers." },
        { on: ["sig"], text: "**1 Authentic.** A shared secret proves who sent it. Better, an **[[hmac|HMAC signature]]** of the whole body proves *what* was sent too: change one letter and the signature breaks." },
        { on: ["fresh"], text: "**2 Fresh.** The timestamp is part of the signature and must be within five minutes. This stops a **[[replay attack]]**: someone recording a real message and sending it again later." },
        { on: ["once"], text: "**3 New.** Platforms **retry** when they are unsure a message arrived. An **[[idempotent|idempotency key]]** lets you recognise a repeat and answer harmlessly, instead of booking an appointment twice." },
        { on: ["shape"], text: "**4 Valid.** The body must match a typed model: right fields, right lengths, allowed values. Unexpected input is rejected before it can become a prompt." },
        { on: ["agent"], text: "Only now does the helpdesk run. Anything that fails earlier gets a clear error and costs you nothing." },
        { on: ["reject"], text: "Failing a check never reaches a model: no tokens spent, no side effects." }
      ]},
    { type: "section", label: "The building blocks" },
    { type: "code", file: "code-samples/ch29/webhook_security.py", lang: "python", code: "@ch29/webhook_security.py",
      note: "Uses only the standard library. hmac.compare_digest compares in constant time so an attacker cannot learn the signature one character at a time." },
    { type: "text", md: `Two details worth noticing. The signature covers \`timestamp.body\`, so an attacker cannot reuse an old signature with a new timestamp. And \`Seen.first_time\` relies on the database's **primary key**: if two copies of the same event arrive at the same instant, only one insert succeeds.` },
    { type: "section", label: "The receiving endpoint" },
    { type: "text", md: `This FastAPI app puts the four checks in front of the Chapter 27 helpdesk. It accepts either an HMAC signature (when the sender can compute one) or a **shared token header** (what a plain "send a webhook" action in Zapier can do).` },
    { type: "code", file: "code-samples/ch29/inbound_webhook.py", lang: "python", code: "@ch29/inbound_webhook.py",
      note: "Notice approver=None: an automation has no person at the approval gate, so every booking is declined and flagged for staff. Unattended agents must fail safe." },
    { type: "section", label: "Prove it works" },
    { type: "code", file: "code-samples/ch29/test_webhooks.py", lang: "python", code: "@ch29/test_webhooks.py",
      output: "......... [100%]\n9 passed in 1.46s",
      note: "Run offline with a fake model: OFFLINE=1 pytest -q. The tests cover tampering, replay, wrong secrets, duplicates, bad payloads and the no-human booking case." },
    { type: "callout", kind: "tip", md: `**Reaching your laptop from the internet.** A Zap cannot call \`localhost\`. While developing, use a tunnel tool (Cloudflare Tunnel, ngrok) to give it a temporary public address. For real use, deploy the app (Chapter 36). Never leave a tunnel running with the default secret.` },
    { type: "quiz", title: "Knowledge check: webhooks", questions: [
      { kind: "match", q: "Match each attack to the check that stops it.",
        pairs: [["Someone forges a message pretending to be the Zap", "Signature or token"], ["Someone re-sends yesterday's real message", "Timestamp window"], ["The platform retries, so one event arrives twice", "Idempotency key"], ["A body with a 50,000-character message field", "Payload validation"]] },
      { kind: "mcq", q: "Why is the timestamp included INSIDE the signed text?",
        options: ["It makes the signature longer", "So an attacker cannot attach a fresh timestamp to an old signed message", "To sort the logs", "Platforms require it"],
        answer: 1,
        why: ["Length is irrelevant.", "Right: change the timestamp and the signature no longer matches.", "Unrelated.", "Not a requirement."] },
      { kind: "tf", q: "If the same Idempotency-Key arrives twice, the second call should return an error so the sender knows it failed.", answer: false,
        explain: " Return a harmless success (we return \"duplicate-ignored\"). An error would make the platform retry again, which is the very thing we are avoiding." }
    ]}
  ]},

  { title: "Calling out, and production habits", blocks: [
    { type: "section", label: "Your agent calls the platform" },
    { type: "text", md: `The traffic also flows the other way: your agent finishes something and tells Zapier or Make, which then writes the row, sends the Slack message or creates the ticket. In Zapier this is a **Catch Hook** trigger; in Make, a **Custom webhook** module. Both give you a long secret URL.

Sending is where retries go wrong. The rules in this file: **reuse one idempotency key across all retries**, retry only on server errors and rate limits (never on 4xx, which means *you* made a mistake), and always set a timeout.` },
    { type: "code", file: "code-samples/ch29/outbound.py", lang: "python", code: "@ch29/outbound.py" },
    { type: "text", md: `Here sender and receiver talk in one process, with a fake model and no network. A signed event works, a forged signature is refused, and the same key twice is processed only once.` },
    { type: "code", file: "code-samples/ch29/demo_roundtrip.py", lang: "python", code: "@ch29/demo_roundtrip.py",
      output: "1. signed event      -> Yes, Dr Rao works on Thursday (he sees patients Thu and Fri) ...\n2. forged signature  -> 401 bad signature\n3. same key twice    -> done then duplicate-ignored",
      note: "Output produced by running: OFFLINE=1 python demo_roundtrip.py. The reply text comes from the offline rule-based model, not a real LLM." },
    { type: "section", label: "Production: running automations that touch patients" },
    { type: "text", md: `Automations run **unattended, many times a day, for months**. The failures that hurt are quiet ones.` },
    { type: "list", items: [
      "**Fail safe.** No human is at the gate in a Zap, so writes (bookings, refunds) are declined and sent to staff. Approvals happen in a separate, human flow (Chapter 28 shows this in n8n).",
      "**Minimise data.** Send only what the step needs. Never put names, phone numbers or diagnoses into a platform's task history, which is retained and visible to everyone on the account. Pass an ID and look the patient up on your side.",
      "**Secrets in the vault.** Keys live in the platform's connection or secret store, never pasted into step text, and rotate when staff leave.",
      "**Alert on failure.** Turn on error notifications and add a final \"something went wrong\" path. A Zap that silently stops is worse than one that fails loudly.",
      "**Watch the bill.** Loops, polling frequency and retries all multiply usage. Set a usage alert and review it monthly.",
      "**Test with fake data first**, then copy the Zap for production. Name flows like code: \"helpdesk-intake-v3 (prod)\".",
      "**Know the exit.** Platforms change prices and features. Keep the logic in your own tested code so moving to another tool (or n8n) means re-drawing a few boxes, not rewriting the system."
    ]},
    { type: "list", style: "mistakes", items: [
      "Pasting the API key into a step's text field, where it appears in logs and shares.",
      "Retrying a webhook with a new idempotency key each time, creating duplicates.",
      "Letting a loop run over the whole patient table on every trigger.",
      "No error path, so a failed step quietly drops a patient's message.",
      "Treating the platform's AI step as a safe place for private medical details."
    ]},
    { type: "quiz", title: "Knowledge check: production", questions: [
      { kind: "mcq", q: "Your sender gets HTTP 400 from the receiver. What should it do?",
        options: ["Retry three times", "Not retry: a 4xx means the request itself is wrong, so fix it", "Wait one hour and retry", "Switch to another URL"],
        answer: 1,
        why: ["Retrying a bad request cannot fix it.", "Right: retry only server errors (5xx) and rate limits (429).", "Same problem.", "No."] },
      { kind: "order", q: "Put a safe webhook sender in order.",
        items: ["Create one idempotency key", "Sign the body with a fresh timestamp", "POST with a timeout", "Retry only on 5xx or 429, reusing the key", "Give up with a clear error after the limit"] },
      { kind: "tf", q: "It is fine to put a patient's full name and diagnosis into a Zap step because only our team can see the Zap.", answer: false,
        explain: " Task history is stored by the platform and visible to everyone with access to the account. Pass an ID and look details up inside your own system." }
    ]}
  ]}

  ]
};
})();
