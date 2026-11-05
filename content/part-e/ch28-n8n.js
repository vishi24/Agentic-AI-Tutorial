/* Chapter 28 · n8n agentic workflows */
(function () {

var ASK_SVG = `
<svg viewBox="0 0 680 250" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch28-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="door"><rect class="dg-box amber" x="6" y="80" width="92" height="50" rx="9"/><text class="dg-title" x="52" y="102" text-anchor="middle">Webhook</text><text class="dg-muted" x="52" y="118" text-anchor="middle">header key</text></g>
  <g data-step="validate"><rect class="dg-box" x="116" y="80" width="90" height="50" rx="9"/><text class="dg-title" x="161" y="102" text-anchor="middle">Validate</text><text class="dg-muted" x="161" y="118" text-anchor="middle">Code node</text>
    <rect class="dg-box" x="222" y="80" width="78" height="50" rx="9"/><text class="dg-title" x="261" y="110" text-anchor="middle">Valid?</text>
    <rect class="dg-box" x="206" y="188" width="110" height="44" rx="9" style="fill:none;stroke-dasharray:5 4"/><text class="dg-text" x="261" y="214" text-anchor="middle">400 bad request</text>
    <path class="dg-line" d="M261 130V186" marker-end="url(#ch28-a)"/></g>
  <g data-step="call"><rect class="dg-box accent" x="318" y="80" width="104" height="50" rx="9"/><text class="dg-title" x="370" y="102" text-anchor="middle">Ask helpdesk</text><text class="dg-muted" x="370" y="118" text-anchor="middle">HTTP, 1 retry</text></g>
  <g data-step="fallback"><rect class="dg-box" x="338" y="188" width="140" height="44" rx="9" style="fill:none;stroke-dasharray:5 4"/><text class="dg-text" x="408" y="214" text-anchor="middle">503 + friendly text</text>
    <path class="dg-line" d="M385 130L400 186" marker-end="url(#ch28-a)"/></g>
  <g data-step="branch"><rect class="dg-box" x="440" y="80" width="98" height="50" rx="9"/><text class="dg-title" x="489" y="102" text-anchor="middle">Needs</text><text class="dg-title" x="489" y="118" text-anchor="middle">approval?</text></g>
  <g data-step="notify"><rect class="dg-box amber" x="558" y="14" width="116" height="52" rx="9"/><text class="dg-title" x="616" y="36" text-anchor="middle">Notify staff</text><text class="dg-muted" x="616" y="52" text-anchor="middle">then say "pending"</text></g>
  <g data-step="answer"><rect class="dg-box amber" x="558" y="144" width="116" height="52" rx="9"/><text class="dg-title" x="616" y="166" text-anchor="middle">Reply</text><text class="dg-muted" x="616" y="182" text-anchor="middle">the answer</text></g>
  <path class="dg-line" d="M98 105H114" marker-end="url(#ch28-a)"/><path class="dg-line" d="M206 105H220" marker-end="url(#ch28-a)"/><path class="dg-line" d="M300 105H316" marker-end="url(#ch28-a)"/><path class="dg-line" d="M422 105H438" marker-end="url(#ch28-a)"/>
  <path class="dg-line" d="M538 92L556 52" marker-end="url(#ch28-a)"/><path class="dg-line" d="M538 118L556 158" marker-end="url(#ch28-a)"/>
</svg>`;

var SEQ_SVG = `
<svg viewBox="0 0 680 350" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch28-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g><rect class="dg-box" x="20" y="8" width="100" height="30" rx="8"/><text class="dg-title" x="70" y="28" text-anchor="middle">Patient</text>
     <rect class="dg-box accent" x="190" y="8" width="100" height="30" rx="8"/><text class="dg-title" x="240" y="28" text-anchor="middle">n8n</text>
     <rect class="dg-box" x="370" y="8" width="110" height="30" rx="8"/><text class="dg-title" x="425" y="28" text-anchor="middle">Helpdesk API</text>
     <rect class="dg-box" x="550" y="8" width="100" height="30" rx="8"/><text class="dg-title" x="600" y="28" text-anchor="middle">Staff</text>
     <path class="dg-line" d="M70 40V340M240 40V340M425 40V340M600 40V340" style="stroke-dasharray:3 4;opacity:.5"/></g>
  <g data-step="s1"><path class="dg-accent-line" d="M70 64H238" marker-end="url(#ch28-b)"/><text class="dg-muted" x="154" y="58" text-anchor="middle">POST /helpdesk-ask</text></g>
  <g data-step="s2"><path class="dg-accent-line" d="M240 92H423" marker-end="url(#ch28-b)"/><text class="dg-muted" x="332" y="86" text-anchor="middle">POST /ask</text></g>
  <g data-step="s3"><rect class="dg-box amber" x="378" y="104" width="94" height="30" rx="6"/><text class="dg-text" x="425" y="124" text-anchor="middle">pauses here</text>
     <path class="dg-line" d="M423 148H242" marker-end="url(#ch28-b)"/><text class="dg-muted" x="332" y="142" text-anchor="middle">pending_approval + run_id</text></g>
  <g data-step="s4"><path class="dg-line" d="M242 176H598" marker-end="url(#ch28-b)"/><text class="dg-muted" x="420" y="170" text-anchor="middle">notify: "Dr Rao, Thu" + run_id</text>
     <path class="dg-line" d="M238 204H72" marker-end="url(#ch28-b)"/><text class="dg-muted" x="154" y="198" text-anchor="middle">"staff will confirm"</text></g>
  <g data-step="s5"><path class="dg-accent-line" d="M600 238H242" marker-end="url(#ch28-b)"/><text class="dg-muted" x="420" y="232" text-anchor="middle">POST /helpdesk-approve (later)</text></g>
  <g data-step="s6"><path class="dg-accent-line" d="M240 266H423" marker-end="url(#ch28-b)"/><text class="dg-muted" x="332" y="260" text-anchor="middle">POST /approve</text></g>
  <g data-step="s7"><path class="dg-line" d="M423 294H242" marker-end="url(#ch28-b)"/><text class="dg-muted" x="332" y="288" text-anchor="middle">booked: REQ-001</text>
     <path class="dg-line" d="M242 322H598" marker-end="url(#ch28-b)"/><text class="dg-muted" x="420" y="316" text-anchor="middle">result back to staff</text></g>
</svg>`;

var AGENT_SVG = `
<svg viewBox="0 0 680 250" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch28-c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="in"><rect class="dg-box amber" x="10" y="52" width="110" height="50" rx="9"/><text class="dg-title" x="65" y="74" text-anchor="middle">Webhook</text><text class="dg-muted" x="65" y="90" text-anchor="middle">+ validate</text></g>
  <g data-step="agent"><rect class="dg-box accent" x="190" y="30" width="230" height="94" rx="12"/><text class="dg-title" x="305" y="58" text-anchor="middle">AI Agent node</text><text class="dg-muted" x="305" y="78" text-anchor="middle">system message, max iterations</text><text class="dg-muted" x="305" y="96" text-anchor="middle">runs the loop for you</text></g>
  <g data-step="out"><rect class="dg-box amber" x="490" y="52" width="120" height="50" rx="9"/><text class="dg-title" x="550" y="74" text-anchor="middle">Respond</text><text class="dg-muted" x="550" y="90" text-anchor="middle">to the caller</text></g>
  <g data-step="model"><rect class="dg-box" x="170" y="178" width="130" height="52" rx="9"/><text class="dg-title" x="235" y="200" text-anchor="middle">Chat model</text><text class="dg-muted" x="235" y="216" text-anchor="middle">OpenAI or Anthropic</text></g>
  <g data-step="tool"><rect class="dg-box" x="320" y="178" width="130" height="52" rx="9"/><text class="dg-title" x="385" y="200" text-anchor="middle">Tool</text><text class="dg-muted" x="385" y="216" text-anchor="middle">HTTP: ask_helpdesk</text></g>
  <g data-step="memory"><rect class="dg-box" x="470" y="178" width="130" height="52" rx="9" style="stroke-dasharray:5 4"/><text class="dg-title" x="535" y="200" text-anchor="middle">Memory</text><text class="dg-muted" x="535" y="216" text-anchor="middle">optional, per session</text></g>
  <path class="dg-line" d="M120 77H188" marker-end="url(#ch28-c)"/><path class="dg-line" d="M420 77H488" marker-end="url(#ch28-c)"/>
  <path class="dg-line" d="M250 178L260 126" marker-end="url(#ch28-c)"/><path class="dg-line" d="M375 178L345 126" marker-end="url(#ch28-c)"/><path class="dg-line" d="M520 178L400 126" marker-end="url(#ch28-c)" style="stroke-dasharray:4 3"/>
</svg>`;

window.COURSE.chapters.ch28 = {
  id: "ch28",
  title: "n8n agentic workflows",
  oneLine: "n8n is a visual workflow tool you can run on your own server. You will put the Chapter 27 helpdesk behind a safe n8n webhook, add staff approval and failure handling, and also try n8n's own AI Agent node. Everything here was run for real.",
  lessons: [

  { title: "What n8n is, and how its workflows think", blocks: [
    { type: "section", label: "A workflow canvas you can host yourself" },
    { type: "text", md: `**[[n8n]]** (say “n-eight-n”) is a [[workflow]] tool like Zapier and Make (Chapter 29): you drag **nodes** onto a canvas and join them with lines. The differences that matter for us:

- You can **run it yourself**: on your laptop, a server in the clinic, or a cloud machine. Patient data then never has to pass through a third-party automation service. (Its licence is "fair-code": the source is open and you may self-host for your own use, with limits on reselling it. Read the licence if you plan to build a commercial product on it.)
- It has a **Code node** (JavaScript or Python) for anything the boxes cannot do, and an **HTTP Request node** that can call any API.
- It has **AI nodes**: an AI Agent node, chat models, memory, and tools, plus nodes that act as an [[mcp|MCP]] client or server (Chapters 16 to 17).

n8n is a good fit when you want a non-programmer to be able to **see and edit** the flow, while the tricky logic stays in tested code. That is exactly how we use it: n8n is the **front door and the plumbing**, and the Chapter 27 helpdesk does the thinking.` },
    { type: "section", label: "The four ideas to learn" },
    { type: "list", items: [
      "**Nodes and items.** Each node receives a list of **items** (each one a small JSON object), does its job, and passes a list on. A webhook produces one item; a spreadsheet read might produce a hundred.",
      "**[[n8n expression|Expressions]].** Anywhere in a node you can write \`{{ ... }}\` to use data from earlier nodes, for example \`{{ $json.message }}\` means “the message field of the item that just arrived”.",
      "**[[credential|Credentials]].** Passwords and API keys are saved once, **encrypted** with your instance's encryption key, and nodes refer to them by name. They never appear in the workflow file.",
      "**Published workflows.** A workflow only listens (for webhooks, schedules, chat) once you **publish** it (older versions called this “activate”). Testing from the canvas uses a different, temporary test URL."
    ]},
    { type: "callout", kind: "analogy", md: `**An assembly line.** Each node is a worker at a station. Items are the trays moving along the belt. Credentials are the keys on the supervisor's keyring: workers ask for a key by name but never see the keyring. Publishing is switching the line on.` },
    { type: "section", label: "The plan for this chapter" },
    { type: "text", md: `We expose the helpdesk to the outside world as a small set of n8n workflows, each doing one thing:

| Workflow | Does |
| --- | --- |
| **Helpdesk: ask** | public webhook; validates; calls the helpdesk; if a booking needs approval, notifies staff |
| **Helpdesk: approve** | staff call this to approve or decline a waiting booking |
| **Helpdesk: errors** | runs automatically whenever another workflow fails, and alerts staff |
| **Helpdesk: native agent** | the same idea using n8n's own AI Agent node (Lesson 4) |

Staff alerts go to a small **mock channel** instead of Slack, so you can run everything without an account. In real use you replace that one HTTP node with n8n's Slack, Gmail or Teams node.` },
    { type: "section", label: "Running n8n" },
    { type: "text", md: `Two ways to start it. The first is what we used to test everything in this chapter.

\`\`\`bash
npm install n8n                        # needs Node 20 or newer
N8N_LISTEN_ADDRESS=127.0.0.1 npx n8n start      # then open http://localhost:5678
\`\`\`

The second is Docker, which is the usual way to host it for real. The compose file below follows n8n's documented image and settings, but **we could not run Docker where this course was built**, so treat it as a starting point and check n8n's hosting docs.` },
    { type: "code", file: "code-samples/ch28/docker-compose.yml", lang: "yaml", code: "@ch28/docker-compose.yml",
      note: "Not executed while writing the course (no Docker available). The npm route above was." },
    { type: "callout", kind: "warning", md: `**Back up the encryption key.** n8n encrypts saved credentials with \`N8N_ENCRYPTION_KEY\`. If you lose it, every saved credential becomes unreadable. Store it in your password manager, not only in the server.` },
    { type: "quiz", title: "Knowledge check: n8n basics", questions: [
      { kind: "match", q: "Match each n8n idea to what it means.",
        pairs: [["Item", "One small JSON object travelling between nodes"], ["Expression", "{{ $json.message }} style reference to earlier data"], ["Credential", "A named, encrypted secret that nodes use without showing it"], ["Publish", "Switch a workflow on so its webhook or schedule starts listening"]] },
      { kind: "mcq", q: "Why might a clinic prefer n8n over a hosted automation service for patient messages?",
        options: ["It is always free for any use", "It can be self-hosted, so message data need not pass through a third party", "It needs no security setup", "It cannot call APIs"],
        answer: 1,
        why: ["Hosting costs and licence limits still apply.", "Right: you control where data goes.", "You still secure it yourself.", "It has an HTTP Request node."] },
      { kind: "tf", q: "Putting the API key straight into a node's URL field is fine as long as the workflow is private.", answer: false,
        explain: " Keys belong in credentials. Otherwise they travel inside exported workflow files, screenshots and execution logs." }
    ]}
  ]},

  { title: "The ask workflow: a safe front door for the helpdesk", blocks: [
    { type: "section", label: "What n8n calls" },
    { type: "text", md: `n8n should not contain the helpdesk's logic. It calls a small **API** that wraps the Chapter 27 graph. The API has three endpoints (\`/ask\`, \`/approve\`, \`/health\`), an API-key check, and typed, length-limited input. A booking does not finish in one call: the graph **pauses** at the approval step (Chapter 15's interrupt) and the API returns \`pending_approval\` and a \`run_id\`.` },
    { type: "code", file: "code-samples/ch28/helpdesk_api.py", lang: "python", code: "@ch28/helpdesk_api.py",
      note: "Run with OFFLINE=1 for a scripted stand-in model (no key needed), or without it for your real provider. Tested by test_api.py: six tests, all passing." },
    { type: "text", md: `And the stand-in for Slack, so staff messages are visible without any account:` },
    { type: "code", file: "code-samples/ch28/staff_channel_mock.py", lang: "python", code: "@ch28/staff_channel_mock.py" },
    { type: "section", label: "The workflow, node by node" },
    { type: "stepper", svg: ASK_SVG, caption: "Helpdesk: ask. Dotted boxes are the 'something went wrong' exits.",
      steps: [
        { on: ["door"], text: "**Webhook node** with **Header Auth**: callers must send \`x-webhook-key\`, checked against a credential. A request without it gets 403 before any other node runs. The node is set to respond **later** (\"Using Respond to Webhook node\") so we control the reply." },
        { on: ["validate"], text: "**Code node + IF.** Three lines of JavaScript trim the message to 1000 characters and set \`valid\`. If it is empty we answer **400** and stop. Bad input never reaches the model." },
        { on: ["call"], text: "**HTTP Request** to our API, with the API-key credential and **one automatic retry** on network failure. Timeouts are set to 30 s." },
        { on: ["fallback"], text: "If the helpdesk is **down**, the node's *On Error* setting is \"continue (using error output)\". That sends the flow out of a second exit to a **503** reply with a friendly message (\"please call the front desk\")." },
        { on: ["branch"], text: "**IF** on \`status == pending_approval\`: does a person need to decide?" },
        { on: ["notify"], text: "Yes: tell **staff** (booking details and the \`run_id\`), then tell the patient it is pending. Staff are told the doctor and day, not the patient's identity, which the safe pipeline already stripped." },
        { on: ["answer"], text: "No: reply with the answer. Emergencies and billing questions finish here, often without any model call at all." }
      ]},
    { type: "text", md: `The workflow is plain JSON, so it lives in git like code. This is the whole file as exported (nodes, positions and connections). You can import it in the editor with **Workflows, Import from file**.` },
    { type: "code", file: "code-samples/ch28/workflows/helpdesk-ask.json", lang: "json", code: "@ch28/workflows/helpdesk-ask.json",
      note: "Generated by workflows/make_workflows.py. Imported into n8n 2.35.7 and exercised with real HTTP calls." },
    { type: "section", label: "Try it" },
    { type: "code", lang: "bash", code: `# no key: refused
curl -X POST localhost:5678/webhook/helpdesk-ask -H 'content-type: application/json' -d '{"message":"hi"}'
# with the key
H='-H x-webhook-key:n8n-secret -H content-type:application/json'
curl -X POST localhost:5678/webhook/helpdesk-ask $H -d '{"message":""}'
curl -X POST localhost:5678/webhook/helpdesk-ask $H -d '{"message":"Why is there an ECG charge on BILL-2291?"}'
curl -X POST localhost:5678/webhook/helpdesk-ask $H -d '{"message":"I am Asha Verma. Please book me with Dr Rao on Thursday."}'`,
      output: `Authorization data is wrong!                       [403]
{"error":"message is required (1 to 1000 characters)"}   [400]
{"status":"done","reply":"BILL-2291: OPD registration Rs 100, ECG Rs 350. Total Rs 450."}   [200]
{"status":"pending","message":"A staff member will confirm your booking shortly."}   [200]

staff channel received:  {"text":"Booking needs approval: Dr Rao on Thu","run_id":"0a9bdc34"}`,
      note: "Real output from n8n 2.35.7 calling the Chapter 27 helpdesk through the API, using the offline stand-in model (so the wording is scripted, not from a live LLM)." },
    { type: "callout", kind: "tip", md: `**Test URL versus production URL.** Clicking *Execute workflow* on the canvas listens on a temporary \`/webhook-test/...\` address, once. The published workflow listens on \`/webhook/...\`, always. If curl returns 404 right after you publish, wait until n8n finishes starting: it registers webhooks a few seconds after it says it is ready.` },
    { type: "quiz", title: "Knowledge check: the ask workflow", questions: [
      { kind: "order", q: "Put the normal path for a billing question in order.",
        items: ["Webhook checks the header key", "Code node validates and trims the message", "HTTP Request calls the helpdesk API", "IF finds no approval needed", "Respond sends the answer"] },
      { kind: "mcq", q: "The helpdesk API is switched off. What should the patient receive?",
        options: ["An empty response", "A 503 reply with a friendly fallback message", "A raw stack trace", "The previous patient's answer"],
        answer: 1,
        why: ["That is what a missing error exit produced when we first tested it.", "Right: a handled failure with a human next step.", "Never expose internals.", "No."] },
      { kind: "tf", q: "The n8n workflow should contain the rules that decide whether a booking is allowed.", answer: false,
        explain: " Keep decisions in tested code (the helpdesk). n8n carries messages and applies thin checks such as validation and routing." }
    ]}
  ]},

  { title: "Approval, errors and the second workflow", blocks: [
    { type: "section", label: "Why approval is a separate workflow" },
    { type: "text", md: `A booking needs a **person** to say yes. That decision might take ten seconds or ten hours, and n8n should not sit waiting with a connection open. So the work is split into two short workflows. The paused conversation lives in the helpdesk's **checkpoint** (Chapter 15), keyed by \`run_id\`, so n8n itself needs no memory. Click through the whole round trip.` },
    { type: "stepper", svg: SEQ_SVG, caption: "Two short n8n runs, with a person in between.",
      steps: [
        { on: ["s1"], text: "The patient's message arrives at **Helpdesk: ask**." },
        { on: ["s2"], text: "n8n forwards it to the helpdesk API." },
        { on: ["s3"], text: "The graph reaches the approval step and **pauses**, saving its place. The API replies \`pending_approval\` with a \`run_id\`." },
        { on: ["s4"], text: "n8n posts to **staff** (the run id travels with it) and tells the patient staff will confirm. The first workflow run **ends here**." },
        { on: ["s5"], text: "Later, a staff member decides. Their tool (a Slack button, a small form, or curl) calls **Helpdesk: approve** with the \`run_id\` and \`approved: true/false\`." },
        { on: ["s6"], text: "n8n resumes the paused graph with that decision." },
        { on: ["s7"], text: "The helpdesk books the appointment (or records the decline) and returns the result." }
      ]},
    { type: "code", file: "code-samples/ch28/workflows/helpdesk-approve.json", lang: "json", code: "@ch28/workflows/helpdesk-approve.json",
      note: "Same door pattern as the ask workflow: header key, validate, call, handle failure. Note the Respond node's status code is an expression: 404 when the helpdesk says the run is unknown." },
    { type: "callout", kind: "tip", md: `**n8n also has a Wait node** that pauses a workflow until a URL is called, which is another way to build approvals. We chose two workflows because the pause then survives restarts and long delays in the helpdesk's database, and because the same pause logic works whether staff reply from n8n, Slack or another system.` },
    { type: "section", label: "When something breaks: the error workflow" },
    { type: "text", md: `Any workflow can name an **error workflow** in its settings. When the first one fails, n8n runs the error workflow and hands it the workflow name, the failing node and the message through an **Error Trigger** node. Ours posts that to staff.` },
    { type: "code", file: "code-samples/ch28/workflows/helpdesk-errors.json", lang: "json", code: "@ch28/workflows/helpdesk-errors.json" },
    { type: "text", md: `This is not decoration. **It caught a real bug while we built the chapter.** Our first version of the "Valid?" check used the wrong data type for a true/false test, and the staff channel immediately received:` },
    { type: "code", lang: "text", code: `Workflow failed: Helpdesk: ask at node Valid?: Wrong type: '' is a string but was expecting a boolean [condition 0, item 0]`,
      note: "Real message from our own test run. Without the error workflow, the only sign would have been an empty reply to the caller." },
    { type: "text", md: `Two things to remember from that story. A workflow that fails **after** a Webhook node set to respond later can leave the caller with **an empty reply**, so handle the failures you can predict with an *error exit* (our 503), and keep the error workflow for the ones you cannot. And the error workflow should alert through a **different channel** from the one that might be down.` },
    { type: "section", label: "Check the whole thing end to end" },
    { type: "text", md: `This script calls the live webhooks and checks every behaviour above: refused without a key, 400 on bad input, answers, emergencies, the waiting booking, approval, approving twice, and declining.` },
    { type: "code", file: "code-samples/ch28/check_workflows.py", lang: "python", code: "@ch28/check_workflows.py",
      output: `PASS no key is refused
PASS empty message gets 400
PASS billing question answered
PASS emergency points to 108
PASS booking waits for staff
PASS staff were notified with a run_id
PASS approval books it
PASS approving twice is a 404
PASS bad approval body gets 400
PASS declining tells the patient to call
PASS native agent answers through its tool

ALL PASSED`,
      note: "Real run against n8n 2.35.7, the helpdesk API and the staff mock, with the offline stand-in models." },
    { type: "quiz", title: "Knowledge check: approval and errors", questions: [
      { kind: "mcq", q: "Why does staff approval use a second workflow rather than making the first one wait?",
        options: ["n8n cannot wait", "The decision may take hours; two short runs plus a saved checkpoint survive delays and restarts", "It is cheaper", "Webhooks cannot return JSON"],
        answer: 1,
        why: ["It can (the Wait node), but there are better choices here.", "Right: nothing is held open and the state is in the database.", "Not the reason.", "They can."] },
      { kind: "tf", q: "Staff approve the same run_id twice. The second call should book a second appointment.", answer: false,
        explain: " The paused run is consumed by the first decision. The second call returns 404 (\"no such waiting run\"), which our check script tests." },
      { kind: "match", q: "Match each failure to how this chapter handles it.",
        pairs: [["Helpdesk API is down", "Error exit on the HTTP node, then a 503 reply"], ["Unexpected crash in any node", "Error workflow alerts staff"], ["Caller sends no key", "Webhook header auth returns 403"], ["Empty or oversized message", "Validate node and 400 reply"]] }
    ]}
  ]},

  { title: "n8n's own AI Agent node, and running it for real", blocks: [
    { type: "section", label: "An agent without writing the loop" },
    { type: "text", md: `So far n8n carried messages to our code. n8n can also run the agent loop itself. The **AI Agent node** is the Chapter 9 loop packaged as a box: you plug in a **chat model**, one or more **tools**, and optional **memory**, and it does model, tool call, result, model, until it has an answer. Click through the parts.` },
    { type: "stepper", svg: AGENT_SVG, caption: "The Agent node and the sub-nodes plugged into it.",
      steps: [
        { on: ["in"], text: "The same safe door as before: webhook with key, then validation. The agent only ever sees a trimmed, non-empty message." },
        { on: ["agent"], text: "The **AI Agent node**. You give it the user text, a **system message** (role and rules) and a **maximum number of iterations** (Chapter 9's loop limit)." },
        { on: ["model"], text: "A **chat model** sub-node: OpenAI or Anthropic. Same workflow, different model box; we ship both versions of the file." },
        { on: ["tool"], text: "A **tool** sub-node. Ours is an **HTTP Request Tool** that calls the helpdesk API. The model fills in the \`message\` argument through an expression (\`$fromAI('message', ...)\`), n8n sends the request and feeds the result back." },
        { on: ["memory"], text: "Optional **memory** (for example a window of the last few turns per session id) for chat-style use. A one-shot webhook does not need it." },
        { on: ["out"], text: "The agent's final text goes back to the caller." }
      ]},
    { type: "code", file: "code-samples/ch28/workflows/helpdesk-agent-openai.json", lang: "json", code: "@ch28/workflows/helpdesk-agent-openai.json",
      note: "The Anthropic version (helpdesk-agent-anthropic.json) differs only in the model node: type lmChatAnthropic, model claude-haiku-5-5. We imported and published it and the node ran as far as the real API, which rejected our deliberately fake key; a live reply needs your own key." },
    { type: "section", label: "How we ran it without a key" },
    { type: "text", md: `The OpenAI credential in n8n has a **Base URL** field. We pointed it at a tiny local server that speaks the same protocol and behaves like a model that always calls its tool once and then relays the result. The agent really did call our helpdesk through n8n's tool node. The wording of the final line is scripted by the stand-in, so this tests **the plumbing**, not the model.` },
    { type: "code", file: "code-samples/ch28/fake_openai.py", lang: "python", code: "@ch28/fake_openai.py",
      note: "A test double, not a model. Delete the Base URL override and use a real key for real use." },
    { type: "callout", kind: "warning", md: `**Two things we hit, so you do not have to.** (1) The older **Tool HTTP Request** sub-node (\`toolHttpRequest\`) failed with *\"has a supplyData method but no execute method\"* when used with the current Agent node; the regular **HTTP Request** node used as a tool (\`httpRequestTool\`) works. (2) The OpenAI node defaults to the newer *Responses API*; stand-in servers and some compatible providers only implement chat completions, so set \`responsesApiEnabled\` to false for them. n8n changes quickly: build the first version on the canvas, then export it.` },
    { type: "callout", kind: "warning", md: `**A gap to know about.** In the native-agent workflow, a booking pauses inside the helpdesk but **nobody tells staff**, because the notify step lives in the ask workflow. For anything that writes, call the **ask** workflow's door (or add the same notify branch). Use the Agent node for read-only questions, and send writes through the approval path.` },
    { type: "section", label: "When to let n8n run the agent, and when not" },
    { type: "list", items: [
      "**Use the Agent node** for small, read-mostly assistants a non-programmer will maintain, where being able to *see* the flow matters more than testing every path.",
      "**Call your own agent** (our ask workflow) when you need unit tests, an evaluation set, budgets, tracing and version control, which Chapters 21, 27 and 31 cover. This is the default for anything that touches patients.",
      "**Let n8n expose tools too.** n8n has an *MCP Server Trigger* node that publishes a workflow as an MCP tool, and an *MCP Client Tool* node that lets the Agent node use other MCP servers (Chapters 16 and 17). A workflow like \"send staff a Slack message\" becomes a tool for any agent."
    ]},
    { type: "section", label: "Production checklist" },
    { type: "list", items: [
      "**Pin the version** (\`n8nio/n8n:2.35.7\`, not \`latest\`) and read release notes before upgrading: node types and settings changed between major versions.",
      "**Encryption key and backups.** Back up the key and the database (workflows, credentials, history). Export workflows to git as JSON.",
      "**Don't hoard patient data in execution history.** n8n stores each run's inputs and outputs. Turn on pruning (\`EXECUTIONS_DATA_PRUNE\`, \`EXECUTIONS_DATA_MAX_AGE\`), or save failed runs only, and pass IDs instead of names where you can.",
      "**HTTPS and a reverse proxy.** Never expose the editor; expose only the webhook paths. Bind the editor to localhost or put it behind your VPN or single sign-on.",
      "**Scale when needed.** One process handles modest load. For more, n8n has a *queue mode* with Redis and separate workers.",
      "**Test the way we did:** a script that calls the real webhooks and checks the results, run after every upgrade.",
      "**Least privilege.** One credential per purpose, each with the smallest permission it needs. The agent's tools are the only actions it can take, so keep that list short."
    ]},
    { type: "list", style: "mistakes", items: [
      "Leaving the n8n editor reachable from the internet with default settings.",
      "Forgetting to publish after import, then wondering why the webhook is a 404.",
      "No error exit on the call that can fail, so callers receive an empty reply.",
      "Giving the Agent node write tools with no approval step.",
      "Losing the encryption key, which makes every saved credential unreadable."
    ]},
    { type: "quiz", title: "Knowledge check: the Agent node", questions: [
      { kind: "match", q: "Match each Agent-node part to its job.",
        pairs: [["Chat model sub-node", "Decides what to say or which tool to call"], ["Tool sub-node", "Performs an action and returns the result"], ["System message", "Role and rules the agent must follow"], ["Max iterations", "Stops runaway loops"]] },
      { kind: "mcq", q: "Which is the better home for the booking rules: the Agent node's system message or tested helpdesk code behind the ask workflow?",
        options: ["The system message, it is easier to edit", "Tested helpdesk code, so rules are enforced and checked by tests rather than requested in a prompt", "Neither, bookings need no rules", "The staff channel"],
        answer: 1,
        why: ["Prompts are requests, not guarantees.", "Right: rules that matter live in code and get tests (Chapters 11, 33 and 27).", "They do.", "No."] },
      { kind: "tf", q: "Because n8n stores execution history, it is a safe place to keep full patient messages indefinitely.", answer: false,
        explain: " Execution data is stored inside n8n and readable by its users. Prune it, minimise what you pass, and treat the n8n database as sensitive." }
    ]}
  ]}

  ]
};
})();
