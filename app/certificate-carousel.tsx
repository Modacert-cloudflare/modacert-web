"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { InteractiveProductCard } from "@/components/ui/card-7";
import { figma } from "./data";

const certificatePreviews = [
  { itemLabel: "Luxury handbag", imageUrl: figma.hero },
  { itemLabel: "Luxury sneaker", imageUrl: "/landing/category-shoe.png" },
  { itemLabel: "Luxury watch", imageUrl: "/landing/category-watch.png" },
] as const;

export function CertificateCarousel() {
  const listRef = React.useRef<HTMLUListElement>(null);

  function scroll(direction: -1 | 1) {
    const list = listRef.current;
    if (!list) return;
    list.scrollBy({ left: direction * list.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  return <div className="mx-auto w-full max-w-[360px]">
    <div className="mb-3 hidden items-center justify-end gap-2 sm:flex">
      <button type="button" aria-label="Show previous certificate preview" aria-controls="certificate-previews" onClick={() => scroll(-1)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-orange"><ArrowLeft aria-hidden="true" className="h-5 w-5" /></button>
      <button type="button" aria-label="Show next certificate preview" aria-controls="certificate-previews" onClick={() => scroll(1)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-orange"><ArrowRight aria-hidden="true" className="h-5 w-5" /></button>
    </div>
    <ul id="certificate-previews" ref={listRef} tabIndex={0} aria-label="Illustrative authentication certificate previews" className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mc-orange">
      {certificatePreviews.map((preview) => <li key={preview.itemLabel} className="w-[calc(100%-1.5rem)] shrink-0 snap-center"><InteractiveProductCard role="group" aria-label={`${preview.itemLabel} certificate preview`} imageUrl={preview.imageUrl} logoUrl={figma.mark} title="ModaCert" description="Authentication certificate" price="AUTHENTIC" itemLabel={preview.itemLabel} eyebrow="Illustrative sample" /></li>)}
    </ul>
    <p className="mt-2 text-xs leading-5 text-white/75">Swipe, scroll or use the arrow buttons to view handbags, sneakers and watches. Samples only. No certificate ID or QR code has been issued.</p>
  </div>;
}
