"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface InteractiveProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl: string;
  logoUrl: string;
  title: string;
  description: string;
  price: string;
  itemLabel?: string;
  eyebrow?: string;
}

export function InteractiveProductCard({
  className,
  style,
  onMouseMove,
  onMouseLeave,
  imageUrl,
  logoUrl,
  title,
  description,
  price,
  itemLabel,
  eyebrow,
  ...props
}: InteractiveProductCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = React.useState<React.CSSProperties>({});

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    onMouseMove?.(event);
    if (!cardRef.current || !window.matchMedia("(hover: hover) and (pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const rotateX = ((event.clientY - top - height / 2) / (height / 2)) * -5;
    const rotateY = ((event.clientX - left - width / 2) / (width / 2)) * 5;
    setTilt({ transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`, transition: "transform 120ms ease-out" });
  }

  function handleMouseLeave(event: React.MouseEvent<HTMLDivElement>) {
    onMouseLeave?.(event);
    setTilt({ transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)", transition: "transform 220ms ease-out" });
  }

  return (
    <div
      {...props}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ ...style, ...tilt, transformStyle: "preserve-3d" }}
      className={cn("group relative isolate aspect-[9/12] w-full max-w-[360px] overflow-hidden rounded-2xl border border-white/20 bg-mc-brown text-white", className)}
    >
      <Image
        src={imageUrl}
        alt={itemLabel || title}
        fill
        sizes="(min-width: 640px) 360px, calc(100vw - 2rem)"
        unoptimized={/^(https?:|blob:|data:)/.test(imageUrl)}
        className="object-cover transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transform-none"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-mc-ink/95 via-mc-ink/20 to-mc-ink/40" />
      <div className="absolute inset-0 flex flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 rounded-xl border border-white/30 bg-mc-ink/30 p-4 backdrop-blur-sm">
          <div className="min-w-0"><h3 className="font-logo text-lg tracking-wide">{title}</h3><p className="mt-1 text-xs text-white/85">{description}</p></div>
          <Image src={logoUrl} alt="" width={28} height={28} unoptimized={/^(https?:|blob:|data:)/.test(logoUrl)} className="h-7 w-7 shrink-0 object-contain brightness-0 invert" />
        </div>
        <div className="mt-4 self-start rounded-md border border-white/40 bg-mc-ink/70 px-3 py-2 text-xs font-semibold tracking-[0.12em] backdrop-blur-sm">{price}</div>
        <div className="mt-auto border-t border-white/40 pt-4">
          {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85">{eyebrow}</p> : null}
          <p className="mt-2 font-display text-3xl leading-tight">{itemLabel || title}</p>
        </div>
      </div>
    </div>
  );
}
