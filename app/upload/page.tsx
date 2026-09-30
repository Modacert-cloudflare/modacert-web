import type { Metadata } from "next";
import { AppFrame, ButtonLink } from "../components";
import { checkoutPhotoSlots } from "../data";

export const metadata: Metadata = {
  title: "Photo Guide | ModaCert",
  description: "Prepare the ten item photos required for ModaCert authentication.",
};

export default function UploadGuidePage() {
  return <AppFrame><section className="section-pad mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"><p className="text-sm font-semibold text-mc-brown">Photo guide</p><h1 className="mt-3 section-title">Show every detail clearly.</h1><p className="mt-4 max-w-2xl leading-7 text-mc-form-muted">You will add ten views during checkout. Use bright, even light, keep the whole item in focus for overview shots, and move closer for labels and identifying marks.</p><div className="mt-6 flex flex-wrap items-center gap-4"><ButtonLink href="/checkout">Start authentication</ButtonLink><span className="text-sm text-mc-form-muted">JPEG, PNG, WebP, HEIC or HEIF · up to 10 MB each</span></div><ol className="mt-10 grid border-t border-mc-muted sm:grid-cols-2 sm:gap-x-10">{checkoutPhotoSlots.map((slot, index) => <li key={slot.key} className="grid grid-cols-[2rem_1fr] gap-3 border-b border-mc-muted py-5"><span className="font-display text-lg text-mc-orange-dark">{String(index + 1).padStart(2, "0")}</span><div><h2 className="font-semibold">{slot.label}</h2><p className="mt-1 text-sm leading-6 text-mc-form-muted">{slot.description}.</p></div></li>)}</ol><p className="mt-7 max-w-2xl text-sm leading-6 text-mc-form-muted">If a detail is worn or has no visible serial number, photograph the area where it would normally appear. A specialist may ask for more photos after submission.</p></section></AppFrame>;
}
