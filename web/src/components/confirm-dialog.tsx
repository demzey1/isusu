"use client";

import { useEffect } from "react";

import { Spinner } from "./icons";

export type ConfirmRow = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  strong?: boolean;
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  rows,
  note,
  confirmLabel,
  pendingLabel = "Working…",
  pending = false,
  error,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  rows: ConfirmRow[];
  note?: React.ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  pending?: boolean;
  error?: string | null;
  children?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose, pending]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        onClick={() => !pending && onClose()}
        className="absolute inset-0 cursor-default bg-ink/55"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[1.75rem] border border-ink/10 bg-cream p-5 shadow-[0_-20px_80px_-30px_rgba(20,17,15,0.6)] sm:max-w-md sm:rounded-card sm:p-6"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink/15 sm:hidden" />
        <h2 id="confirm-title" className="font-display text-2xl font-semibold tracking-[-0.02em]">
          {title}
        </h2>
        {description && <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{description}</p>}

        <dl className="mt-5 divide-y divide-ink/[0.08] rounded-2xl border border-ink/10 bg-white/40">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-ink/60">
                {row.label}
                {row.hint && <span className="mt-0.5 block text-[0.7rem] text-ink/35">{row.hint}</span>}
              </dt>
              <dd
                className={`tnum text-right font-mono text-sm ${
                  row.strong ? "text-[0.95rem] font-semibold text-ink" : "text-ink/80"
                }`}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        {children}

        {note && <div className="mt-4 rounded-2xl bg-ink/[0.04] p-3 text-xs leading-relaxed text-ink/60">{note}</div>}

        {error && (
          <p className="mt-4 rounded-2xl border border-clay/30 bg-clay/[0.07] p-3 text-sm text-clay" role="alert">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-full border border-ink/15 px-5 py-3 text-sm font-medium text-ink/70 transition hover:border-ink/30 hover:text-ink disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-marigold px-5 py-3 text-sm font-semibold text-ink transition hover:brightness-[1.03] disabled:opacity-70"
          >
            {pending && <Spinner />}
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>

        <p className="mt-3 text-center text-[0.68rem] leading-relaxed text-ink/35">
          Isusu never asks for a seed phrase, private key or pairing code.
        </p>
      </div>
    </div>
  );
}
