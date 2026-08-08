import * as commerceDb from "./commerceDb";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] || character));
}

export async function queueAndSendOrderMessage(orderId: number, type: "order_created" | "payment_confirmed" | "license_ready" | "invoice_ready", recipientEmail: string) {
  const messageId = await commerceDb.createCommerceMessage({ orderId, messageType: type, recipientEmail, status: "pending" });
  return dispatchCommerceMessage(messageId);
}

export async function dispatchCommerceMessage(messageId: number) {
  const message = await commerceDb.getCommerceMessage(messageId);
  if (!message) throw new Error("Mensagem de comércio não encontrada.");
  const order = await commerceDb.getCommerceOrder(message.orderId);
  if (!order) throw new Error("Pedido da mensagem não encontrado.");
  const [items, licenses, invoice] = await Promise.all([
    commerceDb.getCommerceOrderItems(order.id),
    commerceDb.getOrderLicenses(order.id),
    commerceDb.getOrderInvoice(order.id),
  ]);

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.COMMERCE_FROM_EMAIL;
  if (!apiKey || !from) {
    await commerceDb.updateCommerceMessage(messageId, { status: "pending_configuration", errorMessage: "Configure RESEND_API_KEY e COMMERCE_FROM_EMAIL para envio." });
    return { sent: false, pendingConfiguration: true };
  }

  const orderLabel = order.orderNumber || `Pedido #${order.id}`;
  const title = message.messageType === "payment_confirmed" ? `Pagamento confirmado — ${orderLabel}`
    : message.messageType === "license_ready" ? `Sua licença está disponível — ${orderLabel}`
      : message.messageType === "invoice_ready" ? `Nota fiscal disponível — ${orderLabel}`
        : `Pedido recebido — ${orderLabel}`;
  const itemList = items.map((item) => `<li>${escapeHtml(item.productName)} — ${item.quantity} licença(s)</li>`).join("");
  const licenseText = licenses.some((license) => license.status === "active")
    ? "Sua licença oficial já pode ser acessada na área do cliente."
    : order.status === "paid" ? "Pagamento aprovado. A licença oficial aguarda provisionamento do fornecedor." : "O acesso será liberado somente após confirmação do pagamento.";
  const invoiceText = invoice?.status === "issued" ? "A nota fiscal está disponível na área do cliente." : "A emissão fiscal seguirá a configuração da empresa vendedora.";
  const html = `<div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6"><h1>${escapeHtml(title)}</h1><p>Status: <strong>${escapeHtml(order.status)}</strong></p><ul>${itemList}</ul><p>Total: <strong>R$ ${Number(order.totalAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></p><p>${escapeHtml(licenseText)}</p><p>${escapeHtml(invoiceText)}</p><p>Acesse sua conta em https://nexxustech.one/conta.</p></div>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [message.recipientEmail], subject: title, html }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error((payload as any)?.message || `HTTP ${response.status}`);
    await commerceDb.updateCommerceMessage(messageId, { status: "sent", externalId: (payload as any)?.id || null, errorMessage: null, sentAt: new Date() });
    return { sent: true, pendingConfiguration: false };
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    await commerceDb.updateCommerceMessage(messageId, { status: "failed", errorMessage: messageText.slice(0, 1000) });
    return { sent: false, pendingConfiguration: false, error: messageText };
  }
}
