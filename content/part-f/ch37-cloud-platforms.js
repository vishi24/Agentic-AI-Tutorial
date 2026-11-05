/* Chapter 37 · Cloud agent platforms */
(function () {

var LADDER_SVG = `
<svg viewBox="0 0 680 266" xmlns="http://www.w3.org/2000/svg">
  <g data-step="a"><rect class="dg-box" x="10" y="14" width="190" height="64" rx="10"/><text class="dg-title" x="105" y="40" text-anchor="middle">1 · Call a model</text><text class="dg-muted" x="105" y="60" text-anchor="middle">most portable</text>
    <text class="dg-text" x="216" y="38">You run: the loop, tools, memory, hosting, scaling</text><text class="dg-muted" x="216" y="58">Cloud runs: the model (and bills it)</text></g>
  <g data-step="b"><rect class="dg-box accent" x="10" y="94" width="190" height="64" rx="10"/><text class="dg-title" x="105" y="120" text-anchor="middle">2 · Host your agent</text><text class="dg-muted" x="105" y="140" text-anchor="middle">the usual sweet spot</text>
    <text class="dg-text" x="216" y="118">You run: the loop, tools, memory logic (your code)</text><text class="dg-muted" x="216" y="138">Cloud runs: hosting, scaling, identity, sessions, traces</text></g>
  <g data-step="c"><rect class="dg-box amber" x="10" y="174" width="190" height="64" rx="10"/><text class="dg-title" x="105" y="200" text-anchor="middle">3 · Configure an agent</text><text class="dg-muted" x="105" y="220" text-anchor="middle">least code, most lock-in</text>
    <text class="dg-text" x="216" y="198">You write: instructions, choose tools and model</text><text class="dg-muted" x="216" y="218">Cloud runs: the loop, memory, hosting, traces</text></g>
  <text class="dg-muted" x="10" y="258">Going down the ladder: less code to write, less control, more lock-in.</text>
</svg>`;

var LOOP_SVG = `
<svg viewBox="0 0 680 236" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch37-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <rect class="dg-box accent" x="20" y="8" width="130" height="30" rx="8"/><text class="dg-title" x="85" y="28" text-anchor="middle">Your code</text>
  <rect class="dg-box" x="530" y="8" width="130" height="30" rx="8"/><text class="dg-title" x="595" y="28" text-anchor="middle">Model (Converse)</text>
  <path class="dg-muted" d="M85 40V232M595 40V232" stroke="currentColor" stroke-dasharray="3 4" opacity=".4" fill="none"/>
  <g data-step="ask"><path class="dg-line" d="M88 66H590" marker-end="url(#ch37-b)"/><text class="dg-text" x="340" y="58" text-anchor="middle">question + toolConfig (find_doctor)</text></g>
  <g data-step="use"><path class="dg-line" d="M592 106H90" marker-end="url(#ch37-b)"/><text class="dg-text" x="340" y="98" text-anchor="middle">stopReason = tool_use: find_doctor(cardiology)</text></g>
  <g data-step="run"><rect class="dg-box amber" x="20" y="120" width="170" height="30" rx="8"/><text class="dg-text" x="105" y="140" text-anchor="middle">your code runs the tool</text></g>
  <g data-step="result"><path class="dg-line" d="M88 178H590" marker-end="url(#ch37-b)"/><text class="dg-text" x="340" y="170" text-anchor="middle">toolResult  (same toolUseId)</text></g>
  <g data-step="done"><path class="dg-line" d="M592 218H90" marker-end="url(#ch37-b)"/><text class="dg-text" x="340" y="210" text-anchor="middle">stopReason = end_turn: the final answer</text></g>
</svg>`;

var SCALE_SVG = `
<svg viewBox="0 0 680 200" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch37-c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="region"><rect class="dg-box accent" x="6" y="16" width="156" height="104" rx="10"/><text class="dg-title" x="84" y="40" text-anchor="middle">One Region</text>
    <text class="dg-muted" x="84" y="66" text-anchor="middle">AWS: plain model id</text><text class="dg-muted" x="84" y="86" text-anchor="middle">Google: regional</text></g>
  <g data-step="geo"><rect class="dg-box accent" x="176" y="16" width="156" height="104" rx="10"/><text class="dg-title" x="254" y="40" text-anchor="middle">Geography</text>
    <text class="dg-muted" x="254" y="66" text-anchor="middle">AWS: geo prefixes</text><text class="dg-muted" x="254" y="86" text-anchor="middle">Azure: Standard</text></g>
  <g data-step="zone"><rect class="dg-box amber" x="346" y="16" width="156" height="104" rx="10"/><text class="dg-title" x="424" y="40" text-anchor="middle">Data zone</text>
    <text class="dg-muted" x="424" y="66" text-anchor="middle">Azure: DataZone*</text><text class="dg-muted" x="424" y="86" text-anchor="middle">Google: us / eu</text></g>
  <g data-step="global"><rect class="dg-box amber" x="516" y="16" width="156" height="104" rx="10"/><text class="dg-title" x="594" y="40" text-anchor="middle">Global</text>
    <text class="dg-muted" x="594" y="66" text-anchor="middle">AWS: global.</text><text class="dg-muted" x="594" y="86" text-anchor="middle">Azure: Global*</text><text class="dg-muted" x="594" y="106" text-anchor="middle">Google: global</text></g>
  <path class="dg-line" d="M16 152H664" marker-end="url(#ch37-c)"/>
  <text class="dg-muted" x="10" y="180">tighter promise about where prompts go</text>
  <text class="dg-muted" x="670" y="180" text-anchor="end">more capacity and availability</text>
</svg>`;

window.COURSE.chapters.ch37 = {
  id: "ch37",
  title: "Cloud agent platforms",
  oneLine: "Amazon, Microsoft and Google all sell models, hosting and governance for agents. You will learn the layers they share (so the product names that keep changing do not matter), call all three through one interface, deploy the helpdesk serverlessly, and set up least-privilege access and a data-residency rule.",
  lessons: [

  { title: "What the clouds sell", blocks: [
    { type: "section", label: "Why not just call a model API?" },
    { type: "text", md: `Until now our helpdesk called OpenAI or Anthropic directly. That is the simplest thing that works. A large organisation, a hospital group for example, usually asks for more:

- **One bill and one contract.** Models, hosting and storage under the cloud account the company already has.
- **Existing identity and permissions.** Who may call the model is decided by the same system that controls the databases (Amazon IAM, Microsoft Entra, Google Cloud IAM), and it is logged.
- **Private networking and a stated location.** Traffic that does not cross the public internet, and a written answer to "in which country is this prompt processed?" (Chapter 34's data-fiduciary duties make that a real question in India).
- **Managed hosting for agents.** Somebody else runs the scaling, restarts, session isolation and traces.

What you pay for it: more setup, more product names to learn, and the risk of building so tightly on one cloud's agent features that moving later is expensive ([[vendor lock-in]]).` },
    { type: "section", label: "Three levels of \"managed\"" },
    { type: "text", md: `Every cloud offers the same three levels, under different names. Choosing a level matters more than choosing a cloud.` },
    { type: "stepper", svg: LADDER_SVG, caption: "How much of the agent does the cloud run for you?",
      steps: [
        { on: ["a"], text: "**Level 1: call a model.** You use the cloud only as a model supplier. Your container from Chapter 36 runs the agent loop and calls, say, Amazon Bedrock instead of OpenAI. Easiest to move later, because only one small adapter changes." },
        { on: ["b"], text: "**Level 2: host your agent.** You still write the loop and tools in your framework (LangGraph, the OpenAI Agents SDK, plain Python), but you give the code to the cloud's **agent runtime**. It adds what is tedious to build: a separate identity for each agent, isolated sessions, scaling, built-in traces. All three clouds now offer this. For most teams this is the sweet spot." },
        { on: ["c"], text: "**Level 3: configure an agent.** You describe the agent (instructions, model, tools) in a portal or a config file, and the cloud runs the loop itself. Fastest to start, least code, and the hardest to move because the agent lives in the cloud's own format." }
      ]},
    { type: "section", label: "The names (read on 4 November 2026)" },
    { type: "callout", kind: "warning", md: `**These names change often.** Microsoft's agent platform has been called Azure AI Studio, then Azure AI Foundry, and is now **Microsoft Foundry**. Google's **Vertex AI** has been replaced by the **Gemini Enterprise Agent Platform**, and Google's own pages still use older and newer names side by side. Learn the layers; treat every product name below as "what the vendor's pages said on the day this chapter was written", and confirm on the vendor's site before you plan.` },
    { type: "text", md: `| Layer | Amazon Web Services | Microsoft | Google Cloud |
| --- | --- | --- | --- |
| Models behind one API | **Amazon Bedrock**, unified **Converse API** | Models in **Microsoft Foundry** (catalogue of models from Microsoft, OpenAI, Anthropic, Meta and others, per Microsoft); called with the OpenAI client or the Foundry SDK | Gemini and partner and open models on the **Gemini Enterprise Agent Platform** (formerly Vertex AI) |
| Level 2: host your agent | **Amazon Bedrock AgentCore Runtime** | **Foundry Agent Service**, *hosted agents* (your code as a container image or zip) | **Agent Runtime** (also called Agent Engine) |
| Level 3: configure an agent | (older configuration-style agents exist; check the Bedrock docs) | Foundry Agent Service, *prompt agents* | Agent Studio (low-code) and the Managed Agents API |
| Memory | AgentCore Memory | memory as a built-in tool | Agent Platform Sessions and Memory Bank |
| Tools | AgentCore Gateway (turns APIs and Lambda functions into agent tools, and connects to MCP servers) | Foundry Toolbox, one managed MCP-compatible endpoint for a group of tools | tools through ADK; Agent Gateway for governing agent traffic |
| Agent identity | AgentCore Identity | a dedicated Microsoft Entra identity per hosted agent | Identity and Google Cloud IAM |
| Traces and evaluation | AgentCore Observability (CloudWatch, OpenTelemetry-compatible) | tracing, evaluations, Application Insights | agent evaluation, observability and traces |
| Open standards | MCP, A2A | MCP, A2A | A2A (multi-agent, in preview at the time of reading), ADK |

Two things to notice. First, **the rows are the same on every cloud**; the columns differ mostly in spelling. Second, they lean on the open standards from earlier chapters: AWS and Microsoft both document **MCP** (Chapters 16 and 17) for tools, and all three document **A2A** for agents talking to agents (Google's was marked preview when we read it). Open standards are your best protection against lock-in: a tool exposed over MCP, or an agent that speaks A2A, works whichever cloud hosts it.` },
    { type: "text", md: `**Azure Machine Learning** and the Foundry portal's model tools are where Microsoft handles training, fine-tuning and managing *your own* models (Chapter 35). We did not research Azure ML's current state for this course, so check Microsoft's documentation if you plan to host a fine-tuned model there.

**Where this came from:** Microsoft's [What is Microsoft Foundry](https://learn.microsoft.com/en-us/azure/foundry/what-is-foundry) and [Foundry Agent Service](https://learn.microsoft.com/en-us/azure/foundry/agents/overview) pages; Google's [Gemini Enterprise Agent Platform](https://docs.cloud.google.com/gemini-enterprise-agent-platform) and [Agent Runtime](https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/runtime) pages; and AWS's [AgentCore announcement](https://aws.amazon.com/about-aws/whats-new/2025/10/amazon-bedrock-agentcore-available) (13 October 2025). AWS has announced more AgentCore features since then; we only list what we read.` },
    { type: "quiz", title: "Knowledge check: the landscape", questions: [
      { kind: "match", q: "Match each level to what the cloud runs for you.",
        pairs: [["Level 1: call a model", "Only the model"], ["Level 2: host your agent", "Hosting, scaling, identity, sessions and traces; your code is the agent"], ["Level 3: configure an agent", "The loop itself, from your instructions and tool choices"]] },
      { kind: "mcq", q: "Your team may move clouds in three years. Which design keeps that cheapest?",
        options: ["Level 3 agents defined only in one cloud's portal", "Level 1 or 2 with tools exposed over MCP and prompts, tool schemas and evaluation sets kept in your own repository", "Copying every cloud's SDK calls throughout the code", "Never using the cloud's identity features"],
        answer: 1,
        why: ["Hardest to move: the definition lives in their format.", "Right: your logic and tests stay yours; only a thin adapter and the deployment change.", "Spreads the lock-in everywhere.", "Identity is configuration, not code, and is worth using."] },
      { kind: "tf", q: "Because product names change so often, the best long-term knowledge is the layers (model, runtime, tools, identity, observability) rather than the brand names.", answer: true,
        explain: " Microsoft's platform has been renamed more than once in about two years and Google's was renamed in 2026; the layers stayed the same." }
    ]}
  ]},

  { title: "One interface, three clouds", blocks: [
    { type: "section", label: "Level 1 in code" },
    { type: "text", md: `Level 1 is the easiest to build and the best way to learn how the clouds differ. The helpdesk from Chapter 5 onward used one function, \`chat()\`. We now write \`cloud_llm.py\` with the same return shape, for Amazon [[bedrock]] (its [[converse api]]), Microsoft's [[foundry]] and Google's Gemini, so the rest of the helpdesk cannot tell which cloud answered.

What differs between the three, in the order you will trip over it:

| | Amazon Bedrock | Microsoft Foundry | Google (Gemini) |
| --- | --- | --- | --- |
| How you call | AWS SDK (\`boto3\`), \`converse()\` | the **OpenAI client** with the project's base URL | \`google-genai\` client |
| Who you are | AWS credentials and an IAM role | an API key, or a Microsoft Entra token | your Google Cloud login (\`vertexai=True\`), or an API key for quick tests |
| What "model" means | a **model id** or **inference profile id** | **your deployment's name** (you create it in the portal) | a model name |
| System prompt | a separate \`system\` list | a message with role \`system\` | \`system_instruction\` setting |
| The assistant's role is called | \`assistant\` | \`assistant\` | \`model\` |
| Token counts | \`usage.inputTokens\` / \`outputTokens\` | \`usage.prompt_tokens\` / \`completion_tokens\` | \`prompt_token_count\` / \`candidates_token_count\` |
| Where is it processed? | depends on the id (Lesson 4) | depends on the deployment type | depends on the location |

Each of those is a small thing, and each is the kind of small thing that produces a confusing error at 6 p.m. An adapter file is where you absorb them once.` },
    { type: "code", file: "code-samples/ch37/cloud_llm.py", lang: "python", code: "@ch37/cloud_llm.py",
      note: "There is deliberately no default model id: ids differ per account, per Region and per cloud and are retired every few months, so a default would be wrong for someone. A missing setting raises an error that names the setting." },
    { type: "code", lang: "bash", code: "cd code-samples/ch37\npip install -r requirements-cloud.txt -r ../requirements.txt\nOFFLINE=1 PYTHONPATH=.. python demo_offline.py",
      output: `bedrock: {'text': 'OPD runs 9 to 5.', 'input_tokens': 21, 'output_tokens': 6, 'model': 'provider.model-v1'}
foundry: {'text': 'OPD runs 9 to 5.', 'input_tokens': 21, 'output_tokens': 6, 'model': 'my-deployment'}
gemini:  {'text': 'OPD runs 9 to 5.', 'input_tokens': 21, 'output_tokens': 6, 'model': 'gemini-test'}`,
      note: "Output from FAKE servers, not from the real clouds. The point is that three different wire formats come out as one shape. AWS calls go to botocore's Stubber, which checks every request and response against AWS's own API model; the OpenAI and Gemini clients talk to an in-memory fake server." },
    { type: "callout", kind: "warning", md: `**What this proves and what it does not.** The tests prove that our requests have the right shape (for Bedrock, that AWS's own model accepts them; for Gemini, that a Vertex-style client with \`location="asia-south1"\` sends to \`asia-south1-aiplatform.googleapis.com\`; for Foundry, that the path is \`/openai/v1/chat/completions\` with the deployment name as the model). They do **not** prove that a real cloud accepts your credentials, has your model enabled in your Region, or answers well. For that, set the environment variables from the file's docstring, run one \`chat()\` call per cloud, and read the error messages: they are usually clear.` },
    { type: "section", label: "Tools: write once, render three ways" },
    { type: "text", md: `Chapter 8 defined a tool as a function plus a JSON schema. The three clouds want the same schema in three wrappers. So we define the tool once and render it. The helpdesk's read-only lookup:` },
    { type: "code", file: "code-samples/ch37/clinic_tools.py", lang: "python", code: "@ch37/clinic_tools.py" },
    { type: "code", file: "code-samples/ch37/cloud_tools.py", lang: "python", code: "@ch37/cloud_tools.py" },
    { type: "stepper", svg: LOOP_SVG, caption: "The agent loop of Chapter 9, in Bedrock's words.",
      steps: [
        { on: ["ask"], text: "Your code sends the question and the list of tools (\`toolConfig\`) to the Converse API." },
        { on: ["use"], text: "The model does not run anything. It answers with \`stopReason: tool_use\` and a \`toolUse\` block: the tool's name, the arguments, and an id." },
        { on: ["run"], text: "**Your code** decides whether to run it. Our \`run_tool\` checks that the tool exists and the arguments fit its schema; a bad call becomes an *error result*, not a crash, so the model can correct itself." },
        { on: ["result"], text: "You send back a \`toolResult\` with the **same \`toolUseId\`**, in a user message. \`status: error\` tells the model the tool failed." },
        { on: ["done"], text: "The model now writes the answer: \`stopReason: end_turn\`. If it asks for another tool instead, the loop repeats, up to a hard step limit." }
      ]},
    { type: "code", lang: "python", code: `out = bedrock_agent("Which cardiologists are there?", [FIND_DOCTOR], client=client, model_id="provider.model-v1")
print({k: out[k] for k in ("steps", "tool_calls", "input_tokens", "output_tokens")})
print("what we sent back to the model:", json.dumps(sent[1]["messages"][-1]["content"][0]))`,
      output: `{'steps': 2, 'tool_calls': [('find_doctor', {'specialty': 'cardiology'}, True)], 'input_tokens': 130, 'output_tokens': 30}
what we sent back to the model: {"toolResult": {"toolUseId": "t1", "content": [{"json": {"specialty": "cardiology", "doctors": [{"doctor": "Dr Mehta", "days": "Mon, Wed"}, {"doctor": "Dr Rao", "days": "Thu, Fri"}]}}], "status": "success"}}
step limit: no final answer after 3 model calls`,
      note: "Output from a FAKE Bedrock (Stubber): the 'model' replays two scripted replies. Token counts add up across both calls: an agent's cost is the sum of every step (Chapter 32). The last line is a model that never stops asking for the tool: the step limit ends it." },
    { type: "list", items: [
      "**Foundry's loop** (\`foundry_agent\`) is the same idea in OpenAI's words: the model answers with \`tool_calls\`, you reply with messages of role \`tool\` carrying the \`tool_call_id\`. If the model sends arguments that are not valid JSON, that too becomes an error result (a test covers it).",
      "**Gemini** can run this loop for you if you pass it ordinary Python functions; the loop is the same. We render the tool for Gemini (\`to_gemini\`) and test that the schema survives, but we did not write a Gemini loop.",
      "**Tool results go back as data, never as instructions** (Chapter 33): a doctor's name from a database is text to display, not a command."
    ]},
    { type: "quiz", title: "Knowledge check: the adapter", questions: [
      { kind: "match", q: "Match each cloud to what its 'model' setting means.",
        pairs: [["Amazon Bedrock", "A model id or an inference profile id"], ["Microsoft Foundry", "The name of your own deployment"], ["Gemini on Google Cloud", "A model name, with the location chosen on the client"]] },
      { kind: "order", q: "Put one tool call on Bedrock in order.",
        items: ["Send question and toolConfig", "Model replies stopReason tool_use", "Your code runs the tool", "Send toolResult with the same toolUseId", "Model replies end_turn with the answer"] },
      { kind: "mcq", q: "Why does the loop have a hard step limit?",
        options: ["The API forbids more calls", "A confused model could ask for tools forever, and every step costs money and time", "Tools are slow", "To make answers shorter"],
        answer: 1,
        why: ["It does not.", "Right: this is the budget guard of Chapter 21 again.", "Not the reason.", "Unrelated."] }
    ]}
  ]},

  { title: "Managed runtimes and serverless", blocks: [
    { type: "section", label: "Level 2: give the cloud your agent" },
    { type: "text", md: `In Chapter 36 you ran the helpdesk in a container on Cloud Run or ECS. A cloud's [[agent runtime]] is the same idea made specific to agents. You hand over your code, and the cloud adds the parts that are tedious and risky to build yourself:

- **A separate identity for each agent**, so its permissions can be limited and its actions traced to it.
- **Isolated sessions**, so one patient's conversation can never leak into another's.
- **Scaling, restarts and long-running work.** Agents can run for minutes while they wait for tools and people.
- **Built-in traces and metrics**, sent to the cloud's monitoring (Chapter 32) in the OpenTelemetry format.

What [[agentcore]] (AWS), [[foundry]] (Microsoft) and Google's runtime each say they do, as read on 4 November 2026:

| | What the vendor's page says |
| --- | --- |
| **AgentCore Runtime** (AWS) | Runs agents with long execution windows and session isolation; supports the A2A protocol. AgentCore works with CrewAI, LangGraph, LlamaIndex, Google ADK and the OpenAI Agents SDK, and with models inside or outside Bedrock. At launch it was available in nine Regions, including Mumbai. |
| **Foundry Agent Service** (Microsoft) | **Prompt agents** are defined by configuration (Level 3). **Hosted agents** run your own code (Agent Framework, LangGraph, OpenAI Agents SDK, Anthropic Agent SDK or custom) shipped as a container image or zip; Foundry provides the endpoint, scaling and an automatic Entra identity per agent. Versions are snapshotted with rollback. Voice agents and the agent optimiser were marked *preview*. |
| **Agent Runtime** (Google) | Deploys and scales agents. ADK is fully integrated; templates exist for LangChain, LangGraph, AG2 and LlamaIndex; any containerised framework can run if it meets the runtime contract. Sessions and the Memory Bank are separate services. Multi-agent use with A2A, and resource controls such as minimum and maximum instances, were marked *preview*. |

**Preview means no promises.** Microsoft's page says preview features have no service-level agreement and are not recommended for production until you have reviewed support, security and compliance. Make a habit of reading the preview markers before you build on a feature.` },
    { type: "code", lang: "python", code: `# From Google's "Deploy an agent" page. NOT run here: it needs a Google Cloud project and the right client setup.
remote_agent = client.runtimes.create(config={
    "container_spec": {"image_uri": "CONTAINER_IMAGE_URI"},
    "display_name": "Container image agent",
})`,
      note: "Quoted from Google's documentation of the container-image method (it requires google-cloud-aiplatform 1.144 or newer); the page lists four other methods, including deploying source files. Google's API reference still calls the underlying resource a ReasoningEngine, and older tutorials online use other names for the same thing: expect to see several spellings." },
    { type: "callout", kind: "tip", md: `**Your Chapter 36 container is already most of the way there.** A runtime that accepts a container image (Foundry hosted agents and Google's Agent Runtime both say they do) can run the same helpdesk image. What changes is the contract the platform expects of it, so read each platform's runtime contract before porting. Keep the idea from Chapter 36: the image reads its settings from the environment and files, so only the deployment changes.` },
    { type: "section", label: "Serverless: pay only when it runs" },
    { type: "text", md: `[[serverless]] means you do not run servers: you give the cloud a function, and it runs as many copies as there are requests, and none when idle. For a clinic helpdesk with busy mornings and silent nights, that suits the cost pattern. AWS Lambda is the best-known; Cloud Run (Chapter 36) is its container-shaped cousin.

Three things change when your agent is a function:

1. **It is stateless.** The next request may land on a different copy. Anything a patient said earlier must live in a database or cache (Chapter 10), not in the process's variables.
2. **Cold starts.** A copy that has been idle takes longer to start (a [[cold start]]), and the first request pays for it. Do the slow work (imports, loading documents, creating clients) at module level, where it runs once per copy, and keep the handler small.
3. **Limits.** AWS's published Lambda quotas at the time of reading: a function may run at most **900 seconds (15 minutes)**; a synchronous request and response may each be at most **6 MB**; and an account starts with **1,000** concurrent executions per Region (new accounts get less until usage grows). An agent that works for an hour, or that streams a huge file, does not fit; a runtime from the first half of this lesson does.` },
    { type: "code", file: "code-samples/ch37/lambda_handler.py", lang: "python", code: "@ch37/lambda_handler.py" },
    { type: "code", lang: "python", code: `for msg in ("Why is there an ECG charge on BILL-2291?", "I have severe chest pain"):
    r = lambda_handler.handler(event(msg))
    print(r["statusCode"], r["body"][:120])`,
      output: `200 {"reply": "BILL-2291: OPD registration Rs 100, ECG Rs 350. Total Rs 450."}
200 {"reply": "This sounds like an emergency. Please call 108 now, or come straight to the Emergency department: it is open`,
      note: "Real run of Chapters 27 and 33's helpdesk through the handler, using the offline stand-in model, with an event shaped like AWS's documented function-URL payload (format version 2.0: requestContext.http.method, headers, body, isBase64Encoded; the response needs statusCode, headers and body). Real Lambda was not used." },
    { type: "code", file: "code-samples/ch37/deploy/lambda-template.yaml", lang: "yaml", code: "@ch37/deploy/lambda-template.yaml",
      note: "Passes cfn-lint (a real checker for CloudFormation templates). Not deployed: that needs an AWS account. The function URL uses AuthType AWS_IAM, so only your own backend's role, which must sign its requests, can call it: there is no public address and no API key to leak." },
    { type: "list", items: [
      "**\`ReservedConcurrentExecutions: 5\`** is a ceiling on copies, and therefore on cost during a flood or an attack. Choose it from your busiest hour, not from hope. Note that AWS keeps a minimum of unreserved capacity in each account, so a new account with a low quota may not be able to reserve any: check yours.",
      "**Timeout 60 s** is longer than the model-call timeout (25 s) so the handler can return its safe error, and shorter than a patient's patience.",
      "**Logs.** The handler prints a request id and nothing about the message, so the logs, which many people can read, hold no patient text. A test proves that an exception's text appears in neither the reply nor the log."
    ]},
    { type: "quiz", title: "Knowledge check: runtimes and serverless", questions: [
      { kind: "match", q: "Match each need to the right home.",
        pairs: [["An agent that works for an hour on one request", "A managed agent runtime with long execution windows"], ["A helpdesk with busy mornings and silent nights", "A serverless function or Cloud Run"], ["Not writing the loop at all", "A configured agent (Level 3)"], ["Moving clouds cheaply later", "Levels 1 and 2, with MCP tools and your own tests"]] },
      { kind: "tf", q: "A Lambda function can keep a patient's conversation in a Python variable between requests.", answer: false,
        explain: " The next request may be handled by a different copy, or by the same copy after a restart. Keep the conversation in a database." },
      { kind: "mcq", q: "A feature you want is marked 'preview'. What is the sensible reading?",
        options: ["It is the newest and best", "It may change or break and has no service-level promise, so use it for experiments and plan for it to move", "It is free", "It is only for large companies"],
        answer: 1,
        why: ["Newest is not the same as stable.", "Right: Microsoft's page says exactly this about its preview features.", "Not implied.", "Not implied."] }
    ]}
  ]},

  { title: "Governance, residency and choosing", blocks: [
    { type: "section", label: "Least privilege: the agent may do only its job" },
    { type: "text", md: `[[iam]] (identity and access management) is the cloud's system for who may do what. [[least privilege]] means giving each identity the smallest set of permissions that lets it work. For a helpdesk that only answers questions, that is *call one model in one Region*, and nothing else: not "any Bedrock action", not "any model", and certainly not "everything".

AWS's guidance for Bedrock names the actions: \`bedrock:InvokeModel\` (and \`InvokeModelWithResponseStream\` for streaming). AWS's security blog says denying them also denies the Converse APIs, so Converse is governed by those actions. The simplest policy, for one model in one Region, is:` },
    { type: "code", file: "code-samples/ch37/iam_policy.py", lang: "python", code: "@ch37/iam_policy.py" },
    { type: "code", lang: "python", code: `print(iam_policy.bedrock_single_region_policy("ap-south-1", "provider.model-v1")["Statement"][0])
print("lint (ours):", iam_policy.lint_policy(...))      # the policy above
for p in iam_policy.lint_policy(careless):               # a policy that grants bedrock:* on '*', and any Region
    print(" -", p)`,
      output: `{
 "Sid": "AllowOneModelInOneRegion",
 "Effect": "Allow",
 "Action": ["bedrock:InvokeModel"],
 "Resource": ["arn:aws:bedrock:ap-south-1::foundation-model/provider.model-v1"]
}
lint (ours): []
 - Everything: wildcard action 'bedrock:*': list the exact actions the agent needs
 - Everything: Resource '*' applies to everything
 - AnyRegion: 'arn:aws:bedrock:*::foundation-model/provider.model-v1' allows any Region, which defeats a data-residency promise`,
      note: "Real output of our code (the policy is shown compactly). 'provider.model-v1' is a placeholder, not a real model id. The linter is OURS and only checks the mistakes in its list; AWS's IAM Access Analyzer is the real validator. We have no AWS account here, so the policy was never run against real IAM." },
    { type: "list", items: [
      "**Cross-Region inference needs three parts** (AWS's documented pattern): permission on the inference profile, permission on the model in your Region, and permission on the model in *every destination Region* of the profile, with a condition that the call came through that profile. \`bedrock_invoke_policy\` generates it; \`deploy/bedrock-invoke-policy.json\` is its output, with placeholders, and a test checks that the file matches the generator.",
      "**Require a guardrail.** AWS documents a condition key, \`bedrock:GuardrailIdentifier\`, so a policy can allow invocation *only when the call names an approved guardrail*. \`require_guardrail\` adds it. This turns Chapter 33's guard rails from \"we remembered to add them\" into \"the call is refused without them\".",
      "**One identity per agent.** Each cloud now offers one: AgentCore Identity, an Entra identity for every hosted Foundry agent, Google's Agent Identity and IAM. Use them rather than one shared key, so a log line says *which* agent did something.",
      "**Deny by default, review by calendar.** Put a quarterly reminder to re-read the permissions. Agents gain tools over time and permissions grow with them."
    ]},
    { type: "section", label: "Where does the prompt go?" },
    { type: "text", md: `A patient's message contains health information. Chapter 34 explained why *where it is processed* matters, and the name for that worry is [[data residency]]. All three clouds let you choose (AWS packages the choice as an [[inference profile]]) between "stay close" and "use whatever capacity is free", and the second is faster and more available. They spell it differently, so we reduce them to one scale.` },
    { type: "stepper", svg: SCALE_SVG, caption: "The same choice on all three clouds.",
      steps: [
        { on: ["region"], text: "**One Region.** The tightest promise. On Bedrock, a plain model id is served from the Region you call. On Google, a regional endpoint names one region, but note Google's own warning (below)." },
        { on: ["geo"], text: "**A geography.** Several Regions inside one area. AWS: an inference profile with a prefix such as \`us.\`, \`eu.\`, \`apac.\` or \`in.\`, whose documentation says requests \"stay within that geography\" but that prompts and outputs \"might move outside of your source Region\". Azure: *Standard* deployments, processed \"within the customer-specified Azure geography\", possibly between regions of it." },
        { on: ["zone"], text: "**A data zone.** Azure's *DataZone* deployment types process data \"only within the Microsoft-specified data zone\" (US, EU or Asia Pacific). Google's multi-region endpoints \`us\` and \`eu\` keep ML processing inside that jurisdiction." },
        { on: ["global"], text: "**Global.** AWS's \`global.\` profiles route to any commercial Region; Azure's *Global* types \"may be processed in any Azure region\"; Google says that with the global endpoint you cannot control or know which region processes your requests. Fine for a public FAQ bot, not for patient data unless your compliance team has agreed." }
      ]},
    { type: "callout", kind: "warning", md: `**Check two more things the scale does not show.** (1) **Data at rest is a separate question** from where a prompt is processed (AWS: data "remains in the AWS Regions where it originally resides", except that data stored for abuse detection can be stored in the destination Region; Azure: "stored at rest remains in the designated Azure geography"). (2) Google's page says plainly: "Endpoints don't guarantee data residency or in-region ML processing", and sends you to its separate data-residency page. Residency is a legal and contractual matter: ask your compliance team, read each provider's data-processing terms, and do not take this chapter's table as legal advice. We read these statements on 4 November 2026.` },
    { type: "code", file: "code-samples/ch37/residency.py", lang: "python", code: "@ch37/residency.py" },
    { type: "code", lang: "python", code: `rule = dict(allowed_scopes=("region", "geography"), allowed_regions=("ap-south-1", "ap-south-2"))
residency.check("aws", "global.provider.model-v1", region="ap-south-1", **rule)`,
      output: `aws    provider.model-v1          ap-south-1 OK
aws    global.provider.model-v1   ap-south-1 ["aws setting 'global.provider.model-v1' has scope 'global', but only ['region', 'geography'] are allowed"]
aws    provider.model-v1          us-east-1  ["Region 'us-east-1' is not in the allowed list ['ap-south-1', 'ap-south-2']"]
azure  DataZoneStandard           -          ["azure setting 'DataZoneStandard' has scope 'data-zone', but only ['region', 'geography'] are allowed"]
azure  Standard                   -          OK
google global                     -          ["google setting 'global' has scope 'global', but only ['region', 'geography'] are allowed"]`,
      note: "Real output of our code. The rule is deliberately strict: an unknown inference-profile prefix or Azure deployment type raises an error instead of being guessed, because a new option silently classed as 'one Region' is the dangerous mistake. Run check() at start-up and in the CI pipeline of Chapter 36." },
    { type: "section", label: "Choosing, without a winner" },
    { type: "text", md: `There is no single best cloud, and we have not compared quality, speed or price: those change monthly and depend on your task. Choose on things that are stable:

1. **Where your identity and data already live.** A hospital on Microsoft 365 and Entra will find Foundry's identity story familiar; one with its data in BigQuery will lean to Google; one with its databases and IAM in AWS will lean to Bedrock. Moving data costs more than any model price difference.
2. **Which models you need, in which Region.** Catalogues overlap more each quarter, but availability still depends on Region and account. Check the specific model in your specific Region before you commit.
3. **The residency rule** you wrote above, and which options each cloud offers in India.
4. **How portable you need to be.** If the answer is "very", stay at Levels 1 and 2, expose tools over MCP, keep your prompts, tool schemas and evaluation set (Chapter 31) in your own repository, and keep the adapter thin.
5. **Your team.** The cloud your engineers already operate is the one they will operate safely.

And whichever you choose, **keep the guardrails, evaluation and monitoring of Chapters 31 to 34 in your own code**. The platforms offer their own versions (content filters, evaluations, dashboards). Use them as an extra layer, not a replacement you cannot take with you.` },
    { type: "section", label: "Checklist and mistakes" },
    { type: "list", items: [
      "A written level (1, 2 or 3) per agent, and the reason.",
      "One identity per agent, with a policy a linter and a human have both read.",
      "A residency rule in code, checked at start-up and in CI, backed by the compliance team's written decision.",
      "Model ids, deployment names and locations in settings, not in code; no default model.",
      "Tools defined once and exposed over open standards where you can.",
      "Billing budgets and alerts in the cloud's cost tool, plus the daily token budget of Chapter 32, plus a concurrency ceiling.",
      "Preview features marked as such in your design document.",
      "An exit note: what you would need to move, and how long it would take."
    ]},
    { type: "list", style: "mistakes", items: [
      "Choosing a Global option for patient data because it was the default in the portal.",
      "An access policy of \"bedrock:*\" on \"*\" to make the error go away.",
      "One shared API key for every agent and every environment.",
      "Building the whole agent in a portal where nothing can be reviewed, versioned or tested in your pipeline.",
      "Hard-coding a model id that the cloud retires next quarter.",
      "Assuming a rename means a new product: check what actually changed before relearning everything."
    ]},
    { type: "quiz", title: "Knowledge check: governance", questions: [
      { kind: "match", q: "Match each setting to where the prompt may be processed.",
        pairs: [["AWS: plain model id", "The one Region you call"], ["Azure: Standard deployment", "Within the Azure geography you chose"], ["Azure: DataZoneStandard", "Within the data zone (US, EU or APAC)"], ["AWS: global. profile", "Any commercial Region"]] },
      { kind: "mcq", q: "Your policy allows bedrock:InvokeModel on arn:aws:bedrock:*::foundation-model/your-model. What is wrong for a clinic with a residency promise?",
        options: ["Nothing", "The * in the Region part allows the model to be called in any Region", "InvokeModel is the wrong action", "Models cannot have ARNs"],
        answer: 1,
        why: ["Our linter flags it.", "Right: name the Region (or the profile's exact Regions).", "It is the documented action; Converse uses it.", "They can."] },
      { kind: "tf", q: "Putting the patient message through a cloud's content filter means you no longer need your own guardrails and evaluation.", answer: false,
        explain: " The platform's tools are an extra layer. Keep yours in your own code so they test, version and move with you." },
      { kind: "mcq", q: "Which statement about 'data at rest' versus 'where a prompt is processed' is right?",
        options: ["They are the same thing", "They are separate questions, and a provider's promise about one does not automatically cover the other", "Only processing matters", "Only storage matters"],
        answer: 1,
        why: ["The documentation treats them separately.", "Right: read both statements, for each provider, in writing.", "Storage (including abuse-detection storage) matters too.", "Processing matters too."] }
    ]}
  ]}

  ]
};
})();
