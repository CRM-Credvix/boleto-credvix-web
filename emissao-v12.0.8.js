(() => {
  "use strict";

  /* Aplicado de forma síncrona para impedir que um stylesheet tardio altere a
     geometria do formulário depois que o usuário já começou a interagir. */
  if (!document.querySelector('style[data-emissao-parcel-v12="true"]')) {
    const parcelStyle = document.createElement("style");
    parcelStyle.dataset.emissaoParcelV12 = "true";
    parcelStyle.textContent = `
      @media (min-width: 801px) {
        .parcel-choice { contain: layout style !important; overflow: visible !important; }
        .parcel-combobox-v12, .parcel-trigger-v12 { contain: layout style !important; }
        .parcel-trigger-text-v12 {
          font-size: clamp(10px, 1.949vh, 22px) !important;
          font-size: clamp(10px, 1.949dvh, 22px) !important;
        }
        .parcel-fields {
          position: absolute !important;
          z-index: 320 !important;
          left: 60.25% !important;
          top: 55.65% !important;
          width: 16.10% !important;
          height: auto !important;
          min-width: 0 !important;
          max-width: 16.10% !important;
          min-height: 0 !important;
          margin: 0 !important;
          padding: .58cqw .62cqw .62cqw !important;
          border: 1px solid rgba(181,116,22,.92) !important;
          border-radius: .34cqw !important;
          color: #ead8b7 !important;
          background: rgba(8,9,5,.985) !important;
          box-shadow: 0 .28cqw .75cqw rgba(0,0,0,.46), inset 0 0 0 1px rgba(255,190,68,.035) !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          transform: none !important;
          contain: layout style paint !important;
          pointer-events: auto !important;
        }
        .parcel-fields[hidden] { display: none !important; }
        .parcel-fields::before {
          content: "INFORME A PARCELA" !important;
          display: block !important;
          margin: 0 0 .46cqw !important;
          color: #f2b33b !important;
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: .63cqw !important;
          font-weight: 800 !important;
          line-height: 1 !important;
          letter-spacing: .015em !important;
          white-space: nowrap !important;
        }
        .parcel-fields .parcel-single,
        .parcel-fields .parcel-range,
        .parcel-fields .field {
          position: static !important;
          inset: auto !important;
          width: 100% !important;
          min-width: 0 !important;
          height: auto !important;
          min-height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          border: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          box-sizing: border-box !important;
          transform: none !important;
        }
        .parcel-fields .parcel-single[hidden],
        .parcel-fields .parcel-range[hidden] { display: none !important; }
        .parcel-fields .parcel-range {
          display: grid !important;
          grid-template-columns: minmax(0,1fr) minmax(0,1fr) !important;
          gap: .42cqw !important;
        }
        .parcel-fields .field-label {
          position: static !important;
          display: block !important;
          width: auto !important;
          height: auto !important;
          margin: 0 0 .24cqw !important;
          padding: 0 !important;
          overflow: visible !important;
          clip: auto !important;
          white-space: nowrap !important;
          border: 0 !important;
          color: #d9bd82 !important;
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: .47cqw !important;
          font-weight: 400 !important;
          line-height: 1.1 !important;
        }
        .parcel-fields input {
          position: static !important;
          inset: auto !important;
          display: block !important;
          width: 100% !important;
          min-width: 0 !important;
          height: 1.66cqw !important;
          min-height: 0 !important;
          margin: 0 !important;
          padding: 0 .46cqw !important;
          border: 1px solid rgba(181,116,22,.86) !important;
          border-radius: .23cqw !important;
          outline: 0 !important;
          appearance: textfield !important;
          -moz-appearance: textfield !important;
          color: #ead8b7 !important;
          caret-color: #ffc14a !important;
          background: #080904 !important;
          box-shadow: none !important;
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: .70cqw !important;
          font-weight: 400 !important;
          line-height: 1 !important;
          box-sizing: border-box !important;
          transform: none !important;
          pointer-events: auto !important;
        }
        .parcel-fields input::-webkit-inner-spin-button,
        .parcel-fields input::-webkit-outer-spin-button { margin: 0 !important; -webkit-appearance: none !important; }
        .parcel-fields input::placeholder { color: rgba(234,216,183,.70) !important; opacity: 1 !important; }
        .parcel-fields input:focus {
          border-color: rgba(232,158,38,.98) !important;
          background: #090a05 !important;
          box-shadow: inset 0 0 0 1px rgba(255,190,68,.06) !important;
          outline: 0 !important;
        }
        .parcel-fields .field-error {
          position: static !important;
          display: block !important;
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          margin: .20cqw 0 0 !important;
          padding: 0 !important;
          border: 0 !important;
          color: #e7bf72 !important;
          background: transparent !important;
          box-shadow: none !important;
          font-size: .43cqw !important;
          font-weight: 600 !important;
          line-height: 1.15 !important;
          white-space: normal !important;
          overflow-wrap: anywhere !important;
          transform: none !important;
        }
        .parcel-fields .field-error:empty { display: none !important; }
      }
    `;
    document.head.appendChild(parcelStyle);
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
