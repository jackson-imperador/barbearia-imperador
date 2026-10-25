import * as React from "react";
import { cn } from "@/lib/utils";

export function Tabs({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("w-full", className)}>{children}</div>;
}
export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex items-center justify-center rounded-lg bg-input p-1", className)}>{children}</div>;
}
export function TabsTrigger({ children, active, onClick, className }: { children: React.ReactNode; active?: boolean; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", active ? "bg-background text-foreground shadow-sm" : "text-foreground/70", className)}>
      {children}
    </button>
  );
}