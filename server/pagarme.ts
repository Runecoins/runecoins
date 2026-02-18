import axios from "axios";

const PAGARME_API_URL = "https://api.pagar.me/core/v5";
const SECRET_KEY = process.env.PAGARME_SECRET_KEY || "";

if (!SECRET_KEY) {
  console.warn("[Pagar.me] PAGARME_SECRET_KEY nao configurada. Pagamentos nao funcionarao.");
}

const api = axios.create({
  baseURL: PAGARME_API_URL,
  auth: {
    username: SECRET_KEY,
    password: "",
  },
  headers: {
    "Content-Type": "application/json",
  },
});

interface PagarmePixPayment {
  customerName: string;
  customerEmail: string;
  customerDocument: string;
  customerPhone: string;
  amountInCents: number;
  description: string;
  expiresInSeconds?: number;
}

interface PagarmeCreditCardPayment {
  customerName: string;
  customerEmail: string;
  customerDocument: string;
  customerPhone: string;
  amountInCents: number;
  description: string;
  installments: number;
  cardNumber: string;
  cardHolderName: string;
  cardExpMonth: number;
  cardExpYear: number;
  cardCvv: string;
}

export interface PagarmeOrderResult {
  orderId: string;
  chargeId: string;
  status: string;
  pixQrCode?: string;
  pixQrCodeUrl?: string;
}

function parsePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const areaCode = digits.length >= 12 ? digits.slice(2, 4) : digits.slice(0, 2);
  const number = digits.length >= 12 ? digits.slice(4) : digits.slice(2);
  return {
    country_code: "55",
    area_code: areaCode || "11",
    number: number || "999999999",
  };
}

export async function createPixPayment(data: PagarmePixPayment): Promise<PagarmeOrderResult> {
  const phone = parsePhone(data.customerPhone);

  const orderData = {
    items: [
      {
        amount: data.amountInCents,
        description: data.description,
        quantity: 1,
        code: "COINS",
      },
    ],
    customer: {
      name: data.customerName,
      email: data.customerEmail,
      document: data.customerDocument,
      type: "individual",
      phones: {
        mobile_phone: phone,
      },
    },
    payments: [
      {
        payment_method: "pix",
        pix: {
          expires_in: data.expiresInSeconds || 3600,
        },
      },
    ],
  };

  const response = await api.post("/orders", orderData);
  const order = response.data;
  const charge = order.charges?.[0];
  const transaction = charge?.last_transaction;

  return {
    orderId: order.id,
    chargeId: charge?.id || "",
    status: order.status,
    pixQrCode: transaction?.qr_code || "",
    pixQrCodeUrl: transaction?.qr_code_url || "",
  };
}

export async function createCreditCardPayment(data: PagarmeCreditCardPayment): Promise<PagarmeOrderResult> {
  const phone = parsePhone(data.customerPhone);

  const orderData = {
    items: [
      {
        amount: data.amountInCents,
        description: data.description,
        quantity: 1,
        code: "COINS",
      },
    ],
    customer: {
      name: data.customerName,
      email: data.customerEmail,
      document: data.customerDocument,
      type: "individual",
      phones: {
        mobile_phone: phone,
      },
    },
    payments: [
      {
        payment_method: "credit_card",
        credit_card: {
          installments: data.installments,
          card: {
            number: data.cardNumber,
            holder_name: data.cardHolderName,
            exp_month: data.cardExpMonth,
            exp_year: data.cardExpYear,
            cvv: data.cardCvv,
          },
        },
      },
    ],
  };

  const response = await api.post("/orders", orderData);
  const order = response.data;
  const charge = order.charges?.[0];

  return {
    orderId: order.id,
    chargeId: charge?.id || "",
    status: order.status,
  };
}

export async function getOrderStatus(pagarmeOrderId: string) {
  const response = await api.get(`/orders/${pagarmeOrderId}`);
  return {
    status: response.data.status,
    charges: response.data.charges,
  };
}
