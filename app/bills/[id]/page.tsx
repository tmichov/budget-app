"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useCurrency } from "@/context/CurrencyContext";
import { formatCurrency } from "@/lib/currency";
import { Button } from "@/components/Button";
import { ArrowLeft, Trash2, Plus, Edit2, Check, X } from "lucide-react";
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

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

  const handleEditName = () => {
    if (bill) {
      setEditedName(bill.name);
      setIsEditingName(true);
    }
  };

  const handleSaveName = async () => {
    if (!bill || !editedName.trim()) {
      setError("Bill name cannot be empty");
      return;
    }

    const trimmedName = editedName.trim();
    if (trimmedName === bill.name) {
      setIsEditingName(false);
      return;
    }

    try {
      setIsSavingName(true);
      console.log('Sending PATCH request with name:', trimmedName);

      const response = await request(`/api/bills/${billId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });

      console.log('PATCH response:', response);

      // Update bill locally
      setBill({ ...bill, name: trimmedName });
      setIsEditingName(false);
      setError("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update bill name";
      console.error('Error updating bill:', errorMessage, err);
      setError(errorMessage);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName("");
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
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => router.back()}
              className="p-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </button>
            {isEditingName ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="min-w-0 w-full text-2xl font-bold px-2 py-1 rounded border"
                style={{
                  backgroundColor: "var(--background)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                  borderWidth: "1px",
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveName();
                  } else if (e.key === "Escape") {
                    handleCancelEdit();
                  }
                }}
              />
            ) : (
              <h1 className="text-2xl font-bold text-foreground truncate">{bill.name}</h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <>
                <button
                  onClick={handleSaveName}
                  disabled={isSavingName}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Save"
                >
                  <Check size={24} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSavingName}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Cancel"
                >
                  <X size={24} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEditName}
                  className="p-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
                  title="Edit bill"
                >
                  <Edit2 size={24} />
                </button>
                <button
                  onClick={() => setDeleteBillConfirm(true)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete bill"
                >
                  <Trash2 size={24} />
                </button>
              </>
            )}
          </div>
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
          <div className="rounded-lg p-6 max-w-sm w-full" style={{ backgroundColor: 'var(--card)' }}>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Delete Payment?
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletePaymentId(null)}
                className="flex-1 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                style={{
                  borderWidth: '1px',
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--background)'}
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePayment}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg text-white transition-colors font-medium text-sm disabled:opacity-50"
                style={{
                  backgroundColor: '#dc2626',
                }}
                onMouseEnter={(e) => !deleting && (e.currentTarget.style.backgroundColor = '#b91c1c')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
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
          <div className="rounded-lg p-6 max-w-sm w-full" style={{ backgroundColor: 'var(--card)' }}>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Delete Bill?
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              This will delete the bill and all its payment history. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteBillConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                style={{
                  borderWidth: '1px',
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--background)'}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBill}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg text-white transition-colors font-medium text-sm disabled:opacity-50"
                style={{
                  backgroundColor: '#dc2626',
                }}
                onMouseEnter={(e) => !deleting && (e.currentTarget.style.backgroundColor = '#b91c1c')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
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
