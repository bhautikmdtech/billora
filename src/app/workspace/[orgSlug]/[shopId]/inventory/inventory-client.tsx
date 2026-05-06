"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { formatPaise, formatDateShort } from "@/lib/utils";
import { skus } from "@/db/schema";
import { DataTableRowActions } from "@/components/ui/data-table-row-actions";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";

type InventoryItem = typeof skus.$inferSelect;

export function InventoryClient({ data }: { data: InventoryItem[] }) {
  const router = useRouter();
  const params = useParams();

  async function onDelete(item: InventoryItem) {
    if (!confirm("Are you sure you want to delete this SKU?")) return;
    
    try {
      const res = await api.delete(`/api/orgs/${item.orgId}/shops/${item.shopId}/skus/${item.id}`);
      if (res.success) {
        toast.success("SKU deleted");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  }

  const columns: ColumnDef<InventoryItem>[] = [
    {
      accessorKey: "skuCode",
      header: "SKU Code",
      cell: ({ row }) => <span className="font-medium">{row.getValue("skuCode")}</span>,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <span className="capitalize">{row.getValue("category") || "—"}</span>,
    },
    {
      accessorKey: "costPrice",
      header: () => <div className="text-right">Cost Price</div>,
      cell: ({ row }) => <div className="text-right">{formatPaise(row.getValue("costPrice"))}</div>,
    },
    {
      accessorKey: "sellingPrice",
      header: () => <div className="text-right">Selling Price</div>,
      cell: ({ row }) => <div className="text-right font-bold text-emerald-600">{formatPaise(row.getValue("sellingPrice"))}</div>,
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant={row.getValue("status") === "available" ? "default" : "secondary"}>
            {row.getValue("status")}
          </Badge>
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
      searchKey="skuCode" 
      placeholder="Filter by SKU..." 
    />
  );
}
