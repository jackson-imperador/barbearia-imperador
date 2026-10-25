'use client';
import * as React from 'react';

interface StepperProps {
  steps: string[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, idx) => (
        <div key={step} className="flex flex-col items-center flex-1 relative">
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 
            ${idx <= currentStep ? 'bg-primary-foreground text-primary' : 'bg-muted text-muted-foreground'}`}
          >
            {idx + 1}
          </div>
          <p className={`mt-2 text-xs uppercase font-semibold ${idx <= currentStep ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
            {step}
          </p>
          {idx < steps.length - 1 && (
            <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-0
              ${idx < currentStep ? 'bg-primary-foreground' : 'bg-border'}`} 
            />
          )}
        </div>
      ))}
    </div>
  );
}
