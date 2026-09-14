"use client";

import { FormEvent, startTransition, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import axios from "axios";
import {
  PAYMENT_MODE,
  capturePayPalOrder,
  confirmUpload,
  createPayPalOrder,
  fetchBrands,
  login,
  requestPresignUrls,
  setAuthToken,
  uploadToPresignedUrl,
  type Brand,
} from "../_lib/api";
import { config } from "../_lib/config";
import { clearAuth, getStoredToken, getStoredUser, saveAuth, type AuthUser } from "../_lib/auth";
import { FloatingChatWidget, NavMenuMark, cx, navCtaClass, navHeaderClass, navMenuClass, navPillClass } from "../components";
import { acceptedPhotoInputTypes, acceptedPhotoMimeTypes, brandTiers, categories, checkoutPhotoSlots, figma } from "../data";

const PAYPAL_CLIENT_ID = config.paypal.clientId;

const flowSteps = [
  { key: "brand", label: "Brand" },
  { key: "category", label: "Category" },
  { key: "nfc", label: "NFC" },
  { key: "upload", label: "Photos" },
  { key: "payment", label: "Payment" },
  { key: "done", label: "Success" },
] as const;

const emptySubscribe = () => () => {};

type CheckoutStep = "auth" | "brand" | "category" | "nfc" | "upload" | "payment" | "done";
type ServiceError = "auth-service" | "brand-service" | "upload-service" | "payment-service" | null;
type NfcMode = "with-nfc" | "without-nfc" | null;
type BrandFilter = "all" | "street";

const streetBrandNames = new Set(brandTiers.find((tier) => tier.label === "Street Brand")?.brands || []);
const acceptedPhotoMimeTypeSet = new Set<string>(acceptedPhotoMimeTypes);

function isRetryableServiceError(err: unknown) {
  if (!axios.isAxiosError(err)) return true;
  if (!err.response) return true;
  return err.response.status === 429 || err.response.status >= 500;
}

function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

function priceAmount(price: string | undefined) {
  const normalized = (price || "20").replace(/[^0-9.]/g, "");
  return normalized || "20";
}

function priceText(price: string | undefined) {
  return `$${priceAmount(price)}`;
}

function errorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    const msg = data?.error?.message || data?.message || data?.error || err.message;
    if (!err.response) return fallback;
    return typeof msg === "string" ? msg : fallback;
  }
  return err instanceof Error && err.message ? err.message : fallback;
}

function stepFromUrl(hasToken: boolean): CheckoutStep {
  if (typeof window === "undefined") return hasToken ? "brand" : "auth";
  const raw = new URLSearchParams(window.location.search).get("step");
  if (!raw) return hasToken ? "brand" : "auth";
  if (raw === "success") return hasToken ? "done" : "auth";
  if (raw === "done" || raw === "payment" || raw === "upload" || raw === "nfc" || raw === "category" || raw === "brand") {
    return hasToken ? raw : "auth";
  }
  return hasToken ? "brand" : "auth";
}

function initialToken() {
  return getStoredToken();
}

function initialUser() {
  return getStoredUser();
}

function initialStep() {
  return stepFromUrl(!!getStoredToken());
}

