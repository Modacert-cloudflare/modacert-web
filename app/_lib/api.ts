import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { clearAuth, getStoredToken, type AuthUser } from "./auth";
import { config } from "./config";

const userApi = axios.create({
  baseURL: `${config.services.user}${config.apiPrefix}`,
  timeout: config.api.timeoutMs,
});
const paymentApi = axios.create({
  baseURL: `${config.services.payment}${config.apiPrefix}`,
  timeout: config.api.timeoutMs,
});

type LoadingListener = (active: boolean) => void;
type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retryCount?: number;
};

const authEntryEndpoints: ReadonlySet<string> = new Set([
  config.endpoints.auth.login,
  config.endpoints.auth.google,
  config.endpoints.auth.googleCallback,
  config.endpoints.auth.googleLogin,
]);

let activeRequests = 0;
let listeners: LoadingListener[] = [];

function notifyListeners() {
  const active = activeRequests > 0;
  listeners.forEach((fn) => fn(active));
}

export function onApiLoadingChange(fn: LoadingListener): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

function hasUnauthorizedMarker(value: unknown): boolean {
  return typeof value === "string" && value.toLowerCase() === "unauthorized";
}

function isUnauthorizedError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const url = error.config?.url || "";
  if (url.includes("/auth/login")) return false;
  const status = error.response?.status;
  if (status === 401) return true;
  const data = error.response?.data;
  if (
    hasUnauthorizedMarker(data?.code) ||
    hasUnauthorizedMarker(data?.status) ||
    hasUnauthorizedMarker(data?.error?.code)
  ) {
    return true;
  }
  const msg: string = (
    data?.error?.message ||
    data?.message ||
    data?.error ||
    ""
  ).toLowerCase();
  return (
    msg === "unauthorized" ||
    msg.includes("token expired") ||
    msg.includes("jwt expired") ||
    msg.includes("token invalid")
  );
}

function redirectToSignIn() {
  if (typeof window === "undefined") return;
  clearAuth();
  setAuthToken(null);
  if (window.location.pathname === "/signin") return;
  window.location.href = "/signin";
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  if (status !== undefined) {
    return status === 408 || status === 429 || status >= 500;
  }
  return error.code === "ECONNABORTED" || error.code === "ERR_NETWORK" || !error.response;
}

function isAuthEntryRequest(url: string | undefined): boolean {
  if (!url) return false;
  const path = new URL(url, "http://local").pathname;
  return authEntryEndpoints.has(path) || [...authEntryEndpoints].some((endpoint) => path === `${config.apiPrefix}${endpoint}`);
}

async function retryRequest(api: AxiosInstance, error: unknown) {
  if (!axios.isAxiosError(error) || !error.config || !isRetryableError(error) || isAuthEntryRequest(error.config.url)) {
    return Promise.reject(error);
  }

  const requestConfig = error.config as RetryableRequestConfig;
  const retryCount = requestConfig._retryCount || 0;
  const maxRetries = Math.max(0, config.api.retryAttempts - 1);
  if (retryCount >= maxRetries) return Promise.reject(error);

  requestConfig._retryCount = retryCount + 1;
  if (config.api.retryDelayMs > 0) await wait(config.api.retryDelayMs);
  return api.request(requestConfig);
}

[userApi, paymentApi].forEach((api) => {
  api.interceptors.request.use((config) => {
    activeRequests++;
    notifyListeners();
    return config;
  });
  api.interceptors.response.use(
    (res) => {
      activeRequests = Math.max(0, activeRequests - 1);
      notifyListeners();
      return res;
    },
    (error) => {
      activeRequests = Math.max(0, activeRequests - 1);
      notifyListeners();
      if (isRetryableError(error)) return retryRequest(api, error);
      if (isUnauthorizedError(error)) redirectToSignIn();
      return Promise.reject(error);
    },
  );
});

export function setAuthToken(token: string | null) {
  if (token) {
    userApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    paymentApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete userApi.defaults.headers.common["Authorization"];
    delete paymentApi.defaults.headers.common["Authorization"];
  }
}

if (typeof window !== "undefined") {
  const restored = getStoredToken();
  if (restored) setAuthToken(restored);
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  price: string;
  isActive: boolean;
  models?: Model[];
}

