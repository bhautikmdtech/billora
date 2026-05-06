"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { formatPaise, formatDateShort } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { expenses } from "@/db/schema";
import { DataTableRowActions } from "@/components/ui/data-table-row-actions";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Expense = typeof expenses.$inferSelect;

export function ExpensesClient({ data }: { data: Expense[] }) {
  const router = useRouter();

  async function onDelete(item: Expense) {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    
    try {
      const res = await api.delete(`/api/orgs/${item.orgId}/shops/${item.shopId}/expenses/${item.id}`);
      if (res.success) {
        toast.success("Expense deleted");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  }

  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => <span className="text-muted-foreground">{formatDateShort(row.getValue("date"))}</span>,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.getValue("category")}</Badge>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div className="max-w-[200px] truncate">{row.getValue("description") || "—"}</div>,
    },
    {
      accessorKey: "paidTo",
      header: "Paid To",
      cell: ({ row }) => <span>{row.getValue("paidTo") || "—"}</span>,
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => <div className="text-right font-bold">{formatPaise(row.getValue("amount"))}</div>,
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
      searchKey="description" 
      placeholder="Filter by description..." 
    />
  );
}
