import Image from "next/image";

const comments = [
  {
    nickname: "Ari",
    quote: "I like knowing the price before I start. It makes the whole thing feel easier to plan.",
    image: "/user-review/christina-wocintechchat-com-m-0Zx1bDv5BNY-unsplash.webp",
    position: "50% 35%",
  },
  {
    nickname: "Mina",
    quote: "The photo guide is the part I’d use most. I never know which details are worth showing.",
    image: "/user-review/h-ng-ph-m-nX8P-y9uVac-unsplash.webp",
    position: "50% 44%",
  },
  {
    nickname: "Leo",
    quote: "It helps to see the steps up front. I’d rather know what happens after I send my photos.",
    image: "/user-review/luis-villasmil-hh3ViD0r0Rc-unsplash.webp",
    position: "50% 40%",
  },
  {
    nickname: "Rae",
    quote: "The certificate looks useful for keeping with the rest of my bag’s paperwork.",
    image: "/user-review/michael-dam-mEZ3PoFGs_k-unsplash.webp",
    position: "50% 35%",
  },
  {
    nickname: "Jules",
    quote: "I can check the brands first and decide whether it’s worth starting. That’s a nice touch.",
    image: "/user-review/good-faces-xmSWVeGEnJw-unsplash.webp",
    position: "50% 36%",
  },
  {
    nickname: "Ellie",
    quote: "I’d feel better having the item details and the result together in one place.",
    image: "/user-review/jeffery-erhunse-Z9lbmEjyYjU-unsplash.webp",
    position: "50% 45%",
  },
  {
    nickname: "Nia",
    quote: "It's reassuring to see what the review covers before I decide to send anything.",
    image: "/user-review/jake-nackos-IF9TK5Uy-KI-unsplash.webp",
    position: "50% 35%",
  },
  {
    nickname: "Sam",
    quote: "I’d check the brand list first. It makes it easier to know if my item is supported.",
    image: "/user-review/vince-fleming-j3lf-Jn6deo-unsplash.webp",
    position: "50% 40%",
  },
  {
    nickname: "Owen",
    quote: "Having a photo checklist right there would help me prepare everything before I start.",
    image: "/user-review/vicky-hladynets-C8Ta0gwPbQg-unsplash.webp",
    position: "50% 40%",
  },
];

const columns = [comments.slice(0, 3), comments.slice(3, 6), comments.slice(6, 9)];

export function TestimonialsSection() {
  return (
    <section className="review-section section-pad border-t border-mc-muted bg-mc-soft px-4 sm:px-6 lg:px-8" aria-labelledby="sample-comments-heading">
      <div className="mx-auto max-w-7xl">
        <h2 id="sample-comments-heading" className="section-title">What people say.</h2>
        <p className="mt-3 text-xs text-mc-form-muted">Example comments with stock portraits.</p>
        <div className="review-viewport mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3" tabIndex={0} aria-label="Example comments. Hover or focus to pause scrolling.">
          {columns.map((column, index) => (
            <div className={`review-track review-track--${index + 1} min-w-0`} key={index}>
              {[false, true].map((copy) => (
                <div className={`review-cycle${copy ? " review-cycle--copy" : ""}`} key={String(copy)} aria-hidden={copy}>
                  {column.map(({ nickname, quote, image, position }) => (
                    <figure key={image} className="flex min-h-52 flex-col justify-between border border-mc-muted bg-[var(--mc-surface)] p-6">
                      <blockquote className="text-lg leading-7 text-mc-ink">“{quote}”</blockquote>
                      <figcaption className="mt-7 flex items-center gap-3 border-t border-mc-muted pt-4">
                        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-mc-muted">
                          <Image src={image} alt="" fill sizes="48px" className="object-cover" style={{ objectPosition: position }} />
                        </span>
                        <cite className="text-sm font-semibold not-italic text-mc-ink">{nickname}</cite>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
