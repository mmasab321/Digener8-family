"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CheckSquare,
  MessageSquare,
  Users,
  Settings,
  Search,
  Bell,
  LogOut,
  Menu,
  ClipboardList,
  Sun,
  Moon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { setTheme, getTheme } from "./ThemeProvider";

const allNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["Admin", "Manager"] },
  { href: "/tasks", label: "Tasks", icon: CheckSquare, roles: ["Admin", "Manager", "Contributor", "Viewer"] },
  { href: "/my-tasks", label: "My Tasks", icon: ClipboardList, roles: ["Admin", "Manager", "Contributor", "Viewer"] },
  { href: "/communication", label: "Communication", icon: MessageSquare, roles: ["Admin", "Manager", "Contributor", "Viewer"] },
  { href: "/team", label: "Team Management", icon: Users, roles: ["Admin"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["Admin"] },
];

function getNavForRole(role: string | undefined) {
  if (!role) return [];
  return allNavItems.filter((item) => item.roles.includes(role));
}

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null; image?: string | null; role?: string };
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setThemeState] = useState<"light" | "dark">("dark");
  const nav = getNavForRole(user?.role);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    setThemeState(getTheme());
  }, []);

  // Use stable expanded state until after mount to avoid hydration mismatch on full reload (e.g. after role change)
  const sidebarExpanded = mounted ? sidebarOpen : true;

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    setThemeState(next);
  };

  return (
    <div className="flex h-screen bg-[var(--bg-base)] overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-[var(--border)] bg-[var(--bg-surface)] transition-[width] duration-200 shrink-0",
          sidebarExpanded ? "w-72" : "w-16"
        )}
      >
        <div className={cn(
          "relative flex items-center border-b border-[var(--border)] px-2",
          sidebarExpanded ? "h-28 justify-center" : "h-16 justify-between"
        )}>
          {sidebarExpanded ? (
            <>
              <div className="absolute left-0 top-0 flex h-28 w-14 items-center justify-center">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                  aria-label="Collapse sidebar"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
              <Link href="/dashboard" className="flex items-center justify-center">
                <div className="relative h-16 w-52 shrink-0 overflow-hidden bg-transparent">
                  <Image
                    src="/logo.png"
                    alt="diGener8"
                    fill
                    className="object-contain object-center"
                    sizes="208px"
                    priority
                  />
                </div>
              </Link>
              <div className="absolute right-0 top-0 flex h-28 w-14 items-center justify-center" aria-hidden="true" />
            </>
          ) : (
            <>
              <Link href="/dashboard" className="flex items-center justify-center flex-1 min-w-0">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden bg-transparent">
                  <Image
                    src="/logo.png"
                    alt="diGener8"
                    fill
                    className="object-contain object-center"
                    sizes="40px"
                    priority
                  />
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] shrink-0"
                aria-label="Expand sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
        <div className="py-3 px-2">
          {sidebarExpanded && (
            <p className="px-3 mb-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Main Menu
            </p>
          )}
          <nav className="space-y-0.5">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text)]"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-4 border-b border-[var(--border)] bg-[var(--bg-surface)] px-4">
          <div className="flex flex-1 max-w-xl items-center gap-2 rounded-xl bg-[var(--bg-elevated)] px-4 py-2.5 text-sm text-[var(--text-muted)]">
            <Search className="h-4 w-4 shrink-0" />
            <span>Search here</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              title={theme === "light" ? "Dark mode" : "Day mode"}
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
            <button
              type="button"
              className="p-2.5 rounded-xl hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-[var(--border)]">
              <div className="h-9 w-9 rounded-full bg-[var(--accent-muted)] flex items-center justify-center text-sm font-medium text-[var(--accent)] shrink-0">
                {(user?.name || user?.email || "?").slice(0, 1).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left min-w-0">
                <p className="text-sm font-medium text-[var(--text)] truncate">{user?.name || "User"}</p>
                <p className="text-xs text-[var(--text-muted)]">{user?.role || ""}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: `${typeof window !== "undefined" ? window.location.origin : ""}/login` })}
              className="p-2.5 rounded-xl hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
              aria-label="Log out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
