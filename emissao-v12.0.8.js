(() => {
  "use strict";

  /* A camada de estabilidade é carregada por último para que a geometria dos
     campos já aprovada não seja recalculada quando o estado de Parcelas muda. */
  if (!document.querySelector('link[data-emissao-stability-v12="true"]')) {
    const stabilityCss = document.createElement("link");
    stabilityCss.rel = "stylesheet";
    stabilityCss.href = "emissao-v12.0.9.css?v=12.1.5";
    stabilityCss.dataset.emissaoStabilityV12 = "true";
    document.head.appendChild(stabilityCss);
  }

  const desktop = window.matchMedia("(min-width: 801px)");
  const select = document.querySelector("#parcel-mode-select");
  const fieldset = document.querySelector(".parcel-choice");
  const form = document.querySelector("#request-form");

  if (!desktop.matches || !select || !fieldset || !form) return;
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
    /* Evita que o botão da lista roube o foco e provoque scroll/recalculo da
       camada antes do click. O click continua sendo disparado normalmente. */
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

    const scrollXBefore = window.scrollX;
    const scrollYBefore = window.scrollY;

    select.value = value;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
    syncVisualState();
    close();

    /* Mantém o foco no mesmo trilho sem permitir que o navegador reposicione
       a página ao esconder a opção que acabou de ser clicada. */
    trigger.focus({ preventScroll: true });
    requestAnimationFrame(() => {
      if (window.scrollX !== scrollXBefore || window.scrollY !== scrollYBefore) {
        window.scrollTo(scrollXBefore, scrollYBefore);
      }
    });
  }

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

  select.addEventListener("change", syncVisualState);
  form.addEventListener("reset", () => {
    requestAnimationFrame(() => {
      syncVisualState();
      close();
    });
  });

  syncVisualState();
})();
