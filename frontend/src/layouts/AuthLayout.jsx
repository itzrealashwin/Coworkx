import React from "react";
import { Outlet } from "react-router-dom";

// Atlassian-style CoWorkx logo mark
function Logo() {
  return (
    <div className="flex flex-col items-center gap-3 mb-8">
      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md">
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
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
      <span className="text-foreground font-extrabold text-xl tracking-tight">
        CoWorkx
      </span>
    </div>
  );
}

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background grid lines — Using Tailwind colors via currentColor */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.07] text-foreground"
        style={{
          backgroundImage:
            "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="w-full max-w-[400px] relative z-10">
        <Logo />
        <Outlet />
        
        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          CoWorkx · MCA Project · IMCC Pune 2025–26
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
