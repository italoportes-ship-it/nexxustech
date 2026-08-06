# Validação da Base Administração

## Evidência visual autenticada

A captura desktop autenticada em 1440 × 1000 exibiu a aba **Administração** ativa dentro do Painel Administrativo, o cenário privado `Ampler — 1 licença anual` em estado **Rascunho** e todos os cinco blocos funcionais: custo do fabricante, impostos e retenções, custos internos/margens, simulação em tempo real e conteúdo público.

Os valores visíveis corresponderam ao cálculo esperado: custo de origem USD 164, custo base R$ 837,27, IRRF efetivo zero, custo total R$ 879,13, preço mínimo R$ 1.172,18, preço sugerido/final R$ 1.255,90, contribuição R$ 376,77, margem efetiva 30% e markup informativo 42,86%. A tela também mostrou a proteção que informa quais campos serão enviados à API pública.

A captura móvel autenticada em 390 × 844 exibiu os mesmos campos e resultados em coluna única, sem perda de controles ou informações. A navegação, o seletor de cenário, os campos editáveis, o resumo financeiro e a ação **Salvar rascunho** permaneceram acessíveis.

## Segurança observada

A área aparece somente dentro da rota administrativa autenticada. Custos, impostos, margens, contribuição e markup permanecem na base `pricingAdministration`; o fluxo público usa apenas o preço final homologado e metadados comerciais seguros.
