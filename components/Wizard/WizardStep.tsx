import React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface WizardStepProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  description?: string;
  children: React.ReactNode;
  onNext?: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  nextButtonText?: string;
  prevButtonText?: string;
  isLastStep?: boolean;
  canGoNext?: boolean;
  canGoPrev?: boolean;
}

export function WizardStep({
  stepNumber,
  totalSteps,
  title,
  description,
  children,
  onNext,
  onPrev,
  onSkip,
  nextButtonText = "Next",
  prevButtonText = "Back",
  isLastStep = false,
  canGoNext = true,
  canGoPrev = true,
}: WizardStepProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-6 flex justify-between items-start">
          <div className="flex-1">
            <div className="text-sm font-semibold opacity-90">
              Step {stepNumber} of {totalSteps}
            </div>
            <h2 className="text-3xl font-bold mt-2">{title}</h2>
            {description && (
              <p className="text-blue-100 mt-2 text-lg">{description}</p>
            )}
          </div>
          <button
            onClick={onSkip}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition"
            aria-label="Skip wizard"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
            style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
          ></div>
        </div>

        {/* Content */}
        <div className="p-8">
          {children}
        </div>

        {/* Footer with buttons */}
        <div className="bg-gray-50 px-8 py-6 flex justify-between items-center border-t border-gray-200">
          <div className="flex gap-3">
            {stepNumber > 1 && (
              <button
                onClick={onPrev}
                disabled={!canGoPrev}
                className="flex items-center gap-2 px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                {prevButtonText}
              </button>
            )}
            <button
              onClick={onSkip}
              className="px-6 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition font-medium"
            >
              Skip Tour
            </button>
          </div>

          <button
            onClick={onNext}
            disabled={!canGoNext}
            className="flex items-center gap-2 px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLastStep ? "Get Started" : nextButtonText}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
