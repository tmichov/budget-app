"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Wallet, FileText, Banknote, User } from "lucide-react";

export function FloatingNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Don't show nav on auth pages
  if (pathname === "/login" || pathname === "/register" || !session?.user) {
    return null;
  }

  const navItems = [
    {
      href: "/transactions",
      icon: Wallet,
      label: "Transactions",
      id: "transactions",
    },
    {
      href: "/bills",
      icon: FileText,
      label: "Bills",
      id: "bills",
    },
    //     {
    //       href: "/loans",
    //       icon: Banknote,
    //       label: "Loans",
    //       id: "loans",
    //     },
    {
      href: "/profile",
      icon: User,
      label: "Profile",
      id: "profile",
    },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none">
      <div className="flex gap-2 bg-card rounded-full shadow-lg border border-card-border p-2 pointer-events-auto backdrop-blur-xs">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const IconComponent = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200 font-medium
                ${
                  active
                    ? "bg-primary text-white shadow-md px-4"
                    : "text-foreground hover:bg-secondary"
                }
              `}
            >
              <IconComponent size={20} />
              {active && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
