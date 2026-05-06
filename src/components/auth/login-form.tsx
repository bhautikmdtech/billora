"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectedFrom") || "/workspace";
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Logged in successfully");
    router.push(redirectTo);
    router.refresh();
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          redirectTo
        )}`,
      },
    });

    if (error) {
      toast.error(error.message);
    }
  }

  return (
    <AuthCard
      title="Login"
      description="Use your email and password, or continue with Google."
    >
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
      <Button className="w-full" onClick={() => void handleLogin()} disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
      <Button className="w-full" variant="outline" onClick={() => void handleGoogleLogin()}>
        Continue with Google
      </Button>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <Link href="/auth/forgot-password" className="hover:text-foreground">
          Forgot password?
        </Link>
        <Link href="/auth/register" className="hover:text-foreground">
          Create account
        </Link>
      </div>
    </AuthCard>
  );
}

