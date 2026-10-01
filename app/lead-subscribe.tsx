"use client";

import { FormEvent, useState } from "react";
import { submitLead } from "./_lib/api";

const emailPattern = /^[A-Z0-9_%+-]+(?:\.[A-Z0-9_%+-]+)*@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+$/i;

export function LeadSubscribe() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "invalid" | "pending" | "success" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "pending") return;
    const value = email.trim();
    if (value.length > 254 || !emailPattern.test(value)) { setStatus("invalid"); return; }
    setStatus("pending");
    try {
      await submitLead({ email: value, timestamp: new Date().toISOString() });
      setEmail("");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return <div className="footer-subscribe"><form onSubmit={handleSubmit} noValidate aria-busy={status === "pending"}><label htmlFor="footer-subscribe-email" className="sr-only">Email address for updates</label><div className="footer-subscribe__control"><input id="footer-subscribe-email" type="email" inputMode="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => { setEmail(event.target.value); setStatus("idle"); }} disabled={status === "pending"} aria-invalid={status === "invalid"} aria-describedby={status === "idle" || status === "pending" ? undefined : "footer-subscribe-feedback"} placeholder="you@company.com" /><button type="submit" disabled={status === "pending"}>{status === "pending" ? "Sending…" : "Subscribe"}</button></div></form>{status === "invalid" || status === "error" || status === "success" ? <p id="footer-subscribe-feedback" role={status === "success" ? "status" : "alert"} className="mt-2 text-sm">{status === "invalid" ? "Enter a valid email address." : status === "error" ? "We couldn't subscribe you right now. Please try again later." : "Thanks for subscribing."}</p> : null}</div>;
}
