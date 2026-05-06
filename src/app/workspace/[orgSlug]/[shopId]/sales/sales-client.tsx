"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { formatPaise, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SalesItem {
  id: string;
  billNumber: string;
  grandTotal: number;
  paymentMethod: string | null;
  status: string;
  createdAt: Date;
  customerName: string | null;
}

const columns: ColumnDef<SalesItem>[] = [
  {
    accessorKey: "billNumber",
    header: "Bill #",
    cell: ({ row }) => <span className="font-mono text-xs font-bold">{row.getValue("billNumber")}</span>,
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.getValue("createdAt"), "dd MMM yyyy, hh:mm a")}</span>,
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => <span>{row.getValue("customerName") || "Walk-in"}</span>,
  },
  {
    accessorKey: "grandTotal",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => <div className="text-right font-bold">{formatPaise(row.getValue("grandTotal"))}</div>,
  },
  {
    accessorKey: "paymentMethod",
    header: () => <div className="text-center">Payment</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <Badge variant="outline" className="capitalize">
          {row.getValue("paymentMethod") || "cash"}
        </Badge>
      </div>
    ),
  },
  {
    id: "actions",
    cell: () => (
      <div className="text-right">
        <Button variant="ghost" size="sm">View</Button>
      </div>
    ),
  },
];

interface SalesClientProps {
  data: SalesItem[];
}

export function SalesClient({ data }: SalesClientProps) {
  return (
    <DataTable 
      columns={columns} 
      data={data} 
      searchKey="billNumber" 
      placeholder="Filter by Bill #..." 
    />
  );
}
