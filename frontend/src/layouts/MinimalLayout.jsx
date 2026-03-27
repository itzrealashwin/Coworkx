import React from "react";
import { Outlet, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function MinimalLayout() {
  const { user } = useAuth();
  
  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Topbar */}
      <header className="border-b border-border bg-card h-14 flex items-center px-4 justify-between shrink-0 sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shadow-sm">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <path
                d="M8 22 L14 10 L20 18 L23 14 L26 22"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="14" cy="10" r="2" fill="hsl(var(--chart-5))" />
            </svg>
          </div>
          <span className="font-bold text-foreground text-lg tracking-tight">CoWorkx</span>
        </Link>
        <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold select-none border border-border">
          {getInitials(user?.name)}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pt-12 pb-16 px-4">
        <Outlet />
      </main>
    </div>
  );
}
