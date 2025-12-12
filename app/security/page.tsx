import Link from "next/link";
import { Metadata } from "next";
import { Lock, Shield, Server, Eye } from "lucide-react";
import { JsonLd, createWebPageSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Security - TaskQuadrant Data Protection & Privacy",
  description: "TaskQuadrant uses HTTPS encryption, secure password handling, and AWS infrastructure to protect your data. Learn about our security measures.",
};

const webPageSchema = createWebPageSchema({
  url: 'https://taskquadrant.io/security',
  name: 'Security - TaskQuadrant Data Protection & Privacy',
  description: 'TaskQuadrant uses HTTPS encryption, secure password handling, and AWS infrastructure to protect your data. Learn about our security measures.',
});

export default function SecurityPage() {
  return (
    <>
      <JsonLd data={webPageSchema} />
      <SecurityPageContent />
    </>
  );
}

function SecurityPageContent() {
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
            Security You Can Trust
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            We take the security and privacy of your data seriously. Here's how we protect your information.
          </p>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16">
            Our Security Measures
          </h2>

          <div className="space-y-12">
            {/* Data Encryption */}
            <div className="bg-white p-8 rounded-xl border border-gray-100 flex gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-blue-100">
                  <Lock className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">HTTPS Encryption</h3>
                <p className="text-gray-600">
                  All data transmitted between your device and our servers is encrypted using HTTPS/TLS (Transport Layer Security). This prevents eavesdropping and ensures that your data cannot be intercepted during transmission.
                </p>
              </div>
            </div>

            {/* Password Security */}
            <div className="bg-white p-8 rounded-xl border border-gray-100 flex gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-green-100">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Secure Password Handling</h3>
                <p className="text-gray-600 mb-4">
                  Your passwords are hashed using industry-standard algorithms before being stored. We never store passwords in plain text. This means even if our database were compromised, your passwords would remain protected.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Passwords are hashed, not encrypted</li>
                  <li>• Using bcrypt with appropriate salt rounds</li>
                  <li>• Password strength validation on signup</li>
                </ul>
              </div>
            </div>

            {/* Hosted on Railway */}
            <div className="bg-white p-8 rounded-xl border border-gray-100 flex gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-purple-100">
                  <Server className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Reliable Hosting Infrastructure</h3>
                <p className="text-gray-600 mb-4">
                  TaskQuadrant is hosted on Railway, a modern cloud platform built on top of AWS infrastructure. This ensures:
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• High availability and automatic backups</li>
                  <li>• Isolated container environments</li>
                  <li>• Regular security patches and updates</li>
                  <li>• DDoS protection at the network level</li>
                  <li>• Geographic redundancy</li>
                </ul>
              </div>
            </div>

            {/* Data Privacy */}
            <div className="bg-white p-8 rounded-xl border border-gray-100 flex gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-yellow-100">
                  <Eye className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Data Privacy & Access</h3>
                <p className="text-gray-600 mb-4">
                  Your data is private and belongs to you. We don't:
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Share your data with third parties for marketing purposes</li>
                  <li>• Use your tasks or personal information for training AI models</li>
                  <li>• Sell your data to other companies</li>
                  <li>• Access your data without your permission</li>
                </ul>
                <p className="text-gray-600 mt-4">
                  Your tasks, projects, and personal information are encrypted at rest and only accessible with your account credentials.
                </p>
              </div>
            </div>

            {/* Regular Updates */}
            <div className="bg-white p-8 rounded-xl border border-gray-100 flex gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-red-100">
                  <Shield className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Continuous Security Updates</h3>
                <p className="text-gray-600">
                  We regularly update our dependencies and address security vulnerabilities as soon as they're discovered. Our deployment infrastructure allows us to push security patches quickly when needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Important Note */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Responsible Disclosure</h3>
            <p className="text-gray-700 mb-4">
              If you discover a security vulnerability in TaskQuadrant, please report it responsibly to us instead of publicly disclosing it. Contact us at TaskQuadrantAlert@gmail.com with details of the vulnerability.
            </p>
            <p className="text-sm text-gray-600">
              We take all security reports seriously and will work to address legitimate issues promptly.
            </p>
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
