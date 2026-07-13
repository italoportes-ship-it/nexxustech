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
