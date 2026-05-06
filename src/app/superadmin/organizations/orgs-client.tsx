"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { organizations } from "@/db/schema";
import { DataTableRowActions } from "@/components/ui/data-table-row-actions";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Organization = typeof organizations.$inferSelect;

export function OrgsClient({ data }: { data: Organization[] }) {
  const router = useRouter();

  async function onToggleStatus(org: Organization) {
    try {
      const res = await api.patch(`/api/orgs/${org.id}`, {
        isActive: !org.isActive,
      });
      if (res.success) {
        toast.success(`Organization ${org.isActive ? "deactivated" : "activated"}`);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update status");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  }

  const columns: ColumnDef<Organization>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("slug")}</span>,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <span className="capitalize">{row.getValue("category")}</span>,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <span>{row.getValue("phone") || "—"}</span>,
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => <span className="text-muted-foreground">{formatDateShort(row.getValue("createdAt"))}</span>,
    },
    {
      accessorKey: "isActive",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant={row.getValue("isActive") ? "default" : "secondary"}>
            {row.getValue("isActive") ? "Active" : "Inactive"}
          </Badge>
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DataTableRowActions 
          row={row} 
          onEdit={() => onToggleStatus(row.original)} 
        />
      ),
    },
  ];

  return (
    <DataTable 
      columns={columns} 
      data={data} 
      searchKey="name" 
      placeholder="Filter by name..." 
    />
  );
}
