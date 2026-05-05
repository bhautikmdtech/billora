import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Verify your email"
      description="Check your inbox and open the verification link to finish creating your account."
    >
      <AuthCard
        title="Email verification pending"
        description="After verification, you'll be redirected back into the onboarding flow."
      >
        <Button asChild className="w-full">
          <Link href="/auth/login">Back to login</Link>
        </Button>
      </AuthCard>
    </AuthShell>
  );
}

