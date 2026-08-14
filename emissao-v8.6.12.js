(() => {
  "use strict";

  function closeUnitListAfterSelection() {
    const list = document.querySelector("#unit-list");
    const trigger = document.querySelector("#unit-trigger");
    if (!list || !trigger) return;

    list.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    list.querySelectorAll(".unit-option").forEach((option) => option.classList.remove("is-active"));

    const active = document.activeElement;
    if (active?.classList?.contains("unit-option")) active.blur();
  }

  function bindUnitAutoClose() {
    const list = document.querySelector("#unit-list");
    if (!list) return false;
    if (list.dataset.closeOnSelectV8612 === "1") return true;

    list.dataset.closeOnSelectV8612 = "1";
    list.addEventListener("click", (event) => {
      const option = event.target.closest?.(".unit-option");
      if (!option) return;

      requestAnimationFrame(() => {
        closeUnitListAfterSelection();
      });
    });

    return true;
  }

  function start() {
    if (bindUnitAutoClose()) return;

    const observer = new MutationObserver(() => {
      if (!bindUnitAutoClose()) return;
      observer.disconnect();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
