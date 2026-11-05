/* App shell: theme, sidebar, hash router, lazy chapter loading, page wiring. */
(function () {
  "use strict";
  var C = window.COURSE, R = window.Render;
  var main = document.getElementById("main");
  var sidebar = document.getElementById("sidebar");
  var loaded = {};

  /* ---------- small helpers ---------- */
  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }
  function loadScript(src) {
    if (loaded[src]) return loaded[src];
    loaded[src] = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { delete loaded[src]; reject(new Error("Could not load " + src)); };
      document.body.appendChild(s);
    });
    return loaded[src];
  }
  function chapterMeta(id) { return C.outline.filter(function (c) { return c.id === id; })[0]; }
  function partMeta(id) { return C.parts.filter(function (p) { return p.id === id; })[0]; }
  var uidN = 0;

  /* ---------- theme ---------- */
  function isDark() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t) return t === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  document.getElementById("theme-btn").addEventListener("click", function () {
    var next = isDark() ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    store("aah-theme", next);
  });

  /* ---------- provider preference for code tabs ---------- */
  function provider() { return store("aah-provider") || "openai"; }

  /* ---------- sidebar ---------- */
  function renderSidebar(currentId) {
    var html = "";
    C.parts.forEach(function (p) {
      var chs = C.outline.filter(function (c) { return c.part === p.id; });
      var open = !currentId || chs.some(function (c) { return c.id === currentId; }) || p.core;
      html += '<div class="nav-part' + (open ? "" : " collapsed") + '"><button aria-expanded="' + open + '">Part ' + p.id + " · " + R.esc(p.title) +
        '<svg class="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></button><ul>';
      chs.forEach(function (c) {
        html += '<li><a class="nav-link' + (c.id === currentId ? " current" : "") + (c.file ? "" : " soon") + '" href="#' + c.id + '"' +
          (c.id === currentId ? ' aria-current="page"' : "") + '><span class="num">' + c.n + "</span><span>" + R.esc(c.title) + "</span>" +
          (c.file ? '<span class="dot" title="Ready to read"></span>' : "") + "</a></li>";
      });
      html += "</ul></div>";
    });
    html += '<div class="nav-extra"><a class="nav-link" href="#home"><span class="num">⌂</span><span>Course map</span></a>' +
      '<a class="nav-link" href="#glossary"><span class="num">Aa</span><span>Glossary</span></a></div>';
    sidebar.innerHTML = html;
    sidebar.querySelectorAll(".nav-part > button").forEach(function (b) {
      b.addEventListener("click", function () {
        var part = b.parentNode;
        part.classList.toggle("collapsed");
        b.setAttribute("aria-expanded", !part.classList.contains("collapsed"));
      });
    });
  }

  /* ---------- mobile menu ---------- */
  var menuBtn = document.getElementById("menu-btn");
  function setNav(open) {
    document.body.classList.toggle("nav-open", open);
    menuBtn.setAttribute("aria-expanded", open);
  }
  menuBtn.addEventListener("click", function () { setNav(!document.body.classList.contains("nav-open")); });
  document.getElementById("scrim").addEventListener("click", function () { setNav(false); });
  sidebar.addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });

  /* ---------- glossary popovers ---------- */
  var pop = null;
  function hidePop() { if (pop) { pop.remove(); pop = null; } }
  function showPop(el) {
    hidePop();
    var g = (window.GLOSSARY || {})[el.getAttribute("data-term")];
    if (!g) return;
    pop = document.createElement("div");
    pop.className = "term-pop";
    pop.setAttribute("role", "tooltip");
    pop.innerHTML = "<b>" + R.esc(g.term) + "</b>" + R.esc(g.def);
    document.body.appendChild(pop);
    var r = el.getBoundingClientRect();
    var w = pop.offsetWidth;
    var left = Math.min(Math.max(8, r.left + window.scrollX), window.scrollX + document.documentElement.clientWidth - w - 8);
    pop.style.left = left + "px";
    pop.style.top = (r.bottom + window.scrollY + 6) + "px";
  }
  document.addEventListener("mouseover", function (e) { var t = e.target.closest && e.target.closest(".term"); if (t) showPop(t); });
  document.addEventListener("mouseout", function (e) { if (e.target.closest && e.target.closest(".term")) hidePop(); });
  document.addEventListener("focusin", function (e) { if (e.target.classList && e.target.classList.contains("term")) showPop(e.target); });
  document.addEventListener("focusout", function (e) { if (e.target.classList && e.target.classList.contains("term")) hidePop(); });
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest(".term");
    if (t) { e.preventDefault(); if (pop) hidePop(); else showPop(t); } else hidePop();
  });
  window.addEventListener("scroll", hidePop, { passive: true });

  /* ---------- wiring after render ---------- */
  function wire(root) {
    root.querySelectorAll("[data-codeblock]").forEach(function (block) {
      block.querySelectorAll(".code-tab").forEach(function (tab) {
        tab.addEventListener("click", function () {
          var v = tab.getAttribute("data-variant");
          store("aah-provider", v);
          // Switch every code block on the page to the same provider.
          root.querySelectorAll("[data-codeblock]").forEach(function (b) {
            if (!b.querySelector('[data-variant-body="' + v + '"]')) return;
            b.querySelectorAll(".code-tab").forEach(function (t) { t.classList.toggle("active", t.getAttribute("data-variant") === v); });
            b.querySelectorAll("[data-variant-body]").forEach(function (p) { p.hidden = p.getAttribute("data-variant-body") !== v; });
          });
        });
      });
      var copy = block.querySelector("[data-copy]");
      copy.addEventListener("click", function () {
        var pre = block.querySelector("pre:not([hidden])");
        var text = pre.innerText;
        var done = function () { copy.textContent = "Copied"; setTimeout(function () { copy.textContent = "Copy"; }, 1400); };
        try {
          navigator.clipboard.writeText(text).then(done, function () { selectText(pre); });
        } catch (e) { selectText(pre); }
      });
      var out = block.querySelector("[data-output]");
      if (out) out.addEventListener("click", function () {
        var o = block.querySelector(".code-output");
        o.hidden = !o.hidden;
        out.textContent = o.hidden ? "Show output" : "Hide output";
      });
    });
  }
  function selectText(el) {
    var range = document.createRange(); range.selectNodeContents(el);
    var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
  }

  /* ---------- pages ---------- */
  function setPage(html, title) {
    main.innerHTML = '<div class="page">' + html + "</div>";
    document.title = title ? title + " · Agentic AI Handbook" : "Agentic AI Handbook";
  }

  function homePage() {
    var path = C.parts.map(function (p) {
      var chs = C.outline.filter(function (c) { return c.part === p.id; });
      var chips = chs.map(function (c) {
        return '<a class="chip' + (c.file ? " ready" : "") + '" href="#' + c.id + '">' + c.n + ". " + R.esc(c.title) + "</a>";
      }).join("");
      return '<li><div class="rail"><span class="badge' + (p.core ? " core" : "") + '">' + p.id + '</span><span class="line"></span></div>' +
        '<div class="part-card"><h3>' + R.esc(p.title) + (p.core ? '<span class="tag-core">Core path</span>' : "") + "</h3><p>" + R.esc(p.blurb) + '</p><div class="chips">' + chips + "</div></div></li>";
    }).join("");
    var ready = C.outline.filter(function (c) { return c.file; }).length;
    setPage(
      '<section class="hero"><div class="eyebrow">Free · offline · no sign-up</div>' +
      "<h1>Learn Agentic AI from your first prompt to a team of agents</h1>" +
      "<p>44 chapters that explain every idea fully, with diagrams you can step through, code in both OpenAI and Anthropic, and a knowledge check after every lesson. One running example ties it together: a Clinic Helpdesk assistant that grows from a single prompt into a crew of agents.</p>" +
      '<div class="hero-actions"><a class="btn primary" href="#ch01">Start at Chapter 1</a>' +
      '<a class="btn" href="#ch09">Build an agent: Chapter 9</a>' + "</div>" +
      '<p class="net-note" style="margin-top:12px">' + ready + " of " + C.outline.length + " chapters ready. More are added in each release.</p></section>" +
      '<h2 class="section-label">How each lesson works</h2><div class="how-grid">' +
      '<div class="how"><strong>The problem first</strong><p>Each idea starts from what goes wrong without it, shown on the Clinic Helpdesk.</p></div>' +
      '<div class="how"><strong>See it, then read it</strong><p>Diagrams come before the text. Press “Next step” to walk through them.</p></div>' +
      '<div class="how"><strong>Real code, two providers</strong><p>Switch any code block between OpenAI and Anthropic. Your choice is remembered.</p></div>' +
      '<div class="how"><strong>Check yourself</strong><p>Every lesson ends with questions that explain why each answer is right or wrong.</p></div></div>' +
      '<h2 class="section-label">Course map</h2><p class="prose">Parts A to D are the core path. Parts E to G can be taken in any order afterwards. Highlighted chapters are ready to read; the rest show their planned topics.</p>' +
      '<ol class="path">' + path + "</ol>" +
      '<p class="footer-note">All patient, doctor and insurance data in this course is made up. The Clinic Helpdesk never gives medical advice. Press <b>/</b> anywhere to search.</p>',
      null);
  }

  function glossaryPage(anchor) {
    var keys = Object.keys(window.GLOSSARY).sort(function (a, b) { return window.GLOSSARY[a].term.localeCompare(window.GLOSSARY[b].term); });
    var letters = {};
    var items = keys.map(function (k) {
      var g = window.GLOSSARY[k], L = g.term[0].toUpperCase(), m = chapterMeta(g.ch);
      var first = !letters[L]; letters[L] = true;
      return "<dt id=\"term-" + R.slug(k) + "\"" + (first ? ' data-letter="' + L + '"' : "") + ">" + R.esc(g.term) + "</dt><dd>" + R.esc(g.def) +
        (m ? ' <a href="#' + m.id + '">Chapter ' + m.n + "</a>" : "") + "</dd>";
    }).join("");
    var alpha = Object.keys(letters).map(function (L) { return '<a href="#glossary" data-jump="' + L + '">' + L + "</a>"; }).join("");
    setPage('<div class="crumbs">Reference</div><h1>Glossary</h1><p class="oneline">Every term used in the course, in plain words.</p>' +
      '<nav class="alpha">' + alpha + '</nav><dl class="glossary-list">' + items + "</dl>", "Glossary");
    main.querySelectorAll("[data-jump]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var t = main.querySelector('[data-letter="' + a.getAttribute("data-jump") + '"]');
        if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    if (anchor) scrollToId(anchor);
  }

  function soonPage(meta) {
    var p = partMeta(meta.part);
    setPage('<div class="crumbs">Part ' + p.id + " · " + R.esc(p.title) + " · Chapter " + meta.n + "</div><h1>" + R.esc(meta.title) + "</h1>" +
      '<div class="soon-box prose"><h2>Coming soon</h2><p>This chapter is planned and not written yet. It will cover:</p><p>' + R.esc(meta.topics) + ".</p></div>" +
      pager(meta, 1, 1), meta.title);
  }

  function pager(meta, lesson, count) {
    var idx = C.outline.indexOf(meta);
    var prev = null, next = null;
    if (lesson > 1) prev = { hash: meta.id + "-" + (lesson - 1), label: "Previous lesson" };
    else if (idx > 0) prev = { hash: C.outline[idx - 1].id + "-last", label: "Chapter " + C.outline[idx - 1].n, title: C.outline[idx - 1].title };
    if (lesson < count) next = { hash: meta.id + "-" + (lesson + 1), label: "Next lesson" };
    else if (idx < C.outline.length - 1) next = { hash: C.outline[idx + 1].id, label: "Chapter " + C.outline[idx + 1].n, title: C.outline[idx + 1].title };
    var chapter = C.chapters[meta.id];
    function t(x, l) { return x.title || (chapter ? chapter.lessons[l - 1].title : ""); }
    return '<nav class="pager" aria-label="Lesson navigation">' +
      (prev ? '<a class="prev" href="#' + prev.hash + '"><small>← ' + prev.label + "</small><span>" + R.esc(t(prev, lesson - 1)) + "</span></a>" : "") +
      (next ? '<a class="next" href="#' + next.hash + '"><small>' + next.label + " →</small><span>" + R.esc(t(next, lesson + 1)) + "</span></a>" : "") + "</nav>";
  }

  function lessonPage(meta, lessonArg, anchor) {
    var ch = C.chapters[meta.id];
    var count = ch.lessons.length;
    var n = lessonArg === "last" ? count : Math.min(Math.max(parseInt(lessonArg, 10) || 1, 1), count);
    var lesson = ch.lessons[n - 1];
    var p = partMeta(meta.part);
    var ctx = { after: [], uid: function () { return ++uidN; }, provider: provider };
    var tabs = '<nav class="lesson-tabs" aria-label="Lessons in this chapter">' + ch.lessons.map(function (l, i) {
      return '<a href="#' + meta.id + "-" + (i + 1) + '"' + (i + 1 === n ? ' class="active" aria-current="page"' : "") + '><span class="n">' + (i + 1) + "</span>" + R.esc(l.title) + "</a>";
    }).join("") + "</nav>";
    var body = R.blocks(lesson.blocks, ctx);
    setPage('<div class="crumbs">Part ' + p.id + " · " + R.esc(p.title) + " · Chapter " + meta.n + "</div>" +
      "<h1>" + R.esc(ch.title) + '</h1><p class="oneline">' + R.md(ch.oneLine, true) + "</p>" + tabs +
      '<article class="prose">' + body + "</article>" + pager(meta, n, count), lesson.title + " · " + ch.title);
    ctx.after.forEach(function (fn) { fn(main); });
    wire(main);
    if (anchor) scrollToId(anchor);
  }

  function scrollToId(id) {
    var el = document.getElementById(id);
    if (el) setTimeout(function () { el.scrollIntoView({ block: "start" }); window.scrollBy(0, -70); }, 30);
  }

  /* ---------- router ---------- */
  var pendingAnchor = "";
  function route() {
    hidePop();
    var h = (location.hash || "").replace(/^#/, "");
    var anchor = pendingAnchor; pendingAnchor = "";
    var m = /^(ch\d\d)(?:-(\d+|last))?$/.exec(h);
    if (h === "glossary") { renderSidebar(null); glossaryPage(anchor); }
    else if (m && chapterMeta(m[1])) {
      var meta = chapterMeta(m[1]);
      renderSidebar(meta.id);
      if (!meta.file) soonPage(meta);
      else if (C.chapters[meta.id]) lessonPage(meta, m[2], anchor);
      else {
        setPage('<p class="loading">Loading chapter ' + meta.n + "…</p>", meta.title);
        Promise.all([loadScript(meta.file)].concat(meta.code ? [loadScript(meta.code)] : [])).then(function () { lessonPage(meta, m[2], anchor); }, function () {
          setPage('<div class="soon-box"><h2>This chapter could not be loaded</h2><p>The file <code>' + R.esc(meta.file) + "</code> is missing. If you downloaded the course, check that the <code>content</code> folder was unzipped next to <code>index.html</code>.</p></div>", meta.title);
        });
      }
    } else { renderSidebar(null); homePage(); }
    if (!anchor) window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }

  window.App = {
    loadScript: loadScript,
    provider: provider,
    setProvider: function (v) { store("aah-provider", v); },
    go: function (hash, anchor) {
      pendingAnchor = anchor || "";
      if (location.hash === "#" + hash) route(); else location.hash = hash;
    }
  };

  window.addEventListener("hashchange", route);
  route();
  window.Search.init({ input: document.getElementById("search"), panel: document.getElementById("search-results") });
})();
