# Operação do Checkout Digital

## Estado da configuração

| Componente | Estado atual | Comportamento seguro |
|---|---|---|
| Stripe secret/publishable/webhook | Configurado em sandbox | Checkout hospedado e webhook assinado funcionais |
| NFE.io | Credenciais pendentes | Pedido pago fica em `pending_configuration`; nenhuma nota fictícia é emitida |
| E-mail transacional | Credenciais pendentes | Mensagem fica em `pending_configuration`; nenhuma entrega é simulada |
| Licença Ampler | API/estoque pendente | Entitlement muda para `awaiting_vendor`; admin insere somente chave oficial |

## Fluxo do pedido

O frontend solicita uma cotação ao backend. O backend seleciona exclusivamente um preço em `productPrices` com `status = published`, `isPublic = true` e faixa compatível com a quantidade. O valor informado pelo navegador nunca é usado para criar o pedido.

Após validação do CPF/CNPJ e dos consentimentos, o sistema cria transacionalmente cliente, pedido, item, pagamento pendente, nota pendente, licença bloqueada e mensagem operacional. Dados fiscais, telefone, endereço e chaves de licença são criptografados com AES-256-GCM; o navegador recebe apenas campos sanitizados.

## Stripe Checkout

O checkout é hospedado pelo Stripe. O código não define uma lista fixa de métodos, permitindo que a conta Stripe apresente dinamicamente cartão, Pix e boleto quando habilitados e elegíveis. Pix para contas brasileiras depende da disponibilidade na conta e liquida em BRL; boleto confirma de forma assíncrona.[1] [2]

Configure no Stripe Dashboard o endpoint:

`https://nexxustech.one/api/stripe/webhook`

Eventos usados:

| Evento | Ação |
|---|---|
| `checkout.session.completed` | Registra sessão; paga apenas se `payment_status = paid` |
| `checkout.session.async_payment_succeeded` | Liquida Pix/boleto assíncrono |
| `checkout.session.async_payment_failed` | Marca falha assíncrona |
| `payment_intent.succeeded` | Reconcilia liquidação por PaymentIntent |
| `payment_intent.payment_failed` | Registra falha e código seguro |
| `checkout.session.expired` | Cancela pedido pendente |
| `charge.refunded` | Marca estorno integral e revoga licença |
| `charge.dispute.created` | Marca chargeback e revoga licença |

Cada ID de evento é persistido uma única vez. Eventos concluídos são ignorados em reenvios; eventos falhos podem ser reprocessados até cinco tentativas. O body bruto é usado para validar a assinatura, mas não é armazenado.[3]

## Sandbox

O fluxo de sandbox foi validado criando uma Checkout Session em `checkout.stripe.com`, sem efetuar cobrança, e expirando a sessão em seguida. Pedido, pagamento, licença, cliente e preço temporários foram removidos após a validação.

Para testar manualmente cartão, use `4242 4242 4242 4242`, uma data futura e qualquer CVC. Pix e boleto devem ser habilitados em **Settings → Payment methods** no Stripe Dashboard. O sandbox Stripe associado ao projeto deve ser reivindicado antes de **1º de setembro de 2026** para permanecer disponível.

## NFE.io

Variáveis necessárias:

| Variável | Finalidade |
|---|---|
| `NFEIO_INVOICE_KEY` | Chave de Nota Fiscal, sem prefixo Bearer |
| `NFEIO_COMPANY_ID` | Empresa emissora cadastrada |
| `NFEIO_CITY_SERVICE_CODE` | Código municipal homologado pelo contador |

O adapter usa `POST https://api.nfe.io/v1/companies/{companyId}/serviceinvoices`. A NFE.io recomenda começar em ambiente Development e exige configuração da empresa, inscrição municipal e, em produção, certificado digital. A definição entre NFS-e e NF-e, o código do serviço, CNAE e retenções deve ser validada pelo contador antes de ativar emissão real.[4]

## E-mail

Variáveis opcionais:

| Variável | Finalidade |
|---|---|
| `RESEND_API_KEY` | Credencial do provedor de e-mail |
| `COMMERCE_FROM_EMAIL` | Remetente verificado, por exemplo `NexxusTECH <compras@dominio>` |

Sem essas variáveis, o sistema registra a confirmação como configuração pendente. O admin pode reenviar depois da configuração.

## Licenciamento

O webhook pago não cria uma chave falsa. Ele transforma a licença em `awaiting_vendor`. Em **Admin → Commerce**, o operador insere a chave recebida do fabricante, o link oficial de download e as instruções. Somente pedidos `paid` aceitam ativação. Estorno ou chargeback revoga o acesso.

## Checklist de produção

Antes de aceitar pagamentos reais, o responsável deve concluir a verificação da conta Stripe, habilitar os métodos desejados, testar o webhook, validar o documento fiscal com o contador, configurar o provedor de e-mail, homologar preço/quantidade e conectar uma fonte oficial de licenças. Depois, deve executar uma compra de baixo valor em ambiente de teste e verificar pedido, pagamento, entitlement, área do cliente e painel Commerce.

## Referências

[1]: https://docs.stripe.com/payments/pix "Stripe Docs — Pix payments"
[2]: https://docs.stripe.com/payments/boleto "Stripe Docs — Boleto payments"
[3]: https://docs.stripe.com/webhooks "Stripe Docs — Receive events"
[4]: https://nfe.io/docs/documentacao/nota-fiscal-servico-eletronica/primeiros-passos/ "NFE.io — Primeiros passos NFS-e"
