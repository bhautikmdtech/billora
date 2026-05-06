"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  Truck,
  Receipt,
  Settings,
  Zap,
  ChevronDown,
  Store,
  LogOut,
  User,
  CreditCard,
  Building2,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

function NavLink({ item, base }: { item: NavItem; base: string }) {
  const pathname = usePathname();
  const href = `${base}${item.href}`;
  const isActive = item.exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

interface SidebarProps {
  orgName: string;
  orgSlug: string;
  shopId: string;
  shopName: string;
  userEmail: string;
  userName: string;
  shops: { id: string; name: string }[];
}

export function Sidebar({
  orgName,
  orgSlug,
  shopId,
  shopName,
  userEmail,
  userName,
  shops,
}: SidebarProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const base = `/workspace/${orgSlug}/${shopId}`;

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: BarChart3, exact: true },
    { label: "POS", href: "/pos", icon: ShoppingCart },
    { label: "Inventory", href: "/inventory", icon: Package },
    { label: "Sales", href: "/sales", icon: Receipt },
    { label: "Purchases", href: "/purchases", icon: Truck },
    { label: "Customers", href: "/customers", icon: Users },
    { label: "Expenses", href: "/expenses", icon: CreditCard },
  ];

  const settingsItems: NavItem[] = [
    { label: "Members", href: "/members", icon: Users },
    { label: "Shop Settings", href: "/settings", icon: Settings },
  ];

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar-primary">
          <Zap className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        <span className="font-bold text-sidebar-foreground">Billora ERP</span>
      </div>

      {/* Org + Shop switcher */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="rounded-xl bg-sidebar-accent/50 p-2.5">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-sidebar-foreground/60 shrink-0" />
            <span className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wide truncate">
              {orgName}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="mt-1.5 flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                <div className="flex items-center gap-2 truncate">
                  <Store className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{shopName}</span>
                </div>
                <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Switch Shop</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {shops.map((s) => (
                <DropdownMenuItem key={s.id} asChild>
                  <Link href={`/workspace/${orgSlug}/${s.id}/dashboard`}>
                    <Store className="h-4 w-4 mr-2" />
                    {s.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} base={base} />
        ))}

        <div className="pt-4">
          <p className="px-3 pb-2 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
            Manage
          </p>
          {settingsItems.map((item) => (
            <NavLink key={item.href} item={item} base={base} />
          ))}
          <Link
            href={`/workspace/${orgSlug}/settings/subscription`}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
          >
            <CreditCard className="h-4 w-4 shrink-0" />
            Subscription
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-1 items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-sidebar-accent transition-colors text-left">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-sidebar-primary text-sidebar-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sidebar-foreground truncate">{userName}</p>
                  <p className="text-xs text-sidebar-foreground/50 truncate">{userEmail}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="h-4 w-4 mr-2" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => void handleSignOut()}
              >
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-xl bg-sidebar-background border border-sidebar-border shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col h-screen sticky top-0 border-r border-sidebar-border bg-sidebar-background">
        {sidebarContent}
      </aside>

      {/* Sidebar — mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 flex flex-col border-r border-sidebar-border bg-sidebar-background transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
