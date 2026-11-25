import Image from "next/image";

import { ButtonLink } from "@/components/button";
import { ArrowUpRight } from "@/components/icons";
import { LogoMark } from "@/components/logo";

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
      <section className="relative overflow-hidden bg-ink text-cream">
        <div
          className="dot-field pointer-events-none absolute inset-0 text-cream opacity-[0.09]"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid w-full max-w-6xl gap-9 px-4 pb-14 pt-9 sm:px-6 sm:pt-12 md:grid-cols-[1.02fr_0.98fr] md:items-center md:gap-12 md:pb-20 md:pt-16 lg:px-8">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-cream/15 px-3 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-cream/60">
              <span className="h-1.5 w-1.5 rounded-full bg-marigold" />
              Ajo, esusu, a circle you can verify
            </p>

            <h1 className="mt-6 font-display text-[clamp(2.9rem,7.2vw,5.4rem)] font-semibold leading-[0.94] tracking-[-0.045em]">
              Save together.
              <br />
              Take turns.
            </h1>

            <p className="mt-6 max-w-lg text-[1.05rem] leading-relaxed text-cream/65 sm:text-lg">
              Everyone pays the same each round. One person takes the pot. Your seat sets the order,
              and code enforces it.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="/pools" className="w-full sm:w-auto">
                Find a circle <ArrowUpRight />
              </ButtonLink>
              <ButtonLink href="/rules" variant="dark" className="w-full sm:w-auto">
                Read the rules
              </ButtonLink>
            </div>

            <dl className="mt-9 flex flex-wrap gap-x-8 gap-y-4 border-t border-cream/10 pt-6 text-sm">
              {[
                ["5", "people per circle"],
                ["1 or 2", "USDT each round"],
                ["0", "admins with keys"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="tnum font-mono text-lg text-marigold">{value}</dt>
                  <dd className="mt-0.5 text-xs leading-tight text-cream/45">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.75rem] border border-cream/10 sm:aspect-[5/4] md:aspect-[4/5]">
              <Image
                src="/hero/bridge.png"
                alt="Two people meeting on a bridge, drawn in halftone dots"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 46vw"
                className="hero-image object-cover object-[50%_42%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/5 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-cream/10 bg-ink/75 p-4 sm:inset-x-5 sm:bottom-5">
                <div className="flex items-center gap-2.5">
                  <LogoMark />
                  <p className="text-sm font-medium text-cream/90">A promise, made visible.</p>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-cream/50">
                  Everyone sees the same ring and whose turn it is.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative h-14 w-full sm:h-20" aria-hidden="true">
          <div className="dot-dissolve absolute inset-0" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ink/45">
              How it works
            </p>
            <h2 className="mt-2 max-w-xl font-display text-[clamp(2rem,4.5vw,3.2rem)] font-semibold leading-[1.02] tracking-[-0.035em]">
              The circle your grandmother ran, with the bookkeeping done for you.
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-ink/50">
            Same idea as a susu or a tanda, settled in USDT.
          </p>
        </div>

        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.number}
              className="relative flex flex-col rounded-card border border-ink/[0.09] bg-white/45 p-6 transition hover:border-ink/20 hover:bg-white/70"
            >
              <div className="flex items-center justify-between">
                <span className="tnum font-mono text-sm text-ink/35">{step.number}</span>
                <span className="flex gap-1" aria-hidden="true">
                  {Array.from({ length: index + 1 }, (_, dot) => (
                    <span key={dot} className="h-2 w-2 rounded-full bg-marigold" />
                  ))}
                  {Array.from({ length: 2 - index }, (_, dot) => (
                    <span key={dot} className="h-2 w-2 rounded-full bg-ink/10" />
                  ))}
                </span>
              </div>
              <h3 className="mt-6 font-display text-2xl font-semibold tracking-[-0.02em]">{step.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink/60">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-ink/[0.08] bg-marigold/[0.08]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Fixed terms. No fine print.
            </h2>
            <p className="mt-1 text-sm text-ink/55">
              Seats, collateral, payouts and defaults, written once.
            </p>
          </div>
          <ButtonLink href="/rules" variant="ghost" className="w-full shrink-0 sm:w-auto">
            Read the rules <ArrowUpRight />
          </ButtonLink>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-12 text-cream sm:px-10 sm:py-16">
          <div className="dot-field pointer-events-none absolute inset-0 text-cream opacity-[0.08]" aria-hidden="true" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-marigold/80">
                Start or join
              </p>
              <h2 className="mt-3 max-w-xl font-display text-[clamp(2rem,4.5vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.035em]">
                Money with people you know works better.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-cream/55">
                Open a circle for five, or take an open seat.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
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
