# Integração do site com o Nexxus CRM

O formulário B2B em `/b2b` salva o lead no banco do site e, em seguida, envia uma cópia ao Nexxus CRM por uma chamada **servidor a servidor**. A chave de autenticação nunca é enviada ao navegador.

## Variáveis de ambiente

| Variável | Valor esperado |
|---|---|
| `CRM_URL` | `https://nexxus-crm.onrender.com` |
| `CRM_INTAKE_KEY` | A mesma chave forte configurada como `INTAKE_KEY` no serviço do CRM |

O backend chama:

```text
POST ${CRM_URL}/api/public/leads
Content-Type: application/json
x-intake-key: ${CRM_INTAKE_KEY}
```

O corpo enviado pelo formulário contém `companyName`, `contactName`, `email`, `phone`, `employees`, `message`, `protocol` e `origem`.

## Comportamento

O cadastro no banco do site continua sendo a operação principal. Se o CRM estiver temporariamente indisponível, o formulário ainda retorna o protocolo ao cliente e a falha é registrada nos logs do servidor para diagnóstico.

No CRM, o endpoint cria ou localiza a empresa, cria o contato, cria o negócio na etapa `novo_lead`, distribui o responsável por rodízio e gera uma notificação interna.

## Diagnóstico

Se o lead não aparecer no CRM, verifique os logs do backend do site e procure mensagens iniciadas por `[CRM]`. Confirme também se `CRM_INTAKE_KEY` no site é idêntica a `INTAKE_KEY` no CRM e se o health check `https://nexxus-crm.onrender.com/healthz` responde com HTTP 200.
