"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    }

    async function fetchInvite() {
      try {
        const response = await api.get<any>(`/api/invites/${params.token}`);
        if (response.success) {
          setInvite(response.data);
        } else {
          toast.error(response.error || "Invite not found");
        }
      } catch (err) {
        toast.error("Failed to fetch invite");
      } finally {
        setLoading(false);
      }
    }

    checkUser();
    fetchInvite();
  }, [params.token]);

  async function handleAccept() {
    setAccepting(true);
    try {
      const response = await api.post<any>(`/api/invites/${params.token}/accept`, {
        fullName,
        password,
      });

      if (response.success) {
        toast.success("Invite accepted!");
        router.push(`/workspace/${response.data.org.slug}`);
      } else {
        toast.error(response.error || "Failed to accept invite");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setAccepting(false);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (!invite) return <div>Invite not found or expired.</div>;

  return (
    <AuthShell
      title="You've been invited"
      description={`Join ${invite.org.name} as ${invite.invite.role}.`}
    >
      <AuthCard title="Accept Invitation" description={`Invited by ${invite.invite.invitedBy}`}>
        {!isLoggedIn && (
          <>
            <Input
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Create Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </>
        )}
        <Button className="w-full" onClick={handleAccept} disabled={accepting}>
          {accepting ? "Accepting..." : "Accept Invitation"}
        </Button>
      </AuthCard>
    </AuthShell>
  );
}
