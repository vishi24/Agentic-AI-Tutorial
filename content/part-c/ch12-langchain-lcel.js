/* Chapter 12 · LangChain and LCEL */
(function () {

var PIPE_SVG = `
<svg viewBox="0 0 680 200" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch12-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="in"><rect class="dg-box" x="10" y="60" width="110" height="64" rx="10"/><text class="dg-title" x="65" y="86" text-anchor="middle">Input</text><text class="dg-muted" x="65" y="106" text-anchor="middle">a dict</text></g>
  <g data-step="prompt"><rect class="dg-box" x="160" y="60" width="120" height="64" rx="10"/><text class="dg-title" x="220" y="86" text-anchor="middle">Prompt</text><text class="dg-muted" x="220" y="106" text-anchor="middle">→ messages</text></g>
  <g data-step="model"><rect class="dg-box accent" x="320" y="60" width="120" height="64" rx="10"/><text class="dg-title" x="380" y="86" text-anchor="middle">Model</text><text class="dg-muted" x="380" y="106" text-anchor="middle">→ AIMessage</text></g>
  <g data-step="parser"><rect class="dg-box" x="480" y="60" width="120" height="64" rx="10"/><text class="dg-title" x="540" y="86" text-anchor="middle">Parser</text><text class="dg-muted" x="540" y="106" text-anchor="middle">→ str / object</text></g>
  <path class="dg-line" d="M120 92H158" marker-end="url(#ch12-a)"/><path class="dg-line" d="M280 92H318" marker-end="url(#ch12-a)"/><path class="dg-line" d="M440 92H478" marker-end="url(#ch12-a)"/>
  <g data-step="runnable"><rect class="dg-box amber" x="150" y="150" width="460" height="34" rx="8"/><text class="dg-text" x="380" y="172" text-anchor="middle">Every piece is a Runnable: invoke · batch · stream · ainvoke</text></g>
  <text class="dg-title" x="340" y="34" text-anchor="middle">chain = prompt | model | parser</text>
</svg>`;

var COMPOSE_SVG = `
<svg viewBox="0 0 680 250" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch12-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="msg"><rect class="dg-box" x="10" y="100" width="110" height="50" rx="10"/><text class="dg-title" x="65" y="130" text-anchor="middle">Message</text></g>
  <g data-step="par"><rect class="dg-box" x="160" y="40" width="190" height="170" rx="12"/><text class="dg-muted" x="255" y="62" text-anchor="middle">RunnableParallel</text>
    <rect class="dg-box" x="180" y="78" width="150" height="46" rx="8"/><text class="dg-text" x="255" y="106" text-anchor="middle">message (passthrough)</text>
    <rect class="dg-box accent" x="180" y="140" width="150" height="46" rx="8"/><text class="dg-text" x="255" y="168" text-anchor="middle">triage (structured)</text></g>
  <g data-step="route"><rect class="dg-box amber" x="390" y="100" width="100" height="50" rx="10"/><text class="dg-title" x="440" y="130" text-anchor="middle">route()</text></g>
  <g data-step="out"><rect class="dg-box" x="530" y="50" width="140" height="50" rx="10"/><text class="dg-text" x="600" y="80" text-anchor="middle">Emergency reply</text>
    <rect class="dg-box accent" x="530" y="150" width="140" height="50" rx="10"/><text class="dg-text" x="600" y="180" text-anchor="middle">Reply chain</text></g>
  <path class="dg-line" d="M120 125H158" marker-end="url(#ch12-b)"/><path class="dg-line" d="M350 125H388" marker-end="url(#ch12-b)"/>
  <path class="dg-line" d="M490 115L528 80" marker-end="url(#ch12-b)"/><path class="dg-line" d="M490 135L528 170" marker-end="url(#ch12-b)"/>
  <text class="dg-muted" x="600" y="120" text-anchor="middle">urgent?</text>
</svg>`;

window.COURSE.chapters.ch12 = {
  id: "ch12",
  title: "LangChain and LCEL",
  oneLine: "LangChain gives you standard, swappable parts (prompts, models, parsers, retrievers) that snap together with the | operator. You already know what each part does; now you get them ready-made.",
  lessons: [

  { title: "Why LangChain, and your first chain", blocks: [
    { type: "section", label: "The problem it solves" },
    { type: "text", md: `In Part B you wrote everything by hand: building messages, calling two different APIs, parsing JSON, retrieving chunks, looping over tools. That was the right way to **learn**. In a real project you would rewrite the same glue code again and again, and switching provider meant touching every file.

[[langchain|LangChain]] is a Python (and JavaScript) library of **standard parts** for LLM apps:

| Part | What it replaces from Part B |
| --- | --- |
| Chat models | The \`if provider == "openai" … else …\` code in \`llm.py\` |
| Prompt templates | f-strings that build message lists |
| Output parsers, structured output | \`json.loads\` plus Pydantic checks |
| Document loaders, splitters | Your file reading and chunking code |
| Vector stores, retrievers | The Chroma / FAISS code from Chapter 6 |
| Tools, agents | Your tool registry and agent loop (next chapter) |

Each part has the **same interface** whatever is behind it, so swapping OpenAI for Anthropic, or Chroma for pgvector, is a one-line change.` },
    { type: "callout", kind: "analogy", md: `Part B taught you to build a car from metal. LangChain is a box of standard car parts with matching bolts. You still need to know what an engine does, but you no longer machine every bolt.` },

    { type: "section", label: "Your first chain" },
    { type: "stepper", svg: PIPE_SVG, caption: "A chain is a pipeline. The output of each step is the input of the next.",
      steps: [
        { on: ["in"], text: "You call the chain with a **dict** of values, such as \`{\"question\": …, \"language\": …}\`." },
        { on: ["prompt"], text: "The **prompt template** fills its \`{placeholders}\` and produces a list of chat messages (system + user)." },
        { on: ["model"], text: "The **chat model** sends the messages to OpenAI or Anthropic and returns an \`AIMessage\` (text, tool calls, token usage)." },
        { on: ["parser"], text: "The **output parser** turns the \`AIMessage\` into what your code wants: a plain string here, or a validated object later." },
        { on: ["runnable"], text: "Because every part is a **Runnable**, the whole chain is too, and gets the same methods for free." }
      ]},
    { type: "code", file: "code-samples/ch12/first_chain.py", lang: "python", code: "@ch12/first_chain.py",
      output: `invoke: No, OPD is closed on Sundays.
batch:  OPD somvar se shanivar, subah 9 se 1 aur shaam 4 se 7 baje tak khula hai.
batch:  OPD is closed between 1 and 4 pm, so please come at 4 pm instead.
stream: Evening OPD runs from 4 to 7 pm, Monday to Saturday.

Prompt sent: [SystemMessage(content='You are the City Clinic helpdesk. Reply in English, in at most two
sentences. Use only these facts: OPD runs Monday to Saturday, 9 am-1 pm and 4-7 pm. Closed on Sundays.'),
HumanMessage(content='Is OPD open on Sunday?')]`,
      note: "Output from a test run with a stand-in model. `get_model()` is a five-line helper in `common/lc_models.py` that reads `PROVIDER` from `.env`. Tested with langchain 1.4.8 and langchain-core 1.7.4." },
    { type: "text", md: `Three things to notice:

1. **\`|\` is [[lcel|LCEL]]** (LangChain Expression Language). \`a | b\` means "send the output of \`a\` into \`b\`". It is ordinary Python operator overloading, nothing magic.
2. **The provider is one setting.** \`init_chat_model("openai:gpt-4.1-mini")\` or \`init_chat_model("anthropic:claude-haiku-5-5")\` returns objects with identical methods.
3. **You can always look inside.** \`prompt.invoke(...)\` shows exactly what the model will receive. When an answer is odd, check the prompt first.` },

    { type: "section", label: "The Runnable interface" },
    { type: "text", md: `| Method | Input → output | Use it for |
| --- | --- | --- |
| \`invoke(x)\` | one → one | A normal call |
| \`batch([x1, x2])\` | many → many, in parallel | Bulk jobs: classify 500 messages. Limit with \`max_concurrency\` |
| \`stream(x)\` | one → pieces as they arrive | Chat UIs (Chapter 5's streaming) |
| \`ainvoke\`, \`abatch\`, \`astream\` | async versions | FastAPI servers (Chapter 4's asyncio) |

Every chain, model, retriever, tool and agent in LangChain has these methods, so once you learn them you can use any part.` },
    { type: "deeper", title: "When not to use LangChain", md: `LangChain adds a layer between you and the API. That layer is helpful when you combine many parts or may switch providers. It gets in the way when:

- You make **one simple call**. The plain SDK (Chapter 5) is clearer.
- You need a **brand-new provider feature** on day one. The SDK gets it first.
- Your team must **debug at the HTTP level**. Each layer is one more thing to step through.

Many teams use LangChain parts (loaders, splitters, model wrappers) and LangGraph (Chapter 14) for orchestration, but write simple calls directly. Mixing is fine.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "LangChain gives standard, swappable parts with one interface.",
      "`prompt | model | parser` is a chain; `|` passes each output to the next part.",
      "Every part is a Runnable: `invoke`, `batch`, `stream` and async versions.",
      "Switching provider is a one-line change with `init_chat_model`."
    ]},
    { type: "quiz", title: "Knowledge check: chains", questions: [
      { kind: "mcq", q: "In `prompt | model | StrOutputParser()`, what does the model step receive?",
        options: ["The raw input dict", "The list of messages produced by the prompt template", "A string", "The parser"],
        answer: 1,
        why: ["The prompt step turns the dict into messages first.", "Right: each step's output is the next step's input.", "The parser produces a string, after the model.", "The parser comes after the model."] },
      { kind: "mcq", q: "You need to classify 500 patient messages quickly without hitting rate limits. Which call?",
        options: ["A for-loop of `invoke`", "`batch(...)` with `max_concurrency` set", "`stream`", "One `invoke` with all 500 joined"],
        answer: 1,
        why: ["Works, but one at a time is slow.", "Right: parallel, with a limit.", "Streaming is for showing one answer as it is written.", "One huge prompt is unreliable and hard to parse."] },
      { kind: "tf", q: "Changing from OpenAI to Anthropic in a LangChain chain means rewriting the chain.", answer: false,
        explain: " Only the model object changes, for example `init_chat_model(\"anthropic:...\")`." }
    ]}
  ]},

  { title: "Structured output and composing chains", blocks: [
    { type: "section", label: "Getting objects, not text" },
    { type: "text", md: `In Chapter 3 you asked for JSON and checked it with Pydantic yourself. LangChain does both in one step: \`model.with_structured_output(Triage)\` returns a **Triage object**, already validated.

Underneath, it uses the provider's tool calling (Chapter 8): your Pydantic class becomes a tool schema, the model is made to "call" it, and the arguments become your object. That is why it is more reliable than "please reply in JSON".` },
    { type: "code", file: "code-samples/ch12/structured_chain.py", lang: "python", code: "@ch12/structured_chain.py",
      output: `Which days does the cardiologist see patients?
  triage: {'intent': 'schedule', 'department': 'cardiology', 'urgent': False}
  reply:  Our cardiologists see patients Monday to Friday; I can check a specific doctor for you.

Why was I charged twice for my ECG?
  triage: {'intent': 'billing', 'department': None, 'urgent': False}
  reply:  Sorry about that. Please share your bill number and our billing desk will check the duplicate ECG charge.

My father has chest pain and is sweating
  triage: {'intent': 'emergency', 'department': 'cardiology', 'urgent': True}
  reply:  Please go to Emergency now or call 108. A nurse is being alerted.`,
      note: "Output from a test run with a stand-in model. The emergency reply is fixed text from code, not from the model." },

    { type: "section", label: "Composing: parallel, passthrough, lambda, route" },
    { type: "stepper", svg: COMPOSE_SVG, caption: "The triage pipeline from the code above.",
      steps: [
        { on: ["msg"], text: "The patient's message comes in as a plain string." },
        { on: ["par"], text: "**RunnableParallel** runs several branches on the same input and collects the results into one dict: \`{\"message\": …, \"triage\": Triage(…)}\`. **RunnablePassthrough** just copies the input through." },
        { on: ["route"], text: "**RunnableLambda** wraps an ordinary Python function. Our \`route()\` reads the triage result and **returns the next Runnable** to run." },
        { on: ["out"], text: "Urgent messages get a fixed emergency reply, written in code. Everything else goes to the reply chain, which adds \`intent\` to the input with \`RunnablePassthrough.assign\`." }
      ]},
    { type: "text", md: `| Building block | What it does | Clinic example |
| --- | --- | --- |
| \`RunnableParallel(a=…, b=…)\` | Run branches at the same time, return a dict | Triage and keep the original message |
| \`RunnablePassthrough()\` | Pass the input through unchanged | Keep the message next to the triage |
| \`RunnablePassthrough.assign(k=fn)\` | Add a key to the input dict | Add \`intent\`, or retrieved \`context\` in RAG |
| \`RunnableLambda(fn)\` | Make any function a Runnable | Routing, cleaning text, calling your own code |
| A function returning a Runnable | Dynamic routing | Emergency vs normal reply |` },
    { type: "callout", kind: "tip", md: `Notice that the emergency rule lives in \`route()\`, in code. The model's triage helps, but the final decision for a safety case is a rule you can test. This is the same principle as Chapter 11: hard rules in code first.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "`with_structured_output(Model)` returns validated objects using tool calling underneath.",
      "`RunnableParallel` runs branches together; `RunnablePassthrough.assign` adds keys.",
      "`RunnableLambda` turns any function into a chain step, including routing.",
      "Keep safety decisions in plain code inside the chain."
    ]},
    { type: "quiz", title: "Knowledge check: composing", questions: [
      { kind: "match", q: "Match each building block to its job.",
        pairs: [["RunnableParallel", "Run branches on the same input, return a dict"], ["RunnablePassthrough.assign", "Add a new key to the input dict"], ["RunnableLambda", "Wrap a plain Python function"], ["with_structured_output", "Return a validated Pydantic object"]] },
      { kind: "mcq", q: "Why is `with_structured_output` usually more reliable than asking for JSON in the prompt?",
        options: ["It uses a bigger model", "It uses the provider's tool calling, so the output must match the schema", "It retries forever", "It removes the system prompt"],
        answer: 1,
        why: ["Model size is unchanged.", "Right.", "It does not retry forever.", "The system prompt is kept."] }
    ]}
  ]},

  { title: "RAG and conversation history with LangChain", blocks: [
    { type: "section", label: "Chapter 7, with standard parts" },
    { type: "text", md: `Your Chapter 7 RAG pipeline had five steps: load, split, embed and store, retrieve, generate. LangChain has a standard part for each, and every part can be swapped without touching the others.

| Step | LangChain part | Common choices |
| --- | --- | --- |
| Load | Document loaders → \`Document(page_content, metadata)\` | \`PyPDFLoader\`, \`TextLoader\`, \`DirectoryLoader\`, \`CSVLoader\`, \`WebBaseLoader\` (in \`langchain_community\`) |
| Split | Text splitters | \`RecursiveCharacterTextSplitter\`, \`MarkdownHeaderTextSplitter\` (in \`langchain_text_splitters\`) |
| Embed + store | Embeddings + vector store | \`InMemoryVectorStore\`, Chroma, FAISS, pgvector, Pinecone |
| Retrieve | \`store.as_retriever(search_kwargs={"k": 3})\` | Similarity, MMR (more varied results), score threshold |
| Generate | Prompt + model + parser | As in Lesson 1 |` },
    { type: "code", file: "code-samples/ch12/rag_chain.py", lang: "python", code: "@ch12/rag_chain.py",
      output: `Q: What are the OPD timings?
A: OPD runs Monday to Saturday, 9 am to 1 pm and 4 pm to 7 pm. [1]

Q: And is the follow-up visit free?
A: A follow-up within 7 days with the same doctor is free. [3]

Retrieved for the first question:
  - opd.md > Timings
  - emergency.md > When to come
  - insurance.md > Pre-authorisation`,
      note: "Output from a test run with a stand-in model and the offline test embedder. With real embeddings the 2nd and 3rd retrieved chunks will differ." },
    { type: "text", md: `How the chain works, step by step:

1. **\`RunnablePassthrough.assign(context=…)\`** keeps \`question\` and \`history\`, and adds \`context\`: the retrieved chunks formatted with numbers and sources.
2. **\`MessagesPlaceholder("history")\`** inserts the earlier conversation between the system message and the new question. That is how "And is the follow-up visit free?" makes sense: the model sees the previous turn.
3. The prompt tells the model to answer **only** from numbered sources and cite them, exactly as in Chapter 7.

Notice the retriever still returned two unrelated chunks for the first question. The model ignored them because the prompt says to use only what answers the question. Chapter 18 shows how to filter and re-rank so weak chunks never reach the model.` },
    { type: "callout", kind: "warning", md: `Older tutorials use \`ConversationBufferMemory\`, \`ConversationChain\` or \`RetrievalQA\`. These are **legacy** in LangChain 1.x (moved to \`langchain_classic\`). For conversations that must survive restarts, use a LangGraph **checkpointer** (Chapter 14). For a simple chain, passing \`history\` yourself, as here, is clear and enough.` },
    { type: "deeper", title: "Multi-query, compression and ensemble retrievers", md: `Chapter 7 built these by hand. LangChain has ready-made versions in \`langchain_classic.retrievers\`:

- \`MultiQueryRetriever.from_llm(retriever, llm)\`: rewrites the question several ways and merges results.
- \`ContextualCompressionRetriever(base_compressor, base_retriever)\`: trims each chunk to the relevant sentences.
- \`EnsembleRetriever(retrievers=[bm25, vector], weights=[0.5, 0.5])\`: hybrid keyword + meaning search with reciprocal rank fusion (Chapter 6).

They are Runnables, so they drop into the chain above in place of \`retriever\`.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Every RAG step has a standard, swappable LangChain part.",
      "`RunnablePassthrough.assign(context=...)` adds retrieved text to the input.",
      "`MessagesPlaceholder` inserts conversation history into the prompt.",
      "Old memory classes are legacy; use LangGraph checkpointers for lasting conversations."
    ]},
    { type: "quiz", title: "Knowledge check: RAG with LangChain", questions: [
      { kind: "order", q: "Put the RAG parts in the order data flows through them when indexing and answering.",
        items: ["Document loader", "Text splitter", "Embeddings + vector store", "Retriever", "Prompt + model"] },
      { kind: "mcq", q: "What makes a follow-up question like \"And is it free?\" understandable to the model?",
        options: ["A bigger k in the retriever", "The earlier turns inserted with MessagesPlaceholder", "A higher temperature", "The output parser"],
        answer: 1,
        why: ["More chunks do not tell the model what \"it\" is.", "Right.", "Temperature controls randomness, not memory.", "The parser runs after the model."] }
    ]}
  ]},

  { title: "Production: tracing, retries, fallbacks, caching, serving", blocks: [
    { type: "section", label: "What changes in production" },
    { type: "text", md: `A chain that works on your laptop meets four new problems in production: you cannot see what happened, the provider sometimes fails, costs add up, and other systems need to call it. LangChain has a built-in answer for each, and all of them are just **configuration** on the same chain.` },
    { type: "code", file: "code-samples/ch12/production_chain.py", lang: "python", code: "@ch12/production_chain.py",
      output: `  [trace] answer 1: 812 ms
Is OPD open Saturday? -> Yes, OPD is open on Saturday, 9 am-1 pm and 4-7 pm.
  [trace] answer 2: 744 ms
Is OPD open Sunday? -> No, OPD is closed on Sundays.
  [trace] answer 3: 0 ms
Is OPD open Saturday? -> Yes, OPD is open on Saturday, 9 am-1 pm and 4-7 pm.

Answers traced: 3; tokens reported: 77 in, 46 out`,
      note: "From a test run with a stand-in model; the millisecond values are illustrative. The test confirmed only 2 calls reached the model: the third answer came from the cache." },
    { type: "text", md: `| Problem | Tool | How it works |
| --- | --- | --- |
| "What happened?" | [[callback|Callbacks]] | Your handler is told about every model start, end and error. Use it for logs, token counts and latency. LangSmith and Langfuse (Chapter 31) are callback handlers. |
| Timeouts, 429s, 500s | \`.with_retry(stop_after_attempt=3)\` | Retries with exponential backoff. \`get_model()\` also sets a timeout and the SDK's own retries. |
| Provider outage | \`.with_fallbacks([backup])\` | If the main model still fails, the same input goes to a backup, such as the other provider. |
| Repeated questions | \`set_llm_cache(...)\` | Identical prompts are answered from a cache. Use Redis or SQLite caches in production. |
| Bulk load | \`config={"max_concurrency": 4}\` | Limits parallel calls in \`batch\`, to stay under rate limits. |
| Finding runs later | \`tags\`, \`run_name\`, \`metadata\` in config | Labels that appear in your traces, such as \`helpdesk\` or a patient-safe request id. |` },
    { type: "callout", kind: "warning", md: `Exact-match caching only helps when the prompt is identical, so it suits FAQs and classification, not conversations. Never cache answers that contain one patient's data and could be served to another; put the user or tenant id into the cache key or do not cache those answers.` },

    { type: "section", label: "Serving a chain" },
    { type: "code", file: "code-samples/ch12/serve_chain.py", lang: "python", code: "@ch12/serve_chain.py",
      output: `POST /ask          {"question": "Is OPD open on Sunday?"}
-> {"answer": "No, OPD is closed on Sundays."}

POST /ask/stream   {"question": "Evening timings?"}
-> data: Evening OPD runs from 4 to 7 pm, Monday to Saturday.
   data: [DONE]

POST /ask          {"question": "x"}
-> 422 (question too short)`,
      note: "Tested with FastAPI's TestClient and a stand-in model." },
    { type: "text", md: `This is Chapter 5's FastAPI, with the chain inside. \`ainvoke\` and \`astream\` keep the server responsive while the model works. You will see **LangServe** in older tutorials: it generated these endpoints automatically, but it is no longer recommended for new projects. For agents built with LangGraph, Chapter 15 covers deployment options.` },
    { type: "list", style: "mistakes", items: [
      "**No timeout.** One stuck request holds a worker for minutes. Set a timeout on the model (our helper uses 30 s).",
      "**Fallback to a model that was never tested.** Run your evaluation set (Chapter 9) against the backup model too.",
      "**Logging full prompts with patient data.** Log ids, token counts and timings; mask or omit personal details.",
      "**Unlimited `batch`.** Without `max_concurrency` a large batch can trigger rate limits for every other user."
    ]},
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Callbacks give you tracing; LangSmith and Langfuse plug in the same way.",
      "`with_retry` and `with_fallbacks` handle failing calls and outages.",
      "Caching helps for identical prompts; be careful with personal data.",
      "Serve chains with FastAPI using `ainvoke` and `astream`."
    ]},
    { type: "quiz", title: "Knowledge check: production chains", questions: [
      { kind: "match", q: "Match each problem to the LangChain feature.",
        pairs: [["Provider is down for an hour", "with_fallbacks"], ["Occasional 429 rate-limit errors", "with_retry"], ["Need token counts per request", "A callback handler"], ["Same FAQ asked 1,000 times a day", "An LLM cache"]] },
      { kind: "tf", q: "It is safe to cache any answer as long as the prompt text is identical.", answer: false,
        explain: " Answers containing one patient's data must not be served to anyone else. Include the user in the key, or do not cache them." }
    ]}
  ]}

  ]
};
})();
