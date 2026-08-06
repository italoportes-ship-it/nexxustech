# Governança de Preços, Mídia Oficial e Product Decision Sheets

## Objetivo

O painel separa **referências públicas do fabricante** de **custos comerciais internos**. Câmbio, impostos, custos operacionais e margem ficam disponíveis somente em rotas administrativas. A API pública retorna exclusivamente preços finais que tenham sido homologados por um administrador e publicados explicitamente.

## Homologação de preços

| Estado | Significado | Visibilidade pública |
|---|---|---|
| Rascunho | Base, câmbio, impostos, custo e margem ainda editáveis | Não |
| Em revisão | Cálculo concluído e aguardando decisão humana | Não |
| Homologado | Preço final aprovado por administrador, com usuário e data registrados | Não |
| Publicado | Preço homologado liberado explicitamente no site | Sim |

O custo em reais é calculado a partir do valor de origem, câmbio, impostos e custo operacional. O preço sugerido usa a margem desejada como margem sobre a venda. O valor sugerido nunca é publicado automaticamente; o administrador deve informar o preço aprovado e confirmar a publicação.

> O cálculo é uma ferramenta operacional. Impostos e critérios financeiros devem ser confirmados pelo responsável contábil/financeiro antes da homologação.

## Bases cadastradas

A base pública contém Ampler Charts (€12/mês), Ampler para PowerPoint (€18/mês), Excel (€18/mês), Word (€18/mês) e Ampler Suite (€30/mês), conforme a página oficial do fabricante.[1] A base interna contém faixas anuais em USD e está integralmente em estado de rascunho. Nenhum preço brasileiro foi publicado.

## Product Decision Sheet

O upload aceita **DOCX ou TXT com até 5 MB**. O backend valida extensão, MIME e tamanho, calcula SHA-256 para impedir duplicidade, armazena o arquivo no storage do projeto e extrai texto sem executar macros ou código. A análise usa `gpt-5-mini` com JSON Schema estrito; valores ausentes permanecem nulos ou pendentes, sem fabricação de informações.

A prévia classifica campos como novos, alterados ou ausentes. Campos ausentes nunca são removidos automaticamente. O slug existente é preservado. A aplicação só ocorre após a confirmação literal **APROVAR E APLICAR** por um administrador.

Cada aprovação registra usuário, data, arquivo, modelo, campos aplicados e snapshots versionados. A restauração lógica cria um backup do estado atual antes de recuperar uma versão anterior.

## Continuidade operacional

Se o serviço de IA estiver temporariamente indisponível, o parser estruturado identifica as seções numeradas do PDS, normaliza campos, marca alegações pendentes e gera a prévia imediatamente. O administrador pode aprovar somente campos selecionados ou usar **Enriquecer prévia com IA** posteriormente, sem reenviar o arquivo.

O PDS real do Ampler foi processado pelo fallback com score de confiança 90, 11 diferenças e quatro pendências explícitas. A URL oficial ausente foi classificada como remoção protegida e não seria apagada. A prévia permaneceu em revisão, sem alterar o cadastro público. O painel permite selecionar campo a campo antes da confirmação e registra snapshot para restauração lógica.

O endpoint integrado de IA continuou retornando `412 usage exhausted` mesmo após a liberação informada; por isso a reanálise por `gpt-5-mini` permanece opcional e não bloqueia o fluxo principal.

## Mídia oficial

Foram cadastrados quatro cases oficiais (Ørsted, Oterra, KLM e Velliv) e dois vídeos do canal oficial Ampler for Microsoft 365. Os cards levam à fonte original, e os vídeos usam incorporação `youtube-nocookie.com`. Não foram criados depoimentos, avaliações ou resultados fictícios.

## Referências

[1]: https://ampler.io/pricing/ "Ampler Pricing"
[2]: https://ampler.io/customers/orsted/ "Ørsted customer story"
[3]: https://ampler.io/customers/oterra/ "Oterra customer story"
[4]: https://ampler.io/customers/klm/ "KLM customer story"
[5]: https://ampler.io/customers/velliv/ "Velliv customer story"
[6]: https://www.youtube.com/watch?v=Tpjtk0smzsc "Ampler for PowerPoint"
[7]: https://www.youtube.com/watch?v=7q-Uh0Frypc "Introducing Ampler Charts"

## Validação do preview

A página `/produto/ampler` carregou os quatro cases oficiais (Ørsted, Oterra, KLM e Velliv) e os dois vídeos do canal oficial. A consulta pública de preços retornou zero registros porque nenhuma faixa brasileira está homologada e publicada; portanto, nenhum custo interno ou valor preliminar apareceu no frontend. A visualização móvel em 390 × 844 manteve cards e vídeos em uma coluna, sem overflow horizontal.

O painel administrativo exige autenticação e papel `admin`; uma sessão anônima recebeu “Acesso restrito a administradores”, confirmando que custos, margens, câmbio, PDS e auditoria não são públicos.
