"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { ArrowLeft } from "lucide-react";
import * as LucideIcons from "lucide-react";

const AVAILABLE_ICONS = [
  "Wallet",
  "ShoppingCart",
  "Coffee",
  "Utensils",
  "Home",
  "Car",
  "Zap",
  "Smartphone",
  "BookOpen",
  "Pill",
  "Plane",
  "Gift",
  "TrendingUp",
  "DollarSign",
] as const;

export default function NewCategoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { request } = useApi();

  const [newCategory, setNewCategory] = useState({ name: "", icon: "Wallet" });
  const [categoryError, setCategoryError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError("");

    if (!newCategory.name.trim()) {
      setCategoryError("Category name is required");
      return;
    }

    try {
      setLoading(true);
      await request("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory),
      });
      router.push("/transactions");
    } catch (err) {
      setCategoryError(
        err instanceof Error ? err.message : "Failed to create category",
      );
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Wallet;
    return Icon;
  };

  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-6 pb-32">
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
          <h1 className="text-3xl font-bold text-foreground">New Category</h1>
        </div>

        <form onSubmit={handleAddCategory} className="space-y-6">
          {/* Category Name */}
          <Input
            label="Category Name"
            placeholder="e.g., Groceries"
            value={newCategory.name}
            onChange={(e) =>
              setNewCategory({ ...newCategory, name: e.target.value })
            }
            error={categoryError}
            required
            autoFocus
          />

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium mb-3 text-foreground">
              Icon
            </label>
            <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
              {AVAILABLE_ICONS.map((iconName) => {
                const IconComponent = getIconComponent(iconName);
                const isSelected = newCategory.icon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() =>
                      setNewCategory({ ...newCategory, icon: iconName })
                    }
                    className={`p-4 rounded-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-primary text-white shadow-md"
                        : "bg-secondary text-foreground hover:opacity-80"
                    }`}
                    title={iconName}
                  >
                    <IconComponent size={24} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="p-6 rounded-2xl bg-card border border-card-border">
            <p className="text-sm font-medium text-text-secondary mb-3">
              Preview
            </p>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                {(() => {
                  const IconComponent = getIconComponent(newCategory.icon);
                  return <IconComponent size={28} className="text-primary" />;
                })()}
              </div>
              <p className="text-xl font-semibold text-foreground">
                {newCategory.name || "Category Name"}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" fullWidth loading={loading}>
              Create Category
            </Button>
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
