import * as React from "react";
import { cn } from "@/lib/utils";

export function Drawer({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex justify-start">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer Panel */}
      <div className="relative w-full max-w-xs h-full bg-card shadow-2xl overflow-y-auto animate-in slide-in-from-left">
        {children}
      </div>
    </div>
  );
}