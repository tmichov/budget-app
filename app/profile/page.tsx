"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { User as UserIcon } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useTheme } from "../context/ThemeContext";
import type { Currency } from "@/lib/currency";
import { CURRENCIES } from "@/lib/currency";
import { themes } from "@/lib/themes";
import type { ThemeName, ThemeConfig } from "@/lib/themes";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { currency, setCurrency } = useCurrency();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currency);
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(theme);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    setSelectedCurrency(currency);
  }, [currency]);

  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  if (!session?.user) {
    return null;
  }

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const handleCurrencyChange = async (newCurrency: Currency) => {
    setSelectedCurrency(newCurrency);
    await setCurrency(newCurrency);
  };

  const handleThemeChange = async (newTheme: ThemeName) => {
    setSelectedTheme(newTheme);
    await setTheme(newTheme);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-6 pb-32">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
            <UserIcon size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {session?.user?.name}
            </h2>
            <p className="text-text-secondary">{session?.user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="py-4 border-t border-border">
            <p className="text-sm text-text-secondary mb-1">Email Address</p>
            <p className="text-foreground font-medium">
              {session?.user?.email}
            </p>
          </div>

          <div className="py-4 border-t border-border">
            <p className="text-sm text-text-secondary mb-1">Full Name</p>
            <p className="text-foreground font-medium">{session?.user?.name}</p>
          </div>

          <div className="py-4 border-t border-border">
            <p className="text-sm text-text-secondary mb-1">User ID</p>
            <p className="text-foreground font-medium">{session?.user?.id}</p>
          </div>

          <div className="py-4 border-t border-border">
            <p className="text-sm text-text-secondary mb-3">Currency</p>
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(CURRENCIES) as Array<[Currency, any]>).map(
                ([currencyCode, currencyInfo]) => (
                  <button
                    key={currencyCode}
                    onClick={() => handleCurrencyChange(currencyCode)}
                    className={`p-3 rounded-lg border-2 transition-colors text-center ${
                      selectedCurrency === currencyCode
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-card-border bg-secondary text-foreground hover:border-primary/50"
                    }`}
                  >
                    <div className="text-lg font-bold mb-1">
                      {currencyInfo.symbol}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {currencyCode}
                    </div>
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="py-4 border-t border-border">
            <p className="text-sm text-text-secondary mb-3">Theme</p>
            <div className="grid grid-cols-2 gap-3">
              {(Object.values(themes) as ThemeConfig[]).map((themeConfig) => (
                <button
                  key={themeConfig.name}
                  onClick={() => handleThemeChange(themeConfig.name)}
                  className={`p-3 rounded-lg border-2 transition-colors text-center ${
                    selectedTheme === themeConfig.name
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-card-border bg-secondary text-foreground hover:border-primary/50"
                  }`}
                >
                  <div className="text-lg font-bold">{themeConfig.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          fullWidth
          onClick={handleLogout}
          className="text-red-600 border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
