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

  const digitsOnly = (value) => String(value || "").replace(/\D/g, "");

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
      setFieldError(unit, "Selecione a unidade.");
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
      firstInvalid?.focus({ preventScroll: true });
      firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
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
  setupAccessCode();
  updateParcelFields();
})();
