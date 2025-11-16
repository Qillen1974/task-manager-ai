'use client';

import { useState, useEffect } from 'react';
import {
  calculateManpower,
  validateManpowerInput,
  getDefaultsForTaskType,
  type TaskType,
  type Complexity,
} from '@/lib/manpowerCalculator';

interface ManpowerCalculatorProps {
  onCalculate?: (manHours: number, resourceCount: number) => void;
  initialManHours?: number;
  initialResourceCount?: number;
}

const TASK_TYPES: { value: TaskType; label: string; description: string }[] = [
  { value: 'development', label: 'Development', description: 'Coding & implementation' },
  { value: 'design', label: 'Design', description: 'UI/UX design work' },
  { value: 'testing', label: 'Testing', description: 'QA & testing' },
  { value: 'documentation', label: 'Documentation', description: 'Writing docs' },
  { value: 'management', label: 'Management', description: 'Project management' },
  { value: 'research', label: 'Research', description: 'Research & analysis' },
  { value: 'requirements', label: 'Requirements Gathering', description: 'Requirements & analysis' },
];

const COMPLEXITIES: { value: Complexity; label: string; icon: string }[] = [
  { value: 'simple', label: 'Simple', icon: '🟢' },
  { value: 'medium', label: 'Medium', icon: '🟡' },
  { value: 'complex', label: 'Complex', icon: '🔴' },
];

