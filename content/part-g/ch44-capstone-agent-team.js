/* Chapter 44 · Capstone: build a feature with an agent team */
(function () {

var FLOW_SVG = `
<svg viewBox="0 0 680 196" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch44-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="plan"><rect class="dg-box" x="10" y="12" width="190" height="60" rx="10"/><text class="dg-title" x="105" y="38" text-anchor="middle">1 Planner</text><text class="dg-muted" x="105" y="57" text-anchor="middle">plan + owned files</text></g>
  <g data-step="approve1"><rect class="dg-box amber" x="245" y="12" width="190" height="60" rx="10"/><text class="dg-title" x="340" y="38" text-anchor="middle">2 You</text><text class="dg-muted" x="340" y="57" text-anchor="middle">approve the plan</text></g>
  <g data-step="code"><rect class="dg-box accent" x="480" y="12" width="190" height="60" rx="10"/><text class="dg-title" x="575" y="38" text-anchor="middle">3 Coder</text><text class="dg-muted" x="575" y="57" text-anchor="middle">own worktree, tests first</text></g>
  <g data-step="test"><rect class="dg-box" x="480" y="124" width="190" height="60" rx="10"/><text class="dg-title" x="575" y="150" text-anchor="middle">4 Tester</text><text class="dg-muted" x="575" y="169" text-anchor="middle">tests, gate, spec, database</text></g>
  <g data-step="review"><rect class="dg-box" x="245" y="124" width="190" height="60" rx="10"/><text class="dg-title" x="340" y="150" text-anchor="middle">5 Reviewer</text><text class="dg-muted" x="340" y="169" text-anchor="middle">verdict from evidence</text></g>
  <g data-step="approve2"><rect class="dg-box amber" x="10" y="124" width="190" height="60" rx="10"/><text class="dg-title" x="105" y="150" text-anchor="middle">6 You</text><text class="dg-muted" x="105" y="169" text-anchor="middle">approve the merge</text></g>
  <path class="dg-line" d="M202 42H243" marker-end="url(#ch44-a)"/>
  <path class="dg-line" d="M437 42H478" marker-end="url(#ch44-a)"/>
  <path class="dg-line" d="M610 74V122" marker-end="url(#ch44-a)"/>
  <path class="dg-line" d="M478 154H437" marker-end="url(#ch44-a)"/>
  <path class="dg-line" d="M243 154H202" marker-end="url(#ch44-a)"/>
  <path class="dg-accent-line" d="M340 122V98H520V74" fill="none" marker-end="url(#ch44-a)"/>
  <text class="dg-muted" x="352" y="92">rejected: next attempt</text>
</svg>`;

window.COURSE.chapters.ch44 = {
  id: "ch44",
  title: "Capstone: build a feature with an agent team",
  oneLine: "Put Part G together. A team of roles adds a real feature to the Clinic Helpdesk in a real git repository: a plan you approve, a coder in its own worktree, a gate that rejects a careless first attempt, a database check over MCP, a token budget, and a merge only you can approve.",
  lessons: [

  { title: "The brief and the team", blocks: [
    { type: "section", label: "One feature, every safeguard" },
    { type: "text", md: `The helpdesk can already say which doctors work in a **department**. Patients also ask the other way round: *"Who is available on Thursday?"* The brief for the team:

> Add \`doctors_on(day, department=None)\`. It returns the doctors who see patients on a weekday, sorted by name. It accepts \`thu\`, \`Thursday\` and \` THU \`. An unknown day is an error, not a crash. It must agree with the clinic database.

It is a small feature on purpose. What we are testing is not the feature; it is the **machinery around an agent** that makes a result trustworthy enough to merge. Everything from Part G is in this one pipeline.` },
    { type: "stepper", svg: FLOW_SVG, caption: "The pipeline. Two yellow boxes are people. Everything else is a program or a role.",
      steps: [
        { on: ["plan"], text: "**Planner** reads the real project files and writes a plan: the goal, the **files this task owns**, the steps, and what 'done' means. (Chapter 42.)" },
        { on: ["approve1"], text: "**You approve the plan.** The cheapest place to catch a wrong direction, and the only time you are needed before the code exists. A 'no' stops everything." },
        { on: ["code"], text: "**Coder** works in its own **git worktree** (Chapter 42), writes the tests first and watches them fail, then writes the code. It may change only the files the plan lists." },
        { on: ["test"], text: "**Tester** runs what a program can run: the project tests, the **gate** (Chapter 43), an **acceptance spec** the coder cannot edit, and a **database check over MCP** (Chapter 41). A cheaper model does this job in a real team (Chapter 40)." },
        { on: ["review"], text: "**Reviewer** reads the evidence and the **handoff note** and gives a verdict. If it says no, the worktree is thrown away and the next attempt starts again from \`main\`. Every helper spends from **one token budget**; when it is gone the pipeline stops." },
        { on: ["approve2"], text: "**You approve the merge.** You see a one-line summary of what changed and what was checked. Nothing merges without your yes, because the yes is a function argument and its default is no." }
      ]},
    { type: "section", label: "What is real and what is a stand-in" },
    { type: "text", md: `This tutorial has to run offline and cost nothing, so the three **roles** are small fixed programs, not AI models. Be clear about what that means:

| Part | Status |
|---|---|
| Git repository, worktrees, branches, the merge | **Real** |
| The project's tests, the gate, the acceptance spec | **Real** |
| Database check through the read-only MCP server of Chapter 41 (a real child process) | **Real** |
| Handoff notes, ownership check, human checkpoints, budget stop | **Real** |
| Token and dollar numbers | **Estimates** from text size, plus an assumed 20,000-token starting context per helper |
| Planner, coder, reviewer | **Stand-ins.** The coder has two pre-written attempts, one careless and one careful. It does not read the feedback; the pipeline just asks for the next attempt. |

The honest consequence: this capstone proves the **safety net** works. It does **not** prove a real model would write the careful attempt. That needs a trial on your own repository with real subagents (Lesson 4).` },
    { type: "quiz", title: "Knowledge check: the team", questions: [
      { kind: "order", q: "Put the pipeline in order.", items: ["Planner writes the plan", "A person approves the plan", "Coder works in its own worktree", "Tester runs tests, gate, spec and database check", "Reviewer gives a verdict", "A person approves the merge"] },
      { kind: "mcq", q: "What does the capstone prove?",
        options: ["That an AI model can write this feature", "That the safety net around an agent catches a careless attempt and lets a careful one through", "That tokens are free", "That reviews are unnecessary"],
        answer: 1,
        why: ["The roles are stand-ins; no model ran.", "Right: the real parts are the checks, not the author.", "The numbers are estimates and not free.", "A person still approves twice."] },
      { kind: "tf", q: "The token and dollar numbers in this chapter come from a real model's usage reports.", answer: false,
        explain: " They are estimates from text size with an assumed starting context. A real run reports real usage." }
    ]}
  ]},

  { title: "The pieces", blocks: [
    { type: "section", label: "The starting project" },
    { type: "text", md: `The existing helpdesk lookups are one function and two tests, with the same made-up doctors as every chapter since 9. \`AGENTS.md\` (Chapter 39) tells any agent how to run the tests and what it must not touch, in six lines.` },
    { type: "code", file: "code-samples/ch44/base_project/helpdesk_lookup.py", lang: "python", code: "@ch44/base_project/helpdesk_lookup.py" },
    { type: "code", file: "code-samples/ch44/base_project/AGENTS.md", lang: "markdown", code: "@ch44/base_project/AGENTS.md" },
    { type: "section", label: "A definition of done the coder cannot edit" },
    { type: "text", md: `The coder writes its own tests. A coder in trouble can write weak ones that pass. So the planner's definition of done is a **separate acceptance spec that lives outside the repository**: the coder never sees it and cannot change it. It covers the cases a careless implementation misses: the day spellings, the empty day, the unknown day.` },
    { type: "code", file: "code-samples/ch44/acceptance_spec.py", lang: "python", code: "@ch44/acceptance_spec.py" },
    { type: "section", label: "Does the code agree with the data?" },
    { type: "text", md: `Code and data drift apart quietly: someone updates the clinic database and not the code, and the helpdesk tells a patient the wrong day. \`db_check.py\` starts **the real read-only MCP server from Chapter 41 as a child process**, asks it for the doctors table, builds "who works on each weekday" from the rows, and compares that with what the feature returns for all six days.` },
    { type: "code", file: "code-samples/ch44/db_check.py", lang: "python", code: "@ch44/db_check.py" },
    { type: "section", label: "One budget for the whole team" },
    { type: "text", md: `Every helper call spends from one shared budget, using Chapter 40's token rule and dated prices. When the total passes the limit the pipeline raises \`BudgetExceeded\` and stops for a person. Each role uses the model that suits its job: the tester, which only runs commands and copies results, is on the cheapest one.` },
    { type: "code", file: "code-samples/ch44/team_budget.py", lang: "python", code: "@ch44/team_budget.py" },
    { type: "section", label: "The stand-in roles" },
    { type: "text", md: `Open \`roles.py\` and read the two coder attempts side by side. The careless one is what a rushed agent really does: implements only the exact spelling \`Thu\`, forgets to sort, **weakens an existing test**, writes a test that asserts almost nothing, and adds a package with a misspelt name. The careful one writes the tests first and keeps to its two files.` },
    { type: "code", file: "code-samples/ch44/roles.py", lang: "python", code: "@ch44/roles.py" },
    { type: "quiz", title: "Knowledge check: the pieces", questions: [
      { kind: "mcq", q: "Why is acceptance_spec.py kept outside the repository the coder works in?",
        options: ["To save disk space", "So the coder cannot weaken or delete the definition of done", "Python requires it", "So it runs faster"],
        answer: 1,
        why: ["Not the reason.", "Right: an agent can edit anything it can reach.", "No such rule.", "No difference."] },
      { kind: "match", q: "Match each check to the failure it catches.",
        pairs: [["Acceptance spec", "Sloppy code that passes the coder's own weak tests"], ["Database check over MCP", "Code and data that disagree"], ["Ownership check", "Edits to files the plan did not allow"], ["Budget", "A loop that keeps spending"]] },
      { kind: "tf", q: "The database check can change rows in the clinic database.", answer: false,
        explain: " It talks to the read-only server of Chapter 41: read-only connection, SELECT only, masked personal columns." }
    ]}
  ]},

  { title: "Watch it run", blocks: [
    { type: "section", label: "One command" },
    { type: "code", lang: "bash", code: "cd code-samples/ch44\npython pipeline.py",
      output: `[planner] plan for T-doctors-on: owns ['helpdesk_lookup.py', 'test_doctors_on.py']; handoff problems: none
[person] plan approved.
[coder #1] wrote tests and code in one step: no red step observed.
[coder #1] changed ['helpdesk_lookup.py', 'requirements.txt', 'test_lookup.py']; outside the plan: ['requirements.txt', 'test_lookup.py']
[tester #1] gate: tests=pass, diff-review=fail, tests-with-code=pass, dependencies=fail, injection=pass
[tester #1] acceptance spec: FAIL (13 failed, 2 passed in 0.05s); database check: 3 mismatch(es)
[reviewer #1] REQUEST CHANGES:
  1. gate check 'diff-review' failed
  2. gate check 'dependencies' failed
  3. changed files the plan did not allow: ['requirements.txt', 'test_lookup.py']
  4. the acceptance spec does not pass
  5. disagrees with the clinic database: ["Mon: database says ['Dr Khan', 'Dr Mehta'], feature says ['Dr Mehta', 'Dr Khan']", ...]
  6. handoff note is not acceptable: ["changed files outside what this task owns: ['requirements.txt', 'test_lookup.py']"]
  7. the tests never failed before the code was written, so they may not test anything
[pipeline] attempt 1 rejected. The worktree is thrown away; the next attempt starts from main.
[coder #2] tests first: doctors_on: tests failed (1 error in 0.09s) -> expected fail: ok
[coder #2] implement doctors_on: tests passed (13 passed in 0.02s) -> expected pass: ok
[coder #2] changed ['helpdesk_lookup.py', 'test_doctors_on.py']; outside the plan: none
[tester #2] gate: tests=pass, diff-review=pass, tests-with-code=pass, dependencies=pass, injection=pass
[tester #2] acceptance spec: pass (15 passed in 0.02s); database check: agrees
[reviewer #2] APPROVE
[person] merge approved.
[main] merged cleanly: True; tests on main afterwards: pass (13 passed in 0.01s)`,
      note: "Real output, shortened in two places. 'person' lines are automatic in this run; python pipeline.py --ask asks you instead." },
    { type: "section", label: "Read the rejection" },
    { type: "text", md: `Look at attempt 1. **The project's own tests passed** (\`tests=pass\`), because the careless coder had weakened them. An approval based on green tests would have merged code that fails 13 of 15 acceptance checks and disagrees with the database. The seven reasons came from seven **independent** checks, and each is something a tired reviewer could miss:

1. **diff-review**: two assertions removed from an existing test (Chapter 39).
2. **dependencies**: \`reqeusts\` is one swap away from the approved \`requests\` (Chapter 43).
3. **ownership**: the plan did not allow touching \`requirements.txt\` or \`test_lookup.py\` (Chapter 42).
4. **acceptance spec**: the spelling \`thu\` is not accepted, results are not sorted, the department filter is ignored, and an unknown day returns an empty answer instead of an error.
5. **database check**: the answers differ from the database on three weekdays (Monday, Thursday and Friday), here because the doctors come back in the wrong order.
6. **handoff validation**: the note itself lists a file outside what the task owns.
7. **red/green**: the tests never failed first, so nobody saw them fail for the right reason.

Attempt 2 follows the plan exactly: tests first (**red**: one import error, because \`doctors_on\` does not exist yet), then the code (**green**), two files changed, nothing else.` },
    { type: "section", label: "Cost" },
    { type: "code", lang: "text", code: "role      step                       model            in    out      usd\nplanner   read repo, write plan      sonnet-5.5   20,560    180   0.0429\ncoder     attempt 1                  sonnet-5.5   20,632    341   0.0447\ntester    attempt 1: gate+spec+db    haiku-5.5    20,434    173   0.0021\nreviewer  attempt 1: verdict         sonnet-5.5   20,607    179   0.0430\ncoder     attempt 2                  sonnet-5.5   20,632    633   0.0476\ntester    attempt 2: gate+spec+db    haiku-5.5    20,727     77   0.0021\nreviewer  attempt 2: verdict         sonnet-5.5   20,896      2   0.0418\nTOTAL                                            144,488  1,585   0.2242   (budget 200,000 tokens)",
      note: "ESTIMATE, not a bill. 'in' is dominated by the assumed 20,000-token starting context every helper pays for (Chapter 40), which is why splitting a small task across seven calls is expensive: the cost of a team is mostly the cost of starting each member. The cheap tester is a tenth of the price of the others." },
    { type: "text", md: `**Things to try, all offline:**

- Run \`python pipeline.py --ask\` and answer **n** to the plan, or **y** then **n** to the merge. Nothing reaches \`main\`.
- In \`pipeline.run_pipeline\`, pass \`max_tokens=30000\`. The budget stops the run after the first helper call and says so.
- Change the doctor days in \`ch41/clinic_db.py\` seed data and run \`db_check.py\`. The check names the days that now disagree.
- Pass \`attempts=[roles.CARELESS, roles.CARELESS]\`. After two rejections the pipeline hands over to a person instead of trying forever.` },
    { type: "callout", kind: "warning", md: "**Run time.** The pipeline takes about three seconds. The 20 tests take about a minute because each one creates real git repositories and starts a real MCP server process." },
    { type: "quiz", title: "Knowledge check: reading the run", questions: [
      { kind: "mcq", q: "In attempt 1 the project tests passed. Why was the attempt still rejected?",
        options: ["The tests were slow", "The tests had been weakened, and other independent checks found real problems", "The reviewer is strict about style", "Git blocked it"],
        answer: 1,
        why: ["Not the reason.", "Right: green tests alone prove little when the coder can edit them.", "None of the seven reasons is style.", "Git was not the gate."] },
      { kind: "mcq", q: "What does the 'red' step in attempt 2 prove?",
        options: ["The code is slow", "The new tests fail without the feature, so they can detect its absence", "The code has a bug", "The database is empty"],
        answer: 1,
        why: ["No.", "Right: a test that has never failed may not test anything.", "It is expected before the code exists.", "Unrelated."] },
      { kind: "tf", q: "If the same pipeline ran with a real model as coder, it would produce the careful attempt every time.", answer: false,
        explain: " The attempts here are written in advance. A real model may succeed, fail, or fail differently; the point is that the safety net handles each case the same way." }
    ]}
  ]},

  { title: "From the capstone to your team", blocks: [
    { type: "section", label: "Swap the stand-ins, keep the net" },
    { type: "text", md: `The pipeline's value is in everything except \`roles.py\`. To use it with real agents, replace each role and keep the rest:

| Stand-in | Real version |
|---|---|
| \`roles.planner\` | The \`planner\` subagent (read-only tools; Chapter 42's \`starter/.claude/agents/planner.md\`) asked to output the plan format of \`roles.Plan\` |
| \`roles.CARELESS / CAREFUL\` | A \`coder\` subagent with \`isolation: worktree\` and \`maxTurns\`; on a rejection it receives the reviewer's reasons as its next input |
| \`roles.reviewer\` | The read-only \`reviewer\` subagent, given the diff and the evidence and nothing of the coder's reasoning, **plus** the fixed rules you already have |
| \`team_budget\` estimates | The real usage the session reports, summed |
| \`approve_plan\`, \`approve_merge\` | You, in the terminal or in a pull request review |

Run it from a script that calls Claude Code non-interactively, or let the main agent delegate to the subagents and have your gate run as a hook or in CI (Chapter 43). Chapter 41's deny rules and sandbox belong around all of it.` },
    { type: "callout", kind: "warning", md: "**Not run here.** I did not run real subagents, agent teams or Claude Code in these chapters, so I cannot report how often a real coder passes on the first try, how many attempts it needs, or what it costs. Those are the numbers to measure on your own repository, which is what the next section is for." },
    { type: "section", label: "A first trial on your own repository" },
    { type: "list", items: [
      "**Pick a small, real task** with a clear 'done': a lookup, a validation, a report. Not a rewrite.",
      "**Write the acceptance spec yourself** (or have a separate agent write it from the plan) and keep it outside the repository.",
      "**Set the limits first** (Chapter 41): default permission mode, deny rules for push and secrets, a sandbox or a disposable folder.",
      "**Run the same task three ways** and compare: one agent alone; one agent with the gate; the team. Record attempts, tokens, minutes and what you had to fix by hand.",
      "**Keep what works.** Add each surprise as one line in \`AGENTS.md\` and one check in the gate (Chapter 39). The net improves from real failures, not from guessing."
    ]},
    { type: "section", label: "What to measure, so you can decide" },
    { type: "list", items: [
      "**First-pass acceptance rate:** how often does the first attempt pass every check?",
      "**Attempts per merged change** and **tokens per merged change**, from real usage.",
      "**What the gate caught** and **what a person caught afterwards.** The second list is where to add checks.",
      "**Escapes:** problems found after merging. One of these outweighs ten clean runs.",
      "**Human time per change:** reading the plan, the summary and the diff. If this is not falling, the team is not saving you anything."
    ]},
    { type: "list", style: "mistakes", items: [
      "Calling a pipeline 'autonomous' when two people-checkpoints are doing the real safety work.",
      "Letting the agent that wrote the code also write the acceptance spec.",
      "Measuring speed and not escapes.",
      "Starting with a big task, failing, and concluding the approach does not work.",
      "Hiding the stand-in: reporting results of a scripted run as if a model did it.",
      "Skipping the budget because 'it is only a small task'. Loops do not announce themselves."
    ]},
    { type: "section", label: "Where you are" },
    { type: "text", md: `You started this tutorial with the question *what is an AI agent?* You can now build one, give it tools and memory, connect it to your systems over MCP, make several cooperate, evaluate and monitor them, guard them, deploy them, and use the same ideas to supervise **agents that build software for you**. The skill that carries across all of it is the one this capstone practised: **never trust an agent's report. Define done in advance, check it with something the agent cannot edit, limit what it can do, keep a person at the points where a mistake is expensive, and measure what really happens.**

Good next steps: take the helpdesk from Chapter 27 and add one real feature this way; or take one workflow from your own work in digital health, write its acceptance spec first, and see how far an agent gets.` },
    { type: "callout", kind: "tip", md: "**What is real here, in one line.** Tested (20 tests): the pipeline with real git, tests, gate, MCP database check, checkpoints and budget stop. Stand-in: planner, coder, reviewer. Estimated: tokens and dollars. Untested: real Claude Code subagents, agent teams and CI on GitHub." },
    { type: "quiz", title: "Final check", questions: [
      { kind: "mcq", q: "What stays the same when you replace the stand-in roles with real subagents?",
        options: ["Nothing", "The worktrees, checks, acceptance spec, database check, checkpoints and budget", "Only the budget", "Only the plan"],
        answer: 1,
        why: ["Most of it stays.", "Right: the safety net is independent of the author.", "More than the budget stays.", "More than the plan stays."] },
      { kind: "match", q: "Match each principle to how the capstone applies it.",
        pairs: [["Do not trust the report", "The pipeline re-runs tests and checks itself"], ["Define done in advance", "An acceptance spec outside the coder's reach"], ["Limit what it can do", "Worktree, owned files, read-only database"], ["A person at expensive points", "Plan approval and merge approval"], ["Measure what happens", "Budget table and a recorded trial"]] },
      { kind: "tf", q: "A pipeline with a gate and a reviewer role no longer needs a person to approve merges.", answer: false,
        explain: " The checks find mechanical problems. Whether the change is the right one, and who is accountable for it, stays with a person." }
    ]}
  ]}

  ]
};
})();
