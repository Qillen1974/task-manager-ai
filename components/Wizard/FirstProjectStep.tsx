import { WizardStep } from "./WizardStep";
import { useState } from "react";
import { Palette } from "lucide-react";

interface FirstProjectStepProps {
  onNext: (projectName: string) => void;
  onPrev: () => void;
  onSkip: () => void;
}

const PROJECT_COLORS = [
  { name: "Blue", value: "blue", bg: "bg-blue-100", border: "border-blue-400", dot: "bg-blue-500" },
  { name: "Red", value: "red", bg: "bg-red-100", border: "border-red-400", dot: "bg-red-500" },
  { name: "Green", value: "green", bg: "bg-green-100", border: "border-green-400", dot: "bg-green-500" },
  { name: "Yellow", value: "yellow", bg: "bg-yellow-100", border: "border-yellow-400", dot: "bg-yellow-400" },
  { name: "Purple", value: "purple", bg: "bg-purple-100", border: "border-purple-400", dot: "bg-purple-500" },
  { name: "Orange", value: "orange", bg: "bg-orange-100", border: "border-orange-400", dot: "bg-orange-500" },
  { name: "Pink", value: "pink", bg: "bg-pink-100", border: "border-pink-400", dot: "bg-pink-500" },
  { name: "Teal", value: "teal", bg: "bg-teal-100", border: "border-teal-400", dot: "bg-teal-500" },
];

export function FirstProjectStep({
  onNext,
  onPrev,
  onSkip,
}: FirstProjectStepProps) {
  const [projectName, setProjectName] = useState("");
  const [selectedColor, setSelectedColor] = useState("blue");
  const [description, setDescription] = useState("");

  const handleNext = () => {
    if (projectName.trim()) {
      onNext(projectName);
    }
  };

  const selectedColorObj = PROJECT_COLORS.find((c) => c.value === selectedColor);

  return (
    <WizardStep
      stepNumber={3}
      totalSteps={5}
      title="Create Your First Project"
      description="Let's organize your work with a project"
      onNext={handleNext}
      onPrev={onPrev}
      onSkip={onSkip}
      nextButtonText="Create Project"
      canGoNext={projectName.trim().length > 0}
    >
      <div className="space-y-6">
        {/* What is a project */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            A <strong>project</strong> is a collection of related tasks. For example: "Website Redesign", "Q4 Marketing", "House Renovation", etc.
          </p>
        </div>

        {/* Project name input */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Project Name *
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g., Website Redesign, Q4 Goals, House Renovation..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
          <p className="text-xs text-gray-500 mt-2">
            Choose something meaningful that represents your project
          </p>
        </div>

        {/* Description input */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about? What are you trying to achieve?"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-2">
            Add context to help you remember what this project is for
          </p>
        </div>

        {/* Color picker */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
            <Palette className="w-4 h-4" />
            Choose a Color
          </label>
          <div className="grid grid-cols-4 gap-2">
            {PROJECT_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => setSelectedColor(color.value)}
                className={`p-4 rounded-lg border-2 transition cursor-pointer flex flex-col items-center gap-2 ${
                  selectedColor === color.value
                    ? `${color.bg} ${color.border} ring-2 ring-offset-2 ring-blue-500`
                    : `${color.bg} border-gray-300 hover:border-gray-400`
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${color.dot}`}></div>
                <span className="text-xs font-medium text-gray-700">{color.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        {projectName && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-2">Preview:</p>
            <div
              className={`flex items-center gap-3 p-3 rounded-lg ${selectedColorObj?.bg} border-2 ${selectedColorObj?.border}`}
            >
              <div className={`w-4 h-4 rounded-full ${selectedColorObj?.dot}`}></div>
              <span className="font-semibold text-gray-900">{projectName}</span>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="font-semibold text-green-900 mb-2">💡 Tips:</div>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Choose a specific project, not something too broad</li>
            <li>• You can create multiple projects for different areas of your life</li>
            <li>• You can change the name and color anytime</li>
          </ul>
        </div>
      </div>
    </WizardStep>
  );
}
