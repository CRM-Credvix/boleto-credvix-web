(() => {
  "use strict";

  const stage = document.querySelector("#inicio.visual-stage");
  const mock = document.querySelector(".desktop-mock");
  const desktopMedia = window.matchMedia("(min-width: 801px)");

  if (!stage || !mock) return;

  let fill = document.querySelector(".emissao-bg-fill");

  function ensureFill() {
    if (fill) return fill;

    fill = document.createElement("img");
    fill.className = "emissao-bg-fill";
    fill.alt = "";
    fill.setAttribute("aria-hidden", "true");
    fill.decoding = "async";
    fill.hidden = true;

    document.body.insertBefore(fill, stage);
    return fill;
  }

  function syncFill() {
    const background = ensureFill();
    const shouldShow = desktopMedia.matches && !stage.hidden && Boolean(mock.src);

    if (!shouldShow) {
      background.hidden = true;
      return;
    }

    const source = mock.currentSrc || mock.src;
    if (source && background.src !== source) {
      background.src = source;
    }

    background.hidden = false;
  }

  mock.addEventListener("load", syncFill);

  const mockObserver = new MutationObserver(syncFill);
  mockObserver.observe(mock, {
    attributes: true,
    attributeFilter: ["src", "style"],
  });

  const stageObserver = new MutationObserver(syncFill);
  stageObserver.observe(stage, {
    attributes: true,
    attributeFilter: ["hidden"],
  });

  desktopMedia.addEventListener?.("change", syncFill);
  syncFill();
})();
