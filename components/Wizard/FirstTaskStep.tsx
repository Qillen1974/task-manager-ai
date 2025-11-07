import { WizardStep } from "./WizardStep";
import { useState } from "react";
import { AlertCircle } from "lucide-react";

interface FirstTaskStepProps {
  projectName: string;
  onNext: (taskData: { title: string; quadrant: string }) => void;
  onPrev: () => void;
  onSkip: () => void;
}

const QUADRANTS = [
  {
    id: "do-first",
    label: "Do First",
    emoji: "🔴",
    description: "Urgent & Important",
    color: "bg-red-100 border-red-400",
    textColor: "text-red-700",
    example: "Emergency deadline",
  },
  {
    id: "schedule",
    label: "Schedule",
    emoji: "🔵",
    description: "Not Urgent & Important",
    color: "bg-blue-100 border-blue-400",
    textColor: "text-blue-700",
    example: "Planning session",
  },
  {
    id: "delegate",
    label: "Delegate",
    emoji: "🟡",
    description: "Urgent & Not Important",
    color: "bg-yellow-100 border-yellow-400",
    textColor: "text-yellow-700",
    example: "Routine email",
  },
  {
    id: "eliminate",
    label: "Eliminate",
    emoji: "⚪",
    description: "Not Urgent & Not Important",
    color: "bg-gray-100 border-gray-400",
    textColor: "text-gray-700",
    example: "Time waster",
  },
];

export function FirstTaskStep({
  projectName,
  onNext,
  onPrev,
  onSkip,
}: FirstTaskStepProps) {
  const [taskTitle, setTaskTitle] = useState("");
  const [selectedQuadrant, setSelectedQuadrant] = useState("schedule");

  const handleNext = () => {
    if (taskTitle.trim()) {
      onNext({ title: taskTitle, quadrant: selectedQuadrant });
    }
  };

  const quadrant = QUADRANTS.find((q) => q.id === selectedQuadrant);

  return (
    <WizardStep
      stepNumber={4}
      totalSteps={5}
      title="Create Your First Task"
      description={`Add a task to your "${projectName}" project`}
      onNext={handleNext}
      onPrev={onPrev}
      onSkip={onSkip}
      nextButtonText="Create Task"
      canGoNext={taskTitle.trim().length > 0}
    >
      <div className="space-y-6">
        {/* What is a task */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            A <strong>task</strong> is a specific action you need to take. For example: "Design homepage mockup", "Review Q4 budget", "Paint master bedroom", etc.
          </p>
        </div>

        {/* Task title input */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Task Name *
          </label>
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="e.g., Design homepage, Write blog post, Schedule meeting..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
          <p className="text-xs text-gray-500 mt-2">
            Be specific about what needs to be done
          </p>
        </div>

        {/* Eisenhower Quadrant Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Select a Quadrant *
          </label>
          <p className="text-xs text-gray-600 mb-4">
            Where does this task fit in the Eisenhower Matrix?
          </p>

          <div className="grid grid-cols-2 gap-3">
            {QUADRANTS.map((q) => (
              <button
                key={q.id}
                onClick={() => setSelectedQuadrant(q.id)}
                className={`p-4 rounded-lg border-2 transition cursor-pointer text-left ${
                  selectedQuadrant === q.id
                    ? `${q.color} ring-2 ring-offset-2 ring-blue-500 border-opacity-100`
                    : `${q.color} border-opacity-50 hover:border-opacity-100`
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{q.emoji}</span>
                  <span className={`font-bold text-sm ${q.textColor}`}>{q.label}</span>
                </div>
                <p className="text-xs text-gray-700 mb-2">{q.description}</p>
                <p className="text-xs text-gray-600 italic">Example: {q.example}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Selected quadrant explanation */}
        {quadrant && (
          <div className={`${quadrant.color} border-2 border-opacity-100 rounded-lg p-4`}>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 mb-2">
                  {quadrant.emoji} {quadrant.label} - {quadrant.description}
                </p>
                <p className="text-sm text-gray-700">
                  {quadrant.id === "do-first" && "This task needs your immediate attention. Schedule time to work on it ASAP."}
                  {quadrant.id === "schedule" && "This is important for your long-term success. Block dedicated time to work on this without interruptions."}
                  {quadrant.id === "delegate" && "This is urgent but might not need your personal attention. Consider delegating to someone else if possible."}
                  {quadrant.id === "eliminate" && "This task may not be worth your time. Consider dropping it or doing it only if you have spare time."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="font-semibold text-green-900 mb-2">💡 Tips for your first task:</div>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Start with something achievable to build momentum</li>
            <li>• Make it specific and measurable</li>
            <li>• You can add due dates, descriptions, and more details later</li>
          </ul>
        </div>
      </div>
    </WizardStep>
  );
}
