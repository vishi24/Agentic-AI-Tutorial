/* Chapter 42 · Your agentic development team */
(function () {

var PIPE_SVG = `
<svg viewBox="0 0 680 168" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch42-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="plan"><rect class="dg-box" x="6" y="20" width="118" height="62" rx="10"/><text class="dg-title" x="65" y="48" text-anchor="middle">Planner</text><text class="dg-muted" x="65" y="68" text-anchor="middle">reads only</text></g>
  <g data-step="code"><rect class="dg-box accent" x="142" y="20" width="118" height="62" rx="10"/><text class="dg-title" x="201" y="48" text-anchor="middle">Coder</text><text class="dg-muted" x="201" y="68" text-anchor="middle">own worktree</text></g>
  <g data-step="test"><rect class="dg-box" x="278" y="20" width="118" height="62" rx="10"/><text class="dg-title" x="337" y="48" text-anchor="middle">Tester</text><text class="dg-muted" x="337" y="68" text-anchor="middle">runs the checks</text></g>
  <g data-step="review"><rect class="dg-box" x="414" y="20" width="118" height="62" rx="10"/><text class="dg-title" x="473" y="48" text-anchor="middle">Reviewer</text><text class="dg-muted" x="473" y="68" text-anchor="middle">reads only</text></g>
  <g data-step="human"><rect class="dg-box amber" x="550" y="20" width="124" height="62" rx="10"/><text class="dg-title" x="612" y="48" text-anchor="middle">You</text><text class="dg-muted" x="612" y="68" text-anchor="middle">approve the merge</text></g>
  <path class="dg-line" d="M126 51H140" marker-end="url(#ch42-a)"/><path class="dg-line" d="M262 51H276" marker-end="url(#ch42-a)"/><path class="dg-line" d="M398 51H412" marker-end="url(#ch42-a)"/><path class="dg-line" d="M534 51H548" marker-end="url(#ch42-a)"/>
  <text class="dg-muted" x="133" y="108" text-anchor="middle">plan + files</text><text class="dg-muted" x="269" y="108" text-anchor="middle">diff + note</text><text class="dg-muted" x="405" y="108" text-anchor="middle">evidence</text><text class="dg-muted" x="541" y="108" text-anchor="middle">verdict</text>
  <text class="dg-muted" x="10" y="150">Each arrow is a handoff note (Lesson 4). Each worker starts with a fresh context and sees only that note.</text>
</svg>`;

var WT_SVG = `
<svg viewBox="0 0 680 206" xmlns="http://www.w3.org/2000/svg">
  <rect class="dg-box amber" x="210" y="8" width="260" height="44" rx="10"/><text class="dg-title" x="340" y="30" text-anchor="middle">.git: one shared history</text><text class="dg-muted" x="340" y="46" text-anchor="middle">commits, branches, remote</text>
  <path class="dg-line" d="M270 54L110 110M340 54V110M410 54L570 110" fill="none"/>
  <g data-step="main"><rect class="dg-box" x="6" y="112" width="206" height="78" rx="10"/><text class="dg-title" x="109" y="138" text-anchor="middle">Main checkout</text><text class="dg-muted" x="109" y="158" text-anchor="middle">branch main</text><text class="dg-muted" x="109" y="176" text-anchor="middle">you merge here</text></g>
  <g data-step="a"><rect class="dg-box accent" x="237" y="112" width="206" height="78" rx="10"/><text class="dg-title" x="340" y="138" text-anchor="middle">Worktree: after-hours</text><text class="dg-muted" x="340" y="158" text-anchor="middle">own folder, own files</text><text class="dg-muted" x="340" y="176" text-anchor="middle">branch worktree-after-hours</text></g>
  <g data-step="b"><rect class="dg-box accent" x="468" y="112" width="206" height="78" rx="10"/><text class="dg-title" x="571" y="138" text-anchor="middle">Worktree: rupees</text><text class="dg-muted" x="571" y="158" text-anchor="middle">own folder, own files</text><text class="dg-muted" x="571" y="176" text-anchor="middle">branch worktree-rupees</text></g>
</svg>`;

window.COURSE.chapters.ch42 = {
  id: "ch42",
  title: "Your agentic development team",
  oneLine: "Give each job to a separate helper with its own context and its own limits: plan, code, test, review. You will define the helpers as files, run two of them in parallel in real git worktrees, stop them colliding by declaring who owns which files, and pass work between them with notes a program can check.",
  lessons: [

  { title: "Why a team, and when not to", blocks: [
    { type: "section", label: "Roles, not more intelligence" },
    { type: "text", md: `A single coding agent can plan, write, test and review. The reason to split those jobs is not that four agents are smarter than one. It is that **separation gives you things one conversation cannot**:

- **An independent reviewer.** Whoever wrote the code is the worst person to review it, because the reasoning that produced a mistake also makes the mistake look right. Claude Code's best-practices page (read 5 November 2026) notes that a fresh reviewer helps *because it has not seen your reasoning*, and that merely handing the same task to a subagent does not make the answer better.
- **Limited power.** A planner and a reviewer need to read, not write. If they cannot edit files, they cannot "fix" the thing they were meant to judge, and an error in their instructions cannot damage the code.
- **A clean context.** Each helper has its own context window and only a summary comes back (sub-agents page), so a long test log or a big exploration does not fill the conversation you are working in.
- **Cheaper work where the job is simple.** Running the checks does not need your most capable model.

This is the multi-agent idea of Chapters 21 and 22, applied to software work.` },
    { type: "stepper", svg: PIPE_SVG, caption: "A small team for one feature. The arrows are handoffs.",
      steps: [
        { on: ["plan"], text: "**Planner.** Reads the code and writes a short plan, including the list of files the work may touch. It has no editing tools, so it can only plan." },
        { on: ["code"], text: "**Coder.** Implements one planned task in its own **git worktree** (Lesson 3), with a failing test first, touching only the planned files." },
        { on: ["test"], text: "**Tester.** Runs the project's checks and reports the exact commands and output. It runs on a cheaper model, because running commands and copying results needs no deep reasoning." },
        { on: ["review"], text: "**Reviewer.** Reads the diff against the plan and the rules. It has not seen the coding conversation and cannot edit anything." },
        { on: ["human"], text: "**You.** Approve the plan before coding starts and the merge after review. Everything in between can run without you; those two points cannot." }
      ]},
    { type: "section", label: "What it costs" },
    { type: "text", md: `Teams are not free, and the documentation is blunt about it. From the costs page and best-practices page:

- Every helper sends **its own requests**, so cost grows with the number of helpers and how long each runs.
- A fresh helper must first **gather context your conversation already had**, so for a small task it can be *slower* than doing the work in place.
- For *agent teams* (several Claude Code sessions working together, switched off by default and marked experimental) the page says usage is about **7 times** a standard session when teammates run in plan mode. Its advice: keep teams small, keep spawn prompts focused, use a mid-range model for teammates, and shut teammates down when they are done.

**So use a team for work that is big, separable and checkable** (a feature across several files, a refactor with tests). For a one-line fix, one session is better.` },
    { type: "quiz", title: "Knowledge check: why a team", questions: [
      { kind: "mcq", q: "What is the main reason the reviewer should be a separate helper?",
        options: ["It uses less memory", "It has not seen the reasoning that produced the code, so it is not swayed by it", "It is faster", "Models review better in groups"],
        answer: 1,
        why: ["Not the point.", "Right: independence is what makes a review worth having.", "It adds time and tokens.", "No evidence for that; the benefit is independence."] },
      { kind: "match", q: "Match each role to the tools it should have.",
        pairs: [["Planner", "Read-only: Read, Grep, Glob"], ["Coder", "Read and edit files and run commands, in its own worktree"], ["Tester", "Read and run commands, on a cheaper model"], ["Reviewer", "Read-only, never edits"]] },
      { kind: "tf", q: "A team of helpers is always cheaper and faster than one agent working through the task.", answer: false,
        explain: " Each helper sends its own requests and starts with a fresh context. Teams pay off for big, separable, checkable work, not for small tasks." }
    ]}
  ]},

  { title: "Define the team as files", blocks: [
    { type: "section", label: "A subagent is a Markdown file" },
    { type: "text", md: `In Claude Code a helper is a file in \`.claude/agents/\` (shared with the team through git) or \`~/.claude/agents/\` (just yours). A short YAML header says who it is and what it may do; the text underneath is its instructions. The sub-agents page (read 5 November 2026) lists the header fields. **\`name\`** and **\`description\`** are required. Useful optional ones: **\`tools\`** (an allowlist), \`disallowedTools\`, **\`model\`** (\`sonnet\`, \`opus\`, \`haiku\`, \`fable\` or \`inherit\`), \`maxTurns\`, \`permissionMode\`, \`skills\`, \`mcpServers\`, \`hooks\` and **\`isolation: worktree\`**.

Two properties matter most. A helper has **its own context window and does not see your conversation**, and the **\`tools\` list is enforced by Claude Code**, not requested in a prompt. So giving a reviewer \`tools: Read, Grep, Glob\` really does make it unable to edit files, which is the sentence the best-practices page uses for exactly this purpose.` },
    { type: "code", file: "code-samples/ch42/starter/.claude/agents/planner.md", lang: "markdown", code: "@ch42/starter/.claude/agents/planner.md",
      note: "The description is what the main agent reads when deciding whether to delegate, so it says WHEN to use the helper. The 'Files' list in the plan becomes the coder's ownership in Lesson 3." },
    { type: "code", file: "code-samples/ch42/starter/.claude/agents/coder.md", lang: "markdown", code: "@ch42/starter/.claude/agents/coder.md",
      note: "isolation: worktree is the documented way to give a helper its own git worktree. maxTurns stops a runaway helper." },
    { type: "code", file: "code-samples/ch42/starter/.claude/agents/tester.md", lang: "markdown", code: "@ch42/starter/.claude/agents/tester.md",
      note: "model: haiku, the setting the costs page suggests for simple, routine helpers." },
    { type: "code", file: "code-samples/ch42/starter/.claude/agents/reviewer.md", lang: "markdown", code: "@ch42/starter/.claude/agents/reviewer.md",
      note: "No Edit, no Write, no Bash. 'APPROVE or a numbered list of problems that affect correctness; skip style' keeps the review short and useful." },
    { type: "text", md: `The page lists several ways to start a helper: the main agent delegates **automatically** when a task matches a description, you can ask for one **in plain language**, **@-mention** it, or run a whole session as that helper with \`claude --agent NAME\`. The docs also state limits worth knowing: helpers can start helpers up to three layers deep by default, and 20 can run at once by default.` },
    { type: "section", label: "Check the files, because their power is in the header" },
    { type: "text", md: `A misspelled field is ignored silently, and a reviewer given one extra tool is no longer independent. \`agents_check.py\` reads the header of each file against the documented fields and flags the mistakes that change what a helper can do.` },
    { type: "code", file: "code-samples/ch42/agents_check.py", lang: "python", code: "@ch42/agents_check.py" },
    { type: "code", lang: "bash", code: "cd code-samples/ch42\npython agents_check.py starter/.claude/agents --readonly planner,reviewer",
      output: "OK    4 helper(s), no problems found.",
      note: "Real output. The tests also prove it reports a reviewer that has Edit, a misspelt field, a missing tools list, an unknown model and duplicate names." },
    { type: "callout", kind: "warning", md: "**Not tested live.** I checked these files against the documented format. I did **not** run them in a Claude Code session, so I cannot tell you how well the delegation descriptions trigger or how good the reviews are. Judge that on your own repository, the way Chapter 39 suggests: a few real tasks, before and after." },
    { type: "quiz", title: "Knowledge check: defining helpers", questions: [
      { kind: "mcq", q: "Which header makes a reviewer that really cannot change files?",
        options: ["description: Please do not edit files", "tools: Read, Grep, Glob", "model: haiku", "isolation: worktree"],
        answer: 1,
        why: ["A request in a description is not enforced.", "Right: the tool allowlist is applied by the program.", "That chooses a model, not powers.", "That isolates edits; it does not forbid them."] },
      { kind: "tf", q: "A subagent can see the whole conversation you have had with the main agent.", answer: false,
        explain: " It starts with a fresh context and only what you give it. That independence is the point, and also why it needs a good handoff." },
      { kind: "mcq", q: "Why does the 'description' field of a helper matter so much?",
        options: ["It is shown to patients", "The main agent uses it to decide when to delegate", "It sets the model", "It is optional decoration"],
        answer: 1,
        why: ["It is internal.", "Right: say when to use the helper.", "The model field does that.", "It is required."] }
    ]}
  ]},

  { title: "Work in parallel with git worktrees", blocks: [
    { type: "section", label: "One repository, several folders" },
    { type: "text", md: `Two agents editing the same folder at the same time will overwrite each other's work. A **git worktree** is git's own answer: a second (or third) working folder with its own files and its own branch, sharing **one** history and remote with the original. Each worker gets a folder to itself, and you combine the branches with an ordinary merge.` },
    { type: "diagram", svg: WT_SVG, caption: "Worktrees share the history (.git) but not the files." },
    { type: "text", md: `Claude Code builds this in (worktrees page, read 5 November 2026). \`claude --worktree feature-auth\` (or \`-w\`) creates a worktree under \`.claude/worktrees/feature-auth/\` on a new branch \`worktree-feature-auth\`, and starts Claude inside it. Run the same command with another name in a second terminal for a second isolated session. A helper with \`isolation: worktree\` gets a temporary one, removed automatically if the helper finished without changes. Without Claude Code, plain git does it:` },
    { type: "code", lang: "bash", code: "git worktree add ../clinic-after-hours -b after-hours   # a new folder and branch\ngit worktree list\ngit worktree remove ../clinic-after-hours", note: "Standard git commands. Add .claude/worktrees/ to .gitignore so worktree folders do not show up as untracked files in the main checkout (advice from the worktrees page)." },
    { type: "text", md: `Things the page tells you to expect: a worktree is a **fresh checkout**, so install dependencies in it, and files that git ignores (like \`.env\`) are **not** there unless you list them in a \`.worktreeinclude\` file at the project root. Claude Code blocks a worktree session from editing files in the main checkout. Exiting a worktree with no changes removes it; one with work in it asks whether to keep it.` },
    { type: "section", label: "The real danger: two workers, one file" },
    { type: "text", md: `Worktrees stop workers overwriting each other *while they work*. They do nothing about the **merge** afterwards. If two workers change the same file, git either reports a conflict, or, worse, merges both changes cleanly into code that no longer makes sense. The fix costs nothing: **before starting, declare which files each task owns, and refuse to run two tasks in parallel if their files overlap.** The planner's "Files" list is exactly that declaration.` },
    { type: "code", file: "code-samples/ch42/worktrees.py", lang: "python", code: "@ch42/worktrees.py" },
    { type: "code", file: "code-samples/ch42/parallel_demo.py", lang: "python", code: "@ch42/parallel_demo.py",
      note: "The two 'workers' are scripts that write a fixed change. Everything else is real git." },
    { type: "code", lang: "bash", code: "python parallel_demo.py",
      output: `== A. two tasks that own different files
  overlap check: none
  outside own files: {'after-hours': [], 'rupees': []}
  merged: {'after-hours': True, 'rupees': True} | tests on the result: 4 passed in 0.01s

== B. two tasks that both own triage.py
  overlap check BEFORE starting: [('after-hours', 'emergency-words', ['triage.py'])]
  if we ignore the warning, merged: {'after-hours': True, 'emergency-words': False} | conflicts: {'after-hours': [], 'emergency-words': ['triage.py']}`,
      note: "Real output from real git worktrees. In B the overlap is reported before any work starts; if you ignore it, the second merge really does conflict." },
    { type: "callout", kind: "warning", md: "**A clean merge is not proof of correct code.** Two changes can merge without a conflict and still contradict each other (one renames a function the other calls). Always run the tests on the merged result, as the demo does, and review the combined diff." },
    { type: "quiz", title: "Knowledge check: worktrees", questions: [
      { kind: "match", q: "Match the term to what it means.",
        pairs: [["Worktree", "A second folder with its own files and branch, sharing one history"], ["File ownership", "A declaration of which files each task may change"], [".worktreeinclude", "Lists ignored files (like .env) to copy into new worktrees"], ["Merge conflict", "Two branches changed the same lines differently"]] },
      { kind: "mcq", q: "Two planned tasks both list src/triage.py. What should the team do?",
        options: ["Run them in parallel anyway", "Run them one after the other, or split the work so the files differ", "Give them both Opus", "Ignore it; git will sort it out"],
        answer: 1,
        why: ["That is how conflicts happen.", "Right: serialise, or change the plan.", "Model size does not remove a conflict.", "Git can only report or textually merge, not judge meaning."] },
      { kind: "tf", q: "If git merges two branches without conflict, the combined code is guaranteed to work.", answer: false,
        explain: " Merging is textual. Run the tests on the result." }
    ]}
  ]},

  { title: "Production: handoffs and human checkpoints", blocks: [
    { type: "section", label: "The note is the whole contract" },
    { type: "text", md: `A helper that starts fresh knows only what it is handed. If the coder says "done, please review", the reviewer has to rediscover everything, and a claim like "tests pass" travels onward unchecked. So make each handoff a **structured note** with the fields the next worker needs: the goal, what was done, **decisions and why** (so nobody undoes them), files changed, **exact commands to verify**, **pasted evidence** (Chapter 39), open questions, risks and the tokens used.

Because it is data, a program can reject a bad note before the next worker wastes time on it.` },
    { type: "code", file: "code-samples/ch42/handoff.py", lang: "python", code: "@ch42/handoff.py" },
    { type: "code", lang: "bash", code: "python demo_handoff.py",
      output: `# Handoff T1: coder -> reviewer  [ready]

**Goal:** Add an after-hours message tool to the helpdesk
...
validate: OK
checkpoint: (False, [])

A vague note:
  - goal is too short to act on
  - no verify commands: the next worker cannot check the claim
  - evidence is a claim, not output (no counts or exit codes)
  - 'done' is empty
  - changed files outside what this task owns: ['Dockerfile']
checkpoint: (True, ["protected files changed: ['Dockerfile']"])`,
      note: "Real output (the middle of the markdown note is shortened here). The vague note is rejected for five reasons, and its Dockerfile change also forces a human checkpoint." },
    { type: "section", label: "Where a person must look" },
    { type: "text", md: `Automation is worth having only if you know exactly where it stops. \`checkpoint()\` encodes the rule: **a person looks when the cost of being wrong is high.** In our version that means a blocked status, open questions, listed risks, any change to protected files (CI, hooks, settings, Dockerfile, migrations, \`.env\`) or a worker that went over its token budget.

The minimum checkpoints for any team:` },
    { type: "list", items: [
      "**Approve the plan before coding starts.** It is the cheapest place to catch a wrong direction.",
      "**Approve the merge.** In Claude Code a person approves each merge into the main branch; do not give a helper the right to push (see the deny rule \`Bash(git push *)\` in Chapter 41).",
      "**Read changes to guard-rail files yourself,** whoever or whatever made them.",
      "**Cap each worker:** \`maxTurns\` in the helper's header, and a token budget per task in the orchestration around it (Chapter 21's budget guard, Chapter 40's numbers)."
    ]},
    { type: "list", style: "mistakes", items: [
      "Letting the reviewer see the coder's reasoning, so it reviews the story and not the diff.",
      "Parallel tasks with overlapping files 'because the merge will probably be fine'.",
      "Handoffs in free text: 'finished, looks good'.",
      "More helpers than the task needs, each re-reading the whole repository.",
      "A helper with every tool 'to be flexible'.",
      "No cap on turns or tokens for a helper that can loop."
    ]},
    { type: "callout", kind: "tip", md: "**What is real here.** Tested: the file checker, the ownership logic, the git worktrees and merges, the handoff validation (15 tests). Stand-in: the workers in the demo are scripts. Untested: real Claude Code subagents and agent teams. In Chapter 44 we put the pieces together around a stand-in model so the whole pipeline can run offline." },
    { type: "quiz", title: "Knowledge check: handoffs", questions: [
      { kind: "mcq", q: "Which handoff note will the validator accept from a coder?",
        options: ["Done, all tests pass", "Goal, what was done, files changed, the verify command and its pasted output", "A link to the chat", "A list of files only"],
        answer: 1,
        why: ["A claim with no evidence.", "Right: everything the next worker needs, and checkable.", "The next worker has not seen the chat.", "No way to verify."] },
      { kind: "order", q: "Put the checkpoints in order.", items: ["A person approves the plan", "Workers code and test in their own worktrees", "The reviewer reads the diff", "A person approves the merge"] },
      { kind: "tf", q: "A helper may change CI configuration if its tests pass.", answer: false,
        explain: " CI, hooks and permission settings are the guard rails. A person reads every line of those changes." }
    ]}
  ]}

  ]
};
})();
