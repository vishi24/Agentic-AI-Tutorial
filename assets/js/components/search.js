/* Search across written lessons (content/search-index.js), the glossary and planned chapter topics. */
(function () {
  "use strict";
  var esc = function (t) { return window.Render.esc(t); };
  var ms = null, ready = false, pendingQuery = null;
  var input, panel, activeIdx = -1, items = [];

  function buildIndex() {
    ms = new window.MiniSearch({
      fields: ["title", "heading", "text", "tags"],
      storeFields: ["kind", "title", "heading", "text", "hash", "chapter", "section"],
      searchOptions: { boost: { title: 3, heading: 2, tags: 2 }, prefix: true, fuzzy: 0.2, combineWith: "AND" }
    });
    var docs = [];
    (window.SEARCH_INDEX || []).forEach(function (d, i) {
      docs.push({ id: "l" + i, kind: "lesson", title: d.lessonTitle, heading: d.heading || "", text: d.text,
        tags: d.chapterTitle, hash: d.hash, chapter: "Ch " + d.n + " · " + d.chapterTitle, section: d.section || "" });
    });
    var written = {};
    (window.SEARCH_INDEX || []).forEach(function (d) { written[d.ch] = true; });
    Object.keys(window.GLOSSARY || {}).forEach(function (k, i) {
      var g = window.GLOSSARY[k];
      docs.push({ id: "g" + i, kind: "term", title: g.term, heading: "", text: g.def, tags: k, hash: "glossary", chapter: "Glossary", section: k });
    });
    window.COURSE.outline.forEach(function (c) {
      if (written[c.id]) return;
      docs.push({ id: "o" + c.id, kind: "planned", title: c.title, heading: "", text: c.topics, tags: "", hash: c.id, chapter: "Ch " + c.n + " · coming soon", section: "" });
    });
    ms.addAll(docs);
    ready = true;
    if (pendingQuery !== null) run(pendingQuery);
  }

  function snippet(text, terms) {
    var lower = text.toLowerCase(), pos = -1;
    for (var i = 0; i < terms.length && pos < 0; i++) pos = lower.indexOf(terms[i].toLowerCase());
    var start = Math.max(0, pos - 40);
    var s = (start > 0 ? "…" : "") + text.slice(start, start + 150);
    var html = esc(s);
    terms.forEach(function (t) {
      if (t.length < 2) return;
      var re = new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
      html = html.replace(re, "<mark>$1</mark>");
    });
    return html;
  }

  function run(q) {
    q = q.trim();
    if (!q) { close(); return; }
    panel.hidden = false;
    if (!ready) { pendingQuery = q; panel.innerHTML = '<div class="sr-empty">Building the search index…</div>'; return; }
    var res = ms.search(q);
    if (!res.length) res = ms.search(q, { combineWith: "OR" });
    res = res.slice(0, 14);
    items = [];
    if (!res.length) {
      panel.innerHTML = '<div class="sr-empty">No matches for “' + esc(q) + '”. Try a shorter word, like “tool” or “memory”.</div>';
      return;
    }
    var groups = { lesson: [], term: [], planned: [] };
    res.forEach(function (r) { groups[r.kind].push(r); });
    var html = "";
    var labels = { lesson: "Lessons", term: "Glossary", planned: "Planned chapters" };
    ["lesson", "term", "planned"].forEach(function (k) {
      if (!groups[k].length) return;
      html += '<div class="sr-group">' + labels[k] + "</div>";
      groups[k].forEach(function (r) {
        items.push(r);
        var idx = items.length - 1;
        var title = esc(r.title) + (r.heading ? " · " + esc(r.heading) : "") + (k === "planned" ? '<span class="sr-tag">Soon</span>' : "");
        html += '<button class="sr-item" role="option" data-i="' + idx + '"><strong>' + title + "</strong><span>" + esc(r.chapter) + " — " + snippet(r.text, r.terms) + "</span></button>";
      });
    });
    panel.innerHTML = html;
    activeIdx = -1;
    panel.querySelectorAll(".sr-item").forEach(function (b) {
      b.addEventListener("mousedown", function (e) { e.preventDefault(); pick(+b.getAttribute("data-i")); });
    });
  }

  function pick(i) {
    var r = items[i];
    if (!r) return;
    close();
    input.blur();
    window.App.go(r.hash, r.kind === "lesson" ? r.section : r.kind === "term" ? "term-" + window.Render.slug(r.section) : "");
  }

  function close() { panel.hidden = true; activeIdx = -1; }

  function move(d) {
    var els = panel.querySelectorAll(".sr-item");
    if (!els.length) return;
    activeIdx = (activeIdx + d + els.length) % els.length;
    els.forEach(function (e, i) { e.classList.toggle("active", i === activeIdx); });
    els[activeIdx].scrollIntoView({ block: "nearest" });
  }

  function init(opts) {
    input = opts.input; panel = opts.panel;
    input.addEventListener("input", function () { run(input.value); });
    input.addEventListener("focus", function () { if (input.value.trim()) run(input.value); });
    input.addEventListener("blur", function () { setTimeout(close, 120); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") { e.preventDefault(); pick(activeIdx >= 0 ? activeIdx : 0); }
      else if (e.key === "Escape") { input.value = ""; close(); input.blur(); }
    });
    document.addEventListener("keydown", function (e) {
      var tag = (document.activeElement && document.activeElement.tagName) || "";
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(tag)) { e.preventDefault(); input.focus(); }
    });
    // Load the text-only index in the background, after the first lesson is on screen.
    var start = function () { window.App.loadScript("content/search-index.js").then(buildIndex, buildIndex); };
    if ("requestIdleCallback" in window) window.requestIdleCallback(start, { timeout: 1500 }); else setTimeout(start, 400);
  }

  window.Search = { init: init };
})();
