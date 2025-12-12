import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { JsonLd, createWebPageSchema, createFAQSchema } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Help & FAQ - TaskQuadrant Support Center',
  description: 'Find answers to common questions about TaskQuadrant. Learn about the Eisenhower Matrix, task management, projects, subscriptions, and more.',
  keywords: 'help, FAQ, support, questions, tutorial, how to, task management help',
  openGraph: {
    title: 'TaskQuadrant Help & FAQ',
    description: 'Find answers to common questions about TaskQuadrant task management.',
    type: 'website',
    url: 'https://taskquadrant.io/help',
  },
  twitter: {
    card: 'summary',
    title: 'TaskQuadrant Help & FAQ',
    description: 'Find answers to common questions about TaskQuadrant task management.',
  },
};

const webPageSchema = createWebPageSchema({
  url: 'https://taskquadrant.io/help',
  name: 'TaskQuadrant Help & FAQ',
  description: 'Find answers to common questions about TaskQuadrant. Learn about the Eisenhower Matrix, task management, projects, subscriptions, and more.',
});

const faqSchema = createFAQSchema([
  {
    question: 'What is the Eisenhower Matrix?',
    answer: 'The Eisenhower Matrix is a time management framework that helps you prioritize tasks based on two dimensions: urgency and importance. Tasks are divided into four quadrants: Urgent & Important (do first), Important but Not Urgent (schedule), Urgent but Not Important (delegate), and Neither Urgent nor Important (eliminate).',
  },
  {
    question: 'How do I create a new task?',
    answer: "Go to your dashboard, click 'Add Task' button, enter the task title, select a project, and optionally set urgency and importance levels. The task will automatically be placed in the appropriate quadrant based on these settings.",
  },
  {
    question: 'Can I organize tasks by project?',
    answer: 'Yes! You can create multiple projects and assign tasks to them. This helps you organize work by client, department, or any other category that makes sense for your workflow.',
  },
  {
    question: 'What are recurring tasks?',
    answer: 'Recurring tasks are tasks that repeat on a schedule (daily, weekly, monthly, etc.). Available in Pro plan, they automatically recreate themselves so you never miss repetitive work like meetings, reports, or check-ins.',
  },
  {
    question: 'How do I export my tasks?',
    answer: 'In the Pro plan and above, you can export your task dashboard as PNG or PDF. This is perfect for sharing progress reports with managers, clients, or team members.',
  },
  {
    question: 'How do I upgrade my plan?',
    answer: "Go to Settings > Subscription and click 'Upgrade to Pro' or 'Upgrade to Enterprise'. You can pay monthly with Stripe or PayPal. Your upgrade takes effect immediately.",
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: "Yes! You can cancel your subscription anytime from Settings > Subscription. You'll retain access until the end of your billing period.",
  },
  {
    question: 'How secure is my data?',
    answer: 'We use industry-standard encryption and secure database practices to protect your data. All data is encrypted in transit and at rest. We never share your data with third parties.',
  },
  {
    question: 'Can I have multiple projects?',
    answer: 'Yes! Free plan includes 10 projects, Pro plan includes 30 projects, and Enterprise has unlimited projects. You can organize all your work across different projects.',
  },
  {
    question: 'What happens if I reach my task limit?',
    answer: "Each plan has a task limit (Free: 50, Pro: 200, Enterprise: unlimited). When you reach your limit, you'll need to complete/delete tasks before adding new ones, or upgrade to a higher plan.",
  },
]);

interface HelpLayoutProps {
  children: ReactNode;
}

export default function HelpLayout({ children }: HelpLayoutProps): ReactNode {
  return (
    <>
      <JsonLd data={webPageSchema} />
      <JsonLd data={faqSchema} />
      {children}
    </>
  );
}
