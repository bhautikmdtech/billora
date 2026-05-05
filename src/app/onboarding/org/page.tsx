import { AuthShell } from "@/components/auth/auth-shell";
import { OnboardingForm } from "@/components/auth/onboarding-form";

export default function OnboardingOrgPage() {
  return (
    <AuthShell
      title="Create your business workspace"
      description="Add the organization and first branch that your team will use day to day."
    >
      <OnboardingForm />
    </AuthShell>
  );
}

