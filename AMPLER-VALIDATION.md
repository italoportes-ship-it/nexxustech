# Validação do site exclusivo do Ampler

## Preview desktop

As rotas `/`, `/produto/ampler`, `/softwares`, `/comparar`, `/faq` e `/b2b?produto=ampler` foram capturadas em 1440 × 900. Todas carregaram sem erro de aplicação ou falha de TypeScript.

O hero gerado foi substituído pelo ativo final e aparece corretamente na home, no catálogo e na página do produto, sem placeholder, imagem quebrada ou texto artificial. A logomarca oficial do Ampler também está legível sobre o fundo escuro.

A home apresenta somente o Ampler, com navegação para recursos, comparação e demonstração. A página de produto exibe recursos, requisitos, FAQ e contratação consultiva sem preço fictício. A comparação diferencia claramente dados comprovados e campos pendentes. A FAQ contém apenas informações do Ampler. O formulário B2B reconhece `?produto=ampler`, personaliza o título e pré-carrega a mensagem de interesse.

O catálogo antigo não aparece nas páginas públicas verificadas. O painel e as APIs preservam os registros anteriores como históricos inativos.

## Preview móvel

A home, `/produto/ampler` e `/b2b?produto=ampler` foram validadas em 390 × 844. O menu recolhe corretamente, os CTAs permanecem acessíveis, o hero conserva hierarquia e leitura, os cards passam para uma coluna e o formulário mantém campos, mensagem pré-carregada e botão de envio sem overflow horizontal.

A captura full-page mantém alguns títulos de entrada com o `filter: blur()` inicial porque a ferramenta congela animações fora do viewport; esses elementos entram em foco quando o usuário rola a página. O conteúdo visível inicial e os fluxos interativos não apresentam esse efeito.

## Inspeção verificável no navegador

A home do preview retornou o título `Ampler para Microsoft Office | Produtividade e Consistência | NexxusTECH`, exibiu a logomarca oficial, o hero final, os quatro aplicativos da suíte, os seis recursos comprovados e somente CTAs do Ampler. Nenhum nome ou link do catálogo antigo apareceu no conteúdo extraído.

A rota `/produto/ampler` carregou o cadastro enriquecido com licenciamento sob consulta, imagem final, requisitos Office 2007–2021/Microsoft 365, sete recursos, seis perguntas frequentes, link oficial do fabricante e CTAs de demonstração. O navegador confirmou que o hero é o ativo `/manus-storage/ampler-hero_2ba32fe5.png`, não um placeholder.

A inspeção do DOM em `/produto/ampler` confirmou title, description, canonical, Open Graph title/description/image, Twitter Card e os schemas `SoftwareApplication` e `FAQPage`. O canonical usa corretamente a origem do ambiente atual e será resolvido para o domínio publicado.

A rota `/softwares` retornou o title específico do Ampler e não apresentou filtros, categorias, cursos ou nomes do catálogo anterior. O conteúdo público é exclusivamente do Ampler; a captura inicial registrou o estado de carregamento da consulta do produto, que será conferido após a conclusão da query.

Após a conclusão da consulta, `/softwares` exibiu exatamente um card: Ampler, com o hero final, seis recursos e CTAs para produto e demonstração. A rota `/comparar` apresentou somente Ampler, processo manual e Think-cell, marcando explicitamente campos pendentes e omitindo preços ou superioridade não homologada. A rota `/faq` exibiu oito perguntas específicas do Ampler, separadas por Produto, Compatibilidade, Licenciamento e Implantação, sem promessas antigas de cursos, reembolso ou SLA.

A rota `/b2b?produto=ampler` exibiu o título “Veja o Ampler aplicado ao seu fluxo de trabalho”, o CTA de demonstração e a mensagem pré-carregada `Tenho interesse em uma demonstração e orçamento do Ampler para minha equipe.`, mantendo o honeypot ativo. A rota histórica `/cursos` redirecionou automaticamente para `/produto/ampler`, preservando acesso sem revelar cursos desativados.

A revisão final de `/b2b?produto=ampler` confirmou os cards “Licenciamento por Usuário”, “Gestão de Assentos”, “Implantação Consultiva” e “Orçamento no Brasil”. O texto não promete desconto, SLA ou prazo de retorno; a mensagem de interesse continua pré-carregada e o honeypot permanece fora da área visual.

## Validação do domínio publicado

O domínio `https://nexxusapp-dayfmj3q.manus.space` respondeu e renderizou a nova home. O title publicado é `Ampler para Microsoft Office | Produtividade e Consistência | NexxusTECH`. A página exibe a logomarca oficial, o hero final, PowerPoint, Excel, Word e Outlook, seis recursos comprovados, CTAs de demonstração e nenhum produto do catálogo anterior.

A rota pública `https://nexxusapp-dayfmj3q.manus.space/produto/ampler` carregou integralmente após a consulta do produto. Logomarca, hero, sete recursos, requisitos, contratação consultiva, seis FAQs e CTAs de demonstração aparecem corretamente; nenhum produto desativado ou preço fictício foi exibido.

No domínio publicado, o DOM de `/produto/ampler` confirmou canonical `https://nexxusapp-dayfmj3q.manus.space/produto/ampler`, description, Open Graph title/description/image, Twitter Card e os schemas `SoftwareApplication` e `FAQPage`. A rota pública `/b2b?produto=ampler` iniciou o carregamento normalmente e será validada após a hidratação.

A rota pública `/b2b?produto=ampler` hidratou corretamente e exibiu os quatro benefícios comerciais revisados, a mensagem pré-carregada, os campos obrigatórios, o honeypot e o botão de envio. Não há promessa de desconto, SLA ou prazo não homologado.

A URL histórica `/produto/cloudguard-enterprise` não expõe o produto desativado. Após a consulta, a página informou “Produto não disponível”, explicou que o catálogo é exclusivo do Ampler e ofereceu somente o CTA `Conhecer o Ampler`.
