# Guia Operacional — Base Administração

## Acesso

A base está disponível em `/admin?tab=administration` e usa procedimentos protegidos por `adminProcedure`. Somente usuários com `role = admin` conseguem listar, simular, gravar, homologar, publicar ou retirar cenários.

## Estrutura do cenário

| Grupo | Variáveis editáveis |
|---|---|
| Origem | Nome do cenário, plano interno, fonte pública/interna, período do custo, moeda, custo unitário de lista, custo negociado, quantidade e meses |
| Negociação e câmbio | Uso do custo negociado, desconto adicional, câmbio e spread cambial |
| Impostos | Flag “fabricante absorve IRRF”, IRRF, CIDE, PIS, COFINS, ISS, IOF e outros impostos |
| Custos internos | Custo financeiro, custo operacional e contingência |
| Estratégia | Margem mínima, margem sugerida e preço final manual |
| Conteúdo público | Nome do plano, periodicidade, assentos mínimos/máximos e descrição comercial |

## Lógica de cálculo

O custo estrangeiro bruto corresponde ao custo unitário selecionado multiplicado pelo período aplicável e pela quantidade. O desconto gera o custo estrangeiro líquido. O custo base em reais usa câmbio acrescido do spread. Quando a flag de retenção está ativa, o IRRF efetivo é zero, embora a alíquota de referência permaneça editável.

Impostos são adicionados ao custo base. Custos financeiros, operacionais e contingência incidem sobre o custo importado. O preço mínimo e o sugerido usam margem sobre a venda, não markup:

`preço = custo total / (1 - margem)`

O preço manual, quando informado, substitui o sugerido. Se estiver abaixo do mínimo, o painel emite alerta e exige confirmação explícita de exceção estratégica durante a homologação.

## Workflow

| Estado | Ação permitida | Visibilidade pública |
|---|---|---|
| Rascunho | Editar e simular | Não |
| Em revisão | Conferir resultados e homologar | Não |
| Homologado | Publicar preço final | Não |
| Publicado | Exibir preço ao consumidor | Sim |
| Retirado | Manter histórico e voltar a editar | Não |

Salvar ou simular nunca publica. A publicação copia para `productPrices` somente nome do plano, assentos, periodicidade, preço final, vigência e aprovador. Custos, câmbio, impostos, margem, contribuição e markup permanecem exclusivamente em `pricingAdministration`.

## Rascunho inicial do Ampler

O cenário `Ampler — 1 licença anual` foi carregado como rascunho com custo anual de USD 164, uma licença, câmbio de referência 5,105299, IRRF absorvido pelo fabricante, custo operacional de 5%, margem mínima de 25% e sugerida de 30%.

O resultado atual é custo total de R$ 879,13, preço mínimo de R$ 1.172,18 e preço sugerido de R$ 1.255,90 por licença/ano. Esses valores permanecem privados e não constituem preço homologado.

## Procedimento recomendado

Antes de publicar, o admin deve atualizar o câmbio, confirmar todas as alíquotas com o responsável fiscal, ajustar custos internos, conferir margem/contribuição, salvar o rascunho, enviar para revisão e homologar. Somente então deve usar **Publicar preço final**. A opção **Retirar preço** remove imediatamente o valor do site sem excluir o histórico.

## Referência

[1]: https://www.bcb.gov.br/en/currencyconversion "Banco Central do Brasil — Currency Conversion"
