/* Chapter 17 · MCP ecosystem */
(function () {

var MULTI_SVG = `
<svg viewBox="0 0 680 250" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch17-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="agent"><rect class="dg-box accent" x="20" y="90" width="150" height="70" rx="10"/><text class="dg-title" x="95" y="118" text-anchor="middle">create_agent</text><text class="dg-muted" x="95" y="138" text-anchor="middle">one tool list</text></g>
  <g data-step="adapter"><rect class="dg-box amber" x="210" y="90" width="200" height="70" rx="10"/><text class="dg-title" x="310" y="118" text-anchor="middle">MultiServerMCPClient</text><text class="dg-muted" x="310" y="138" text-anchor="middle">MCP tools → LangChain tools</text></g>
  <g data-step="servers"><rect class="dg-box" x="450" y="20" width="210" height="56" rx="10"/><text class="dg-title" x="555" y="44" text-anchor="middle">clinic_*</text><text class="dg-muted" x="555" y="62" text-anchor="middle">schedule server (stdio)</text>
    <rect class="dg-box" x="450" y="97" width="210" height="56" rx="10"/><text class="dg-title" x="555" y="121" text-anchor="middle">appointments_db_*</text><text class="dg-muted" x="555" y="139" text-anchor="middle">read-only SQL server (stdio)</text>
    <rect class="dg-box" x="450" y="174" width="210" height="56" rx="10"/><text class="dg-title" x="555" y="198" text-anchor="middle">github_*</text><text class="dg-muted" x="555" y="216" text-anchor="middle">remote server (HTTP)</text></g>
  <path class="dg-line" d="M170 125H208" marker-end="url(#ch17-a)"/>
  <path class="dg-line" d="M410 112L448 50" marker-end="url(#ch17-a)"/><path class="dg-line" d="M410 125H448" marker-end="url(#ch17-a)"/><path class="dg-line" d="M410 138L448 200" marker-end="url(#ch17-a)"/>
</svg>`;

window.COURSE.chapters.ch17 = {
  id: "ch17",
  title: "MCP ecosystem",
  oneLine: "Thousands of ready-made MCP servers exist for files, browsers, GitHub and databases. This chapter shows how to choose them safely, build your own database server, and combine several servers in LangChain, LangGraph and CrewAI agents.",
  lessons: [

  { title: "Ready-made servers, and choosing them safely", blocks: [
    { type: "section", label: "Do not build what already exists" },
    { type: "text", md: `Most systems you will want already have an MCP server, often published by the vendor itself.

| Server | What it gives an agent | Typical use |
| --- | --- | --- |
| **Filesystem** (\`@modelcontextprotocol/server-filesystem\`) | Read, write and search files, **only** inside folders you list | Summarise reports in one folder |
| **Playwright** (\`@playwright/mcp\`, by Microsoft) | Drive a real browser: open pages, click, fill forms, read the page | Test your web app; read sites without an API |
| **GitHub** (\`github/github-mcp-server\`, by GitHub) | Issues, pull requests, code search, Actions | Triage bug reports; review PRs (Part G) |
| **Databases** (Postgres, MySQL, SQLite, BigQuery…) | Inspect schemas, run queries | Operations questions, reports |
| **SaaS tools** (Slack, Jira, Notion, Google Drive, Sentry…) | Read and act in those apps | Many vendors host a remote server you sign in to |` },
    { type: "code", file: "code-samples/ch17/ready_made_servers.json", lang: "json", code: "@ch17/ready_made_servers.json",
      note: "Claude Desktop style config. `npx` needs Node.js; the GitHub server here runs in Docker. GitHub also hosts a remote server at `https://api.githubcopilot.com/mcp/`. Check each project's README for current options." },
    { type: "callout", kind: "warning", md: `The original reference **SQLite and Postgres** servers from the MCP project were archived in 2025 and are no longer maintained. Prefer a vendor's server, a well-maintained community one, or your own small server (Lesson 2) where you control exactly what is allowed.` },

    { type: "section", label: "A checklist before installing any server" },
    { type: "text", md: `A local MCP server runs **as you**, with your files, network and tokens. Before adding one:

1. **Who publishes it?** Prefer the vendor (GitHub, Microsoft, your database company) or a project with real maintainers.
2. **Read the tool list and descriptions.** Look for anything that does more than you need, or descriptions with odd instructions (tool poisoning, Chapter 16).
3. **Narrow it.** Filesystem: one folder, not your home folder. GitHub: a fine-grained token for one repo, read-only if possible. Databases: a read-only user.
4. **Pin the version** (\`@playwright/mcp@0.0.x\`, a Docker image digest) so an update cannot silently add tools.
5. **Turn off tools you do not need.** Many servers and hosts let you enable only some tools.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Vendor-maintained servers exist for most systems: use them before building your own.",
      "A local server runs with your permissions; treat installing one like installing software.",
      "Narrow every server: one folder, one repo, read-only users, pinned versions."
    ]},
    { type: "quiz", title: "Knowledge check: choosing servers", questions: [
      { kind: "mcq", q: "You want an agent to summarise PDFs in `~/clinic-reports`. How should you configure the filesystem server?",
        options: ["Give it your whole home folder, to be safe", "Give it only `~/clinic-reports`", "Give it `/`", "No folder; it will ask"],
        answer: 1,
        why: ["More access is less safe.", "Right: least privilege.", "That is the whole computer.", "It only sees folders you list."] },
      { kind: "tf", q: "Pinning a server's version protects you from an update that silently adds a powerful new tool.", answer: true,
        explain: " You review changes when you choose to upgrade." }
    ]}
  ]},

  { title: "Your own database server", blocks: [
    { type: "section", label: "Rules in the server, not in each agent" },
    { type: "text", md: `Chapter 13's SQL agent had its safety rules inside the agent. If five different apps need the appointments data, each would have to copy those rules. Put them in an **MCP server** instead, and every host gets the same protection.` },
    { type: "code", file: "code-samples/ch17/sqlite_server.py", lang: "python", code: "@ch17/sqlite_server.py",
      output: `query("SELECT status, COUNT(*) FROM appointments GROUP BY status")
  -> {"columns": ["status", "COUNT(*)"], "rows": [["booked", 23], ["cancelled", 16], ["completed", ...]], "truncated": false}
query("DELETE FROM appointments")
  -> isError: Only a single SELECT statement is allowed.
query("SELECT COUNT(*) FROM appointments a, appointments b, appointments c, appointments d")
  -> isError: Query took longer than 2.0 s. Add WHERE filters or GROUP BY.      (after 2.0 s)`,
      note: "Real output from the in-memory test client. The last query would count 1.6 billion rows; the progress handler stopped it." },
    { type: "text", md: `New compared with Chapter 13:

- **A time limit.** \`set_progress_handler\` checks the clock while SQLite works and stops the query after 2 seconds. Without it, one bad query (here a 1.6-billion-row join) can freeze the server for every user.
- **An allowlist of tables.** \`describe_table\` refuses anything not in \`ALLOWED_TABLES\`.
- **Errors raised, not returned.** FastMCP turns an exception into a result with \`isError: true\` and the message, so the model sees what went wrong.
- **A schema resource.** A host can attach \`clinic-db://schema\` to the conversation, so the model writes correct SQL first time.

For PostgreSQL the same design applies: connect as a role with \`GRANT SELECT\` on specific views only, set \`statement_timeout\`, and never let the server build SQL by pasting strings from arguments into commands other than the single checked query.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Put data safety rules in the server so every client gets them.",
      "Read-only connection, table allowlist, single SELECT, row cap, time limit.",
      "Raise exceptions with clear messages; FastMCP returns them as errors.",
      "Offer the schema as a resource so models write better SQL."
    ]},
    { type: "quiz", title: "Knowledge check: database servers", questions: [
      { kind: "order", q: "Put these protections in order from the database outwards.",
        items: ["Read-only database connection or role", "Table allowlist", "Single-SELECT check, row cap and time limit", "Host asks the user before calling tools"] },
      { kind: "mcq", q: "Why add a time limit to queries?",
        options: ["To save tokens", "One huge query could freeze the server for everyone", "SQLite requires it", "To stop writes"],
        answer: 1,
        why: ["Tokens are not the issue.", "Right.", "It does not.", "The read-only connection stops writes."] }
    ]}
  ]},

  { title: "Several servers in one agent", blocks: [
    { type: "section", label: "MCP inside LangChain" },
    { type: "text", md: `\`langchain-mcp-adapters\` connects to any number of MCP servers and turns all their tools into LangChain tools. From there, everything from Chapters 13 to 15 works: middleware, approval, checkpointers, graphs.` },
    { type: "stepper", svg: MULTI_SVG, caption: "One agent, tools from three servers.",
      steps: [
        { on: ["servers"], text: "Each server is one entry in a dict: a command for stdio, or a URL for a remote server." },
        { on: ["adapter"], text: "\`MultiServerMCPClient\` connects, lists every server's tools and wraps them. \`tool_name_prefix=True\` adds the server name, so two servers with a tool called \`query\` do not clash." },
        { on: ["agent"], text: "The agent sees one list of tools. The model picks; the adapter sends each call to the right server." }
      ]},
    { type: "code", file: "code-samples/ch17/lc_mcp_agent.py", lang: "python", code: "@ch17/lc_mcp_agent.py",
      output: `Tools from all servers: ['clinic_get_doctor_schedule', 'clinic_request_appointment', 'appointments_db_list_tables',
                         'appointments_db_describe_table', 'appointments_db_query']
model -> [('appointments_db_query', {'sql': "SELECT COUNT(*) FROM appointments WHERE doctor='Dr Rao' AND status='no_show'"}),
          ('clinic_get_doctor_schedule', {'department': 'cardiology'})]
tool  -> { "columns": [ "COUNT(*)" ], "rows": [ [ 5 ] ], "truncated": false }
tool  -> { "department": "cardiology", "doctors": { "Dr Mehta": [ "Mon", "Wed" ], "Dr Rao": [ "Thu", "Fri" ] } }
answer-> Dr Rao had 5 no-shows (SQL: SELECT COUNT(*) FROM appointments WHERE doctor='Dr Rao' AND status='no_show').
         He works Thursday and Friday.`,
      note: "From a test run with a stand-in model. Both MCP servers ran as real subprocesses; the query result is real. Tested with langchain-mcp-adapters 0.3.2." },
    { type: "text", md: `Notice the model called **both servers in one step** (parallel tool calls, Chapter 8), and the approval rule names the prefixed tool \`clinic_request_appointment\`.` },

    { type: "section", label: "MCP inside LangGraph" },
    { type: "code", file: "code-samples/ch17/langgraph_mcp.py", lang: "python", code: "@ch17/langgraph_mcp.py",
      output: `Dr Khan works Monday, Tuesday and Friday.
Resource clinic://doctors -> { "cardiology": { "Dr Mehta": [ "Mon", "Wed" ], "Dr Rao": [ "Thu", "Fri" ] }, "orthopaedic ...`,
      note: "From a test run with a stand-in model and the real clinic server." },
    { type: "text", md: `\`get_tools()\` opens a fresh session for each tool call: simple and safe for stateless servers. For many calls in a row, or a server that keeps state between calls (a browser session in Playwright, for example), open one session with \`client.session(name)\` and load tools from it, as here.` },

    { type: "section", label: "MCP inside CrewAI" },
    { type: "text", md: `CrewAI (Chapter 24) uses MCP through \`MCPServerAdapter\` from \`crewai-tools\`. The idea is the same: connect, get tools, hand them to an agent.

\`\`\`python
from crewai import Agent
from crewai_tools import MCPServerAdapter
from mcp import StdioServerParameters

params = StdioServerParameters(command="python", args=["ch16/clinic_server.py"])
with MCPServerAdapter(params) as tools:
    scheduler = Agent(role="Clinic scheduler", goal="Answer schedule questions accurately",
                      backstory="You work at the City Clinic front desk.", tools=tools)
\`\`\`

Chapter 24 runs a full crew with this; the snippet follows CrewAI's documented API and is not run in this chapter's tests.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "`MultiServerMCPClient` merges tools from many servers into one LangChain tool list.",
      "Use `tool_name_prefix=True` to avoid name clashes.",
      "Use one long-lived session for stateful servers or many calls.",
      "The same servers work in LangChain, LangGraph, CrewAI and AI apps."
    ]},
    { type: "quiz", title: "Knowledge check: combining servers", questions: [
      { kind: "mcq", q: "Two servers both offer a tool called `query`. What prevents the model from confusing them?",
        options: ["Nothing; one is dropped", "`tool_name_prefix=True`, which renames them `server_query`", "A bigger model", "Different descriptions are enough"],
        answer: 1,
        why: ["Clashes are a real problem without a fix.", "Right.", "Model size does not rename tools.", "Identical names still clash at the tool-call level."] },
      { kind: "tf", q: "A Playwright browser session should usually use one long-lived MCP session rather than a new session per call.", answer: true,
        explain: " The browser's state (open page, logged-in session) lives in that session." }
    ]}
  ]},

  { title: "Production: remote servers, auth and operations", blocks: [
    { type: "section", label: "Local or remote?" },
    { type: "text", md: `| | stdio (local) | Streamable HTTP (remote) |
| --- | --- | --- |
| Where it runs | A subprocess on the user's machine | A web service you deploy |
| Who can use it | One user, one host | Many users and apps |
| Updates | Every user upgrades | You deploy once |
| Auth | Inherits the user's machine and tokens | Must authenticate each request (OAuth 2.1, or tokens in headers) |
| Good for | Personal tools, files on that computer | Shared company systems: schedules, tickets, databases |

For the clinic, the appointments server belongs on the **network**, behind authentication, so the database credentials never leave the server and every access is logged in one place.` },
    { type: "section", label: "Running a remote server well" },
    { type: "list", items: [
      "**Authenticate every request.** MCP's authorization spec uses OAuth 2.1; FastMCP accepts a `token_verifier` and `auth` settings. At minimum, require a bearer token over HTTPS.",
      "**Authorise per tool.** The front-desk app may call `request_appointment`; the analytics app may only `query`.",
      "**Act as the user, not as a super-account.** Pass the user's identity through, so the server enforces what *that* user may see (avoids the \"confused deputy\" problem).",
      "**Rate-limit and time-limit.** Per user and per tool, as for any API.",
      "**Log every tool call** with who, which tool, arguments (minus personal data), result size and duration. This is your audit trail.",
      "**Version your tools.** Add new tools rather than changing the meaning of old ones; agents and prompts depend on them.",
      "**Health checks and monitoring**, as for any web service (Chapters 32 and 36)."
    ]},
    { type: "callout", kind: "tip", md: `MCP also has an official **registry** of public servers and many hosts show "verified" or "official" badges. Use them to find the vendor's own server, but still apply the checklist from Lesson 1: a listing is not a security review.` },
    { type: "list", style: "mistakes", items: [
      "**One shared admin token in the server for all users.** Every user can then see everything the token can.",
      "**No timeouts on tool calls.** One slow downstream system hangs every agent using the server.",
      "**Breaking a tool's arguments in an update.** Agents built against the old schema start failing silently.",
      "**Logging raw SQL results with patient data.** Log sizes and ids, not contents."
    ]},
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "stdio for personal, local tools; Streamable HTTP for shared systems.",
      "Remote servers need authentication, per-tool authorisation and the user's identity.",
      "Rate limits, time limits, audit logs and careful versioning.",
      "Registries help you find servers; they do not replace your own review."
    ]},
    { type: "quiz", title: "Knowledge check: MCP in production", questions: [
      { kind: "match", q: "Match each requirement to the practice.",
        pairs: [["Know who looked at appointment data", "Log every tool call with the user"], ["Analytics app must not book", "Authorise per tool"], ["Database password must not reach laptops", "Run the server remotely"], ["Old agents keep working after an update", "Add tools rather than changing old ones"]] },
      { kind: "mcq", q: "What is the \"confused deputy\" problem in MCP?",
        options: ["The model gets confused by too many tools", "A server uses its own powerful account for every user, so users can reach data they should not", "Two servers share a name", "The host forgets the server"],
        answer: 1,
        why: ["That is a different problem (tool overload).", "Right: act with the user's permissions.", "That is a name clash.", "Not this."] }
    ]}
  ]}

  ]
};
})();
