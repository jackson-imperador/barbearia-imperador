import * as React from "react";
export function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded bg-primary px-2 py-1 text-xs text-primary-foreground group-hover:block whitespace-nowrap">
        {content}
      </div>
    </div>
  );
}