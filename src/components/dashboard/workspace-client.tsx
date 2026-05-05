"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Building2, ChevronRight, Layers3, Plus, Search, Store } from "lucide-react";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { formatISTDate } from "@/lib/utils";
import type { PaginationMeta } from "@/types/api";
import type { OrgCategory } from "@/types/domain";

type OrgRow = {
  id: string;
  name: string;
  slug: string;
  category: OrgCategory;
  phone: string | null;
  email: string | null;
  createdAt: string;
  shopCount: number;
  activePlan: string | null;
};

type OverviewResponse = {
  stats: {
    organizations: number;
    shops: number;
    activeCategories: number;
  };
  recentOrganizations: Array<{
    id: string;
    name: string;
    slug: string;
    category: OrgCategory;
    createdAt: string;
  }>;
  categoryMix: Array<{
    category: OrgCategory;
    count: number;
  }>;
};

type ShopRow = {
  id: string;
  orgId: string;
  name: string;
  code: string;
  phone: string | null;
  email: string | null;
  createdAt: string;
};

const categoryOptions: OrgCategory[] = [
  "saree",
  "dress",
  "kariyana",
  "jewellery",
  "electronics",
  "hardware",
  "general",
];

export function WorkspaceClient() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [organizations, setOrganizations] = useState<OrgRow[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | undefined>();
  const [search, setSearch] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [orgForm, setOrgForm] = useState({
    name: "",
    category: "general" as OrgCategory,
    phone: "",
    email: "",
  });
  const [shopForm, setShopForm] = useState({
    name: "",
    code: "",
    phone: "",
    email: "",
  });
  const [submittingOrg, setSubmittingOrg] = useState(false);
  const [submittingShop, setSubmittingShop] = useState(false);

  const loadOverview = useCallback(async () => {
    const response = await api.get<OverviewResponse>("/api/dashboard/overview");
    setOverview(response.data);
  }, []);

  const loadOrganizations = useCallback(
    async (nextSearch = search, page = 1) => {
      const response = await api.get<OrgRow[]>("/api/orgs", {
        search: nextSearch || undefined,
        page,
        limit: 8,
      });
      setOrganizations(response.data);
      setPagination(response.meta);

      if (!selectedOrgId && response.data[0]) {
        setSelectedOrgId(response.data[0].id);
      }
    },
    [search, selectedOrgId]
  );

  const loadShops = useCallback(async (orgId: string) => {
    const response = await api.get<ShopRow[]>(`/api/orgs/${orgId}/shops`);
    setShops(response.data);
  }, []);

  useEffect(() => {
    const run = async () => {
      await loadOverview();
      await loadOrganizations();
    };

    void run();
  }, [loadOrganizations, loadOverview]);

  useEffect(() => {
    if (selectedOrgId) {
      const run = async () => {
        await loadShops(selectedOrgId);
      };

      void run();
    } else {
      startTransition(() => {
        setShops([]);
      });
    }
  }, [loadShops, selectedOrgId]);

  const selectedOrg = useMemo(
    () =>
      organizations.find((organization) => organization.id === selectedOrgId) ??
      null,
    [organizations, selectedOrgId]
  );

  async function handleCreateOrganization() {
    setSubmittingOrg(true);
    try {
      await api.post("/api/orgs", {
        ...orgForm,
        phone: orgForm.phone || undefined,
        email: orgForm.email || undefined,
      });
      toast.success("Organization created");
      setOrgForm({ name: "", category: "general", phone: "", email: "" });
      await Promise.all([loadOrganizations(), loadOverview()]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create organization"
      );
    } finally {
      setSubmittingOrg(false);
    }
  }

  async function handleCreateShop() {
    if (!selectedOrgId) {
      toast.error("Choose an organization first");
      return;
    }

    setSubmittingShop(true);
    try {
      await api.post(`/api/orgs/${selectedOrgId}/shops`, {
        ...shopForm,
        phone: shopForm.phone || undefined,
        email: shopForm.email || undefined,
      });
      toast.success("Shop created");
      setShopForm({ name: "", code: "", phone: "", email: "" });
      await Promise.all([
        loadShops(selectedOrgId),
        loadOrganizations(),
        loadOverview(),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create shop");
    } finally {
      setSubmittingShop(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_24%),linear-gradient(180deg,var(--background),color-mix(in_oklab,var(--background)_78%,var(--muted)))]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-20 mb-6 flex items-center justify-between rounded-3xl border border-border/60 bg-background/75 px-4 py-3 backdrop-blur sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
              ShopFlow ERP
            </p>
            <h1 className="text-lg font-semibold sm:text-2xl">
              Workspace Control Room
            </h1>
          </div>
          <ThemeToggle />
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            icon={<Building2 className="h-5 w-5" />}
            label="Organizations"
            value={overview?.stats.organizations ?? 0}
            caption="Live across your tenant base"
          />
          <MetricCard
            icon={<Store className="h-5 w-5" />}
            label="Shops"
            value={overview?.stats.shops ?? 0}
            caption="Branches currently tracked"
          />
          <MetricCard
            icon={<Layers3 className="h-5 w-5" />}
            label="Categories"
            value={overview?.stats.activeCategories ?? 0}
            caption="Retail segments in the system"
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/60">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Organizations</CardTitle>
                  <CardDescription>
                    Server-side pagination is ready. This is the first real
                    Drizzle-backed list.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void loadOrganizations(search, 1);
                      }
                    }}
                    className="pl-9"
                    placeholder="Search orgs"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-3">
                {organizations.map((organization) => (
                  <button
                    key={organization.id}
                    onClick={() => setSelectedOrgId(organization.id)}
                    className={`group flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                      selectedOrgId === organization.id
                        ? "border-primary/60 bg-primary/5"
                        : "border-border/60 bg-background/60 hover:border-primary/30 hover:bg-accent/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{organization.name}</p>
                        <Badge variant="outline">{organization.category}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {organization.shopCount} shops •{" "}
                        {organization.activePlan ?? "Free"} plan
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" />
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-dashed border-border/70 px-4 py-3 text-sm text-muted-foreground">
                <span>
                  Page {pagination?.page ?? 1} of {pagination?.pages ?? 1}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination || pagination.page <= 1}
                    onClick={() =>
                      void loadOrganizations(search, (pagination?.page ?? 1) - 1)
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination || pagination.page >= pagination.pages}
                    onClick={() =>
                      void loadOrganizations(search, (pagination?.page ?? 1) + 1)
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Organization</CardTitle>
                <CardDescription>
                  Start onboarding an owner and first branch from here.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Input
                  placeholder="Organization name"
                  value={orgForm.name}
                  onChange={(event) =>
                    setOrgForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
                <select
                  className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                  value={orgForm.category}
                  onChange={(event) =>
                    setOrgForm((current) => ({
                      ...current,
                      category: event.target.value as OrgCategory,
                    }))
                  }
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Phone"
                  value={orgForm.phone}
                  onChange={(event) =>
                    setOrgForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Email"
                  value={orgForm.email}
                  onChange={(event) =>
                    setOrgForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
                <Button
                  onClick={() => void handleCreateOrganization()}
                  disabled={submittingOrg}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {submittingOrg ? "Creating..." : "Create organization"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Selected Organization</CardTitle>
                <CardDescription>
                  {selectedOrg
                    ? `Manage shops for ${selectedOrg.name}`
                    : "Choose an organization to continue"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedOrg ? (
                  <>
                    <div className="rounded-2xl bg-muted/60 p-4">
                      <p className="font-medium">{selectedOrg.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Created {formatISTDate(selectedOrg.createdAt, "dd MMM yyyy")}
                      </p>
                    </div>
                    <div className="grid gap-3">
                      <Input
                        placeholder="Shop name"
                        value={shopForm.name}
                        onChange={(event) =>
                          setShopForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                      />
                      <Input
                        placeholder="Code"
                        value={shopForm.code}
                        onChange={(event) =>
                          setShopForm((current) => ({
                            ...current,
                            code: event.target.value,
                          }))
                        }
                      />
                      <Input
                        placeholder="Phone"
                        value={shopForm.phone}
                        onChange={(event) =>
                          setShopForm((current) => ({
                            ...current,
                            phone: event.target.value,
                          }))
                        }
                      />
                      <Button
                        variant="secondary"
                        onClick={() => void handleCreateShop()}
                        disabled={submittingShop}
                      >
                        {submittingShop ? "Creating..." : "Add shop"}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {shops.map((shop) => (
                        <div
                          key={shop.id}
                          className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{shop.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {shop.code} • {shop.phone ?? "No phone yet"}
                              </p>
                            </div>
                            <Badge>{shop.code}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Pick an organization from the left to see and create shops.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Category Mix</CardTitle>
              <CardDescription>
                Useful for pricing, onboarding flows, and dashboard presets later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview?.categoryMix.map((item) => (
                <div key={item.category} className="flex items-center justify-between">
                  <span className="capitalize text-sm">{item.category}</span>
                  <Badge variant="outline">{item.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Organizations</CardTitle>
              <CardDescription>
                The dashboard is already connected to the real database layer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview?.recentOrganizations.map((organization) => (
                <div
                  key={organization.id}
                  className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{organization.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {organization.slug} • {formatISTDate(organization.createdAt)}
                      </p>
                    </div>
                    <Badge variant="outline">{organization.category}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  caption,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  caption: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{caption}</p>
        </div>
      </CardContent>
    </Card>
  );
}
