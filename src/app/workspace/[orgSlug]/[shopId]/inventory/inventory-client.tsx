"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  X,
} from "lucide-react";
import { formatPaise } from "@/lib/utils";
import { editSkuSchema, type EditSkuInput } from "@/features/inventory/schemas";
import { editSku, deleteSku } from "@/features/inventory/actions";
import type { skus } from "@/db/schema";

type SkuRow = typeof skus.$inferSelect;

interface Props {
  data: SkuRow[];
  categories: string[];
  orgSlug: string;
  shopId: string;
  total: number;
  pages: number;
  page: number;
  search: string;
  categoryFilter: string;
  statusFilter: string;
}

const STATUS_COLORS = {
  available: "default",
  sold: "secondary",
  returned_supplier: "outline",
  damaged: "destructive",
} as const;

export function InventoryClient({
  data,
  categories,
  orgSlug,
  shopId,
  total,
  pages,
  page,
  search,
  categoryFilter,
  statusFilter,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [editItem, setEditItem] = useState<SkuRow | null>(null);
  const [pending, startTransition] = useTransition();

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams({
      ...(search && { search }),
      ...(categoryFilter && { category: categoryFilter }),
      ...(statusFilter && { status: statusFilter }),
      page: String(page),
    });
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    return `${pathname}?${params.toString()}`;
  }

  function handleDelete(item: SkuRow) {
    if (!confirm(`Delete SKU ${item.skuCode}? This cannot be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteSku(orgSlug, shopId, item.id);
        toast.success("SKU deleted");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  const columns: ColumnDef<SkuRow>[] = [
    {
      accessorKey: "skuCode",
      header: "SKU Code",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold">{row.getValue("skuCode")}</span>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="text-sm capitalize">{row.getValue("category") || "—"}</p>
          {row.original.subCategory && (
            <p className="text-xs text-muted-foreground capitalize">{row.original.subCategory}</p>
          )}
        </div>
      ),
    },
    {
      id: "variants",
      header: "Variants",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.color && (
            <Badge variant="outline" className="text-xs capitalize">
              {row.original.color}
            </Badge>
          )}
          {row.original.size && (
            <Badge variant="outline" className="text-xs">
              {row.original.size}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "costPrice",
      header: () => <div className="text-right">Cost</div>,
      cell: ({ row }) => (
        <div className="text-right text-sm">{formatPaise(row.getValue("costPrice"))}</div>
      ),
    },
    {
      accessorKey: "sellingPrice",
      header: () => <div className="text-right">Selling</div>,
      cell: ({ row }) => (
        <div className="text-right text-sm font-semibold text-emerald-600">
          {formatPaise(row.getValue("sellingPrice"))}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => {
        const s = row.getValue("status") as keyof typeof STATUS_COLORS;
        return (
          <div className="flex justify-center">
            <Badge variant={STATUS_COLORS[s] ?? "secondary"} className="capitalize text-xs">
              {s?.replace("_", " ")}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditItem(row.original)}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => handleDelete(row.original)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <form method="GET" className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            name="search"
            defaultValue={search}
            placeholder="Search SKU, category, color..."
            className="pl-9 h-9 text-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => router.push(buildUrl({ search: "" }))}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </form>

        <Select
          value={categoryFilter || "all"}
          onValueChange={(v) => router.push(buildUrl({ category: v === "all" ? "" : v, page: "1" }))}
        >
          <SelectTrigger className="h-9 w-40 text-sm">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter || "all"}
          onValueChange={(v) => router.push(buildUrl({ status: v === "all" ? "" : v, page: "1" }))}
        >
          <SelectTrigger className="h-9 w-36 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="damaged">Damaged</SelectItem>
            <SelectItem value="returned_supplier">Returned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/40 hover:bg-muted/40">
                {hg.headers.map((h) => (
                  <TableHead key={h.id} className="text-xs font-semibold uppercase tracking-wide">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-16 text-center text-sm text-muted-foreground">
                  No inventory items found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total} items · page {page} of {pages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => router.push(buildUrl({ page: String(page - 1) }))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= pages}
              onClick={() => router.push(buildUrl({ page: String(page + 1) }))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editItem && (
        <EditSkuDialog
          item={editItem}
          orgSlug={orgSlug}
          shopId={shopId}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  );
}

function EditSkuDialog({
  item,
  orgSlug,
  shopId,
  onClose,
}: {
  item: SkuRow;
  orgSlug: string;
  shopId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<EditSkuInput>({
    resolver: zodResolver(editSkuSchema),
    defaultValues: {
      category: item.category ?? "",
      subCategory: item.subCategory ?? "",
      color: item.color ?? "",
      size: item.size ?? "",
      description: item.description ?? "",
      costPrice: item.costPrice / 100,
      sellingPrice: item.sellingPrice / 100,
      mrp: item.mrp / 100,
      gstPercent: Number(item.gstPercent) ?? 0,
      status: item.status,
    },
  });

  function onSubmit(values: EditSkuInput) {
    startTransition(async () => {
      try {
        await editSku(orgSlug, shopId, item.id, values);
        toast.success("SKU updated");
        onClose();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed");
      }
    });
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit SKU — {item.skuCode}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Saree" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub-category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Silk" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Red" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. M, 40" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sellingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mrp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MRP (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="gstPercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST %</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                        <SelectItem value="returned_supplier">Returned to supplier</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
