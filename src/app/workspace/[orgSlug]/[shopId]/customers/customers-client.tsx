"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { formatPaise, formatDateShort } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { customers } from "@/db/schema";
import { DataTableRowActions } from "@/components/ui/data-table-row-actions";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Customer = typeof customers.$inferSelect;

export function CustomersClient({ data }: { data: Customer[] }) {
  const router = useRouter();

  async function onDelete(item: Customer) {
    if (!confirm("Are you sure you want to delete this customer? This will remove all their history.")) return;
    
    try {
      const res = await api.delete(`/api/orgs/${item.orgId}/shops/${item.shopId}/customers/${item.id}`);
      if (res.success) {
        toast.success("Customer deleted");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  }

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "name",
      header: "Customer",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{(row.getValue("name") as string).slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("phone") || "—"}</span>,
    },
    {
      accessorKey: "totalSpend",
      header: () => <div className="text-right">Total Spend</div>,
      cell: ({ row }) => <div className="text-right font-semibold">{formatPaise(row.getValue("totalSpend"))}</div>,
    },
    {
      accessorKey: "totalPurchases",
      header: () => <div className="text-right">Visits</div>,
      cell: ({ row }) => <div className="text-right">{row.getValue("totalPurchases")}</div>,
    },
    {
      accessorKey: "lastVisitAt",
      header: () => <div className="text-right">Last Visit</div>,
      cell: ({ row }) => (
        <div className="text-right text-muted-foreground">
          {row.getValue("lastVisitAt") ? formatDateShort(row.getValue("lastVisitAt") as Date) : "Never"}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DataTableRowActions 
          row={row} 
          onDelete={onDelete} 
          onEdit={() => toast.info("Edit feature coming soon")} 
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
