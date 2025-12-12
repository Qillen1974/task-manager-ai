import Link from "next/link";
import { Metadata } from "next";
import { JsonLd, createWebPageSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Privacy Policy - TaskQuadrant",
  description: "Read TaskQuadrant's privacy policy to understand how we collect, use, and protect your personal data and task information.",
};

const webPageSchema = createWebPageSchema({
  url: 'https://taskquadrant.io/privacy',
  name: 'Privacy Policy - TaskQuadrant',
  description: "Read TaskQuadrant's privacy policy to understand how we collect, use, and protect your personal data and task information.",
});

export default function PrivacyPage() {
  return (
    <>
      <JsonLd data={webPageSchema} />
      <PrivacyPageContent />
    </>
  );
}

function PrivacyPageContent() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p>
                TaskQuadrant ("we", "our", or "us") operates the TaskQuadrant website and application. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              <p className="mb-3">We collect information you provide directly to us:</p>
              <ul className="space-y-2 pl-6 list-disc">
                <li><strong>Account Information:</strong> Name, email address, and password when you create an account</li>
                <li><strong>User Content:</strong> Tasks, projects, and other data you create and store in TaskQuadrant</li>
                <li><strong>Communication:</strong> Messages you send us for support or feedback</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="mb-3">We use your information to:</p>
              <ul className="space-y-2 pl-6 list-disc">
                <li>Provide and maintain the TaskQuadrant service</li>
                <li>Process your account and enable features you use</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your inquiries and customer service requests</li>
                <li>Monitor and improve our service</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Sharing</h2>
              <p>
                We do not sell, trade, or rent your personal information to third parties. We do not share your task data, projects, or personal information with anyone except as required by law. Your data belongs to you.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
              <p className="mb-3">
                We implement appropriate technical and organizational measures to protect your data:
              </p>
              <ul className="space-y-2 pl-6 list-disc">
                <li>HTTPS/TLS encryption for all data in transit</li>
                <li>Passwords are hashed and salted before storage</li>
                <li>Secure hosting on Railway (AWS infrastructure)</li>
                <li>Regular security monitoring and automatic backups</li>
              </ul>
              <p className="text-sm text-gray-600 mt-4">
                However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
              <p className="mb-3">You have the right to:</p>
              <ul className="space-y-2 pl-6 list-disc">
                <li>Access your personal data and request a copy</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data (account deletion)</li>
                <li>Export your tasks and projects</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies</h2>
              <p>
                We use cookies and similar technologies to authenticate your session and improve your experience. You can control cookie settings in your browser. Disabling cookies may affect your ability to use certain features.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Third-Party Services</h2>
              <p className="mb-3">
                We may use third-party services to assist with our operations:
              </p>
              <ul className="space-y-2 pl-6 list-disc">
                <li><strong>Railway:</strong> Cloud hosting provider (privacy policy: railway.app/legal/privacy)</li>
                <li><strong>Email Service:</strong> For sending transactional emails (welcome emails, password resets, etc.)</li>
              </ul>
              <p className="text-sm text-gray-600 mt-3">
                These providers process data on our behalf and are contractually bound to protect your privacy.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p>
                TaskQuadrant is not intended for children under 13 years of age. We do not knowingly collect information from children under 13. If we become aware of such collection, we will delete such information promptly.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page. Your continued use of TaskQuadrant after changes become effective constitutes your acceptance of the updated policy.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or our privacy practices, please contact us at:
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
