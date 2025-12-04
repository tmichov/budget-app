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
import { format } from "date-fns";

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  description?: string;
  date: string;
  categoryId: string | null;
  category: Category | null;
}

export default function TransactionsPage() {
  const { data: session, status } = useSession();
  const { currency } = useCurrency();
  const router = useRouter();
  const { request } = useApi();

  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    fetchData();
  }, [status, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesData, transactionsData] = await Promise.all([
        request("/api/categories"),
        request("/api/transactions"),
      ]);
      setCategories(categoriesData);
      // Parse amounts to numbers since Prisma Decimal comes as string in JSON
      const parsedTransactions = transactionsData.map((t: any) => ({
        ...t,
        amount: parseFloat(t.amount),
      }));
      setTransactions(parsedTransactions);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;

    try {
      await request(`/api/categories/${id}`, { method: "DELETE" });
      setCategories(categories.filter((c) => c.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete category",
      );
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent, id: string) => {
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;

    // Swipe left more than 50px to show confirmation
    if (distance > 50) {
      setSwipedId(id);
      setDeleteConfirmId(id);
    } else if (distance < -50) {
      setSwipedId(null);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!deleteConfirmId) return;

    try {
      setDeleting(true);
      await request(`/api/transactions/${deleteConfirmId}`, {
        method: "DELETE",
      });
      setTransactions(transactions.filter((t) => t.id !== deleteConfirmId));
      setSwipedId(null);
      setDeleteConfirmId(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete transaction",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setSwipedId(null);
    setDeleteConfirmId(null);
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Wallet;
    return Icon;
  };

  if (!session?.user) return null;
  if (loading) return <div className="p-4 text-center">Loading...</div>;

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce(
      (sum, t) =>
        sum + (typeof t.amount === "string" ? parseFloat(t.amount) : t.amount),
      0,
    );
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce(
      (sum, t) =>
        sum + (typeof t.amount === "string" ? parseFloat(t.amount) : t.amount),
      0,
    );
  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-6 pb-32">
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Summary Card - Compact */}
        <div
          className="p-4 rounded-lg border mb-4"
          style={{
            backgroundColor:
              balance >= 0 ? "var(--success-light)" : "var(--danger-light)",
            borderColor: balance >= 0 ? "var(--success)" : "var(--danger)",
          }}
        >
          <p
            className="text-xs font-medium mb-1"
            style={{
              color: balance >= 0 ? "var(--success)" : "var(--danger)",
            }}
          >
            Balance
          </p>
          <p
            className="text-2xl font-bold"
            style={{
              color: balance >= 0 ? "var(--success)" : "var(--danger)",
            }}
          >
            <CurrencyDisplay amount={Math.abs(balance)} currency={currency} />
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => router.push("/transactions/new")}
            size="sm"
            className="flex-1"
          >
            <Plus size={16} />
            Add Transaction
          </Button>
          <Button
            onClick={() => router.push("/transactions/categories")}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Manage Categories
          </Button>
        </div>

        {/* Transactions Section */}
        <div>
          {transactions.length === 0 ? (
            <p className="text-text-secondary text-center py-8">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => {
                const IconComponent = transaction.category
                  ? getIconComponent(transaction.category.icon)
                  : null;
                const isIncome = transaction.type === "income";
                const isSwipped = swipedId === transaction.id;

                return (
                  <div
                    key={transaction.id}
                    className="relative overflow-hidden rounded-lg"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={(e) => handleTouchEnd(e, transaction.id)}
                  >
                    {/* Delete indicator - visible on swipe */}
                    {isSwipped && (
                      <div className="absolute inset-y-0 right-0 bg-red-600 flex items-center pr-4">
                        <Trash2 size={20} className="text-white" />
                      </div>
                    )}

                    {/* Transaction content */}
                    <div
                      className={`flex items-center justify-between p-3 rounded-lg bg-card border border-card-border transition-transform ${
                        isSwipped ? "translate-x-[-60px]" : "translate-x-0"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {IconComponent ? (
                            <IconComponent size={18} className="text-primary" />
                          ) : (
                            <LucideIcons.DollarSign
                              size={18}
                              className="text-primary"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {transaction.type === "income"
                              ? "Income"
                              : transaction.category
                                ? transaction.category.name
                                : transaction.description}
                          </p>
                          {transaction.description && (
                            <p className="text-xs text-text-secondary">
                              {transaction.description.startsWith(
                                "Bill payment:",
                              )
                                ? ""
                                : transaction.description}
                            </p>
                          )}
                          <p className="text-xs text-text-secondary">
                            {format(new Date(transaction.date), "dd/MMM/yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p
                          className={`font-bold text-base whitespace-nowrap ${
                            isIncome ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          <CurrencyDisplay
                            amount={parseFloat(String(transaction.amount))}
                            currency={currency}
                          />
                        </p>
                        {/* Delete button - desktop only */}
                        <button
                          onClick={() => {
                            setDeleteConfirmId(transaction.id);
                          }}
                          className="hidden md:block p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-card rounded-lg p-6 max-w-sm w-full">
              <h2 className="text-lg font-bold text-foreground mb-2">
                Delete Transaction?
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-secondary transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTransaction}
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
    </div>
  );
}
