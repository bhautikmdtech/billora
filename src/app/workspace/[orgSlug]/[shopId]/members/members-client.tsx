"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, UserCircle } from "lucide-react";

interface MemberItem {
  id: string;
  role: string;
  status: string;
  joinedAt: Date;
  fullName: string;
  avatarUrl: string | null;
}

const columns: ColumnDef<MemberItem>[] = [
  {
    accessorKey: "fullName",
    header: "Member",
    cell: ({ row }) => {
      const initials = (row.getValue("fullName") as string)
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.original.avatarUrl || undefined} />
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{row.getValue("fullName")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 capitalize">
        {row.getValue("role") === "admin" ? (
          <Shield className="h-3 w-3 text-primary" />
        ) : (
          <UserCircle className="h-3 w-3 text-muted-foreground" />
        )}
        {row.getValue("role")}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.getValue("status") === "active" ? "default" : "secondary"}>
        {row.getValue("status")}
      </Badge>
    ),
  },
  {
    accessorKey: "joinedAt",
    header: "Joined",
    cell: ({ row }) => <span className="text-muted-foreground">{formatDateShort(row.getValue("joinedAt"))}</span>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: () => (
      <div className="text-right">
        <Button variant="ghost" size="sm">Manage</Button>
      </div>
    ),
  },
];

interface MembersClientProps {
  data: MemberItem[];
}

export function MembersClient({ data }: MembersClientProps) {
  return (
    <DataTable 
      columns={columns} 
      data={data} 
      searchKey="fullName" 
      placeholder="Filter by name..." 
    />
  );
}
