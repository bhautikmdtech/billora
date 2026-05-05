import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Start your ERP workspace"
      description="Create your account, verify your email, and onboard your first organization."
    >
      <RegisterForm />
    </AuthShell>
  );
}

