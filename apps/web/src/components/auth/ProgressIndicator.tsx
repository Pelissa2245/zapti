// ZapTI Web — Progress Indicator Component
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, Sparkles } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: { label: string; description?: string }[];
  className?: string;
}

export function ProgressIndicator({
  currentStep,
  totalSteps,
  steps,
  className,
}: ProgressIndicatorProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Progress Bar */}
      <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500 ease-out relative overflow-hidden"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        >
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      </div>

      {/* Step Labels */}
      <div className="flex items-start justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <React.Fragment key={stepNumber}>
              <div className="flex flex-col items-center flex-1 relative">
                {/* Circle */}
                <div
                  className={cn(
                    'relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                    isCompleted
                      ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                      : isCurrent
                      ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white ring-4 ring-primary/20 shadow-lg shadow-primary-500/30 animate-pulse-glow'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : isCurrent ? (
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  ) : (
                    <span className="text-sm font-semibold">{stepNumber}</span>
                  )}
                </div>

                {/* Labels */}
                <div className="mt-3 text-center px-2">
                  <p
                    className={cn(
                      'text-sm font-medium transition-colors duration-200',
                      isCompleted || isCurrent
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-500 dark:text-slate-400'
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p
                      className={cn(
                        'text-xs mt-1 transition-colors duration-200',
                        isCompleted || isCurrent
                          ? 'text-slate-500 dark:text-slate-400'
                          : 'text-slate-400 dark:text-slate-500'
                      )}
                    >
                      {step.description}
                    </p>
                  )}
                </div>

                {/* Connector line (except last) */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute top-5 left-1/2 w-full h-0.5 -ml-1/2 transition-colors duration-300',
                      isCompleted ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                    )}
                  />
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}