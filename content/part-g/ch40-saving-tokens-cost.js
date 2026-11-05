/* Chapter 40 · Saving tokens and cost */
(function () {

var STACK_SVG = `
<svg viewBox="0 0 680 262" xmlns="http://www.w3.org/2000/svg">
  <g data-step="top"><rect class="dg-box" x="10" y="10" width="300" height="38" rx="8"/><text class="dg-text" x="22" y="34">System prompt and tool definitions</text></g>
  <g data-step="instr"><rect class="dg-box" x="10" y="54" width="300" height="38" rx="8"/><text class="dg-text" x="22" y="78">Instruction files and memory (CLAUDE.md)</text></g>
  <g data-step="mcp"><rect class="dg-box" x="10" y="98" width="300" height="38" rx="8"/><text class="dg-text" x="22" y="122">MCP tool names, skill descriptions</text></g>
  <g data-step="history"><rect class="dg-box" x="10" y="142" width="300" height="38" rx="8"/><text class="dg-text" x="22" y="166">The conversation so far</text></g>
  <g data-step="new"><rect class="dg-box amber" x="10" y="186" width="300" height="38" rx="8"/><text class="dg-text" x="22" y="210">New message and fresh tool results</text></g>
  <path class="dg-accent-line" d="M322 12V182" stroke-width="3" fill="none"/>
  <text class="dg-title" x="336" y="38">Unchanged beginning</text>
  <text class="dg-text" x="336" y="60">Sent again every turn, but read from the</text>
  <text class="dg-text" x="336" y="80">cache at a small fraction of the price.</text>
  <path class="dg-line" d="M322 188V224" stroke-width="3" fill="none"/>
  <text class="dg-title" x="336" y="206">New at the end</text>
  <text class="dg-text" x="336" y="226">Written to the cache at a small premium.</text>
  <text class="dg-muted" x="10" y="252">The cache matches from the start, so changing anything near the top invalidates everything after it.</text>
</svg>`;

var BARS_SVG = `
<svg viewBox="0 0 680 232" xmlns="http://www.w3.org/2000/svg">
  <g data-step="base"><text class="dg-text" x="10" y="28">Baseline (Sonnet, cached)</text><rect class="dg-box accent" x="250" y="12" width="68" height="22" rx="4"/><text class="dg-title" x="326" y="29">$0.69</text></g>
  <g data-step="nocache"><text class="dg-text" x="10" y="64">No prompt caching</text><rect class="dg-box amber" x="250" y="48" width="400" height="22" rx="4"/><text class="dg-title" x="640" y="65" text-anchor="end">$4.05</text></g>
  <g data-step="trim"><text class="dg-text" x="10" y="100">CLAUDE.md trimmed</text><rect class="dg-box accent" x="250" y="84" width="63" height="22" rx="4"/><text class="dg-title" x="321" y="101">$0.64</text></g>
  <g data-step="idle"><text class="dg-text" x="10" y="136">One 10-minute break</text><rect class="dg-box" x="250" y="120" width="83" height="22" rx="4"/><text class="dg-title" x="341" y="137">$0.84</text></g>
  <g data-step="opus"><text class="dg-text" x="10" y="172">Opus instead of Sonnet</text><rect class="dg-box" x="250" y="156" width="135" height="22" rx="4"/><text class="dg-title" x="393" y="173">$1.37</text></g>
  <g data-step="haiku"><text class="dg-text" x="10" y="208">Haiku instead of Sonnet</text><rect class="dg-box accent" x="250" y="192" width="4" height="22" rx="2"/><text class="dg-title" x="262" y="209">$0.04</text></g>
</svg>`;

window.COURSE.chapters.ch40 = {
  id: "ch40",
  title: "Saving tokens and cost",
  oneLine: "A coding agent resends your whole conversation on every turn, so cost grows with context. You will see where the tokens go, measure them with a small repository scanner and a cost model built from Anthropic's published prices, and apply the habits and hooks that really save money, including one documented hook that I found hides the reason a test failed.",
  lessons: [

  { title: "Where the tokens go", blocks: [
    { type: "section", label: "The agent resends everything, every turn" },
    { type: "text", md: `A model has no memory between requests (Chapter 2). So on every turn a coding agent sends the **whole conversation again**: the instructions, the tool list, everything you and the agent have said, every file it read, every command output. If a session has read 40 files, the 41st request carries all 40.

That is why a coding agent's cost is driven less by how much it writes and more by **how long the context is and how many turns it takes**. Claude Code's costs page (read 5 November 2026) puts it this way: token costs scale with context size, so the strategies are all ways of keeping the context small.` },
    { type: "diagram", svg: STACK_SVG, caption: "What a request carries. The top layers rarely change, which is what makes caching work." },
    { type: "section", label: "Prompt caching in one minute" },
    { type: "text", md: `Providers offer [[prompt caching]]: if the **beginning** of a request is identical to a recent one, the provider reads it from a cache instead of processing it again, at a much lower price. Anthropic's pricing page (read 5 November 2026) gives the multipliers relative to the normal input price:

| Operation | Price multiplier |
| --- | --- |
| Write to the cache, kept 5 minutes | 1.25 × |
| Write to the cache, kept 1 hour | 2 × |
| Read from the cache (a "hit") | 0.1 ×, but 0.05 × on Opus 5.5 and Sonnet 5.5 and 0.025 × on Fable 5.1 |

And the base prices for the models used in this course's examples, in US dollars per million tokens:

| Model | Input | Output | Cache read |
| --- | --- | --- | --- |
| Haiku 5.5 | 0.10 (prompts up to 100K tokens) | 0.50 | 0.01 |
| Sonnet 5.5 | 2.00 | 10.00 | 0.10 |
| Opus 5.5 | 4.00 | 20.00 | 0.20 |
| Fable 5.1 | 10.00 | 50.00 | 0.25 |

These change. The file \`prices.json\` in the code folder records them with the date, so you can update one place. A subscription plan is billed differently from the API, but the same mechanics (long context costs more, the cache expires) decide how fast you use up the plan's allowance.` },
    { type: "text", md: `Claude Code's caching page lists what **breaks** the cache (so the next request pays full price again): changing the model mid-session, adding or removing an MCP server whose tools are loaded upfront, compacting the conversation, upgrading the program, and **waiting longer than the cache lifetime** (5 minutes or 1 hour, depending on how you sign in and your settings). Editing a file in your repository does not break it, and neither does editing CLAUDE.md mid-session (the edit simply is not picked up until you clear or restart).` },
    { type: "quiz", title: "Knowledge check: where tokens go", questions: [
      { kind: "mcq", q: "Why does a long session cost more per message than a fresh one?",
        options: ["The model gets slower and charges more per word", "Every request carries the whole conversation so far", "Long sessions use a different price list", "Output tokens are charged twice"],
        answer: 1,
        why: ["Price per token is the same.", "Right: context grows, and the whole context is sent each turn.", "Same price list (apart from a long-prompt tier on some models).", "They are charged once."] },
      { kind: "match", q: "Match the operation to its price relative to normal input.",
        pairs: [["Cache read on Sonnet 5.5", "0.05 ×"], ["Cache write, 5-minute", "1.25 ×"], ["Cache write, 1-hour", "2 ×"], ["No caching", "1 × for the whole context, every turn"]] },
      { kind: "tf", q: "Coming back after a long break can make your first message cost more, because the cache has expired.", answer: true,
        explain: " The next request must write the whole context to the cache again at the write price." }
    ]}
  ]},

  { title: "Measure before you optimise", blocks: [
    { type: "section", label: "Step 1: what would reading this repository cost?" },
    { type: "text", md: `Most of the waste is invisible until you count it. \`ctx_budget.py\` walks a folder, skips what an agent should never read (dependencies, build output, data files, images) and estimates tokens per file. It also adds up the instruction files that are carried in every request.` },
    { type: "callout", kind: "warning", md: "**It estimates, it does not count.** I use about 3.5 characters per token for code and 4 for prose. Each vendor's tokenizer gives a different number (my own attempt to use OpenAI's tokenizer library was blocked in this environment, so I could not compare). Trust it to find the big files, not to the last digit. For exact numbers, read the token counts in a real response or use the provider's token-counting endpoint." },
    { type: "code", file: "code-samples/ch40/ctx_budget.py", lang: "python", code: "@ch40/ctx_budget.py" },
    { type: "code", lang: "bash", code: "cd code-samples/ch40\npython ctx_budget.py ../ch27 --top 5",
      output: `12 text files, about 10,484 tokens if an agent read all of them (it should not).

    2,816  helpdesk.py
    1,945  fake_models.py
    1,342  test_helpdesk.py
      792  tools.py
      655  safety.py
  ... and 7 smaller files

Instruction files carried in every request: about 0 tokens`,
      note: "Real output. The helpdesk is small (about 10,000 tokens), so reading it all is affordable; a repository 50 times larger is not. The last line is 0 because ch27 has no instruction file yet. Chapter 39's starter files add about 400 tokens to every request, which is cheap because cached reads cost a fraction of normal input." },
    { type: "section", label: "Step 2: a cost model you can change" },
    { type: "text", md: `\`cost_model.py\` simulates a session turn by turn: the start-up context, tokens added per turn (file reads, command output), the reply, and the cache rules above. It is a **teaching model**: it leaves out thinking tokens (billed as output, so real sessions cost more), the long-prompt surcharge and 1-hour caching, and uses the list prices in \`prices.json\`. Use it to compare habits, not to predict your bill.` },
    { type: "code", file: "code-samples/ch40/cost_model.py", lang: "python", code: "@ch40/cost_model.py" },
    { type: "code", lang: "bash", code: "python cost_model.py",
      output: `baseline: Sonnet, 20k start, 30 turns, cached $   0.69  (100% of the first row)
same, but caching is not used                $   4.05  (589% of the first row)
same, CLAUDE.md trimmed (start 12k, not 20k) $   0.64  ( 94% of the first row)
same, one 10-minute break at turn 16         $   0.84  (122% of the first row)
same, on Opus 5.5                            $   1.37  (200% of the first row)
same, on Haiku 5.5                           $   0.04  (  6% of the first row)

two tasks in ONE 60-turn session             $   1.60  (100% of the first row)
two tasks, /clear between them (at turn 30)  $   1.34  ( 84% of the first row)`,
      note: "Real output of the model with its stated assumptions (30 turns, 3,000 new tokens and 800 output tokens per turn). The model's numbers are what the maths gives; your sessions will differ." },
    { type: "diagram", svg: BARS_SVG, caption: "The same 30-turn session under different habits (from the model above)." },
    { type: "text", md: `Read the results as an ordering, not as dollars:

- **Caching is worth more than any habit** (about 6 times here), and it is automatic. Your job is mostly to *not break it*.
- **The model you choose** changes the bill more than trimming (Haiku about 6% of Sonnet, Opus 2×), so match the model to the job.
- **Clearing between unrelated tasks** saves because a long, stale context is re-read on every later turn: 16% in the 60-turn example.
- **A trimmed instruction file** saves a few percent in this model, because cached reads are cheap. Its bigger benefit is quality: shorter files get followed better (Chapter 39).
- **Idle gaps** cost real money (22% here for one break) when each turn is large. Finish a task in one sitting if you can.` },
    { type: "quiz", title: "Knowledge check: measuring", questions: [
      { kind: "mcq", q: "In the cost model, which change saves the most?",
        options: ["Trimming CLAUDE.md by 8,000 tokens", "Keeping prompt caching working instead of turning it off", "Running /clear once", "Taking a break"],
        answer: 1,
        why: ["It saves about 6%.", "Right: without caching the same session costs about six times more.", "It saves about 16% in the longer example, less than caching.", "Breaks add cost."] },
      { kind: "tf", q: "ctx_budget.py gives exact token counts for any model.", answer: false,
        explain: " It estimates from character counts. Use the provider's counts for exact numbers." },
      { kind: "mcq", q: "Why are the model's dollar figures not a forecast of your bill?",
        options: ["The prices are invented", "It omits thinking tokens and other details and uses assumed turn sizes", "It is written in Python", "Dollars cannot be modelled"],
        answer: 1,
        why: ["The prices are from the published list, dated.", "Right: use it to compare habits, then measure real sessions.", "Language does not matter.", "They can, with stated assumptions."] }
    ]}
  ]},

  { title: "Habits that save the most", blocks: [
    { type: "section", label: "From the Claude Code costs page (read 5 November 2026)" },
    { type: "text", md: `The commands below are Claude Code's; other tools have equivalents, so look for the idea. For each habit I give the reason, and say where my cost model confirms it.` },
    { type: "list", items: [
      "**Clear between unrelated tasks** (\`/clear\`). 'Stale context wastes tokens on every subsequent message.' It costs nothing. Rename the session first (\`/rename\`) if you want to come back to it (\`/resume\`).",
      "**Compact with instructions** (\`/compact Focus on test output and code changes\`), or write a 'Compact instructions' section in CLAUDE.md, so the summary keeps what you need. Note that compacting reads the whole conversation, so compacting a huge context is itself a large request.",
      "**Choose the model for the job.** The page says Sonnet handles most coding tasks and costs less than Opus; keep Opus for hard design or multi-step reasoning, and give simple subagents \`model: haiku\`.",
      "**Lower the effort for easy tasks** (\`/effort\`). Thinking is billed as output tokens and the default budget can be tens of thousands of tokens per request on some models.",
      "**Write specific prompts.** 'Add input validation to the login function in auth.ts' reads two files; 'improve this codebase' reads hundreds.",
      "**Use plan mode** for anything non-trivial, so a wrong direction is caught before code exists. The page also advises pressing Escape the moment the agent drifts, and rewinding to a checkpoint.",
      "**Give verification targets** (a test, an expected output) so the agent corrects itself instead of waiting for you to ask.",
      "**Delegate noisy work to a subagent** (running tests, reading logs, fetching documentation) so only a summary returns to the main conversation. But the page is clear that each subagent sends its own requests and uses your allowance too.",
      "**Keep MCP lean.** Tool definitions are deferred by default (only names are loaded until used), and the page says command-line tools such as \`gh\`, \`aws\` and \`gcloud\` are still more context-efficient than an MCP server. Disable servers you are not using (\`/mcp\`).",
      "**Move rarely used instructions out of CLAUDE.md into skills.** A skill's description is always loaded, but its body only when the skill is used (Chapter 41)."
    ]},
    { type: "callout", kind: "tip", md: "**Look at your own numbers.** \`/usage\` in Claude Code shows session cost, token counts per model and the cache hit rate, and on subscription plans a breakdown by skill, subagent, plugin and MCP server with suggestions. Spend ten minutes there before changing habits: the largest line item is usually not the one you expect." },
    { type: "section", label: "What I could not verify" },
    { type: "text", md: `Two numbers above come only from reading the pages: the costs page's enterprise averages (Lesson 4) and the cache lifetimes. I have not measured a real Claude Code session here, so the cost model is the only measurement in this lesson, and it measures a simplified session.` },
    { type: "quiz", title: "Knowledge check: habits", questions: [
      { kind: "match", q: "Match each habit to the problem it avoids.",
        pairs: [["/clear between tasks", "Stale context re-read on every message"], ["Plan mode", "Expensive rework from a wrong first direction"], ["A subagent for test logs", "Noisy output filling the main conversation"], ["Disabling unused MCP servers", "Tool listings in context for nothing"]] },
      { kind: "mcq", q: "You need a quick rename across five files. Which setting fits best?",
        options: ["Opus with the highest effort", "A cheaper model at a low effort level", "No model at all", "A fresh session for each file"],
        answer: 1,
        why: ["Hard-reasoning setting for a simple job.", "Right: simple work does not need the most expensive model or deep thinking.", "A model is needed.", "Five sessions repeat the start-up cost five times."] },
      { kind: "tf", q: "Subagents are free because they run in their own context.", answer: false,
        explain: " Each subagent sends its own requests and counts against the same usage. They keep your main context clean, which is a different benefit." }
    ]}
  ]},

  { title: "Production: filters, budgets and team controls", blocks: [
    { type: "section", label: "Shrink noisy output before the agent reads it" },
    { type: "text", md: `Test logs, build logs and command output are the biggest uncontrolled input. The costs page documents a [[hook]] (your script that Claude Code runs before a tool call; Chapter 41) which rewrites a test command so only failures come back: \`cmd 2>&1 | grep -A 5 -E '(FAIL|ERROR|error:)' | head -100\`.

I ported that filter, then **tested it on real output from the helpdesk's tests**. It does save tokens, but it also has two problems the page does not mention.` },
    { type: "code", file: "code-samples/ch40/output_filter.py", lang: "python", code: "@ch40/output_filter.py" },
    { type: "code", lang: "bash", code: "python demo_filter.py",
      output: `run                                    raw    grep-style   pytest-style   keeps the 'E' reason?
helpdesk, passing, -q                   25             0              4   (no failure)
helpdesk, passing, -v                  442             0             20   (no failure)
3 folders (~40 tests), passing, -v     934             0             20   (no failure)
helpdesk, 1 rule broken, -q            460           153            301   grep: NO   pytest: yes
helpdesk, 1 rule broken, -v            918           422            358   grep: NO   pytest: yes

Tokens are estimates (~3.5 characters each).`,
      note: "Real output: the helpdesk's tests, run as they are and after I broke one rule (MAX_REPLY_WORDS = 3). 'E' lines are where pytest prints why an assertion failed." },
    { type: "list", items: [
      "**Problem 1: it dropped the reason.** The grep-style filter kept the failing test's *name* but not the line that says why (\`E   AssertionError: ...\`), because that line sits more than five lines after the match. An agent given only the name has to run the test again to learn the cause, spending what the filter saved. My \`pytest_style\` filter keeps the failure header, the \`>\` and \`E\` lines and the summary.",
      "**Problem 2: a passing run prints nothing.** With grep-style, 'all tests passed' returns an empty string: silence is ambiguous. The pytest-style filter always ends with the summary line.",
      "**Problem 3: the exit code is lost.** In a shell, \`a | b | c\` returns the status of the *last* command. With \`... | head -100\` a failing test run reports success. My hook adds \`set -o pipefail\` and the test confirms it; the grep pipeline from the page returns exit code 0 for a command that failed."
    ]},
    { type: "code", file: "code-samples/ch40/hooks/filter_test_command.py", lang: "python", code: "@ch40/hooks/filter_test_command.py",
      note: "Tested by sending it the JSON that the documentation describes and running the rewritten command in bash against a failing and a passing test. Not tested inside a real Claude Code session." },
    { type: "code", file: "code-samples/ch40/hooks/settings.example.json", lang: "json", code: "@ch40/hooks/settings.example.json",
      note: "Where it goes: .claude/settings.json in the project (shared) or settings.local.json (yours). In Claude Code, /hooks lists registered hooks so you can confirm it loaded." },
    { type: "section", label: "Budgets and team controls" },
    { type: "text", md: `For a team, the costs page (read 5 November 2026) says the average across enterprise deployments is about **$13 per developer per active day**, or **$150 to $250 per developer per month**, with costs below **$30 per active day for 90% of users**. It also warns that costs vary widely with model choice, codebase size and automation, and advises starting with a small pilot to set your own baseline. Controls differ by how you pay:` },
    { type: "list", items: [
      "**Subscription plans (Team, Enterprise):** each member draws from a seat allowance that resets on a rolling five-hour window and a weekly window; admins can add usage credits and set spend limits per organisation, group or person.",
      "**Claude Console (API):** workspace spend limits and a per-user dashboard. Anthropic's page suggests per-user rate limits that shrink as the team grows, for example 200k to 300k tokens per minute per user for a team of 1 to 5, and 10k to 15k for 500 or more, because fewer people are busy at once.",
      "**Amazon Bedrock, Google Cloud, Microsoft Foundry:** spend controls live in your cloud's billing console; for per-user numbers the page lists OpenTelemetry export (Chapter 32) or an LLM gateway.",
      "**In scripts and CI:** \`claude -p\` with \`--max-turns\` or \`--max-budget-usd\` puts a hard ceiling on one run (named on the best-practices page; I have not run it).",
      "**Agent teams** (several sessions working together) use roughly 7 times the tokens of a standard session when teammates run in plan mode, according to the page. Keep them small and short."
    ]},
    { type: "list", style: "mistakes", items: [
      "Optimising prompts by feel without looking at \`/usage\` first.",
      "Leaving the most expensive model as the default for everything.",
      "Letting one session run all day across many tasks.",
      "Installing a dozen MCP servers 'just in case'.",
      "Adding a clever output filter and never checking that it still shows why a test failed.",
      "A scheduled loop or background task that keeps sending the full context while nobody is watching."
    ]},
    { type: "quiz", title: "Knowledge check: production", questions: [
      { kind: "mcq", q: "Your output filter returns only the names of failing tests. What is the most likely consequence?",
        options: ["Tokens are saved with no downside", "The agent re-runs tests to find out why, spending what you saved", "The tests start passing", "Nothing, the exit code fixes it"],
        answer: 1,
        why: ["The cause is missing.", "Right: in our measurement the 'E' lines were dropped by the grep-style filter.", "Filtering changes the output, not the code.", "The grep pipeline even hides the exit code."] },
      { kind: "tf", q: "In a shell pipeline cmd | grep | head, the exit status is the status of cmd.", answer: false,
        explain: " It is the status of the last command (head) unless you set pipefail. Our test shows a failing command reporting 0." },
      { kind: "mcq", q: "How should a team set its first budget?",
        options: ["Copy the published average exactly", "Run a small pilot, track real usage, then set limits from that baseline", "Set no limit", "Use the model's cost simulation as a promise"],
        answer: 1,
        why: ["The page says averages vary widely.", "Right: the page itself recommends a pilot to establish a baseline.", "That risks surprises.", "The model is a teaching tool, not a forecast."] }
    ]}
  ]}

  ]
};
})();
