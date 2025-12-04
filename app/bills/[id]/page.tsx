"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useCurrency } from "@/context/CurrencyContext";
import { formatCurrency } from "@/lib/currency";
import { Button } from "@/components/Button";
import { ArrowLeft, Trash2, Plus } from "lucide-react";
import * as LucideIcons from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Bill {
  id: string;
  name: string;
  icon: string;
  payments: BillPayment[];
}

interface BillPayment {
  id: string;
  amount: number;
  date: string;
}

interface ChartData {
  month: string;
  amount: number;
  date: string;
}

export default function BillDetailsPage() {
  const { data: session, status } = useSession();
  const { currency } = useCurrency();
  const router = useRouter();
  const params = useParams();
  const { request } = useApi();

  const billId = params.id as string;
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [deleteBillConfirm, setDeleteBillConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
        const parsedBill = {
          ...foundBill,
          payments: foundBill.payments.map((p: any) => ({
            ...p,
            amount: parseFloat(p.amount),
          })),
        };
        setBill(parsedBill);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bill");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!deletePaymentId || !bill) return;

    try {
      setDeleting(true);
      await request(`/api/bill-payments/${deletePaymentId}`, {
        method: "DELETE",
      });
      setBill({
        ...bill,
        payments: bill.payments.filter((p) => p.id !== deletePaymentId),
      });
      setDeletePaymentId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete payment");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteBill = async () => {
    try {
      setDeleting(true);
      await request(`/api/bills/${billId}`, {
        method: "DELETE",
      });
      router.push("/bills");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete bill");
      setDeleting(false);
    }
  };

  const prepareChartData = (): ChartData[] => {
    if (!bill || bill.payments.length === 0) return [];

    // Sort payments by date
    const sortedPayments = [...bill.payments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Group by month and get latest payment for each month
    const monthlyData: Record<string, BillPayment> = {};
    sortedPayments.forEach((payment) => {
      const date = new Date(payment.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyData[monthKey] = payment;
    });

    // Convert to array and format
    return Object.entries(monthlyData)
      .map(([monthKey, payment]) => ({
        month: monthKey,
        amount: payment.amount,
        date: payment.date,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  if (!session?.user) return null;
  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (!bill) return null;

  const chartData = prepareChartData();
  const avgAmount =
    chartData.length > 0
      ? chartData.reduce((sum, d) => sum + d.amount, 0) / chartData.length
      : 0;
  const minAmount =
    chartData.length > 0 ? Math.min(...chartData.map((d) => d.amount)) : 0;
  const maxAmount =
    chartData.length > 0 ? Math.max(...chartData.map((d) => d.amount)) : 0;

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-6 pb-32">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-foreground">{bill.name}</h1>
          </div>
          <button
            onClick={() => setDeleteBillConfirm(true)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete bill"
          >
            <Trash2 size={24} />
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card rounded-lg p-3 border border-card-border">
            <p className="text-xs text-text-secondary mb-1">Average</p>
            <p className="font-bold text-foreground">{formatCurrency(avgAmount, currency)}</p>
          </div>
          <div className="bg-card rounded-lg p-3 border border-card-border">
            <p className="text-xs text-text-secondary mb-1">Min</p>
            <p className="font-bold text-foreground">{formatCurrency(minAmount, currency)}</p>
          </div>
          <div className="bg-card rounded-lg p-3 border border-card-border">
            <p className="text-xs text-text-secondary mb-1">Max</p>
            <p className="font-bold text-foreground">{formatCurrency(maxAmount, currency)}</p>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 ? (
          <div className="bg-card rounded-lg p-4 border border-card-border mb-6">
            <p className="text-sm font-medium text-foreground mb-4">
              Payment Trend
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  stroke="#9ca3af"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value, currency)}
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#2d7a4f"
                  strokeWidth={2}
                  dot={{ fill: "#2d7a4f", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : null}

        {/* Add Payment Button */}
        <Button
          onClick={() => router.push(`/bills/${bill.id}/add-payment`)}
          className="w-full mb-6"
        >
          <Plus size={16} />
          Add Payment
        </Button>

        {/* Payment History */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">
            Payment History
          </p>
          {bill.payments.length === 0 ? (
            <p className="text-text-secondary text-center py-8">
              No payments yet
            </p>
          ) : (
            <div className="space-y-2">
              {[...bill.payments]
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                )
                .map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-card border border-card-border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {formatCurrency(payment.amount, currency)}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {new Date(payment.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => setDeletePaymentId(payment.id)}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                      title="Delete payment"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Payment Modal */}
      {deletePaymentId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-card rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold text-foreground mb-2">
              Delete Payment?
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletePaymentId(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-secondary transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePayment}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors font-medium text-sm"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Bill Modal */}
      {deleteBillConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-card rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold text-foreground mb-2">
              Delete Bill?
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              This will delete the bill and all its payment history. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteBillConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-secondary transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBill}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors font-medium text-sm"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
