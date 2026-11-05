/* Knowledge checks: mcq, tf (true/false), order, match. Nothing is saved; "Try again" resets. */
(function () {
  "use strict";
  var md = function (t, inline) { return window.Render.md(t, inline); };
  var esc = function (t) { return window.Render.esc(t); };
  var LETTERS = "ABCDEFGH";

  function shuffle(arr, seed) {
    // Deterministic shuffle so a question never starts already solved.
    var a = arr.slice(), s = seed || 7;
    for (var i = a.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      var j = Math.floor((s / 233280) * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    var same = a.every(function (x, i) { return x === arr[i]; });
    if (same && a.length > 1) { a.push(a.shift()); }
    return a;
  }

  function render(root, quiz) {
    var answered = 0, correct = 0, total = quiz.questions.length;

    function updateScore() {
      root.querySelector(".quiz-score").textContent = answered === 0
        ? total + " questions"
        : correct + " of " + answered + " correct" + (answered === total ? " · done" : "");
    }

    function record(ok, qEl, fbText) {
      answered++; if (ok) correct++;
      var fb = document.createElement("div");
      fb.className = "feedback " + (ok ? "ok" : "no");
      fb.innerHTML = "<b>" + (ok ? "Correct." : "Not quite.") + "</b>" + (fbText ? md(fbText, true) : "");
      qEl.querySelector(".q-body").appendChild(fb);
      updateScore();
    }

    function build() {
      answered = 0; correct = 0;
      root.innerHTML = '<div class="quiz-head"><strong>' + esc(quiz.title || "Knowledge check") +
        '</strong><span class="quiz-score"></span></div>';
      quiz.questions.forEach(function (q, qi) {
        var qEl = document.createElement("div");
        qEl.className = "q";
        var meta = { mcq: "Choose one", tf: "True or false", order: "Put in order", match: "Match each item" }[q.kind] || "";
        qEl.innerHTML = '<div class="q-meta">Question ' + (qi + 1) + " · " + meta + '</div><div class="q-text">' + md(q.q) + '</div><div class="q-body"></div>';
        root.appendChild(qEl);
        var body = qEl.querySelector(".q-body");
        ({ mcq: mcq, tf: tf, order: order, match: match })[q.kind](q, qEl, body, qi);
      });
      var foot = document.createElement("div");
      foot.className = "q";
      foot.innerHTML = '<button class="btn" data-reset>Try again</button>';
      foot.querySelector("[data-reset]").addEventListener("click", build);
      root.appendChild(foot);
      updateScore();
    }

    function mcq(q, qEl, body) {
      var wrap = document.createElement("div");
      wrap.className = "opts";
      q.options.forEach(function (opt, i) {
        var b = document.createElement("button");
        b.className = "opt";
        b.innerHTML = '<span class="key">' + LETTERS[i] + "</span><span>" + md(opt, true) + "</span>";
        b.addEventListener("click", function () {
          var buttons = wrap.querySelectorAll(".opt");
          buttons.forEach(function (x, j) {
            x.disabled = true;
            var why = q.why && q.why[j];
            if (j === q.answer) x.classList.add("correct");
            if (j === i && i !== q.answer) x.classList.add("wrong");
            if (why && (j === i || j === q.answer)) {
              var w = document.createElement("span"); w.className = "why"; w.innerHTML = md(why, true);
              x.lastChild.appendChild(w);
            }
          });
          record(i === q.answer, qEl, q.explain);
        });
        wrap.appendChild(b);
      });
      body.appendChild(wrap);
    }

    function tf(q, qEl, body) {
      mcq({ options: ["True", "False"], answer: q.answer ? 0 : 1, explain: q.explain }, qEl, body);
    }

    function order(q, qEl, body, qi) {
      var items = shuffle(q.items, qi + 3);
      var ol = document.createElement("ol");
      ol.className = "order-list";
      function draw() {
        ol.innerHTML = "";
        items.forEach(function (it, i) {
          var li = document.createElement("li");
          li.innerHTML = '<span class="pos">' + (i + 1) + "</span><span>" + md(it, true) + '</span><span class="mv">' +
            '<button aria-label="Move up"' + (i === 0 ? " disabled" : "") + ">↑</button>" +
            '<button aria-label="Move down"' + (i === items.length - 1 ? " disabled" : "") + ">↓</button></span>";
          var btns = li.querySelectorAll("button");
          btns[0].addEventListener("click", function () { swap(i, i - 1); });
          btns[1].addEventListener("click", function () { swap(i, i + 1); });
          ol.appendChild(li);
        });
      }
      function swap(a, b) { var t = items[a]; items[a] = items[b]; items[b] = t; draw(); ol.children[b].querySelectorAll("button")[a < b ? 1 : 0].focus(); }
      draw();
      var act = document.createElement("div");
      act.className = "q-actions";
      act.innerHTML = '<button class="btn primary">Check order</button>';
      act.firstChild.addEventListener("click", function () {
        var ok = true;
        Array.prototype.forEach.call(ol.children, function (li, i) {
          var good = items[i] === q.items[i];
          if (!good) ok = false;
          li.classList.add(good ? "correct" : "wrong");
          li.querySelectorAll("button").forEach(function (x) { x.disabled = true; });
        });
        act.firstChild.disabled = true;
        record(ok, qEl, (ok ? "" : " The right order is: " + q.items.map(function (x, i) { return (i + 1) + ". " + x; }).join("  ") + ". ") + (q.explain || ""));
      });
      body.appendChild(ol);
      body.appendChild(act);
    }

    function match(q, qEl, body, qi) {
      var rights = shuffle(q.pairs.map(function (p) { return p[1]; }), qi + 11);
      var rows = q.pairs.map(function (p, i) {
        var row = document.createElement("div");
        row.className = "match-row";
        var opts = '<option value="">Choose…</option>' + rights.map(function (r) { return '<option value="' + esc(r) + '">' + esc(r) + "</option>"; }).join("");
        row.innerHTML = "<div>" + md(p[0], true) + '</div><select aria-label="Match for item ' + (i + 1) + '">' + opts + "</select>";
        body.appendChild(row);
        return row;
      });
      var act = document.createElement("div");
      act.className = "q-actions";
      act.innerHTML = '<button class="btn primary">Check matches</button>';
      act.firstChild.addEventListener("click", function () {
        var ok = true;
        rows.forEach(function (row, i) {
          var sel = row.querySelector("select");
          var good = sel.value === q.pairs[i][1];
          if (!good) ok = false;
          row.classList.add(good ? "correct" : "wrong");
          sel.disabled = true;
        });
        act.firstChild.disabled = true;
        record(ok, qEl, (ok ? "" : " Correct pairs: " + q.pairs.map(function (p) { return p[0] + " → " + p[1]; }).join("; ") + ". ") + (q.explain || ""));
      });
      body.appendChild(act);
    }

    build();
  }

  window.Quiz = { render: render };
})();
