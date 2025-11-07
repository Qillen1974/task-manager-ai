import { WizardStep } from "./WizardStep";
import { CheckCircle, Rocket, BookOpen, BarChart3 } from "lucide-react";

interface CompletionStepProps {
  projectName: string;
  taskTitle: string;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export function CompletionStep({
  projectName,
  taskTitle,
  onNext,
  onPrev,
  onSkip,
}: CompletionStepProps) {
  return (
    <WizardStep
      stepNumber={5}
      totalSteps={5}
      title="You're All Set! 🎉"
      description="Ready to boost your productivity"
      onNext={onNext}
      onPrev={onPrev}
      onSkip={onSkip}
      isLastStep={true}
    >
      <div className="space-y-6">
        {/* Congratulations */}
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">✨</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Congratulations!
          </h3>
          <p className="text-lg text-gray-600 mb-6">
            You've successfully set up your first project and task.
          </p>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Project Created</p>
                <p className="text-sm text-gray-600">"{projectName}"</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Task Created</p>
                <p className="text-sm text-gray-600">"{taskTitle}"</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Ready to Succeed</p>
                <p className="text-sm text-gray-600">You're now ready to boost your productivity</p>
              </div>
            </div>
          </div>
        </div>

        {/* What to do next */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Rocket className="w-5 h-5 text-blue-600" />
            What to do next:
          </h4>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex gap-3">
              <span className="font-bold text-blue-600 flex-shrink-0">1.</span>
              <p><strong>Go to your dashboard</strong> to see your Eisenhower Matrix with your new task</p>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-blue-600 flex-shrink-0">2.</span>
              <p><strong>Add more tasks</strong> to your project by clicking the "+ Add Task" button</p>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-blue-600 flex-shrink-0">3.</span>
              <p><strong>Create more projects</strong> if you have other areas of your life to organize</p>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-blue-600 flex-shrink-0">4.</span>
              <p><strong>Track your progress</strong> by marking tasks as complete as you work through them</p>
            </div>
          </div>
        </div>

        {/* Featured features */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-2xl mb-2">📊</div>
            <h5 className="font-semibold text-gray-900 text-sm mb-1">Dashboard</h5>
            <p className="text-xs text-gray-600">
              View your tasks in the Eisenhower Matrix
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl mb-2">📁</div>
            <h5 className="font-semibold text-gray-900 text-sm mb-1">Projects</h5>
            <p className="text-xs text-gray-600">
              Organize and manage all your projects
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl mb-2">✓</div>
            <h5 className="font-semibold text-gray-900 text-sm mb-1">Tasks</h5>
            <p className="text-xs text-gray-600">
              View all your tasks in one place
            </p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-2xl mb-2">📈</div>
            <h5 className="font-semibold text-gray-900 text-sm mb-1">Stats</h5>
            <p className="text-xs text-gray-600">
              Track your completion rate
            </p>
          </div>
        </div>

        {/* Pro tips */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Pro Tips to Maximize Your Success:
          </h4>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>✨ <strong>Focus on the "Schedule" quadrant:</strong> Most successful people spend time here on important but not urgent tasks</li>
            <li>⏰ <strong>Set realistic deadlines:</strong> Break large tasks into smaller milestones</li>
            <li>📱 <strong>Check daily:</strong> Review your tasks each morning to stay focused</li>
            <li>🎯 <strong>Categorize ruthlessly:</strong> Be honest about urgency and importance</li>
            <li>📊 <strong>Track completion:</strong> Seeing progress builds momentum</li>
          </ul>
        </div>

        {/* Call to action */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6">
          <p className="mb-2">You're ready to take control of your time and achieve your goals.</p>
          <p className="font-semibold text-lg">Let's get started! 🚀</p>
        </div>
      </div>
    </WizardStep>
  );
}
