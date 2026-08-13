(() => {
  "use strict";

  const config = window.BOLETO_CREDVIX_CONFIG || {};
  const authGate = document.querySelector("#auth-gate");
  const authCard = document.querySelector(".auth-card");
  const authForm = document.querySelector("#auth-form");
  const emailInput = document.querySelector("#auth-email");
  const passwordInput = document.querySelector("#auth-password");
  const passwordToggle = document.querySelector("#auth-password-toggle");
  const authAlert = document.querySelector("#auth-alert");
  const authSubmit = document.querySelector("#auth-submit");
  const appStage = document.querySelector("#inicio");
  const logoutButton = document.querySelector("#auth-logout");
  const sessionBadge = document.querySelector("#auth-session-badge");

  if (!authGate || !authCard || !authForm || !emailInput || !passwordInput || !passwordToggle || !authAlert || !authSubmit || !appStage || !logoutButton || !sessionBadge) return;

  const previewRequested = new URLSearchParams(window.location.search).get("auth-preview") === "1";
  const recoveryHash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const recoveryQuery = new URLSearchParams(window.location.search);
  const recoveryRequested = recoveryHash.get("type") === "recovery" || recoveryQuery.get("type") === "recovery";
  const authEnabled = config.AUTH_REQUIRED === true || previewRequested || recoveryRequested;

  if (!authEnabled) {
    authGate.hidden = true;
    appStage.hidden = false;
    logoutButton.hidden = true;
    sessionBadge.hidden = true;
    return;
  }

  function setPasswordVisibility(isVisible) {
    passwordInput.type = isVisible ? "text" : "password";
    passwordToggle.setAttribute("aria-label", isVisible ? "Ocultar senha" : "Mostrar senha");
    passwordToggle.setAttribute("aria-pressed", isVisible ? "true" : "false");
  }

  if (!config.SUPABASE_URL || !config.SUPABASE_PUBLISHABLE_KEY || !window.supabase?.createClient) {
    appStage.hidden = true;
    authGate.hidden = false;
    authAlert.textContent = !config.SUPABASE_URL || !config.SUPABASE_PUBLISHABLE_KEY
      ? "Autenticação indisponível. Configuração do Supabase ausente."
      : "Não foi possível carregar o serviço de autenticação.";
    authSubmit.disabled = true;
    passwordToggle.disabled = true;
    return;
  }

  const supabaseClient = window.supabase.createClient(
    config.SUPABASE_URL,
    config.SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );

  const functionName = config.AUTH_FUNCTION_NAME || "authorize-user";
  const recoveryRedirectUrl = `${window.location.origin}${window.location.pathname}`;
  let currentProfile = null;
  let recoveryMode = recoveryRequested;
  let recoveryPanel = null;
  let recoveryPassword = null;
  let recoveryConfirm = null;
  let recoveryAlert = null;
  let recoverySubmit = null;
  let forgotButton = null;
  let forgotCoolingDown = false;
  let loginLoading = false;

  function syncForgotState() {
    if (!forgotButton) return;
    forgotButton.disabled = loginLoading || forgotCoolingDown;
  }

  function setLoading(isLoading) {
    loginLoading = isLoading;
    authSubmit.disabled = isLoading;
    authSubmit.textContent = isLoading ? "VALIDANDO..." : "ENTRAR";
    emailInput.disabled = isLoading;
    passwordInput.disabled = isLoading;
    passwordToggle.disabled = isLoading;
    syncForgotState();
  }

  function startForgotCooldown() {
    forgotCoolingDown = true;
    if (forgotButton) forgotButton.textContent = "E-MAIL ENVIADO";
    syncForgotState();

    window.setTimeout(() => {
      forgotCoolingDown = false;
      if (forgotButton) forgotButton.textContent = "ESQUECI MINHA SENHA";
      syncForgotState();
    }, 60000);
  }

  function ensureForgotButton() {
    if (forgotButton) return;

    forgotButton = document.createElement("button");
    forgotButton.id = "auth-forgot-password";
    forgotButton.type = "button";
    forgotButton.textContent = "ESQUECI MINHA SENHA";
    forgotButton.setAttribute("aria-label", "Recuperar senha por e-mail");
    forgotButton.setAttribute(
      "style",
      "position:absolute;z-index:4;left:51.35%;top:46.05%;width:8.75%;height:2.8%;box-sizing:border-box;margin:0;padding:0;border:0;appearance:none;background:transparent;color:#d8a44e;cursor:pointer;pointer-events:auto;text-align:right;font-family:'Courier New','Lucida Console',monospace;font-size:.58cqw;font-weight:700;line-height:1;text-decoration:underline;text-underline-offset:.12cqw;"
    );

    forgotButton.addEventListener("mouseenter", () => {
      if (!forgotButton.disabled) forgotButton.style.color = "#ffc14a";
    });
    forgotButton.addEventListener("mouseleave", () => {
      forgotButton.style.color = forgotButton.disabled ? "#8b744e" : "#d8a44e";
    });
    forgotButton.addEventListener("focus", () => {
      if (!forgotButton.disabled) forgotButton.style.color = "#ffc14a";
    });
    forgotButton.addEventListener("blur", () => {
      forgotButton.style.color = forgotButton.disabled ? "#8b744e" : "#d8a44e";
    });

    forgotButton.addEventListener("click", async () => {
      if (forgotButton.disabled) return;

      authAlert.textContent = "";
      const email = emailInput.value.trim().toLowerCase();

      if (!email) {
        authAlert.textContent = "Informe seu e-mail para recuperar a senha.";
        emailInput.focus({ preventScroll: true });
        return;
      }

      emailInput.value = email;
      if (!emailInput.checkValidity()) {
        authAlert.textContent = "Informe um e-mail válido.";
        emailInput.focus({ preventScroll: true });
        return;
      }

      forgotCoolingDown = true;
      forgotButton.textContent = "ENVIANDO...";
      syncForgotState();

      try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
          redirectTo: recoveryRedirectUrl,
        });

        if (error) {
          if (error.code === "over_email_send_rate_limit" || /rate limit/i.test(error.message || "")) {
            authAlert.textContent = "Muitas solicitações de recuperação. Aguarde alguns minutos e tente novamente.";
            startForgotCooldown();
            return;
          }
          throw error;
        }

        authAlert.textContent = "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.";
        startForgotCooldown();
      } catch (_error) {
        forgotCoolingDown = false;
        forgotButton.textContent = "ESQUECI MINHA SENHA";
        syncForgotState();
        authAlert.textContent = "Não foi possível solicitar a recuperação agora. Tente novamente.";
      }
    });

    authForm.appendChild(forgotButton);
    syncForgotState();
  }

  function showLogin(message = "") {
    currentProfile = null;
    authForm.hidden = false;
    if (recoveryPanel) recoveryPanel.hidden = true;
    appStage.hidden = true;
    authGate.hidden = false;
    logoutButton.hidden = true;
    sessionBadge.hidden = true;
    sessionBadge.textContent = "";
    authAlert.textContent = message;
    passwordInput.value = "";
    setPasswordVisibility(false);
    setLoading(false);
    ensureForgotButton();
    emailInput.focus({ preventScroll: true });
  }

  function showApp(profile) {
    currentProfile = profile;
    recoveryMode = false;
    authForm.hidden = false;
    if (recoveryPanel) recoveryPanel.hidden = true;
    authAlert.textContent = "";
    authGate.hidden = true;
    appStage.hidden = false;
    logoutButton.hidden = false;
    sessionBadge.hidden = false;
    sessionBadge.textContent = `${profile.email} · ${profile.perfil}`;
  }

  function ensureRecoveryPanel() {
    if (recoveryPanel) return;

    recoveryPanel = document.createElement("form");
    recoveryPanel.id = "auth-recovery-form";
    recoveryPanel.className = "auth-recovery-form";
    recoveryPanel.noValidate = true;
    recoveryPanel.hidden = true;
    recoveryPanel.innerHTML = `
      <h1 class="auth-recovery-title">NOVA SENHA</h1>
      <p class="auth-recovery-copy">Defina uma nova senha para sua conta.</p>
      <label class="auth-recovery-field">
        <span>Nova senha</span>
        <input id="auth-recovery-password" type="password" autocomplete="new-password" minlength="8" maxlength="200" placeholder="Nova senha" required>
      </label>
      <label class="auth-recovery-field">
        <span>Confirmar nova senha</span>
        <input id="auth-recovery-confirm" type="password" autocomplete="new-password" minlength="8" maxlength="200" placeholder="Confirmar nova senha" required>
      </label>
      <p id="auth-recovery-alert" class="auth-recovery-alert" role="alert" aria-live="polite"></p>
      <button id="auth-recovery-submit" class="auth-recovery-submit" type="submit">ALTERAR SENHA</button>
    `;
    authCard.appendChild(recoveryPanel);

    recoveryPassword = recoveryPanel.querySelector("#auth-recovery-password");
    recoveryConfirm = recoveryPanel.querySelector("#auth-recovery-confirm");
    recoveryAlert = recoveryPanel.querySelector("#auth-recovery-alert");
    recoverySubmit = recoveryPanel.querySelector("#auth-recovery-submit");

    recoveryPanel.addEventListener("submit", async (event) => {
      event.preventDefault();
      recoveryAlert.textContent = "";

      const password = recoveryPassword.value;
      const confirmPassword = recoveryConfirm.value;

      if (password.length < 8) {
        recoveryAlert.textContent = "A nova senha deve ter pelo menos 8 caracteres.";
        return;
      }
      if (password !== confirmPassword) {
        recoveryAlert.textContent = "As senhas não coincidem.";
        return;
      }

      recoverySubmit.disabled = true;
      recoverySubmit.textContent = "ALTERANDO...";
      recoveryPassword.disabled = true;
      recoveryConfirm.disabled = true;

      try {
        const { error } = await supabaseClient.auth.updateUser({ password });
        if (error) throw error;

        await supabaseClient.auth.signOut();
        recoveryMode = false;
        history.replaceState(null, "", window.location.pathname);
        showLogin("Senha alterada com sucesso. Entre com a nova senha.");
      } catch (_error) {
        recoveryAlert.textContent = "Não foi possível alterar a senha. Solicite um novo link e tente novamente.";
      } finally {
        recoverySubmit.disabled = false;
        recoverySubmit.textContent = "ALTERAR SENHA";
        recoveryPassword.disabled = false;
        recoveryConfirm.disabled = false;
      }
    });
  }

  function showRecovery() {
    ensureRecoveryPanel();
    currentProfile = null;
    appStage.hidden = true;
    authGate.hidden = false;
    authForm.hidden = true;
    logoutButton.hidden = true;
    sessionBadge.hidden = true;
    sessionBadge.textContent = "";
    recoveryPanel.hidden = false;
    recoveryAlert.textContent = "";
    recoveryPassword.value = "";
    recoveryConfirm.value = "";
    recoveryPassword.focus({ preventScroll: true });
  }

  async function authorizeCurrentSession() {
    const {
      data: { session },
      error: sessionError,
    } = await supabaseClient.auth.getSession();

    if (sessionError || !session) {
      throw new Error("NO_SESSION");
    }

    const { data, error } = await supabaseClient.functions.invoke(functionName, {
      body: { action: "authorize" },
    });

    if (error || !data?.authorized || !data?.user) {
      throw new Error("ACCESS_DENIED");
    }

    return data.user;
  }

  async function boot() {
    setLoading(true);

    try {
      const {
        data: { session },
        error,
      } = await supabaseClient.auth.getSession();

      if (error || !session) {
        if (recoveryMode) {
          recoveryMode = false;
          showLogin("Link de recuperação inválido ou expirado. Solicite um novo.");
        } else {
          showLogin();
        }
        return;
      }

      if (recoveryMode) {
        showRecovery();
        return;
      }

      const profile = await authorizeCurrentSession();
      showApp(profile);
    } catch (_error) {
      await supabaseClient.auth.signOut({ scope: "local" });
      showLogin("Sua sessão expirou ou seu acesso não está liberado.");
    }
  }

  passwordToggle.addEventListener("click", () => {
    if (passwordInput.disabled) return;

    const shouldShow = passwordInput.type === "password";
    setPasswordVisibility(shouldShow);
    passwordInput.focus({ preventScroll: true });

    const end = passwordInput.value.length;
    try {
      passwordInput.setSelectionRange(end, end);
    } catch (_error) {
      // Alguns navegadores podem não permitir reposicionar o cursor neste momento.
    }
  });

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    authAlert.textContent = "";

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!email || !password) {
      authAlert.textContent = "Informe e-mail e senha.";
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

      if (error) {
        authAlert.textContent = "E-mail ou senha inválidos.";
        return;
      }

      try {
        const profile = await authorizeCurrentSession();
        showApp(profile);
      } catch (_authorizationError) {
        await supabaseClient.auth.signOut({ scope: "local" });
        showLogin("Acesso não autorizado. Procure um administrador.");
      }
    } catch (_error) {
      authAlert.textContent = "Não foi possível validar o acesso. Tente novamente.";
    } finally {
      if (!authGate.hidden) setLoading(false);
    }
  });

  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    try {
      await supabaseClient.auth.signOut();
    } finally {
      logoutButton.disabled = false;
      showLogin();
    }
  });

  supabaseClient.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      recoveryMode = true;
      showRecovery();
      return;
    }
    if (event === "SIGNED_OUT" && authGate.hidden) {
      showLogin();
    }
  });

  window.BOLETO_CREDVIX_AUTH = Object.freeze({
    client: supabaseClient,
    authorize: authorizeCurrentSession,
    getProfile: () => currentProfile,
  });

  setPasswordVisibility(false);
  ensureForgotButton();
  boot();
})();
