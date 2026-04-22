import Link from "next/link";
import { Metadata } from "next";
import { CheckCircle } from "lucide-react";
import { JsonLd, createWebPageSchema, createFAQSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Pricing - TaskQuadrant | Free, Pro & Enterprise Plans",
  description:
    "Simple, transparent pricing for TaskQuadrant. Start free with the Eisenhower Matrix, upgrade to Pro for $4.99/mo or Enterprise for $9.99/mo. No hidden fees.",
  keywords:
    "taskquadrant pricing, task management app cost, eisenhower matrix pricing, pro plan, enterprise plan, free task management",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "TaskQuadrant Pricing - Free, Pro & Enterprise",
    description:
      "Pick the TaskQuadrant plan that fits your workflow. Start free, upgrade to Pro for $4.99/mo, or go Enterprise at $9.99/mo.",
    type: "website",
    url: "https://taskquadrant.io/pricing",
    siteName: "TaskQuadrant",
  },
  twitter: {
    card: "summary_large_image",
    title: "TaskQuadrant Pricing - Free, Pro & Enterprise",
    description: "Start free, upgrade to Pro at $4.99/mo or Enterprise at $9.99/mo. Simple, transparent pricing.",
  },
};

const webPageSchema = createWebPageSchema({
  url: "https://taskquadrant.io/pricing",
  name: "TaskQuadrant Pricing - Free, Pro & Enterprise Plans",
  description:
    "Simple, transparent pricing for TaskQuadrant. Start free with the Eisenhower Matrix, upgrade to Pro for $4.99/mo or Enterprise for $9.99/mo.",
});

const faqSchema = createFAQSchema([
  {
    question: "Is TaskQuadrant free to use?",
    answer:
      "Yes. The Free plan includes the full Eisenhower Matrix view, up to 3 projects, and 10 tasks — enough to see whether the framework works for you before committing to a paid plan.",
  },
  {
    question: "What's the difference between Pro and Enterprise?",
    answer:
      "Pro ($4.99/mo) is designed for individual professionals: unlimited projects and tasks, recurring tasks, sub-projects, mind maps, and PNG/PDF exports. Enterprise ($9.99/mo) adds team collaboration features and priority support, aimed at small teams who need to share workload across members.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. There is no contract. You can cancel from Settings → Subscription at any time, and you keep access until the end of your current billing period. We do not auto-convert cancelled subscriptions to different plans.",
  },
  {
    question: "How do I pay?",
    answer:
      "We accept credit and debit cards via Stripe, plus PayPal. Both charge monthly. You can switch between Stripe and PayPal at any time by cancelling and re-subscribing.",
  },
  {
    question: "Do you offer annual pricing?",
    answer:
      "Not yet — pricing is currently monthly only. If annual billing would materially change your decision, let us know on the contact page and we'll factor it into the roadmap.",
  },
  {
    question: "Is there a refund policy?",
    answer:
      "We offer a 14-day refund window for first-time paid subscribers. If TaskQuadrant isn't a fit within your first two weeks, email support and we'll issue a full refund.",
  },
  {
    question: "Do you offer a team or volume discount?",
    answer:
      "Enterprise plan includes multi-member team collaboration at a flat $9.99/mo per account. For larger organisations that need centralised billing across many seats, contact us directly — we're happy to quote based on seat count.",
  },
]);

