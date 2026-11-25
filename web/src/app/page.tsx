import Image from "next/image";

import { ButtonLink } from "@/components/button";
import { ArrowUpRight, Check } from "@/components/icons";
import { LogoMark } from "@/components/logo";
import { RiskNote } from "@/components/risk-note";

const STEPS = [
  {
    number: "01",
    title: "Pick your seat",
    body: "Seat 1 takes the pot first. Seat 5 waits longest and pays the least collateral today. Your seat is yours alone.",
  },
  {
    number: "02",
    title: "Pay every round",
    body: "Everyone pays the same contribution on the same rhythm. Your first payment happens when you join, so the pot is never short.",
  },
  {
    number: "03",
    title: "Take the pot once",
    body: "As soon as a round is fully paid, the contract sends the whole pot to that seat. Automatically, in the same transaction.",
  },
];

const RULES = [
  {
    title: "Miss a round early, lose the seat",
    body: "If you miss a payment before your own payout, your seat and collateral are gone. That protects everyone still waiting.",
  },
  {
    title: "Seats are final",
    body: "Once the circle starts there are no exits, swaps or refunds until the end. Choose your turn as carefully as you choose the people.",
  },
  {
    title: "A default doesn't stop the circle",
    body: "If someone defaults, the circle still pays every remaining seat. But top-ups can arrive at the end of the circle, not instantly.",
  },
  {
    title: "No fill, no problem",
    body: "If the circle isn't full by its join deadline, anyone can cancel it. Every member takes back their full payment and collateral.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden bg-ink text-cream">
        <div
          className="dot-field pointer-events-none absolute inset-0 text-cream opacity-[0.09]"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid w-full max-w-6xl gap-9 px-4 pb-14 pt-9 sm:px-6 sm:pt-12 md:grid-cols-[1.02fr_0.98fr] md:items-center md:gap-12 md:pb-20 md:pt-16 lg:px-8">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-cream/15 px-3 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-cream/60">
              <span className="h-1.5 w-1.5 rounded-full bg-marigold" />
              Ajo · Esusu · a circle you can verify
            </p>

            <h1 className="mt-6 font-display text-[clamp(2.9rem,7.2vw,5.4rem)] font-semibold leading-[0.94] tracking-[-0.045em]">
              Save together.
              <br />
              Take turns.
            </h1>

            <p className="mt-6 max-w-lg text-[1.05rem] leading-relaxed text-cream/65 sm:text-lg">
              Everyone pays the same amount each round. One person takes the whole pot. The order is
              the seat you choose — and the code can&apos;t be edited, paused or sweet-talked.
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
                  <LogoMark className="h-7 w-7" />
                  <p className="text-sm font-medium text-cream/90">A circle is a promise, made visible.</p>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-cream/50">
                  Everyone sees the same ring, the same round and whose turn it is. No ledgers kept in
                  someone&apos;s head.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative h-14 w-full sm:h-20" aria-hidden="true">
          <div className="dot-dissolve absolute inset-0" />
        </div>
      </section>

      {/* ------------------------------------------------------------ how it works */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-indigo/70">
              How it works
            </p>
            <h2 className="mt-2 max-w-xl font-display text-[clamp(2rem,4.5vw,3.2rem)] font-semibold leading-[1.02] tracking-[-0.035em]">
              The circle your grandmother ran, with the bookkeeping done for you.
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-ink/50">
            Same idea as a susu, a pardna or a tanda: trust, made explicit and settled in USDT.
          </p>
        </div>

        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.number}
              className="relative flex flex-col rounded-card border border-ink/[0.09] bg-white/45 p-6 transition hover:border-ink/20 hover:bg-white/70"
            >
              <div className="flex items-center justify-between">
                <span className="tnum font-mono text-sm text-indigo/50">{step.number}</span>
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

      {/* ------------------------------------------------------------------ rules */}
      <section className="border-y border-ink/[0.08] bg-indigo/[0.035]">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-indigo/70">
                The rules
              </p>
              <h2 className="mt-2 font-display text-[clamp(2rem,4.5vw,3.2rem)] font-semibold leading-[1.02] tracking-[-0.035em]">
                No fine print. Just the terms.
              </h2>
              <p className="mt-4 max-w-sm text-[0.95rem] leading-relaxed text-ink/60">
                These are enforced by the contract, not by a group admin. Read them before you put
                anything in.
              </p>
              <ButtonLink href="/rules" variant="ghost" className="mt-6">
                Read all the rules <ArrowUpRight />
              </ButtonLink>
            </div>

            <ol className="divide-y divide-ink/[0.09] border-y border-ink/[0.09]">
              {RULES.map((rule, index) => (
                <li key={rule.title} className="flex gap-4 py-4 sm:gap-6 sm:py-5">
                  <span className="tnum mt-0.5 font-mono text-xs text-clay/80">0{index + 1}</span>
                  <div>
                    <h3 className="font-display text-lg font-semibold tracking-[-0.01em] sm:text-xl">
                      {rule.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink/60">{rule.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- turn ring */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid items-center gap-10 rounded-[2rem] border border-ink/[0.09] bg-white/40 p-6 sm:p-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-indigo/70">
              Your turn, visible
            </p>
            <h2 className="mt-2 font-display text-[clamp(1.9rem,4vw,2.9rem)] font-semibold leading-[1.04] tracking-[-0.03em]">
              One ring. Everyone can see whose turn it is.
            </h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-ink/60">
              Each seat is a person. The dot that glows gets this round&apos;s pot. Paid seats turn
              green. A late seat turns clay, so nobody has to guess or send awkward messages.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-ink/65">
              {[
                "Choose your seat and see the exact cost before you join",
                "Round 1 plus collateral, shown to the cent",
                "Every payout is automatic — no chasing, no claiming",
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-moss" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[22rem]">
            <div className="absolute inset-0 rounded-full border border-ink/10" />
            <div className="absolute inset-[9%] rounded-full border border-dashed border-ink/15" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-[46%] w-[46%] flex-col items-center justify-center rounded-full bg-cream text-center shadow-[inset_0_0_0_1px_rgba(20,17,15,0.06)]">
                <span className="text-[0.58rem] uppercase tracking-[0.16em] text-ink/35">Round 3 of 5</span>
                <span className="tnum mt-1 font-mono text-2xl font-medium text-ink">500</span>
                <span className="text-[0.6rem] text-ink/40">USDT pot</span>
              </div>
            </div>
            {[
              { slot: 1, state: "done" },
              { slot: 2, state: "done" },
              { slot: 3, state: "current" },
              { slot: 4, state: "paid" },
              { slot: 5, state: "open" },
            ].map((seat, index) => {
              const angle = (index / 5) * Math.PI * 2 - Math.PI / 2;
              const style = {
                left: `${50 + Math.cos(angle) * 43}%`,
                top: `${50 + Math.sin(angle) * 43}%`,
              };
              const className =
                seat.state === "current"
                  ? "bg-marigold text-ink ring-halo"
                  : seat.state === "paid"
                    ? "bg-moss text-cream"
                    : seat.state === "done"
                      ? "bg-ink/80 text-cream"
                      : "border-2 border-dashed border-ink/25 bg-cream text-ink/30";
              return (
                <span
                  key={seat.slot}
                  style={style}
                  className={`absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-mono text-xs sm:h-14 sm:w-14 ${className}`}
                >
                  {seat.slot}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- cta */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
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
                Open a circle for five, or take an open seat in one that&apos;s already forming.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/pools" className="w-full sm:w-auto">
                Browse circles <ArrowUpRight />
              </ButtonLink>
              <ButtonLink
                href="/pools/create"
                variant="dark"
                className="w-full sm:w-auto"
              >
                Start a circle
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
        <RiskNote />
      </section>
    </>
  );
}
