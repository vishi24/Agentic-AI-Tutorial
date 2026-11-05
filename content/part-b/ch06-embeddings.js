/* Chapter 6 · Embeddings and vector databases */
(function () {

function dot(x, y, label, cls, step) {
  return '<g data-step="' + step + '"><circle cx="' + x + '" cy="' + y + '" r="7" class="dg-box' + (cls ? " " + cls : "") + '"/><text class="dg-text" x="' + (x + 12) + '" y="' + (y + 5) + '">' + label + "</text></g>";
}
var MAP_SVG = `
<svg viewBox="0 0 680 330" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="660" height="310" rx="12" fill="none" stroke="var(--line)"/>
  <text class="dg-muted" x="24" y="34">A "meaning map" (real embeddings have hundreds of dimensions; this is a 2-D sketch)</text>
  ` + dot(90, 90, "Children's vaccinations", "", "vacc") + dot(120, 130, "baby shots", "", "vacc") + dot(70, 160, "kid needs his shots", "accent", "query") +
      dot(420, 80, "Free parking in basement", "", "park") + dot(450, 120, "where to leave my scooter", "", "park") +
      dot(380, 230, "PM-JAY cards accepted", "", "ins") + dot(420, 270, "Ayushman Bharat", "", "ins") + dot(300, 250, "itemised bills", "", "ins") +
      dot(170, 260, "Emergency open 24 hours", "", "em") + dot(130, 290, "chest pain, call 108", "", "em") + `
  <g data-step="query"><path d="M78 154L94 98" class="dg-accent-line"/><text class="dg-muted" x="200" y="190">nearest neighbours = closest meaning</text></g>
</svg>`;

var PIPE_SVG = `
<svg viewBox="0 0 680 160" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch06-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="docs"><rect class="dg-box" x="10" y="30" width="120" height="56" rx="8"/><text class="dg-title" x="70" y="54" text-anchor="middle">Documents</text><text class="dg-muted" x="70" y="72" text-anchor="middle">FAQ, policies</text></g>
  <g data-step="chunk"><rect class="dg-box" x="150" y="30" width="110" height="56" rx="8"/><text class="dg-title" x="205" y="54" text-anchor="middle">Chunk</text><text class="dg-muted" x="205" y="72" text-anchor="middle">small pieces</text></g>
  <g data-step="embed"><rect class="dg-box accent" x="280" y="30" width="110" height="56" rx="8"/><text class="dg-title" x="335" y="54" text-anchor="middle">Embed</text><text class="dg-muted" x="335" y="72" text-anchor="middle">text → vector</text></g>
  <g data-step="store"><rect class="dg-box" x="410" y="30" width="120" height="56" rx="8"/><text class="dg-title" x="470" y="54" text-anchor="middle">Vector DB</text><text class="dg-muted" x="470" y="72" text-anchor="middle">+ metadata</text></g>
  <g data-step="query"><rect class="dg-box amber" x="550" y="30" width="120" height="56" rx="8"/><text class="dg-title" x="610" y="54" text-anchor="middle">Query</text><text class="dg-muted" x="610" y="72" text-anchor="middle">nearest k</text></g>
  <path class="dg-line" d="M130 58H148" marker-end="url(#ch06-a)"/><path class="dg-line" d="M260 58H278" marker-end="url(#ch06-a)"/><path class="dg-line" d="M390 58H408" marker-end="url(#ch06-a)"/><path class="dg-line" d="M530 58H548" marker-end="url(#ch06-a)"/>
  <text class="dg-muted" x="10" y="122">Indexing (once, and on every change):  documents → chunk → embed → store</text>
  <text class="dg-muted" x="10" y="142">Searching (every question):  embed the question with the SAME model → find nearest vectors</text>
</svg>`;

window.COURSE.chapters.ch06 = {
  id: "ch06",
  title: "Embeddings and vector databases",
  oneLine: "An embedding turns text into a list of numbers that captures its meaning, so a computer can find 'kid needs his shots' when the document says 'children's vaccinations'.",
  lessons: [

  { title: "Embeddings: meaning as numbers", blocks: [
    { type: "section", label: "The problem" },
    { type: "text", md: `A patient types "my kid needs his shots". The FAQ says "Children's vaccinations are given on Tuesdays and Fridays". The two share **no words**, so a keyword search finds nothing. A person sees immediately that they mean the same thing. We need the computer to compare **meaning**, not spelling.` },
    { type: "section", label: "What an embedding is" },
    { type: "text", md: `An [[embedding]] is a list of numbers (a **vector**), often 384 to 3,072 of them, produced by an embedding model. The model is trained so that texts with similar meaning get similar numbers. You can think of each text as a point on a huge map, where nearby points mean similar things.` },
    { type: "stepper", svg: MAP_SVG, caption: "Texts with similar meaning land close together.",
      steps: [
        { on: ["vacc"], text: "Texts about **vaccinations** cluster together, whatever words they use." },
        { on: ["park"], text: "Texts about **parking** form another cluster. \"Scooter\" lands near \"parking\" because the model learned they are related." },
        { on: ["ins", "em"], text: "**Insurance** and **emergency** texts each form their own neighbourhoods." },
        { on: ["query"], text: "A **question** is embedded the same way. The nearest points are the answers with the closest meaning: this is **semantic search**." }
      ]},
    { type: "section", label: "Measuring closeness" },
    { type: "text", md: `| Measure | Idea | Range | Note |
| --- | --- | --- | --- |
| **Cosine similarity** | The angle between two vectors | -1 to 1 (usually 0 to 1) | The default for text |
| **Dot product** | Cosine × lengths | Any | Same ranking as cosine when vectors are normalised |
| **L2 (Euclidean) distance** | Straight-line distance | 0 upwards; smaller is closer | Common in FAISS |

Most embedding models return normalised vectors (length 1), so all three give the **same ranking**. Use cosine unless your database expects otherwise.` },
    { type: "code", file: "code-samples/ch06/similarity.py", lang: "python", code: "@ch06/similarity.py",
      output: `12 FAQ entries -> vectors of 1536 numbers each
First 5 numbers of entry 1: [-0.012  0.041 -0.007  0.019 -0.033]

Q: Can I bring my scooter?
   0.62  Free parking is available in the basement. Two-wheelers park near gate 2.
   0.31  Emergency is open 24 hours. For chest pain or breathing trouble, come to ...

Q: Do you accept Ayushman Bharat?
   0.71  We accept PM-JAY (Ayushman Bharat) cards at the insurance desk on the ground floor.
   0.38  Itemised bills can be collected from the billing counter or downloaded ...

Q: my kid needs his shots
   0.55  Children's vaccinations are given on Tuesdays and Fridays from 10 am to noon.
   0.27  The hospital pharmacy near the main lobby is open from 8 am to 10 pm.`,
      note: "Illustrative scores; they depend on the embedding model. What matters is the ranking: the right entry comes first. The shared `llm.embed()` uses OpenAI by default or a free local model with `EMBEDDINGS=local`." },
    { type: "section", label: "Choosing an embedding model" },
    { type: "text", md: `| Option | Example | Good for | Watch out |
| --- | --- | --- | --- |
| Hosted API | OpenAI \`text-embedding-3-small\` | Quick start, strong quality, many languages | Text leaves your network; cost per token (small) |
| Local, open model | \`all-MiniLM-L6-v2\` (sentence-transformers) | Free, private, offline | Weaker on Indian languages; you run it |
| Multilingual local | Multilingual models from Hugging Face | Hindi, Tamil, mixed-language queries | Larger, slower |

Anthropic does not offer its own embedding model, so Claude-based systems pair it with one of these.

**Golden rule:** documents and questions must be embedded with **the same model**. Vectors from different models are not comparable; if you change the model, re-embed everything.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "An embedding is a vector that captures meaning; similar meanings give nearby vectors.",
      "Semantic search embeds the question and finds the nearest document vectors.",
      "Cosine similarity is the usual measure; with normalised vectors the measures agree.",
      "Always use the same model for documents and questions; re-embed if you change it."
    ]},
    { type: "quiz", title: "Knowledge check: embeddings", questions: [
      { kind: "mcq", q: "Why does semantic search find \"Children's vaccinations\" for \"my kid needs his shots\"?",
        options: ["It matches the word 'needs'", "Their embeddings are close because their meanings are similar", "It uses a dictionary of synonyms", "It searches every word one by one"],
        answer: 1,
        why: ["That word is not in the FAQ entry.", "Right.", "No hand-made synonym list is involved.", "That is keyword search."] },
      { kind: "tf", q: "You can embed documents with one model and questions with another, as long as both have 1,536 dimensions.", answer: false,
        explain: " Different models place meanings differently. Same size does not mean same map." },
      { kind: "mcq", q: "Your vectors are normalised. Cosine similarity and dot product will…",
        options: ["Give different rankings", "Give the same ranking", "Both fail", "Need different databases"],
        answer: 1,
        why: ["Not when vectors have length 1.", "Right: dot product = cosine for unit vectors.", "Both work.", "Either works in most databases."] }
    ]}
  ]},

  { title: "Vector databases", blocks: [
    { type: "section", label: "Why a database" },
    { type: "text", md: `Comparing a question with 12 FAQ vectors is instant. Comparing it with 2 million chunks from every policy, circular and discharge template is not. A [[vector database]] stores vectors with their text and **metadata**, and finds the nearest ones quickly using a special index.` },
    { type: "diagram", svg: PIPE_SVG, caption: "Indexing happens once (and on every change); searching happens for every question." },
    { type: "section", label: "ChromaDB: store, filter, update" },
    { type: "code", file: "code-samples/ch06/vector_store.py", lang: "python", code: "@ch06/vector_store.py",
      output: `Entries stored: 12
{'id': 'faq-03', 'text': 'We accept PM-JAY (Ayushman Bharat) cards at the insurance desk ...', 'dept': 'billing', 'similarity': 0.71}
{'id': 'faq-10', 'text': 'Itemised bills can be collected from the billing counter ...', 'dept': 'billing', 'similarity': 0.42}
{'id': 'faq-04', 'text': 'Refunds for cancelled procedures are processed within 7 working days ...', 'dept': 'billing', 'similarity': 0.33}

Only billing entries:
{'id': 'faq-10', ...}
{'id': 'faq-03', ...}

After deleting faq-08: 11 entries`,
      note: "Tested with ChromaDB 1.5. Illustrative similarities. Embeddings are passed in explicitly, so Chroma never downloads its own default model." },
    { type: "text", md: `What each part does:

- **Collection:** a named set of entries, like a table. Each entry has an **id**, the **document** text, its **embedding** and **metadata**.
- **\`hnsw:space: cosine\`** tells Chroma to compare by cosine. Chroma returns *distance* (smaller is closer), so \`1 - distance\` gives similarity.
- **\`upsert\`** inserts new ids and overwrites existing ones, so re-running the indexer keeps one copy of each entry.
- **\`where={"dept": "billing"}\`** filters by metadata *before* ranking. Use metadata for department, language, document date, and access level (who may see it).
- **\`delete\`** removes entries when the source document is withdrawn. A stale index answers with outdated policy.` },
    { type: "section", label: "FAISS: exact vs fast" },
    { type: "text", md: `**FAISS** is a library (not a server) for very fast vector search. It offers several index types, which trade speed for accuracy:

| Index | How it searches | Speed | Accuracy | Use when |
| --- | --- | --- | --- | --- |
| **Flat** | Compares the query with every vector | Slow at scale | Exact | Up to ~100,000 vectors, or as the reference |
| **HNSW** | Walks a graph of neighbours | Very fast | Approximate, tunable | The common default for large sets |
| **IVF** | Groups vectors into clusters, searches only nearby clusters | Fast | Approximate, tunable | Very large sets, lower memory |` },
    { type: "code", file: "code-samples/ch06/faiss_compare.py", lang: "python", code: "@ch06/faiss_compare.py",
      output: `50,000 vectors of 384 dimensions, 200 queries, top 10

index           build s  ms/query  recall@10
Flat (exact)       0.05     1.186       100%
HNSW               2.04     0.031        99%
IVF                1.36     0.112       100%`,
      note: "Real output from running this script. HNSW answered about 40 times faster than exact search while still finding 99% of the true top 10." },
    { type: "text", md: `Read the result like a trade-off: HNSW takes longer to **build** but answers in a fraction of the time with almost perfect **recall** (share of the true top results found). The settings \`efSearch\` (HNSW) and \`nprobe\` (IVF) move you along that trade-off.

**Which to choose?** Chroma, pgvector (inside PostgreSQL), Qdrant, Weaviate and Pinecone all use approximate indexes like HNSW internally. For a helpdesk with thousands of documents, any of them is fine; pick the one that fits your hosting. FAISS is ideal inside a Python service or for experiments.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "A vector database stores vectors with text and metadata and finds nearest neighbours fast.",
      "Use metadata filters for department, language, date and access level.",
      "Keep the index in sync with sources: upsert changes, delete withdrawn documents.",
      "Approximate indexes (HNSW, IVF) are much faster with near-exact recall; Flat is the exact reference."
    ]},
    { type: "quiz", title: "Knowledge check: vector databases", questions: [
      { kind: "mcq", q: "A visitor policy was withdrawn last month, but the helpdesk still quotes it. What was missed?",
        options: ["The embedding model is too small", "The withdrawn entries were never deleted from the index", "Cosine similarity is wrong", "HNSW is approximate"],
        answer: 1,
        why: ["Model size is not the issue.", "Right: keep the index in sync with the source.", "Similarity worked; the data was stale.", "Approximation does not add old documents."] },
      { kind: "match", q: "Match each FAISS index to its description.",
        pairs: [["Flat", "Compares with every vector; exact"], ["HNSW", "Walks a graph of neighbours; very fast"], ["IVF", "Searches only the nearest clusters"]] },
      { kind: "mcq", q: "Staff documents and patient documents share one collection. How do you stop patients seeing staff-only text?",
        options: ["Ask the model not to show it", "Store an access-level field in metadata and filter on it in every query", "Use a bigger embedding model", "Use FAISS instead"],
        answer: 1,
        why: ["Prompts are not access control.", "Right (or use separate collections).", "Unrelated.", "The engine does not matter; the filter does."] }
    ]}
  ]},

  { title: "Hybrid search", blocks: [
    { type: "section", label: "The problem" },
    { type: "text", md: `Embeddings are great at meaning but can be weak at **exact terms**: codes, names, abbreviations. "PM-JAY", "ECG" and "gate 2" are best found by matching the exact words. Keyword search is great at exact terms and hopeless at meaning. Production systems use **both**.` },
    { type: "section", label: "BM25 + embeddings + Reciprocal Rank Fusion" },
    { type: "text", md: `- **BM25** is the classic keyword-ranking formula used by search engines. It rewards documents that contain the query's words, especially rare words.
- **Embeddings** rank by meaning.
- **Reciprocal Rank Fusion (RRF)** merges the two ranked lists: each document scores 1/(60 + its rank) in each list, and the scores are added. A document near the top of *either* list rises. RRF needs no tuning and works with scores on different scales.` },
    { type: "code", file: "code-samples/ch06/hybrid_search.py", lang: "python", code: "@ch06/hybrid_search.py",
      output: `Q: PM-JAY
  keyword  -> faq-03  We accept PM-JAY (Ayushman Bharat) cards at the insurance de
  vector   -> faq-03  We accept PM-JAY (Ayushman Bharat) cards at the insurance de
  hybrid   -> faq-03  We accept PM-JAY (Ayushman Bharat) cards at the insurance de

Q: my kid needs his shots
  keyword  -> faq-01  OPD runs Monday to Saturday, 9 am to 1 pm and 4 pm to 7 pm.
  vector   -> faq-07  Children's vaccinations are given on Tuesdays and Fridays fr
  hybrid   -> faq-07  Children's vaccinations are given on Tuesdays and Fridays fr

Q: ECG reports
  keyword  -> faq-05  For an ECG or echo test, bring your previous reports and the
  vector   -> faq-05  For an ECG or echo test, bring your previous reports and the
  hybrid   -> faq-05  For an ECG or echo test, bring your previous reports and the`,
      note: "Output from a test run. Keyword search fails on the 'shots' question; hybrid keeps the best of both." },
    { type: "callout", kind: "warning", title: "Two bugs this code avoids (we hit both while testing it)", md: `1. **No keyword match, but BM25 still returns an order.** When a question shares no words with any document, every BM25 score is zero and the "ranking" is just the file order. Fed into RRF, that noise pushed the wrong entry up. Fix: only give keyword credit to documents that actually match (\`keyword_rank\`).
2. **Matching on filler words.** Without removing stopwords ("the", "for", "in"), BM25 "matches" almost everything. Removing them raised keyword recall from 50% to 67% in our test.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Keyword search (BM25) wins on exact terms; embeddings win on meaning.",
      "Hybrid search merges both, usually with Reciprocal Rank Fusion.",
      "Give keyword credit only to real matches, and remove stopwords."
    ]},
    { type: "quiz", title: "Knowledge check: hybrid search", questions: [
      { kind: "match", q: "Which search finds it best?",
        pairs: [["\"PM-JAY\"", "Keyword (BM25)"], ["\"my kid needs his shots\"", "Embeddings"], ["\"ECG reports for my heart test\"", "Hybrid"]] },
      { kind: "tf", q: "In RRF, a document must rank highly in both lists to come out on top.", answer: false,
        explain: " Ranking near the top of either list earns a high score; both is best." }
    ]}
  ]},

  { title: "Production: chunking and retrieval quality", blocks: [
    { type: "section", label: "Chunking decides what can be found" },
    { type: "text", md: `Documents are too long to embed whole: one vector for a 20-page policy blurs every topic together. We cut them into **chunks** and embed each one. How you cut matters more than which database you choose.` },
    { type: "code", file: "code-samples/ch06/chunking.py", lang: "python", code: "@ch06/chunking.py",
      output: `=== Fixed size (120, overlap 20): 6 chunks ===
  [120] # Visitor policy / Visiting hours for inpatient wards are 4 pm to 6 pm daily. Only two visit...
  [120] lowed per patient at a time. / Children under 12 may not visit the ICU. Visitors must saniti...
  ...
  [  6] floor.

=== By sentence: 3 chunks ===
  [169] # Visitor policy Visiting hours for inpatient wards are 4 pm to 6 pm daily. Only two visit...
  [163] Visitors must sanitise their hands at the ward entrance. # ICU rules The ICU allows one vi...
  [170] Flowers and outside food are not allowed in the ICU. # Emergency Emergency is open 24 hour...

=== Recursive: 4 chunks ===
  [128] # Visitor policy / Visiting hours for inpatient wards are 4 pm to 6 pm daily. Only two visit...
  [ 97] Children under 12 may not visit the ICU. Visitors must sanitise their hands at the ward en...
  [159] # ICU rules / The ICU allows one visitor at a time for 15 minutes. Mobile phones must be swi...
  [117] # Emergency / Emergency is open 24 hours. Visitors to Emergency patients wait in the family ...`,
      note: "Real output from running the script." },
    { type: "text", md: `Compare the three:

- **Fixed size** cuts mid-word ("visit... lowed") and leaves a useless 6-character chunk ("floor."). Overlap helps, but chunks still mix topics.
- **By sentence** keeps sentences whole but mixes sections: one chunk contains both visitor rules and the ICU heading.
- **Recursive** splits on the biggest natural boundary first (headings, then paragraphs, then sentences), so each chunk is about one thing. **Start here.**

Good habits: keep the **heading** with each chunk (it tells the model what the chunk is about), store **source and section** as metadata for citations, and aim for roughly 200–500 tokens per chunk for policy text. Then **measure** (below) rather than guess.` },
    { type: "section", label: "Measure retrieval before you build on it" },
    { type: "text", md: `If retrieval does not find the right chunk, nothing after it can fix that (Chapter 7). So measure retrieval on its own, with **labelled questions**: each question paired with the entry that answers it.

- **recall@k:** the share of questions whose correct entry is in the top *k*.
- **MRR (mean reciprocal rank):** 1 if the correct entry is first, ½ if second, ⅓ if third, averaged. Rewards putting it at the top.` },
    { type: "code", file: "code-samples/ch06/retrieval_eval.py", lang: "python", code: "@ch06/retrieval_eval.py",
      output: `method    recall@3    MRR
keyword        67%   0.61
         missed: 'Which heart specialists do you have?' (correct entry ranked 6)
         missed: 'When can my baby get vaccines?' (correct entry ranked 7)
         missed: 'Where can I leave my scooter?' (correct entry ranked 8)
         missed: 'I need a detailed bill for insurance' (correct entry ranked 10)
vector        100%   0.96
hybrid        100%   0.86`,
      note: "Output from a test run with a simplified stand-in embedder, so the vector scores are optimistic. With a real model, expect vector and hybrid to differ more on exact terms. Run it with your own model to get your numbers." },
    { type: "text", md: `Use the misses: each one tells you something. "Heart specialists" missing on keyword search shows why embeddings are needed; an exact code missing on vector search shows why hybrid is needed. Run this after **every** change to chunking, model or method, and keep the change only if the numbers improve.` },
    { type: "section", label: "Production checklist" },
    { type: "list", items: [
      "Recursive chunking with headings kept, source and section stored as metadata.",
      "One embedding model for everything, its name stored with the index; re-embed when it changes.",
      "Re-index on every document change: upsert new versions, delete withdrawn ones.",
      "Access level and language in metadata, filtered on every query.",
      "Hybrid search for anything with codes, names or abbreviations.",
      "A labelled question set with recall@k and MRR, run after every change."
    ]},
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Chunking decides what can be found; recursive chunking keeps each chunk about one topic.",
      "Measure retrieval alone with recall@k and MRR before building answers on top.",
      "Each miss points to a fix: chunking, model, keywords or metadata."
    ]},
    { type: "quiz", title: "Knowledge check: chunking and retrieval quality", questions: [
      { kind: "mcq", q: "Fixed-size chunks often perform worse than recursive chunks because…",
        options: ["They are too small", "They cut through words and mix topics", "They cannot be embedded", "They use more storage"],
        answer: 1,
        why: ["Size can be set either way.", "Right.", "Any text can be embedded.", "Storage is similar."] },
      { kind: "mcq", q: "Correct entries ranked 1st, 2nd and 4th for three questions. What is the MRR?",
        options: ["0.58", "0.33", "1.00", "0.75"],
        answer: 0,
        why: ["Right: (1 + 1/2 + 1/4) / 3 = 0.58.", "That is 1/3.", "Only if all were first.", "Not the formula."] },
      { kind: "tf", q: "If retrieval misses the right chunk, a better LLM will still find the answer.", answer: false,
        explain: " The model can only use what it is given. Fix retrieval first." }
    ]}
  ]}
  ]
};
})();
