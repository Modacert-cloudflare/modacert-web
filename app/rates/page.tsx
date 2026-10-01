import { AppFrame, ButtonLink } from "../components";
import { BrandDirectory } from "../brand-directory";

export default function RatesPage() {
  return <AppFrame><section className="section-pad mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="max-w-2xl"><h1 className="font-display text-4xl leading-tight sm:text-5xl">Authentication pricing</h1><p className="mt-4 leading-7 text-mc-form-muted">Choose a supported brand to see its current price. The service includes expert photo review and a digital result. The exact total appears before payment.</p></div><div className="mt-8 max-w-4xl"><BrandDirectory /></div><p className="mt-8 max-w-xl text-sm text-mc-form-muted">Review time varies by item and photo quality. Need a brand that is not listed?</p><a className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold underline" href="mailto:modacert.support@gmail.com">Contact ModaCert</a><div><ButtonLink href="/checkout" className="mt-6">Authenticate an item</ButtonLink></div></section></AppFrame>;
}
