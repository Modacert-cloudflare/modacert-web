import Image from "next/image";
import Link from "next/link";
import { Mail, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { figma, navItems, trustProof } from "./data";
import { LeadSubscribe } from "./lead-subscribe";

export const cx = cn;

export function BrandMark({ light = false, hero = false }: { light?: boolean; hero?: boolean }) {
  return (
    <Link href="/" className={cx("inline-flex min-h-11 items-center gap-2 font-logo text-lg tracking-[0.08em]", hero && "hero-brand", light || hero ? "text-white" : "text-mc-ink")} aria-label="ModaCert home">
      <Image src={figma.mark} alt="" width={hero ? 42 : 30} height={hero ? 42 : 30} className={cx("object-contain", hero ? "h-10 w-10 brightness-0 invert" : "h-7 w-7")} />
      <span className={hero ? "hero-brand__wordmark" : ""}>MODACERT{hero && <small>AUTHENTICATION</small>}</span>
    </Link>
  );
}

export function SiteHeader({ hero = false }: { hero?: boolean }) {
  const links = hero ? [{ label: "How it works", href: "/#how-it-works" }, { label: "Brands", href: "/brands" }, { label: "Pricing", href: "/rates" }, { label: "About", href: "/authenticate" }] : navItems;
  return (
    <header className={cx("site-header z-30", hero ? "site-header--hero absolute inset-x-0 top-0 text-white" : "relative border-b border-mc-muted bg-white")}>
      <div className={cx("mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8", hero ? "h-[100px] max-w-[1480px] lg:h-[112px]" : "h-[68px] max-w-7xl")}>
        <BrandMark hero={hero} />
        <nav aria-label="Main navigation" className="hidden items-center gap-6 text-sm lg:flex">
          {links.map((item) => <Link key={item.href} href={item.href} className={cx("inline-flex min-h-11 min-w-11 items-center py-3", hero ? "text-white hover:text-mc-gold" : "text-mc-ink hover:text-mc-orange-dark")}>{item.label}</Link>)}
          {!hero && trustProof.verificationUrl ? <a href={trustProof.verificationUrl} className="py-3 hover:text-mc-orange-dark">Verify certificate</a> : null}
        </nav>
        <div className="hidden items-center gap-4 lg:flex">
          {!hero && <Link href="/signin" className="inline-flex min-h-11 items-center px-2 text-sm font-medium">Sign in</Link>}
          <ButtonLink href="/checkout" tone={hero ? "gold" : "accent"} className={hero ? "rounded-full px-7" : ""}>{hero ? "Authenticate Your Item" : "Authenticate an item"}</ButtonLink>
        </div>
        <details className={cx("group relative lg:hidden", hero && "ml-auto")}>
          <summary aria-label="Site menu" className={cx("flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-md text-sm font-semibold [&::-webkit-details-marker]:hidden", hero ? "text-white" : "border border-mc-muted px-3")}>
            {hero ? <Menu aria-hidden="true" className="h-7 w-7" /> : "Menu"}
          </summary>
          <nav aria-label="Mobile navigation" className={cx("absolute right-0 top-[calc(100%+8px)] z-40 flex w-[min(18rem,calc(100vw-2rem))] flex-col gap-1 rounded-lg p-3 shadow-sm", hero ? "bg-mc-ink text-white" : "border border-mc-muted bg-white")}>
            {links.map((item) => <Link key={item.href} href={item.href} className="flex min-h-11 items-center rounded-md px-3 text-sm">{item.label}</Link>)}
            {!hero && trustProof.verificationUrl ? <a href={trustProof.verificationUrl} className="flex min-h-11 items-center px-3 text-sm">Verify certificate</a> : null}
            <Link href="/signin" className="flex min-h-11 items-center px-3 text-sm">Sign in</Link>
            <ButtonLink href="/checkout" tone={hero ? "gold" : "accent"} className={cx("mt-2 w-full", hero && "rounded-full")}>Authenticate an item</ButtonLink>
          </nav>
        </details>
      </div>
    </header>
  );
}

export function ButtonLink({ href, children, tone = "accent", className = "" }: { href: string; children: React.ReactNode; tone?: "accent" | "dark" | "light" | "gold"; className?: string }) {
  const colors = tone === "accent" ? "bg-mc-orange text-white hover:bg-mc-orange-dark" : tone === "dark" ? "bg-mc-ink text-white hover:bg-mc-brown" : tone === "gold" ? "bg-mc-gold text-mc-ink hover:bg-mc-gold-light" : "border border-mc-ink bg-transparent text-mc-ink hover:bg-mc-soft";
  return <Link href={href} className={cx("button-link inline-flex min-h-12 items-center justify-center px-5 py-3 text-center text-sm font-semibold", tone === "gold" ? "rounded-full" : "rounded-lg", colors, className)}>{children}</Link>;
}

export function Footer() {
  return (
    <footer className="site-footer border-t border-mc-muted bg-white text-mc-ink">
      <div className="mx-auto max-w-[1480px] px-6 pt-14 sm:px-10 lg:px-14 lg:pt-16">
        <div className="site-footer__top">
          <div>
            <BrandMark />
            <p className="mt-2 max-w-sm text-sm leading-6 text-mc-form-muted">Expert authentication for the pieces you value.</p>
            <p className="mt-5 text-sm text-mc-form-muted">Stay in the loop with ModaCert updates.</p>
            <LeadSubscribe />
          </div>
          <nav aria-label="Footer navigation" className="site-footer__nav">
            <div><h2>Services</h2><Link href="/checkout">Authenticate an item</Link><Link href="/brands">Supported brands</Link><Link href="/rates">Pricing</Link></div>
            <div><h2>Explore</h2><Link href="/#how-it-works">How it works</Link><Link href="/upload">Photo guide</Link><Link href="/authenticate">Expert review</Link></div>
            <div><h2>Account</h2><Link href="/signin">Sign in</Link><Link href="/signup">Create account</Link></div>
            <div><h2>Support</h2><Link href="/payment">Payment guide</Link>{trustProof.verificationUrl ? <a href={trustProof.verificationUrl}>Verify certificate</a> : null}<a href="mailto:modacert.support@gmail.com">Contact support</a></div>
          </nav>
        </div>
        <div className="site-footer__meta"><span>© {new Date().getFullYear()} ModaCert. All rights reserved.</span><a href="mailto:modacert.support@gmail.com"><Mail aria-hidden="true" className="h-4 w-4" /> Email support</a></div>
        <div className="site-footer__note">For collectors, buyers, and resellers.</div>
      </div>
    </footer>
  );
}

export function AppFrame({ children, heroHeader = false }: { children: React.ReactNode; heroHeader?: boolean }) {
  return <><SiteHeader hero={heroHeader} /><main id="main-content" className="min-h-screen">{children}</main><Footer /></>;
}
