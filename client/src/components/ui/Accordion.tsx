import * as React from "react";
import { cn } from "@/lib/utils";

export function Accordion({ children }: { children: React.ReactNode }) {
  return <div className="w-full border-b border-border">{children}</div>;
}
export function AccordionItem({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  return (
    <div className="border-t border-border">
      <button onClick={() => setIsOpen(!isOpen)} className="flex w-full items-center justify-between py-4 text-sm font-medium transition-all hover:underline">
        {title}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("transition-transform duration-200", isOpen && "rotate-180")}><path d="m6 9 6 6 6-6"/></svg>
      </button>
      {isOpen && <div className="pb-4 pt-0 text-sm">{children}</div>}
    </div>
  );
}