(() => {
  "use strict";

  const parcelSelect = document.querySelector("#parcel-mode-select");
  const emissionLogout = document.querySelector("#emissao-logout");
  const authLogout = document.querySelector("#auth-logout");
  const requestForm = document.querySelector("#request-form");
  const desktopMock = document.querySelector(".desktop-mock");

  const viewportPartUrls = Array.from(
    { length: 7 },
    (_, index) => `assets/viewport-v9.4.0/part-${String(index).padStart(2, "0")}.b64?v=2`,
  );

  let viewportFallbackStarted = false;
  let viewportObjectUrl = "";

  function decodeViewportBase64(encoded) {
    let normalized = encoded.replace(/\s+/g, "");

    if (normalized.endsWith("??")) {
      normalized = normalized.slice(0, -2);
    }

    normalized = normalized.replace(/=+$/g, "");
    normalized += "=".repeat((4 - (normalized.length % 4)) % 4);

    const binary = window.atob(normalized);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
  }

  async function loadViewportFallback() {
    if (!desktopMock || viewportFallbackStarted) return;
    viewportFallbackStarted = true;

    try {
      const responses = await Promise.all(
        viewportPartUrls.map((url) => fetch(url, { cache: "no-store" })),
      );

      const failedResponse = responses.find((response) => !response.ok);
      if (failedResponse) {
        throw new Error(`viewport_part_http_${failedResponse.status}`);
      }

      const encodedParts = await Promise.all(responses.map((response) => response.text()));
      const bytes = decodeViewportBase64(encodedParts.join(""));
      const blob = new Blob([bytes], { type: "image/avif" });

      viewportObjectUrl = URL.createObjectURL(blob);
      desktopMock.src = viewportObjectUrl;
      desktopMock.dataset.viewportSource = "versioned-parts";
    } catch (error) {
      console.error("Falha ao reconstruir a viewport v9.5.0.", error);
      desktopMock.src = "assets/pixel-neon-whatsapp-desktop-colmeia-solar-v8.3.0.webp?v=8.3.0";
      desktopMock.dataset.viewportSource = "safe-webp-fallback";
    }
  }

  if (desktopMock) {
    desktopMock.addEventListener("error", loadViewportFallback, { once: true });

    if (desktopMock.complete && desktopMock.naturalWidth === 0) {
      loadViewportFallback();
    }

    window.addEventListener("pagehide", () => {
      if (viewportObjectUrl) URL.revokeObjectURL(viewportObjectUrl);
    }, { once: true });
  }

  if (parcelSelect) {
    parcelSelect.addEventListener("change", () => {
      const value = parcelSelect.value;
      if (!value) return;
      document.querySelector(`input[name="tipoSolicitacao"][value="${value}"]`)?.click();
    });

    document.querySelectorAll('input[name="tipoSolicitacao"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        if (radio.checked && parcelSelect.value !== radio.value) {
          parcelSelect.value = radio.value;
        }
      });
    });

    requestForm?.addEventListener("reset", () => {
      requestAnimationFrame(() => { parcelSelect.value = ""; });
    });
  }

  if (emissionLogout && authLogout) {
    emissionLogout.addEventListener("click", () => authLogout.click());
  }
})();
