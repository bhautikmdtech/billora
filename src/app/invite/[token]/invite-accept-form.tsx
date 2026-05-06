"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";

import { acceptInvite } from "@/features/invites/actions";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  token: string;
  invitedEmail: string;
  orgName: string;
  role: string;
  inviterName: string | null;
}

export function InviteAcceptForm({ token, invitedEmail, orgName, role, inviterName }: Props) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", password: "" },
  });

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setIsLoggedIn(!!data.user));
  }, []);

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await acceptInvite(token, {
          fullName: values.fullName,
          password: values.password,
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to accept invite");
      }
    });
  }

  return (
    <AuthCard
      title="Accept Invitation"
      description={
        inviterName ? `Invited by ${inviterName}` : `Join your team on Billora`
      }
    >
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
        <span className="text-muted-foreground">Joining</span>
        <span className="font-medium">{orgName}</span>
        <span className="text-muted-foreground">as</span>
        <Badge variant="secondary" className="capitalize">
          {role.replace("_", " ")}
        </Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {isLoggedIn === false && (
            <>
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Create password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Min 8 characters" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className="text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href={`/auth/login?redirectedFrom=/invite/${token}`}
                  className="text-primary hover:underline"
                >
                  Sign in first
                </Link>
              </p>
            </>
          )}

          {isLoggedIn === true && (
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
              Signed in as <span className="font-medium">{invitedEmail}</span>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={pending || isLoggedIn === null}>
            {pending ? "Accepting..." : "Accept invitation"}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
