/* Chapter 41 · Extending agents: MCP, skills, hooks, permissions */
(function () {

var MAP_SVG = `
<svg viewBox="0 0 680 232" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch41-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <text class="dg-muted" x="10" y="16">I want the agent to ...</text><text class="dg-muted" x="390" y="16">Use</text>
  <g data-step="know"><text class="dg-text" x="10" y="52">know something about this project</text><path class="dg-line" d="M300 46H384" marker-end="url(#ch41-a)"/><rect class="dg-box" x="390" y="30" width="280" height="30" rx="8"/><text class="dg-title" x="530" y="50" text-anchor="middle">Instruction file or skill</text></g>
  <g data-step="reach"><text class="dg-text" x="10" y="94">reach a system outside the repository</text><path class="dg-line" d="M300 88H384" marker-end="url(#ch41-a)"/><rect class="dg-box accent" x="390" y="72" width="280" height="30" rx="8"/><text class="dg-title" x="530" y="92" text-anchor="middle">MCP server (or a CLI such as gh)</text></g>
  <g data-step="force"><text class="dg-text" x="10" y="136">never do X, or always do Y</text><path class="dg-line" d="M300 130H384" marker-end="url(#ch41-a)"/><rect class="dg-box amber" x="390" y="114" width="280" height="30" rx="8"/><text class="dg-title" x="530" y="134" text-anchor="middle">Hook or deny rule</text></g>
  <g data-step="delegate"><text class="dg-text" x="10" y="178">do a noisy job without filling my context</text><path class="dg-line" d="M300 172H384" marker-end="url(#ch41-a)"/><rect class="dg-box" x="390" y="156" width="280" height="30" rx="8"/><text class="dg-title" x="530" y="176" text-anchor="middle">Subagent (Chapter 42)</text></g>
  <g data-step="share"><text class="dg-text" x="10" y="220">share all of this with the team</text><path class="dg-line" d="M300 214H384" marker-end="url(#ch41-a)"/><rect class="dg-box" x="390" y="198" width="280" height="30" rx="8"/><text class="dg-title" x="530" y="218" text-anchor="middle">Committed .claude/ folder or a plugin</text></g>
</svg>`;

var LAYERS_SVG = `
<svg viewBox="0 0 680 212" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch41-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <rect class="dg-box" x="4" y="50" width="104" height="70" rx="10"/><text class="dg-title" x="56" y="80" text-anchor="middle">Agent's</text><text class="dg-title" x="56" y="100" text-anchor="middle">query</text>
  <path class="dg-line" d="M110 85H138" marker-end="url(#ch41-b)"/>
  <g data-step="door"><rect class="dg-box" x="140" y="20" width="136" height="130" rx="10"/><text class="dg-title" x="208" y="46" text-anchor="middle">1 · Front door</text><text class="dg-muted" x="208" y="72" text-anchor="middle">starts with SELECT</text><text class="dg-muted" x="208" y="92" text-anchor="middle">or WITH</text><text class="dg-muted" x="208" y="112" text-anchor="middle">one statement</text><text class="dg-muted" x="208" y="132" text-anchor="middle">row limit</text></g>
  <path class="dg-line" d="M278 85H298" marker-end="url(#ch41-b)"/>
  <g data-step="auth"><rect class="dg-box accent" x="300" y="20" width="136" height="130" rx="10"/><text class="dg-title" x="368" y="46" text-anchor="middle">2 · Authorizer</text><text class="dg-muted" x="368" y="72" text-anchor="middle">SQLite asks before</text><text class="dg-muted" x="368" y="92" text-anchor="middle">every action</text><text class="dg-muted" x="368" y="112" text-anchor="middle">only reads pass</text><text class="dg-muted" x="368" y="132" text-anchor="middle">masked: reads NULL</text></g>
  <path class="dg-line" d="M438 85H458" marker-end="url(#ch41-b)"/>
  <g data-step="ro"><rect class="dg-box amber" x="460" y="20" width="120" height="130" rx="10"/><text class="dg-title" x="520" y="46" text-anchor="middle">3 · Read-only</text><text class="dg-title" x="520" y="64" text-anchor="middle">file</text><text class="dg-muted" x="520" y="92" text-anchor="middle">opened mode=ro</text><text class="dg-muted" x="520" y="112" text-anchor="middle">query_only on</text></g>
  <path class="dg-line" d="M582 85H600" marker-end="url(#ch41-b)"/>
  <g data-step="db"><rect class="dg-box" x="602" y="50" width="74" height="70" rx="10"/><text class="dg-title" x="639" y="90" text-anchor="middle">clinic.db</text></g>
  <text class="dg-muted" x="10" y="184">A mistake in one layer is caught by the next. The strongest is the last: the file cannot be written at all.</text>
</svg>`;

window.COURSE.chapters.ch41 = {
  id: "ch41",
  title: "Extending agents: MCP, plugins, skills, hooks",
  oneLine: "A coding agent becomes useful, and risky, when you connect it to your database, tracker and tools. You will learn which extension mechanism to use for what, build and test a read-only database server over MCP, write a hook that blocks dangerous actions, set permission rules, and write a skill.",
  lessons: [

  { title: "Which extension for which job", blocks: [
    { type: "section", label: "Five mechanisms, five jobs" },
    { type: "text", md: `Out of the box a coding agent can read files and run commands. You extend it in a few distinct ways, and the confusion usually comes from using the wrong one. The names below are Claude Code's, which has the most complete documentation I read (5 November 2026); other tools have the same ideas under other names.` },
    { type: "diagram", svg: MAP_SVG, caption: "Start from what you want, not from the feature list." },
    { type: "list", items: [
      "**Instruction file** (Chapter 39): facts and conventions the agent should know in every session.",
      "A [[skill]] is a folder with a \`SKILL.md\` file of instructions for one kind of task. Only its **name and description** sit in the agent's context all the time; the full text is read **when the skill is used**. That makes a skill the right home for long, occasional procedures (a release checklist, how to run our evaluation) that would waste tokens in an instruction file.",
      "An [[mcp server|MCP server]] (Chapter 16) is a program that gives the agent tools to reach something outside the repository, such as a database, an issue tracker or a browser.",
      "A [[hook]] is your own script that runs at a fixed point (before a tool call, after an edit, when the agent tries to stop) and can block or change the action. Deterministic: it runs every time.",
      "**Subagent** (Chapter 42): a helper with its own context for one job.",
      "**Plugin:** a package that bundles several of these so a team can install them together. The documentation shows plugin folders holding skills and hooks, and MCP servers can come from plugins. I did not build or test a plugin; the committed \`.claude/\` folder of a project does the same job for one repository."
    ]},
    { type: "callout", kind: "tip", md: "**Often you do not need MCP.** Claude Code's costs page says command-line tools such as \`gh\`, \`aws\`, \`gcloud\` and \`sentry-cli\` are more context-efficient than an MCP server, because they add no per-tool listing; the agent just runs the command. Use MCP when there is no good command line, or when you want to **restrict** what the agent can do (our database server below allows only reading)." },
    { type: "quiz", title: "Knowledge check: choosing", questions: [
      { kind: "match", q: "Match the need to the mechanism.",
        pairs: [["The agent must never edit the migrations folder", "A hook or deny rule"], ["Teach the agent how to run our evaluation, on demand", "A skill"], ["Let the agent read rows from the clinic database", "An MCP server"], ["The test command and a trap in the code", "An instruction file"]] },
      { kind: "mcq", q: "Why put a long release checklist in a skill instead of CLAUDE.md?",
        options: ["Skills are faster", "A skill's body loads only when used, while CLAUDE.md is read on every task", "Skills cannot be wrong", "CLAUDE.md cannot hold lists"],
        answer: 1,
        why: ["Not about speed.", "Right: it keeps the always-loaded context small.", "They can be wrong like any text.", "It can hold lists."] },
      { kind: "tf", q: "A command-line tool such as gh is usually cheaper in context than an equivalent MCP server.", answer: true,
        explain: " Per the costs page: a CLI adds no per-tool listing. Prefer it when it does the job and you do not need to restrict it." }
    ]}
  ]},

  { title: "A read-only database over MCP", blocks: [
    { type: "section", label: "Why a database connection, and why it scares people" },
    { type: "text", md: `Building the helpdesk means looking at real table shapes and sample rows. Letting an agent do that through a database connection is very useful. It is also the first place where an agent can do **irreversible damage**: a wrong \`DELETE\`, or a prompt-injected instruction hidden in a text field (Chapters 33 and 34).

The rule that handles it is old and boring: **give the agent the least access that works, and let the database enforce it.** Do not rely on the tool, the prompt or the agent's good behaviour.` },
    { type: "stepper", svg: LAYERS_SVG, caption: "Our server checks a query at three layers.",
      steps: [
        { on: ["door"], text: "**Layer 1, the front door.** The server accepts only text that starts with SELECT or WITH, a single statement, and caps the rows returned (50 by default, 200 at most). This gives friendly error messages. It is **not** the real protection, because text checks can be tricked." },
        { on: ["auth"], text: "**Layer 2, SQLite's authorizer.** SQLite can call your function before every action a statement would take. Ours allows reads and refuses everything else (insert, update, delete, drop, attach, pragma). It also makes the columns \`patients.name\`, \`phone\` and \`dob\` **read as NULL**, even with \`SELECT *\`. So \`WITH x AS (SELECT 1) INSERT ...\` passes layer 1 and is stopped here." },
        { on: ["ro"], text: "**Layer 3, the file.** The database is opened with \`mode=ro\` and \`PRAGMA query_only=ON\`. Even if layers 1 and 2 had a bug, the engine would refuse to write. In PostgreSQL the equivalent is a database **role** that has only SELECT on the tables you name." },
        { on: ["db"], text: "**A time limit as well.** A progress handler stops a query after a fixed number of steps, so a runaway recursive query cannot hang the server." }
      ]},
    { type: "code", file: "code-samples/ch41/clinic_db.py", lang: "python", code: "@ch41/clinic_db.py", note: "All names, phone numbers and UHIDs are invented." },
    { type: "code", file: "code-samples/ch41/readonly_db_server.py", lang: "python", code: "@ch41/readonly_db_server.py" },
    { type: "code", lang: "bash", code: "cd code-samples/ch41\npython demo_ch41.py   # part 1",
      output: `  SELECT d.name, d.days FROM doctors d WHERE d.department = 'cardiology'   [['Dr Mehta', 'Mon,Wed'], ['Dr Rao', 'Thu,Fri']]
  SELECT uhid, name, phone FROM patients                                   [['UHID-1001', None, None], ['UHID-1002', None, None]]
  DELETE FROM doctors                                                      Only SELECT queries are allowed here (this server is read-only).
  SELECT 1; DROP TABLE doctors                                             Query refused or failed: You can only execute one statement at a time.
  WITH x AS (SELECT 1) INSERT INTO doctors VALUES (9,'x','y','z')          Query refused or failed: not authorized
  ATTACH DATABASE 'other.db' AS o                                          Only SELECT queries are allowed here (this server is read-only).
  WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i+1 FROM n) SELECT c   Query refused or failed: interrupted`,
      note: "Real output. Row 4 passes the front door and is stopped by the authorizer, which is exactly why there is more than one layer." },
    { type: "section", label: "Connecting it to the agent" },
    { type: "text", md: `Claude Code's MCP page (read 5 November 2026) documents two ways to register a server. From the command line, for a local program (the \`--\` separates Claude's options from the server command):` },
    { type: "code", lang: "bash", code: "claude mcp add --env CLINIC_DB=code-samples/ch41/clinic.db --transport stdio clinic-db \\\n  -- python code-samples/ch41/readonly_db_server.py\nclaude mcp list        # servers and their health\n# inside a session, /mcp shows status",
      note: "Command syntax as documented. I did not run it, because there is no Claude Code session here. The server itself IS tested as a real child process speaking MCP over stdin and stdout." },
    { type: "text", md: `Or write it in a **\`.mcp.json\`** file at the project root so the whole team gets it (the page lists three scopes: *local*, the default, stored in your own \`~/.claude.json\`; *project*, in \`.mcp.json\` and shared through git; and *user*, available in all your projects). \`\${VAR}\` and \`\${VAR:-default}\` are expanded from the environment, so no secret needs to appear in the file.` },
    { type: "code", file: "code-samples/ch41/mcp.example.json", lang: "json", code: "@ch41/mcp.example.json",
      note: "'tracker' is a placeholder for any remote server with a bearer token: the address is not real, and I did not test a real GitHub, Jira or browser server. The token is a reference, never a literal." },
    { type: "section", label: "PostgreSQL, and other systems" },
    { type: "text", md: `The server above is SQLite so that it runs anywhere. For PostgreSQL the principle is the same, and the strongest layer is a **role**, shown in \`postgres-readonly.sql\`: \`SELECT\` on named tables only, \`default_transaction_read_only\`, a statement timeout, a connection limit, and, best of all, a **replica or a restored copy with synthetic data** instead of the live database. I could not run PostgreSQL here, so that file is untested; have your database administrator review it.

For issue trackers, GitHub and browsers the approach is the same: find the **narrowest** credentials that allow the job (a token that can read issues but not close them, a browser profile with no saved logins), and prefer a read-only mode when the server offers one. I did not test any of those servers.` },
    { type: "quiz", title: "Knowledge check: the database server", questions: [
      { kind: "order", q: "Put the layers in the order a query meets them.", items: ["Front door: SELECT or WITH only, one statement", "SQLite authorizer: only read actions, personal columns masked", "A file opened read-only, query_only on"] },
      { kind: "mcq", q: "Which layer is the one you would trust if the others had bugs?",
        options: ["The prompt that says 'be careful'", "The front door text check", "The database or file permission that cannot write", "The tool's description"],
        answer: 2,
        why: ["A request, not a barrier.", "Text checks can be tricked.", "Right: the engine itself refuses writes. In PostgreSQL, a role with only SELECT.", "The model reads it; nothing enforces it."] },
      { kind: "tf", q: "Putting a 'read-only' note in the MCP tool's description is enough to stop writes.", answer: false,
        explain: " A description is read by the model. The server and the database must refuse writes themselves." }
    ]}
  ]},

  { title: "Hooks, permissions and skills", blocks: [
    { type: "section", label: "A hook that blocks, every time" },
    { type: "text", md: `A hook is a program that Claude Code starts at a fixed point and talks to over standard input and output. For \`PreToolUse\`, which runs **before** a tool call, the contract in the hooks documentation (read 5 November 2026) is: Claude Code writes one JSON object to the hook's input (with \`tool_name\`, \`tool_input\`, \`cwd\` and more); the hook exits **0** to allow, or exits **2** after printing a reason on standard error, which blocks the call and is passed back to the agent so it can change course. The page adds that a hook's block holds **in every permission mode**, even the one that skips approvals.

Our \`pretool_guard.py\` blocks edits to migrations, CI files, Claude's own settings and \`.env\` files, and commands such as \`rm -rf\`, force pushes, piping a download into a shell and dropping tables.` },
    { type: "code", file: "code-samples/ch41/hooks/pretool_guard.py", lang: "python", code: "@ch41/hooks/pretool_guard.py",
      note: "The documentation's example checks the path with a simple substring match. Ours resolves the path first, so src/../migrations/001.sql is caught and .env.example is allowed." },
    { type: "code", lang: "bash", code: "python demo_ch41.py   # part 2",
      output: `  Edit  {"file_path": "src/../migrations/001.sql"}             exit 2  Editing src/../migrations/001.sql is blocked: the protected fo
  Write {"file_path": ".env"}                                  exit 2  Editing .env is blocked: an environment file that holds secret
  Edit  {"file_path": ".env.example"}                          exit 0
  Bash  {"command": "rm -rf build"}                            exit 2  This command is blocked: recursive force delete (rm -rf). Ask
  Bash  {"command": "python -m pytest -q"}                     exit 0
  Bash  {"command": "python -c \\"import shutil; shutil.rmtree('build')\\""}   exit 0`,
      note: "Real output of the script, given the JSON the documentation describes. The last row is deliberate: a hook reads the TEXT of a command, so a program that deletes files from inside Python walks through. A hook is a seat belt, not a cage; for a cage use a [[sandbox]] or a throwaway machine." },
    { type: "section", label: "Permission rules" },
    { type: "text", md: `Claude Code's permissions page describes **rules** (a [[deny rule]] is one that forbids an action) such as \`Read(./.env)\`, \`Bash(git push *)\` or \`WebFetch(domain:github.com)\`, kept in \`allow\`, \`ask\` and \`deny\` lists. They are checked **deny first, then ask, then allow, and the first match wins**, so an allow rule can never carve an exception out of a deny. Two cautions from the same page: the space before a trailing \`*\` matters (\`Bash(ls *)\` is the command ls with arguments; \`Bash(ls*)\` also matches \`lsof\`), and patterns that try to constrain a Bash command's arguments are **fragile**, so for real enforcement use a sandbox or a PreToolUse hook.` },
    { type: "code", file: "code-samples/ch41/settings.example.json", lang: "json", code: "@ch41/settings.example.json",
      note: "Goes in .claude/settings.json, which the team shares through git. Allow the safe, frequent commands, ask before committing, deny reading secrets and pushing, and register the hook." },
    { type: "code", file: "code-samples/ch41/config_check.py", lang: "python", code: "@ch41/config_check.py" },
    { type: "code", lang: "bash", code: "python config_check.py mcp demo/bad-mcp.json",
      output: `WARN  tracker: http://tracker.example.com/mcp is not https; tokens and data travel in the clear.
WARN  tracker: headers.Authorization holds a literal value that looks like a secret; write \${AUTHORIZATION} and set it in your environment.
WARN  db: 'some-database-mcp' is not pinned to a version; a new release can change what runs on your machine.
WARN  db: env.DATABASE_PASSWORD holds a literal value that looks like a secret; write \${DATABASE_PASSWORD} and set it in your environment.`,
      note: "Real output on a deliberately bad file. The checker finds common mistakes; it cannot tell whether a server you did not write is trustworthy." },
    { type: "section", label: "A skill" },
    { type: "text", md: `A skill is a folder: \`.claude/skills/<name>/SKILL.md\`, with a short header (the skills page lists the fields; \`description\` matters most, because the agent uses it to decide when to load the skill) and plain instructions. Fields such as \`allowed-tools\` pre-approve exactly the commands the skill needs, and \`disable-model-invocation: true\` makes a skill that only **you** can start, which is the right setting for anything with side effects. Keep the body under 500 lines.` },
    { type: "code", file: "code-samples/ch41/skills/helpdesk-eval/SKILL.md", lang: "markdown", code: "@ch41/skills/helpdesk-eval/SKILL.md" },
    { type: "code", lang: "bash", code: "python skill_check.py skills/helpdesk-eval",
      output: "OK    no problems found.",
      note: "skill_check.py applies the rules from the skills page. The skill itself has not been loaded into a real session." },
    { type: "quiz", title: "Knowledge check: hooks and permissions", questions: [
      { kind: "mcq", q: "A hook script prints a reason to standard error and exits with code 2. What happens to a PreToolUse call?",
        options: ["It runs anyway", "It is blocked and the reason goes back to the agent", "The session ends", "Nothing; exit codes are ignored"],
        answer: 1,
        why: ["That is exit 0.", "Right: this is the documented way to block with a message.", "Only the one call is blocked.", "Exit 2 is the blocking code."] },
      { kind: "mcq", q: "Your settings allow Bash(npm run *) but also deny Bash. What happens when the agent runs npm run test?",
        options: ["It runs, because allow is more specific", "It is denied, because deny is checked first", "It asks you", "It depends on the model"],
        answer: 1,
        why: ["Specificity does not override order.", "Right: deny, then ask, then allow; first match wins.", "A deny does not ask.", "Rules are applied by the program, not the model."] },
      { kind: "tf", q: "A hook that scans the text of a command will stop a Python one-liner that deletes a folder.", answer: false,
        explain: " The hook sees only the command text. Use a sandbox when you need to contain what a program does." }
    ]}
  ]},

  { title: "Production: trusting what you plug in", blocks: [
    { type: "section", label: "Every extension runs with your rights" },
    { type: "text", md: `An MCP server you start on your laptop is a program with your files, your network and your environment variables. A hook is code that runs on every tool call. Treat each like any other dependency, with the extra problem that the agent reads their output as if it were trustworthy.` },
    { type: "list", items: [
      "**Only add servers you trust.** The MCP page says so and warns that servers which fetch external content can expose you to prompt injection (Chapter 34). A support ticket or web page returned by a tool can contain instructions; the agent must treat tool output as data.",
      "**Pin versions** of anything started with \`npx\`, \`uvx\` or similar. 'Latest' means a stranger can change what runs on your machine tomorrow. Our checker warns on this.",
      "**Project servers need approval.** The page says servers in a repository's \`.mcp.json\` need your approval in interactive sessions, and a cloned repository cannot approve its own. In non-interactive runs (\`claude -p\`, Agent SDK) they load without asking, so do not run those on code you do not trust.",
      "**No literal secrets in config.** Use \`\${VAR}\`. The page also says Claude Code reads some credential variables as empty inside a *remote* server's URL and headers, so a cloned project file cannot send your key to a server it names; to pass one deliberately, copy it into a variable with your own name.",
      "**Least privilege everywhere:** a read-only role, masked columns, a replica with synthetic data, a token that can read but not write.",
      "**Mind the output size.** The page says tool output is capped at 25,000 tokens by default (with a warning above 10,000), configurable with \`MAX_MCP_OUTPUT_TOKENS\`. A server that returns 50 rows is fine; one that returns the whole table burns your budget (Chapter 40).",
      "**Keep the number of servers small.** Tool names and server instructions sit in context; disable what you are not using (\`/mcp\`).",
      "**Review hooks and settings in pull requests.** Our diff reviewer (Chapter 39) already flags changes to \`.claude/settings\` and hooks as BLOCK, because these files hold the guard rails.",
      "**Log what the agent did.** For the database server, log queries (not results) to stderr or a file so you can answer 'what did it look at?'"
    ]},
    { type: "list", style: "mistakes", items: [
      "Connecting an agent to the live production database 'just to look'.",
      "Relying on 'the agent knows not to' instead of a role that cannot write.",
      "A token with full account access in \`.mcp.json\` committed to git.",
      "Starting a community MCP server with \`npx -y name@latest\`.",
      "Believing a hook makes the machine safe. It reads command text; a sandbox contains behaviour.",
      "Adding emphasis to CLAUDE.md for a rule that should be a hook."
    ]},
    { type: "callout", kind: "tip", md: "**What is tested here and what is not.** Tested for real: the database server (67 tests, including a real stdio child process and attacks that must be refused), the hook script against the documented JSON and exit-code contract, the config checkers. Not tested: registering anything in a live Claude Code session, PostgreSQL, a real GitHub, Jira or browser server, and plugins." },
    { type: "quiz", title: "Knowledge check: trust", questions: [
      { kind: "mcq", q: "You clone an unfamiliar repository containing a .mcp.json that starts a server. What does Claude Code's documentation say about approval?",
        options: ["It starts automatically", "In an interactive session you must approve it; the repository cannot approve itself", "It is blocked forever", "Only admins can approve"],
        answer: 1,
        why: ["Not in interactive sessions.", "Right. But note non-interactive runs load project servers without asking.", "You can approve it.", "The person at the keyboard approves."] },
      { kind: "match", q: "Match the risk to the control.",
        pairs: [["A package changes after you installed it", "Pin the exact version"], ["A token leaks through git", "Use ${VAR} and keep it in the environment"], ["The agent writes to the database", "A role or file that cannot write"], ["A tool returns text that gives orders", "Treat tool output as data, not instructions"]] },
      { kind: "tf", q: "Running claude -p on a repository you do not trust is as safe as an interactive session, because the same approvals apply.", answer: false,
        explain: " According to the MCP page, non-interactive runs cannot show the approval prompt and load project-scoped servers without asking." }
    ]}
  ]}

  ]
};
})();
