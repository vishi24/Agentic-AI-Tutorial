/* Chapter 30 · Visual agent builders */
(function () {

var SPECTRUM_SVG = `
<svg viewBox="0 0 680 250" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch30-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <path class="dg-line" d="M30 40H650" marker-end="url(#ch30-a)"/><path class="dg-line" d="M650 40H34" marker-end="url(#ch30-a)"/>
  <text class="dg-muted" x="30" y="24">more control, more work</text><text class="dg-muted" x="650" y="24" text-anchor="end">more convenience, less control</text>
  <g data-step="code"><rect class="dg-box accent" x="20" y="70" width="150" height="150" rx="12"/><text class="dg-title" x="95" y="96" text-anchor="middle">Your own code</text><text class="dg-muted" x="95" y="120" text-anchor="middle">LangGraph, CrewAI,</text><text class="dg-muted" x="95" y="136" text-anchor="middle">plain Python</text><text class="dg-muted" x="95" y="164" text-anchor="middle">tests, git, evals,</text><text class="dg-muted" x="95" y="180" text-anchor="middle">any hosting</text></g>
  <g data-step="self"><rect class="dg-box" x="195" y="70" width="150" height="150" rx="12"/><text class="dg-title" x="270" y="96" text-anchor="middle">Self-hosted builders</text><text class="dg-muted" x="270" y="120" text-anchor="middle">Langflow, n8n</text><text class="dg-muted" x="270" y="144" text-anchor="middle">boxes AND code,</text><text class="dg-muted" x="270" y="160" text-anchor="middle">you run the server,</text><text class="dg-muted" x="270" y="176" text-anchor="middle">export as JSON</text></g>
  <g data-step="hosted"><rect class="dg-box amber" x="370" y="70" width="150" height="150" rx="12"/><text class="dg-title" x="445" y="96" text-anchor="middle">Hosted no-code</text><text class="dg-muted" x="445" y="120" text-anchor="middle">Relevance AI,</text><text class="dg-muted" x="445" y="136" text-anchor="middle">Wordware, Zapier</text><text class="dg-muted" x="445" y="160" text-anchor="middle">their servers,</text><text class="dg-muted" x="445" y="176" text-anchor="middle">their limits,</text><text class="dg-muted" x="445" y="192" text-anchor="middle">fastest start</text></g>
  <g data-step="vibe"><rect class="dg-box" x="545" y="70" width="115" height="150" rx="12" style="stroke-dasharray:5 4"/><text class="dg-title" x="602" y="96" text-anchor="middle">Describe it</text><text class="dg-muted" x="602" y="120" text-anchor="middle">AI writes the</text><text class="dg-muted" x="602" y="136" text-anchor="middle">flow for you</text><text class="dg-muted" x="602" y="164" text-anchor="middle">still needs</text><text class="dg-muted" x="602" y="180" text-anchor="middle">review</text></g>
</svg>`;

var FLOW_SVG = `
<svg viewBox="0 0 680 190" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch30-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="in"><rect class="dg-box amber" x="10" y="60" width="120" height="70" rx="10"/><text class="dg-title" x="70" y="88" text-anchor="middle">Chat Input</text><text class="dg-muted" x="70" y="106" text-anchor="middle">the question</text></g>
  <g data-step="prompt"><rect class="dg-box" x="190" y="40" width="170" height="110" rx="10"/><text class="dg-title" x="275" y="66" text-anchor="middle">Prompt Template</text><text class="dg-muted" x="275" y="88" text-anchor="middle">facts + rules +</text><text class="dg-muted" x="275" y="104" text-anchor="middle">{user_input}</text><text class="dg-muted" x="275" y="128" text-anchor="middle">fills the blank</text></g>
  <g data-step="model"><rect class="dg-box accent" x="420" y="60" width="110" height="70" rx="10"/><text class="dg-title" x="475" y="88" text-anchor="middle">OpenAI</text><text class="dg-muted" x="475" y="106" text-anchor="middle">gpt-4.1-mini</text></g>
  <g data-step="out"><rect class="dg-box amber" x="570" y="60" width="100" height="70" rx="10"/><text class="dg-title" x="620" y="88" text-anchor="middle">Chat Output</text><text class="dg-muted" x="620" y="106" text-anchor="middle">the reply</text></g>
  <path class="dg-line" d="M135 95H188" marker-end="url(#ch30-b)"/><path class="dg-line" d="M360 95H418" marker-end="url(#ch30-b)"/><path class="dg-line" d="M530 95H568" marker-end="url(#ch30-b)"/>
</svg>`;

var COMP_SVG = `
<svg viewBox="0 0 680 250" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch30-c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="box"><rect class="dg-box" x="30" y="20" width="250" height="210" rx="12"/><text class="dg-title" x="155" y="46" text-anchor="middle">What you see: a box</text>
    <rect class="dg-box amber" x="50" y="64" width="210" height="34" rx="7"/><text class="dg-text" x="155" y="86" text-anchor="middle">Patient message  (field)</text>
    <rect class="dg-box" x="50" y="106" width="210" height="30" rx="7" style="stroke-dasharray:4 3"/><text class="dg-muted" x="155" y="126" text-anchor="middle">Helpdesk API URL (advanced)</text>
    <rect class="dg-box" x="50" y="142" width="210" height="30" rx="7" style="stroke-dasharray:4 3"/><text class="dg-muted" x="155" y="162" text-anchor="middle">Helpdesk API key (advanced)</text>
    <rect class="dg-box accent" x="50" y="188" width="210" height="30" rx="7"/><text class="dg-text" x="155" y="208" text-anchor="middle">Reply  (connector)</text></g>
  <g data-step="class"><rect class="dg-box" x="400" y="20" width="250" height="210" rx="12"/><text class="dg-title" x="525" y="46" text-anchor="middle">What it is: a Python class</text>
    <text class="dg-text" x="418" y="76">inputs  = [ ... ]</text><text class="dg-muted" x="418" y="94">each one becomes a field</text>
    <text class="dg-text" x="418" y="124">outputs = [ Output(</text><text class="dg-text" x="434" y="142">method="ask") ]</text><text class="dg-muted" x="418" y="160">each one becomes a connector</text>
    <text class="dg-text" x="418" y="190">def ask(self) -> Message:</text><text class="dg-muted" x="434" y="208">your code runs here</text></g>
  <g data-step="map"><path class="dg-accent-line" d="M262 80H398" marker-end="url(#ch30-c)"/><path class="dg-accent-line" d="M262 203H398" marker-end="url(#ch30-c)"/></g>
</svg>`;

window.COURSE.chapters.ch30 = {
  id: "ch30",
  title: "Visual agent builders",
  oneLine: "Drag-and-drop tools for building LLM flows and agents. You will build the helpdesk in Langflow three ways (no code, your own Python box, and an Agent with a tool), call it as an API, and learn where visual builders stop being the right tool.",
  lessons: [

  { title: "The visual-builder landscape", blocks: [
    { type: "section", label: "What problem they solve" },
    { type: "text", md: `A **visual agent builder** lets you build an LLM application by connecting boxes: an input box, a prompt box, a model box, a tool box, an output box. You can **see** the whole design, change a prompt in two clicks, and try it in a built-in chat window. For a beginner, or a clinic manager who wants to adjust wording without a developer, that is a real advantage.

There are three families, and they differ mostly in **who runs it** and **how much code you can reach**.` },
    { type: "diagram", svg: SPECTRUM_SVG, caption: "Left to right: more convenience, less control." },
    { type: "text", md: `| Family | Examples | You get | You give up |
| --- | --- | --- | --- |
| **Self-hosted builders** | [[langflow|Langflow]], n8n (Chapter 28); Flowise and Dify are in the same family | Boxes **and** code boxes, export as files, run on your server | You operate and update the server |
| **Hosted no-code platforms** | Relevance AI, Wordware (and automation tools like Zapier, Chapter 29) | Fastest start; hosting, logins, scheduling handled | Their servers, their limits, their pricing, hard to leave |
| **Describe-it builders** | Tools where an AI writes the flow from a sentence | Zero-to-first-draft in minutes | You still must read and test what it built |

The market moves quickly: products merge, rename and change pricing. Learn the **shapes** (boxes, flows, components, tools, API) and you can pick up any of them in an afternoon.` },
    { type: "callout", kind: "analogy", md: `**Furniture shops.** A flat-pack shop (hosted no-code) gets a room furnished today, but you live with its catalogue. A workshop with power tools (self-hosted builder) lets you cut your own pieces. Your own carpentry (code) can make anything, at the price of knowing carpentry. Many clinics furnish with all three.` },
    { type: "section", label: "What we will do" },
    { type: "text", md: `We use **Langflow** because you can run it for free on your own machine, it exposes every flow as an API, and it lets you put your **own Python** inside a box. We build the helpdesk three ways, using the same City Clinic facts and the Chapter 28 API:

1. **A prompt flow**: Chat Input, Prompt Template, model, Chat Output. No code at all.
2. **A flow around your own component**: one box that calls the helpdesk API.
3. **An agent flow**: an Agent box that decides when to use the helpdesk as a tool.

Then we look honestly at what hosted builders offer and where visual builders run out.` },
    { type: "quiz", title: "Knowledge check: the landscape", questions: [
      { kind: "match", q: "Match each situation to the best fit.",
        pairs: [["A manager wants to adjust the wording of replies herself", "Visual builder"], ["Patient data must stay on the clinic's own server and you want boxes plus code", "Self-hosted builder"], ["A test suite and evaluation set must run on every change", "Your own code"], ["Show a stakeholder a working demo today", "Hosted no-code or visual builder"]] },
      { kind: "mcq", q: "Which statement about visual builders is most accurate?",
        options: ["They replace the need to understand agents", "They show the design clearly, but you still need to understand prompts, tools, safety and testing", "They are always cheaper than code", "They cannot call APIs"],
        answer: 1,
        why: ["The boxes are the same ideas you learned in Parts A to C.", "Right: the concepts do not go away, they get a picture.", "Cost depends on hosting, usage and maintenance.", "Most can, and Langflow lets you add Python."] },
      { kind: "tf", q: "Since tools keep changing names and prices, learning a specific product's menus matters more than learning the underlying shapes.", answer: false,
        explain: " Menus change every release. The shapes (flow, component, tool, API, memory) carry across tools." }
    ]}
  ]},

  { title: "Langflow: boxes, flows and the playground", blocks: [
    { type: "section", label: "Install and run" },
    { type: "text", md: `[[langflow|Langflow]] is open source and runs on your machine. We used version **1.13.0** with Python 3.13.

\`\`\`bash
pip install langflow          # use a fresh virtual environment: it installs a lot
langflow run                  # then open http://127.0.0.1:7860
\`\`\`

The editor has a **canvas** (your flow), a **component list** on the left, and a **Playground** button that opens a chat window to try the flow. Every box is a **[[component]]**: it has **fields** you fill in on the left side and **connectors** on the right. You connect an output of one box to an input of another with a line. Connector shapes only fit if their data types match, which prevents many mistakes.` },
    { type: "section", label: "Flow 1: no code" },
    { type: "stepper", svg: FLOW_SVG, caption: "The simplest useful flow.",
      steps: [
        { on: ["in"], text: "**Chat Input** receives what the patient typed (in the Playground, or from an API call). Its output is a **Message**." },
        { on: ["prompt"], text: "**Prompt Template** holds your fixed text, with blanks in curly braces. Ours contains the clinic's facts and the rules, plus \`{user_input}\`. Langflow creates a connector for each blank; the patient's message flows into it." },
        { on: ["model"], text: "The **model box** (OpenAI here) sends the finished prompt to the model and returns its text. Swapping to Anthropic means replacing this box with the Anthropic one; nothing else changes." },
        { on: ["out"], text: "**Chat Output** shows the reply in the Playground and returns it to API callers." }
      ]},
    { type: "text", md: `You can build this in about two minutes on the canvas. A flow is saved as a **JSON file**, and for this course we generate the flows with a script so they are exact and reviewable. The script asks your running Langflow for its component catalogue, assembles the boxes and connections, and writes the files (and can upload them). Read it as a guide to what a flow *is*.` },
    { type: "code", file: "code-samples/ch30/build_flows.py", lang: "python", code: "@ch30/build_flows.py",
      note: "Ran against Langflow 1.13.0. The generated files are large (each box carries its own source code), which is why we also provide inspect_flow.py." },
    { type: "text", md: `Because a flow file is mostly the *code of each box* (tens of kilobytes), reading it directly is hopeless. This helper prints just the human part: boxes, the fields you set, and the connections.` },
    { type: "code", file: "code-samples/ch30/inspect_flow.py", lang: "python", code: "@ch30/inspect_flow.py",
      output: `Clinic FAQ prompt: Prompt template plus a chat model: no code.
boxes:
  - Chat Input   (5019 characters of code)
  - Prompt Template   (7187 characters of code)
      Template: Facts you may use: City Clinic. Doctors: Dr Mehta (cardiology, Mon and Wed), Dr Rao (cardi...
  - OpenAI   (8452 characters of code)
      OpenAI API Key: OPENAI_API_KEY
      Model Name: gpt-4.1-mini
      System Message: You are the City Clinic front-desk assistant.
      Temperature: 0.1
  - Chat Output   (8078 characters of code)
connections:
  Chat Input.message  ->  Prompt Template.user_input
  Prompt Template.prompt  ->  OpenAI.input_value
  OpenAI.text_output  ->  Chat Output.input_value`,
      note: "Real output of python inspect_flow.py flows/clinic-faq-prompt.json." },
    { type: "section", label: "Every flow is also an API" },
    { type: "text", md: `Once a flow works in the Playground, other programs can call it. The call needs an **API key** (create one in Langflow's settings): without it, Langflow answers 403. This is the bridge from "a thing I clicked" to "a thing the clinic's other systems can use", including the n8n and Zapier workflows from the last two chapters.` },
    { type: "code", file: "code-samples/ch30/call_flow.py", lang: "python", code: "@ch30/call_flow.py",
      output: `Which days does Dr Rao see patients?
-> [stand-in model] I received: Facts you may use: City Clinic. Doctors: Dr Mehta (cardiology, Mon and Wed), Dr Rao (cardiology, Thu and Fri), Dr Iyer (orthopaedics, Tue and Thu), Dr Khan (paediatrics, Mon, Tue and Fri). Emergency: call 108. Front desk: 1800-000-000. A pa...`,
      note: "Real call to a running Langflow 1.13.0. The model was our offline stand-in server (Chapter 28's fake_openai.py), which just echoes the start of the prompt it received. That proves the template was filled and delivered; it says nothing about how a real model would answer, so test with your own key before trusting the wording." },
    { type: "callout", kind: "warning", md: `**Safety rules we ran into.** Langflow protects you in ways that are easy to trip over, and each is worth keeping. (1) A key found in the **server's environment** will not be sent to a custom endpoint; put an explicit key in the box if you really mean it. (2) Calls to **localhost and private addresses are blocked** (SSRF protection) unless you list the host in \`LANGFLOW_SSRF_ALLOWED_HOSTS\`. We needed that to talk to a stand-in model on our own machine; never widen it on a real server without thinking about why. (3) The run API needs a **key**, as above.` },
    { type: "quiz", title: "Knowledge check: Langflow basics", questions: [
      { kind: "order", q: "Put the prompt flow's journey in order.",
        items: ["Patient's text enters Chat Input", "Prompt Template fills {user_input}", "Model box receives the finished prompt", "Model returns text", "Chat Output delivers the reply"] },
      { kind: "mcq", q: "Why are Langflow flow files so big?",
        options: ["They store every chat ever sent", "Each box stores its own source code and field definitions", "They embed the model weights", "They are compressed images"],
        answer: 1,
        why: ["Conversations are stored separately.", "Right: the code and fields of every box travel with the flow.", "Models are never inside flows.", "They are plain JSON."] },
      { kind: "tf", q: "The Prompt Template box should contain the clinic's fixed facts so the model answers from them rather than from memory.", answer: true,
        explain: " That is the simplest form of grounding (Chapter 7's RAG does the same with retrieved facts). It works only while the facts fit the prompt; larger knowledge needs retrieval." }
    ]}
  ]},

  { title: "Your own code inside a flow, and agents", blocks: [
    { type: "section", label: "A custom component" },
    { type: "text", md: `The prompt flow can only talk. To act, or to reuse the **tested** helpdesk from Chapter 28, we need our own code in a box. A Langflow component is a **Python class**. Its \`inputs\` become fields, its \`outputs\` become connectors, and each output names the method that runs. Click through the mapping.` },
    { type: "stepper", svg: COMP_SVG, caption: "A component is a box on the outside and a class on the inside.",
      steps: [
        { on: ["box"], text: "On the canvas you see a box with a field for the patient message, two *advanced* fields (URL and key) and a **Reply** connector." },
        { on: ["class"], text: "In the editor you open the box's code and see a Python class. \`inputs\` lists the fields, \`outputs\` lists the connectors, and \`method=\"ask\"` points to the function that does the work." },
        { on: ["map"], text: "Each field and connector maps one to one. Edit the code, press Save, and the box redraws itself." }
      ]},
    { type: "code", file: "code-samples/ch30/clinic_helpdesk_component.py", lang: "python", code: "@ch30/clinic_helpdesk_component.py",
      note: "Note the habits from earlier chapters: bound the input first, set a timeout, fail soft with a friendly line, and never show a stack trace to a patient." },
    { type: "callout", kind: "warning", md: `**Custom components are arbitrary code.** They run with the Langflow server's permissions, can read its environment (including keys) and are not covered by the safety rules above, because the code makes its own network calls. Only import components and flows you have read, from people you trust, exactly as you would a Python package.` },
    { type: "text", md: `Wired as *Chat Input, Clinic Helpdesk, Chat Output* this gives real, tested answers (the helpdesk's rules and emergency handling, not a model's improvisation). We called it through Langflow's API with three messages:` },
    { type: "code", lang: "text", code: `Why is there an ECG charge on BILL-2291?
-> BILL-2291: OPD registration Rs 100, ECG Rs 350. Total Rs 450.

I have chest pain
-> This sounds like an emergency. Please call 108 now, or come straight to the Emergency department: it is open 24 hours. Do not wait for a reply here.

I am Asha Verma. Please book me with Dr Rao on Thursday.
-> Thanks. A staff member will confirm your booking shortly.`,
      note: "Real output from the flow clinic-helpdesk-component running in Langflow 1.13.0 and calling the Chapter 28 helpdesk API (offline stand-in model behind it)." },
    { type: "section", label: "Letting an agent decide: Tool Mode" },
    { type: "text", md: `Switch on **Tool Mode** for a component and its connectors are replaced by one **Toolset** connector. Plug that into an **Agent** box and the agent can decide *when* to call it. The Agent box also needs a model; we connect an OpenAI box to its model socket so the provider is easy to swap.

The agent flow is: *Chat Input, Agent (model + Clinic Helpdesk as a tool), Chat Output*.` },
    { type: "code", lang: "text", code: `Why is there an ECG charge on BILL-2291?
-> BILL-2291: OPD registration Rs 100, ECG Rs 350. Total Rs 450.

I am Asha Verma. Please book me with Dr Rao on Thursday.
-> Thanks. A staff member will confirm your booking shortly.`,
      note: "Real run of the agent flow. The Agent box called our component as a tool, driven by the offline stand-in model, which always calls its first tool once and then relays the answer. So this verifies the wiring (tool schema, call, result), not a real model's judgment." },
    { type: "callout", kind: "tip", md: `**Where the rules live.** Look at what the agent's tool did on the booking: the helpdesk **refused to finish it without staff**, and the component told the patient so. The safety did not come from the agent's prompt; it came from the tested code behind the tool. That is the pattern to copy in any builder: **keep rules in code you can test, and let the flow carry messages.**` },
    { type: "quiz", title: "Knowledge check: components and agents", questions: [
      { kind: "match", q: "Match each part of a Langflow component to its meaning.",
        pairs: [["inputs list", "Fields shown on the box"], ["outputs list", "Connectors on the box"], ["Output(method=...)", "Which function runs for that connector"], ["Tool Mode", "Turns the box into a tool an Agent can call"]] },
      { kind: "mcq", q: "Why call the Chapter 28 helpdesk from a custom component instead of describing all the booking rules in the Agent's prompt?",
        options: ["Prompts cannot hold text", "Rules in tested code are enforced and testable; rules in a prompt are only requests", "Components run faster than prompts", "The Agent box cannot read prompts"],
        answer: 1,
        why: ["They can, which is the point of the trap.", "Right: Chapters 11, 33 and 27 made this the default.", "Speed is not the reason.", "It reads them fine."] },
      { kind: "tf", q: "Importing a custom component from a stranger is as safe as importing a picture, because it only draws a box.", answer: false,
        explain: " A component is Python that runs with the server's permissions. Read it first, like any code you install." }
    ]}
  ]},

  { title: "Hosted builders, limits and moving to code", blocks: [
    { type: "section", label: "Hosted no-code platforms" },
    { type: "text", md: `Platforms such as **Relevance AI** and **Wordware** run on the vendor's servers. In general terms you describe or build an agent or workflow in their editor, connect your apps, and they host, schedule and bill it. Relevance AI is built around agents and reusable *tools* in a web workspace; Wordware centres on writing AI workflows in a document-like editor. We did **not** test these here (they are accounts, not downloads), so treat this as orientation, check each product's own documentation for current features and pricing, and judge them with the same questions as below.` },
    { type: "list", items: [
      "**Where does the data go?** For patient information, a hosted platform is another processor of that data. You need an agreement and a legal check before real data touches it (Chapters 33 and 34).",
      "**Can you leave?** Can you export the whole design in a form something else can run? If not, you are renting a flow you cannot move.",
      "**Can you test it?** Is there a way to run an evaluation set and compare versions, or only a chat window?",
      "**Can you see inside?** Are prompts, tool calls and costs visible per run (Chapter 31)?",
      "**What does a run cost?** Many bill by credits or tasks; an agent that loops can use many per request."
    ]},
    { type: "section", label: "Where visual builders stop" },
    { type: "text", md: `Visual builders are excellent for **prototypes, internal tools and workflows others will edit**. They get uncomfortable when you need:

| Need | Why a canvas struggles |
| --- | --- |
| **Automated tests and evaluation** (Chapter 31) | There is no natural place for a unit test or a regression suite |
| **Code review and versions** | A flow is a big JSON blob; diffs are unreadable (hence inspect_flow.py) |
| **Complex control flow** (loops, retries, parallel branches, approval pauses) | Lines on a canvas become spaghetti; LangGraph states it as a clear graph |
| **Fine-grained safety** | Budgets, redaction and guardrails are easiest as tested code (Chapters 11, 33 and 27) |
| **Scale and cost control** | You depend on the platform's runtime and limits |
| **Anything unusual** | You end up writing custom components anyway |

None of this means "avoid them". It means choose the **right job for each tool**, as in the table from Chapter 29.` },
    { type: "section", label: "The graduation path" },
    { type: "text", md: `A common, healthy path: **prototype in a builder, then move the stable part into code.** Every box maps to something you already know.

| Builder box | In code |
| --- | --- |
| Chat Input / Chat Output | function argument and return value (or an API route) |
| Prompt Template | a template string kept in a file and versioned |
| Model box | the \`llm.py\` helper used throughout the course (OpenAI or Anthropic) |
| Tool / custom component | a plain function with a typed schema (Chapter 8) |
| Agent box | the loop from Chapter 9, or a LangGraph graph (Chapter 14) |
| Memory box | a checkpointer and a store (Chapters 10, 14 and 15) |

We already did the last step in this course: the Chapter 27 helpdesk is the "code" version, and the n8n, Zapier and Langflow flows are thin, replaceable fronts for it.` },
    { type: "section", label: "Production checklist" },
    { type: "list", items: [
      "**Run the builder like any server:** pinned version, backups, HTTPS, logins, API keys per consumer, never the editor on the open internet.",
      "**Export flows to git** and review changes by reading \`inspect_flow.py\` output, not raw JSON.",
      "**Keep secrets in variables**, not typed into boxes, and rotate them.",
      "**Test through the API**, as we did, with a script that checks real behaviours (answers, emergencies, refusals) after every change or upgrade.",
      "**Limit what tools can do** and require approval for anything that writes (Chapters 11 and 28).",
      "**Watch cost and traces:** know what each run sends to a model and what it costs.",
      "**Decide the exit** before you build: what would it take to move this to code?"
    ]},
    { type: "list", style: "mistakes", items: [
      "Believing the canvas removes the need to test.",
      "Typing API keys into prompt or component fields where they end up in exported files.",
      "Importing someone's flow with custom components without reading the code.",
      "Opening a firewall or allowlist (for example the SSRF list) to make a demo work and leaving it open.",
      "Building the whole system in a hosted builder with no way to export it."
    ]},
    { type: "quiz", title: "Knowledge check: limits and production", questions: [
      { kind: "match", q: "Match each builder box to its code equivalent.",
        pairs: [["Prompt Template", "A versioned template string"], ["Agent box", "The agent loop or a LangGraph graph"], ["Custom component", "A plain function (a tool)"], ["Chat Input and Output", "Function argument and return value, or an API route"]] },
      { kind: "mcq", q: "Which need is hardest to meet inside a purely visual builder?",
        options: ["Showing a demo to a colleague", "A regression test suite that must pass before every change", "Changing a sentence in a prompt", "Connecting to an API"],
        answer: 1,
        why: ["Builders are great at this.", "Right: tests, reviews and evaluations live naturally in code.", "Easy in a builder.", "Easy, usually a box."] },
      { kind: "tf", q: "Before putting real patient messages through a hosted no-code platform, you should know where the data is stored and what agreement covers it.", answer: true,
        explain: " The platform becomes another processor of patient data. Check the legal and privacy side first (Chapters 33 and 34)." }
    ]}
  ]}

  ]
};
})();
