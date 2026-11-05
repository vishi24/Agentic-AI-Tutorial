/* Chapter 35 · Fine-tuning: LoRA and QLoRA */
(function () {

var LADDER_SVG = `
<svg viewBox="0 0 680 220" xmlns="http://www.w3.org/2000/svg">
  <text class="dg-muted" x="12" y="18">Try the cheap, reversible things first. Each step costs more and is harder to undo.</text>
  <g><rect class="dg-box" x="10" y="36" width="150" height="110" rx="10"/><text class="dg-title" x="85" y="62" text-anchor="middle">1. Prompt</text><text class="dg-muted" x="85" y="84" text-anchor="middle">clear instructions,</text><text class="dg-muted" x="85" y="100" text-anchor="middle">examples in the prompt</text><text class="dg-muted" x="85" y="130" text-anchor="middle">minutes</text></g>
  <g><rect class="dg-box" x="180" y="36" width="150" height="110" rx="10"/><text class="dg-title" x="255" y="62" text-anchor="middle">2. Retrieval</text><text class="dg-muted" x="255" y="84" text-anchor="middle">give it the facts</text><text class="dg-muted" x="255" y="100" text-anchor="middle">at question time</text><text class="dg-muted" x="255" y="130" text-anchor="middle">days</text></g>
  <g><rect class="dg-box" x="350" y="36" width="150" height="110" rx="10"/><text class="dg-title" x="425" y="62" text-anchor="middle">3. Tools</text><text class="dg-muted" x="425" y="84" text-anchor="middle">let code look it up</text><text class="dg-muted" x="425" y="100" text-anchor="middle">and act</text><text class="dg-muted" x="425" y="130" text-anchor="middle">days</text></g>
  <g><rect class="dg-box amber" x="520" y="36" width="150" height="110" rx="10"/><text class="dg-title" x="595" y="62" text-anchor="middle">4. Fine-tune</text><text class="dg-muted" x="595" y="84" text-anchor="middle">change the model's</text><text class="dg-muted" x="595" y="100" text-anchor="middle">habits</text><text class="dg-muted" x="595" y="130" text-anchor="middle">weeks, and upkeep</text></g>
  <text class="dg-text" x="12" y="180">Facts that change (prices, doctor days) belong in steps 2 and 3.</text><text class="dg-text" x="12" y="202">Fine-tuning changes HOW it answers, not WHAT is true today.</text>
</svg>`;

var LORA_SVG = `
<svg viewBox="0 0 680 250" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch35-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="x"><rect class="dg-box" x="14" y="100" width="80" height="50" rx="10"/><text class="dg-title" x="54" y="130" text-anchor="middle">input x</text></g>
  <g data-step="w"><rect class="dg-box" x="200" y="30" width="230" height="64" rx="10"/><text class="dg-title" x="315" y="56" text-anchor="middle">W  (frozen, huge)</text><text class="dg-muted" x="315" y="76" text-anchor="middle">4096 × 4096 = 16.8 million numbers</text></g>
  <g data-step="a"><rect class="dg-box accent" x="200" y="150" width="100" height="64" rx="10"/><text class="dg-title" x="250" y="176" text-anchor="middle">A  (trained)</text><text class="dg-muted" x="250" y="196" text-anchor="middle">squeeze to r = 8</text></g>
  <g data-step="b"><rect class="dg-box accent" x="330" y="150" width="100" height="64" rx="10"/><text class="dg-title" x="380" y="176" text-anchor="middle">B  (trained)</text><text class="dg-muted" x="380" y="196" text-anchor="middle">expand back</text></g>
  <g data-step="sum"><circle class="dg-box amber" cx="500" cy="125" r="24"/><text class="dg-title" x="500" y="131" text-anchor="middle">+</text></g>
  <g data-step="out"><rect class="dg-box" x="570" y="100" width="100" height="50" rx="10"/><text class="dg-title" x="620" y="130" text-anchor="middle">output</text></g>
  <path class="dg-line" d="M94 118L198 70" marker-end="url(#ch35-a)"/><path class="dg-line" d="M94 134L198 178" marker-end="url(#ch35-a)"/>
  <path class="dg-line" d="M430 62L478 112" marker-end="url(#ch35-a)"/><path class="dg-line" d="M300 182H328" marker-end="url(#ch35-a)"/><path class="dg-line" d="M430 182L478 140" marker-end="url(#ch35-a)"/>
  <path class="dg-line" d="M524 125H568" marker-end="url(#ch35-a)"/>
  <text class="dg-muted" x="200" y="236">Trained: A and B only = 65,536 numbers (0.39% of W).  Output = x·W + (α/r)·x·A·B</text>
</svg>`;

window.COURSE.chapters.ch35 = {
  id: "ch35",
  title: "Fine-tuning: LoRA and QLoRA",
  oneLine: "Fine-tuning changes how a model behaves by training it a little on your own examples. You will learn when it is worth it (rarely first), run a real LoRA fine-tune end to end, build a clean dataset from traces, and decide with an evaluation whether to ship it.",
  lessons: [

  { title: "Should you fine-tune at all?", blocks: [
    { type: "section", label: "What fine-tuning changes" },
    { type: "text", md: `A language model arrives with general skills. **Fine-tuning** trains it a bit more on your own examples (each one a question and the answer you wanted), so its default behaviour moves towards yours. It changes **habits**: tone, format, how short, which terms, which route to pick.

It does **not** reliably teach new *facts*, and it is a poor way to keep facts current. A model fine-tuned on last year's price list will confidently quote last year's prices. Facts belong in retrieval and tools (Chapters 7 and 8), where you can change them in minutes and show the source.` },
    { type: "diagram", svg: LADDER_SVG, caption: "The ladder: prompting, retrieval, tools, then fine-tuning." },
    { type: "text", md: `| Your problem | Best first move |
| --- | --- |
| Replies are the wrong tone or too long | Better prompt with 2 to 3 example replies |
| It does not know our prices, doctors or policies | Retrieval or tools (Chapters 7, 8) |
| It must follow a strict output format | Structured output / schema (Chapter 5) |
| The prompt has grown to 3,000 tokens of rules and examples and each call is slow and costly | **Fine-tune** a smaller model on those examples |
| A cheap model must do one narrow task as well as an expensive one (routing, classification, extraction) | **Fine-tune** the cheap model |
| Many thousands of calls a day with the same style | **Fine-tune**: shorter prompts, lower cost per call |
| Domain language the model keeps getting wrong (local abbreviations, mixed Hindi-English) and examples show the pattern | **Fine-tune**, after checking a prompt cannot do it |
| Safety rules | **Not** fine-tuning: code guards (Chapter 33). A tuned model can still be talked out of it |` },
    { type: "section", label: "The costs people forget" },
    { type: "list", items: [
      "**The data work.** Good examples are the product. Most of this chapter's effort is the dataset, not the training.",
      "**Evaluation.** You need a trustworthy test (Chapter 31) before you start; otherwise you cannot tell whether the tuned model is better.",
      "**Upkeep.** A new base model means doing it again. Your tuned adapter does not transfer.",
      "**Regressions.** Tuning on narrow data can make the model worse at other things, and can weaken built-in safety behaviour. Re-run your safety cases.",
      "**Memorisation.** A tuned model can repeat training text. If personal data went in, it can come out. Scrub first (Chapter 33), and only train where your consent and purpose allow it (Chapter 34).",
      "**Licences.** An open model's licence may limit commercial or clinical use. Read it."
    ]},
    { type: "section", label: "Where can you actually fine-tune? (checked November 2026)" },
    { type: "list", items: [
      "**OpenAI hosted fine-tuning.** OpenAI's documentation says it is **winding down** fine-tuning: new users cannot access it, and existing customers can create new jobs only until 6 January 2027 (sooner if the base model is retired). The models listed were GPT-4.1, 4.1 mini and 4.1 nano. We include the code but treat it as a legacy path.",
      "**Anthropic Claude.** We found one announced offering: fine-tuning Claude 3 Haiku through Amazon Bedrock (generally available since November 2024, in one region at the time). We found no evidence of fine-tuning for the current Claude models, so **do not plan a project around it**; check Anthropic's and AWS's current pages.",
      "**Open-weight models** (Llama, Qwen, Mistral, Gemma and others) with **LoRA/QLoRA**. You control the data, the weights and where it runs, which suits patient data. This is the durable route, and the rest of the chapter is about it. It needs a GPU for real models (rented cloud GPUs are fine)."
    ]},
    { type: "text", md: `These availability facts change quickly. Read the provider's current page before relying on any of them.` },
    { type: "quiz", title: "Knowledge check: when to fine-tune", questions: [
      { kind: "match", q: "Match each problem to the right first fix.",
        pairs: [["The agent quotes last year's price", "Retrieval or a tool"], ["Replies are too long and formal", "Prompt with examples"], ["A 3,000-token prompt of rules makes every call slow and costly", "Fine-tune a smaller model"], ["Patients can talk it into giving doses", "Code guardrails"]] },
      { kind: "mcq", q: "Why is fine-tuning a bad way to teach the model the clinic's current prices?",
        options: ["It cannot learn numbers", "Prices change, and a tuned model keeps stating old ones with no source, while retrieval can be updated in minutes", "It is too fast", "Prices are secret"],
        answer: 1,
        why: ["It can memorise them; that is the problem when they change.", "Right: facts change, so keep them where you can edit and cite them.", "Not an issue.", "Unrelated."] },
      { kind: "tf", q: "Because OpenAI offers fine-tuning of GPT-4.1 mini, a new clinic can plan its project around it.", answer: false,
        explain: " OpenAI's documentation says it is winding down fine-tuning and has closed it to new users. Check current availability, and prefer open-weight models for a durable plan." }
    ]}
  ]},

  { title: "How LoRA and QLoRA work", blocks: [
    { type: "section", label: "The problem: models are huge" },
    { type: "text", md: `A 7-billion-parameter model has 7 billion numbers. Training all of them (**full fine-tuning**) needs the numbers themselves, plus a gradient and optimiser memory for every one, several times the model's own size. That is a cluster of expensive GPUs, and each tuned copy is another 14 GB file.

**LoRA** (Low-Rank Adaptation) has a neat idea: **freeze the model** and learn only a small *change* to some of its layers. A layer holds a big matrix **W**. Instead of changing W, LoRA learns two thin matrices **A** and **B** whose product is the change. If W is 4096 by 4096, A squeezes down to a tiny width **r** (say 8) and B expands back. The model's new behaviour is W plus the small correction.` },
    { type: "stepper", svg: LORA_SVG, caption: "One layer with LoRA. Only A and B are trained.",
      steps: [
        { on: ["x"], text: "An input arrives at the layer, as it would in the original model." },
        { on: ["w"], text: "The original path through **W** is untouched and frozen: 16.8 million numbers that never change." },
        { on: ["a"], text: "The new path first multiplies by **A**, which squeezes the signal down to just **r = 8** dimensions. This is the \"low rank\": the change is forced to be simple." },
        { on: ["b"], text: "**B** expands it back to full width. B starts as all zeros, so at the start the new path adds nothing and the model behaves exactly as before." },
        { on: ["sum"], text: "The two paths are added, scaled by α/r (alpha over r). α is a dial for how strongly the correction counts." },
        { on: ["out"], text: "Result: the output now includes what was learned. Only A and B (65,536 numbers, 0.39% of W) were trained and need saving." }
      ]},
    { type: "code", file: "code-samples/ch35/lora_math.py", lang: "python", code: "@ch35/lora_math.py",
      output: `one 4096x4096 layer: full 16,777,216  LoRA r=8 65,536  (0.39%)
merged weights give the same output: True
at the start B = 0, so the model is unchanged: True`,
      note: "Real output (numpy only). The merge check is why LoRA costs nothing at serving time: after training you can fold W + (α/r)·B·A into one matrix." },
    { type: "section", label: "The settings that matter" },
    { type: "text", md: `| Setting | Meaning | Typical |
| --- | --- | --- |
| **r** (rank) | Width of the squeeze: capacity to learn. Higher learns more and costs more | 8 to 64 |
| **lora_alpha** | Strength of the correction (scaled by α/r) | often 2 × r |
| **target_modules** | Which layers get adapters. Attention layers are the classic choice; "all-linear" adapts every linear layer | attention, or all-linear |
| **lora_dropout** | Randomly drops part of the adapter while training to reduce over-fitting | 0 to 0.1 |
| **learning rate** | How big each update step is. LoRA tolerates much higher rates than full tuning | around 1e-4 to 2e-4 |

Start small (r = 8 to 16), look at the evaluation, and only then try more. More capacity is not automatically better: with a small dataset it memorises.` },
    { type: "section", label: "QLoRA: LoRA on a compressed model" },
    { type: "text", md: `Even frozen, a 7B model in 16-bit numbers is about 14 GB of weights (2 bytes each). **QLoRA** stores the frozen base in **4-bit** numbers instead, about a quarter of the size (roughly 3.5 to 4 GB for 7B), and trains LoRA adapters on top, doing the arithmetic in higher precision. Quality stays close to ordinary LoRA, and a model that needed a data-centre GPU fits on one consumer or single cloud GPU. Memory also depends on sequence length, batch size and the optimiser, so treat these as rough rules of thumb.

Three pieces of vocabulary you will see: **NF4** (a 4-bit number format designed for neural-network weights), **double quantisation** (compressing the scaling constants too) and **gradient checkpointing** (recompute some values instead of storing them, trading speed for memory).` },
    { type: "code", file: "code-samples/ch35/configs.py", lang: "python", code: "@ch35/configs.py",
      note: "These config objects were built and checked in the tests (no GPU needed). The training itself (next lessons) needs a GPU." },
    { type: "callout", kind: "tip", md: `**Adapters are small, separate files.** A LoRA adapter is megabytes, not gigabytes. You can keep one adapter per task (billing tone, triage routing), swap them on one shared base model, and version them in git-like fashion. You can also **merge** an adapter into the base to get a single standard model file.` },
    { type: "quiz", title: "Knowledge check: LoRA and QLoRA", questions: [
      { kind: "match", q: "Match each piece to its role.",
        pairs: [["W", "The original frozen weight matrix"], ["A and B", "The small trained matrices whose product is the change"], ["r", "The width of the squeeze, which sets capacity"], ["4-bit storage (QLoRA)", "Fits the frozen base into much less memory"]] },
      { kind: "mcq", q: "Why does B start as all zeros?",
        options: ["To save memory", "So the model behaves exactly as the original at the start of training", "Because zeros train faster", "To hide the weights"],
        answer: 1,
        why: ["Not the reason.", "Right: the correction adds nothing until it is learned.", "Not the reason.", "Not a security feature."] },
      { kind: "tf", q: "After training, serving a LoRA model must always run extra layers, so it is slower than the original.", answer: false,
        explain: " The adapter can be merged into the base weights, giving a normal-speed model. Keeping it separate is optional (useful for swapping adapters)." }
    ]}
  ]},

  { title: "Building the dataset from traces", blocks: [
    { type: "section", label: "The dataset is the product" },
    { type: "text", md: `Training copies whatever you show it. If the examples contain mistakes, patient phone numbers or medical advice, the tuned model learns those too. So every step below removes a specific way for fine-tuning to go wrong. The source is your production **traces** (Chapter 31) with staff feedback. In this course those are **synthetic**; never put real patient text into a course file or a public repository.` },
    { type: "code", file: "code-samples/ch35/synthetic_traces.py", lang: "python", code: "@ch35/synthetic_traces.py",
      note: "The generator plants four problems on purpose: an unsafe dose reply, a reply rated bad, a copy of an evaluation case, and an exact duplicate." },
    { type: "code", file: "code-samples/ch35/build_dataset.py", lang: "python", code: "@ch35/build_dataset.py" },
    { type: "code", lang: "bash", code: "python build_dataset.py",
      output: `{
  "input": 154,
  "dropped_feedback": 1,
  "dropped_unsafe": 1,
  "pii_scrubbed": 19,
  "dropped_duplicate": 75,
  "dropped_contaminated": 2,
  "train": 60,
  "validation": 7,
  "test": 8
}`,
      note: "Real output. 154 raw traces became 75 examples. Notice that half were duplicates: real traffic repeats itself, and training on repeats just over-weights the common question." },
    { type: "section", label: "What each step protects against" },
    { type: "list", items: [
      "**Keep only good examples.** Train on replies people liked or staff approved. A thumbs-down reply in the data teaches the model to repeat it.",
      "**Remove unsafe replies.** Never teach medical advice, even if one slipped through once.",
      "**Scrub personal data** from both question and reply (Chapter 33's redaction). Remember models can regurgitate training text.",
      "**Deduplicate.** Exact copies, and near-copies where one question dominates.",
      "**Remove contamination.** Any training example too similar to an **evaluation** case must go, or your test score becomes a memory test. The code compares word overlap against Chapter 31's cases and removed 2.",
      "**Split before you look.** Train, validation (to choose settings and stop early), and a test set you open only once at the end."
    ]},
    { type: "callout", kind: "warning", md: `**Consent and purpose.** Using patient conversations to train a model is a new *purpose* beyond answering the patient. Under India's DPDP Act, processing needs a lawful basis and notice for a specified purpose (Chapter 34). Decide with your legal team whether your notice covers training, and prefer synthetic or staff-written examples where it does not.` },
    { type: "section", label: "The format" },
    { type: "text", md: `The standard format is **chat JSONL**: one JSON object per line, each with a list of messages (system, user, assistant). Most trainers and the OpenAI API accept it.` },
    { type: "code", lang: "json", code: `{"messages": [
  {"role": "system", "content": "You are the City Clinic helpdesk. Answer briefly, only with facts you were given, never give medical advice."},
  {"role": "user", "content": "Which days is Dr Rao available?"},
  {"role": "assistant", "content": "Dr Rao sees patients for cardiology on Thursday and Friday. Please call 1800-000-000 to book."}
]}`,
      note: "One line of data/train.jsonl, wrapped here for reading." },
    { type: "text", md: `**Train on the answer, not the question.** Compute the training loss only on the assistant's tokens. Otherwise the model also learns to *predict patients' questions*, wasting capacity. The tiny trainer in the next lesson does this by marking prompt tokens with the label -100 (the standard \"ignore\" value). Libraries have options for it (for example TRL's \`assistant_only_loss\` and \`completion_only_loss\`; they require a chat template that marks the assistant part, so check the documentation of your version).

**How many examples?** Fewer than people expect, if they are clean. One provider's guide suggests starting with about 50 well-made examples and measuring; for narrow behaviour, a few hundred to a few thousand is typical. Quality and variety matter more than count: 60 careful examples beat 6,000 repeats.

**Synthetic data.** You can have a stronger model write examples. Review a sample by hand, check them with the same filters, and keep them out of your evaluation set. Models trained on model-written text inherit its blind spots.` },
    { type: "quiz", title: "Knowledge check: datasets", questions: [
      { kind: "order", q: "Put the dataset-building steps in a sensible order.",
        items: ["Keep only examples people rated well", "Remove unsafe replies", "Scrub personal data", "Remove duplicates and anything in the evaluation set", "Split into train, validation and test"] },
      { kind: "mcq", q: "154 traces became 75 examples, mostly because of duplicates. What does this tell you?",
        options: ["The filter is broken", "Real traffic repeats a few common questions, and training on repeats would over-weight them", "You need more filters", "The test set is too big"],
        answer: 1,
        why: ["It is working.", "Right: deduplication keeps the data varied.", "Not the lesson here.", "Unrelated."] },
      { kind: "tf", q: "If some training examples closely match your evaluation questions, your evaluation score will be a fair measure of how well the model generalises.", answer: false,
        explain: " That is contamination. The model may simply have memorised the answers, so the score looks better than the real performance." }
    ]}
  ]},

  { title: "Train, evaluate, ship", blocks: [
    { type: "section", label: "A real fine-tune you can run" },
    { type: "text", md: `We cannot download a pretrained model in the build environment, so the example below makes its own tiny one: a character-level GPT-2 of 0.37 million parameters, first trained briefly on **generic** questions and answers (the "base model"), then fine-tuned with **real Hugging Face PEFT LoRA** on the clinic dataset from the last lesson. It is far too small to be useful. What is real is the whole workflow and every number it printed. For a real model you change the base and nothing else.` },
    { type: "code", file: "code-samples/ch35/tiny_lora.py", lang: "python", code: "@ch35/tiny_lora.py",
      note: "Read these parts: CharTokenizer (text to numbers), example() (the -100 labels mean the loss counts only the reply), LoraConfig (r, alpha, target modules), and the four stages at the end (train, save, reload, merge)." },
    { type: "code", lang: "bash", code: "python tiny_lora.py      # about two minutes on a laptop CPU",
      output: `base model: 366,720 parameters
BEFORE   clinic validation loss 8.346   similarity to reference replies 0.17
         base model answers: 'bakery closext t the the night.'
LoRA r=8: trainable 20,736 of 387,456 parameters (5.4%)
AFTER    clinic validation loss 0.884   similarity to reference replies 0.58
         tuned model answers: 'BIL0000. BI0. tabo the is is bouous out this billlllllllle the bing desk on 1000000000.'
         reference reply    : 'BILL-9632: the ECG is Rs 350. For questions about this bill, call the billing desk on 1800-000-000.'
adapter file 82 KB vs base weights 1,432 KB
reloaded adapter matches the trained one: True | merged model matches: True`,
      note: "Real output (PEFT 0.21, PyTorch 2.15, CPU). The base model answers a clinic question with text about a bakery: it only knows generic chatter. After LoRA it moves clearly towards the clinic's phrases, and the loss on held-out clinic examples falls from 8.3 to 0.88. The text is still garbled because the model is tiny and trained for minutes; a real model learns this in far fewer steps." },
    { type: "list", items: [
      "**5.4% trainable** is high because the model is tiny. For a real 7B model with r = 16 on attention layers, the trainable share is typically well under 1%.",
      "The **adapter is 82 KB** against 1,432 KB of base weights. At 7B scale, tens of MB against 14 GB.",
      "**Reload and merge both reproduce the trained model's outputs** (checked on the logits). That is the property you rely on when deploying.",
      "The validation loss is a **training signal**, not the verdict. The verdict is your evaluation on behaviour, next."
    ]},
    { type: "section", label: "The real thing: QLoRA with TRL" },
    { type: "text", md: `On a GPU, the same recipe applies to a real open model. Hugging Face's \`trl\` library provides \`SFTTrainer\` (supervised fine-tuning) that takes the quantisation config, the LoRA config and your JSONL. The configs ran in our tests; the training call is **not run here** (it needs a GPU and a model download) and follows the library's documentation for the installed versions.` },
    { type: "code", file: "code-samples/ch35/qlora_sft.py", lang: "python", code: "@ch35/qlora_sft.py",
      note: "Untested: needs an NVIDIA GPU. Put a model id you are licensed to use in BASE. TRL and PEFT change often; check their current docs if a parameter name has moved." },
    { type: "section", label: "Evaluate before you ship" },
    { type: "text", md: `A tuned model is an ordinary change, so it goes through Chapter 31's process. Four checks:

1. **Beat the baseline you already have.** Compare against the *untuned model with your best prompt and retrieval*. If fine-tuning does not beat that on your held-out cases, you have only added upkeep.
2. **Run the safety and attack cases** (Chapters 31, 33). Fine-tuning can erode safe behaviour; no previously passing safety case may fail.
3. **Check facts still come from tools.** Ask about changed prices and doctors; the reply must follow the tool result, not memory.
4. **Look at cost and speed.** The point is often a smaller model or a shorter prompt: measure tokens per request and latency (Chapter 32).

Use the same gate as before: written in advance, no regressions on safety cases, a paired comparison on the rest.` },
    { type: "section", label: "Beyond supervised tuning: RLHF and DPO" },
    { type: "text", md: `Supervised fine-tuning shows the model **what a good answer looks like**. Sometimes you can only say **which of two answers is better** (a reviewer prefers the careful reply to the curt one). That is *preference* data, and two methods use it:

- **RLHF** (reinforcement learning from human feedback): train a separate **reward model** on the comparisons, then adjust the language model to score well with it, while a penalty keeps it from drifting too far from where it started. Powerful, but complex and fiddly.
- **DPO** (direct preference optimisation): skip the reward model and train directly on the pairs (prompt, chosen, rejected), nudging the model towards chosen and away from rejected. Much simpler to run. The \`beta\` setting controls how far it may move from the starting model.

Preference pairs come naturally from your operation: a staff member edits a bad reply (edited = chosen, original = rejected), or a thumbs-up and a thumbs-down answer exist for the same question. The pair builder below is tested; the DPO training script is not run here (it needs a GPU).` },
    { type: "code", file: "code-samples/ch35/dpo_pairs.py", lang: "python", code: "@ch35/dpo_pairs.py" },
    { type: "code", file: "code-samples/ch35/dpo_train.py", lang: "python", code: "@ch35/dpo_train.py",
      note: "Untested: needs a GPU. DPO usually follows a supervised stage. Preference data is easy to get wrong (inconsistent reviewers, length bias), so inspect examples and evaluate carefully." },
    { type: "section", label: "Deploying tuned models" },
    { type: "list", items: [
      "**Version everything:** base model id and revision, dataset hash, config, adapter hash, evaluation report. Store them together (Chapter 34's manifest and ledger ideas).",
      "**Load adapters from your own trusted storage**, as safetensors, not from random hubs.",
      "**Serve by merging** into one model for simplicity, or keep adapters separate to swap per task on one base model (inference servers such as vLLM support loading LoRA adapters; check the current docs).",
      "**Roll out gradually** (Chapter 36: canary, rollback) and watch the same metrics as before (Chapter 32), because a tuned model can behave differently on real traffic.",
      "**Re-evaluate** whenever the base model, the data policy or your documents change."
    ]},
    { type: "section", label: "Hosted fine-tuning, for completeness" },
    { type: "code", file: "code-samples/ch35/openai_finetune.py", lang: "python", code: "@ch35/openai_finetune.py",
      note: "Untested: needs an account with access, and see the wind-down notice at the top of the file. The SDK methods exist in the installed openai package; the call itself was not made." },
    { type: "section", label: "Production checklist" },
    { type: "list", items: [
      "A written reason why prompt, retrieval and tools were not enough.",
      "A trustworthy evaluation set built **before** training, kept out of the data.",
      "A scrubbed, deduplicated, consented dataset, with a recorded hash.",
      "A comparison against the untuned baseline, plus safety and attack cases.",
      "Versioned artefacts and a rollback plan.",
      "An owner for re-tuning when the base model changes."
    ]},
    { type: "list", style: "mistakes", items: [
      "Fine-tuning to teach facts that will change.",
      "No baseline: not knowing whether a better prompt would have done the same.",
      "Training on unscrubbed patient conversations.",
      "Evaluating on examples that were in the training data.",
      "Judging success by training loss alone.",
      "Treating safety as something the tuned model now \"knows\" instead of keeping the code guards."
    ]},
    { type: "quiz", title: "Knowledge check: training and shipping", questions: [
      { kind: "mcq", q: "Validation loss fell from 8.3 to 0.88. What is the right conclusion?",
        options: ["The model is ready to ship", "The model learned the clinic's text; now run behaviour, safety and baseline-comparison evaluations before deciding", "The adapter is too small", "Training data was contaminated"],
        answer: 1,
        why: ["Loss is a training signal, not a verdict.", "Right: the evaluation decides, not the loss.", "Nothing here says that.", "Nothing here says that either."] },
      { kind: "match", q: "Match each method to what it learns from.",
        pairs: [["Supervised fine-tuning", "Examples of good answers"], ["DPO", "Pairs of chosen and rejected answers"], ["RLHF", "A reward model trained on human comparisons"], ["Retrieval", "Nothing: it adds facts at question time"]] },
      { kind: "tf", q: "A tuned model that passes your helpdesk questions no longer needs the code guardrails from Chapter 33.", answer: false,
        explain: " Fine-tuning can weaken built-in safety behaviour and does not stop prompt injection. Keep the guards and re-run the attack cases after every tuning." }
    ]}
  ]}

  ]
};
})();
