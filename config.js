window.BOLETO_CREDVIX_CONFIG = Object.freeze({
  // Supabase: somente URL pública e publishable key ficam no navegador.
  SUPABASE_URL: "https://rtrfpmuokkikdtuvzxkg.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_RAjfgdAQhqu-HBviFOtuLQ_GoHeQ1Lu",
  AUTH_FUNCTION_NAME: "authorize-user",

  // Primeiro publicamos em modo de homologação: o login só aparece com ?auth-preview=1.
  // Depois do teste aprovado, altere para true para exigir autenticação de todos.
  AUTH_REQUIRED: false,

  // Cole aqui a URL /exec do Google Apps Script depois da publicação.
  APPS_SCRIPT_URL: "",

  // Ative somente depois de cadastrar ACCESS_CODE nas propriedades do Apps Script.
  REQUIRE_ACCESS_CODE: false,

  // Ajuste as unidades que aparecerão no formulário.
  UNIDADES: [
    "51545 - HELP! - ES - SÃO MATEUS - CENTRO",
    "51832 - HELP! - ES - COLATINA - CENTRO",
    "53742 - HELP! - ES - ARACRUZ - CENTRO",
    "53743 - HELP! - ES - CARIACICA - CAMPO GRANDE",
    "53744 - HELP! - ES - CACHOEIRO DE ITAPEMIRIM - CENTRO",
    "53749 - HELP! - BA - TEIXEIRA DE FREITAS - CENTRO",
    "53752 - HELP! - ES - SERRA - LARANJEIRAS",
    "53755 - HELP! - ES - VILA VELHA - CENTRO",
    "53760 - HELP! - ES - VITÓRIA - PRAIA DO CANTO",
    "53761 - HELP! - BA - EUNÁPOLIS - CENTRO",
    "53763 - HELP! - ES - NOVA VENÉCIA - CENTRO",
    "53764 - HELP! - ES - SERRA - PQ JACARAÍPE",
    "53913 - HELP! - ES - SERRA - LARANJEIRAS II",
    "54371 - HELP! - MT - RONDONÓPOLIS - CENTRO",
    "54389 - HELP! - GO - ÁGUAS LINDAS DE GOIÁS",
    "54407 - HELP! - DF - BRASÍLIA - CEILÂNDIA SUL",
    "54415 - HELP! - MT - CUIABÁ - CENTRO-NORTE",
    "54465 - HELP! - MG - IPATINGA - CENTRO",
    "54838 - HELP! - MT - VÁRZEA GRANDE - CENTRO NORTE",
    "55329 - HELP! - ES - GUARAPARI - CENTRO",
    "55467 - HELP! - BA - PORTO SEGURO - CENTRO",
    "55634 - HELP! - ES - CREDVIX - DIGITAL 1",
    "55711 - HELP! - ES - LINHARES - CENTRO",
    "56395 - HELP! - BA - ITABUNA - CENTRO",
    "56620 - HELP! - MG - TEOFILO OTONI - CENTRO",
    "56679 - HELP! - DF - BRASÍLIA - TAGUATINGA",
    "56891 - HELP! - ES - CARIACICA - EXPEDITO GARCIA",
    "56892 - HELP! - ES - VITORIA - JERONIMO MONTEIRO",
    "56960 - HELP - MT - CUIABÁ - PRAINHA",
    "56961 - HELP! - MT - CUIABÁ - CPA 2",
    "57330 - HELP! - ES - VILA VELHA - GLÓRIA",
    "57372 - HELP! - MT - VÁRZEA GRANDE - CRISTO REI",
    "57380 - HELP! - MT - VÁRZEA GRANDE - CRISTO REI II"
  ],

  // Em desenvolvimento, o formulário simula o envio quando a URL estiver vazia.
  ALLOW_DEMO_MODE: true
});
