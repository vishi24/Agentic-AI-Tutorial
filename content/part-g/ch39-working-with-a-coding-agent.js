/* Chapter 39 · Working well with a coding agent */
(function () {

var DECIDE_SVG = `
<svg viewBox="0 0 680 200" xmlns="http://www.w3.org/2000/svg">
  <rect class="dg-box accent" x="10" y="10" width="322" height="180" rx="12"/>
  <text class="dg-title" x="171" y="36" text-anchor="middle">The model decides</text>
  <text class="dg-muted" x="171" y="56" text-anchor="middle">non-deterministic</text>
  <text class="dg-text" x="28" y="86">Your prompt</text>
  <text class="dg-text" x="28" y="110">CLAUDE.md and AGENTS.md</text>
  <text class="dg-text" x="28" y="134">Skills the agent picks up itself</text>
  <text class="dg-muted" x="28" y="168">Usually followed. Never guaranteed.</text>
  <rect class="dg-box amber" x="348" y="10" width="322" height="180" rx="12"/>
  <text class="dg-title" x="509" y="36" text-anchor="middle">The program enforces</text>
  <text class="dg-muted" x="509" y="56" text-anchor="middle">deterministic</text>
  <text class="dg-text" x="366" y="86">Hooks that block an action</text>
  <text class="dg-text" x="366" y="110">Deny rules and managed settings</text>
  <text class="dg-text" x="366" y="134">Tests, type checks, CI, a human approver</text>
  <text class="dg-muted" x="366" y="168">Applied every time, whatever the model decided.</text>
</svg>`;

var LOOP_SVG = `
<svg viewBox="0 0 680 196" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch39-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="explore"><rect class="dg-box" x="6" y="30" width="116" height="62" rx="10"/><text class="dg-title" x="64" y="56" text-anchor="middle">1 Explore</text><text class="dg-muted" x="64" y="76" text-anchor="middle">read only</text></g>
  <g data-step="plan"><rect class="dg-box accent" x="142" y="30" width="116" height="62" rx="10"/><text class="dg-title" x="200" y="56" text-anchor="middle">2 Plan</text><text class="dg-muted" x="200" y="76" text-anchor="middle">you approve</text></g>
  <g data-step="change"><rect class="dg-box" x="278" y="30" width="116" height="62" rx="10"/><text class="dg-title" x="336" y="56" text-anchor="middle">3 Change</text><text class="dg-muted" x="336" y="76" text-anchor="middle">small steps</text></g>
  <g data-step="check"><rect class="dg-box amber" x="414" y="30" width="116" height="62" rx="10"/><text class="dg-title" x="472" y="56" text-anchor="middle">4 Check</text><text class="dg-muted" x="472" y="76" text-anchor="middle">pass or fail</text></g>
  <g data-step="review"><rect class="dg-box accent" x="550" y="30" width="124" height="62" rx="10"/><text class="dg-title" x="612" y="56" text-anchor="middle">5 Review</text><text class="dg-muted" x="612" y="76" text-anchor="middle">you read the diff</text></g>
  <path class="dg-line" d="M124 61H140" marker-end="url(#ch39-a)"/><path class="dg-line" d="M260 61H276" marker-end="url(#ch39-a)"/><path class="dg-line" d="M396 61H412" marker-end="url(#ch39-a)"/><path class="dg-line" d="M532 61H548" marker-end="url(#ch39-a)"/>
  <g data-step="retry"><path class="dg-line" d="M472 94V150H336V96" fill="none" marker-end="url(#ch39-a)"/><text class="dg-muted" x="404" y="172" text-anchor="middle">red? read the output, fix, run the check again</text></g>
</svg>`;

window.COURSE.chapters.ch39 = {
  id: "ch39",
  title: "Working well with a coding agent",
  oneLine: "A coding agent is only as good as what it can see and what it can check. You will write an instruction file that earns its place, follow the loop explore, plan, change, check, review, and use three small tools: an instruction-file linter, a diff reviewer and an evidence runner.",
  lessons: [

  { title: "Tell the agent what it cannot see", blocks: [
    { type: "section", label: "What belongs in an instruction file" },
    { type: "text", md: `A coding agent starts every session knowing nothing about your project except what it can read. It can read the code. It cannot read the things that live in people's heads: the command that runs the tests, the folder that looks dead but is not, the decision your team made last month.

An [[instruction file]] (\`CLAUDE.md\`, \`AGENTS.md\` and the like) is where you write those down. Claude Code's best-practices page (read 5 November 2026) gives a test for each line: **would the agent get this wrong without being told?** Four kinds of line pass the test:

- **How to check the work:** the exact test, lint and type-check commands, and how to run a single test.
- **Places where the code misleads:** an old pattern that is everywhere but must not be copied, a directory that looks unused but is live.
- **Decisions that are not in the repository:** which error helper the team settled on, how releases work.
- **Anything you have had to correct twice.**

The same page says what to leave out: facts the agent can see for itself (the folder layout, the language), and general advice such as "write clean code". Its memory guide recommends **under 200 lines** per file, because every line is read on every task and a long file makes the important lines easy to lose.` },
    { type: "code", file: "code-samples/ch39/starter/AGENTS.md", lang: "markdown", code: "@ch39/starter/AGENTS.md",
      note: "The real instruction file for our Clinic Helpdesk (Chapter 27). 18 lines. Every rule is something a new developer would otherwise learn the hard way, such as 'emergencies never reach a model'." },
    { type: "code", file: "code-samples/ch39/starter/CLAUDE.md", lang: "markdown", code: "@ch39/starter/CLAUDE.md",
      note: "The first line, @AGENTS.md, imports the shared file. The rest is only for Claude Code. 'Compact instructions' is a section the costs page documents for telling Claude Code what to keep when it summarises a long session." },
    { type: "code", file: "code-samples/ch39/starter/.claude/rules/tests.md", lang: "markdown", code: "@ch39/starter/.claude/rules/tests.md",
      note: "A path-scoped rule: the paths header limits it to files matching test_*.py, so it costs nothing on other tasks. This is the format from Claude Code's memory page." },
    { type: "section", label: "Ask versus enforce" },
    { type: "text", md: `Best practices draws a line that is worth remembering. Everything you write in an instruction file or a prompt is **non-deterministic**: the model reads it and decides what to do. It usually follows you, but nothing guarantees it. A [[hook]], a deny rule or a managed setting is **deterministic**: the program applies it every time, whatever the model decided.` },
    { type: "diagram", svg: DECIDE_SVG, caption: "Use the left side for guidelines that have exceptions, the right side for rules that must never bend." },
    { type: "text", md: `A practical test from the same page: if you keep adding emphasis (IMPORTANT, ALWAYS) to a line and the agent still misses it, the line is probably a rule that cannot have exceptions and belongs in a hook (Chapter 41). The reverse also holds: a preference such as "prefer named exports" has plenty of exceptions and should stay a sentence.` },
    { type: "quiz", title: "Knowledge check: instruction files", questions: [
      { kind: "mcq", q: "Which line deserves a place in the helpdesk's instruction file?",
        options: ["Write clean, readable code", "The tools are read-only; booking runs only after a person approves, so do not add a booking tool", "The project is written in Python", "src/ contains the source code"],
        answer: 1,
        why: ["Nothing to act on.", "Right: the agent could not learn this rule from the code, and breaking it is dangerous.", "The agent can see that.", "The agent can see that too."] },
      { kind: "tf", q: "Writing MUST in capitals makes an agent follow a rule every time.", answer: false,
        explain: " Emphasis helps little with current models and can make the agent over-apply a rule. A rule with no exceptions belongs in a hook or deny rule." },
      { kind: "match", q: "Match each item to who decides.",
        pairs: [["A line in AGENTS.md", "The model decides"], ["A hook that blocks edits to migrations/", "The program enforces"], ["A deny rule on reading .env", "The program enforces"], ["Your prompt", "The model decides"]] }
    ]}
  ]},

  { title: "The loop: explore, plan, change, check, review", blocks: [
    { type: "section", label: "Five steps, in this order" },
    { type: "text", md: `A common way to get a bad result from a coding agent is to describe a feature in one sentence and let it run. The agent then has to guess the design **and** write the code, and you only see it at the end. Claude Code's best-practices and costs pages recommend a different rhythm, and the rhythm works with any tool.` },
    { type: "stepper", svg: LOOP_SVG, caption: "The working loop. Steps 1 and 2 are cheap; step 5 is where you stay in charge.",
      steps: [
        { on: ["explore"], text: "**1 · Explore, read only.** Ask the agent to read the relevant files and explain how they work. Nothing can be broken yet. Claude Code has a [[plan mode]] for this: it can read and propose but not change files." },
        { on: ["plan"], text: "**2 · Plan.** Ask for a short plan: which files, what order, which tests. Read it. A wrong plan costs a minute to fix; wrong code costs an hour. The costs page says plan mode 'prevents expensive re-work when the initial direction is wrong'." },
        { on: ["change"], text: "**3 · Change, in small steps.** One behaviour at a time, with a test for it. The costs page advises writing one file, testing it, then continuing." },
        { on: ["check"], text: "**4 · Check.** Run something that comes back pass or fail: tests, a type check, a linter. This is the step that lets the agent correct itself, and the single most useful line in your instruction file is the command that runs it." },
        { on: ["retry"], text: "**If the check is red:** the agent reads the output, fixes the cause and runs the check again. Insist on seeing the command and its output, not the sentence 'all tests pass'." },
        { on: ["review"], text: "**5 · Review.** Read the diff yourself, or have a second session that never saw the writing review it. Whoever wrote the code is the worst person to review it." }
      ]},
    { type: "section", label: "Specific prompts, with a way to verify" },
    { type: "text", md: `The costs page gives a pair of examples: "improve this codebase" makes the agent scan everything, while "add input validation to the login function in auth.ts" lets it read two files. Be specific about **where**, **what** and **how you will know it worked**. A prompt for our helpdesk:` },
    { type: "code", lang: "text", code: `In code-samples/ch27, add a tool that tells a patient how many doctors
work on a given weekday.
Plan first and wait for my OK.
Add a test in test_helpdesk.py that fails before your change.
The tool must be read-only (see AGENTS.md).
When you are done, run the test command from AGENTS.md and show me
the command and its output.`,
      note: "Everything the agent cannot guess is stated: where, the constraint, the proof it must produce. The long reminders live in AGENTS.md, so the prompt stays short." },
    { type: "section", label: "Evidence, not claims" },
    { type: "text", md: `An agent's summary is a **claim**. A command's exit code and output are **evidence**. \`evidence.py\` runs the checks itself, without a shell, and prints a block you can paste into a pull request or a handoff note (Chapter 42).` },
    { type: "code", file: "code-samples/ch39/evidence.py", lang: "python", code: "@ch39/evidence.py" },
    { type: "code", lang: "bash", code: "cd code-samples/ch27\npython ../ch39/evidence.py \"python -m pytest -q\"",
      output: `$ python -m pytest -q
[PASS exit=0 2.4s]
................                                                         [100%]
16 passed in 1.41s

ALL CHECKS PASSED`,
      note: "Real output from the helpdesk's own tests. Timings vary." },
    { type: "callout", kind: "tip", md: "**Give the agent something to run.** Best practices calls it the highest-leverage habit: with a pass-or-fail check the agent can loop on its own and you do not have to watch. Without one, you are the check." },
    { type: "quiz", title: "Knowledge check: the loop", questions: [
      { kind: "order", q: "Put the loop in order.", items: ["Explore the code read-only", "Agree a plan", "Change one behaviour with a test", "Run the check and read the output", "Read the diff"] },
      { kind: "mcq", q: "Which request leaves the agent the least to guess?",
        options: ["Make the helpdesk better", "Add a read-only tool in code-samples/ch27 that counts doctors on a weekday, with a test that fails first; show the test output", "Fix the bugs", "Write some tests"],
        answer: 1,
        why: ["Too broad: it will scan everything and decide the goal itself.", "Right: where, what, constraint and proof are all stated.", "Which bugs?", "For what?"] },
      { kind: "tf", q: "Reading the agent's sentence 'all tests pass' is as good as seeing the command and its output.", answer: false,
        explain: " The sentence is a claim. The command and its output are evidence, and are faster to check than to argue about." }
    ]}
  ]},

  { title: "Reviewing what the agent wrote", blocks: [
    { type: "section", label: "Mistakes agents make again and again" },
    { type: "text", md: `A person reviewing an AI-written diff has a problem: the code looks fluent and confident, and there is a lot of it. Some problems are mechanical and a program can find them, which leaves your attention for the question only a person can answer: **is this the right change?**

\`diff_review.py\` reads a diff and flags patterns that agents are known to produce. They are my own checklist from reading what these tools tend to do, not a finding from a study, so extend it with the mistakes you see.` },
    { type: "list", items: [
      "**Weakened tests:** assertions removed, a test deleted, or one added with a skip marker so that the run goes green.",
      "**Silenced checks:** \`# noqa\`, \`# type: ignore\`, an exception caught and ignored.",
      "**Scope creep:** files changed that the task never mentioned.",
      "**New dependencies:** a package added to solve a small problem (and agents sometimes invent package names; Chapter 43).",
      "**Guard-rail files:** CI settings, permission settings, hooks and the Dockerfile are where an agent can quietly remove the checks that would catch it.",
      "**Secrets and debug output:** keys pasted in, \`print\` or \`breakpoint()\` left behind."
    ]},
    { type: "code", file: "code-samples/ch39/diff_review.py", lang: "python", code: "@ch39/diff_review.py",
      note: "Reads a unified diff on stdin: git diff | python diff_review.py --allow src/. Exit code 2 means at least one BLOCK finding, so it can fail a CI job." },
    { type: "code", lang: "bash", code: "python demo_ch39.py   # part 2",
      output: `BLOCK .github/workflows/ci.yml: this file controls checks, permissions or deployment. A human must read every line.
BLOCK tests/test_triage.py: 1 assertion line(s) removed, only 0 added: tests were weakened.
WARN  .github/workflows/ci.yml: outside the allowed scope ['src/', 'tests/']. Was it part of the task?
WARN  requirements.txt: outside the allowed scope ['src/', 'tests/']. Was it part of the task?
WARN  requirements.txt: dependency file changed (1 line(s) added). Is each package real, wanted and licensed? (Chapter 43)
WARN  src/triage.py: an exception is caught and ignored (except ...: pass).
WARN  tests/test_triage.py: added a way to silence a check: @pytest.mark.skip
INFO  src/triage.py: debug output left in: print("debug", msg)`,
      note: "Real output. The diff was staged by hand in a throwaway git repository to exercise every rule; it is not from a real coding agent. Notice what it shows: the 'fix' skipped the test that guards emergency routing." },
    { type: "section", label: "What the tool cannot do" },
    { type: "text", md: `It cannot tell you the change is **correct**. It never runs the code, and it knows nothing about your design. A clean report means only "none of these cheap patterns appeared". Keep these for yourself:` },
    { type: "list", items: [
      "**Does it do what was asked, and nothing else?** Compare the diff with the plan you approved.",
      "**Is it the simplest change?** Agents often add layers, options and helpers nobody needed.",
      "**Would a new teammate understand it?** Names, comments, structure.",
      "**What happens at the edges?** Empty input, a missing record, a very long message, a patient with two UHIDs.",
      "**A second pair of eyes that did not write it.** Claude Code's best-practices page recommends a fresh session or subagent for review, and documents a \`/code-review\` command that reviews the diff in a subagent that never saw the conversation. I have not run that command; the idea works with any tool: start a clean session and ask it to review the diff against your plan."
    ]},
    { type: "quiz", title: "Knowledge check: reviewing", questions: [
      { kind: "mcq", q: "The agent reports 'tests pass now'. Your diff reviewer shows a BLOCK: assertion lines were removed from a test file. What do you do?",
        options: ["Accept: tests pass", "Reject or send it back: the green may come from weaker tests", "Delete the reviewer", "Ask the agent to add emphasis to the instructions"],
        answer: 1,
        why: ["Passing weaker tests proves less.", "Right: a test that was loosened to go green is a failure hidden, not fixed.", "The reviewer found a real pattern.", "Emphasis does not fix this."] },
      { kind: "match", q: "Match the finding to the risk.",
        pairs: [["@pytest.mark.skip added", "A check is silenced"], ["requirements.txt changed", "A new, possibly invented, dependency"], [".github/workflows/ci.yml changed", "The guard rails themselves changed"], ["print(...) left in", "Debug output in production code"]] },
      { kind: "tf", q: "If diff_review.py prints no findings, the change is correct.", answer: false,
        explain: " It checks a few mechanical patterns. It does not run the code or judge the design." }
    ]}
  ]},

  { title: "Production: when a session goes wrong", blocks: [
    { type: "section", label: "Patterns and their fixes" },
    { type: "text", md: `Claude Code's best-practices page lists the ways sessions typically go wrong. They are not specific to one tool, and each has a cheap fix.` },
    { type: "list", items: [
      "**The kitchen-sink session:** one conversation that wanders across unrelated tasks. The old context hurts and costs money on every message. Start a fresh session for each task (in Claude Code, \`/clear\`).",
      "**Correcting the same thing over and over:** after two failed corrections the conversation contains two wrong attempts for the agent to keep re-reading. The page advises starting fresh with one better prompt that folds in what you learned.",
      "**The over-long instruction file:** important rules get lost. Prune it, and move anything that must never be broken into a hook.",
      "**Trusting without verifying:** code that looks right but misses edge cases. Fix: give a check to run (the loop above) and review the diff.",
      "**Endless exploration:** 'investigate this' with no limit makes the agent read hundreds of files. Scope the question, or hand the reading to a subagent (Chapter 42) so only a summary comes back."
    ]},
    { type: "section", label: "Advice that aged out" },
    { type: "text", md: `The same page has a table of advice that was good once and is now unnecessary because the models improved. Two entries are worth knowing, because old blog posts still repeat them: **adding IMPORTANT or ALL CAPS** to instructions the model keeps missing (current models follow plain wording; emphasis can make them over-apply), and **describing your architecture and file layout** in the instruction file (the agent reads the repository itself). If you inherit an instruction file full of these, the linter below will point at them.` },
    { type: "code", file: "code-samples/ch39/lint_instructions.py", lang: "python", code: "@ch39/lint_instructions.py" },
    { type: "code", lang: "bash", code: "python lint_instructions.py demo/bad/CLAUDE.md --root ../..",
      output: `WARN file     [no-commands] No command for running tests or checks. That one line lets the agent verify its own work.
INFO line 3   [emphasis] 5 lines shout. Current models follow plain wording; a rule that truly cannot bend belongs in a hook or deny rule (Chapter 41).
INFO line 3   [vague] 'write clean code' gives the agent nothing to act on. Say what to do in this repository.
INFO line 3   [vague] 'follow best practices' gives the agent nothing to act on. Say what to do in this repository.
INFO line 6   [vague] 'be careful' gives the agent nothing to act on. Say what to do in this repository.
INFO line 10  [derivable] 10 lines describe the folder layout. The agent reads the repository itself; keep only what the code does not show.
WARN line 7   [missing-file] \`code-samples/ch27/triage_v2.py\` is not in the repository.
WARN line 5   [contradiction] Line 5 may contradict line 4. When two rules disagree the agent may pick either.`,
      note: "Real output on a deliberately bad file. The 'contradiction' is a heuristic: it noticed two lines about type hints that point opposite ways (line 5 'never ... in quick scripts' may be a fair exception, which is why it says 'may')." },
    { type: "callout", kind: "tip", md: "**The linter found real mistakes in my own starter file.** My first draft of AGENTS.md named \`tools.py\` and \`config.py\` without their folder; the linter reported them as missing files, and an agent started elsewhere would have hit the same confusion. Fixing it took a minute. Run the linter in CI so instruction files cannot rot unnoticed (Chapter 43)." },
    { type: "section", label: "Treat it like any other change to the system" },
    { type: "list", items: [
      "**Review instruction files in pull requests.** They steer every session.",
      "**Measure, do not guess.** Pick five real tasks from your backlog. Run each with the old instructions and the new, and compare: did the checks pass, how many corrections, how many tokens (Chapter 40). This is Chapter 31's evaluation idea applied to your own workflow. I have described the method; I have not run it for you.",
      "**Keep a short list of 'agent mistakes we saw'** and turn each repeated one into a line, a hook or a test."
    ]},
    { type: "list", style: "mistakes", items: [
      "Generating a big CLAUDE.md with a command and never pruning it.",
      "Letting the agent write the tests and the code in one go with no failing test first.",
      "Accepting a diff you did not read because the tests were green.",
      "Putting a rule that must never break only in prose.",
      "A new session for every tiny step, or one session for the whole week."
    ]},
    { type: "quiz", title: "Knowledge check: production habits", questions: [
      { kind: "mcq", q: "You have corrected the agent twice and it still gets the same thing wrong. What does best practice suggest?",
        options: ["Correct it a third time, louder", "Start a fresh session with one prompt that includes what you learned", "Add IMPORTANT to every line of the instruction file", "Switch off the tests"],
        answer: 1,
        why: ["The conversation now holds two failed attempts to re-read.", "Right: a clean context plus a better prompt usually beats a third correction.", "Emphasis rarely helps and can backfire.", "That removes the evidence."] },
      { kind: "tf", q: "An instruction file should describe your whole folder layout so the agent does not get lost.", answer: false,
        explain: " The agent reads the repository itself. Keep only what the code does not show." },
      { kind: "mcq", q: "How would you know whether a change to your instruction file helped?",
        options: ["It feels better", "Run the same few real tasks before and after and compare check results, corrections and tokens", "Count the lines", "Ask the agent"],
        answer: 1,
        why: ["Feelings drift.", "Right: it is an evaluation like Chapter 31, on your own tasks.", "Shorter is not automatically better.", "The agent cannot grade its own instructions fairly."] }
    ]}
  ]}

  ]
};
})();