const plans = [
  {
    name: "Free",
    tagline: "Perfect for getting started",
    price: "$0",
    cadence: "/month",
    highlight: false,
    features: [
      "Eisenhower Matrix view",
      "3 projects",
      "10 tasks",
      "Web + mobile access",
    ],
    ctaLabel: "Start Free",
    ctaHref: "/auth?mode=signup",
  },
  {
    name: "Pro",
    tagline: "For busy professionals",
    price: "$4.99",
    cadence: "/month",
    highlight: true,
    features: [
      "Unlimited projects & tasks",
      "Recurring tasks (up to 10)",
      "Sub-projects (1 level)",
      "Mind maps (5 maps, 50 nodes)",
      "PNG / PDF exports",
    ],
    ctaLabel: "Upgrade to Pro",
    ctaHref: "/upgrade",
  },
  {
    name: "Enterprise",
    tagline: "For growing teams",
    price: "$9.99",
    cadence: "/month",
    highlight: false,
    features: [
      "Unlimited everything",
      "Team collaboration",
      "Shared projects & tasks",
      "Priority support",
    ],
    ctaLabel: "Upgrade to Enterprise",
    ctaHref: "/upgrade",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={webPageSchema} />
      <JsonLd data={faqSchema} />

      {/* Hero */}
      <section className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Start free. Upgrade when you need more. Cancel anytime.
          </p>
          <p className="text-sm text-gray-500">
            All plans include the full Eisenhower Matrix workflow — the only difference is how much capacity you need.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`${plan.highlight ? "bg-blue-600 text-white border-2 border-blue-600" : "bg-white text-gray-900 border border-gray-100"} p-8 rounded-xl relative`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}
              <h2 className={`text-2xl font-bold mb-2 ${plan.highlight ? "text-white" : "text-gray-900"}`}>{plan.name}</h2>
              <p className={`mb-6 ${plan.highlight ? "text-blue-100" : "text-gray-600"}`}>{plan.tagline}</p>
              <div className={`text-3xl font-bold mb-6 ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                {plan.price}
                <span className={`text-lg ${plan.highlight ? "text-blue-100" : "text-gray-500"}`}>{plan.cadence}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-3">
                    <CheckCircle className={`w-5 h-5 ${plan.highlight ? "text-blue-200" : "text-green-500"}`} />
                    <span className={plan.highlight ? "text-white" : "text-gray-700"}>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.ctaHref}
                className={`block text-center w-full py-3 rounded-lg font-medium transition ${
                  plan.highlight
                    ? "bg-white text-blue-600 hover:bg-gray-100"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {plan.ctaLabel}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison / what's included */}
      <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What&apos;s included in every plan</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-700">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <strong>Full Eisenhower Matrix view</strong> — the urgent/important four-quadrant prioritisation framework. Free users get the same core UI as Pro and Enterprise; the upgrade is about capacity and collaboration, not the core workflow.
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <strong>Web and mobile access</strong> — sign in on any device with the same account. Task state syncs automatically.
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <strong>Secure data storage</strong> — HTTPS encryption in transit, encrypted at rest. See the <Link href="/security" className="text-blue-600 underline">security page</Link>.
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <strong>14-day refund window</strong> on first paid subscription. Not what you expected? Email support, get a full refund.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Pricing FAQ</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is TaskQuadrant free to use?</h3>
              <p className="text-gray-700">
                Yes. The Free plan includes the full Eisenhower Matrix view, up to 3 projects, and 10 tasks — enough to see whether the framework works for you before committing to a paid plan.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What&apos;s the difference between Pro and Enterprise?</h3>
              <p className="text-gray-700">
                Pro ($4.99/mo) is designed for individual professionals: unlimited projects and tasks, recurring tasks, sub-projects, mind maps, and PNG/PDF exports. Enterprise ($9.99/mo) adds team collaboration features and priority support, aimed at small teams who need to share workload across members.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-700">
                Yes. There is no contract. You can cancel from Settings → Subscription at any time, and you keep access until the end of your current billing period.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I pay?</h3>
              <p className="text-gray-700">
                We accept credit and debit cards via Stripe, plus PayPal. Both charge monthly. You can switch between Stripe and PayPal by cancelling and re-subscribing.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Do you offer annual pricing?</h3>
              <p className="text-gray-700">
                Not yet — pricing is currently monthly only. If annual billing would materially change your decision, let us know on the <Link href="/contact" className="text-blue-600 underline">contact page</Link>.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is there a refund policy?</h3>
              <p className="text-gray-700">
                We offer a 14-day refund window for first-time paid subscribers. If TaskQuadrant isn&apos;t a fit within your first two weeks, email support and we&apos;ll issue a full refund.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Do you offer a team or volume discount?</h3>
              <p className="text-gray-700">
                Enterprise plan includes multi-member team collaboration at a flat $9.99/mo per account. For larger organisations that need centralised billing across many seats, <Link href="/contact" className="text-blue-600 underline">contact us directly</Link> — we&apos;re happy to quote based on seat count.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center bg-blue-50 rounded-2xl p-12 border border-blue-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to master your priorities?</h2>
          <p className="text-gray-700 mb-6">
            Start on the Free plan. No credit card needed. Upgrade whenever your workload grows.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth?mode=signup"
              className="inline-block bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Start Free
            </Link>
            <Link
              href="/features"
              className="inline-block border border-gray-300 text-gray-700 font-semibold px-8 py-3 rounded-lg hover:bg-gray-50 transition"
            >
              See all features
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
