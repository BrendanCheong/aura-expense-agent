import Link from 'next/link';

export default function Home() {
  return (
    <main className="aurora-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-8">
      {/* Content */}
      <div className="relative z-10 text-center">
        <h1 className="font-display text-5xl tracking-[-0.03em] sm:text-6xl">Aura</h1>
        <p className="mt-3 font-heading text-lg font-medium tracking-tight text-muted-foreground sm:text-xl">
          Zero-touch financial intelligence
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground/80">
          Forward your bank emails. Aura categorizes, tracks, and learns your spending patterns — so
          you never have to.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 font-heading text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-sm transition-all hover:shadow-[0_0_16px_hsla(165,100%,50%,0.15)]"
          >
            Get Started
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-border px-8 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
