import * as React from "react";
import { cn } from "@/lib/utils";
export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="breadcrumb">
      <ol className="flex items-center space-x-2 text-sm text-foreground/70">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {item.href ? <a href={item.href} className="hover:text-foreground">{item.label}</a> : <span className="text-foreground">{item.label}</span>}
            {index < items.length - 1 && <span className="mx-2">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}