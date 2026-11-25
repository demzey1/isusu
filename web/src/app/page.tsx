import Image from "next/image";

import { ButtonLink } from "@/components/button";
import { ArrowUpRight } from "@/components/icons";

const STEPS = [
  {
    number: "01",
    title: "Pick a seat",
    body: "Seat 1 is paid first. Seat 5 waits longest and pays the least collateral.",
  },
  {
    number: "02",
    title: "Pay each round",
    body: "Everyone pays the same amount on the same rhythm. Round 1 is paid when you join.",
  },
  {
    number: "03",
    title: "Take the pot once",
    body: "When a round is fully paid, the contract sends the pot to that seat.",
  },
];

export default function HomePage() {
  return (
    <>
      <svg aria-hidden="true" className="pointer-events-none absolute h-0 w-0">
        <filter id="bridge-duotone" colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0.078 0.949" />
            <feFuncG type="table" tableValues="0.067 0.663" />
            <feFuncB type="table" tableValues="0.059 0.231" />
          </feComponentTransfer>
        </filter>
      </svg>

      <section className="bg-cream">
        <div className="container-shell section-shell">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="min-w-0">
              <p className="label">Ajo, esusu, a circle you can verify</p>
              <h1 className="mt-6 max-w-3xl">
                Save together.
                <br />
                Take turns.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-secondary sm:text-lg">
                Everyone pays the same each round. One person takes the pot. Your seat sets the
                order, and code enforces it.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <ButtonLink href="/pools" className="w-full sm:w-auto">
                  Find a circle <ArrowUpRight />
                </ButtonLink>
                <ButtonLink href="/rules" variant="ghost" className="w-full sm:w-auto">
                  Read the rules
                </ButtonLink>
              </div>
            </div>

            <div className="min-w-0">
              <div className="relative aspect-[4/5] w-full">
                <Image
                  src="/hero/bridge.png"
                  alt="Two people meeting on a bridge"
                  fill
                  priority
                  sizes="(max-width: 1023px) 100vw, 46vw"
                  className="object-cover object-[50%_42%]"
                  style={{ filter: "url(#bridge-duotone)" }}
                />
              </div>
            </div>
          </div>

          <dl className="mt-16 grid grid-cols-3 gap-4 border-t border-line pt-6">
            {[
              { value: "5", label: "Seats per circle" },
              { value: "1 or 2", label: "USDT each round" },
              { value: "0", label: "Admins with keys" },
            ].map((stat) => (
              <div key={stat.label} className="min-w-0">
                <dt className="tnum font-mono text-xl leading-none text-ink sm:text-2xl">
                  {stat.value}
                </dt>
                <dd className="mt-2 text-xs font-semibold uppercase leading-snug tracking-[0.08em] text-secondary">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-cream">
        <div className="container-shell section-shell">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="label">How it works</p>
              <h2 className="mt-3 max-w-2xl">
                The circle your grandmother ran, with the bookkeeping done for you.
              </h2>
            </div>
            <p className="max-w-sm text-base leading-relaxed text-secondary">
              Same idea as a susu or a tanda, settled in USDT.
            </p>
          </div>

          <ol className="mt-12 grid gap-10 lg:grid-cols-3 lg:gap-8">
            {STEPS.map((step) => (
              <li key={step.number} className="min-w-0 border-t border-line pt-6">
                <span className="tnum font-mono text-sm font-medium text-marigold">
                  {step.number}
                </span>
                <h3 className="mt-4 font-display text-[1.75rem] font-normal leading-tight tracking-[-0.01em]">
                  {step.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-secondary">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-ink text-cream">
        <div className="container-shell py-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-marigold">
                Start or join
              </p>
              <h2 className="mt-3 max-w-2xl text-cream">
                Money with people you know works better.
              </h2>
              <p className="mt-3 max-w-lg text-base leading-relaxed text-cream/75">
                Open a circle for five, or take an open seat.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <ButtonLink href="/pools" className="w-full sm:w-auto">
                Browse circles <ArrowUpRight />
              </ButtonLink>
              <ButtonLink href="/pools/create" variant="dark" className="w-full sm:w-auto">
                Start a circle
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
