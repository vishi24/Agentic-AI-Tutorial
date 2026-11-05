/* Chapter 5 · Your first AI app */
(function () {

var LIFECYCLE_SVG = `
<svg viewBox="0 0 680 300" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch05-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <text class="dg-title" x="80" y="24" text-anchor="middle">Browser UI</text>
  <text class="dg-title" x="300" y="24" text-anchor="middle">FastAPI server</text>
  <text class="dg-title" x="560" y="24" text-anchor="middle">Model provider</text>
  <line x1="80" y1="34" x2="80" y2="290" stroke="var(--line)" stroke-dasharray="4 4"/>
  <line x1="300" y1="34" x2="300" y2="290" stroke="var(--line)" stroke-dasharray="4 4"/>
  <line x1="560" y1="34" x2="560" y2="290" stroke="var(--line)" stroke-dasharray="4 4"/>
  <g data-step="req"><path class="dg-line" d="M80 60H296" marker-end="url(#ch05-a)"/><text class="dg-muted" x="190" y="54" text-anchor="middle">POST /ask {"question": ...}</text></g>
  <g data-step="validate"><rect class="dg-box amber" x="230" y="74" width="140" height="34" rx="6"/><text class="dg-text" x="300" y="96" text-anchor="middle">Pydantic validates</text></g>
  <g data-step="call"><path class="dg-line" d="M300 126H556" marker-end="url(#ch05-a)"/><text class="dg-muted" x="430" y="120" text-anchor="middle">llm.chat(...) with API key</text></g>
  <g data-step="model"><rect class="dg-box accent" x="490" y="140" width="140" height="34" rx="6"/><text class="dg-text" x="560" y="162" text-anchor="middle">model writes reply</text></g>
  <g data-step="back"><path class="dg-line" d="M556 192H304" marker-end="url(#ch05-a)"/><text class="dg-muted" x="430" y="186" text-anchor="middle">text + token counts</text></g>
  <g data-step="resp"><path class="dg-line" d="M296 230H84" marker-end="url(#ch05-a)"/><text class="dg-muted" x="190" y="224" text-anchor="middle">200 OK {"answer": ...}</text></g>
  <text class="dg-muted" x="20" y="276">The key stays on the server. The browser never sees it.</text>
</svg>`;

var SSE_SVG = `
<svg viewBox="0 0 680 150" xmlns="http://www.w3.org/2000/svg">
  <text class="dg-title" x="20" y="24">Without streaming</text>
  <rect class="dg-box" x="20" y="34" width="420" height="24" rx="4"/><text class="dg-muted" x="230" y="51" text-anchor="middle">waiting… (5 s of blank screen)</text>
  <rect class="dg-box accent" x="444" y="34" width="216" height="24" rx="4"/><text class="dg-text" x="552" y="51" text-anchor="middle">whole answer appears</text>
  <text class="dg-title" x="20" y="94">With streaming (SSE)</text>
  <rect class="dg-box" x="20" y="104" width="60" height="24" rx="4"/>
  <rect class="dg-box accent" x="84" y="104" width="576" height="24" rx="4"/><text class="dg-text" x="372" y="121" text-anchor="middle">words appear from 0.6 s onwards, same total time</text>
</svg>`;

window.COURSE.chapters.ch05 = {
  id: "ch05",
  title: "Your first AI app",
  oneLine: "Wrap the model in a small web API with FastAPI, stream answers word by word, put a chat screen on top with Streamlit or Gradio, and test it all without spending a rupee.",
  lessons: [

  { title: "A web API with FastAPI", blocks: [
    { type: "section", label: "The problem" },
    { type: "text", md: `A Python script on your laptop helps one person. A hospital needs the helpdesk inside its website, its mobile app and maybe WhatsApp. The standard way is a **web [[api|API]]**: a small server that receives a question over the internet and returns an answer. Every screen then talks to the same API, and the API key never leaves the server.` },
    { type: "section", label: "REST in five minutes" },
    { type: "text", md: `| Method | Meaning | Helpdesk example |
| --- | --- | --- |
| GET | Read something | \`GET /health\`: is the service up? |
| POST | Send something to process | \`POST /ask\` with a question |
| PUT / PATCH | Update | Change a saved preference |
| DELETE | Remove | Delete a conversation |

| Status code | Meaning |
| --- | --- |
| 200 | OK |
| 413 / 415 | File too large / wrong file type |
| 422 | The request data is invalid (e.g. an empty question) |
| 429 | Too many requests |
| 500 / 503 | Something failed on the server / service temporarily unavailable |

Requests and responses carry [[json|JSON]].` },
    { type: "stepper", svg: LIFECYCLE_SVG, caption: "One request through the helpdesk API.",
      steps: [
        { on: ["req"], text: "**The UI sends** `POST /ask` with the question as JSON." },
        { on: ["validate"], text: "**Pydantic validates** it. An empty or 5,000-character question is rejected with 422 before any money is spent." },
        { on: ["call"], text: "**The server calls the model** using `llm.chat`. The API key lives only here." },
        { on: ["model"], text: "**The model writes** the reply." },
        { on: ["back"], text: "**Text and token counts** come back to the server, which can log cost." },
        { on: ["resp"], text: "**The server replies** to the UI with a clean JSON answer." }
      ]},
    { type: "section", label: "The API" },
    { type: "code", file: "code-samples/ch05/api.py", lang: "python", code: "@ch05/api.py" },
    { type: "text", md: `How FastAPI works, in the order you meet it in the file:

- **\`app = FastAPI(...)\`** creates the application.
- **Pydantic models** (\`AskRequest\`, \`AskResponse\`) describe the JSON in and out. FastAPI validates every request against them automatically, and \`Field(min_length=1, max_length=1000)\` rejects empty or huge questions.
- **Decorators** such as \`@app.post("/ask")\` connect a URL and method to a function.
- **\`response_model=AskResponse\`** guarantees the shape of what goes back.
- **The middleware** gives every request an id and logs its duration, which is essential when a patient reports "it was slow at 10:42".
- **\`HTTPException(503, ...)\`** turns a provider failure into a polite message. Never show raw error text to users.` },
    { type: "code", file: "terminal", lang: "bash", code: `cd code-samples/ch05
pip install fastapi uvicorn python-multipart
uvicorn api:app --reload               # --reload restarts on code changes (development only)
# open http://127.0.0.1:8000/docs  -> Swagger UI: try every endpoint in the browser
curl -X POST http://127.0.0.1:8000/ask -H "Content-Type: application/json" \\
     -d '{"question": "What are the OPD timings?"}'`,
      output: `{"answer":"Our OPD runs Monday to Saturday, 9 am to 1 pm and 4 pm to 7 pm.","input_tokens":58,"output_tokens":21,"model":"gpt-4.1-mini"}` },
    { type: "callout", kind: "tip", md: `**Swagger UI** at \`/docs\` is generated from your Pydantic models. It is your free, always-up-to-date documentation and test console. Share it with the mobile team instead of writing API docs by hand.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "A web API lets every screen use the same helpdesk, and keeps the key on the server.",
      "FastAPI + Pydantic validate every request before any model call.",
      "Return friendly errors with proper status codes; log a request id and duration.",
      "Swagger UI at /docs documents and tests your API for free."
    ]},
    { type: "quiz", title: "Knowledge check: FastAPI", questions: [
      { kind: "mcq", q: "A client sends `{\"question\": \"\"}` to /ask. What happens?",
        options: ["The model is called with an empty question", "FastAPI returns 422 before calling the model", "The server crashes", "It returns 200 with an empty answer"],
        answer: 1,
        why: ["Validation stops it first.", "Right: min_length=1.", "Validation errors are handled.", "Validation fails first."] },
      { kind: "tf", q: "Putting the API key in the browser's JavaScript is fine if the site uses HTTPS.", answer: false,
        explain: " Anyone can read a page's JavaScript. Keys must stay on the server." },
      { kind: "match", q: "Match the status code to its meaning.",
        pairs: [["200", "OK"], ["422", "Invalid request data"], ["503", "Service temporarily unavailable"], ["415", "Wrong file type"]] }
    ]}
  ]},

  { title: "Streaming answers", blocks: [
    { type: "section", label: "The problem" },
    { type: "text", md: `A 200-word answer takes several seconds to generate. Staring at a blank screen for 5 seconds feels broken; watching words appear after half a second feels fast, even though the total time is the same.` },
    { type: "diagram", svg: SSE_SVG, caption: "Streaming does not make generation faster; it shows progress sooner." },
    { type: "section", label: "Server-Sent Events" },
    { type: "text", md: `**Server-Sent Events (SSE)** is a simple, standard way for a server to push text to a browser over one open HTTP connection. Each event is a line starting with \`data:\` followed by a blank line:` },
    { type: "code", file: "what /ask/stream sends", lang: "bash", code: `data: {"text": "Our OPD"}

data: {"text": " runs Monday"}

data: {"text": " to Saturday."}

data: [DONE]` },
    { type: "text", md: `In \`api.py\`, \`ask_stream\` wraps \`llm.stream(...)\`, which yields text pieces as the model writes them, in a generator, and returns it as a \`StreamingResponse\` with type \`text/event-stream\`. Three details:

- **Errors mid-stream** cannot change the status code (200 was already sent), so they are sent as an event: \`{"error": "..."}\`.
- **\`[DONE]\`** tells the client the answer is complete.
- **Both providers** stream through the same \`llm.stream\` helper: OpenAI with \`stream=True\`, Anthropic with \`messages.stream()\`.` },
    { type: "code", file: "try it", lang: "bash", code: `curl -N -X POST http://127.0.0.1:8000/ask/stream \\
     -H "Content-Type: application/json" -d '{"question": "Which departments do you have?"}'
# -N turns off buffering so you see each event arrive` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Streaming shows the first words in under a second; total time stays the same.",
      "SSE sends 'data:' lines over one HTTP connection; finish with a [DONE] event.",
      "Send errors as events during a stream, because the status code is already sent."
    ]},
    { type: "quiz", title: "Knowledge check: streaming", questions: [
      { kind: "tf", q: "Streaming reduces the number of tokens the model generates.", answer: false,
        explain: " Same tokens, same total time; the user just sees them sooner." },
      { kind: "mcq", q: "The model fails halfway through a streamed answer. How does the client find out?",
        options: ["A 503 status code", "An error event in the stream", "The connection stays open forever", "It cannot"],
        answer: 1,
        why: ["The 200 status was already sent.", "Right.", "The server still ends the stream.", "The error event tells it."] }
    ]}
  ]},

  { title: "A chat screen: Streamlit and Gradio", blocks: [
    { type: "section", label: "The problem" },
    { type: "text", md: `Doctors and managers will not test your helpdesk with curl. You need a chat screen in minutes, without learning React. Two Python libraries do exactly this.` },
    { type: "section", label: "Streamlit: a chat UI that talks to your API" },
    { type: "code", file: "code-samples/ch05/app_streamlit.py", lang: "python", code: "@ch05/app_streamlit.py" },
    { type: "text", md: `How Streamlit thinks: **the whole script re-runs from top to bottom on every interaction.** So:

- **\`st.session_state\`** holds anything that must survive a re-run, such as the conversation.
- The loop near the top **redraws** earlier messages each time.
- **\`st.chat_input\`** returns the new message (or nothing), and **\`st.write_stream\`** shows streamed text as it arrives and returns the full answer.
- Only the **last 10 messages** are sent as history, which keeps cost bounded (Chapter 2).` },
    { type: "code", file: "terminal", lang: "bash", code: `uvicorn api:app                 # terminal 1: the API
streamlit run app_streamlit.py  # terminal 2: opens http://localhost:8501` },
    { type: "section", label: "Gradio: a shareable demo" },
    { type: "code", file: "code-samples/ch05/app_gradio.py", lang: "python", code: "@ch05/app_gradio.py" },
    { type: "text", md: `\`gr.ChatInterface\` builds a complete chat screen from one function. Yielding growing text makes it stream. \`demo.launch(share=True)\` gives a temporary public link, which is handy for showing a client.

To host it permanently for free, create a **Gradio Space on Hugging Face**: upload \`app_gradio.py\` as \`app.py\` with \`llm.py\` and a \`requirements.txt\`, and add your API key as a **secret** in the Space settings, never in the code.` },
    { type: "section", label: "Which one?" },
    { type: "text", md: `| | Streamlit | Gradio |
| --- | --- | --- |
| Best for | Internal tools and dashboards with several widgets | Quick demos of one model or function |
| Chat UI | \`st.chat_message\`, \`st.chat_input\` | \`gr.ChatInterface\` in one line |
| Sharing | Streamlit Community Cloud | \`share=True\` link; Hugging Face Spaces |
| Mental model | Script re-runs on every interaction | Functions wired to input and output components |
| For patients in production | No: build a proper front end on your API | No: same |

Both are for **prototypes and internal tools**. A patient-facing app should be a proper web or mobile front end calling the same FastAPI backend.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Streamlit re-runs the script each interaction; keep the chat in st.session_state.",
      "Gradio's ChatInterface gives a streaming chat screen from one function.",
      "Hugging Face Spaces hosts Gradio demos for free; keys go in secrets.",
      "Use both for demos and internal tools; patient apps need a proper front end."
    ]},
    { type: "quiz", title: "Knowledge check: Streamlit and Gradio", questions: [
      { kind: "mcq", q: "In Streamlit, your chat forgets all earlier messages after each new one. Why?",
        options: ["Streamlit cannot do chat", "The messages were stored in a normal variable, which resets when the script re-runs", "The model has no memory", "The API is down"],
        answer: 1,
        why: ["It can.", "Right: use st.session_state.", "The UI must re-send history anyway; this is a UI bug.", "That would show an error."] },
      { kind: "tf", q: "For a Hugging Face Space, put the API key directly in app.py so the demo works for everyone.", answer: false,
        explain: " Anyone can read a public Space's code. Use the Space's secrets." }
    ]}
  ]},

  { title: "Production: test, harden and ship", blocks: [
    { type: "section", label: "Test without a model" },
    { type: "text", md: `Tests that call a real model are slow, cost money, need a key and give different answers each time. The fix: **replace the model with a fake** in tests, and test everything *around* it, the code you own.` },
    { type: "code", file: "code-samples/ch05/test_api.py", lang: "python", code: "@ch05/test_api.py",
      output: `$ pytest -q test_api.py
......                                                                   [100%]
6 passed in 0.29s`,
      note: "This output is real: the six tests pass against api.py as shown." },
    { type: "text", md: `What these tests protect:

- **The happy path** works and adds a request id.
- **Bad input** is rejected (422) before spending money.
- **Provider outages** become a friendly 503, not a crash or a stack trace.
- **Streaming** delivers every piece and ends with \`[DONE]\`.
- **Upload limits** block wrong types and oversized files.

Run them on every change, and in CI (Chapter 36). Model *quality* is tested separately with an evaluation set (Chapter 9, Lesson 5).` },
    { type: "section", label: "Hardening checklist" },
    { type: "text", md: `| Area | What \`api.py\` does | What to add before real patients |
| --- | --- | --- |
| Input limits | Question ≤ 1,000 chars, history ≤ 20, files ≤ 200 KB | Limits on total tokens per user per day |
| Errors | Friendly 503; errors logged with details server-side | Alerts when the error rate rises |
| Timeouts | 30 s per model call (\`llm.py\`) | An overall request timeout at the gateway |
| Logging | Request id, path, status, duration | Token cost per request; never log personal data |
| Health | \`GET /health\` | Used by the hosting platform to restart a stuck server |
| Authentication | None (local demo) | API keys or login for every client; CORS limited to your own sites |
| Rate limiting | None | Per-user and per-IP limits at the gateway or with middleware |
| Safety | Rules in the system prompt | Guardrails on input and output (Chapter 33) |
| Deployment | \`uvicorn --reload\` | Docker, several workers, HTTPS (Chapter 36) |` },
    { type: "callout", kind: "warning", md: `\`--reload\` is for development only. In production, run uvicorn without it, behind HTTPS, with authentication. An open AI endpoint on the internet is an open tab on your API bill.` },
    { type: "section", label: "Common mistakes" },
    { type: "list", style: "mistakes", items: [
      "**Calling the real model in unit tests.** Slow, costly, flaky. Use a fake.",
      "**Returning raw exceptions to users.** They leak internals and confuse patients.",
      "**No input limits.** One pasted 50-page document costs real money.",
      "**Shipping an unauthenticated endpoint.** Anyone who finds it can spend your budget."
    ]},
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Test the code around the model with a fake model: fast, free and repeatable.",
      "Validate and limit every input; turn failures into friendly errors.",
      "Log request ids, durations and cost, never secrets or personal data.",
      "Before real users: authentication, rate limits, HTTPS and guardrails."
    ]},
    { type: "quiz", title: "Knowledge check: test and harden", questions: [
      { kind: "mcq", q: "Why does test_api.py replace llm.chat with a fake?",
        options: ["The real model is always wrong", "So tests are fast, free, need no key and give the same result every time", "FastAPI requires it", "To test the model's quality"],
        answer: 1,
        why: ["Not the reason.", "Right.", "It does not.", "Quality is tested with an evaluation set, not unit tests."] },
      { kind: "order", q: "Put these steps for going live in a sensible order.",
        items: ["Unit tests pass with a fake model", "Evaluation set passes with the real model", "Add authentication and rate limits", "Deploy behind HTTPS", "Watch logs, cost and error alerts"] },
      { kind: "tf", q: "Running `uvicorn --reload` in production is fine for a small hospital.", answer: false,
        explain: " --reload is a development tool. Production needs a stable server, HTTPS and authentication." }
    ]}
  ]}
  ]
};
})();
