(() => {
  "use strict";

  const mock = document.querySelector(".desktop-mock");
  const desktopMedia = window.matchMedia("(min-width: 801px)");
  const parts = [
    "part-00.bin",
    "part-01.bin",
    "part-02.bin",
    "part-03.bin",
    "part-04.bin",
    "part-05-14.bin",
  ];

  if (!mock) return;

  let loadPromise = null;
  let objectUrl = null;

  function reveal() {
    mock.style.opacity = "1";
  }

  async function loadViewportArt() {
    if (!desktopMedia.matches || mock.dataset.emissaoViewport880 === "ready") return;
    if (loadPromise) return loadPromise;

    mock.style.opacity = "0";

    loadPromise = Promise.all(
      parts.map((file) =>
        fetch(`assets/emissao-v8.8.0/${file}?v=1`, { cache: "force-cache" }).then((response) => {
          if (!response.ok) throw new Error(`EMISSAO_VIEWPORT_${file}`);
          return response.arrayBuffer();
        }),
      ),
    )
      .then((buffers) => {
        const blob = new Blob(buffers, { type: "image/webp" });
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = URL.createObjectURL(blob);

        mock.onload = () => {
          mock.dataset.emissaoViewport880 = "ready";
          reveal();
        };
        mock.onerror = () => {
          mock.onerror = null;
          reveal();
        };
        mock.src = objectUrl;

        if (mock.complete) reveal();
      })
      .catch((error) => {
        console.error("Falha ao carregar viewport v8.8.0", error);
        reveal();
      });

    return loadPromise;
  }

  loadViewportArt();
  desktopMedia.addEventListener?.("change", loadViewportArt);
})();
