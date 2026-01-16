"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, CheckCircle, BarChart3, Clock, Zap, Brain, Map, Lightbulb, Smartphone, Bell, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { HeroDashboardPreview } from "@/components/HeroDashboardPreview";
import { HeroRecurringTasksPreview } from "@/components/HeroRecurringTasksPreview";
import { HeroExportPreview } from "@/components/HeroExportPreview";
import { HeroGanttChartPreview } from "@/components/HeroGanttChartPreview";

// Note: Metadata export removed because this component uses "use client"
// The metadata from root layout will be used for this page instead

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const appStoreUrl = "https://apps.apple.com/app/id6756943665";

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Redirect to dashboard if already logged in
      router.push('/dashboard');
    }
  }, [router]);

  const handleGetStarted = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Redirect to auth with signup mode and email pre-filled
    window.location.href = `/auth?mode=signup&email=${encodeURIComponent(email)}`;
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* iOS App Announcement Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-2.5 px-4 text-center text-sm font-medium fixed w-full z-[60]">
        <a href={appStoreUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:opacity-90 transition">
          <span className="animate-pulse">🎉</span>
          <span><strong>NEW!</strong> TaskQuadrant is now available on iOS</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">Download Free</span>
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      {/* Navigation */}
      <nav className="fixed w-full bg-white border-b border-gray-100 z-50 top-[42px]">
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
                <path d="M 45 70 Q 60 50 75 70" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.75"/>

                {/* Quadrant 3: Green (Bottom Left) */}
                <rect x="25" y="105" width="70" height="70" rx="8" fill="#10b981"/>
                <circle cx="40" cy="120" r="6" fill="white" opacity="0.75"/>
                <circle cx="55" cy="130" r="6" fill="white" opacity="0.75"/>
                <circle cx="70" cy="120" r="6" fill="white" opacity="0.75"/>

                {/* Quadrant 4: Orange (Bottom Right) */}
                <rect x="105" y="105" width="70" height="70" rx="8" fill="#f59e0b"/>
                <path d="M 130 155 L 145 140 M 150 155 L 165 140" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.75"/>

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
      <section className="pt-44 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Prioritize What Matters Most
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            TaskQuadrant uses the proven Eisenhower Matrix to help you focus on what's truly important. Stop juggling tasks. Start achieving goals.
          </p>

          {/* CTA Form */}
          <form onSubmit={handleGetStarted} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-8">
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

          <p className="text-sm text-gray-500 mb-6">No credit card required. Start in seconds.</p>

          {/* App Store Badge */}
          <div className="flex justify-center">
            <a
              href={appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition transform hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <span className="text-sm font-medium">Download on App Store</span>
            </a>
          </div>
        </div>
      </section>

      {/* Hero Image Section */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-5xl mx-auto">
          <HeroDashboardPreview />
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

      {/* Mobile App Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Phone Mockup */}
            <div className="flex justify-center order-2 md:order-1">
              <div className="relative">
                {/* Phone Frame */}
                <div className="w-72 h-[580px] bg-black rounded-[3rem] p-3 shadow-2xl shadow-blue-500/20">
                  <div className="w-full h-full bg-gray-100 rounded-[2.5rem] overflow-hidden relative">
                    {/* Status Bar */}
                    <div className="h-12 bg-white flex items-center justify-center">
                      <div className="w-20 h-6 bg-black rounded-full"></div>
                    </div>
                    {/* App Content */}
                    <div className="p-4 bg-gray-50">
                      <div className="text-gray-900 font-bold text-lg mb-4">Dashboard</div>
                      {/* Mini Quadrant */}
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-purple-500 rounded-lg p-3 text-white">
                          <div className="text-xs font-semibold opacity-80">Do First</div>
                          <div className="text-2xl font-bold">3</div>
                        </div>
                        <div className="bg-blue-500 rounded-lg p-3 text-white">
                          <div className="text-xs font-semibold opacity-80">Schedule</div>
                          <div className="text-2xl font-bold">5</div>
                        </div>
                        <div className="bg-green-500 rounded-lg p-3 text-white">
                          <div className="text-xs font-semibold opacity-80">Delegate</div>
                          <div className="text-2xl font-bold">2</div>
                        </div>
                        <div className="bg-orange-500 rounded-lg p-3 text-white">
                          <div className="text-xs font-semibold opacity-80">Eliminate</div>
                          <div className="text-2xl font-bold">1</div>
                        </div>
                      </div>
                      {/* Task List */}
                      <div className="bg-white rounded-xl p-3 shadow-sm">
                        <div className="text-sm font-semibold text-gray-900 mb-2">Due Today</div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            <span className="text-sm text-gray-700">Review project proposal</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-sm text-gray-700">Team meeting prep</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            <span className="text-sm text-gray-700">Client call at 3pm</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating badges */}
                <div className="absolute -left-8 top-20 bg-white rounded-xl shadow-lg p-3 animate-bounce">
                  <Bell className="w-6 h-6 text-blue-600" />
                </div>
                <div className="absolute -right-8 top-40 bg-white rounded-xl shadow-lg p-3">
                  <WifiOff className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Right: Content */}
            <div className="order-1 md:order-2">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-semibold text-blue-400 uppercase tracking-wide">Now on iOS</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
                Your Tasks,<br />Everywhere You Go
              </h2>
              <p className="text-lg text-blue-100 mb-8 leading-relaxed">
                Take TaskQuadrant with you. Our native iOS app syncs seamlessly with the web, so you're always on top of your priorities - even offline.
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Smart Notifications</h3>
                    <p className="text-blue-200 text-sm">Get reminders for due tasks and never miss a deadline</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <WifiOff className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Works Offline</h3>
                    <p className="text-blue-200 text-sm">Create and manage tasks even without internet - syncs when you're back online</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Instant Sync</h3>
                    <p className="text-blue-200 text-sm">Changes sync instantly between your phone and web app</p>
                  </div>
                </div>
              </div>

              {/* App Store Button */}
              <a
                href={appStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition transform hover:scale-105"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Download on App Store
              </a>
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

                    {/* Branch 3 - Bottom Left */}
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

                    {/* Branch 4 - Bottom Right */}
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

                {/* Badge */}
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600 border-t pt-4">
                  <Map className="w-4 h-4 text-blue-600" />
                  <span>Interactive mind map with automatic project conversion</span>
                </div>
              </div>

              {/* Floating Badge */}
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

      {/* Feature Showcases Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-4">
            Advanced Features for Professionals
          </h2>
          <p className="text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            Unlock powerful tools to manage complex projects and teams with Pro and Enterprise plans
          </p>

          {/* Recurring Tasks Showcase */}
          <div className="mb-12">
            <HeroRecurringTasksPreview />
          </div>

          {/* Export & Analytics Showcase */}
          <div className="mb-12">
            <HeroExportPreview />
          </div>

          {/* Gantt Chart Showcase */}
          <div className="mb-12">
            <HeroGanttChartPreview />
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
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
                  <span className="text-gray-700">Unlimited Everything</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">All Features</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Dedicated Support</span>
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
            onClick={() => (window.location.href = "/auth?mode=signup")}
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
                <li><Link href="/features" className="hover:text-white transition">Features</Link></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href={appStoreUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition">iOS App</a></li>
                <li><Link href="/security" className="hover:text-white transition">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition">About</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 TaskQuadrant. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
