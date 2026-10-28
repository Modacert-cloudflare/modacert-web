import Image from "next/image";

const comments = [
  {
    nickname: "Ari",
    quote: "I like knowing the price before I start. It makes the whole thing feel easier to plan.",
    image: "/user-review/christina-wocintechchat-com-m-0Zx1bDv5BNY-unsplash.jpg",
    position: "50% 35%",
  },
  {
    nickname: "Mina",
    quote: "The photo guide is the part I’d use most. I never know which details are worth showing.",
    image: "/user-review/h-ng-ph-m-nX8P-y9uVac-unsplash.jpg",
    position: "50% 44%",
  },
  {
    nickname: "Leo",
    quote: "It helps to see the steps up front. I’d rather know what happens after I send my photos.",
    image: "/user-review/luis-villasmil-hh3ViD0r0Rc-unsplash.jpg",
    position: "50% 40%",
  },
  {
    nickname: "Rae",
    quote: "The certificate looks useful for keeping with the rest of my bag’s paperwork.",
    image: "/user-review/michael-dam-mEZ3PoFGs_k-unsplash.jpg",
    position: "50% 35%",
  },
  {
    nickname: "Jules",
    quote: "I can check the brands first and decide whether it’s worth starting. That’s a nice touch.",
    image: "/user-review/good-faces-xmSWVeGEnJw-unsplash.jpg",
    position: "50% 36%",
  },
  {
    nickname: "Ellie",
    quote: "I’d feel better having the item details and the result together in one place.",
    image: "/user-review/jeffery-erhunse-Z9lbmEjyYjU-unsplash.jpg",
    position: "50% 45%",
  },
];

const columns = [comments.slice(0, 2), comments.slice(2, 4), comments.slice(4, 6)];

export function TestimonialsSection() {
  return (
    <section className="section-pad border-t border-mc-muted bg-mc-soft px-4 sm:px-6 lg:px-8" aria-labelledby="sample-comments-heading">
      <div className="mx-auto max-w-7xl">
        <h2 id="sample-comments-heading" className="section-title">What people say.</h2>
        <div className="review-viewport mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" tabIndex={0} aria-label="Sample comments. Hover or focus to pause scrolling.">
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
                        <span className="flex flex-col">
                          <cite className="text-sm font-semibold not-italic text-mc-ink">{nickname}</cite>
                          <span className="text-xs text-mc-form-muted">Illustrative review</span>
                        </span>
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
