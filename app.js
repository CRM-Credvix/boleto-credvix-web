(() => {
  "use strict";

  const config = window.BOLETO_CREDVIX_CONFIG || {};
  const form = document.querySelector("#request-form");
  const successPanel = document.querySelector("#success-panel");
  const submitButton = document.querySelector("#submit-button");
  const formAlert = document.querySelector("#form-alert");
  const parcelFields = document.querySelector("#parcel-fields");
  const parcelSingle = document.querySelector(".parcel-single");
  const parcelRange = document.querySelector(".parcel-range");
  const accessCodeField = document.querySelector(".access-code-field");
  const unitsSelect = document.querySelector("#unidade");
  let parcelChoiceTouched = false;
  let unitTrigger = null;
  let unitList = null;

  const digitsOnly = (value) => String(value || "").replace(/\D/g, "");

  function normalizeUnitSearch(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLocaleLowerCase("pt-BR");
  }

  function populateUnits() {
    const units = Array.isArray(config.UNIDADES) && config.UNIDADES.length
      ? config.UNIDADES
      : ["Matriz"];

    units.forEach((unit) => {
      if ([...unitsSelect.options].some((option) => option.value === unit)) return;
      const option = document.createElement("option");
      option.value = unit;
      option.textContent = unit;
      unitsSelect.appendChild(option);
    });
  }

  function officialUnitOptions() {
    return [...unitsSelect.options].filter((option) => option.value && option.dataset.manual !== "true");
  }

  function setUnitSelectValue(value, { notify = true } = {}) {
    const typedValue = String(value || "").trim();
    const manualOption = unitsSelect.querySelector('option[data-manual="true"]');
    if (manualOption) manualOption.remove();

    if (!typedValue) {
      unitsSelect.value = "";
    } else {
      const normalizedTyped = normalizeUnitSearch(typedValue);
      const official = officialUnitOptions().find(
        (option) => normalizeUnitSearch(option.value) === normalizedTyped
      );

      if (official) {
        unitsSelect.value = official.value;
      } else {
        const option = document.createElement("option");
        option.value = typedValue;
        option.textContent = typedValue;
        option.dataset.manual = "true";
        unitsSelect.appendChild(option);
        unitsSelect.value = typedValue;
      }
    }

    if (notify) unitsSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function renderUnitOptions(query = "") {
    if (!unitList) return;
    const normalizedQuery = normalizeUnitSearch(query);

    unitList.querySelectorAll(".unit-option").forEach((option) => {
      const matches = !normalizedQuery || normalizeUnitSearch(option.dataset.value).includes(normalizedQuery);
      option.hidden = !matches;
      option.classList.remove("is-active");
      option.setAttribute("aria-selected", String(option.dataset.value === unitsSelect.value));
    });
  }

  function syncUnitCombobox() {
    if (!unitTrigger || !unitList) return;

    unitTrigger.value = unitsSelect.value || "";
    unitTrigger.classList.toggle("has-value", Boolean(unitsSelect.value));
    renderUnitOptions(unitTrigger.value);
  }

  function closeUnitList({ restoreFocus = false } = {}) {
    if (!unitTrigger || !unitList) return;
    unitList.hidden = true;
    unitTrigger.setAttribute("aria-expanded", "false");
    unitList.querySelectorAll(".unit-option").forEach((option) => option.classList.remove("is-active"));
    if (restoreFocus) unitTrigger.focus();
  }

  function openUnitList() {
    if (!unitTrigger || !unitList) return;
    renderUnitOptions(unitTrigger.value);
    unitList.hidden = false;
    unitTrigger.setAttribute("aria-expanded", "true");

    const visibleOptions = [...unitList.querySelectorAll(".unit-option")].filter((option) => !option.hidden);
    const selected = visibleOptions.find((option) => option.getAttribute("aria-selected") === "true");
    const target = selected || visibleOptions[0];
    target?.classList.add("is-active");
    target?.scrollIntoView({ block: "nearest" });
  }

  function chooseUnit(value) {
    setUnitSelectValue(value);
    syncUnitCombobox();
    closeUnitList({ restoreFocus: true });
  }

  function moveUnitFocus(direction) {
    const options = [...unitList.querySelectorAll(".unit-option")].filter((option) => !option.hidden);
    if (!options.length) return;

    const currentIndex = options.findIndex((option) => option.classList.contains("is-active"));
    let nextIndex = currentIndex;

    if (direction === "first") nextIndex = 0;
    else if (direction === "last") nextIndex = options.length - 1;
    else nextIndex = Math.min(options.length - 1, Math.max(0, currentIndex + direction));

    options.forEach((option) => option.classList.remove("is-active"));
    options[nextIndex].classList.add("is-active");
    options[nextIndex].focus({ preventScroll: true });
    options[nextIndex].scrollIntoView({ block: "nearest" });
  }

  function setupUnitCombobox() {
    const field = unitsSelect.closest(".slot-unit");
    if (!field) return;

    unitsSelect.classList.add("unit-native-select");
    unitsSelect.tabIndex = -1;
    unitsSelect.setAttribute("aria-hidden", "true");

    const combobox = document.createElement("div");
    combobox.className = "unit-combobox";
    combobox.innerHTML = `
      <input
        id="unit-trigger"
        class="unit-trigger"
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded="false"
        aria-controls="unit-list"
        aria-label="Unidade"
        autocomplete="off"
        placeholder="Selecione ou digite sua unidade"
      >
      <div id="unit-list" class="unit-list" role="listbox" aria-label="Unidades" hidden></div>
    `;

    unitsSelect.before(combobox);
    unitTrigger = combobox.querySelector("#unit-trigger");
    unitList = combobox.querySelector("#unit-list");

    officialUnitOptions().forEach((option, index) => {
      const item = document.createElement("button");
      item.type = "button";
      item.id = `unit-option-${index}`;
      item.className = "unit-option";
      item.setAttribute("role", "option");
      item.dataset.value = option.value;
      item.textContent = option.textContent;
      item.addEventListener("click", () => chooseUnit(option.value));
      unitList.appendChild(item);
    });

    unitTrigger.addEventListener("focus", openUnitList);
    unitTrigger.addEventListener("click", openUnitList);

    unitTrigger.addEventListener("input", () => {
      const typedValue = unitTrigger.value;
      setUnitSelectValue(typedValue, { notify: false });
      unitTrigger.classList.toggle("has-value", Boolean(typedValue.trim()));
      renderUnitOptions(typedValue);
      if (unitList.hidden) openUnitList();
      if (unitsSelect.getAttribute("aria-invalid") === "true") clearFieldError(unitsSelect);
    });

    unitTrigger.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeUnitList();
        return;
      }

      if (event.key === "Enter") {
        const active = unitList.querySelector(".unit-option.is-active:not([hidden])");
        if (active) {
          event.preventDefault();
          chooseUnit(active.dataset.value);
        } else if (unitTrigger.value.trim()) {
          event.preventDefault();
          setUnitSelectValue(unitTrigger.value);
          syncUnitCombobox();
          closeUnitList();
        }
        return;
      }

      if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
      event.preventDefault();

      const wasHidden = unitList.hidden;
      if (wasHidden) openUnitList();
      if (event.key === "ArrowDown") moveUnitFocus(wasHidden ? "first" : 1);
      if (event.key === "ArrowUp") moveUnitFocus(wasHidden ? "last" : -1);
    });

    unitList.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveUnitFocus(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveUnitFocus(-1);
      } else if (event.key === "Home") {
        event.preventDefault();
        moveUnitFocus("first");
      } else if (event.key === "End") {
        event.preventDefault();
        moveUnitFocus("last");
      } else if (event.key === "Enter" || event.key === " ") {
        const active = document.activeElement.closest?.(".unit-option");
        if (active) {
          event.preventDefault();
          chooseUnit(active.dataset.value);
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeUnitList({ restoreFocus: true });
      }
    });

    document.addEventListener("click", (event) => {
      if (!combobox.contains(event.target)) closeUnitList();
    });

    syncUnitCombobox();
  }

  function setupAccessCode() {
    const enabled = Boolean(config.REQUIRE_ACCESS_CODE);
    accessCodeField.hidden = !enabled;
    document.querySelector("#codigoAcesso").required = enabled;
  }

  function maskCpf(value) {
    const digits = digitsOnly(value).slice(0, 11);
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }

  function maskPhone(value) {
    const digits = digitsOnly(value).slice(0, 11);
    if (digits.length <= 10) {
      return digits
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function isValidCpf(value) {
    const cpf = digitsOnly(value);
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    const digit = (length) => {
      let total = 0;
      let weight = length + 1;
      for (let index = 0; index < length; index += 1) {
        total += Number(cpf[index]) * weight;
        weight -= 1;
      }
      const remainder = (total * 10) % 11;
      return remainder === 10 ? 0 : remainder;
    };

    return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
  }

  function errorElementFor(field) {
    return field.closest(".field")?.querySelector(".field-error") || null;
  }

  function setFieldError(field, message = "") {
    if (!field) return;
    field.setAttribute("aria-invalid", message ? "true" : "false");
    const error = errorElementFor(field);
    if (error) error.textContent = message;
  }

  function clearFieldError(field) {
    setFieldError(field, "");
  }

  function clearErrors() {
    form.querySelectorAll("[aria-invalid]").forEach((field) => field.setAttribute("aria-invalid", "false"));
    form.querySelectorAll(".field-error").forEach((error) => { error.textContent = ""; });
    const consentError = document.querySelector("#consent-error");
    consentError.textContent = "";
    document.querySelector("#consentimento").setAttribute("aria-invalid", "false");
    formAlert.hidden = true;
    formAlert.textContent = "";
  }

  function selectedRequestType() {
    return form.querySelector('input[name="tipoSolicitacao"]:checked')?.value || "primeira_disponivel";
  }

  function updateParcelFields() {
    const type = selectedRequestType();
    const isSingle = type === "parcela_especifica";
    const isRange = type === "intervalo";
    const shouldReveal = parcelChoiceTouched && (isSingle || isRange);

    parcelFields.hidden = !shouldReveal;
    parcelSingle.hidden = !isSingle;
    parcelRange.hidden = !isRange;

    const single = document.querySelector("#parcela");
    const start = document.querySelector("#parcelaInicial");
    const end = document.querySelector("#parcelaFinal");

    single.required = isSingle;
    start.required = isRange;
    end.required = isRange;

    if (!isSingle) {
      single.value = "";
      clearFieldError(single);
    }
    if (!isRange) {
      start.value = "";
      end.value = "";
      clearFieldError(start);
      clearFieldError(end);
    }
  }

  function validateForm() {
    clearErrors();
    let valid = true;

    const name = document.querySelector("#solicitante");
    const unit = document.querySelector("#unidade");
    const phone = document.querySelector("#telefone");
    const cpf = document.querySelector("#cpf");
    const contract = document.querySelector("#contrato");
    const accessCode = document.querySelector("#codigoAcesso");
    const consent = document.querySelector("#consentimento");

    if (name.value.trim().length < 3) {
      setFieldError(name, "Informe o nome completo.");
      valid = false;
    }
    if (!unit.value) {
      setFieldError(unit, "Selecione ou digite a unidade.");
      valid = false;
    }
    if (![10, 11].includes(digitsOnly(phone.value).length)) {
      setFieldError(phone, "Informe um telefone com DDD.");
      valid = false;
    }
    if (!isValidCpf(cpf.value)) {
      setFieldError(cpf, "CPF invalido. Confira os numeros.");
      valid = false;
    }
    if (contract.value && !/^\d{4,20}$/.test(digitsOnly(contract.value))) {
      setFieldError(contract, "Contrato deve conter apenas numeros.");
      valid = false;
    }
    if (config.REQUIRE_ACCESS_CODE && accessCode.value.trim().length < 4) {
      setFieldError(accessCode, "Informe o codigo interno.");
      valid = false;
    }

    const type = selectedRequestType();
    if (type === "parcela_especifica") {
      const parcel = document.querySelector("#parcela");
      if (!parcel.value || Number(parcel.value) < 1) {
        setFieldError(parcel, "Informe a parcela.");
        valid = false;
      }
    }

    if (type === "intervalo") {
      const start = document.querySelector("#parcelaInicial");
      const end = document.querySelector("#parcelaFinal");
      if (!start.value || Number(start.value) < 1) {
        setFieldError(start, "Informe a parcela inicial.");
        valid = false;
      }
      if (!end.value || Number(end.value) < 1) {
        setFieldError(end, "Informe a parcela final.");
        valid = false;
      }
      if (start.value && end.value && Number(start.value) > Number(end.value)) {
        setFieldError(end, "A parcela final deve ser igual ou maior.");
        valid = false;
      }
    }

    if (!consent.checked) {
      consent.setAttribute("aria-invalid", "true");
      document.querySelector("#consent-error").textContent = "Confirme a autorizacao antes de enviar.";
      valid = false;
    }

    return valid;
  }

  function createRequestId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function buildPayload() {
    const type = selectedRequestType();
    let initial = "";
    let final = "";

    if (type === "parcela_especifica") {
      initial = document.querySelector("#parcela").value;
      final = initial;
    } else if (type === "intervalo") {
      initial = document.querySelector("#parcelaInicial").value;
      final = document.querySelector("#parcelaFinal").value;
    }

    return {
      requestId: createRequestId(),
      submittedAt: new Date().toISOString(),
      solicitante: document.querySelector("#solicitante").value.trim(),
      unidade: document.querySelector("#unidade").value,
      telefone: digitsOnly(document.querySelector("#telefone").value),
      cpf: digitsOnly(document.querySelector("#cpf").value),
      contrato: digitsOnly(document.querySelector("#contrato").value),
      tipoSolicitacao: type,
      parcelaInicial: initial ? Number(initial) : "",
      parcelaFinal: final ? Number(final) : "",
      codigoAcesso: config.REQUIRE_ACCESS_CODE ? document.querySelector("#codigoAcesso").value.trim() : "",
      consentimento: true,
      website: document.querySelector("#website").value,
      origem: "GITHUB_PAGES"
    };
  }

  async function postPayload(payload) {
    const endpoint = String(config.APPS_SCRIPT_URL || "").trim();

    if (!endpoint) {
      if (!config.ALLOW_DEMO_MODE) throw new Error("Endpoint do Apps Script nao configurado.");
      await new Promise((resolve) => setTimeout(resolve, 700));
      return { demo: true };
    }

    const options = {
      method: "POST",
      mode: "no-cors",
      cache: "no-store",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    };

    try {
      await fetch(endpoint, options);
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await fetch(endpoint, options);
    }

    return { demo: false };
  }

  function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.classList.toggle("loading", isLoading);
    submitButton.querySelector(".button-label").textContent = isLoading
      ? "ENVIANDO..."
      : "SOLICITAR BOLETO";
  }

  function showSuccess(payload, response) {
    form.hidden = true;
    successPanel.hidden = false;
    const protocol = `WEB-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${payload.requestId.slice(0, 8).toUpperCase()}`;
    document.querySelector("#protocol-value").textContent = response.demo ? `${protocol}-DEMO` : protocol;
    successPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function resetForm() {
    form.reset();
    syncUnitCombobox();
    parcelChoiceTouched = false;
    clearErrors();
    updateParcelFields();
    successPanel.hidden = true;
    form.hidden = false;
    document.querySelector("#solicitante").focus();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    parcelChoiceTouched = true;
    updateParcelFields();

    if (!validateForm()) {
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      const focusTarget = firstInvalid === unitsSelect ? unitTrigger : firstInvalid;
      focusTarget?.focus({ preventScroll: true });
      focusTarget?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const payload = buildPayload();
    setLoading(true);

    try {
      const response = await postPayload(payload);
      showSuccess(payload, response);
    } catch (error) {
      formAlert.textContent = error instanceof Error
        ? error.message
        : "Nao foi possivel enviar a solicitacao. Tente novamente.";
      formAlert.hidden = false;
    } finally {
      setLoading(false);
    }
  });

  document.querySelector("#cpf").addEventListener("input", (event) => {
    event.target.value = maskCpf(event.target.value);
    if (event.target.getAttribute("aria-invalid") === "true") clearFieldError(event.target);
  });

  document.querySelector("#telefone").addEventListener("input", (event) => {
    event.target.value = maskPhone(event.target.value);
    if (event.target.getAttribute("aria-invalid") === "true") clearFieldError(event.target);
  });

  document.querySelector("#contrato").addEventListener("input", (event) => {
    event.target.value = digitsOnly(event.target.value);
    if (event.target.getAttribute("aria-invalid") === "true") clearFieldError(event.target);
  });

  form.querySelectorAll("input, select").forEach((field) => {
    field.addEventListener("change", () => {
      if (field.getAttribute("aria-invalid") === "true") clearFieldError(field);
    });
  });

  form.querySelectorAll('input[name="tipoSolicitacao"]').forEach((radio) => {
    radio.addEventListener("click", () => {
      parcelChoiceTouched = true;
      updateParcelFields();
    });
  });

  document.querySelector("#new-request-button").addEventListener("click", resetForm);

  populateUnits();
  setupUnitCombobox();
  setupAccessCode();
  updateParcelFields();
})();