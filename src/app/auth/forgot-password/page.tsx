import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset access"
      description="Use Supabase recovery links to safely regain access without contacting support."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}