export default function ManpowerCalculator({
  onCalculate,
  initialManHours = 0,
  initialResourceCount = 0,
}: ManpowerCalculatorProps) {
  const [taskType, setTaskType] = useState<TaskType>('development');
  const [complexity, setComplexity] = useState<Complexity>('medium');
  const [meetingsPerWeek, setMeetingsPerWeek] = useState(2);
  const [meetingDurationMinutes, setMeetingDurationMinutes] = useState(60);
  const [operationalStaff, setOperationalStaff] = useState(1);
  const [managementStaff, setManagementStaff] = useState(0);
  const [taskDurationWeeks, setTaskDurationWeeks] = useState(2);
  const [codeReviewPercentage, setCodeReviewPercentage] = useState(10);
  const [documentationPercentage, setDocumentationPercentage] = useState(5);
  const [adminPercentage, setAdminPercentage] = useState(5);
  const [errors, setErrors] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const result = calculateManpower({
    taskType,
    complexity,
    meetingsPerWeek,
    meetingDurationMinutes,
    operationalStaff,
    managementStaff,
    taskDurationWeeks,
    codeReviewPercentage,
    documentationPercentage,
    adminPercentage,
  });

  // Validate and update errors
  useEffect(() => {
    const validationErrors = validateManpowerInput({
      taskType,
      complexity,
      meetingsPerWeek,
      meetingDurationMinutes,
      operationalStaff,
      managementStaff,
      taskDurationWeeks,
      codeReviewPercentage,
      documentationPercentage,
      adminPercentage,
    });
    setErrors(validationErrors);
  }, [
    taskType,
    complexity,
    meetingsPerWeek,
    meetingDurationMinutes,
    operationalStaff,
    managementStaff,
    taskDurationWeeks,
    codeReviewPercentage,
    documentationPercentage,
    adminPercentage,
  ]);

  // Note: We do NOT call the callback automatically on every change
  // The user must explicitly click "Apply to Task" button
  // This prevents the calculator from closing when user interacts with it

  const handleTaskTypeChange = (type: TaskType) => {
    setTaskType(type);
    const defaults = getDefaultsForTaskType(type);
    if (defaults.meetingsPerWeek !== undefined) setMeetingsPerWeek(defaults.meetingsPerWeek);
    if (defaults.codeReviewPercentage !== undefined) setCodeReviewPercentage(defaults.codeReviewPercentage);
    if (defaults.documentationPercentage !== undefined) setDocumentationPercentage(defaults.documentationPercentage);
    if (defaults.adminPercentage !== undefined) setAdminPercentage(defaults.adminPercentage);
  };

  const handleApplyToTask = () => {
    if (onCalculate) {
      onCalculate(result.totalManHours, result.totalResourceCount);
    }
  };

  const totalActivityPercentage = codeReviewPercentage + documentationPercentage + adminPercentage;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Manpower Calculator</h2>
      <p className="text-gray-600 mb-6">
        Estimate hours and resources needed for your task based on type, complexity, and team structure.
      </p>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-semibold mb-2">Please fix the following issues:</p>
          <ul className="list-disc list-inside space-y-1 text-red-700">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Task Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-3">Task Type</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {TASK_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleTaskTypeChange(type.value);
              }}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                taskType === type.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-900">{type.label}</div>
              <div className="text-xs text-gray-600">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Complexity Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-3">Complexity Level</label>
        <div className="flex gap-3">
          {COMPLEXITIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setComplexity(c.value);
              }}
              className={`flex-1 p-3 rounded-lg border-2 transition-all text-center font-semibold ${
                complexity === c.value
                  ? 'border-blue-600 bg-blue-50 text-gray-900'
                  : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
              }`}
            >
              <span className="text-xl mr-2">{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Basic Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
        {/* Task Duration */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Task Duration</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max="52"
              value={taskDurationWeeks}
              onChange={(e) => setTaskDurationWeeks(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="py-2 text-gray-600 font-medium">weeks</span>
          </div>
        </div>

        {/* Operational Staff */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Operational Staff</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              max="20"
              value={operationalStaff}
              onChange={(e) => setOperationalStaff(Math.max(0, parseInt(e.target.value) || 0))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="py-2 text-gray-600 font-medium">people</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Doing the actual work (100% allocation)</p>
        </div>

        {/* Management Staff */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Management Staff</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              max="20"
              value={managementStaff}
              onChange={(e) => setManagementStaff(Math.max(0, parseInt(e.target.value) || 0))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="py-2 text-gray-600 font-medium">people</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Providing oversight (variable allocation)</p>
        </div>

        {/* Meetings per Week */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Meetings per Week</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              max="10"
              value={meetingsPerWeek}
              onChange={(e) => setMeetingsPerWeek(Math.max(0, parseInt(e.target.value) || 0))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="py-2 text-gray-600 font-medium">meetings</span>
          </div>
        </div>

        {/* Meeting Duration */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Meeting Duration</label>
          <select
            value={meetingDurationMinutes}
            onChange={(e) => setMeetingDurationMinutes(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="mb-6">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setShowAdvanced(!showAdvanced);
          }}
          className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-2"
        >
          {showAdvanced ? '▼' : '▶'} Advanced Options
        </button>

        {showAdvanced && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
            <p className="text-xs text-gray-600 mb-3">
              Set percentage of base work time spent on each activity:
            </p>

            {/* Code Review */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-900">Code Review</label>
                <span className="text-sm text-gray-600">{codeReviewPercentage}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={codeReviewPercentage}
                onChange={(e) => setCodeReviewPercentage(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Documentation */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-900">Documentation</label>
                <span className="text-sm text-gray-600">{documentationPercentage}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={documentationPercentage}
                onChange={(e) => setDocumentationPercentage(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Admin/Misc */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-900">Admin / Misc</label>
                <span className="text-sm text-gray-600">{adminPercentage}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={adminPercentage}
                onChange={(e) => setAdminPercentage(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {totalActivityPercentage > 100 && (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs">
                ⚠️ Total activities exceed 100%. Actual percentage will be capped at 50% of base work.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Calculation Results</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {/* Total Hours */}
          <div>
            <div className="text-sm text-gray-600 mb-1">Total Manpower</div>
            <div className="text-3xl font-bold text-blue-600">{result.totalManHours}</div>
            <div className="text-xs text-gray-600">hours</div>
          </div>

          {/* Resource Count */}
          <div>
            <div className="text-sm text-gray-600 mb-1">Resource Count</div>
            <div className="text-3xl font-bold text-blue-600">{result.totalResourceCount}</div>
            <div className="text-xs text-gray-600">person-weeks</div>
          </div>

          {/* Hours per Week */}
          <div>
            <div className="text-sm text-gray-600 mb-1">Per Week</div>
            <div className="text-3xl font-bold text-blue-600">{(result.totalManHours / taskDurationWeeks).toFixed(1)}</div>
            <div className="text-xs text-gray-600">hours/week</div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="bg-white rounded p-4 mb-4">
          <div className="text-sm font-semibold text-gray-900 mb-3">Hours Breakdown:</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Base work:</span>
              <span className="font-semibold text-gray-900">{result.breakdown.baseHours} hrs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Meetings:</span>
              <span className="font-semibold text-gray-900">{result.breakdown.meetingHours} hrs</span>
            </div>
            {result.breakdown.codeReviewHours > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Code review:</span>
                <span className="font-semibold text-gray-900">{result.breakdown.codeReviewHours} hrs</span>
              </div>
            )}
            {result.breakdown.documentationHours > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Documentation:</span>
                <span className="font-semibold text-gray-900">{result.breakdown.documentationHours} hrs</span>
              </div>
            )}
            {result.breakdown.adminHours > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Admin:</span>
                <span className="font-semibold text-gray-900">{result.breakdown.adminHours} hrs</span>
              </div>
            )}
          </div>
        </div>

        {/* Role Breakdown */}
        {(operationalStaff > 0 || managementStaff > 0) && (
          <div className="bg-white rounded p-4 mb-4">
            <div className="text-sm font-semibold text-gray-900 mb-3">Role Breakdown:</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {operationalStaff > 0 && (
                <div className="border-l-4 border-green-500 pl-3">
                  <div className="text-gray-600 text-xs mb-1">Operational Staff</div>
                  <div className="font-semibold text-gray-900">{result.roleBreakdown.operationalManHours} hrs</div>
                  <div className="text-xs text-gray-500">{result.roleBreakdown.operationalResourceCount} person-weeks</div>
                </div>
              )}
              {managementStaff > 0 && (
                <div className="border-l-4 border-purple-500 pl-3">
                  <div className="text-gray-600 text-xs mb-1">Management Staff</div>
                  <div className="font-semibold text-gray-900">{result.roleBreakdown.managementManHours} hrs</div>
                  <div className="text-xs text-gray-500">{result.roleBreakdown.managementResourceCount} person-weeks</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        <p className="text-sm text-gray-700 italic bg-white rounded p-3 border-l-4 border-blue-400">
          {result.summary}
        </p>
      </div>

      {/* Action Button */}
      {onCalculate && (
        <button
          onClick={handleApplyToTask}
          disabled={errors.length > 0}
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Apply to Task
        </button>
      )}
    </div>
  );
}
