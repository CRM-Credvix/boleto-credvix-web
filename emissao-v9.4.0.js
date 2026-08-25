(() => {
  "use strict";

  const parcelSelect = document.querySelector("#parcel-mode-select");
  const emissionLogout = document.querySelector("#emissao-logout");
  const authLogout = document.querySelector("#auth-logout");
  const requestForm = document.querySelector("#request-form");

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
      requestAnimationFrame(() => {
        parcelSelect.value = "";
      });
    });
  }

  if (emissionLogout && authLogout) {
    emissionLogout.addEventListener("click", () => authLogout.click());
  }
})();
