# Integração Site → Supabase → Google Sheets → Kwid4x4

Esta branch prepara a integração produtiva sem alterar o visual aprovado do portal.

## Fluxo

1. Usuário autenticado envia o formulário.
2. `integracao-submit-v1.js` chama a Edge Function Supabase `submit-boleto`.
3. A Edge Function valida novamente os dados e a autorização do usuário.
4. A solicitação é persistida em `public.boleto_requests` com `request_id` único.
5. A Edge Function lê a configuração da ponte em `public.boleto_integration_config` e envia a solicitação para o Web App do Google Apps Script.
6. O Apps Script grava a linha na aba `EMISSÃO BOLETOS` da planilha `CENTRAL CREDVIX — GESTÃO 360 AUTOMÁTICA`.
7. Só quando o Apps Script confirma a gravação a Edge Function retorna `status = ENVIADO_FILA`.
8. O site então exibe a tela de sucesso.
9. O Kwid4x4 continua processando a linha como já faz hoje.

## Componentes já preparados

- Supabase table: `public.boleto_requests`
- Supabase config table: `public.boleto_integration_config`
- Supabase Edge Function: `submit-boleto`
- Frontend: `integracao-submit-v1.js`
- Apps Script: `integrations/apps-script/Code.gs`
- Manifesto Apps Script: `integrations/apps-script/appsscript.json`

## Ativação do Apps Script

1. Crie um projeto em script.google.com.
2. Cole o conteúdo de `integrations/apps-script/Code.gs` em `Code.gs`.
3. Em **Configurações do projeto > Propriedades do script**, crie `BRIDGE_KEY` com o mesmo valor configurado no Supabase.
4. Faça **Implantar > Nova implantação > Aplicativo da Web**.
5. Execute como o usuário proprietário da planilha.
6. Permita acesso ao Web App conforme necessário para chamadas do backend.
7. Copie a URL final terminada em `/exec`.

## Configuração da ponte no Supabase

A tabela `public.boleto_integration_config` possui duas chaves:

- `apps_script_url`: URL `/exec` da implantação do Apps Script.
- `bridge_key`: mesmo valor salvo em `BRIDGE_KEY` nas Propriedades do script.

Esses valores não devem ser colocados no GitHub nem no `config.js`.

## Comportamento de segurança

- O endpoint `submit-boleto` exige JWT válido.
- O usuário precisa existir em `app_users` com `ativo = true`.
- CPF, telefone, contrato e parcelas são revalidados no backend.
- `request_id` é a chave de idempotência para impedir dupla gravação.
- O Apps Script também verifica `request_id` na coluna `REQUEST_ID` antes de inserir.
- O site só mostra sucesso quando a fila retorna confirmação real.

## Estado de homologação

A configuração da ponte foi concluída no Supabase. O teste final deve ser feito com uma solicitação autenticada no site para confirmar a criação de uma nova linha `PENDENTE` na aba `EMISSÃO BOLETOS` e o processamento pelo Kwid4x4.
