(() => {
  "use strict";

  const parcelSelect = document.querySelector("#parcel-mode-select");
  const requestForm = document.querySelector("#request-form");
  const emissionLogout = document.querySelector("#emissao-logout");
  const authLogout = document.querySelector("#auth-logout");

  function syncSelectFromRadio() {
    if (!parcelSelect) return;
    const checked = document.querySelector('input[name="tipoSolicitacao"]:checked');
    if (checked && parcelSelect.value !== checked.value) {
      parcelSelect.value = checked.value;
    }
  }

  if (parcelSelect) {
    parcelSelect.addEventListener("change", () => {
      if (!parcelSelect.value) return;
      const radio = document.querySelector(
        `input[name="tipoSolicitacao"][value="${CSS.escape(parcelSelect.value)}"]`,
      );
      radio?.click();
    });

    document.querySelectorAll('input[name="tipoSolicitacao"]').forEach((radio) => {
      radio.addEventListener("change", syncSelectFromRadio);
    });

    requestForm?.addEventListener("reset", () => {
      requestAnimationFrame(() => {
        parcelSelect.value = "";
      });
    });
  }

  if (emissionLogout && authLogout) {
    emissionLogout.textContent = "SAIR";
    emissionLogout.addEventListener("click", () => authLogout.click());
  }
})();
