/* Chapter 32 · Monitoring, cost and drift */
(function () {

var FLOW_SVG = `
<svg viewBox="0 0 680 250" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch32-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="app"><rect class="dg-box accent" x="10" y="90" width="150" height="70" rx="10"/><text class="dg-title" x="85" y="118" text-anchor="middle">Helpdesk</text><text class="dg-muted" x="85" y="138" text-anchor="middle">your agent code</text></g>
  <g data-step="traces"><rect class="dg-box" x="250" y="14" width="150" height="50" rx="10"/><text class="dg-title" x="325" y="36" text-anchor="middle">OpenTelemetry</text><text class="dg-muted" x="325" y="52" text-anchor="middle">spans, per request</text></g>
  <g data-step="tracestore"><rect class="dg-box amber" x="500" y="14" width="170" height="50" rx="10"/><text class="dg-title" x="585" y="36" text-anchor="middle">Jaeger / Phoenix</text><text class="dg-muted" x="585" y="52" text-anchor="middle">browse one request</text></g>
  <g data-step="metrics"><rect class="dg-box" x="250" y="100" width="150" height="50" rx="10"/><text class="dg-title" x="325" y="122" text-anchor="middle">/metrics page</text><text class="dg-muted" x="325" y="138" text-anchor="middle">counters, histograms</text></g>
  <g data-step="prom"><rect class="dg-box amber" x="500" y="100" width="170" height="50" rx="10"/><text class="dg-title" x="585" y="122" text-anchor="middle">Prometheus</text><text class="dg-muted" x="585" y="138" text-anchor="middle">scrapes every 15 s</text></g>
  <g data-step="logs"><rect class="dg-box" x="250" y="186" width="150" height="50" rx="10"/><text class="dg-title" x="325" y="208" text-anchor="middle">Logs</text><text class="dg-muted" x="325" y="224" text-anchor="middle">events, no patient text</text></g>
  <g data-step="alerts"><rect class="dg-box amber" x="500" y="186" width="170" height="50" rx="10"/><text class="dg-title" x="585" y="208" text-anchor="middle">Grafana + alerts</text><text class="dg-muted" x="585" y="224" text-anchor="middle">dashboards, pages</text></g>
  <path class="dg-line" d="M160 110L248 44" marker-end="url(#ch32-a)"/><path class="dg-line" d="M400 40H498" marker-end="url(#ch32-a)"/>
  <path class="dg-line" d="M160 125H248" marker-end="url(#ch32-a)"/><path class="dg-line" d="M498 125H402" marker-end="url(#ch32-a)"/>
  <path class="dg-line" d="M160 140L248 208" marker-end="url(#ch32-a)"/><path class="dg-line" d="M585 150V184" marker-end="url(#ch32-a)"/>
</svg>`;

var BUDGET_SVG = `
<svg viewBox="0 0 680 190" xmlns="http://www.w3.org/2000/svg">
  <text class="dg-muted" x="12" y="18">SLO 99% over 30 days: out of 10,000 requests, 100 may be bad. That allowance is the error budget.</text>
  <text class="dg-text" x="12" y="52">Calm month</text><rect class="dg-box" x="150" y="38" width="500" height="20" rx="4"/><rect class="dg-box accent" x="150" y="38" width="250" height="20" rx="4"/><text class="dg-muted" x="405" y="52">50 bad: half the budget left</text>
  <text class="dg-text" x="12" y="96">Bad deploy</text><rect class="dg-box" x="150" y="82" width="500" height="20" rx="4"/><rect class="dg-box amber" x="150" y="82" width="500" height="20" rx="4"/><text class="dg-muted" x="420" y="96">100 bad: budget gone</text>
  <text class="dg-text" x="12" y="140">Incident</text><rect class="dg-box amber" x="150" y="126" width="500" height="20" rx="4"/><text class="dg-muted" x="160" y="140">180 bad: budget overspent by 80</text>
  <text class="dg-muted" x="12" y="176">Overspent: pause risky releases and fix reliability first.</text>
</svg>`;

window.COURSE.chapters.ch32 = {
  id: "ch32",
  title: "Monitoring, cost and drift",
  oneLine: "Evaluation tells you the agent was good on your test cases. Monitoring tells you it is still good today, how much it costs, and when the world has moved. You will add traces, metrics, a cost counter, a token budget, SLO alerts and a drift check to the helpdesk.",
  lessons: [

  { title: "Three signals and OpenTelemetry", blocks: [
    { type: "section", label: "Evaluation is before; monitoring is after" },
    { type: "text", md: `Chapter 31 checked the agent against **your** cases before release. Once patients use it, new things happen that no dataset predicted: a provider slows down, a prompt change doubles your bill, patients start asking about a flu-shot camp you never planned for. **Monitoring** is how you find out quickly, from your own data, instead of from a complaint.

Software monitoring uses three kinds of signal. Each answers a different question:

| Signal | Question it answers | Example |
| --- | --- | --- |
| **Traces** | What happened in *this* request? | The ECG-charge question took 5 steps and 1 tool call |
| **Metrics** | How is the system doing *overall*? | 4 in 5 requests ended OK; median reply 1.2 s; 14 model calls in the last hour |
| **Logs** | What notable *events* occurred? | "daily token budget reached at 14:03" |

Traces are for debugging one case, metrics are for dashboards and alarms, logs are for events. You need all three because a metric tells you *something is wrong* and a trace tells you *why*.` },
    { type: "stepper", svg: FLOW_SVG, caption: "How the three signals leave your code and where they end up.",
      steps: [
        { on: ["app"], text: "Your helpdesk emits all three signals as it runs." },
        { on: ["traces", "tracestore"], text: "**Traces** go out through [[opentelemetry]], a vendor-neutral standard. Because the format is shared, the same code can send to Jaeger, Arize Phoenix, Grafana Tempo or a paid service, by changing one setting." },
        { on: ["metrics", "prom"], text: "**Metrics** are different: the app keeps running totals on a web page (\`/metrics\`) and [[prometheus]] **pulls** them on a timer. If the app dies, the gap itself is a signal." },
        { on: ["logs"], text: "**Logs** record discrete events. The Chapter 27 rule still applies: no patient text, ever." },
        { on: ["alerts"], text: "**Grafana** draws dashboards from Prometheus; **alert rules** decide when a person gets paged. The rest of this chapter builds each piece." }
      ]},
    { type: "section", label: "Traces with OpenTelemetry" },
    { type: "text", md: `Chapter 31 built a tiny tracer to show what a trace is. Here we use the real standard, the **OpenTelemetry (OTel) SDK**. The helpdesk code does not change: a LangChain callback turns every model call and tool call into an OTel [[span]], and one **request span** wraps the whole run so everything nests under it.

Two details worth copying:
- Attribute names follow OpenTelemetry's *GenAI conventions* (\`gen_ai.usage.input_tokens\`, \`gen_ai.tool.name\`), so any backend that understands them can show tokens and tools without extra setup. These conventions are still evolving, so check the current names before depending on them.
- Where spans go is **configuration**: unset means "keep in memory" (tests, demos); setting \`OTEL_EXPORTER_OTLP_ENDPOINT\` sends them to a collector.` },
    { type: "code", file: "code-samples/ch32/telemetry.py", lang: "python", code: "@ch32/telemetry.py",
      note: "raise_error = False again: monitoring must never break a patient's request." },
    { type: "code", file: "code-samples/ch32/monitored.py", lang: "python", code: "@ch32/monitored.py",
      note: "One function wraps the run with traces, metrics, cost and a daily budget. The next lessons explain the metric, cost and budget lines." },
    { type: "code", lang: "python", code: `r = monitored_run("Why is there an ECG charge on BILL-2291?")
root = [s for s in MEMORY.get_finished_spans() if s.name == "helpdesk.request"][0]
print(dict(root.attributes))`,
      output: `{'helpdesk.outcome': 'ok', 'helpdesk.model_calls': 4, 'gen_ai.usage.input_tokens': 511, 'gen_ai.usage.output_tokens': 18, 'helpdesk.cost_usd': 0.00023320000000000003, 'helpdesk.tokens_estimated': True}`,
      note: "Real output with the offline stand-in model. The stand-in reports no token usage, so the code **estimated** tokens (about 4 characters each) and says so in tokens_estimated. With a real provider these numbers are reported, not estimated." },
    { type: "text", md: `Notice what is **not** on the span: no message text. The test suite checks that "BILL-2291" never appears in any span attribute. Attributes carry counts, names and outcomes.

**Sending traces to a viewer.** With Docker, the compose file in \`deploy/\` starts Jaeger, Prometheus and Grafana together. Then \`OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318\` makes the helpdesk send spans to Jaeger's screen at port 16686. **This step was not run here** (no Docker in the build sandbox); the code that produces the spans was.
Arize Phoenix is an alternative viewer that also accepts OTel spans and is made for LLM work (it shows prompts, token counts and evaluation results). Same idea, different screens.` },
    { type: "quiz", title: "Knowledge check: signals", questions: [
      { kind: "match", q: "Match each question to the signal that answers it best.",
        pairs: [["Why was this one patient's reply wrong?", "Trace"], ["Has the error rate risen since Tuesday?", "Metric"], ["When did the daily budget run out?", "Log event"], ["Which tool call was slowest in this request?", "Trace"]] },
      { kind: "mcq", q: "Why use OpenTelemetry instead of a vendor's own tracing library?",
        options: ["It is faster", "The data format is shared, so you can change the backend without rewriting your instrumentation", "It stores traces for free", "It removes the need for metrics"],
        answer: 1,
        why: ["Not the reason.", "Right: instrument once, choose or switch the viewer by configuration.", "The backend decides storage and cost.", "Traces and metrics answer different questions."] },
      { kind: "tf", q: "Putting the patient's message in a span attribute is fine because traces are only seen by engineers.", answer: false,
        explain: " Span attributes are copied to every backend you send to. Keep counts, names and outcomes, not patient text." }
    ]}
  ]},

  { title: "Metrics with Prometheus", blocks: [
    { type: "section", label: "Counters, gauges, histograms" },
    { type: "text", md: `A **metric** is a number tracked over time. Prometheus has three basic kinds, and choosing the right one matters:

- **Counter**: only goes up (requests served, tokens used, dollars spent). You never read the total directly; you ask for its **rate** ("requests per second over the last 5 minutes").
- **Gauge**: goes up and down (tokens left in today's budget, requests in flight).
- **Histogram**: counts how many values fell into each range ("replies under 1 s, under 2 s, under 4 s…"). It is how you get "the slowest 5% of replies took more than 8 seconds" (the 95th **percentile**). Averages hide slow tails; percentiles do not.` },
    { type: "code", file: "code-samples/ch32/metrics.py", lang: "python", code: "@ch32/metrics.py" },
    { type: "callout", kind: "warning", md: `**Never put an id or free text in a label.** Every distinct label value creates a new time series to store. \`outcome\` has 4 values: fine. A \`patient_id\` label has thousands: it will overload Prometheus and cost a lot of money in hosted monitoring. The rule has a name: keep [[cardinality]] low. Per-request detail belongs in traces, not metrics.` },
    { type: "section", label: "What /metrics looks like" },
    { type: "text", md: `Prometheus collects metrics by reading a plain-text page. We sent five requests through \`monitored_run\` (a bill question, an OPD question, a chest-pain message, a booking question, and a request for a metformin dose) and printed the page:` },
    { type: "code", lang: "text", code: `helpdesk_requests_total{outcome="ok"} 4.0
helpdesk_requests_total{outcome="fallback"} 1.0
helpdesk_request_seconds_count 5.0
helpdesk_request_seconds_sum 0.0745
helpdesk_model_calls_total{model="fake-model"} 14.0
helpdesk_tokens_total{direction="input",source="estimated"} 2055.0
helpdesk_tokens_total{direction="output",source="estimated"} 72.0
helpdesk_cost_usd_total 0.0009372
helpdesk_flags_total{flag="emergency"} 1.0
helpdesk_flags_total{flag="blocked"} 1.0
helpdesk_daily_tokens_remaining 197873.0`,
      note: "Real output with the offline stand-in (bucket lines and *_created lines left out for space). Notice the metformin request: outcome=\"fallback\" and flag blocked. The safety layer worked, but a rising fallback count tells you patients are asking things the helpdesk cannot answer." },
    { type: "text", md: `Our test starts the metrics server on a free port, fetches \`/metrics\` over HTTP and parses it with Prometheus's own parser, so the page format is verified. Prometheus itself, Grafana and the alert rules were **not run** here; the YAML files are syntax-checked and a test confirms that every metric name used in an alert rule actually exists in the page, which catches the most common mistake (an alert on a metric that was renamed).` },
    { type: "section", label: "Questions you ask Prometheus" },
    { type: "text", md: `Prometheus has its own query language, **PromQL**. Four patterns cover most dashboards. (Written from the Prometheus documentation; not run against a live server here.)` },
    { type: "code", lang: "text", code: `# requests per second, split by outcome
sum by (outcome) (rate(helpdesk_requests_total[5m]))

# share of requests that did NOT end ok (the error ratio)
sum(rate(helpdesk_requests_total{outcome!="ok"}[5m])) / sum(rate(helpdesk_requests_total[5m]))

# 95th percentile reply time
histogram_quantile(0.95, sum(rate(helpdesk_request_seconds_bucket[10m])) by (le))

# average model calls per request (a loop shows up as a jump)
sum(rate(helpdesk_model_calls_total[30m])) / sum(rate(helpdesk_requests_total[30m]))`,
      note: "Untested against a live Prometheus. The same expressions appear inside deploy/alerts.yml." },
    { type: "section", label: "A good first dashboard" },
    { type: "list", items: [
      "**Traffic**: requests per minute by outcome.",
      "**Errors**: share not ok; fallbacks and blocked replies.",
      "**Latency**: 50th and 95th percentile reply time.",
      "**Agent health**: model calls per request, tool errors (loops and broken tools show here first).",
      "**Money**: dollars per hour, tokens per request, budget remaining.",
      "**Safety**: emergency redirects and blocked replies per day (a sudden change is worth reading traces for)."
    ]},
    { type: "quiz", title: "Knowledge check: metrics", questions: [
      { kind: "match", q: "Match each value to the right metric type.",
        pairs: [["Total requests served", "Counter"], ["Tokens left in today's budget", "Gauge"], ["How long replies take", "Histogram"], ["Total dollars spent", "Counter"]] },
      { kind: "mcq", q: "Why report the 95th percentile of reply time instead of the average?",
        options: ["It is easier to calculate", "A few very slow replies barely move the average but are what unhappy patients remember", "Prometheus cannot compute averages", "Percentiles are always lower"],
        answer: 1,
        why: ["It is not.", "Right: tails matter.", "It can.", "Usually higher than the median."] },
      { kind: "mcq", q: "A teammate adds a patient_id label to helpdesk_requests_total so they can see per-patient traffic. What is wrong?",
        options: ["Nothing", "Each patient creates a new series: storage and cost explode, and it puts identifiers in the monitoring system", "Labels must be numbers", "Counters cannot have labels"],
        answer: 1,
        why: ["It is a classic mistake.", "Right: per-patient detail belongs in a trace, with identifiers handled carefully.", "Labels are text.", "They can."] }
    ]}
  ]},

  { title: "Cost and token budgets", blocks: [
    { type: "section", label: "Where the money goes" },
    { type: "text", md: `Model providers charge per **token**, with output tokens costing several times more than input tokens. An agent makes several model calls per request and each call re-sends the conversation so far, so cost grows faster than you expect. The only way to stay in control is to **measure it per request** and **cap it per day**.

First the arithmetic. Prices live in a file, not in code, because they change; the numbers below are **illustrative**, so copy current prices from your provider's page before trusting any rupee figure.` },
    { type: "code", file: "code-samples/ch32/prices.json", lang: "json", code: "@ch32/prices.json" },
    { type: "code", file: "code-samples/ch32/cost.py", lang: "python", code: "@ch32/cost.py",
      note: "Two decisions to copy: an unknown model raises an error (it must never look free), and token estimates are only a fallback when the provider reports no usage." },
    { type: "code", lang: "python", code: `cost_usd("gpt-4.1-mini", 800, 200)        # a typical request: 800 tokens in, 200 out
cost_usd("claude-haiku-5-5", 800, 200)
cost_usd("gpt-4.1-mini", 800, 200) * 10_000   # ten thousand such requests`,
      output: `0.00064
0.0018
6.4`,
      note: "Real arithmetic with the illustrative prices: about a tenth of a cent per request, 6.4 dollars for 10,000 requests. One looping agent making 30 calls instead of 4 multiplies that by about 7." },
    { type: "section", label: "Four ways to spend less" },
    { type: "list", items: [
      "**Route cheap work to a cheap model.** Classifying a request needs a small model; writing a careful bill explanation may not. (Chapter 22 supervisor, Chapter 27 specialists.)",
      "**Send fewer tokens.** Trim history to what is needed, retrieve 3 chunks instead of 10, keep tool outputs short, summarise old turns (Chapter 10).",
      "**Cache what repeats.** Your provider may discount a repeated prompt prefix (prompt caching); answers to identical questions can be cached by you. Check your provider's current rules.",
      "**Cap everything.** A maximum output length, a maximum number of model calls per request (Chapter 21's budget guard) and a daily limit."
    ]},
    { type: "section", label: "A daily budget that stops spending" },
    { type: "text", md: `Per-request limits stop a runaway request; a **daily token budget** stops a runaway day (an attack, a bug, a viral post). The check happens **before** the model is called, and the helpdesk answers with the safe fallback ("please call the front desk") instead of spending more. This is in \`monitored_run\` above. The test proves that with an exhausted budget the model is called **zero** times:` },
    { type: "code", lang: "python", code: `monitored.DAILY = cost.DailyTokenBudget(10)        # a tiny budget, for the test
r = monitored.monitored_run("What are the OPD timings?")
print(r.outcome, r.model_calls, r.flags)`,
      output: "fallback 0 ['daily_budget_reached']",
      note: "Real output (from test_daily_budget_exhausted_falls_back_without_calling_the_model)." },
    { type: "callout", kind: "tip", md: `**Alert on cost per request, not only the total.** A busy day raises the total harmlessly. A jump in tokens or model calls *per request* means something changed in the system: a longer prompt, a loop, a tool returning too much text. That is the number that finds bugs.` },
    { type: "quiz", title: "Knowledge check: cost", questions: [
      { kind: "mcq", q: "Your daily cost doubled but requests per day also doubled. Which number tells you whether something is wrong?",
        options: ["Total dollars", "Dollars per request, and model calls per request", "Requests per second", "Reply length"],
        answer: 1,
        why: ["It moves with traffic.", "Right: unchanged per-request numbers mean healthy growth.", "Only measures traffic.", "Too indirect."] },
      { kind: "tf", q: "When a model name has no entry in the price table, the cost function should return 0 so requests are not blocked.", answer: false,
        explain: " That makes a new, possibly expensive model look free. It should fail loudly so someone adds the price." },
      { kind: "order", q: "Put the order of a budgeted request.",
        items: ["Check that the daily budget allows the request", "Run the agent", "Count tokens and compute cost", "Update metrics and the budget", "Return the reply"] }
    ]}
  ]},

  { title: "SLOs, alerts and drift", blocks: [
    { type: "section", label: "When should a person be woken up?" },
    { type: "text", md: `Dashboards are looked at; **alerts** interrupt. Alert on too much and people ignore them; alert on too little and patients find the problems. The discipline that fixes this comes from site-reliability engineering:

- An **SLI** (service level indicator) is a measurement: *share of requests that end with outcome ok*.
- An **SLO** (service level objective) is the target: *99% of requests over 30 days*.
- The [[error budget]] is what the target allows to go wrong: 1% of requests. Out of 10,000, that is 100 bad ones.
- The [[burn rate]] is how fast you are spending that budget. 1.0 means you will use exactly all of it by the end of the period; 10 means ten times too fast.

Page a person when the **burn rate is high**, not whenever one request fails. One failed request in a thousand is normal life.` },
    { type: "diagram", svg: BUDGET_SVG, caption: "The error budget as a bar: once spent, reliability comes before new features." },
    { type: "code", file: "code-samples/ch32/slo.py", lang: "python", code: "@ch32/slo.py" },
    { type: "code", lang: "python", code: `error_budget(0.99, 10_000)                         # bad requests allowed
budget_remaining(0.99, good=9_950, total=10_000)   # 50 bad
burn_rate(0.99, good=9_900, total=10_000)          # exactly on pace
burn_rate(0.99, good=8_560, total=10_000)          # 14.4% bad
should_page(0.99, fast=(80, 100), slow=(7_000, 7_100))   # a 5-minute blip
should_page(0.99, fast=(80, 100), slow=(6_000, 8_000))   # bad for an hour too`,
      output: `100.0
0.5
1.0
14.4
False
True`,
      note: "Real output (rounded; the raw floats differ in the 14th decimal). The multi-window rule pages only when both the short and the long window burn fast. The short window makes the alert clear soon after a fix; the long window prevents a blip from paging anyone." },
    { type: "code", file: "code-samples/ch32/deploy/alerts.yml", lang: "yaml", code: "@ch32/deploy/alerts.yml",
      note: "The same rule as PromQL for Prometheus, plus slow replies, cost spikes, loops and a low budget. YAML-validated, and a test checks every metric name exists; it was not loaded into a live Prometheus." },
    { type: "callout", kind: "tip", md: `**Three severities are enough.** *Page* (wake someone: patients are affected now), *ticket* (fix this week), *log* (just record it). Every alert should say what a person should look at first. An alert nobody acts on should be deleted.` },
    { type: "section", label: "Drift: the world changes, the agent does not" },
    { type: "text", md: `Even if nothing in your system changes, **what patients ask** does. A flu-shot campaign, a new scheme, a new doctor: questions arrive that your prompts, dataset and retrieval documents were never built for. This is [[embedding drift]] when measured with embeddings: turn each question into a vector (Chapter 6), and compare the recent questions with a baseline period.

Two simple measures: how far has the **average question** moved (centroid shift), and how far is each new question from its **nearest known question** (novelty). A high value means "patients are asking something new": read those traces, add cases to your dataset, and update documents.

How high is "high"? A fixed threshold false-alarms: even two halves of the same normal traffic differ a little. So \`calibrate\` measures that normal wobble first, by repeatedly splitting the baseline at random, and uses its 95th percentile as the limit.` },
    { type: "code", file: "code-samples/ch32/drift.py", lang: "python", code: "@ch32/drift.py",
      note: "embed() here is a crude word-hash so the demo runs offline. In production use llm.embed(); the rest of the file is unchanged." },
    { type: "code", lang: "python", code: `print(drift.check(BASELINE, SAME_MIX))      # the usual kind of questions
print(drift.check(BASELINE, NEW_TOPIC))     # eight questions about a flu-shot camp`,
      output: `{'centroid_shift': 0.183, 'novelty': 0.269, 'limits': {'centroid_limit': 0.328, 'novelty_limit': 0.373}, 'drift': False}
{'centroid_shift': 0.544, 'novelty': 0.543, 'limits': {'centroid_limit': 0.328, 'novelty_limit': 0.373}, 'drift': True}`,
      note: "Real output, synthetic questions, hashed-word embedding. A lesson from building it: with only 20 baseline questions, the normal wobble was so large that the flu-shot topic was missed. With 62 it was caught. Small samples cannot detect drift; collect a few hundred." },
    { type: "section", label: "Production checklist" },
    { type: "list", items: [
      "**Traces** on every request, without patient text; **metrics** with small, fixed label sets.",
      "**Cost per request** measured and alerted on; a **daily budget** that falls back safely.",
      "**SLOs** written down, with **burn-rate** alerts and a named person to receive them.",
      "A **dashboard** with traffic, errors, latency, agent health, money and safety.",
      "A **weekly drift check** and a habit of reading the odd traces it points to.",
      "A **runbook**: for each alert, what to look at first and who to call.",
      "**Data retention:** decide how long traces live and who can open them."
    ]},
    { type: "list", style: "mistakes", items: [
      "Alerting on every error instead of on burn rate: alert fatigue.",
      "Averages only: the slow tail is where patients give up.",
      "Ids or free text in metric labels.",
      "A dashboard nobody has a reason to open.",
      "A fixed drift threshold with no calibration, or too little data.",
      "Alert rules that reference a metric the app no longer exposes."
    ]},
    { type: "quiz", title: "Knowledge check: SLOs and drift", questions: [
      { kind: "match", q: "Match the term to its meaning.",
        pairs: [["SLI", "A measurement, such as the share of requests that end ok"], ["SLO", "The target for that measurement"], ["Error budget", "How much failure the target allows"], ["Burn rate", "How fast the budget is being spent"]] },
      { kind: "mcq", q: "A 5-minute window shows a burn rate of 20, but the 1-hour window shows 1.2. Should the multi-window alert page?",
        options: ["Yes, always page on the fastest window", "No: the long window says it was a brief blip", "Only at night", "Only if cost is also up"],
        answer: 1,
        why: ["That causes alert fatigue.", "Right: both windows must agree.", "Time of day is not the rule.", "Cost is a separate alert."] },
      { kind: "tf", q: "If the evaluation dataset passes 100%, drift monitoring is unnecessary.", answer: false,
        explain: " The dataset only covers questions you thought of. Drift monitoring tells you when real questions move away from them." }
    ]}
  ]}

  ]
};
})();
