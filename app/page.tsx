import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, ScanSearch, ShieldCheck } from "lucide-react";
import { AppFrame, ButtonLink } from "./components";
import { BrandDirectory } from "./brand-directory";
import { InteractiveProductCard } from "@/components/ui/card-7";
import { figma } from "./data";

const inspectionDetails = [
  { label: "Stitching", className: "stitching" },
  { label: "Stamps", className: "stamps" },
  { label: "Hardware", className: "hardware" },
  { label: "Identifying details", className: "identity" },
] as const;

export default function Home() {
  return <AppFrame heroHeader>
    <section className="home-hero relative isolate overflow-hidden text-white">
      <div className="home-hero__content relative z-10 mx-auto flex w-full max-w-[1480px] flex-col px-6 pb-12 pt-36 sm:px-10 lg:px-14 lg:pt-44">
        <p className="home-hero__eyebrow text-mc-gold">TRUST <span>·</span> EXPERTISE <span>·</span> CERTIFIED</p>
        <h1 className="home-hero__title mt-4 max-w-[740px] font-display">Authenticate<br className="hidden sm:block" /> Luxury Goods</h1>
        <p className="home-hero__description mt-5 max-w-[460px] text-white/95">Professional authentication and a documented result for your luxury items.</p>
        <div className="home-hero__proof mt-8 grid max-w-[430px] grid-cols-3 gap-3 text-center sm:gap-6" aria-label="Service benefits">
          <div><ShieldCheck aria-hidden="true" /><span>Expert<br />Review</span></div>
          <div><Award aria-hidden="true" /><span>Digital<br />Certificate</span></div>
          <div><ScanSearch aria-hidden="true" /><span>Guided<br />Photo Upload</span></div>
        </div>
        <ButtonLink href="/checkout" tone="gold" className="home-hero__cta mt-8 w-full gap-3 rounded-full text-base sm:w-fit sm:min-w-[300px]">Authenticate Your Item <ArrowRight aria-hidden="true" className="h-5 w-5" /></ButtonLink>
      </div>
    </section>

    <section id="how-it-works" className="home-process section-pad px-4 sm:px-6 lg:px-8">
      <div className="home-process__content mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
        <div><h2 className="section-title">A clear path from photos to answer.</h2><p className="mt-4 max-w-md text-mc-form-muted">Choose your brand, follow the photo guide, then complete payment to send your item to a specialist.</p></div>
        <ol className="border-t border-mc-muted">
          {[["01", "Upload photos", "Ten clear views guide the review, including front, back, interior, label and logo."], ["02", "Expert review", "A specialist examines the details visible in your submission."], ["03", "Result and certificate", "Your completed result records the verdict and item details in a digital certificate."]].map(([number, title, description]) => <li key={number} className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-mc-muted py-5"><span className="font-display text-xl text-mc-orange-dark">{number}</span><div><h3 className="text-lg font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-mc-form-muted">{description}</p></div></li>)}
        </ol>
      </div>
    </section>

    <section className="home-certificate px-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div><h2 className="section-title text-white">See what you receive.</h2><p className="mt-4 max-w-md leading-7 text-white/80">A digital certificate records the outcome and the details of your reviewed item.</p><p className="mt-5 text-sm text-white/70">The preview is illustrative. Your result depends on your item and the expert’s assessment.</p></div>
        <div className="mx-auto w-full max-w-[360px]"><InteractiveProductCard role="group" aria-label="Illustrative authentication certificate preview" imageUrl={figma.hero} logoUrl={figma.mark} title="ModaCert" description="Authentication certificate" price="AUTHENTIC" itemLabel="Luxury handbag" eyebrow="Illustrative sample" /><p className="mt-4 text-xs leading-5 text-white/75">Sample only. No certificate ID or QR code has been issued for this preview.</p></div>
      </div>
    </section>

    <section className="inspection-section overflow-hidden" aria-labelledby="inspection-heading">
      <div className="inspection-stage">
        <div className="inspection-stage__image"><Image src="/landing/inspection-scene.webp" alt="Specialist wearing gloves examines an unbranded leather handbag with a loupe" fill unoptimized sizes="100vw" className="object-cover" /></div>
        <div className="inspection-stage__copy"><h2 id="inspection-heading" className="font-display">Details make<br className="hidden lg:block" /> the decision.</h2><p className="mt-5 max-w-[460px] leading-relaxed text-mc-form-muted">Specialists inspect the evidence in your photos, such as construction, stitching, stamps, hardware and identifying details. Clear close-ups help them make an informed assessment.</p><Link href="/upload" className="inspection-cta mt-8"><span>See the photo guide</span><span className="inspection-cta__icon"><ArrowRight aria-hidden="true" className="h-5 w-5" /></span></Link></div>
        <svg className="inspection-stage__connectors" viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true"><path d="M520 270 L650 430 M815 270 L735 430 M520 540 L650 465 M815 540 L735 470" /><circle cx="650" cy="430" r="5" /><circle cx="735" cy="430" r="5" /><circle cx="650" cy="465" r="5" /><circle cx="735" cy="470" r="5" /></svg>
        <ul className="inspection-stage__details" aria-label="Illustrative examples of details specialists inspect">{inspectionDetails.map((detail) => <li key={detail.label} className={`inspection-detail inspection-detail--${detail.className}`}><span className="inspection-detail__image" aria-hidden="true" /><span className="inspection-detail__label">{detail.label}</span></li>)}</ul>
      </div>
    </section>

    <section id="brands" className="brand-showcase-section"><BrandDirectory compact /></section>

    <section className="home-faq section-pad px-4 sm:px-6 lg:px-8"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2 lg:gap-16"><div><h2 className="section-title">Before you submit.</h2><p className="mt-4 max-w-md text-mc-form-muted">Check the price and photo requirements before you pay.</p><ButtonLink href="/rates" tone="light" className="mt-6">View current prices</ButtonLink></div><div className="divide-y divide-mc-muted border-y border-mc-muted"><details className="py-4"><summary className="min-h-11 cursor-pointer font-semibold">When do I pay?</summary><p className="pb-2 text-sm leading-6 text-mc-form-muted">After you choose a brand and upload the required photos. Your price is shown before payment.</p></details><details className="py-4"><summary className="min-h-11 cursor-pointer font-semibold">What if my photos are unclear?</summary><p className="pb-2 text-sm leading-6 text-mc-form-muted">Use the example for each view before uploading. If a specialist needs more detail after submission, they may request additional photos.</p></details><details className="py-4"><summary className="min-h-11 cursor-pointer font-semibold">How long does review take?</summary><p className="pb-2 text-sm leading-6 text-mc-form-muted">Review time varies by item and photo quality. A fixed turnaround is not currently offered.</p></details></div></div></section>

    <section className="home-final-cta px-4 text-white sm:px-6 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-3xl sm:text-4xl">Ready for a clear answer?</h2><p className="mt-2 text-sm text-white/80">Start with your brand. We’ll guide the photos.</p></div><ButtonLink href="/checkout" tone="gold" className="shrink-0 rounded-full">Authenticate an item <ArrowRight aria-hidden="true" className="ml-2 inline h-4 w-4" /></ButtonLink></div></section>
  </AppFrame>;
}
