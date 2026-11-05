/* Step-through diagrams: each step lights up the SVG groups named in `on` (data-step="...") and shows a caption. */
(function () {
  "use strict";
  function init(fig, steps) {
    if (!fig) return;
    var i = -1;
    var caption = fig.querySelector(".step-caption");
    var prev = fig.querySelector('[data-act="prev"]');
    var next = fig.querySelector('[data-act="next"]');
    var intro = caption.innerHTML;

    function show() {
      fig.querySelectorAll("[data-step]").forEach(function (el) { el.classList.remove("on"); });
      if (i < 0) {
        fig.classList.remove("running");
        caption.innerHTML = intro;
        next.textContent = "Start"; prev.disabled = true;
        return;
      }
      fig.classList.add("running");
      var s = steps[i];
      (s.on || []).forEach(function (id) {
        fig.querySelectorAll('[data-step="' + id + '"]').forEach(function (el) { el.classList.add("on"); });
      });
      caption.innerHTML = "<b>" + (i + 1) + "/" + steps.length + "</b>" + window.Render.md(s.text, true);
      prev.disabled = false;
      next.textContent = i === steps.length - 1 ? "Start over" : "Next step";
    }
    next.addEventListener("click", function () { i = i === steps.length - 1 ? -1 : i + 1; show(); });
    prev.addEventListener("click", function () { i = Math.max(-1, i - 1); show(); });
    show();
  }
  window.Stepper = { init: init };
})();
