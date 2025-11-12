"use client";

import Link from "next/link";
import { Metadata } from "next";
import { CheckCircle, Zap, BarChart3, Clock, RefreshCw, Download, Smartphone } from "lucide-react";

export const metadata: Metadata = {
  title: "TaskQuadrant Features - Eisenhower Matrix, Projects & Analytics",
  description: "Discover TaskQuadrant's powerful features: Eisenhower Matrix, project management, recurring tasks, analytics, exports, and more for productivity.",
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full bg-white border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <span className="font-bold text-xl text-gray-900">TaskQuadrant</span>
            </Link>
            <Link
              href="/"
              className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Powerful Features for Maximum Productivity
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            TaskQuadrant combines proven productivity methodology with modern features to help you achieve your goals.
          </p>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16">
            Core Features
          </h2>

          <div className="space-y-12">
            {/* Eisenhower Matrix */}
            <div className="bg-white p-8 rounded-xl border border-gray-100 flex gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-blue-100">
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Eisenhower Matrix</h3>
                <p className="text-gray-600 mb-4">
                  Categorize tasks by urgency and importance. Our intelligent matrix system automatically helps you prioritize what truly matters, eliminating decision fatigue and ensuring you focus on high-impact activities.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Drag-and-drop task organization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Real-time priority management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Visual categorization</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Projects */}
            <div className="bg-white p-8 rounded-xl border border-gray-100 flex gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-purple-100">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Project Management</h3>
                <p className="text-gray-600 mb-4">
                  Organize tasks into projects. Create multiple projects, track progress, and manage complex workflows. Each project has its own Eisenhower Matrix for focused execution.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Unlimited projects (Pro/Enterprise)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Project-level progress tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Task completion statistics</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Recurring Tasks */}
            <div className="bg-white p-8 rounded-xl border border-gray-100 flex gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-green-100">
                  <RefreshCw className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Recurring Tasks</h3>
                <p className="text-gray-600 mb-4">
                  Automate repetitive work. Set up daily, weekly, or monthly recurring tasks so you never forget important activities. Perfect for habits, check-ins, and routine work.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Daily, weekly, monthly, custom intervals</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Automatic task generation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Pro plan and above</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Analytics & Progress */}
            <div className="bg-white p-8 rounded-xl border border-gray-100 flex gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-yellow-100">
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Analytics & Progress Tracking</h3>
                <p className="text-gray-600 mb-4">
                  Visualize your productivity. See completion rates, task trends, and progress over time. Make data-driven decisions about how you spend your time.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Completion statistics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Progress visualizations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Task completion trends</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Export & Reports */}
            <div className="bg-white p-8 rounded-xl border border-gray-100 flex gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-red-100">
                  <Download className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Export & Reports</h3>
                <p className="text-gray-600 mb-4">
                  Generate shareable reports. Export your tasks and progress as PNG images or PDF documents. Perfect for presentations, reviews, or sharing with your team.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">PNG image exports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">PDF report generation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Pro plan and above</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Responsive Design */}
            <div className="bg-white p-8 rounded-xl border border-gray-100 flex gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-indigo-100">
                  <Smartphone className="w-8 h-8 text-indigo-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Responsive Design</h3>
                <p className="text-gray-600 mb-4">
                  Access TaskQuadrant anywhere. Works seamlessly on desktop, tablet, and mobile devices. Manage your priorities on the go.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Mobile-optimized interface</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Tablet support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Consistent experience across devices</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center bg-blue-50 rounded-2xl p-12 border border-blue-100">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start using TaskQuadrant free today. No credit card required.
          </p>
          <Link
            href="/?mode=signup"
            className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <p>&copy; 2024 TaskQuadrant. All rights reserved.</p>
          <div className="mt-4 space-x-6">
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
