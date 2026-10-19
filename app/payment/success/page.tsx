"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { fetchStripeCheckoutStatus, setAuthToken } from "../../_lib/api";
import { getStoredToken } from "../../_lib/auth";
import { AppFrame } from "../../components";

const emptySubscribe = () => () => {};
function useHydrated() { return useSyncExternalStore(emptySubscribe, () => true, () => false); }

type PaymentState = "loading" | "queued" | "processing" | "error";
type CopyState = "idle" | "copied" | "error";

export default function StripePaymentSuccessPage() {
  const hydrated = useHydrated();
  const sessionId = useSyncExternalStore(emptySubscribe, () => new URLSearchParams(window.location.search).get("session_id") || "", () => "");
  const token = useSyncExternalStore(emptySubscribe, getStoredToken, () => null);
  const [requestId, setRequestId] = useState("");
  const [state, setState] = useState<PaymentState>("loading");
  const [message, setMessage] = useState("Confirming your payment…");
  const [copyState, setCopyState] = useState<CopyState>("idle");

  async function copyRequestId() {
    try {
      await navigator.clipboard.writeText(requestId);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  async function loadPayment(id: string) {
    setState("loading");
    setMessage("Confirming your payment…");
    try {
      const payment = await fetchStripeCheckoutStatus(id);
      setRequestId(payment.referenceId);
      if (payment.status === "COMPLETED" && payment.queued) {
        setState("queued");
        setMessage("Payment complete · Review queued");
      } else {
        setState("processing");
        setMessage("Stripe is still confirming your payment. Check again in a moment.");
      }
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Payment status is unavailable.");
    }
  }

  useEffect(() => {
    if (!hydrated || !sessionId || !token) return;
    setAuthToken(token);
    void fetchStripeCheckoutStatus(sessionId).then((payment) => {
      setRequestId(payment.referenceId);
      if (payment.status === "COMPLETED" && payment.queued) {
        setState("queued");
        setMessage("Payment complete · Review queued");
      } else {
        setState("processing");
        setMessage("Stripe is still confirming your payment. Check again in a moment.");
      }
    }).catch((error) => {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Payment status is unavailable.");
    });
  }, [hydrated, sessionId, token]);

  const accessError = hydrated && !sessionId ? "This payment link is missing its Stripe session ID." : hydrated && !token ? "Sign in again to view this payment." : "";
  const displayState = accessError ? "error" : state;
  return <AppFrame><section className="bg-mc-cream px-4 py-16 sm:py-24"><div className="checkout-done mx-auto max-w-2xl p-6 sm:p-9" aria-live="polite"><p className="text-sm font-semibold text-mc-brown">{accessError || message}</p><h1 className="mt-3 font-display text-3xl sm:text-4xl">{displayState === "queued" ? "Your item is with ModaCert." : displayState === "error" ? "We couldn’t confirm the payment." : "Payment received."}</h1>{displayState === "queued" ? <><p className="mt-4 text-sm leading-6 text-mc-form-muted">A specialist will review your submitted photos. Keep your request ID for support.</p><dl className="mt-6 divide-y divide-mc-muted border-y border-mc-muted text-sm"><div className="flex items-center justify-between gap-5 py-3"><dt className="text-mc-form-muted">Request ID</dt><dd className="min-w-0 text-right"><button type="button" onClick={() => void copyRequestId()} disabled={!requestId} aria-label={`Copy request ID ${requestId}`} className="inline-flex min-h-11 max-w-full items-center justify-end gap-2 rounded-md px-2 py-1 text-right font-semibold text-mc-ink transition-colors hover:bg-mc-soft hover:text-mc-orange-dark disabled:cursor-not-allowed"><span className="break-all underline decoration-mc-muted underline-offset-4">{requestId}</span><span className="shrink-0 text-xs font-medium text-mc-form-muted">{copyState === "copied" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy"}</span></button></dd></div></dl></> : <p className="mt-4 text-sm leading-6 text-mc-form-muted">Your review starts only after the signed Stripe webhook confirms payment and queues the request.</p>}<div className="mt-7 flex flex-wrap gap-3">{token && sessionId && (displayState === "processing" || displayState === "error") ? <button type="button" onClick={() => void loadPayment(sessionId)} className="checkout-primary min-h-12 px-6 text-sm font-semibold">Check again</button> : null}<Link href="/" className="inline-flex min-h-12 items-center px-4 text-sm font-semibold underline">Return home</Link>{hydrated && !token ? <Link href="/signin" className="inline-flex min-h-12 items-center px-4 text-sm font-semibold underline">Sign in</Link> : null}</div></div></section></AppFrame>;
}
