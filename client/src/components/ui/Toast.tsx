import * as React from "react";
// Minimal toast shell
export function Toast({ message, type = "info" }: { message: string; type?: "success" | "error" | "info" }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center rounded-lg border border-border bg-card p-4 shadow-lg">
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}