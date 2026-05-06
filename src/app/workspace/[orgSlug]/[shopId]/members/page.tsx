import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getOrganizationBySlug } from "@/db/queries/orgs.queries";
import { getShopById } from "@/db/queries/shops.queries";
import { getUserOrgRole } from "@/lib/permissions";
import { db } from "@/db";
import { shopMembers, profiles } from "@/db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/utils";
import Link from "next/link";
import { UserPlus, UserCircle, Shield, UserCog } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MembersClient } from "./members-client";
import { InviteMemberDialog } from "@/components/workspace/members/invite-member-dialog";

interface Props {
  params: { orgSlug: string; shopId: string };
}

export default async function MembersPage({ params }: Props) {
  const user = await requireAuth();

  const org = await getOrganizationBySlug(params.orgSlug);
  if (!org) redirect("/workspace");

  const role = await getUserOrgRole(user.id, org.id);
  if (!role) redirect("/workspace");

  const shop = await getShopById(params.shopId);
  if (!shop || shop.orgId !== org.id) redirect("/workspace");

  const members = await db
    .select({
      id: shopMembers.id,
      role: shopMembers.role,
      status: shopMembers.status,
      joinedAt: shopMembers.joinedAt,
      fullName: profiles.fullName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(shopMembers)
    .innerJoin(profiles, eq(shopMembers.userId, profiles.id))
    .where(eq(shopMembers.shopId, params.shopId))
    .orderBy(desc(shopMembers.joinedAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shop Members</h1>
          <p className="text-muted-foreground text-sm">Manage staff access and roles for {shop.name}.</p>
        </div>
        <InviteMemberDialog orgId={org.id} shopId={params.shopId} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Directory</CardTitle>
          <CardDescription>All users with access to this shop.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table (TanStack Table) */}
          <div className="hidden md:block">
            <MembersClient data={members as any} />
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {members.map((m) => {
              const initials = m.fullName.split(" ").map(n => n[0]).join("").toUpperCase();
              return (
                <div key={m.id} className="border rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={m.avatarUrl || undefined} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold">{m.fullName}</p>
                        <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                          {m.role === "admin" ? <Shield className="h-3 w-3" /> : <UserCircle className="h-3 w-3" />}
                          {m.role}
                        </p>
                      </div>
                    </div>
                    <Badge variant={m.status === "active" ? "default" : "secondary"} className="text-[10px]">
                      {m.status}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t flex justify-between items-center">
                    <p className="text-[10px] text-muted-foreground">Joined {formatDateShort(m.joinedAt)}</p>
                    <Button variant="ghost" size="sm" className="h-8 text-xs">Settings</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
