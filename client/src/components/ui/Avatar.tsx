import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Avatar({ src, fallback, className }: { src?: string; fallback: string; className?: string }) {
  return (
    <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-input", className)}>
      {src ? (
        <Image src={src} alt="Avatar" fill className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-sm font-medium text-foreground">{fallback}</span>
      )}
    </div>
  );
}