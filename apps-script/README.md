# Backend da Pesquisa Nacional 2026

1. Importe `Inteligencia_Pesquisa_Nacional_2026_v5.xlsx` na conta Google da Beth como uma planilha Google nativa.
2. Confirme que existem somente `Respostas_Brutas`, `Dimensoes_por_Escola` e `Segmentacao_Cruzada`.
3. Na planilha, abra **Extensões → Apps Script** e use `Code.gs`.
4. Execute `testeP12NaoSei()` e confirme no registro: `Papeis_0a100 = 75`.
5. Implante como **Aplicativo da Web**, executando como Beth e permitindo acesso a qualquer pessoa.
6. Cole a URL `/exec` em `pesquisa-config.js`.

O código atualiza a mesma linha a cada tela, calcula as dimensões na hora e envia os e-mails somente quando a resposta passa a `completo = true`.