export default function CheckoutPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const [token, setToken] = useState<string | null>(initialToken);
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [step, setStep] = useState<CheckoutStep>(initialStep);
  const [stepDirection, setStepDirection] = useState<"forward" | "back">("forward");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [customBrand, setCustomBrand] = useState("");
  const [otherBrandOpen, setOtherBrandOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [nfcMode, setNfcMode] = useState<NfcMode>(null);
  const [photos, setPhotos] = useState<Record<string, File | null>>({});
  const [requestId, setRequestId] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState<ServiceError>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState("/");
  const loginSubmittingRef = useRef(false);

  const loadBrands = useCallback(async (force = false) => {
    if (!force && (brands.length > 0 || brandsLoading)) return;
    setBrandsLoading(true);
    setServiceError(null);
    setError("");
    try {
      const data = await fetchBrands();
      setBrands(data.filter((brand) => brand.isActive !== false));
    } catch (err) {
      setBrands([]);
      setServiceError("brand-service");
      setError(errorMessage(err, "Service unavailable. Please try again later."));
    } finally {
      setBrandsLoading(false);
    }
  }, [brands.length, brandsLoading]);

  useEffect(() => {
    if (token) setAuthToken(token);
  }, [token]);

  useEffect(() => {
    if (!hydrated || !token || step !== "brand") return;
    const timer = window.setTimeout(() => {
      void loadBrands();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hydrated, loadBrands, step, token]);

  const currentFlowIndex = flowSteps.findIndex((item) => item.key === step);
  const brandName = selectedBrand?.name || customBrand;
  const selectedPrice = priceText(selectedBrand?.price);
  const checkoutStarted = Boolean(token && (selectedBrand || customBrand || selectedCategory || nfcMode || Object.values(photos).some(Boolean) || requestId));

  const requiredPhotosReady = useMemo(
    () => checkoutPhotoSlots.filter((field) => field.required).every((field) => photos[field.key]),
    [photos],
  );

  useEffect(() => {
    if (!checkoutStarted || step === "done") return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const handlePopState = () => {
      window.history.pushState({ checkoutGuard: true }, "", window.location.href);
      setPendingHref("/");
      setLeaveOpen(true);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.history.pushState({ checkoutGuard: true }, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [checkoutStarted, step]);

  const goTo = useCallback((next: CheckoutStep) => {
    const from = flowSteps.findIndex((item) => item.key === step);
    const to = flowSteps.findIndex((item) => item.key === next);
    setStepDirection(to >= from ? "forward" : "back");
    startTransition(() => {
      setStep(next);
      setError("");
      setServiceError(null);
    });
  }, [step]);

  function guardedNavigate(href: string) {
    if (checkoutStarted && step !== "done") {
      setPendingHref(href);
      setLeaveOpen(true);
      return;
    }
    router.push(href, { transitionTypes: ["nav-back"] });
  }

  function confirmLeave() {
    setLeaveOpen(false);
    router.push(pendingHref, { transitionTypes: ["nav-back"] });
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    if (loginSubmittingRef.current) return;
    loginSubmittingRef.current = true;
    setLoading(true);
    setError("");
    setServiceError(null);
    try {
      const response = await login(email, password);
      setToken(response.accessToken);
      setUser(response.user);
      saveAuth(response.accessToken, response.user, false);
      goTo("brand");
    } catch (err) {
      if (isRetryableServiceError(err)) setServiceError("auth-service");
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("Invalid email or password.");
      } else {
        setError(errorMessage(err, "Sign in failed."));
      }
    } finally {
      loginSubmittingRef.current = false;
      setLoading(false);
    }
  }

  function handleLogout() {
    clearAuth();
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setBrands([]);
    setSelectedBrand(null);
    setCustomBrand("");
    setSelectedCategory("");
    setNfcMode(null);
    setPhotos({});
    setRequestId(null);
    setStep("auth");
  }

  function handleOtherBrand(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setSelectedBrand(null);
    setCustomBrand(trimmed);
    setOtherBrandOpen(false);
  }

  function handlePhotoChange(key: string, file: File | null) {
    setPhotos((current) => ({ ...current, [key]: file }));
  }

  async function handleUpload() {
    if (!brandName || !token || !selectedCategory || !nfcMode || !requiredPhotosReady) return;
    setLoading(true);
    setError("");
    setServiceError(null);
    try {
      const missingField = checkoutPhotoSlots.find((field) => !photos[field.key]);
      if (missingField) {
        throw new Error(`Please upload ${missingField.label}.`);
      }

      const invalidField = checkoutPhotoSlots.find((field) => {
        const file = photos[field.key];
        return file && !acceptedPhotoMimeTypeSet.has(file.type || "image/jpeg");
      });
      if (invalidField) {
        throw new Error(`${invalidField.label} must be a JPEG, PNG, WebP, HEIC, or HEIF image.`);
      }

      const photoTypes: string[] = [];
      const contentTypes: Record<string, string> = {};
      for (const field of checkoutPhotoSlots) {
        const file = photos[field.key];
        if (!file) continue;
        photoTypes.push(field.key);
        contentTypes[field.key] = file.type || "image/jpeg";
      }
      const presign = await requestPresignUrls({
        brand: brandName,
        model: selectedCategory,
        photoTypes,
        contentTypes,
        nfcData: nfcMode,
      });
      const uploadedKeys: Record<string, string> = {};
      await Promise.all(
        presign.uploadUrls.map(async ({ photoType, uploadUrl, key }) => {
          const file = photos[photoType];
          if (!file) return;
          await uploadToPresignedUrl(uploadUrl, file);
          uploadedKeys[photoType] = key;
        }),
      );
      await confirmUpload(presign.requestId, uploadedKeys);
      setRequestId(presign.requestId);
      goTo("payment");
    } catch (err) {
      setServiceError("upload-service");
      setError(errorMessage(err, "Upload is unavailable right now."));
    } finally {
      setLoading(false);
    }
  }

  const paymentFail = useCallback(() => {
    setServiceError("payment-service");
    setError("Payment is unavailable right now.");
  }, []);

  async function handleFakePayment() {
    if (!brandName || !requestId) return;
    setLoading(true);
    setError("");
    setServiceError(null);
    try {
      const order = await createPayPalOrder({ referenceId: requestId });
      await capturePayPalOrder({ orderId: order.orderId, referenceId: requestId });
      goTo("done");
    } catch {
      paymentFail();
    } finally {
      setLoading(false);
    }
  }

  const handlePayPalCreateOrder = useCallback(async () => {
    if (!brandName || !requestId) throw new Error("Missing checkout request.");
    setError("");
    setServiceError(null);
    const order = await createPayPalOrder({ referenceId: requestId });
    return order.orderId;
  }, [brandName, requestId]);

  const handlePayPalApprove = useCallback(
    async (data: { orderID: string }) => {
      if (!requestId) return;
      setLoading(true);
      setError("");
      setServiceError(null);
      try {
        await capturePayPalOrder({ orderId: data.orderID, referenceId: requestId });
        goTo("done");
      } catch {
        paymentFail();
      } finally {
        setLoading(false);
      }
    },
    [goTo, requestId, paymentFail],
  );

  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center bg-mc-cream px-4 text-mc-ink">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-mc-orange border-t-transparent" />
          <p className="mt-4 text-sm font-semibold text-mc-ink/60">Loading checkout</p>
        </div>
      </div>
    );
  }

  const stepClass = stepDirection === "forward" ? "nav-forward" : "nav-back";
  const checkoutUnavailable = Boolean(serviceError);

  return (
    <main className="min-h-screen bg-white text-mc-ink">
      <header className={navHeaderClass} style={{ viewTransitionName: "site-header" }}>
        <div className={navPillClass}>
          <NavMenuMark />
          <button type="button" onClick={() => guardedNavigate("/")} className="inline-flex items-center gap-2 text-black">
            <span className="relative h-[42px] w-[42px] sm:h-[54px] sm:w-[54px]">
              <Image src={figma.mark} alt="" fill sizes="54px" className="object-contain" />
            </span>
            <span className="font-logo text-base tracking-[0.08em] sm:text-xl">MODACERT</span>
          </button>
          <div className={navMenuClass}>
            <button type="button" onClick={() => guardedNavigate("/")} className="hidden md:inline">Home</button>
            <button type="button" onClick={() => guardedNavigate("/checkout")} className="hidden md:inline">Authenticate</button>
            <button type="button" onClick={() => guardedNavigate("/rates")} className="hidden md:inline">Rates</button>
            <span className="relative hidden h-5 w-5 md:inline-block">
              <Image src={figma.cart} alt="" fill sizes="20px" className="object-contain" />
            </span>
            {user ? <span className="hidden max-w-40 truncate text-mc-ink/65 lg:inline">{user.email}</span> : null}
            {token ? (
              <button type="button" onClick={handleLogout} className={navCtaClass}>
                Sign Out
              </button>
            ) : (
              <button type="button" onClick={() => guardedNavigate("/signin")} className={navCtaClass}>
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1265px] px-4 py-8 sm:px-6 lg:px-0">
        <div className="mb-10 overflow-hidden rounded-[2rem] bg-workflow-hero p-5 text-mc-ink shadow-auth-panel lg:rounded-[50px] lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <p className="font-auth text-lg text-mc-orange">Moda checkout</p>
              <h1 className="mt-2 font-auth text-4xl leading-none sm:text-6xl">True Luxury, Truly Verified</h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-mc-ink/65">
                Choose your brand, confirm your item, upload clear photos, and complete payment.
              </p>
            </div>
            <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {flowSteps.map((item, index) => {
                const isCurrent = item.key === step;
                const isPast = currentFlowIndex > index;
                return (
                  <li key={item.key} className="rounded-[1rem] bg-white/75 p-3 text-center shadow-auth-google">
                    <span className={cx("mx-auto grid h-8 w-8 place-items-center rounded-full text-xs font-bold", isCurrent && "bg-mc-orange text-white", isPast && "bg-black text-white", !isCurrent && !isPast && "bg-mc-nav-gray text-mc-ink/55")}>
                      {index + 1}
                    </span>
                    <p className="mt-2 text-[11px] font-bold text-mc-ink/65">{item.label}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {serviceError ? (
          <UnavailablePanel serviceError={serviceError} error={error} onRetry={() => {
            setServiceError(null);
            setError("");
            if (serviceError === "brand-service") {
              setBrands([]);
              void loadBrands(true);
            }
          }} />
        ) : null}

        {!checkoutUnavailable ? (
        <ViewTransition key={step} enter={stepClass} exit={stepClass} default="none">
          <div className="mx-auto max-w-[1190px]">
            {step === "auth" ? (
              <AuthStep email={email} password={password} error={error} loading={loading} onEmail={setEmail} onPassword={setPassword} onSubmit={handleLogin} />
            ) : null}

            {step === "brand" ? (
              <BrandStep brands={brands} loading={brandsLoading} selectedBrand={selectedBrand} customBrand={customBrand} onSelect={(brand) => {
                setSelectedBrand(brand);
                setCustomBrand("");
              }} onOther={() => setOtherBrandOpen(true)} onRetry={() => {
                setBrands([]);
                void loadBrands(true);
              }} onNext={() => brandName && goTo("category")} unavailable={serviceError === "brand-service"} />
            ) : null}

            {step === "category" ? (
              <CategoryStep selectedCategory={selectedCategory} onSelect={setSelectedCategory} onBack={() => goTo("brand")} onNext={() => selectedCategory && goTo("nfc")} />
            ) : null}

            {step === "nfc" ? (
              <NfcStep brandName={brandName} selectedCategory={selectedCategory} nfcMode={nfcMode} onSelect={setNfcMode} onBack={() => goTo("category")} onNext={() => nfcMode && goTo("upload")} />
            ) : null}

            {step === "upload" ? (
              <UploadStep brandName={brandName} selectedCategory={selectedCategory} nfcMode={nfcMode} photos={photos} loading={loading} canSubmit={requiredPhotosReady} onBack={() => goTo("nfc")} onPhotoChange={handlePhotoChange} onSubmit={handleUpload} />
            ) : null}

            {step === "payment" ? (
              <PaymentStep brandName={brandName} requestId={requestId} amount={selectedPrice} loading={loading} onBack={() => goTo("upload")} onFakePayment={handleFakePayment} onCreateOrder={handlePayPalCreateOrder} onApprove={handlePayPalApprove} onPaymentUnavailable={(message) => {
                setServiceError("payment-service");
                setError(message);
              }} />
            ) : null}

            {step === "done" ? (
              <DoneStep requestId={requestId} brandName={brandName} selectedCategory={selectedCategory} amount={selectedPrice} />
            ) : null}
          </div>
        </ViewTransition>
        ) : null}
      </section>

      {otherBrandOpen ? <OtherBrandDialog onClose={() => setOtherBrandOpen(false)} onSubmit={handleOtherBrand} /> : null}
      {leaveOpen ? <LeaveDialog onStay={() => setLeaveOpen(false)} onLeave={confirmLeave} /> : null}
      <FloatingChatWidget />
    </main>
  );
}

function UnavailablePanel({ serviceError, error, onRetry }: { serviceError: ServiceError; error: string; onRetry: () => void }) {
  const label = {
    "auth-service": "Sign in unavailable",
    "brand-service": "Brand list unavailable",
    "upload-service": "Upload unavailable",
    "payment-service": "Payment unavailable",
  }[serviceError || "brand-service"];

  return (
    <div className="mb-6 rounded-[1.2rem] border border-mc-orange/35 bg-mc-soft p-5 shadow-card">
      <h2 className="text-base font-bold text-mc-ink">{label}</h2>
      <p className="mt-1 text-sm leading-6 text-mc-ink/62">{error || "Try again in a moment."}</p>
      <button type="button" onClick={onRetry} className="mt-4 rounded-full bg-mc-orange px-5 py-2 text-sm font-bold text-white shadow-orange hover:bg-mc-orange-dark">
        Dismiss
      </button>
    </div>
  );
}

function AuthStep({ email, password, error, loading, onEmail, onPassword, onSubmit }: { email: string; password: string; error: string; loading: boolean; onEmail: (value: string) => void; onPassword: (value: string) => void; onSubmit: (event: FormEvent) => void }) {
  return (
    <section className="mx-auto grid max-w-5xl gap-6 rounded-[2rem] bg-white p-5 shadow-auth-panel lg:grid-cols-[0.9fr_1.1fr] lg:rounded-[50px] lg:p-8">
      <div className="relative min-h-[360px] overflow-hidden rounded-[1.6rem] bg-figma-panel lg:rounded-l-[50px] lg:rounded-r-none">
        <Image src={figma.hero} alt="ModaCert authentication" fill sizes="(min-width: 1024px) 30vw, 90vw" className="object-cover object-[58%_52%]" />
        <div className="absolute inset-0 bg-white/10" />
      </div>
      <form onSubmit={onSubmit} className="self-center p-2 lg:p-6">
        <p className="font-auth text-xl text-mc-orange">Sign in</p>
        <h2 className="mt-2 font-auth text-4xl leading-tight">Start your Moda Check</h2>
        <p className="mt-2 text-sm text-mc-ink/60">Please enter your details to continue authentication.</p>
        <label htmlFor="checkout-email" className="mt-6 block text-sm font-bold">Email Address</label>
        <input id="checkout-email" type="email" value={email} onChange={(event) => onEmail(event.target.value)} required className="mt-2 h-[46px] w-full rounded-[20px] bg-white px-5 text-sm shadow-auth-input outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-mc-orange/35" placeholder="My Email" />
        <label htmlFor="checkout-password" className="mt-4 block text-sm font-bold">Password</label>
        <input id="checkout-password" type="password" value={password} onChange={(event) => onPassword(event.target.value)} required className="mt-2 h-[46px] w-full rounded-[20px] bg-white px-5 text-sm shadow-auth-input outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-mc-orange/35" placeholder="Enter your password" />
        {error ? <p className="mt-4 rounded-[1rem] bg-mc-orange/10 px-4 py-3 text-sm font-semibold text-mc-orange-dark">{error}</p> : null}
        <button type="submit" disabled={loading} className="mt-6 h-[46px] w-full rounded-[20px] bg-black px-6 font-auth text-2xl text-white shadow-auth-input hover:bg-mc-brown disabled:opacity-55">
          {loading ? "Signing in" : "Sign in"}
        </button>
        <Link href="/signup" transitionTypes={["nav-forward"]} className="mt-5 block text-center text-sm font-bold text-mc-orange">
          New user? Create your account
        </Link>
      </form>
    </section>
  );
}

function BrandStep({
  brands,
  loading,
  selectedBrand,
  customBrand,
  unavailable,
  onSelect,
  onOther,
  onRetry,
  onNext,
}: {
  brands: Brand[];
  loading: boolean;
  selectedBrand: Brand | null;
  customBrand: string;
  unavailable: boolean;
  onSelect: (brand: Brand) => void;
  onOther: () => void;
  onRetry: () => void;
  onNext: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<BrandFilter>("all");
  const visibleBrands = brands;
  const filteredByTier = filter === "street" ? visibleBrands.filter((brand) => streetBrandNames.has(brand.name)) : visibleBrands;
  const filtered = search ? filteredByTier.filter((brand) => brand.name.toLowerCase().includes(search.toLowerCase())) : filteredByTier;

  return (
    <section>
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-auth text-2xl text-mc-orange">Choose your Brand</p>
        <h2 className="mt-3 font-auth text-4xl leading-tight sm:text-6xl">Let us know your brand before verification</h2>
        <div className="mx-auto mt-8 max-w-2xl rounded-full bg-white p-2 shadow-card">
          <div className="flex items-center gap-2 rounded-full border border-mc-muted px-5 py-2">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your brand" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-mc-ink/38" />
            <span className="grid h-10 w-10 place-items-center rounded-full bg-mc-orange text-lg font-bold text-white">⌕</span>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
        <button type="button" onClick={() => setFilter("all")} className={cx("rounded-[1rem] border px-5 py-4 text-sm font-bold shadow-card transition hover:-translate-y-0.5", filter === "all" ? "border-mc-orange bg-mc-orange text-white" : "border-mc-muted bg-white text-mc-ink")}>
          All Brand
        </button>
        <button type="button" onClick={() => setFilter("street")} className={cx("rounded-[1rem] border px-5 py-4 text-sm font-bold shadow-card transition hover:-translate-y-0.5", filter === "street" ? "border-mc-orange bg-mc-orange text-white" : "border-mc-muted bg-white text-mc-ink")}>
          Street Brand
        </button>
        <button type="button" onClick={onOther} className={cx("rounded-[1rem] border px-5 py-4 text-sm font-bold shadow-card transition hover:-translate-y-0.5", customBrand ? "border-mc-orange bg-mc-orange text-white" : "border-mc-muted bg-white text-mc-ink")}>
          <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-current/10 text-base">+</span>{" "}
          {customBrand || "Other Brands"}
          <span className="mt-1 block text-[11px] font-semibold opacity-70">Specify your brand here</span>
        </button>
      </div>

      {loading ? (
        <div className="mt-12 grid place-items-center rounded-[1.4rem] bg-white p-10 shadow-card">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-mc-orange border-t-transparent" />
          <p className="mt-4 text-sm font-semibold text-mc-ink/60">Loading brands</p>
        </div>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((brand) => (
            <button key={brand.id} type="button" onClick={() => onSelect(brand)} className={cx("min-h-28 rounded-[1rem] border px-4 py-4 text-center font-display text-xl shadow-card transition hover:-translate-y-0.5", selectedBrand?.id === brand.id ? "border-mc-orange bg-mc-orange text-white ring-2 ring-mc-orange ring-offset-2" : "border-white bg-white text-mc-ink hover:border-mc-orange")}>
              <span className="block">{brand.name}</span>
              <span className={cx("mt-2 block text-xs font-bold", selectedBrand?.id === brand.id ? "text-white/80" : "text-mc-orange")}>{priceText(brand.price)}</span>
            </button>
          ))}
        </div>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <div className="mx-auto mt-10 max-w-xl rounded-[1.4rem] bg-white p-8 text-center shadow-card">
          <h3 className="text-xl font-bold">Brand not found</h3>
          <p className="mt-2 text-sm leading-6 text-mc-ink/60">Add this as an other brand and our team will review it manually.</p>
          <button type="button" onClick={onOther} className="mt-5 rounded-full bg-mc-orange px-6 py-3 text-sm font-bold text-white shadow-orange hover:bg-mc-orange-dark">
            Add Other Brand
          </button>
        </div>
      ) : null}

      <div className="mt-10 flex justify-center">
        <button type="button" onClick={onNext} disabled={(!selectedBrand && !customBrand) || loading} className="rounded-full bg-mc-orange px-10 py-4 text-sm font-bold text-white shadow-orange hover:bg-mc-orange-dark disabled:opacity-55">
          Continue
        </button>
        {unavailable ? (
          <button type="button" onClick={onRetry} className="ml-3 rounded-full border border-mc-muted bg-white px-6 py-4 text-sm font-bold text-mc-ink hover:bg-mc-soft">
            Retry API
          </button>
        ) : null}
      </div>
    </section>
  );
}

function CategoryStep({ selectedCategory, onSelect, onBack, onNext }: { selectedCategory: string; onSelect: (category: string) => void; onBack: () => void; onNext: () => void }) {
  return (
    <section>
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-mc-orange font-auth text-3xl text-white">1</div>
        <p className="font-auth text-2xl text-mc-orange">Step 1</p>
        <h2 className="mt-3 font-auth text-4xl leading-tight sm:text-6xl">Tell us about your item</h2>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => (
          <button key={category.title} type="button" onClick={() => onSelect(category.title)} className={cx("group overflow-hidden rounded-[1.3rem] bg-white p-3 text-left shadow-card transition hover:-translate-y-1", selectedCategory === category.title && "ring-2 ring-mc-orange ring-offset-2")}>
            <div className="relative aspect-square overflow-hidden rounded-[1rem] bg-figma-panel">
              <Image src={category.image} alt={category.alt} fill sizes="(min-width: 1024px) 18vw, 42vw" className="object-contain p-4 transition duration-500 group-hover:scale-105" />
            </div>
            <p className="mt-3 text-center font-auth text-xl">{category.title}</p>
          </button>
        ))}
      </div>
      <StepActions onBack={onBack} onNext={onNext} nextDisabled={!selectedCategory} nextLabel="Submit" />
    </section>
  );
}

function NfcStep({ brandName, selectedCategory, nfcMode, onSelect, onBack, onNext }: { brandName: string; selectedCategory: string; nfcMode: NfcMode; onSelect: (mode: NfcMode) => void; onBack: () => void; onNext: () => void }) {
  return (
    <section>
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-mc-orange font-auth text-3xl text-white">2</div>
        <p className="font-auth text-2xl text-mc-orange">Step 2</p>
        <h2 className="mt-3 font-auth text-4xl leading-tight sm:text-6xl">NFC microchip</h2>
        <p className="mt-3 text-sm text-mc-ink/60">{brandName} · {selectedCategory}</p>
      </div>
      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <button type="button" onClick={() => onSelect("with-nfc")} className={cx("rounded-[1.6rem] bg-white p-6 text-left shadow-card transition hover:-translate-y-1", nfcMode === "with-nfc" && "ring-2 ring-mc-orange ring-offset-2")}>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-mc-orange text-sm font-bold text-white">1</span>
          <h3 className="mt-4 text-2xl font-bold">For items with visible NFC chips</h3>
          <p className="mt-3 text-sm leading-6 text-mc-ink/60">Scan the QR code using the NFC microchip scanner, then upload the required photos.</p>
          <QrPanel />
        </button>
        <button type="button" onClick={() => onSelect("without-nfc")} className={cx("rounded-[1.6rem] bg-white p-6 text-left shadow-card transition hover:-translate-y-1", nfcMode === "without-nfc" && "ring-2 ring-mc-orange ring-offset-2")}>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-mc-ink text-sm font-bold text-white">2</span>
          <h3 className="mt-4 text-2xl font-bold">My item has no NFC microchip</h3>
          <p className="mt-3 text-sm leading-6 text-mc-ink/60">Continue directly to photo upload. Required examples will guide each angle one by one.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {checkoutPhotoSlots.slice(0, 6).map((field) => (
              <PhotoExample key={field.key} field={field} />
            ))}
          </div>
        </button>
      </div>
      <StepActions onBack={onBack} onNext={onNext} nextDisabled={!nfcMode} />
    </section>
  );
}

function UploadStep({ brandName, selectedCategory, nfcMode, photos, loading, canSubmit, onBack, onPhotoChange, onSubmit }: { brandName: string; selectedCategory: string; nfcMode: NfcMode; photos: Record<string, File | null>; loading: boolean; canSubmit: boolean; onBack: () => void; onPhotoChange: (key: string, file: File | null) => void; onSubmit: () => void }) {
  if (!brandName || !selectedCategory || !nfcMode) {
    return <BlockedStep title="Photos not available" message="Complete brand, category, and NFC selection before uploading photos." />;
  }

  return (
    <section>
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-mc-orange font-auth text-3xl text-white">3</div>
        <p className="font-auth text-2xl text-mc-orange">Step 3</p>
        <h2 className="mt-3 font-auth text-4xl leading-tight sm:text-6xl">Upload the photos of your item one by one</h2>
        <p className="mt-3 text-sm text-mc-ink/60">{brandName} · {selectedCategory} · {nfcMode === "with-nfc" ? "Visible NFC chips" : "No NFC chips"}</p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {checkoutPhotoSlots.map((field) => (
          <article key={field.key} className="rounded-[1.3rem] bg-white p-4 shadow-card">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1rem] bg-figma-panel">
              <Image src={field.image} alt={field.label} fill sizes="(min-width: 1024px) 24vw, 80vw" className="object-cover" />
              <span className="absolute left-3 top-3 rounded-full bg-mc-ink px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white">Photo example</span>
            </div>
            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold">{field.label}</h3>
                <p className="mt-1 text-xs leading-5 text-mc-ink/58">{field.description}</p>
              </div>
              {field.required ? <span className="rounded-full bg-mc-orange/10 px-2 py-1 text-[10px] font-bold uppercase text-mc-orange-dark">Required</span> : null}
            </div>
            <label className="mt-4 block cursor-pointer rounded-full border border-dashed border-mc-orange/45 bg-mc-orange/5 px-4 py-3 text-center text-sm font-bold text-mc-orange hover:bg-mc-orange/10">
              <input type="file" accept={acceptedPhotoInputTypes} onChange={(event) => onPhotoChange(field.key, event.target.files?.[0] || null)} className="sr-only" />
              {photos[field.key]?.name ? photos[field.key]?.name.slice(0, 34) : "Upload photo"}
            </label>
          </article>
        ))}
      </div>
      <StepActions onBack={onBack} onNext={onSubmit} nextDisabled={loading || !canSubmit} nextLabel={loading ? "Submitting" : "Submit"} />
    </section>
  );
}

function PaymentStep({ brandName, requestId, amount, loading, onBack, onFakePayment, onCreateOrder, onApprove, onPaymentUnavailable }: { brandName: string; requestId: string | null; amount: string; loading: boolean; onBack: () => void; onFakePayment: () => void; onCreateOrder: () => Promise<string>; onApprove: (data: { orderID: string }) => Promise<void>; onPaymentUnavailable: (message: string) => void }) {
  if (!brandName || !requestId) {
    return <BlockedStep title="Payment not available" message="Upload photos successfully before payment is available." />;
  }

  return (
    <section className="mx-auto max-w-6xl">
      <div className="grid gap-0 overflow-hidden rounded-[2rem] bg-white shadow-auth-panel lg:grid-cols-[0.9fr_1.1fr] lg:rounded-[50px]">
        <div className="relative min-h-[460px] overflow-hidden bg-figma-rate p-6 text-white lg:rounded-l-[50px]">
          <Image src={figma.creditCard} alt="" fill sizes="(min-width: 1024px) 42vw, 90vw" className="object-contain object-left-bottom opacity-95" />
          <div className="absolute inset-0 bg-gradient-to-r from-mc-ink/70 via-mc-ink/20 to-transparent" />
          <div className="relative max-w-sm">
            <p className="font-auth text-xl text-mc-orange">{brandName}</p>
            <h2 className="mt-3 font-auth text-5xl leading-none">Payment Details</h2>
            <p className="mt-4 text-sm leading-6 text-white/72">{PAYMENT_MODE === "fake" ? "Use test payment to complete your authentication request while PayPal is unavailable." : "Choose an available payment method to complete your authentication request."}</p>
          </div>
        </div>
        <div className="self-center p-5 lg:p-8">
          <div className={`grid gap-3 ${PAYMENT_MODE === "fake" ? "grid-cols-1" : "grid-cols-3"}`}>
            {(PAYMENT_MODE === "fake" ? ["Test Payment"] : ["Card", "Apple Pay", "PayPal"]).map((method) => (
              <div key={method} className="rounded-[1rem] border border-mc-muted bg-white px-3 py-4 text-center text-xs font-bold text-mc-ink shadow-card">
                {method}
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[1.3rem] bg-mc-soft p-6 shadow-auth-google">
            <div className="flex items-center justify-between border-b border-mc-muted pb-4">
              <p className="text-sm font-bold text-mc-ink/55">Total Amount</p>
              <p className="text-4xl font-bold text-mc-orange">{amount}</p>
            </div>
            <dl className="mt-5 grid gap-3 text-sm">
              <DetailRow label="Service" value={`${brandName} authentication`} />
              <DetailRow label="Reference" value={requestId} />
              <DetailRow label="Currency" value="USD" />
            </dl>
            {PAYMENT_MODE === "fake" ? (
              <button type="button" onClick={onFakePayment} disabled={loading} className="mt-6 h-[56px] w-full rounded-[20px] bg-black px-6 font-auth text-2xl text-white shadow-auth-input hover:bg-mc-brown disabled:opacity-55">
                {loading ? "Processing" : `Test Pay ${amount}`}
              </button>
            ) : PAYPAL_CLIENT_ID ? (
              <div className="mt-6">
                <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD", intent: "capture" }}>
                  <PayPalButtons
                    style={{ layout: "vertical", color: "gold", shape: "pill", label: "pay" }}
                    createOrder={onCreateOrder}
                    onApprove={onApprove}
                    onError={() => onPaymentUnavailable("Payment is unavailable right now.")}
                  />
                </PayPalScriptProvider>
              </div>
            ) : (
              <div className="mt-6 rounded-[1rem] border border-mc-muted bg-white p-5 text-center">
                <p className="text-sm font-bold">Payment not available</p>
                <p className="mt-1 text-xs leading-5 text-mc-ink/55">Please try again later or contact support.</p>
              </div>
            )}
          </div>
          <button type="button" onClick={onBack} className="mt-5 rounded-full border border-mc-muted bg-white px-6 py-3 text-sm font-bold text-mc-ink hover:bg-mc-soft">
            Back to Upload
          </button>
        </div>
      </div>
    </section>
  );
}

function DoneStep({ requestId, brandName, selectedCategory, amount }: { requestId: string | null; brandName: string; selectedCategory: string; amount: string }) {
  return (
    <section className="mx-auto max-w-6xl">
      <div className="overflow-hidden rounded-[2rem] bg-white shadow-auth-panel lg:rounded-[50px]">
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-[360px] overflow-hidden bg-figma-rate p-6 text-white sm:p-8 lg:min-h-[520px] lg:rounded-l-[50px]">
            <Image src={figma.ctaBag} alt="" fill sizes="(min-width: 1024px) 42vw, 90vw" className="object-contain object-right-bottom opacity-95" />
            <div className="absolute inset-0 bg-gradient-to-r from-mc-ink/84 via-mc-ink/48 to-mc-ink/10" />
            <div className="relative flex min-h-[300px] flex-col justify-between lg:min-h-[456px]">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-white text-3xl font-bold text-mc-orange">✓</span>
              <div>
                <p className="font-auth text-xl text-mc-orange">Request submitted</p>
                <h2 className="mt-3 max-w-md font-auth text-5xl leading-none text-white sm:text-6xl">Thank you for your order</h2>
                <p className="mt-4 max-w-sm text-sm leading-6 text-white/76">Your payment is complete. ModaCert will review your submitted photos and prepare your authentication result.</p>
              </div>
            </div>
          </div>
          <div className="self-center p-5 sm:p-8">
            <div className="rounded-[1.4rem] bg-mc-soft p-5 shadow-auth-google">
              <h3 className="font-auth text-4xl leading-none text-mc-ink">Order details</h3>
              <div className="mt-6 grid gap-5 border-b border-mc-muted pb-6 sm:grid-cols-[112px_1fr] sm:items-center">
                <div className="relative aspect-square overflow-hidden rounded-[1rem] bg-white">
                  <Image src={figma.ctaBag} alt="" fill sizes="112px" className="object-contain p-3" />
                </div>
                <div>
                  <p className="text-xl font-bold">{selectedCategory || "Item"} authentication</p>
                  <p className="mt-2 text-sm text-mc-ink/62">Brand: {brandName || "Not available"}</p>
                  <p className="mt-1 text-sm text-mc-ink/62">Status: Submitted for expert review</p>
                </div>
              </div>
              <dl className="mt-5 grid gap-3 text-sm">
                <DetailRow label="Paid amount" value={`${amount} USD`} strong />
                {requestId ? <DetailRow label="Request ID" value={requestId} /> : null}
              </dl>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/" transitionTypes={["nav-back"]} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-mc-orange px-8 py-3 text-sm font-bold text-white shadow-orange hover:bg-mc-orange-dark">
                Go to homepage
              </Link>
              <button type="button" onClick={() => undefined} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-mc-muted bg-white px-8 py-3 text-sm font-bold text-mc-ink hover:bg-mc-soft">
                Stay here
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DetailRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={cx("text-mc-ink/58", strong && "text-base font-bold text-mc-ink")}>{label}</dt>
      <dd className={cx("text-right font-bold text-mc-ink", strong && "text-xl text-mc-orange")}>{value}</dd>
    </div>
  );
}

function StepActions({ onBack, onNext, nextDisabled, nextLabel = "Continue" }: { onBack: () => void; onNext: () => void; nextDisabled: boolean; nextLabel?: string }) {
  return (
    <div className="mt-10 flex justify-between gap-3">
      <button type="button" onClick={onBack} className="rounded-full bg-mc-nav-gray px-6 py-3 text-sm font-bold text-mc-ink hover:bg-mc-muted">
        Back
      </button>
      <button type="button" onClick={onNext} disabled={nextDisabled} className="rounded-full bg-black px-8 py-3 text-sm font-bold text-white shadow-auth-google hover:bg-mc-brown disabled:opacity-55">
        {nextLabel}
      </button>
    </div>
  );
}

function QrPanel() {
  return (
    <div className="mt-6 grid gap-4 rounded-[1.4rem] bg-figma-rate p-5 text-white sm:grid-cols-[0.85fr_1fr]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-mc-orange">NFC scanner</p>
        <p className="mt-3 text-sm leading-6 text-white/70">Open the scanner, tap the microchip, then return here to submit photos.</p>
      </div>
      <div className="mx-auto grid h-36 w-36 grid-cols-9 gap-1 rounded-[1rem] bg-white p-3">
        {Array.from({ length: 81 }).map((_, index) => (
          <span key={index} className={cx("rounded-[1px]", (index * 7 + index) % 5 < 2 ? "bg-mc-ink" : "bg-white")} />
        ))}
      </div>
    </div>
  );
}

function PhotoExample({ field }: { field: (typeof checkoutPhotoSlots)[number] }) {
  return (
    <div className="rounded-[1rem] bg-mc-cream p-2">
      <div className="relative aspect-square overflow-hidden rounded-[0.8rem] bg-figma-panel">
        <Image src={field.image} alt={field.label} fill sizes="160px" className="object-cover" />
      </div>
      <p className="mt-2 text-xs font-bold">{field.label}</p>
    </div>
  );
}

function BlockedStep({ title, message }: { title: string; message: string }) {
  return (
    <section className="mx-auto max-w-xl rounded-[1.4rem] border border-mc-muted bg-white p-8 text-center shadow-card">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-mc-ink/60">{message}</p>
      <Link href="/checkout" transitionTypes={["nav-back"]} className="mt-6 inline-flex rounded-full bg-mc-orange px-6 py-3 text-sm font-bold text-white shadow-orange">
        Restart checkout
      </Link>
    </section>
  );
}

function OtherBrandDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (brand: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-mc-ink/45 px-4 backdrop-blur-sm">
      <form onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value);
      }} className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-auth-panel lg:rounded-[50px] lg:p-10">
        <h2 className="font-auth text-5xl leading-tight">Tell me your brand</h2>
        <p className="mt-2 text-sm leading-6 text-mc-ink/60">Enter the exact brand name and our team will route it for review.</p>
        <input value={value} onChange={(event) => setValue(event.target.value)} autoFocus placeholder="Other brand name" className="mt-5 h-[56px] w-full rounded-full bg-white px-6 text-sm shadow-auth-input outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-mc-orange/30" />
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-mc-muted bg-white px-5 py-2.5 text-sm font-bold text-mc-ink hover:bg-mc-soft">
            Cancel
          </button>
          <button type="submit" disabled={!value.trim()} className="rounded-full bg-mc-orange px-5 py-2.5 text-sm font-bold text-white shadow-orange hover:bg-mc-orange-dark disabled:opacity-55">
            Use brand
          </button>
        </div>
      </form>
    </div>
  );
}

function LeaveDialog({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-mc-ink/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-6 text-center shadow-auth-panel lg:rounded-[50px]">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-mc-ink text-4xl font-bold">!</div>
        <h2 className="mt-5 font-auth text-4xl">You almost finished.</h2>
        <p className="mt-2 text-sm leading-6 text-mc-ink/60">Are you sure you want to leave this page?</p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={onLeave} className="rounded-full bg-mc-orange px-6 py-3 text-sm font-bold text-white shadow-orange hover:bg-mc-orange-dark">
            Leave
          </button>
          <button type="button" onClick={onStay} className="rounded-full border border-mc-muted bg-white px-6 py-3 text-sm font-bold text-mc-ink hover:bg-mc-soft">
            Stay
          </button>
        </div>
      </div>
    </div>
  );
}
