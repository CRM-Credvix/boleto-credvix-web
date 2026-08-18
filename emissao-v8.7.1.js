(() => {
  "use strict";

  const stage = document.querySelector("#inicio.visual-stage");
  const mock = document.querySelector(".desktop-mock");
  const desktopMedia = window.matchMedia("(min-width: 801px)");

  if (!stage || !mock) return;

  const CROP_X = 0.1015;
  const SAMPLE_X = 0.085;
  const CROP_Y = 0.007;
  let leftCanvas = null;
  let rightCanvas = null;

  function removeOldFill() {
    document.querySelectorAll(".emissao-bg-fill").forEach((node) => node.remove());
  }

  function ensureCanvases() {
    if (!leftCanvas) {
      leftCanvas = document.createElement("canvas");
      leftCanvas.className = "emissao-edge-fill emissao-edge-fill-left";
      leftCanvas.setAttribute("aria-hidden", "true");
      leftCanvas.hidden = true;
      document.body.insertBefore(leftCanvas, stage);
    }

    if (!rightCanvas) {
      rightCanvas = document.createElement("canvas");
      rightCanvas.className = "emissao-edge-fill emissao-edge-fill-right";
      rightCanvas.setAttribute("aria-hidden", "true");
      rightCanvas.hidden = true;
      document.body.insertBefore(rightCanvas, stage);
    }
  }

  function hideCanvases() {
    if (leftCanvas) leftCanvas.hidden = true;
    if (rightCanvas) rightCanvas.hidden = true;
  }

  function paintExtension(canvas, side, gap, stageRect) {
    if (!canvas || gap <= 1 || !mock.naturalWidth || !mock.naturalHeight) {
      if (canvas) canvas.hidden = true;
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssWidth = Math.max(1, gap);
    const cssHeight = Math.max(1, stageRect.height);

    canvas.hidden = false;
    canvas.style.top = `${stageRect.top}px`;
    canvas.style.left = side === "left" ? "0px" : `${window.innerWidth - cssWidth}px`;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.width = Math.max(1, Math.round(cssWidth * dpr));
    canvas.height = Math.max(1, Math.round(cssHeight * dpr));

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const sourceW = mock.naturalWidth;
    const sourceH = mock.naturalHeight;
    const cropX = sourceW * CROP_X;
    const sampleW = sourceW * SAMPLE_X;
    const sourceY = sourceH * CROP_Y;
    const sourceHVisible = sourceH * (1 - CROP_Y * 2);
    const sourceX = side === "left"
      ? cropX
      : sourceW - cropX - sampleW;

    /*
     * Espelha somente uma faixa estreita junto a borda util da arte.
     * Assim a lateral parece continuar, sem repetir a janela, a abelha
     * ou o painel inteiro como acontecia na v8.7.0.
     */
    ctx.save();
    ctx.translate(cssWidth, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(
      mock,
      sourceX,
      sourceY,
      sampleW,
      sourceHVisible,
      0,
      0,
      cssWidth,
      cssHeight,
    );
    ctx.restore();

    /* Suaviza apenas a extremidade externa para disfarcar o prolongamento. */
    const gradient = ctx.createLinearGradient(0, 0, cssWidth, 0);
    if (side === "left") {
      gradient.addColorStop(0, "rgba(5,4,2,.32)");
      gradient.addColorStop(.55, "rgba(5,4,2,.08)");
      gradient.addColorStop(1, "rgba(5,4,2,0)");
    } else {
      gradient.addColorStop(0, "rgba(5,4,2,0)");
      gradient.addColorStop(.45, "rgba(5,4,2,.08)");
      gradient.addColorStop(1, "rgba(5,4,2,.32)");
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cssWidth, cssHeight);
  }

  function syncViewport() {
    removeOldFill();
    ensureCanvases();

    if (!desktopMedia.matches || stage.hidden || !mock.complete || !mock.naturalWidth) {
      hideCanvases();
      return;
    }

    const stageRect = stage.getBoundingClientRect();
    const visibleLeft = stageRect.left + stageRect.width * CROP_X;
    const visibleRight = stageRect.right - stageRect.width * CROP_X;
    const leftGap = Math.max(0, visibleLeft);
    const rightGap = Math.max(0, window.innerWidth - visibleRight);

    paintExtension(leftCanvas, "left", leftGap, stageRect);
    paintExtension(rightCanvas, "right", rightGap, stageRect);
  }

  mock.addEventListener("load", () => requestAnimationFrame(syncViewport));
  window.addEventListener("resize", () => requestAnimationFrame(syncViewport), { passive: true });

  const stageObserver = new MutationObserver(() => requestAnimationFrame(syncViewport));
  stageObserver.observe(stage, { attributes: true, attributeFilter: ["hidden", "style"] });

  const mockObserver = new MutationObserver(() => requestAnimationFrame(syncViewport));
  mockObserver.observe(mock, { attributes: true, attributeFilter: ["src", "style"] });

  desktopMedia.addEventListener?.("change", () => requestAnimationFrame(syncViewport));
  requestAnimationFrame(syncViewport);
})();
