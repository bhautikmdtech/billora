"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { parsePaise } from "@/lib/utils";

const formSchema = z.object({
  skuCode: z.string().min(2, "SKU code is required"),
  category: z.string().optional(),
  costPrice: z.string().transform((v) => Number(v)),
  sellingPrice: z.string().transform((v) => Number(v)),
  mrp: z.string().transform((v) => Number(v)),
});

interface AddSkuDialogProps {
  orgId: string;
  shopId: string;
}

export function AddSkuDialog({ orgId, shopId }: AddSkuDialogProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      skuCode: "",
      category: "",
      costPrice: "0" as any,
      sellingPrice: "0" as any,
      mrp: "0" as any,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await api.post(`/api/orgs/${orgId}/shops/${shopId}/skus`, {
        ...values,
        costPrice: parsePaise(values.costPrice),
        sellingPrice: parsePaise(values.sellingPrice),
        mrp: parsePaise(values.mrp),
      });

      if (response.success) {
        toast.success("Stock added successfully!");
        setOpen(false);
        form.reset();
        router.refresh();
      } else {
        toast.error(response.error || "Failed to add stock");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" /> Add Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Stock</DialogTitle>
          <DialogDescription>
            Manually enter product details into inventory.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="skuCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. ITEM-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Price (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
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
                    <FormLabel>Selling Price (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="mrp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>MRP (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Adding..." : "Add Stock"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
