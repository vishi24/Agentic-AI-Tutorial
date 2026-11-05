/* Chapter 36 · Deploying agents */
(function () {

var LIFE_SVG = `
<svg viewBox="0 0 680 230" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch36-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="start"><rect class="dg-box" x="10" y="60" width="140" height="80" rx="10"/><text class="dg-title" x="80" y="88" text-anchor="middle">Starting</text><text class="dg-muted" x="80" y="108" text-anchor="middle">/health 200</text><text class="dg-muted" x="80" y="124" text-anchor="middle">/ready 503</text></g>
  <g data-step="ready"><rect class="dg-box accent" x="190" y="60" width="140" height="80" rx="10"/><text class="dg-title" x="260" y="88" text-anchor="middle">Ready</text><text class="dg-muted" x="260" y="108" text-anchor="middle">/health + /ready 200</text><text class="dg-muted" x="260" y="124" text-anchor="middle">gets traffic</text></g>
  <g data-step="drain"><rect class="dg-box amber" x="370" y="60" width="140" height="80" rx="10"/><text class="dg-title" x="440" y="88" text-anchor="middle">Draining</text><text class="dg-muted" x="440" y="108" text-anchor="middle">/ready 503</text><text class="dg-muted" x="440" y="124" text-anchor="middle">finishes in-flight work</text></g>
  <g data-step="stop"><rect class="dg-box" x="550" y="60" width="120" height="80" rx="10"/><text class="dg-title" x="610" y="88" text-anchor="middle">Stopped</text><text class="dg-muted" x="610" y="112" text-anchor="middle">after grace</text></g>
  <path class="dg-line" d="M150 100H188" marker-end="url(#ch36-a)"/><path class="dg-line" d="M330 100H368" marker-end="url(#ch36-a)"/><path class="dg-line" d="M510 100H548" marker-end="url(#ch36-a)"/>
  <g data-step="hung"><rect class="dg-box amber" x="190" y="164" width="140" height="50" rx="10"/><text class="dg-title" x="260" y="186" text-anchor="middle">/health fails</text><text class="dg-muted" x="260" y="204" text-anchor="middle">platform restarts it</text></g>
  <g data-step="term"><text class="dg-muted" x="372" y="170">The platform sends SIGTERM here:</text><text class="dg-muted" x="372" y="188">"please finish up and exit"</text></g>
  <path class="dg-line" d="M260 142V162" marker-end="url(#ch36-a)"/>
  <text class="dg-muted" x="12" y="24">Liveness (/health) answers "should I restart you?". Readiness (/ready) answers "should I send you traffic?".</text>
</svg>`;

var PIPE_SVG = `
<svg viewBox="0 0 680 190" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ch36-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
  <g data-step="pr"><rect class="dg-box" x="6" y="60" width="90" height="56" rx="10"/><text class="dg-title" x="51" y="84" text-anchor="middle">Pull request</text><text class="dg-muted" x="51" y="102" text-anchor="middle">a change</text></g>
  <g data-step="test"><rect class="dg-box accent" x="116" y="60" width="86" height="56" rx="10"/><text class="dg-title" x="159" y="84" text-anchor="middle">Tests</text><text class="dg-muted" x="159" y="102" text-anchor="middle">fast, offline</text></g>
  <g data-step="gate"><rect class="dg-box accent" x="222" y="60" width="100" height="56" rx="10"/><text class="dg-title" x="272" y="84" text-anchor="middle">Eval gate</text><text class="dg-muted" x="272" y="102" text-anchor="middle">+ attack set</text></g>
  <g data-step="scan"><rect class="dg-box accent" x="342" y="60" width="86" height="56" rx="10"/><text class="dg-title" x="385" y="84" text-anchor="middle">Secrets</text><text class="dg-muted" x="385" y="102" text-anchor="middle">scan</text></g>
  <g data-step="build"><rect class="dg-box accent" x="448" y="60" width="86" height="56" rx="10"/><text class="dg-title" x="491" y="84" text-anchor="middle">Build</text><text class="dg-muted" x="491" y="102" text-anchor="middle">no push</text></g>
  <g data-step="deploy"><rect class="dg-box amber" x="554" y="60" width="118" height="56" rx="10"/><text class="dg-title" x="613" y="84" text-anchor="middle">Deploy</text><text class="dg-muted" x="613" y="102" text-anchor="middle">main + approval</text></g>
  <path class="dg-line" d="M96 88H114" marker-end="url(#ch36-b)"/><path class="dg-line" d="M202 88H220" marker-end="url(#ch36-b)"/><path class="dg-line" d="M322 88H340" marker-end="url(#ch36-b)"/><path class="dg-line" d="M428 88H446" marker-end="url(#ch36-b)"/><path class="dg-line" d="M534 88H552" marker-end="url(#ch36-b)"/>
  <text class="dg-muted" x="12" y="24">Each stage can stop the line. Only the last stage can touch production.</text>
  <text class="dg-muted" x="12" y="160">A pull request runs everything except the deploy; merging to main adds the deploy, behind a human approval.</text>
</svg>`;

window.COURSE.chapters.ch36 = {
  id: "ch36",
  title: "Deploying agents",
  oneLine: "A working script is not a service. You will wrap the helpdesk in a web service with health checks, authentication and safe errors; package it in a hardened container; run tests and the evaluation gate on every change; and release it to a few patients first with automatic rollback.",
  lessons: [

  { title: "From script to service", blocks: [
    { type: "section", label: "What a platform expects from your program" },
    { type: "text", md: `Everything so far ran when *you* typed a command. A deployed agent must run by itself, restart when it hangs, accept traffic only when ready, stop without dropping a patient's request, and never show an error message that helps an attacker. A container platform (Docker, Cloud Run, ECS, Kubernetes) can do much of this for you, **if** your program speaks its language. That language is small:

- **Liveness** (\`/health\`): "am I alive?". If this fails, the platform restarts the container. It must be cheap and must **not** call the model or any outside service; a provider outage should not make the platform restart-loop your containers.
- **Readiness** (\`/ready\`): "should traffic be sent to me?". It says *no* while starting up (loading documents, building the graph) and *no* again while shutting down.
- **Graceful shutdown**: on a stop signal (SIGTERM) the service stops accepting new work, finishes what it is doing, then exits within a grace period.` },
    { type: "stepper", svg: LIFE_SVG, caption: "The life of one container, as the platform sees it.",
      steps: [
        { on: ["start"], text: "**Starting.** The process is up (\`/health\` is fine) but not yet useful, so \`/ready\` answers 503 and the load balancer sends nothing." },
        { on: ["ready"], text: "**Ready.** Start-up work is done; \`/ready\` answers 200 and traffic arrives." },
        { on: ["hung", "ready"], text: "If the process hangs, \`/health\` stops answering. The platform notices and **restarts** it. This is why liveness must be independent of the model provider." },
        { on: ["term", "drain"], text: "**Draining.** A deploy or scale-down sends SIGTERM. The service flips \`/ready\` to 503 so no *new* traffic comes, and finishes the requests it already has." },
        { on: ["stop"], text: "**Stopped** when the work is done or the grace period ends, whichever is first. The grace period must be longer than your slowest normal request." }
      ]},
    { type: "section", label: "The helpdesk as a service" },
    { type: "text", md: `\`app.py\` wraps Chapter 33's guarded helpdesk in a FastAPI service. Read it for the production details, each of which exists because of a specific failure:

- **\`/ask\` needs an API key**, compared in constant time. Patients reach it through your own front end, not directly.
- **Size limit and rate limit** (Chapter 34's abuse monitor), so one client cannot flood it.
- **A timeout** on every request, with a safe reply. Models sometimes hang.
- **Safe errors**: any exception becomes the same polite message; the details go to the log, never to the caller.
- **A request id** on every response and every log line, so one patient's report can be matched to one trace. Logs hold the id, path, status and time, **never the message**.
- **No public API documentation page** in production (\`/docs\` and \`/openapi.json\` are switched off).
- **\`/metrics\`** for Prometheus (Chapter 32), which should be reachable only inside your network.` },
    { type: "code", file: "code-samples/ch36/app.py", lang: "python", code: "@ch36/app.py" },
    { type: "section", label: "Settings and secrets" },
    { type: "text", md: `The same container image should run on your laptop, in CI and in the cloud; **only the environment changes**. So all settings come from environment variables, and secrets additionally support a \`NAME_FILE\` form: if \`OPENAI_API_KEY_FILE=/run/secrets/openai\` is set, the key is read from that file. Platforms mount secrets as files, and a file does not show up in \`docker inspect\`, process listings or crash reports the way an environment variable can.

The configuration also **fails fast**. In production, a missing API key or a leftover test switch stops the service at start-up with a clear message. A crash-looping deploy is noticed in a minute; a service that starts half-configured can serve errors to patients for hours.` },
    { type: "code", file: "code-samples/ch36/settings.py", lang: "python", code: "@ch36/settings.py",
      note: "repr=False on the secret fields means that even a debugging print of the settings object cannot leak a key." },
    { type: "code", lang: "python", code: `with TestClient(create_app(Settings(api_keys=("good-key",), offline=True), run=lambda m: "ok")) as c:
    print(c.get("/health").json(), c.get("/ready").json())
    print(c.post("/ask", json={"message": "hi"}).status_code,
          c.post("/ask", json={"message": "hi"}, headers={"X-API-Key": "good-key"}).json())
os.environ["APP_ENV"] = "prod"
Settings.from_env()`,
      output: `{'status': 'ok'} {'status': 'ready'}
401 {'reply': 'ok'}
ConfigError: APP_ENV=prod requires API_KEYS (or API_KEYS_FILE); OFFLINE=1 is for tests; refuse to run it in prod`,
      note: "Real output (the error text is what the exception message says). The test suite also proves: timeouts and exceptions return the same safe message with no detail (a database password in the exception never reaches the caller), the rate limit returns 429, and after shutdown /ready answers 'draining'." },
    { type: "code", lang: "bash", code: "pip install -r requirements-service.txt pytest httpx pyyaml\nOFFLINE=1 python -m pytest -q test_ch36.py",
      output: "19 passed",
      note: "Real run in a clean environment built from exactly requirements-service.txt: this proves that list is complete, so the container's dependencies are right. 19 tests cover the settings, the service, the canary, the linter and the deployment files." },
    { type: "quiz", title: "Knowledge check: services", questions: [
      { kind: "match", q: "Match each endpoint to its question.",
        pairs: [["/health", "Should the platform restart me?"], ["/ready", "Should traffic be sent to me?"], ["/metrics", "What are my counters right now?"], ["/ask", "Answer this patient message"]] },
      { kind: "mcq", q: "Why must /health NOT call the model provider?",
        options: ["It would be slow", "A provider outage would fail every health check and the platform would restart-loop healthy containers", "Health checks are free", "The model cannot answer GET requests"],
        answer: 1,
        why: ["Slowness is a side issue.", "Right: liveness should reflect your process, not other people's outages.", "Not the point.", "Not the point."] },
      { kind: "tf", q: "When the service fails, it is helpful to return the exception text so the caller can report it.", answer: false,
        explain: " Exception text can reveal file paths, queries and secrets. Return one safe message and keep the detail in logs with a request id." }
    ]}
  ]},

  { title: "Containers: Docker, multi-stage builds, Compose", blocks: [
    { type: "section", label: "Why a container" },
    { type: "text", md: `"It works on my machine" is the oldest deployment problem. A **container image** packages your code together with the exact Python version and libraries it needs, so the same bytes run on your laptop, in CI and in the cloud. A **container** is a running copy of an image, isolated from the others.

Three words you will meet: the **Dockerfile** (the recipe for an image), the **image** (the built result, stored in a *registry*) and **Docker Compose** (a file that starts several containers together on one machine).` },
    { type: "section", label: "A production Dockerfile, line by line" },
    { type: "code", file: "code-samples/ch36/deploy/Dockerfile", lang: "dockerfile", code: "@ch36/deploy/Dockerfile" },
    { type: "list", items: [
      "**Multi-stage build.** The first stage installs packages (it may need compilers and caches); the second starts again from a clean base and copies in only the finished environment. The final image is smaller, builds faster to pull, and has fewer tools for an attacker to use.",
      "**A pinned base image.** \`python:3.13-slim\` is a tag that moves with patch releases; in production also pin the digest (\`@sha256:…\`) so a rebuild a month later is the same image. Never rely on \`:latest\`.",
      "**\`--no-cache-dir\`** keeps pip's download cache out of the image.",
      "**A non-root user.** The process runs as \`app\` (user 10001), so a compromised process cannot modify the system.",
      "**Only what is needed is copied.** Code folders are listed one by one. A companion \`Dockerfile.dockerignore\` keeps \`.env\`, git history, caches, traces and other chapters out of the build.",
      "**\`HEALTHCHECK\`** lets Docker mark the container unhealthy when \`/health\` stops answering.",
      "**Exec-form \`CMD\`** (the \`[\"uvicorn\", …]\` list) runs the server as the main process, so it receives SIGTERM directly and can drain. The shell form (\`CMD uvicorn …\`) puts a shell in the middle that swallows the signal and your graceful shutdown never happens.",
      "**\`--timeout-graceful-shutdown 20\`** gives in-flight requests 20 seconds to finish after SIGTERM."
    ]},
    { type: "callout", kind: "warning", md: `**Never bake secrets into an image.** Anything in a layer (\`COPY .env\`, \`ENV API_KEY=…\`, a build argument) can be read by anyone who gets the image, even if a later line deletes the file. Secrets arrive at run time, from the platform.` },
    { type: "section", label: "A linter for the mistakes that hurt" },
    { type: "text", md: `Because the build environment here cannot download base images (see below), we wrote a small checker for the Dockerfile mistakes that matter most. Docker also has its own \`docker build --check\`; use both in CI.` },
    { type: "code", file: "code-samples/ch36/docker_lint.py", lang: "python", code: "@ch36/docker_lint.py" },
    { type: "code", lang: "python", code: `lint(open("deploy/Dockerfile").read())
lint("FROM python\\nCOPY . .\\nENV OPENAI_API_KEY=sk-aaaaaaaaaaaaaaaa\\nRUN pip install flask\\nCMD python app.py\\n")`,
      output: `[]
 - unpinned base image 'python': an untagged image means 'latest', which changes under you
 - single-stage build: compilers and caches ship in the final image (use a builder stage and a runtime stage)
 - the container runs as root: add a non-root USER before CMD (a compromised process then has fewer powers)
 - no HEALTHCHECK: the platform cannot tell a hung process from a healthy one
 - CMD/ENTRYPOINT in shell form: the shell becomes PID 1 and swallows SIGTERM, so graceful shutdown never happens (use the ["exec", "form"])
 - a secret baked into the image through ENV: anyone with the image can read it
 - pip install without --no-cache-dir: RUN pip install flask`,
      note: "Real output: our Dockerfile passes (empty list); a careless one trips seven rules." },
    { type: "section", label: "Compose: run it the way production will" },
    { type: "code", file: "code-samples/ch36/deploy/docker-compose.yml", lang: "yaml", code: "@ch36/deploy/docker-compose.yml" },
    { type: "list", items: [
      "**Secrets as files:** the compose \`secrets:\` section mounts them under \`/run/secrets\`, and the \`_FILE\` settings read them. There is no key in the environment.",
      "**Hardening:** \`read_only\` root filesystem (with a temporary \`/tmp\`), \`cap_drop: ALL\` (no special Linux powers) and \`no-new-privileges\`. If an attacker gets code running inside, they find a mostly locked room.",
      "**Health check on \`/ready\`**, resource limits, \`restart: unless-stopped\`, and a \`stop_grace_period\` longer than the app's drain time.",
      "Compose is for one machine: development, a demo, a small on-premise server. For scaling and rolling updates you use a platform (next lessons)."
    ]},
    { type: "callout", kind: "warning", md: `**What was and was not tested here.** The compose file was validated with the real \`docker compose config\`, and the Dockerfile passes our linter and the files list is checked by tests. The image itself was **not built or run**: the build environment cannot reach Docker Hub, so base images cannot be pulled. Build and start it on your own machine (\`docker build -f ch36/deploy/Dockerfile -t clinic-helpdesk .\` from the code-samples folder) and read any error; the likely suspects are paths in the COPY lines.` },
    { type: "quiz", title: "Knowledge check: containers", questions: [
      { kind: "match", q: "Match each Dockerfile practice to the risk it reduces.",
        pairs: [["Multi-stage build", "Build tools and caches shipping in the final image"], ["Non-root USER", "A compromised process controlling the container"], ["Exec-form CMD", "SIGTERM never reaching the app, so no graceful shutdown"], ["Pinned base image digest", "A rebuild silently using a different base"]] },
      { kind: "mcq", q: "You add COPY .env . and later add RUN rm .env. Is the key safe?",
        options: ["Yes, it was deleted", "No: the earlier layer still contains it and anyone with the image can extract it", "Yes, if the image is private", "Only on Windows"],
        answer: 1,
        why: ["Layers are cumulative.", "Right: images are stacked layers, and deleting later does not remove earlier ones.", "Private images still leak to everyone with access.", "Not OS-specific."] },
      { kind: "tf", q: "Mounting a secret as a file is better than an environment variable because it does not appear in docker inspect or process listings.", answer: true,
        explain: " Environment variables are visible to anyone who can inspect the container and are often captured in crash reports. A mounted file is easier to restrict." }
    ]}
  ]},

  { title: "CI/CD with GitHub Actions", blocks: [
    { type: "section", label: "Every change goes through the same gate" },
    { type: "text", md: `**CI** (continuous integration) runs checks automatically on every change; **CD** (continuous delivery) deploys when the checks pass. The point is not speed. It is that nobody, including you on a tired Friday, can skip the checks. For an agent, the checks include something ordinary software does not have: the **evaluation gate** and **attack set** from Chapters 31 and 33.` },
    { type: "stepper", svg: PIPE_SVG, caption: "The pipeline in ci.yml.",
      steps: [
        { on: ["pr"], text: "A **pull request** proposes a change. The pipeline runs on every push to it." },
        { on: ["test"], text: "**Tests** from chapters 27, 31, 32, 33, 34 and 36 run offline with the stand-in model: no API key, no cost, and the same result every time." },
        { on: ["gate"], text: "The **evaluation gate** (\`eval_gate.py\`) runs the dataset and fails the pipeline with exit code 1 if a case fails; the **attack set** (\`redteam.py\`) runs next. Chapter 31 explained why the rule is written in advance." },
        { on: ["scan"], text: "A **secrets scan** (Chapter 34) fails the build if a key was committed." },
        { on: ["build"], text: "The container image is **built** but not pushed, proving it builds." },
        { on: ["deploy"], text: "Only a merge to **main** reaches the deploy job, and that job waits for a **human approval** configured on the \`production\` environment." }
      ]},
    { type: "code", file: "code-samples/ch36/deploy/ci.yml", lang: "yaml", code: "@ch36/deploy/ci.yml",
      note: "Copy to .github/workflows/ci.yml. Not run here (it needs GitHub); test_ch36.py parses it and checks its structure." },
    { type: "code", file: "code-samples/ch36/eval_gate.py", lang: "python", code: "@ch36/eval_gate.py",
      output: `eval gate: 9/9 cases pass
GATE: ok`,
      note: "Real output with the stand-in model; exit code 0. A failing case prints GATE: BLOCKED with the case ids and exits 1, which fails the job." },
    { type: "section", label: "Details that make a pipeline safe" },
    { type: "list", items: [
      "**Least privilege.** The workflow starts with \`permissions: contents: read\`. Only the deploy job gets \`id-token: write\`, and a test asserts that no other job has it.",
      "**No long-lived cloud keys in GitHub.** The deploy job uses **OpenID Connect (OIDC)**: GitHub proves to your cloud who the job is, and the cloud returns a short-lived credential. There is no secret to steal or rotate. Setting this up (a *workload identity provider* on Google Cloud, or an IAM role on AWS) is a one-time job for your cloud administrator; follow your cloud's guide for GitHub Actions.",
      "**Environments with required reviewers.** Marking the job \`environment: production\` lets you require a named person to approve every production deploy.",
      "**Pin actions to commit SHAs.** \`actions/checkout@v4\` is a tag its author can move. A malicious update to a popular action has happened before. Production pipelines use the full commit SHA (and Dependabot to update it).",
      "**Treat pull requests from forks as hostile.** Do not expose secrets to them; this pipeline needs none for tests because the model is a stand-in.",
      "**Stand-in model in CI, real model on a schedule.** CI with the stand-in checks plumbing and rules. Quality needs the real model: run the same \`eval_gate.py\` with a real key in a separate job (nightly, or before a release) with a spending cap.",
      "**\`concurrency\`** cancels an outdated run when you push again, saving minutes."
    ]},
    { type: "callout", kind: "tip", md: `**A deploy that creates the new version with no traffic.** The last step runs \`gcloud run deploy … --no-traffic --tag canary\`. The new version exists and has its own test URL, but receives **zero** patients. Sending patients to it is a separate, deliberate step (next lesson). Separating "deployed" from "released" is the single most useful release habit.` },
    { type: "quiz", title: "Knowledge check: CI/CD", questions: [
      { kind: "order", q: "Put the pipeline stages in order.",
        items: ["Unit tests", "Evaluation gate and attack set", "Secrets scan", "Build the image", "Human approval, then deploy"] },
      { kind: "mcq", q: "Why does the deploy job use OIDC instead of a stored cloud access key?",
        options: ["It is faster", "There is no long-lived secret to leak: the job gets a short-lived credential after proving its identity", "Keys are not allowed in GitHub", "It avoids tests"],
        answer: 1,
        why: ["Not the reason.", "Right: a stolen long-lived key is the classic breach.", "They are allowed but risky.", "Unrelated."] },
      { kind: "tf", q: "Because CI runs the evaluation with a stand-in model, it proves the real model's quality is acceptable.", answer: false,
        explain: " It proves the plumbing and rules. Quality needs a run with the real model (a nightly or pre-release job with a spending cap)." }
    ]}
  ]},

  { title: "Cloud platforms and safe releases", blocks: [
    { type: "section", label: "Where the container runs" },
    { type: "text", md: `You rarely run a container on a server you manage yourself. A **managed container platform** takes the image, runs N copies, restarts them, spreads traffic, scales with load and gives you logs. Two common choices:

- **Google Cloud Run:** you give it an image, it gives you an HTTPS URL. It can scale down to zero (cheap, but the first request after quiet is slower) or keep a minimum instance warm. Each deploy creates a **revision**; traffic can be split between revisions by percentage.
- **AWS ECS on Fargate:** you describe a **task** (image, CPU, memory, secrets, health check) and a **service** that keeps N tasks running behind a load balancer. Rolling and blue/green deployments are available through the service and AWS CodeDeploy.

Both pull secrets from a managed store (Secret Manager, Secrets Manager) at start-up, run under a **dedicated identity** with only the permissions the service needs, and can run in an Indian region (Mumbai: \`asia-south1\` on Google Cloud, \`ap-south-1\` on AWS), which helps with the data-residency questions of Chapter 34. Chapter 37 compares the cloud AI platforms themselves.` },
    { type: "code", file: "code-samples/ch36/deploy/cloudrun-service.yaml", lang: "yaml", code: "@ch36/deploy/cloudrun-service.yaml" },
    { type: "code", file: "code-samples/ch36/deploy/ecs-task-definition.json", lang: "json", code: "@ch36/deploy/ecs-task-definition.json",
      note: "Tests parse both files and check the Cloud Run scale ceiling and probes, and the ECS read-only filesystem, health check, stop timeout and Secrets Manager references. The service YAML is not run through any Cloud Run tool, and neither file was deployed (that needs your cloud account). Replace PROJECT, ACCOUNT_ID and the image tag, and check each platform's current reference for field names." },
    { type: "list", items: [
      "**A ceiling on scale** (\`maxScale: 5\`) is a ceiling on cost during a flood or an attack.",
      "**A minimum instance** (\`minScale: 1\`) avoids a cold start for the first patient of the morning, at a small constant cost.",
      "**Timeouts at every layer** (platform request timeout above the app's 25 s, below the patient's patience).",
      "**Secrets only by reference** (the secret store's name), never as plain values in these files, so the files can live in git.",
      "**Logs go to standard output**; the platform collects them. Keep patient text out of them (Chapter 31)."
    ]},
    { type: "section", label: "Releasing without fear" },
    { type: "text", md: `Even after tests and evaluation, production differs from your tests. So we separate **deploy** (the new version exists) from **release** (patients use it), and release in steps:

| Strategy | How it works | Best for |
| --- | --- | --- |
| **Rolling** | Replace instances a few at a time | Routine low-risk changes; simplest |
| **Blue/green** | Run the new version (green) beside the old (blue); switch all traffic at once; keep blue ready to switch back | Instant, simple rollback; costs double capacity briefly |
| **Canary** | Send a small share (5%) to the new version, watch, then 25%, 50%, 100% | Risky changes: new model, new prompt, new tools |

On Cloud Run, the tools for this are real flags of the \`gcloud\` command (checked against the installed SDK's help): \`gcloud run deploy … --no-traffic --tag canary\` creates a revision with no traffic and a test URL; \`gcloud run services update-traffic … --to-revisions=NEW=5,OLD=95\` moves a share of patients; \`--to-revisions=OLD=100\` is the rollback.` },
    { type: "section", label: "A canary that decides for itself" },
    { type: "text", md: `Watching a dashboard works until it is 3 a.m. \`canary.py\` encodes the rule: advance through 5%, 25%, 50%, 100% only if the new version's error rate is not worse than the old one's; **roll back automatically** the moment it is clearly worse. A patient is assigned by hashing their id, so the same patient keeps getting the same version during a stage.

The comparison is a statistical one (two proportions with a 95% confidence bound), so a handful of unlucky requests cannot trigger a rollback, and the old version's record is kept across stages so the comparison still works at 100%. (A first version of this file compared against a stage's old traffic only, which at 100% is empty, and rolled back healthy releases. The simulation caught it.)` },
    { type: "code", file: "code-samples/ch36/canary.py", lang: "python", code: "@ch36/canary.py" },
    { type: "text", md: "The simulation (it lives in \`test_ch36.py\`) sends fake patients through the release and gives each version a fixed chance of failing. Random, but with a fixed seed so it repeats:" },
    { type: "code", lang: "python", code: `def simulate(release, error_new, error_old, n=6000):
    rng = random.Random(3)
    for i in range(n):
        v = release.pick(f"patient-{i}")
        release.record(v, rng.random() < (error_new if v == "new" else error_old))
        if release.rolled_back or (release.stage == len(release.stages) - 1 and release.stats["new"][0] > 300):
            break
    return release

simulate(Release(), 0.02, 0.02, n=30000)                       # a healthy release
simulate(Release(), 0.25, 0.02)                                # a broken release
simulate(Release(min_requests=200), 0.06, 0.02, n=60000)       # mildly worse, small stages
simulate(Release(min_requests=2000), 0.06, 0.02, n=200000)     # mildly worse, bigger stages`,
      output: `GOOD:   ['promote 5% -> 25%', 'promote 25% -> 50%', 'promote 50% -> 100%']
BAD:    ['ROLLBACK at 5% (new 18.8% vs old 1.7%)']
SUBTLE, stages of 200:  ['promote 5% -> 25%', 'promote 25% -> 50%', 'promote 50% -> 100%', 'ROLLBACK at 100% (new 14.0% vs old 1.9%)']
SUBTLE, stages of 2000: ['ROLLBACK at 5% (new 6.2% vs old 2.1%)']`,
      note: "Real output of simulated traffic (random errors, fixed seed). A broken release is stopped after 32 requests to the new version, so it hurt a handful of patients. A mildly worse one slips through small stages and is only caught once it reaches everyone; with bigger stages it is caught at 5%. The lesson: a canary stops disasters quickly; catching subtle regressions needs more traffic per stage, which is why evaluation (Chapter 31) comes first." },
    { type: "callout", kind: "tip", md: `**Canary on what?** Error rate is the simplest signal. For agents also compare **fallback rate, model calls per request, cost per request and latency** (Chapter 32), and sample replies for the judge from Chapter 31. A new prompt can answer every request "successfully" and still be worse.` },
    { type: "section", label: "A kill switch, and what to do at 3 a.m." },
    { type: "text", md: `Keep a way to turn the agent off **without a deploy**: a setting the service reads on each request (an environment variable that triggers the safe fallback, a feature flag, or traffic to a static "please call the front desk" version). Test it. The most important property of a deployment is how quickly you can make it stop doing harm.` },
    { type: "section", label: "Production checklist" },
    { type: "list", items: [
      "A service with liveness, readiness, graceful shutdown, auth, limits, timeouts and safe errors.",
      "A multi-stage, non-root, health-checked image with pinned base and no secrets; a lint step.",
      "Settings from the environment, secrets from files or a secret store, start-up validation.",
      "CI: tests, evaluation gate, attack set, secrets scan, image build, on every change.",
      "Deploys by short-lived credentials, with human approval for production.",
      "Release in steps with automatic rollback, and metrics (Chapter 32) watched per version.",
      "A kill switch and a one-page runbook."
    ]},
    { type: "list", style: "mistakes", items: [
      "Health checks that call the model provider.",
      "Shell-form CMD, so shutdown is not graceful.",
      "Secrets in the image, in compose files or in the pipeline log.",
      "Deploying straight to 100% of traffic.",
      "A canary with too little traffic per stage to detect anything.",
      "No way to roll back faster than a full redeploy."
    ]},
    { type: "quiz", title: "Knowledge check: releases", questions: [
      { kind: "match", q: "Match each release strategy to its main property.",
        pairs: [["Rolling", "Replace instances gradually; simplest"], ["Blue/green", "Switch all traffic at once; instant switch back"], ["Canary", "Send a small share first and watch"], ["Kill switch", "Stop the agent without a deploy"]] },
      { kind: "mcq", q: "Why does the canary keep the old version's error record across stages?",
        options: ["To save memory", "At 100% no traffic reaches the old version, and without its record any error rate would look worse than zero", "To confuse attackers", "Because the old version is faster"],
        answer: 1,
        why: ["Not the reason.", "Right: a simulation found exactly this bug in an earlier version.", "Unrelated.", "Unrelated."] },
      { kind: "mcq", q: "Your canary stages each see 200 requests. The new version is 4 points worse in error rate (6% vs 2%). What is likely to happen?",
        options: ["It is rolled back immediately", "200 requests rarely give enough evidence for a small difference, so it may be promoted; bigger stages detect it", "It never reaches 100%", "The old version is deleted"],
        answer: 1,
        why: ["The rule needs statistical evidence.", "Right: small differences need more data, which is a trade-off between speed and sensitivity.", "It can.", "Unrelated."] }
    ]}
  ]}

  ]
};
})();
