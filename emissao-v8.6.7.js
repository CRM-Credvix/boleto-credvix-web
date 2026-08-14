(() => {
  "use strict";

  const parcelSelect = document.querySelector("#parcel-mode-select");
  const emissionLogout = document.querySelector("#emissao-logout");
  const authLogout = document.querySelector("#auth-logout");

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
  }

  if (emissionLogout && authLogout) {
    emissionLogout.addEventListener("click", () => authLogout.click());
  }
})();
