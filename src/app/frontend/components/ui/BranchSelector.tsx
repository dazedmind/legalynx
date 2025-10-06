"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BranchSelectorProps {
  currentBranch: number;
  totalBranches: number;
  onBranchChange: (branch: number) => void;
  className?: string;
}

export function BranchSelector({
  currentBranch,
  totalBranches,
  onBranchChange,
  className = "",
}: BranchSelectorProps) {
  if (totalBranches <= 1) return null;

  const handlePrevious = () => {
    if (currentBranch > 0) {
      onBranchChange(currentBranch - 1);
    }
  };

  const handleNext = () => {
    if (currentBranch < totalBranches - 1) {
      onBranchChange(currentBranch + 1);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handlePrevious}
        disabled={currentBranch === 0}
        className="p-1.5 rounded-md hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        title="Previous response"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
        {currentBranch + 1} / {totalBranches}
      </span>

      <button
        onClick={handleNext}
        disabled={currentBranch === totalBranches - 1}
        className="p-1.5 rounded-md hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        title="Next response"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
