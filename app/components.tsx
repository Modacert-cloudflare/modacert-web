import Image from "next/image";
import Link from "next/link";
import { figma, navItems, trustProof } from "./data";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={cx("inline-flex min-h-11 items-center gap-2 font-logo text-lg tracking-[0.08em]", light ? "text-white" : "text-mc-ink")} aria-label="ModaCert home">
      <Image src={figma.mark} alt="" width={30} height={30} className="h-7 w-7 object-contain" />
      MODACERT
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="relative z-30 border-b border-mc-muted bg-white">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandMark />
        <nav aria-label="Main navigation" className="hidden items-center gap-7 text-sm md:flex">
          {navItems.map((item) => <Link key={item.href} href={item.href} className="py-3 text-mc-ink hover:text-mc-orange-dark">{item.label}</Link>)}
          {trustProof.verificationUrl ? <a href={trustProof.verificationUrl} className="py-3 hover:text-mc-orange-dark">Verify certificate</a> : null}
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          <Link href="/signin" className="inline-flex min-h-11 items-center px-2 text-sm font-medium">Sign in</Link>
          <ButtonLink href="/checkout">Authenticate an item</ButtonLink>
        </div>
        <details className="group relative md:hidden">
          <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-md border border-mc-muted px-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">Menu</summary>
          <nav aria-label="Mobile navigation" className="absolute right-0 top-[calc(100%+8px)] z-40 flex w-[min(18rem,calc(100vw-2rem))] flex-col gap-1 rounded-lg border border-mc-muted bg-white p-3 shadow-sm">
            {navItems.map((item) => <Link key={item.href} href={item.href} className="flex min-h-11 items-center rounded-md px-3 text-sm">{item.label}</Link>)}
            {trustProof.verificationUrl ? <a href={trustProof.verificationUrl} className="flex min-h-11 items-center px-3 text-sm">Verify certificate</a> : null}
            <Link href="/signin" className="flex min-h-11 items-center px-3 text-sm">Sign in</Link>
            <ButtonLink href="/checkout" className="mt-2 w-full">Authenticate an item</ButtonLink>
          </nav>
        </details>
      </div>
    </header>
  );
}

export function ButtonLink({ href, children, tone = "accent", className = "" }: { href: string; children: React.ReactNode; tone?: "accent" | "dark" | "light"; className?: string }) {
  const colors = tone === "accent" ? "bg-mc-orange text-white hover:bg-mc-orange-dark" : tone === "dark" ? "bg-mc-ink text-white hover:bg-mc-brown" : "border border-mc-ink bg-transparent text-mc-ink hover:bg-mc-soft";
  return <Link href={href} className={cx("inline-flex min-h-12 items-center justify-center rounded-lg px-5 py-3 text-center text-sm font-semibold", colors, className)}>{children}</Link>;
}

export function Footer() {
  return (
    <footer className="border-t border-mc-muted bg-mc-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <BrandMark light />
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/80">Professional authentication for luxury goods, from clear photos to an expert-reviewed result.</p>
        </div>
        <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-8 gap-y-0 text-sm sm:grid-cols-3 [&>a]:flex [&>a]:min-h-11 [&>a]:items-center">
          <Link href="/checkout">Authenticate</Link>
          <Link href="/rates">Pricing</Link>
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/signin">Sign in</Link>
          {trustProof.verificationUrl ? <a href={trustProof.verificationUrl}>Verify certificate</a> : null}
          <a href="mailto:modacert.support@gmail.com">Contact</a>
        </nav>
      </div>
    </footer>
  );
}

export function AppFrame({ children }: { children: React.ReactNode }) {
  return <><SiteHeader /><main id="main-content" className="min-h-screen">{children}</main><Footer /></>;
}
