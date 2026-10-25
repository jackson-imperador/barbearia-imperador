import * as React from "react";
import { Button } from "./Button";
export function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (p: number) => void }) {
  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>Prev</Button>
      <span className="text-sm">Page {currentPage} of {totalPages}</span>
      <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>Next</Button>
    </div>
  );
}