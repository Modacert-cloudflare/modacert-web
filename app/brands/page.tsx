import type { Metadata } from "next";
import { BrandDirectory } from "../brand-directory";
import { AppFrame } from "../components";

export const metadata: Metadata = {
  title: "Supported Brands | ModaCert",
  description: "Browse supported luxury brands and current authentication prices.",
};

export default function BrandsPage() {
  return <AppFrame><section className="section-pad mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"><p className="text-sm font-semibold text-mc-brown">Supported brands</p><h1 className="mt-3 section-title">Find your brand.</h1><p className="mt-4 max-w-2xl leading-7 text-mc-form-muted">Browse the current catalog, see its listed authentication price, and choose your brand to begin.</p><div className="mt-8"><BrandDirectory /></div></section></AppFrame>;
}
