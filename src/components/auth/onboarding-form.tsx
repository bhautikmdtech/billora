"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { toast } from "sonner";

import { onboardingSchema, type OnboardingInput } from "@/features/orgs/schemas";
import { createOrgOnboarding } from "@/features/orgs/actions";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES: { value: OnboardingInput["orgCategory"]; label: string }[] = [
  { value: "saree", label: "Saree" },
  { value: "dress", label: "Dress / Garments" },
  { value: "kariyana", label: "Kariyana / Grocery" },
  { value: "jewellery", label: "Jewellery" },
  { value: "electronics", label: "Electronics" },
  { value: "hardware", label: "Hardware" },
  { value: "general", label: "General / Other" },
];

export function OnboardingForm() {
  const [pending, startTransition] = useTransition();

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { orgName: "", orgCategory: "general", shopName: "" },
  });

  function onSubmit(values: OnboardingInput) {
    startTransition(async () => {
      try {
        await createOrgOnboarding(values);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <AuthCard
      title="Create your organization"
      description="Set up your business and first shop to start."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="orgName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Mehta Textiles" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="orgCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shopName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First shop name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Main Branch" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating..." : "Create organization"}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
