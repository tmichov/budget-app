"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { DatePicker } from "@/components/DatePicker";
import { ArrowLeft } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string;
}

export default function NewTransactionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { request } = useApi();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newTransaction, setNewTransaction] = useState({
    categoryId: "",
    amount: "",
    type: "expense" as "income" | "expense",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [transactionError, setTransactionError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    fetchCategories();
  }, [status, router]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await request("/api/categories");
      setCategories(data);
      if (data.length > 0) {
        setNewTransaction((prev) => ({ ...prev, categoryId: data[0].id }));
      }
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load categories",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransactionError("");

    if (!newTransaction.amount) {
      setTransactionError("Amount is required");
      return;
    }

    if (newTransaction.type === "expense" && !newTransaction.categoryId) {
      setTransactionError("Category is required for expenses");
      return;
    }

    try {
      await request("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTransaction,
          amount: parseFloat(newTransaction.amount),
          categoryId:
            newTransaction.type === "income" ? null : newTransaction.categoryId,
        }),
      });
      router.push("/transactions");
    } catch (err) {
      setTransactionError(
        err instanceof Error ? err.message : "Failed to create transaction",
      );
    }
  };

  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-6 pb-32">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-foreground">
            New Transaction
          </h1>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleAddTransaction} className="space-y-6">
          {/* Type Toggle */}
          <div>
            <label className="block text-sm font-medium mb-3 text-foreground">
              Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setNewTransaction({
                    ...newTransaction,
                    type: "expense",
                  })
                }
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  newTransaction.type === "expense"
                    ? "bg-red-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-foreground hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() =>
                  setNewTransaction({
                    ...newTransaction,
                    type: "income",
                  })
                }
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  newTransaction.type === "income"
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-foreground hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Amount */}
          <Input
            type="number"
            label="Amount"
            placeholder="0.00"
            step="0.01"
            value={newTransaction.amount}
            onChange={(e) =>
              setNewTransaction({ ...newTransaction, amount: e.target.value })
            }
            error={transactionError}
            required
          />

          {/* Category - Only for expenses */}
          {newTransaction.type === "expense" && (
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Category
              </label>
              {loading ? (
                <div className="p-3 text-center text-text-secondary">
                  Loading categories...
                </div>
              ) : categories.length === 0 ? (
                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-sm">
                  <p className="mb-2">No categories yet. Create one first.</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => router.push("/transactions/categories/new")}
                  >
                    Create Category
                  </Button>
                </div>
              ) : (
                <select
                  value={newTransaction.categoryId}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      categoryId: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Date */}
          <DatePicker
            label="Date"
            value={newTransaction.date}
            onChange={(date) => setNewTransaction({ ...newTransaction, date })}
          />

          {/* Description */}
          <Input
            label="Description (optional)"
            placeholder="Add a note"
            value={newTransaction.description}
            onChange={(e) =>
              setNewTransaction({
                ...newTransaction,
                description: e.target.value,
              })
            }
          />

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" fullWidth>
              Add Transaction
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