export interface Model {
  id: string;
  name: string;
  slug: string;
  category: string;
  hasNfcSupport: boolean;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

type AuthResponseData = {
  data?: {
    tokens?: { accessToken?: string };
    accessToken?: string;
    token?: string;
    user?: AuthUser;
  };
  accessToken?: string;
  token?: string;
  user?: AuthUser;
};

function parseAuthResponse(data: AuthResponseData): LoginResponse {
  const token =
    data?.data?.tokens?.accessToken ||
    data?.data?.accessToken ||
    data?.accessToken ||
    data?.token;
  const user = data?.data?.user || data?.user;
  if (!token || !user) throw new Error("No token in response");
  setAuthToken(token);
  return { accessToken: token, user };
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  country: string;
  countryCode: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const { data } = await userApi.post(config.endpoints.auth.login, { email, password });
  return parseAuthResponse(data);
}

export async function register(
  payload: RegisterPayload
): Promise<LoginResponse | { success: true }> {
  const { data } = await userApi.post(config.endpoints.auth.register, payload);

  if (data?.data?.tokens?.accessToken || data?.accessToken || data?.token) {
    return parseAuthResponse(data);
  }

  if (data?.success === false) {
    throw new Error(data?.error?.message || data?.message || "Registration failed");
  }

  return { success: true };
}

export async function getGoogleAuthUrl(): Promise<string> {
  const { data } = await userApi.get(config.endpoints.auth.google);
  const url = data?.data?.url || data?.url;
  if (!url) throw new Error("No Google auth URL in response");
  return url;
}

export async function exchangeGoogleCode(code: string): Promise<LoginResponse> {
  const { data } = await userApi.post(config.endpoints.auth.googleCallback, { code });
  return parseAuthResponse(data);
}

export async function fetchBrands(): Promise<Brand[]> {
  const { data } = await userApi.get(config.endpoints.brands.list);
  const brands = data?.data ?? data;
  if (!Array.isArray(brands)) throw new Error("Invalid brands response");
  return brands;
}

export async function fetchBrandModels(brandId: string): Promise<Model[]> {
  const { data } = await userApi.get(config.endpoints.brands.models(brandId));
  const models = data?.data ?? data;
  if (!Array.isArray(models)) throw new Error("Invalid models response");
  return models;
}

export interface PresignResponse {
  requestId: string;
  uploadUrls: Array<{ photoType: string; uploadUrl: string; key: string }>;
}

export async function requestPresignUrls(payload: {
  brand: string;
  model: string;
  photoTypes: string[];
  contentTypes: Record<string, string>;
  nfcData?: string;
}): Promise<PresignResponse> {
  const { data } = await userApi.post(config.endpoints.upload.presign, payload);
  if (!data?.success) throw new Error(data?.error?.message || "Presign failed");
  return data.data;
}

export async function uploadToPresignedUrl(
  url: string,
  file: File
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type || "image/jpeg" },
    });
  } catch (error) {
    throw new Error(error instanceof Error ? `Upload failed: ${error.message}` : "Upload failed");
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Upload failed (${response.status}): ${body || response.statusText}`);
  }
}

export async function confirmUpload(
  requestId: string,
  uploadedKeys?: Record<string, string>
): Promise<{ status: string }> {
  const { data } = await userApi.post(config.endpoints.upload.confirm, { requestId, uploadedKeys });
  if (!data?.success) throw new Error(data?.error?.message || "Confirm failed");
  return data.data;
}

export interface CreateOrderResponse {
  orderId: string;
  status: string;
  approvalUrl?: string;
}

export interface CreateOrderPayload {
  referenceId: string;
}

export async function createPayPalOrder(
  payload: CreateOrderPayload
): Promise<CreateOrderResponse> {
  const { data } = await paymentApi.post(
    config.endpoints.payments.paypal.createOrder,
    payload
  );
  if (!data?.success)
    throw new Error(data?.error?.message || "Order creation failed");
  return data.data;
}

export async function capturePayPalOrder(payload: {
  orderId: string;
  referenceId: string;
}): Promise<{ status: string; paypalStatus: string; queued?: boolean; queueMessageId?: string }> {
  const { data } = await paymentApi.post(
    config.endpoints.payments.paypal.capture,
    payload
  );
  if (!data?.success) throw new Error(data?.error?.message || "Capture failed");
  return data.data;
}

export const PAYMENT_MODE = config.paymentMode;
