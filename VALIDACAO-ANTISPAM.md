# Validação da proteção anti-spam e sincronização

## Preview

O formulário B2B foi validado visualmente no preview. O honeypot `website` permanece fora da área visível e fora da navegação por teclado, enquanto os campos legítimos continuam funcionando normalmente.

O painel administrativo foi aberto diretamente em `/admin?tab=leads` e exibiu, para cada lead, o estado de sincronização com o CRM, número de tentativas, última tentativa, erro quando existente e a ação **Sincronizar/Reprocessar**.

Foi preparado um envio legítimo identificado como `VALIDAÇÃO ANTISPAM PREVIEW — REMOVER`, sem preencher o honeypot e após o tempo mínimo configurado.

O envio legítimo foi concluído com sucesso após a janela mínima e retornou o protocolo `NXT-20260713-FUK2J`. O fluxo permaneceu transparente para o cliente e o honeypot não interferiu na submissão.

Também foi preparado um cenário de bot com o honeypot preenchido (`https://spam.example`) e os campos obrigatórios preenchidos. A etapa seguinte validará que a requisição é bloqueada sem criar lead.

O cenário com honeypot preenchido foi bloqueado. O usuário recebeu apenas a mensagem genérica `Erro ao enviar. Verifique os campos e tente novamente.`, sem exposição da regra anti-spam e sem tela de sucesso ou protocolo.

A consulta de validação retornou `0` registros para `spam-bot@example.com`, confirmando que o bloqueio ocorreu antes da persistência.

A captura autenticada de `/admin?tab=leads` foi examinada diretamente. A aba **Leads B2B** estava ativa e carregou 12 registros. Cada card exibiu protocolo, estado funcional do lead, badge **CRM pendente**, contador de tentativas e o botão **Sincronizar**, sem sobreposição ou quebra visual no layout.

## Idempotência do CRM em produção

A idempotência por protocolo foi publicada na branch `main` do repositório `italoportes-ship-it/CRM-V7` pelos commits `4f7eb5f` e `9747fcf`. O deployment `main - nexxus-crm` foi concluído com status **Deployed**.

O protocolo existente `NXT-20260713-FUK2J` foi reenviado ao endpoint publicado. O CRM respondeu com HTTP `200`, `success: true`, `leadId: 11` e `deduplicated: true`, confirmando que o reprocessamento devolveu o lead existente sem criar duplicata.

## Validação final em produção

Após a publicação do checkpoint `7601a090`, a página `https://nexxustech.one/b2b` carregou o formulário atualizado. O honeypot `website` está presente no DOM, permanece fora da área visual, e os campos legítimos continuam acessíveis e funcionais.

Foi enviado em produção o lead de teste `VALIDAÇÃO ANTISPAM PRODUÇÃO — REMOVER`, usando `antispam-producao@nexxustech.one`, sem preencher o honeypot e após a janela mínima. A interface entrou no estado `Enviando...` sem erro imediato.

O envio legítimo em produção retornou o protocolo `NXT-20260713-UEKFC`. O banco do site registrou `crmSyncStatus: synced`, `crmSyncAttempts: 1`, `crmLeadId: 12`, sem erro, com sincronização concluída em `2026-07-13 14:32:07`.

Foi preparado em produção o cenário de bot `BOT PRODUÇÃO BLOQUEADO`, com o honeypot preenchido e o e-mail `spam-producao@nexxustech.one`. O teste seguinte confirma o bloqueio antes da persistência.

O cenário com honeypot foi rejeitado no domínio publicado: o formulário retornou ao estado normal sem navegar para a tela de sucesso e sem emitir protocolo, preservando uma resposta genérica para não revelar a regra de proteção.

A consulta final retornou `blockedSpamRows: 0` para `spam-producao@nexxustech.one`, confirmando que o bloqueio ocorreu antes da persistência e do envio ao CRM.

Os mesmos dados legítimos do protocolo `NXT-20260713-UEKFC` foram preenchidos novamente dentro da janela de 30 minutos para validar a deduplicação do formulário publicado.

A submissão repetida retornou novamente `NXT-20260713-UEKFC`, confirmando que o site reutilizou o protocolo existente e não abriu uma nova oportunidade durante a janela de deduplicação.

A verificação do banco retornou `1|NXT-20260713-UEKFC|synced|1|12`: permaneceu apenas um registro, sincronizado, com uma única tentativa e o mesmo identificador remoto do CRM.

Após a validação, os leads temporários `NXT-20260713-FUK2J` e `NXT-20260713-UEKFC` foram removidos do CRM e do banco do site. Nenhum lead real foi alterado.
