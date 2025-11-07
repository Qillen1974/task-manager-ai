"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

export default function ContactPage() {
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
            Get in Touch
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            Have questions, feedback, or need support? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-12 text-center">
            <div className="flex justify-center mb-6">
              <Mail className="w-16 h-16 text-blue-600" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Email us directly
            </h2>

            <p className="text-lg text-gray-600 mb-8">
              The best way to reach us is by sending an email to:
            </p>

            <a
              href="mailto:TaskQuadrantAlert@gmail.com"
              className="inline-block mb-6"
            >
              <div className="bg-white border-2 border-blue-600 rounded-lg px-8 py-4 inline-block hover:bg-blue-50 transition">
                <p className="text-2xl font-bold text-blue-600">
                  TaskQuadrantAlert@gmail.com
                </p>
              </div>
            </a>

            <p className="text-gray-600 mb-6">
              Click the email above or copy it to send us a message. We typically respond to all inquiries within 24-48 hours during business days.
            </p>

            <div className="space-y-3 text-left max-w-md mx-auto">
              <h3 className="font-semibold text-gray-900 text-center mb-4">
                What to include in your email:
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Your name</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Your email address</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Subject or topic of your inquiry</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Details about your question or feedback</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">How do I reset my password?</h3>
              <p className="text-gray-700">
                You can change your password anytime from your account settings in the dashboard. Click on your profile and select "Settings" to change your password.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Can I export my data?</h3>
              <p className="text-gray-700">
                Yes! Pro and Enterprise plan users can export their tasks and projects as PNG images or PDF documents directly from the dashboard. Exports include your task matrix, completion stats, and more.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">What happens if I downgrade my plan?</h3>
              <p className="text-gray-700">
                If you downgrade from Pro to Free, your data will be preserved. However, you'll be limited to the Free plan's project and task limits. Tasks over the limit will be read-only until you upgrade again.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Is my data secure?</h3>
              <p className="text-gray-700">
                Yes. All data is encrypted in transit using HTTPS/TLS. Passwords are hashed and salted. We host on Railway (AWS infrastructure) with automatic backups and security monitoring. See our <Link href="/security" className="text-blue-600 hover:text-blue-700 font-semibold">Security page</Link> for more details.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Can I delete my account?</h3>
              <p className="text-gray-700">
                Yes. You can delete your account anytime from your account settings. This will permanently delete your account, all your tasks, and all your data. This action cannot be undone.
              </p>
            </div>
          </div>
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
