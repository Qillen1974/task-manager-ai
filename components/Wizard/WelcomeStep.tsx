import { WizardStep } from "./WizardStep";
import { CheckCircle, Target, BarChart3, Zap } from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function WelcomeStep({ onNext, onSkip }: WelcomeStepProps) {
  return (
    <WizardStep
      stepNumber={1}
      totalSteps={5}
      title="Welcome to TaskQuadrant!"
      description="Let's get you started with task management excellence"
      onNext={onNext}
      onSkip={onSkip}
      nextButtonText="Let's Begin"
    >
      <div className="space-y-8">
        {/* Main message */}
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-xl text-gray-700 leading-relaxed">
            TaskQuadrant helps you master your priorities and achieve your goals using the Eisenhower Matrix method.
          </p>
        </div>

        {/* What you'll learn */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            In this quick tour, you'll learn how to:
          </h3>
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <Target className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <div className="font-semibold text-gray-900">Create Projects</div>
                <div className="text-gray-600">Organize your work by creating projects</div>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <div className="font-semibold text-gray-900">Add Tasks</div>
                <div className="text-gray-600">Break down projects into manageable tasks</div>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <BarChart3 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <div className="font-semibold text-gray-900">Prioritize with Eisenhower Matrix</div>
                <div className="text-gray-600">Categorize by urgency and importance</div>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <div className="font-semibold text-gray-900">Track Progress</div>
                <div className="text-gray-600">Monitor your productivity with visual dashboards</div>
              </div>
            </div>
          </div>
        </div>

        {/* Estimated time */}
        <div className="text-center text-gray-600">
          <p>⏱️ This tour takes about 5 minutes</p>
        </div>

        {/* Key benefits */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-sm font-semibold text-gray-900">Focus</div>
            <div className="text-xs text-gray-600">Stay focused on what matters</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl mb-2">⚡</div>
            <div className="text-sm font-semibold text-gray-900">Efficiency</div>
            <div className="text-xs text-gray-600">Work smarter, not harder</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl mb-2">📈</div>
            <div className="text-sm font-semibold text-gray-900">Results</div>
            <div className="text-xs text-gray-600">Achieve your goals faster</div>
          </div>
        </div>
      </div>
    </WizardStep>
  );
}
