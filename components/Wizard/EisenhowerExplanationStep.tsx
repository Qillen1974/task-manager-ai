import { WizardStep } from "./WizardStep";

interface EisenhowerExplanationStepProps {
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export function EisenhowerExplanationStep({
  onNext,
  onPrev,
  onSkip,
}: EisenhowerExplanationStepProps) {
  return (
    <WizardStep
      stepNumber={2}
      totalSteps={5}
      title="The Eisenhower Matrix"
      description="Prioritize tasks by urgency and importance"
      onNext={onNext}
      onPrev={onPrev}
      onSkip={onSkip}
      nextButtonText="Continue"
    >
      <div className="space-y-6">
        {/* Matrix visualization */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Do First */}
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
            <div className="text-sm font-bold text-red-700 mb-2">🔴 DO FIRST</div>
            <div className="text-xs text-red-900 mb-3">
              Urgent & Important
            </div>
            <div className="text-xs text-gray-700 space-y-1">
              <div>• Crisis situations</div>
              <div>• Deadlines</div>
              <div>• Problems</div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-4">
            <div className="text-sm font-bold text-blue-700 mb-2">🔵 SCHEDULE</div>
            <div className="text-xs text-blue-900 mb-3">
              Not Urgent & Important
            </div>
            <div className="text-xs text-gray-700 space-y-1">
              <div>• Planning</div>
              <div>• Development</div>
              <div>• Prevention</div>
            </div>
          </div>

          {/* Delegate */}
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
            <div className="text-sm font-bold text-yellow-700 mb-2">🟡 DELEGATE</div>
            <div className="text-xs text-yellow-900 mb-3">
              Urgent & Not Important
            </div>
            <div className="text-xs text-gray-700 space-y-1">
              <div>• Interruptions</div>
              <div>• Some calls/emails</div>
              <div>• Some meetings</div>
            </div>
          </div>

          {/* Eliminate */}
          <div className="bg-gray-100 border-2 border-gray-400 rounded-lg p-4">
            <div className="text-sm font-bold text-gray-700 mb-2">⚪ ELIMINATE</div>
            <div className="text-xs text-gray-900 mb-3">
              Not Urgent & Not Important
            </div>
            <div className="text-xs text-gray-700 space-y-1">
              <div>• Time wasters</div>
              <div>• Distractions</div>
              <div>• Busywork</div>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">How it works:</h3>
          <div className="space-y-3 text-gray-700 text-sm">
            <p>
              <strong>Urgency:</strong> How soon does this task need to be done? Is there a deadline?
            </p>
            <p>
              <strong>Importance:</strong> Does this task contribute to your long-term goals and values?
            </p>
            <p>
              By categorizing tasks into these four quadrants, you can focus your energy on what truly matters and avoid getting overwhelmed by everything that feels urgent.
            </p>
          </div>
        </div>

        {/* Pro tip */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="font-semibold text-green-900 mb-2">💡 Pro Tip:</div>
          <p className="text-sm text-green-800">
            Most successful people spend the majority of their time in the <strong>"Schedule"</strong> quadrant (important but not urgent) where they can focus on growth, planning, and prevention.
          </p>
        </div>
      </div>
    </WizardStep>
  );
}
