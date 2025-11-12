import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About TaskQuadrant - Our Mission & Values",
  description: "Learn about TaskQuadrant's mission to help professionals master their priorities using the proven Eisenhower Matrix framework.",
};

export default function AboutPage() {
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
            About TaskQuadrant
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            We're building tools to help professionals prioritize what matters most and achieve their goals.
          </p>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white p-12 rounded-2xl border border-gray-100">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Vision</h2>

            <div className="space-y-6 text-gray-700 leading-relaxed">
              <p>
                TaskQuadrant was created with a simple mission: to help professionals master their priorities and achieve more with less stress.
              </p>

              <p>
                We believe that productivity isn't about working harder or doing more. It's about doing the right things at the right time. The Eisenhower Matrix is a proven framework for this, but most people struggle to implement it consistently.
              </p>

              <p>
                TaskQuadrant bridges that gap. We combine the power of the Eisenhower Matrix with modern technology to make priority management intuitive, visual, and actionable. Our goal is to help you:
              </p>

              <ul className="space-y-3 pl-6 list-disc">
                <li>Focus on what's truly important, not just what's urgent</li>
                <li>Eliminate decision fatigue through intelligent task organization</li>
                <li>Track your progress and celebrate your wins</li>
                <li>Build sustainable productivity habits</li>
                <li>Achieve your most meaningful goals</li>
              </ul>

              <p>
                Whether you're managing a complex project, running a business, or pursuing personal goals, TaskQuadrant helps you navigate the noise and focus on what matters most.
              </p>

              <p className="text-lg font-semibold text-blue-600">
                Master your priorities. Achieve your goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">Our Core Values</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-blue-50 p-8 rounded-xl border border-blue-100">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Simplicity</h3>
              <p className="text-gray-700">
                We believe great tools should be intuitive and easy to use. No complex setups, no learning curve—just clarity and action.
              </p>
            </div>

            <div className="bg-green-50 p-8 rounded-xl border border-green-100">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Focus</h3>
              <p className="text-gray-700">
                We help you focus on what truly matters. Everything we build is designed to eliminate distractions and highlight what's important.
              </p>
            </div>

            <div className="bg-purple-50 p-8 rounded-xl border border-purple-100">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Trust</h3>
              <p className="text-gray-700">
                Your data is private and secure. We're transparent about how we work and committed to protecting what's important to you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Join Thousands of Productive Professionals
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
