/* Chapter 4 · Python setup for AI */
(function () {

var TIMELINE_SVG = `
<svg viewBox="0 0 680 230" xmlns="http://www.w3.org/2000/svg">
  <text class="dg-title" x="20" y="24">Sequential: wait for each reply before sending the next</text>
  <g data-step="seq">
    <rect class="dg-box accent" x="20" y="36" width="120" height="26" rx="4"/><text class="dg-text" x="80" y="54" text-anchor="middle">call 1</text>
    <rect class="dg-box accent" x="144" y="36" width="120" height="26" rx="4"/><text class="dg-text" x="204" y="54" text-anchor="middle">call 2</text>
    <rect class="dg-box accent" x="268" y="36" width="120" height="26" rx="4"/><text class="dg-text" x="328" y="54" text-anchor="middle">call 3</text>
    <rect class="dg-box accent" x="392" y="36" width="120" height="26" rx="4"/><text class="dg-text" x="452" y="54" text-anchor="middle">call 4</text>
    <text class="dg-muted" x="522" y="54">≈ 4 × one call</text>
  </g>
  <text class="dg-title" x="20" y="104">Concurrent: send all, wait once</text>
  <g data-step="conc">
    <rect class="dg-box amber" x="20" y="116" width="120" height="22" rx="4"/><text class="dg-text" x="80" y="132" text-anchor="middle">call 1</text>
    <rect class="dg-box amber" x="24" y="142" width="132" height="22" rx="4"/><text class="dg-text" x="90" y="158" text-anchor="middle">call 2</text>
    <rect class="dg-box amber" x="22" y="168" width="110" height="22" rx="4"/><text class="dg-text" x="77" y="184" text-anchor="middle">call 3</text>
    <rect class="dg-box amber" x="26" y="194" width="126" height="22" rx="4"/><text class="dg-text" x="89" y="210" text-anchor="middle">call 4</text>
    <text class="dg-muted" x="170" y="168">≈ the slowest single call</text>
  </g>
</svg>`;

window.COURSE.chapters.ch04 = {
  id: "ch04",
  title: "Python setup for AI",
  oneLine: "A clean, repeatable Python setup (one environment per project, secrets out of code, Git from day one, and concurrency where it pays) saves hours on every project that follows.",
  lessons: [

  { title: "A clean Python setup", blocks: [
    { type: "section", label: "The problem" },
    { type: "text", md: `"It works on my laptop" is the most common bug in AI projects. Different Python versions, packages installed globally, a library upgraded for one project that breaks another. Ten minutes of setup avoids days of confusion.` },
    { type: "section", label: "Step 1: one Python version you control" },
    { type: "text", md: `Use **Python 3.11 or newer**. If your computer has an older system Python, don't replace it; install a separate one:

| Option | Best for | Command |
| --- | --- | --- |
| python.org installer | Windows, beginners | Download 3.12 and tick "Add to PATH" |
| pyenv | Mac and Linux; several versions side by side | \`pyenv install 3.12\` then \`pyenv local 3.12\` |
| conda / Miniconda | Data science teams already using it | \`conda create -n clinic python=3.12\` |` },
    { type: "section", label: "Step 2: one virtual environment per project" },
    { type: "text", md: `A **virtual environment** is a private folder of packages for one project. Upgrading a library in one project can then never break another.` },
    { type: "code", file: "terminal", lang: "bash", code: `mkdir clinic-helpdesk && cd clinic-helpdesk
python -m venv .venv                 # create the environment (once)
source .venv/bin/activate            # Mac/Linux: activate it (every new terminal)
.venv\\Scripts\\activate               # Windows
pip install openai anthropic python-dotenv pydantic
pip freeze > requirements.txt        # record exact versions
# later, on another machine:
pip install -r requirements.txt` },
    { type: "callout", kind: "tip", md: `Your prompt shows \`(.venv)\` when the environment is active. If \`import openai\` fails in a project where you installed it, the environment is usually not active, or your editor is using a different Python.` },
    { type: "section", label: "Step 3: a project layout that grows" },
    { type: "code", file: "clinic-helpdesk/", lang: "bash", code: `clinic-helpdesk/
├── .venv/               # the virtual environment (never committed)
├── .env                 # your API keys (never committed)
├── .env.example         # the same keys with blank values (committed)
├── .gitignore
├── requirements.txt     # pinned package versions
├── README.md            # how to set up and run
├── app/
│   ├── llm.py           # the one place that talks to model providers
│   ├── tools.py         # your agent's tools
│   ├── agent.py         # the agent loop
│   └── api.py           # the web API (Chapter 5)
├── tests/
│   └── test_api.py
└── notebooks/           # experiments only; move good code into app/` },
    { type: "section", label: "Step 4: an editor and notebooks" },
    { type: "text", md: `- **VS Code** with the Python and Jupyter extensions. Select your \`.venv\` interpreter (bottom-right corner), and the editor, terminal and notebooks all use the same packages.
- **Jupyter** is great for trying prompts and looking at results. Move anything you keep into \`.py\` files: notebooks are hard to test, review and run in production.
- **No laptop:** Google Colab runs Python in the browser. Store keys under its Secrets panel, not in a cell.` },
    { type: "section", label: "Check your setup" },
    { type: "code", file: "code-samples/ch04/check_setup.py", lang: "python", code: "@ch04/check_setup.py",
      output: `OK  Python 3.12
OK  Virtual environment active
OK  openai installed
OK  anthropic installed
OK  dotenv installed
OK  pydantic installed
OK  .env found at /home/asha/clinic-helpdesk/.env
OK  PROVIDER=openai; OPENAI_API_KEY set (164 characters, starts with 'sk-')
OK  .env is listed in .gitignore

All good. You are ready.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Use Python 3.11+ installed separately from the system Python.",
      "One virtual environment per project; pin versions in requirements.txt.",
      "Keep a simple project layout: app code, tests, notebooks for experiments only.",
      "Run a setup check before debugging anything else."
    ]},
    { type: "quiz", title: "Knowledge check: a clean setup", questions: [
      { kind: "mcq", q: "Why use a virtual environment for each project?",
        options: ["It makes Python faster", "Each project gets its own packages, so upgrades in one cannot break another", "It hides your API keys", "It is required by OpenAI"],
        answer: 1,
        why: ["No speed difference.", "Right.", "That is .env and .gitignore.", "No provider requires it."] },
      { kind: "order", q: "Put first-time project setup in order.",
        items: ["Create the folder", "Create the virtual environment", "Activate it", "Install packages", "Freeze versions to requirements.txt"] },
      { kind: "tf", q: "Notebooks are the best place to keep your production agent code.", answer: false,
        explain: " Use notebooks to experiment; move code you keep into .py files that can be tested and deployed." }
    ]}
  ]},

  { title: "Secrets and Git", blocks: [
    { type: "section", label: "The problem" },
    { type: "text", md: `An API key is a password that spends money. Keys pasted into code end up in Git, then on GitHub, where automated bots find them within minutes. The fix is a habit you set up once.` },
    { type: "section", label: "Keys live in .env" },
    { type: "code", file: ".env  (never committed)", lang: "bash", code: `PROVIDER=openai
OPENAI_API_KEY=sk-...your key...
ANTHROPIC_API_KEY=sk-ant-...your key...` },
    { type: "code", file: "reading keys in Python", lang: "python", code: `from dotenv import load_dotenv
import os

load_dotenv()                                   # reads .env into environment variables
key = os.getenv("OPENAI_API_KEY")               # the SDKs read this automatically too
if not key:
    raise SystemExit("OPENAI_API_KEY is missing. Copy .env.example to .env and add it.")` },
    { type: "text", md: `Commit a **\`.env.example\`** with the same names and empty values, so others know which keys they need. In production, the hosting platform injects the same variables (Chapter 36); the code does not change.` },
    { type: "section", label: "Git from day one" },
    { type: "text", md: `Git records every change, so you can see what changed, undo mistakes and share work. Create \`.gitignore\` **before** your first commit:` },
    { type: "code", file: "code-samples/ch04/gitignore.txt  (save as .gitignore)", lang: "bash", code: "@ch04/gitignore.txt" },
    { type: "code", file: "terminal", lang: "bash", code: `git init                                  # start tracking this folder
git add .gitignore requirements.txt app/  # choose what to save
git status                                # check .env is NOT listed
git commit -m "Clinic helpdesk: first working agent"
git checkout -b better-prompt             # try an idea on a branch
# ...edit, test...
git commit -am "Few-shot prompt: 100% on test set, 0 missed emergencies"
git checkout main && git merge better-prompt
git remote add origin https://github.com/<you>/clinic-helpdesk.git
git push -u origin main` },
    { type: "callout", kind: "warning", title: "If a key leaks", md: `Deleting the file or the commit is **not enough**: the key is still in Git history and may already be copied. **Revoke the key immediately** in your provider's dashboard and create a new one. Then clean up the history.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "API keys go in .env, read with python-dotenv; never in code.",
      "Create .gitignore (with .env) before the first commit.",
      "Commit a .env.example so others know which keys are needed.",
      "A leaked key must be revoked, not just deleted."
    ]},
    { type: "quiz", title: "Knowledge check: secrets and Git", questions: [
      { kind: "mcq", q: "You pushed a key to a public repo, then deleted the file in a new commit. Are you safe?",
        options: ["Yes, the file is gone", "No: the key is still in history and may be copied; revoke it now", "Yes, if the repo is renamed", "Only if nobody starred the repo"],
        answer: 1,
        why: ["Git keeps history.", "Right.", "Renaming does not remove history.", "Bots scan automatically."] },
      { kind: "tf", q: ".env.example should contain your real keys so teammates can run the code.", answer: false,
        explain: " It lists the variable names with empty values. Each person uses their own .env." }
    ]}
  ]},

  { title: "Many calls at once: asyncio", blocks: [
    { type: "section", label: "The problem" },
    { type: "text", md: `Each model call spends most of its time **waiting** for the provider. Classifying 1,000 overnight helpdesk messages one by one at 1.5 seconds each takes 25 minutes, during which your computer is almost idle.` },
    { type: "diagram", svg: TIMELINE_SVG, caption: "Waiting time overlaps when calls run concurrently." },
    { type: "section", label: "asyncio in three ideas" },
    { type: "text", md: `- **\`async def\`** defines a function that can pause while it waits for the network.
- **\`await\`** is where it pauses. While one call waits, Python runs others.
- **\`asyncio.gather(...)\`** starts many and waits for all, returning results in the same order as the inputs.

Add two production safeguards:

- **A semaphore** caps how many calls run at once. Providers limit requests and tokens per minute; 1,000 calls at once just earns 1,000 "429 Too Many Requests" errors.
- **Retries with backoff:** wait 1 s, 2 s, 4 s (plus a little randomness) before retrying a failed call.` },
    { type: "code", file: "code-samples/ch04/concurrent_calls.py", lang: "python", code: "@ch04/concurrent_calls.py",
      output: `appointment  Message 1: Can I see Dr Rao on Friday?
billing      Message 2: I was charged twice.
other        Message 3: The lift is broken.
emergency    Message 4: My father has chest pain.
...
Sequential: 11.8 s   Concurrent: 2.6 s   Speed-up: 4.5x`,
      note: "Illustrative timings. Tested with a stand-in model that waits 50 ms per call: 4.9x faster with 5 calls at a time." },
    { type: "text", md: `When to use it: **batches** (classify, summarise, evaluate many items) and **independent tool calls** inside one agent step. When not to: steps that depend on each other's results must still run in order.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Model calls are mostly waiting, so running them concurrently saves a lot of time.",
      "Use async functions, await and asyncio.gather; results keep their order.",
      "Always cap concurrency with a semaphore and retry with backoff.",
      "Only independent calls can run at the same time."
    ]},
    { type: "quiz", title: "Knowledge check: asyncio", questions: [
      { kind: "mcq", q: "You run 1,000 classification calls with `gather` and no semaphore. What is the likely result?",
        options: ["Everything finishes in one second", "Many calls fail with rate-limit errors", "Python crashes", "Results come back in random order"],
        answer: 1,
        why: ["Providers limit request rates.", "Right: cap concurrency.", "Not usually.", "gather keeps input order."] },
      { kind: "tf", q: "An agent's step 2 needs the result of step 1, so they can run concurrently to save time.", answer: false,
        explain: " Dependent steps must run in order; only independent calls can overlap." }
    ]}
  ]},

  { title: "Production habits", blocks: [
    { type: "section", label: "One place that talks to models" },
    { type: "text", md: `Every chapter from here uses one small helper file, \`llm.py\`. Keeping all provider code in one place means you change models, providers, timeouts and retries **once**, not in fifty scripts.` },
    { type: "code", file: "code-samples/llm.py", lang: "python", code: "@common/llm.py",
      note: "Tested against the real OpenAI and Anthropic SDK response types: chat, streaming and async, for both providers." },
    { type: "text", md: `Production details built in:

- **Provider switch.** \`PROVIDER=openai\` or \`anthropic\` in \`.env\`; every script follows.
- **Timeouts.** The SDKs wait a long time by default. Thirty seconds per call stops one stuck request hanging a patient's chat.
- **Retries.** Both SDKs retry rate limits and server errors themselves when \`max_retries\` is set.
- **Token counts returned** with every reply, so cost can be tracked (Chapter 2).
- **One client per provider**, created once and reused (creating clients repeatedly wastes time).` },
    { type: "section", label: "Habits that pay off" },
    { type: "text", md: `| Habit | Why | How |
| --- | --- | --- |
| Configuration in environment variables | Same code in dev and production | \`.env\` locally, platform settings in production |
| Pinned versions | Upgrades don't surprise you | \`requirements.txt\` with exact versions |
| Logging, not print | Searchable records with time and level | \`logging.info(...)\`; never log keys or patient details |
| Tests with a fake model | Fast, free, no key needed | Replace \`llm.chat\` in tests (Chapter 5) |
| A README | Anyone can run it, including you in 6 months | Setup, run, test, environment variables |
| Small commits | Easy to review and undo | One change per commit, with a reason |` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Put all model-provider code in one helper with timeouts, retries and a provider switch.",
      "Configuration comes from the environment, never hard-coded.",
      "Log with the logging module and never log secrets or personal data.",
      "Test with a fake model so tests are fast and free."
    ]},
    { type: "quiz", title: "Knowledge check: production habits", questions: [
      { kind: "mcq", q: "Why set a 30-second timeout on model calls?",
        options: ["To save tokens", "So one stuck request cannot hang the user's request for minutes", "Providers require it", "To make answers shorter"],
        answer: 1,
        why: ["Tokens are not affected.", "Right.", "They do not.", "Unrelated."] },
      { kind: "tf", q: "It is fine to log full patient messages and API keys at DEBUG level.", answer: false,
        explain: " Logs are widely accessible and kept long. Never log secrets, and mask personal data." }
    ]}
  ]}
  ]
};
})();
