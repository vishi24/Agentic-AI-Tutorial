/* Chapter 18 · Advanced and agentic RAG */
(function () {

var FAIL_SVG = `
<svg viewBox="0 0 680 230" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch18-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="q"><rect class="dg-box" x="10" y="40" width="120" height="50" rx="10"/><text class="dg-title" x="70" y="70" text-anchor="middle">Question</text>
    <text class="dg-muted" x="70" y="118" text-anchor="middle">vague, slangy,</text><text class="dg-muted" x="70" y="134" text-anchor="middle">multi-part</text></g>
  <g data-step="index"><rect class="dg-box" x="150" y="40" width="120" height="50" rx="10"/><text class="dg-title" x="210" y="70" text-anchor="middle">Index</text>
    <text class="dg-muted" x="210" y="118" text-anchor="middle">bad chunks,</text><text class="dg-muted" x="210" y="134" text-anchor="middle">old versions</text></g>
  <g data-step="ret"><rect class="dg-box" x="290" y="40" width="120" height="50" rx="10"/><text class="dg-title" x="350" y="70" text-anchor="middle">Retrieve</text>
    <text class="dg-muted" x="350" y="118" text-anchor="middle">right chunk missed</text><text class="dg-muted" x="350" y="134" text-anchor="middle">or ranked low</text></g>
  <g data-step="gen"><rect class="dg-box accent" x="430" y="40" width="120" height="50" rx="10"/><text class="dg-title" x="490" y="70" text-anchor="middle">Generate</text>
    <text class="dg-muted" x="490" y="118" text-anchor="middle">adds facts,</text><text class="dg-muted" x="490" y="134" text-anchor="middle">ignores sources</text></g>
  <g data-step="hop"><rect class="dg-box amber" x="570" y="40" width="100" height="50" rx="10"/><text class="dg-title" x="620" y="70" text-anchor="middle">Answer</text>
    <text class="dg-muted" x="620" y="118" text-anchor="middle">needs facts from</text><text class="dg-muted" x="620" y="134" text-anchor="middle">several places</text></g>
  <path class="dg-line" d="M130 65H148" marker-end="url(#ch18-a)"/><path class="dg-line" d="M270 65H288" marker-end="url(#ch18-a)"/><path class="dg-line" d="M410 65H428" marker-end="url(#ch18-a)"/><path class="dg-line" d="M550 65H568" marker-end="url(#ch18-a)"/>
  <text class="dg-muted" x="340" y="200" text-anchor="middle">Each stage fails differently, so each needs its own fix. Measure first to find which.</text>
</svg>`;

var AGENTIC_SVG = `
<svg viewBox="0 0 680 300" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch18-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="route"><rect class="dg-box amber" x="10" y="120" width="90" height="50" rx="10"/><text class="dg-title" x="55" y="150" text-anchor="middle">route</text></g>
  <g data-step="other"><rect class="dg-box" x="130" y="20" width="120" height="40" rx="8"/><text class="dg-text" x="190" y="45" text-anchor="middle">schedule tool</text>
    <rect class="dg-box" x="130" y="230" width="120" height="40" rx="8"/><text class="dg-text" x="190" y="255" text-anchor="middle">small talk</text></g>
  <g data-step="retrieve"><rect class="dg-box" x="140" y="120" width="100" height="50" rx="10"/><text class="dg-title" x="190" y="150" text-anchor="middle">retrieve</text></g>
  <g data-step="grade"><rect class="dg-box accent" x="270" y="120" width="90" height="50" rx="10"/><text class="dg-title" x="315" y="150" text-anchor="middle">grade</text></g>
  <g data-step="rewrite"><rect class="dg-box" x="270" y="215" width="90" height="40" rx="8"/><text class="dg-text" x="315" y="240" text-anchor="middle">rewrite</text></g>
  <g data-step="gen"><rect class="dg-box accent" x="400" y="120" width="100" height="50" rx="10"/><text class="dg-title" x="450" y="150" text-anchor="middle">generate</text></g>
  <g data-step="check"><rect class="dg-box accent" x="530" y="120" width="80" height="50" rx="10"/><text class="dg-title" x="570" y="150" text-anchor="middle">check</text></g>
  <g data-step="end"><rect class="dg-box" x="620" y="40" width="54" height="36" rx="18"/><text class="dg-text" x="647" y="63" text-anchor="middle">END</text>
    <rect class="dg-box" x="400" y="215" width="110" height="40" rx="8"/><text class="dg-text" x="455" y="240" text-anchor="middle">"don't know"</text></g>
  <path class="dg-line" d="M100 135L128 45" marker-end="url(#ch18-b)"/><path class="dg-line" d="M100 145H138" marker-end="url(#ch18-b)"/><path class="dg-line" d="M100 155L128 245" marker-end="url(#ch18-b)"/>
  <path class="dg-line" d="M240 145H268" marker-end="url(#ch18-b)"/><path class="dg-accent-line" d="M360 145H398" marker-end="url(#ch18-b)"/>
  <path class="dg-accent-line" d="M315 170V213" marker-end="url(#ch18-b)"/><text class="dg-muted" x="330" y="200">none</text>
  <path class="dg-line" d="M270 235H190V172" marker-end="url(#ch18-b)"/>
  <path class="dg-accent-line" d="M360 160L398 225" marker-end="url(#ch18-b)"/><text class="dg-muted" x="404" y="207">none again</text>
  <path class="dg-line" d="M500 145H528" marker-end="url(#ch18-b)"/>
  <path class="dg-accent-line" d="M600 120L630 78" marker-end="url(#ch18-b)"/><text class="dg-muted" x="590" y="98" text-anchor="end">grounded</text>
  <path class="dg-accent-line" d="M570 170V196H450V172" marker-end="url(#ch18-b)"/><text class="dg-muted" x="510" y="189" text-anchor="middle">retry if unsupported</text>
</svg>`;

var HOP_SVG = `
<svg viewBox="0 0 680 160" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch18-c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="day"><rect class="dg-box amber" x="10" y="60" width="90" height="46" rx="23"/><text class="dg-title" x="55" y="88" text-anchor="middle">Fri</text></g>
  <g data-step="doc"><rect class="dg-box" x="200" y="60" width="110" height="46" rx="23"/><text class="dg-title" x="255" y="88" text-anchor="middle">Dr Rao</text></g>
  <g data-step="dept"><rect class="dg-box amber" x="400" y="60" width="110" height="46" rx="23"/><text class="dg-title" x="455" y="88" text-anchor="middle">cardiology</text></g>
  <g data-step="floor"><rect class="dg-box accent" x="580" y="60" width="90" height="46" rx="23"/><text class="dg-title" x="625" y="88" text-anchor="middle">2nd floor</text></g>
  <path class="dg-line" d="M198 83H102" marker-end="url(#ch18-c)"/><text class="dg-muted" x="150" y="74" text-anchor="middle">sees_patients_on</text>
  <path class="dg-line" d="M310 83H398" marker-end="url(#ch18-c)"/><text class="dg-muted" x="355" y="74" text-anchor="middle">works_in</text>
  <path class="dg-line" d="M510 83H578" marker-end="url(#ch18-c)"/><text class="dg-muted" x="544" y="74" text-anchor="middle">located_on</text>
  <text class="dg-muted" x="20" y="140">Schedule data (from code) and the department directory (from text) joined in one graph.</text>
</svg>`;

window.COURSE.chapters.ch18 = {
  id: "ch18",
  title: "Advanced and agentic RAG",
  oneLine: "Basic RAG fails in predictable ways: stale documents, vague questions, weak ranking, multi-hop questions and made-up details. Each failure has a known fix, and an evaluation set tells you which fixes are actually worth it.",
  lessons: [

  { title: "Why RAG fails, and targeted fixes", blocks: [
    { type: "section", label: "Five places it goes wrong" },
    { type: "stepper", svg: FAIL_SVG, caption: "Where RAG fails. Each stage has its own fixes.",
      steps: [
        { on: ["q"], text: "**The question** is vague (\"my kid needs shots\") or uses words the documents do not. Fixes: query rewriting, multi-query (Chapter 7), HyDE." },
        { on: ["index"], text: "**The index** has chunks cut mid-topic, or both old and new versions of a policy. Fixes: better chunking, metadata (version, status, department) and filters." },
        { on: ["ret"], text: "**Retrieval** misses the right chunk or ranks it below weak ones. Fixes: hybrid search (Chapter 6), fetching more and **re-ranking**." },
        { on: ["gen"], text: "**Generation** adds facts not in the sources. Fixes: strict prompts, groundedness checks, refusing when unsupported." },
        { on: ["hop"], text: "**The answer needs several facts** joined together (\"the cardiologist who works Friday — which floor?\"). Fixes: agentic retrieval in several steps, or a knowledge graph." }
      ]},
    { type: "text", md: `This chapter adds two documents to the Chapter 7 set: a **department directory** (floors, rooms) and the **old 2025 OPD guide**, still sitting in the folder, with the wrong fee (Rs 50) and closing time (5 pm). Every real document store has files like this.` },
    { type: "code", file: "code-samples/ch18/kb.py", lang: "python", code: "@ch18/kb.py",
      note: "Each chunk carries `status` (current or superseded) and `effective` date, read from the document header." },
    { type: "code", file: "code-samples/ch18/retrieval_fixes.py", lang: "python", code: "@ch18/retrieval_fixes.py",
      output: `Q: What time does OPD close on weekdays?
  plain search:         opd_2025.md > Timings (sup) | opd.md > Timings (cur) | emergency.md > Triage (cur)
  current only:         opd.md > Timings (cur) | emergency.md > Triage (cur) | departments.md > Cardiology (cur)

Q: my kid needs shots, where do I go
  plain search:         departments.md > Paediatrics  similarity 0.71
  HyDE fake answer:     Children's vaccinations are given in the paediatrics department, room 006, on the ground floor.
  HyDE search:          departments.md > Paediatrics  similarity 0.77

Q: Can my 10-year-old visit grandpa in the ICU?
  top 5 candidates:     visitors.md > Hygiene (cur) | visitors.md > ICU visits (cur) | emergency.md > Family lounge (cur) | ...
  model scores:         [3, 10, 0, 3, 0]
  after re-ranking:     visitors.md > ICU visits (cur)`,
      note: "From a test run with a stand-in model and the offline test embedder. With real embeddings the exact rankings and similarities will differ; the patterns are the same." },
    { type: "text", md: `What each fix did:

1. **Metadata filter.** The superseded 2025 guide was ranked **first** for the closing-time question. It is similar in meaning, just out of date: no embedding can know that. Filtering on \`status == "current"\` removed it. Always store version, date and status, and filter on them.
2. **[[hyde|HyDE]]** (Hypothetical Document Embeddings). A short, slangy question is a poor search key. The model writes a fake answer in "document language", and you search with that. The fake details do not matter; they are never shown to the user, only used to find the real chunk.
3. **[[re-ranking|Re-ranking]].** Similarity search is fast but rough. Fetch more candidates (5–20), then score each one properly against the question and keep the best 2–3. A model judge works; a **cross-encoder** (a small model that reads the question and passage together, such as \`cross-encoder/ms-marco-MiniLM-L-6-v2\`) is much cheaper and faster.` },
    { type: "deeper", title: "Advanced chunking", md: `Chunking decides what can be found. Beyond splitting by headings (Chapter 6):

- **Parent-child (small-to-big):** search over small chunks (sentences), but give the model the whole parent section. Precise matching, full context.
- **Semantic chunking:** start a new chunk where the meaning shifts, measured by embedding similarity between sentences.
- **Contextual chunks:** prefix each chunk with a one-line summary of its document ("Visitor policy v3, ICU section: …") so it makes sense on its own.
- **Tables and forms:** keep each row with its column headers, or store them in a database and query with a tool instead.

Test each change with your evaluation set (Lesson 4); a "better" chunker can easily make recall worse.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Find which stage fails before choosing a fix.",
      "Store version, date and status with each chunk and filter on them.",
      "HyDE helps short or informal questions; re-ranking fixes weak ordering.",
      "Fetch more, re-rank, keep few: better context and fewer tokens."
    ]},
    { type: "quiz", title: "Knowledge check: targeted fixes", questions: [
      { kind: "match", q: "Match each failure to its fix.",
        pairs: [["An outdated policy ranks first", "Metadata filter on status or date"], ["\"my kid needs shots\" finds nothing useful", "HyDE or query rewriting"], ["The right chunk is 4th of 5", "Re-ranking"], ["The answer needs facts from two documents", "Multi-step retrieval or a knowledge graph"]] },
      { kind: "tf", q: "In HyDE, the invented details in the fake answer are shown to the patient.", answer: false,
        explain: " The fake answer is only used as a search key; the real answer comes from the retrieved documents." }
    ]}
  ]},

  { title: "Agentic RAG: route, grade, rewrite, check", blocks: [
    { type: "section", label: "Letting the system decide how to retrieve" },
    { type: "text", md: `Basic RAG always does the same thing: search once, answer. **[[agentic rag|Agentic RAG]]** adds decisions, using the LangGraph skills from Chapters 14–15. Three published patterns, combined here:

| Pattern | Decision it adds |
| --- | --- |
| **Adaptive RAG** | Does this question need documents, a live tool, or nothing? |
| **[[corrective rag|Corrective RAG]] (CRAG)** | Are the retrieved chunks actually relevant? If not, rewrite and search again, or admit "I don't know" |
| **Self-RAG** | Is the answer supported by the chunks? If not, try again or refuse |` },
    { type: "stepper", svg: AGENTIC_SVG, caption: "The agentic RAG graph built below.",
      steps: [
        { on: ["route"], text: "**route** classifies the question. Doctor schedules change weekly, so they go to the **live tool**, not to documents. Greetings need no retrieval at all." },
        { on: ["other"], text: "Schedule and small-talk branches answer directly and end." },
        { on: ["retrieve"], text: "Policy questions: **retrieve** from current documents." },
        { on: ["grade"], text: "**grade** asks the model, chunk by chunk (in parallel), \"does this help answer the question?\" Irrelevant chunks are dropped before they can mislead the answer." },
        { on: ["rewrite"], text: "No relevant chunks? **rewrite** the question in document language and search **once** more." },
        { on: ["gen"], text: "**generate** answers from the relevant chunks only, with citations." },
        { on: ["check"], text: "**check** asks whether every claim is supported. Unsupported: retry once with a stricter instruction; still unsupported: refuse." },
        { on: ["end"], text: "Every path ends with a grounded answer or an honest \"I don't have that information\"." }
      ]},
    { type: "code", file: "code-samples/ch18/agentic_rag.py", lang: "python", code: "@ch18/agentic_rag.py",
      output: `Q: Can children visit the ICU?
   path:   route:policy -> retrieve -> grade:1/4 relevant -> generate -> check:grounded
   answer: No. Children under 12 may not enter the ICU [1].

Q: my kid needs shots, where do I go
   path:   route:policy -> retrieve -> grade:1/4 relevant -> generate -> check:unsupported ['Bring the vaccination card']
           -> generate -> check:grounded
   answer: Vaccinations are given in room 006, Paediatrics OPD, ground floor, Block C [1].

Q: Which days does the orthopaedics doctor work?
   path:   route:schedule -> schedule_tool
   answer: Dr Iyer (orthopaedics) works on Tuesday and Thursday.

Q: Do you have a cafeteria?
   path:   route:policy -> retrieve -> grade:0/4 relevant -> rewrite:'cafeteria canteen food court location'
           -> retrieve -> grade:0/4 relevant -> dont_know
   answer: I don't have that information. Please ask the front desk (1800-000-000).

Q: Hi there!
   path:   route:smalltalk -> smalltalk
   answer: Hello! I can help with City Clinic timings, visiting rules, insurance and doctors' days.`,
      note: "From a test run with a stand-in model; the graph, retrieval and routing are real. The stand-in added \"Bring the vaccination card\" on purpose to show the check catching an unsupported claim." },
    { type: "text", md: `Two runs are worth reading closely:

- **Vaccinations:** the first answer added advice that is not in any document. The check caught it, the retry used only source facts. This is exactly the kind of small invented detail that erodes trust in a hospital assistant.
- **Cafeteria:** there is no document about it. Instead of answering from a loosely related chunk, the graph graded everything irrelevant, tried a rewrite, and then said so honestly.

The cost: the vaccinations question took 9 model calls (route, 4 grades, 2 generates, 2 checks) instead of 1. Use a **small, cheap model** for routing and grading, and add these steps only where your evaluation shows they help.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Adaptive: route to documents, a live tool, or nothing.",
      "Corrective: grade chunks, rewrite and retry once, admit when nothing is found.",
      "Self-check: verify the answer is grounded; retry or refuse.",
      "Each step adds model calls: use cheap models for grading and routing."
    ]},
    { type: "quiz", title: "Knowledge check: agentic RAG", questions: [
      { kind: "mcq", q: "Why does the router send \"Which days does Dr Iyer work?\" to a tool instead of the documents?",
        options: ["Tools are cheaper", "Schedules change often, so live data is more reliable than a document", "Documents cannot contain names", "The model prefers tools"],
        answer: 1,
        why: ["Not necessarily.", "Right: use the source of truth.", "They can.", "The router's rule decides, based on what is reliable."] },
      { kind: "order", q: "Put the corrective path in order when the first search finds nothing relevant.",
        items: ["retrieve", "grade: 0 relevant", "rewrite the question", "retrieve again", "grade again, then generate or say \"I don't know\""] },
      { kind: "tf", q: "If the groundedness check fails twice, the graph should return the best answer it has.", answer: false,
        explain: " An unsupported answer is the failure we are trying to prevent. Refuse and hand over." }
    ]}
  ]},

  { title: "GraphRAG, and frameworks: LlamaIndex", blocks: [
    { type: "section", label: "When facts must be joined" },
    { type: "text", md: `"Which floor do I go to for the cardiologist who works on Friday?" No single chunk answers this. You need three facts from two sources: Dr Rao works Friday (schedule), Dr Rao is in cardiology (schedule), cardiology is on the 2nd floor (directory).

**[[graphrag|GraphRAG]]** stores facts as a **knowledge graph**: things (nodes) joined by named relationships (edges). To answer, you find the question's entities in the graph and follow the links.` },
    { type: "stepper", svg: HOP_SVG, caption: "A three-hop question answered by following edges.",
      steps: [
        { on: ["day"], text: "The question mentions **Friday**…" },
        { on: ["doc"], text: "…which links to **Dr Rao** through \`sees_patients_on\`…" },
        { on: ["dept"], text: "…who \`works_in\` **cardiology** (also mentioned in the question)…" },
        { on: ["floor"], text: "…which is \`located_on\` the **2nd floor**. Three hops, each a stored fact." }
      ]},
    { type: "code", file: "code-samples/ch18/graph_rag.py", lang: "python", code: "@ch18/graph_rag.py",
      output: `Graph: 20 nodes, 25 edges

Q: Which floor do I go to for the cardiologist who works on Friday?
Facts found (15):
   Dr Khan --sees_patients_on--> Fri
   ...
   Dr Rao --sees_patients_on--> Fri
   Dr Rao --works_in--> cardiology
   cardiology --has_doctor--> Dr Rao
   cardiology --in_block--> Block B
   cardiology --located_on--> 2nd floor
   ...
A: 2nd floor (Block B). Chain: Dr Rao --sees_patients_on--> Fri; Dr Rao --works_in--> cardiology;
   cardiology --located_on--> 2nd floor.

Departments on the ground floor: ['paediatrics']`,
      note: "From a test run with a stand-in model for triple extraction and the answer; the graph building and traversal are real (networkx 3.7)." },
    { type: "text", md: `The pieces:

1. **Extraction:** the model turns sentences into \`(subject, relation, object)\` triples. Give it a fixed list of relation names, and **check a sample by hand**: extraction errors become "facts".
2. **Structured data goes in directly.** The schedule is already structured, so code adds it with no model. Mixing both is normal.
3. **Retrieval = neighbourhood.** Link the question's words to nodes, collect everything within 2 hops, and pass those facts to the model.
4. **Some questions need no model at all.** "Which departments are on the ground floor?" is a graph query.

GraphRAG shines for connected data (doctors, departments, insurers, procedures, drug interactions) and "global" questions across many documents. It costs more to build and keep up to date. Production systems use graph databases such as **Neo4j**, and Microsoft's open-source **GraphRAG** project adds community summaries for very large collections.` },
    { type: "section", label: "LlamaIndex" },
    { type: "text", md: `**LlamaIndex** is a framework focused on RAG: loading many file types, indexing, retrieval and query engines. Where LangChain is a general toolkit, LlamaIndex has more RAG features ready-made (sub-question engines, many index types, document parsing with LlamaParse). The core idea is the same as everything in this chapter:

\`\`\`python
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex
docs = SimpleDirectoryReader("docs").load_data()          # load
index = VectorStoreIndex.from_documents(docs)              # chunk, embed, store
engine = index.as_query_engine(similarity_top_k=3)         # retrieve + generate
print(engine.query("Can children visit the ICU?"))
\`\`\`

You can use LlamaIndex for retrieval inside a LangGraph agent; the frameworks mix well. Choose by your team's needs, then evaluate the result the same way (Lesson 4). This snippet is not run in the course tests.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Multi-hop questions need facts joined together: use multi-step retrieval or a graph.",
      "A knowledge graph stores (subject, relation, object) triples from text and from structured data.",
      "Retrieve by following edges from the question's entities.",
      "LlamaIndex is a RAG-focused framework; it works alongside LangChain and LangGraph."
    ]},
    { type: "quiz", title: "Knowledge check: GraphRAG", questions: [
      { kind: "mcq", q: "Why does plain vector search struggle with \"Which floor for the cardiologist who works Friday?\"",
        options: ["The question is too long", "No single chunk contains all the facts; they must be joined", "Embeddings cannot read numbers", "Floors are not in any document"],
        answer: 1,
        why: ["Length is not the problem.", "Right: it is a multi-hop question.", "Not the issue.", "The directory lists floors."] },
      { kind: "tf", q: "Triples extracted by a model should be spot-checked, because extraction mistakes become stored facts.", answer: true,
        explain: " The graph is only as good as its facts." }
    ]}
  ]},

  { title: "Evaluating RAG (RAGAS-style) and production", blocks: [
    { type: "section", label: "Measure before and after every change" },
    { type: "text", md: `Every technique in this chapter adds cost. The only way to know if it is worth it is to **measure on a test set**. The RAGAS project popularised four metrics, which split "is it good?" into "where does it fail?":

| Metric | Question it answers | Low score means fix… |
| --- | --- | --- |
| **Context recall** | Was the right chunk retrieved at all? | Retrieval: chunking, hybrid search, query rewriting |
| **Context precision** | Was it ranked near the top? | Ranking: re-ranking, filters |
| **[[faithfulness|Faithfulness]]** | Is every claim supported by the retrieved chunks? | Generation: prompts, groundedness checks |
| **Correctness** | Does the answer match the reference? | Whichever of the above is low |` },
    { type: "code", file: "code-samples/ch18/rag_eval.py", lang: "python", code: "@ch18/rag_eval.py",
      output: `  [all docs, k=2] wrong: How much is the OPD registration fee? -> The OPD registration fee is Rs 50 and is valid for 3 days. [1]
  [all docs, k=2] wrong: Can a 10-year-old visit the ICU? -> Visitors with fever or cough should not visit. [1]
  [current, 5 -> rerank 2] wrong: What time does OPD close in the evening? -> I don't have that information. Please ask the front desk.
  ... (other failures trimmed)

set-up                       context_recall  context_precision       faithfulness        correctness
all docs, k=2                          0.83               0.67                1.0                0.5
current only, k=2                      0.83               0.75                1.0               0.67
current, 5 -> rerank 2                 0.83               0.83                1.0               0.83`,
      note: "From a test run with a stand-in model and the offline embedder, so the exact numbers are illustrative. Test set: `rag_eval.json`, six questions with reference answers and correct sources." },
    { type: "text", md: `How to read this table, which is the real skill:

- **Faithfulness is 1.0 everywhere, yet correctness is only 0.5 at first.** "Rs 50" *is* supported by the retrieved chunk: the outdated one. A faithful answer can still be wrong. You need both metrics.
- **The metadata filter fixed the fee** (0.5 → 0.67). **Re-ranking fixed the ICU question** (precision and correctness up).
- **Context recall stayed at 0.83 in every set-up.** One question ("close in the evening") never retrieves the right chunk. Re-ranking can only reorder what was found; this needs a *retrieval* fix (hybrid search, a better chunk). The metrics told you exactly where to look.
- Notice the re-ranked set-up **refused** rather than guessing when nothing scored well. For a hospital, a safe refusal beats a confident wrong answer.

The \`ragas\` Python library implements these metrics (and more) with LLM judges; check its documentation for the current API. Writing them yourself, as here, is about 40 lines and makes them easy to understand and adjust.` },
    { type: "section", label: "RAG in production" },
    { type: "list", items: [
      "**Access control at retrieval time.** Filter chunks by the user's permissions *before* the model sees them. A nurse and a patient must not get the same documents.",
      "**Freshness.** Re-index when documents change; mark old versions superseded or delete them. Show the effective date in citations.",
      "**Monitor in production.** Log retrieved sources, grader decisions and \"don't know\" rates. A rising refusal rate often means a missing or renamed document.",
      "**Cost and latency.** Cache embeddings and frequent answers; use small models for grading; cap the number of chunks.",
      "**Personal data.** Keep patient records out of the general knowledge base. Look them up with permission-checked tools instead.",
      "**Re-run the evaluation** on every change to chunking, models, prompts or documents."
    ]},
    { type: "list", style: "mistakes", items: [
      "**Adding every advanced technique at once.** Costs multiply and you cannot tell which helped.",
      "**Judging RAG only by faithfulness.** Faithful to the wrong document is still wrong.",
      "**One index for everyone.** Retrieval must respect who is asking.",
      "**Never removing old documents.** They keep winning similarity searches."
    ]},
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Context recall and precision diagnose retrieval; faithfulness and correctness diagnose answers.",
      "Compare set-ups on the same test set and keep only changes that help.",
      "Filter by permissions and freshness before generation.",
      "Monitor sources, refusals and costs in production."
    ]},
    { type: "quiz", title: "Knowledge check: evaluating RAG", questions: [
      { kind: "mcq", q: "Context recall stays at 0.83 after adding re-ranking. What does that tell you?",
        options: ["Re-ranking is broken", "The missing chunk is never retrieved, so a retrieval fix (search, chunking) is needed", "The model is too small", "The test set is wrong"],
        answer: 1,
        why: ["Re-ranking did its job on precision.", "Right: re-ranking cannot find what was not retrieved.", "Model size does not affect recall here.", "Possible in general, but the metric points at retrieval."] },
      { kind: "tf", q: "An answer with faithfulness 1.0 is always correct.", answer: false,
        explain: " It may be faithful to an outdated or irrelevant chunk, as with the Rs 50 fee." },
      { kind: "match", q: "Match each production rule to its reason.",
        pairs: [["Filter by user permissions before generating", "Patients must not see staff-only documents"], ["Mark old versions superseded", "Stops outdated facts winning searches"], ["Track the \"don't know\" rate", "Reveals missing or renamed documents"]] }
    ]}
  ]}

  ]
};
})();
