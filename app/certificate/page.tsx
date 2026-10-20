import type { Metadata } from "next";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { BrandMark, ButtonLink } from "../components";
import { CertificateLookup } from "./certificate-lookup";

export const metadata: Metadata = {
  title: "Get your certificate | ModaCert",
  description: "Private access to your ModaCert authentication certificate.",
  robots: { index: false, follow: false },
};

export default async function CertificatePage({ searchParams }: { searchParams: Promise<{ uuid?: string | string[] }> }) {
  const query = await searchParams;
  const initialUuid = typeof query.uuid === "string" ? query.uuid : "";

  return (
    <div className="min-h-dvh bg-mc-ink">
      <header className="border-b border-white/15 px-4 py-4 text-white sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center">
          <BrandMark light />
        </div>
      </header>
      <main id="main-content" className="px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
        <section className="mx-auto grid max-w-6xl overflow-hidden rounded-[14px] bg-white lg:grid-cols-[0.9fr_1.1fr]">
          <div className="p-6 sm:p-10 lg:p-14">
            <ButtonLink href="/" tone="light" className="mb-8 gap-2">
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Back home
            </ButtonLink>
            <p className="text-sm font-semibold text-mc-orange-dark">Private certificate access</p>
            <h1 className="mt-3 max-w-lg font-display text-4xl leading-[1.08] tracking-[-0.025em] text-mc-ink sm:text-5xl">Get your ModaCert certificate.</h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-mc-form-muted">You stay signed in across ModaCert. Enter the UUID from your confirmation email to open the certificate owned by your account.</p>
            <CertificateLookup initialUuid={initialUuid} />
          </div>
          <div className="relative min-h-[320px] overflow-hidden bg-mc-brown lg:min-h-[700px]">
            <Image src="/landing/inspection-scene.webp" alt="ModaCert specialist inspecting a luxury item" fill priority sizes="(max-width: 1023px) 100vw, 55vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-mc-ink via-mc-ink/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10">
              <p className="max-w-md font-display text-3xl leading-tight">Your submission stays private.</p>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/80">No certificate list, public search, or email-only access.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
