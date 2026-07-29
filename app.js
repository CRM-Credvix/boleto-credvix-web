(() => {
  "use strict";

  const DESIGN_WIDTH = 1448;
  const DESIGN_HEIGHT = 1086;
  const MAX_SCALE = 1.15;

  const shell = document.getElementById("stageShell");
  const stage = document.getElementById("stage");
  const form = document.getElementById("boletoForm");
  const toast = document.getElementById("toast");
  const parcelModal = document.getElementById("parcelModal");
  const infoModal = document.getElementById("infoModal");
  const infoTitle = document.getElementById("infoTitle");
  const infoText = document.getElementById("infoText");
  const specificFields = document.getElementById("specificFields");
  const rangeFields = document.getElementById("rangeFields");
  const modalHint = document.getElementById("modalHint");
  const submitButton = document.getElementById("submitButton");

  const fields = {
    nome: document.getElementById("nome"),
    unidade: document.getElementById("unidade"),
    telefone: document.getElementById("telefone"),
    cpf: document.getElementById("cpf"),
    contrato: document.getElementById("contrato"),
    consentimento: document.getElementById("consentimento"),
    parcelaEspecifica: document.getElementById("parcelaEspecifica"),
    parcelaInicial: document.getElementById("parcelaInicial"),
    parcelaFinal: document.getElementById("parcelaFinal")
  };

  const state = {
    tipoParcela: "primeira",
    parcelaEspecifica: "",
    parcelaInicial: "",
    parcelaFinal: ""
  };

  function fitStage() {
    const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const scale = Math.min(viewportWidth / DESIGN_WIDTH, MAX_SCALE);
    stage.style.transform = `scale(${scale})`;
    shell.style.width = `${DESIGN_WIDTH * scale}px`;
    shell.style.height = `${DESIGN_HEIGHT * scale}px`;
  }

  function digits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function formatCpf(value) {
    const d = digits(value).slice(0, 11);
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function formatPhone(value) {
    const d = digits(value).slice(0, 11);
    if (d.length <= 10) {
      return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
    }
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
  }

  function isValidCpf(value) {
    const cpf = digits(value);
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    const calc = (length) => {
      let sum = 0;
      for (let i = 0; i < length; i += 1) sum += Number(cpf[i]) * (length + 1 - i);
      const mod = (sum * 10) % 11;
      return mod === 10 ? 0 : mod;
    };
    return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
  }

  function showToast(message, type = "error") {
    toast.textContent = message;
    toast.classList.toggle("success", type === "success");
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => { toast.hidden = true; }, 4200);
  }

  function setInvalid(element, invalid) {
    element.classList.toggle("is-invalid", invalid);
  }

  function clearValidation() {
    [fields.nome, fields.unidade, fields.telefone, fields.cpf].forEach((el) => setInvalid(el, false));
    document.querySelector(".consent-hitbox")?.classList.remove("is-invalid");
  }

  function selectedType() {
    return form.querySelector('input[name="tipoParcela"]:checked')?.value || "primeira";
  }

  function updateCards() {
    document.querySelectorAll(".option-card").forEach((card) => {
      card.classList.toggle("is-selected", card.querySelector("input")?.checked === true);
    });
  }

  function openParcelModal(type) {
    state.tipoParcela = type;
    specificFields.hidden = type !== "especifica";
    rangeFields.hidden = type !== "intervalo";
    modalHint.textContent = type === "especifica"
      ? "Informe o número exato da parcela."
      : "Informe o intervalo consecutivo desejado.";
    parcelModal.hidden = false;
    window.setTimeout(() => {
      (type === "especifica" ? fields.parcelaEspecifica : fields.parcelaInicial)?.focus();
    }, 0);
  }

  function closeParcelModal() {
    parcelModal.hidden = true;
  }

  function confirmParcelModal() {
    if (state.tipoParcela === "especifica") {
      const n = Number(fields.parcelaEspecifica.value);
      if (!Number.isInteger(n) || n < 1) {
        showToast("Informe uma parcela válida.");
        fields.parcelaEspecifica.focus();
        return;
      }
      state.parcelaEspecifica = String(n);
    } else if (state.tipoParcela === "intervalo") {
      const first = Number(fields.parcelaInicial.value);
      const last = Number(fields.parcelaFinal.value);
      if (!Number.isInteger(first) || !Number.isInteger(last) || first < 1 || last < first) {
        showToast("Informe um intervalo válido de parcelas.");
        fields.parcelaInicial.focus();
        return;
      }
      state.parcelaInicial = String(first);
      state.parcelaFinal = String(last);
    }
    closeParcelModal();
    showToast("Parcelas configuradas.", "success");
  }

  function validate() {
    clearValidation();
    const errors = [];
    if (fields.nome.value.trim().length < 3) {
      setInvalid(fields.nome, true);
      errors.push("nome completo");
    }
    if (!fields.unidade.value) {
      setInvalid(fields.unidade, true);
      errors.push("unidade");
    }
    if (digits(fields.telefone.value).length < 10) {
      setInvalid(fields.telefone, true);
      errors.push("WhatsApp com DDD");
    }
    if (!isValidCpf(fields.cpf.value)) {
      setInvalid(fields.cpf, true);
      errors.push("CPF válido");
    }
    if (!fields.consentimento.checked) {
      document.querySelector(".consent-hitbox")?.classList.add("is-invalid");
      errors.push("autorização");
    }
    const type = selectedType();
    if (type === "especifica" && !state.parcelaEspecifica) errors.push("número da parcela");
    if (type === "intervalo" && (!state.parcelaInicial || !state.parcelaFinal)) errors.push("intervalo de parcelas");
    if (errors.length) {
      showToast(`Revise: ${errors.join(", ")}.`);
      return false;
    }
    return true;
  }

  function requestId() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const stamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const random = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `BOL-WEB-${stamp}-${random}`;
  }

  async function sendRequest(payload) {
    const config = window.BOLETO_CREDVIX_CONFIG || window.APP_CONFIG || {};
    const url = String(config.APPS_SCRIPT_URL || "").trim();
    const demo = config.ALLOW_DEMO_MODE !== false;
    if (!url) {
      if (demo) return { ok: true, demo: true, id: payload.idSolicitacao };
      throw new Error("Integração ainda não configurada.");
    }
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow"
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { ok: response.ok, message: text }; }
    if (!response.ok || data.ok === false) throw new Error(data.message || "Não foi possível registrar a solicitação.");
    return data;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validate()) return;
    const type = selectedType();
    const payload = {
      idSolicitacao: requestId(),
      origem: "GitHub Pages",
      solicitante: fields.nome.value.trim(),
      unidade: fields.unidade.value,
      telefone: digits(fields.telefone.value),
      cpf: digits(fields.cpf.value),
      contrato: digits(fields.contrato.value),
      tipoSolicitacao: type,
      parcelaEspecifica: type === "especifica" ? state.parcelaEspecifica : "",
      parcelaInicial: type === "intervalo" ? state.parcelaInicial : "",
      parcelaFinal: type === "intervalo" ? state.parcelaFinal : "",
      consentimento: true,
      status: "PENDENTE",
      dataHoraCliente: new Date().toISOString()
    };

    submitButton.disabled = true;
    try {
      const result = await sendRequest(payload);
      showToast(result.demo
        ? `Modo demonstração: solicitação ${payload.idSolicitacao} validada.`
        : `Solicitação ${result.id || payload.idSolicitacao} registrada com sucesso.`, "success");
      if (!result.demo) {
        form.reset();
        state.tipoParcela = "primeira";
        state.parcelaEspecifica = "";
        state.parcelaInicial = "";
        state.parcelaFinal = "";
        form.querySelector('input[value="primeira"]').checked = true;
        updateCards();
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Falha ao registrar a solicitação.");
    } finally {
      submitButton.disabled = false;
    }
  });

  fields.cpf.addEventListener("input", () => { fields.cpf.value = formatCpf(fields.cpf.value); setInvalid(fields.cpf, false); });
  fields.telefone.addEventListener("input", () => { fields.telefone.value = formatPhone(fields.telefone.value); setInvalid(fields.telefone, false); });
  fields.nome.addEventListener("input", () => setInvalid(fields.nome, false));
  fields.unidade.addEventListener("change", () => setInvalid(fields.unidade, false));
  fields.consentimento.addEventListener("change", () => document.querySelector(".consent-hitbox")?.classList.remove("is-invalid"));

  form.querySelectorAll('input[name="tipoParcela"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      updateCards();
      const type = selectedType();
      state.tipoParcela = type;
      if (type !== "primeira") openParcelModal(type);
    });
  });

  document.querySelector("[data-close-modal]")?.addEventListener("click", closeParcelModal);
  document.querySelector("[data-confirm-modal]")?.addEventListener("click", confirmParcelModal);
  parcelModal.addEventListener("click", (event) => { if (event.target === parcelModal) closeParcelModal(); });

  function showInfo(title, text) {
    infoTitle.textContent = title;
    infoText.textContent = text;
    infoModal.hidden = false;
  }
  document.querySelectorAll("[data-close-info]").forEach((button) => button.addEventListener("click", () => { infoModal.hidden = true; }));
  infoModal.addEventListener("click", (event) => { if (event.target === infoModal) infoModal.hidden = true; });

  document.querySelector('[data-action="request"]')?.addEventListener("click", () => fields.nome.focus());
  document.querySelector('[data-action="how"]')?.addEventListener("click", () => showInfo("Como Funciona", "Preencha seus dados, escolha a parcela e confirme. O pedido entra na fila e o boleto é enviado ao WhatsApp informado."));
  document.querySelector('[data-action="help"]')?.addEventListener("click", () => showInfo("Dúvidas", "O contrato é opcional. Para emissão automática da primeira parcela disponível, mantenha a primeira opção selecionada."));
  document.querySelector('[data-action="security"]')?.addEventListener("click", () => showInfo("Segurança", "Os dados são usados somente para registrar a solicitação e processar a emissão do boleto."));

  window.addEventListener("resize", fitStage, { passive: true });
  window.addEventListener("orientationchange", fitStage, { passive: true });
  fitStage();
  updateCards();
})();
