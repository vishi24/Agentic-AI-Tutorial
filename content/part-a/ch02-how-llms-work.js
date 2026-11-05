/* Chapter 2 · How LLMs work */
(function () {

function tok(x, w, t, cls) {
  return '<rect class="dg-box' + (cls ? " " + cls : "") + '" x="' + x + '" y="60" width="' + w + '" height="40" rx="6"/><text class="dg-text" x="' + (x + w / 2) + '" y="85" text-anchor="middle">' + t + "</text>";
}
var TOKENS_SVG = `
<svg viewBox="0 0 680 170" xmlns="http://www.w3.org/2000/svg">
  <text class="dg-muted" x="20" y="36">"Is Dr Mehta free on Thursday?" becomes 8 tokens (one common tokenizer):</text>
  ` + tok(20, 50, "Is") + tok(76, 50, "&#160;Dr") + tok(132, 56, "&#160;Me") + tok(194, 54, "hta") + tok(254, 64, "&#160;free") + tok(324, 50, "&#160;on") + tok(380, 104, "&#160;Thursday", "accent") + tok(490, 30, "?") + `
  <text class="dg-muted" x="20" y="130">Common words are one token; rare names split into pieces. A leading space is part of the token.</text>
  <text class="dg-muted" x="20" y="150">Each token is really a number (an id), such as 16935. The model only ever sees numbers.</text>
</svg>`;

function bar(y, word, p, step, best) {
  var w = Math.round(p * 300);
  return '<g data-step="' + step + '"><text class="dg-text" x="250" y="' + (y + 17) + '" text-anchor="end">' + word + '</text><rect class="dg-box' + (best ? " accent" : "") + '" x="262" y="' + y + '" width="' + w + '" height="24" rx="4"/><text class="dg-muted" x="' + (270 + w) + '" y="' + (y + 17) + '">' + Math.round(p * 100) + "%</text></g>";
}
var NEXT_SVG = `
<svg viewBox="0 0 680 300" xmlns="http://www.w3.org/2000/svg">
  <g data-step="ctx"><rect class="dg-box" x="20" y="20" width="640" height="48" rx="8"/>
  <text class="dg-text" x="36" y="50">"Dr Mehta sees cardiology patients on Monday and ___"</text></g>
  <text class="dg-muted" x="20" y="96">The model scores every possible next token:</text>
  ` + bar(110, "Wednesday", 0.62, "probs", true) + bar(142, "Thursday", 0.14, "probs") + bar(174, "Friday", 0.11, "probs") + bar(206, "every", 0.05, "probs") + bar(238, "(50,000+ others)", 0.08, "probs") + `
  <g data-step="pick"><text class="dg-title" x="20" y="288">Pick one (usually a likely one), add it to the text, and repeat for the next token.</text></g>
</svg>`;

var CONTEXT_SVG = `
<svg viewBox="0 0 680 330" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="16" width="420" height="300" rx="12" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="6 5"/>
  <text class="dg-title" x="36" y="40">Context window (for example 128,000 tokens)</text>
  <g data-step="system"><rect class="dg-box" x="40" y="54" width="380" height="36" rx="6"/><text class="dg-text" x="54" y="77">System prompt: role and rules</text><text class="dg-muted" x="406" y="77" text-anchor="end">~300</text></g>
  <g data-step="tools"><rect class="dg-box" x="40" y="96" width="380" height="36" rx="6"/><text class="dg-text" x="54" y="119">Tool descriptions</text><text class="dg-muted" x="406" y="119" text-anchor="end">~400</text></g>
  <g data-step="docs"><rect class="dg-box" x="40" y="138" width="380" height="56" rx="6"/><text class="dg-text" x="54" y="164">Documents and tool results</text><text class="dg-muted" x="54" y="182">(policies, schedules)</text><text class="dg-muted" x="406" y="164" text-anchor="end">~3,000</text></g>
  <g data-step="history"><rect class="dg-box" x="40" y="200" width="380" height="46" rx="6"/><text class="dg-text" x="54" y="228">Conversation history</text><text class="dg-muted" x="406" y="228" text-anchor="end">grows each turn</text></g>
  <g data-step="question"><rect class="dg-box accent" x="40" y="252" width="380" height="26" rx="6"/><text class="dg-text" x="54" y="270">New question</text></g>
  <g data-step="answer"><rect class="dg-box amber" x="40" y="282" width="380" height="26" rx="6"/><text class="dg-text" x="54" y="300">Room left for the answer</text></g>
  <text class="dg-title" x="470" y="70">Everything here is</text>
  <text class="dg-title" x="470" y="90">sent on every call</text>
  <text class="dg-muted" x="470" y="120">and paid for as input</text>
  <text class="dg-muted" x="470" y="140">tokens, every time.</text>
  <text class="dg-muted" x="470" y="190">Anything not in the window</text>
  <text class="dg-muted" x="470" y="210">does not exist for the model.</text>
</svg>`;

window.COURSE.chapters.ch02 = {
  id: "ch02",
  title: "How LLMs work",
  oneLine: "An LLM turns text into tokens and predicts the next token, again and again. Knowing this explains its costs, its limits and why it sometimes makes things up.",
  lessons: [

  { title: "Tokens and next-token prediction", blocks: [
    { type: "section", label: "The problem" },
    { type: "text", md: `You will pay for every model call, wait for every reply and debug every strange answer. All three depend on how an [[llm|LLM]] works inside. You do not need the maths, but you do need a clear picture of two ideas: **tokens** and **next-token prediction**.` },
    { type: "section", label: "Tokens: how the model reads" },
    { type: "diagram", svg: TOKENS_SVG, caption: "Text is split into [[token|tokens]] before the model sees it. The exact split depends on the model's tokenizer." },
    { type: "text", md: `A **token** is a chunk of text, usually a short word or part of a word. As a rough guide, one token is about **4 characters or ¾ of a word** in English. Every price, speed and size limit you will meet is counted in tokens:

- **Price:** providers charge per million input tokens and per million output tokens. Output usually costs several times more.
- **Speed:** the model writes one token at a time, so a long answer takes longer.
- **Limits:** the [[context window]] is a maximum number of tokens.

Indian languages often use **2–3 times more tokens** than English for the same meaning, because tokenizers were built mostly on English text. A Hindi helpdesk costs more per message than an English one.` },
    { type: "code", file: "code-samples/ch02/tokens.py", lang: "python", code: "@ch02/tokens.py",
      output: `43 characters -> 11 tokens
Is |  Dr |  Me | hta |  in |  card | iology |  free |  on |  Thursday | ?
37 characters -> 24 tokens
क्या |  ड | ॉ | . |  मे | हता | ...
One question  ≈ $0.00072
2,000 a day   ≈ $1.44 per day, $43.20 per month
This text uses 0.0086% of a 128,000-token context window`,
      note: "Example output; exact token counts depend on the tokenizer. Prices in the script are placeholders: copy current prices from your provider before relying on the totals." },

    { type: "section", label: "Next-token prediction: how the model writes" },
    { type: "text", md: `An LLM does one thing: given the tokens so far, it gives a score to **every** possible next token, picks one, adds it, and repeats. A 50-word answer is about 65 rounds of this.` },
    { type: "stepper", svg: NEXT_SVG, caption: "One step of generation. The percentages are illustrative.",
      steps: [
        { on: ["ctx"], text: "**The text so far** goes in: everything in the prompt and everything already written." },
        { on: ["probs"], text: "**Every token gets a probability.** \"Wednesday\" is most likely because similar sentences in training usually continued that way." },
        { on: ["pick"], text: "**One token is picked** and added. Then the whole thing runs again for the next token. That is all the model ever does." }
      ]},
    { type: "text", md: `This explains a lot:

- **Fluent but not always true.** The model picks *likely* words, not *checked* facts. If it never saw this clinic's real schedule, "Wednesday" is still a likely-sounding guess. That is a [[hallucination]].
- **It has no memory between calls.** Each call starts fresh from the tokens you send. Chatbots "remember" because your code re-sends the history.
- **Instructions work** because text like "Reply in one sentence" makes short continuations more likely.` },

    { type: "section", label: "How the model learned to do this" },
    { type: "text", md: `1. **Pre-training.** The model reads a huge amount of public text and learns to predict the next token. This is where its knowledge and language skills come from. Its knowledge stops at a **cutoff date**.
2. **Instruction tuning.** It is trained on examples of questions and good answers, so it follows instructions instead of just continuing text.
3. **Preference training (RLHF and similar).** People compare answers and the model is tuned towards the preferred ones: helpful, honest, safe.

None of these steps gave it your hospital's data. That is why later chapters connect it to tools and documents.` },
    { type: "deeper", title: "Attention, in one paragraph", md: `To predict the next token, the model must decide which earlier tokens matter. **Attention** is the mechanism that does this: for each position, it learns how much to look at every other position. In "Dr Mehta said **he** is free on Monday", attention links "he" strongly to "Dr Mehta". Stacking many attention layers lets the model track who is who, what refers to what, and what the question is really asking. This is the core of the **transformer** design behind every modern LLM. The 3Blue1Brown video below shows it visually.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Models read and write tokens, about 4 characters each in English; cost, speed and limits are all counted in tokens.",
      "Indian languages often use 2–3 times more tokens than English.",
      "An LLM predicts the next token again and again; it picks likely text, not checked facts.",
      "It has no memory between calls and no knowledge of your data unless you send it."
    ]},
    { type: "section", label: "Watch" },
    { type: "videos", ids: ["3b1b-gpt", "karpathy-intro-llms"] },
    { type: "quiz", title: "Knowledge check: tokens and prediction", questions: [
      { kind: "mcq", q: "Roughly how many tokens is a 400-word English answer?",
        options: ["About 100", "About 530", "About 4,000", "Exactly 400"],
        answer: 1,
        why: ["Too few: a token is less than a word.", "Right: about 4/3 tokens per word.", "That would be 10 tokens per word.", "Words and tokens are not one to one."] },
      { kind: "tf", q: "The model looks up the answer in a database of facts before writing it.", answer: false,
        explain: " It predicts likely next tokens. Facts must come from tools or documents you provide." },
      { kind: "mcq", q: "Why does the same helpdesk cost more in Hindi than in English?",
        options: ["Hindi questions are longer", "Tokenizers split Hindi into more tokens for the same meaning", "Providers charge more for Hindi", "It does not cost more"],
        answer: 1,
        why: ["Not necessarily.", "Right.", "Price per token is the same.", "It usually does."] },
      { kind: "mcq", q: "A chatbot remembers your name from earlier in the chat. How?",
        options: ["The model stores it in its weights", "Your code re-sends the earlier messages with every call", "The provider keeps a profile", "It guesses"],
        answer: 1,
        why: ["Weights do not change during use.", "Right: the history is re-sent each time.", "Not in the basic API.", "It is not guessing; it is in the input."] }
    ]}
  ]},

  { title: "Context, temperature and hallucination", blocks: [
    { type: "section", label: "The context window" },
    { type: "stepper", svg: CONTEXT_SVG, caption: "What fills the [[context window]] on every call.",
      steps: [
        { on: ["system"], text: "**System prompt.** Role and rules, sent on every call." },
        { on: ["tools"], text: "**Tool descriptions.** Every tool you offer costs tokens on every call, even if unused." },
        { on: ["docs"], text: "**Documents and tool results.** Often the biggest part: policies, schedules, search results." },
        { on: ["history"], text: "**Conversation history.** Grows with every turn. This is why long chats get slow and expensive." },
        { on: ["question"], text: "**The new question.** Usually small." },
        { on: ["answer"], text: "**Room for the answer.** The output must also fit inside the window." }
      ]},
    { type: "text", md: `Two rules follow:

1. **If it is not in the window, the model does not know it.** Not your clinic's schedule, not yesterday's chat, not today's date, unless you put it there.
2. **Everything in the window is paid for on every call.** A 3,000-token policy document attached to every question costs 3,000 input tokens each time.

Bigger windows help, but very long inputs still make answers slower, costlier and sometimes worse, because important details get lost in the middle. Sending *less, but relevant* is usually better (Chapter 7).` },

    { type: "section", label: "Temperature: how adventurous the choice is" },
    { type: "text", md: `When the model picks the next token, [[temperature]] controls how adventurous it is:

| Temperature | Behaviour | Use for |
| --- | --- | --- |
| 0 | Almost always the most likely token; repeatable | Classification, extraction, tool use, facts |
| 0.3–0.7 | Some variety | General helpdesk replies |
| 1.0 and above | Creative, varied, more mistakes | Brainstorming, marketing copy |

**Top-p** is a related setting: it only allows tokens from the most likely group that together reach probability *p*. Change one or the other, not both. Note: some newer reasoning models fix these settings and reject changes.

**Anthropic note:** the current Anthropic Python SDK (version 1.0 and later) no longer accepts \`temperature\`, \`top_p\` or \`top_k\` in a request: in our test, passing \`temperature\` raised a \`TypeError\`. So the course's shared helper \`llm.py\` sends temperature to OpenAI only and ignores it for Anthropic. With Anthropic, get consistency from clear prompts and examples, and measure it by running a test set several times (Chapter 9).` },
    { type: "code", file: "code-samples/ch02/sampling.py", lang: "python", code: "@ch02/sampling.py",
      output: `--- temperature 0.0 ---
1. Welcome to City Clinic OPD! Please take a token at the front desk.
2. Welcome to City Clinic OPD! Please take a token at the front desk.
3. Welcome to City Clinic OPD! Please take a token at the front desk.

--- temperature 1.0 ---
1. Hello and welcome! We're glad you're here, please check in at the desk.
2. Namaste and welcome to City Clinic! The front desk will help you shortly.
3. Welcome! Have a seat, and we'll call your token number soon.`,
      note: "Illustrative output (from OpenAI; with PROVIDER=anthropic both runs use the provider's default sampling, see the note above). The shared helper `llm.py` (Chapter 4) lets the same script use OpenAI or Anthropic." },

    { type: "section", label: "Why models hallucinate, and what to do" },
    { type: "text", md: `| Cause | Example | Fix |
| --- | --- | --- |
| The fact is not in the context | Inventing a doctor's timings | Give it a tool or the document (Chapters 7–9) |
| The question assumes something false | "Why is Dr Rao away on Thursday?" | Instruct it to check assumptions; give real data |
| Pressure to answer | Answers instead of saying "I don't know" | Say explicitly that "I don't know" is acceptable |
| Knowledge cutoff | Old prices or rules | Fetch current data with a tool |
| Long, noisy context | Misses the one relevant line | Send less, more relevant text |

No setting removes hallucination entirely. The real defence is design: give the model the facts, ask it to cite where each fact came from, and check important outputs (Chapter 9, Lesson 5).` },
    { type: "callout", kind: "warning", md: `Temperature 0 makes answers **consistent**, not **correct**. A wrong answer at temperature 0 is the same wrong answer every time.` },
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "The context window holds everything the model can see; outside it, nothing exists.",
      "Everything in the window is paid for on every call, so send less but relevant text.",
      "Use temperature 0 for facts, tools and classification; higher for creative text.",
      "Hallucination is reduced by giving facts and checking outputs, not by settings alone."
    ]},
    { type: "quiz", title: "Knowledge check: context and temperature", questions: [
      { kind: "mcq", q: "Your helpdesk does not know today's date and gives wrong 'tomorrow' answers. Why?",
        options: ["The model is broken", "Today's date is not in the context window", "Temperature is too high", "The tokenizer is wrong"],
        answer: 1,
        why: ["It has no clock.", "Right: put the date in the system prompt or give a tool.", "Temperature does not supply facts.", "Unrelated."] },
      { kind: "match", q: "Match each task to a sensible temperature.",
        pairs: [["Classify a message as billing or appointment", "0"], ["A friendly reply to a patient", "0.5"], ["Ten taglines for a health camp poster", "1.0"]] },
      { kind: "tf", q: "Setting temperature to 0 stops hallucination.", answer: false,
        explain: " It makes answers repeatable, not correct. Facts must come from data you provide." },
      { kind: "mcq", q: "You attach a 5,000-token policy to every question. Most questions need only one paragraph. What should you do?",
        options: ["Nothing; bigger windows handle it", "Send only the relevant part (retrieval, Chapter 7)", "Raise the temperature", "Use a bigger model"],
        answer: 1,
        why: ["You pay for 5,000 tokens every call, and accuracy can drop.", "Right.", "Unrelated.", "Costs more and does not fix the waste."] }
    ]}
  ]},

  { title: "Production: cost, speed and context budgets", blocks: [
    { type: "section", label: "Estimate before you build" },
    { type: "text", md: `Before launch, estimate the monthly bill and the waiting time. Both come from tokens.

**Cost per question** = input tokens × input price + output tokens × output price.

An agent makes several calls per question, and each call re-sends the history, so multiply by the average number of model calls. For our Chapter 9 agent: about 2 calls × ~600 input tokens + ~75 output tokens.

**Speed** has two parts:
- **Time to first token:** how long before the reply starts. Mostly fixed per call, plus a bit per input token.
- **Tokens per second:** how fast it writes after that. A 300-token answer at 60 tokens/s takes 5 seconds to write.

Streaming (Chapter 5) does not make the total faster, but patients see words within a second, which feels much faster.` },
    { type: "text", md: `| Lever | Saves | Trade-off |
| --- | --- | --- |
| A smaller model for simple steps | Cost and time, often 5–20× | May be less accurate on hard cases; test it |
| Shorter system prompt and fewer tools | Input tokens on every call | Remove only what tests show is unused |
| Trimming or summarising history | Input tokens in long chats | Old details may be lost |
| Sending only relevant documents | Input tokens; often better accuracy | Needs retrieval (Chapter 7) |
| Asking for shorter answers | Output tokens, the expensive kind | Must still answer fully |
| Prompt caching (where offered) | Repeated input tokens, such as a long system prompt | Provider-specific rules |` },

    { type: "section", label: "Keep conversations inside a budget" },
    { type: "text", md: `Give each conversation a **token budget**. When the history goes over it, either **trim** the oldest turns or **summarise** them into a few lines. Trimming is free and simple; summarising keeps important details at the cost of one extra model call.` },
    { type: "code", file: "code-samples/ch02/context_budget.py", lang: "python", code: "@ch02/context_budget.py",
      output: `Full history: 24 messages, ~954 tokens (budget 600)
Trimmed:      14 messages, ~559 tokens; oldest kept: Question 6: what are the visit...
Summarised:   6 messages, ~199 tokens
Summary of our earlier conversation:
- Patient asked about visiting hours for wards 1 to 8 (4 to 6 pm daily).`,
      note: "Tested with a stand-in model. The 4-characters-per-token estimate is fine for budgets; use tiktoken when you need exact counts." },
    { type: "text", md: `Points to notice in the code:

- \`trim\` removes **whole turns** (a question and its answer) so the history never starts with an orphaned reply.
- \`summarise\` keeps the **last few messages word for word**, because the latest turns matter most.
- The summary prompt says what to keep: names, doctors, days and requests. A generic "summarise this" loses exactly the details a helpdesk needs.` },
    { type: "section", label: "Choosing a model" },
    { type: "text", md: `| Question | Lean towards a smaller, faster model | Lean towards a larger model |
| --- | --- | --- |
| Task | Classify, extract, route, short replies | Multi-step reasoning, long documents, tricky judgement |
| Volume | Thousands of calls a day | Occasional |
| Latency | Patient is waiting live | Background job |
| Evidence | It passes your test set | Smaller models fail your test set |

The last row decides. Run your evaluation (Chapter 9) on two or three models and pick the cheapest one that passes. Many production agents mix models: a small one for routing, a larger one for the hard step.` },
    { type: "section", label: "Common mistakes" },
    { type: "list", style: "mistakes", items: [
      "**Estimating cost from one call.** Agents make several calls, each re-sending the history.",
      "**Unlimited history.** Long chats quietly become slow and expensive, then fail at the window limit.",
      "**Using the biggest model everywhere.** Test whether a smaller one passes first.",
      "**Hard-coding prices.** They change; keep them in one config place."
    ]},
    { type: "section", label: "Key takeaways" },
    { type: "list", items: [
      "Cost = tokens × price × number of calls; output tokens cost more than input.",
      "Speed = time to first token + writing speed; streaming improves how fast it feels.",
      "Keep each conversation inside a token budget by trimming or summarising.",
      "Choose the cheapest model that passes your test set."
    ]},
    { type: "quiz", title: "Knowledge check: production budgets", questions: [
      { kind: "mcq", q: "An agent makes 3 model calls per question with ~800 input and ~100 output tokens per call. Input costs $0.40 and output $1.60 per million tokens. What does one question cost?",
        options: ["About $0.0005", "About $0.0014", "About $0.014", "About $0.14"],
        answer: 1,
        why: ["That is about one call.", "Right: 3 × (800 × 0.40 + 100 × 1.60) / 1,000,000 = $0.00144.", "Ten times too high.", "A hundred times too high."] },
      { kind: "tf", q: "Streaming makes the model finish its answer sooner.", answer: false,
        explain: " The total time is the same; streaming shows the first words sooner, so it feels faster." },
      { kind: "mcq", q: "When summarising old history, why keep the last few messages word for word?",
        options: ["They are cheaper", "The most recent turns usually matter most for the next answer", "The API requires it", "Summaries cannot include recent messages"],
        answer: 1,
        why: ["They cost the same per token.", "Right.", "It does not.", "They could, but detail would be lost."] }
    ]}
  ]}
  ]
};
})();
