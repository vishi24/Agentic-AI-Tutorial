/* Chapter 38 · AI coding tools landscape */
(function () {

var LADDER_SVG = `
<svg viewBox="0 0 680 262" xmlns="http://www.w3.org/2000/svg">
  <g data-step="auto"><rect class="dg-box" x="10" y="12" width="160" height="52" rx="10"/><text class="dg-title" x="90" y="34" text-anchor="middle">1 · Autocomplete</text><text class="dg-muted" x="90" y="52" text-anchor="middle">suggests the next line</text>
    <text class="dg-text" x="186" y="36">You write the code; the tool finishes your sentence.</text></g>
  <g data-step="chat"><rect class="dg-box" x="10" y="76" width="160" height="52" rx="10"/><text class="dg-title" x="90" y="98" text-anchor="middle">2 · Chat and edit</text><text class="dg-muted" x="90" y="116" text-anchor="middle">you paste, it answers</text>
    <text class="dg-text" x="186" y="100">You ask in a side panel and apply the answer yourself.</text></g>
  <g data-step="agent"><rect class="dg-box accent" x="10" y="140" width="160" height="52" rx="10"/><text class="dg-title" x="90" y="162" text-anchor="middle">3 · Agent in the editor</text><text class="dg-muted" x="90" y="180" text-anchor="middle">edits files, runs commands</text>
    <text class="dg-text" x="186" y="164">It reads the project, changes several files, runs the tests.</text></g>
  <g data-step="term"><rect class="dg-box amber" x="10" y="204" width="160" height="52" rx="10"/><text class="dg-title" x="90" y="226" text-anchor="middle">4 · Terminal agent</text><text class="dg-muted" x="90" y="244" text-anchor="middle">works on its own</text>
    <text class="dg-text" x="186" y="228">Same loop as Chapter 9, in your folder, often for many minutes.</text></g>
</svg>`;

var MATRIX_SVG = `
<svg viewBox="0 0 680 232" xmlns="http://www.w3.org/2000/svg">
  <text class="dg-title" x="330" y="26" text-anchor="middle">Claude Code</text>
  <text class="dg-title" x="460" y="26" text-anchor="middle">GitHub Copilot</text>
  <text class="dg-title" x="590" y="26" text-anchor="middle">Cursor</text>
  <g data-step="agents"><rect class="dg-box accent" x="6" y="40" width="664" height="38" rx="8"/><text class="dg-title" x="18" y="64">AGENTS.md</text>
    <text class="dg-title" x="330" y="64" text-anchor="middle">●</text><text class="dg-title" x="460" y="64" text-anchor="middle">(●)</text><text class="dg-title" x="590" y="64" text-anchor="middle">●</text></g>
  <g data-step="claude"><rect class="dg-box" x="6" y="88" width="664" height="38" rx="8"/><text class="dg-title" x="18" y="112">CLAUDE.md</text>
    <text class="dg-title" x="330" y="112" text-anchor="middle">●</text><text class="dg-title" x="460" y="112" text-anchor="middle">(●)</text><text class="dg-muted" x="590" y="112" text-anchor="middle">–</text></g>
  <g data-step="copilot"><rect class="dg-box" x="6" y="136" width="664" height="38" rx="8"/><text class="dg-title" x="18" y="160">.github/copilot-instructions.md</text>
    <text class="dg-muted" x="330" y="160" text-anchor="middle">–</text><text class="dg-title" x="460" y="160" text-anchor="middle">●</text><text class="dg-muted" x="590" y="160" text-anchor="middle">–</text></g>
  <g data-step="cursor"><rect class="dg-box" x="6" y="184" width="664" height="38" rx="8"/><text class="dg-title" x="18" y="208">.cursor/rules/*.mdc</text>
    <text class="dg-muted" x="330" y="208" text-anchor="middle">–</text><text class="dg-muted" x="460" y="208" text-anchor="middle">–</text><text class="dg-title" x="590" y="208" text-anchor="middle">●</text></g>
</svg>`;

window.COURSE.chapters.ch38 = {
  id: "ch38",
  title: "AI coding tools landscape",
  oneLine: "The agent loop you built in Chapter 9 now also writes software. You will learn the four stages of AI coding tools, the difference between vibe coding and agentic engineering, what Claude Code, GitHub Copilot and Cursor each document, and how one small file keeps a project usable with all of them.",
  lessons: [

  { title: "From autocomplete to agents", blocks: [
    { type: "section", label: "The same loop, pointed at code" },
    { type: "text", md: `Until now our agents answered patient questions. A **coding agent** is the same loop from Chapter 9: a model, some tools, and a loop that reads the results. The tools are different. They read files, edit files and run commands, so the thing the agent changes is **your software**.

That is why this part of the course matters to you as a developer or a technical lead: the same ideas (tools, memory, guard rails, cost, evaluation) decide whether a coding agent helps or hurts.` },
    { type: "stepper", svg: LADDER_SVG, caption: "Four stages of AI help for programmers.",
      steps: [
        { on: ["auto"], text: "**Stage 1: autocomplete.** The tool predicts your next few words or lines as you type. It never leaves the line you are on, and you accept or reject each suggestion. Low risk, small gain." },
        { on: ["chat"], text: "**Stage 2: chat and edit.** You describe a problem or paste code into a side panel and the model answers. A person copies the result into the file. The model sees only what you show it." },
        { on: ["agent"], text: "**Stage 3: an agent inside the editor.** The tool can search the project, open files, change several of them and run a command such as the tests. You review the changes as a diff before keeping them." },
        { on: ["term"], text: "**Stage 4: a terminal agent.** The same capabilities, run from the command line in your project folder, with less screen to watch. Because it can run for many minutes and be started from scripts or CI, it needs more thought about permissions (Chapters 41 and 43)." }
      ]},
    { type: "section", label: "Vibe coding and agentic engineering" },
    { type: "text", md: `The phrase [[vibe coding]] is usually credited to the researcher Andrej Karpathy in early 2025. It means describing what you want, accepting what the model produces, and **not reading the code** closely; when something breaks you paste the error back in. For a throwaway prototype or a personal tool that is a fair way to work.

For software that other people depend on, a clinic's billing screen for example, we use **agentic engineering**: the agent does the typing, but a person owns the design, sets the checks it must pass and reviews what it changed. Same tool, different habits.

| | Vibe coding | Agentic engineering |
| --- | --- | --- |
| You read the code? | rarely | the diff, always |
| How do you know it works? | you try it | tests and checks that you or the repository already have |
| Who is accountable? | whoever clicked accept | a named person, as for any other change |
| Good for | prototypes, scripts for yourself | anything with users, money or patient data |
| Failure looks like | works on the demo, breaks in use | slower start, fewer surprises |` },
    { type: "callout", kind: "warning", md: "**Never vibe-code something that touches patient data.** A prototype with invented data is fine. The moment real records, logins or payments are involved, the code needs the review and checks in Chapters 39 to 43, and your organisation's rules on where code and data may be sent." },
    { type: "quiz", title: "Knowledge check: the stages", questions: [
      { kind: "match", q: "Match each stage to what the tool can do.",
        pairs: [["Autocomplete", "Suggests the rest of the line you are typing"], ["Chat and edit", "Answers questions about code you show it"], ["Agent in the editor", "Changes several files and runs commands, shown as a diff"], ["Terminal agent", "The same loop, started from the command line or scripts"]] },
      { kind: "mcq", q: "Which habit separates agentic engineering from vibe coding?",
        options: ["Using a bigger model", "Reading the diff and requiring checks that pass before accepting", "Writing longer prompts", "Never using tests"],
        answer: 1,
        why: ["Model size is not the difference.", "Right: a person owns the result and the checks decide, not the feeling that it works.", "Prompt length alone changes little.", "Tests are exactly what the agentic habit relies on."] },
      { kind: "tf", q: "A coding agent is a different kind of technology from the agents in Chapter 9.", answer: false,
        explain: " It is the same loop (model, tools, observations). Only the tools differ: they read and change files and run commands." }
    ]}
  ]},

  { title: "The tools, from their own documentation", blocks: [
    { type: "section", label: "What I checked, and what I did not" },
    { type: "callout", kind: "warning", md: "**Read this first.** Every fact in this lesson comes from the vendors' own documentation pages, read on **5 November 2026**. I did **not** run GitHub Copilot or Cursor, and I did not compare their speed, quality or price. Products in this area change every few weeks, so use this lesson to learn the *questions to ask*, then check the current pages before you choose." },
    { type: "text", md: `Three families of tools matter for a team like ours.

**Claude Code** is a coding agent from Anthropic that runs in the terminal and is also offered in editors, on the desktop and on the web. Its documentation describes: a project instruction file called \`CLAUDE.md\`; **hooks** (your own scripts that run at fixed points and can block an action); **subagents** (helpers with their own context); **MCP** servers (Chapter 16); **permission modes** from "ask for everything" to "never ask, for isolated machines only"; **git worktrees** for parallel sessions; and a built-in \`/usage\` view of tokens and cost.

**GitHub Copilot** works inside editors and on GitHub itself. Its documentation lists several instruction files: \`.github/copilot-instructions.md\` for the whole repository, \`.github/instructions/**/*.instructions.md\` for chosen paths, a \`REVIEW.md\` for its code reviews, and it can also read agent files named \`AGENTS.md\`, \`CLAUDE.md\` and \`GEMINI.md\`. The page says plainly that **support differs by surface**: one editor's chat reads \`AGENTS.md\` only, one code-review product does not support some file types, and the command-line version supports all of them.

**Cursor** is an editor built around an agent. Its documentation describes **Project Rules** in \`.cursor/rules/\`: files with a header saying when each applies (always, when the agent judges it relevant, only for matching files, or only when you call it), plus personal and team rules and support for \`AGENTS.md\`. It advises keeping each rule short, under about 500 lines, and pointing at files instead of copying them.

Many other tools exist (and new ones appear monthly). The choice is less about brand than about four questions.` },
    { type: "list", items: [
      "**Where do you work?** In an editor all day, or in a terminal and CI? A terminal agent can run unattended; an editor agent shows changes beside your code.",
      "**What can the organisation allow?** Which vendors may receive your source code, in which country is it processed, and what does their data-processing contract say? (Chapters 34 and 37 apply to code as much as to patient messages.)",
      "**Can you enforce rules, or only ask for them?** An instruction file is a request the model may ignore. A hook or a deny rule is something the program applies every time (Chapter 41).",
      "**How easily can you leave?** Instructions in a plain, shared format and tools reached over MCP move with you. Rules written in one product's private format do not."
    ]},
    { type: "section", label: "AGENTS.md: a shared README for agents" },
    { type: "text", md: `Because every tool invented its own file, the community proposed one shared name. The project site [agents.md](https://agents.md) describes it as a simple, open format for guiding coding agents, a "README for agents": plain Markdown with no required fields, usually holding build and test commands, code style, testing instructions and security notes. Its site says it is stewarded by the **Agentic AI Foundation under the Linux Foundation** and lists many supporting tools (among them Codex, Cursor, GitHub Copilot's coding agent, Gemini CLI, Windsurf, Aider, goose, Zed and VS Code). The nearest file in the folder tree wins, and what you type in the chat overrides every file.

Claude Code's memory page says it reads \`AGENTS.md\` as project instructions when the repository has no \`CLAUDE.md\`, and that a \`CLAUDE.md\` can pull it in with a one-line import, \`@AGENTS.md\`. That gives a good habit: **write the shared rules once, in \`AGENTS.md\`**.` },
    { type: "diagram", svg: MATRIX_SVG, caption: "Who reads which file, from the documentation pages above. ● documented, (●) documented but depends on the product surface, – not listed on the pages I read (not the same as impossible)." },
    { type: "quiz", title: "Knowledge check: the tools", questions: [
      { kind: "mcq", q: "Why does this lesson not rank the tools from best to worst?",
        options: ["All tools are identical", "Quality and prices change every few weeks and I did not test them; the lasting skill is knowing which questions to ask", "Ranking tools is illegal", "Only one tool is allowed in health IT"],
        answer: 1,
        why: ["They differ in where they run and what they can enforce.", "Right: be honest about what was and was not tested.", "Nothing prevents comparison.", "Policy depends on your organisation."] },
      { kind: "match", q: "Match each file to the tool whose documentation names it.",
        pairs: [[".github/copilot-instructions.md", "GitHub Copilot"], [".cursor/rules/*.mdc", "Cursor"], ["CLAUDE.md", "Claude Code"], ["AGENTS.md", "A shared format several tools read"]] },
      { kind: "tf", q: "An instruction file guarantees the agent will follow every rule in it.", answer: false,
        explain: " It is context the model reads and usually follows. Rules that must hold every time belong in a hook or a deny rule (Chapter 41)." }
    ]}
  ]},

  { title: "Try it: see what your repository tells each tool", blocks: [
    { type: "section", label: "A script that lists the instruction files" },
    { type: "text", md: `The helpdesk team will use more than one tool, so first find out which [[instruction file|instruction files]] already exist and which tool reads which. \`agent_files.py\` looks only at file names and line counts. Its table of names is the snapshot from the lesson above, so edit it when the vendors change.` },
    { type: "code", file: "code-samples/ch38/agent_files.py", lang: "python", code: "@ch38/agent_files.py",
      note: "claude_reads() applies the rule from Claude Code's memory page: AGENTS.md is read only when there is no CLAUDE.md, unless CLAUDE.md imports it. It looks at one folder; the real rule also checks the folders above." },
    { type: "code", lang: "bash", code: "cd code-samples/ch38\npython agent_files.py ../ch39/starter",
      output: `Instruction files in .../code-samples/ch39/starter:
  .claude/rules/tests.md  (8 lines)
  AGENTS.md  (18 lines)
  CLAUDE.md  (8 lines)

Claude Code: .claude/rules/tests.md, AGENTS.md, CLAUDE.md
GitHub Copilot: AGENTS.md, CLAUDE.md
Cursor: AGENTS.md
Other tools that follow the AGENTS.md convention: AGENTS.md

Claude Code would load: CLAUDE.md, AGENTS.md, .claude/rules/tests.md`,
      note: "Real output. This is the setup Chapter 39 builds: shared rules in AGENTS.md, and a CLAUDE.md that starts with @AGENTS.md." },
    { type: "section", label: "What goes wrong when you do not share" },
    { type: "text", md: `Here is a repository where a developer added a file for each tool, copying the same rules four times. (I built this folder by hand for the test.)` },
    { type: "code", lang: "bash", code: "python agent_files.py /path/to/that/repository",
      output: `Instruction files in /tmp/claude-0/t/mix:
  .cursor/rules/style.mdc  (4 lines)
  .github/copilot-instructions.md  (1 lines)
  AGENTS.md  (2 lines)
  CLAUDE.md  (2 lines)

Claude Code: AGENTS.md, CLAUDE.md
GitHub Copilot: .github/copilot-instructions.md, AGENTS.md, CLAUDE.md
Cursor: .cursor/rules/style.mdc, AGENTS.md
Other tools that follow the AGENTS.md convention: AGENTS.md

Claude Code would load: CLAUDE.md
WARNING: Both CLAUDE.md and AGENTS.md exist and CLAUDE.md does not import AGENTS.md: two sources of truth that will drift. Put the shared rules in AGENTS.md and start CLAUDE.md with the line @AGENTS.md.`,
      note: "Real output. Claude Code would load only CLAUDE.md here, so any rule added to AGENTS.md later is silently ignored by it." },
    { type: "list", items: [
      "**One source of truth:** shared rules in \`AGENTS.md\`; tool-specific extras in each tool's own file.",
      "**Review instruction files like code.** They are committed, they steer every session, and a wrong line costs time on every task.",
      "**Personal preferences stay out of the repository.** Claude Code has \`CLAUDE.local.md\` for this; add it to \`.gitignore\`."
    ]},
    { type: "quiz", title: "Knowledge check: sharing", questions: [
      { kind: "order", q: "Put the steps in order for a repository that has both AGENTS.md and CLAUDE.md with duplicated rules.",
        items: ["Decide which rules are shared and which belong to one tool", "Move the shared rules into AGENTS.md", "Replace the duplicated text in CLAUDE.md with the line @AGENTS.md", "Run agent_files.py and confirm the warning is gone"] },
      { kind: "mcq", q: "A repository has AGENTS.md and a CLAUDE.md that does not import it. What does Claude Code load?",
        options: ["Both", "Only CLAUDE.md", "Only AGENTS.md", "Neither"],
        answer: 1,
        why: ["Not unless CLAUDE.md imports it.", "Right: per its memory page, CLAUDE.md wins and AGENTS.md is ignored.", "That happens only when there is no CLAUDE.md.", "It loads CLAUDE.md."] }
    ]}
  ]},

  { title: "Production: choosing for a health-IT team", blocks: [
    { type: "section", label: "A decision record, not a favourite" },
    { type: "text", md: `Picking a coding tool for a clinic or a government health project is a procurement and risk decision, not a taste test. Write the answers down in a short **decision record** that a reviewer can read in five minutes.` },
    { type: "list", items: [
      "**Data:** what leaves our network when the tool runs (file contents, prompts, command output)? Is it kept or used for training? What does the contract and the admin console say? Get the answer in writing.",
      "**Location:** where is it processed, and does that meet our rules for health data (Chapters 34 and 37)?",
      "**Identity and audit:** do we sign in with our company accounts? Can an admin see usage and spend, and turn features off for everyone?",
      "**Control:** which rules can the programme enforce (deny rules, hooks, managed settings), and which are only requests?",
      "**Cost:** what is the per-person budget and the plan for overruns? (Chapter 40.)",
      "**Exit:** the instruction files are plain Markdown and tools are reached over MCP, so switching tools costs days, not months.",
      "**A pilot, not a rollout:** two or three developers, one real task each, results compared by the checks of Chapter 39 rather than by opinion."
    ]},
    { type: "list", style: "mistakes", items: [
      "Letting developers install whatever they like and paste source code or logs from the live system into it.",
      "Choosing by a demo on a toy project; real repositories are larger, older and messier.",
      "Writing a separate rule file for every tool and letting them drift apart.",
      "Treating the vendor's feature list as permanent. It changed while you read this chapter.",
      "Giving a coding agent production credentials 'to save time'."
    ]},
    { type: "callout", kind: "tip", md: "**What I have not tested.** Everything about the commercial tools in this chapter comes from reading documentation. The tested code (\`agent_files.py\`, 8 tests) only checks file names and the rule quoted from Claude Code's memory page." },
    { type: "quiz", title: "Knowledge check: choosing", questions: [
      { kind: "mcq", q: "Which is the best first step in selecting a coding tool for a hospital IT team?",
        options: ["Ask which tool the most developers prefer", "Write down what data leaves the network, where it is processed and what can be enforced, then pilot with a few people", "Install all of them", "Wait for the most expensive one"],
        answer: 1,
        why: ["Preference matters but is not the risk.", "Right: data, location, control and exit come before taste.", "That multiplies the data-handling questions.", "Price is not a proxy for fit."] },
      { kind: "tf", q: "If switching tools later should stay cheap, keep project rules in plain shared Markdown and reach tools over open protocols such as MCP.", answer: true,
        explain: " Private formats and tool-specific configuration are the parts that lock you in." },
      { kind: "tf", q: "A coding agent should be given production database credentials so that it can test on real data.", answer: false,
        explain: " Give it a test or read-only copy with made-up data. Chapter 41 shows a read-only database server for exactly this reason." }
    ]}
  ]}

  ]
};
})();
