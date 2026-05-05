import Link from "next/link";
import {
  ArrowRight,
  ChartBarStacked,
  ScanLine,
  ShieldCheck,
  Store,
} from "lucide-react";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const featureCards = [
  {
    title: "Drizzle-first backend",
    description:
      "App-managed queries, typed schema, simple migrations, and server-side pagination.",
    icon: ChartBarStacked,
  },
  {
    title: "Retail-ready workflows",
    description:
      "Built for branch-led stores that need POS, stock, billing, and daily ops in one place.",
    icon: Store,
  },
  {
    title: "Mobile-forward design",
    description:
      "Fast tap targets, compact cards, and a layout that still feels sharp on desktop.",
    icon: ScanLine,
  },
  {
    title: "Supabase where it fits",
    description:
      "Auth and platform services stay available without pushing business logic into SQL helpers.",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.16),_transparent_22%),radial-gradient(circle_at_20%_20%,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(180deg,var(--background),color-mix(in_oklab,var(--background)_82%,var(--muted)))]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-3xl border border-border/70 bg-background/80 px-4 py-3 backdrop-blur sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              ShopFlow ERP
            </p>
            <p className="text-sm font-medium">Retail operating system</p>
          </div>
          <ThemeToggle />
        </header>

        <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:py-16">
          <div>
            <Badge className="mb-4">
              Phase 1 is live with Drizzle and App Router APIs
            </Badge>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Run stock, branches, billing, and daily retail ops from one calm
              control room.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              The project is now moving with Drizzle as the database layer,
              app-side business rules, server pagination, and a responsive themed
              workspace we can keep extending module by module.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/workspace">
                  Open Workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#features">See the current foundation</a>
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden border-primary/10 bg-card/95">
            <CardHeader>
              <CardTitle>What this pass sets up</CardTitle>
              <CardDescription>
                Not mockups. Real building blocks we can keep layering on.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {[
                "Drizzle schema and Postgres client",
                "Simple SQL migration without Supabase helper functions",
                "Typed App Router APIs for orgs, shops, and overview",
                "Global pagination and API response shape",
                "Light/dark themed responsive workspace",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border/60 bg-background/65 px-4 py-3 text-sm"
                >
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section
          id="features"
          className="grid gap-4 pb-8 md:grid-cols-2 xl:grid-cols-4"
        >
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="h-full">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}

