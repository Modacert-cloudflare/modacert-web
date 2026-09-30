import Image from "next/image";
import Link from "next/link";
import { AppFrame, ButtonLink } from "./components";
import { BrandDirectory } from "./brand-directory";
import { InteractiveProductCard } from "@/components/ui/card-7";
import { figma, trustProof } from "./data";

export default function Home() {
  return <AppFrame>
    <section className="bg-mc-soft">
      <div className="mx-auto grid max-w-7xl lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
        <div className="px-4 pb-8 pt-9 sm:px-6 lg:flex lg:flex-col lg:justify-center lg:px-8 lg:py-16">
          <p className="text-sm font-semibold text-mc-brown">Luxury authentication by human specialists</p>
          <h1 className="mt-4 max-w-lg font-display text-[clamp(2.8rem,10vw,5rem)] leading-[1.05] tracking-[-0.025em]">Know it’s authentic.</h1>
          <p className="mt-5 max-w-[38rem] text-base leading-7 text-mc-form-muted">Professional authentication for luxury bags, watches, clothing and accessories. Upload clear photos for expert review and receive a digital result.</p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <ButtonLink href="/checkout">Authenticate an item</ButtonLink>
            <Link href="/rates" className="inline-flex min-h-12 items-center text-sm font-semibold underline underline-offset-4">View prices</Link>
          </div>
          <p className="mt-6 text-sm text-mc-form-muted">Price shown when you choose a brand. No payment until photos are submitted.</p>
        </div>
        <div className="relative aspect-[5/4] min-h-64 overflow-hidden lg:aspect-auto lg:min-h-[540px]">
          <Image src={figma.hero} alt="Leather handbag held by its handles" fill preload fetchPriority="high" sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover object-center" />
        </div>
      </div>
    </section>

    <section className="border-y border-mc-muted bg-white px-4 py-5 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap gap-x-8 gap-y-3 text-sm font-medium">
        <span>Reviewed by a specialist</span><span>Guided photo upload</span><span>Digital result and certificate</span>
        {trustProof.itemsAuthenticated > 0 ? <span>{trustProof.itemsAuthenticated.toLocaleString()} items authenticated</span> : null}
        {trustProof.reviewCount > 0 && trustProof.reviewRating > 0 && trustProof.reviewSourceUrl ? <a href={trustProof.reviewSourceUrl}>{trustProof.reviewRating.toFixed(1)}/5 from {trustProof.reviewCount} reviews</a> : null}
      </div>
    </section>

    <section id="how-it-works" className="section-pad mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
        <div><h2 className="section-title">A clear path from photos to answer.</h2><p className="mt-4 max-w-md text-mc-form-muted">Choose your brand, follow the photo guide, then complete payment to send your item to a specialist.</p></div>
        <ol className="border-t border-mc-muted">
          {[["01", "Upload photos", "Ten clear views guide the review, including front, back, interior, label and logo."], ["02", "Expert review", "A specialist examines the details visible in your submission."], ["03", "Result and certificate", "Your completed result records the verdict and item details in a digital certificate."]].map(([number, title, description]) => <li key={number} className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-mc-muted py-5"><span className="font-display text-xl text-mc-orange-dark">{number}</span><div><h3 className="text-lg font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-mc-form-muted">{description}</p></div></li>)}
        </ol>
      </div>
    </section>

    <section className="section-pad bg-mc-ink px-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div><h2 className="section-title text-white">See what you receive.</h2><p className="mt-4 max-w-md leading-7 text-white/80">A digital certificate records the outcome and the details of your reviewed item.</p><p className="mt-5 text-sm text-white/70">The preview is illustrative. Your result depends on your item and the expert’s assessment.</p></div>
        <div className="mx-auto w-full max-w-[360px]"><InteractiveProductCard role="group" aria-label="Illustrative authentication certificate preview" imageUrl={figma.hero} logoUrl={figma.mark} title="ModaCert" description="Authentication certificate" price="AUTHENTIC" itemLabel="Luxury handbag" eyebrow="Illustrative sample" /><p className="mt-4 text-xs leading-5 text-white/75">Sample only. No certificate ID or QR code has been issued for this preview.</p></div>
      </div>
    </section>

    <section className="section-pad mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-mc-muted"><Image src="/landing/hero-bag.png" alt="Handbag showing its leather grain, stitching and hardware" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-contain p-6" /></div>
      <div><h2 className="section-title">Details make the decision.</h2><p className="mt-4 leading-7 text-mc-form-muted">Specialists inspect the evidence in your photos, such as construction, stitching, stamps, hardware and identifying details. Clear close-ups help them make an informed assessment.</p><Link href="/upload" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">See the photo guide</Link></div>
    </section>

    <section id="brands" className="section-pad bg-mc-soft px-4 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><h2 className="section-title">Find your brand and price.</h2><p className="mt-3 max-w-xl text-mc-form-muted">Prices come from the current authentication catalog. Your exact price appears before payment.</p><div className="mt-7"><BrandDirectory compact /></div></div></section>

    <section className="section-pad mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="grid gap-8 lg:grid-cols-2 lg:gap-16"><div><h2 className="section-title">Before you submit.</h2><p className="mt-4 max-w-md text-mc-form-muted">Check the price and photo requirements before you pay.</p><ButtonLink href="/rates" tone="light" className="mt-6">View current prices</ButtonLink></div><div className="divide-y divide-mc-muted border-y border-mc-muted"><details className="py-4"><summary className="min-h-11 cursor-pointer font-semibold">When do I pay?</summary><p className="pb-2 text-sm leading-6 text-mc-form-muted">After you choose a brand and upload the required photos. Your price is shown before payment.</p></details><details className="py-4"><summary className="min-h-11 cursor-pointer font-semibold">What if my photos are unclear?</summary><p className="pb-2 text-sm leading-6 text-mc-form-muted">Use the example for each view before uploading. If a specialist needs more detail after submission, they may request additional photos.</p></details><details className="py-4"><summary className="min-h-11 cursor-pointer font-semibold">How long does review take?</summary><p className="pb-2 text-sm leading-6 text-mc-form-muted">Review time varies by item and photo quality. A fixed turnaround is not currently offered.</p></details></div></div></section>

    <section className="bg-mc-brown px-4 py-10 text-white sm:px-6 lg:px-8 lg:py-14"><div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-3xl sm:text-4xl">Ready for a clear answer?</h2><p className="mt-2 text-sm text-white/80">Start with your brand. We’ll guide the photos.</p></div><ButtonLink href="/checkout" className="shrink-0">Authenticate an item</ButtonLink></div></section>
  </AppFrame>;
}
