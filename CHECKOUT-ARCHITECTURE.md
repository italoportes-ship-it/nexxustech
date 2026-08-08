# Arquitetura do Checkout Digital

## Decisões autorizadas

O checkout usará a página hospedada pelo Stripe. O backend criará o pedido com preço final homologado, copiará um snapshot imutável dos itens e criará a Checkout Session. Cartão, Pix e boleto serão apresentados dinamicamente apenas quando estiverem habilitados e elegíveis na conta Stripe. A página de retorno nunca liberará acesso por conta própria; o webhook assinado será a autoridade para pagamento.

## Arquitetura de dados

| Entidade | Responsabilidade |
|---|---|
| Customers | Dados fiscais e contato do comprador, vinculados ao usuário autenticado |
| Orders | Total, status comercial, comprador, origem e timestamps |
| Order items | Snapshot de produto, plano, preço unitário, quantidade e total |
| Payments | IDs Stripe, método, status, valor e confirmação |
| Invoices | Status fiscal, provedor, número e referências de PDF/XML |
| Licenses | Entitlement, chave real opcional, download e instruções |
| Webhook events | ID Stripe único, tipo, hash e resultado do processamento |

## Pagamentos

O Checkout hospedado reduz o escopo de dados de cartão dentro da aplicação. Pix e boleto são métodos assíncronos; portanto, `checkout.session.completed` não será tratado isoladamente como pagamento liquidado. O sistema verificará `payment_status` e também processará eventos de pagamento concluído, falha, expiração, reembolso e contestação.[1] [2] [3]

O Boleto pode levar um dia útil para confirmação e não suporta reembolso pela própria modalidade; o pedido permanecerá pendente até o webhook de liquidação.[2]

## Fiscal

A integração fiscal será implementada por adapter. Sem credencial e definição contábil de NF-e/NFS-e, o pedido pago ficará com status fiscal `pending_configuration`, sem criar documento fictício. O adapter inicial será compatível com NFE.io e manterá a interface necessária para Focus NFe ou eNotas. Ambas as opções oferecem APIs estruturadas para documentos fiscais e notificações.[4] [5] [6]

## Licença e entrega

O pagamento aprovado criará um entitlement único e não previsível. Como não há API nem estoque de chaves oficiais do Ampler, o status inicial da licença será `awaiting_vendor`. O admin poderá inserir a chave real e o link oficial; somente então a área do cliente exibirá a ativação. Nenhuma chave que simule licenciamento real será fabricada.

## Segurança

O webhook continuará registrado antes de `express.json`, validará a assinatura Stripe sobre o body bruto e persistirá o ID do evento antes do processamento. IDs já registrados serão respondidos sem duplicar pagamento, licença, CRM, notificação ou nota. Dados completos de cartão, CVV, validade e payload bruto do webhook não serão armazenados.

## Referências

[1]: https://docs.stripe.com/payments/pix "Stripe Docs — Pix payments"
[2]: https://docs.stripe.com/payments/boleto "Stripe Docs — Boleto payments"
[3]: https://docs.stripe.com/webhooks "Stripe Docs — Receive events"
[4]: https://nfe.io/docs/ "NFE.io — Documentação"
[5]: https://app.enotasgw.com.br/docs "eNotas Gateway — API"
[6]: https://doc.focusnfe.com.br/ "Focus NFe — Documentação API"
