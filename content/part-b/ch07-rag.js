/* Chapter 7 · RAG */
(function () {

var RAG_SVG = `
<svg viewBox="0 0 680 300" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch07-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <text class="dg-muted" x="20" y="22">Indexing: once, and whenever documents change</text>
  <g data-step="load"><rect class="dg-box" x="20" y="34" width="140" height="50" rx="8"/><text class="dg-title" x="90" y="56" text-anchor="middle">1 Load</text><text class="dg-muted" x="90" y="74" text-anchor="middle">policy files</text></g>
  <g data-step="split"><rect class="dg-box" x="190" y="34" width="140" height="50" rx="8"/><text class="dg-title" x="260" y="56" text-anchor="middle">2 Split</text><text class="dg-muted" x="260" y="74" text-anchor="middle">one section each</text></g>
  <g data-step="embed"><rect class="dg-box" x="360" y="34" width="140" height="50" rx="8"/><text class="dg-title" x="430" y="56" text-anchor="middle">3 Embed + store</text><text class="dg-muted" x="430" y="74" text-anchor="middle">vectors + metadata</text></g>
  <path class="dg-line" d="M160 59H188" marker-end="url(#ch07-a)"/><path class="dg-line" d="M330 59H358" marker-end="url(#ch07-a)"/>
  <g data-step="db"><rect class="dg-box amber" x="530" y="34" width="130" height="50" rx="8"/><text class="dg-title" x="595" y="64" text-anchor="middle">Vector DB</text></g>
  <path class="dg-line" d="M500 59H528" marker-end="url(#ch07-a)"/>
  <text class="dg-muted" x="20" y="132">Answering: every question</text>
  <g data-step="question"><rect class="dg-box" x="20" y="144" width="140" height="50" rx="8"/><text class="dg-title" x="90" y="166" text-anchor="middle">Question</text><text class="dg-muted" x="90" y="184" text-anchor="middle">"Can a child visit ICU?"</text></g>
  <g data-step="retrieve"><rect class="dg-box" x="190" y="144" width="140" height="50" rx="8"/><text class="dg-title" x="260" y="166" text-anchor="middle">4 Retrieve</text><text class="dg-muted" x="260" y="184" text-anchor="middle">top-k relevant chunks</text></g>
  <g data-step="augment"><rect class="dg-box" x="360" y="144" width="140" height="50" rx="8"/><text class="dg-title" x="430" y="166" text-anchor="middle">5 Augment</text><text class="dg-muted" x="430" y="184" text-anchor="middle">numbered sources</text></g>
  <g data-step="generate"><rect class="dg-box accent" x="530" y="144" width="130" height="50" rx="8"/><text class="dg-title" x="595" y="166" text-anchor="middle">6 Generate</text><text class="dg-muted" x="595" y="184" text-anchor="middle">answer + [1]</text></g>
  <path class="dg-line" d="M160 169H188" marker-end="url(#ch07-a)"/><path class="dg-line" d="M330 169H358" marker-end="url(#ch07-a)"/><path class="dg-line" d="M500 169H528" marker-end="url(#ch07-a)"/>
  <path class="dg-line" d="M595 84V110H260V142" stroke-dasharray="4 4" marker-end="url(#ch07-a)"/>
  <text class="dg-muted" x="20" y="240">The model answers from the retrieved text, so answers match YOUR documents</text>
  <text class="dg-muted" x="20" y="260">and can be traced back to them. Nothing is retrained.</text>
</svg>`;

window.COURSE.chapters.ch07 = {
  id: "ch07",
  title: "RAG",
  oneLine: "Retrieval-augmented generation finds the relevant passages in your own documents and gives them to the model with the question, so it answers from your data and can show where each fact came from.",
  lessons: [

  { title: "Why RAG", blocks: [
    { type: "section", label: "The problem" },
    { type: "text", md: `The model has never read City Clinic's visitor policy, OPD guide or insurance rules (Chapter 2). Asked "Can my 10-year-old visit his grandfather in the ICU?", it will produce a plausible general answer, which may contradict your actual rule (no children under 12).

There are three ways to give a model your knowledge:

| Approach | How | Good for | Problems |
| --- | --- | --- | --- |
| Paste everything into the prompt | Send all documents every time | A few pages | Cost on every call; does not scale; accuracy drops with long context |
| Fine-tune the model | Train it on your documents | Style, tone, format (Chapter 35) | Slow and costly; facts go stale; no citations; still hallucinates |
| **RAG** | Find the relevant passages, send only those | Facts from documents that change | You must build and maintain retrieval |

For **facts that change** (timings, fees, rules), RAG is almost always the right first choice.` },
    { type: "stepper", svg: RAG_SVG, caption: "The RAG pipeline: index once, then retrieve and generate for every question.",
      steps: [
        { on: ["load"], text: "**Load** the source documents: policy files, PDFs, web pages." },
        { on: ["split"], text: "**Split** them into chunks, one topic each, keeping titles and version (Chapter 6)." },
        { on: ["embed", "db"], text: "**Embed and store** each chunk with metadata: source file, section, version, access level." },
        { on: ["question", "retrieve"], text: "**Retrieve:** embed the question and fetch the few most relevant chunks." },
        { on: ["augment"], text: "**Augment:** put those chunks into the prompt as numbered sources." },
        { on: ["generate"], text: "**Generate:** the model answers using only the sources, citing [1], [2]." }
      ]},
    { type: "callout", kind: "analogy", md: `An open-book exam. The model is a clever student who has not studied your hospital's rules. RAG hands them the two relevant pages from the rule book just before each question and says "answer from these pages, and say which page". The student does not need to memorise the book, and when the book changes, you just hand over the new page.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "RAG gives the model the relevant parts of your documents at question time.",
      "It beats pasting everything (cost) and fine-tuning (staleness, no citations) for changing facts.",
      "Two phases: index once (load, split, embed, store); answer every time (retrieve, augment, generate)."
    ]},
    { type: "quiz", title: "Knowledge check: why RAG", questions: [
      { kind: "mcq", q: "OPD timings change twice a year. How should the helpdesk learn them?",
        options: ["Fine-tune the model each time", "Keep them in a document that RAG retrieves from", "Hope the model knows", "Ask patients to check the website"],
        answer: 1,
        why: ["Slow, costly, and stale between trainings.", "Right: update the document and re-index.", "It cannot know your timings.", "Defeats the purpose."] },
      { kind: "order", q: "Put the RAG steps in order.",
        items: ["Load documents", "Split into chunks", "Embed and store", "Retrieve relevant chunks for the question", "Add them to the prompt as sources", "Generate the answer with citations"] }
    ]}
  ]},

  { title: "Build a RAG pipeline", blocks: [
    { type: "section", label: "The documents" },
    { type: "text", md: `\`code-samples/ch07/docs/\` holds four made-up policy files: visitors, OPD, insurance and emergency. Each has a title, a version line and \`##\` sections, like a real policy:` },
    { type: "code", file: "code-samples/ch07/docs/visitors.md", lang: "bash", code: `# Visitor policy
Version 3, effective 1 April 2026. Applies to all inpatient wards.

## Visiting hours
General wards: 4 pm to 6 pm daily. Only two visitors per patient at a time.
Maternity ward: fathers may visit from 8 am to 8 pm.

## ICU visits
One visitor at a time for 15 minutes, between 11 am and noon and between 5 pm and 6 pm.
Children under 12 may not enter the ICU. Flowers and outside food are not allowed.
...` },
    { type: "section", label: "The pipeline" },
    { type: "code", file: "code-samples/ch07/rag.py", lang: "python", code: "@ch07/rag.py",
      output: `$ python rag.py "Can my 10-year-old son visit his grandfather in the ICU?"
No. Children under 12 may not enter the ICU [1]. One adult visitor at a time
may visit for 15 minutes, between 11 am and noon or 5 pm and 6 pm [1].

Sources:
  [1] visitors.md > ICU visits  (similarity 0.71)
  [2] visitors.md > Visiting hours  (similarity 0.52)
  [3] emergency.md > Family lounge  (similarity 0.41)`,
      note: "Illustrative output. Tested end to end with a stand-in model and embedder, including the refusal path for questions the documents do not cover." },
    { type: "section", label: "Design decisions, one by one" },
    { type: "text", md: `**Split by section.** Policies already have natural sections, so each \`##\` section becomes one chunk. The chunk text starts with "Visitor policy - ICU visits": that heading is embedded too, which helps retrieval and tells the model what it is reading.

**Metadata on every chunk.** \`source\`, \`section\` and \`version\` let the answer cite exactly where a fact came from, and let staff check it.

**A similarity threshold.** Chunks below \`MIN_SIMILARITY\` are dropped. If nothing is left, the code returns "I don't have that information" **without calling the model at all**: the safest and cheapest way to stop guessing. Tune the threshold on your evaluation set (Lesson 4); it depends on the embedding model.

**Numbered sources and strict rules.** The system prompt says: answer only from the sources, cite [n] after each fact, use the exact refusal sentence otherwise. The exact sentence matters, because code and tests can look for it.

**Temperature 0.** Policy answers should be the same every time.` },
    { type: "callout", kind: "tip", md: `In Chapter 12 you will see LangChain's document loaders (PDF, web, CSV, Notion), text splitters and retrievers. They do exactly these steps with less code. Writing it by hand once means you know what each setting does.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Split along natural sections and embed the heading with the text.",
      "Store source, section and version as metadata so every answer can cite its source.",
      "Drop weak matches; if nothing relevant remains, refuse without calling the model.",
      "Instruct the model to answer only from numbered sources and cite them."
    ]},
    { type: "quiz", title: "Knowledge check: build a RAG pipeline", questions: [
      { kind: "mcq", q: "A patient asks about the cafeteria menu, which is in no document. What does rag.py do?",
        options: ["Lets the model answer from general knowledge", "Finds no chunk above the threshold and returns the refusal without calling the model", "Returns the closest chunk anyway", "Crashes"],
        answer: 1,
        why: ["That invites hallucination.", "Right.", "Weak matches are dropped.", "It handles the case."] },
      { kind: "tf", q: "Embedding the section heading with the chunk text is wasteful and should be avoided.", answer: false,
        explain: " The heading says what the chunk is about. It helps both retrieval and the model's understanding." },
      { kind: "mcq", q: "Why does the prompt require an exact refusal sentence?",
        options: ["It sounds polite", "So code and tests can detect refusals reliably", "The API requires it", "To save tokens"],
        answer: 1,
        why: ["Politeness is a bonus.", "Right.", "It does not.", "A minor effect at most."] }
    ]}
  ]},

  { title: "Better retrievers", blocks: [
    { type: "section", label: "The problem" },
    { type: "text", md: `Patients rarely use policy words. "My wife is pregnant, when can I come and see her?" should match "Maternity ward: fathers may visit from 8 am to 8 pm", but the words barely overlap, and a single embedding of a chatty question may land closer to the general visiting rules.` },
    { type: "section", label: "Multi-query and contextual compression" },
    { type: "code", file: "code-samples/ch07/retrievers.py", lang: "python", code: "@ch07/retrievers.py",
      output: `Searched with:
  - my wife is pregnant, when can I come and see her?
  - visiting hours maternity ward
  - when can fathers visit
  - maternity visiting policy

Found: ['visitors#visiting-hours', 'visitors#hygiene', 'emergency#family-lounge']

[visitors#visiting-hours] Maternity ward: fathers may visit from 8 am to 8 pm.`,
      note: "Output from a test run with a stand-in model. Compression reduced three chunks to the one sentence that answers the question." },
    { type: "text", md: `**Multi-query retrieval.** The model rewrites the question in the language of the documents ("maternity visiting policy"), we search with every version, and merge the results with Reciprocal Rank Fusion (Chapter 6). Chunks found by several versions rise to the top. Cost: one extra small model call.

**Contextual compression.** After retrieval, the model copies only the sentences that answer the question. The final prompt is smaller and cleaner, which helps accuracy and cost when chunks are long. Cost: one model call per chunk, so use a small, fast model and only when chunks are long.

| Technique | Fixes | Extra cost |
| --- | --- | --- |
| Multi-query | Patients' words differ from the documents | 1 small call |
| Contextual compression | Long chunks full of irrelevant text | 1 call per chunk |
| Hybrid search (Chapter 6) | Codes, names, abbreviations | None |
| Metadata filters | Wrong department, old versions, wrong language | None |
| Re-ranking (Chapter 18) | The right chunk is retrieved but ranked low | 1 call or a small model |` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Multi-query rewrites the question in document language and merges results.",
      "Compression trims chunks down to the sentences that matter.",
      "Each technique fixes a specific failure; measure before adding cost."
    ]},
    { type: "quiz", title: "Knowledge check: better retrievers", questions: [
      { kind: "match", q: "Match the failure to the technique that fixes it.",
        pairs: [["Patients use very different words from the policy", "Multi-query retrieval"], ["Chunks are long and mostly irrelevant", "Contextual compression"], ["Searching for a code like 'CGHS'", "Hybrid search"], ["Answers quote an old policy version", "Metadata filters"]] },
      { kind: "tf", q: "Contextual compression is free because it only removes text.", answer: false,
        explain: " Deciding what to keep needs a model call per chunk." }
    ]}
  ]},

  { title: "Production: evaluate RAG", blocks: [
    { type: "section", label: "Two places a RAG answer can fail" },
    { type: "text", md: `A wrong RAG answer has one of two causes, and the fixes are completely different:

1. **Retrieval failed:** the right chunk was not found. Fix chunking, embeddings, hybrid search or filters (Chapter 6).
2. **Generation failed:** the right chunk was found, but the answer is wrong, uncited or adds facts that are not in the sources. Fix the prompt, the model or the context size.

So measure them **separately**.` },
    { type: "code", file: "code-samples/ch07/rag_eval.json", lang: "json", code: "@ch07/rag_eval.json" },
    { type: "code", file: "code-samples/ch07/rag_eval.py", lang: "python", code: "@ch07/rag_eval.py",
      output: `question                                                   ret fac cit fai ref
What are the ICU visiting times?                            ✓   ✗   ✓   ✓   ✓
Can a 10-year-old visit the ICU?                            ✓   ✓   ✓   ✓   ✓
Is OPD open on Sunday?                                      ✓   ✓   ✓   ✓   ✓
...
My father has chest pain, what should we do?                ✓   ✓   ✓   ✓   ✓
What is the cafeteria menu today?                           -   -   -   -   ✓
Who is the hospital's CEO?                                  -   -   -   -   ✓

Passed 10/11  ·  retrieval hit rate 100%  ·  faithfulness 100%`,
      note: "Output from a test run. The one failure is instructive: the right source was found and the answer was faithful to it, but it answered a different part of the section (who may visit, not when). Only the facts check caught it." },
    { type: "text", md: `| Check | What it catches | Type |
| --- | --- | --- |
| **Retrieval** | The right document was not found | Rule |
| **Facts** | The answer misses the key fact | Rule |
| **Citations** | No citation, or a citation to a source that does not exist | Rule |
| **Faithful** | Claims not supported by the sources (hallucination) | LLM judge |
| **Refusal** | Out-of-scope questions answered anyway | Rule |

Frameworks such as **RAGAS** (Chapter 18) automate similar metrics: faithfulness, answer relevance, context precision and recall.` },
    { type: "section", label: "Keeping it right over time" },
    { type: "text", md: `| Risk | Defence |
| --- | --- |
| A policy changes and the old version is still indexed | Re-index on every change; delete withdrawn chunks; store version and date |
| Two versions of a policy both match | Filter on the current version, or keep only the latest |
| Staff-only documents shown to patients | An access-level metadata field, filtered on every query |
| A document contains instructions such as "ignore previous rules" | Treat retrieved text as data, never as instructions (Chapter 33) |
| Nobody checks answers after launch | Log question, retrieved ids and answer; review a weekly sample; add failures to the test set |` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Evaluate retrieval and generation separately: the fixes are different.",
      "Check facts, citations, faithfulness and correct refusals on a fixed question set.",
      "Keep the index current, filter by version and access level, and log every answer's sources."
    ]},
    { type: "quiz", title: "Knowledge check: evaluate RAG", questions: [
      { kind: "mcq", q: "Retrieval hit rate is 100% but faithfulness is 70%. Where do you work first?",
        options: ["Chunking", "The embedding model", "Generation: prompt rules, context size or model", "Adding more documents"],
        answer: 2,
        why: ["Retrieval is already finding the right chunks.", "Same.", "Right: the model adds unsupported claims.", "Unrelated."] },
      { kind: "tf", q: "If the answer cites [1], it must be correct.", answer: false,
        explain: " A citation can point to a source that does not support the claim. That is what the faithfulness check is for." },
      { kind: "match", q: "Match each problem to its defence.",
        pairs: [["Quotes last year's fee", "Re-index on change; filter by version"], ["Shows a staff-only document", "Access-level metadata filter"], ["Answers a question about the CEO", "Similarity threshold and refusal"]] }
    ]}
  ]}
  ]
};
})();
