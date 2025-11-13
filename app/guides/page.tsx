'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

interface GuideCard {
  id: string;
  title: string;
  description: string;
  readTime: string;
  category: string;
  slug: string;
  icon: string;
}

const guides: GuideCard[] = [
  {
    id: 'task-management-guide',
    title: 'The Ultimate Guide to Task Management',
    description:
      'Comprehensive guide covering task management strategies, the Eisenhower Matrix framework, prioritization techniques, and actionable best practices for individuals and teams.',
    readTime: '25-30 min',
    category: 'Productivity',
    slug: 'task-management-guide',
    icon: '📋',
  },
];

export default function GuidesPage(): ReactNode {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Guides & Resources</h1>
          <p className="text-xl text-blue-100 mb-4">
            In-depth analysis, strategies, and best practices for productivity and task management
          </p>
          <div className="flex items-center gap-4 text-sm text-blue-100">
            <span>📚 Comprehensive resources</span>
            <span>•</span>
            <span>💡 Actionable tips</span>
            <span>•</span>
            <span>📊 Data-driven insights</span>
            <span>•</span>
            <span>✨ Free & high-quality</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              href={`/guides/${guide.slug}`}
              className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-400"
            >
              <div className="p-8">
                {/* Icon and Category */}
                <div className="flex items-start justify-between mb-4">
                  <span className="text-4xl">{guide.icon}</span>
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                    {guide.category}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {guide.title}
                </h2>

                {/* Description */}
                <p className="text-gray-600 mb-6 line-clamp-3">{guide.description}</p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-500">⏱️ {guide.readTime} read</span>
                  <span className="text-blue-600 font-semibold group-hover:translate-x-1 transition-transform">
                    Read Guide →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* About Section */}
        <div className="bg-blue-50 rounded-lg p-8 border border-blue-200 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About Our Guides</h2>
          <p className="text-gray-700 mb-4">
            Our comprehensive guides are designed to provide you with in-depth knowledge, actionable strategies, and best practices based on real-world experience and data-driven insights.
          </p>
          <p className="text-gray-700 mb-4">
            Each guide is meticulously researched and written to help you master productivity, task management, and team collaboration. Whether you're an individual contributor, team leader, or executive, you'll find valuable insights applicable to your situation.
          </p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">✓</span>
              <span>
                <strong>In-depth Analysis:</strong> Comprehensive coverage of core concepts and frameworks
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">✓</span>
              <span>
                <strong>Actionable Tips:</strong> Practical advice you can implement immediately
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">✓</span>
              <span>
                <strong>Data-Driven Insights:</strong> Research and statistics backing recommendations
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">✓</span>
              <span>
                <strong>Free Resources:</strong> No paywalls, all content is freely accessible
              </span>
            </li>
          </ul>
        </div>

        {/* Featured Feature */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-8 border border-purple-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Take Your Productivity Further</h2>
          <p className="text-gray-700 mb-6">
            Learn best practices from our guides, then implement them using TaskQuadrant's powerful task management features. Combine knowledge with tools to maximize your productivity.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <h3 className="font-bold text-gray-900">Eisenhower Matrix</h3>
                <p className="text-sm text-gray-600">Visualize and prioritize tasks by urgency and importance</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="font-bold text-gray-900">AI Butler</h3>
                <p className="text-sm text-gray-600">Get AI-powered assistance with task planning and strategy</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">📈</span>
              <div>
                <h3 className="font-bold text-gray-900">Gantt Charts</h3>
                <p className="text-sm text-gray-600">Visualize timelines and manage project dependencies</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">👥</span>
              <div>
                <h3 className="font-bold text-gray-900">Team Collaboration</h3>
                <p className="text-sm text-gray-600">Work together with clear assignments and accountability</p>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started with TaskQuadrant →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
