"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { formatPaise } from "@/lib/utils";
import { Trash2, Scan, Banknote, QrCode, CreditCard, UserCheck, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CartItem {
  id: string;
  skuCode: string;
  category: string | null;
  color: string | null;
  size: string | null;
  sellingPrice: number;
  mrp: number;
  gstPercent: string;
  discountAmount: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  totalPurchases: number;
}

type PaymentMethod = "cash" | "upi" | "card" | "credit" | "cheque";

export default function POSPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const shopId = params.shopId as string;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [skuInput, setSkuInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/orgs/by-slug/${orgSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setOrgId(data.data.id);
      });
  }, [orgSlug]);

  const addToCart = useCallback(
    async (code: string) => {
      if (!orgId || !code.trim()) return;
      try {
        const res = await fetch(
          `/api/orgs/${orgId}/shops/${shopId}/skus?search=${encodeURIComponent(code)}&status=available`
        );
        const data = await res.json();
        if (!data.success || !data.data?.length) {
          toast.error("SKU not found or not available");
          return;
        }
        const sku = data.data[0] as CartItem;
        if (cart.find((i) => i.id === sku.id)) {
          toast.error("Item already in cart");
          return;
        }
        setCart((c) => [...c, { ...sku, discountAmount: 0 }]);
        setSkuInput("");
        toast.success("Item added");
      } catch {
        toast.error("Failed to add item");
      }
    },
    [orgId, shopId, cart]
  );

  const lookupCustomer = useCallback(
    async (ph: string) => {
      if (!orgId || ph.length < 10) return;
      try {
        const res = await fetch(
          `/api/orgs/${orgId}/shops/${shopId}/customers/lookup?phone=${ph}`
        );
        const data = await res.json();
        if (data.success && data.data) {
          setCustomer(data.data);
          toast.success(`Welcome back, ${data.data.name}!`);
        }
      } catch {}
    },
    [orgId, shopId]
  );

  const subtotal = cart.reduce((s, i) => s + i.sellingPrice, 0);
  const discountTotal = cart.reduce((s, i) => s + i.discountAmount, 0);
  const gstTotal = cart.reduce((s, i) => {
    const pct = parseFloat(i.gstPercent) / 100;
    return s + Math.round((i.sellingPrice - i.discountAmount) * pct);
  }, 0);
  const grandTotal = subtotal - discountTotal + gstTotal;
  const paidNum = parseFloat(amountPaid) * 100 || 0;
  const change = Math.max(0, paidNum - grandTotal);

  const handleCheckout = async () => {
    if (!orgId || cart.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orgs/${orgId}/shops/${shopId}/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({
            skuId: i.id,
            sellingPrice: i.sellingPrice,
            discountAmount: i.discountAmount,
            gstPercent: i.gstPercent,
            quantity: 1,
          })),
          customerId: customer?.id,
          customerData:
            !customer && phone ? { name: "Walk-in Customer", phone } : undefined,
          paymentMethod,
          amountPaid: paidNum || grandTotal,
          saveCustomer: !!phone && !customer,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Sale completed!");
        setCart([]);
        setCustomer(null);
        setPhone("");
        setAmountPaid("");
      } else {
        toast.error(data.error || "Checkout failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-4 h-[calc(100vh-7rem)] min-h-0">
      {/* LEFT: Cart */}
      <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
        <div className="flex gap-2">
          <Input
            placeholder="Enter SKU code or scan QR…"
            value={skuInput}
            onChange={(e) => setSkuInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void addToCart(skuInput);
            }}
            className="font-mono"
          />
          <Button onClick={() => void addToCart(skuInput)} disabled={!orgId}>
            <Scan className="h-4 w-4 mr-2" /> Add
          </Button>
        </div>

        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="h-4 w-4" />
              Cart
              {cart.length > 0 && (
                <Badge>{cart.length} item{cart.length !== 1 ? "s" : ""}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pt-0">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                <ShoppingBag className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs mt-1 opacity-60">Scan or type a SKU code to add items</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-border/50 p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-semibold">{item.skuCode}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[item.category, item.color, item.size].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <Input
                        type="number"
                        value={item.discountAmount / 100}
                        onChange={(e) => {
                          const disc = Math.round(parseFloat(e.target.value || "0") * 100);
                          setCart((c) =>
                            c.map((ci, i) =>
                              i === idx
                                ? { ...ci, discountAmount: Math.min(disc, ci.sellingPrice) }
                                : ci
                            )
                          );
                        }}
                        className="w-24 h-8 text-xs"
                        placeholder="Disc ₹"
                      />
                      <span className="font-bold text-sm whitespace-nowrap">
                        {formatPaise(item.sellingPrice - item.discountAmount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setCart((c) => c.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RIGHT: Checkout */}
      <div className="xl:w-80 flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4" /> Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              placeholder="Phone number"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (!customer && e.target.value.length === 10)
                  void lookupCustomer(e.target.value);
                if (customer && e.target.value !== customer.phone)
                  setCustomer(null);
              }}
            />
            {customer && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-2.5">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {customer.totalPurchases} previous purchase{customer.totalPurchases !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>{formatPaise(subtotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Discount</span><span>−{formatPaise(discountTotal)}</span>
              </div>
            )}
            {gstTotal > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>GST</span><span>{formatPaise(gstTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span><span>{formatPaise(grandTotal)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {(["cash", "upi", "card"] as PaymentMethod[]).map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={paymentMethod === m ? "default" : "outline"}
                  onClick={() => setPaymentMethod(m)}
                  className="capitalize text-xs"
                >
                  {m === "cash" ? (
                    <Banknote className="h-3 w-3 mr-1" />
                  ) : m === "upi" ? (
                    <QrCode className="h-3 w-3 mr-1" />
                  ) : (
                    <CreditCard className="h-3 w-3 mr-1" />
                  )}
                  {m.toUpperCase()}
                </Button>
              ))}
            </div>

            {paymentMethod === "cash" && (
              <div className="space-y-1.5">
                <Input
                  type="number"
                  placeholder="Amount received (₹)"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                />
                {change > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2">
                    <span className="text-sm text-emerald-700 dark:text-emerald-400">Change</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {formatPaise(change)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <Button
              className="w-full h-12 text-base font-semibold"
              disabled={loading || cart.length === 0 || !orgId}
              onClick={() => void handleCheckout()}
            >
              {loading ? "Processing…" : `Complete Sale · ${formatPaise(grandTotal)}`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
