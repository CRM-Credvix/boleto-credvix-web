# Boleto Credvix Web

Frontend estático para solicitação interna de boletos. O site é publicado no GitHub Pages e envia as solicitações ao Google Apps Script, que grava a fila na planilha usada pelo Boleto Credvix Worker.

## Estrutura

- `index.html`: interface do formulário.
- `styles.css`: identidade visual responsiva.
- `app.js`: validação, máscaras e envio.
- `config.js`: URL do Apps Script, unidades e modo de demonstração.
- `.github/workflows/pages.yml`: publicação automática no GitHub Pages.

## Configuração inicial

1. Publique o projeto `boleto-credvix-apps-script` como aplicativo da Web.
2. Copie a URL terminada em `/exec`.
3. Cole a URL em `config.js`, na propriedade `APPS_SCRIPT_URL`.
4. Altere `ALLOW_DEMO_MODE` para `false` antes do uso real.
5. Ajuste a lista `UNIDADES`.
6. Faça commit e push para a branch `main`.
7. No GitHub, abra **Settings > Pages** e selecione **GitHub Actions** como fonte.

## Segurança

- Nunca coloque senhas, tokens do Google, credenciais do DNA ou chaves da ClikChat neste repositório.
- O endpoint do Apps Script será público por natureza. Toda validação deve ser repetida no servidor.
- Para o MVP, o Apps Script aceita um código interno digitado pelo usuário. Ative `REQUIRE_ACCESS_CODE` somente depois de configurar `ACCESS_CODE` nas propriedades do script.
- Não armazene CPF ou telefone no `localStorage`.
- Use este repositório como público apenas se a política da empresa permitir. GitHub Pages em repositório privado depende do plano da conta.

## Observação sobre confirmação

O envio usa `fetch` com `mode: no-cors`, necessário para o endpoint do Apps Script. O navegador confirma que a requisição foi despachada, mas não consegue ler a resposta do Google. A planilha e o worker continuam sendo a fonte oficial do status.
