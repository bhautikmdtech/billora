"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
  RotateCcw,
  UserCheck,
  Wallet,
  Megaphone,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import type { OrgRole } from "@/types/domain";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  roles?: OrgRole[];
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

function NavSection({
  title,
  items,
  base,
}: {
  title: string;
  items: NavItem[];
  base: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="pt-3">
      <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
        {title}
      </p>
      {items.map((item) => (
        <NavLink key={item.href} item={item} base={base} />
      ))}
    </div>
  );
}

export interface SidebarProps {
  orgName: string;
  orgSlug: string;
  shopId: string;
  shopName: string;
  userEmail: string;
  userName: string;
  userRole: OrgRole;
  shops: { id: string; name: string }[];
}

export function Sidebar({
  orgName,
  orgSlug,
  shopId,
  shopName,
  userEmail,
  userName,
  userRole,
  shops,
}: SidebarProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const base = `/workspace/${orgSlug}/${shopId}`;

  const isManager =
    userRole === "org_owner" || userRole === "partner" || userRole === "admin";

  const coreItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: BarChart3, exact: true },
    { label: "POS", href: "/pos", icon: ShoppingCart },
    { label: "Sales", href: "/sales", icon: Receipt },
    { label: "Inventory", href: "/inventory", icon: Package },
  ];

  const opsItems: NavItem[] = [
    { label: "Purchases", href: "/purchases", icon: Truck },
    { label: "Returns", href: "/returns", icon: RotateCcw },
    { label: "Suppliers", href: "/suppliers", icon: LayoutGrid },
    { label: "Customers", href: "/customers", icon: Users },
    { label: "Expenses", href: "/expenses", icon: Wallet },
  ];

  const managementItems: NavItem[] = [
    { label: "Employees", href: "/employees", icon: UserCheck },
    { label: "Members", href: "/members", icon: Users },
    ...(isManager ? [{ label: "Marketing", href: "/marketing", icon: Megaphone }] : []),
  ];

  const settingsItems: NavItem[] = [
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
      <div className="border-b border-sidebar-border p-3">
        <div className="rounded-xl bg-sidebar-accent/50 p-2.5">
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/50" />
            <span className="truncate text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/50">
              {orgName}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="mt-1.5 flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent">
                <div className="flex min-w-0 items-center gap-2">
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
                    <Store className="mr-2 h-4 w-4" />
                    {s.name}
                  </Link>
                </DropdownMenuItem>
              ))}
              {isManager && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/workspace/${orgSlug}/settings/shops`}>
                      <Settings className="mr-2 h-4 w-4" />
                      Manage shops
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {coreItems.map((item) => (
          <NavLink key={item.href} item={item} base={base} />
        ))}
        <NavSection title="Operations" items={opsItems} base={base} />
        <NavSection title="Manage" items={managementItems} base={base} />
        <NavSection title="Settings" items={settingsItems} base={base} />
        {isManager && (
          <div className="pt-3">
            <Link
              href={`/workspace/${orgSlug}/settings/subscription`}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-sidebar-foreground/70 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <CreditCard className="h-4 w-4 shrink-0" />
              Subscription
            </Link>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-1 items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-sidebar-primary text-xs text-sidebar-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-sidebar-foreground">{userName}</p>
                  <p className="truncate text-xs text-sidebar-foreground/50">{userEmail}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => void handleSignOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 rounded-xl border border-sidebar-border bg-sidebar-background p-2 shadow-lg lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar-background lg:flex">
        {sidebarContent}
      </aside>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-sidebar-border bg-sidebar-background transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
