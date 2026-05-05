import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Set a new password"
      description="You reached this page through a secure recovery link and can now update your credentials."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}

