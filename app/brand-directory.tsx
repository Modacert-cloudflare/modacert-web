"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { fetchBrands, type Brand } from "./_lib/api";

const featuredKeys = ["gucci", "louis vuitton", "chanel", "hermes", "prada", "dior"];

function brandKey(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function formattedPrice(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount) : null;
}

export function BrandDirectory({ compact = false }: { compact?: boolean }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchBrands().then((items) => {
      if (!cancelled) { setBrands(items.filter((item) => item.isActive !== false)); setError(false); }
    }).catch(() => { if (!cancelled) setError(true); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [retry]);

  const search = brandKey(query.trim());
  const filtered = brands.filter((brand) => brandKey(brand.name).includes(search));
  const featured = featuredKeys.flatMap((key) => {
    const brand = brands.find((item) => brandKey(item.name) === key);
    return brand ? [{ brand, key: key.replace(" ", "-") }] : [];
  });

  if (compact) {
    return <div className="brand-showcase mx-auto max-w-[1480px]">
      <div className="brand-showcase__hero">
        <Image src="/brands/catalog-hero.webp" alt="" fill unoptimized sizes="(min-width: 1480px) 1480px, 100vw" className="brand-showcase__hero-image" />
        <div className="brand-showcase__copy">
          <p className="brand-showcase__eyebrow">Authentication catalog</p>
          <h2 className="brand-showcase__title">Find your brand<br className="hidden sm:block" /> and price.</h2>
          <p className="brand-showcase__description">Explore the brands we review. Your catalog price is shown before you pay.</p>
          <form className="brand-showcase__search" onSubmit={(event) => { event.preventDefault(); document.getElementById("home-brand-results")?.scrollIntoView(); }} role="search">
            <Search aria-hidden="true" className="h-6 w-6 shrink-0" />
            <label htmlFor="home-brand-search" className="sr-only">Search supported brands</label>
            <input id="home-brand-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search supported brands" />
            <button type="submit" aria-label="Show matching brands"><ArrowRight aria-hidden="true" className="h-5 w-5" /></button>
          </form>
        </div>
      </div>
      <div id="home-brand-results" className="brand-showcase__results">
        <div className="brand-showcase__heading"><h3>{search ? "Matching brands" : "Popular brands"}</h3><Link href="/brands">View all brands <ArrowRight aria-hidden="true" className="h-5 w-5" /></Link></div>
        {loading ? <p className="mt-6 text-sm" role="status">Loading brands and prices…</p> : null}
        {error ? <div className="mt-6 text-sm" role="alert">Prices are unavailable right now. <button type="button" onClick={() => { setLoading(true); setRetry((value) => value + 1); }} className="min-h-11 font-semibold underline">Try again</button></div> : null}
        {!loading && !error && !search && featured.length > 0 ? <ul className="brand-showcase__grid">
          {featured.map(({ brand, key }) => <li key={brand.id}><Link href={"/checkout?brand=" + encodeURIComponent(brand.id)} className={"brand-card brand-card--" + key} aria-label={"Authenticate a " + brand.name + " item, " + (formattedPrice(brand.price) ?? "price at checkout")}>
            <span className="brand-card__image"><span className="brand-card__logo" aria-hidden="true"><span /></span></span>
            <span className="brand-card__body"><span><strong>{brand.name}</strong><small>{formattedPrice(brand.price) ?? "Price at checkout"}</small></span><span className="brand-card__arrow"><ArrowRight aria-hidden="true" className="h-5 w-5" /></span></span>
          </Link></li>)}
        </ul> : null}
        {!loading && !error && !search && featured.length === 0 ? <p className="mt-6 text-sm">No featured brands are available right now. <Link href="/brands" className="underline">Browse supported brands</Link>.</p> : null}
        {!loading && !error && search && filtered.length > 0 ? <ul className="brand-showcase__matches">
          {filtered.map((brand) => <li key={brand.id}><Link href={"/checkout?brand=" + encodeURIComponent(brand.id)} aria-label={"Authenticate a " + brand.name + " item"}><span><strong>{brand.name}</strong><small>{formattedPrice(brand.price) ?? "Price at checkout"}</small></span><ArrowRight aria-hidden="true" className="h-5 w-5" /></Link></li>)}
        </ul> : null}
        {!loading && !error && search && filtered.length === 0 ? <p className="mt-6 text-sm">No matching brand. <a className="underline" href="mailto:modacert.support@gmail.com">Ask about your item</a>.</p> : null}
        {!loading && !error && !search && featured.length > 0 ? <p className="brand-showcase__disclaimer">ModaCert is an independent authentication service. Brand marks identify supported items.</p> : null}
      </div>
    </div>;
  }

  return (
    <div>
      <label htmlFor="rates-brand-search" className="block text-sm font-semibold">Find your brand</label>
      <input id="rates-brand-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search supported brands" className="mt-2 min-h-12 w-full max-w-xl rounded-lg border border-mc-muted bg-white px-4 text-base placeholder:text-mc-form-muted" />
      {loading ? <p className="mt-5 text-sm" role="status">Loading brands and prices…</p> : null}
      {error ? <div className="mt-5 text-sm" role="alert">Prices are unavailable right now. <button type="button" onClick={() => { setLoading(true); setRetry((value) => value + 1); }} className="min-h-11 font-semibold underline">Try again</button></div> : null}
      {!loading && !error && filtered.length === 0 ? <p className="mt-5 text-sm">No matching brand. <a className="underline" href="mailto:modacert.support@gmail.com">Ask about your item</a>.</p> : null}
      {!loading && !error && filtered.length > 0 ? (
        <ul className="mt-5 grid gap-x-8 sm:grid-cols-2">
          {filtered.map((brand) => <li key={brand.id} className="flex min-h-16 items-center justify-between gap-3 border-b border-mc-muted py-2">
            <div><span className="block font-semibold">{brand.name}</span><span className="text-sm text-mc-form-muted">{formattedPrice(brand.price) ?? "Price at checkout"}</span></div>
            <Link href={"/checkout?brand=" + encodeURIComponent(brand.id)} className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-mc-orange-dark underline underline-offset-4" aria-label={"Authenticate a " + brand.name + " item"}>Choose</Link>
          </li>)}
        </ul>
      ) : null}
    </div>
  );
}
