import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getInviteByToken } from "@/db/queries/invites.queries";
import { InviteAcceptForm } from "./invite-accept-form";
import { AuthShell } from "@/components/auth/auth-shell";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const inviteData = await getInviteByToken(token);

  if (!inviteData) notFound();

  const { invite, organization, inviter } = inviteData;

  if (invite.status !== "pending") {
    return (
      <AuthShell title="Invite unavailable" description="">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            This invite has already been{" "}
            <span className="font-medium text-foreground">{invite.status}</span>.
          </p>
        </div>
      </AuthShell>
    );
  }

  if (new Date() > new Date(invite.expiresAt)) {
    return (
      <AuthShell title="Invite expired" description="">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            This invite link has expired. Ask the admin to send a new one.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="You've been invited"
      description={`Join ${organization.name} on Billora ERP.`}
    >
      <Suspense>
        <InviteAcceptForm
          token={token}
          invitedEmail={invite.invitedEmail}
          orgName={organization.name}
          role={invite.role}
          inviterName={inviter?.fullName ?? null}
        />
      </Suspense>
    </AuthShell>
  );
}
