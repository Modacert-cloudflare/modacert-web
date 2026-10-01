"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { figma } from "./data";
import { SiteHeader } from "./components";

export function AuthShell({ children, switchHref, switchLabel }: { children: React.ReactNode; switchHref: string; switchLabel: string }) {
  return <><SiteHeader /><main id="main-content" className="min-h-[calc(100dvh-68px)] bg-mc-soft px-4 py-7 sm:px-6 lg:py-12"><div className="mx-auto grid max-w-5xl overflow-hidden rounded-xl bg-white lg:grid-cols-[0.85fr_1.15fr]"><div className="relative hidden min-h-[650px] lg:block"><Image src={figma.hero} alt="Leather handbag ready for authentication" fill sizes="40vw" className="object-cover" /></div><div className="p-5 sm:p-8 lg:p-12"><div className="mb-5 flex justify-end"><Link href={switchHref} className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">{switchLabel}</Link></div>{children}</div></div></main></>;
}

export function AuthHeading({ title, description }: { title: string; description: string }) {
  return <><h1 className="font-display text-4xl leading-tight sm:text-5xl">{title}</h1><p className="mt-2 text-sm leading-6 text-mc-form-muted">{description}</p></>;
}

export function AuthField({ id, label, type = "text", value, onChange, autoComplete, reveal = false }: { id: string; label: string; type?: string; value: string; onChange: (value: string) => void; autoComplete?: string; reveal?: boolean }) {
  const [visible, setVisible] = useState(false);
  return <label htmlFor={id} className="mt-4 block"><span className="block text-sm font-semibold">{label}</span><span className="relative mt-2 block"><input id={id} type={reveal && visible ? "text" : type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} required className="min-h-12 w-full rounded-lg border border-mc-muted bg-white px-4 pr-16 text-base" />{reveal ? <button type="button" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible((current) => !current)} className="absolute inset-y-0 right-0 min-w-16 rounded-r-lg text-sm font-semibold">{visible ? "Hide" : "Show"}</button> : null}</span></label>;
}

export function AuthDivider() { return <div className="my-6 flex items-center gap-3 text-sm text-mc-form-muted"><span className="h-px flex-1 bg-mc-muted" /><span>or</span><span className="h-px flex-1 bg-mc-muted" /></div>; }

export function GoogleButton({ children = "Continue with Google", className = "", loading = false, onClick }: { children?: React.ReactNode; className?: string; loading?: boolean; onClick?: () => void }) {
  return <button type="button" disabled={loading} onClick={onClick} className={`inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-mc-muted bg-white px-4 text-sm font-semibold disabled:opacity-50 ${className}`}><Image src={figma.google} alt="" width={22} height={22} />{loading ? "Connecting to Google…" : children}</button>;
}

export function AuthPrimaryButton({ children, loading }: { children: React.ReactNode; loading?: boolean }) { return <button type="submit" disabled={loading} className="mt-6 min-h-12 w-full rounded-lg bg-mc-orange px-5 text-sm font-semibold text-white disabled:opacity-50">{children}</button>; }
