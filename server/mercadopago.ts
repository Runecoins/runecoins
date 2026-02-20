import { MercadoPagoConfig, Payment } from "mercadopago";

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || "";

if (!ACCESS_TOKEN) {
  console.warn("[MercadoPago] MERCADOPAGO_ACCESS_TOKEN nao configurada. Pagamentos nao funcionarao.");
}

const client = new MercadoPagoConfig({
  accessToken: ACCESS_TOKEN,
});

const paymentApi = new Payment(client);

interface MercadoPagoPixPayment {
  customerName: string;
  customerEmail: string;
  customerDocument: string;
  customerPhone: string;
  amountInCents: number;
  description: string;
  expiresInMinutes?: number;
}

export interface MercadoPagoPaymentResult {
  paymentId: string;
  status: string;
  pixQrCode: string;
  pixQrCodeBase64: string;
  ticketUrl: string;
}

export async function createPixPayment(data: MercadoPagoPixPayment): Promise<MercadoPagoPaymentResult> {
  const amount = data.amountInCents / 100;

  const nameParts = data.customerName.trim().split(/\s+/);
  const firstName = nameParts[0] || "Cliente";
  const lastName = nameParts.slice(1).join(" ") || "RuneCoins";

  const expirationDate = new Date();
  expirationDate.setMinutes(expirationDate.getMinutes() + (data.expiresInMinutes || 60));

  const notificationUrl = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}/api/webhooks/mercadopago`
    : process.env.REPLIT_DEPLOYMENT_URL
      ? `${process.env.REPLIT_DEPLOYMENT_URL}/api/webhooks/mercadopago`
      : undefined;

  const body: Record<string, unknown> = {
    transaction_amount: amount,
    description: data.description,
    payment_method_id: "pix",
    date_of_expiration: expirationDate.toISOString(),
    payer: {
      email: data.customerEmail,
      first_name: firstName,
      last_name: lastName,
      identification: {
        type: "CPF",
        number: data.customerDocument.replace(/\D/g, ""),
      },
    },
  };

  if (notificationUrl) {
    body.notification_url = notificationUrl;
  }

  const idempotencyKey = `runecoins-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const response = await paymentApi.create({
    body,
    requestOptions: {
      idempotencyKey,
    },
  });

  const transactionData = response.point_of_interaction?.transaction_data;

  return {
    paymentId: String(response.id || ""),
    status: response.status || "pending",
    pixQrCode: transactionData?.qr_code || "",
    pixQrCodeBase64: transactionData?.qr_code_base64 || "",
    ticketUrl: transactionData?.ticket_url || "",
  };
}

export async function getPaymentStatus(paymentId: string) {
  const response = await paymentApi.get({ id: paymentId });
  return {
    status: response.status || "pending",
    statusDetail: response.status_detail || "",
  };
}
