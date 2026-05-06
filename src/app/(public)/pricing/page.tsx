"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PricingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState<"month" | "year">("month");

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await api.get<any[]>("/api/stripe/plans");
        if (response.success) {
          setPlans(response.data!);
        }
      } catch (err) {
        toast.error("Failed to fetch plans");
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  if (loading) return <div className="p-10 text-center">Loading plans...</div>;

  return (
    <div className="container mx-auto py-20">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
        <p className="text-muted-foreground">Choose the plan that's right for your business.</p>
        
        <div className="flex items-center justify-center gap-4 mt-8">
          <span className={interval === "month" ? "font-bold" : ""}>Monthly</span>
          <button 
            className="w-12 h-6 bg-primary rounded-full relative"
            onClick={() => setInterval(interval === "month" ? "year" : "month")}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${interval === "month" ? "left-1" : "left-7"}`} />
          </button>
          <span className={interval === "year" ? "font-bold" : ""}>Yearly (20% off)</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <div key={plan.id} className="border rounded-2xl p-8 flex flex-col hover:border-primary transition-colors">
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <p className="text-muted-foreground mb-6 h-12">{plan.description}</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">₹{plan.prices[interval]?.amount / 100}</span>
              <span className="text-muted-foreground">/{interval === "month" ? "mo" : "yr"}</span>
            </div>
            <ul className="space-y-3 mb-8 flex-grow">
              {plan.features.map((feature: string) => (
                <li key={feature} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button className="w-full" variant={plan.name === "Pro" ? "default" : "outline"}>
              Start Free Trial
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
