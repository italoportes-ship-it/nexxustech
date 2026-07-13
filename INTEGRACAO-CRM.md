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

## Proteção anti-spam nativa

O formulário usa quatro controles complementares sem CAPTCHA visível. Um campo honeypot chamado `website` permanece fora da tela e da navegação por teclado; qualquer valor nele bloqueia a requisição. O servidor também exige pelo menos 2,5 segundos entre a abertura e o envio, limita a três leads por e-mail e cinco por hash de IP em 15 minutos e reutiliza o protocolo de uma submissão idêntica feita nos últimos 30 minutos.

O IP não é armazenado em texto puro. O backend gera um hash SHA-256 combinado com o segredo da aplicação e persiste apenas esse valor para a limitação de frequência.

| Controle | Regra |
|---|---|
| Honeypot | Bloqueia se `website` estiver preenchido |
| Tempo mínimo | 2,5 segundos |
| Validade do formulário | 2 horas |
| Limite por e-mail | 3 envios em 15 minutos |
| Limite por IP | 5 envios em 15 minutos |
| Duplicata | Mesmo e-mail e empresa em 30 minutos reutilizam o protocolo |

## Estados de sincronização

Cada lead registra `pending`, `synced` ou `failed`, o número de tentativas, a última tentativa, o identificador remoto do CRM, a data de sucesso e o último erro. Quando o CRM falha, o protocolo continua sendo entregue ao cliente, o lead permanece salvo no site e o proprietário recebe uma notificação com o erro e um link direto para `/admin?tab=leads`.

## Reprocessamento

No Painel Administrativo, a aba **Leads B2B** exibe o estado da integração. Leads pendentes mostram **Sincronizar**; leads com falha mostram **Reprocessar**. A ação é protegida por permissão administrativa e reenvia o mesmo protocolo. O endpoint do CRM deve tratar esse protocolo como chave de idempotência, devolvendo o negócio existente em vez de criar uma duplicata.

> O reprocessamento só deve ser habilitado em produção depois que a versão idempotente do endpoint estiver publicada no repositório e no serviço do CRM.
