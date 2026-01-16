"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Mail, HelpCircle, Send } from "lucide-react";

// Note: Metadata export removed because this component uses "use client"
// The metadata from root layout will be used for this page instead
import { Navigation } from "@/components/Navigation";
import { useApi } from "@/lib/useApi";
import { Project } from "@/lib/types";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: "1",
    question: "Is there a mobile app?",
    answer:
      "Yes! TaskQuadrant is available on iOS. You can download it free from the App Store at https://apps.apple.com/app/id6756943665. The mobile app syncs with your web account, works offline, and includes push notifications for due tasks. Android version coming soon!",
  },
  {
    id: "2",
    question: "What is the Eisenhower Matrix?",
    answer:
      "The Eisenhower Matrix is a time management framework that helps you prioritize tasks based on two dimensions: urgency and importance. Tasks are divided into four quadrants: Urgent & Important (do first), Important but Not Urgent (schedule), Urgent but Not Important (delegate), and Neither Urgent nor Important (eliminate).",
  },
  {
    id: "3",
    question: "How do I create a new task?",
    answer:
      "Go to your dashboard, click 'Add Task' button, enter the task title, select a project, and optionally set urgency and importance levels. The task will automatically be placed in the appropriate quadrant based on these settings.",
  },
  {
    id: "4",
    question: "Can I organize tasks by project?",
    answer:
      "Yes! You can create multiple projects and assign tasks to them. This helps you organize work by client, department, or any other category that makes sense for your workflow.",
  },
  {
    id: "5",
    question: "What are recurring tasks?",
    answer:
      "Recurring tasks are tasks that repeat on a schedule (daily, weekly, monthly, etc.). Available in Pro plan, they automatically recreate themselves so you never miss repetitive work like meetings, reports, or check-ins.",
  },
  {
    id: "6",
    question: "How do I export my tasks?",
    answer:
      "In the Pro plan and above, you can export your task dashboard as PNG or PDF. This is perfect for sharing progress reports with managers, clients, or team members. PNG is great for Slack/Teams, PDF for professional reports.",
  },
  {
    id: "7",
    question: "How do I upgrade my plan?",
    answer:
      "Go to Settings > Subscription and click 'Upgrade to Pro' or 'Upgrade to Enterprise'. You can pay monthly with Stripe or PayPal. Your upgrade takes effect immediately.",
  },
  {
    id: "8",
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes! You can cancel your subscription anytime from Settings > Subscription. You'll retain access until the end of your billing period.",
  },
  {
    id: "9",
    question: "How secure is my data?",
    answer:
      "We use industry-standard encryption and secure database practices to protect your data. All data is encrypted in transit and at rest. We never share your data with third parties.",
  },
  {
    id: "10",
    question: "Can I have multiple projects?",
    answer:
      "Yes! Free plan includes 10 projects, Pro plan includes 30 projects, and Enterprise has unlimited projects. You can organize all your work across different projects.",
  },
  {
    id: "11",
    question: "What happens if I reach my task limit?",
    answer:
      "Each plan has a task limit (Free: 50, Pro: 200, Enterprise: unlimited). When you reach your limit, you'll need to complete/delete tasks before adding new ones, or upgrade to a higher plan.",
  },
];

export default function HelpPage() {
  const router = useRouter();
  const api = useApi();
  const [expandedFAQId, setExpandedFAQId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState<string>("User");
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    // Load user data from localStorage (browser-side only)
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem("userEmail") || "";
      setUserName(email);
      setUserEmail(email);
      setIsAdmin(localStorage.getItem("isAdmin") === "true");
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load projects for navigation
      try {
        const projectsResponse = await api.getProjects();
        if (projectsResponse.success && projectsResponse.data) {
          setProjects(projectsResponse.data);
        }
      } catch {
        // Projects not available
      }

    } catch (err) {
      console.error("Failed to load data:", err);
    }
  };

  const toggleFAQ = (id: string) => {
    setExpandedFAQId(expandedFAQId === id ? null : id);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogout = () => {
    api.logout();
    router.push("/");
  };

  const handleViewChange = (view: string) => {
    if (view === "dashboard") {
      router.push("/dashboard");
    } else if (view === "projects") {
      router.push("/dashboard?view=projects");
    } else if (view === "all-tasks") {
      router.push("/dashboard?view=all-tasks");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitMessage(
          "Thank you for your message! We'll get back to you soon."
        );
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
        });
      } else {
        setSubmitMessage(
          "There was an error sending your message. Please try again or email us directly at support@taskquadrant.io"
        );
      }
    } catch (error) {
      setSubmitMessage(
        "There was an error sending your message. Please try again or email us directly at support@taskquadrant.io"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        projects={projects}
        activeView="help"
        onViewChange={handleViewChange}
        onProjectSelect={() => {}}
        pendingTaskCount={0}
        userName={userName}
        userEmail={userEmail}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        onSettingsClick={() => setShowUserSettings(true)}
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            How Can We Help?
          </h1>
          <p className="text-xl text-gray-600">
            Find answers to common questions or reach out to our support team
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Quick Links */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl p-6 border border-gray-200 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Quick Links
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#faq"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    ↓ Frequently Asked Questions
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    ↓ Contact Us
                  </a>
                </li>
                <li>
                  <a
                    href="https://apps.apple.com/app/id6756943665"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                  >
                    📱 iOS App
                  </a>
                </li>
                <li>
                  <a
                    href="/"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                    Pricing
                  </a>
                </li>
              </ul>

              {/* Contact Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-bold text-gray-900 mb-3">
                  Direct Contact
                </h4>
                <a
                  href="mailto:support@taskquadrant.io"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <Mail className="w-4 h-4" />
                  <span>support@taskquadrant.io</span>
                </a>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div id="faq" className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-6">
              <HelpCircle className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Frequently Asked Questions
              </h2>
            </div>

            {faqItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg border border-gray-200">
                <button
                  onClick={() => toggleFAQ(item.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <h3 className="text-left font-semibold text-gray-900">
                    {item.question}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 flex-shrink-0 transition-transform ${
                      expandedFAQId === item.id ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {expandedFAQId === item.id && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form Section */}
        <div id="contact" className="bg-white rounded-xl border border-gray-200 p-8 md:p-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Didn't Find Your Answer?
            </h2>
            <p className="text-gray-600 mb-8">
              Let us know what you need help with, and our team will get back to you as soon as possible.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Your name"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="your@email.com"
                />
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-900 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="How can we help?"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-900 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                  placeholder="Tell us what you need help with..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>

              {/* Message Feedback */}
              {submitMessage && (
                <div
                  className={`p-4 rounded-lg text-sm ${
                    submitMessage.includes("Thank you")
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {submitMessage}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-16 p-8 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-blue-900">
            <strong>Response Time:</strong> We typically respond to support requests within 24 hours during business days.
          </p>
        </div>
      </div>
    </div>
  );
}
