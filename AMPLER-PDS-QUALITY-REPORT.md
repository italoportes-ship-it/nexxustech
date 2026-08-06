# Relatório de Qualidade e Decisão de Produto — Ampler

**Autor:** Manus AI  
**Fonte principal:** `Product_Decision_Sheet_Ampler_Exemplo.docx`  
**Escopo:** transformação do NexxusTECH em catálogo público exclusivo do Ampler

## Síntese executiva

O Product Decision Sheet identifica corretamente o Ampler como solução de produtividade para apresentações e Microsoft Office, mas se declara explicitamente como exemplo e contém campos não homologados. A pesquisa oficial confirmou que o Ampler abrange **PowerPoint, Excel, Word e Outlook**, inclui o módulo **Ampler Charts** e oferece mais de 150 ferramentas no PowerPoint, biblioteca de conteúdo, barra personalizável, agenda, storyboard, gráficos, recursos de alinhamento e Scan & Fix.[1] [2]

O site atual possui **16 produtos ativos** — 12 softwares e quatro cursos — distribuídos em quatro categorias. A decisão recomendada é **desativar**, e não apagar, todos os itens anteriores; manter o histórico de pedidos e referências; e publicar um único produto ativo com slug estável `ampler`. As páginas públicas, busca, comparação, navegação, SEO e CTAs devem convergir para essa oferta.

## Qualidade dos dados

| Dimensão | Antes da validação | Após enriquecimento | Diagnóstico |
|---|---:|---:|---|
| Completude | 68/100 | 92/100 | Identidade, público, funcionalidades e requisitos estão cobertos; preço BRL, cases, SLA e SKU oficial permanecem pendentes |
| Confiança | 66/100 | 90/100 | Recursos e compatibilidade foram confrontados com fontes oficiais; promessas quantitativas não confirmadas foram excluídas |
| SEO | 10/100 | 95/100 | O PDS não traz metadados prontos; serão criados title, description, canonical, Open Graph, Twitter Card e SoftwareApplication schema |
| Consistência | 75/100 | 96/100 | A classificação “Cloud” e o SKU de exemplo foram separados dos fatos confirmados |
| **Qualidade ponderada** | **56,85/100** | **92,60/100** | Pesos: completude 35%, confiança 30%, SEO 20% e consistência 15% |

> O score após enriquecimento representa a qualidade do cadastro planejado. Ele não transforma campos pendentes em fatos; esses campos permanecem explicitamente marcados para validação.

## Informações homologadas para publicação

A proposta de valor pública pode afirmar que o Ampler aumenta a eficiência e a consistência no Microsoft Office, oferecendo ferramentas para PowerPoint, Excel, Word e Outlook. Para PowerPoint, são confirmados mais de 150 recursos, biblioteca de slides e elementos, templates, agenda, storyboard, gráficos, formatação, alinhamento e Scan & Fix.[1] [2]

A página de download confirma instalador para **Office 2007–2021 e Office 365** e informa que o Ampler se integra ao Office como uma guia própria. PowerPoint, Excel, Word e Outlook podem ser selecionados na instalação.[3]

A página pública de preços oferece teste gratuito de 30 dias e planos mensais em euros. Esses valores devem ser tratados apenas como referência do fabricante; o NexxusTECH não deve publicar preço final em reais sem aprovação comercial, impostos e condições de revenda validadas.[4]

## Campos pendentes de validação

| Campo | Motivo | Tratamento no site |
|---|---|---|
| Redução de tempo “até 70%” | Não foi localizada comprovação oficial nas fontes consultadas | Não publicar como promessa factual |
| Menor custo total que Think-cell | Não há comparação quantitativa homologada | Usar comparação funcional, sem alegação financeira |
| SKU `AMPLER-PRO` | O PDS indica que é exemplo | Manter fora da página pública |
| Versão “Cloud” | A oferta funciona como add-in e suíte conectada; classificação comercial não confirmada | Descrever como add-in/suíte para Microsoft Office |
| Preço de revenda no Brasil | Ausente | CTA de demonstração e orçamento |
| Cases homologados | Ausentes | Não criar cases, avaliações ou depoimentos fictícios |
| SLA e canais de suporte | Não detalhados | Informar “suporte especializado NexxusTECH” sem prometer prazo |
| Requisitos completos de sistema | Compatibilidade de Office confirmada; detalhes técnicos adicionais não | Incluir apenas versões confirmadas |

## Decisão de catálogo e preservação histórica

Todos os produtos atuais diferentes de Ampler devem receber `isActive = false`. Essa abordagem remove os produtos do catálogo público sem apagar pedidos, itens de pedido ou referências históricas. O cadastro do Ampler deve ser criado uma única vez e atualizado por slug, evitando duplicidades.

A categoria pública será **Produtividade para Microsoft Office**, reutilizando a categoria histórica `design-produtividade` para preservar URLs. As categorias antigas continuam no banco, mas deixam de ser expostas publicamente quando não possuírem produtos ativos.

## Experiência e arquitetura recomendadas

| Superfície | Decisão |
|---|---|
| Home | Landing page single-product com hero Ampler, benefícios, suíte Office, recursos comprovados, comparação funcional e CTA |
| `/softwares` | Visão geral do Ampler e dos seus módulos, sem filtros de catálogo |
| `/produto/ampler` | Página detalhada com recursos, requisitos, FAQ, scorecard e solicitação de demonstração/orçamento |
| Busca | Resultados e atalhos exclusivamente relacionados ao Ampler |
| Comparação | Comparação funcional Ampler versus processo manual e Think-cell, sem preços ou superioridade não comprovados |
| Categorias | Somente a categoria com Ampler ativo aparece; URLs antigas permanecem preservadas |
| Cursos | Removidos da navegação e do catálogo público; registros históricos permanecem inativos |
| Painel administrativo | Exibe ativos e inativos, permitindo auditoria do histórico |
| Reviews | Nenhuma avaliação artificial será criada; seção vazia não será usada como prova social |

## SEO proposto

**Meta title:** `Ampler para Microsoft Office | Produtividade e Consistência | NexxusTECH`

**Meta description:** `Conheça o Ampler para PowerPoint, Excel, Word e Outlook. Automatize apresentações, padronize conteúdos e solicite uma demonstração com a NexxusTECH.`

**Slug principal:** `ampler`

**Canonical:** `https://nexxustech.one/produto/ampler`

**Palavras-chave:** Ampler, Ampler PowerPoint, produtividade Microsoft Office, add-in PowerPoint, gráficos PowerPoint, biblioteca de slides, Scan & Fix, alternativa ao think-cell.

O dado estruturado deve usar `SoftwareApplication`, plataforma Windows/Microsoft Office, categoria BusinessApplication, oferta com consulta comercial e sem avaliação agregada enquanto não existirem reviews reais.

## Referências

[1]: https://ampler.io/ "Ampler — Next generation tools for Microsoft Office"
[2]: https://ampler.io/ampler-for-microsoft-powerpoint/ "Ampler for PowerPoint"
[3]: https://ampler.io/download/ "Ampler Suite download"
[4]: https://ampler.io/pricing/ "Ampler Pricing"
