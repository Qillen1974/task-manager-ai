"use client";

import Link from "next/link";

export default function TermsPage() {
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

      {/* Content */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using TaskQuadrant, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. License</h2>
              <p>
                TaskQuadrant grants you a limited, non-exclusive, non-transferable license to use this service for personal, non-commercial use, subject to the restrictions in these Terms of Service. You may not reproduce, distribute, transmit, or monetize any content from TaskQuadrant without permission.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="mb-3">
                When you create an account, you are responsible for maintaining the confidentiality of your password and account information. You agree to accept responsibility for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.
              </p>
              <p>
                You agree not to create accounts under false pretenses or use accounts in a manner that violates these Terms of Service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Content</h2>
              <p className="mb-3">
                You retain all rights to your content (tasks, projects, and personal data) that you create or upload to TaskQuadrant. By using TaskQuadrant, you grant us a limited license to:
              </p>
              <ul className="space-y-2 pl-6 list-disc mb-3">
                <li>Store and display your content as part of the service</li>
                <li>Use aggregated, anonymized data to improve our service</li>
              </ul>
              <p>
                We do not sell or share your content with third parties without your consent.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Prohibited Activities</h2>
              <p className="mb-3">You agree not to:</p>
              <ul className="space-y-2 pl-6 list-disc">
                <li>Use TaskQuadrant for any illegal or unauthorized purpose</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Attempt to gain unauthorized access to the service or systems</li>
                <li>Introduce viruses or malicious code</li>
                <li>Spam or send unsolicited messages through the service</li>
                <li>Use the service to create competing products or services</li>
                <li>Reverse engineer, decompile, or attempt to discover source code</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Subscription and Billing</h2>
              <p className="mb-3">
                Free Plan users can use TaskQuadrant with limited features. Pro and Enterprise plans require payment.
              </p>
              <ul className="space-y-2 pl-6 list-disc mb-3">
                <li>Billing occurs on the date you subscribe and on the same date each month thereafter</li>
                <li>You authorize us to charge your payment method for recurring payments</li>
                <li>You can cancel your subscription anytime in your account settings</li>
                <li>No refunds are provided for partial months</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Service Availability</h2>
              <p className="mb-3">
                TaskQuadrant is provided "as is" without warranties or guarantees. While we strive for 99% uptime, we do not guarantee uninterrupted service. TaskQuadrant may be unavailable for:
              </p>
              <ul className="space-y-2 pl-6 list-disc">
                <li>Scheduled maintenance</li>
                <li>Emergency maintenance</li>
                <li>Network or power outages</li>
                <li>Other unforeseen circumstances</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p>
                To the extent permitted by law, TaskQuadrant and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, data loss, or business interruption, even if advised of the possibility of such damages.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless TaskQuadrant from any claims, damages, losses, or expenses (including attorney's fees) arising from your use of the service or violation of these terms.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Account Termination</h2>
              <p className="mb-3">
                We reserve the right to terminate your account if you:
              </p>
              <ul className="space-y-2 pl-6 list-disc mb-3">
                <li>Violate these Terms of Service</li>
                <li>Engage in prohibited activities</li>
                <li>Have not logged in for more than 12 months</li>
              </ul>
              <p>
                Upon termination, your access to the service will be immediately revoked. You may request a copy of your data within 30 days of termination.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify you of significant changes via email. Your continued use of TaskQuadrant after changes become effective constitutes your acceptance of the new terms.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
              <p>
                If you have questions about these Terms of Service, please contact us at:
              </p>
              <p className="mt-4">
                📧 <a href="mailto:TaskQuadrantAlert@gmail.com" className="text-blue-600 hover:text-blue-700 font-semibold">TaskQuadrantAlert@gmail.com</a>
              </p>
            </div>

            <div className="border-t border-gray-200 pt-8">
              <p className="text-sm text-gray-600">
                Last updated: November 2024
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
