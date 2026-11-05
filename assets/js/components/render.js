/* Turns a lesson's content blocks into HTML. Each block type is one small function. */
(function () {
  "use strict";

  var ICONS = {
    analogy: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/></svg>',
    tip: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    warning: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/></svg>',
    jargon: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14zM20 17v4H6.5"/></svg>'
  };
  var CALLOUT_TITLE = { analogy: "Analogy", tip: "Good to know", warning: "Watch out", jargon: "Jargon buster" };

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* Markdown with [[term]] and [[term|text]] glossary links. */
  function md(text, inline) {
    if (!text) return "";
    var withTerms = String(text).replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, function (_, key, shown) {
      var k = key.trim().toLowerCase();
      return '<span class="term" tabindex="0" data-term="' + esc(k) + '">' + esc(shown || key) + "</span>";
    });
    var html = inline ? window.marked.parseInline(withTerms) : window.marked.parse(withTerms);
    return html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, "</table></div>");
  }

  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  }

  function highlight(code, lang) {
    var g = window.Prism && window.Prism.languages[lang];
    return g ? window.Prism.highlight(code, g, lang) : esc(code);
  }

  var R = {};

  R.text = function (b) { return md(b.md); };

  R.section = function (b) {
    return '<h2 id="' + slug(b.label) + '">' + esc(b.label) + "</h2>";
  };

  R.callout = function (b) {
    var kind = b.kind || "tip";
    return '<aside class="callout ' + kind + '">' + (ICONS[kind] || ICONS.tip) +
      '<div class="c-body"><div class="c-title">' + esc(b.title || CALLOUT_TITLE[kind]) + "</div>" + md(b.md) + "</div></aside>";
  };

  R.diagram = function (b) {
    return '<figure class="figure"><div class="fig-scroll" role="img" aria-label="' + esc(b.alt || b.caption || "Diagram") + '">' + b.svg +
      "</div>" + (b.caption ? "<figcaption>" + md(b.caption, true) + "</figcaption>" : "") + "</figure>";
  };

  R.stepper = function (b, ctx) {
    var id = "stp-" + ctx.uid();
    ctx.after.push(function (root) { window.Stepper.init(root.querySelector("#" + id), b.steps); });
    return '<figure class="figure stepper" id="' + id + '"><div class="fig-scroll" role="img" aria-label="' + esc(b.alt || b.caption || "Step-through diagram") + '">' + b.svg + "</div>" +
      '<div class="step-bar"><div class="step-caption" aria-live="polite">' + md(b.intro || "Press <b>Start</b> to walk through it one step at a time.", true) + "</div>" +
      '<button class="btn" data-act="prev" disabled>Back</button><button class="btn primary" data-act="next">Start</button></div>' +
      (b.caption ? "<figcaption>" + md(b.caption, true) + "</figcaption>" : "") + "</figure>";
  };

  /* "@ch09/clinic.py" refers to a real file in code-samples/, bundled into content/code/<chapter>.js */
  function resolve(src) {
    if (typeof src === "string" && src.charAt(0) === "@") {
      var f = (window.CODE || {})[src.slice(1)];
      return f === undefined ? "# Missing code file: " + src.slice(1) + "\n# Run: node tools/build-search.js" : f.replace(/\n$/, "");
    }
    return src;
  }

  R.code = function (b, ctx) {
    var raw = b.variants || { only: b.code };
    var variants = {};
    Object.keys(raw).forEach(function (k) { variants[k] = resolve(raw[k]); });
    var keys = Object.keys(variants);
    var labels = { openai: "OpenAI", anthropic: "Anthropic", only: "" };
    var pref = ctx.provider();
    var active = keys.indexOf(pref) >= 0 ? pref : keys[0];
    var head = '<div class="code-head"><span class="file">' + esc(b.file || b.lang || "") + "</span>";
    if (keys.length > 1) {
      keys.forEach(function (k) {
        head += '<button class="code-tab' + (k === active ? " active" : "") + '" data-variant="' + k + '">' + (labels[k] || k) + "</button>";
      });
    }
    head += '<button class="code-btn" data-copy>Copy</button>';
    if (b.output) head += '<button class="code-btn" data-output>Show output</button>';
    head += "</div>";
    var bodies = keys.map(function (k) {
      return '<pre data-variant-body="' + k + '"' + (k === active ? "" : " hidden") + '><code class="language-' + esc(b.lang || "python") + '">' +
        highlight(variants[k], b.lang || "python") + "</code></pre>";
    }).join("");
    return '<div class="code" data-codeblock>' + head + bodies +
      (b.output ? '<div class="code-output" hidden>' + esc(b.output) + "</div>" : "") +
      (b.note ? '<div class="code-meta">' + md(b.note, true) + "</div>" : "") + "</div>";
  };

  R.trace = function (b) {
    var whoClass = { user: "user", tool: "tool", agent: "", model: "" };
    var items = b.items.map(function (it) {
      var body = it.code ? "<pre>" + esc(it.code) + "</pre>" : md(it.md);
      return '<li><div class="who ' + (whoClass[it.who] || "") + '">' + esc(it.label || it.who) + "</div>" + body + "</li>";
    }).join("");
    return (b.title ? "<h3>" + esc(b.title) + "</h3>" : "") + '<ol class="trace">' + items + "</ol>";
  };

  R.deeper = function (b, ctx) {
    var inner = b.blocks ? renderBlocks(b.blocks, ctx) : md(b.md);
    return '<details class="deeper"><summary>' + esc(b.title) + "<small>Go deeper</small></summary><div class=\"d-body prose\">" + inner + "</div></details>";
  };

  R.list = function (b) {
    return '<ul class="keylist' + (b.style === "mistakes" ? " bad" : "") + '">' +
      b.items.map(function (i) { return "<li><div>" + md(i, true) + "</div></li>"; }).join("") + "</ul>";
  };

  R.videos = function (b) {
    var cards = b.ids.map(function (id) {
      var v = (window.VIDEOS || {})[id];
      if (!v) return "";
      return '<a class="video-card" href="' + esc(v.url) + '" target="_blank" rel="noopener">' +
        '<span class="play"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>' +
        "<span><strong>" + esc(v.title) + "</strong><span>" + esc(v.channel) + " · " + esc(v.length) + "</span></span></a>";
    }).join("");
    return '<div class="videos">' + cards + '</div><p class="net-note">Videos open on YouTube and need an internet connection.</p>';
  };

  R.sim = function (b, ctx) {
    var id = "sim-" + ctx.uid();
    ctx.after.push(function (root) { window.Sim.init(root.querySelector("#" + id), b); });
    return '<figure class="figure sim"><div class="sim-body" id="' + id + '"></div>' + (b.caption ? "<figcaption>" + md(b.caption, true) + "</figcaption>" : "") + "</figure>";
  };

  R.quiz = function (b, ctx) {
    var id = "quiz-" + ctx.uid();
    ctx.after.push(function (root) { window.Quiz.render(root.querySelector("#" + id), b); });
    return '<section class="quiz" id="' + id + '" aria-label="Knowledge check"></section>';
  };

  function renderBlocks(blocks, ctx) {
    return blocks.map(function (b) {
      var fn = R[b.type];
      if (!fn) return "<!-- unknown block " + esc(b.type) + " -->";
      return fn(b, ctx);
    }).join("\n");
  }

  window.Render = { blocks: renderBlocks, md: md, esc: esc, slug: slug, highlight: highlight };
})();
