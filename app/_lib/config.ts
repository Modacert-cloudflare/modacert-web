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
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

const apiTimeoutMs = positiveInt(process.env.NEXT_PUBLIC_API_TIMEOUT_MS, 10000);
const apiRetryAttempts = positiveInt(process.env.NEXT_PUBLIC_API_RETRY_ATTEMPTS, 3);
const apiRetryDelayMs = positiveInt(process.env.NEXT_PUBLIC_API_RETRY_DELAY_MS, 1000);

function positiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
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
  google: {
    clientId: googleClientId,
  },
  endpoints: {
    lead: "/lead",
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
    certificates: {
      retrieve: "/certificates/retrieve",
    },
    payments: {
      stripe: {
        createSession: "/payments/stripe/create-session",
        session: (sessionId: string) => `/payments/stripe/session/${encodeURIComponent(sessionId)}`,
      },
    },
  },
} as const;
