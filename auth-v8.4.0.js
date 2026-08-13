(() => {
  "use strict";

  const config = window.BOLETO_CREDVIX_CONFIG || {};
  const authGate = document.querySelector("#auth-gate");
  const authForm = document.querySelector("#auth-form");
  const emailInput = document.querySelector("#auth-email");
  const passwordInput = document.querySelector("#auth-password");
  const passwordToggle = document.querySelector("#auth-password-toggle");
  const authAlert = document.querySelector("#auth-alert");
  const authSubmit = document.querySelector("#auth-submit");
  const appStage = document.querySelector("#inicio");
  const logoutButton = document.querySelector("#auth-logout");
  const sessionBadge = document.querySelector("#auth-session-badge");

  if (!authGate || !authForm || !emailInput || !passwordInput || !passwordToggle || !authAlert || !authSubmit || !appStage || !logoutButton || !sessionBadge) return;

  const previewRequested = new URLSearchParams(window.location.search).get("auth-preview") === "1";
  const authEnabled = config.AUTH_REQUIRED === true || previewRequested;

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

  function showFatal(message) {
    appStage.hidden = true;
    authGate.hidden = false;
    authAlert.textContent = message;
    authSubmit.disabled = true;
    passwordToggle.disabled = true;
  }

  if (!config.SUPABASE_URL || !config.SUPABASE_PUBLISHABLE_KEY) {
    showFatal("Autenticação indisponível. Configuração do Supabase ausente.");
    return;
  }

  if (!window.supabase?.createClient) {
    showFatal("Não foi possível carregar o serviço de autenticação.");
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
  let currentProfile = null;

  function setLoading(isLoading) {
    authSubmit.disabled = isLoading;
    authSubmit.textContent = isLoading ? "VALIDANDO..." : "ENTRAR";
    emailInput.disabled = isLoading;
    passwordInput.disabled = isLoading;
    passwordToggle.disabled = isLoading;
  }

  function showLogin(message = "") {
    currentProfile = null;
    appStage.hidden = true;
    authGate.hidden = false;
    logoutButton.hidden = true;
    sessionBadge.hidden = true;
    sessionBadge.textContent = "";
    authAlert.textContent = message;
    passwordInput.value = "";
    setPasswordVisibility(false);
    setLoading(false);
    emailInput.focus({ preventScroll: true });
  }

  function showApp(profile) {
    currentProfile = profile;
    authAlert.textContent = "";
    authGate.hidden = true;
    appStage.hidden = false;
    logoutButton.hidden = false;
    sessionBadge.hidden = false;
    sessionBadge.textContent = `${profile.email} · ${profile.perfil}`;
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
        showLogin();
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
  boot();
})();
