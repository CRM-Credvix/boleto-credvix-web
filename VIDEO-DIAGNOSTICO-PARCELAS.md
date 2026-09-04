Diagnostico visual do video enviado em 2026-09-04.

Problema observado: ao selecionar "Parcela específica" ou "Intervalo", o texto rasterizado "Número de parcelas" da própria viewport continua visível por baixo do valor HTML do select. Isso gera ghosting/sobreposição e faz a linha parecer fora do padrão, apesar de os campos anteriores permanecerem alinhados.

Correção: preservar moldura, ícone e seta originais da viewport; cobrir apenas a faixa textual rasterizada do campo quando houver uma seleção válida; renderizar somente o valor HTML selecionado sobre essa faixa. O painel auxiliar permanece absolutamente posicionado e não participa do fluxo do formulário.

Backup pré-alteração: branch RECUPERACAO-CASO-CHAT-FACA-MERDA -> commit 38a791d7014ac6cf7f9a4f859b4049c8ac141b35.
