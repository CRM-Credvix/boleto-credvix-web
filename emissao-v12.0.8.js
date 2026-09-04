(() => {
  "use strict";

  /* A camada complementar altera somente Parcelas. */
  if (!document.querySelector('link[data-emissao-stability-v12="true"]')) {
    const stabilityCss = document.createElement("link");
    stabilityCss.rel = "stylesheet";
    stabilityCss.href = "emissao-v12.0.9.css?v=12.1.6";
    stabilityCss.dataset.emissaoStabilityV12 = "true";
    document.head.appendChild(stabilityCss);
  }

  const desktop = window.matchMedia("(min-width: 801px)");
  const select = document.querySelector("#parcel-mode-select");
  const fieldset = document.querySelector(".parcel-choice");
  const form = document.querySelector("#request-form");
  const parcelFields = document.querySelector("#parcel-fields");
  const parcelSingle = document.querySelector(".parcel-single");
  const parcelRange = document.querySelector(".parcel-range");
  const singleInput = document.querySelector("#parcela");
  const startInput = document.querySelector("#parcelaInicial");
  const endInput = document.querySelector("#parcelaFinal");

  if (!desktop.matches || !select || !fieldset || !form || !parcelFields || !parcelSingle || !parcelRange) return;
  if (fieldset.querySelector(".parcel-combobox-v12")) return;

  select.classList.add("parcel-native-select-v12");
  select.tabIndex = -1;
  select.setAttribute("aria-hidden", "true");

  const combobox = document.createElement("div");
  combobox.className = "parcel-combobox-v12";
  combobox.innerHTML = `
    <button id="parcel-trigger-v12" class="parcel-trigger-v12" type="button"
      role="combobox" aria-haspopup="listbox" aria-expanded="false"
      aria-controls="parcel-list-v12" aria-label="Selecionar parcelas">
      <span class="parcel-trigger-text-v12" aria-hidden="true"></span>
    </button>
    <div id="parcel-list-v12" class="parcel-list-v12" role="listbox"
      aria-label="Opções de parcelas" hidden></div>
  `;
  fieldset.appendChild(combobox);

  const trigger = combobox.querySelector("#parcel-trigger-v12");
  const triggerText = combobox.querySelector(".parcel-trigger-text-v12");
  const list = combobox.querySelector("#parcel-list-v12");

  [...select.options].filter((option) => option.value).forEach((option) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "parcel-list-option-v12";
    item.setAttribute("role", "option");
    item.dataset.value = option.value;
    item.textContent = option.textContent;
    item.addEventListener("mousedown", (event) => event.preventDefault());
    item.addEventListener("click", () => choose(option.value));
    list.appendChild(item);
  });

  function selectedLabel() {
    return select.selectedOptions?.[0]?.textContent?.trim() || "";
  }

  function syncVisualState() {
    const value = select.value || "";
    fieldset.classList.toggle("parcel-mode-specific-v12", value === "parcela_especifica");
    fieldset.classList.toggle("parcel-mode-range-v12", value === "intervalo");
    fieldset.classList.toggle("parcel-mode-selected-v12", Boolean(value));
    trigger.classList.toggle("has-value", Boolean(value));
    triggerText.textContent = value ? selectedLabel() : "";

    list.querySelectorAll(".parcel-list-option-v12").forEach((item) => {
      const selected = item.dataset.value === value;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-selected", String(selected));
    });
  }

  function applyMode(value, { clearInactive = true } = {}) {
    const isSingle = value === "parcela_especifica";
    const isRange = value === "intervalo";
    const active = isSingle || isRange;

    /* Sincroniza o estado usado pelo app sem disparar click/change nos radios.
       Isso evita que a lógica antiga recalcule a camada principal. */
    if (active) {
      const radio = form.querySelector(`input[name="tipoSolicitacao"][value="${CSS.escape(value)}"]`);
      if (radio) radio.checked = true;
    }

    parcelFields.hidden = !active;
    parcelSingle.hidden = !isSingle;
    parcelRange.hidden = !isRange;

    if (singleInput) singleInput.required = isSingle;
    if (startInput) startInput.required = isRange;
    if (endInput) endInput.required = isRange;

    if (clearInactive && !isSingle && singleInput) singleInput.value = "";
    if (clearInactive && !isRange) {
      if (startInput) startInput.value = "";
      if (endInput) endInput.value = "";
    }
  }

  function open() {
    list.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
  }

  function close() {
    list.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  }

  function choose(value) {
    if (!value) return;

    select.value = value;
    applyMode(value);
    syncVisualState();
    close();
    trigger.focus({ preventScroll: true });
  }

  /* Impede que o listener legado do select converta a escolha em radio.click(),
     que era o gatilho de alteração de estado/reflow observado na tela. */
  select.addEventListener("change", (event) => {
    event.stopImmediatePropagation();
    applyMode(select.value || "");
    syncVisualState();
  }, true);

  trigger.addEventListener("click", () => {
    if (list.hidden) open();
    else close();
  });

  trigger.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      open();
      const options = [...list.querySelectorAll(".parcel-list-option-v12")];
      const selectedIndex = options.findIndex((item) => item.classList.contains("is-selected"));
      const nextIndex = event.key === "ArrowUp"
        ? (selectedIndex > 0 ? selectedIndex - 1 : options.length - 1)
        : (selectedIndex >= 0 && selectedIndex < options.length - 1 ? selectedIndex + 1 : 0);
      options[nextIndex]?.focus({ preventScroll: true });
    }
  });

  list.addEventListener("keydown", (event) => {
    const options = [...list.querySelectorAll(".parcel-list-option-v12")];
    const current = options.indexOf(document.activeElement);

    if (event.key === "Escape") {
      event.preventDefault();
      close();
      trigger.focus({ preventScroll: true });
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const next = (current + delta + options.length) % options.length;
      options[next]?.focus({ preventScroll: true });
    }
  });

  document.addEventListener("click", (event) => {
    if (!combobox.contains(event.target)) close();
  });

  form.addEventListener("reset", () => {
    requestAnimationFrame(() => {
      select.value = "";
      applyMode("", { clearInactive: true });
      syncVisualState();
      close();
    });
  });

  applyMode(select.value || "", { clearInactive: false });
  syncVisualState();
})();
