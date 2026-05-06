"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { formatDateShort } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { profiles } from "@/db/schema";

type Profile = typeof profiles.$inferSelect;

const columns: ColumnDef<Profile>[] = [
  {
    accessorKey: "fullName",
    header: "User",
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
          <div>
            <p className="font-medium leading-none">{row.getValue("fullName")}</p>
            <p className="text-xs text-muted-foreground mt-1">{row.original.id}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("phone") || "—"}</span>,
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => <span className="text-muted-foreground">{formatDateShort(row.getValue("createdAt"))}</span>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: () => (
      <div className="text-right">
        <Button variant="ghost" size="sm">View Details</Button>
      </div>
    ),
  },
];

interface UsersClientProps {
  data: Profile[];
}

export function UsersClient({ data }: UsersClientProps) {
  return (
    <DataTable 
      columns={columns} 
      data={data} 
      searchKey="fullName" 
      placeholder="Filter by name..." 
    />
  );
}
