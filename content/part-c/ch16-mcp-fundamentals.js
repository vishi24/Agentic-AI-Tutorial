/* Chapter 16 · MCP fundamentals */
(function () {

var NXM_SVG = `
<svg viewBox="0 0 680 250" xmlns="http://www.w3.org/2000/svg">
  <g data-step="before"><text class="dg-title" x="160" y="24" text-anchor="middle">Without MCP: every pair needs its own code</text>
    <rect class="dg-box" x="20" y="44" width="110" height="34" rx="8"/><text class="dg-text" font-size="13" x="75" y="66" text-anchor="middle">Claude Desktop</text>
    <rect class="dg-box" x="20" y="104" width="110" height="34" rx="8"/><text class="dg-text" font-size="13" x="75" y="126" text-anchor="middle">VS Code</text>
    <rect class="dg-box" x="20" y="164" width="110" height="34" rx="8"/><text class="dg-text" font-size="13" x="75" y="186" text-anchor="middle">Your agent</text>
    <rect class="dg-box" x="200" y="44" width="110" height="34" rx="8"/><text class="dg-text" font-size="13" x="255" y="66" text-anchor="middle">Clinic DB</text>
    <rect class="dg-box" x="200" y="104" width="110" height="34" rx="8"/><text class="dg-text" font-size="13" x="255" y="126" text-anchor="middle">GitHub</text>
    <rect class="dg-box" x="200" y="164" width="110" height="34" rx="8"/><text class="dg-text" font-size="13" x="255" y="186" text-anchor="middle">Files</text>
    <path class="dg-line" d="M130 61L200 61M130 61L200 121M130 61L200 181M130 121L200 61M130 121L200 121M130 121L200 181M130 181L200 61M130 181L200 121M130 181L200 181"/>
    <text class="dg-muted" x="165" y="226" text-anchor="middle">3 apps × 3 systems = 9 integrations</text></g>
  <g data-step="after"><text class="dg-title" x="510" y="24" text-anchor="middle">With MCP: each side implements it once</text>
    <rect class="dg-box" x="358" y="44" width="117" height="34" rx="8"/><text class="dg-text" font-size="13" x="416" y="66" text-anchor="middle">Claude Desktop</text>
    <rect class="dg-box" x="358" y="104" width="117" height="34" rx="8"/><text class="dg-text" font-size="13" x="416" y="126" text-anchor="middle">VS Code</text>
    <rect class="dg-box" x="358" y="164" width="117" height="34" rx="8"/><text class="dg-text" font-size="13" x="416" y="186" text-anchor="middle">Your agent</text>
    <rect class="dg-box accent" x="490" y="44" width="50" height="154" rx="8"/><text class="dg-title" x="515" y="126" text-anchor="middle">MCP</text>
    <rect class="dg-box" x="560" y="44" width="100" height="34" rx="8"/><text class="dg-text" font-size="13" x="610" y="66" text-anchor="middle">Clinic DB</text>
    <rect class="dg-box" x="560" y="104" width="100" height="34" rx="8"/><text class="dg-text" font-size="13" x="610" y="126" text-anchor="middle">GitHub</text>
    <rect class="dg-box" x="560" y="164" width="100" height="34" rx="8"/><text class="dg-text" font-size="13" x="610" y="186" text-anchor="middle">Files</text>
    <path class="dg-line" d="M475 61H490M475 121H490M475 181H490M540 61H560M540 121H560M540 181H560"/>
    <text class="dg-muted" x="515" y="226" text-anchor="middle">3 + 3 = 6, and every new app works with every server</text></g>
</svg>`;

var ARCH_SVG = `
<svg viewBox="0 0 680 262" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch16-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="host"><rect class="dg-box" x="20" y="20" width="300" height="220" rx="14"/><text class="dg-title" x="170" y="46" text-anchor="middle">Host: the AI app</text><text class="dg-muted" x="170" y="64" text-anchor="middle">Claude Desktop, VS Code, your agent</text>
    <rect class="dg-box accent" x="50" y="82" width="110" height="44" rx="8"/><text class="dg-text" x="105" y="109" text-anchor="middle">LLM</text></g>
  <g data-step="client"><rect class="dg-box amber" x="180" y="90" width="120" height="40" rx="8"/><text class="dg-text" x="240" y="115" text-anchor="middle">MCP client 1</text>
    <rect class="dg-box amber" x="180" y="170" width="120" height="40" rx="8"/><text class="dg-text" x="240" y="195" text-anchor="middle">MCP client 2</text></g>
  <g data-step="server"><rect class="dg-box" x="440" y="80" width="220" height="60" rx="10"/><text class="dg-title" x="550" y="105" text-anchor="middle">Clinic MCP server</text><text class="dg-muted" x="550" y="124" text-anchor="middle">tools · resources · prompts</text>
    <rect class="dg-box" x="440" y="160" width="220" height="60" rx="10"/><text class="dg-title" x="550" y="185" text-anchor="middle">GitHub MCP server</text><text class="dg-muted" x="550" y="204" text-anchor="middle">remote, over HTTP</text></g>
  <g data-step="wire"><path class="dg-accent-line" d="M300 110H438" marker-end="url(#ch16-a)"/><text class="dg-muted" x="370" y="102" text-anchor="middle">stdio</text>
    <path class="dg-accent-line" d="M300 190H438" marker-end="url(#ch16-a)"/><text class="dg-muted" x="370" y="182" text-anchor="middle">Streamable HTTP</text>
    <text class="dg-muted" x="380" y="252" text-anchor="middle">JSON-RPC messages</text></g>
  <path class="dg-line" d="M160 104H178"/><path class="dg-line" d="M150 126L180 186"/>
</svg>`;

window.COURSE.chapters.ch16 = {
  id: "ch16",
  title: "MCP fundamentals",
  oneLine: "The Model Context Protocol is a standard plug between AI apps and the systems they use. Write a tool once as an MCP server and Claude Desktop, VS Code, coding agents and your own agents can all use it.",
  lessons: [

  { title: "What MCP is and why it exists", blocks: [
    { type: "section", label: "The integration problem" },
    { type: "text", md: `Your clinic tools from Chapter 9 work in your agent. Now the operations team wants them in Claude Desktop, developers want them in VS Code, and another team's LangGraph agent needs them too. Without a standard, each app needs its own integration code.

[[mcp|MCP]] (Model Context Protocol) is an **open standard**, started by Anthropic in 2024 and now supported by OpenAI, Google, Microsoft and most AI tools. It defines one way for an AI app to discover and use outside tools and data.` },
    { type: "stepper", svg: NXM_SVG, caption: "MCP turns many custom integrations into one standard plug.",
      steps: [
        { on: ["before"], text: "**Without a standard**, every AI app writes its own connector for every system: apps × systems integrations, each maintained separately." },
        { on: ["after"], text: "**With MCP**, each system is wrapped once as an MCP **server**, and each app implements MCP once as a **client**. Any app works with any server." }
      ]},
    { type: "callout", kind: "analogy", md: `MCP is to AI apps what USB is to computers. Before USB, every printer and mouse needed its own port and driver. Now any USB device works with any computer. An MCP server is the device; the AI app is the computer.` },

    { type: "section", label: "Host, client, server" },
    { type: "stepper", svg: ARCH_SVG, caption: "The three roles in MCP.",
      steps: [
        { on: ["host"], text: "The **[[mcp host|host]]** is the AI application the user works in. It contains the LLM and decides what to show and what to allow." },
        { on: ["client"], text: "Inside the host, one **[[mcp client|client]]** per server keeps a connection open, discovers what the server offers and forwards requests." },
        { on: ["server"], text: "An **[[mcp server|MCP server]]** is a small program that wraps one system (your clinic schedule, GitHub, a database) and offers its tools, resources and prompts." },
        { on: ["wire"], text: "They talk in **[[json-rpc|JSON-RPC]]** messages, over **stdio** (the host starts the server as a local process) or **Streamable HTTP** (the server runs anywhere on the network)." }
      ]},
    { type: "text", md: `A server can offer three kinds of things:

| Primitive | Who decides to use it | Clinic example |
| --- | --- | --- |
| **Tools** | The **model** chooses to call them | \`get_doctor_schedule\`, \`request_appointment\` |
| **Resources** | The **app or user** chooses to attach them as context | \`clinic://doctors\`, \`clinic://policies/opd\` |
| **Prompts** | The **user** picks them, like templates or slash commands | "Triage a patient message" |

Servers can also ask things of the client: **sampling** (ask the host's model to write something), **elicitation** (ask the user a question) and **roots** (which folders it may use). You will rarely need these at first.` },

    { type: "section", label: "What actually goes over the wire" },
    { type: "trace", title: "One session, simplified", items: [
      { who: "user", label: "client → server", code: `{"jsonrpc": "2.0", "id": 1, "method": "initialize",
 "params": {"protocolVersion": "2025-11-25", "capabilities": {}, "clientInfo": {"name": "my-agent"}}}` },
      { who: "tool", label: "server → client", code: `{"jsonrpc": "2.0", "id": 1, "result": {"protocolVersion": "2025-11-25",
 "capabilities": {"tools": {}, "resources": {}, "prompts": {}}, "serverInfo": {"name": "City Clinic"}}}` },
      { who: "user", label: "client → server", code: `{"jsonrpc": "2.0", "id": 2, "method": "tools/list"}` },
      { who: "tool", label: "server → client", code: `{"jsonrpc": "2.0", "id": 2, "result": {"tools": [{"name": "get_doctor_schedule",
 "description": "Look up which doctors…", "inputSchema": {"type": "object", "properties": {"department": …}},
 "annotations": {"readOnlyHint": true}}, …]}}` },
      { who: "user", label: "client → server", code: `{"jsonrpc": "2.0", "id": 3, "method": "tools/call",
 "params": {"name": "get_doctor_schedule", "arguments": {"department": "cardiology"}}}` },
      { who: "tool", label: "server → client", code: `{"jsonrpc": "2.0", "id": 3, "result": {"content": [{"type": "text",
 "text": "{\\"department\\": \\"cardiology\\", \\"doctors\\": {…}}"}], "isError": false}}` }
    ]},
    { type: "text", md: `Notice that \`inputSchema\` is plain JSON Schema: the same thing you put in OpenAI's \`parameters\` or Anthropic's \`input_schema\` in Chapter 8. MCP does not replace function calling; it standardises **where the tools come from**. The model still asks, and code (now the MCP server) still runs the tool.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "MCP is an open standard plug between AI apps (hosts) and systems (servers).",
      "Write a tool once as a server; every MCP-capable app can use it.",
      "Servers offer tools (model-chosen), resources (app-chosen) and prompts (user-chosen).",
      "Messages are JSON-RPC over stdio (local) or Streamable HTTP (remote)."
    ]},
    { type: "quiz", title: "Knowledge check: MCP basics", questions: [
      { kind: "match", q: "Match each MCP role or primitive to its description.",
        pairs: [["Host", "The AI app the user works in"], ["Server", "Wraps one system and offers its capabilities"], ["Tool", "An action the model decides to call"], ["Resource", "Data the app or user attaches as context"]] },
      { kind: "mcq", q: "With MCP, who actually runs `get_doctor_schedule`?",
        options: ["The LLM", "The MCP server, when the client sends tools/call", "Anthropic's servers", "The user's browser"],
        answer: 1,
        why: ["Models never run code; they ask.", "Right.", "Only if Anthropic hosted your server, which it does not.", "Not unless the server ran there."] },
      { kind: "tf", q: "MCP replaces function calling in the OpenAI and Anthropic APIs.", answer: false,
        explain: " It standardises where tools come from. The model still uses normal function calling." }
    ]}
  ]},

  { title: "Build an MCP server", blocks: [
    { type: "section", label: "The clinic server" },
    { type: "text", md: `The official Python SDK (\`pip install mcp\`) includes **FastMCP**, which works like FastAPI: decorate a function and it becomes a tool, a resource or a prompt. Type hints and \`Field\` descriptions become the JSON Schema; the docstring becomes the description.` },
    { type: "code", file: "code-samples/ch16/clinic_server.py", lang: "python", code: "@ch16/clinic_server.py",
      note: "Tested with mcp 1.30.0 (the `mcp` package includes `mcp.server.fastmcp`). A separate `fastmcp` package also exists; it has more features but is a different project." },
    { type: "text", md: `Line by line, the parts that matter:

1. **Logging goes to stderr.** With stdio, stdout carries the JSON-RPC messages. A stray \`print()\` corrupts the protocol and the host disconnects. This is the most common beginner bug.
2. **Tool annotations** tell the host about a tool: \`readOnlyHint=True\` means it only reads. Hosts use these to decide when to ask the user for permission.
3. **Resource templates** like \`clinic://policies/{name}\` cover many documents with one function. The path check stops a request like \`../../secrets\` from reading files outside the folder.
4. **No patient names in logs.** Log what you need to debug (doctor, day), not personal details.
5. **\`mcp.run(transport=...)\`** chooses stdio (default) or Streamable HTTP.` },

    { type: "section", label: "Test it without any AI" },
    { type: "code", file: "code-samples/ch16/test_server.py", lang: "python", code: "@ch16/test_server.py",
      output: `tool     get_doctor_schedule  read-only=True
         input schema: {"department": {"description": "Department name, e.g. cardiology", "title": "Department", "type": "string"}}
tool     request_appointment  read-only=False
         input schema: {"doctor": {...}, "day": {...}, "patient_name": {"description": "The patient's full name", "minLength": 2, ...}}
call     -> {"department": "cardiology", "doctors": {"Dr Mehta": ["Mon", "Wed"], "Dr Rao": ["Thu", "Fri"]}}
call     -> {"error": "Dr Rao does not see patients on Mon.", "available_days": ["Thu", "Fri"]}
invalid  -> isError = True | Error executing tool request_appointment: 1 validation error for request_appointmentArgume
resource  ['clinic://doctors'] ['clinic://policies/{name}']
read     -> # OPD guide
prompt   -> Classify this City Clinic patient message as schedule, billing, emerge ...`,
      note: "Real output. `create_connected_server_and_client_session` connects a client to the server in memory, so tests are fast and need no subprocess." },
    { type: "text", md: `Two kinds of failure, handled differently:

- A **business error** ("Dr Rao does not see patients on Mon") is a normal result with useful details, so the model can recover (Chapter 8).
- An **invalid call** (missing \`patient_name\`) is rejected by the schema with \`isError = True\`, before your function runs.` },
    { type: "section", label: "The MCP Inspector" },
    { type: "text", md: `The **MCP Inspector** is a web page for poking at any server by hand: list tools, call them with your own arguments, read resources. It needs Node.js:

\`\`\`bash
npx @modelcontextprotocol/inspector python clinic_server.py
\`\`\`

Use it whenever a host "can't see" your tools: if the Inspector can, the problem is in the host's configuration; if it cannot, the problem is in your server.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "FastMCP turns decorated functions into tools, resources and prompts.",
      "Never print to stdout in a stdio server; log to stderr.",
      "Mark read-only tools with annotations; validate resource paths.",
      "Test servers in memory, and by hand with the MCP Inspector."
    ]},
    { type: "quiz", title: "Knowledge check: building servers", questions: [
      { kind: "mcq", q: "Your stdio server works in tests, but Claude Desktop disconnects as soon as a tool is called. What is the most likely cause?",
        options: ["The tool is too slow", "A print() statement writes to stdout and corrupts the JSON-RPC stream", "Wrong model name", "Resources are missing"],
        answer: 1,
        why: ["Slowness causes timeouts, not instant disconnects.", "Right: log to stderr instead.", "The server has no model.", "Resources are optional."] },
      { kind: "tf", q: "In the clinic server, the Pydantic `min_length=2` on patient_name is checked before `request_appointment` runs.", answer: true,
        explain: " The arguments are validated against the schema first; the call returns isError=True if they fail." }
    ]}
  ]},

  { title: "Use MCP from your own agent", blocks: [
    { type: "section", label: "A client, by hand" },
    { type: "text", md: `Hosts like Claude Desktop contain an MCP client. Your own agent needs one too. Four steps: start or connect to the server, **initialize** (agree on protocol version and capabilities), **discover** (list tools), **use** (call tools).` },
    { type: "code", file: "code-samples/ch16/client_stdio.py", lang: "python", code: "@ch16/client_stdio.py",
      output: `Connected to: City Clinic | protocol 2025-11-25
Server offers: ['prompts', 'resources', 'tools']
Tools: ['get_doctor_schedule', 'request_appointment']
Result: {'department': 'orthopaedics', 'doctors': {'Dr Iyer': ['Tue', 'Thu']}}`,
      note: "Real output: the client started the server as a subprocess and talked to it over stdio." },

    { type: "section", label: "An agent with MCP tools" },
    { type: "text", md: `Now join this to the Chapter 9 agent loop. The agent **has no tool code of its own**: it lists the server's tools, converts each to the provider's format (one small function, because \`inputSchema\` is already JSON Schema), and sends each tool call to the server.` },
    { type: "code", file: "mcp_agent.py", lang: "python",
      variants: { openai: "@ch16/mcp_agent_openai.py", anthropic: "@ch16/mcp_agent_anthropic.py" },
      output: `  get_doctor_schedule({'department': 'cardiology'}) -> { "department": "cardiology", "doctors": { "Dr Mehta": [ "Mon", "Wed" ], ...
Allow request_appointment({'doctor': 'Dr Rao', 'day': 'Thu', 'patient_name': 'Asha Verma'})? [y/N] y
  request_appointment({'doctor': 'Dr Rao', 'day': 'Thu', 'patient_name': 'Asha Verma'}) -> { "request_id": "REQ-001", ...
Done. I've requested Dr Rao on Thursday for Asha Verma; staff will confirm.`,
      note: "From a test run with the real MCP server and the real openai 3.43 / anthropic 2.4 SDKs, with recorded model responses. Answering `n` returns \"A staff member declined this action\" to the model instead." },
    { type: "text", md: `What changed compared with Chapter 9, and what did not:

| | Chapter 9 | With MCP |
| --- | --- | --- |
| Tool code | In the agent (\`clinic.py\`) | In the server, maintained by the clinic team |
| Tool list | Hard-coded | Discovered at start-up with \`tools/list\` |
| Running a tool | \`run_tool(name, args)\` | \`session.call_tool(name, args)\` |
| Approval rule | By tool name | By the \`readOnlyHint\` annotation, with unknown tools treated as writes |
| The loop itself | Same | Same |

The clinic team can now add a tool to the server, and **every** agent and app using it gets it, with no change to their code. That is also a risk: see the next lesson.` },
    { type: "callout", kind: "tip", md: `In LangChain and LangGraph you do not need to write the conversion: \`langchain-mcp-adapters\` turns MCP tools into LangChain tools in one line. Chapter 17 uses it.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "A client starts or connects, initializes, lists tools and calls them.",
      "MCP tools convert to OpenAI or Anthropic format with one small function.",
      "The agent loop is unchanged; only where tools live has moved.",
      "Use annotations for approval, and treat tools without them as writes."
    ]},
    { type: "quiz", title: "Knowledge check: MCP clients", questions: [
      { kind: "order", q: "Put the client's steps in order.",
        items: ["Start or connect to the server", "initialize: agree version and capabilities", "tools/list: discover what is offered", "tools/call: run a tool the model asked for"] },
      { kind: "mcq", q: "Why does the agent ask for approval when a tool has no annotations?",
        options: ["MCP requires it", "Without a read-only promise, it is safest to assume the tool can change things", "To save tokens", "Annotations are mandatory"],
        answer: 1,
        why: ["The protocol leaves this to the host.", "Right: default to caution.", "Unrelated.", "They are optional."] }
    ]}
  ]},

  { title: "Production: connecting apps, and MCP security", blocks: [
    { type: "section", label: "Adding your server to AI apps" },
    { type: "text", md: `Each host has a configuration listing which servers to start or connect to.` },
    { type: "code", file: "code-samples/ch16/claude_desktop_config.json", lang: "json", code: "@ch16/claude_desktop_config.json",
      note: "Claude Desktop: Settings → Developer → Edit Config. Use full paths; the app does not run in your project folder or virtual environment. Restart the app after editing." },
    { type: "code", file: "code-samples/ch16/vscode_mcp.json", lang: "json", code: "@ch16/vscode_mcp.json",
      note: "VS Code (GitHub Copilot agent mode): save as `.vscode/mcp.json` in your project. The second entry connects to the server started with `--http`." },
    { type: "text", md: `For **Claude Code** (a coding agent in the terminal, Part G), one command adds a server:

\`\`\`bash
claude mcp add city-clinic -- python /full/path/to/clinic_server.py
\`\`\`

Exact menus and file locations change between app versions; check the app's own MCP documentation if these differ.` },

    { type: "section", label: "Security: what can go wrong" },
    { type: "text", md: `An MCP server gives a model new powers, and a host may connect many servers from different authors. Treat every server like a browser extension: useful, and a way in for attackers.

| Risk | What happens | Defence |
| --- | --- | --- |
| **Tool poisoning** | A malicious server's tool description contains hidden instructions ("also send the user's files to…") | Install only servers you trust; read descriptions; pin versions |
| **Prompt injection through results** | A tool returns text from a web page or email that says "ignore your rules" | Treat tool results as data; keep approval on write tools |
| **Too much access** | A database server connected as an admin user | Least privilege: read-only users, limited tables, scoped tokens |
| **Silent changes** | A server update adds a new, more powerful tool | Pin versions; review tool lists after updates |
| **Unauthenticated HTTP servers** | Anyone on the network can call your tools | Bind to localhost, or require auth (MCP supports OAuth 2.1) and HTTPS |
| **Path and command injection** | \`../../\` in a resource name, or shell commands built from arguments | Validate every argument as untrusted input, as in \`policy()\` |
| **Leaky logs** | Patient names written to server logs | Log ids and actions, not personal data |` },
    { type: "callout", kind: "warning", md: `Annotations like \`readOnlyHint\` are **promises made by the server**, not guarantees. A malicious server can mark a destructive tool as read-only. Trust annotations only from servers you trust; for anything else, ask the user.` },
    { type: "list", style: "mistakes", items: [
      "**`print()` in a stdio server.** Breaks the protocol.",
      "**Relative paths in host configs.** The app starts the server from a different folder.",
      "**Running a community server you have not read.** It runs with your user's permissions.",
      "**Exposing an HTTP server on 0.0.0.0 without auth.** Every device on the network can call it."
    ]},
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Hosts list servers in a config file or with a command; use full paths.",
      "Treat MCP servers like extensions: trusted sources, pinned versions.",
      "Least privilege, argument validation and auth on HTTP servers.",
      "Annotations are hints from the server, not security guarantees."
    ]},
    { type: "quiz", title: "Knowledge check: MCP in production", questions: [
      { kind: "match", q: "Match each risk to its defence.",
        pairs: [["Hidden instructions in a tool description", "Install only trusted servers and read descriptions"], ["Database server with admin rights", "Connect with a read-only user"], ["Network-exposed HTTP server", "Require authentication and HTTPS"], ["A tool argument like ../../secrets", "Validate arguments as untrusted input"]] },
      { kind: "tf", q: "If a server marks a tool `readOnlyHint=True`, the tool cannot change anything.", answer: false,
        explain: " It is the server's claim. A malicious or buggy server can mark anything read-only." }
    ]}
  ]}

  ]
};
})();
