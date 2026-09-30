"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import axios from "axios";
import { PAYMENT_MODE, capturePayPalOrder, confirmUpload, createPayPalOrder, fetchBrands, login, requestPresignUrls, setAuthToken, uploadToPresignedUrl, type Brand, type PresignResponse } from "../_lib/api";
import { config } from "../_lib/config";
import { clearAuth, getStoredToken, getStoredUser, saveAuth, type AuthUser } from "../_lib/auth";
import { cx } from "../components";
import Pattern from "@/components/ui/c-progress-7";
import { acceptedPhotoInputTypes, acceptedPhotoMimeTypes, categories, checkoutPhotoSlots, type PhotoSlot } from "../data";

const emptySubscribe = () => () => {};
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const allowedTypes = new Set<string>(acceptedPhotoMimeTypes);
type Step = "auth" | "brand" | "category" | "nfc" | "upload" | "payment" | "done";
type NfcMode = "with-nfc" | "without-nfc" | null;

function useHydrated() { return useSyncExternalStore(emptySubscribe, () => true, () => false); }
function formatPrice(value: string | number | null | undefined) {
  const amount = Number(value);
  return value != null && Number.isFinite(amount) && amount >= 0 ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount) : null;
}
function messageFromError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    if (!error.response) return fallback;
    const data = error.response.data;
    return data?.error?.message || data?.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export default function CheckoutPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [step, setStep] = useState<Step>(() => getStoredToken() ? "brand" : "auth");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandRetry, setBrandRetry] = useState(0);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [nfcMode, setNfcMode] = useState<NfcMode>(null);
  const [photos, setPhotos] = useState<Record<string, File | null>>({});
  const [photoError, setPhotoError] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [confirmedPrice, setConfirmedPrice] = useState<string | number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState("/");
  const pendingUpload = useRef<PresignResponse | null>(null);
  const uploadedKeys = useRef<Record<string, string>>({});
  const submitting = useRef(false);
  const price = formatPrice(confirmedPrice ?? selectedBrand?.price);
  const started = Boolean(token && (selectedBrand || selectedCategory || nfcMode || Object.values(photos).some(Boolean) || requestId));
  const photoCount = checkoutPhotoSlots.filter((slot) => photos[slot.key]).length;
  const requiredPhotosReady = useMemo(() => checkoutPhotoSlots.every((slot) => photos[slot.key]), [photos]);

  useEffect(() => { setAuthToken(token); }, [token]);
  useEffect(() => {
    if (!hydrated || !token || step !== "brand") return;
    let cancelled = false;
    fetchBrands().then((items) => {
      if (cancelled) return;
      const active = items.filter((item) => item.isActive !== false);
      setBrands(active);
      const id = new URLSearchParams(window.location.search).get("brand");
      if (id) setSelectedBrand((current) => current ?? active.find((item) => item.id === id) ?? null);
      setError("");
    }).catch((cause) => { if (!cancelled) setError(messageFromError(cause, "Brands are unavailable. Try again.")); }).finally(() => { if (!cancelled) setBrandsLoading(false); });
    return () => { cancelled = true; };
  }, [hydrated, token, step, brandRetry]);
  useEffect(() => {
    if (!started || step === "done") return;
    const onUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [started, step]);

  function goTo(next: Step) { setStep(next); setError(""); window.scrollTo({ top: 0, behavior: "instant" }); }
  function navigate(href: string) {
    if (started && step !== "done") { setPendingHref(href); setLeaveOpen(true); return; }
    router.push(href);
  }
  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true; setLoading(true); setError("");
    try {
      const response = await login(email, password);
      saveAuth(response.accessToken, response.user, false);
      setToken(response.accessToken); setUser(response.user); goTo("brand");
    } catch (cause) { setError(messageFromError(cause, "Sign in failed. Check your connection and try again.")); }
    finally { submitting.current = false; setLoading(false); }
  }
  function logout() {
    clearAuth(); setAuthToken(null); setToken(null); setUser(null); setSelectedBrand(null);
    setSelectedCategory(""); setNfcMode(null); setPhotos({}); setRequestId(null); setConfirmedPrice(null);
    pendingUpload.current = null; uploadedKeys.current = {}; setPaymentCompleted(false); goTo("auth");
  }
  function invalidateSubmission() {
    pendingUpload.current = null; uploadedKeys.current = {}; setUploadedCount(0); setRequestId(null); setConfirmedPrice(null);
  }
  function setPhoto(key: string, file: File | null) {
    if (file && !allowedTypes.has(file.type)) { setPhotoError("Choose a JPEG, PNG, WebP, HEIC or HEIF image."); return; }
    if (file && (file.size === 0 || file.size > MAX_PHOTO_BYTES)) { setPhotoError("Each photo must be smaller than 10 MB. Choose a smaller image and try again."); return; }
    setPhotoError(""); setPhotos((current) => ({ ...current, [key]: file }));
    invalidateSubmission();
  }
  async function handleUpload() {
    if (submitting.current || !token || !selectedBrand || !selectedCategory || !nfcMode || !requiredPhotosReady) return;
    submitting.current = true; setLoading(true); setError("");
    try {
      if (!pendingUpload.current) {
        const photoTypes = checkoutPhotoSlots.map((slot) => slot.key);
        const contentTypes: Record<string, string> = Object.fromEntries(photoTypes.map((type) => [type, photos[type]!.type]));
        pendingUpload.current = await requestPresignUrls({ brand: selectedBrand.name, model: selectedCategory, photoTypes, contentTypes, nfcData: nfcMode });
        if (pendingUpload.current.price != null) setConfirmedPrice(pendingUpload.current.price);
      }
      const presign = pendingUpload.current;
      const outcomes = await Promise.allSettled(presign.uploadUrls.filter(({ photoType }) => !uploadedKeys.current[photoType]).map(async ({ photoType, uploadUrl, key }) => {
        const file = photos[photoType];
        if (!file) throw new Error(`Missing ${photoType} photo.`);
        await uploadToPresignedUrl(uploadUrl, file);
        uploadedKeys.current[photoType] = key;
        setUploadedCount(Object.keys(uploadedKeys.current).length);
      }));
      if (outcomes.some((outcome) => outcome.status === "rejected")) throw new Error("Some photos did not upload. Your selected photos are still here. Check your connection and retry.");
      const confirmation = await confirmUpload(presign.requestId, uploadedKeys.current);
      if (confirmation.price != null) setConfirmedPrice(confirmation.price);
      setRequestId(presign.requestId); goTo("payment");
    } catch (cause) { setError(messageFromError(cause, "Upload failed. Check your connection and retry.")); }
    finally { submitting.current = false; setLoading(false); }
  }
  async function handleFakePayment() {
    if (submitting.current || !requestId) return;
    submitting.current = true; setLoading(true); setError("");
    try {
      const order = await createPayPalOrder({ referenceId: requestId });
      await capturePayPalOrder({ orderId: order.orderId, referenceId: requestId });
      setPaymentCompleted(true); goTo("done");
    } catch (cause) { setError(messageFromError(cause, "Payment could not be completed. Try again or contact support.")); }
    finally { submitting.current = false; setLoading(false); }
  }
  const createPayPal = useCallback(async () => {
    if (!requestId) throw new Error("No submitted request.");
    const order = await createPayPalOrder({ referenceId: requestId });
    return order.orderId;
  }, [requestId]);
  const approvePayPal = useCallback(async (data: { orderID: string }) => {
    if (!requestId) return;
    setLoading(true); setError("");
    try { await capturePayPalOrder({ orderId: data.orderID, referenceId: requestId }); setPaymentCompleted(true); setStep("done"); }
    catch (cause) { setError(messageFromError(cause, "Payment could not be completed. Try again or contact support.")); }
    finally { setLoading(false); }
  }, [requestId]);

  if (!hydrated) return <main className="grid min-h-screen place-items-center bg-mc-soft"><p role="status">Loading checkout…</p></main>;
  const stage = step === "brand" || step === "category" || step === "nfc" ? 0 : step === "upload" ? 1 : step === "payment" ? 2 : step === "done" ? 3 : -1;
  const checkoutSteps = ["Brand & item", "Photos", "Payment", "Done"].map((label, index) => ({ label, completed: stage === 3 || index < stage }));
  return <main id="main-content" className="min-h-screen bg-mc-soft text-mc-ink">
    <header className="border-b border-mc-muted bg-white"><div className="mx-auto flex h-[68px] max-w-5xl items-center justify-between px-4 sm:px-6"><button type="button" onClick={() => navigate("/")} className="min-h-11 font-logo text-lg tracking-[0.08em]">MODACERT</button><div className="flex gap-3"><button type="button" onClick={() => navigate("/rates")} className="min-h-11 px-2 text-sm">Pricing</button>{user ? <button type="button" onClick={logout} className="min-h-11 px-2 text-sm">Sign out</button> : null}</div></div></header>
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 lg:pt-10">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium text-mc-brown">{step === "auth" ? "Sign in to begin" : step === "done" ? "Submission complete" : `Step ${stage + 1} of 4`}</p><h1 className="mt-1 font-display text-3xl leading-tight sm:text-4xl">{step === "auth" ? "Start authentication" : step === "brand" ? "Choose your brand" : step === "category" ? "Choose your item" : step === "nfc" ? "Does your item have an NFC chip?" : step === "upload" ? "Add your item photos" : step === "payment" ? "Review and pay" : "Your item is submitted"}</h1></div>{selectedBrand && step !== "done" ? <p className="text-sm font-semibold">{selectedBrand.name}{price ? ` · ${price}` : ""}</p> : null}</div>
      {stage >= 0 ? <Pattern steps={checkoutSteps} title="Authentication progress" currentStep={stage} className="mt-6" /> : null}
      {error ? <div role="alert" className="mt-5 rounded-lg border border-mc-orange-dark bg-white p-4 text-sm"><p>{error}</p>{step === "brand" ? <button type="button" onClick={() => { setError(""); setBrandRetry((value) => value + 1); }} className="mt-2 min-h-11 font-semibold underline">Retry brands</button> : null}</div> : null}
      {step === "auth" ? <form onSubmit={handleLogin} className="mt-7 max-w-lg rounded-xl bg-white p-5 sm:p-7"><p className="text-sm text-mc-form-muted">Sign in to keep your request linked to your account.</p><label htmlFor="checkout-email" className="mt-5 block text-sm font-semibold">Email address</label><input id="checkout-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-12 w-full rounded-lg border border-mc-muted px-4 text-base" /><label htmlFor="checkout-password" className="mt-4 block text-sm font-semibold">Password</label><input id="checkout-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 min-h-12 w-full rounded-lg border border-mc-muted px-4 text-base" /><button type="submit" disabled={loading} className="mt-6 min-h-12 w-full rounded-lg bg-mc-orange px-5 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Signing in…" : "Sign in and continue"}</button><Link href="/signup" className="mt-4 flex min-h-11 items-center justify-center text-sm font-semibold underline">Create an account</Link></form> : null}
      {step === "brand" ? <section className="mt-7"><p className="max-w-xl text-sm leading-6 text-mc-form-muted">Choose a supported brand. The listed price comes from our current catalog.</p><BrandPicker brands={brands} selected={selectedBrand} loading={brandsLoading} onSelect={(brand) => { setSelectedBrand(brand); invalidateSubmission(); }} /><div className="mt-7 flex justify-end"><button type="button" disabled={!selectedBrand || brandsLoading} onClick={() => goTo("category")} className="min-h-12 w-full rounded-lg bg-mc-orange px-6 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto">Continue to item</button></div></section> : null}
      {step === "category" ? <section className="mt-7"><p className="text-sm text-mc-form-muted">Select the closest category for your item.</p><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{categories.map((category) => <button type="button" key={category.title} onClick={() => { setSelectedCategory(category.title); invalidateSubmission(); }} aria-pressed={selectedCategory === category.title} className={cx("flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border bg-white p-3 text-sm font-semibold", selectedCategory === category.title ? "border-mc-orange ring-2 ring-mc-orange" : "border-mc-muted")}><Image src={category.image} alt="" width={55} height={55} sizes="55px" className="h-12 w-12 object-contain" />{category.title}</button>)}</div><StepActions back={() => goTo("brand")} next={() => goTo("nfc")} disabled={!selectedCategory} label="Continue to item details" /></section> : null}
      {step === "nfc" ? <section className="mt-7 max-w-2xl"><p className="text-sm leading-6 text-mc-form-muted">Choose whether your item has a visible NFC chip. No scanner is needed for this submission.</p><div className="mt-5 grid gap-3">{([["with-nfc", "My item has an NFC chip"], ["without-nfc", "My item has no NFC chip"]] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={nfcMode === value} onClick={() => { setNfcMode(value); invalidateSubmission(); }} className={cx("min-h-16 rounded-lg border bg-white px-5 text-left text-sm font-semibold", nfcMode === value ? "border-mc-orange ring-2 ring-mc-orange" : "border-mc-muted")}>{label}</button>)}</div><StepActions back={() => goTo("category")} next={() => goTo("upload")} disabled={!nfcMode} label="Continue to photos" /></section> : null}
      {step === "upload" ? <section className="mt-7"><div className="flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-xl font-semibold">Ten views, one clear review</h2><p className="mt-1 text-sm text-mc-form-muted">Use bright, even light. JPEG, PNG, WebP, HEIC or HEIF. Maximum 10 MB each.</p></div><p role="status" className="text-sm font-semibold">{photoCount} of {checkoutPhotoSlots.length} photos added{loading ? ` · ${uploadedCount} uploaded` : ""}</p></div>{photoError ? <p role="alert" className="mt-4 rounded-md bg-white p-3 text-sm text-mc-orange-dark">{photoError}</p> : null}<div className="mt-5 grid gap-3 sm:grid-cols-2">{checkoutPhotoSlots.map((slot) => <PhotoInput key={slot.key} slot={slot} file={photos[slot.key]} disabled={loading} onSelect={(file) => setPhoto(slot.key, file)} />)}</div><p className="mt-5 text-sm text-mc-form-muted">Your chosen photos stay here if an upload fails. Keep this page open while submitting.</p><StepActions back={() => goTo("nfc")} next={handleUpload} disabled={!requiredPhotosReady || loading} label={loading ? `Uploading ${uploadedCount} of 10…` : "Submit photos"} /></section> : null}
      {step === "payment" && requestId && selectedBrand ? <section className="mt-7 grid gap-7 lg:grid-cols-[1fr_1fr]"><div><h2 className="text-xl font-semibold">What you’re buying</h2><dl className="mt-5 divide-y divide-mc-muted border-y border-mc-muted text-sm"><Detail label="Brand" value={selectedBrand.name} /><Detail label="Item" value={selectedCategory} /><Detail label="Service" value="Expert photo authentication" /><Detail label="Result" value="Digital result and certificate" /><Detail label="Request ID" value={requestId} /></dl><p className="mt-5 text-sm leading-6 text-mc-form-muted">Review begins after payment. Timing varies with the item and photo quality. If more detail is needed, the specialist may request more photos.</p></div><div className="self-start rounded-xl border border-mc-muted bg-white p-5 sm:p-7"><div className="flex justify-between gap-3 border-b border-mc-muted pb-5"><span className="font-semibold">Total in USD</span><strong className="text-2xl">{price ?? "Confirming price"}</strong></div>{PAYMENT_MODE === "fake" ? <><p className="mt-5 text-sm text-mc-form-muted">Test payment. You will not be charged.</p><button type="button" disabled={loading || !price} onClick={handleFakePayment} className="mt-5 min-h-12 w-full rounded-lg bg-mc-orange px-5 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Processing payment…" : `Test Pay ${price ?? ""}`}</button></> : config.paypal.clientId ? <div className="mt-5"><PayPalScriptProvider options={{ clientId: config.paypal.clientId, currency: "USD", intent: "capture" }}><PayPalButtons style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }} createOrder={createPayPal} onApprove={approvePayPal} onError={() => setError("PayPal is unavailable. Try again or contact support.")} /></PayPalScriptProvider></div> : <p role="alert" className="mt-5 text-sm">Payment is temporarily unavailable. Please contact support.</p>}<button type="button" onClick={() => goTo("upload")} className="mt-4 min-h-11 text-sm font-semibold underline">Back to photos</button></div></section> : null}
      {step === "done" && paymentCompleted ? <section className="mt-7 max-w-2xl rounded-xl bg-white p-6 sm:p-8"><p className="text-sm font-semibold text-mc-brown">Payment complete · Review queued</p><h2 className="mt-3 font-display text-3xl">Your item is with ModaCert.</h2><p className="mt-3 text-sm leading-6 text-mc-form-muted">A specialist will review your submitted photos. Keep your request ID for support.</p><dl className="mt-5 divide-y divide-mc-muted border-y border-mc-muted text-sm"><Detail label="Request ID" value={requestId ?? ""} /><Detail label="Brand" value={selectedBrand?.name ?? ""} /><Detail label="Paid" value={price ?? ""} /></dl><Link href="/" className="mt-6 inline-flex min-h-12 items-center rounded-lg bg-mc-orange px-5 text-sm font-semibold text-white">Return home</Link></section> : null}
    </div>
    {leaveOpen ? <div role="presentation" className="fixed inset-0 z-50 grid place-items-center bg-mc-ink/60 p-4"><div role="dialog" aria-modal="true" aria-labelledby="leave-title" className="w-full max-w-sm rounded-xl bg-white p-6"><h2 id="leave-title" className="text-xl font-semibold">Leave your request?</h2><p className="mt-2 text-sm text-mc-form-muted">Photos selected on this page will be lost.</p><div className="mt-5 flex gap-3"><button type="button" onClick={() => setLeaveOpen(false)} className="min-h-12 flex-1 rounded-lg bg-mc-orange px-4 text-sm font-semibold text-white">Keep working</button><button type="button" onClick={() => { setLeaveOpen(false); router.push(pendingHref); }} className="min-h-12 flex-1 rounded-lg border border-mc-muted px-4 text-sm">Leave</button></div></div></div> : null}
  </main>;
}

