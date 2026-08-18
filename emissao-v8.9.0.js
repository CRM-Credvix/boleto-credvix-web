(() => {
  "use strict";

  const parcelSelect = document.querySelector("#parcel-mode-select");
  const emissionLogout = document.querySelector("#emissao-logout");
  const authLogout = document.querySelector("#auth-logout");
  const requestForm = document.querySelector("#request-form");
  const desktopMock = document.querySelector(".desktop-mock");
  const desktopMedia = window.matchMedia("(min-width: 801px)");

  const WIDE_ART_SOURCE = "assets/emissao-portal-wide-v8.9.0.avif?v=2";
  const FALLBACK_ART = "assets/pixel-neon-whatsapp-desktop-colmeia-solar-v8.3.0.webp";
  let artPromise = null;

  function useFallbackArt() {
    if (!desktopMock) return;
    desktopMock.src = FALLBACK_ART;
    desktopMock.dataset.emissaoWide = "fallback";
    desktopMock.style.opacity = "1";
  }

  function installWideArt() {
    if (!desktopMock || !desktopMedia.matches) return Promise.resolve();
    if (desktopMock.dataset.emissaoWide === "ready") return Promise.resolve();
    if (artPromise) return artPromise;

    /*
     * O arquivo publicado em v8.9.0 ficou armazenado como TEXTO base64,
     * e nao como bytes AVIF. Por isso o <img src="...avif"> resultava
     * em tela preta. Nesta correcao lemos esse conteudo textual, removemos
     * espacos/quebras e entregamos ao navegador como data:image/avif.
     */
    artPromise = fetch(WIDE_ART_SOURCE, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`EMISSAO_WIDE_HTTP_${response.status}`);
        return response.text();
      })
      .then((text) => {
        const base64 = text.replace(/\s+/g, "");
        if (!base64 || base64.length < 1000 || !base64.startsWith("AAAA")) {
          throw new Error("EMISSAO_WIDE_BASE64_INVALIDO");
        }

        return new Promise((resolve, reject) => {
          const probe = new Image();

          probe.onload = () => {
            desktopMock.src = probe.src;
            desktopMock.width = 1916;
            desktopMock.height = 821;
            desktopMock.dataset.emissaoWide = "ready";
            desktopMock.style.opacity = "1";
            resolve();
          };

          probe.onerror = () => reject(new Error("EMISSAO_WIDE_DECODE_FAIL"));
          probe.src = `data:image/avif;base64,${base64}`;
        });
      })
      .catch((error) => {
        console.error("Falha ao carregar viewport wide da emissao:", error);
        useFallbackArt();
      })
      .finally(() => {
        artPromise = null;
      });

    return artPromise;
  }

  if (desktopMock) {
    desktopMock.addEventListener("error", () => {
      if (desktopMock.dataset.emissaoWide !== "ready") installWideArt();
    });
  }

  installWideArt();
  desktopMedia.addEventListener?.("change", installWideArt);

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
})();
