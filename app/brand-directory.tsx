"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchBrands, type Brand } from "./_lib/api";

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

  const filtered = brands.filter((brand) => brand.name.toLowerCase().includes(query.trim().toLowerCase()));
  const visible = compact ? filtered.slice(0, 6) : filtered;

  return (
    <div>
      <label htmlFor={compact ? "home-brand-search" : "rates-brand-search"} className="block text-sm font-semibold">Find your brand</label>
      <input id={compact ? "home-brand-search" : "rates-brand-search"} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search supported brands" className="mt-2 min-h-12 w-full max-w-xl rounded-lg border border-mc-muted bg-white px-4 text-base placeholder:text-mc-form-muted" />
      {loading ? <p className="mt-5 text-sm" role="status">Loading brands and prices…</p> : null}
      {error ? <div className="mt-5 text-sm" role="alert">Prices are unavailable right now. <button type="button" onClick={() => { setLoading(true); setRetry((value) => value + 1); }} className="min-h-11 font-semibold underline">Try again</button></div> : null}
      {!loading && !error && visible.length === 0 ? <p className="mt-5 text-sm">No matching brand. <a className="underline" href="mailto:modacert.support@gmail.com">Ask about your item</a>.</p> : null}
      {!loading && !error && visible.length > 0 ? (
        <ul className="mt-5 grid gap-x-8 sm:grid-cols-2">
          {visible.map((brand) => <li key={brand.id} className="flex min-h-16 items-center justify-between gap-3 border-b border-mc-muted py-2">
            <div><span className="block font-semibold">{brand.name}</span><span className="text-sm text-mc-form-muted">{formattedPrice(brand.price) ?? "Price at checkout"}</span></div>
            <Link href={`/checkout?brand=${encodeURIComponent(brand.id)}`} className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-mc-orange-dark underline underline-offset-4" aria-label={`Authenticate a ${brand.name} item`}>Choose</Link>
          </li>)}
        </ul>
      ) : null}
      {compact && !loading && !error && filtered.length > visible.length ? <Link href="/brands" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">View all brands and prices</Link> : null}
    </div>
  );
}
