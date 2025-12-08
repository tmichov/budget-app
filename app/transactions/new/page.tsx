"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/Button";
import { DatePicker } from "@/components/DatePicker";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { format } from "date-fns";

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface WizardState {
  type: "income" | "expense";
  amount: string;
  categoryId: string;
  categoryName: string;
  description: string;
  date: string;
}

type WizardStep = "type" | "amount" | "category" | "date" | "description";

const STEPS: WizardStep[] = [
  "type",
  "amount",
  "category",
  "date",
  "description",
];

export default function NewTransactionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { request } = useApi();
  const { currency } = useCurrency();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">(
    "right",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<WizardState>({
    type: "expense",
    amount: "",
    categoryId: "",
    categoryName: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [stepErrors, setStepErrors] = useState<
    Partial<Record<WizardStep, string>>
  >({});
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const currentStep = STEPS[currentStepIndex];

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

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
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load categories",
      );
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step: WizardStep): boolean => {
    const newErrors = { ...stepErrors };
    delete newErrors[step];

    switch (step) {
      case "type":
        if (!formData.type) {
          newErrors.type = "Please select a type";
          return false;
        }
        break;
      case "amount":
        if (!formData.amount) {
          newErrors.amount = "Amount is required";
          return false;
        }
        if (parseFloat(formData.amount) <= 0) {
          newErrors.amount = "Amount must be greater than 0";
          return false;
        }
        break;
      case "category":
        if (formData.type === "expense" && !formData.categoryId) {
          newErrors.category = "Category is required for expenses";
          return false;
        }
        break;
      case "date":
        if (!formData.date) {
          newErrors.date = "Date is required";
          return false;
        }
        break;
    }

    setStepErrors(newErrors);
    return true;
  };

  const goToNextStep = () => {
    if (!validateStep(currentStep)) return;

    if (currentStepIndex < STEPS.length - 1) {
      setSlideDirection("right");
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setSlideDirection("left");
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      setIsSubmitting(true);
      await request("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.type,
          amount: parseFloat(formData.amount),
          categoryId: formData.type === "income" ? null : formData.categoryId,
          description: formData.description,
          date: formData.date,
        }),
      });
      router.push("/transactions");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create transaction",
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
    <div className="min-h-screen bg-background px-4 py-6 md:px-6 pb-32">
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideOutLeft {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(-100%);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideOutRight {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }

        .slide-in-right {
          animation: slideInRight 0.4s ease-out;
        }

        .slide-out-left {
          animation: slideOutLeft 0.4s ease-in;
        }

        .slide-in-left {
          animation: slideInLeft 0.4s ease-out;
        }

        .slide-out-right {
          animation: slideOutRight 0.4s ease-in;
        }

        .amount-input {
          font-size: 3rem;
          font-weight: bold;
          text-align: center;
          letter-spacing: 0.05em;
        }

        .amount-input::-webkit-outer-spin-button,
        .amount-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .amount-input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>

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
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              New Transaction
            </h1>
            <p className="text-sm text-text-secondary">
              Step {currentStepIndex + 1} of {STEPS.length}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        <div className="flex gap-4 md:gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div
              className="rounded-lg p-8"
              style={{
                backgroundColor: "var(--card)",
                borderWidth: "1px",
                borderColor: "var(--card-border)",
              }}
            >
              {/* Step: Type */}
              {currentStep === "type" && (
                <div
                  className={
                    slideDirection === "right"
                      ? "slide-in-right"
                      : "slide-in-left"
                  }
                >
                  <h2 className="text-xl font-bold text-foreground mb-8">
                    What type of transaction?
                  </h2>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setFormData({ ...formData, type: "expense" });
                        setTimeout(() => {
                          setSlideDirection("right");
                          setCurrentStepIndex(1);
                        }, 0);
                      }}
                      className="flex-1 py-16 rounded-lg font-semibold transition-all flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-lg"
                      style={{
                        backgroundColor: "var(--secondary)",
                        color: "var(--foreground)",
                        border: "2px solid var(--card-border)",
                      }}
                    >
                      <TrendingDown size={32} strokeWidth={1.5} />
                      <div>Expense</div>
                    </button>
                    <button
                      onClick={() => {
                        setFormData({ ...formData, type: "income" });
                        setTimeout(() => {
                          setSlideDirection("right");
                          setCurrentStepIndex(1);
                        }, 0);
                      }}
                      className="flex-1 py-16 rounded-lg font-semibold transition-all flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-lg"
                      style={{
                        backgroundColor: "var(--secondary)",
                        color: "var(--foreground)",
                        border: "2px solid var(--card-border)",
                      }}
                    >
                      <TrendingUp size={32} strokeWidth={1.5} />
                      <div>Income</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Step: Amount */}
              {currentStep === "amount" && (
                <div
                  className={
                    slideDirection === "right"
                      ? "slide-in-right"
                      : "slide-in-left"
                  }
                >
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    Amount
                  </h2>
                  <div className="flex items-center justify-center gap-2 mb-8">
                    <input
                      type="number"
                      placeholder="0"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      onKeyDown={(e) => e.key === "Enter" && goToNextStep()}
                      autoFocus
                      className="amount-input bg-background text-foreground rounded-lg focus:outline-none transition-colors"
                      style={{
                        color:
                          formData.type === "income" ? "#16a34a" : "#dc2626",
                        borderBottom: "2px solid var(--primary)",
                        paddingBottom: "0.5rem",
                        width: "100%",
                      }}
                    />
                  </div>
                  {stepErrors.amount && (
                    <p className="text-red-600 text-sm text-center">
                      {stepErrors.amount}
                    </p>
                  )}
                </div>
              )}

              {/* Step: Category (only for expenses) */}
              {currentStep === "category" && formData.type === "expense" && (
                <div
                  className={
                    slideDirection === "right"
                      ? "slide-in-right"
                      : "slide-in-left"
                  }
                >
                  <h2 className="text-xl font-bold text-foreground mb-6">
                    Category
                  </h2>
                  {loading ? (
                    <div className="p-6 text-center text-text-secondary">
                      Loading categories...
                    </div>
                  ) : categories.length === 0 ? (
                    <div
                      className="p-6 rounded-lg border text-center"
                      style={{
                        backgroundColor: "var(--secondary)",
                        borderColor: "var(--card-border)",
                      }}
                    >
                      <p className="text-foreground mb-4">No categories yet</p>
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
                      {/* Search Input */}
                      <div
                        className="rounded-lg border transition-colors focus-within:ring-2"
                        style={{
                          backgroundColor: "var(--background)",
                          borderColor: showCategoryDropdown
                            ? "var(--primary)"
                            : "var(--border)",
                          borderWidth: "1px",
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Search categories..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          onFocus={() => setShowCategoryDropdown(true)}
                          className="w-full px-4 py-3 bg-transparent text-foreground focus:outline-none"
                          style={{ color: "var(--foreground)" }}
                        />
                      </div>

                      {/* Dropdown List */}
                      {showCategoryDropdown && (
                        <div
                          className="absolute top-full left-0 right-0 mt-2 rounded-lg border shadow-lg z-50 max-h-72 overflow-y-auto"
                          style={{
                            backgroundColor: "var(--card)",
                            borderColor: "var(--card-border)",
                            borderWidth: "1px",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {filteredCategories.length === 0 ? (
                            <div className="p-4 text-center text-text-secondary">
                              No categories found
                            </div>
                          ) : (
                            filteredCategories.map((category) => {
                              const IconComponent = getIconComponent(
                                category.icon
                              );
                              const isSelected =
                                formData.categoryId === category.id;
                              return (
                                <button
                                  key={category.id}
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      categoryId: category.id,
                                      categoryName: category.name,
                                    });
                                    setShowCategoryDropdown(false);
                                    setCategorySearch("");
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
                                    size={20}
                                    className="flex-shrink-0"
                                  />
                                  <span className="font-medium flex-1">
                                    {category.name}
                                  </span>
                                  {isSelected && (
                                    <div className="text-lg">✓</div>
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}

                      {/* Selected Category Display */}
                      {formData.categoryId && !showCategoryDropdown && (
                        <div className="mt-4 p-4 rounded-lg flex items-center gap-3" style={{ backgroundColor: "var(--secondary)" }}>
                          {(() => {
                            const cat = categories.find(
                              (c) => c.id === formData.categoryId
                            );
                            const Icon = cat
                              ? getIconComponent(cat.icon)
                              : null;
                            return (
                              <>
                                {Icon && (
                                  <Icon size={20} className="text-primary" />
                                )}
                                <span className="font-medium text-foreground">
                                  {formData.categoryName}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                  {stepErrors.category && (
                    <p className="text-red-600 text-sm mt-4">
                      {stepErrors.category}
                    </p>
                  )}
                </div>
              )}

              {/* Step: Date */}
              {currentStep === "date" && (
                <div
                  className={
                    slideDirection === "right"
                      ? "slide-in-right"
                      : "slide-in-left"
                  }
                >
                  <h2 className="text-xl font-bold text-foreground mb-6">
                    When did this happen?
                  </h2>
                  <DatePicker
                    value={formData.date}
                    onChange={(date) => setFormData({ ...formData, date })}
                  />
                </div>
              )}

              {/* Step: Description */}
              {currentStep === "description" && (
                <div
                  className={
                    slideDirection === "right"
                      ? "slide-in-right"
                      : "slide-in-left"
                  }
                >
                  <h2 className="text-xl font-bold text-foreground mb-6">
                    Add a note (optional)
                  </h2>
                  <input
                    type="text"
                    placeholder="What was this for?"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    autoFocus
                    className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: "var(--background)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      borderWidth: "1px",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "var(--primary)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "var(--border)")
                    }
                  />
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            {currentStep !== "type" && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={goToPreviousStep}
                  disabled={currentStepIndex === 0}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor:
                      currentStepIndex === 0
                        ? "var(--secondary)"
                        : "var(--primary)",
                    color:
                      currentStepIndex === 0
                        ? "var(--text-secondary)"
                        : "white",
                  }}
                >
                  <ChevronLeft size={18} />
                  Back
                </button>

                {currentStepIndex < STEPS.length - 1 ? (
                  <button
                    onClick={goToNextStep}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all text-white"
                    style={{
                      backgroundColor: "var(--primary)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.opacity = "0.9")
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    Next
                    <ChevronRight size={18} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 rounded-lg transition-all text-white disabled:opacity-50"
                    style={{
                      backgroundColor: "#16a34a",
                    }}
                    onMouseEnter={(e) =>
                      !isSubmitting && (e.currentTarget.style.opacity = "0.9")
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    {isSubmitting ? "Creating..." : "Create Transaction"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Preview Sidebar */}
          <div
            className="hidden md:block w-64 rounded-lg p-6 sticky top-24 h-fit"
            style={{
              backgroundColor: "var(--card)",
              borderWidth: "1px",
              borderColor: "var(--card-border)",
            }}
          >
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">
              Summary
            </h3>
            <div className="space-y-4">
              {/* Type Preview */}
              <div>
                <p className="text-xs text-text-secondary mb-2">Type</p>
                <div className="flex items-center gap-2">
                  {formData.type === "income" ? (
                    <>
                      <TrendingUp size={18} className="text-green-600" />
                      <span className="text-sm font-medium text-foreground">
                        Income
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown size={18} className="text-red-600" />
                      <span className="text-sm font-medium text-foreground">
                        Expense
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Amount Preview */}
              {formData.amount && (
                <div>
                  <p className="text-xs text-text-secondary mb-1">Amount</p>
                  <p
                    className="text-2xl font-bold"
                    style={{
                      color: formData.type === "income" ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {currency} {parseFloat(formData.amount).toFixed(2)}
                  </p>
                </div>
              )}

              {/* Category Preview */}
              {formData.type === "expense" && formData.categoryId && (
                <div>
                  <p className="text-xs text-text-secondary mb-1">Category</p>
                  <p className="text-sm font-medium text-foreground">
                    {formData.categoryName}
                  </p>
                </div>
              )}

              {/* Date Preview */}
              {formData.date && (
                <div>
                  <p className="text-xs text-text-secondary mb-1">Date</p>
                  <p className="text-sm font-medium text-foreground">
                    {format(new Date(formData.date), "dd MMM yyyy")}
                  </p>
                </div>
              )}

              {/* Description Preview */}
              {formData.description && (
                <div>
                  <p className="text-xs text-text-secondary mb-1">Note</p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {formData.description}
                  </p>
                </div>
              )}
            </div>

            {/* Progress Dots */}
            <div
              className="flex gap-1 mt-6 pt-4 border-t"
              style={{ borderColor: "var(--card-border)" }}
            >
              {STEPS.map((_, index) => (
                <div
                  key={index}
                  className="h-1.5 flex-1 rounded-full transition-all"
                  style={{
                    backgroundColor:
                      index <= currentStepIndex
                        ? "var(--primary)"
                        : "var(--secondary)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
