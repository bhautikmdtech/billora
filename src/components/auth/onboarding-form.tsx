"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { OrgCategory } from "@/types/domain";

const categories: OrgCategory[] = [
  "saree",
  "dress",
  "kariyana",
  "jewellery",
  "electronics",
  "hardware",
  "general",
];

export function OnboardingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [category, setCategory] = useState<OrgCategory>("general");
  const [shopName, setShopName] = useState("");

  async function handleSubmit() {
    setLoading(true);
    try {
      const response = await api.post<{
        org: { slug: string };
        shop: { id: string };
      }>("/api/auth/onboarding/org", {
        orgName,
        orgCategory: category,
        shopName,
      });

      if (response.success && response.data) {
        toast.success("Organization created");
        router.push(`/workspace/${response.data.org.slug}/${response.data.shop.id}/dashboard`);
        router.refresh();
      } else {
        toast.error(response.error || "Onboarding failed");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create your organization"
      description="Set up your legal business and first shop to enter the dashboard."
    >
      <Input
        placeholder="Organization name"
        value={orgName}
        onChange={(event) => setOrgName(event.target.value)}
      />
      <select
        className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
        value={category}
        onChange={(event) => setCategory(event.target.value as OrgCategory)}
      >
        {categories.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <Input
        placeholder="First shop name"
        value={shopName}
        onChange={(event) => setShopName(event.target.value)}
      />
      <Button className="w-full" onClick={() => void handleSubmit()} disabled={loading}>
        {loading ? "Creating..." : "Create organization"}
      </Button>
    </AuthCard>
  );
}

