import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Package,
  QrCode,
  ShieldCheck,
  Smartphone,
  Zap,
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

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Billora ERP</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
            <a href="#about" className="text-sm font-medium hover:text-primary transition-colors">About</a>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-4" variant="secondary">
                The modern retail operating system
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
                Run your entire retail business from one calm control room.
              </h1>
              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                Billora ERP helps multi-branch stores manage stock, billing, staff, and daily operations with ease. Built for speed, reliability, and scale.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/auth/register">
                  <Button size="lg" className="h-12 px-8 text-lg">
                    Start 14-Day Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#pricing">
                  <Button variant="outline" size="lg" className="h-12 px-8 text-lg">
                    See Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-50" />
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-24 bg-muted/30">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Everything you need to grow</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Powerful tools designed for the unique challenges of multi-branch retail management.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard 
                icon={Package}
                title="Stock Management"
                description="Real-time inventory tracking across all your branches with low-stock alerts."
              />
              <FeatureCard 
                icon={Zap}
                title="Fast POS"
                description="A lightning-fast checkout experience designed for high-volume retail."
              />
              <FeatureCard 
                icon={QrCode}
                title="QR Code Systems"
                description="Generate and scan QR codes for items, tracking every single unit with precision."
              />
              <FeatureCard 
                icon={Smartphone}
                title="WhatsApp Billing"
                description="Send professional PDF bills directly to your customers via WhatsApp."
              />
              <FeatureCard 
                icon={BarChart3}
                title="Deep Insights"
                description="Comprehensive reports on sales, GST, staff performance, and more."
              />
              <FeatureCard 
                icon={ShieldCheck}
                title="Multi-Branch Secure"
                description="Role-based access control to keep your data safe and operations smooth."
              />
            </div>
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section className="py-24">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">Built for diverse retail domains</h2>
                <div className="space-y-4">
                  <RetailType label="Clothing & Saree Showrooms" />
                  <RetailType label="Jewellery Stores" />
                  <RetailType label="Electronics & Hardware" />
                  <RetailType label="General Kariyana & Provision" />
                  <RetailType label="Footwear & Accessories" />
                </div>
              </div>
              <div className="relative aspect-video rounded-2xl border bg-card shadow-2xl flex items-center justify-center p-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
                <img 
                  src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=1200&auto=format&fit=crop" 
                  alt="POS App Mockup" 
                  className="rounded-lg shadow-lg relative z-10"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 border-t">
          <div className="container text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-6">Ready to streamline your retail operations?</h2>
            <p className="text-muted-foreground mb-10 max-w-xl mx-auto">Join hundreds of shop owners who trust Billora ERP to manage their daily business.</p>
            <Link href="/auth/register">
              <Button size="lg" className="h-12 px-10 text-lg">
                Start Your Free Trial Now
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/20">
        <div className="container flex flex-col md:flex-row justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-bold">Billora ERP</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              The modern, cloud-based retail operating system for ambitious shop owners.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="font-bold text-sm mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground font-medium">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors">Updates</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground font-medium">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground font-medium">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="container mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Billora ERP. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <Card className="border-none shadow-none bg-card transition-all hover:bg-muted/50 group">
      <CardHeader>
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-6 w-6" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function RetailType({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle2 className="h-5 w-5 text-primary" />
      <span className="font-medium">{label}</span>
    </div>
  );
}
