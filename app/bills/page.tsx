"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useCurrency } from "@/context/CurrencyContext";
import { formatCurrency } from "@/lib/currency";
import { Button } from "@/components/Button";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import { Plus, Trash2 } from "lucide-react";
import * as LucideIcons from "lucide-react";

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

export default function BillsPage() {
  const { data: session, status } = useSession();
  const { currency } = useCurrency();
  const router = useRouter();
  const { request } = useApi();

  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    fetchBills();
  }, [status, router]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const data = await request("/api/bills");
      // Parse amounts to numbers since Prisma Decimal comes as string in JSON
      const parsedBills = data.map((bill: any) => ({
        ...bill,
        payments: bill.payments.map((p: any) => ({
          ...p,
          amount: parseFloat(p.amount),
        })),
      }));
      setBills(parsedBills);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBill = async () => {
    if (!deleteConfirmId) return;

    try {
      setDeleting(true);
      await request(`/api/bills/${deleteConfirmId}`, { method: "DELETE" });
      setBills(bills.filter((b) => b.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete bill");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeletePayment = async (billId: string, paymentId: string) => {
    try {
      await request(`/api/bill-payments/${paymentId}`, { method: "DELETE" });
      setBills(
        bills.map((b) =>
          b.id === billId
            ? { ...b, payments: b.payments.filter((p) => p.id !== paymentId) }
            : b,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete payment");
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Wallet;
    return Icon;
  };

  if (!session?.user) return null;
  if (loading) return <div className="p-4 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-6 pb-32">
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Add Bill Button */}
        <Button
          onClick={() => router.push("/bills/new")}
          className="w-full mb-6"
        >
          <Plus size={16} />
          Track a Bill
        </Button>

        {/* Bills List */}
        {bills.length === 0 ? (
          <p className="text-text-secondary text-center py-8">No bills yet</p>
        ) : (
          <div className="space-y-4">
            {bills.map((bill) => {
              const IconComponent = getIconComponent(bill.icon);

              // Get current month's payment
              const now = new Date();
              const currentMonth = new Date(
                now.getFullYear(),
                now.getMonth(),
                1,
              );
              const nextMonth = new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                1,
              );

              const currentMonthPayment = bill.payments.find((p) => {
                const paymentDate = new Date(p.date);
                return paymentDate >= currentMonth && paymentDate < nextMonth;
              });

              const isPaid = !!currentMonthPayment;

              return (
                <button
                  key={bill.id}
                  onClick={() => router.push(`/bills/${bill.id}`)}
                  className="w-full text-left bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  {/* Alert for missing payment */}
                  {!isPaid && (
                    <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 mb-3 flex items-center gap-2">
                      <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">
                        ⚠ Not paid this month
                      </span>
                    </div>
                  )}

                  {/* Bill Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <IconComponent size={20} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">
                          {bill.name}
                        </h3>
                        <p className="text-xs text-text-secondary">
                          This month
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {isPaid ? (
                        <>
                          <p className="font-bold text-foreground">
                            <CurrencyDisplay
                              amount={currentMonthPayment.amount}
                              currency={currency}
                            />
                          </p>
                          <p className="text-xs text-text-secondary">
                            {new Date(
                              currentMonthPayment.date,
                            ).toLocaleDateString()}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                          Pending
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold text-foreground mb-2">
              Delete Bill?
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              This will delete the bill and all its payment history.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm"
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
