"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, CheckCircle, BarChart3, Clock, Zap, Brain, Map, Lightbulb } from "lucide-react";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Could redirect to signup with email pre-filled
    window.location.href = `/?email=${encodeURIComponent(email)}`;
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full bg-white border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
              <svg className="w-9 h-9" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                {/* Quadrant 1: Blue (Top Right) */}
                <rect x="105" y="25" width="70" height="70" rx="8" fill="#3b82f6"/>
                <circle cx="140" cy="60" r="12" fill="white" opacity="0.75"/>
                <circle cx="155" cy="75" r="8" fill="white" opacity="0.6"/>

                {/* Quadrant 2: Purple (Top Left) */}
                <rect x="25" y="25" width="70" height="70" rx="8" fill="#8b5cf6"/>
                <path d="M 45 70 Q 60 50 75 70" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.75"/>

                {/* Quadrant 3: Green (Bottom Left) */}
                <rect x="25" y="105" width="70" height="70" rx="8" fill="#10b981"/>
                <circle cx="40" cy="120" r="6" fill="white" opacity="0.75"/>
                <circle cx="55" cy="130" r="6" fill="white" opacity="0.75"/>
                <circle cx="70" cy="120" r="6" fill="white" opacity="0.75"/>

                {/* Quadrant 4: Orange (Bottom Right) */}
                <rect x="105" y="105" width="70" height="70" rx="8" fill="#f59e0b"/>
                <path d="M 130 155 L 145 140 M 150 155 L 165 140" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.75"/>

                {/* Center accent */}
                <circle cx="100" cy="100" r="8" fill="#1a202c"/>
              </svg>
              <span className="font-bold text-xl text-gray-900">TaskQuadrant</span>
            </Link>
            <Link
              href="/auth?mode=login"
              className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium transition"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Prioritize What Matters Most
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            TaskQuadrant uses the proven Eisenhower Matrix to help you focus on what's truly important. Stop juggling tasks. Start achieving goals.
          </p>

          {/* CTA Form */}
          <form onSubmit={handleGetStarted} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-12">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isLoading ? "..." : "Get Started Free"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-sm text-gray-500">No credit card required. Start in seconds.</p>
        </div>
      </section>

      {/* Hero Image Section */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl h-96 flex items-center justify-center border border-gray-100">
            <div className="text-center">
              <div className="inline-block bg-white p-8 rounded-xl shadow-lg">
                <div className="grid grid-cols-2 gap-4 max-w-xs">
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <div className="text-xs text-gray-600 font-semibold mb-2">URGENT</div>
                    <div className="text-2xl font-bold text-gray-900">→</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <div className="text-xs text-gray-600 font-semibold mb-2">IMPORTANT</div>
                    <div className="text-2xl font-bold text-gray-900">→</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-xs text-gray-600 font-semibold mb-2">NOT URGENT</div>
                    <div className="text-2xl font-bold text-gray-900">→</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-xs text-gray-600 font-semibold mb-2">NOT IMPORTANT</div>
                    <div className="text-2xl font-bold text-gray-900">→</div>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 mt-8 text-sm">The Eisenhower Matrix - your productivity system</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16">
            Designed for Simplicity
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-xl border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Get Started in Seconds</h3>
              <p className="text-gray-600">
                No complex setup. No learning curve. Start organizing your tasks immediately with our intuitive interface.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-xl border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">See Your Progress</h3>
              <p className="text-gray-600">
                Visual dashboards show exactly what you've accomplished and what needs attention. No guessing.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-xl border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Save Hours Every Week</h3>
              <p className="text-gray-600">
                Stop wasting time deciding what to do next. The Eisenhower Matrix guides your priorities automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16">
            How It Works
          </h2>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-600 text-white font-bold text-lg">
                  1
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Add Your Tasks</h3>
                <p className="text-gray-600">
                  Type in everything on your plate - big projects, small tasks, recurring items. All in one place.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-600 text-white font-bold text-lg">
                  2
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Organize by Priority</h3>
                <p className="text-gray-600">
                  The Eisenhower Matrix automatically categorizes tasks by urgency and importance. Focus on what actually matters.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-600 text-white font-bold text-lg">
                  3
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Execute with Clarity</h3>
                <p className="text-gray-600">
                  Know exactly what to do next. Track progress, celebrate wins, and adjust as you go.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mind Map Feature Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span className="text-sm font-semibold text-blue-600">NEW FEATURE</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Visualize Your Ideas with Mind Maps
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Brainstorm projects visually. Create mind maps, organize your thoughts, and automatically convert them into actionable tasks and projects. Perfect for planning complex initiatives.
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Visual Brainstorming</h3>
                    <p className="text-gray-600">Create mind maps on an interactive canvas. Add nodes, connections, and organize your thoughts visually.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Rich Metadata</h3>
                    <p className="text-gray-600">Add priorities, due dates, and descriptions directly in your mind map. All details carry over when converting.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">One-Click Conversion</h3>
                    <p className="text-gray-600">Convert your entire mind map into projects and tasks instantly. Edit and re-convert anytime to evolve your plan.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Smart Hierarchy</h3>
                    <p className="text-gray-600">Branch nodes become subprojects, leaf nodes become tasks. Perfect project structure automatically created.</p>
                  </div>
                </div>
              </div>

              <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition inline-flex items-center gap-2">
                Try Mind Maps Free
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Visual */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                {/* Mind Map Visualization */}
                <div className="relative h-96 flex items-center justify-center">
                  <svg viewBox="0 0 400 350" className="w-full h-full">
                    {/* Center node */}
                    <circle cx="200" cy="175" r="35" fill="#3b82f6" opacity="0.9" />
                    <text x="200" y="180" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Project</text>

                    {/* Branch 1 - Left Top */}
                    <line x1="165" y1="155" x2="80" y2="100" stroke="#9ca3af" strokeWidth="2" />
                    <circle cx="80" cy="100" r="25" fill="#8b5cf6" opacity="0.8" />
                    <text x="80" y="105" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">Planning</text>

                    {/* Leaf nodes from Planning */}
                    <line x1="80" y1="125" x2="30" y2="160" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4" />
                    <circle cx="30" cy="160" r="18" fill="#06b6d4" opacity="0.7" />
                    <text x="30" y="163" textAnchor="middle" fill="white" fontSize="9">Research</text>

                    <line x1="80" y1="125" x2="50" y2="200" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4" />
                    <circle cx="50" cy="200" r="18" fill="#06b6d4" opacity="0.7" />
                    <text x="50" y="203" textAnchor="middle" fill="white" fontSize="9">Outline</text>

                    {/* Branch 2 - Right Top */}
                    <line x1="235" y1="155" x2="320" y2="100" stroke="#9ca3af" strokeWidth="2" />
                    <circle cx="320" cy="100" r="25" fill="#8b5cf6" opacity="0.8" />
                    <text x="320" y="105" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">Design</text>

                    {/* Leaf nodes from Design */}
                    <line x1="320" y1="125" x2="370" y2="160" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4" />
                    <circle cx="370" cy="160" r="18" fill="#10b981" opacity="0.7" />
                    <text x="370" y="163" textAnchor="middle" fill="white" fontSize="9">Mockups</text>

                    <line x1="320" y1="125" x2="350" y2="200" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4" />
                    <circle cx="350" cy="200" r="18" fill="#10b981" opacity="0.7" />
                    <text x="350" y="203" textAnchor="middle" fill="white" fontSize="9">Prototypes</text>

                    {/* Branch 3 - Bottom */}
                    <line x1="200" y1="210" x2="150" y2="280" stroke="#9ca3af" strokeWidth="2" />
                    <circle cx="150" cy="280" r="25" fill="#8b5cf6" opacity="0.8" />
                    <text x="150" y="285" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">Execution</text>

                    {/* Leaf nodes from Execution */}
                    <line x1="150" y1="305" x2="100" y2="330" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4" />
                    <circle cx="100" cy="330" r="18" fill="#f59e0b" opacity="0.7" />
                    <text x="100" y="333" textAnchor="middle" fill="white" fontSize="9">Build</text>

                    <line x1="150" y1="305" x2="200" y2="330" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4" />
                    <circle cx="200" cy="330" r="18" fill="#f59e0b" opacity="0.7" />
                    <text x="200" y="333" textAnchor="middle" fill="white" fontSize="9">Test</text>

                    {/* Branch 4 - Right Bottom */}
                    <line x1="200" y1="210" x2="250" y2="280" stroke="#9ca3af" strokeWidth="2" />
                    <circle cx="250" cy="280" r="25" fill="#8b5cf6" opacity="0.8" />
                    <text x="250" y="285" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">Launch</text>

                    {/* Leaf nodes from Launch */}
                    <line x1="250" y1="305" x2="280" y2="330" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4" />
                    <circle cx="280" cy="330" r="18" fill="#ef4444" opacity="0.7" />
                    <text x="280" y="333" textAnchor="middle" fill="white" fontSize="9">Deploy</text>

                    <line x1="250" y1="305" x2="300" y2="330" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4" />
                    <circle cx="300" cy="330" r="18" fill="#ef4444" opacity="0.7" />
                    <text x="300" y="333" textAnchor="middle" fill="white" fontSize="9">Monitor</text>
                  </svg>
                </div>

                {/* Feature indicator */}
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600 border-t pt-4">
                  <Map className="w-4 h-4 text-blue-600" />
                  <span>Interactive mind map with automatic project conversion</span>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-lg p-4 border border-gray-100 w-48">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Convert & Iterate</h4>
                    <p className="text-gray-600 text-xs">Edit and re-convert anytime</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            Start free. Upgrade anytime. No hidden fees.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-white p-8 rounded-xl border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <p className="text-gray-600 mb-6">Perfect for getting started</p>
              <div className="text-3xl font-bold text-gray-900 mb-6">
                $0
                <span className="text-lg text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">10 Projects</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">50 Tasks</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Eisenhower Matrix</span>
                </li>
              </ul>
              <button className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
                Start Free
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-blue-600 text-white p-8 rounded-xl border-2 border-blue-600 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-blue-100 mb-6">For busy professionals</p>
              <div className="text-3xl font-bold mb-6">
                $4.99
                <span className="text-lg text-blue-100">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-200" />
                  <span>30 Projects</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-200" />
                  <span>200 Tasks</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-200" />
                  <span>Recurring Tasks</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-200" />
                  <span>Mind Maps (5 maps, 50 nodes)</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-200" />
                  <span>PNG/PDF Exports</span>
                </li>
              </ul>
              <button className="w-full py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition">
                Upgrade to Pro
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white p-8 rounded-xl border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <p className="text-gray-600 mb-6">For growing teams</p>
              <div className="text-3xl font-bold text-gray-900 mb-6">
                $9.99
                <span className="text-lg text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Unlimited Projects & Tasks</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Unlimited Mind Maps & Nodes</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">All Features + Priority Support</span>
                </li>
              </ul>
              <button className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
                Upgrade to Enterprise
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center bg-blue-50 rounded-2xl p-12 border border-blue-100">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ready to Master Your Priorities?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of professionals using TaskQuadrant to focus on what matters most.
          </p>
          <button
            onClick={() => (window.location.href = "/?mode=signup")}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition inline-flex items-center gap-2"
          >
            Get Started Free
            <ChevronRight className="w-5 h-5" />
          </button>
          <p className="text-gray-600 text-sm mt-4">No credit card required. Free forever plan available.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Q</span>
                </div>
                <span className="font-bold text-white">TaskQuadrant</span>
              </div>
              <p className="text-sm">Master your priorities. Achieve your goals.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 TaskQuadrant. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