function BrandPicker({ brands, selected, loading, onSelect }: { brands: Brand[]; selected: Brand | null; loading: boolean; onSelect: (brand: Brand) => void }) {
  const [query, setQuery] = useState("");
  const filtered = brands.filter((brand) => brand.name.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="mt-5"><label htmlFor="checkout-brand-search" className="block text-sm font-semibold">Find a brand</label><input id="checkout-brand-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search supported brands" className="mt-2 min-h-12 w-full max-w-xl rounded-lg border border-mc-muted bg-white px-4 text-base" />{loading ? <p className="mt-5 text-sm" role="status">Loading brands…</p> : null}{!loading && filtered.length ? <div className="mt-5 grid gap-2 sm:grid-cols-2">{filtered.map((brand) => <button key={brand.id} type="button" aria-pressed={selected?.id === brand.id} onClick={() => onSelect(brand)} className={cx("flex min-h-16 items-center justify-between gap-3 rounded-lg border bg-white px-4 text-left text-sm", selected?.id === brand.id ? "border-mc-orange ring-2 ring-mc-orange" : "border-mc-muted")}><span className="font-semibold">{brand.name}</span><span className="shrink-0 text-mc-form-muted">{formatPrice(brand.price) ?? "Price at checkout"}</span></button>)}</div> : null}{!loading && !filtered.length ? <p className="mt-5 text-sm">No matching brand. <a href="mailto:modacert.support@gmail.com" className="underline">Ask about your item</a>.</p> : null}</div>;
}

function PhotoInput({ slot, file, disabled, onSelect }: { slot: PhotoSlot; file: File | null | undefined; disabled: boolean; onSelect: (file: File | null) => void }) {
  const [preview, setPreview] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0] ?? null;
    if (!chosen || (allowedTypes.has(chosen.type) && chosen.size > 0 && chosen.size <= MAX_PHOTO_BYTES)) setPreview(chosen ? URL.createObjectURL(chosen) : "");
    onSelect(chosen);
    event.target.value = "";
  }
  return <article className="flex min-w-0 gap-3 rounded-lg border border-mc-muted bg-white p-3"><div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-mc-soft">{preview ? <Image src={preview} alt={`Selected ${slot.label.toLowerCase()} photo`} fill unoptimized sizes="80px" className="object-cover" /> : <span className="px-1 text-center text-[10px] font-semibold uppercase tracking-wide text-mc-brown">{slot.label}</span>}</div><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold">{slot.label}</h3><p className="mt-1 text-xs leading-5 text-mc-form-muted">{slot.description}</p><div className="mt-2 flex flex-wrap gap-2"><label className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-mc-muted px-3 text-xs font-semibold focus-within:ring-2 focus-within:ring-mc-orange"><input type="file" accept={acceptedPhotoInputTypes} disabled={disabled} onChange={chooseFile} className="sr-only" aria-label={`${file ? "Replace" : "Choose"} ${slot.label.toLowerCase()} photo from library`} />{file ? "Replace" : "Photo library"}</label><label className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-mc-muted px-3 text-xs font-semibold focus-within:ring-2 focus-within:ring-mc-orange"><input type="file" accept={acceptedPhotoInputTypes} capture="environment" disabled={disabled} onChange={chooseFile} className="sr-only" aria-label={`Take ${slot.label.toLowerCase()} photo with camera`} />Camera</label>{file ? <button type="button" disabled={disabled} onClick={() => { setPreview(""); onSelect(null); }} className="min-h-11 rounded-md px-2 text-xs font-semibold underline">Remove</button> : null}</div>{file ? <p className="mt-1 truncate text-xs text-mc-brown">Added: {file.name}</p> : null}</div></article>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-5 py-3"><dt className="text-mc-form-muted">{label}</dt><dd className="break-all text-right font-semibold">{value}</dd></div>; }
function StepActions({ back, next, disabled, label }: { back: () => void; next: () => void; disabled: boolean; label: string }) { return <div className="sticky bottom-0 z-20 mt-7 flex flex-col-reverse gap-3 border-t border-mc-muted bg-mc-soft py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:flex-row sm:justify-between"><button type="button" onClick={back} className="min-h-12 rounded-lg border border-mc-muted bg-white px-5 text-sm font-semibold">Back</button><button type="button" disabled={disabled} onClick={next} className="min-h-12 rounded-lg bg-mc-orange px-6 text-sm font-semibold text-white disabled:opacity-50">{label}</button></div>; }
