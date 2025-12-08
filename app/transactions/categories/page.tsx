"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/Button";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CategoryBudget {
  id: string;
  categoryId: string;
  budgetAmount: number;
  month: number;
  year: number;
}

interface CategorySpending {
  categoryId: string;
  spent: number;
}

export default function CategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { request } = useApi();

  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Map<string, CategoryBudget>>(new Map());
  const [spending, setSpending] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalBudgetId, setModalBudgetId] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [savingBudget, setSavingBudget] = useState<string | null>(null);

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
      const [categoriesData, budgetsData, spendingData] = await Promise.all([
        request("/api/categories"),
        request("/api/category-budgets"),
        request("/api/categories/spending?month=" + (new Date().getMonth() + 1) + "&year=" + new Date().getFullYear()),
      ]);
      setCategories(categoriesData);

      // Create a map of budgets by categoryId
      const budgetMap = new Map<string, CategoryBudget>();
      budgetsData.forEach((budget: any) => {
        budgetMap.set(budget.categoryId, {
          ...budget,
          budgetAmount: parseFloat(budget.budgetAmount),
        });
      });
      setBudgets(budgetMap);

      // Create a map of spending by categoryId
      const spendingMap = new Map<string, number>();
      spendingData.forEach((item: any) => {
        spendingMap.set(item.categoryId, parseFloat(item.spent));
      });
      setSpending(spendingMap);

      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load categories",
      );
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

  const handleEditBudget = (categoryId: string) => {
    const currentBudget = budgets.get(categoryId);
    setModalBudgetId(categoryId);
    setBudgetInput(currentBudget?.budgetAmount.toString() || "");
  };

  const handleSaveBudget = async () => {
    if (!modalBudgetId) return;

    if (!budgetInput || parseFloat(budgetInput) <= 0) {
      setError("Budget must be greater than 0");
      return;
    }

    try {
      setSavingBudget(modalBudgetId);
      const now = new Date();
      await request("/api/category-budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: modalBudgetId,
          budgetAmount: parseFloat(budgetInput),
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        }),
      });

      // Update the budgets state
      const newBudgets = new Map(budgets);
      newBudgets.set(modalBudgetId, {
        id: "",
        categoryId: modalBudgetId,
        budgetAmount: parseFloat(budgetInput),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });
      setBudgets(newBudgets);
      setModalBudgetId(null);
      setBudgetInput("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save budget",
      );
    } finally {
      setSavingBudget(null);
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
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Categories</h1>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Add Category Button */}
        <Button
          onClick={() => router.push("/transactions/categories/new")}
          className="w-full mb-4"
          size="sm"
        >
          <Plus size={16} />
          Add New Category
        </Button>

        {/* Categories List */}
        {categories.length === 0 ? (
          <p className="text-text-secondary text-center py-8">
            No categories yet
          </p>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => {
              const IconComponent = getIconComponent(category.icon);
              const budget = budgets.get(category.id);
              const spent = spending.get(category.id) || 0;
              const progress = budget ? (spent / budget.budgetAmount) * 100 : 0;
              const progressColor = progress > 100 ? "#dc2626" : progress > 80 ? "#f59e0b" : "var(--primary)";

              return (
                <div
                  key={category.id}
                  className="rounded-lg p-3 flex items-center gap-3"
                  style={{
                    backgroundColor: "var(--card)",
                    borderWidth: "1px",
                    borderColor: "var(--card-border)",
                  }}
                >
                  <IconComponent size={18} className="text-primary flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-foreground text-sm">
                        {category.name}
                      </span>
                      {budget && (
                        <span className="text-xs text-text-secondary flex-shrink-0">
                          {spent.toFixed(2)} / {budget.budgetAmount.toFixed(2)}
                        </span>
                      )}
                      {!budget && (
                        <span className="text-xs text-text-secondary flex-shrink-0">
                          No budget
                        </span>
                      )}
                    </div>

                    {budget && (
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{
                          backgroundColor: "var(--secondary)",
                        }}
                      >
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${Math.min(100, progress)}%`,
                            backgroundColor: progressColor,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleEditBudget(category.id)}
                      className="px-2 py-1 text-xs rounded transition-colors"
                      style={{
                        backgroundColor: "var(--secondary)",
                        color: "var(--foreground)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.opacity = "0.8")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.opacity = "1")
                      }
                    >
                      {budget ? "Edit" : "Set"}
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-1 rounded transition-colors"
                      style={{
                        backgroundColor: "transparent",
                        color: "#dc2626",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "var(--danger-light)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                      title="Delete category"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Budget Edit Modal */}
        {modalBudgetId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div
              className="rounded-lg p-6 max-w-sm w-full"
              style={{ backgroundColor: "var(--card)" }}
            >
              <h2 className="text-lg font-bold mb-4" style={{ color: "var(--foreground)" }}>
                Set Monthly Budget
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Budget Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter budget amount"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  autoFocus
                  style={{
                    backgroundColor: "var(--background)",
                    color: "var(--foreground)",
                    borderWidth: "1px",
                    borderColor: "var(--border)",
                    borderRadius: "6px",
                    padding: "10px 12px",
                    width: "100%",
                  }}
                  className="transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setModalBudgetId(null)}
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
                    (e.currentTarget.style.backgroundColor = "var(--background)")
                  }
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBudget}
                  disabled={savingBudget !== null}
                  className="flex-1 px-4 py-2 rounded-lg text-white transition-colors font-medium text-sm disabled:opacity-50"
                  style={{
                    backgroundColor: "#4f7c59",
                  }}
                  onMouseEnter={(e) =>
                    !savingBudget && (e.currentTarget.style.opacity = "0.9")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.opacity = "1")
                  }
                >
                  {savingBudget ? "Saving..." : "Save Budget"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
