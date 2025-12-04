"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { DatePicker } from "@/components/DatePicker";
import { ArrowLeft } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface Bill {
  id: string;
  name: string;
  icon: string;
}

export default function AddPaymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { request } = useApi();

  const billId = params.id as string;
  const [bill, setBill] = useState<Bill | null>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    fetchBill();
  }, [status, router]);

  const fetchBill = async () => {
    try {
      setLoading(true);
      const bills = await request("/api/bills");
      const foundBill = bills.find((b: any) => b.id === billId);
      if (!foundBill) {
        setError("Bill not found");
      } else {
        setBill(foundBill);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bill");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!amount) {
      setError("Amount is required");
      return;
    }

    try {
      setSubmitting(true);
      await request("/api/bill-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billId,
          amount: parseFloat(amount),
          date,
        }),
      });
      router.push("/bills");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add payment");
    } finally {
      setSubmitting(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Wallet;
    return Icon;
  };

  if (!session?.user) return null;
  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (!bill) return null;

  const IconComponent = getIconComponent(bill.icon);

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-6 pb-32">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Add Payment</h1>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Bill Info Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <IconComponent size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Bill</p>
              <p className="font-bold text-foreground">{bill.name}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleAddPayment} className="space-y-6">
          {/* Amount */}
          <Input
            type="number"
            label="Amount"
            placeholder="0.00"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          {/* Date */}
          <DatePicker
            label="Payment Date"
            value={date}
            onChange={(newDate) => setDate(newDate)}
          />

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? "Adding..." : "Add Payment"}
            </Button>
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
