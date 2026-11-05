/* Chapter 20 · DSPy */
(function () {

var IDEA_SVG = `
<svg viewBox="0 0 680 230" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch20-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="hand"><text class="dg-title" x="20" y="26">Hand-written prompts</text>
    <rect class="dg-box" x="20" y="40" width="150" height="50" rx="10"/><text class="dg-text" x="95" y="70" text-anchor="middle">write prompt</text>
    <rect class="dg-box" x="200" y="40" width="130" height="50" rx="10"/><text class="dg-text" x="265" y="70" text-anchor="middle">try a few inputs</text>
    <rect class="dg-box" x="360" y="40" width="130" height="50" rx="10"/><text class="dg-text" x="425" y="70" text-anchor="middle">tweak wording</text>
    <path class="dg-line" d="M170 65H198" marker-end="url(#ch20-a)"/><path class="dg-line" d="M330 65H358" marker-end="url(#ch20-a)"/>
    <path class="dg-line" d="M425 90V104H95V92" marker-end="url(#ch20-a)"/><text class="dg-muted" x="510" y="70">by feel, repeat</text></g>
  <g data-step="dspy"><text class="dg-title" x="20" y="138">DSPy</text>
    <rect class="dg-box accent" x="20" y="150" width="130" height="56" rx="10"/><text class="dg-title" x="85" y="174" text-anchor="middle">signature</text><text class="dg-muted" x="85" y="192" text-anchor="middle">what, not how</text>
    <rect class="dg-box" x="175" y="150" width="120" height="56" rx="10"/><text class="dg-title" x="235" y="174" text-anchor="middle">module</text><text class="dg-muted" x="235" y="192" text-anchor="middle">strategy</text>
    <rect class="dg-box amber" x="320" y="150" width="140" height="56" rx="10"/><text class="dg-title" x="390" y="174" text-anchor="middle">metric + data</text><text class="dg-muted" x="390" y="192" text-anchor="middle">what "good" means</text>
    <rect class="dg-box accent" x="485" y="150" width="180" height="56" rx="10"/><text class="dg-title" x="575" y="174" text-anchor="middle">optimiser</text><text class="dg-muted" x="575" y="192" text-anchor="middle">finds the best prompt</text>
    <path class="dg-line" d="M150 178H173" marker-end="url(#ch20-a)"/><path class="dg-line" d="M295 178H318" marker-end="url(#ch20-a)"/><path class="dg-line" d="M460 178H483" marker-end="url(#ch20-a)"/></g>
</svg>`;

window.COURSE.chapters.ch20 = {
  id: "ch20",
  title: "DSPy: programming, not prompting",
  oneLine: "With DSPy you declare what each step should take in and give out, write a metric for \"correct\", and let an optimiser find the prompt and examples that score best, instead of tweaking prompt wording by hand.",
  lessons: [

  { title: "Signatures and modules", blocks: [
    { type: "section", label: "The idea" },
    { type: "stepper", svg: IDEA_SVG, caption: "Hand-tuning prompts versus DSPy.",
      steps: [
        { on: ["hand"], text: "The usual way: write a prompt, try it on a few messages, change some words, repeat. It is slow, done by feel, and starts again when you change models." },
        { on: ["dspy"], text: "**DSPy** (from Stanford) separates *what* from *how*. A **signature** says what goes in and out; a **module** picks a strategy; a **metric** on example data defines \"good\"; an **optimiser** searches for the instructions and examples that score best." }
      ]},
    { type: "callout", kind: "analogy", md: `Hand-written prompts are like tuning a machine by turning screws until it sounds right. DSPy is like giving the machine a test bench and letting it adjust itself until the readings are in range. You still design the machine and the test.` },
    { type: "code", file: "code-samples/ch20/dspy_basics.py", lang: "python", code: "@ch20/dspy_basics.py",
      output: `Predict:         schedule False
String sig:      You are stable. Take tablet X morning and night for 5 days, and come back to OPD in one week.
ChainOfThought:  emergency True
  reasoning:     Sweating with chest pain can be a heart attack, so this is an emergency.

The prompt DSPy wrote for the last call:
System message:
Your input fields are:
1. \`message\` (str):
Your output fields are:
1. \`reasoning\` (str):
2. \`intent\` (Literal['schedule', 'billing', 'reports', 'emergency', 'other']):
3. \`urgent\` (bool): True for chest pain, breathing trouble, heavy bleeding or unconsciousness
...
[[ ## intent ## ]]
{intent}        # note: the value you produce must exactly match (no extra characters) one of: schedule; billing; ...
...
In adhering to this structure, your objective is:
        Classify a patient message sent to the City Clinic helpdesk.

User message:
[[ ## message ## ]]
My father is sweating and has pain in his chest
Respond with the corresponding output fields, starting with the field \`[[ ## reasoning ## ]]\`, then ...`,
      note: "From a test run with a rule-based stand-in model; the prompt shown is exactly what DSPy 3.4.1 generated. Tested with DSPy's own test model interface." },
    { type: "text", md: `What happened:

1. **The [[signature]]** \`Triage\` is a class: the docstring is the task, typed fields are inputs and outputs. \`Literal[...]\` restricts the answer to five intents; \`bool\` makes \`urgent\` a real Python boolean.
2. **\`dspy.Predict\`** turns the signature into a prompt, calls the model, and parses the reply into fields. You get \`result.intent\`, not text to parse.
3. **\`dspy.ChainOfThought\`** is a different *strategy* for the same signature: it adds a \`reasoning\` field before the outputs (Chapter 3's chain-of-thought), with no change to your code.
4. **String signatures** like \`"discharge_note -> summary_for_patient"\` are a shortcut for quick steps.
5. **\`dspy.inspect_history\`** shows the prompt DSPy wrote. You never wrote that prompt, but you can always read it.

| Module | Strategy |
| --- | --- |
| \`Predict\` | Answer directly |
| \`ChainOfThought\` | Reason, then answer |
| \`ReAct\` | Think, call tools, observe, repeat (Lesson 3) |
| \`Refine\`, \`BestOfN\` | Try several times and keep the best by a reward function |
| \`ProgramOfThought\` | Write and run code to compute the answer |` },
    { type: "callout", kind: "warning", md: `**Install DSPy in its own virtual environment.** DSPy 3.4 depends on \`litellm\`, which needs \`openai\` below version 3, while this course's other code uses \`openai\` 3.x. Use \`ch20/requirements-dspy.txt\`. Model names are written \`"openai/gpt-4.1-mini"\` or \`"anthropic/claude-haiku-5-5"\`.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "A signature declares inputs and outputs with types; the docstring is the task.",
      "Modules (Predict, ChainOfThought, ReAct) are strategies you can swap.",
      "DSPy writes and parses the prompt; `inspect_history` shows it.",
      "Typed outputs (Literal, bool) come back as real Python values."
    ]},
    { type: "quiz", title: "Knowledge check: signatures and modules", questions: [
      { kind: "match", q: "Match each DSPy idea to its meaning.",
        pairs: [["Signature", "What goes in and what comes out"], ["Predict", "Answer directly"], ["ChainOfThought", "Reason first, then answer"], ["inspect_history", "See the prompt DSPy wrote"]] },
      { kind: "tf", q: "Switching from Predict to ChainOfThought requires rewriting the signature.", answer: false,
        explain: " Same signature, different module. DSPy adds the reasoning field for you." }
    ]}
  ]},

  { title: "Metrics and optimisers", blocks: [
    { type: "section", label: "Let the data choose the prompt" },
    { type: "text", md: `An **[[optimiser]]** (DSPy calls them teleprompters in older docs) improves a program using three things you provide:

1. **The program** (here \`Predict(Triage)\`).
2. **Training examples:** a few dozen labelled messages are often enough to start.
3. **A metric:** a Python function that says whether a prediction is right. This is the same idea as Chapter 9's evaluation set, now used to *improve*, not just to measure.

\`BootstrapFewShot\` runs the program on training examples, keeps the runs that pass the metric, and puts them into the prompt as worked examples. Better optimisers also rewrite the instructions.` },
    { type: "code", file: "code-samples/ch20/triage_data.json", lang: "json", code: "@ch20/triage_data.json",
      note: "18 training and 10 dev examples, all made up. Keep the dev set separate: it measures, it never teaches." },
    { type: "code", file: "code-samples/ch20/dspy_optimize.py", lang: "python", code: "@ch20/dspy_optimize.py",
      output: `Before optimising: 40% on 10 dev examples
Bootstrapped 4 full traces after 4 examples for up to 1 rounds, amounting to 4 attempts.
After optimising:  70%  (16 examples added to the prompt)
  still wrong: 'How do I pay my hospital dues online?' -> other (expected billing)
  still wrong: 'Where can I collect my X-ray films?' -> other (expected reports)
  still wrong: 'Is Wi-Fi available in the waiting area?' -> schedule (expected other)
Saved the optimised program to triage_optimised.json`,
      note: "From a test run with a weak rule-based stand-in model that copies the closest worked example when unsure, so the numbers are illustrative. A strong real model will start much higher; the gain is largest for small models and hard, domain-specific tasks." },
    { type: "text", md: `Reading the result:

- The score went up because the prompt now contains **worked examples** close to the hard cases ("My son swallowed a coin" helped with "My child swallowed a battery").
- Three cases are **still wrong**. The optimiser does not do magic: it can only use what the training data and model can support. Next steps would be more examples of those kinds, a better module (ChainOfThought) or a stronger model.
- **\`save\` and \`load\`**: the optimised program is a JSON file of instructions and demos. Version it like code, and re-run the evaluation before deploying a new one.` },
    { type: "text", md: `| Optimiser | What it tunes | When to use |
| --- | --- | --- |
| \`LabeledFewShot\` | Adds labelled examples | Baseline; very cheap |
| \`BootstrapFewShot\` | Adds examples that passed your metric (including intermediate steps) | A good first choice, ~10–50 examples |
| \`BootstrapFewShotWithRandomSearch\` | Tries many example sets, keeps the best | More data and budget |
| \`MIPROv2\` | Rewrites instructions **and** chooses examples, using Bayesian search | 50+ examples; bigger gains, more model calls |
| \`GEPA\` | Evolves instructions using the model's own feedback on failures | Complex programs; strong results reported |
| \`BootstrapFinetune\` | Fine-tunes a smaller model on good traces | Cost reduction at scale (see Chapter 35) |` },
    { type: "callout", kind: "warning", md: `**The metric is the real specification.** If it only checks the intent label, the optimiser will happily find prompts that get labels right while writing unsafe reasoning. For safety-critical steps, make the metric check what matters (for example, count a missed emergency as a heavy failure), and keep hard rules in code anyway.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Optimisers need a program, training examples and a metric.",
      "BootstrapFewShot adds worked examples that passed the metric.",
      "MIPROv2 and GEPA also rewrite instructions; they need more data and calls.",
      "Measure on a separate dev set; the metric defines what \"better\" means."
    ]},
    { type: "quiz", title: "Knowledge check: optimisers", questions: [
      { kind: "order", q: "Put the DSPy optimisation workflow in order.",
        items: ["Write the signature and pick a module", "Collect labelled examples and split train/dev", "Write the metric", "Evaluate the baseline on dev", "Compile with an optimiser on train", "Evaluate again on dev and save if better"] },
      { kind: "mcq", q: "Why must the dev set be kept separate from the training set?",
        options: ["DSPy requires two files", "Examples used to build the prompt would make the score look better than it really is", "To save tokens", "The optimiser runs faster"],
        answer: 1,
        why: ["It does not.", "Right: test on data the program has not learned from.", "Not the reason.", "Not the reason."] }
    ]}
  ]},

  { title: "Composing programs: RAG and agents", blocks: [
    { type: "section", label: "Modules inside modules" },
    { type: "text", md: `Real programs have several steps. A \`dspy.Module\` works like a small class: create sub-modules in \`__init__\`, describe the flow in \`forward\`. Because every model call is a DSPy module, **an optimiser can tune all the steps together** against one end-to-end metric.` },
    { type: "code", file: "code-samples/ch20/dspy_modules.py", lang: "python", code: "@ch20/dspy_modules.py",
      output: `RAG:   No. Children under 12 may not enter the ICU.
ReAct: Dr Iyer (orthopaedics) works on Tuesday and Thursday.
Steps: ['get_doctor_schedule', 'finish']`,
      note: "From a test run with the rule-based stand-in model. The retriever, the tool and DSPy's ReAct loop are real." },
    { type: "text", md: `- **\`ClinicRAG\`** retrieves (any Python code; here a tiny keyword search) and answers with \`ChainOfThought("context: list[str], question -> answer")\`. To optimise it, you would compile it with a metric such as "answer matches the reference and cites the right section".
- **\`dspy.ReAct\`** is an agent: a signature plus plain Python tools. Its trajectory records each thought, tool and observation, like the traces in Chapter 9. \`max_iters\` is the loop budget.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "A `dspy.Module` composes steps; `forward` holds the flow.",
      "Optimisers can tune every step of a program against one metric.",
      "`dspy.ReAct` turns a signature and Python tools into an agent with a trajectory."
    ]},
    { type: "quiz", title: "Knowledge check: composing", questions: [
      { kind: "mcq", q: "What is the main benefit of writing a multi-step pipeline as a DSPy Module?",
        options: ["It runs faster", "An optimiser can improve all its steps together against one metric", "It needs no model", "It avoids retrieval"],
        answer: 1,
        why: ["Speed is not the point.", "Right.", "The steps still call a model.", "Retrieval is still yours to write."] },
      { kind: "tf", q: "dspy.ReAct needs tools to be written in a special DSPy format.", answer: false,
        explain: " Plain Python functions with type hints and docstrings work, as in the example." }
    ]}
  ]},

  { title: "Production, and DSPy versus hand-written prompts", blocks: [
    { type: "section", label: "Running DSPy programs for real" },
    { type: "list", items: [
      "**Version the optimised program.** The saved JSON *is* your prompt. Review it, store it in Git, and deploy it like code.",
      "**Re-optimise when things change:** a new model, new kinds of messages, or a drifting score in production. Keep the dev set and metric in CI so a new version must beat the old one.",
      "**Budget the optimisation.** MIPROv2 or GEPA can make hundreds or thousands of model calls; run them on a cheaper model or a sample first.",
      "**Caching is on by default** in `dspy.LM`. Good for repeatable experiments; turn it off (`cache=False`) when you want fresh samples.",
      "**Observability:** DSPy supports callbacks and integrates with tools like MLflow and Langfuse for tracing (Chapter 31).",
      "**Data privacy:** training examples end up inside prompts. Never put real patient messages into demos unless they are de-identified and your policies allow it."
    ]},
    { type: "section", label: "When to use DSPy" },
    { type: "text", md: `| Prefer DSPy when | Prefer hand-written prompts when |
| --- | --- |
| You have (or can label) dozens of examples and a clear metric | You have no examples and no way to score outputs |
| The step runs at volume and small accuracy gains matter | It is a one-off or low-volume task |
| You switch models often and do not want to re-tune by hand | The prompt is short, stable and already works |
| The pipeline has several model steps to tune together | You need exact wording for legal or clinical reasons |

DSPy and the other frameworks combine well: optimise a classifier or extractor with DSPy, save it, and call it from a LangGraph node or an Agno tool. The habit DSPy teaches is the most valuable part: **define "good" as a metric on real examples before you start changing prompts.**` },
    { type: "list", style: "mistakes", items: [
      "**Optimising against a weak metric.** You get a program that is very good at the wrong thing.",
      "**Too few or unrepresentative examples.** The prompt fits your examples, not your patients.",
      "**Evaluating on the training set.** Scores look great and mean nothing.",
      "**Installing DSPy into the same environment as openai 3.x.** Use a separate environment until its dependencies catch up."
    ]},
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Treat the saved, optimised program as code: version, review, test in CI.",
      "Budget optimisation runs; they can make many model calls.",
      "Use DSPy when you have examples, a metric and volume; hand-write when you do not.",
      "The lasting lesson: define \"good\" with a metric before changing prompts."
    ]},
    { type: "quiz", title: "Knowledge check: DSPy in practice", questions: [
      { kind: "mcq", q: "A clinic consent form must use exact, lawyer-approved wording. DSPy or hand-written?",
        options: ["DSPy, so it can optimise the wording", "Hand-written: the wording is fixed, there is nothing to optimise", "Either", "Neither; use RAG"],
        answer: 1,
        why: ["Optimising would change approved wording.", "Right.", "Not here.", "RAG does not apply to fixed wording."] },
      { kind: "tf", q: "Real patient messages can be used as DSPy training demos without any changes.", answer: false,
        explain: " Demos are sent inside every prompt. De-identify them and follow your data policies." }
    ]}
  ]}

  ]
};
})();
