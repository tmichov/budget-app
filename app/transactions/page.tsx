"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/Button";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import { Plus, Trash2, Filter } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { format } from "date-fns";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

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
  createdAt?: string;
  categoryId: string | null;
  category: Category | null;
}

const COLORS = [
  "#5a6b5b",
  "#6fa887",
  "#3a4b3b",
  "#7a8a7a",
  "#4a5a4a",
  "#8a9a8a",
  "#2a3a2a",
  "#9aaaaa",
];

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterByCategory, setFilterByCategory] = useState<string | null>(null);

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

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Wallet;
    return Icon;
  };

  if (!session?.user) return null;
  if (loading) return <div className="p-4 text-center">Loading...</div>;

  // Calculate category spending (expenses only)
  const categorySpending = categories
    .map((category) => {
      const spent = transactions
        .filter((t) => t.type === "expense" && t.categoryId === category.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        name: category.name,
        value: parseFloat(spent.toFixed(2)),
        categoryId: category.id,
        icon: category.icon,
      };
    })
    .filter((c) => c.value > 0);

  const totalExpense = categorySpending.reduce((sum, c) => sum + c.value, 0);

  // Filter transactions
  const filteredTransactions = filterByCategory
    ? transactions.filter((t) => t.categoryId === filterByCategory)
    : transactions;

  // Sort transactions: newest first by date, then by createdAt
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) return dateB - dateA;
    const createdA = new Date(a.createdAt || a.date).getTime();
    const createdB = new Date(b.createdAt || b.date).getTime();
    return createdB - createdA;
  });

  const selectedCategoryData = selectedCategory
    ? categorySpending.find((c) => c.categoryId === selectedCategory)
    : null;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent, id: string) => {
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;

    if (distance > 50) {
      setSwipedId(id);
      setDeleteConfirmId(id);
    } else if (distance < -50) {
      setSwipedId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-6 pb-32">
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Transactions
          </h1>
          <p className="text-text-secondary">
            View and manage your transactions
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
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

        {/* Category Spending Chart Section */}
        {categorySpending.length > 0 && (
          <div
            className="rounded-lg p-6 mb-6"
            style={{
              backgroundColor: "var(--card)",
              borderWidth: "1px",
              borderColor: "var(--card-border)",
            }}
          >
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              {/* Chart */}
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categorySpending}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    onMouseEnter={(_, index) => {
                      const category = categorySpending[index];
                      if (category) setSelectedCategory(category.categoryId);
                    }}
                    onMouseLeave={() => setSelectedCategory(null)}
                    onClick={(data) => {
                      setSelectedCategory(
                        selectedCategory === data.categoryId
                          ? null
                          : data.categoryId,
                      );
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {categorySpending.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        opacity={
                          !selectedCategory ||
                          selectedCategory === entry.categoryId
                            ? 1
                            : 0.3
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      `${currency} ${value.toFixed(2)}`
                    }
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      color: "var(--foreground)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Display */}
              <div className="text-center md:absolute">
                {selectedCategoryData ? (
                  <>
                    <p
                      className="text-sm text-text-secondary mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {selectedCategoryData.name}
                    </p>
                    <p
                      className="text-3xl font-bold mb-1"
                      style={{ color: "var(--foreground)" }}
                    >
                      {currency} {selectedCategoryData.value.toFixed(2)}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {(
                        (selectedCategoryData.value / totalExpense) *
                        100
                      ).toFixed(1)}
                      % of total
                    </p>
                  </>
                ) : (
                  <>
                    <p
                      className="text-sm text-text-secondary mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Total Spent
                    </p>
                    <p
                      className="text-3xl font-bold"
                      style={{ color: "var(--foreground)" }}
                    >
                      {currency} {totalExpense.toFixed(2)}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Category Pills */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {categorySpending.map((category, index) => (
                <button
                  key={category.categoryId}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === category.categoryId
                        ? null
                        : category.categoryId,
                    )
                  }
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                  style={{
                    backgroundColor:
                      selectedCategory === category.categoryId
                        ? COLORS[index % COLORS.length]
                        : "var(--secondary)",
                    color:
                      selectedCategory === category.categoryId
                        ? "white"
                        : "var(--foreground)",
                    opacity:
                      !selectedCategory ||
                      selectedCategory === category.categoryId
                        ? 1
                        : 0.5,
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Transactions List Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Transactions</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: filterByCategory
                ? "var(--primary)"
                : "var(--secondary)",
              color: filterByCategory ? "white" : "var(--foreground)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <Filter size={16} />
            <span className="text-sm">Filter</span>
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div
            className="rounded-lg p-4 mb-4"
            style={{
              backgroundColor: "var(--secondary)",
              borderWidth: "1px",
              borderColor: "var(--card-border)",
            }}
          >
            <p className="text-sm font-medium text-foreground mb-3">
              Filter by Category
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setFilterByCategory(null);
                  setShowFilters(false);
                }}
                className="px-3 py-1 rounded-full text-sm transition-all"
                style={{
                  backgroundColor: !filterByCategory
                    ? "var(--primary)"
                    : "var(--card)",
                  color: !filterByCategory ? "white" : "var(--foreground)",
                  borderWidth: "1px",
                  borderColor: "var(--card-border)",
                }}
              >
                All Transactions
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setFilterByCategory(category.id);
                    setShowFilters(false);
                  }}
                  className="px-3 py-1 rounded-full text-sm transition-all flex items-center gap-1"
                  style={{
                    backgroundColor:
                      filterByCategory === category.id
                        ? "var(--primary)"
                        : "var(--card)",
                    color:
                      filterByCategory === category.id
                        ? "white"
                        : "var(--foreground)",
                    borderWidth: "1px",
                    borderColor: "var(--card-border)",
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div>
          {sortedTransactions.length === 0 ? (
            <p className="text-text-secondary text-center py-8">
              {filterByCategory
                ? "No transactions in this category"
                : "No transactions yet"}
            </p>
          ) : (
            <div className="space-y-2">
              {sortedTransactions.map((transaction) => {
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
                    {/* Delete indicator */}
                    {isSwipped && (
                      <div className="absolute inset-y-0 right-0 bg-red-600 flex items-center pr-4">
                        <Trash2 size={20} className="text-white" />
                      </div>
                    )}

                    {/* Transaction content */}
                    <div
                      className={`flex items-center justify-between p-3 rounded-lg transition-transform ${
                        isSwipped ? "translate-x-[-60px]" : "translate-x-0"
                      }`}
                      style={{
                        backgroundColor: "var(--card)",
                        borderWidth: "1px",
                        borderColor: "var(--card-border)",
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: "var(--secondary)" }}
                        >
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
                          className="font-bold text-base whitespace-nowrap"
                          style={{
                            color: isIncome ? "#16a34a" : "#dc2626",
                          }}
                        >
                          <CurrencyDisplay
                            amount={parseFloat(String(transaction.amount))}
                            currency={currency}
                          />
                        </p>
                        <button
                          onClick={() => setDeleteConfirmId(transaction.id)}
                          className="hidden md:block p-1 text-red-600 rounded transition-colors"
                          style={{ backgroundColor: "transparent" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "var(--danger-light)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "transparent")
                          }
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
            <div
              className="rounded-lg p-6 max-w-sm w-full"
              style={{ backgroundColor: "var(--card)" }}
            >
              <h2
                className="text-lg font-bold mb-2"
                style={{ color: "var(--foreground)" }}
              >
                Delete Transaction?
              </h2>
              <p
                className="text-sm mb-6"
                style={{ color: "var(--text-secondary)" }}
              >
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                  style={{
                    borderWidth: "1px",
                    borderColor: "var(--border)",
                    backgroundColor: "var(--background)",
                    color: "var(--foreground)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--secondary)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "var(--background)")
                  }
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTransaction}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 rounded-lg text-white transition-colors font-medium text-sm disabled:opacity-50"
                  style={{ backgroundColor: "#dc2626" }}
                  onMouseEnter={(e) =>
                    !deleting &&
                    (e.currentTarget.style.backgroundColor = "#b91c1c")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#dc2626")
                  }
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
