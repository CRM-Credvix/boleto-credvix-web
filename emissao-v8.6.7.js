(() => {
  "use strict";

  const parcelSelect = document.querySelector("#parcel-mode-select");
  const emissionLogout = document.querySelector("#emissao-logout");
  const authLogout = document.querySelector("#auth-logout");
  const requestForm = document.querySelector("#request-form");
  const desktopMock = document.querySelector(".desktop-mock");
  const desktopMedia = window.matchMedia("(min-width: 801px)");
  const oldDesktopArt = "assets/pixel-neon-whatsapp-desktop-colmeia-solar-v8.3.0.webp";
  let artPromise = null;

  function showDesktopArt() {
    if (!desktopMock) return;
    desktopMock.style.opacity = "1";
  }

  function useFallbackArt() {
    if (!desktopMock) return;
    desktopMock.onerror = null;
    desktopMock.onload = showDesktopArt;
    desktopMock.src = oldDesktopArt;
    if (desktopMock.complete) showDesktopArt();
  }

  async function ensureEmissionArt() {
    if (!desktopMock || !desktopMedia.matches || desktopMock.dataset.emissaoArt === "ready") return;
    if (artPromise) return artPromise;

    desktopMock.style.opacity = "0";

    artPromise = Promise.all(
      Array.from({ length: 9 }, (_, index) => {
        const part = String(index).padStart(2, "0");
        return fetch(`assets/emissao-v8.6.7/part-${part}.b64?v=1`, { cache: "force-cache" })
          .then((response) => {
            if (!response.ok) throw new Error(`EMISSAO_ART_PART_${part}`);
            return response.text();
          });
      }),
    )
      .then((parts) => {
        desktopMock.onerror = useFallbackArt;
        desktopMock.onload = () => {
          desktopMock.dataset.emissaoArt = "ready";
          desktopMock.onerror = null;
          showDesktopArt();
        };
        desktopMock.src = `data:image/avif;base64,${parts.join("")}`;
      })
      .catch(() => {
        useFallbackArt();
      });

    return artPromise;
  }

  if (parcelSelect) {
    parcelSelect.addEventListener("change", () => {
      const value = parcelSelect.value;
      if (!value) return;

      const radio = document.querySelector(
        `input[name="tipoSolicitacao"][value="${value}"]`,
      );
      radio?.click();
    });

    document.querySelectorAll('input[name="tipoSolicitacao"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        if (radio.checked && parcelSelect.value !== radio.value) {
          parcelSelect.value = radio.value;
        }
      });
    });

    requestForm?.addEventListener("reset", () => {
      requestAnimationFrame(() => {
        parcelSelect.value = "";
      });
    });
  }

  if (emissionLogout && authLogout) {
    emissionLogout.addEventListener("click", () => authLogout.click());
  }

  ensureEmissionArt();
  desktopMedia.addEventListener?.("change", ensureEmissionArt);
})();
