const apiPrefix = "/api/v1";
const apiMode = process.env.NEXT_PUBLIC_API_MODE === "proxy" ? "proxy" : "direct";
const userServiceUrl =
  apiMode === "proxy"
    ? ""
    : process.env.NEXT_PUBLIC_USER_SERVICE_URL || "http://localhost:3005";
const paymentServiceUrl =
  apiMode === "proxy"
    ? ""
    : process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || "http://localhost:3002";
const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
export type PaymentMode = "production" | "sandbox" | "fake";

const paymentMode = parsePaymentMode(process.env.NEXT_PUBLIC_PAYMENT_MODE);
const apiTimeoutMs = positiveInt(process.env.NEXT_PUBLIC_API_TIMEOUT_MS, 10000);
const apiRetryAttempts = positiveInt(process.env.NEXT_PUBLIC_API_RETRY_ATTEMPTS, 3);
const apiRetryDelayMs = positiveInt(process.env.NEXT_PUBLIC_API_RETRY_DELAY_MS, 1000);

function positiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function parsePaymentMode(value: string = "production"): PaymentMode {
  if (value === "paypal") return "production";
  if (value === "production" || value === "sandbox" || value === "fake") return value;
  throw new Error("NEXT_PUBLIC_PAYMENT_MODE must be production, sandbox, or fake");
}

export const config = {
  services: {
    user: userServiceUrl,
    payment: paymentServiceUrl,
  },
  api: {
    timeoutMs: apiTimeoutMs,
    retryAttempts: apiRetryAttempts,
    retryDelayMs: apiRetryDelayMs,
  },
  apiPrefix,
  apiMode,
  paypal: {
    clientId: paypalClientId,
  },
  paymentMode,
  endpoints: {
    auth: {
      login: "/auth/login",
      register: "/auth/register",
      refresh: "/auth/refresh",
      logout: "/auth/logout",
      me: "/auth/me",
      google: "/auth/google",
      googleCallback: "/auth/google/callback",
      googleLogin: "/auth/google/login",
    },
    brands: {
      list: "/brands",
      tiers: "/brands/tiers",
      models: (brandId: string) => `/brands/${brandId}/models`,
    },
    upload: {
      presign: "/upload/presign",
      confirm: "/upload/confirm",
    },
    payments: {
      paypal: {
        createOrder: "/payments/paypal/create-order",
        capture: "/payments/paypal/capture",
      },
    },
  },
} as const;
