"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          "/onboarding/org"
        )}`,
        data: {
          full_name: fullName,
          phone,
        },
      },
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    if (data.user && data.session) {
      await api.post("/api/auth/complete-profile", {
        fullName,
        phone: phone || undefined,
      });
      toast.success("Account created");
      router.push("/onboarding/org");
      router.refresh();
    } else {
      toast.success("Verify your email to continue");
      router.push("/auth/verify-email");
    }

    setLoading(false);
  }

  return (
    <AuthCard
      title="Create account"
      description="Register your ShopFlow ERP account and start onboarding your organization."
    >
      <Input
        placeholder="Full name"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
      />
      <Input
        placeholder="Phone"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
      />
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <Button className="w-full" onClick={() => void handleRegister()} disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </Button>
      <div className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/auth/login" className="hover:text-foreground">
          Login
        </Link>
      </div>
    </AuthCard>
  );
}

