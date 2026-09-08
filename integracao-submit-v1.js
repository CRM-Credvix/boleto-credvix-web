(() => {
  "use strict";

  const form = document.querySelector("#request-form");
  const submitButton = document.querySelector("#submit-button");
  const formAlert = document.querySelector("#form-alert");
  const successPanel = document.querySelector("#success-panel");
  const unitsSelect = document.querySelector("#unidade");

  if (!form || !submitButton || !formAlert || !successPanel || !unitsSelect) return;

  const digitsOnly = (value) => String(value || "").replace(/\D/g, "");

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

  function setError(field, message = "") {
    if (!field) return;
    field.setAttribute("aria-invalid", message ? "true" : "false");
    const error = field.closest(".field")?.querySelector(".field-error");
    if (error) error.textContent = message;
  }

  function clearErrors() {
    form.querySelectorAll("[aria-invalid]").forEach((field) => field.setAttribute("aria-invalid", "false"));
    form.querySelectorAll(".field-error").forEach((error) => { error.textContent = ""; });
    const consentError = document.querySelector("#consent-error");
    if (consentError) consentError.textContent = "";
    formAlert.hidden = true;
    formAlert.textContent = "";
  }

  function selectedRequestType() {
    return form.querySelector('input[name="tipoSolicitacao"]:checked')?.value || "";
  }

  function validateForm() {
    clearErrors();
    let valid = true;

    const name = document.querySelector("#solicitante");
    const phone = document.querySelector("#telefone");
    const cpf = document.querySelector("#cpf");
    const contract = document.querySelector("#contrato");
    const consent = document.querySelector("#consentimento");
    const type = selectedRequestType();
    const phoneDigits = digitsOnly(phone?.value);
    const cpfDigits = digitsOnly(cpf?.value);

    if (!name || name.value.trim().length < 3) {
      setError(name, "Informe o nome completo.");
      valid = false;
    }
    if (!unitsSelect.value) {
      setError(unitsSelect, "Selecione ou digite a unidade.");
      valid = false;
    }
    if (!phone || ![10, 11].includes(phoneDigits.length)) {
      setError(phone, "Informe um telefone com DDD.");
      valid = false;
    } else if (phoneDigits === cpfDigits) {
      setError(phone, "O telefone não pode ser igual ao CPF. Confira o preenchimento automático.");
      valid = false;
    }
    if (!cpf || !isValidCpf(cpf.value)) {
      setError(cpf, "CPF inválido. Confira os números.");
      valid = false;
    }
    if (contract?.value && !/^\d{4,20}$/.test(digitsOnly(contract.value))) {
      setError(contract, "Contrato deve conter apenas números.");
      valid = false;
    }

    if (type === "parcela_especifica") {
      const parcel = document.querySelector("#parcela");
      if (!parcel?.value || Number(parcel.value) < 1 || Number(parcel.value) > 999) {
        setError(parcel, "Informe a parcela.");
        valid = false;
      }
    } else if (type === "intervalo") {
      const start = document.querySelector("#parcelaInicial");
      const end = document.querySelector("#parcelaFinal");
      if (!start?.value || Number(start.value) < 1 || Number(start.value) > 999) {
        setError(start, "Informe a parcela inicial.");
        valid = false;
      }
      if (!end?.value || Number(end.value) < 1 || Number(end.value) > 999) {
        setError(end, "Informe a parcela final.");
        valid = false;
      }
      if (start?.value && end?.value && Number(start.value) > Number(end.value)) {
        setError(end, "A parcela final deve ser igual ou maior.");
        valid = false;
      }
    } else {
      formAlert.textContent = "Selecione o tipo de parcela.";
      formAlert.hidden = false;
      valid = false;
    }

    if (!consent?.checked) {
      consent?.setAttribute("aria-invalid", "true");
      const consentError = document.querySelector("#consent-error");
      if (consentError) consentError.textContent = "Confirme a autorização antes de enviar.";
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
      initial = document.querySelector("#parcela")?.value || "";
      final = initial;
    } else if (type === "intervalo") {
      initial = document.querySelector("#parcelaInicial")?.value || "";
      final = document.querySelector("#parcelaFinal")?.value || "";
    }

    return {
      requestId: createRequestId(),
      submittedAt: new Date().toISOString(),
      solicitante: document.querySelector("#solicitante")?.value.trim() || "",
      unidade: unitsSelect.value,
      telefone: digitsOnly(document.querySelector("#telefone")?.value),
      cpf: digitsOnly(document.querySelector("#cpf")?.value),
      contrato: digitsOnly(document.querySelector("#contrato")?.value),
      tipoSolicitacao: type,
      parcelaInicial: initial ? Number(initial) : "",
      parcelaFinal: final ? Number(final) : "",
      consentimento: true,
      website: document.querySelector("#website")?.value || "",
      origem: "GITHUB_PAGES"
    };
  }

  function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.classList.toggle("loading", isLoading);
    const label = submitButton.querySelector(".button-label");
    if (label) label.textContent = isLoading ? "ENVIANDO..." : "SOLICITAR BOLETO";
  }

  function showSuccess(payload, response) {
    form.hidden = true;
    successPanel.hidden = false;
    const protocol = `WEB-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${payload.requestId.slice(0, 8).toUpperCase()}`;
    const protocolValue = document.querySelector("#protocol-value");
    if (protocolValue) protocolValue.textContent = response?.queueId || protocol;
    successPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function submitAuthenticated(payload) {
    const auth = window.BOLETO_CREDVIX_AUTH;
    if (!auth?.client) throw new Error("Sua sessão não está disponível. Entre novamente.");

    const { data: sessionData, error: sessionError } = await auth.client.auth.getSession();
    if (sessionError || !sessionData?.session) throw new Error("Sua sessão expirou. Entre novamente.");

    const { data, error } = await auth.client.functions.invoke("submit-boleto", {
      body: payload,
    });

    if (error) throw new Error("Não foi possível registrar a solicitação agora. Tente novamente.");
    if (!data?.ok) throw new Error("A solicitação não foi confirmada pelo servidor.");
    if (data.status !== "ENVIADO_FILA") {
      throw new Error("A solicitação foi registrada, mas ainda não entrou na fila do robô.");
    }
    return data;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (!validateForm()) {
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      const unitTrigger = document.querySelector("#unit-trigger");
      const focusTarget = firstInvalid === unitsSelect ? unitTrigger : firstInvalid;
      focusTarget?.focus({ preventScroll: true });
      focusTarget?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const payload = buildPayload();
    setLoading(true);

    try {
      const response = await submitAuthenticated(payload);
      showSuccess(payload, response);
    } catch (error) {
      formAlert.textContent = error instanceof Error
        ? error.message
        : "Não foi possível enviar a solicitação. Tente novamente.";
      formAlert.hidden = false;
    } finally {
      setLoading(false);
    }
  }, true);
})();
