"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useApi } from "@/hooks/useApi";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { DatePicker } from "@/components/DatePicker";
import { ArrowLeft, TrendingDown, TrendingUp } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string;
}

function NewTransactionContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { request } = useApi();
  const { currency } = useCurrency();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [location, setLocation] = useState({
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const typeFromUrl = (searchParams.get("type") as "income" | "expense") || "expense";

  const [formData, setFormData] = useState({
    type: typeFromUrl,
    amount: "",
    categoryId: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    fetchCategories();
    requestLocationPermission();
  }, [status, router]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await request("/api/categories");
      setCategories(data);

      // Sort by transactionCount and preselect the most used category
      const sortedCategories = [...data].sort(
        (a: any, b: any) => (b.transactionCount || 0) - (a.transactionCount || 0)
      );

      if (sortedCategories.length > 0 && sortedCategories[0].transactionCount > 0) {
        const mostUsedCategory = sortedCategories[0];
        setFormData((prev) => ({
          ...prev,
          categoryId: mostUsedCategory.id,
          categoryName: mostUsedCategory.name,
        }));
      }

      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load categories"
      );
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = () => {
    try {
      if (!navigator.geolocation) {
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({
            latitude: parseFloat(latitude.toFixed(6)),
            longitude: parseFloat(longitude.toFixed(6)),
          });
        },
        () => {
          // Silently fail - user can deny permission, we just won't have location data
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch (err) {
      // Silently fail
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.amount) {
      setError("Amount is required");
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (formData.type === "expense" && !formData.categoryId) {
      setError("Category is required for expenses");
      return;
    }

    try {
      setIsSubmitting(true);
      await request("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.type,
          amount: parseFloat(formData.amount),
          categoryId:
            formData.type === "income" ? null : formData.categoryId,
          description: formData.description || undefined,
          date: formData.date,
          latitude: location.latitude || undefined,
          longitude: location.longitude || undefined,
        }),
      });
      router.push("/transactions");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create transaction"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Wallet;
    return Icon;
  };

  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-32">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-foreground">
            New Transaction
          </h1>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Form Card */}
        <div
          className="rounded-lg p-8"
          style={{
            backgroundColor: "var(--card)",
            borderWidth: "1px",
            borderColor: "var(--card-border)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Transaction Type
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "expense" })}
                  className="flex-1 py-4 rounded-lg font-semibold transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
                  style={{
                    backgroundColor:
                      formData.type === "expense"
                        ? "var(--primary)"
                        : "var(--secondary)",
                    color:
                      formData.type === "expense"
                        ? "white"
                        : "var(--foreground)",
                    border:
                      formData.type === "expense"
                        ? "2px solid var(--primary)"
                        : "2px solid var(--card-border)",
                  }}
                >
                  <TrendingDown size={20} strokeWidth={1.5} />
                  <span>Expense</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "income" })}
                  className="flex-1 py-4 rounded-lg font-semibold transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
                  style={{
                    backgroundColor:
                      formData.type === "income"
                        ? "var(--primary)"
                        : "var(--secondary)",
                    color:
                      formData.type === "income"
                        ? "white"
                        : "var(--foreground)",
                    border:
                      formData.type === "income"
                        ? "2px solid var(--primary)"
                        : "2px solid var(--card-border)",
                  }}
                >
                  <TrendingUp size={20} strokeWidth={1.5} />
                  <span>Income</span>
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Amount
              </label>
              <div className="relative w-full">
                <span
                  className="absolute left-0 top-0 h-full flex items-center px-4 text-lg font-semibold pointer-events-none"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {currency === "MKD"
                    ? "МКД"
                    : currency === "USD"
                      ? "$"
                      : "€"}
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: "var(--background)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                    borderWidth: "1px",
                    paddingLeft: currency === "MKD" ? "4.5rem" : "3.2rem",
                    paddingRight: "1rem",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "var(--primary)")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border)")
                  }
                  required
                />
              </div>
            </div>

            {/* Category (only for expenses) */}
            {formData.type === "expense" && (
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Category
                </label>
                {loading ? (
                  <div className="p-3 text-center text-text-secondary text-sm">
                    Loading categories...
                  </div>
                ) : categories.length === 0 ? (
                  <div
                    className="p-4 rounded-lg border text-center"
                    style={{
                      backgroundColor: "var(--secondary)",
                      borderColor: "var(--card-border)",
                    }}
                  >
                    <p className="text-foreground text-sm mb-3">
                      No categories yet
                    </p>
                    <Button
                      onClick={() =>
                        router.push("/transactions/categories/new")
                      }
                      size="sm"
                      variant="outline"
                    >
                      Create Category
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Dropdown Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setShowCategoryDropdown(!showCategoryDropdown)
                      }
                      className="w-full px-4 py-3 rounded-lg border transition-colors text-left flex items-center gap-3"
                      style={{
                        backgroundColor: "var(--background)",
                        borderColor: showCategoryDropdown
                          ? "var(--primary)"
                          : "var(--border)",
                        color: "var(--foreground)",
                        borderWidth: "1px",
                      }}
                    >
                      {(() => {
                        const selected = categories.find(
                          (c) => c.id === formData.categoryId
                        );
                        if (!selected) return "Select category";
                        const IconComponent = getIconComponent(selected.icon);
                        return (
                          <>
                            <IconComponent size={18} className="flex-shrink-0" />
                            <span>{selected.name}</span>
                          </>
                        );
                      })()}
                    </button>

                    {/* Dropdown List */}
                    {showCategoryDropdown && (
                      <div
                        className="absolute top-full left-0 right-0 mt-2 rounded-lg border shadow-lg z-50 max-h-72 overflow-y-auto"
                        style={{
                          backgroundColor: "var(--card)",
                          borderColor: "var(--card-border)",
                          borderWidth: "1px",
                        }}
                      >
                        {categories.map((category) => {
                          const IconComponent = getIconComponent(
                            category.icon
                          );
                          const isSelected = formData.categoryId === category.id;
                          return (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  categoryId: category.id,
                                });
                                setShowCategoryDropdown(false);
                              }}
                              className="w-full px-4 py-3 flex items-center gap-3 transition-colors text-left hover:opacity-80"
                              style={{
                                backgroundColor: isSelected
                                  ? "var(--primary)"
                                  : "transparent",
                                color: isSelected
                                  ? "white"
                                  : "var(--foreground)",
                                borderBottom: "1px solid var(--card-border)",
                              }}
                            >
                              <IconComponent
                                size={18}
                                className="flex-shrink-0"
                              />
                              <span className="font-medium flex-1">
                                {category.name}
                              </span>
                              {isSelected && <div className="text-lg">✓</div>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Date
              </label>
              <DatePicker
                value={formData.date}
                onChange={(date) => setFormData({ ...formData, date })}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Description (optional)
              </label>
              <Input
                placeholder="What was this for?"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                fullWidth
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Transaction"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function NewTransactionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><p className="text-foreground">Loading...</p></div>}>
      <NewTransactionContent />
    </Suspense>
  );
}
