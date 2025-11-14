'use client';

import { useState } from 'react';
import Link from 'next/link';
import ManpowerCalculator from '@/components/ManpowerCalculator';

export default function ManpowerCalculatorPage() {
  const [savedCalculations, setSavedCalculations] = useState<
    Array<{
      id: string;
      name: string;
      manHours: number;
      resourceCount: number;
      timestamp: string;
    }>
  >([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [currentResult, setCurrentResult] = useState<{ manHours: number; resourceCount: number } | null>(null);
  const [saveName, setSaveName] = useState('');

  const handleCalculate = (manHours: number, resourceCount: number) => {
    setCurrentResult({ manHours, resourceCount });
  };

  const handleSaveCalculation = () => {
    if (!saveName.trim() || !currentResult) return;

    const newCalculation = {
      id: Date.now().toString(),
      name: saveName,
      manHours: currentResult.manHours,
      resourceCount: currentResult.resourceCount,
      timestamp: new Date().toLocaleString(),
    };

    setSavedCalculations([newCalculation, ...savedCalculations]);
    setSaveName('');
    setShowSaveForm(false);
  };

  const handleDeleteCalculation = (id: string) => {
    setSavedCalculations(savedCalculations.filter((calc) => calc.id !== id));
  };

  const handleCopyToClipboard = (manHours: number, resourceCount: number) => {
    const text = `Manpower: ${manHours} hours, Resources: ${resourceCount} person-weeks`;
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="text-blue-100 hover:text-white transition-colors mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-4">Manpower Calculator</h1>
          <p className="text-xl text-blue-100">
            Estimate hours and resources needed for your tasks. Just answer a few simple questions about meetings,
            team size, and task complexity.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calculator */}
          <div className="lg:col-span-2">
            <ManpowerCalculator onCalculate={handleCalculate} />

            {/* Save Section */}
            {currentResult && (
              <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Save This Calculation</h3>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setShowSaveForm(!showSaveForm)}
                    className="flex-1 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {showSaveForm ? 'Cancel' : 'Save Calculation'}
                  </button>
                  <button
                    onClick={() =>
                      handleCopyToClipboard(currentResult.manHours, currentResult.resourceCount)
                    }
                    className="flex-1 bg-gray-200 text-gray-900 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Copy Results
                  </button>
                </div>

                {showSaveForm && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g., 'Q4 Feature Development'"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSaveCalculation}
                      disabled={!saveName.trim()}
                      className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Saved Calculations & Help */}
          <div className="lg:col-span-1 space-y-6">
            {/* Help Section */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">💡 How to Use</h3>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>Select your task type (Development, Design, Testing, etc.)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>Choose complexity level (Simple, Medium, Complex)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>Enter how many meetings per week and their duration</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">4.</span>
                  <span>Set team size and project duration</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">5.</span>
                  <span>Get instant manpower estimate!</span>
                </li>
              </ol>
            </div>

            {/* Saved Calculations */}
            {savedCalculations.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📌 Recent Calculations</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {savedCalculations.map((calc) => (
                    <div key={calc.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="font-semibold text-gray-900">{calc.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <div>{calc.manHours} hours</div>
                        <div>{calc.resourceCount} person-weeks</div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">{calc.timestamp}</div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() =>
                            handleCopyToClipboard(calc.manHours, calc.resourceCount)
                          }
                          className="flex-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 py-1 px-2 rounded transition-colors"
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => handleDeleteCalculation(calc.id)}
                          className="flex-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 py-1 px-2 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips Section */}
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">✅ Pro Tips</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Add 15-20% buffer for unknowns</li>
                <li>• Include all meetings in estimates</li>
                <li>• Consider code review time</li>
                <li>• Account for documentation needs</li>
                <li>• Be realistic about complexity</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
