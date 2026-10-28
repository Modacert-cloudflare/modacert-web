import Image from "next/image";

const comments = [
  {
    quote: "I like knowing the price before I start. It makes the whole thing feel easier to plan.",
    image: "/user-review/christina-wocintechchat-com-m-0Zx1bDv5BNY-unsplash.jpg",
    position: "50% 35%",
  },
  {
    quote: "The photo guide is the part I’d use most. I never know which details are worth showing.",
    image: "/user-review/h-ng-ph-m-nX8P-y9uVac-unsplash.jpg",
    position: "50% 44%",
  },
  {
    quote: "It helps to see the steps up front. I’d rather know what happens after I send my photos.",
    image: "/user-review/luis-villasmil-hh3ViD0r0Rc-unsplash.jpg",
    position: "50% 40%",
  },
  {
    quote: "The certificate looks useful for keeping with the rest of my bag’s paperwork.",
    image: "/user-review/michael-dam-mEZ3PoFGs_k-unsplash.jpg",
    position: "50% 35%",
  },
  {
    quote: "I can check the brands first and decide whether it’s worth starting. That’s a nice touch.",
    image: "/user-review/good-faces-xmSWVeGEnJw-unsplash.jpg",
    position: "50% 36%",
  },
  {
    quote: "I’d feel better having the item details and the result together in one place.",
    image: "/user-review/jeffery-erhunse-Z9lbmEjyYjU-unsplash.jpg",
    position: "50% 45%",
  },
];

export function TestimonialsSection() {
  return (
    <section className="section-pad border-t border-mc-muted bg-mc-soft px-4 sm:px-6 lg:px-8" aria-labelledby="sample-comments-heading">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between xl:gap-8">
          <div>
            <p className="text-sm font-semibold text-mc-orange-dark">Sample comments</p>
            <h2 id="sample-comments-heading" className="section-title mt-3">What people might say.</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-mc-form-muted">These are examples for the page design, not customer reviews. The portraits are stock photos.</p>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {comments.map(({ quote, image, position }) => (
            <figure key={image} className="flex min-h-52 flex-col justify-between border border-mc-muted bg-[var(--mc-surface)] p-6">
              <blockquote className="text-lg leading-7 text-mc-ink">“{quote}”</blockquote>
              <figcaption className="mt-7 flex items-center gap-3 border-t border-mc-muted pt-4">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-mc-muted">
                  <Image src={image} alt="" fill sizes="48px" className="object-cover" style={{ objectPosition: position }} />
                </span>
                <span className="text-xs font-semibold text-mc-form-muted">Sample comment · Stock photo</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
