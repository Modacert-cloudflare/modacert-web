"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion, useReducedMotion, type PanInfo } from "motion/react";
import { categories } from "@/app/data";

export default function CarouselStacked() {
  const [active, setActive] = React.useState(0);
  const reduceMotion = useReducedMotion();
  const current = categories[active];

  function show(direction: number) {
    setActive((index) => (index + direction + categories.length) % categories.length);
  }

  function finishDrag(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (Math.abs(info.offset.x) > 60 || Math.abs(info.velocity.x) > 500) {
      show(info.offset.x < 0 ? 1 : -1);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[550px] select-none">
      <div role="region" aria-roledescription="carousel" aria-label="Item categories" className="relative h-[390px] overflow-hidden sm:h-[430px]">
        <ul className="relative h-full">
          {categories.map((category, index) => {
            const position = (index - active + categories.length) % categories.length;
            const distance = position > categories.length / 2 ? position - categories.length : position;
            const visible = Math.abs(distance) <= 2;

            return (
              <motion.li
                key={category.title}
                aria-hidden={distance !== 0}
                drag={distance === 0 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                dragMomentum={false}
                onDragEnd={finishDrag}
                animate={{
                  x: distance * 70,
                  y: Math.abs(distance) * 18,
                  rotate: distance * 7,
                  scale: 1 - Math.abs(distance) * 0.08,
                  opacity: visible ? 1 : 0,
                }}
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 30 }}
                style={{ zIndex: categories.length - Math.abs(distance), pointerEvents: distance === 0 ? "auto" : "none", touchAction: "pan-y" }}
                className="absolute left-1/2 top-4 h-[340px] w-[min(68vw,250px)] -translate-x-1/2 cursor-grab overflow-hidden rounded-2xl border border-mc-gold/60 bg-mc-soft text-mc-ink active:cursor-grabbing sm:h-[380px]"
              >
                <div className="flex items-center justify-between gap-2 border-b border-mc-muted px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.15em]">
                  <span>ModaCert collection</span>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div className="relative mx-3 mt-3 h-[225px] bg-mc-cream sm:h-[260px]">
                  <Image src={category.image} alt="" fill sizes="250px" draggable={false} className="object-contain p-3" />
                </div>
                <div className="flex items-end justify-between gap-2 px-4 pb-4 pt-3">
                  <h3 className="font-display text-2xl leading-none">{category.title}</h3>
                  <span className="max-w-[88px] text-right text-xs font-semibold leading-tight text-mc-brown-soft">{category.active ? "Available now" : "Coming soon"}</span>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>
      <div className="mt-2 flex items-center justify-between gap-4">
        <button type="button" onClick={() => show(-1)} aria-label="Previous category" className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/50 text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-gold"><ArrowLeft aria-hidden="true" className="h-5 w-5" /></button>
        <p aria-live="polite" aria-atomic="true" className="text-center text-sm text-white/90">{current.title} <span className="text-white/70">{active + 1} / {categories.length}</span></p>
        <button type="button" onClick={() => show(1)} aria-label="Next category" className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/50 text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-gold"><ArrowRight aria-hidden="true" className="h-5 w-5" /></button>
      </div>
      <p className="mt-3 text-center text-xs leading-5 text-white/75">Drag a card or use the arrows to browse all categories.</p>
    </div>
  );
}
