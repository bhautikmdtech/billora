import Link from "next/link";

import { ThemeToggle } from "@/components/shared/theme-toggle";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.16),_transparent_25%),linear-gradient(180deg,var(--background),color-mix(in_oklab,var(--background)_84%,var(--muted)))] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl flex-col">
        <header className="mb-8 flex items-center justify-between rounded-3xl border border-border/70 bg-background/80 px-4 py-3 backdrop-blur sm:px-6">
          <Link href="/" className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              ShopFlow ERP
            </span>
            <span className="text-sm font-medium">Retail operating system</span>
          </Link>
          <ThemeToggle />
        </header>

        <div className="grid flex-1 items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
          <section className="hidden lg:block">
            <div className="max-w-xl">
              <p className="text-sm uppercase tracking-[0.28em] text-primary">
                Secure Access
              </p>
              <h1 className="mt-4 text-5xl font-semibold leading-tight">
                {title}
              </h1>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                {description}
              </p>
            </div>
          </section>

          <section>{children}</section>
        </div>
      </div>
    </main>
  );
}

